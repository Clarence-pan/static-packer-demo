var gulp = require('gulp');
var webpack = require('webpack-stream');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var cleanCss = require('gulp-clean-css');
var del = require('del');
var named = require('vinyl-named');
var _ = require('underscore');
var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var child_process = require('child_process');
var rename = require('gulp-rename');
var md5 = require('gulp-md5');

// load the process.env
require('dotenv').load();

// 静态资源的hash表
var hashMap = {};

// build src via webpack
gulp.task('build-src-webpack', function () {
    var config = require('./webpack.config.js');
    //var entries = [
    //    './src/**/index.js',
    //    './src/**/index.jsx',
    //    './src/**/index.ts',
    //    './src/**/index.tsx',
    //];
    //
    //delete config.entry;
    return gulp.src('', {base: './src'})
        //.pipe(named())
        .pipe(webpack(config))
        .pipe(gulp.dest('public/dist'))
        .pipe(gatherStaticsHashes(hashMap));
});

gulp.task('build-css-files', function(){
    return gulp
        .src('./src/**/index.css', {base: './src'})
        .pipe(cleanCss({compatibility: 'ie8'}))
        .pipe(rename(function(file){
            // remove duplicated "/index"
            // rename "product/detail/index.css" to "product/detail.css"
            file.dirname = path.dirname(file.dirname);
            file.basename = path.basename(file.dirname);
        }))
        .pipe(md5(20))
        .pipe(gulp.dest('./public/dist'))
        .pipe(gatherStaticsHashes(hashMap));
});

gulp.task('update-hashes', function(){
    updateStaticsHashes(hashMap);
});

gulp.task('build', function(done){
    return runSequence(['build-src-webpack', 'build-css-files'], 'update-hashes', done);
});

gulp.task('watch', function () {
    var config = require('./webpack.config.js');
    return gulp.src('./src')
        .pipe(webpack(_.extend(config, {watch: true})))
        .pipe(gulp.dest('public/dist/'));
});

gulp.task('clean', function () {
    return del([
        'public/dist/**/*'
    ]);
});

gulp.task('default', ['build']);

gulp.task('rebuild', function (done) {
    return runSequence('clean', 'default', done);
});

gulp.task('build-lib', function () {
    var config = require('./lib/webpack.config.js');
    return gulp.src('.')
        .pipe(webpack(config))
        .pipe(gulp.dest('public/lib/'));
});


function updateStaticsHashes(hashes) {
    console.log("Update hashes: ", hashes);
    var cmd = [process.env.PHP_PATH, 'artisan', 'update-statics-map', '-v'].join(' ');
    console.log('> ' + cmd);
    var output = child_process.execSync(cmd, {
        cwd: process.env.DYNAMIC_PATH,
        input: JSON.stringify(hashes),
        timeout: 30 * 1000, // ms
    });

    console.log("OUTPUT: " + output);
}

function gatherStaticsHashes(hashes) {
    if (!hashes) {
        console.error("Invalid parameter <hashes>! It must be a valid object");
    }

    return through.obj(function (file, encoding, callback) {
        if (file.isNull()) {
            // nothing to do
            return callback(null, file);
        }

        //console.log("updateHashesJob: called! File.path=", file.path);
        var relativePath = file.path.substring(file.base.length).replace(/^[\/|\\]+/, '');
        var m = relativePath.match(/_([a-zA-Z0-9]+)\./);
        if (!m){
            this.emit('error', new gutil.PluginError("gatherStaticsHashes: cannot resolve the hash from " + file.path));
            return callback(null, file);
        }

        var hash = m[1];
        var urlPath = relativePath.replace(m[0].substring(0, m[0].length - 1), '').replace(/\\/g, '/');

        switch (path.extname(file.path).toLowerCase()) {
            case '.js':
                hashes['js'] = addKeyValueToMap(hashes['js'], urlPath, hash);
                break;
            case '.css':
                hashes['css'] = addKeyValueToMap(hashes['css'], urlPath, hash);
                break;
            default:
                break;
        }

        return callback(null, file);
    });
}

function addKeyValueToMap(map, key, value) {
    if (!map) {
        map = {};
    }

    map[key] = value;

    return map;
}

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
