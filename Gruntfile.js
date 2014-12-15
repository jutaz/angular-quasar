module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('bower.json'),

		uglify: {
			options: {
				report: 'min',
				mangle: true
			},
			build: {
				files: {
					'angular-quasar.min.js': ['angular-quasar.js']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('build', ['uglify:build']);
};
