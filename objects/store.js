// The Store: the button under Play on the home screen, and the card it opens.
//
// Nothing in here talks to a payments or an ad SDK. A press only says what was
// asked for on the scene - 'store:buy' with the offer, 'store:video',
// 'store:restore' - and whatever is wired to those is free to charge for it and
// pay it out.

import { pressable } from '../utils/buttons.js';
import { makeCoinPill } from './coin.js';

// Packed at the size the home pack lays it out at on its 1080 x 1920 canvas,
// which is twice the 540 x 960 the game is laid out in.
const ART_SCALE = 0.5;

const FACE = 'home/store-button';

const HIT_W = 350;
const HIT_H = 90;

const ICON = 'home/store-icon';
const ICON_X = -93;
const ICON_Y = -4;

const LABEL = 'Store';
const LABEL_X = 34;
const LABEL_Y = -4;
const LABEL_SIZE = 46;

// ---- the card --------------------------------------------------------------

const PANEL_W = 470;
const PANEL_H = 670;

const PANEL_SCALE = 0.56;
const PANEL_PAD_X = 44;
const PANEL_PAD_Y = 131;
const PANEL_CORNER_X = 125;
const PANEL_CORNER_Y = 150;

const MODAL_MARGIN = 24;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const INK = '#283085';
const MUTED = '#6d7793';
const RULE = 0xded9f4;
const RULE_THICK = 3;
const RULE_HALF = 190;

const TITLE_X = -200;
const TITLE_Y = -287;
const TITLE_SIZE = 54;

const PILL_X = 78;
const PILL_Y = -287;
const PILL_SCALE = 0.78;

const CLOSE_X = 196;
const CLOSE_Y = -287;
const CLOSE_SCALE = 0.72;
const CLOSE_HIT = 78;

// The two tinted blocks are drawn rather than dressed: a flat fill with the
// card's own corner is all the storyboard asks of them.
const BLOCK_W = 436;
const BLOCK_CORNER = 26;
const ADS_FILL = 0xfdeceb;
const WATCH_FILL = 0xeaf1fd;

const ADS_Y = -138;
const ADS_H = 210;

const ADS_ICON_X = -147;
const ADS_ICON_Y = -20;
const ADS_ICON_SCALE = 0.64;

const ADS_TEXT_X = -60;
const ADS_TITLE_Y = -64;
const ADS_TITLE_SIZE = 34;
const ADS_LINE_Y = [-22, 6];
const ADS_LINE_SIZE = 19;

const ADS_BUY_X = 80;
const ADS_BUY_Y = 62;
const ADS_BUY_W = 257;
const ADS_BUY_H = 62;
const ADS_BUY_SIZE = 40;

// A coin pack is a plain row, with no block behind it.
const PACK_Y = [23, 108];
const PACK_ICON_X = -180;
const PACK_ICON_SCALE = [0.42, 0.52];
const PACK_LABEL_X = -128;
const PACK_LABEL_SIZE = 27;

const BUY_X = 149;
const BUY_W = 145;
const BUY_H = 58;
const BUY_SIZE = 30;

const WATCH_Y = 198;
const WATCH_H = 96;

const WATCH_ICON_X = -180;
const WATCH_ICON_SCALE = 0.8;

const WATCH_TEXT_X = -128;
const WATCH_TITLE_Y = -13;
const WATCH_TITLE_SIZE = 30;
const WATCH_LINE_Y = 17;
const WATCH_LINE_SIZE = 21;

const RULE_Y = 268;

const RESTORE_Y = 302;
const RESTORE_SIZE = 30;
const RESTORE_HIT_W = 300;
const RESTORE_HIT_H = 56;
const RESTORE_LINE = 0x4a5578;

// The green buttons are stretched to each size they are wanted at, so the
// rounded ends keep their shape whatever is written on them.
const GREEN = 'button_green';
const GREEN_SCALE = 0.35;
const GREEN_CORNER_X = 120;
const GREEN_CORNER_Y = 70;

const OPEN_TIME = 300;
const SHUT_TIME = 170;
const OPEN_FROM = 0.72;
const SHUT_TO = 0.86;

const OFFERS = {
    ads: { id: 'remove-ads', price: '$3.99' },
    small: { id: 'coins-500', price: '$0.99', coins: 500 },
    large: { id: 'coins-1200', price: '$1.99', coins: 1200 }
};

const VIDEO_COINS = 100;

export class Store extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0, onOpen = null) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.onOpen = onOpen;

        this.build();
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const button = this.scene.add.container(0, 0);

        const face = this.scene.add.sprite(0, 0, 'sheet', FACE);
        face.setScale(ART_SCALE);
        button.add(face);

        const icon = this.scene.add.sprite(ICON_X, ICON_Y, 'sheet', ICON);
        icon.setScale(ART_SCALE);
        button.add(icon);

        const label = this.scene.add.text(LABEL_X, LABEL_Y, LABEL, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: '#ffffff'
        });
        label.setOrigin(.5);
        label.setResolution(this.textRes);
        button.add(label);

        pressable(this.scene, button, HIT_W, HIT_H, () => this.open());

        this.button = button;
        this.add(button);
    }

    /** Whoever is listening puts the card on the screen. */
    open() {
        this.scene.events.emit('store:open');

        if (this.onOpen) this.onOpen();
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }
}

/**
 * The card the button opens. It belongs to the scene rather than to the home
 * screen, so it covers everything and outlives whatever opened it.
 */
export class StorePanel extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.isOpen = false;

        this.build();

        // The balance is on the screen twice while this is up.
        this.scene.events.on('coin:changed', (value) => this.setBalance(value));
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);
        this.dim.setInteractive();
        this.dim.on('pointerup', () => this.hide());
        this.add(this.dim);

        this.fitter = this.scene.add.container(0, 0);
        this.add(this.fitter);

        this.card = this.scene.add.container(0, 0);
        this.fitter.add(this.card);

        this.card.add(this.scene.add.nineslice(
            0, 0, 'panel_modal', null,
            PANEL_W / PANEL_SCALE + PANEL_PAD_X,
            PANEL_H / PANEL_SCALE + PANEL_PAD_Y,
            PANEL_CORNER_X, PANEL_CORNER_X, PANEL_CORNER_Y, PANEL_CORNER_Y
        ).setScale(PANEL_SCALE));

        // The card eats what lands on it, so only a tap beside it reaches the
        // dim behind and shuts the shop.
        const catcher = this.scene.add.zone(0, 0, PANEL_W, PANEL_H);
        catcher.setInteractive();
        this.card.add(catcher);

        this.buildHeader();
        this.buildAds();
        this.buildPacks();
        this.buildWatch();
        this.buildRestore();

        this.visible = false;
    }

    buildHeader() {
        this.card.add(this.text(TITLE_X, TITLE_Y, 'Store', TITLE_SIZE, INK, 0));

        this.pill = makeCoinPill(this.scene, this.balance(), this.textRes);
        this.pill.setPosition(PILL_X, PILL_Y);
        this.pill.setScale(PILL_SCALE);
        this.card.add(this.pill);

        const close = this.scene.add.container(CLOSE_X, CLOSE_Y);
        const cross = this.scene.add.sprite(0, 0, 'sheet', 'icons/icon-close');

        cross.setScale(CLOSE_SCALE);
        close.add(cross);

        pressable(this.scene, close, CLOSE_HIT, CLOSE_HIT, () => this.hide());
        this.card.add(close);
    }

    buildAds() {
        const block = this.block(ADS_Y, ADS_H, ADS_FILL);

        const icon = this.scene.add.sprite(ADS_ICON_X, ADS_ICON_Y, 'sheet', 'icons/icon-no-ads');
        icon.setScale(ADS_ICON_SCALE);
        block.add(icon);

        block.add(this.text(ADS_TEXT_X, ADS_TITLE_Y, 'Remove Ads', ADS_TITLE_SIZE, INK, 0));
        block.add(this.text(ADS_TEXT_X, ADS_LINE_Y[0], 'No forced ads', ADS_LINE_SIZE, MUTED, 0));
        block.add(this.text(ADS_TEXT_X, ADS_LINE_Y[1], 'Reward videos stay optional', ADS_LINE_SIZE, MUTED, 0));

        block.add(this.green(
            ADS_BUY_X, ADS_BUY_Y, ADS_BUY_W, ADS_BUY_H,
            OFFERS.ads.price, ADS_BUY_SIZE, () => this.buy(OFFERS.ads)
        ));
    }

    buildPacks() {
        const packs = [OFFERS.small, OFFERS.large];

        for (let i = 0; i < packs.length; i++) {
            const pack = packs[i];
            const y = PACK_Y[i];

            const icon = this.scene.add.sprite(PACK_ICON_X, y, 'sheet', 'icons/icon-coin-stack');
            icon.setScale(PACK_ICON_SCALE[i]);
            this.card.add(icon);

            this.card.add(this.text(
                PACK_LABEL_X, y, pack.coins.toLocaleString() + ' coins',
                PACK_LABEL_SIZE, INK, 0
            ));

            this.card.add(this.green(
                BUY_X, y, BUY_W, BUY_H, pack.price, BUY_SIZE, () => this.buy(pack)
            ));
        }
    }

    buildWatch() {
        const block = this.block(WATCH_Y, WATCH_H, WATCH_FILL);

        const icon = this.scene.add.sprite(WATCH_ICON_X, 0, 'sheet', 'icons/icon-video');
        icon.setScale(WATCH_ICON_SCALE);
        block.add(icon);

        block.add(this.text(WATCH_TEXT_X, WATCH_TITLE_Y, '+' + VIDEO_COINS + ' coins', WATCH_TITLE_SIZE, INK, 0));
        block.add(this.text(WATCH_TEXT_X, WATCH_LINE_Y, 'Watch a video', WATCH_LINE_SIZE, MUTED, 0));

        block.add(this.green(BUY_X, 0, BUY_W, BUY_H, 'Watch', BUY_SIZE, () => this.watch()));
    }

    buildRestore() {
        this.card.add(this.scene.add.rectangle(0, RULE_Y, RULE_HALF * 2, RULE_THICK, RULE));

        const restore = this.scene.add.container(0, RESTORE_Y);
        const label = this.text(0, 0, 'Restore purchases', RESTORE_SIZE, INK, .5);

        restore.add(label);

        // Phaser has no underline of its own, so the link is given one.
        restore.add(this.scene.add.rectangle(0, label.height / 2 - 2, label.width, 2, RESTORE_LINE));

        pressable(this.scene, restore, RESTORE_HIT_W, RESTORE_HIT_H, () => this.restore());
        this.card.add(restore);
    }

    /** One of the tinted blocks a row stands on, with the row's own space in it. */
    block(y, height, fill) {
        const block = this.scene.add.container(0, y);
        const back = this.scene.add.graphics();

        back.fillStyle(fill, 1);
        back.fillRoundedRect(-BLOCK_W / 2, -height / 2, BLOCK_W, height, BLOCK_CORNER);
        block.add(back);

        this.card.add(block);

        return block;
    }

    /** A green button at whatever size the row it sits in wants. */
    green(x, y, width, height, label, size, onPress) {
        const button = this.scene.add.container(x, y);

        const face = this.scene.add.nineslice(
            0, 0, GREEN, null,
            width / GREEN_SCALE, height / GREEN_SCALE,
            GREEN_CORNER_X, GREEN_CORNER_X, GREEN_CORNER_Y, GREEN_CORNER_Y
        );

        face.setScale(GREEN_SCALE);
        button.add(face);
        button.add(this.text(0, -2, label, size, '#ffffff', .5));

        pressable(this.scene, button, width, height, onPress);

        return button;
    }

    text(x, y, content, size, color, originX) {
        const text = this.scene.add.text(x, y, content, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: size,
            color: color
        });

        text.setOrigin(originX, .5);
        text.setResolution(this.textRes);

        return text;
    }

    balance() {
        return (this.scene.coin && this.scene.coin.value) || 0;
    }

    setBalance(value) {
        if (this.pill) this.pill.count.setText(String(value));
    }

    // ---- what the buttons ask for -------------------------------------------

    buy(offer) {
        this.scene.events.emit('store:buy', offer);
    }

    watch() {
        this.scene.events.emit('store:video', { coins: VIDEO_COINS });
    }

    restore() {
        this.scene.events.emit('store:restore');
    }

    show() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.visible = true;

        this.setBalance(this.balance());

        this.dim.alpha = 0;
        this.card.setScale(OPEN_FROM);
        this.card.alpha = 0;

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(this.card);

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

        this.scene.tweens.killTweensOf(this.dim);
        this.scene.tweens.killTweensOf(this.card);

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
            ease: 'Quad.easeIn',
            onComplete: () => {
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
            (dimensions.gameHeight - MODAL_MARGIN * 2) / PANEL_H,
            (dimensions.gameWidth - MODAL_MARGIN * 2) / PANEL_W
        ));
    }
}
