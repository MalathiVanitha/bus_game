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

// The press every button in the game shares: the art sinks under the finger and
// comes back up, and the tap only counts on the way up, so a finger slid off
// the button lets it go. A release only counts when the same pointer went down
// on this button too, so a press that starts elsewhere and is dragged onto the
// button before letting go does nothing. Phaser hit tests a container against its display
// origin, so the area is given from its top left corner rather than its middle.
const PRESS_SCALE = 0.94;
const PRESS_TIME = 90;

function pressable(scene, target, width, height, onPress, feedback = target) {
    feedback.restScale = feedback.scaleX;

    target.setSize(width, height);
    target.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains
    );

    const sink = (to) => {
        scene.tweens.killTweensOf(feedback);
        scene.tweens.add({
            targets: feedback,
            scale: feedback.restScale * to,
            duration: PRESS_TIME,
            ease: 'Quad.easeOut'
        });
    };

    // The id of the pointer holding this button down, or null when none is.
    let held = null;

    target.on('pointerdown', (pointer) => {
        held = pointer.id;
        sink(PRESS_SCALE);
    });

    target.on('pointerout', (pointer) => {
        if (held !== pointer.id) return;
        held = null;
        sink(1);
    });

    target.on('pointerup', (pointer) => {
        if (held !== pointer.id) return;
        held = null;
        sink(1);
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