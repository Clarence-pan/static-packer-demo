// 加载process.env
require('dotenv').load();

var gulp = require('gulp');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var cleanCss = require('gulp-clean-css');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var del = require('del');
var named = require('vinyl-named');
var _ = require('lodash');
var path = require('path');
var md5 = require('gulp-md5');
var glob = require('glob');
var unique = require('array-unique');
var fs = require('fs');
var Promise = require('promise');

var webpackIndividuals = require('./plugins/webpack-individuals');
var staticsHashes = require('./plugins/statics-hashes');
var optimize = require('./plugins/dependency-optimize');
var replaceConsts = require('./plugins/replace-consts');
var SimpleFileCache = require('./plugins/simple-file-cache.js');


// 静态资源的hash表
var staticsMapTableCache = {};

// 文件缓存
var cache = SimpleFileCache.instance();

// 主要内容的目录
var SRC_DIR = './src';

// 构建完成的目录
var DIST_DIR = './public/dist';

var sourceScripts = [
    './src/**/index.js',
    './src/**/index.jsx',
    './src/**/index.ts',
    './src/**/index.tsx',
];

var sourceCssFiles = [
    './src/**/index.css'
];

var watchFiles = ['./src/**/*'];

// 通过webpack构建src目录下东东
gulp.task('build-src-webpack', function () {
    var config = require('./webpack.config.js');
    return gulp.src(sourceScripts, {base: SRC_DIR})
        .pipe(named(function (file) {
            file.baseDir = path.resolve(file.base);
            file.destPath = path.resolve(path.dirname(file.path) + path.extname(file.path));
            file.destName = path.relative(file.baseDir, file.destPath).replace(/\.\w+$/, '');
            return file.destName;
        }))
        .pipe(optimize({
            dest: function (file) {
                return glob(path.join(file.cwd, DIST_DIR, path.dirname(file.relativePath) + '*.js'), {sync: true});
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
        .pipe(replaceConsts({
            only: /\.js$/,
            extraConsts: function(){
                return {
                    __DEBUG_REACT__: JSON.stringify(process.env.DEBUG_REACT)
                };
            }
        }))
        .pipe(gulp.dest(DIST_DIR))
        .pipe(staticsHashes.gather({to: staticsMapTableCache}));
});

// css单独构建
gulp.task('build-css-files', function () {
    return gulp
        .src(sourceCssFiles, {base: SRC_DIR})
        .pipe(optimize({
            dest: function (file) {
                return glob(path.join(file.cwd, DIST_DIR, path.dirname(file.relativePath) + '*.css'), {sync: true});
            },
            depends: function (file) {
                return [file.path];
            }
        }))
        .pipe(cleanCss({compatibility: 'ie8'}))
        .pipe(rename(function (file) {
            // remove duplicated "/index"
            // rename "product/detail/index.css" to "product/detail.css"
            var fileDirName = file.dirname;
            file.dirname = path.dirname(fileDirName);
            file.basename = path.basename(fileDirName);
        }))
        .pipe(md5(20))
        .pipe(gulp.dest(DIST_DIR))
        .pipe(staticsHashes.gather({to: staticsMapTableCache}));
});

// 构建完成后更新hash
gulp.task('update-hashes', function (done) {
    staticsHashes.update(staticsMapTableCache, null, function (error) {
        done(error);
    });
});

// 保存hash关系的
gulp.task('save-manifest', function (done) {
    var manifestFile = path.resolve(DIST_DIR, 'manifest.json');
    var manifestData = {};

    fs.readFile(manifestFile, 'utf8', function (err, data) {
        if (err) {
            // 忽略不存在的文件
            if (err.code === 'ENOENT') {
                data = '{}';
            } else {
                return done(err);
            }
        }

        try {
            manifestData = JSON.parse(data) || {};
        } catch (e) {
            console.log("Warning: failed to parse old manifest data. Empty object assumed.");
        }

        for (var type in staticsMapTableCache) {
            if (!staticsMapTableCache.hasOwnProperty(type)) {
                continue;
            }

            var files = staticsMapTableCache[type];
            for (var file in files) {
                if (!files.hasOwnProperty(file)) {
                    continue;
                }

                (function (hash) {
                    manifestData[file] = file.replace(/\.\w+$/, function (whole) {
                        return '_' + hash + whole;
                    });
                })(files[file]);
            }
        }

        manifestData = JSON.stringify(manifestData, null, ' ');

        // 除了保存一份json的，顺便保存一份jsonp版本的，方便跨域查询
        Promise.all([
            new Promise(function (resolve, reject) {
                fs.writeFile(path.resolve(DIST_DIR, 'manifest.json'), manifestData, 'utf8', callbackToPromise(resolve, reject));
            }),
            new Promise(function (resolve, reject) {
                var manifestJsonpCode = 'window.manifestJsonpCallback && window.manifestJsonpCallback(' + manifestData + ');';
                fs.writeFile(path.resolve(DIST_DIR, 'manifest.js'), manifestJsonpCode, 'utf8', callbackToPromise(resolve, reject));
            })
        ]).then(done.bind(null, null), done);

        function callbackToPromise(resolve, reject) {
            return function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(data);
                }
            };
        }
    });

});

// 保存缓存的内容
gulp.task('save-caches', function (done) {
    cache.save(function (error) {
        done(error);
    });
});

// 构建任务
gulp.task('build', function (done) {
    return runSequence(
        ['build-src-webpack', 'build-css-files'],
        ['update-hashes', 'save-caches', 'save-manifest'],
        done);
});

// 监听文件改动的处理
gulp.task('watch', function () {
    var buildTimer = null;

    runSequence('build', function () {
        gutil.log('-----------------------------------------------');
        gutil.log('begin watching...');
        gulp.watch(watchFiles, function (event) {
            console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');

            // 清理缓存
            staticsMapTableCache = {};
            optimize.cleanCache({file: event.path});

            if (!buildTimer) {
                buildTimer = setTimeout(function () {
                    runSequence('build', function () {
                        buildTimer = null;
                        gutil.log('-----------------------------------------------');
                        gutil.log('still watching...');
                    });
                }, 200);
            }
        });
    });

    return new Promise(function () {
    });
});

// 清理构建后的文件
gulp.task('clean', function () {
    return del([
        'public/dist/**/*'
    ]);
});

// 默认启动的任务
gulp.task('default', function (done) {
    return runSequence('build', done);
});


// 重新构建
gulp.task('rebuild', function (done) {
    return runSequence('clean', 'default', done);
});

// 引入lib的构建配置
require('./gulpfile.lib.js');

// 全部构建
gulp.task('build-all', function(done){
    return runSequence(['build', 'build-lib'], done);
});

// 重新构建
gulp.task('rebuild-all', function (done) {
    return runSequence(['rebuild', 'rebuild-lib'], done);
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
