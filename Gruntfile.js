module.exports = function(grunt) {

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');



    // Project configuration.
    grunt.initConfig({
        uglify: {
            options: {
                mangle: true
            },
            build: {
                src: 'dist/quickConsole.js',
                dest: 'dist/quickConsole.min.js'
            }
        },
        concat: {
            build: {
                src: ["src/**/*.js"],
                dest: 'quickConsole.js'
            }
        },
        copy: {
            dist: {
                src: ["quickConsole.js"],
                dest: "dist/quickConsole.js"
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ["concat", "copy"]);//, "uglify"]);

};