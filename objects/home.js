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

// The logo's colour washes out towards white, holds a beat, and eases back to
// full. TINT_WHITE is how much white is mixed in at the peak.
const TINT_WHITE = 0.35;
const WHITE = [
    0, 0, 0, 0, 255,
    0, 0, 0, 0, 255,
    0, 0, 0, 0, 255,
    0, 0, 0, 1, 0
];
const TINT_TIME = 950;
const TINT_HOLD = 180;
const TINT_REST = 1600;
const TINT_DELAY = 1900;

const GLINT = 'fx-glint';
const GLINT_ART = 256;

// Spots on the logo's own specular highlights, in the untrimmed 960x560 art,
// from its centre. size is the glint's peak width in that art.
const GLINTS = [
    { x: -385, y: -175, size: 180 },
    { x: 250, y: 2, size: 150 },
    { x: 35, y: -162, size: 120 },
    { x: -180, y: 25, size: 170 },
    { x: 360, y: -182, size: 140 }
];

const GLINT_TIME = 620;
const GLINT_SPIN = 90;
const GLINT_STAGGER = 380;
const GLINT_INTERVAL = 3200;
const GLINT_DELAY = 800;

const CLOUD = 'home/cloud';
const CLOUD_ART_W = 300;
const CLOUD_EDGE = 20;
const CLOUDS = [
    { x: -90, y: -118, scale: 0.5, alpha: 0.9, speed: 7 },
    { x: 150, y: -62, scale: 0.34, alpha: 0.7, speed: 4.5, flip: true }
];

const CONVOY = 'home/convoy';
const CONVOY_Y = 0;

// Soft shadow on the ground under the wheels, drawn once into a canvas.
const CONVOY_SHADOW = 'homeConvoyShadow';
const CONVOY_SHADOW_W = 256;
const CONVOY_SHADOW_H = 64;
const CONVOY_SHADOW_COLOR = '40,48,133';
const CONVOY_SHADOW_ALPHA = 0.42;
const CONVOY_SHADOW_SPAN = 1;
const CONVOY_SHADOW_DEPTH = 30;
// The art has clear space under the tyres: they meet the ground this many art
// pixels above the bottom of the frame.
const CONVOY_WHEEL_LINE = 46;
const CONVOY_SHADOW_DY = -3;
// How much the shadow shrinks and fades per pixel the convoy is off the ground.
const CONVOY_SHADOW_SHRINK = 0.006;
const CONVOY_SHADOW_FADE = 0.018;

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

// Degrees; negative tips the tractor end (on the left) down.
const CONVOY_BRAKE = -1.6;

const INTRO = [
    { piece: 'logo', scale: 0.4, dy: -40, angle: -8, duration: 620, delay: 0, ease: 'Back.easeOut', pulse: 1.04 },
    { piece: 'convoy', dx: 560, duration: 1000, delay: 200, ease: 'Cubic.easeOut', brake: CONVOY_BRAKE },
    { piece: 'plate', dx: -SWEEP, duration: 480, delay: 430, ease: 'Back.easeOut' },
    { piece: 'playButton', dx: SWEEP, duration: 480, delay: 520, ease: 'Back.easeOut' },
    { piece: 'store', dx: -SWEEP, duration: 480, delay: 610, ease: 'Back.easeOut' }
];

// The convoy dips its nose as it brakes to a stop, then rocks back level:
// the dip starts this far through the drive and takes as long again to recover.
const BRAKE_FROM = 0.6;

const INTRO_FADE = 240;
const INTRO_SETTLE = 170;

const INTRO_CLOUD_TIME = 900;

// After the convoy has braked and levelled out, so its rock does not fight it.
const IDLE_DELAY = 1700;

const PLAY_BREATH = 1.035;
const PLAY_BREATH_TIME = 780;

const CONVOY_BOB = 3;
const CONVOY_BOB_TIME = 900;
// Stretches a touch as it lifts and settles back as it lands.
const CONVOY_STRETCH = 0.018;
const CONVOY_NARROW = 0.006;
// Rocks on its wheels, slower than the bob so the two never line up.
const CONVOY_ROCK = 0.8;
const CONVOY_ROCK_TIME = 2900;

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

        this.buildConvoyShadow();

        // Stood on its wheels, so squash, stretch and tilt pivot on the ground.
        this.convoy = this.scene.add.sprite(0, CONVOY_Y, 'sheet', CONVOY);
        this.convoy.setScale(ART_SCALE);
        this.convoy.setOrigin(0.5, 1);
        this.convoy.y += this.convoy.displayHeight / 2;
        this.content.add(this.convoy);

        this.convoyShadow.baseScale = this.convoy.displayWidth * CONVOY_SHADOW_SPAN / CONVOY_SHADOW_W;

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

    buildConvoyShadow() {
        const textures = this.scene.textures;

        if (!textures.exists(CONVOY_SHADOW)) {
            const canvas = textures.createCanvas(CONVOY_SHADOW, CONVOY_SHADOW_W, CONVOY_SHADOW_H);
            const ctx = canvas.getContext();
            const r = CONVOY_SHADOW_W / 2;

            ctx.save();
            ctx.scale(1, CONVOY_SHADOW_H / CONVOY_SHADOW_W);

            const fall = ctx.createRadialGradient(r, r, 0, r, r, r);
            fall.addColorStop(0, `rgba(${CONVOY_SHADOW_COLOR},1)`);
            fall.addColorStop(0.55, `rgba(${CONVOY_SHADOW_COLOR},0.6)`);
            fall.addColorStop(1, `rgba(${CONVOY_SHADOW_COLOR},0)`);

            ctx.fillStyle = fall;
            ctx.fillRect(0, 0, CONVOY_SHADOW_W, CONVOY_SHADOW_W);
            ctx.restore();

            canvas.refresh();
        }

        this.convoyShadow = this.scene.add.image(0, 0, CONVOY_SHADOW);
        this.convoyShadow.alpha = 0;
        this.content.add(this.convoyShadow);
    }

    // Keeps the shadow under the wheels, smaller and fainter the higher the
    // convoy is, through the idle bob and the drive off.
    placeConvoyShadow() {
        const convoy = this.convoy;
        const shadow = this.convoyShadow;
        const lift = Math.max(0, convoy.restY - convoy.y);
        const size = convoy.scaleX / convoy.introScale;

        shadow.x = convoy.x;
        shadow.y = convoy.restY - CONVOY_WHEEL_LINE * convoy.introScale + CONVOY_SHADOW_DY;
        shadow.scaleX = shadow.baseScale * size * Math.max(0.5, 1 - lift * CONVOY_SHADOW_SHRINK);
        shadow.scaleY = CONVOY_SHADOW_DEPTH / CONVOY_SHADOW_H * shadow.scaleX / shadow.baseScale;
        shadow.alpha = CONVOY_SHADOW_ALPHA * convoy.alpha * Math.max(0, 1 - lift * CONVOY_SHADOW_FADE);
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

        // With onPlayPress set, the press asks first (the level card) and play()
        // is left to whatever it opens.
        pressable(this.scene, play, PLAY_HIT_W, PLAY_HIT_H, () => {
            if (this.onPlayPress) this.onPlayPress();
            else this.play();
        });

        this.playBody = body;
        this.playButton = play;
        this.content.add(play);
    }

    buildGleam() {
        // Ahead of the glow, so the halo stays bright while the logo dims.
        // Solid white, blended in by its alpha. The filter keeps the logo's
        // own alpha, so the white stays inside the logo's outline.
        this.logoTint = this.logo.postFX.addColorMatrix();
        this.logoTint.set(WHITE);
        this.tintDepth = 0;

        this.halo = this.logo.postFX.addGlow(GLEAM_WARM, 0, 0, false, HALO_QUALITY, HALO_DISTANCE);

        this.glints = [];

        let above = this.content.getIndex(this.logo);

        for (let i = 0; i < GLINTS.length; i++) {
            const glint = this.scene.add.image(0, 0, GLINT);

            glint.spot = GLINTS[i];
            glint.setBlendMode(Phaser.BlendModes.ADD);
            glint.setVisible(false);

            this.content.addAt(glint, ++above);
            this.glints.push(glint);
        }
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

        this.tintTween = this.scene.tweens.add({
            targets: this,
            tintDepth: 1,
            duration: TINT_TIME,
            delay: TINT_DELAY,
            hold: TINT_HOLD,
            repeatDelay: TINT_REST,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onUpdate: () => this.applyTint()
        });

        this.glintTimer = this.scene.time.addEvent({
            delay: GLINT_INTERVAL,
            loop: true,
            startAt: GLINT_INTERVAL - GLINT_DELAY,
            callback: () => this.twinkle()
        });
    }

    applyTint() {
        this.logoTint.alpha = TINT_WHITE * this.tintDepth;
    }

    // Each glint pops open on its highlight, turns a quarter and closes again,
    // one after another, so the logo reads as catching the light.
    twinkle() {
        for (let i = 0; i < this.glints.length; i++) {
            const glint = this.glints[i];

            glint.bloom = 0;
            glint.turn = 0;

            this.scene.tweens.add({
                targets: glint,
                bloom: 1,
                duration: GLINT_TIME / 2,
                delay: i * GLINT_STAGGER,
                ease: 'Quad.easeOut',
                yoyo: true,
                onStart: () => glint.setVisible(true),
                onComplete: () => glint.setVisible(false)
            });

            this.scene.tweens.add({
                targets: glint,
                turn: GLINT_SPIN,
                duration: GLINT_TIME,
                delay: i * GLINT_STAGGER,
                ease: 'Sine.easeInOut'
            });
        }
    }

    // Pins the glints to the logo's art while it moves, scales and sways.
    placeGlints() {
        const logo = this.logo;
        const cos = Math.cos(logo.rotation);
        const sin = Math.sin(logo.rotation);

        for (let i = 0; i < this.glints.length; i++) {
            const glint = this.glints[i];

            if (!glint.visible) continue;

            const spot = glint.spot;
            const dx = spot.x * logo.scaleX;
            const dy = spot.y * logo.scaleY;

            glint.x = logo.x + dx * cos - dy * sin;
            glint.y = logo.y + dx * sin + dy * cos;
            glint.angle = logo.angle + glint.turn;
            glint.setScale(glint.bloom * spot.size / GLINT_ART * logo.scaleX);
            glint.alpha = logo.alpha;
        }
    }

    stopGlints() {
        if (this.glintTimer) {
            this.glintTimer.remove(false);
            this.glintTimer = null;
        }

        for (let i = 0; i < this.glints.length; i++) {
            this.scene.tweens.killTweensOf(this.glints[i]);
            this.glints[i].setVisible(false);
        }
    }

    stopGleam() {
        this.scene.tweens.killTweensOf(this.halo);

        if (this.tintTween) {
            this.tintTween.remove();
            this.tintTween = null;
        }

        this.tintDepth = 0;
        this.applyTint();
        this.stopGlints();

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
                    scaleX: this.convoy.introScale * (1 - CONVOY_NARROW),
                    scaleY: this.convoy.introScale * (1 + CONVOY_STRETCH),
                    duration: CONVOY_BOB_TIME,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                }),
                this.sway(this.logo, LOGO_SWAY, LOGO_SWAY_TIME),
                this.sway(this.convoy, CONVOY_ROCK, CONVOY_ROCK_TIME)
            ];
        });
    }

    // Eases out of rest to one side first, so the sway picks up from wherever
    // the piece is instead of snapping to -amount, then rocks side to side.
    sway(target, amount, time) {
        return this.scene.tweens.add({
            targets: target,
            angle: amount,
            duration: time / 2,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (!this.idle) return;

                this.idle.push(this.scene.tweens.add({
                    targets: target,
                    angle: -amount,
                    duration: time,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                }));
            }
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

        this.placeGlints();
        this.placeConvoyShadow();

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

        // Out of reach while it flies off: the press's own pointerout would
        // otherwise kill its tweens and leave it stuck where it was tapped.
        this.playButton.disableInteractive();

        this.stopIdle();
        this.stopGlints();
        this.scene.events.emit('home:leaving');

        const fit = this.fitScale || 1;
        const run = this.introRun;

        let last = 0;

        // Whichever fade ends last: the piece fades, then the sky's below.
        let final = { delay: 0, duration: 0 };

        const fadesLater = (delay, duration) => {
            if (delay + duration >= final.delay + final.duration) final = { delay, duration };
        };

        for (let i = 0; i < OUTRO.length; i++) {
            const step = OUTRO[i];
            const piece = this[step.piece];

            this.scene.tweens.killTweensOf(piece);

            // Leaves from wherever the idle bob, sway or intro has it, rather
            // than snapping back to rest first.
            const size = piece.introScale * (step.scale || 1);

            const go = {
                targets: piece,
                x: piece.restX + (step.dx || 0),
                y: piece.restY + (step.dy || 0),
                angle: step.angle || 0,
                duration: step.duration,
                delay: step.delay,
                scaleX: size,
                scaleY: size,
                ease: step.ease || OUTRO_EASE
            };

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

            fadesLater(go.delay + go.duration - OUTRO_FADE, OUTRO_FADE);

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
            ease: 'Quad.easeIn'
        });

        fadesLater(OUTRO_SKY_DELAY, OUTRO_SKY_TIME);

        // Hands over once the last piece and the sky have faded right out. A
        // tween of its own, rather than a timer (which runs on a separate
        // clock and can fire early) or one of the pieces' tweens (which
        // anything touching that piece could kill). It copies the last fade's
        // delay as well as its length, since a delayed tween can end a frame
        // behind an undelayed one of the same total time.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            delay: final.delay,
            duration: final.duration,
            onComplete: () => {
                if (run !== this.introRun || !this.leaving) return;

                this.hide();

                if (this.onPlay) this.onPlay();
            }
        });
    }

    intro() {
        const fit = this.fitScale || 1;

        this.introRun = (this.introRun || 0) + 1;

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
                y: piece.restY,
                ease: step.ease,
                onComplete: () => this.settle(piece, step)
            };

            if (step.brake) {
                // Nose down as it slows, level again once it has stopped.
                const dip = step.duration * (1 - BRAKE_FROM);

                this.scene.tweens.add({
                    targets: piece,
                    angle: step.brake,
                    duration: dip,
                    delay: step.delay + step.duration * BRAKE_FROM,
                    ease: 'Sine.easeInOut',
                    yoyo: true
                });
            } else {
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

        this.playButton.setInteractive();

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