const mix = require('laravel-mix');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel applications. By default, we are compiling the CSS
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js('src/js/app.js', 'public/js/app.js')
    .js('src/js/showData.js', 'public/js/showData.js')
    .postCss('src/css/app.css', 'public/css/app.css', [
        require("tailwindcss"),
    ]);