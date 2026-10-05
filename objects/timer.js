import SoundManager from './SoundManager.js';
import { bakeShape } from '../utils/bake.js';

// The level clock, top left, as in the storyboard: an icy-blue rounded panel
// with the stopwatch sat in its left end and the time left read out in mm:ss.
// The board keeps the time; this only shows it.

const PANEL_X = 129;
const PANEL_Y = 51;
const PANEL_W = 122;
const PANEL_H = 53;

const PANEL_RADIUS = 18;
const PANEL_FACE = 0xdcf0fe;
// A white rim round the face, and the blue it casts on the sky below it.
const PANEL_RIM = 0xffffff;
const PANEL_RIM_ALPHA = 0.9;
const PANEL_RIM_THICK = 2;
const PANEL_SHADOW = 0x4590e7;
const PANEL_SHADOW_ALPHA = 0.4;
const PANEL_SHADOW_Y = 4;

const ICON = 'icons/icon-timer-blue';
const ICON_X = -34;
const ICON_SCALE = 0.48;

const WARN_ICON = 'icons/icon-timer-coral';
const WARN_ICON_SCALE = 0.21;

const COUNT_X = 25;
const COUNT_Y = 1;
const COUNT_SIZE = 22;
const INK = '#0b57d0';
const WARN_INK = '#f0435a';

// From here down, each second ticked off gives the pill a nudge.
const WARN_AT = 10;
const TICK_SCALE = 1.1;
const TICK_TIME = 110;

// Frozen (the Freeze booster): frost over the face, a snowflake on its top
// right corner, and a thin bar under the pill running down what is left.
// In the last seconds the frost flickers; then it cracks off in shards and
// the pill bounces back.
const ICE_FACE = 0xbfeaff;
const ICE_ALPHA = 0.72;
const ICE_RIM = 0xffffff;
const ICE_IN = 260;
const ICE_OUT = 200;
const ICE_FLASH = 0.9;
const FLAKE_X = PANEL_W / 2 - 8;
const FLAKE_Y = -PANEL_H / 2 + 6;
const FLAKE_R = 13;
const FLAKE_INK = 0x2b8cf0;
const BAR_Y = PANEL_H / 2 + 11;
const BAR_W = PANEL_W - 30;
const BAR_H = 7;
const BAR_BACK = 0xffffff;
const BAR_FILL = 0x3ab8ff;
const THAW_WARN = 2;
const THAW_FLICKER = 12;
const SHARDS = 9;
const SHARD_REACH = 70;
const SHARD_TIME = 560;
const THAW_BOUNCE = 1.16;
const THAW_BOUNCE_TIME = 520;

const INTRO_X = -150;
const INTRO_TIME = 540;
const INTRO_DELAY = 260;

export function formatTime(seconds) {
    const whole = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;

    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

export class Timer extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.shown = -1;
        this.warned = false;

        this.build();
        this.hide();
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const pill = this.scene.add.container(0, 0);

        pill.add(this.drawPanel());

        this.icon = this.scene.add.sprite(ICON_X, 0, 'sheet', ICON);
        this.icon.setScale(ICON_SCALE);
        pill.add(this.icon);

        this.count = this.scene.add.text(COUNT_X, COUNT_Y, formatTime(0), {
            fontFamily: 'FredokaOne_Regular',
            fontSize: COUNT_SIZE,
            color: INK
        });
        this.count.setOrigin(.5);
        this.count.setResolution(this.textRes);
        pill.add(this.count);

        this.pill = pill;
        this.add(pill);

        this.buildIce();
    }

    buildIce() {
        const ice = this.scene.add.container(0, 0);
        const left = -PANEL_W / 2;
        const top = -PANEL_H / 2;

        // Under the icon and time, over the face.
        this.iceFace = bakeShape(this.scene, { left: left - 2, top: top - 2, width: PANEL_W + 4, height: PANEL_H + 4 }, (g) => {
            g.fillStyle(ICE_FACE, 1);
            g.fillRoundedRect(left, top, PANEL_W, PANEL_H, PANEL_RADIUS);
            g.lineStyle(3, ICE_RIM, 1);
            g.strokeRoundedRect(left + 1, top + 1, PANEL_W - 2, PANEL_H - 2, PANEL_RADIUS);
            g.fillStyle(ICE_RIM, 0.7);
            g.fillRoundedRect(left + 10, top + 6, PANEL_W * 0.45, 5, 2.5);
        }, 'timer-ice');
        this.iceFace.visible = false;
        this.pill.addAt(this.iceFace, 1);

        this.flake = bakeShape(this.scene, { left: -FLAKE_R - 4, top: -FLAKE_R - 4, width: FLAKE_R * 2 + 8, height: FLAKE_R * 2 + 8 }, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(0, 0, FLAKE_R + 3);
            g.lineStyle(3, FLAKE_INK, 1);

            for (let i = 0; i < 3; i++) {
                const a = i * Math.PI / 3 + Math.PI / 2;
                const x = Math.cos(a) * (FLAKE_R - 2);
                const y = Math.sin(a) * (FLAKE_R - 2);

                g.lineBetween(-x, -y, x, y);
            }

            g.fillStyle(FLAKE_INK, 1);
            g.fillCircle(0, 0, 2.5);
        }, 'timer-flake');
        this.flake.setPosition(FLAKE_X, FLAKE_Y);
        ice.add(this.flake);

        this.barBack = bakeShape(this.scene, { left: -BAR_W / 2 - 2, top: -BAR_H / 2 - 2, width: BAR_W + 4, height: BAR_H + 4 }, (g) => {
            g.fillStyle(BAR_BACK, 0.9);
            g.fillRoundedRect(-BAR_W / 2 - 2, -BAR_H / 2 - 2, BAR_W + 4, BAR_H + 4, BAR_H / 2 + 2);
        }, 'timer-ice-track');
        this.barBack.y = BAR_Y;
        ice.add(this.barBack);

        // Drawn from its left end, so it runs down towards it.
        this.barFill = bakeShape(this.scene, { left: 0, top: -BAR_H / 2, width: BAR_W, height: BAR_H }, (g) => {
            g.fillStyle(BAR_FILL, 1);
            g.fillRoundedRect(0, -BAR_H / 2, BAR_W, BAR_H, BAR_H / 2);
        }, 'timer-ice-bar');
        this.barFill.setPosition(-BAR_W / 2, BAR_Y);
        ice.add(this.barFill);

        ice.visible = false;
        this.ice = ice;
        this.pill.add(ice);

        this.frozen = false;
    }

    /**
     * Shows how much of a freeze is left (seconds of it, out of total): the
     * frost comes on as one starts and cracks off as it ends - in play; a
     * level laid out again just drops it.
     */
    setFreeze(left, total, live = true) {
        const on = left > 0;

        if (on && !this.frozen) this.frostOver();
        else if (!on && this.frozen) {
            if (live) this.thaw();
            else this.clearFreeze();
        }

        if (!on) return;

        this.barFill.scaleX = this.barFill.restScale * Phaser.Math.Clamp(left / (total || 1), 0, 1);

        if (!this.frosting) {
            this.iceFace.alpha = left > THAW_WARN ? ICE_ALPHA :
                ICE_ALPHA * (0.45 + 0.55 * Math.abs(Math.cos(left * THAW_FLICKER)));
        }
    }

    frostOver() {
        this.frozen = true;
        this.frosting = true;

        this.scene.tweens.killTweensOf([this.iceFace, this.ice, this.flake]);

        this.iceFace.visible = true;
        this.iceFace.alpha = ICE_FLASH;
        this.ice.visible = true;
        this.ice.alpha = 0;

        this.scene.tweens.add({
            targets: this.iceFace,
            alpha: ICE_ALPHA,
            duration: ICE_IN,
            ease: 'Quad.easeOut',
            onComplete: () => { this.frosting = false; }
        });

        this.scene.tweens.add({ targets: this.ice, alpha: 1, duration: ICE_IN, ease: 'Quad.easeOut' });

        this.flake.setScale(0);
        this.flake.angle = -90;
        this.scene.tweens.add({
            targets: this.flake,
            scale: this.flake.restScale,
            angle: 0,
            duration: ICE_IN * 1.6,
            ease: 'Back.easeOut'
        });
    }

    thaw() {
        this.frozen = false;
        this.frosting = false;

        SoundManager.fx(this.scene, 'shatter', 0.55);

        this.scene.tweens.killTweensOf([this.iceFace, this.ice, this.flake]);
        this.scene.tweens.add({
            targets: [this.iceFace, this.ice],
            alpha: 0,
            duration: ICE_OUT,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.iceFace.visible = false;
                this.ice.visible = false;
            }
        });

        this.shards();

        this.scene.tweens.killTweensOf(this.pill);
        this.scene.tweens.add({
            targets: this.pill,
            scale: { from: THAW_BOUNCE, to: 1 },
            duration: THAW_BOUNCE_TIME,
            ease: 'Elastic.easeOut',
            easeParams: [1.1, 0.5]
        });
    }

    // Little slivers of ice flung off the pill.
    shards() {
        for (let i = 0; i < SHARDS; i++) {
            const turn = (i / SHARDS) * Math.PI * 2 + Math.random() * 0.5;
            const x = Math.cos(turn) * PANEL_W * 0.4;
            const y = Math.sin(turn) * PANEL_H * 0.4;

            const shard = bakeShape(this.scene, { left: -8, top: -12, width: 16, height: 24 }, (g) => {
                g.fillStyle(ICE_FACE, 1);
                g.lineStyle(2, ICE_RIM, 1);
                g.fillTriangle(0, -11, 7, 4, -5, 10);
                g.strokeTriangle(0, -11, 7, 4, -5, 10);
            }, 'timer-shard');

            shard.setPosition(x, y);
            shard.angle = Math.random() * 360;
            this.add(shard);

            this.scene.tweens.add({
                targets: shard,
                x: x + Math.cos(turn) * SHARD_REACH,
                y: y + Math.sin(turn) * SHARD_REACH + 16,
                angle: shard.angle + (i % 2 ? 200 : -200),
                alpha: 0,
                duration: SHARD_TIME,
                ease: 'Cubic.easeOut',
                onComplete: () => shard.destroy()
            });
        }
    }

    // Straight back to plain, with nothing played: the level is going.
    clearFreeze() {
        this.frozen = false;
        this.frosting = false;
        this.scene.tweens.killTweensOf([this.iceFace, this.ice, this.flake]);
        this.iceFace.visible = false;
        this.ice.visible = false;
    }

    drawPanel() {
        const left = -PANEL_W / 2;
        const top = -PANEL_H / 2;
        const edge = PANEL_RIM_THICK;

        const bounds = {
            left: left - edge,
            top: top - edge,
            width: PANEL_W + edge * 2,
            height: PANEL_H + PANEL_SHADOW_Y + edge * 2
        };

        return bakeShape(this.scene, bounds, (panel) => {
            panel.fillStyle(PANEL_SHADOW, PANEL_SHADOW_ALPHA);
            panel.fillRoundedRect(left, top + PANEL_SHADOW_Y, PANEL_W, PANEL_H, PANEL_RADIUS);

            panel.fillStyle(PANEL_FACE, 1);
            panel.fillRoundedRect(left, top, PANEL_W, PANEL_H, PANEL_RADIUS);

            panel.lineStyle(PANEL_RIM_THICK, PANEL_RIM, PANEL_RIM_ALPHA);
            panel.strokeRoundedRect(left, top, PANEL_W, PANEL_H, PANEL_RADIUS);
        });
    }

    /** Puts seconds on the face, only redrawing when the readout changes. */
    set(seconds) {
        const whole = Math.max(0, Math.ceil(seconds));

        if (whole === this.shown) return;

        const ticked = this.shown !== -1 && whole < this.shown;

        this.shown = whole;
        this.count.setText(formatTime(whole));

        this.warn(whole <= WARN_AT);

        if (ticked && this.warned) this.tick();
    }

    warn(on) {
        if (on === this.warned) return;

        this.warned = on;

        this.count.setColor(on ? WARN_INK : INK);
        this.icon.setFrame(on ? WARN_ICON : ICON);
        this.icon.setScale(on ? WARN_ICON_SCALE : ICON_SCALE);
    }

    tick() {
        SoundManager.fx(this.scene, 'tick', 0.7);
        this.scene.tweens.killTweensOf(this.pill);

        this.pill.setScale(1);
        this.scene.tweens.add({
            targets: this.pill,
            scale: TICK_SCALE,
            duration: TICK_TIME,
            ease: 'Quad.easeOut',
            yoyo: true
        });
    }

    /** Slides in from the left with the level's full time on it. */
    intro(seconds) {
        this.clearFreeze();
        this.shown = -1;
        this.warn(false);
        this.set(seconds);
        this.show();

        this.scene.tweens.killTweensOf(this.pill);

        this.pill.setScale(1);
        this.pill.x = INTRO_X;
        this.pill.alpha = 0;

        this.scene.tweens.add({
            targets: this.pill,
            x: 0,
            alpha: 1,
            duration: INTRO_TIME,
            delay: INTRO_DELAY,
            ease: 'Back.easeOut'
        });
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.scene.tweens.killTweensOf(this.pill);
        this.clearFreeze();

        this.visible = false;
    }

    adjust() {
        this.x = PANEL_X;
        this.y = PANEL_Y;
    }
}