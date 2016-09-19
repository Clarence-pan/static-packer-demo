var gulp = require('gulp');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var webpackIndividuals = require('./plugins/webpack-individuals');
var named = require('vinyl-named');
var Promise = require('promise');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');

/// lib内容的src
var LIB_SRC = './lib/src';

// lib目录下的构建
gulp.task('build-lib', function (done) {
    return runSequence(['lib-webpack-src', 'lib-concat-shims']);
});

gulp.task('lib-webpack-src', function(){
    var config = require('./lib/webpack.config.js');
    return gulp.src(['./lib/src/**/index.js', './lib/src/**/index.ts'], {base: LIB_SRC})
        .pipe(named(function (file) {
            file.baseDir = path.resolve(file.base);
            file.destPath = path.resolve(path.dirname(file.path) + path.extname(file.path));
            file.destName = path.relative(file.baseDir, file.destPath).replace(/\.\w+$/, '');
            return file.destName;
        }))
        .pipe(webpackIndividuals(config))
        .pipe(gulp.dest('./public/lib'));
});

// 合并shim文件等操作
gulp.task('lib-concat-shims', function () {
    var concatFiles = [
        './lib/external/polyfills/es5-shim.js',
        './lib/external/polyfills/es5-sham.js',
        './lib/external/polyfills/console-polyfill.js',
        './lib/external/polyfills/ext-sham.js'
    ];
    return gulp.src(concatFiles, {base: LIB_SRC})
        .pipe(concat('shims-for-ie8.js'))
        .pipe(sourcemaps.init())
        .pipe(minify({
            ext: {src: '-debug.js', min: '.js'}
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/lib'));
});

