module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['index.js', 'Gruntfile.js', 'lib/**/*.js', 'spec/**/*.js']
    },
    uglify: {
      options: {
        banner: '/*! <= % pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        report: 'gzip'
      },
      schemaValidator: {
        src: 'lib/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    mochaTest: {
      test: {
        src: 'test/**/*.js',
        options: {
          reporter: 'spec'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('travis', ['jshint', 'mochaTest']);
  grunt.registerTask('default', ['jshint', 'uglify', 'mochaTest']);
};
