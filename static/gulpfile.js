var gulp = require('gulp');
var webpack = require('gulp-webpack');
var runSequence = require('run-sequence');
var minify = require('gulp-minify');
var cleanCss = require('gulp-clean-css');
var del = require('del');
var named = require('vinyl-named');
var _ = require('underscore');

gulp.task('build-src-webpack', function(){
    var config = require('./webpack.config.js');
    return gulp.src('.')
        .pipe(webpack(config, null, afterPacked))
        .pipe(gulp.dest('public/dist2/'));

    function afterPacked(err, stats){
        console.log("After packed: ", err, stats);
    }
});

gulp.task('build', ['build-src-webpack']);

gulp.task('watch', function(){
    var config = require('./webpack.config.js');
    return gulp.src('src/app.js')
        .pipe(webpack(_.extend(config, {watch: true})))
        .pipe(gulp.dest('public/dist/'));
});

gulp.task('clean', function(){
    return del([
        'public/dist/**/*'
    ]);
});

gulp.task('default', ['build']);

gulp.task('rebuild', function(done){
    return runSequence('clean', 'default', done);
});

gulp.task('build-lib', function(){
    var config = require('./lib/webpack.config.js');
    return gulp.src('.')
        .pipe(webpack(config))
        .pipe(gulp.dest('public/lib/'));
});
