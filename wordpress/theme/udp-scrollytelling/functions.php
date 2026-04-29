<?php
/**
 * UDP Scrollytelling — Child theme of Twenty Twenty-Five
 */

add_action('wp_enqueue_scripts', function () {
    // Parent theme
    wp_enqueue_style('twentytwentyfive-style', get_template_directory_uri() . '/style.css');

    // Child theme (scrollytelling CSS)
    wp_enqueue_style(
        'udp-scrollytelling',
        get_stylesheet_uri(),
        array('twentytwentyfive-style'),
        '1.0.0'
    );

    // Google Fonts — Roboto + Roboto Condensed
    wp_enqueue_style(
        'udp-google-fonts',
        'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@400;700;900&family=Roboto:wght@300;400;700;900&display=swap',
        array(),
        null
    );
});
