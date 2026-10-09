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
// The art is drawn once a colour, for a cell UNIT across, and scaled to the
// board's.

const UNIT = 100;

const PALETTE = {
    gold: { fill: 0xffc93c, dark: 0xd98a0b, light: 0xfff3b0, ink: 0x6e4300, glow: 0xffd84a },
    silver: { fill: 0xdde4ee, dark: 0x8e9bb0, light: 0xffffff, ink: 0x3f4a63, glow: 0xe4eeff }
};

const ROPE = 0xc08a4a;
const ROPE_DARK = 0x7a4f22;
const ROPE_LIGHT = 0xe8c48e;

// Sizes, against the art as drawn for a cell UNIT across.
const KEY_SIZE = 1.05;
// The rope loop, round the key's neck between its bow and shaft.
const ROPE_SIZE = 0.55;
const ROPE_AT = 6;
const CHAIN_SIZE = 0.82;
const PADLOCK_SIZE = 1.1;

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
// padlock, spinning round to sit level in it.
const SPRING = 1.4;
const SPRING_TIME = 160;
const FLIGHT_TIME = 620;
const FLIGHT_ARC = 1.3;
const FLIGHT_END = 0.55;

// Unlocked: the key turns, the shackle jumps open, and it all bursts off.
const TURN_TIME = 200;
const OPEN_TIME = 160;
const OFF_TIME = 380;
const OFF_DROP = 0.5;
const CHAIN_OFF_STAGGER = 50;
const UNLOCK_GLINTS = 7;

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

    textures(color) {
        const name = (part) => 'lock-' + part + '-' + color;

        if (this.scene.textures.exists(name('key'))) return;

        const c = PALETTE[color];

        // A key, lying along +x: the bow on the left, the bit on the right.
        bakeShape(this.scene, { left: -44, top: -26, width: 90, height: 48 }, (g) => {
            g.lineStyle(17, c.ink, 1);
            g.strokeCircle(-22, 0, 12);
            g.fillStyle(c.ink, 1);
            g.fillRoundedRect(-10, -7, 48, 14, 5);
            g.fillRoundedRect(17, 0, 11, 17, 3);
            g.fillRoundedRect(27, 0, 10, 13, 3);

            g.fillStyle(c.dark, 1);
            g.fillRoundedRect(-7, -4.5, 42, 9, 3);
            g.fillRoundedRect(19.5, 2, 6, 12.5, 2);
            g.fillRoundedRect(29.5, 2, 5, 8.5, 2);
            g.fillStyle(c.fill, 1);
            g.fillRoundedRect(-7, -4.5, 42, 5, 2.5);

            g.lineStyle(10, c.dark, 1);
            g.strokeCircle(-22, 0, 12);
            g.lineStyle(6, c.fill, 1);
            g.beginPath();
            g.arc(-22, 0, 13, Math.PI * 0.65, Math.PI * 1.85, false);
            g.strokePath();
            g.lineStyle(2.5, c.light, 1);
            g.beginPath();
            g.arc(-22, 0, 14, Math.PI * 1.05, Math.PI * 1.45, false);
            g.strokePath();
        }, name('key')).destroy();

        // A band of chunky chain, running along y: links face on and edge on
        // in turn, the edge-on ones behind.
        bakeShape(this.scene, { left: -18, top: -62, width: 36, height: 124 }, (g) => {
            const step = 18;

            for (let y = -36; y <= 36; y += step * 2) {
                g.fillStyle(c.ink, 1);
                g.fillRoundedRect(-5.5, y - 4, 11, 26, 5.5);
                g.fillStyle(c.dark, 1);
                g.fillRoundedRect(-2.5, y - 1, 5, 20, 2.5);
            }

            for (let y = -45; y <= 45; y += step * 2) {
                g.lineStyle(11, c.ink, 1);
                g.strokeEllipse(0, y, 23, 27);
                g.lineStyle(6.5, c.fill, 1);
                g.strokeEllipse(0, y, 23, 27);
                g.lineStyle(2, c.light, 1);
                g.beginPath();
                g.arc(0, y, 10, Math.PI * 1.1, Math.PI * 1.5, false);
                g.strokePath();
            }
        }, name('chain')).destroy();

        // The padlock's round body, centred at (0, 24), its top at y = 0.
        bakeShape(this.scene, { left: -29, top: -3, width: 58, height: 58 }, (g) => {
            g.fillStyle(c.ink, 1);
            g.fillCircle(0, 25, 27);
            g.fillStyle(c.dark, 1);
            g.fillCircle(0, 25, 24);
            g.fillStyle(c.fill, 1);
            g.fillCircle(0, 22.5, 21.5);
            g.fillStyle(c.light, 0.85);
            g.fillEllipse(-8, 12, 14, 7);

            // The keyhole, set in a darker ring.
            g.fillStyle(c.dark, 1);
            g.fillCircle(0, 25, 11);
            g.fillStyle(c.ink, 1);
            g.fillCircle(0, 22, 5);
            g.fillRoundedRect(-2.5, 22, 5, 12, 2);
        }, name('body')).destroy();

        // The shackle, its legs standing in the body's top.
        bakeShape(this.scene, { left: -24, top: -30, width: 48, height: 42 }, (g) => {
            const bend = (width, tint) => {
                g.lineStyle(width, tint, 1);
                g.beginPath();
                g.moveTo(-14, 8);
                g.lineTo(-14, -6);
                g.arc(0, -6, 14, Math.PI, 0, false);
                g.lineTo(14, 8);
                g.strokePath();
            };

            bend(13, c.ink);
            bend(7, c.dark);
            g.lineStyle(2.5, c.light, 1);
            g.beginPath();
            g.arc(0, -6, 14, Math.PI * 1.15, Math.PI * 1.5, false);
            g.strokePath();
        }, name('shackle')).destroy();
    }

    // The loop of rope a key is tied on with: one for every colour.
    ropeTexture() {
        if (this.scene.textures.exists('lock-rope')) return;

        bakeShape(this.scene, { left: -24, top: -24, width: 48, height: 48 }, (g) => {
            g.lineStyle(11, ROPE_DARK, 1);
            g.strokeCircle(0, 0, 16);
            g.lineStyle(7, ROPE, 1);
            g.strokeCircle(0, 0, 16);

            // The twist of its strands.
            g.lineStyle(2, ROPE_DARK, 0.8);

            for (let i = 0; i < 14; i++) {
                const a = (i / 14) * Math.PI * 2;
                const cx = Math.cos(a);
                const cy = Math.sin(a);
                const ax = -cy * 2.5;
                const ay = cx * 2.5;

                g.lineBetween(cx * 13 - ax, cy * 13 - ay, cx * 19 + ax, cy * 19 + ay);
            }

            g.lineStyle(1.5, ROPE_LIGHT, 0.9);
            g.beginPath();
            g.arc(0, 0, 18, Math.PI * 1.05, Math.PI * 1.5, false);
            g.strokePath();
        }, 'lock-rope').destroy();
    }

    image(color, part, size) {
        if (part === 'rope') this.ropeTexture();
        else this.textures(color);

        const image = this.scene.add.image(0, 0, part === 'rope' ? 'lock-rope' : 'lock-' + part + '-' + color);

        image.restScale = image.scaleX;
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

        const x0 = art.x;
        const y0 = art.y;
        const spin0 = art.rotation;
        const springAt = SPRING_TIME / (SPRING_TIME + FLIGHT_TIME);

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: SPRING_TIME + FLIGHT_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();

                if (t < springAt) {
                    const s = Phaser.Math.Easing.Back.Out(t / springAt);

                    art.setPosition(x0, y0 - this.cell * 0.25 * s);
                    art.setScale(art.fit * (1 + (SPRING - 1) * s));
                    return;
                }

                // Where the padlock is now, as it may be bumped meanwhile.
                const u = Phaser.Math.Easing.Sine.InOut((t - springAt) / (1 - springAt));
                const fromY = y0 - this.cell * 0.25;
                const to = lock.padlock;
                const end = Math.PI / 2 + Math.PI * 2 * Math.round((spin0 - Math.PI / 2) / (Math.PI * 2) + 1);

                art.x = x0 + (to.x - x0) * u;
                art.y = fromY + (to.y - fromY) * u - Math.sin(u * Math.PI) * this.cell * FLIGHT_ARC;
                art.rotation = spin0 + (end - spin0) * u;
                art.setScale(art.fit * (SPRING + (FLIGHT_END - SPRING) * u));
            },
            onComplete: () => this.unlock(lock, art)
        });

        this.runs.push(run);
        SoundManager.fx(this.scene, 'whoosh', 0.5);
    }

    // The key is in: it turns, the shackle jumps open, and padlock and
    // chains burst off. The convoy is free from here.
    unlock(lock, key) {
        const padlock = lock.padlock;

        lock.sway.remove();

        const run = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: TURN_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();

                key.setPosition(padlock.x, padlock.y + this.cell * 0.06);
                key.rotation = Math.PI / 2 - Math.PI / 2 * Phaser.Math.Easing.Back.Out(t);
                padlock.angle *= 0.8;
            },
            onComplete: () => {
                key.destroy();
                this.burstOff(lock, PALETTE[lock.color].glow);
            }
        });

        this.runs.push(run);
        SoundManager.fx(this.scene, 'tap', 0.7);

        // Freed as the shackle opens, not once the pieces have gone.
        this.release(lock.convoy);
    }

    burstOff(lock, glow) {
        const padlock = lock.padlock;
        const cell = this.cell;

        SoundManager.fx(this.scene, 'unlock', 0.9);
        lock.body.setTintFill(0xffffff);
        lock.shackle.setTintFill(0xffffff);

        this.play.ringAt(padlock.x, padlock.y, glow);
        this.play.glintsAt(padlock.x, padlock.y, UNLOCK_GLINTS, glow);
        this.play.confettiFrom(padlock.x, padlock.y, 10, '#' + glow.toString(16).padStart(6, '0'));

        this.scene.tweens.add({
            targets: lock.shackle,
            y: lock.shackle.y - 12,
            duration: OPEN_TIME,
            ease: 'Back.easeOut',
            onComplete: () => {
                lock.body.clearTint();
                lock.shackle.clearTint();
            }
        });

        this.scene.tweens.add({
            targets: padlock,
            y: padlock.y + cell * OFF_DROP,
            angle: padlock.angle + 40,
            scale: padlock.restScale * 1.3,
            alpha: 0,
            delay: OPEN_TIME,
            duration: OFF_TIME,
            ease: 'Back.easeIn',
            onComplete: () => padlock.destroy()
        });

        lock.chains.forEach((link, i) => {
            this.scene.tweens.add({
                targets: link,
                scale: link.fit * 1.35,
                alpha: 0,
                delay: OPEN_TIME * 0.5 + i * CHAIN_OFF_STAGGER,
                duration: OFF_TIME,
                ease: 'Quad.easeOut',
                onStart: () => { if (i % 2) this.play.ringAt(link.x, link.y, glow); },
                onComplete: () => link.destroy()
            });
        });

        const convoy = lock.convoy;

        this.play.lightConvoy(convoy);
        if (convoy.garage) convoy.garage.cheer();

        this.doneWithTip();
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
