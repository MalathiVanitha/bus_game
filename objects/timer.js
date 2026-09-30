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

        this.visible = false;
    }

    adjust() {
        this.x = PANEL_X;
        this.y = PANEL_Y;
    }
}
