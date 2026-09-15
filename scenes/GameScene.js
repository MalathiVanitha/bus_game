import { fullScreen } from '../utils/screen.js'
import { pointerUp } from '../utils/buttons.js'
import { CTA } from '../objects/cta.js';
import AnimationManager from '../objects/AnimationManager.js';
import { GamePlay } from '../objects/game-play.js';
import data from '../data/data.js';

export default class GameScene extends Phaser.Scene {

    // Vars
    handlerScene = null

    // Coins the end of level blasts are worth.
    static BONUS_COINS = 10;

    constructor() {
        super('GameScene')
    }

    preload() {

        this.switchMode()

        let ratio = window.devicePixelRatio;

        dimensions.fullWidth = window.innerWidth * ratio;
        dimensions.fullHeight = window.innerHeight * ratio;

        this.setGameScale();

        this.handlerScene = this.scene.get('handler')
        this.scale.on('resize', this.orinetaionChange, this)
    }

    orinetaionChange() {

        this.switchMode();
        this.setGameScale();
        this.setPositions();
    }


    create() {
        this.level = 1;
        this.game.gameScene = this;
        this.animationManager = new AnimationManager(this);
        // SoundManager.playMusic("bgm");

        this.superGroup = this.add.container()
        this.gameGroup = this.add.container()
        this.superGroup.add(this.gameGroup)

        this.graphicsGrp = this.add.container(0, 0);
        this.gameGroup.add(this.graphicsGrp);

        this.graphics = this.make.graphics().fillStyle(0x98ddfc, .5).fillRect(dimensions.leftOffset, dimensions.topOffset, dimensions.actualWidth * 3, dimensions.actualHeight * 3);
        this.graphicsGrp.add(this.graphics);

        this.gamePlay = new GamePlay(this, 0, 0);
        this.gameGroup.add(this.gamePlay);

        this.cta = new CTA(this, 0, 0, this);
        this.gameGroup.add(this.cta)

        this.setPositions();

        // this.startGamePlay();
    }

    checkWin(gameWin = false) {

        // The bonus round runs the ending itself, coins and all. A settle
        // inside it, or the move counter hitting zero as it spends them, must
        // not race the end card.
        if (this.board.bonusActive) return;
        if (this.gameOver) return;

        // A level won with moves to spare spends them on the board first: a
        // power up sown per move, the lot set off, and the coins that shakes
        // loose flown into the counter. Then the card.
        if (gameWin && !this.bonusPlayed && this.board.hasBonusMoves()) {

            this.bonusPlayed = true;
            this.board.runBonusRound((fired) => {

                if (!fired) {
                    this.showEndCard(true);
                    return;
                }

                this.awardBonusCoins(() => {
                    this.showEndCard(true);
                });
            });
            return;
        }

        this.showEndCard(gameWin);
    }

    // The blasts pay out: coins fly off the middle of the board into the
    // counter, and the end card waits for the last one to land.
    awardBonusCoins(onComplete) {

        let matrix = this.board.getWorldTransformMatrix();
        this.coin.collect(matrix.tx, matrix.ty, GameScene.BONUS_COINS, GameScene.BONUS_COINS, onComplete);
    }

    showEndCard(gameWin = false) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.board.gameEnded = true;
        this.board.bonusActive = false;

        if (gameWin) {
            this.cta.userWon = true;
        } else {
            this.cta.userWon = false;
        }
        this.board.canClick = false;
        this.time.addEvent({
            delay: 500,
            callback: () => {
                this.cta.show();
            }
        });
    }

    startGamePlay() {
        this.instruction.show();
        this.topPanel.show();
        this.board.show();
        this.coin.hide();
    }

    addCandy(path) {

        let xPos = path.x + this.board.x;
        let yPos = path.y + this.board.y;

        let tile = this.add.sprite(xPos, yPos, "sheet", path.frame.name);
        tile.setOrigin(0.5);
        tile.setScale(path.scaleX / 1.2);
        this.gameGroup.add(tile);
        if (path.frame.name == "blocks/blue") {
            for (let i = 0; i < this.topPanel.target.targetArr.length; i++) {
                this.tweens.add({
                    targets: tile,
                    x: this.topPanel.target.targetArr[i].x + 210,
                    y: this.topPanel.target.targetArr[i].y + 90,
                    duration: 750,
                    ease: "Linear",
                    onComplete: () => {
                        tile.destroy();
                    }
                })
            }
        } else if (path.frame.name == "blocks/green") {
            for (let i = 0; i < this.topPanel.target.targetArr.length; i++) {
                this.tweens.add({
                    targets: tile,
                    x: this.topPanel.target.targetArr[i].x + 290,
                    y: this.topPanel.target.targetArr[i].y + 90,
                    duration: 750,
                    ease: "Linear",
                    onComplete: () => {
                        tile.destroy();
                    }
                })
            }
        }


    }

    clickBackScene(sceneTxt) {
        const scene = this.scene.get(sceneTxt)
        let gotoScene
        let bgColorScene

        switch (sceneTxt) {
            case "title":
                this.creditsTxt.visible = false
                return
        }

        scene.sceneStopped = true
        scene.scene.stop(sceneTxt)
        this.handlerScene.cameras.main.setBackgroundColor(bgColorScene)
        this.handlerScene.launchScene(gotoScene)
    }

    setGameScale() {
        let scaleX = dimensions.fullWidth / dimensions.gameWidth;
        let scaleY = dimensions.fullHeight / dimensions.gameHeight;


        this.gameScale = (scaleX < scaleY) ? scaleX : scaleY;

        dimensions.actualWidth = dimensions.fullWidth / this.gameScale;
        dimensions.actualHeight = dimensions.fullHeight / this.gameScale;

        dimensions.leftOffset = -(dimensions.actualWidth - dimensions.gameWidth) / 2;
        dimensions.rightOffset = dimensions.gameWidth - dimensions.leftOffset;
        dimensions.topOffset = -(dimensions.actualHeight - dimensions.gameHeight) / 2;
        dimensions.bottomOffset = dimensions.gameHeight - dimensions.topOffset;
    }

    switchMode() {

        let ratio = window.devicePixelRatio;
        let isPortrait;
        dimensions.fullWidth = window.innerWidth * ratio;
        dimensions.fullHeight = window.innerHeight * ratio;

        if (dimensions.isPortrait != dimensions.fullWidth < dimensions.fullHeight) {
            isPortrait = true
        } else {
            isPortrait = false
        }

        dimensions.isPortrait = isPortrait;
        dimensions.isLandscape = !isPortrait;

        if (dimensions.fullWidth < dimensions.fullHeight) {
            dimensions.gameWidth = 540;
            dimensions.gameHeight = 960;
            dimensions.isPortrait = true;
            dimensions.isLandscape = false;
        } else {

            dimensions.gameWidth = 960;
            dimensions.gameHeight = 540;
            dimensions.isLandscape = true;
            dimensions.isPortrait = false;
        }

    }

    setPositions() {

        let ratio = window.devicePixelRatio;
        this.superGroup.scale = this.gameScale
        this.gameGroup.x = (dimensions.fullWidth / this.gameScale - dimensions.gameWidth) / 2;
        this.gameGroup.y = (dimensions.fullHeight / this.gameScale - dimensions.gameHeight) / 2;


        if (this.graphics) this.graphics.destroy();

        this.graphics = this.make.graphics().fillStyle(0x98ddfc, 1).fillRect(dimensions.leftOffset, dimensions.topOffset, dimensions.actualWidth, dimensions.actualHeight);
        this.graphicsGrp.add(this.graphics);

        this.gamePlay.adjust();
        this.cta.adjust();

    }

    // Where the pointer is now, in the design space the game is laid out in.
    // downX/downY would only ever give back the spot the touch started at, which
    // a drag cannot be followed by.
    offsetMouse() {

        return {
            x: (this.game.input.activePointer.worldX * dimensions.actualWidth / dimensions.fullWidth) + ((dimensions.gameWidth - dimensions.actualWidth) / 2),
            y: (this.game.input.activePointer.worldY * dimensions.actualHeight / dimensions.fullHeight) + ((dimensions.gameHeight - dimensions.actualHeight) / 2)
        };
    }

    offsetWorld(point) {
        return { x: (point.x * dimensions.actualWidth / this.game.width), y: (point.y * dimensions.actualHeight / this.game.height) };
    }

    updateResize(scene) {

        let ratio = window.devicePixelRatio;
        scene.scale.on('resize', this.resize, scene)

        const scaleWidth = scene.scale.gameSize.width * ratio
        const scaleHeight = scene.scale.gameSize.height * ratio

        scene.parent = new Phaser.Structs.Size(scaleWidth, scaleHeight)
        scene.sizer = new Phaser.Structs.Size(scene.width, scene.height, Phaser.Structs.Size.FIT, scene.parent)

        scene.parent.setSize(scaleWidth, scaleHeight)
        scene.sizer.setSize(scaleWidth, scaleHeight)

        this.updateCamera(scene)
    }

    update(time, delta) {

        // The convoys are walked along their trails a frame at a time, so the
        // drag has something to pull against between pointer moves.
        if (this.gamePlay) this.gamePlay.update(time, delta);
    }

    resize(gameSize) {

        // 'this' means to the current scene that is running
        if (!this.sceneStopped) {

            let ratio = window.devicePixelRatio;
            const width = gameSize.width * ratio;
            const height = gameSize.height * ratio;

            this.parent.setSize(width, height);
            this.sizer.setSize(width, height);
        }
    }

    updateCamera(scene) {
        const camera = scene.cameras.main
        const scaleX = scene.sizer.width / this.game.screenBaseSize.width
        const scaleY = scene.sizer.height / this.game.screenBaseSize.height

        camera.setZoom(Math.max(scaleX, scaleY))
        camera.centerOn(this.game.screenBaseSize.width / 2, this.game.screenBaseSize.height / 2)
    }
}