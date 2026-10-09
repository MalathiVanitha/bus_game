import SoundManager from './SoundManager.js';
import { bakeShape } from '../utils/bake.js';

// Chained convoys and the keys to them ("lock" and "carryKey" on convoys).
//
// A locked convoy is bound in chunky chains of its lock's colour, crossed
// over each vehicle, with a big round padlock over its middle, and can't be
// taken hold of: a tap on it rattles the padlock. Its key rides on another
// convoy, tied to that one's tractor with a loop of rope, wherever it is
// driven. The moment that convoy's tractor reaches its garage, the key slips
// its rope, flies over to the padlock and turns in it, and padlock and chains
// burst off in a flash of that colour. From then on the convoy plays as any
// other. The Remove booster sends a key on its way just the same.
//
// Should every convoy left be chained (nothing free to bring a key home),
// the locks open by themselves, so a board is never left with nothing to
// move.
//
// The art is in assets/locks (loaded in BootScene), drawn ART_RES pixels to
// the unit for a cell UNIT across, and scaled to the board's. ART_ORIGIN is
// where each piece's own middle falls in its image: a replacement image has
// to keep its canvas size and that point where it is.

const UNIT = 100;
const ART_RES = 4;

const ART_ORIGIN = {
    // On the shaft, between the bow and the bit.
    key: { x: 0.4889, y: 0.5217 },
    chain: { x: 0.5, y: 0.5 },
    // The middle of its top edge.
    body: { x: 0.5, y: 0.037 },
    // Level with the top of the body its legs stand in.
    shackle: { x: 0.5, y: 0.7333 },
    rope: { x: 0.5, y: 0.5 }
};

const PALETTE = {
    gold: { fill: 0xffc93c, dark: 0xd98a0b, light: 0xfff3b0, ink: 0x6e4300, glow: 0xffd84a },
    silver: { fill: 0xdde4ee, dark: 0x8e9bb0, light: 0xffffff, ink: 0x3f4a63, glow: 0xe4eeff }
};

const ROPE = 0xc08a4a;
const ROPE_DARK = 0x7a4f22;
const ROPE_LIGHT = 0xe8c48e;

// Sizes, against the art as drawn for a cell UNIT across.
const KEY_SIZE = 1.3;
// The rope loop, round the key's neck between its bow and shaft.
const ROPE_SIZE = 0.7;
const ROPE_AT = 6;
const CHAIN_SIZE = 0.95;
const PADLOCK_SIZE = 1.35;

// The chains cross over each vehicle this far either side of square.
const CHAIN_CROSS = Math.PI / 4;

// Where the key rides on its tractor: on its middle, along it.
const KEY_BACK = 0;

// The padlock's idle sway, in degrees.
const SWAY = 6;
const SWAY_TIME = 1100;

// A tap on a chained convoy: the padlock shakes.
const RATTLE = 18;
const RATTLE_TIME = 420;

// Sent: the key springs off its tractor, then flies in an arc to the
// padlock, trailing sparkles and spinning round to hang bit down over the
// keyhole.
const SPRING = 1.4;
const SPRING_TIME = 180;
const FLIGHT_TIME = 560;
const FLIGHT_ARC = 1.2;
const FLIGHT_PEAK = 1.5;
const FLIGHT_END = 0.8;
const TRAIL_EVERY = 45;
const TRAIL_SIZE = 0.32;
const TRAIL_TIME = 320;

// Where the keyhole is in the padlock, and how far in from its tip the key
// goes, in art units.
const KEYHOLE_Y = 2.5;
const KEY_TIP = 40;
const KEY_IN = 10;

// Unlocked: the key pushes in, turns with a click, the shackle swings open
// on one leg, and padlock and chains burst off.
const INSERT_TIME = 140;
const TURN_TIME = 300;
const OPEN_TIME = 240;
const OPEN_LIFT = 12;
const OPEN_SWING = -38;
const POP_TIME = 120;
const OFF_TIME = 460;
const FLASH_TIME = 90;
const CHAIN_FLING = 0.8;
const CHAIN_HOP = 0.6;
const CHAIN_FALL = 2.4;
// Each chain is a strip of rings: they burst one ring at a time, the nearest
// the padlock first, each flashing white, swelling and popping before it is
// flung off. However many there are, they are all gone in about the same time.
const CHAIN_OFF_STAGGER = 70;
const CHAIN_OFF_SPAN = 1100;
const CHAIN_SWELL = 1.4;
const CHAIN_SWELL_TIME = 80;
const CHAIN_POP_GLINTS = 2;
// Each pop a little higher than the one before, in cents, up to a top.
const CHAIN_POP_RISE = 60;
const CHAIN_POP_TOP = 1200;
// Where the strip is cut into rings, in the chain art's pixels: across the
// bars between them, clear of the rings.
const CHAIN_CUTS = [0, 104, 248, 392, 496];
const UNLOCK_GLINTS = 9;
const UNLOCK_CONFETTI = 14;

// The first lock level's tip, once a player.
const TIP_KEY = 'baggage-out.lock-tip';
const TIP_TEXT = 'Drive the convoy with the key home\nto free the chained convoy!';
// Landscape: a narrow card in the gutter left of the board, clear of the
// level badge over it.
const TIP_TEXT_WIDE = 'Drive the convoy\nwith the key home\nto free the\nchained convoy!';
const TIP_SIDE_GAP = 22;
const TIP_EDGE = 16;
const TIP_FILL = 0x34407a;
const TIP_INK = '#ffffff';
const TIP_FONT = 'FredokaOne_Regular';
const TIP_SIZE = 22;
const TIP_GAP = 0.25;
const TIP_ICON = 46;
const TIP_IN = 380;
const TIP_OUT = 260;

export class Locks {
    constructor(play) {
        this.play = play;
        this.scene = play.scene;
        this.cell = play.cellSize;
        this.k = play.cellSize / UNIT;

        this.keys = [];
        this.locked = [];
        this.runs = [];
        this.parts = [];
        this.tip = null;

        for (let i = 0; i < play.convoys.length; i++) {
            const convoy = play.convoys[i];

            if (convoy.lock && (!PALETTE[convoy.lock] || convoy.covered)) {
                console.warn("Convoy '" + convoy.key + "' can't be locked:", convoy.lock);
                convoy.lock = null;
            }

            if (convoy.carryKey && (!PALETTE[convoy.carryKey] || convoy.covered)) {
                console.warn("Convoy '" + convoy.key + "' can't carry a key:", convoy.carryKey);
                convoy.carryKey = null;
            }

            if (convoy.lock) this.chain(convoy);
            if (convoy.carryKey) this.tie(convoy);
        }

        this.locked.forEach((lock) => {
            if (!this.keys.some((key) => key.color === lock.color)) {
                console.warn("Convoy '" + lock.convoy.key + "' is locked with no key for it:", lock.color);
            }
        });

        if (this.locked.length) this.showTip();
    }

    // ---- art ---------------------------------------------------------------

    image(color, part, size) {
        const key = part === 'rope' ? 'lock-rope' : 'lock-' + part + '-' + color;
        const image = this.scene.add.image(0, 0, key);

        image.setOrigin(ART_ORIGIN[part].x, ART_ORIGIN[part].y);
        image.restScale = 1 / ART_RES;
        image.fit = image.restScale * this.k * size;
        image.setScale(image.fit);

        return image;
    }

    // ---- keys on their convoys ---------------------------------------------

    tie(convoy) {
        const color = convoy.carryKey;
        const art = this.image(color, 'key', KEY_SIZE);
        const rope = this.image(color, 'rope', ROPE_SIZE);

        this.play.stage.add([art, rope]);
        this.parts.push(art, rope);

        const key = { convoy: convoy, color: color, art: art, rope: rope, sent: false };

        convoy.keyRide = key;
        this.keys.push(key);
        this.follow(convoy);
    }

    lockFor(color) {
        return this.locked.find((lock) => lock.color === color && !lock.opening) || null;
    }

    // The convoy carrying the key to a lock, if it is still on its way.
    carrierOf(lock) {
        const key = this.keys.find((k) => !k.sent && k.color === lock.color);

        return key ? key.convoy : null;
    }

    // ---- chained convoys ---------------------------------------------------

    chain(convoy) {
        const lock = {
            convoy: convoy,
            color: convoy.lock,
            chains: [],
            padlock: this.scene.add.container(),
            opening: false
        };

        const vehicles = convoy.rig.vehicles;

        for (let i = 0; i < vehicles.length; i++) {
            for (let side = 0; side < 2; side++) {
                const link = this.image(lock.color, 'chain', CHAIN_SIZE);

                link.cross = side ? CHAIN_CROSS : -CHAIN_CROSS;
                link.vehicle = i;
                this.play.stage.add(link);
                this.parts.push(link);
                lock.chains.push(link);
            }
        }

        // At the art's own size: the padlock as a whole is scaled to the board.
        lock.shackle = this.image(lock.color, 'shackle', 1);
        lock.body = this.image(lock.color, 'body', 1);
        lock.shackle.setScale(lock.shackle.restScale);
        lock.body.setScale(lock.body.restScale);
        lock.padlock.add([lock.shackle, lock.body]);
        // About its middle.
        lock.padlock.list.forEach((part) => part.y -= 16);
        lock.padlock.restScale = this.k * PADLOCK_SIZE;
        lock.padlock.setScale(lock.padlock.restScale);
        this.play.stage.add(lock.padlock);
        this.parts.push(lock.padlock, lock.shackle, lock.body);

        lock.sway = this.scene.tweens.add({
            targets: lock.padlock,
            angle: { from: -SWAY, to: SWAY },
            duration: SWAY_TIME,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        convoy.chains = lock;
        this.locked.push(lock);
        this.follow(convoy);
    }

    /** Lays chains, padlock and any key it carries over a convoy as it is now drawn. */
    follow(convoy) {
        const vehicles = convoy.rig.vehicles;
        const lock = convoy.chains;
        const key = convoy.keyRide;

        if (lock && !lock.gone) {
            let top = -Infinity;

            for (let i = 0; i < lock.chains.length; i++) {
                const link = lock.chains[i];
                const art = vehicles[link.vehicle].art;

                link.setPosition(art.x, art.y);
                link.rotation = (vehicles[link.vehicle].heading || 0) + link.cross;
                link.depth = art.depth + 0.02;
                link.visible = art.visible;
                top = Math.max(top, art.depth);
            }

            // Over the middle of the convoy: its middle vehicle, or between
            // the middle two.
            const n = vehicles.length;
            const a = vehicles[Math.floor((n - 1) / 2)].art;
            const b = vehicles[Math.ceil((n - 1) / 2)].art;

            lock.padlock.setPosition((a.x + b.x) / 2, (a.y + b.y) / 2);
            lock.padlock.depth = top + 0.05;
        }

        if (key && !key.sent) {
            const tractor = vehicles[0];
            const art = tractor.art;
            const heading = tractor.heading || 0;
            const back = this.cell * KEY_BACK;
            const x = art.x - Math.cos(heading) * back;
            const y = art.y - Math.sin(heading) * back;
            // Lying along the tractor, its bow to the front, the rope round
            // its neck.
            const bow = ROPE_AT * this.k * KEY_SIZE;

            key.art.setPosition(x, y);
            key.art.rotation = heading + Math.PI;
            key.art.depth = art.depth + 0.03;
            key.art.visible = art.visible;
            key.art.setScale(key.art.fit * (art.scaleX / tractor.scale));

            key.rope.setPosition(x + Math.cos(heading) * bow, y + Math.sin(heading) * bow);
            key.rope.rotation = heading;
            key.rope.depth = art.depth + 0.04;
            key.rope.visible = art.visible;
            key.rope.setScale(key.rope.fit * (art.scaleX / tractor.scale));
        }

        this.play.stackDirty = true;
    }

    rattle(convoy) {
        const lock = convoy.chains;

        if (!lock || lock.opening) return;

        this.play.bumpConvoy(convoy);
        SoundManager.fx(this.scene, 'bump', 0.8);

        lock.sway.pause();

        const from = lock.padlock.angle;
        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: RATTLE_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();

                lock.padlock.angle = from * (1 - t) + Math.sin(t * Math.PI * 6) * RATTLE * (1 - t);
                lock.padlock.setScale(lock.padlock.restScale * (1 + 0.18 * Math.sin(t * Math.PI) * (1 - t)));
            },
            onComplete: () => {
                lock.padlock.setScale(lock.padlock.restScale);
                if (!lock.opening && !lock.gone) lock.sway.resume();
            }
        });

        this.runs.push(run);

        // The convoy with its key lights up, to say which one to bring home.
        const carrier = this.carrierOf(lock);

        if (carrier) {
            const key = carrier.keyRide;

            this.play.lightConvoy(carrier);
            this.play.ringAt(key.art.x, key.art.y, PALETTE[lock.color].glow);
        }
    }

    // ---- sending keys and unlocking ----------------------------------------

    /**
     * A convoy has reached its garage, or is being taken off the board: the
     * key it carries flies to its padlock.
     */
    deliver(convoy) {
        const key = convoy.keyRide;

        if (!key || key.sent) return;

        key.sent = true;
        convoy.keyRide = null;

        const lock = this.lockFor(key.color);
        const glow = PALETTE[key.color].glow;
        const art = key.art;
        const rope = key.rope;

        this.play.ringAt(art.x, art.y, glow);
        this.play.glintsAt(art.x, art.y, 4, glow);
        SoundManager.fx(this.scene, 'coin', 0.8);

        // The rope slips off and is gone.
        this.scene.tweens.add({
            targets: rope,
            scale: rope.fit * 1.6,
            alpha: 0,
            duration: SPRING_TIME * 2,
            ease: 'Quad.easeOut'
        });

        // Over everything while it flies.
        art.setScale(art.fit);
        this.play.effectGroup.add(art);

        if (!lock) {
            this.scene.tweens.add({
                targets: art,
                scale: 0,
                alpha: 0,
                duration: SPRING_TIME * 2,
                ease: 'Back.easeIn'
            });
            return;
        }

        lock.opening = true;

        const padlock = lock.padlock;
        const x0 = art.x;
        const y0 = art.y;
        const lift = this.cell * 0.25;
        const spin0 = art.rotation;
        // Bit down, after a full turn or so the way it is already facing.
        const end = Math.PI / 2 + Math.PI * 2 * Math.round((spin0 - Math.PI / 2) / (Math.PI * 2) + 1);
        const springAt = SPRING_TIME / (SPRING_TIME + FLIGHT_TIME);
        let trail = 0;

        // The padlock stops swaying and straightens up to take it.
        lock.sway.remove();
        this.scene.tweens.add({ targets: padlock, angle: 0, duration: FLIGHT_TIME, ease: 'Sine.easeOut' });

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: SPRING_TIME + FLIGHT_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();

                if (t < springAt) {
                    const v = t / springAt;
                    const s = Phaser.Math.Easing.Back.Out(v);
                    // Squashed as it leaves, stretched as it rises.
                    const squash = 1 + Math.sin(v * Math.PI) * 0.18;

                    art.setPosition(x0, y0 - lift * s);
                    art.setScale(art.fit * (1 + (SPRING - 1) * s) * squash, art.fit * (1 + (SPRING - 1) * s) / squash);
                    return;
                }

                const v = (t - springAt) / (1 - springAt);
                const u = Phaser.Math.Easing.Sine.InOut(v);
                const to = this.keyAt(padlock, art, art.fit * FLIGHT_END);
                const fromY = y0 - lift;
                // It swells towards the top of its arc and comes down to size.
                const size = SPRING + (FLIGHT_END - SPRING) * u + (FLIGHT_PEAK - SPRING) * Math.sin(u * Math.PI) * 0.6;

                art.x = x0 + (to.x - x0) * u;
                art.y = fromY + (to.y - fromY) * u - Math.sin(u * Math.PI) * this.cell * FLIGHT_ARC;
                art.rotation = spin0 + (end - spin0) * Phaser.Math.Easing.Cubic.Out(v);
                art.setScale(art.fit * size);

                if (tween.elapsed - trail >= TRAIL_EVERY && v < 0.92) {
                    trail = tween.elapsed;
                    this.sparkle(art.x, art.y, glow);
                }
            },
            onComplete: () => this.unlock(lock, art)
        });

        this.runs.push(run);
        SoundManager.fx(this.scene, 'whoosh', 0.5);
    }

    // Where a key of this scale has to be for its tip to sit at the keyhole,
    // hanging bit down, pushed in by depth (art units).
    keyAt(padlock, art, scale, depth = 0) {
        const unit = scale * ART_RES;
        const hole = padlock.y + KEYHOLE_Y * padlock.scaleY;

        return { x: padlock.x, y: hole - (KEY_TIP - depth) * unit };
    }

    // One sparkle left behind by a flying key.
    sparkle(x, y, color) {
        if (!this.scene.textures.exists('fx-glint')) return;

        const glint = this.scene.add.image(x, y, 'fx-glint');
        const size = this.cell * TRAIL_SIZE * (0.7 + Math.random() * 0.6) / 256;

        glint.setTint(color);
        glint.setScale(size);
        glint.rotation = Math.random() * Math.PI;
        this.play.effectGroup.addAt(glint, 0);

        this.scene.tweens.add({
            targets: glint,
            scale: 0,
            angle: glint.angle + 140,
            y: y + this.cell * 0.15,
            duration: TRAIL_TIME,
            ease: 'Quad.easeIn',
            onComplete: () => glint.destroy()
        });
    }

    // The key is over the keyhole: it pushes in, the padlock giving under
    // it, then turns with a click and the lock springs open.
    unlock(lock, key) {
        const padlock = lock.padlock;
        const rest = padlock.restScale;
        const scale = key.scaleX;
        const glow = PALETTE[lock.color].glow;

        const insert = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: INSERT_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();
                const at = this.keyAt(padlock, key, scale, KEY_IN * Phaser.Math.Easing.Back.Out(t));
                const give = Math.sin(t * Math.PI) * 0.1;

                key.setPosition(at.x, at.y);
                padlock.setScale(rest * (1 + give), rest * (1 - give));
            },
            onComplete: () => {
                padlock.setScale(rest);
                this.turn(lock, key, scale, glow);
            }
        });

        this.runs.push(insert);
        SoundManager.fx(this.scene, 'tap', 0.6);
    }

    // The key turns about its shaft (seen side on, it narrows to an edge and
    // opens out the other way round), and clicks home half way.
    turn(lock, key, scale, glow) {
        const padlock = lock.padlock;
        let clicked = false;

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: TURN_TIME,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const t = tween.getValue();

                key.scaleY = scale * Math.cos(t * Math.PI);
                padlock.angle = Math.sin(t * Math.PI) * 5;

                if (!clicked && t >= 0.5) {
                    clicked = true;
                    SoundManager.fx(this.scene, 'tap', 0.8);
                    this.play.glintOn(padlock.x, padlock.y + KEYHOLE_Y * padlock.scaleY, 0.5);
                }
            },
            onComplete: () => {
                // Turned over: the same as flipped, so it can scale as usual.
                key.scaleY = scale;
                key.flipY = !key.flipY;
                padlock.angle = 0;
                this.open(lock, key, glow);
            }
        });

        this.runs.push(run);
    }

    // The key sinks in, the shackle jumps up and swings open on its right
    // leg, and the convoy is free from here; then it all bursts off.
    open(lock, key, glow) {
        const shackle = lock.shackle;
        const x0 = shackle.x;
        const y0 = shackle.y;
        // The top of its right leg, in the padlock.
        const px = x0 + 16;
        const py = y0 - 8;

        SoundManager.fx(this.scene, 'unlock', 0.9);

        // Freed as the shackle opens, not once the pieces have gone.
        this.release(lock.convoy);

        // The key sinks into the keyhole, out of the shackle's way.
        const hole = lock.padlock.y + KEYHOLE_Y * lock.padlock.scaleY;

        this.scene.tweens.add({
            targets: key,
            y: hole,
            scaleX: 0,
            scaleY: 0,
            duration: OPEN_TIME * 0.5,
            ease: 'Back.easeIn',
            onComplete: () => key.destroy()
        });

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: OPEN_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();
                const up = OPEN_LIFT * Phaser.Math.Easing.Back.Out(Math.min(1, t * 1.6));
                const swing = Phaser.Math.DegToRad(OPEN_SWING) * Phaser.Math.Easing.Back.Out(Math.max(0, t * 1.6 - 0.6));
                const dx = x0 - px;
                const dy = y0 - py;

                shackle.rotation = swing;
                shackle.x = px + dx * Math.cos(swing) - dy * Math.sin(swing);
                shackle.y = py + dx * Math.sin(swing) + dy * Math.cos(swing) - up;
            },
            onComplete: () => this.burstOff(lock, glow)
        });

        this.runs.push(run);
    }

    burstOff(lock, glow) {
        const padlock = lock.padlock;
        const rest = padlock.restScale;
        const color = '#' + glow.toString(16).padStart(6, '0');

        // A white flash, then it swells and is gone.
        lock.body.setTintFill(0xffffff);
        lock.shackle.setTintFill(0xffffff);

        this.scene.time.delayedCall(FLASH_TIME, () => {
            if (lock.body.scene) lock.body.clearTint();
            if (lock.shackle.scene) lock.shackle.clearTint();
        });

        this.play.ringAt(padlock.x, padlock.y, glow);
        this.play.glintsAt(padlock.x, padlock.y, UNLOCK_GLINTS, glow);
        this.play.confettiFrom(padlock.x, padlock.y, UNLOCK_CONFETTI, color);

        this.scene.tweens.add({
            targets: padlock,
            scale: '*=1.25',
            duration: POP_TIME,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: padlock,
                    scale: 0,
                    angle: '+=25',
                    alpha: 0,
                    duration: OFF_TIME * 0.6,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        padlock.destroy();
                    }
                });
            }
        });

        // The shackle flies off on its own, spinning.
        this.scene.tweens.add({
            targets: lock.shackle,
            y: lock.shackle.y - 30,
            angle: lock.shackle.angle - 90,
            duration: POP_TIME + OFF_TIME * 0.6,
            ease: 'Quad.easeOut'
        });

        this.flingChains(lock, rest);

        const convoy = lock.convoy;

        this.play.lightConvoy(convoy);
        this.play.bumpConvoy(convoy);
        if (convoy.garage) convoy.garage.cheer();

        this.doneWithTip();
    }

    // Each chain breaks into its rings, and they burst in turn, the nearest
    // the padlock first: each flashes white and swells, pops, and is flung
    // away tumbling, dropping out of sight.
    flingChains(lock) {
        const padlock = lock.padlock;
        const cell = this.cell;
        const glow = PALETTE[lock.color].glow;
        const rings = [];

        lock.chains.forEach((link) => rings.push(...this.breakChain(link)));
        lock.chains.length = 0;

        rings.sort((a, b) =>
            Phaser.Math.Distance.Between(a.x, a.y, padlock.x, padlock.y) -
            Phaser.Math.Distance.Between(b.x, b.y, padlock.x, padlock.y));

        const gap = Math.min(CHAIN_OFF_STAGGER, CHAIN_OFF_SPAN / Math.max(1, rings.length));

        rings.forEach((ring, i) => {
            const swell = this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                delay: i * gap,
                duration: CHAIN_SWELL_TIME,
                onStart: () => {
                    // Over the board from here.
                    ring.depth += 100;
                    this.play.stackDirty = true;
                    ring.setTintFill(0xffffff);
                },
                onUpdate: (tween) => {
                    ring.setScale(ring.fit * (1 + (CHAIN_SWELL - 1) * Phaser.Math.Easing.Quadratic.Out(tween.getValue())));
                },
                onComplete: () => {
                    ring.clearTint();
                    this.popRing(ring, i, padlock, cell, glow);
                }
            });

            this.runs.push(swell);
        });
    }

    // A chain swapped for its rings, each where it was in the chain.
    breakChain(link) {
        const texture = this.scene.textures.get(link.texture.key);
        const middle = link.height * ART_ORIGIN.chain.y;
        const cos = Math.cos(link.rotation);
        const sin = Math.sin(link.rotation);
        const rings = [];

        for (let i = 0; i < CHAIN_CUTS.length - 1; i++) {
            const name = 'ring-' + i;
            const top = CHAIN_CUTS[i];
            const height = CHAIN_CUTS[i + 1] - top;

            if (!texture.has(name)) texture.add(name, 0, 0, top, link.width, height);

            // Along the chain from its middle, turned with it.
            const along = (top + height / 2 - middle) * link.scaleY;
            const ring = this.scene.add.image(link.x - sin * along, link.y + cos * along, link.texture.key, name);

            ring.rotation = link.rotation;
            ring.fit = link.scaleX;
            ring.setScale(ring.fit);
            ring.depth = link.depth;
            ring.visible = link.visible;
            this.play.stage.add(ring);
            this.parts.push(ring);
            rings.push(ring);
        }

        link.destroy();
        this.play.stackDirty = true;

        return rings;
    }

    popRing(ring, i, padlock, cell, glow) {
        const away = Math.atan2(ring.y - padlock.y, ring.x - padlock.x) + (Math.random() - 0.5) * 1.2;
        const reach = cell * CHAIN_FLING * (0.6 + Math.random() * 0.7);
        const x0 = ring.x;
        const y0 = ring.y;
        const r0 = ring.rotation;
        const s0 = ring.scaleX;
        const spin = (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 3);

        this.play.glintsAt(x0, y0, CHAIN_POP_GLINTS, glow);
        SoundManager.fx(this.scene, 'poof', 0.45, Math.min(CHAIN_POP_TOP, i * CHAIN_POP_RISE));

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: OFF_TIME + 200,
            onUpdate: (tween) => {
                const t = tween.getValue();
                const out = Phaser.Math.Easing.Quadratic.Out(t);

                ring.x = x0 + Math.cos(away) * reach * out;
                ring.y = y0 + Math.sin(away) * reach * out - cell * CHAIN_HOP * Math.sin(t * Math.PI * 0.8) + cell * CHAIN_FALL * t * t * 0.4;
                ring.rotation = r0 + spin * t;
                // Settling back from its swell as it flies.
                ring.setScale(s0 + (ring.fit - s0) * Math.min(1, t * 3));
                ring.alpha = t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
            },
            onComplete: () => ring.destroy()
        });

        this.runs.push(run);
    }

    release(convoy) {
        const lock = convoy.chains;

        lock.gone = true;
        convoy.lock = null;
        convoy.chains = null;
        this.locked.splice(this.locked.indexOf(lock), 1);

        this.play.bumpConvoy(convoy);
        this.play.boardStamp++;
    }

    /**
     * A chained convoy taken off the board (the Remove booster): its chains
     * go with it. A key still on its way to it pops when it gets there.
     */
    drop(convoy) {
        const lock = convoy.chains;

        if (!lock) return;

        lock.sway.remove();
        lock.gone = true;
        lock.opening = true;
        convoy.lock = null;
        convoy.chains = null;
        this.locked.splice(this.locked.indexOf(lock), 1);

        this.scene.tweens.add({
            targets: lock.chains.concat(lock.padlock),
            alpha: 0,
            duration: OFF_TIME,
            ease: 'Quad.easeOut'
        });
    }

    /**
     * Called whenever a convoy has left the board. If nothing is left that
     * can move - every convoy still here chained, or carried by a chained
     * one - and no key is on its way, the locks open by themselves.
     */
    rescue() {
        if (!this.locked.length) return;

        const stuck = this.play.convoys.every((c) => c.escaped || c.lock || c.covered);

        if (!stuck) return;

        for (const lock of this.locked.slice()) {
            if (lock.opening) continue;

            lock.opening = true;
            lock.sway.remove();
            this.burstOff(lock, PALETTE[lock.color].glow);
            this.release(lock.convoy);
        }
    }

    // ---- the tip ------------------------------------------------------------

    // A card on the first lock level a player meets, till they have opened a
    // lock: over the board, or in landscape beside it (see placeTip).
    showTip() {
        let seen = false;

        try {
            seen = !!window.localStorage.getItem(TIP_KEY);
        } catch (e) {
            seen = false;
        }

        if (seen) return;

        this.buildTip(!!dimensions.isLandscape);

        const tip = this.tip;

        tip.alpha = 0;
        tip.setScale(tip.rest * 0.8);

        this.scene.tweens.add({
            targets: tip,
            alpha: 1,
            scale: tip.rest,
            duration: TIP_IN,
            delay: 400,
            ease: 'Back.easeOut'
        });
    }

    // The card itself, laid out wide over the board or narrow beside it:
    // the key on its left, or over the words.
    buildTip(side) {
        const text = this.scene.add.text(0, 0, side ? TIP_TEXT_WIDE : TIP_TEXT, {
            fontFamily: TIP_FONT,
            fontSize: TIP_SIZE + 'px',
            color: TIP_INK,
            align: 'center',
            lineSpacing: 2
        });

        text.setOrigin(0.5);

        const w = side ? text.width + 36 : text.width + 64;
        const h = side ? text.height + 78 : text.height + 22;
        const back = bakeShape(this.scene, { left: -w / 2 - 2, top: -h / 2 - 2, width: w + 4, height: h + 8 }, (g) => {
            g.fillStyle(0x101a33, 0.25);
            g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 18);
            g.fillStyle(TIP_FILL, 0.94);
            g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
        });
        // About TIP_ICON across, whatever the board's cell.
        const icon = this.image('gold', 'key', TIP_ICON / (90 * this.k));

        icon.rotation = -0.6;

        if (side) {
            icon.setPosition(0, -h / 2 + 32);
            text.y = 26;
        } else {
            icon.setPosition(-w / 2 + 30, 0);
            text.x = 12;
        }

        const tip = this.scene.add.container(0, 0, [back, icon, text]);

        tip.side = side;
        tip.cardW = w;
        tip.cardH = h;
        tip.parts = [back, icon, text];
        this.play.add(tip);
        this.parts.push(tip);
        this.tip = tip;

        this.placeTip();
    }

    // Over the board in portrait. In landscape, in the gutter left of it (the
    // boosters have the right), at the size it would be on screen over the
    // board but no wider than the gutter. The card is in the board's own
    // space, so it comes and goes with it.
    placeTip() {
        const tip = this.tip;
        const play = this.play;
        const fit = play.fitScale || 1;

        if (!tip.side) {
            tip.rest = 1;
            tip.setPosition(0, -play.boardHeight / 2 - tip.cardH / 2 - this.cell * TIP_GAP);
            return;
        }

        const boardLeft = dimensions.gameWidth / 2 - play.boardWidth / 2 * fit;
        const room = Math.max(40, boardLeft - TIP_SIDE_GAP - TIP_EDGE - dimensions.leftOffset);
        const shown = Math.min(1, room / tip.cardW);

        tip.rest = shown / fit;
        tip.setPosition(-play.boardWidth / 2 - (TIP_SIDE_GAP + tip.cardW * shown / 2) / fit, 0);
    }

    /** The screen has changed shape: the card moves, rebuilt if it turned. */
    adjust() {
        const tip = this.tip;

        if (!tip) return;

        if (tip.side !== !!dimensions.isLandscape) {
            const alpha = tip.alpha;

            this.scene.tweens.killTweensOf(tip);
            tip.destroy();
            this.buildTip(!!dimensions.isLandscape);
            this.tip.alpha = alpha;
        } else {
            this.placeTip();
        }

        this.scene.tweens.killTweensOf(this.tip);
        this.tip.alpha = 1;
        this.tip.setScale(this.tip.rest);
    }

    doneWithTip() {
        const tip = this.tip;

        if (!tip) return;

        this.tip = null;

        try {
            window.localStorage.setItem(TIP_KEY, '1');
        } catch (e) {
            // Shown again next time, then.
        }

        this.scene.tweens.killTweensOf(tip);
        this.scene.tweens.add({
            targets: tip,
            alpha: 0,
            scale: tip.rest * 0.8,
            duration: TIP_OUT,
            ease: 'Quad.easeIn',
            onComplete: () => tip.destroy()
        });
    }

    // ---- going --------------------------------------------------------------

    destroy() {
        for (const run of this.runs) run.remove();
        for (const lock of this.locked) lock.sway.remove();

        this.scene.tweens.killTweensOf(this.parts);
        this.parts.forEach((part) => part.destroy());

        this.runs.length = 0;
        this.parts.length = 0;
        this.keys.length = 0;
        this.locked.length = 0;
        this.tip = null;
    }
}
