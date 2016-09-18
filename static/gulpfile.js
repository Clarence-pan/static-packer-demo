var gulp = require('gulp');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var cleanCss = require('gulp-clean-css');
var del = require('del');
var named = require('vinyl-named');
var _ = require('lodash');
var gutil = require('gulp-util');
var path = require('path');
var rename = require('gulp-rename');
var md5 = require('gulp-md5');

var webpackIndividuals = require('./plugins/webpack-individuals');
var staticsHashes = require('./plugins/statics-hashes');

// 加载process.env
require('dotenv').load();

// 静态资源的hash表
var hashMap = {};

// 通过webpack构建src目录下东东
gulp.task('build-src-webpack', function () {
    var config = require('./webpack.config.js');
    var entries = [
        './src/**/index.js',
        './src/**/index.jsx',
        './src/**/index.ts',
        './src/**/index.tsx',
    ];

    return gulp.src(entries, {base: './src'})
        .pipe(named(function (file) {
            file.baseDir = path.resolve(file.base);
            file.destPath = path.resolve(path.dirname(file.path) + path.extname(file.path));
            file.destName = file.destPath.substring(file.baseDir.length).replace(/[\\\/]+/, '').replace(/\.\w+$/, '');
            return file.destName;
        }))
        .pipe(webpackIndividuals(config, null, afterPacked))
        .pipe(gulp.dest('public/dist'))
        .pipe(staticsHashes.gather({to: hashMap}));

    function afterPacked(err, stats) {
        gutil.log("[afterPacked]: After packed!");
        if (err) {
            gutil.log("[afterPacked]: Ignore due to errors.");
            return;
        }

        gutil.log("[afterPacked]: File dependencies: ", stats.compilation.fileDependencies);
    }
});

// css单独构建
gulp.task('build-css-files', function () {
    return gulp
        .src('./src/**/index.css', {base: './src'})
        .pipe(cleanCss({compatibility: 'ie8'}))
        .pipe(rename(function (file) {
            // remove duplicated "/index"
            // rename "product/detail/index.css" to "product/detail.css"
            file.dirname = path.dirname(file.dirname);
            file.basename = path.basename(file.dirname);
        }))
        .pipe(md5(20))
        .pipe(gulp.dest('./public/dist'))
        .pipe(staticsHashes.gather({to: hashMap}));
});

// 构建完成后更新hash
gulp.task('update-hashes', function () {
    staticsHashes.update(hashMap);
});

// 构建任务
gulp.task('build', function (done) {
    return runSequence(['build-src-webpack', 'build-css-files'], 'update-hashes', done);
});

// 监听文件改动的处理
gulp.task('watch', function () {
    // todo: ...
    console.log("Error: watch is not implemented yet.");
    process.exit(1);

    //var config = require('./webpack.config.js');
    //return gulp.src('./src')
    //    .pipe(webpack(_.extend(config, {watch: true})))
    //    .pipe(gulp.dest('public/dist/'));
});

// 清理构建后的文件
gulp.task('clean', function () {
    return del([
        'public/dist/**/*'
    ]);
});

// 默认启动的任务
gulp.task('default', ['build']);

// 重新构建
gulp.task('rebuild', function (done) {
    return runSequence('clean', 'default', done);
});

// lib目录下的构建
gulp.task('build-lib', function () {
    var config = require('./lib/webpack.config.js');
    return gulp.src('.')
        .pipe(webpack(config))
        .pipe(gulp.dest('public/lib/'));
});


function dd() {
    console.log.apply(console, arguments);
    process.exit(1);
}

function dir(obj, onlyOwned) {
    if (obj === null) {
        return '<null>';
    } else if (typeof obj === 'undefined') {
        return '<undefined>';
    }

    var keys = {};
    for (var k in obj) {
        if (!obj.hasOwnProperty(k) && onlyOwned) {
            continue;
        }

        var v = obj[k];
        if (typeof v === 'function') {
            keys[k] = '<function>';
        } else if (typeof v === 'object') {
            keys[k] = '<object>';
        } else {
            keys[k] = v;
        }
    }

    return keys;
}
