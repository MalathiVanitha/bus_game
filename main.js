import Handler from './scenes/handler.js'
import Preload from './scenes/preload.js'
import GameScene from './scenes/GameScene.js'
import BootScene from './scenes/BootScene.js';
import perf from './utils/perf.js';

// Aspect Ratio 16:9 - Portrait

const ratio = perf.ratio();

const config = {
    type: Phaser.WEBGL,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: (window.innerWidth * ratio),
        height: (window.innerHeight * ratio),

    },
    render: {
        powerPreference: 'high-performance',
        // Multisampling the whole canvas is a fill cost low-end GPUs feel;
        // the art's own edges are already soft, so only they go without.
        antialiasGL: !perf.lowEnd
    },
    dom: {
        createContainer: true
    },
    scene: [BootScene, Handler, GameScene, Preload],
    plugins: {
        scene: [
            { key: 'SpinePlugin', plugin: window.SpinePlugin, mapping: 'spine' }
        ]
    }
}

const game = new Phaser.Game(config)

// Global
game.debugMode = false;
game.embedded = false // game is embedded into a html iframe/object

game.screenBaseSize = {

    width: window.innerWidth * ratio,
    height: window.innerHeight * ratio
}

function fitCanvas() {
    const ratio = perf.ratio();

    game.scale.setGameSize(window.innerWidth * ratio, window.innerHeight * ratio);
    game.canvas.style.width = (window.innerWidth) + 'px';
    game.canvas.style.height = (window.innerHeight) + 'px';
    game.scale.updateBounds();
    game.scale.refresh();
}

window.addEventListener("resize", fitCanvas, false);

// Redraws everything at the low tier's ratio once the game finds it is
// running too slowly for the one it started on.
game.lowerQuality = () => {
    fitCanvas();
    game.events.emit('quality:low');
};
game.orientation = "portrait"