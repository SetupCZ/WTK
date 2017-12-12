var gulp = require('gulp');
var sass = require('gulp-sass');
var nodemon = require('gulp-nodemon');
// var cssmin = require('gulp-cssmin');
// var rename = require('gulp-rename');
// var minify = require('gulp-minify');
// var swPrecache = require('sw-precache');

gulp.task('sass', function () {
  gulp.src('public/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('public/css'));
});
gulp.task('sass-wtk', function () {
  gulp.src('public/js/wtk/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('public/js/wtk/css'));
});

gulp.task('start', function () {
  nodemon({
    script: 'server.js',
    ext: 'js scss ',
    ignore: ['sw.js', 'node_modules'],
    env: { 'NODE_ENV': 'development' },
    tasks: ['sass', 'sass-wtk']
  })
});

gulp.task('dev', ['start']);