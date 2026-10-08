import { fitText } from '../utils/text.js';
import { bakeShape } from '../utils/bake.js';
import { difficulty, NORMAL, HARD, SUPER_HARD } from './levelDifficulty.js';

// The level number, top middle, as in the storyboard: a blue pill centred on
// the screen, between the clock on its left and the pause button on its right.

const BADGE_Y = 51;
const BADGE_W = 132;
const BADGE_H = 46;

// The pill in each difficulty's colours, as on the level card: blue, purple
// for Hard and red for Super Hard. The button in each art is `body` tall, with
// `pad` clear on either side of it; its round ends are kept whole and the
// middle stretched.
const FACES = {
    [NORMAL]: { art: 'button_blue', height: 160, body: 144, pad: 50, corner: 110 },
    [HARD]: { art: 'button_purple', height: 170, body: 153, pad: 63, corner: 140, horn: 0x3d0f8f, tag: 'HARD' },
    [SUPER_HARD]: { art: 'button_red', height: 170, body: 153, pad: 63, corner: 140, horn: 0x8f1020, tag: 'SUPER HARD' }
};

// Hard levels grow a pair of little devil horns off the top of the pill, and
// say how hard under the level number.
const HORN_X = 38;
const HORN_BASE = 11;
const HORN_TALL = 20;
const HORN_LEAN = 9;
const HORN_SINK = 6;
const HORN_POP_TIME = 380;

const HARD_LABEL_Y = -8;
const HARD_LABEL_SIZE = 21;
const TAG_Y = 13;
const TAG_SIZE = 12;

const LABEL_Y = -2;
const LABEL_SIZE = 24;
// Kept clear between the label and the pill's round ends.
const LABEL_EDGE = 14;
const INK = '#ffffff';

const INTRO_Y = -90;
const INTRO_TIME = 540;
const INTRO_DELAY = 260;

export class LevelBadge extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.build();
        this.hide();
    }

    build() {
        const textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const pill = this.scene.add.container(0, 0);

        // Behind the faces, their roots tucked under the pill's top edge.
        this.horns = [-1, 1].map((side) => {
            const horn = this.horn(side);

            horn.setPosition(side * HORN_X, -BADGE_H / 2 + HORN_SINK);
            pill.add(horn);

            return horn;
        });

        this.faces = {};

        for (const kind in FACES) {
            const art = FACES[kind];
            const scale = BADGE_H / art.body;

            const face = this.scene.add.nineslice(
                0, 0, art.art, null,
                BADGE_W / scale + art.pad * 2, art.height,
                art.corner, art.corner, 0, 0
            );
            face.setScale(scale);
            pill.add(face);

            this.faces[kind] = face;
        }

        this.label = this.scene.add.text(0, LABEL_Y, 'Level 1', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: INK
        });
        this.label.setOrigin(.5);
        this.label.setResolution(textRes);
        pill.add(this.label);

        this.tag = this.scene.add.text(0, TAG_Y, '', {
            fontFamily: 'FredokaOne_Regular',
            fontSize: TAG_SIZE,
            color: INK
        });
        this.tag.setOrigin(.5);
        this.tag.setResolution(textRes);
        pill.add(this.tag);

        this.pill = pill;
        this.add(pill);
    }

    // One horn, its root at 0,0, curling up and out to `side`.
    horn(side) {
        const tip = { x: side * HORN_LEAN, y: -HORN_TALL };
        const bounds = {
            left: -HORN_BASE - HORN_LEAN, top: -HORN_TALL - 2,
            width: (HORN_BASE + HORN_LEAN) * 2, height: HORN_TALL + 4
        };

        return bakeShape(this.scene, bounds, (g) => {
            const outer = new Phaser.Curves.QuadraticBezier(
                new Phaser.Math.Vector2(-side * HORN_BASE, 0),
                new Phaser.Math.Vector2(-side * HORN_BASE * 0.6, -HORN_TALL * 0.9),
                new Phaser.Math.Vector2(tip.x, tip.y)
            );
            const inner = new Phaser.Curves.QuadraticBezier(
                new Phaser.Math.Vector2(tip.x, tip.y),
                new Phaser.Math.Vector2(side * HORN_BASE * 0.3, -HORN_TALL * 0.35),
                new Phaser.Math.Vector2(side * HORN_BASE, 0)
            );

            g.fillStyle(0xffffff, 1);
            g.fillPoints(outer.getPoints(12).concat(inner.getPoints(12)), true);
        }, 'badge-horn-' + (side < 0 ? 'l' : 'r'));
    }

    set(level) {
        const kind = difficulty(level);
        const art = FACES[kind];
        const hard = kind !== NORMAL;

        for (const each in this.faces) this.faces[each].visible = each === kind;

        for (const horn of this.horns) {
            horn.visible = hard;
            if (hard) horn.setTint(art.horn);
        }

        this.tag.visible = hard;
        this.tag.setText(art.tag || '');

        this.label.y = hard ? HARD_LABEL_Y : LABEL_Y;
        this.label.setText('Level ' + level);
        fitText(this.label, BADGE_W - LABEL_EDGE * 2, hard ? HARD_LABEL_SIZE : LABEL_SIZE);
    }

    /** Drops in from above the screen with the level on it. */
    intro(level) {
        this.set(level);
        this.show();

        this.scene.tweens.killTweensOf(this.pill);

        this.pill.y = INTRO_Y;
        this.pill.alpha = 0;

        this.scene.tweens.add({
            targets: this.pill,
            y: 0,
            alpha: 1,
            duration: INTRO_TIME,
            delay: INTRO_DELAY,
            ease: 'Back.easeOut'
        });

        // The horns spring up once the pill has landed.
        for (const horn of this.horns) {
            this.scene.tweens.killTweensOf(horn);

            if (!horn.visible) continue;

            horn.setScale(0);
            this.scene.tweens.add({
                targets: horn,
                scale: horn.restScale,
                duration: HORN_POP_TIME,
                delay: INTRO_DELAY + INTRO_TIME * 0.7,
                ease: 'Back.easeOut',
                easeParams: [3]
            });
        }
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.scene.tweens.killTweensOf(this.pill);
        this.scene.tweens.killTweensOf(this.horns);
        for (const horn of this.horns) horn.setScale(horn.restScale);

        this.visible = false;
    }

    adjust() {
        this.x = dimensions.gameWidth / 2 + 30;
        // From the screen's real top, however tall the screen is.
        this.y = dimensions.topOffset + BADGE_Y;
    }
}