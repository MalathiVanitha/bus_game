// The open and close every modal card shares. Opening, the dim fades in while
// the card rises into place, swelling a touch past full size before it
// settles, and what is on it follows top to bottom a beat behind, so the
// card lands first and its contents drift in after. Closing, it sinks and
// shrinks a little as it fades, quicker than it came.
//
// Each run is one counter stepping everything from its own clock, rather than
// a tween per piece: pressable() kills the tweens on a button when the finger
// leaves it, which would strand a button half way in.

const OPEN_TIME = 440;
const OPEN_FADE = 170;
const OPEN_FROM = 0.84;
const OPEN_RISE = 34;
// Back's overshoot: gentler than Phaser's default 1.70158.
const OPEN_OVERSHOOT = 1.25;
const DIM_IN = 260;

// The card's contents: how far each rises, the gap between the top one
// setting off and the bottom one, and how long each takes.
const CASCADE_RISE = 20;
const CASCADE_SPREAD = 150;
const CASCADE_DELAY = 50;
const CASCADE_TIME = 340;

const SHUT_TIME = 190;
const SHUT_TO = 0.9;
const SHUT_DROP = 22;
const SHUT_OVERSHOOT = 1.1;

const Ease = Phaser.Math.Easing;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Moves a piece by an offset from wherever it now is, taking back the last
// offset first, so anything else moving it at the same time is kept.
function shift(piece, by) {
    piece.y += by - (piece.modalShift || 0);
    piece.modalShift = by;
}

// What on the card cascades: everything but the panel behind it (the first
// child) and invisible hit zones, each with how far down the card it sits.
function contents(card) {
    const pieces = [];

    for (let i = 1; i < card.list.length; i++) {
        const piece = card.list[i];

        if (piece instanceof Phaser.GameObjects.Zone) continue;

        pieces.push(piece);
    }

    let top = Infinity;
    let bottom = -Infinity;

    pieces.forEach((piece) => {
        const y = piece.y - (piece.modalShift || 0);

        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
    });

    const span = Math.max(1, bottom - top);

    pieces.forEach((piece) => {
        piece.modalDelay = CASCADE_DELAY +
            (piece.y - (piece.modalShift || 0) - top) / span * CASCADE_SPREAD;
    });

    return pieces;
}

// Stops whatever run the card has going and puts its contents back in place.
function stop(scene, dim, card) {
    if (card.modalRun) {
        card.modalRun.remove();
        card.modalRun = null;
    }

    scene.tweens.killTweensOf([dim, card]);

    if (card.modalY === undefined) card.modalY = card.y;

    card.list.forEach((piece) => {
        if (piece.modalShift) shift(piece, 0);
    });
}

function run(scene, card, duration, pose, onDone) {
    pose(0);

    card.modalRun = scene.tweens.addCounter({
        from: 0,
        to: duration,
        duration: duration,
        onUpdate: (tween) => pose(tween.getValue()),
        onComplete: () => {
            card.modalRun = null;
            pose(duration);

            if (onDone) onDone();
        }
    });
}

/** Brings the dim up to dimAlpha and the card in. */
export function openModal(scene, dim, card, dimAlpha, onDone = null) {
    stop(scene, dim, card);

    const pieces = contents(card);
    const rest = card.modalY;
    const total = Math.max(OPEN_TIME, CASCADE_DELAY + CASCADE_SPREAD + CASCADE_TIME);

    run(scene, card, total, (at) => {
        dim.alpha = dimAlpha * Ease.Sine.Out(clamp01(at / DIM_IN));

        const t = clamp01(at / OPEN_TIME);

        card.alpha = Ease.Quadratic.Out(clamp01(at / OPEN_FADE));
        card.setScale(OPEN_FROM + (1 - OPEN_FROM) * Ease.Back.Out(t, OPEN_OVERSHOOT));
        card.y = rest + OPEN_RISE * (1 - Ease.Cubic.Out(t));

        pieces.forEach((piece) => {
            const p = clamp01((at - piece.modalDelay) / CASCADE_TIME);

            shift(piece, CASCADE_RISE * (1 - Ease.Cubic.Out(p)));
        });
    }, onDone);
}

/** Takes the card and the dim away, then calls onDone with the card back at rest. */
export function shutModal(scene, dim, card, onDone = null) {
    stop(scene, dim, card);

    const rest = card.modalY;
    const fromDim = dim.alpha;
    const fromAlpha = card.alpha;
    const fromScale = card.scaleX;
    const fromY = card.y;

    run(scene, card, SHUT_TIME, (at) => {
        const t = at / SHUT_TIME;
        const sink = Ease.Back.In(t, SHUT_OVERSHOOT);

        dim.alpha = fromDim * (1 - Ease.Sine.In(t));
        card.alpha = fromAlpha * (1 - Ease.Quadratic.In(t));
        card.setScale(fromScale + (SHUT_TO - fromScale) * sink);
        card.y = fromY + (rest + SHUT_DROP - fromY) * Ease.Cubic.In(t);
    }, () => {
        card.alpha = 1;
        card.setScale(1);
        card.y = rest;

        if (onDone) onDone();
    });
}
