function pointerOver(gameObjet, hex = 0xEFF0F1) {
    gameObjet.on('pointerover', function () {
        this.setTint(hex);
    });
    pointerOut(gameObjet);
}

function pointerOut(gameObjet) {
    gameObjet.on('pointerout', function () {
        this.clearTint();
    });
}

// The press every button in the game shares: the art sinks under the finger and
// comes back up, and the tap only counts on the way up, so a finger slid off
// the button lets it go. Phaser hit tests a container against its display
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

    target.on('pointerdown', () => sink(PRESS_SCALE));
    target.on('pointerout', () => sink(1));

    target.on('pointerup', () => {
        sink(1);
        onPress();
    });
}

function pointerUp(res = () => { }, gameObjet) {
    gameObjet.on('pointerup', () => {
        res();
    });
}

export {
    pointerOver,
    pointerOut,
    pointerUp,
    pressable
}