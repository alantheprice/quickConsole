module.exports = function(grunt) {

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-babel');



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
                dest: 'dist/es2015QuickConsole.js'
            }
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['babel-preset-es2015']
            },
            dist: {
                files: {
                    'dist/quickConsole.js': 'dist/es2015QuickConsole.js'
                }
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ["concat", "babel", "uglify"]);

};