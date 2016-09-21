var gulp = require('gulp');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var named = require('vinyl-named');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var unique = require('array-unique');
var md5 = require('gulp-md5');

var webpackIndividuals = require('./plugins/gulp-webpack-individuals');
var optimize = require('./plugins/gulp-dependency-optimize');
var uglifyInplace = require('./plugins/gulp-uglify-inplace.js');
var rawInclude = require('./plugins/gulp-raw-include.js');
var staticsManifests = require('./plugins/gulp-statics-manifests');
var toBuffer = require('./plugins/gulp-stream-to-buffer');

var SimpleFileCache = require('./plugins/simple-file-cache.js');
var combine = require('./plugins/combine.js');

// 文件缓存
var cache = SimpleFileCache.instance();


var LIB_BASE = './lib';
var LIB_SRC = './lib/src';
var LIB_EXTERNAL = './lib/external';
var LIB_DEST= './public/lib';
var NODE_MODULES = './node_modules';

// lib目录下的构建
gulp.task('build-lib', function (done) {
    return runSequence([
        'lib-webpack-src',
        'lib-concat-shims',
        'lib-sync-externals',
        'lib-build-react',
        'lib-build-react-min'
    ], ['save-caches', 'save-manifest'], done);
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
                file.extname = path.extname(file.path);
                file.named = path.relative(file.base, file.path).replace(/\..+?$/, '');
                return [path.resolve(LIB_DEST, file.named + '_' + staticsManifests.get('lib/' + file.named + file.extname) + file.extname)];
            },
            depends: function (file) {
                return [file.path];
            }
        }))
        .pipe(toBuffer())
        .pipe(md5(20))
        .pipe(gulp.dest(LIB_DEST))
        .pipe(staticsManifests.gather({addPathPrefix: 'lib/'}));
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
                return [path.resolve(LIB_DEST, file.named + '_' + staticsManifests.get('lib/' + file.named + '.js') + '.js')];
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
        .pipe(gulp.dest(LIB_DEST))
        .pipe(staticsManifests.gather({addPathPrefix: 'lib/'}));
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
                var destExt = path.extname(destFile);
                return [path.resolve(LIB_DEST, path.basename(destFile, destExt) + staticsManifests.get('lib/' + destFile) + destExt)];
            },
            depends: function (file) {
                return concatFiles;
            }
        }))
        .pipe(concat(destFile))
        .pipe(minify({
            ext: {src: '-debug.js', min: '.js'},
            outSourceMap: true,
        }))
        .pipe(md5(20))
        .pipe(gulp.dest(LIB_DEST))
        .pipe(staticsManifests.gather({addPathPrefix: 'lib/'}));
});

// react很坑，单独搞个：
gulp.task('lib-build-react', function(){
    var sourceFiles = [
        NODE_MODULES + '/react/dist/react-with-addons.js',
        NODE_MODULES + '/react-dom/dist/react-dom.js',
        LIB_SRC + '/react/merge.js'
    ];

    var destFile = 'react.js';

    return gulp
        .src([LIB_SRC + '/react/merge.js'], {base: LIB_SRC})
        .pipe(optimize({
            dest: function (file) {
                var destExt = path.extname(destFile);
                return [path.resolve(LIB_DEST, path.basename(destFile, destExt) + staticsManifests.get('lib/' + destFile) + destExt)];
            },
            depends: function (file) {
                return sourceFiles;
            }
        }))
        .pipe(rawInclude({
            paths: combine(['react', 'react-dom'], sourceFiles)
        }))
        .pipe(rename(destFile))
        .pipe(md5(20))
        .pipe(gulp.dest(LIB_DEST))
        .pipe(staticsManifests.gather({addPathPrefix: 'lib/'}));
});

// 注意：react的压缩版本是要在生成环境下构建，这里则直接取他们打包好的即可
gulp.task('lib-build-react-min', function(){
    var sourceFiles = [
        NODE_MODULES + '/react/dist/react-with-addons.min.js',
        NODE_MODULES + '/react-dom/dist/react-dom.min.js',
        LIB_SRC + '/react/merge.js'
    ];

    var destFile = 'react.min.js';

    return gulp
        .src([LIB_SRC + '/react/merge.js'], {base: LIB_SRC})
        .pipe(optimize({
            dest: function (file) {
                var destExt = path.extname(destFile);
                return [path.resolve(LIB_DEST, path.basename(destFile, destExt) + staticsManifests.get('lib/' + destFile) + destExt)];
            },
            depends: function (file) {
                return sourceFiles;
            }
        }))
        .pipe(uglifyInplace())
        .pipe(rawInclude({
            paths: combine(['react', 'react-dom'], sourceFiles),
        }))
        .pipe(rename(destFile))
        .pipe(md5(20))
        .pipe(gulp.dest(LIB_DEST))
        .pipe(staticsManifests.gather({addPathPrefix: 'lib/'}));
});
