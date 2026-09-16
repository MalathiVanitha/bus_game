// The coin counter: a white pill in the top right of the home screen, level
// with the gear on the left, holding the coin art and the balance. The end of a
// level pays into it, so coins flown off the board have somewhere to land.
//
// The art is the home pack's, drawn at a quarter of its 2x size and placed
// where the pack's manifest asks for it on the 1080 x 1920 canvas the game's
// 540 x 960 is half of.

const PILL = 'home/coin-base';
const PILL_X = 107;
const PILL_Y = 62;
const PILL_SCALE = 0.5;

const ICON = 'home/coin-icon';
const ICON_X = -52;
const ICON_SCALE = 0.3125;

const COUNT_X = 28;
const COUNT_SIZE = 34;
const INK = '#283085';

// A coin on its way in: thrown clear of where it started, then run into the
// pill, with the balance ticking up as each one lands.
const FLY_SCATTER = 30;
const FLY_OUT_TIME = 180;
const FLY_TIME = 520;
const FLY_STAGGER = 60;
const FLY_END_SCALE = 0.62;

const POP_SCALE = 1.1;
const POP_TIME = 110;

// Drops in from off the top of the screen when the home screen comes on.
const INTRO_Y = -70;
const INTRO_TIME = 560;
const INTRO_DELAY = 120;

// The balance the storyboard shows. Nothing spends coins yet, so a fresh
// player is started on it rather than on nothing.
const START_COINS = 850;

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

        const pill = this.scene.add.container(0, 0);

        const base = this.scene.add.sprite(0, 0, 'sheet', PILL);
        base.setScale(PILL_SCALE);
        pill.add(base);

        const icon = this.scene.add.sprite(ICON_X, 0, 'sheet', ICON);
        icon.setScale(ICON_SCALE);
        pill.add(icon);

        this.count = this.scene.add.text(COUNT_X, 0, String(this.value), {
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

    /** Sets the balance outright, counter and store both. */
    set(value) {
        this.value = Math.max(0, Math.floor(value));
        this.count.setText(String(this.value));

        writeStore(this.value);
    }

    /** Pays in, with the pill giving a little under the weight of it. */
    award(amount) {
        this.set(this.value + amount);
        this.pop();
    }

    pop() {
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

    /**
     * Flies coins in from somewhere on the screen - the middle of the board,
     * usually - and pays the balance up as they land. The start is given in
     * world pixels, which is what a game object's transform hands back.
     */
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

            coin.setScale(ICON_SCALE);
            this.add(coin);
            this.flights.push(coin);

            // Thrown clear first, so a handful leaving the same spot does not
            // travel as one lump.
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
                        x: 0,
                        y: 0,
                        scale: ICON_SCALE * FLY_END_SCALE,
                        duration: FLY_TIME,
                        ease: 'Quad.easeIn',
                        onComplete: () => {
                            landed++;

                            // The last coin carries whatever the split left
                            // over, so the payout always comes to the total.
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

    /** Drops a landed coin out of the flight list and off the screen. */
    land(coin) {
        const at = this.flights.indexOf(coin);

        if (at !== -1) this.flights.splice(at, 1);

        coin.destroy();
    }

    /** Drops the counter in, for the home screen coming on behind it. */
    intro() {
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
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    adjust() {
        this.x = dimensions.gameWidth - PILL_X;
        this.y = PILL_Y;
    }
}
