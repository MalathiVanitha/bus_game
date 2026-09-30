// The game's sound, played through the scene's own sound manager so the
// Settings panel's Music and Sound switches reach it.
//
// Effects are one-shots, checked against the Sound switch as they are played.
// A switch turned off mid-effect is caught by Settings.apply, which mutes
// whatever is playing. The music is one looping track, started once and
// muted and unmuted from then on rather than stopped, so it keeps its place.

const MUSIC_KEY = 'bgm';
const MUSIC_VOLUME = 0.4;
// Under the end card: low enough for the fanfare to carry over it.
const MUSIC_DUCKED = 0.12;
const DUCK_TIME = 350;

// Effects that fire over and over (a convoy's steps, the last seconds' ticks)
// are held to one every this many milliseconds, so a burst never stacks up
// into a buzz.
const MIN_GAP = {
    step: 55,
    tap: 40,
    bump: 120,
    gulp: 45,
    coin: 50
};

const lastPlayed = {};

function state(scene) {
    return (scene && scene.game && scene.game.settings) || null;
}

export default class SoundManager {

    /**
     * Plays an effect. volume is 0-1, and detune is in cents, for sounds that
     * climb as they repeat (a cart gulped after another, a star after a star).
     */
    static fx(scene, key, volume = 1, detune = 0) {
        if (!scene || !scene.sound) return;

        const settings = state(scene);

        if (settings && !settings.sound) return;
        if (!scene.cache.audio.exists(key)) return;

        const gap = MIN_GAP[key];
        const now = scene.game.loop.time;

        if (gap && lastPlayed[key] !== undefined && now - lastPlayed[key] < gap) return;

        lastPlayed[key] = now;

        scene.sound.play(key, { volume: volume, detune: detune });
    }

    /** fx after a delay, on the scene's own clock (so it holds while paused). */
    static fxLater(scene, delay, key, volume = 1, detune = 0) {
        scene.time.delayedCall(delay, () => SoundManager.fx(scene, key, volume, detune));
    }

    /**
     * Starts the looping track, once. The browser won't play anything until
     * the page has been touched, so until then it waits for the unlock.
     */
    static playMusic(scene) {
        const manager = scene.sound;

        if (!scene.cache.audio.exists(MUSIC_KEY)) return;
        if (manager.get(MUSIC_KEY)) return;

        const music = manager.add(MUSIC_KEY, { loop: true, volume: MUSIC_VOLUME });
        const settings = state(scene);

        music.setMute(!!settings && !settings.music);

        const start = () => {
            if (!music.isPlaying) music.play();
        };

        if (manager.locked) manager.once(Phaser.Sound.Events.UNLOCKED, start);
        else start();
    }

    /** Brings the music down under the end card, and back up after. */
    static duckMusic(scene, on) {
        const music = scene.sound.get(MUSIC_KEY);

        if (!music) return;

        scene.tweens.killTweensOf(music);
        scene.tweens.add({
            targets: music,
            volume: on ? MUSIC_DUCKED : MUSIC_VOLUME,
            duration: DUCK_TIME,
            ease: 'Sine.easeInOut'
        });
    }
}
