import SoundManager from '../objects/SoundManager.js';

function pointerOver(gameObjet, hex = 0xEFF0F1) {
    gameObjet.on('pointerover', function() {
        this.setTint(hex);
    });
    pointerOut(gameObjet);
}

function pointerOut(gameObjet) {
    gameObjet.on('pointerout', function() {
        this.clearTint();
    });
}

// The press every button in the game shares: the art sinks under the finger,
// and on release it springs back up past full size and settles, so even a
// quick tap shows the whole dip and bounce. The tap only counts on the way up,
// so a finger slid off the button lets it go (gently, with no bounce). A
// release only counts when the same pointer went down on this button too, so a
// press that starts elsewhere and is dragged onto the button before letting go
// does nothing. Phaser hit tests a container against its display origin, so
// the area is given from its top left corner rather than its middle.
//
// The motion runs on its own counter rather than a tween on the button, so
// other code killing the button's tweens (a shake, an intro) can't strand it
// half pressed, and the press never kills theirs.
const PRESS_SCALE = 0.9;
const PRESS_TIME = 80;
// On release: down to PRESS_SCALE first if a quick tap never got there, up
// past full size to POP_SCALE, then back to rest.
const DIP_TIME = 60;
const POP_SCALE = 1.07;
const POP_TIME = 130;
const SETTLE_TIME = 170;
const CANCEL_TIME = 140;

const Ease = Phaser.Math.Easing;

// Steps feedback's scale (as a fraction of its rest) through each leg in turn.
function pressRun(scene, feedback, legs) {
    if (feedback.pressRun) feedback.pressRun.remove();

    let from = feedback.pressAt === undefined ? 1 : feedback.pressAt;
    const plan = [];
    let total = 0;

    legs.forEach((leg) => {
        if (leg.to === from) return;

        plan.push({ from, to: leg.to, start: total, time: leg.time, ease: leg.ease });
        total += leg.time;
        from = leg.to;
    });

    const set = (at) => {
        feedback.pressAt = at;
        feedback.setScale(feedback.restScale * at);
    };

    if (!plan.length) return;

    feedback.pressRun = scene.tweens.addCounter({
        from: 0,
        to: total,
        duration: total,
        onUpdate: (tween) => {
            if (!feedback.scene) return;

            const now = tween.getValue();
            const leg = plan.find((l) => now <= l.start + l.time) || plan[plan.length - 1];
            const t = Math.min(1, Math.max(0, (now - leg.start) / leg.time));

            set(leg.from + (leg.to - leg.from) * leg.ease(t));
        },
        onComplete: () => {
            feedback.pressRun = null;

            if (feedback.scene) set(from);
        }
    });
}

function pressable(scene, target, width, height, onPress, feedback = target) {
    feedback.restScale = feedback.scaleX;

    target.setSize(width, height);
    target.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains
    );

    // The id of the pointer holding this button down, or null when none is.
    let held = null;

    target.on('pointerdown', (pointer) => {
        held = pointer.id;
        pressRun(scene, feedback, [
            { to: PRESS_SCALE, time: PRESS_TIME, ease: Ease.Quadratic.Out }
        ]);
    });

    target.on('pointerout', (pointer) => {
        if (held !== pointer.id) return;
        held = null;
        pressRun(scene, feedback, [
            { to: 1, time: CANCEL_TIME, ease: Ease.Quadratic.Out }
        ]);
    });

    target.on('pointerup', (pointer) => {
        if (held !== pointer.id) return;
        held = null;
        pressRun(scene, feedback, [
            { to: PRESS_SCALE, time: DIP_TIME, ease: Ease.Quadratic.Out },
            { to: POP_SCALE, time: POP_TIME, ease: Ease.Quadratic.Out },
            { to: 1, time: SETTLE_TIME, ease: Ease.Sine.InOut }
        ]);
        SoundManager.fx(scene, 'tap', 0.6);
        onPress();
    });
}

// A bare tap with no press feedback, held to the same rule as pressable: the
// pointer has to go down and come up on this object.
function pointerUp(res = () => {}, gameObjet) {
    let held = null;

    gameObjet.on('pointerdown', (pointer) => { held = pointer.id; });
    gameObjet.on('pointerout', (pointer) => { if (held === pointer.id) held = null; });

    gameObjet.on('pointerup', (pointer) => {
        if (held !== pointer.id) return;
        held = null;
        res();
    });
}

export {
    pointerOver,
    pointerOut,
    pointerUp,
    pressable
}