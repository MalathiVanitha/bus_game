// The home screen: the title, the convoy standing under it, the level the
// player is on, and the way in. It covers the board while it is up, so the
// game underneath is only uncovered once Play is pressed.
//
// The gear in the top left belongs to Settings and the counter in the top right
// to Coin, both of which outlive this screen and are left to the scene. The
// Store button is its own piece, in store.js.

import { pressable } from '../utils/buttons.js';
import { Store } from './store.js';

// The sky the storyboard is drawn on, which is the blue the board sits on too.
const SKY = 0x98ddfc;

// The home art is packed at the size the pack's manifest lays it out at on a
// 1080 x 1920 canvas, which is twice the 540 x 960 the game is laid out in.
const ART_SCALE = 0.5;

const INK = '#283085';

const LOGO = 'home/logo';
const LOGO_Y = -230;

// Clouds drift across the sky and come back on at the other side. Each one
// carries its own height, size and pace, so the two never pair up.
const CLOUD = 'home/cloud';
const CLOUD_ART_W = 300;
const CLOUD_EDGE = 20;
const CLOUDS = [
    { x: -90, y: -118, scale: 0.5, alpha: 0.9, speed: 7 },
    { x: 150, y: -62, scale: 0.34, alpha: 0.7, speed: 4.5, flip: true }
];

// The storyboard's side on convoy. The pack ships the board's top down
// vehicles for this row, which face the wrong way for a screen like this.
const CONVOY = 'home/convoy';
const CONVOY_Y = 0;

const PLATE = 'home/level-plate';
const PLATE_Y = 135;
const PLATE_SIZE = 44;

const PLAY_FACE = 'home/play-button';
const PLAY_Y = 245;

const PLAY_HIT_W = 470;
const PLAY_HIT_H = 120;

const PLAY_ICON = 'home/play-icon';
const PLAY_ICON_X = -95;
const PLAY_ICON_Y = -6;
const PLAY_ICON_SCALE = ART_SCALE;

const PLAY_LABEL_X = 31;
const PLAY_LABEL_Y = -6;
const PLAY_LABEL_SIZE = 62;

const STORE_Y = 390;

// The box the screen is laid out in. A screen shorter or narrower than this -
// a rotated phone, mostly - has the lot scaled down to fit rather than cropped.
const CONTENT_W = 540;
const CONTENT_H = 960;
const CONTENT_MARGIN = 12;

const SHUT_TIME = 220;

// The screen builds itself up when it comes on: the title drops in, the convoy
// drives on the way it is facing and pulls up, and the plate and the buttons
// rise from under the bottom of the screen, one behind the other.
//
// The convoy faces left, so it comes on from the right - the other way round
// and it reads as reversing. It brakes rather than springs, and takes a little
// bob on its springs once it is standing still.
const INTRO = [
    { piece: 'logo', dy: -180, scale: 0.88, duration: 660, delay: 0, ease: 'Back.easeOut', pulse: 1.03 },
    { piece: 'convoy', dx: 560, duration: 780, delay: 170, ease: 'Quint.easeOut', bob: -5 },
    { piece: 'plate', dy: 120, duration: 500, delay: 430, ease: 'Back.easeOut' },
    { piece: 'playButton', dy: 140, duration: 500, delay: 510, ease: 'Back.easeOut' },
    { piece: 'store', dy: 160, duration: 500, delay: 580, ease: 'Back.easeOut' }
];

// A piece is solid for most of its travel rather than ghosting the whole way
// in, and the settle is the bit of give at the end of the two big moves.
const INTRO_FADE = 260;
const INTRO_SETTLE = 170;

const INTRO_CLOUD_TIME = 900;

export class Home extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0, onPlay = null) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.onPlay = onPlay;
        this.level = scene.level || 1;

        this.build();
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.sky = this.scene.add.rectangle(0, 0, 10, 10, SKY);
        this.add(this.sky);

        // Everything but the sky, which has the screen to cover whatever the
        // rest of it is scaled to.
        this.content = this.scene.add.container(0, 0);
        this.add(this.content);

        this.buildClouds();

        this.logo = this.scene.add.sprite(0, LOGO_Y, 'sheet', LOGO);
        this.logo.setScale(ART_SCALE);
        this.content.add(this.logo);

        this.convoy = this.scene.add.sprite(0, CONVOY_Y, 'sheet', CONVOY);
        this.convoy.setScale(ART_SCALE);
        this.content.add(this.convoy);

        this.buildPlate();
        this.buildPlay();

        this.store = new Store(this.scene, 0, STORE_Y);
        this.content.add(this.store);

        // Where everything sits once it has arrived, which the intro puts it
        // back to however far along the last one got.
        for (let i = 0; i < INTRO.length; i++) {
            const piece = this[INTRO[i].piece];

            piece.restX = piece.x;
            piece.restY = piece.y;
            piece.introScale = piece.scaleX;
        }
    }

    buildClouds() {
        this.clouds = [];

        for (let i = 0; i < CLOUDS.length; i++) {
            const spec = CLOUDS[i];
            const cloud = this.scene.add.sprite(spec.x, spec.y, 'sheet', CLOUD);

            cloud.setScale(spec.flip ? -spec.scale : spec.scale, spec.scale);
            cloud.alpha = spec.alpha;
            cloud.restAlpha = spec.alpha;
            cloud.speed = spec.speed;

            // Off one edge and on at the other, so the turn round never shows.
            cloud.edge = CONTENT_W / 2 + CLOUD_ART_W * spec.scale / 2 + CLOUD_EDGE;

            this.content.add(cloud);
            this.clouds.push(cloud);
        }
    }

    buildPlate() {
        const plate = this.scene.add.container(0, PLATE_Y);

        const face = this.scene.add.sprite(0, 0, 'sheet', PLATE);
        face.setScale(ART_SCALE);
        plate.add(face);

        this.plateText = this.scene.add.text(0, 0, 'Level ' + this.level, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: PLATE_SIZE,
            color: INK
        });
        this.plateText.setOrigin(.5);
        this.plateText.setResolution(this.textRes);
        plate.add(this.plateText);

        this.plate = plate;
        this.content.add(plate);
    }

    buildPlay() {
        const play = this.scene.add.container(0, PLAY_Y);

        const face = this.scene.add.sprite(0, 0, 'sheet', PLAY_FACE);
        face.setScale(ART_SCALE);
        play.add(face);

        const icon = this.scene.add.sprite(PLAY_ICON_X, PLAY_ICON_Y, 'sheet', PLAY_ICON);
        icon.setScale(PLAY_ICON_SCALE);
        play.add(icon);

        const label = this.scene.add.text(PLAY_LABEL_X, PLAY_LABEL_Y, 'Play', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: PLAY_LABEL_SIZE,
            color: '#ffffff'
        });
        label.setOrigin(.5);
        label.setResolution(this.textRes);
        play.add(label);

        pressable(this.scene, play, PLAY_HIT_W, PLAY_HIT_H, () => this.play());

        this.playButton = play;
        this.content.add(play);
    }

    /** Walks the clouds along. The scene ticks this while the screen is up. */
    update(time, delta) {
        if (!this.visible) return;

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];

            cloud.x += cloud.speed * delta / 1000;

            if (cloud.x > cloud.edge) cloud.x = -cloud.edge;
        }
    }

    setLevel(level) {
        this.level = level;
        this.plateText.setText('Level ' + level);
    }

    /** Gets out of the way of the board and hands over to whoever is waiting. */
    play() {
        if (!this.visible) return;

        this.scene.tweens.killTweensOf(this);

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.hide();
                this.alpha = 1;

                if (this.onPlay) this.onPlay();
            }
        });
    }

    /** Brings the screen on a piece at a time. */
    intro() {
        for (let i = 0; i < INTRO.length; i++) {
            const step = INTRO[i];
            const piece = this[step.piece];

            this.scene.tweens.killTweensOf(piece);

            piece.x = piece.restX + (step.dx || 0);
            piece.y = piece.restY + (step.dy || 0);
            piece.alpha = 0;

            this.scene.tweens.add({
                targets: piece,
                alpha: 1,
                duration: INTRO_FADE,
                delay: step.delay,
                ease: 'Quad.easeOut'
            });

            const run = {
                targets: piece,
                x: piece.restX,
                y: piece.restY,
                duration: step.duration,
                delay: step.delay,
                ease: step.ease,
                onComplete: () => this.settle(piece, step)
            };

            if (step.scale) {
                piece.setScale(piece.introScale * step.scale);
                run.scale = piece.introScale;
            }

            this.scene.tweens.add(run);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];

            this.scene.tweens.killTweensOf(cloud);

            cloud.alpha = 0;
            this.scene.tweens.add({
                targets: cloud,
                alpha: cloud.restAlpha,
                duration: INTRO_CLOUD_TIME,
                ease: 'Quad.easeOut'
            });
        }
    }

    /** The bit of give at the end of a big move. */
    settle(piece, step) {
        if (step.pulse) {
            this.scene.tweens.add({
                targets: piece,
                scale: piece.introScale * step.pulse,
                duration: INTRO_SETTLE,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        }

        if (step.bob) {
            this.scene.tweens.add({
                targets: piece,
                y: piece.restY + step.bob,
                duration: INTRO_SETTLE,
                ease: 'Sine.easeInOut',
                yoyo: true
            });
        }
    }

    show() {
        this.visible = true;
        this.alpha = 1;

        this.intro();
    }

    hide() {
        this.visible = false;
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        // The sky has to reach the edges of whatever screen the game is on,
        // not just the box the screen is laid out in.
        this.sky.setSize(dimensions.actualWidth, dimensions.actualHeight);

        this.content.setScale(Math.min(
            1,
            (dimensions.gameHeight - CONTENT_MARGIN * 2) / CONTENT_H,
            (dimensions.gameWidth - CONTENT_MARGIN * 2) / CONTENT_W
        ));
    }
}
