// Shared by the book cover and the open book so both halves of the page turn
// darken by exactly the same amount.
// value 0 = fully lit, value 1 = edge on and in shadow.
function shadeTint(value) {
    let channel = Math.round(255 - 90 * value);
    return Phaser.Display.Color.GetColor(channel, channel, channel);
}

export {
    shadeTint
}
