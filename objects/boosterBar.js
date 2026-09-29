import { pressable } from '../utils/buttons.js';
import { bakeShape } from '../utils/bake.js';

// The two boosters, under the board as in the storyboard: Remove (the bin)
// and Hint (the bulb), each a round button with how many are left on a blue
// badge. Their counts are the level card's, so a booster bought or spent in
// one place shows in the other.

const BUTTONS = [
    { key: 'remove', icon: 'icons/icon-recycle' },
    { key: 'hint', icon: 'icons/icon-hint' }
];

const BUTTON_X = 92;
const BASE = 'ui/button_booster_base';
const BASE_SCALE = 0.62;
const ICON_SCALE = 0.6;
const HIT = 120;

const BADGE = 'ui/badge_count';
const BADGE_SCALE = 0.6;
const BADGE_X = 40;
const BADGE_Y = 38;
const BADGE_SIZE = 24;
const PLUS_SIZE = 30;
const BADGE_STROKE = '#1b4fb8';

// Below the board, and never nearer the bottom of the screen than this.
const BELOW_BOARD = 22;
const HALF_BUTTON = 57;
const BOTTOM_ROOM = 72;

// The ring round a booster waiting to be used, pulsing.
const GLOW = 0xffc93c;
const GLOW_R = 62;
const GLOW_THICK = 6;
const GLOW_PULSE = 1.08;
const GLOW_TIME = 420;

const TIP_Y = 84;
const TIP_SIZE = 24;
const TIP_INK = '#283085';
const TIP_STROKE = '#ffffff';
const TIP_PICK = 'Tap a convoy to remove it';
const TIP_NONE = 'No free way home to hint yet';
const TIP_SHOW = 1600;

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
        this.picking = false;

        for (let i = 0; i < BUTTONS.length; i++) {
            this.buildButton(BUTTONS[i], (i === 0 ? -1 : 1) * BUTTON_X);
        }

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
            left: -glowR, top: -glowR, width: glowR * 2, height: glowR * 2
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

        pressable(this.scene, button, HIT, HIT, () => this.press(spec.key));

        this.buttons[spec.key] = button;
        this.add(button);
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
        if (!this.live()) return;

        if (key === 'remove' && this.picking) {
            this.stopPicking();
            return;
        }

        this.stopPicking();

        if (!(this.levelScreen.counts[key] > 0)) {
            this.offer(key);
            return;
        }

        if (key === 'remove') this.startPicking();
        else this.hint();
    }

    startPicking() {
        this.picking = true;
        this.glow(this.buttons.remove, true);
        this.say(TIP_PICK, 0);

        this.gamePlay.pickConvoy((convoy) => {
            this.stopPicking();

            if (this.levelScreen.counts.remove > 0 && this.gamePlay.removeConvoy(convoy)) {
                this.levelScreen.spend('remove');
            }
        });
    }

    stopPicking() {
        if (!this.picking) return;

        this.picking = false;
        this.glow(this.buttons.remove, false);
        this.say(null);

        if (this.gamePlay) this.gamePlay.stopPicking();
    }

    hint() {
        if (this.gamePlay.showHint()) this.levelScreen.spend('hint');
        else this.say(TIP_NONE, TIP_SHOW);
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
            const left = counts[key] || 0;
            const count = this.buttons[key].count;

            count.setText(left > 0 ? String(left) : '+');
            count.setFontSize(left > 0 ? BADGE_SIZE : PLUS_SIZE);
        }
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

            button.y = INTRO_DROP;
            button.alpha = 0;
            button.setScale(1);

            this.scene.tweens.add({
                targets: button,
                y: 0,
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

        const below = play ?
            play.y + play.boardHeight / 2 * (play.fitScale || 1) + BELOW_BOARD + HALF_BUTTON :
            dimensions.gameHeight - BOTTOM_ROOM - HALF_BUTTON;

        this.y = Math.min(below, dimensions.gameHeight - BOTTOM_ROOM);
    }
}
