// Phaser draws a Graphics object from its command list every frame, and under
// WebGL turns each arc it holds (every corner of a rounded rect, every circle)
// into a hundred freshly made points and triangulates them again. That is a
// lot of work and garbage for shapes that never change, so those are drawn
// once here, into a texture, at the resolution they are shown at.

let unnamed = 0;

// Pixels per design unit: the scale the game is laid out at, near enough.
export function bakeResolution(scene) {
    return Math.min(3, Math.max(1, scene.gameScale || 1));
}

/**
 * Draws a shape once and hands back an Image that sits exactly where the
 * Graphics would have: local 0,0 is the image's position, so it can be placed,
 * added and moved like the Graphics it replaces. left/top/width/height bound
 * everything draw() puts down, in the same local units.
 */
export function bakeShape(scene, bounds, draw, key = null, res = bakeResolution(scene)) {
    const name = key || 'baked-shape-' + (unnamed++);

    // A shared texture keeps the resolution it was first drawn at.
    if (key && scene.textures.exists(name)) res = scene.textures.get(name).bakedRes || res;

    const width = Math.max(1, Math.ceil(bounds.width * res));
    const height = Math.max(1, Math.ceil(bounds.height * res));

    if (!scene.textures.exists(name)) {
        const g = scene.make.graphics({ add: false });

        // generateTexture cancels the Graphics' position but keeps its scale,
        // so the offset goes in as a translate and the resolution as a scale.
        g.setScale(res);
        g.translateCanvas(-bounds.left, -bounds.top);
        draw(g);

        g.generateTexture(name, width, height);
        g.destroy();

        scene.textures.get(name).bakedRes = res;
    }

    const image = scene.add.image(0, 0, name);

    image.setOrigin(-bounds.left * res / width, -bounds.top * res / height);
    image.setScale(1 / res);

    // What scale 1 was on the Graphics.
    image.restScale = 1 / res;

    return image;
}

// Throws away a texture bakeShape made under a fixed key, so it can be drawn
// again (at a new size or resolution) once nothing shows it.
export function dropBaked(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
}
