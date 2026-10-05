// The open and close the modal cards share (the level card has its own, below).
// the card rises into place, swelling a touch past full size before it
// settles, and what is on it follows top to bottom a beat behind, so the
// card lands first and its contents drift in after: each fades up as it rises,
// and the buttons, icons and centred text on it pop from small to a touch past
// full size and settle. Closing, it sinks and
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
// Where a popping piece starts, and its Back overshoot on the way to full size.
const POP_FROM = 0.6;
const POP_OVERSHOOT = 2.2;

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

// Whether a piece can grow from its middle: a container, or art and text
// anchored at their centre. Backings drawn from a corner only fade and rise.
function poppable(piece) {
    if (piece instanceof Phaser.GameObjects.Container) return true;
    if (piece instanceof Phaser.GameObjects.Graphics) return false;
    if (piece instanceof Phaser.GameObjects.Rectangle) return false;
    if (piece instanceof Phaser.GameObjects.NineSlice) return false;

    return piece.originX === 0.5 && piece.originY === 0.5;
}

// Scales and fades a piece to a fraction of how it was when the run began,
// and puts it back exactly once both fractions reach 1.
function grow(piece, scale, alpha) {
    if (!piece.modalBase) {
        if (scale === 1 && alpha === 1) return;

        piece.modalBase = { x: piece.scaleX, y: piece.scaleY, alpha: piece.alpha };
    }

    const base = piece.modalBase;

    piece.setScale(base.x * scale, base.y * scale);
    piece.alpha = base.alpha * alpha;

    if (scale === 1 && alpha === 1) piece.modalBase = null;
}

// What on the card cascades: everything but the panel behind it (the first
// child) and invisible hit zones, each with how far down the card it sits.
function contents(card) {
    const pieces = [];

    for (let i = 1; i < card.list.length; i++) {
        const piece = card.list[i];

        if (piece instanceof Phaser.GameObjects.Zone) continue;

        piece.modalPop = poppable(piece);
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
        if (piece.modalBase) grow(piece, 1, 1);
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
            grow(
                piece,
                piece.modalPop ? POP_FROM + (1 - POP_FROM) * Ease.Back.Out(p, POP_OVERSHOOT) : 1,
                p >= 1 ? 1 : Ease.Quadratic.Out(clamp01(p * 1.6))
            );
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

// The level card's own entrance, so it reads apart from the other modals: it
// drops in from above, tilted, and lands with a squash and a wobble that die
// away, and the landing knocks a bump up through its contents from the bottom
// to the top. A piece can set modalJolt for a bigger or smaller bump. Leaving,
// it ducks a touch and is flung back up out of sight.
const DROP_FROM = 520;
const DROP_TILT = -7;
const DROP_FALL = 300;
const DROP_FADE = 120;
// How far the fall's start already moves: 0 hangs at the top, 1 falls evenly.
const DROP_PUSH = 0.4;

const LAND_TIME = 460;
const LAND_SQUASH = 0.07;
const LAND_HOP = 10;
const LAND_WOBBLE = 2.5;
// Half swings of the squash and wobble before they die away.
const LAND_SWINGS = 3;

const JOLT = 0.1;
const JOLT_SPREAD = 160;
const JOLT_TIME = 280;

const LIFT_TIME = 240;
const LIFT_TO = 460;
const LIFT_TILT = 6;
const LIFT_OVERSHOOT = 1.2;

/** Drops the card in from above, for the level card. */
export function dropModal(scene, dim, card, dimAlpha, onDone = null) {
    stop(scene, dim, card);

    const pieces = contents(card);
    const rest = card.modalY;
    const ys = pieces.map((piece) => piece.y);
    const top = Math.min(...ys);
    const span = Math.max(1, Math.max(...ys) - top);

    // Bottom first: the knock of the landing travels up the card.
    pieces.forEach((piece) => {
        piece.modalDelay = DROP_FALL + (1 - (piece.y - top) / span) * JOLT_SPREAD;
    });

    const total = DROP_FALL + Math.max(LAND_TIME, JOLT_SPREAD + JOLT_TIME);

    run(scene, card, total, (at) => {
        dim.alpha = dimAlpha * Ease.Sine.Out(clamp01(at / DIM_IN));
        card.alpha = Ease.Quadratic.Out(clamp01(at / DROP_FADE));

        if (at < DROP_FALL) {
            const t = at / DROP_FALL;
            const fallen = t * (DROP_PUSH + (1 - DROP_PUSH) * t);

            card.y = rest - DROP_FROM * (1 - fallen);
            card.angle = DROP_TILT * (1 - fallen);
            card.setScale(1);
        } else {
            const p = clamp01((at - DROP_FALL) / LAND_TIME);
            const fade = (1 - p) * (1 - p);
            const squash = Math.cos(p * Math.PI * LAND_SWINGS) * fade;

            card.y = rest + LAND_HOP * squash;
            card.angle = LAND_WOBBLE * Math.sin(p * Math.PI * LAND_SWINGS) * fade;
            card.setScale(1 + LAND_SQUASH * squash, 1 - LAND_SQUASH * squash);
        }

        pieces.forEach((piece) => {
            if (!piece.modalPop) return;

            const p = clamp01((at - piece.modalDelay) / JOLT_TIME);
            const jolt = piece.modalJolt === undefined ? JOLT : piece.modalJolt;

            grow(piece, p >= 1 ? 1 : 1 + jolt * Math.sin(p * Math.PI), 1);
        });
    }, () => {
        card.angle = 0;
        card.setScale(1);

        if (onDone) onDone();
    });
}

/** Flings the card back up and away, then calls onDone with it back at rest. */
export function liftModal(scene, dim, card, onDone = null) {
    stop(scene, dim, card);

    const rest = card.modalY;
    const fromDim = dim.alpha;
    const fromAlpha = card.alpha;
    const fromAngle = card.angle;
    const fromY = card.y;
    const fromX = card.scaleX;
    const fromScaleY = card.scaleY;

    run(scene, card, LIFT_TIME, (at) => {
        const t = at / LIFT_TIME;
        const ease = Ease.Quadratic.Out(t);

        dim.alpha = fromDim * (1 - Ease.Sine.In(t));
        card.alpha = fromAlpha * (1 - Ease.Quadratic.In(clamp01((t - 0.3) / 0.7)));
        card.y = fromY + (rest - LIFT_TO - fromY) * Ease.Back.In(t, LIFT_OVERSHOOT);
        card.angle = fromAngle + (LIFT_TILT - fromAngle) * Ease.Quadratic.In(t);
        card.setScale(fromX + (1 - fromX) * ease, fromScaleY + (1 - fromScaleY) * ease);
    }, () => {
        card.alpha = 1;
        card.angle = 0;
        card.setScale(1);
        card.y = rest;

        if (onDone) onDone();
    });
}
