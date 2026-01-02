const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidRepoFix(config) {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            // Add jitpack and explicit maven central to buildscript repositories
            config.modResults.contents = config.modResults.contents.replace(
                /buildscript\s*\{[\s\S]*?repositories\s*\{/,
                (match) => `${match}
        mavenCentral()
        google()
        maven { url "https://jitpack.io" }`
            );

            // Add jitpack to allprojects repositories
            config.modResults.contents = config.modResults.contents.replace(
                /allprojects\s*\{[\s\S]*?repositories\s*\{/,
                (match) => `${match}
        mavenCentral()
        google()
        maven { url "https://jitpack.io" }`
            );
        }
        return config;
    });
};
