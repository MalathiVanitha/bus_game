// How hard the device gets pushed. The canvas is drawn at a capped pixel
// ratio rather than the phone's own (Android screens run 2.6 to 3.5, which is
// up to twelve times the pixels of ratio 1), and low-end devices drop to a
// smaller budget still and skip the costliest effects.
//
// ?quality=low or ?quality=high forces a tier, for testing on a desktop.

const HIGH_RATIO = 2;
const LOW_RATIO = 1.5;

// Canvas pixels per tier, so a tablet does not get a ratio its GPU cannot fill.
const HIGH_BUDGET = 2400000;
const LOW_BUDGET = 1100000;

// Frames slower than this count against the device, and if most of a window
// of them are, it is stepped down to the low tier. Once, never back up.
const SLOW_FRAME = 26;
const SLOW_SHARE = 0.6;
const WATCH_FRAMES = 90;
// Ignores the build and first intro, and frames stalled by a hidden tab.
const WATCH_AFTER = 4000;
const STALL = 250;

const forced = new URLSearchParams(location.search).get('quality');

function looksLowEnd() {
    if (forced) return forced === 'low';

    const android = /Android/i.test(navigator.userAgent);
    const memory = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;

    return android && ((memory > 0 && memory <= 4) || (cores > 0 && cores <= 4));
}

const perf = {
    lowEnd: looksLowEnd(),

    // The ratio the canvas is drawn at, for the window as it is now.
    ratio() {
        const device = window.devicePixelRatio || 1;
        const cap = this.lowEnd ? LOW_RATIO : HIGH_RATIO;
        const budget = this.lowEnd ? LOW_BUDGET : HIGH_BUDGET;
        const room = Math.sqrt(budget / Math.max(1, window.innerWidth * window.innerHeight));

        return Math.max(1, Math.min(device, cap, room));
    },

    watched: 0,
    slow: 0,
    watchFrom: 0,

    // Fed each frame's delta. Calls onLow the first time the device turns out
    // to be too slow for the tier it was given.
    watch(time, delta, onLow) {
        if (this.lowEnd || forced) return;

        if (!this.watchFrom) this.watchFrom = time + WATCH_AFTER;
        if (time < this.watchFrom || delta > STALL) return;

        this.watched++;
        if (delta > SLOW_FRAME) this.slow++;

        if (this.watched < WATCH_FRAMES) return;

        const tooSlow = this.slow / this.watched >= SLOW_SHARE;

        this.watched = 0;
        this.slow = 0;

        if (!tooSlow) return;

        this.lowEnd = true;
        onLow();
    }
};

export default perf;
