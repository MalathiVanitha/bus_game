import SoundManager from './SoundManager.js';
import { SHADOW, SHADOW_ALPHA, SHADOW_X, SHADOW_Y } from './board.js';

const VEHICLE_SHEET = "luggages";

const ART_CELL = 170;
const GARAGE_FIT = 0.92;

const DOOR_FACING = Math.PI / 2;

// How far out from the middle the roof reaches (art pixels): vehicles are cut
// off here, so they slide in under the roof edge on whichever side they came.
const DOOR_BACK = 76;
const DOOR_MOUTH = 192;
const DOOR_HALF = 48;

const GAPE_SCALE = 1.1;
const GAPE_TIME = 200;
const SHUT_TIME = 320;

const GULP_SCALE = 1.07;
const GULP_TIME = 80;

const CHEER_SQUASH = 0.86;
const CHEER_SPREAD = 1.16;
const CHEER_IN = 90;
const CHEER_OUT = 420;

// Going away the moment its convoy is home: it squashes, then swells a touch
// and fades out while lots of little circles of its colour pop up in a wave
// out from where it stood, swirl outward and drift up a little, popping like
// bubbles as they go.
const VANISH_SQUASH = 0.9;
const VANISH_SQUASH_TIME = 90;
const VANISH_SWELL = 1.08;
const VANISH_FADE_TIME = 200;

// Sizes are in cells (diameters), times as fractions of BURST_TIME.
const BURST_TIME = 850;

const POPS = 30;
// Where they show up, in cells from the middle: all round the garage.
const POP_SPREAD = 0.5;
// They show up in a wave, the middle ones first, a little out of step. The
// latest one plus the longest life stays within 1, so every pop finishes.
const POP_STAGGER = 0.28;
const POP_STAGGER_JITTER = 0.3;
const POP_LIFE = 0.55;
const POP_LIFE_RANGE = 0.17;
const POP_SIZE = 0.08;
const POP_SIZE_RANGE = 0.1;
// How far each flies out, in cells.
const POP_REACH = 0.4;
const POP_REACH_RANGE = 0.7;
// How far round they curl as they fly (radians, all one way), and how far up
// they drift by the end (cells).
const POP_SWIRL = 0.5;
const POP_FLOAT = 0.15;
// How much of its life it takes to pop in, and how far it overshoots.
const POP_IN = 0.22;
const POP_OVERSHOOT = 2.2;
// When it pops, as a fraction of its life: the circle eases away and a thin
// ring of it spreads out that far past its size and fades, like a bubble.
const POP_OUT = 0.62;
const POP_SNAP = 0.45;
const POP_RING = 2.2;
const POP_LINE = 0.35;

const FOOT = 0.5;
const NOSE = 0.5;

// A frozen garage sits in a cube of ice with a number on it: how many
// other convoys still have to get home before it opens. Each one home knocks
// it down by one; at nought the ice cracks and flies off, and the garage
// takes its convoy like any other. The ice is clear enough for the garage,
// colour and all, to show through, so which convoy is held back reads at a
// glance. It is drawn once to a texture, shared.
const ICE_TEXTURE = "garage-ice";
const ICE_ART = 160;
const ICE_FIT = 1;
const ICE_ALPHA = 1;
const ICE_TEXT = 0.46;
const ICE_FONT = "FredokaOne_Regular";
const ICE_INK = "#ffffff";
const ICE_EDGE = "#1b3f8f";
const ICE_SHADOW = "rgba(16, 40, 100, 0.55)";
// Each tick down: the number squeezes, swells past its size and settles.
const TICK_SQUEEZE = 0.6;
const TICK_SWELL = 1.35;
const TICK_IN = 90;
const TICK_OUT = 380;
const TICK_SHAKE = 0.06;
// Breaking: it swells a touch, flashes white and goes, in a burst of ice.
const BREAK_SWELL = 1.2;
const BREAK_TIME = 260;
const ICE_COLOR = 0xc8f1ff;

function iceTexture(scene) {
    if (scene.textures.exists(ICE_TEXTURE)) return ICE_TEXTURE;

    const size = ICE_ART;
    const canvas = scene.textures.createCanvas(ICE_TEXTURE, size, size);
    const ctx = canvas.getContext();
    const round = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };
    const poly = (points) => {
        ctx.beginPath();
        points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
    };
    // The same frost every time, so the shared texture never changes.
    let seed = 11;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    const out = 5;
    const end = size - out;
    const face = 22;
    const faceEnd = size - face;

    // The cube: clear blue ice the garage shows through, deeper to the
    // bottom right.
    const body = ctx.createLinearGradient(0, 0, size, size);

    body.addColorStop(0, "rgba(200, 238, 255, 0.5)");
    body.addColorStop(1, "rgba(95, 175, 240, 0.6)");
    round(out, out, size - out * 2, size - out * 2, 16);
    ctx.fillStyle = body;
    ctx.fill();

    ctx.save();
    round(out, out, size - out * 2, size - out * 2, 16);
    ctx.clip();

    // Bevelled sides: lit along the top and left, shaded bottom and right.
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    poly([[0, 0], [size, 0], [faceEnd, face], [face, face]]);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    poly([[0, 0], [face, face], [face, faceEnd], [0, size]]);
    ctx.fill();
    ctx.fillStyle = "rgba(40, 120, 205, 0.4)";
    poly([[size, 0], [size, size], [faceEnd, faceEnd], [faceEnd, face]]);
    ctx.fill();
    ctx.fillStyle = "rgba(40, 120, 205, 0.5)";
    poly([[0, size], [face, faceEnd], [faceEnd, faceEnd], [size, size]]);
    ctx.fill();

    // The face: frost creeping in from its edges, clear in the middle.
    const frost = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size * 0.42);

    frost.addColorStop(0, "rgba(255, 255, 255, 0)");
    frost.addColorStop(1, "rgba(235, 248, 255, 0.45)");
    round(face, face, faceEnd - face, faceEnd - face, 8);
    ctx.fillStyle = frost;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.stroke();

    // Two shine streaks across the top left.
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    poly([[face, 62], [62, face], [80, face], [face, 80]]);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    poly([[face, 92], [92, face], [100, face], [face, 100]]);
    ctx.fill();

    // Frost specks round the face.
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";

    for (let i = 0; i < 26; i++) {
        const side = i % 4;
        const along = face + random() * (faceEnd - face);
        const into = face + 3 + Math.pow(random(), 2) * 16;
        const x = side === 0 ? into : side === 1 ? size - into : along;
        const y = side === 2 ? into : side === 3 ? size - into : along;

        ctx.beginPath();
        ctx.arc(x, y, 0.8 + random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // A small crack in the bottom right corner.
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    [[[faceEnd, 112], [122, 120], [118, 130]], [[122, 120], [112, 122]]].forEach((line) => {
        ctx.beginPath();
        line.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(40, 120, 205, 0.45)";
        ctx.stroke();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.stroke();
    });

    ctx.restore();

    // The rim: a darker icy edge so it stands off the floor, then a bright one.
    round(out, out, size - out * 2, size - out * 2, 16);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(45, 125, 200, 0.9)";
    ctx.stroke();
    round(out + 2, out + 2, size - out * 2 - 4, size - out * 2 - 4, 14);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(240, 252, 255, 1)";
    ctx.stroke();

    // Sparkles: four-pointed glints on the corners of the face.
    [[124, 34, 10], [34, 126, 7], [end - 14, end - 30, 5]].forEach(([x, y, r]) => {
        const k = r * 0.22;

        poly([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]]);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
    });

    canvas.refresh();

    return ICE_TEXTURE;
}

export class Garage {
    constructor(scene, config) {
        this.scene = scene;
        this.col = config.col;
        this.row = config.row;
        this.convoyIndex = config.convoyIndex;

        this.x = config.x;
        this.y = config.y;
        this.facing = config.facing;
        this.baseScale = (config.size * GARAGE_FIT) / ART_CELL;

        this.size = config.size;
        this.parent = config.parent;
        this.fx = config.fx || config.parent;
        this.leftovers = [];

        this.shadow = this.drawing(scene, config, config.shadows);
        this.shadow.x += SHADOW_X * config.size;
        this.shadow.y += SHADOW_Y * config.size;
        this.shadow.setTintFill(SHADOW);
        this.shadow.setAlpha(SHADOW_ALPHA);

        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

        // Everything that swells and squashes together.
        this.parts = [this.shadow, this.back, this.front];

        this.mouthMask = config.mask;
        this.clipped = true;
        this.front.setMask(config.mask);
        this.front.depth = config.y + config.size * (FOOT + NOSE);

        this.doorBack = DOOR_BACK * this.baseScale;
        this.doorMouth = DOOR_MOUTH * this.baseScale;
        this.doorHalf = DOOR_HALF * this.baseScale;

        this.gapeTween = null;
        this.burstTween = null;

        this.gone = false;

        this.frozenFor = 0;
        this.iceArt = null;
        this.iceText = null;
        this.iceTween = null;
        this.color = config.color || "#ffffff";

        if (config.frozen > 0) this.freeze(scene, config.frozen);
    }

    get frozen() {
        return this.frozenFor > 0;
    }

    freeze(scene, count) {
        const scale = (this.size * ICE_FIT) / ICE_ART;
        const depth = this.front.depth + 0.01;

        this.frozenFor = count;

        this.iceArt = scene.add.image(this.x, this.y, iceTexture(scene));
        this.iceArt.setScale(scale);
        this.iceArt.setAlpha(ICE_ALPHA);
        this.iceArt.depth = depth;
        this.iceArt.baseScale = scale;

        this.iceText = scene.add.text(this.x, this.y, String(count), {
            fontFamily: ICE_FONT,
            fontSize: Math.round(this.size * ICE_TEXT) + "px",
            color: ICE_INK,
            stroke: ICE_EDGE,
            strokeThickness: Math.max(3, Math.round(this.size * 0.09))
        });
        this.iceText.setShadow(0, Math.max(1, Math.round(this.size * 0.035)), ICE_SHADOW, 0, true, false);
        this.iceText.setOrigin(0.5);
        this.iceText.depth = depth + 0.01;

        this.parent.add(this.iceArt);
        this.parent.add(this.iceText);
    }

    // One more convoy home. True when that was the last it was waiting on.
    countDown() {
        if (!this.frozen || this.gone) return false;

        this.frozenFor--;

        if (this.frozenFor <= 0) {
            this.thaw();
            return true;
        }

        this.iceText.setText(String(this.frozenFor));
        this.tickIce();

        return false;
    }

    tickIce() {
        const art = this.iceArt;
        const text = this.iceText;

        if (this.iceTween) this.iceTween.remove();

        text.setScale(TICK_SQUEEZE);
        art.setScale(art.baseScale);

        this.iceTween = this.scene.tweens.add({
            targets: text,
            scale: TICK_SWELL,
            duration: TICK_IN,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.iceTween = this.scene.tweens.add({
                    targets: text,
                    scale: 1,
                    duration: TICK_OUT,
                    ease: "Back.easeOut",
                    onComplete: () => {
                        this.iceTween = null;
                    }
                });
            }
        });

        this.scene.tweens.add({
            targets: art,
            angle: { from: -TICK_SHAKE * 57, to: 0 },
            duration: TICK_OUT,
            ease: "Elastic.easeOut",
            easeParams: [1.2, 0.3]
        });
    }

    // Cracks the ice off. Quiet when the garage is going anyway.
    thaw(quiet = false) {
        const art = this.iceArt;
        const text = this.iceText;

        if (!art) return;

        this.frozenFor = 0;
        this.iceArt = null;
        this.iceText = null;

        if (this.iceTween) this.iceTween.remove();
        this.iceTween = null;
        this.scene.tweens.killTweensOf([art, text]);

        if (quiet) {
            art.destroy();
            text.destroy();
            return;
        }

        SoundManager.fx(this.scene, 'unlock', 0.8);
        art.setTintFill(0xffffff);
        this.burst(ICE_COLOR);

        this.scene.tweens.add({
            targets: [art, text],
            scale: (target) => (target.baseScale || 1) * BREAK_SWELL,
            alpha: 0,
            duration: BREAK_TIME,
            ease: "Quad.easeOut",
            onComplete: () => {
                art.destroy();
                    text.destroy();
            }
        });

        this.cheer();
    }

    drawing(scene, config, parent) {
        const art = scene.add.sprite(
            config.x,
            config.y,
            VEHICLE_SHEET,
            config.key + "/garage"
        );

        art.setOrigin(0.5);
        art.setRotation(config.facing - DOOR_FACING);
        art.setScale(this.baseScale);
        parent.add(art);

        return art;
    }

    // The front is cut at its mouth only while something is near enough to
    // pass under the roof edge: every masked sprite costs the GPU its own
    // stencil pass each frame.
    clip(on) {
        if (on === this.clipped) return;

        this.clipped = on;

        if (on) this.front.setMask(this.mouthMask);
        else this.front.clearMask();
    }

    // Turns the doorway to the side a convoy is coming in from. The art stays
    // as it is: the garage is open on all four sides.
    openTo(facing) {
        this.facing = facing;
    }

    gape() {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: this.parts,
            scale: this.baseScale * GAPE_SCALE,
            duration: GAPE_TIME,
            ease: "Back.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: this.parts,
                    scale: this.baseScale,
                    duration: SHUT_TIME,
                    ease: "Sine.easeOut",
                    onComplete: () => {
                        this.gapeTween = null;
                    }
                });
            }
        });
    }

    gulp() {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: this.parts,
            scale: this.baseScale * GULP_SCALE,
            duration: GULP_TIME,
            yoyo: true,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = null;
            }
        });
    }

    cheer(then) {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: this.parts,
            scaleX: this.baseScale * CHEER_SPREAD,
            scaleY: this.baseScale * CHEER_SQUASH,
            duration: CHEER_IN,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: this.parts,
                    scaleX: this.baseScale,
                    scaleY: this.baseScale,
                    duration: CHEER_OUT,
                    ease: "Elastic.easeOut",
                    easeParams: [1.1, 0.5],
                    onComplete: () => {
                        this.gapeTween = null;
                        if (then) then();
                    }
                });
            }
        });
    }

    // The colour is the garage's, as a number, for the burst.
    vanish(then, color = 0xffffff) {
        if (this.gone) return;

        this.stopTween();
        this.thaw(true);
        this.gone = true;

        this.gapeTween = this.scene.tweens.add({
            targets: this.parts,
            scale: this.baseScale * VANISH_SQUASH,
            duration: VANISH_SQUASH_TIME,
            ease: "Sine.easeOut",
            onComplete: () => {
                SoundManager.fx(this.scene, 'shatter', 0.6);
                this.burst(color, then);

                this.gapeTween = this.scene.tweens.add({
                    targets: this.parts,
                    scale: this.baseScale * VANISH_SWELL,
                    alpha: 0,
                    duration: VANISH_FADE_TIME,
                    ease: "Sine.easeInOut",
                    onComplete: () => {
                        this.gapeTween = null;
                        for (const part of this.parts) part.setVisible(false);
                    }
                });
            }
        });
    }

    // Drawn fresh every frame on one graphics, above the garage.
    burst(color, then) {
        const circles = this.scene.add.graphics({ x: this.x, y: this.y });
        const cell = this.size;
        const clock = { t: 0 };
        const out3 = (t) => 1 - Math.pow(1 - t, 3);
        const smooth = (t) => t * t * (3 - 2 * t);
        // Past 1 and settles back, softly.
        const back = (t) => 1 + (POP_OVERSHOOT + 1) * Math.pow(t - 1, 3) + POP_OVERSHOOT * Math.pow(t - 1, 2);
        const curl = Math.random() < 0.5 ? -POP_SWIRL : POP_SWIRL;
        const pops = [];

        for (let i = 0; i < POPS; i++) {
            const a = Math.random() * Math.PI * 2;
            // Square root, so they show up spread evenly round the garage.
            const middle = Math.sqrt(Math.random());
            const from = cell * POP_SPREAD * middle;
            const reach = cell * (POP_REACH + Math.random() * POP_REACH_RANGE);

            pops.push({
                a: a,
                from: from,
                reach: reach,
                curl: curl * (0.6 + Math.random() * 0.4),
                size: cell * (POP_SIZE + Math.random() * POP_SIZE_RANGE) * 0.5,
                at: POP_STAGGER * (middle * (1 - POP_STAGGER_JITTER) + Math.random() * POP_STAGGER_JITTER),
                life: POP_LIFE + Math.random() * POP_LIFE_RANGE
            });
        }

        this.fx.add(circles);
        this.leftovers.push(circles);

        this.burstTween = this.scene.tweens.add({
            targets: clock,
            t: 1,
            duration: BURST_TIME,
            ease: "Linear",
            onUpdate: () => {
                circles.clear();

                for (let i = 0; i < pops.length; i++) {
                    const pop = pops[i];
                    const life = (clock.t - pop.at) / pop.life;

                    if (life <= 0 || life >= 1) continue;

                    const went = out3(life);
                    const a = pop.a + pop.curl * went;
                    const r = pop.from + pop.reach * went;
                    const x = Math.cos(a) * r;
                    const y = Math.sin(a) * r - cell * POP_FLOAT * life * life;
                    const grow = Math.min(1, life / POP_IN);
                    const out = Math.max(0, (life - POP_OUT) / (1 - POP_OUT));
                    const fade = smooth(Math.min(1, out / POP_SNAP));
                    const size = pop.size * back(grow) * (1 - fade);

                    if (size > 0) {
                        circles.fillStyle(color, 1);
                        circles.fillCircle(x, y, size);
                    }

                    if (out > 0) {
                        const left = 1 - out;

                        circles.lineStyle(pop.size * POP_LINE * left, color, left * left);
                        circles.strokeCircle(x, y, pop.size * (0.9 + (POP_RING - 0.9) * out3(out)));
                    }
                }
            },
            onComplete: () => {
                this.burstTween = null;
                this.forget(circles);

                if (then) then();
            }
        });
    }

    forget(piece) {
        const at = this.leftovers.indexOf(piece);

        if (at >= 0) this.leftovers.splice(at, 1);
        piece.destroy();
    }

    stopTween() {
        if (!this.gapeTween) return;

        this.gapeTween.remove();
        this.gapeTween = null;
        for (const part of this.parts) part.setScale(this.baseScale);
    }

    destroy() {
        this.thaw(true);

        if (this.gapeTween) this.gapeTween.remove();
        if (this.burstTween) this.burstTween.remove();

        for (let i = 0; i < this.leftovers.length; i++) {
            this.scene.tweens.killTweensOf(this.leftovers[i]);
            this.leftovers[i].destroy();
        }

        this.leftovers.length = 0;

        for (const part of this.parts) part.destroy();
    }
}

