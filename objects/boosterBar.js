import SoundManager from './SoundManager.js';
import { pressable } from '../utils/buttons.js';
import { bakeShape } from '../utils/bake.js';
import { fitText } from '../utils/text.js';
import { unlocks, UNLOCK_AT } from './boosterUnlocks.js';
import { BOOSTERS, boosterFor } from './boosterList.js';

// The boosters, in a row under the board as in the storyboard, each a round
// button with how many are left on a blue badge. Their counts are the level
// card's, so a booster bought or spent in one place shows in the other.

// Portrait: this far apart, centre to centre, in one row.
const BUTTON_GAP = 108;
const BASE = 'ui/button_booster_base';
const BASE_SCALE = 0.5;
const ICON_SCALE = 0.48;
const HIT = 100;

const BADGE = 'ui/badge_count';
const BADGE_SCALE = 0.5;
const BADGE_X = 32;
const BADGE_Y = 31;
const BADGE_SIZE = 20;
// How wide a count can be on its badge.
const BADGE_ROOM = 30;
const PLUS_SIZE = 25;
const BADGE_STROKE = '#1b4fb8';

// Portrait, as in the storyboard: this far up from the bottom of the play area
// (which the clock and board are placed in too), but never nearer the board
// than BELOW_BOARD.
const FROM_BOTTOM = 85;
const BELOW_BOARD = 22;
const HALF_BUTTON = 46;

// Landscape: one column to the right of the board, centred on its middle,
// and the tip along the bottom edge of the screen.
const BESIDE_BOARD = 40;
const WIDE_GAP = 108;
const WIDE_TIP_BOTTOM = 20;

// The ring round a booster waiting to be used, pulsing.
const GLOW = 0xffc93c;
const GLOW_R = 50;
const GLOW_THICK = 6;
const GLOW_PULSE = 1.08;
const GLOW_TIME = 420;

const TIP_Y = -76;
const TIP_SIZE = 24;
// Kept clear between the tip and either side of the screen.
const TIP_EDGE = 20;
const TIP_INK = '#283085';
const TIP_STROKE = '#ffffff';
const TIP_NONE = 'No free way home to hint yet';
const TIP_NO_OBSTACLE = 'Nothing on the board to lift';
const TIP_SHOW = 1600;

// A booster not yet earned: greyed, with a padlock where its count goes.
const LOCKED_BASE = 0xb9c0d2;
const LOCKED_ICON = 0x8b93a9;
const LOCKED_ICON_ALPHA = 0.75;
const LOCK_R = 17;
const LOCK_EDGE = 3;
const LOCK_FILL = 0x3a4aa8;
const TIP_LOCKED = 'Unlocks at Level ';

// Earned: the padlock springs off and falls away, the colour comes back, and
// the button bounces with a burst of glints.
const UNLOCK_POP = 1.5;
const UNLOCK_POP_TIME = 180;
const UNLOCK_FALL = 70;
const UNLOCK_FALL_TIME = 420;
const UNLOCK_SPIN = 40;
const UNLOCK_BOUNCE = 1.28;
const UNLOCK_BOUNCE_TIME = 520;
const UNLOCK_TINT_TIME = 320;
const UNLOCK_TIME = 760;
const GLINT = 'fx-glint';
// Gold, as the glints the hint throws off on the board.
const GLINT_TINT = 0xffc93c;
const GLINTS = 7;
const GLINT_REACH = 70;
const GLINT_SCALE = 0.35;
const GLINT_TIME = 520;

// Spent: the icon jumps and settles, the count pops, and a few glints fly.
const USE_POP = 1.4;
const USE_TIME = 460;
const USE_GLINTS = 5;

const INTRO_DROP = 150;
const INTRO_TIME = 460;
const INTRO_DELAY = 180;
const INTRO_GAP = 80;

export class BoosterBar extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.buttons = {};
        // The booster waiting on a tap on the board, if any.
        this.picking = null;

        for (let i = 0; i < BOOSTERS.length; i++) this.buildButton(BOOSTERS[i], 0);

        this.tip = this.scene.add.text(0, TIP_Y, '', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: TIP_SIZE,
            color: TIP_INK,
            stroke: TIP_STROKE,
            strokeThickness: 5
        });
        this.tip.setOrigin(.5);
        this.tip.setResolution(this.textRes);
        this.tip.visible = false;
        this.add(this.tip);

        this.visible = false;
    }

    buildButton(spec, x) {
        const button = this.scene.add.container(x, 0);

        const glowR = GLOW_R + GLOW_THICK;

        button.glow = bakeShape(this.scene, {
            left: -glowR,
            top: -glowR,
            width: glowR * 2,
            height: glowR * 2
        }, (g) => {
            g.lineStyle(GLOW_THICK, GLOW, 1);
            g.strokeCircle(0, 0, GLOW_R);
        }, 'booster-glow');
        button.glow.visible = false;
        button.add(button.glow);

        const base = this.scene.add.sprite(0, 0, 'sheet', BASE);
        base.setScale(BASE_SCALE);
        button.add(base);

        const icon = this.scene.add.sprite(0, 0, 'sheet', spec.icon);
        icon.setScale(ICON_SCALE);
        button.add(icon);

        const badge = this.scene.add.sprite(BADGE_X, BADGE_Y, 'sheet', BADGE);
        badge.setScale(BADGE_SCALE);
        button.add(badge);

        button.count = this.scene.add.text(BADGE_X, BADGE_Y - 1, '', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: BADGE_SIZE,
            color: '#ffffff',
            stroke: BADGE_STROKE,
            strokeThickness: 3
        });
        button.count.setOrigin(.5);
        button.count.setResolution(this.textRes);
        button.add(button.count);

        button.base = base;
        button.icon = icon;
        button.badge = badge;

        button.lock = this.lockBadge();
        button.lock.setPosition(BADGE_X, BADGE_Y);
        button.add(button.lock);

        pressable(this.scene, button, HIT, HIT, () => this.press(spec.key));

        this.buttons[spec.key] = button;
        this.add(button);
    }

    // A navy disc with a white padlock on it.
    lockBadge() {
        const outer = LOCK_R + LOCK_EDGE;

        return bakeShape(this.scene, { left: -outer, top: -outer, width: outer * 2, height: outer * 2 }, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(0, 0, outer);
            g.fillStyle(LOCK_FILL, 1);
            g.fillCircle(0, 0, LOCK_R);

            g.lineStyle(3.5, 0xffffff, 1);
            g.beginPath();
            g.arc(0, -2, 5.5, Math.PI, 0);
            g.strokePath();
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(-8.5, -2, 17, 12, 3);
            g.fillStyle(LOCK_FILL, 1);
            g.fillCircle(0, 3.5, 2);
        }, 'booster-lock');
    }

    isLocked(key) {
        return !unlocks.isUnlocked(key) || !!(this.holding && this.holding[key]);
    }

    get levelScreen() {
        return this.scene.levelScreen;
    }

    get gamePlay() {
        return this.scene.gamePlay;
    }

    // Only while the level is actually being played.
    live() {
        const play = this.gamePlay;

        return this.visible && play && play.running && !play.finished && !play.paused;
    }

    press(key) {
        // A lesson under way takes the taps itself.
        if (this.teaching) {
            this.teaching(key);
            return;
        }

        if (!this.live()) return;

        if (this.isLocked(key)) {
            this.stopPicking();
            this.shake(this.buttons[key]);
            this.say(TIP_LOCKED + UNLOCK_AT[key], TIP_SHOW);
            return;
        }

        // A second tap on the one waiting for a pick puts it away, unspent.
        if (this.picking === key) {
            this.stopPicking();
            return;
        }

        this.stopPicking();

        if (!(this.levelScreen.counts[key] > 0)) {
            this.offer(key);
            return;
        }

        if (key === 'hint') this.hint();
        else if (key === 'crane') this.crane();
        else this.remove();
    }

    // Spends one, if there is one, and shows it spent.
    spend(key) {
        if (!this.levelScreen.spend(key)) return false;

        this.used(this.buttons[key]);

        return true;
    }

    // Waits on a tap on the board, glowing, with what to tap under the row.
    startPicking(key) {
        this.picking = key;
        this.glow(this.buttons[key], true);
        this.say(boosterFor(key).pick, 0);
    }

    stopPicking() {
        if (!this.picking) return;

        const key = this.picking;

        this.picking = null;
        this.glow(this.buttons[key], false);
        this.say(null);

        if (this.gamePlay) this.gamePlay.stopPicking();
    }

    remove() {
        this.startPicking('remove');

        this.gamePlay.pickConvoy((convoy) => {
            this.stopPicking();

            if (this.levelScreen.counts.remove > 0 && this.gamePlay.removeConvoy(convoy)) this.spend('remove');
        });
    }

    hint() {
        if (this.gamePlay.showHint()) this.spend('hint');
        else this.say(TIP_NONE, TIP_SHOW);
    }

    // A tap anywhere but an obstacle puts the crane away again, unspent.
    crane() {
        if (!this.gamePlay.hasObstacles()) {
            this.say(TIP_NO_OBSTACLE, TIP_SHOW);
            return;
        }

        this.startPicking('crane');

        this.gamePlay.pickObstacle((col, row) => {
            this.stopPicking();

            if (this.levelScreen.counts.crane > 0 && this.gamePlay.liftObstacle(col, row)) this.spend('crane');
        }, () => this.stopPicking());
    }

    // Run out: the level card's offer, over the board, with the clock held
    // and the board let go of until it is closed.
    offer(key) {
        const play = this.gamePlay;

        play.detachInput();
        play.paused = true;

        this.levelScreen.offerDuringPlay(key, () => {
            if (play.running && !play.finished) play.attachInput();
            play.paused = false;
        });
    }

    glow(button, on) {
        const ring = button.glow;

        this.scene.tweens.killTweensOf(ring);

        ring.visible = on;
        ring.setScale(ring.restScale);
        ring.alpha = 1;

        if (!on) return;

        this.scene.tweens.add({
            targets: ring,
            scale: ring.restScale * GLOW_PULSE,
            alpha: 0.6,
            duration: GLOW_TIME,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    // A line under the buttons: held until cleared with a hold of 0, or gone
    // again after hold milliseconds.
    say(text, hold = 0) {
        if (this.tipRun) {
            this.tipRun.remove();
            this.tipRun = null;
        }

        this.tip.visible = !!text;

        if (!text) return;

        this.tip.setText(text);
        fitText(this.tip, dimensions.actualWidth - TIP_EDGE * 2, TIP_SIZE);

        if (hold > 0) {
            this.tipRun = this.scene.tweens.addCounter({
                from: 0,
                to: 1,
                duration: hold,
                onComplete: () => {
                    this.tipRun = null;
                    this.tip.visible = false;
                }
            });
        }
    }

    refresh(counts = this.levelScreen.counts) {
        for (const key in this.buttons) {
            const button = this.buttons[key];
            const left = counts[key] || 0;
            const count = button.count;

            count.setText(left > 0 ? String(left) : '+');
            fitText(count, BADGE_ROOM, left > 0 ? BADGE_SIZE : PLUS_SIZE);

            this.showLocked(button, this.isLocked(key));
        }
    }

    showLocked(button, locked) {
        button.lock.visible = locked;
        button.lock.setScale(button.lock.restScale);
        button.lock.setPosition(BADGE_X, BADGE_Y);
        button.lock.angle = 0;
        button.lock.alpha = 1;

        button.badge.visible = !locked;
        button.count.visible = !locked;

        if (locked) {
            button.base.setTint(LOCKED_BASE);
            button.icon.setTint(LOCKED_ICON);
            button.icon.alpha = LOCKED_ICON_ALPHA;
        } else {
            button.base.clearTint();
            button.icon.clearTint();
            button.icon.alpha = 1;
        }
    }

    // Held looking locked through the level's intro, for unlock() to open.
    holdLocked(key) {
        this.holding = this.holding || {};
        this.holding[key] = true;
        this.refresh();
    }

    /**
     * Opens a booster held locked: the padlock springs off and drops away,
     * the colour floods back, and the button bounces in a burst of glints.
     * onDone once it has all settled.
     */
    unlock(key, onDone = null) {
        const button = this.buttons[key];

        SoundManager.fx(this.scene, 'unlock', 0.75);
        const lock = button.lock;
        const rest = lock.restScale;

        if (this.holding) delete this.holding[key];

        this.scene.tweens.killTweensOf([lock, button]);

        this.scene.tweens.add({
            targets: lock,
            scale: rest * UNLOCK_POP,
            duration: UNLOCK_POP_TIME,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: lock,
                    y: BADGE_Y + UNLOCK_FALL,
                    angle: UNLOCK_SPIN,
                    alpha: 0,
                    scale: rest,
                    duration: UNLOCK_FALL_TIME,
                    ease: 'Quad.easeIn'
                });
            }
        });

        // The grey lifts off the base and icon.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            delay: UNLOCK_POP_TIME,
            duration: UNLOCK_TINT_TIME,
            onUpdate: (tween) => {
                const t = tween.getValue();
                const base = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(LOCKED_BASE), Phaser.Display.Color.ValueToColor(0xffffff), 1, t);
                const icon = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(LOCKED_ICON), Phaser.Display.Color.ValueToColor(0xffffff), 1, t);

                button.base.setTint(Phaser.Display.Color.GetColor(base.r, base.g, base.b));
                button.icon.setTint(Phaser.Display.Color.GetColor(icon.r, icon.g, icon.b));
                button.icon.alpha = LOCKED_ICON_ALPHA + (1 - LOCKED_ICON_ALPHA) * t;
            }
        });

        button.setScale(1);
        this.scene.tweens.add({
            targets: button,
            scale: { from: UNLOCK_BOUNCE, to: 1 },
            delay: UNLOCK_POP_TIME,
            duration: UNLOCK_BOUNCE_TIME,
            ease: 'Elastic.easeOut',
            easeParams: [1.1, 0.5]
        });

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            delay: UNLOCK_POP_TIME,
            duration: 1,
            onComplete: () => {
                this.glints(button);

                button.badge.visible = true;
                button.count.visible = true;
                button.badge.setScale(0);
                button.count.setScale(0);

                this.scene.tweens.add({
                    targets: [button.badge, button.count],
                    scale: (target) => target === button.badge ? BADGE_SCALE : 1,
                    duration: UNLOCK_TINT_TIME,
                    ease: 'Back.easeOut'
                });
            }
        });

        // Its own counter, the length of the whole show, to hand on from.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: UNLOCK_TIME,
            onComplete: () => {
                this.showLocked(button, false);
                button.badge.setScale(BADGE_SCALE);
                button.count.setScale(1);
                button.setScale(1);

                if (onDone) onDone();
            }
        });
    }

    glints(button, count = GLINTS) {
        for (let i = 0; i < count; i++) {
            const turn = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const glint = this.scene.add.image(button.x, button.y, GLINT);

            glint.setTint(GLINT_TINT);
            glint.setScale(0);
            this.add(glint);

            this.scene.tweens.add({
                targets: glint,
                x: button.x + Math.cos(turn) * GLINT_REACH,
                y: button.y + Math.sin(turn) * GLINT_REACH,
                scale: { from: GLINT_SCALE, to: 0 },
                angle: 180,
                duration: GLINT_TIME,
                ease: 'Cubic.easeOut',
                onComplete: () => glint.destroy()
            });
        }
    }

    // The icon, not the button, moves: the button's own tweens belong to its press.
    used(button) {
        const icon = button.icon;

        this.scene.tweens.killTweensOf([icon, button.count]);
        icon.angle = 0;

        this.scene.tweens.add({
            targets: icon,
            scale: { from: ICON_SCALE * USE_POP, to: ICON_SCALE },
            angle: { from: -14, to: 0 },
            duration: USE_TIME,
            ease: 'Elastic.easeOut',
            easeParams: [1.2, 0.45]
        });

        this.scene.tweens.add({
            targets: button.count,
            scale: { from: 1.6, to: 1 },
            duration: USE_TIME * 0.6,
            ease: 'Back.easeOut'
        });

        this.glints(button, USE_GLINTS);
    }

    // A locked button shakes its head.
    shake(button) {
        SoundManager.fx(this.scene, 'bump', 0.5);
        this.scene.tweens.killTweensOf(button);
        button.angle = 0;

        this.scene.tweens.add({
            targets: button,
            angle: { from: -8, to: 8 },
            duration: 60,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => { button.angle = 0; }
        });
    }

    /** Where a button is, in the game's own units. */
    buttonPoint(key) {
        const button = this.buttons[key];

        return { x: this.x + button.x, y: this.y + button.y };
    }

    /** Rises in under the board as a level starts. */
    intro() {
        this.stopPicking();
        this.say(null);
        this.refresh();
        this.adjust();

        this.visible = true;

        let i = 0;

        for (const key in this.buttons) {
            const button = this.buttons[key];

            this.scene.tweens.killTweensOf(button);

            button.y = button.restY + INTRO_DROP;
            button.alpha = 0;
            button.setScale(1);

            this.scene.tweens.add({
                targets: button,
                y: button.restY,
                alpha: 1,
                duration: INTRO_TIME,
                delay: INTRO_DELAY + i * INTRO_GAP,
                ease: 'Back.easeOut'
            });

            i++;
        }
    }

    hide() {
        this.stopPicking();
        this.say(null);
        this.visible = false;
    }

    adjust() {
        const play = this.gamePlay;

        this.x = dimensions.gameWidth / 2;

        if (dimensions.isLandscape && play) {
            const fit = play.fitScale || 1;
            const side = play.boardWidth / 2 * fit + BESIDE_BOARD + HALF_BUTTON;

            this.y = play.restY;

            BOOSTERS.forEach((booster, i) => {
                const button = this.buttons[booster.key];

                button.x = side;
                button.restY = (i - (BOOSTERS.length - 1) / 2) * WIDE_GAP;
                button.y = button.restY;
            });

            this.tip.y = dimensions.gameHeight - WIDE_TIP_BOTTOM - this.y;

            return;
        }

        BOOSTERS.forEach((booster, i) => {
            const button = this.buttons[booster.key];

            button.x = (i - (BOOSTERS.length - 1) / 2) * BUTTON_GAP;
            button.restY = 0;
            button.y = 0;
        });

        this.tip.y = TIP_Y;

        const bottom = dimensions.gameHeight - FROM_BOTTOM;
        const below = play ?
            play.restY + play.boardHeight / 2 * (play.fitScale || 1) + BELOW_BOARD + HALF_BUTTON :
            bottom;

        this.y = Math.max(bottom, below);
    }
}