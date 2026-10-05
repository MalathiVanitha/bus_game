// A streak of light that sweeps across a piece of art, cut to its outline.
//
// A mask would do this live, but masks are dear on the GPU here, so the sweep
// is drawn once instead, as a strip of frames: in each, a slanted band of light
// a little further across, clipped to the art's shape. Playing it is then one
// image stepping through its frames, hidden between sweeps.

import { bakeResolution } from './bake.js';

const FRAMES = 20;
// Kept clear between frames, so filtering never bleeds one into the next.
const GAP = 2;
// How wide the band is, against the art's width, and how far it leans.
const BAND = 0.38;
const LEAN = 0.5;
const PEAK = 0.85;

/**
 * Hands back an Image laid over the art the way bakeShape lays its own: local
 * 0,0 is the image's position. paint() draws the art's outline (any colour)
 * into a Graphics, within left/top/width/height. Step it with sweep().
 */
export function shineImage(scene, key, bounds, paint, res = bakeResolution(scene)) {
    if (scene.textures.exists(key)) res = scene.textures.get(key).bakedRes || res;

    const w = Math.max(1, Math.ceil(bounds.width * res));
    const h = Math.max(1, Math.ceil(bounds.height * res));

    if (!scene.textures.exists(key)) {
        const shapeKey = key + '-outline';
        const g = scene.make.graphics({ add: false });

        g.setScale(res);
        g.translateCanvas(-bounds.left, -bounds.top);
        paint(g);
        g.generateTexture(shapeKey, w, h);
        g.destroy();

        const shape = scene.textures.get(shapeKey).getSourceImage();
        const strip = scene.textures.createCanvas(key, (w + GAP) * FRAMES, h);
        const out = strip.getContext();

        const one = document.createElement('canvas');
        one.width = w;
        one.height = h;
        const c = one.getContext('2d');

        const band = w * BAND;
        // From wholly off the left to wholly off the right, lean included.
        const from = -band;
        const to = w + h * LEAN + band;

        for (let i = 0; i < FRAMES; i++) {
            const mid = from + (to - from) * i / (FRAMES - 1);

            c.globalCompositeOperation = 'source-over';
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, w, h);

            c.setTransform(1, 0, -LEAN, 1, 0, 0);
            const light = c.createLinearGradient(mid - band / 2, 0, mid + band / 2, 0);
            light.addColorStop(0, 'rgba(255,255,255,0)');
            light.addColorStop(0.5, 'rgba(255,255,255,' + PEAK + ')');
            light.addColorStop(1, 'rgba(255,255,255,0)');
            c.fillStyle = light;
            c.fillRect(mid - band / 2, 0, band, h);

            c.setTransform(1, 0, 0, 1, 0, 0);
            c.globalCompositeOperation = 'destination-in';
            c.drawImage(shape, 0, 0);

            out.drawImage(one, i * (w + GAP), 0);
            strip.add(i, 0, i * (w + GAP), 0, w, h);
        }

        strip.refresh();
        strip.bakedRes = res;
        scene.textures.remove(shapeKey);
    }

    const image = scene.add.image(0, 0, key, 0);

    image.setOrigin(-bounds.left * res / w, -bounds.top * res / h);
    image.setScale(1 / res);
    image.visible = false;

    return image;
}

/** Shows the sweep p of the way across: hidden before 0 and after 1. */
export function sweep(image, p) {
    image.visible = p > 0 && p < 1;

    if (image.visible) image.setFrame(Math.min(FRAMES - 1, Math.floor(p * FRAMES)));
}
