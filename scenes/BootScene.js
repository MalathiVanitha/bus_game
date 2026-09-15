import soundsData from "../sounds-data.js";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'boot' });
    }

    preload() {
        this.load.image('logo', 'assets/logo.png')

        this.load.atlas('sheet', 'assets/sheet/sheet.png', 'assets/sheet/sheet.json')

        this.load.script('webfont', '../../js/webfont.js');

        //---------------------------------------------------------------------->
        this.load.setPath('assets/sounds');

        this.loadFont('Oduda-Bold-Demo', 'fonts/Oduda-Bold-Demo.otf');

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