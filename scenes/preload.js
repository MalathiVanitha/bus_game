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

        this.timeStart = Date.now();

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
            let difference = Date.now() - this.timeStart;

            difference = 500 - difference;
            if (difference <= 500) {

                if (!this.tween)
                    this.tween = this.tweens.add({
                        targets: this.cropRect,
                        width: {
                            from: this.fill.orgWidth * .1,
                            to: this.fill.orgWidth,
                        },
                        duration: difference,
                        ease: "Power0",
                        onUpdate: () => {
                            this.fill.setCrop(this.cropRect);
                        },
                        onComplete: () => {
                            this.fill.setCrop(this.cropRect);
                            this.scene.stop('preload');
                            this.scene.launch('GameScene');
                        }
                    })
            } else {
                // this.scene.stop('preload');
                //  this.scene.launch('GameScene');
            }
        })
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