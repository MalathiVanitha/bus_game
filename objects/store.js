import { pressable, pointerUp } from '../utils/buttons.js';
import { bakeShape } from '../utils/bake.js';
import { openModal, shutModal } from '../utils/modal.js';
import { fitText } from '../utils/text.js';

const ART_SCALE = 0.645;

const FACE = 'home/store-button';

const HIT_W = 350;
const HIT_H = 90;

const ICON = 'home/store-icon';
const ICON_X = -93;
const ICON_Y = -4;

const LABEL = 'Store';
const LABEL_X = 34;
const LABEL_Y = ICON_Y;
const LABEL_SIZE = 75 * ART_SCALE;

// The panel below is laid out to the storyboard's store card, measured off it
// at 1.26 of its size.
const PANEL_W = 475;
const PANEL_H = 710;
const PANEL_CORNER = 30;
const PANEL_FILL = 0xffffff;
const SHADOW = 0x1a2350;
const SHADOW_ALPHA = 0.22;
const SHADOW_Y = 8;

const MODAL_MARGIN = 24;
// The card sits this far below the middle, so it is fitted as if that much taller at both ends.
const CARD_DROP = 20;

const DIM = 0x101a33;
const DIM_ALPHA = 0.55;

const FONT = 'Baloo2-ExtraBold';
const INK = '#283085';
const SUB = '#4b5391';
const RULE = 0xe4e6f0;
const RULE_THICK = 2;
const RULE_HALF = 212;

const TITLE_X = -200;
const TITLE_Y = -304;
const TITLE_SIZE = 54;

const PILL_X = 78;
const PILL_Y = -299;
const PILL_W = 148;
const PILL_H = 56;
const PILL_EDGE = 0xdfe2f1;
const PILL_RIM = 0xffffff;
const PILL_FILL = 0xeef0fa;
const PILL_COIN = 'home/coin-icon';
const PILL_COIN_X = -38;
const PILL_COIN_SCALE = 0.33;
const PILL_COUNT_X = 28;
const PILL_COUNT_SIZE = 33;
// Clear space kept between the count and the coin, and the pill's edge.
const PILL_COUNT_GAP = 6;
const PILL_COUNT_EDGE = 14;

const CLOSE_X = 197;
const CLOSE_Y = -299;
const CLOSE_ARM = 14;
const CLOSE_THICK = 6;
const CLOSE_INK = 0x5a6394;
const CLOSE_HIT = 78;

const BLOCK_W = 440;
const BLOCK_CORNER = 24;
const BLOCK_EDGE = 2;
const ADS_FILL = 0xfdeaea;
const ADS_EDGE = 0xf8dada;
const WATCH_FILL = 0xeaf1fc;
const WATCH_EDGE = 0xdce6f7;

const ADS_Y = -147;
const ADS_H = 212;

const ADS_ICON_X = -134;
const ADS_ICON_Y = -20;
const ADS_ICON_R = 60;

const ADS_TEXT_X = -49;
const ADS_TITLE_Y = -68;
const ADS_TITLE_SIZE = 39;
const ADS_LINE_Y = [-33, -3];
const ADS_LINE_SIZE = [26, 19];

const ADS_BUY_X = 79;
const ADS_BUY_Y = 62;
const ADS_BUY_W = 293;
const ADS_BUY_H = 75;
const ADS_BUY_SIZE = 42;

const PACK_Y = [19, 101];
const PACK_ICON_X = -166;
const PACK_LABEL_X = -103;
const PACK_LABEL_SIZE = 29;

const BUY_X = 143;
const BUY_W = 187;
const BUY_H = 71;
const BUY_SIZE = 38;

const WATCH_Y = 207;
const WATCH_H = 101;

const WATCH_ICON_X = -162;

const WATCH_BUY_X = 138;
const WATCH_BUY_W = 197;
const WATCH_BUY_H = 77;
const WATCH_BUY_SIZE = 40;

const WATCH_TEXT_X = -101;
const WATCH_TITLE_Y = -13;
const WATCH_TITLE_SIZE = 30;
const WATCH_LINE_Y = 20;
const WATCH_LINE_SIZE = 20;

const RULE_Y = 274;

const RESTORE_Y = 305;
const RESTORE_SIZE = 26;
const RESTORE_INK = '#5b6597';
const RESTORE_LINE = 0x5b6597;
const RESTORE_HIT_W = 300;
const RESTORE_HIT_H = 56;

const GREEN = 'button_green';
const GREEN_SCALE = 0.35;
const GREEN_CORNER_X = 120;
const GREEN_CORNER_Y = 70;

// The no-ads badge: an "ADS" crossed out by a red sign, with a spark either side.
const NO_ADS_RED = 0xf2544d;
const NO_ADS_FACE = 0xfff6f5;
const NO_ADS_RING = 13;
const NO_ADS_SIZE = 44;
const SPARK = 0xf7c332;
const SPARK_THICK = 5;

// Coin piles, drawn rather than packed: the sheet's pack icon is three fat
// coins, where the storyboard has piles of thin ones.
const COIN_W = 34;
const COIN_H = 14;
const COIN_T = 6.3;
const COIN_EDGE = 0xc2700a;
const COIN_SIDE = 0xf29c14;
const COIN_TOP = 0xffcf33;
const COIN_RIM = 0xf5b11c;
const COIN_FACE = 0xffdd55;
const COIN_SHINE = 0xfff1a8;

// Each pile is [x, y of its bottom coin's face, coins high], back to front.
const PILES = [
    [
        [0, -8, 3],
        [-16, 14, 3],
        [16, 14, 3]
    ],
    [
        [-19, 6, 3],
        [19, 6, 3],
        [0, -10, 3],
        [-24, 22, 3],
        [24, 22, 3],
        [0, 24, 3]
    ]
];

// The reward video badge: a blue clapper board with a play mark.
const FILM_W = 66;
const FILM_H = 60;
const FILM_LID = 15;
const FILM_CORNER = 11;
const FILM_EDGE = 0x1c4fd1;
const FILM_FILL = 0x2f6cf2;
const FILM_SHINE = 0x4d86ff;
const FILM_MARK = 0xdfeaff;
const FILM_PLAY = 0xffffff;


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

        const button = this.scene.add.container(0, 19);

        const face = this.scene.add.sprite(0, 0, 'sheet', FACE);
        face.setScale(ART_SCALE);
        button.add(face);

        const icon = this.scene.add.sprite(ICON_X, ICON_Y, 'sheet', ICON);
        icon.setScale(ART_SCALE);
        button.add(icon);

        const label = this.scene.add.text(LABEL_X, LABEL_Y, LABEL, {
            fontFamily: 'FredokaOne_Regular',
            fontSize: LABEL_SIZE,
            color: '#ffffff',
            stroke: '#077efc',
            strokeThickness: 4,
        });
        label.setOrigin(.5);
        label.setResolution(this.textRes);
        button.add(label);

        pressable(this.scene, button, HIT_W, HIT_H, () => this.open());

        this.button = button;
        this.add(button);
    }

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

export class StorePanel extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.isOpen = false;

        this.build();

        this.scene.events.on('coin:changed', (value) => this.setBalance(value));
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        this.dim = this.scene.add.rectangle(0, 0, 10, 10, DIM, DIM_ALPHA);
        this.dim.setInteractive();
        pointerUp(() => this.hide(), this.dim);
        this.add(this.dim);

        this.fitter = this.scene.add.container(0, 0);
        this.add(this.fitter);

        this.card = this.scene.add.container(0, 0);
        this.fitter.add(this.card);

        const back = this.scene.add.graphics();
        back.fillStyle(SHADOW, SHADOW_ALPHA);
        back.fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2 + SHADOW_Y, PANEL_W, PANEL_H, PANEL_CORNER);
        back.fillStyle(PANEL_FILL, 1);
        back.fillRoundedRect(-PANEL_W / 2, -PANEL_H / 2, PANEL_W, PANEL_H, PANEL_CORNER);
        this.card.add(back);

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

        this.pill = this.coinPill();
        this.pill.setPosition(PILL_X, PILL_Y);
        this.card.add(this.pill);

        const close = this.scene.add.container(CLOSE_X, CLOSE_Y);
        const cross = this.scene.add.graphics();

        this.stroke(cross, -CLOSE_ARM, -CLOSE_ARM, CLOSE_ARM, CLOSE_ARM, CLOSE_THICK, CLOSE_INK);
        this.stroke(cross, -CLOSE_ARM, CLOSE_ARM, CLOSE_ARM, -CLOSE_ARM, CLOSE_THICK, CLOSE_INK);
        close.add(cross);

        pressable(this.scene, close, CLOSE_HIT, CLOSE_HIT, () => this.hide());
        this.card.add(close);
    }

    coinPill() {
        const pill = this.scene.add.container(0, 0);
        const base = this.scene.add.graphics();

        base.fillStyle(PILL_EDGE, 1);
        base.fillRoundedRect(-PILL_W / 2, -PILL_H / 2, PILL_W, PILL_H, PILL_H / 2);
        base.fillStyle(PILL_RIM, 1);
        base.fillRoundedRect(-PILL_W / 2 + 2, -PILL_H / 2 + 2, PILL_W - 4, PILL_H - 4, PILL_H / 2 - 2);
        base.fillStyle(PILL_FILL, 1);
        base.fillRoundedRect(-PILL_W / 2 + 5, -PILL_H / 2 + 5, PILL_W - 10, PILL_H - 10, PILL_H / 2 - 5);
        pill.add(base);

        const coin = this.scene.add.sprite(PILL_COIN_X, 0, 'sheet', PILL_COIN);
        coin.setScale(PILL_COIN_SCALE);
        pill.add(coin);

        pill.count = this.text(PILL_COUNT_X, 0, '', PILL_COUNT_SIZE, INK, .5);
        pill.add(pill.count);

        const room = 2 * Math.min(
            PILL_COUNT_X - (PILL_COIN_X + coin.displayWidth / 2 + PILL_COUNT_GAP),
            PILL_W / 2 - PILL_COUNT_EDGE - PILL_COUNT_X
        );

        pill.setCount = (count) => {
            pill.count.setText(String(count));
            fitText(pill.count, room, PILL_COUNT_SIZE);
        };
        pill.setCount(this.balance());

        return pill;
    }

    buildAds() {
        const block = this.block(ADS_Y, ADS_H, ADS_FILL, ADS_EDGE);

        block.add(this.noAdsBadge(ADS_ICON_X, ADS_ICON_Y));

        block.add(this.text(ADS_TEXT_X, ADS_TITLE_Y, 'Remove Ads', ADS_TITLE_SIZE, INK, 0));
        block.add(this.text(ADS_TEXT_X, ADS_LINE_Y[0], 'No forced ads', ADS_LINE_SIZE[0], SUB, 0));
        block.add(this.text(ADS_TEXT_X, ADS_LINE_Y[1], 'Reward videos stay optional', ADS_LINE_SIZE[1], SUB, 0));

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

            this.card.add(this.coinPiles(PACK_ICON_X, y, PILES[i]));

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
        const block = this.block(WATCH_Y, WATCH_H, WATCH_FILL, WATCH_EDGE);

        block.add(this.filmBadge(WATCH_ICON_X, 0));

        block.add(this.text(WATCH_TEXT_X, WATCH_TITLE_Y, '+' + VIDEO_COINS + ' coins', WATCH_TITLE_SIZE, INK, 0));
        block.add(this.text(WATCH_TEXT_X, WATCH_LINE_Y, 'Watch a video', WATCH_LINE_SIZE, SUB, 0));

        block.add(this.green(
            WATCH_BUY_X, 0, WATCH_BUY_W, WATCH_BUY_H,
            'Watch', WATCH_BUY_SIZE, () => this.watch()
        ));
    }

    buildRestore() {
        this.card.add(this.scene.add.rectangle(0, RULE_Y, RULE_HALF * 2, RULE_THICK, RULE));

        const restore = this.scene.add.container(0, RESTORE_Y);
        const label = this.text(0, 0, 'Restore purchases', RESTORE_SIZE, RESTORE_INK, .5);

        restore.add(label);

        restore.add(this.scene.add.rectangle(0, RESTORE_SIZE * .5, label.width, 2, RESTORE_LINE));

        pressable(this.scene, restore, RESTORE_HIT_W, RESTORE_HIT_H, () => this.restore());
        this.card.add(restore);
    }

    noAdsBadge(x, y) {
        const badge = this.scene.add.container(x, y);
        const r = ADS_ICON_R;

        // The ring is a red disc under the face, as a stroked circle leaves a
        // seam where it closes.
        const face = this.scene.add.graphics();
        face.fillStyle(NO_ADS_RED, 1);
        face.fillCircle(0, 0, r);
        face.fillStyle(NO_ADS_FACE, 1);
        face.fillCircle(0, 0, r - NO_ADS_RING);
        badge.add(face);

        badge.add(this.text(0, 0, 'ADS', NO_ADS_SIZE, INK, .5));

        const sign = this.scene.add.graphics();
        const reach = (r - NO_ADS_RING / 2) * Math.SQRT1_2;

        this.stroke(sign, -reach, -reach, reach, reach, NO_ADS_RING, NO_ADS_RED);

        // Short rays off the top right and bottom left of the sign.
        const sparks = [
            [-60, 1.1, 1.22],
            [-38, 1.12, 1.24]
        ];

        for (const [deg, from, to] of sparks) {
            for (const turn of[0, 180]) {
                const a = Phaser.Math.DegToRad(deg + turn);

                this.stroke(
                    sign,
                    Math.cos(a) * r * from, Math.sin(a) * r * from,
                    Math.cos(a) * r * to, Math.sin(a) * r * to,
                    SPARK_THICK, SPARK
                );
            }
        }

        badge.add(sign);

        return badge;
    }

    coinPiles(x, y, piles) {
        const art = this.scene.add.graphics();

        art.setPosition(x, y);

        for (const [px, py, high] of piles) {
            for (let i = 0; i < high; i++) this.coin(art, px, py - i * COIN_T);
        }

        return art;
    }

    // One coin seen from above and to the side, y at the centre of its face.
    coin(art, x, y) {
        const w = COIN_W;
        const h = COIN_H;
        const t = COIN_T;

        art.fillStyle(COIN_EDGE, 1);
        art.fillEllipse(x, y + t, w + 4, h + 4);
        art.fillRect(x - w / 2 - 2, y, w + 4, t);
        art.fillEllipse(x, y, w + 4, h + 4);

        art.fillStyle(COIN_SIDE, 1);
        art.fillEllipse(x, y + t, w, h);
        art.fillRect(x - w / 2, y, w, t);

        art.fillStyle(COIN_TOP, 1);
        art.fillEllipse(x, y, w, h);

        art.fillStyle(COIN_RIM, 1);
        art.fillEllipse(x, y, w * .72, h * .66);

        art.fillStyle(COIN_FACE, 1);
        art.fillEllipse(x, y + .5, w * .6, h * .5);

        art.fillStyle(COIN_SHINE, 1);
        art.fillEllipse(x - w * .26, y - h * .12, w * .14, h * .22);
    }

    filmBadge(x, y) {
        const art = this.scene.add.graphics();
        const w = FILM_W;
        const h = FILM_H;
        const top = -h / 2;
        const body = top + FILM_LID + 2;

        art.setPosition(x, y);

        art.fillStyle(FILM_EDGE, 1);
        art.fillRoundedRect(-w / 2 - 2, top - 2, w + 4, h + 4, FILM_CORNER + 2);

        // The lid, split from the body by a thin gap.
        art.fillStyle(FILM_FILL, 1);
        art.fillRoundedRect(-w / 2, top, w, FILM_LID, { tl: FILM_CORNER - 4, tr: FILM_CORNER - 4, bl: 2, br: 2 });
        art.fillRoundedRect(-w / 2, body, w, h / 2 - body, { tl: 3, tr: 3, bl: FILM_CORNER, br: FILM_CORNER });

        art.fillStyle(FILM_SHINE, 1);
        art.fillRoundedRect(-w / 2 + 3, body + 3, w - 6, 8, 4);

        art.fillStyle(FILM_MARK, 1);
        art.fillRoundedRect(-w / 2 + 6, top + 4, 11, 7, 2);
        art.fillRoundedRect(-w / 2 + 22, top + 4, 22, 7, 2);
        art.fillRoundedRect(w / 2 - 17, top + 4, 11, 7, 2);

        const dotX = w / 2 - 7;
        const dotY = [body + 7, h / 2 - 7];

        art.fillStyle(FILM_PLAY, .9);
        for (const dy of dotY) {
            art.fillCircle(-dotX, dy, 2.5);
            art.fillCircle(dotX, dy, 2.5);
        }

        const mid = (body + h / 2) / 2;

        art.fillStyle(FILM_PLAY, 1);
        art.fillTriangle(-8, mid - 12, -8, mid + 12, 13, mid);

        return art;
    }

    // A line with round ends.
    stroke(art, x1, y1, x2, y2, thick, color) {
        art.lineStyle(thick, color, 1);
        art.lineBetween(x1, y1, x2, y2);
        art.fillStyle(color, 1);
        art.fillCircle(x1, y1, thick / 2);
        art.fillCircle(x2, y2, thick / 2);
    }

    block(y, height, fill) {
        const block = this.scene.add.container(0, y);
        const box = { left: -BLOCK_W / 2, top: -height / 2, width: BLOCK_W, height: height };
        const back = bakeShape(this.scene, box, (g) => {
            g.fillStyle(fill, 1);
            g.fillRoundedRect(box.left, box.top, BLOCK_W, height, BLOCK_CORNER);
        });
        block.add(back);

        this.card.add(block);

        return block;
    }


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
            fontFamily: FONT,
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
        if (this.pill) this.pill.setCount(value);
    }

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

        openModal(this.scene, this.dim, this.card, DIM_ALPHA);
    }

    hide() {
        if (!this.isOpen) return;

        this.isOpen = false;

        shutModal(this.scene, this.dim, this.card, () => {
            this.visible = false;
        });
    }

    adjust() {
        this.x = dimensions.gameWidth / 2;
        this.y = dimensions.gameHeight / 2;

        this.dim.setSize(dimensions.actualWidth, dimensions.actualHeight);

        if (this.dim.input) this.dim.input.hitArea.setSize(dimensions.actualWidth, dimensions.actualHeight);

        this.fitter.setScale(Math.min(
            1,
            (dimensions.gameHeight - MODAL_MARGIN * 2) / (PANEL_H + CARD_DROP * 2),
            (dimensions.gameWidth - MODAL_MARGIN * 2) / PANEL_W
        ));


        this.fitter.x = 0;
        this.fitter.y = CARD_DROP * this.fitter.scaleY;
    }
}