const VEHICLE_SHEET = "luggages";

const ART_CELL = 170;
const GARAGE_FIT = 1;

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
// and fades out while lots of little circles of its colour pop up all around
// where it stood and burst outward, popping like bubbles as they go.
const VANISH_SQUASH = 0.9;
const VANISH_SQUASH_TIME = 80;
const VANISH_SWELL = 1.08;
const VANISH_FADE_TIME = 160;

// Sizes are in cells (diameters), times as fractions of BURST_TIME.
const BURST_TIME = 700;

const POPS = 30;
// Where they show up, in cells from the middle: all round the garage.
const POP_SPREAD = 0.5;
// They don't all show up at once.
const POP_STAGGER = 0.25;
const POP_LIFE = 0.5;
const POP_LIFE_RANGE = 0.25;
const POP_SIZE = 0.08;
const POP_SIZE_RANGE = 0.1;
// How far each flies out, in cells.
const POP_REACH = 0.4;
const POP_REACH_RANGE = 0.7;
// How much bigger than its size it pops in, and how much of its life that takes.
const POP_OVERSHOOT = 1.4;
const POP_IN = 0.15;
// When it pops, as a fraction of its life: the circle snaps away and a thin
// ring of it spreads out that far past its size and fades, like a bubble.
const POP_OUT = 0.65;
const POP_SNAP = 0.3;
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

        this.back = this.drawing(scene, config, config.behind);
        this.front = this.drawing(scene, config, config.parent);

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

    // Turns the doorway to the side a convoy is coming in from. The art stays
    // as it is: the garage is open on all four sides.
    openTo(facing) {
        this.facing = facing;
    }

    gape() {
        this.stopTween();

        this.gapeTween = this.scene.tweens.add({
            targets: [this.back, this.front],
            scale: this.baseScale * GAPE_SCALE,
            duration: GAPE_TIME,
            ease: "Back.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: [this.back, this.front],
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
            targets: [this.back, this.front],
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

        const both = [this.back, this.front];

        this.gapeTween = this.scene.tweens.add({
            targets: both,
            scaleX: this.baseScale * CHEER_SPREAD,
            scaleY: this.baseScale * CHEER_SQUASH,
            duration: CHEER_IN,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.gapeTween = this.scene.tweens.add({
                    targets: both,
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

        const both = [this.back, this.front];

        this.gapeTween = this.scene.tweens.add({
            targets: both,
            scale: this.baseScale * VANISH_SQUASH,
            duration: VANISH_SQUASH_TIME,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.burst(color, then);

                this.gapeTween = this.scene.tweens.add({
                    targets: both,
                    scale: this.baseScale * VANISH_SWELL,
                    alpha: 0,
                    duration: VANISH_FADE_TIME,
                    ease: "Quad.easeIn",
                    onComplete: () => {
                        this.gapeTween = null;
                        this.back.setVisible(false);
                        this.front.setVisible(false);
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
        const fast = (t) => 1 - Math.pow(1 - t, 3);
        const pops = [];

        for (let i = 0; i < POPS; i++) {
            const a = Math.random() * Math.PI * 2;
            // Square root, so they show up spread evenly round the garage.
            const from = cell * POP_SPREAD * Math.sqrt(Math.random());
            const reach = cell * (POP_REACH + Math.random() * POP_REACH_RANGE);

            pops.push({
                x: Math.cos(a) * from,
                y: Math.sin(a) * from,
                dx: Math.cos(a) * reach,
                dy: Math.sin(a) * reach,
                size: cell * (POP_SIZE + Math.random() * POP_SIZE_RANGE) * 0.5,
                at: Math.random() * POP_STAGGER,
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

                    const went = fast(life);
                    const x = pop.x + pop.dx * went;
                    const y = pop.y + pop.dy * went;
                    const grow = Math.min(1, life / POP_IN);
                    // Up past its size and back as it pops in.
                    const popIn = 1 + (POP_OVERSHOOT - 1) * Math.sin(grow * Math.PI) * (grow < 1 ? 1 : 0);
                    const out = Math.max(0, (life - POP_OUT) / (1 - POP_OUT));
                    const snap = Math.min(1, out / POP_SNAP);
                    const size = pop.size * Math.sin(grow * Math.PI / 2) * popIn * (1 - snap * snap);

                    if (size > 0) {
                        circles.fillStyle(color, 1);
                        circles.fillCircle(x, y, size);
                    }

                    if (out > 0) {
                        const ring = fast(out);

                        circles.lineStyle(pop.size * POP_LINE * (1 - out), color, 1 - out * out);
                        circles.strokeCircle(x, y, pop.size * (1 + (POP_RING - 1) * ring));
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
        this.back.setScale(this.baseScale);
        this.front.setScale(this.baseScale);
    }

    destroy() {
        if (this.gapeTween) this.gapeTween.remove();
        if (this.burstTween) this.burstTween.remove();

        for (let i = 0; i < this.leftovers.length; i++) {
            this.scene.tweens.killTweensOf(this.leftovers[i]);
            this.leftovers[i].destroy();
        }

        this.leftovers.length = 0;

        this.back.destroy();
        this.front.destroy();
    }
}

