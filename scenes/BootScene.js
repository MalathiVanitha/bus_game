import soundsData from "../sounds-data.js";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'boot' });
    }

    preload() {
        this.load.image('logo', 'assets/logo.png')

        // Too big for the sheet, and most are stretched rather than drawn at
        // size, so they are kept as their own images.
        this.load.image('panel_modal', 'assets/panel_modal.png')
        this.load.image('button_purple', 'assets/button_purple.png')
        this.load.image('button_green', 'assets/button_green.png')

        this.load.image('icon-stars', 'assets/icon-stars.png')

        // The packed toggle is a long, thin pill. The storyboard's is a stubby
        // one, so the track and its fill are kept here, reshaped, until the
        // sheet is exported with them at that size.
        this.load.image('toggle-base', 'assets/toggle-base.png')
        this.load.image('toggle-fill', 'assets/toggle-fill.png')

        this.load.atlas('sheet', 'assets/sheet/sheet.png', 'assets/sheet/sheet.json')

        this.load.script('webfont', '../../js/webfont.js');

        //---------------------------------------------------------------------->
        this.load.setPath('assets/sounds');

        this.loadFont('Oduda-Bold-Demo', 'fonts/Oduda-Bold-Demo.otf');
        this.loadFont('FredokaOne_Regular', 'fonts/FredokaOne_Regular.otf');

        this.width = this.game.screenBaseSize.width
        this.height = this.game.screenBaseSize.height

        this.fontsLoaded = false;
        this.assetsLoaded = false;
        this.load.on('progress', function(progress) {});
        this.load.on('complete', () => {
            this.assetsLoaded = true;
        });
    }

    createSounds() {
        for (let i = 0; i < soundsData.music.length; i++) {
            soundsData[soundsData.music[i]] = this.sound.add(soundsData.music[i]);
        }

        for (let i = 0; i < soundsData.sounds.length; i++) {
            soundsData[soundsData.sounds[i]] = this.sound.add(soundsData.sounds[i]);
        }
    }

    loadFont(name, url) {
        var newFont = new FontFace(name, `url(${url})`);
        let _this = this;
        newFont.load().then(function(loaded) {
            document.fonts.add(loaded);
            _this.fontsLoaded = true;
        }).catch(function(error) {
            return error;
        });
    }

    update() {

        if (this.assetsLoaded && this.fontsLoaded && !this.gameStarted) {
            this.gameStarted = true;
            this.scene.start('preload');
        }
    }
}