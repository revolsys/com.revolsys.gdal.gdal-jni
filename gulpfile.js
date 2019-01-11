var gulp = require('gulp');
var download = require("gulp-download");
var decompress = require('gulp-decompress')
var unzip = require('gulp-unzip')
var run = require('gulp-run-command').default;
var rename = require('gulp-rename');
var gulpSequence = require('gulp-sequence')
var fs = require('fs-extra')
const replace = require('replace-in-file');

const version = '2.4.0';
const gdalDir = `gdal-${version}/`;
const gdalSrcUrl = `https://download.osgeo.org/gdal/${version}/gdal-${version}.tar.gz`;
const windowsDir = `release-1911-x64-gdal-2-4-mapserver-7-2-1`;
const gdalWindowsUrl = `http://download.gisinternals.com/sdk/downloads/${windowsDir}.zip`;

gulp.task('deleteSource', function(done) {
  fs.removeSync('gdal-src');
  done();
});

gulp.task('downloadSource', function() {
  return download(gdalSrcUrl)
    .pipe(decompress())
    .pipe(gulp.dest('.'));
});

gulp.task('renameSource', function(done) {
  fs.rename(gdalDir, 'gdal-src', function (err) {
    if (err) {
      throw err;
    }
    done();
  });
});


gulp.task('download', gulpSequence(
  'deleteSource',
  'downloadSource',
  'renameSource'
));

gulp.task('configure', run('../gdalConfigure', {
  cwd: 'gdal-src'
}));

gulp.task('patch', run([
  'patch -i ../gdal_java.i.patch swig/include/java/gdal_java.i',
  'patch -i ../build.xml.patch swig/java/build.xml'
], {
  cwd: 'gdal-src'
}));

gulp.task('make', run('make -j4', {
  cwd: 'gdal-src'
}));

gulp.task('swig', run('make -j4', {
  cwd: 'gdal-src/swig/java'
}));
gulp.task('swigLinux', run('make -j4 JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64 "JAVA_INCLUDE=-I$(JAVA_HOME)/include -I$(JAVA_HOME)/include/linux"', {
  cwd: 'gdal-src/swig/java'
}));
gulp.task('swigOSX', run('make -j4 JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.0.1.jdk/Contents/Home/ "JAVA_INCLUDE=-I$(JAVA_HOME)/include -I$(JAVA_HOME)/include/darwin"', {
  cwd: 'gdal-src/swig/java'
}));

gulp.task('copyJava', ()=> {
  fs.copySync('gdal-src/swig/java/org/', 'target/java/org/')
});

gulp.task('downloadWindows', function() {
  return download(gdalWindowsUrl)
    .pipe(unzip())
    .pipe(gulp.dest('gdal-win/'));
});

gulp.task('copyWindows', ()=> {
  fs.copySync('gdal-win/bin/gdal/java/gdalalljni.dll', 'target/gdalalljni.dll')
});