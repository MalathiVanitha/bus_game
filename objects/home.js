import { pressable } from '../utils/buttons.js';
import { Store } from './store.js';

const SKY = 0x98ddfc;

const ART_SCALE = 0.6;

const INK = '#283085';

const LOGO = 'home/logo';
const LOGO_Y = -240;
const LOGO_SCALE = 0.525;

const GLEAM_WARM = 0xfff4d8;

const GLEAM_TIME = 1100;
const GLEAM_HOLD = 140;
const GLEAM_DELAY = 1250;

const HALO_STRENGTH = 2.4;
const HALO_QUALITY = 0.16;
const HALO_DISTANCE = 16;

const CLOUD = 'home/cloud';
const CLOUD_ART_W = 300;
const CLOUD_EDGE = 20;
const CLOUDS = [
    { x: -90, y: -118, scale: 0.5, alpha: 0.9, speed: 7 },
    { x: 150, y: -62, scale: 0.34, alpha: 0.7, speed: 4.5, flip: true }
];

const CONVOY = 'home/convoy';
const CONVOY_Y = 0;

const PLATE = 'home/level-plate';
const PLATE_Y = 150;
const PLATE_SIZE = 44;

const PLAY_FACE = 'home/play-button';
const PLAY_Y = 270;

const PLAY_HIT_W = 470;
const PLAY_HIT_H = 120;

const PLAY_ICON = 'home/play-icon';
const PLAY_ICON_X = -95;
const PLAY_ICON_Y = 0;
const PLAY_ICON_SCALE = ART_SCALE + .25;

const PLAY_LABEL_X = 31;
const PLAY_LABEL_Y = -4;
const PLAY_LABEL_SIZE = 70;

const STORE_Y = 390;

const CONTENT_W = 540;
const CONTENT_H = 960;
const CONTENT_MARGIN = 12;

const PUSH_FROM = 1.06;
const PUSH_TIME = 900;

const SWEEP = 620;

const INTRO = [
    { piece: 'logo', scale: 0.4, dy: -40, angle: -8, duration: 620, delay: 0, ease: 'Back.easeOut', pulse: 1.04 },
    { piece: 'convoy', dx: 560, duration: 820, delay: 200, ease: 'Quart.easeOut', hop: true },
    { piece: 'plate', dx: -SWEEP, duration: 480, delay: 430, ease: 'Back.easeOut' },
    { piece: 'playButton', dx: SWEEP, duration: 480, delay: 520, ease: 'Back.easeOut' },
    { piece: 'store', dx: -SWEEP, duration: 480, delay: 610, ease: 'Back.easeOut' }
];

const HOPS = [
    { height: 34, duration: 290, tilt: 3.5 },
    { height: 19, duration: 225, tilt: 2.2 },
    { height: 10, duration: 170, tilt: 1.2 },
    { height: 4, duration: 120, tilt: 0.6 }
];

const HOP_STRETCH = 0.07;
const HOP_NARROW = 0.6;
const HOP_SQUASH = 0.1;
const HOP_SQUASH_TIME = 130;

const INTRO_FADE = 240;
const INTRO_SETTLE = 170;

const INTRO_CLOUD_TIME = 900;

const IDLE_DELAY = 1250;

const PLAY_BREATH = 1.035;
const PLAY_BREATH_TIME = 780;

const CONVOY_BOB = 3;
const CONVOY_BOB_TIME = 900;

const LOGO_SWAY = 1.2;
const LOGO_SWAY_TIME = 2400;

const OUTRO = [
    { piece: 'store', dx: -SWEEP, duration: 340, delay: 0 },
    { piece: 'playButton', dx: SWEEP, duration: 340, delay: 50 },
    { piece: 'plate', dx: -SWEEP, duration: 340, delay: 100 },
    { piece: 'convoy', dx: 640, duration: 420, delay: 120, ease: 'Quart.easeIn', squat: true },
    { piece: 'logo', dy: -60, scale: 0.8, angle: 6, duration: 380, delay: 200, ease: 'Back.easeIn' }
];

const OUTRO_EASE = 'Back.easeIn';
const OUTRO_FADE = 200;

const OUTRO_SQUAT = 0.9;
const OUTRO_SQUAT_TIME = 110;

const OUTRO_PUSH = 1.04;
const OUTRO_SKY_TIME = 380;
const OUTRO_SKY_DELAY = 220;
const OUTRO_CLOUD_TIME = 320;

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

        this.content = this.scene.add.container(0, 0);
        this.add(this.content);

        this.buildClouds();

        this.logo = this.scene.add.sprite(0, LOGO_Y, 'sheet', LOGO);
        this.logo.setScale(LOGO_SCALE);
        this.content.add(this.logo);

        this.buildGleam();

        this.convoy = this.scene.add.sprite(0, CONVOY_Y, 'sheet', CONVOY);
        this.convoy.setScale(ART_SCALE);
        this.content.add(this.convoy);

        this.buildPlate();
        this.buildPlay();

        this.store = new Store(this.scene, 0, STORE_Y);
        this.content.add(this.store);

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

        this.plateText = this.scene.add.text(0, -2, 'Level ' + this.level, {
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

        const body = this.scene.add.container(0, 0);
        play.add(body);

        const face = this.scene.add.sprite(0, 0, 'sheet', PLAY_FACE);
        face.setScale(ART_SCALE);
        body.add(face);

        const icon = this.scene.add.sprite(PLAY_ICON_X, PLAY_ICON_Y, 'sheet', PLAY_ICON);
        icon.setScale(PLAY_ICON_SCALE);
        body.add(icon);

        const label = this.scene.add.text(PLAY_LABEL_X, PLAY_LABEL_Y, 'Play', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: PLAY_LABEL_SIZE,
            color: '#ffffff',
            stroke: "#118a00",
            strokeThickness: 4
        });
        label.setOrigin(.5);
        label.setResolution(this.textRes);
        body.add(label);

        pressable(this.scene, play, PLAY_HIT_W, PLAY_HIT_H, () => this.play());

        this.playBody = body;
        this.playButton = play;
        this.content.add(play);
    }

    buildGleam() {
        this.halo = this.logo.postFX.addGlow(GLEAM_WARM, 0, 0, false, HALO_QUALITY, HALO_DISTANCE);
    }

    startGleam() {
        this.stopGleam();

        this.gleam = this.scene.tweens.add({
            targets: this.halo,
            outerStrength: HALO_STRENGTH,
            duration: GLEAM_TIME,
            delay: GLEAM_DELAY,
            hold: GLEAM_HOLD,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    stopGleam() {
        this.scene.tweens.killTweensOf(this.halo);

        this.gleam = null;

        this.halo.outerStrength = 0;
    }

    startIdle() {
        this.stopIdle();

        this.idleTimer = this.scene.time.delayedCall(IDLE_DELAY, () => {
            this.idleTimer = null;

            if (!this.visible || this.leaving) return;

            this.idle = [
                this.scene.tweens.add({
                    targets: this.playBody,
                    scale: PLAY_BREATH,
                    duration: PLAY_BREATH_TIME,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                }),
                this.scene.tweens.add({
                    targets: this.convoy,
                    y: this.convoy.restY - CONVOY_BOB,
                    duration: CONVOY_BOB_TIME,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                }),
                this.scene.tweens.add({
                    targets: this.logo,
                    angle: { from: -LOGO_SWAY, to: LOGO_SWAY },
                    duration: LOGO_SWAY_TIME,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                })
            ];
        });
    }

    stopIdle() {
        if (this.idleTimer) {
            this.idleTimer.remove();
            this.idleTimer = null;
        }

        if (this.idle) {
            for (let i = 0; i < this.idle.length; i++) this.idle[i].remove();

            this.idle = null;
        }

        this.playBody.setScale(1);
    }

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

    play() {
        if (!this.visible || this.leaving) return;

        this.leaving = true;
        this.introRun = (this.introRun || 0) + 1;

        this.stopIdle();
        this.scene.events.emit('home:leaving');

        const fit = this.fitScale || 1;

        let last = 0;

        for (let i = 0; i < OUTRO.length; i++) {
            const step = OUTRO[i];
            const piece = this[step.piece];

            this.scene.tweens.killTweensOf(piece);

            if (piece.hops) {
                piece.hops.destroy();
                piece.hops = null;
            }

            piece.x = piece.restX;
            piece.y = piece.restY;
            piece.angle = 0;
            piece.alpha = 1;
            piece.setScale(piece.introScale);

            const go = {
                targets: piece,
                x: piece.restX + (step.dx || 0),
                y: piece.restY + (step.dy || 0),
                angle: step.angle || 0,
                duration: step.duration,
                delay: step.delay,
                ease: step.ease || OUTRO_EASE
            };

            if (step.scale) go.scale = piece.introScale * step.scale;

            if (step.squat) {
                go.delay += OUTRO_SQUAT_TIME;

                this.scene.tweens.add({
                    targets: piece,
                    scaleY: piece.introScale * OUTRO_SQUAT,
                    scaleX: piece.introScale * (2 - OUTRO_SQUAT),
                    duration: OUTRO_SQUAT_TIME,
                    delay: step.delay,
                    ease: 'Quad.easeOut',
                    yoyo: true
                });
            }

            this.scene.tweens.add(go);

            this.scene.tweens.add({
                targets: piece,
                alpha: 0,
                duration: OUTRO_FADE,
                delay: go.delay + go.duration - OUTRO_FADE,
                ease: 'Quad.easeIn'
            });

            last = Math.max(last, go.delay + go.duration);
        }

        for (let i = 0; i < this.clouds.length; i++) {
            this.scene.tweens.killTweensOf(this.clouds[i]);
            this.scene.tweens.add({
                targets: this.clouds[i],
                alpha: 0,
                duration: OUTRO_CLOUD_TIME,
                delay: OUTRO_SKY_DELAY,
                ease: 'Quad.easeIn'
            });
        }

        this.scene.tweens.killTweensOf(this.content);
        this.scene.tweens.add({
            targets: this.content,
            scale: fit * OUTRO_PUSH,
            duration: last,
            ease: 'Sine.easeIn'
        });

        this.scene.tweens.killTweensOf(this.sky);
        this.scene.tweens.add({
            targets: this.sky,
            alpha: 0,
            duration: OUTRO_SKY_TIME,
            delay: OUTRO_SKY_DELAY,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.hide();

                if (this.onPlay) this.onPlay();
            }
        });
    }

    intro() {
        const fit = this.fitScale || 1;

        this.introRun = (this.introRun || 0) + 1;

        const run = this.introRun;

        this.scene.tweens.killTweensOf(this.sky);
        this.sky.alpha = 1;

        this.scene.tweens.killTweensOf(this.content);
        this.content.setScale(fit * PUSH_FROM);

        this.scene.tweens.add({
            targets: this.content,
            scale: fit,
            duration: PUSH_TIME,
            ease: 'Sine.easeOut'
        });

        for (let i = 0; i < INTRO.length; i++) {
            const step = INTRO[i];
            const piece = this[step.piece];

            this.scene.tweens.killTweensOf(piece);

            if (piece.hops) {
                piece.hops.destroy();
                piece.hops = null;
            }

            piece.x = piece.restX + (step.dx || 0);
            piece.y = piece.restY + (step.dy || 0);
            piece.angle = step.angle || 0;
            piece.alpha = 0;

            piece.setScale(piece.introScale);

            this.scene.tweens.add({
                targets: piece,
                alpha: 1,
                duration: INTRO_FADE,
                delay: step.delay,
                ease: 'Quad.easeOut'
            });

            const drive = {
                targets: piece,
                x: piece.restX,
                duration: step.duration,
                delay: step.delay,
                ease: step.ease,
                onComplete: () => this.settle(piece, step)
            };

            if (step.hop) {
                this.hopIn(piece, step, run);
            } else {
                drive.y = piece.restY;
                drive.angle = 0;
            }

            if (step.scale) {
                piece.setScale(piece.introScale * step.scale);
                drive.scale = piece.introScale;
            }

            this.scene.tweens.add(drive);
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

        this.startGleam();
        this.startIdle();
    }

    hopIn(piece, step, run) {
        if (piece.hops) piece.hops.destroy();

        const rest = piece.introScale;

        piece.hops = this.scene.tweens.chain({
            targets: piece,
            delay: step.delay,
            tweens: HOPS.map((hop) => {
                const share = hop.height / HOPS[0].height;

                return {
                    y: piece.restY - hop.height,
                    angle: hop.tilt,
                    scaleX: rest * (1 - HOP_STRETCH * share * HOP_NARROW),
                    scaleY: rest * (1 + HOP_STRETCH * share),
                    duration: hop.duration / 2,
                    ease: 'Quad.easeOut',
                    yoyo: true,
                    onComplete: () => this.squash(piece, share, run)
                };
            })
        });
    }

    squash(piece, share, run) {
        if (run !== this.introRun) return;

        const rest = piece.introScale;

        this.scene.tweens.add({
            targets: piece,
            scaleX: rest * (1 + HOP_SQUASH * share),
            scaleY: rest * (1 - HOP_SQUASH * share),
            duration: HOP_SQUASH_TIME * (0.6 + 0.4 * share),
            ease: 'Quad.easeOut',
            yoyo: true
        });
    }

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
        this.leaving = false;

        this.intro();
    }

    hide() {
        this.visible = false;

        this.stopGleam();
        this.stopIdle();
    }

    destroy(fromScene) {
        this.stopGleam();
        this.stopIdle();

        super.destroy(fromScene);
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        this.sky.setSize(dimensions.actualWidth, dimensions.actualHeight);

        this.fitScale = Math.min(
            1,
            (dimensions.gameHeight - CONTENT_MARGIN * 2) / CONTENT_H,
            (dimensions.gameWidth - CONTENT_MARGIN * 2) / CONTENT_W
        );

        this.content.setScale(this.fitScale);
    }
}