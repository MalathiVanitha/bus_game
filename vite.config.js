const fs = require('fs');
const path = require('path');
const { defineConfig } = require('vite');

// Phaser loads the art, the fonts and the plain (non-module) scripts by path at
// runtime, so Vite never sees them and won't put them in dist. They are
// copied over as they are, at the same paths the game asks for them by.
// Atlas sources (.tps, and the loose images packed into the sheets) stay out.
const RUNTIME_FILES = [
    { dir: 'js', match: /\.js$/ },
    { dir: 'fonts', match: /\.(otf|ttf|woff2?)$/ },
    { dir: 'assets', match: /\.png$/ },
    { dir: 'assets/sheet', match: /\.(png|json)$/ }
];

function copyRuntimeFiles(outDir) {
    return {
        name: 'copy-runtime-files',
        apply: 'build',
        closeBundle() {
            for (const { dir, match } of RUNTIME_FILES) {
                const from = path.resolve(__dirname, dir);
                const to = path.resolve(__dirname, outDir, dir);

                fs.mkdirSync(to, { recursive: true });

                for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
                    if (entry.isFile() && match.test(entry.name)) {
                        fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
                    }
                }
            }
        }
    };
}

module.exports = defineConfig({
    // Relative, so the build runs from any folder (XAMPP's /own/bus_game/dist/,
    // a CDN path, an ad network's iframe) and not only a domain root.
    base: './',
    build: {
        outDir: 'dist',
        // Vite's default 'assets' is the game's own art folder; the bundle
        // goes in its own folder so the two don't share one.
        assetsDir: 'build'
    },
    plugins: [
        copyRuntimeFiles('dist')
    ]
});
