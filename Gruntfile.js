module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      files: ['index.js', 'Gruntfile.js', 'src/**/*.js', 'spec/**/*.js']
    },
    uglify: {
      options: {
        banner: '/*! <= % pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        report: 'gzip'
      },
      schemaValidator: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    jasmine: {
      schemaValidator: {
        src: 'src/**/*.js',
        options: {
          /* keepRunner: true, */
          specs: 'spec/*.js',
          vendor: ['node_modules/validator/validator.js']
        }
      }

    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.registerTask('travis', ['jshint', 'jasmine']);
  grunt.registerTask('default', ['jshint', 'uglify', 'jasmine']);
};
