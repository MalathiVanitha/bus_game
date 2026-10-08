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

// A locked garage sits under a block of ice with a number on it: how many
// other convoys still have to get home before it opens. Each one home knocks
// it down by one; at nought the ice cracks and flies off, and the garage
// takes its convoy like any other. The ice is clear enough for the garage's
// colour to show through, and the number sits on a badge in that colour, so
// which convoy is held back reads at a glance. The ice is drawn once to a
// texture, shared; each colour's badge once to its own.
const LOCK_TEXTURE = "garage-lock";
const BADGE_TEXTURE = "garage-lock-badge-";
const BADGE_R = 0.25;
// On a badge this light or lighter the number is dark, else white.
const BADGE_LIGHT = 0.62;
const LOCK_DARK_INK = "#283085";
const LOCK_ART = 160;
const LOCK_FIT = 0.94;
const LOCK_ALPHA = 1;
const LOCK_TEXT = 0.36;
const LOCK_FONT = "FredokaOne_Regular";
const LOCK_INK = "#ffffff";
const LOCK_EDGE = "#1d4f9c";
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

function lockTexture(scene) {
    if (scene.textures.exists(LOCK_TEXTURE)) return LOCK_TEXTURE;

    const size = LOCK_ART;
    const canvas = scene.textures.createCanvas(LOCK_TEXTURE, size, size);
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

    // The block: a light frost, whiter at the foot, and a white rim - clear
    // enough that the garage under it keeps its own colour.
    const body = ctx.createLinearGradient(0, 0, 0, size);

    body.addColorStop(0, "rgba(235, 250, 255, 0.16)");
    body.addColorStop(1, "rgba(200, 236, 255, 0.3)");
    round(6, 6, size - 12, size - 12, 26);
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.stroke();

    // A shine down the top left and a glint in the far corner.
    ctx.save();
    round(6, 6, size - 12, size - 12, 26);
    ctx.clip();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(0, size * 0.55);
    ctx.lineTo(size * 0.55, 0);
    ctx.lineTo(size * 0.78, 0);
    ctx.lineTo(0, size * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    round(size * 0.7, size * 0.14, size * 0.12, size * 0.05, size * 0.025);
    ctx.fill();

    canvas.refresh();

    return LOCK_TEXTURE;
}

// The badge the number sits on, in the garage's colour: lighter at the top,
// ringed in white and edged darker, so it stands out on the ice.
function badgeTexture(scene, color) {
    const key = BADGE_TEXTURE + color;

    if (scene.textures.exists(key)) return key;

    const size = LOCK_ART;
    const canvas = scene.textures.createCanvas(key, size, size);
    const ctx = canvas.getContext();
    const base = Phaser.Display.Color.HexStringToColor(color);
    const light = Phaser.Display.Color.Interpolate.ColorWithColor(base, new Phaser.Display.Color(255, 255, 255), 100, 35);
    const dark = Phaser.Display.Color.Interpolate.ColorWithColor(base, new Phaser.Display.Color(0, 0, 0), 100, 40);
    const rgb = (c) => "rgb(" + Math.round(c.r) + ", " + Math.round(c.g) + ", " + Math.round(c.b) + ")";
    const r = size * BADGE_R;
    const fill = ctx.createLinearGradient(0, size / 2 - r, 0, size / 2 + r);

    fill.addColorStop(0, rgb(light));
    fill.addColorStop(1, rgb(base));

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r + 5, 0, Math.PI * 2);
    ctx.fillStyle = rgb(dark);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    canvas.refresh();

    return key;
}

// Dark ink on a light badge (white, yellow, lime), white on the rest, edged
// in the badge's own colour darkened.
function badgeInk(color) {
    const c = Phaser.Display.Color.HexStringToColor(color);
    const shade = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    const dark = Phaser.Display.Color.Interpolate.ColorWithColor(c, new Phaser.Display.Color(0, 0, 0), 100, 55);
    const edge = Phaser.Display.Color.RGBToString(Math.round(dark.r), Math.round(dark.g), Math.round(dark.b));

    return shade >= BADGE_LIGHT ? { ink: LOCK_DARK_INK, edge: "#ffffff" } : { ink: LOCK_INK, edge: edge };
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

        this.lock = 0;
        this.lockArt = null;
        this.lockBadge = null;
        this.lockText = null;
        this.lockTween = null;
        this.color = config.color || "#ffffff";

        if (config.lock > 0) this.addLock(scene, config.lock);
    }

    get locked() {
        return this.lock > 0;
    }

    addLock(scene, count) {
        const scale = (this.size * LOCK_FIT) / LOCK_ART;
        const depth = this.front.depth + 0.01;

        this.lock = count;

        this.lockArt = scene.add.image(this.x, this.y, lockTexture(scene));
        this.lockArt.setScale(scale);
        this.lockArt.setAlpha(LOCK_ALPHA);
        this.lockArt.depth = depth;
        this.lockArt.baseScale = scale;

        this.lockBadge = scene.add.image(this.x, this.y, badgeTexture(scene, this.color));
        this.lockBadge.setScale(scale);
        this.lockBadge.depth = depth + 0.005;
        this.lockBadge.baseScale = scale;

        const ink = badgeInk(this.color);

        this.lockText = scene.add.text(this.x, this.y, String(count), {
            fontFamily: LOCK_FONT,
            fontSize: Math.round(this.size * LOCK_TEXT) + "px",
            color: ink.ink,
            stroke: ink.edge,
            strokeThickness: Math.max(2, Math.round(this.size * 0.06))
        });
        this.lockText.setOrigin(0.5);
        this.lockText.depth = depth + 0.01;

        this.parent.add(this.lockArt);
        this.parent.add(this.lockBadge);
        this.parent.add(this.lockText);
    }

    // One more convoy home. True when that was the last it was waiting on.
    countDown() {
        if (!this.locked || this.gone) return false;

        this.lock--;

        if (this.lock <= 0) {
            this.breakLock();
            return true;
        }

        this.lockText.setText(String(this.lock));
        this.tickLock();

        return false;
    }

    tickLock() {
        const art = this.lockArt;
        const text = this.lockText;

        if (this.lockTween) this.lockTween.remove();

        text.setScale(TICK_SQUEEZE);
        art.setScale(art.baseScale);

        this.lockTween = this.scene.tweens.add({
            targets: text,
            scale: TICK_SWELL,
            duration: TICK_IN,
            ease: "Quad.easeOut",
            onComplete: () => {
                this.lockTween = this.scene.tweens.add({
                    targets: text,
                    scale: 1,
                    duration: TICK_OUT,
                    ease: "Back.easeOut",
                    onComplete: () => {
                        this.lockTween = null;
                    }
                });
            }
        });

        this.scene.tweens.add({
            targets: [art, this.lockBadge],
            angle: { from: -TICK_SHAKE * 57, to: 0 },
            duration: TICK_OUT,
            ease: "Elastic.easeOut",
            easeParams: [1.2, 0.3]
        });
    }

    // Cracks the ice off. Quiet when the garage is going anyway.
    breakLock(quiet = false) {
        const art = this.lockArt;
        const badge = this.lockBadge;
        const text = this.lockText;

        if (!art) return;

        this.lock = 0;
        this.lockArt = null;
        this.lockBadge = null;
        this.lockText = null;

        if (this.lockTween) this.lockTween.remove();
        this.lockTween = null;
        this.scene.tweens.killTweensOf([art, badge, text]);

        if (quiet) {
            art.destroy();
            badge.destroy();
            text.destroy();
            return;
        }

        SoundManager.fx(this.scene, 'unlock', 0.8);
        art.setTintFill(0xffffff);
        this.burst(ICE_COLOR);

        this.scene.tweens.add({
            targets: [art, badge, text],
            scale: (target) => (target.baseScale || 1) * BREAK_SWELL,
            alpha: 0,
            duration: BREAK_TIME,
            ease: "Quad.easeOut",
            onComplete: () => {
                art.destroy();
                badge.destroy();
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
        this.breakLock(true);
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
        this.breakLock(true);

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

