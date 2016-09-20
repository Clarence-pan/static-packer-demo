var gulp = require('gulp');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var webpackIndividuals = require('./plugins/webpack-individuals');
var named = require('vinyl-named');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var unique = require('array-unique');

var optimize = require('./plugins/dependency-optimize');
var SimpleFileCache = require('./plugins/simple-file-cache.js');

// 文件缓存
var cache = SimpleFileCache.instance();


var LIB_BASE = './lib';
var LIB_SRC = './lib/src';
var LIB_EXTERNAL = './lib/external';
var LIB_DEST= './public/lib';

// lib目录下的构建
gulp.task('build-lib', function (done) {
    return runSequence([
        'lib-webpack-src',
        'lib-concat-shims',
        'lib-sync-externals'
    ], ['save-caches'], done);
});

// 重新构建整个lib
gulp.task('rebuild-lib', function(done){
    return runSequence('clean-lib', 'build-lib', done);
});

// 清理lib目录
gulp.task('clean-lib', function(done){
    return del([
        LIB_DEST + '/**/*'
    ]);
});

// 同步外部文件
gulp.task('lib-sync-externals', function(){
    return gulp
        .src(LIB_EXTERNAL + '/**/*', {base: LIB_EXTERNAL})
        .pipe(optimize({
            dest: function (file) {
                return [path.resolve(LIB_DEST, path.relative(file.base, file.path))];
            },
            depends: function (file) {
                return [file.path];
            }
        }))
        .pipe(gulp.dest(LIB_DEST));
});

gulp.task('lib-webpack-src', function(){
    var srcFiles = [
        LIB_SRC + '/**/index.js',
        LIB_SRC + '/**/index.ts'
    ];
    var config = require('./lib/webpack.config.js');
    return gulp.src(srcFiles, {base: LIB_SRC})
        .pipe(named(function (file) {
            file.baseDir = path.resolve(file.base);
            file.destPath = path.resolve(path.dirname(file.path) + path.extname(file.path));
            file.destName = path.relative(file.baseDir, file.destPath).replace(/\.\w+$/, '');
            return file.destName;
        }))
        .pipe(optimize({
            dest: function (file) {
                return path.join(LIB_DEST, file.named + '.js');
            },
            depends: function (file) {
                var depends = cache.get("webpack_depends_of_" + file.path);
                return depends ? depends : [];
            }
        }))
        .pipe(webpackIndividuals(config, null, function (err, stats, file) {
            if (err || !stats || !file) {
                return;
            }

            cache.set("webpack_depends_of_" + file.path, unique([file.path].concat(stats.compilation.fileDependencies)));
        }))
        .pipe(gulp.dest(LIB_DEST));
});

// 合并shim文件等操作
gulp.task('lib-concat-shims', function () {
    var concatFiles = [
        LIB_EXTERNAL + '/polyfills/es5-shim.js',
        LIB_EXTERNAL + '/polyfills/es5-sham.js',
        LIB_EXTERNAL + '/polyfills/console-polyfill.js',
        LIB_EXTERNAL + '/polyfills/ext-sham.js'
    ];

    var destFile = 'shims-for-ie8.js';

    return gulp.src(concatFiles, {base: LIB_SRC})
        .pipe(optimize({
            dest: function (file) {
                return [path.resolve(LIB_DEST, destFile)];
            },
            depends: function (file) {
                return concatFiles;
            }
        }))
        .pipe(concat('shims-for-ie8.js'))
        .pipe(sourcemaps.init())
        .pipe(minify({
            ext: {src: '-debug.js', min: '.js'}
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(LIB_DEST));
});

