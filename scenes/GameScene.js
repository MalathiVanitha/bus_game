import { fullScreen } from '../utils/screen.js'
import { pointerUp } from '../utils/buttons.js'
import { CTA } from '../objects/cta.js';
import AnimationManager from '../objects/AnimationManager.js';
import { GamePlay } from '../objects/game-play.js';
import { Settings } from '../objects/settings.js';
import { Home } from '../objects/home.js';
import { StorePanel } from '../objects/store.js';
import { Coin } from '../objects/coin.js';
import data from '../data/data.js';

export default class GameScene extends Phaser.Scene {

    // Vars
    handlerScene = null

    // What clearing a level pays. The end card's win face is written around
    // it, and doubling it is what the video on that card is worth.
    static LEVEL_COINS = 100;

    // Long enough for the last convoy to be out of sight, or the clock to have
    // read zero, before the card covers it.
    static END_CARD_WAIT = 500;

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

        // Over the board, which it covers until Play is pressed.
        this.home = new Home(this, 0, 0, () => this.enterGame());
        this.gameGroup.add(this.home);

        // The counter outlives the home screen: the end of a level pays coins
        // into it off the board.
        this.coin = new Coin(this, 0, 0);
        this.gameGroup.add(this.coin);

        // The shop, over the home screen it is opened from.
        this.storePanel = new StorePanel(this, 0, 0);
        this.gameGroup.add(this.storePanel);

        this.events.on('store:open', () => this.storePanel.show());

        this.events.on('home:leaving', () => {
            this.coin.outro();
            this.gamePlay.readyIntro();
        });

        this.settings = new Settings(this, 0, 0);
        this.gameGroup.add(this.settings);

        // Last in, so the end card covers the board, the gear, and whatever
        // else happens to be on the screen when a level lands.
        this.cta = new CTA(this, 0, 0);
        this.gameGroup.add(this.cta);

        this.wireEndCard();

        this.setPositions();
        this.showHome();

        if (location.search.indexOf('replay') !== -1) window.__replayHome = () => this.showHome();

        // ?endcard=win / ?endcard=fail puts the card straight up, without
        // having to play a level out to see it. ?endcard on its own just hands
        // the scene over, for driving the run from the console.
        const preview = new URLSearchParams(location.search).get('endcard');

        if (preview !== null) {
            window.__scene = this;

            if (preview) this.showEndCard(preview !== 'fail');
        }

        // this.startGamePlay();
    }

    /**
     * What the end card asks for. Nothing here runs a video - a press on one of
     * the card's video buttons is taken as paid, the same way the store's is.
     */
    wireEndCard() {
        this.events.on('cta:double', (offer) => this.nextLevel(offer.coins));
        this.events.on('cta:next', (offer) => this.nextLevel(offer.coins));
        this.events.on('cta:continue', (offer) => this.gamePlay.addTime(offer.seconds));
        this.events.on('cta:retry', () => this.restartLevel());
        this.events.on('cta:home', () => this.leaveGame());
    }

    /** The level is over, one way or the other. Called by the board itself. */
    showEndCard(gameWin = false) {
        this.cta.userWon = gameWin;

        if (gameWin) this.cta.setValue(GameScene.LEVEL_COINS);

        this.time.delayedCall(GameScene.END_CARD_WAIT, () => this.cta.show());
    }

    /** Pays the level out and moves on. */
    nextLevel(coins) {
        if (coins > 0) this.coin.award(coins);

        this.level++;
        this.home.setLevel(this.level);

        this.restartLevel();
    }

    // The board lays out whichever level this.level is on, so the next level
    // and a retry are the same call.
    restartLevel() {
        this.gamePlay.reset();
        this.gamePlay.adjust();
        this.gamePlay.start();
    }

    leaveGame() {
        this.gamePlay.reset();
        this.gamePlay.adjust();

        this.showHome();
    }

    // The home screen and the counter over it come on together.
    showHome() {
        this.home.show();
        this.coin.intro();
    }

    enterGame() {
        this.home.hide();
        this.coin.hide();

        this.gamePlay.intro(() => this.gamePlay.start());
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

        this.graphics = this.make.graphics().fillStyle(0xb6defd, 1).fillRect(dimensions.leftOffset, dimensions.topOffset, dimensions.actualWidth, dimensions.actualHeight);
        this.graphicsGrp.add(this.graphics);

        this.gamePlay.adjust();
        this.cta.adjust();
        this.home.adjust();
        this.coin.adjust();
        this.storePanel.adjust();
        this.settings.adjust();

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

        // Clouds on the home screen, while it is up.
        if (this.home) this.home.update(time, delta);
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