const FILL_TIME = 600;
const FILL_MIN = 250;
const FULL_HOLD = 120;
const SETTLE = 50;
const FADE_TIME = 380;

export default class Preload extends Phaser.Scene {

    width = null
    height = null
    handlerScene = null
    sceneStopped = false

    constructor() {
        super({ key: 'preload' })
    }

    preload() {

        this.handlerScene = this.scene.get('handler');
        this.handlerScene.sceneRunning = 'preload';

        this.canvasWidth = this.sys.game.canvas.width;
        this.canvasHeight = this.sys.game.canvas.height;

        this.width = this.game.screenBaseSize.width;
        this.height = this.game.screenBaseSize.height;

        this.screenWidth = this.sys.game.canvas.width;
        this.screenHeight = this.sys.game.canvas.height;

        this.bg = this.add.rectangle(this.canvasWidth / 2, this.canvasHeight / 2, this.canvasWidth, this.canvasHeight, 0xf5ebe6);

        this.barGrp = this.add.container(0, 0);

        this.logo = this.add.image(0, -220, 'logo');
        this.logo.setOrigin(0.5);
        this.barGrp.add(this.logo);

        this.bar = this.add.sprite(0, 0, "sheet", 'progress bar');
        this.bar.setOrigin(.5);
        this.bar.setScale(1.3);
        this.barGrp.add(this.bar);

        this.fill = this.add.sprite(0, 0, "sheet", 'progress');
        this.fill.setOrigin(0.5);
        this.fill.setScale(1.3);
        this.fill.orgWidth = this.fill.width;
        this.barGrp.add(this.fill);

        this.cropRect = this.add.rectangle(0, 0, 0, this.fill.height, 0xffffff, 0);
        this.fill.setCrop(this.cropRect);
        this.barGrp.add(this.cropRect);

        let loadingText = this.add.text(-90, -68, 'loading', {
            fontFamily: "Oduda-Bold-Demo",
            fontSize: 48,
            fill: '#fe6e02',
            fontStyle: 'bold',
            align: "left",
        }).setOrigin(0, .5);
        this.barGrp.add(loadingText);

        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                let currentText = loadingText.text;
                if (currentText.length >= 10) {
                    loadingText.setText('loading');
                } else {
                    loadingText.setText(currentText + '.');
                }
            },
        });
        loadingText.visible = false;
        this.loadingText = loadingText;
        this.load.on('progress', (value) => {
            let val = (value) * this.fill.orgWidth * .5;
            this.cropRect.width = val;
            this.fill.setCrop(this.cropRect);
        })

        this.load.on('complete', () => {
            if (this.tween) return;

            // Fill the rest of the bar from wherever loading left it, easing
            // into the end rather than stopping dead on it.
            const remaining = 1 - this.cropRect.width / this.fill.orgWidth;

            this.tween = this.tweens.add({
                targets: this.cropRect,
                width: this.fill.orgWidth,
                duration: Math.max(FILL_MIN, FILL_TIME * remaining),
                ease: 'Sine.easeOut',
                onUpdate: () => {
                    this.fill.setCrop(this.cropRect);
                },
                onComplete: () => {
                    this.fill.setCrop(this.cropRect);
                    this.time.delayedCall(FULL_HOLD, () => this.handOff());
                }
            });
        })
    }

    // The game scene is built underneath (it sits below this one in the scene
    // list), and the loader fades off it once it is up. Building it is the
    // slow frame, so that happens behind a still loader, not mid-fade.
    handOff() {
        const game = this.scene.get('GameScene');

        game.events.once('create', () => {
            this.time.delayedCall(SETTLE, () => {
                this.tweens.add({
                    targets: [this.bg, this.barGrp],
                    alpha: 0,
                    duration: FADE_TIME,
                    ease: 'Sine.easeInOut',
                    onComplete: () => this.scene.stop('preload')
                });
            });
        });

        this.scene.launch('GameScene');
    }

    adjust() {


    }

    update() {
        this.screenWidth = this.sys.game.canvas.width;
        this.screenHeight = this.sys.game.canvas.height;

        this.bg.setPosition(this.screenWidth / 2, this.screenHeight / 2);
        this.bg.setSize(this.screenWidth, this.screenHeight);

        this.barGrp.x = this.screenWidth / 2;
        this.barGrp.y = this.screenHeight / 2;

    }
}