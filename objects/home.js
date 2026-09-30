import { pressable } from '../utils/buttons.js';
import { Store } from './store.js';
import perf from '../utils/perf.js';

const SKY = 0x98ddfc;

const ART_SCALE = 0.6;


const LOGO = 'home/logo';
const LOGO_Y = -240;
const LOGO_SCALE = 0.525;

const GLEAM_WARM = 0xfff4d8;

const GLEAM_TIME = 1100;
const GLEAM_HOLD = 140;
const GLEAM_DELAY = 1250;

// The halo never goes out: it breathes between HALO_REST and HALO_STRENGTH.
const HALO_REST = 2.5;
const HALO_STRENGTH = 7;
const HALO_QUALITY = 0.2;
const HALO_DISTANCE = 32;

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

// The yellow dashes either side of "Out!", in the untrimmed 960x560 art from
// its centre: middle, angle (degrees) and size of each. Every so often they
// flick out from the word - a copy cut from the art stretches from its inner
// end and springs back - and pop a few candy circles and a ring off the tip.
const DASHES = [
    { x: 340, y: 72, angle: 3.2, length: 72, width: 37, wave: 0 },
    { x: 307, y: 127, angle: 50.2, length: 65, width: 34, wave: 1 },
    { x: -308, y: 99, angle: -10.2, length: 75, width: 38, wave: 0 },
    { x: -278, y: 155, angle: -49.8, length: 70, width: 35, wave: 1 }
];
// Out is away from here, the middle of "Out!".
const DASH_FROM_X = 0;
const DASH_FROM_Y = 100;
const DASH_TEXTURE = 'home-dash-';
// Art pixels round each dash kept in its cut, and how far down its shadow sits.
const DASH_PAD = 12;
const DASH_EDGE = 5;
const DASH_SHADOW = 7;

const FLICK_STRETCH = 1.24;
const FLICK_SWELL = 1.06;
const FLICK_OUT = 150;
const FLICK_BACK = 520;
const FLICK_WAVE = 110;
const FLICK_INTERVAL = 2800;
const FLICK_DELAY = 900;

// Candy circles off the tip, sizes and distances in art pixels.
const POP_COLORS = [0xffc014, 0xffe27a, 0xffa412];
const POP_SPREAD = 0.55;
const POP_JITTER = 0.15;
const POP_REACH = 30;
const POP_REACH_RANGE = 18;
const POP_SIZE = 13;
const POP_SIZE_RANGE = 5;
const POP_LIFE = 520;
const POP_LIFE_RANGE = 140;
// Of each circle's life: how long it takes to pop in, and when it starts to go.
const POP_IN = 0.22;
const POP_OUT = 0.55;
const POP_OVERSHOOT = 2;

const RING_COLOR = 0xffc014;
const RING_FROM = 10;
const RING_TO = 40;
const RING_LINE = 7;
const RING_LIFE = 420;

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

        this.buildFlourish();
        this.buildGleam();

        this.buildConvoyShadow();

        // Stood on its wheels, so squash, stretch and tilt pivot on the ground.
        this.convoy = this.scene.add.sprite(0, CONVOY_Y, 'sheet', CONVOY);
        this.convoy.setScale(ART_SCALE);
        this.convoy.setOrigin(0.5, 1);
        this.convoy.y += this.convoy.displayHeight / 2;
        this.content.add(this.convoy);

        this.convoyShadow.baseScale = this.convoy.displayWidth * CONVOY_SHADOW_SPAN / CONVOY_SHADOW_W;

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

    // The dashes' copies and the circles they pop sit in a container that
    // follows the logo, in the logo art's own coordinates.
    buildFlourish() {
        this.flourish = this.scene.add.container(0, 0);
        this.flourish.setVisible(false);
        this.content.add(this.flourish);

        this.dashes = [];
        this.pops = [];

        const frame = this.scene.textures.getFrame('sheet', LOGO);

        for (let i = 0; i < DASHES.length; i++) {
            const spec = DASHES[i];
            let turn = Phaser.Math.DegToRad(spec.angle);

            if (Math.cos(turn) * (spec.x - DASH_FROM_X) + Math.sin(turn) * (spec.y - DASH_FROM_Y) < 0) {
                turn += Math.PI;
            }

            const cos = Math.cos(turn);
            const sin = Math.sin(turn);
            const innerX = spec.x - cos * spec.length / 2;
            const innerY = spec.y - sin * spec.length / 2;
            const key = this.cutDash(i, frame, spec, turn, innerX, innerY);

            if (!key) continue;

            const dash = this.scene.add.image(innerX, innerY, key);

            dash.setOrigin(DASH_PAD / dash.width, (spec.width / 2 + DASH_PAD) / dash.height);
            dash.setRotation(turn);
            dash.setVisible(false);
            dash.spec = spec;
            dash.tipX = spec.x + cos * spec.length / 2;
            dash.tipY = spec.y + sin * spec.length / 2;
            dash.turn = turn;

            this.flourish.add(dash);
            this.dashes.push(dash);
        }

        this.popGraphics = this.scene.add.graphics();
        this.flourish.add(this.popGraphics);
    }

    // One dash (and its shadow) cut out of the logo art into its own canvas,
    // laid along its length from the inner end, with the white round it made
    // clear. The inside is kept whole, so its shine stretches with it.
    cutDash(index, frame, spec, turn, innerX, innerY) {
        const key = DASH_TEXTURE + index;

        if (this.scene.textures.exists(key)) return key;

        const image = frame.source.image;

        if (!image) return null;

        const w = Math.ceil(spec.length + DASH_PAD * 2);
        const h = Math.ceil(spec.width + DASH_PAD * 2 + DASH_SHADOW);
        const canvas = document.createElement('canvas');

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const middleY = spec.width / 2 + DASH_PAD;

        // The art's centre in the trimmed frame.
        const artX = frame.realWidth / 2 - frame.x;
        const artY = frame.realHeight / 2 - frame.y;

        ctx.translate(DASH_PAD, middleY);
        ctx.rotate(-turn);
        ctx.translate(-(artX + innerX), -(artY + innerY));
        ctx.drawImage(image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
            0, 0, frame.cutWidth, frame.cutHeight);

        const pixels = ctx.getImageData(0, 0, w, h);
        const data = pixels.data;
        const half = spec.length / 2;
        const radius = spec.width / 2;
        // The shadow sits straight down in the art, so at a slant along the dash.
        const shadowU = Math.sin(turn) * DASH_SHADOW;
        const shadowV = Math.cos(turn) * DASH_SHADOW;
        const away = (u, v) => Math.hypot(Math.max(0, Math.abs(u - half) - (half - radius)), v) - radius;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const u = x + 0.5 - DASH_PAD;
                const v = y + 0.5 - middleY;
                const body = away(u, v);
                const edge = Math.min(body, away(u - shadowU, v - shadowV));

                if (body <= -3) continue;

                if (edge > DASH_EDGE) {
                    data[i + 3] = 0;
                    continue;
                }

                // Near the edge, only what is not the white round it.
                const ink = Math.max(255 - data[i], 255 - data[i + 1], 255 - data[i + 2]);

                data[i + 3] *= Math.min(1, Math.max(0, (ink - 6) / 30));
            }
        }

        ctx.putImageData(pixels, 0, 0);
        this.scene.textures.addCanvas(key, canvas);

        return key;
    }

    startFlourish() {
        this.stopFlourish();

        if (!this.dashes.length) return;

        this.flourish.setVisible(true);

        this.flickTimer = this.scene.time.addEvent({
            delay: FLICK_INTERVAL,
            loop: true,
            startAt: FLICK_INTERVAL - FLICK_DELAY,
            callback: () => this.flick()
        });
    }

    // Both sides at once, the upper dashes a beat before the lower ones.
    flick() {
        for (let i = 0; i < this.dashes.length; i++) {
            const dash = this.dashes[i];

            this.scene.tweens.killTweensOf(dash);
            dash.setScale(1);

            this.scene.tweens.add({
                targets: dash,
                scaleX: FLICK_STRETCH,
                scaleY: FLICK_SWELL,
                duration: FLICK_OUT,
                delay: dash.spec.wave * FLICK_WAVE,
                ease: 'Quad.easeOut',
                onStart: () => dash.setVisible(true),
                onComplete: () => {
                    this.popFrom(dash);

                    this.scene.tweens.add({
                        targets: dash,
                        scaleX: 1,
                        scaleY: 1,
                        duration: FLICK_BACK,
                        ease: 'Back.easeOut',
                        easeParams: [2.4],
                        onComplete: () => dash.setVisible(false)
                    });
                }
            });
        }
    }

    // A fan of candy circles off the stretched tip, and a ring where it was.
    popFrom(dash) {
        const x = dash.spec.x + Math.cos(dash.turn) * dash.spec.length * (FLICK_STRETCH - 0.5);
        const y = dash.spec.y + Math.sin(dash.turn) * dash.spec.length * (FLICK_STRETCH - 0.5);

        for (let i = 0; i < POP_COLORS.length; i++) {
            const a = dash.turn + (i - 1) * POP_SPREAD + (Math.random() - 0.5) * 2 * POP_JITTER;
            const reach = POP_REACH + Math.random() * POP_REACH_RANGE;

            this.pops.push({
                x: x,
                y: y,
                dx: Math.cos(a) * reach,
                dy: Math.sin(a) * reach,
                size: POP_SIZE + Math.random() * POP_SIZE_RANGE,
                color: POP_COLORS[i],
                life: POP_LIFE + Math.random() * POP_LIFE_RANGE,
                age: 0
            });
        }

        this.pops.push({ ring: true, x: dash.tipX, y: dash.tipY, life: RING_LIFE, age: 0 });
    }

    drawPops(delta) {
        const g = this.popGraphics;
        const out3 = (t) => 1 - Math.pow(1 - t, 3);
        const smooth = (t) => t * t * (3 - 2 * t);
        const back = (t) => 1 + (POP_OVERSHOOT + 1) * Math.pow(t - 1, 3) + POP_OVERSHOOT * Math.pow(t - 1, 2);

        g.clear();

        for (let i = this.pops.length - 1; i >= 0; i--) {
            const pop = this.pops[i];

            pop.age += delta;

            const life = pop.age / pop.life;

            if (life >= 1) {
                this.pops.splice(i, 1);
                continue;
            }

            if (pop.ring) {
                const left = 1 - life;

                g.lineStyle(RING_LINE * left, RING_COLOR, left * left);
                g.strokeCircle(pop.x, pop.y, RING_FROM + (RING_TO - RING_FROM) * out3(life));
                continue;
            }

            const went = out3(life);
            const grow = Math.min(1, life / POP_IN);
            const fade = smooth(Math.max(0, (life - POP_OUT) / (1 - POP_OUT)));

            g.fillStyle(pop.color, 1);
            g.fillCircle(pop.x + pop.dx * went, pop.y + pop.dy * went, pop.size * back(grow) * (1 - fade));
        }
    }

    // Keeps the dashes' copies and their circles on the logo as it moves,
    // scales and sways.
    placeFlourish(delta) {
        const logo = this.logo;
        const flourish = this.flourish;

        if (!flourish.visible) return;

        flourish.x = logo.x;
        flourish.y = logo.y;
        flourish.rotation = logo.rotation;
        flourish.setScale(logo.scaleX, logo.scaleY);
        flourish.alpha = logo.alpha;

        this.drawPops(delta);
    }

    // No new flicks, but the ones going finish, leaving with the logo.
    stopFlick() {
        if (this.flickTimer) {
            this.flickTimer.remove(false);
            this.flickTimer = null;
        }
    }

    stopFlourish() {
        this.stopFlick();

        for (let i = 0; i < this.dashes.length; i++) {
            this.scene.tweens.killTweensOf(this.dashes[i]);
            this.dashes[i].setScale(1);
            this.dashes[i].setVisible(false);
        }

        this.pops.length = 0;
        this.popGraphics.clear();
        this.flourish.setVisible(false);
    }

    buildGleam() {
        // The glow is a shader run over every pixel of the logo, every frame -
        // more than a low-end GPU can spare. Those get the glints alone, and the
        // breathing tween runs on a stand-in.
        if (perf.lowEnd) {
            this.halo = { outerStrength: HALO_REST };
        } else {
            this.halo = this.logo.postFX.addGlow(GLEAM_WARM, HALO_REST, 0, false, HALO_QUALITY, HALO_DISTANCE);
            this.haloFX = true;

            this.scene.game.events.once('quality:low', this.dropHalo, this);
        }

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

    // The game found the device too slow: the glow goes, the glints stay.
    dropHalo() {
        if (!this.haloFX) return;

        this.scene.tweens.killTweensOf(this.halo);
        this.logo.postFX.remove(this.halo);

        this.haloFX = false;
        this.halo = { outerStrength: HALO_REST };
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

        this.glintTimer = this.scene.time.addEvent({
            delay: GLINT_INTERVAL,
            loop: true,
            startAt: GLINT_INTERVAL - GLINT_DELAY,
            callback: () => this.twinkle()
        });
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

        this.stopGlints();

        this.gleam = null;

        this.halo.outerStrength = HALO_REST;
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
        this.placeFlourish(delta);
        this.placeConvoyShadow();

        for (let i = 0; i < this.clouds.length; i++) {
            const cloud = this.clouds[i];

            cloud.x += cloud.speed * delta / 1000;

            if (cloud.x > cloud.edge) cloud.x = -cloud.edge;
        }
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
        this.stopFlick();
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
        this.startFlourish();
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
        this.stopFlourish();
        this.stopIdle();
    }

    destroy(fromScene) {
        this.scene.game.events.off('quality:low', this.dropHalo, this);
        this.stopGleam();
        this.stopFlourish();
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