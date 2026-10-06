import SoundManager from './SoundManager.js';
import { pressable } from '../utils/buttons.js';
import { bakeShape } from '../utils/bake.js';
import { openModal, shutModal, dropModal, liftModal } from '../utils/modal.js';
import { unlocks, UNLOCK_AT } from './boosterUnlocks.js';
import { BOOSTERS } from './boosterList.js';
import { difficulty, NORMAL, HARD, SUPER_HARD } from './levelDifficulty.js';
import { fitText } from '../utils/text.js';

const PANEL_W = 450;
const PANEL_H = 560;

const PANEL_SCALE = 0.56;
const PANEL_PAD_X = 44;
const PANEL_PAD_Y = 131;
const PANEL_CORNER_X = 125;
const PANEL_CORNER_Y = 150;

// The plate sits on the card's top edge and the Play button hangs off its
// bottom one, so the fit allows for both.
const FIT_H = PANEL_H + 110;
const FIT_W = PANEL_W + 40;

const MODAL_MARGIN = 24;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const INK = '#283085';
const PURPLE = '#8a3be0';
const RULE = 0xded9f4;
const RULE_THICK = 3;
const RULE_HALF = 190;

// The level plate, tinted to the storyboard's blue ribbon.
const PLATE = 'home/level-plate';
const PLATE_Y = -PANEL_H / 2 - 4;
const PLATE_SCALE = 0.5;
const PLATE_W = 300;
const PLATE_H = 70;
const PLATE_CORNER = 60;
const PLATE_TINT = 0x7f90f4;
const PLATE_SIZE = 46;
const PLATE_STROKE = '#3844b0';
// Kept clear between the level and the plate's ends.
const PLATE_EDGE = 34;
// The plate is a ribbon: a folded tail tucked behind each end.
const TAIL_IN = 128;
const TAIL_OUT = 192;
const TAIL_TOP = -16;
const TAIL_BOTTOM = 34;
const TAIL_NOTCH = 18;
const TAIL_FILL = 0x5a69d8;
const TAIL_FOLD = 0x3844b0;

// The ribbon in each difficulty's colours: blue for a normal level, purple
// for a Hard one and red for a Super Hard one, which also carry a tag saying
// so under the ribbon.
const PLATE_STYLES = {
    [NORMAL]: { face: PLATE_TINT, tail: TAIL_FILL, fold: TAIL_FOLD, stroke: PLATE_STROKE },
    [HARD]: { face: 0xb36bff, tail: 0x8a3be0, fold: 0x5a1fa3, stroke: '#5a1fa3', tag: 'HARD' },
    [SUPER_HARD]: { face: 0xff6b6b, tail: 0xe0413f, fold: 0xa32424, stroke: '#a32424', tag: 'SUPER HARD' }
};
const TAG_Y = PLATE_H / 2 + 6;
const TAG_W = 168;
const TAG_H = 32;
const TAG_EDGE = 3;
const TAG_SIZE = 20;
const TAG_POP = 1.25;
const TAG_POP_TIME = 420;
const TAG_DELAY = 260;

// Sun rays turning slowly behind the card. Turned a whole ray's width every
// round of the idle loop, so the loop never jumps.
const RAYS = 14;
const RAY_R = 560;
const RAY_Y = -60;
const RAY_ALPHA = 0.16;
const RAY_GLOW = 0xfff4c8;
const RAYS_IN = 420;
const RAYS_OUT = 200;

// Sparkles twinkling around the plate, each at its own point in the loop.
const GLINT = 'fx-glint';
const SPARKLES = [
    { x: -178, y: -38, size: 0.2, at: 0 },
    { x: 172, y: -44, size: 0.16, at: 0.37 },
    { x: 118, y: 40, size: 0.12, at: 0.68 }
];
const SPARKLE_TINT = 0xffe27a;
const SPARKLE_LIFE = 0.22;

// What loops while the card is up: rays, sparkles, the icons' float.
const IDLE_ROUND = 6000;
const FLOAT = 5;
const RING_PULSE = 0.035;

const CLOSE_X = PANEL_W / 2 - 8;
const CLOSE_Y = -PANEL_H / 2 + 4;
// A blue disc with a white cross drawn over it.
const CLOSE_BASE = 'ui/badge_count';
const CLOSE_BASE_SCALE = 0.9;
const CLOSE_ARM = 11;
const CLOSE_THICK = 7;
const CLOSE_HIT = 78;

const GOAL_Y = -205;
const GOAL_SIZE = 26;

const ART_Y = -138;
const CONVOY_X = -78;
const CONVOY_SCALE = 0.23;
const ARROW_X = 62;
const ARROW_COLOR = 0x3d8cf0;
const GARAGE_X = 138;
const GARAGE_SCALE = 0.36;
// The lane the convoy drives along, with a dashed line down it.
const ROAD_Y = ART_Y + 34;
const ROAD_LEFT = -196;
const ROAD_RIGHT = GARAGE_X + 20;
const ROAD_H = 16;
const ROAD_FILL = 0xd7dbf3;
const ROAD_DASH = 0xffffff;
// Puffs of exhaust left behind as it drives, and the glints the garage gives
// off as it takes it.
const PUFFS = 4;
const PUFF_R = 9;
const PUFF_FILL = 0xaab1d8;
const PUFF_EVERY = 190;
const PUFF_LIFE = 520;
const PUFF_RISE = 20;
const BURST = 6;
const BURST_REACH = 58;
const BURST_TIME = 520;
const BURST_SCALE = 0.13;
const BURST_TINT = 0xffd34d;
// Once the card has landed, the convoy drives over to the garage and in out
// of sight (the arrow giving way as it passes), the garage bumps as it takes
// it, and a fresh convoy rolls in back at the start. Times are from the start
// of each round.
const DRIVE_END = 950;
// How far along the drive the convoy starts shrinking into the garage.
const DRIVE_SINK = 0.65;
const SINK_SCALE = 0.3;
const ARROW_CLEAR = 70;
const BUMP_AT = 880;
const BUMP_TIME = 260;
const BUMP = 0.16;
const RETURN_AT = 1500;
const RETURN_TIME = 380;
const RETURN_FROM = 36;
const DRIVE_ROUND = 2500;

const RULE_Y = -80;

const PICK_Y = -50;
const PICK_SIZE = 28;

// One row of tiles, one per booster, drawn small enough for all of them to
// fit across the card. Everything on a tile is laid out at full size and the
// tile scaled down; its count and tick are scaled back up some, to stay
// readable.
const TILE_Y = 42;
const TILE_GAP = 86;
const TILE_SCALE = 0.58;
const TILE_BADGE_SCALE = 1.25;
const TILE_HIT = 144;

const BASE = 'ui/button_booster_base';
const BASE_SCALE = 0.8;
const ICON_SCALE = 0.8;

const RING_R = 74;
const RING_FILL = 0xf1e9ff;
const RING_LINE = 0xa66cf2;
const RING_THICK = 6;

const BADGE_R = 21;
const BADGE_FILL = 0x8d3ee8;
const BADGE_EDGE = 0xffffff;
const BADGE_EDGE_THICK = 3;
const BADGE_SIZE = 26;
const PLUS_SIZE = 36;

const COUNT_X = 50;
const COUNT_Y = 46;

const CHECK_X = 54;
const CHECK_Y = -50;

const LABEL_Y = 62;
const LABEL_SIZE = 21;
const MORE_Y = 84;
const MORE_SIZE = 16;
// How wide a tile's name and the line under it can run, so neighbouring
// tiles' never meet.
const TILE_ROOM = 82;
// How wide a count can be on its badge.
const BADGE_ROOM = 34;

const NOTE_Y = 208;
const NOTE_W = 380;
const NOTE_H = 44;
const NOTE_FILL = 0xe8e8fb;
const NOTE_SIZE = 22;
const NOTE = '3 free uses to start';

const PLAY_Y = PANEL_H / 2 + 8;
const PLAY_W = 320;
const PLAY_H = 92;
const PLAY_SIZE = 56;
// Up off the button's lip, so the tail of the y sits on the green face.
const PLAY_LABEL_Y = -6;
const PLAY_STROKE = '#1d8a12';
// Once the card has landed, Play swells a little now and then to draw the eye.
const PLAY_BEAT = 0.05;
const PLAY_BEAT_TIME = 360;
const PLAY_BEAT_REST = 700;
// A glint that flares on Play's corner with each swell.
const PLAY_GLINT_X = -PLAY_W / 2 + 46;
const PLAY_GLINT_Y = -PLAY_H / 2 + 20;
const PLAY_GLINT = 0.22;
// A slanted shine that sweeps across Play's face now and then, kept inside
// the face (clear of its rounded ends and the lip at its foot).
const SHINE_W = 34;
const SHINE_THIN = 10;
const SHINE_GAP = 10;
const SHINE_SLANT = 26;
const SHINE_TOP = -PLAY_H / 2 + 8;
const SHINE_BOTTOM = PLAY_H / 2 - 16;
const SHINE_INSET = 30;
const SHINE_ALPHA = 0.45;
const SHINE_TIME = 650;
const SHINE_REST = 2200;

// How hard the landing knocks the level plate, above the other pieces.
const PLATE_JOLT = 0.24;

const GREEN = 'button_green';
const GREEN_SCALE = 0.5;
const GREEN_CORNER_X = 120;
const GREEN_CORNER_Y = 70;

// The "get more" offer, stood over the level card.
const OFFER_W = 400;
const OFFER_H = 480;
const OFFER_DIM_ALPHA = 0.45;

const OFFER_TITLE_Y = -178;
const OFFER_TITLE_SIZE = 32;

const OFFER_ICON_Y = -92;
const OFFER_ICON_SCALE = 1;
const OFFER_BADGE_X = 48;
const OFFER_BADGE_Y = 30;
const OFFER_BADGE_R = 28;

const OFFER_LINE_Y = 8;
const OFFER_LINE_SIZE = 28;
// Kept clear between the offer's lines and either side of its card.
const OFFER_EDGE = 30;

const OFFER_PRICE_Y = 66;
const OFFER_PRICE_W = 240;
const OFFER_PRICE_H = 56;
const OFFER_COIN_X = -58;
const OFFER_COIN_SCALE = 0.3;
const OFFER_PRICE_SIZE = 34;
const OFFER_UNIT_SIZE = 22;

const OFFER_BUY_Y = 138;
const OFFER_BUY_W = 300;
const OFFER_BUY_H = 70;
const OFFER_BUY_SIZE = 32;

const OFFER_CANCEL_Y = 194;
const OFFER_CANCEL_SIZE = 24;
const OFFER_CANCEL_HIT_W = 180;
const OFFER_CANCEL_HIT_H = 50;

const OFFER_CLOSE_X = OFFER_W / 2 - 20;
const OFFER_CLOSE_Y = -OFFER_H / 2 + 20;

// A booster not yet earned: greyed, a padlock where its count goes, and the
// level it opens on under its name.
const LOCKED_BASE = 0xb9c0d2;
const LOCKED_ICON = 0x8b93a9;
const LOCKED_ICON_ALPHA = 0.75;
const LOCK_R = 21;
const LOCK_FILL = 0x3a4aa8;
const LOCKED_INK = '#8a93b8';

const CHECK_POP = 1.3;
const CHECK_POP_TIME = 120;

// What a top-up gives and costs.
const PACK_COUNT = 3;
const PACK_PRICE = 50;

const STORE_KEY = 'baggage-out.boosters';

const FREE_USES = 3;

function readStore() {
    const counts = {};

    for (let i = 0; i < BOOSTERS.length; i++) counts[BOOSTERS[i].key] = FREE_USES;

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');

        for (const key in counts) {
            if (isFinite(saved[key])) counts[key] = Math.max(0, Math.floor(saved[key]));
        }
    } catch (e) {
        // The free uses stand and the screen still opens.
    }

    return counts;
}

function writeStore(counts) {
    try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(counts));
    } catch (e) {
        // Nothing worth stopping the game for.
    }
}

/**
 * The card between the home screen and the board: which level is next, what
 * it asks for, and which boosters to take into it. onPlay is handed the
 * boosters picked, as a flag for each one in BOOSTERS. Spending one is left to the
 * level, through spend().
 */
export class LevelScreen extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0, onPlay = null) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.onPlay = onPlay;
        this.onClose = null;
        // Told whenever a booster count changes, here or from the board.
        this.onChange = null;
        // Set while the offer is up on its own over a level, without the card.
        this.inPlay = null;
        this.counts = readStore();
        this.picked = {};
        this.tiles = {};
        this.isOpen = false;

        this.build();

        this.visible = false;
    }


    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);
        this.dim.setInteractive();
        this.add(this.dim);

        this.fitter = this.scene.add.container(0, 0);
        this.add(this.fitter);

        this.buildRays();

        this.card = this.scene.add.container(0, 0);
        this.fitter.add(this.card);

        this.card.add(this.panel(PANEL_W, PANEL_H));

        // Taps on the card land here rather than on the dim.
        const catcher = this.scene.add.zone(0, 0, PANEL_W, PANEL_H);
        catcher.setInteractive();
        this.card.add(catcher);

        this.buildPlate();
        this.buildClose();
        this.buildGoal();

        this.card.add(this.scene.add.rectangle(0, RULE_Y, RULE_HALF * 2, RULE_THICK, RULE));
        this.card.add(this.text(0, PICK_Y, 'Select boosters:', PICK_SIZE, INK));

        for (let i = 0; i < BOOSTERS.length; i++) {
            this.buildTile(BOOSTERS[i], (i - (BOOSTERS.length - 1) / 2) * TILE_GAP);
        }

        this.buildNote();

        this.playButton = this.green(0, PLAY_Y, PLAY_W, PLAY_H, 'Play', PLAY_SIZE, () => this.play(), PLAY_STROKE);
        this.playButton.label.y = PLAY_LABEL_Y;
        this.card.add(this.playButton);

        this.playGlint = this.scene.add.image(PLAY_GLINT_X, PLAY_GLINT_Y, GLINT);
        this.playGlint.setScale(0);
        this.playButton.add(this.playGlint);

        // Between the face and the label, so the label stays on top of it.
        const shineBox = { left: -SHINE_W, top: SHINE_TOP, width: SHINE_W + SHINE_GAP + SHINE_THIN + SHINE_SLANT * 2, height: SHINE_BOTTOM - SHINE_TOP };
        this.playShine = bakeShape(this.scene, shineBox, (g) => {
            g.fillStyle(0xffffff, 1);

            for (const [x, w] of[[-SHINE_W, SHINE_W], [SHINE_GAP, SHINE_THIN]]) {
                g.fillPoints([
                    { x: x + SHINE_SLANT * 2, y: SHINE_TOP },
                    { x: x + SHINE_SLANT * 2 + w, y: SHINE_TOP },
                    { x: x + w, y: SHINE_BOTTOM },
                    { x: x, y: SHINE_BOTTOM }
                ], true);
            }
        }, 'level-play-shine');
        this.playShine.setBlendMode(Phaser.BlendModes.ADD);
        this.playShine.alpha = 0;
        this.playShine.box = shineBox;
        this.playButton.addAt(this.playShine, 1);

        this.buildOffer();
    }

    buildPlate() {
        const plate = this.scene.add.container(0, PLATE_Y);

        this.plateTails = {};

        for (const kind in PLATE_STYLES) {
            this.plateTails[kind] = this.plateTail(PLATE_STYLES[kind], kind);
            plate.add(this.plateTails[kind]);
        }

        const face = this.scene.add.nineslice(
            0, 0, 'sheet', PLATE,
            PLATE_W / PLATE_SCALE, PLATE_H / PLATE_SCALE,
            PLATE_CORNER, PLATE_CORNER, 0, 0
        );
        face.setScale(PLATE_SCALE);
        face.setTint(PLATE_TINT);
        plate.add(face);
        this.plateFace = face;

        this.levelText = this.text(0, -2, 'Level 1', PLATE_SIZE, '#ffffff', .5, PLATE_STROKE);
        plate.add(this.levelText);

        this.buildTag(plate);

        this.sparkles = SPARKLES.map((spot) => {
            const sparkle = this.scene.add.image(spot.x, spot.y, GLINT);

            sparkle.setTint(SPARKLE_TINT);
            sparkle.setScale(0);
            sparkle.spot = spot;
            plate.add(sparkle);

            return sparkle;
        });

        plate.modalJolt = PLATE_JOLT;

        this.card.add(plate);
    }

    // The ribbon's folded tails, in one difficulty's colours.
    plateTail(style, kind) {
        return bakeShape(this.scene, { left: -TAIL_OUT, top: TAIL_TOP, width: TAIL_OUT * 2, height: TAIL_BOTTOM - TAIL_TOP }, (g) => {
            const mid = (TAIL_TOP + TAIL_BOTTOM) / 2;

            for (const side of[-1, 1]) {
                g.fillStyle(style.tail, 1);
                g.beginPath();
                g.moveTo(side * TAIL_IN, TAIL_TOP);
                g.lineTo(side * TAIL_OUT, TAIL_TOP);
                g.lineTo(side * (TAIL_OUT - TAIL_NOTCH), mid);
                g.lineTo(side * TAIL_OUT, TAIL_BOTTOM);
                g.lineTo(side * TAIL_IN, TAIL_BOTTOM);
                g.closePath();
                g.fillPath();

                // The fold, where the tail turns under the plate.
                g.fillStyle(style.fold, 1);
                g.fillTriangle(
                    side * TAIL_IN, TAIL_BOTTOM,
                    side * (TAIL_IN + 24), TAIL_BOTTOM,
                    side * TAIL_IN, TAIL_BOTTOM - 14
                );
            }
        }, 'level-plate-tails-' + kind);
    }

    // "HARD" or "SUPER HARD" on a pill hung from the ribbon's foot: a white
    // rim round a face tinted to the ribbon's tail colour.
    buildTag(plate) {
        const tag = this.scene.add.container(0, TAG_Y);
        const outer = { left: -TAG_W / 2 - TAG_EDGE, top: -TAG_H / 2 - TAG_EDGE, width: TAG_W + TAG_EDGE * 2, height: TAG_H + TAG_EDGE * 2 };
        const inner = { left: -TAG_W / 2, top: -TAG_H / 2, width: TAG_W, height: TAG_H };

        tag.add(bakeShape(this.scene, outer, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(outer.left, outer.top, outer.width, outer.height, outer.height / 2);
        }, 'level-tag-rim'));

        tag.face = bakeShape(this.scene, inner, (g) => {
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(inner.left, inner.top, TAG_W, TAG_H, TAG_H / 2);
        }, 'level-tag-face');
        tag.add(tag.face);

        tag.label = this.text(0, -1, '', TAG_SIZE, '#ffffff', .5, '#000000');
        tag.add(tag.label);

        tag.visible = false;
        this.tag = tag;
        plate.add(tag);
    }

    // The ribbon dressed for how hard this level is.
    dressPlate(level) {
        const kind = difficulty(level);
        const style = PLATE_STYLES[kind];
        const tag = this.tag;

        for (const k in this.plateTails) this.plateTails[k].visible = k === kind;

        this.plateFace.setTint(style.face);
        this.levelText.setStroke(style.stroke, Math.round(PLATE_SIZE / 11));

        this.scene.tweens.killTweensOf(tag);
        tag.visible = !!style.tag;

        if (!style.tag) return;

        tag.face.setTint(style.tail);
        tag.label.setText(style.tag);
        tag.label.setStroke(style.stroke, Math.round(TAG_SIZE / 6));
        fitText(tag.label, TAG_W - 24, TAG_SIZE);

        // Pops on as the card lands, to be noticed.
        tag.setScale(0);
        this.scene.tweens.add({
            targets: tag,
            scale: { from: TAG_POP, to: 1 },
            alpha: { from: 0, to: 1 },
            delay: TAG_DELAY,
            duration: TAG_POP_TIME,
            ease: 'Back.easeOut'
        });
    }

    buildRays() {
        const step = Math.PI * 2 / RAYS;
        const half = step / 4;

        this.rays = bakeShape(this.scene, { left: -RAY_R, top: -RAY_R, width: RAY_R * 2, height: RAY_R * 2 }, (g) => {
            g.fillStyle(0xffffff, 1);

            for (let i = 0; i < RAYS; i++) {
                const a = i * step;

                g.fillTriangle(
                    0, 0,
                    Math.cos(a - half) * RAY_R, Math.sin(a - half) * RAY_R,
                    Math.cos(a + half) * RAY_R, Math.sin(a + half) * RAY_R
                );
            }

            // A warm glow at the heart, built up from rings.
            for (let r = 260; r > 0; r -= 40) {
                g.fillStyle(RAY_GLOW, 0.14);
                g.fillCircle(0, 0, r);
            }
        }, 'level-rays', 1);
        this.rays.setPosition(0, RAY_Y);
        this.rays.alpha = 0;
        this.fitter.add(this.rays);
    }

    buildClose() {
        this.card.add(this.closeButton(CLOSE_X, CLOSE_Y, () => this.close()));
    }

    buildGoal() {
        this.card.add(this.text(0, GOAL_Y, 'Guide all carts to their garages', GOAL_SIZE, INK));

        const roadBox = { left: ROAD_LEFT, top: ROAD_Y - ROAD_H / 2, width: ROAD_RIGHT - ROAD_LEFT, height: ROAD_H };
        this.card.add(bakeShape(this.scene, roadBox, (g) => {
            g.fillStyle(ROAD_FILL, 1);
            g.fillRoundedRect(roadBox.left, roadBox.top, roadBox.width, ROAD_H, ROAD_H / 2);
            g.fillStyle(ROAD_DASH, 1);

            for (let x = ROAD_LEFT + 18; x < ROAD_RIGHT - 30; x += 30) g.fillRoundedRect(x, ROAD_Y - 2, 16, 4, 2);
        }));

        this.puffs = [];

        for (let i = 0; i < PUFFS; i++) {
            const puff = bakeShape(this.scene, { left: -PUFF_R, top: -PUFF_R, width: PUFF_R * 2, height: PUFF_R * 2 }, (g) => {
                g.fillStyle(PUFF_FILL, 1);
                g.fillCircle(0, 0, PUFF_R);
            }, 'level-puff');
            puff.setPosition(CONVOY_X, ART_Y);
            puff.alpha = 0;
            this.card.add(puff);
            this.puffs.push(puff);
        }

        const convoy = this.scene.add.sprite(CONVOY_X, ART_Y, 'sheet', 'home/convoy');
        // The art faces left; turned to face the garage it drives into.
        convoy.setFlipX(true);
        convoy.setScale(CONVOY_SCALE);
        this.card.add(convoy);
        this.convoy = convoy;

        const arrow = bakeShape(this.scene, { left: -14, top: -14, width: 30, height: 28 }, (g) => {
            g.fillStyle(ARROW_COLOR, 1);
            g.fillRoundedRect(-14, -6, 16, 12, 3);
            g.fillTriangle(0, -14, 0, 14, 16, 0);
        });
        arrow.setPosition(ARROW_X, ART_Y);
        this.card.add(arrow);
        this.arrow = arrow;

        const garage = this.scene.add.sprite(GARAGE_X, ART_Y, 'luggages', 'white/garage');
        garage.setScale(GARAGE_SCALE);
        this.card.add(garage);
        this.garage = garage;

        this.burst = [];

        for (let i = 0; i < BURST; i++) {
            const glint = this.scene.add.image(GARAGE_X, ART_Y, GLINT);

            glint.setTint(BURST_TINT);
            glint.alpha = 0;
            this.card.add(glint);
            this.burst.push(glint);
        }
    }

    buildTile(booster, x) {
        const tile = this.scene.add.container(x, TILE_Y);

        tile.base = this.scene.add.sprite(0, 0, 'sheet', BASE);
        tile.base.setScale(BASE_SCALE);
        tile.add(tile.base);

        const ringR = RING_R + RING_THICK;

        tile.ring = bakeShape(this.scene, { left: -ringR, top: -ringR, width: ringR * 2, height: ringR * 2 }, (g) => {
            g.fillStyle(RING_FILL, 1);
            g.fillCircle(0, 0, RING_R);
            g.lineStyle(RING_THICK, RING_LINE, 1);
            g.strokeCircle(0, 0, RING_R);
        }, 'level-ring');
        tile.add(tile.ring);

        const icon = this.scene.add.sprite(0, 0, 'sheet', booster.icon);
        icon.setScale(ICON_SCALE);
        tile.add(icon);
        tile.icon = icon;

        tile.count = this.badge(COUNT_X, COUNT_Y, BADGE_R, '');
        tile.count.setScale(TILE_BADGE_SCALE);
        tile.add(tile.count);

        tile.check = this.badge(CHECK_X, CHECK_Y, BADGE_R, null);
        tile.check.setScale(TILE_BADGE_SCALE);
        tile.add(tile.check);

        tile.lock = this.lockBadge();
        tile.lock.setPosition(COUNT_X, COUNT_Y);
        tile.lock.setScale(tile.lock.restScale * TILE_BADGE_SCALE);
        tile.add(tile.lock);

        tile.setScale(TILE_SCALE);
        this.pressable(tile, TILE_HIT, TILE_HIT, () => this.pick(booster));

        tile.label = this.text(x, TILE_Y + LABEL_Y, booster.label, LABEL_SIZE, INK);
        fitText(tile.label, TILE_ROOM, LABEL_SIZE);
        tile.more = this.text(x, TILE_Y + MORE_Y, 'Get more', MORE_SIZE, PURPLE);

        this.card.add(tile);
        this.card.add(tile.label);
        this.card.add(tile.more);

        this.tiles[booster.key] = tile;
    }

    buildNote() {
        const noteBox = { left: -NOTE_W / 2, top: NOTE_Y - NOTE_H / 2, width: NOTE_W, height: NOTE_H };
        const back = bakeShape(this.scene, noteBox, (g) => {
            g.fillStyle(NOTE_FILL, 1);
            g.fillRoundedRect(noteBox.left, noteBox.top, NOTE_W, NOTE_H, NOTE_H / 2);
        });
        this.card.add(back);

        this.card.add(this.text(0, NOTE_Y, NOTE, NOTE_SIZE, INK));
    }

    buildOffer() {
        const offer = this.scene.add.container(0, 0);

        offer.dim = this.scene.add.rectangle(0, 0, FIT_W * 3, FIT_H * 3, DIM, OFFER_DIM_ALPHA);
        offer.dim.setInteractive();
        offer.add(offer.dim);

        const card = this.scene.add.container(0, 0);
        offer.add(card);

        card.add(this.panel(OFFER_W, OFFER_H));

        const catcher = this.scene.add.zone(0, 0, OFFER_W, OFFER_H);
        catcher.setInteractive();
        card.add(catcher);

        card.add(this.closeButton(OFFER_CLOSE_X, OFFER_CLOSE_Y, () => this.hideOffer()));

        offer.title = this.text(0, OFFER_TITLE_Y, '', OFFER_TITLE_SIZE, INK);
        card.add(offer.title);

        offer.icon = this.scene.add.sprite(0, OFFER_ICON_Y, 'sheet', BOOSTERS[0].icon);
        offer.icon.setScale(OFFER_ICON_SCALE);
        card.add(offer.icon);

        card.add(this.badge(OFFER_BADGE_X, OFFER_ICON_Y + OFFER_BADGE_Y, OFFER_BADGE_R, '×' + PACK_COUNT));

        offer.line = this.text(0, OFFER_LINE_Y, '', OFFER_LINE_SIZE, INK);
        card.add(offer.line);

        const price = this.scene.add.container(0, OFFER_PRICE_Y);

        const priceBox = { left: -OFFER_PRICE_W / 2, top: -OFFER_PRICE_H / 2, width: OFFER_PRICE_W, height: OFFER_PRICE_H };
        const back = bakeShape(this.scene, priceBox, (g) => {
            g.fillStyle(NOTE_FILL, 1);
            g.fillRoundedRect(priceBox.left, priceBox.top, OFFER_PRICE_W, OFFER_PRICE_H, 18);
        });
        price.add(back);

        const coin = this.scene.add.sprite(OFFER_COIN_X, 0, 'sheet', 'home/coin-icon');
        coin.setScale(OFFER_COIN_SCALE);
        price.add(coin);

        const amount = this.text(OFFER_COIN_X + 32, 0, String(PACK_PRICE), OFFER_PRICE_SIZE, INK, 0);
        price.add(amount);
        price.add(this.text(amount.x + amount.width + 8, 3, 'coins', OFFER_UNIT_SIZE, '#6f78c8', 0));

        card.add(price);

        offer.buyButton = this.green(
            0, OFFER_BUY_Y, OFFER_BUY_W, OFFER_BUY_H,
            'Buy · ' + PACK_PRICE + ' coins', OFFER_BUY_SIZE, () => this.buy(), PLAY_STROKE
        );
        card.add(offer.buyButton);

        const cancel = this.scene.add.container(0, OFFER_CANCEL_Y);
        cancel.add(this.text(0, 0, 'Cancel', OFFER_CANCEL_SIZE, PURPLE));
        this.pressable(cancel, OFFER_CANCEL_HIT_W, OFFER_CANCEL_HIT_H, () => this.hideOffer());
        card.add(cancel);

        offer.card = card;
        offer.visible = false;

        // Beside the card rather than on it, so it can also stand on its own
        // over a level, when the boosters are played from the board.
        this.offer = offer;
        this.fitter.add(offer);
    }


    panel(width, height) {
        return this.scene.add.nineslice(
            0, 0, 'panel_modal', null,
            width / PANEL_SCALE + PANEL_PAD_X,
            height / PANEL_SCALE + PANEL_PAD_Y,
            PANEL_CORNER_X, PANEL_CORNER_X, PANEL_CORNER_Y, PANEL_CORNER_Y
        ).setScale(PANEL_SCALE);
    }

    closeButton(x, y, onPress) {
        const close = this.scene.add.container(x, y);

        const base = this.scene.add.sprite(0, 0, 'sheet', CLOSE_BASE);
        base.setScale(CLOSE_BASE_SCALE);
        close.add(base);

        const cross = this.scene.add.graphics();
        cross.lineStyle(CLOSE_THICK, 0xffffff, 1);
        cross.lineBetween(-CLOSE_ARM, -CLOSE_ARM, CLOSE_ARM, CLOSE_ARM);
        cross.lineBetween(-CLOSE_ARM, CLOSE_ARM, CLOSE_ARM, -CLOSE_ARM);
        close.add(cross);

        this.pressable(close, CLOSE_HIT, CLOSE_HIT, onPress);

        return close;
    }

    // A navy disc with a white padlock on it, where the count would be.
    lockBadge() {
        const outer = LOCK_R + BADGE_EDGE_THICK;
        const s = LOCK_R / 17;

        return bakeShape(this.scene, { left: -outer, top: -outer, width: outer * 2, height: outer * 2 }, (g) => {
            g.fillStyle(BADGE_EDGE, 1);
            g.fillCircle(0, 0, outer);
            g.fillStyle(LOCK_FILL, 1);
            g.fillCircle(0, 0, LOCK_R);

            g.lineStyle(3.5 * s, 0xffffff, 1);
            g.beginPath();
            g.arc(0, -2 * s, 5.5 * s, Math.PI, 0);
            g.strokePath();
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(-8.5 * s, -2 * s, 17 * s, 12 * s, 3 * s);
            g.fillStyle(LOCK_FILL, 1);
            g.fillCircle(0, 3.5 * s, 2 * s);
        }, 'level-lock');
    }

    // Open only once the level it comes with has unlocked it in front of the
    // player (its lesson), so the card never shows it ready before that.
    isLocked(key) {
        return !unlocks.isUnlocked(key, this.level || 1) || !unlocks.wasTaught(key);
    }

    // Due to open in the level this card is for, but not open yet.
    opensThisLevel(key) {
        return unlocks.isUnlocked(key, this.level || 1) && !unlocks.wasTaught(key);
    }

    // A round purple badge. A null label draws a tick instead of text.
    badge(x, y, radius, label) {
        const badge = this.scene.add.container(x, y);

        const outer = radius + BADGE_EDGE_THICK;
        const disc = bakeShape(this.scene, { left: -outer, top: -outer, width: outer * 2, height: outer * 2 }, (g) => {
            g.fillStyle(BADGE_EDGE, 1);
            g.fillCircle(0, 0, outer);
            g.fillStyle(BADGE_FILL, 1);
            g.fillCircle(0, 0, radius);
        }, 'level-badge-' + radius);
        badge.add(disc);

        if (label === null) {
            const tick = this.scene.add.graphics();
            const s = radius / 21;

            tick.lineStyle(5 * s, 0xffffff, 1);
            tick.beginPath();
            tick.moveTo(-9 * s, 0);
            tick.lineTo(-2 * s, 7 * s);
            tick.lineTo(10 * s, -7 * s);
            tick.strokePath();
            badge.add(tick);
        } else {
            badge.label = this.text(0, -1, label, BADGE_SIZE * radius / BADGE_R, '#ffffff');
            badge.add(badge.label);
        }

        return badge;
    }

    green(x, y, width, height, label, size, onPress, stroke) {
        const button = this.scene.add.container(x, y);

        const face = this.scene.add.nineslice(
            0, 0, GREEN, null,
            width / GREEN_SCALE, height / GREEN_SCALE,
            GREEN_CORNER_X, GREEN_CORNER_X, GREEN_CORNER_Y, GREEN_CORNER_Y
        );
        face.setScale(GREEN_SCALE);
        button.add(face);
        button.face = face;

        button.label = this.text(0, -3, label, size, '#ffffff', .5, stroke);
        button.add(button.label);

        this.pressable(button, width, height, onPress);

        return button;
    }

    text(x, y, content, size, color, originX = .5, stroke = null) {
        const style = {
            fontFamily: 'FredokaOne_Regular',
            fontSize: size,
            color: color
        };

        if (stroke) {
            style.stroke = stroke;
            style.strokeThickness = Math.round(size / 11);
        }

        const text = this.scene.add.text(x, y, content, style);

        text.setOrigin(originX, .5);
        text.setResolution(this.textRes);

        return text;
    }

    pressable(target, width, height, onPress) {
        pressable(this.scene, target, width, height, onPress);
    }


    refresh() {
        for (let i = 0; i < BOOSTERS.length; i++) {
            const key = BOOSTERS[i].key;
            const tile = this.tiles[key];
            const left = this.counts[key];
            const locked = this.isLocked(key);

            if (locked) this.picked[key] = false;

            const on = !!this.picked[key];

            tile.base.visible = !on;
            tile.ring.visible = on;
            tile.check.visible = on;

            tile.count.label.setText(left > 0 ? String(left) : '+');
            fitText(tile.count.label, BADGE_ROOM, left > 0 ? BADGE_SIZE : PLUS_SIZE);

            tile.count.visible = !locked;
            tile.lock.visible = locked;

            if (locked) {
                tile.base.setTint(LOCKED_BASE);
                tile.icon.setTint(LOCKED_ICON);
                tile.icon.alpha = LOCKED_ICON_ALPHA;
            } else {
                tile.base.clearTint();
                tile.icon.clearTint();
                tile.icon.alpha = 1;
            }

            tile.label.setColor(locked ? LOCKED_INK : INK);
            tile.more.setText(!locked ? 'Get more' :
                this.opensThisLevel(key) ? 'Opens now!' :
                'Level ' + UNLOCK_AT[key]);
            fitText(tile.more, TILE_ROOM, MORE_SIZE);
            tile.more.setColor(locked ? LOCKED_INK : PURPLE);
            tile.more.visible = locked || left <= 0;
        }
    }

    pick(booster) {
        const key = booster.key;

        if (this.isLocked(key)) {
            this.shake(this.tiles[key]);
            return;
        }

        if (this.counts[key] <= 0) {
            this.showOffer(booster);
            return;
        }

        this.picked[key] = !this.picked[key];
        this.refresh();

        if (this.picked[key]) this.popCheck(this.tiles[key].check);
    }

    shake(tile) {
        SoundManager.fx(this.scene, 'bump', 0.5);
        this.scene.tweens.killTweensOf(tile);
        tile.angle = 0;

        this.scene.tweens.add({
            targets: tile,
            angle: { from: -6, to: 6 },
            duration: 60,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut',
            onComplete: () => { tile.angle = 0; }
        });
    }

    popCheck(check) {
        SoundManager.fx(this.scene, 'grab', 0.5);
        this.scene.tweens.killTweensOf(check);

        check.setScale(0);
        this.scene.tweens.add({
            targets: check,
            scale: { from: CHECK_POP * TILE_BADGE_SCALE, to: TILE_BADGE_SCALE },
            duration: CHECK_POP_TIME * 2,
            ease: 'Back.easeOut'
        });
    }

    // Uses one of a booster up. The level calls it when one is played, and
    // gets false back if there were none left to use.
    spend(key) {
        if (!(this.counts[key] > 0)) return false;

        this.counts[key]--;
        writeStore(this.counts);
        this.changed();

        if (this.counts[key] <= 0) this.picked[key] = false;

        this.refresh();

        return true;
    }

    showOffer(booster) {
        const offer = this.offer;

        offer.booster = booster;
        offer.title.setText(booster.title);
        offer.icon.setFrame(booster.icon);
        offer.line.setText(PACK_COUNT + ' ' + booster.noun + ' for ' + PACK_PRICE + ' coins');
        fitText(offer.title, OFFER_W - OFFER_EDGE * 2, OFFER_TITLE_SIZE);
        fitText(offer.line, OFFER_W - OFFER_EDGE * 2, OFFER_LINE_SIZE);

        offer.visible = true;

        openModal(this.scene, offer.dim, offer.card, OFFER_DIM_ALPHA);
    }

    hideOffer(onDone = null) {
        const offer = this.offer;

        if (!offer.visible) return;

        shutModal(this.scene, offer.dim, offer.card, () => {
            offer.visible = false;
            if (onDone) onDone();

            if (this.inPlay && !this.isOpen) {
                const done = this.inPlay;

                this.inPlay = null;
                this.visible = false;
                this.dim.visible = true;
                this.card.visible = true;
                this.rays.visible = true;

                done();
            }
        });
    }

    changed() {
        if (this.onChange) this.onChange(this.counts);
    }

    /**
     * Puts the "get more" offer up on its own, over a level, for a booster
     * that has run out on the board. onDone runs once it is closed, bought or
     * not.
     */
    offerDuringPlay(key, onDone = null) {
        const booster = BOOSTERS.find((b) => b.key === key);

        if (!booster || this.isOpen || this.offer.visible) return;

        this.inPlay = onDone || (() => {});
        this.visible = true;
        this.dim.visible = false;
        this.card.visible = false;
        this.rays.visible = false;

        this.showOffer(booster);
    }

    // Paid for out of the coin counter. Short of coins, the store is opened
    // instead, over this card.
    buy() {
        const booster = this.offer.booster;
        const coin = this.scene.coin;

        if (!coin || coin.value < PACK_PRICE) {
            this.scene.events.emit('store:open');
            return;
        }

        coin.set(coin.value - PACK_PRICE);
        coin.pop();

        this.counts[booster.key] += PACK_COUNT;
        writeStore(this.counts);
        this.changed();

        this.hideOffer(() => {
            this.picked[booster.key] = true;
            this.refresh();
            this.popCheck(this.tiles[booster.key].check);
        });

        this.refresh();
    }

    play() {
        if (!this.isOpen) return;

        const picked = {};

        for (let i = 0; i < BOOSTERS.length; i++) {
            const key = BOOSTERS[i].key;
            picked[key] = !!this.picked[key] && this.counts[key] > 0;
        }

        this.hide();

        if (this.onPlay) this.onPlay(picked);
    }


    close() {
        if (!this.isOpen) return;

        this.hide();

        if (this.onClose) this.onClose();
    }

    show(level = 1) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.visible = true;
        this.dim.visible = true;
        this.card.visible = true;
        this.rays.visible = true;

        this.level = level;
        this.levelText.setText('Level ' + level);
        fitText(this.levelText, PLATE_W - PLATE_EDGE * 2, PLATE_SIZE);
        this.dressPlate(level);

        this.offer.visible = false;
        this.refresh();

        this.raysIn();

        dropModal(this.scene, this.dim, this.card, DIM_ALPHA, () => {
            if (this.isOpen) {
                this.beat();
                this.shine();
                this.drive();
                this.idle();
            }
        });
    }

    // Swells the Play button's face and label, not the button, so a press on
    // it (which scales the button) never fights the beat.
    beat() {
        this.stopBeat();

        const button = this.playButton;

        this.beatRun = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: PLAY_BEAT_TIME,
            yoyo: true,
            repeat: -1,
            repeatDelay: PLAY_BEAT_REST,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const swell = 1 + PLAY_BEAT * tween.getValue();

                button.face.setScale(GREEN_SCALE * swell);
                button.label.setScale(swell);

                this.playGlint.setScale(PLAY_GLINT * tween.getValue());
                this.playGlint.angle = 90 * tween.getValue();
            }
        });
    }

    // Sweeps the shine across Play's face, cropped to the face's inside.
    shine() {
        this.stopShine();

        const shine = this.playShine;
        const box = shine.box;
        const res = 1 / shine.restScale;
        const from = -PLAY_W / 2 + SHINE_INSET - (box.left + box.width);
        const to = PLAY_W / 2 - SHINE_INSET - box.left;

        this.shineRun = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: SHINE_TIME,
            repeat: -1,
            repeatDelay: SHINE_REST,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const p = tween.getValue();
                const x = from + (to - from) * p;
                const left = x + box.left;

                shine.x = x;
                shine.alpha = SHINE_ALPHA * Math.sin(Math.PI * p);
                shine.setCrop(
                    Math.max(0, (-PLAY_W / 2 + SHINE_INSET - left) * res), 0,
                    Math.max(0, (PLAY_W / 2 - SHINE_INSET - Math.max(left, -PLAY_W / 2 + SHINE_INSET)) * res), shine.height
                );
            }
        });
    }

    stopShine() {
        if (!this.shineRun) return;

        this.shineRun.remove();
        this.shineRun = null;
        this.playShine.alpha = 0;
    }

    stopBeat() {
        if (!this.beatRun) return;

        this.beatRun.remove();
        this.beatRun = null;
        this.playButton.face.setScale(GREEN_SCALE);
        this.playButton.label.setScale(1);
        this.playGlint.setScale(0);
    }

    drive() {
        this.stopDrive();

        const Ease = Phaser.Math.Easing;
        const clamp01 = (v) => Math.min(1, Math.max(0, v));

        this.driveRun = this.scene.tweens.addCounter({
            from: 0,
            to: DRIVE_ROUND,
            duration: DRIVE_ROUND,
            repeat: -1,
            onUpdate: (tween) => {
                const at = tween.getValue();
                const convoy = this.convoy;

                this.exhaust(at);
                this.flash(at);

                if (at < RETURN_AT) {
                    const t = clamp01(at / DRIVE_END);
                    const sink = clamp01((t - DRIVE_SINK) / (1 - DRIVE_SINK));
                    const scale = 1 - (1 - SINK_SCALE) * Ease.Quadratic.In(sink);

                    // Steered by its leading (right) end, which runs from where
                    // it starts to the garage's middle, so the convoy shrinks
                    // into the garage rather than poking out past it.
                    const half = convoy.width * CONVOY_SCALE / 2;
                    const lead = CONVOY_X + half + (GARAGE_X - CONVOY_X - half) * Ease.Sine.InOut(t);

                    convoy.setScale(CONVOY_SCALE * scale);
                    convoy.x = lead - half * scale;
                    convoy.alpha = 1 - Ease.Quadratic.In(sink);

                    // Whatever has gone past the garage's middle is inside it.
                    const left = convoy.x - convoy.displayWidth / 2;

                    convoy.setCrop(0, 0, Math.max(0, (GARAGE_X - left) / convoy.scaleX), convoy.height);
                } else {
                    const p = Ease.Back.Out(clamp01((at - RETURN_AT) / RETURN_TIME));

                    convoy.x = CONVOY_X - RETURN_FROM * (1 - p);
                    convoy.setScale(CONVOY_SCALE);
                    convoy.setCrop();
                    convoy.alpha = clamp01((at - RETURN_AT) / RETURN_TIME * 2);
                }

                // The arrow fades as the convoy's nose comes up to it, and
                // back once the new one is in.
                const near = at < RETURN_AT ? clamp01((convoy.x - (ARROW_X - ARROW_CLEAR * 2)) / ARROW_CLEAR) : 1 - convoy.alpha;

                this.arrow.alpha = 1 - near;

                const bump = clamp01((at - BUMP_AT) / BUMP_TIME);

                this.garage.setScale(GARAGE_SCALE * (1 + BUMP * Math.sin(bump * Math.PI)));
            }
        });
    }

    stopDrive() {
        if (!this.driveRun) return;

        this.driveRun.remove();
        this.driveRun = null;
        this.convoy.setPosition(CONVOY_X, ART_Y);
        this.convoy.setScale(CONVOY_SCALE);
        this.convoy.setCrop();
        this.convoy.alpha = 1;
        this.arrow.alpha = 1;
        this.garage.setScale(GARAGE_SCALE);
        this.puffs.forEach((puff) => { puff.alpha = 0; });
        this.burst.forEach((glint) => { glint.alpha = 0; });
    }

    // Puffs left at the convoy's tail while it drives, each living PUFF_LIFE
    // from when it was let go: puff i goes at i * PUFF_EVERY into the drive.
    exhaust(at) {
        for (let i = 0; i < this.puffs.length; i++) {
            const puff = this.puffs[i];
            const born = 60 + i * PUFF_EVERY;
            const p = (at - born) / PUFF_LIFE;

            if (p < 0 || p > 1) {
                puff.alpha = 0;
                if (p < 0) puff.startX = null;
                continue;
            }

            // Pinned where the tail was when it was let go.
            if (puff.startX == null) puff.startX = this.convoy.x - this.convoy.displayWidth / 2 + 6;

            puff.x = puff.startX - 14 * p;
            puff.y = ROAD_Y - 10 - PUFF_RISE * p;
            puff.setScale(puff.restScale * (0.5 + 0.9 * p));
            puff.alpha = 0.85 * (1 - p);
        }
    }

    // Glints flung out of the garage as it takes the convoy.
    flash(at) {
        const p = (at - BUMP_AT) / BURST_TIME;

        for (let i = 0; i < this.burst.length; i++) {
            const glint = this.burst[i];

            if (p < 0 || p > 1) {
                glint.alpha = 0;
                continue;
            }

            // Fanned over the top half, so none falls through the road.
            const turn = Math.PI + (i + 0.5) / this.burst.length * Math.PI;
            const out = Phaser.Math.Easing.Cubic.Out(p);

            glint.x = GARAGE_X + Math.cos(turn) * BURST_REACH * out;
            glint.y = ART_Y + Math.sin(turn) * BURST_REACH * out;
            glint.setScale(BURST_SCALE * (1 - p * p));
            glint.angle = 180 * p;
            glint.alpha = 1;
        }
    }

    raysIn() {
        const rays = this.rays;

        this.scene.tweens.killTweensOf(rays);
        rays.alpha = 0;
        rays.setScale(rays.restScale * 0.6);

        this.scene.tweens.add({
            targets: rays,
            alpha: RAY_ALPHA,
            scale: rays.restScale,
            duration: RAYS_IN,
            ease: 'Back.easeOut'
        });
    }

    raysOut() {
        this.scene.tweens.killTweensOf(this.rays);

        this.scene.tweens.add({
            targets: this.rays,
            alpha: 0,
            duration: RAYS_OUT,
            ease: 'Sine.easeIn'
        });
    }

    // What keeps moving while the card waits: the rays turn, the sparkles on
    // the plate twinkle in turn, and the open boosters float, the picked
    // one's ring breathing.
    idle() {
        this.stopIdle();

        const turn = 360 / RAYS;
        const startAngle = this.rays.angle;

        this.idleRun = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: IDLE_ROUND,
            repeat: -1,
            onUpdate: (tween) => {
                const t = tween.getValue();

                this.rays.angle = startAngle + turn * t;

                this.sparkles.forEach((sparkle) => {
                    const p = ((t - sparkle.spot.at + 1) % 1) / SPARKLE_LIFE;
                    const on = p < 1 ? Math.sin(p * Math.PI) : 0;

                    sparkle.setScale(sparkle.spot.size * on);
                    sparkle.angle = 120 * p;
                });

                BOOSTERS.forEach((booster, i) => {
                    const tile = this.tiles[booster.key];
                    const wave = Math.sin((t * 3 + i * 0.5) * Math.PI * 2);

                    tile.icon.y = this.isLocked(booster.key) ? 0 : FLOAT * wave;
                    tile.ring.setScale(tile.ring.restScale * (1 + RING_PULSE * wave));
                });
            }
        });
    }

    stopIdle() {
        if (!this.idleRun) return;

        this.idleRun.remove();
        this.idleRun = null;
        this.sparkles.forEach((sparkle) => sparkle.setScale(0));

        BOOSTERS.forEach((booster) => {
            const tile = this.tiles[booster.key];

            tile.icon.y = 0;
            tile.ring.setScale(tile.ring.restScale);
        });
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.stopBeat();
        this.stopShine();
        this.stopDrive();
        this.stopIdle();
        this.raysOut();

        liftModal(this.scene, this.dim, this.card, () => {
            if (!this.isOpen) this.visible = false;
        });
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        this.dim.setSize(dimensions.actualWidth, dimensions.actualHeight);

        if (this.dim.input) this.dim.input.hitArea.setSize(dimensions.actualWidth, dimensions.actualHeight);

        this.fitter.setScale(Math.min(
            1,
            (dimensions.gameHeight - MODAL_MARGIN * 2) / FIT_H,
            (dimensions.gameWidth - MODAL_MARGIN * 2) / FIT_W
        ));
    }
}