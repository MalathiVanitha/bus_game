import SoundManager from './SoundManager.js';
import { fitText } from '../utils/text.js';

const PILL = 'home/coin-base';
const PILL_X = 132;
const PILL_Y = 62;
const PILL_SCALE = 0.5;

const ICON = 'home/coin-icon';
const ICON_X = -52;
const ICON_SCALE = 0.3125;

const COUNT_X = 28;
const COUNT_SIZE = 34;
const COUNT_FONT = 'Baloo2-ExtraBold';
const INK = '#283085';

// The home bar's counter is drawn on the gear's tile, stretched sideways, so
// the two read as a pair.
const TILE = 'ui/button_icon_base';
const TILE_W = 346;
const TILE_H = 160;
const TILE_SLICE = 56;
const TILE_SCALE = 0.524;

const TILE_ICON_X = -46;
const TILE_ICON_SCALE = 0.4;

const TILE_COUNT_X = 34;
const TILE_COUNT_SIZE = 40;

const FLY_SCATTER = 30;
const FLY_OUT_TIME = 180;
const FLY_TIME = 520;
const FLY_STAGGER = 60;
const FLY_END_SCALE = 0.62;

const POP_SCALE = 1.1;
const POP_TIME = 110;

const INTRO_X = 150;
const INTRO_TIME = 540;
const INTRO_DELAY = 260;

const OUTRO_TIME = 300;

// Clear space kept between the count and the coin, and the pill's edge.
const COUNT_GAP = 6;
const COUNT_EDGE = 16;

const START_COINS = 0;

const STORE_KEY = 'baggage-out.coins';

function readStore() {
    try {
        const saved = window.localStorage.getItem(STORE_KEY);

        if (saved !== null && isFinite(saved)) return Math.max(0, Math.floor(Number(saved)));
    } catch (e) {
        // The counter still opens on the starting balance.
    }

    return START_COINS;
}

function writeStore(value) {
    try {
        window.localStorage.setItem(STORE_KEY, String(value));
    } catch (e) {
        // Nothing worth stopping the game for.
    }
}

export function makeCoinPill(scene, value, textRes, tile = false) {
    const pill = scene.add.container(0, 0);

    const base = tile ?
        scene.add.nineslice(0, 0, 'sheet', TILE, TILE_W, TILE_H, TILE_SLICE, TILE_SLICE, TILE_SLICE, TILE_SLICE) :
        scene.add.sprite(0, 0, 'sheet', PILL);
    base.setScale(tile ? TILE_SCALE : PILL_SCALE);
    pill.add(base);

    const icon = scene.add.sprite(tile ? TILE_ICON_X : ICON_X, 0, 'sheet', ICON);
    icon.setScale(tile ? TILE_ICON_SCALE : ICON_SCALE);
    pill.add(icon);

    pill.count = scene.add.text(tile ? TILE_COUNT_X : COUNT_X, 0, String(value), {
        fontFamily: COUNT_FONT,
        fontSize: tile ? TILE_COUNT_SIZE : COUNT_SIZE,
        color: INK
    });
    pill.count.setOrigin(.5);
    pill.count.setResolution(textRes);
    pill.add(pill.count);

    // As wide as the count can grow either side of where it is centred,
    // between the coin and the pill's end.
    const countX = pill.count.x;
    const room = 2 * Math.min(
        countX - (icon.x + icon.displayWidth / 2 + COUNT_GAP),
        base.displayWidth / 2 - COUNT_EDGE - countX
    );
    const size = tile ? TILE_COUNT_SIZE : COUNT_SIZE;

    pill.setCount = (count) => {
        pill.count.setText(String(count));
        fitText(pill.count, room, size);
    };
    pill.setCount(value);

    return pill;
}

export class Coin extends Phaser.GameObjects.Container {
    constructor(scene, x = 0, y = 0) {
        super(scene, x, y);

        this.scene = scene;
        this.scene.add.existing(this);

        this.value = readStore();
        this.flights = [];

        this.build();
    }

    build() {
        this.textRes = Math.min(3, Math.max(1, Math.ceil(this.scene.gameScale || 1)));

        const pill = makeCoinPill(this.scene, this.value, this.textRes, true);

        this.count = pill.count;
        this.pill = pill;
        this.add(pill);
    }

    set(value) {
        this.value = Math.max(0, Math.floor(value));
        this.pill.setCount(this.value);

        writeStore(this.value);

        this.scene.events.emit('coin:changed', this.value);
    }

    award(amount) {
        this.set(this.value + amount);
        this.pop();
    }

    pop() {
        SoundManager.fx(this.scene, 'coin', 0.6);
        this.scene.tweens.killTweensOf(this.pill);

        this.pill.setScale(1);
        this.scene.tweens.add({
            targets: this.pill,
            scale: POP_SCALE,
            duration: POP_TIME,
            ease: 'Quad.easeOut',
            yoyo: true
        });
    }

    collect(worldX, worldY, count = 1, value = count, onComplete = null) {
        if (count <= 0) {
            if (onComplete) onComplete();
            return;
        }

        this.show();

        const from = this.getWorldTransformMatrix().applyInverse(worldX, worldY);
        const each = value / count;

        let landed = 0;
        let paid = 0;

        for (let i = 0; i < count; i++) {
            const coin = this.scene.add.sprite(from.x, from.y, 'sheet', ICON);

            coin.setScale(TILE_ICON_SCALE);
            this.add(coin);
            this.flights.push(coin);

            this.scene.tweens.add({
                targets: coin,
                x: from.x + Phaser.Math.Between(-FLY_SCATTER, FLY_SCATTER),
                y: from.y + Phaser.Math.Between(-FLY_SCATTER, FLY_SCATTER),
                duration: FLY_OUT_TIME,
                delay: i * FLY_STAGGER,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    this.scene.tweens.add({
                        targets: coin,
                        x: TILE_ICON_X,
                        y: 0,
                        scale: TILE_ICON_SCALE * FLY_END_SCALE,
                        duration: FLY_TIME,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            landed++;

                            const share = landed === count ? value - paid : Math.round(each);

                            paid += share;

                            this.land(coin);
                            this.set(this.value + share);
                            this.pop();

                            if (landed === count && onComplete) onComplete();
                        }
                    });
                }
            });
        }
    }

    land(coin) {
        const at = this.flights.indexOf(coin);

        if (at !== -1) this.flights.splice(at, 1);

        coin.destroy();
    }

    intro() {
        this.show();

        this.scene.tweens.killTweensOf(this.pill);

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

    outro() {
        if (!this.visible) return;

        this.scene.tweens.killTweensOf(this.pill);

        this.scene.tweens.add({
            targets: this.pill,
            x: INTRO_X,
            alpha: 0,
            duration: OUTRO_TIME,
            ease: 'Back.easeIn',
            onComplete: () => this.hide()
        });
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    adjust() {
        this.x = dimensions.gameWidth - PILL_X;
        // From the screen's real top, however tall the screen is.
        this.y = dimensions.topOffset + PILL_Y;
    }
}