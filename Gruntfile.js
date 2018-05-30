module.exports = function(grunt) {


    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            main: {
                files: [
                    { expand: true, cwd: 'src/', src: ['public/**'], dest: '.' },
                    { expand: true, cwd: 'src/', src: ['views/**'], dest: '.' },

                ]
            }
        },
        run: {
            options: {
                // ...
            },
            npm_test_jest: {
                cmd: 'npm',
                args: [
                    'start'
                ]
            }
        },
        watch: {
            src: {
                files: '**/**',
                tasks: ['uglify', 'copy', 'run'],
                options: {
                    interrupt: true
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'copy', 'run']);
    grunt.registerTask('watch', ['uglify', 'copy', 'run', 'watch'])

};