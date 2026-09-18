import { pressable } from '../utils/buttons.js';

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

const RULE_Y = -80;

const PICK_Y = -50;
const PICK_SIZE = 28;

const TILE_Y = 42;
const TILE_X = [-96, 96];
const TILE_HIT = 164;

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

const LABEL_Y = 96;
const LABEL_SIZE = 28;
const MORE_Y = 121;
const MORE_SIZE = 20;

const NOTE_Y = 208;
const NOTE_W = 380;
const NOTE_H = 44;
const NOTE_FILL = 0xe8e8fb;
const NOTE_SIZE = 22;
const NOTE = '3 free uses to start';

const PLAY_Y = PANEL_H / 2 + 8;
const PLAY_W = 320;
const PLAY_H = 92;
const PLAY_SIZE = 64;
const PLAY_STROKE = '#1d8a12';

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

const OPEN_TIME = 300;
const SHUT_TIME = 170;
const OPEN_FROM = 0.72;
const SHUT_TO = 0.86;

const CHECK_POP = 1.3;
const CHECK_POP_TIME = 120;

const BOOSTERS = [
    { key: 'remove', icon: 'icons/icon-recycle', label: 'Remove', title: 'Get more removes?', noun: 'removes' },
    { key: 'hint', icon: 'icons/icon-hint', label: 'Hint', title: 'Get more hints?', noun: 'hints' }
];

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
 * boosters picked, as { remove, hint } flags. Spending one is left to the
 * level, through spend().
 */
export class LevelScreen extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0, onPlay = null) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.onPlay = onPlay;
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

        for (let i = 0; i < BOOSTERS.length; i++) this.buildTile(BOOSTERS[i], TILE_X[i]);

        this.buildNote();

        this.playButton = this.green(0, PLAY_Y, PLAY_W, PLAY_H, 'Play', PLAY_SIZE, () => this.play(), PLAY_STROKE);
        this.card.add(this.playButton);

        this.buildOffer();
    }

    buildPlate() {
        const plate = this.scene.add.container(0, PLATE_Y);

        const face = this.scene.add.nineslice(
            0, 0, 'sheet', PLATE,
            PLATE_W / PLATE_SCALE, PLATE_H / PLATE_SCALE,
            PLATE_CORNER, PLATE_CORNER, 0, 0
        );
        face.setScale(PLATE_SCALE);
        face.setTint(PLATE_TINT);
        plate.add(face);

        this.levelText = this.text(0, -2, 'Level 1', PLATE_SIZE, '#ffffff', .5, PLATE_STROKE);
        plate.add(this.levelText);

        this.card.add(plate);
    }

    buildClose() {
        this.card.add(this.closeButton(CLOSE_X, CLOSE_Y, () => this.hide()));
    }

    buildGoal() {
        this.card.add(this.text(0, GOAL_Y, 'Guide all carts to their garages', GOAL_SIZE, INK));

        const convoy = this.scene.add.sprite(CONVOY_X, ART_Y, 'sheet', 'home/convoy');
        convoy.setScale(CONVOY_SCALE);
        this.card.add(convoy);

        const arrow = this.scene.add.graphics();
        arrow.fillStyle(ARROW_COLOR, 1);
        arrow.fillRoundedRect(-14, -6, 16, 12, 3);
        arrow.fillTriangle(0, -14, 0, 14, 16, 0);
        arrow.setPosition(ARROW_X, ART_Y);
        this.card.add(arrow);

        const garage = this.scene.add.sprite(GARAGE_X, ART_Y, 'luggages', 'white/garage');
        garage.setScale(GARAGE_SCALE);
        this.card.add(garage);
    }

    buildTile(booster, x) {
        const tile = this.scene.add.container(x, TILE_Y);

        tile.base = this.scene.add.sprite(0, 0, 'sheet', BASE);
        tile.base.setScale(BASE_SCALE);
        tile.add(tile.base);

        tile.ring = this.scene.add.graphics();
        tile.ring.fillStyle(RING_FILL, 1);
        tile.ring.fillCircle(0, 0, RING_R);
        tile.ring.lineStyle(RING_THICK, RING_LINE, 1);
        tile.ring.strokeCircle(0, 0, RING_R);
        tile.add(tile.ring);

        const icon = this.scene.add.sprite(0, 0, 'sheet', booster.icon);
        icon.setScale(ICON_SCALE);
        tile.add(icon);

        tile.count = this.badge(COUNT_X, COUNT_Y, BADGE_R, '');
        tile.add(tile.count);

        tile.check = this.badge(CHECK_X, CHECK_Y, BADGE_R, null);
        tile.add(tile.check);

        this.pressable(tile, TILE_HIT, TILE_HIT, () => this.pick(booster));

        tile.label = this.text(x, TILE_Y + LABEL_Y, booster.label, LABEL_SIZE, INK);
        tile.more = this.text(x, TILE_Y + MORE_Y, 'Get more', MORE_SIZE, PURPLE);

        this.card.add(tile);
        this.card.add(tile.label);
        this.card.add(tile.more);

        this.tiles[booster.key] = tile;
    }

    buildNote() {
        const back = this.scene.add.graphics();
        back.fillStyle(NOTE_FILL, 1);
        back.fillRoundedRect(-NOTE_W / 2, NOTE_Y - NOTE_H / 2, NOTE_W, NOTE_H, NOTE_H / 2);
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

        const back = this.scene.add.graphics();
        back.fillStyle(NOTE_FILL, 1);
        back.fillRoundedRect(-OFFER_PRICE_W / 2, -OFFER_PRICE_H / 2, OFFER_PRICE_W, OFFER_PRICE_H, 18);
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

        this.offer = offer;
        this.card.add(offer);
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

    // A round purple badge. A null label draws a tick instead of text.
    badge(x, y, radius, label) {
        const badge = this.scene.add.container(x, y);

        const disc = this.scene.add.graphics();
        disc.fillStyle(BADGE_EDGE, 1);
        disc.fillCircle(0, 0, radius + BADGE_EDGE_THICK);
        disc.fillStyle(BADGE_FILL, 1);
        disc.fillCircle(0, 0, radius);
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

        button.add(this.text(0, -3, label, size, '#ffffff', .5, stroke));

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
            const on = !!this.picked[key];

            tile.base.visible = !on;
            tile.ring.visible = on;
            tile.check.visible = on;

            tile.count.label.setText(left > 0 ? String(left) : '+');
            tile.count.label.setFontSize(left > 0 ? BADGE_SIZE : PLUS_SIZE);
            tile.more.visible = left <= 0;
        }
    }

    pick(booster) {
        const key = booster.key;

        if (this.counts[key] <= 0) {
            this.showOffer(booster);
            return;
        }

        this.picked[key] = !this.picked[key];
        this.refresh();

        if (this.picked[key]) this.popCheck(this.tiles[key].check);
    }

    popCheck(check) {
        this.scene.tweens.killTweensOf(check);

        check.setScale(0);
        this.scene.tweens.add({
            targets: check,
            scale: { from: CHECK_POP, to: 1 },
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

        offer.visible = true;
        offer.dim.alpha = 0;
        offer.card.setScale(OPEN_FROM);
        offer.card.alpha = 0;

        this.scene.tweens.killTweensOf([offer.dim, offer.card]);

        this.scene.tweens.add({
            targets: offer.dim,
            alpha: OFFER_DIM_ALPHA,
            duration: OPEN_TIME,
            ease: 'Quad.easeOut'
        });

        this.scene.tweens.add({
            targets: offer.card,
            scale: 1,
            alpha: 1,
            duration: OPEN_TIME,
            ease: 'Back.easeOut'
        });
    }

    hideOffer(onDone = null) {
        const offer = this.offer;

        if (!offer.visible) return;

        this.scene.tweens.killTweensOf([offer.dim, offer.card]);

        this.scene.tweens.add({
            targets: offer.dim,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        this.scene.tweens.add({
            targets: offer.card,
            scale: SHUT_TO,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        // Its own counter rather than the card's tween, which a press on the
        // card could kill.
        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: SHUT_TIME,
            onComplete: () => {
                offer.visible = false;
                if (onDone) onDone();
            }
        });
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


    show(level = 1) {
        if (this.isOpen) return;

        this.isOpen = true;
        this.visible = true;

        this.levelText.setText('Level ' + level);

        this.offer.visible = false;
        this.refresh();

        this.dim.alpha = 0;
        this.card.setScale(OPEN_FROM);
        this.card.alpha = 0;

        this.scene.tweens.killTweensOf([this.dim, this.card]);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: DIM_ALPHA,
            duration: OPEN_TIME,
            ease: 'Quad.easeOut'
        });

        this.scene.tweens.add({
            targets: this.card,
            scale: 1,
            alpha: 1,
            duration: OPEN_TIME,
            ease: 'Back.easeOut'
        });
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;

        this.scene.tweens.killTweensOf([this.dim, this.card]);

        this.scene.tweens.add({
            targets: this.dim,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        this.scene.tweens.add({
            targets: this.card,
            scale: SHUT_TO,
            alpha: 0,
            duration: SHUT_TIME,
            ease: 'Quad.easeIn'
        });

        this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: SHUT_TIME,
            onComplete: () => {
                if (this.isOpen) return;

                this.visible = false;
                this.card.setScale(1);
                this.card.alpha = 1;
            }
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
