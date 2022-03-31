const gulp = require('gulp');
const tslint = require('gulp-tslint');
const stylish = require('tslint-stylish');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');

let tsProject = ts.createProject('tsconfig.server.json');

gulp.task('compile', function () {
    let tsResult = gulp.src(['src/**/*.ts'])
        .pipe(tsProject())
        .on("error", (error) => {
            console.error(error);
        });
    // gulp.src(['src/**/*.json']).pipe(gulp.dest('./build'));
    // gulp.src(['src/**/*.zip']).pipe(gulp.dest('./build'));
    gulp.src(['src/**/*.ejs']).pipe(gulp.dest('./build'));
    // gulp.src(['src/**/*.xml']).pipe(gulp.dest('./build'));
    // gulp.src(['src/**/*.js']).pipe(gulp.dest('./build'));
    return tsResult.js.pipe(gulp.dest('./build'));
});

gulp.task('tslint', function () {
    return gulp.src(['./src/**/*.ts', './test/**/*.ts'])
        .pipe(tslint({
            configuration: 'tslint.json'
        }))
        .pipe(tslint.report(stylish, {
            emitError: true,
            sort: true,
            bell: true
        }));
});


gulp.task('clean', function () {
    return gulp.src('./build').pipe(clean({force: true}));
});
