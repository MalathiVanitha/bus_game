import SoundManager from '../objects/SoundManager.js';
import { fullScreen } from '../utils/screen.js'
import { pointerUp } from '../utils/buttons.js'
import { CTA } from '../objects/cta.js';
import AnimationManager from '../objects/AnimationManager.js';
import { GamePlay } from '../objects/game-play.js';
import { Settings } from '../objects/settings.js';
import { Home } from '../objects/home.js';
import { LevelScreen } from '../objects/levelScreen.js';
import { StorePanel } from '../objects/store.js';
import { Coin } from '../objects/coin.js';
import { Timer } from '../objects/timer.js';
import { LevelBadge } from '../objects/levelBadge.js';
import { Transition } from '../objects/transition.js';
import { BoosterBar } from '../objects/boosterBar.js';
import { BoosterTutorial } from '../objects/boosterTutorial.js';
import { FirstLesson } from '../objects/firstLesson.js';
import { unlocks, UNLOCK_AT } from '../objects/boosterUnlocks.js';
import data from '../data/data.js';
import perf from '../utils/perf.js';

// The level to play next, kept so a reload picks up where the player left
// off rather than back on Level 1.
const LEVEL_KEY = 'baggage-out.level';

function readLevel() {
    try {
        const saved = Number(window.localStorage.getItem(LEVEL_KEY));

        if (isFinite(saved) && saved >= 1) return Math.floor(saved);
    } catch (e) {
        // Starts from Level 1.
    }

    return 1;
}

function writeLevel(level) {
    try {
        window.localStorage.setItem(LEVEL_KEY, String(level));
    } catch (e) {
        // Nothing worth stopping the game for.
    }
}

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

        let ratio = perf.ratio();

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
        this.level = readLevel();
        this.game.gameScene = this;
        this.animationManager = new AnimationManager(this);

        this.superGroup = this.add.container()
        this.gameGroup = this.add.container()
        this.superGroup.add(this.gameGroup)

        this.graphicsGrp = this.add.container(0, 0);
        this.gameGroup.add(this.graphicsGrp);

        this.graphics = this.make.graphics().fillStyle(0x98ddfc, .5).fillRect(dimensions.leftOffset, dimensions.topOffset, dimensions.actualWidth * 3, dimensions.actualHeight * 3);
        this.graphicsGrp.add(this.graphics);

        this.gamePlay = new GamePlay(this, 0, 0);
        this.gameGroup.add(this.gamePlay);

        // The boosters under the board. Low in the stack, so the level card's
        // offer (which they open when one runs out) and the end card cover them.
        this.boosterBar = new BoosterBar(this, 0, 0);
        this.gameGroup.add(this.boosterBar);

        // Over the board, which it covers until Play is pressed. Its Play is
        // taken over below (onPlayPress) by the transition to the level card;
        // this callback is left for its own outro, should that be used again.
        this.home = new Home(this, 0, 0, () => this.levelScreen.show(this.level));
        this.gameGroup.add(this.home);

        // The card comes up before every level: after the home screen, and
        // between one level and the next. Its Play goes through the
        // transition into the level, with the boosters picked on it; its close
        // goes back home.
        this.boosters = {};
        this.betweenLevels = false;
        this.levelScreen = new LevelScreen(this, 0, 0, (boosters) => {
            this.boosters = boosters;

            this.transition.run(() => this.enterGame(), () => this.beginLevel());
        });
        this.levelScreen.onClose = () => this.transition.run(() => {
            if (this.betweenLevels) this.leaveGame();
            else this.showHome();
        });
        this.gameGroup.add(this.levelScreen);

        this.levelScreen.onChange = (counts) => this.boosterBar.refresh(counts);

        // The counter outlives the home screen: the end of a level pays coins
        // into it off the board.
        this.coin = new Coin(this, 0, 0);
        this.gameGroup.add(this.coin);

        // The shop, over the home screen it is opened from.
        this.storePanel = new StorePanel(this, 0, 0);
        this.gameGroup.add(this.storePanel);

        this.events.on('store:open', () => this.storePanel.show());

        // The counter stays up over the level card, where boosters are
        // bought with it, and goes once the level starts.
        this.events.on('home:leaving', () => this.gamePlay.readyIntro());

        // The level clock, over the board and under the end card.
        this.timer = new Timer(this, 0, 0);
        this.gameGroup.add(this.timer);

        // The level number, between the clock and the pause button.
        this.levelBadge = new LevelBadge(this, 0, 0);
        this.gameGroup.add(this.levelBadge);

        this.settings = new Settings(this, 0, 0);
        this.gameGroup.add(this.settings);

        // After the settings, so it starts muted if Music was left off.
        SoundManager.playMusic(this);

        // A booster's first time: over the board, the clock and the gear, so
        // its dim takes them all in, and under the end card.
        this.boosterTutorial = new BoosterTutorial(this, 0, 0);
        this.gameGroup.add(this.boosterTutorial);

        // Level 1's how-to-play: everything blurred but the one convoy to
        // drive home. Over the clock, the gear and the boosters likewise.
        this.firstLesson = new FirstLesson(this, 0, 0);
        this.gameGroup.add(this.firstLesson);

        // Last in, so the end card covers the board, the gear, and whatever
        // else happens to be on the screen when a level lands.
        this.cta = new CTA(this, 0, 0);
        this.gameGroup.add(this.cta);

        // Over everything: the change from one screen to the next.
        this.transition = new Transition(this, 0, 0);
        this.gameGroup.add(this.transition);

        // Home's Play swaps to the level card under the transition.
        this.home.onPlayPress = () => this.transition.run(() => {
            this.home.hide();
            this.gamePlay.readyIntro();
            this.transition.whenOpen(() => this.levelScreen.show(this.level));
        });

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
        this.events.on('cta:double', (offer) => this.transition.run(() => this.nextLevel(offer.coins)));
        this.events.on('cta:next', (offer) => this.transition.run(() => this.nextLevel(offer.coins)));
        this.events.on('cta:continue', (offer) => this.gamePlay.addTime(offer.seconds));
        // The board is laid out again under the transition, and the clock
        // only starts once it has cleared.
        this.events.on('cta:retry', () => this.transition.run(() => {
            this.layoutLevel();
            this.bringBoardOn();
        }, () => this.beginLevel()));
        this.events.on('cta:home', () => this.transition.run(() => this.leaveGame()));
    }

    /** The level is over, one way or the other. Called by the board itself. */
    showEndCard(gameWin = false) {
        this.boosterBar.stopPicking();

        this.cta.userWon = gameWin;

        if (gameWin) this.cta.setValue(GameScene.LEVEL_COINS);

        this.time.delayedCall(GameScene.END_CARD_WAIT, () => this.cta.show());
    }

    /**
     * Pays the level out and moves on. The next level is laid out under its
     * level card, and starts from the card's Play.
     */
    nextLevel(coins) {
        if (coins > 0) this.coin.award(coins);

        this.level++;
        writeLevel(this.level);
        this.levelBadge.set(this.level);

        // Laid out but kept hidden: the card stands over an empty screen, and
        // its Play (enterGame) brings the board on.
        this.layoutLevel();
        this.gamePlay.readyIntro();
        this.timer.hide();
        this.levelBadge.hide();

        this.betweenLevels = true;
        this.transition.whenOpen(() => this.levelScreen.show(this.level));
    }

    // The board lays out whichever level this.level is on, so the next level
    // and a retry are the same call.
    restartLevel() {
        this.layoutLevel();
        this.beginLevel();
    }

    layoutLevel() {
        this.boosterTutorial.abort();
        this.firstLesson.abort();
        this.boosterBar.hide();

        this.gamePlay.reset();
        this.gamePlay.adjust();
    }

    beginLevel() {
        this.betweenLevels = false;
        this.coin.outro();

        this.gamePlay.start();

        // Boosters open one at a time as levels are reached. One just opened
        // is shown locked as the level comes in, then unlocked and taught.
        // Level 1 always teaches how to play instead.
        unlocks.reach(this.level);

        const lesson = this.level !== 1 && Object.keys(UNLOCK_AT)
            .sort((a, b) => UNLOCK_AT[a] - UNLOCK_AT[b])
            .find((key) => unlocks.needsLesson(key));

        if (lesson) this.boosterBar.holdLocked(lesson);

        // Level 1's lesson comes up as soon as the board lands, so the clock,
        // badge and boosters are already in place for it.
        const instant = this.level === 1;

        this.timer.intro(this.gamePlay.timeLeft, instant);
        this.levelBadge.intro(this.level, instant);
        this.boosterBar.intro(instant);

        if (this.level === 1) this.firstLesson.begin();
        else if (lesson) this.boosterTutorial.teach(lesson);
    }

    leaveGame() {
        this.betweenLevels = false;
        this.layoutLevel();

        this.showHome();
    }

    // The home screen and the counter over it come on together, as the
    // transition opens if one is under way.
    showHome() {
        // Out of sight, and so not drawn: the home screen's sky covers it
        // anyway, and the board under it costs a full redraw every frame.
        this.gamePlay.readyIntro();
        this.timer.hide();
        this.levelBadge.hide();
        this.boosterBar.hide();
        this.settings.dock(false);

        this.transition.whenOpen(() => {
            this.home.show();
            this.coin.intro();
            this.settings.introGear();
        });
    }

    // The board, hidden now, flies in as the transition opens.
    bringBoardOn() {
        this.gamePlay.readyIntro();
        this.transition.whenOpen(() => this.gamePlay.intro());
    }

    // Under the transition: the board is put straight where it belongs, and
    // everything that is not part of a level cleared away. beginLevel() then
    // brings the clock and badge in and starts play once it has cleared.
    enterGame() {
        this.home.hide();
        this.coin.hide();
        this.timer.hide();
        this.levelBadge.hide();
        this.boosterBar.hide();
        this.settings.dock(true);

        this.bringBoardOn();
        this.transition.whenOpen(() => this.settings.introGear());
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

        let ratio = perf.ratio();
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

        let ratio = perf.ratio();
        this.superGroup.scale = this.gameScale
        this.gameGroup.x = (dimensions.fullWidth / this.gameScale - dimensions.gameWidth) / 2;
        this.gameGroup.y = (dimensions.fullHeight / this.gameScale - dimensions.gameHeight) / 2;


        if (this.graphics) this.graphics.destroy();

        this.graphics = this.make.graphics().fillStyle(0xb6defd, 1).fillRect(dimensions.leftOffset, dimensions.topOffset, dimensions.actualWidth, dimensions.actualHeight);
        this.graphicsGrp.add(this.graphics);

        this.gamePlay.adjust();
        this.boosterBar.adjust();
        this.cta.adjust();
        this.home.adjust();
        this.levelScreen.adjust();
        this.coin.adjust();
        this.timer.adjust();
        this.levelBadge.adjust();
        this.storePanel.adjust();
        this.settings.adjust();
        this.boosterTutorial.adjust();
        this.firstLesson.adjust();
        this.transition.adjust();

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

        let ratio = perf.ratio();
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

        perf.watch(time, delta, () => this.game.lowerQuality());

        // The convoys are walked along their trails a frame at a time, so the
        // drag has something to pull against between pointer moves.
        if (this.gamePlay) this.gamePlay.update(time, delta);

        if (this.timer && this.timer.visible) {
            const play = this.gamePlay;

            this.timer.set(play.timeLeft);
        }

        // Clouds on the home screen, while it is up.
        if (this.home) this.home.update(time, delta);
    }

    resize(gameSize) {

        // 'this' means to the current scene that is running
        if (!this.sceneStopped) {

            let ratio = perf.ratio();
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