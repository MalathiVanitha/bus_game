// Keeps a line of text inside the room it has: the font is taken down from
// size until the text is no wider than room, and back up to size once it fits
// again. Its stroke, if it has one, thins in step. It never goes below floor,
// which by default is small enough that nothing the game writes is left over.
export function fitText(text, room, size, floor = Math.ceil(size * 0.4)) {
    if (text.fitStroke === undefined) text.fitStroke = text.style.strokeThickness || 0;

    const setSize = (s) => {
        text.setFontSize(s);

        if (text.fitStroke) text.setStroke(text.style.stroke, Math.max(1, Math.round(text.fitStroke * s / size)));
    };

    let s = size;

    setSize(s);

    if (text.width <= room) return;

    s = Math.max(floor, Math.floor(s * room / text.width));
    setSize(s);

    while (text.width > room && s > floor) setSize(--s);
}
