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

