"""
Renders the game's sound effects and background music from scratch, so every
sound is our own and can be tweaked and re-made here.

    pip3 install numpy lameenc
    python3 tools/make-sounds.py

Writes every sound as an MP3 into assets/sounds: the effects mono, the music
loop stereo.

The palette is the board's: soft, round and toy-like. Marimba and glockenspiel
for the tunes, bubbly pops for the carts, a light wooden knock for bumps, and a
crumble of little tiles with a sparkle on top when a garage breaks up.
"""

import os

import numpy as np

try:
    import lameenc
except ImportError:
    raise SystemExit("MP3 encoding needs lameenc: pip3 install lameenc")

RATE = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sounds")

rng = np.random.default_rng(7)


# -- building blocks ---------------------------------------------------------

def secs(n):
    return int(round(n * RATE))


def t_axis(duration):
    return np.arange(secs(duration)) / RATE


def midi_hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def phase_of(freq):
    """Phase for a frequency that may change sample to sample."""
    return 2 * np.pi * np.cumsum(freq) / RATE


def env_exp(n, attack, decay):
    """Quick rise, then an exponential fall with the given time constant."""
    t = np.arange(n) / RATE
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


def fade_tail(x, time=0.01):
    n = min(len(x), secs(time))
    if n:
        x[-n:] *= np.linspace(1, 0, n)
    return x


def lowpass(x, cutoff):
    """One-pole low pass; cutoff may be a number or a per-sample array."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / RATE)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def bandpass(x, low, high):
    return lowpass(highpass(x, low), high)


def noise(n):
    return rng.uniform(-1, 1, n)


def place(buf, sound, at):
    start = secs(at) if isinstance(at, float) else at
    end = min(len(buf), start + len(sound))
    if end > start:
        buf[start:end] += sound[: end - start]


def reverb_ir(length, decay, bright=6000, seed=3):
    r = np.random.default_rng(seed)
    n = secs(length)
    t = np.arange(n) / RATE
    ir = r.uniform(-1, 1, n) * np.exp(-t / decay)
    ir = lowpass(ir, bright)
    ir[: secs(0.008)] = 0
    return ir / np.sqrt(np.sum(ir ** 2))


def convolve(x, ir):
    size = len(x) + len(ir) - 1
    fft = 1 << (size - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, fft) * np.fft.rfft(ir, fft), fft)[:size]


SMALL_ROOM = None


def roomy(x, wet=0.12, tail=0.35):
    global SMALL_ROOM
    if SMALL_ROOM is None:
        SMALL_ROOM = reverb_ir(0.6, 0.16, 7000)
    out = np.concatenate([x, np.zeros(secs(tail))])
    wet_part = convolve(x, SMALL_ROOM)[: len(out)]
    out[: len(wet_part)] += wet * wet_part
    return out


def finish(x, peak=0.8, tail=True):
    x = x - np.mean(x)
    n = min(len(x), secs(0.001))
    x[:n] *= np.linspace(0, 1, n)
    top = np.max(np.abs(x))
    if top > 0:
        x = x * (peak / top)
    if tail:
        # Trim silence off the end, keep a soft fade.
        loud = np.nonzero(np.abs(x) > 0.0015)[0]
        if len(loud):
            x = x[: min(len(x), loud[-1] + secs(0.02))]
        fade_tail(x, 0.015)
    return x


def write_mp3(name, x, channels=1, kbps=96):
    """x is mono samples, or interleaved left/right when channels is 2."""
    path = os.path.join(OUT, name)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")

    encoder = lameenc.Encoder()
    encoder.set_bit_rate(kbps)
    encoder.set_in_sample_rate(RATE)
    encoder.set_channels(channels)
    encoder.set_quality(2)

    with open(path, "wb") as f:
        f.write(encoder.encode(pcm.tobytes()) + encoder.flush())
    return path


# -- instruments -------------------------------------------------------------

def marimba(note, duration=0.5, velocity=1.0):
    t = t_axis(duration)
    f = midi_hz(note)
    body = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.28)
    body += 0.25 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t / 0.045)
    body += 0.08 * np.sin(2 * np.pi * f * 9.8 * t) * np.exp(-t / 0.012)
    mallet = lowpass(noise(len(t)), 3000) * np.exp(-t / 0.004) * 0.3
    x = (body + mallet) * np.clip(t / 0.002, 0, 1)
    return fade_tail(x * velocity, 0.02)


def glock(note, duration=0.9, velocity=1.0):
    t = t_axis(duration)
    f = midi_hz(note)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.45)
    x += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.16)
    x += 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.06)
    x *= np.clip(t / 0.001, 0, 1)
    return fade_tail(x * velocity, 0.03)


def pluck_bass(note, duration=0.3, velocity=1.0):
    t = t_axis(duration)
    f = midi_hz(note)
    tri = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    sine = np.sin(2 * np.pi * f * t)
    x = (0.55 * tri + 0.7 * sine) * env_exp(len(t), 0.004, 0.18)
    x = lowpass(x, 900 + 1800 * np.exp(-t / 0.05))
    return fade_tail(x * velocity, 0.03)


def pad(notes, duration, velocity=1.0):
    t = t_axis(duration)
    x = np.zeros(len(t))
    for note in notes:
        f = midi_hz(note)
        for detune in (-0.12, 0.12):
            ff = f * 2 ** (detune / 12)
            x += ((ff * t + rng.random()) % 1) * 2 - 1
    x = lowpass(lowpass(x, 1100), 1400)
    rise = np.clip(t / 0.25, 0, 1)
    fall = np.clip((duration - t) / 0.3, 0, 1)
    return x * rise * fall * velocity / (len(notes) * 2)


def kick(velocity=1.0):
    t = t_axis(0.22)
    f = 48 + 110 * np.exp(-t / 0.03)
    x = np.sin(phase_of(f)) * env_exp(len(t), 0.001, 0.09)
    return x * velocity


def snap(velocity=1.0):
    """A soft finger-snap/clap, kept small so the beat stays gentle."""
    t = t_axis(0.18)
    x = bandpass(noise(len(t)), 1200, 5000) * env_exp(len(t), 0.001, 0.045)
    x += 0.3 * np.sin(2 * np.pi * 330 * t) * env_exp(len(t), 0.001, 0.02)
    return x * velocity


def shaker(velocity=1.0):
    t = t_axis(0.07)
    x = highpass(noise(len(t)), 6000) * env_exp(len(t), 0.006, 0.018)
    return x * velocity


def woodblock(freq=1500, velocity=1.0, length=0.08):
    t = t_axis(length)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.018)
    x += 0.4 * np.sin(2 * np.pi * freq * 2.3 * t) * np.exp(-t / 0.008)
    x += 0.2 * bandpass(noise(len(t)), 1500, 6000) * np.exp(-t / 0.003)
    return x * velocity


# -- sound effects -----------------------------------------------------------

def sfx_tap():
    """UI button: a crisp, bubbly click. Pitched above the music's marimba so
    it is heard over it, and short so a run of taps stays tidy."""
    t = t_axis(0.1)
    f = 2600 * np.exp(-t / 0.008) + 1100
    x = np.sin(phase_of(f)) * env_exp(len(t), 0.0005, 0.028)
    x += 0.35 * np.sin(phase_of(f * 2)) * env_exp(len(t), 0.0005, 0.012)
    x += 0.5 * bandpass(noise(len(t)), 2500, 10000) * np.exp(-t / 0.002)
    return finish(roomy(x, 0.05), 0.9)


def sfx_grab():
    """Taking hold of a convoy: a bright little upward 'blip' with a click."""
    t = t_axis(0.14)
    f = 700 + 1100 * (1 - np.exp(-t / 0.025))
    x = np.sin(phase_of(f)) * env_exp(len(t), 0.001, 0.045)
    x += 0.35 * np.sin(phase_of(f * 2)) * env_exp(len(t), 0.001, 0.025)
    x += 0.4 * bandpass(noise(len(t)), 2500, 10000) * np.exp(-t / 0.002)
    return finish(roomy(x, 0.06), 0.9)


def sfx_step():
    """Each cell a convoy rolls on: a tiny, soft wooden tick."""
    x = woodblock(1100, 1.0, 0.05) * 0.8
    x = lowpass(x, 3500)
    return finish(x, 0.5)


def sfx_bump():
    """Running into something: a dull knock with a rubbery wobble."""
    t = t_axis(0.3)
    f = (170 + 60 * np.exp(-t / 0.02)) * (1 + 0.05 * np.sin(2 * np.pi * 22 * t) * np.exp(-t / 0.08))
    x = np.sin(phase_of(f)) * env_exp(len(t), 0.002, 0.07)
    x += 0.5 * lowpass(noise(len(t)), 900) * np.exp(-t / 0.012)
    x += 0.35 * woodblock(420, 1.0, 0.3)
    return finish(roomy(x, 0.08), 0.8)


def sfx_gulp():
    """Each cart taken into the garage: a bubbly 'plop' (pitched up per cart)."""
    t = t_axis(0.18)
    f = 260 + 620 * (1 - np.exp(-t / 0.035))
    x = np.sin(phase_of(f)) * env_exp(len(t), 0.003, 0.045)
    x += 0.15 * np.sin(phase_of(f * 3)) * env_exp(len(t), 0.003, 0.02)
    return finish(roomy(x, 0.07), 0.7)


def sfx_shatter():
    """The garage breaking into pieces: little tiles clattering apart."""
    n = secs(0.6)
    x = np.zeros(n)
    # A soft thump for the break itself.
    t = t_axis(0.15)
    x[: len(t)] += 0.6 * np.sin(phase_of(140 + 120 * np.exp(-t / 0.02))) * np.exp(-t / 0.04)
    x[: len(t)] += 0.5 * bandpass(noise(len(t)), 600, 4000) * np.exp(-t / 0.02)
    # Then pieces: short, bright clicks scattered and thinning out.
    for i in range(22):
        at = 0.005 + (rng.random() ** 1.8) * 0.38
        freq = rng.uniform(1800, 4200)
        tick = woodblock(freq, rng.uniform(0.25, 0.6), 0.05)
        place(x, tick, secs(at))
    # Glassy shimmer on top.
    for i in range(6):
        at = 0.02 + rng.random() * 0.2
        place(x, 0.12 * glock(rng.choice([96, 100, 103, 108]), 0.4), secs(at))
    return finish(roomy(x, 0.14), 0.8)


def sfx_home():
    """A convoy home: a bright rising chime."""
    x = np.zeros(secs(1.0))
    for i, note in enumerate([72, 76, 79, 84]):
        place(x, glock(note + 12, 0.7, 0.7 + 0.1 * i), secs(0.055 * i))
    for i, note in enumerate([60, 64, 67, 72]):
        place(x, 0.5 * marimba(note + 12, 0.5), secs(0.055 * i))
    return finish(roomy(x, 0.18, 0.5), 0.75)


def sfx_win():
    """Level cleared: a short, happy fanfare."""
    beat = 0.13
    x = np.zeros(secs(2.4))
    tune = [(0, 72), (1, 76), (2, 79), (3, 84), (4, 79), (5, 84), (6, 88)]
    for step, note in tune:
        place(x, marimba(note, 0.5, 0.9), secs(step * beat))
        place(x, 0.35 * glock(note + 12, 0.6), secs(step * beat))
    # Final chord, held with a sparkle run over it.
    chord_at = 7 * beat
    for note in (72, 76, 79, 84):
        place(x, 0.6 * marimba(note, 1.0), secs(chord_at))
        place(x, 0.4 * glock(note + 12, 1.2), secs(chord_at))
    place(x, 0.5 * pad([60, 64, 67, 72], 1.3), secs(chord_at))
    place(x, pluck_bass(48, 0.6, 0.8), secs(chord_at))
    place(x, 0.6 * kick(), secs(chord_at))
    for i, note in enumerate([96, 100, 103, 108, 103, 108]):
        place(x, 0.18 * glock(note, 0.4), secs(chord_at + 0.1 + 0.05 * i))
    return finish(roomy(x, 0.2, 0.8), 0.85)


def sfx_fail():
    """Time's up: a gentle, cartoon 'aww' going down."""
    x = np.zeros(secs(1.6))
    notes = [(0.0, 67, 0.22), (0.24, 66, 0.22), (0.48, 65, 0.7)]
    for at, note, length in notes:
        t = t_axis(length)
        f = midi_hz(note - 12) * (1 + 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.2, 0, 1))
        if length > 0.5:
            f *= 2 ** (-1.5 * np.clip((t - 0.25) / 0.45, 0, 1) / 12)
        saw = ((np.cumsum(f) / RATE) % 1) * 2 - 1
        tone = lowpass(saw, 700 + 900 * np.exp(-t / 0.15))
        tone += 0.5 * np.sin(phase_of(f))
        tone *= np.clip(t / 0.02, 0, 1) * np.clip((length - t) / 0.08, 0, 1)
        place(x, tone * 0.8, secs(at))
    return finish(roomy(x, 0.15, 0.5), 0.7)


def sfx_tick():
    """The clock's last seconds."""
    x = woodblock(1900, 1.0, 0.07) + 0.4 * woodblock(950, 1.0, 0.07)
    return finish(roomy(x, 0.05), 0.6)


def sfx_coin():
    """A coin landing in the counter: the classic two-note ding."""
    x = np.zeros(secs(0.5))
    for at, note, length in [(0.0, 83, 0.08), (0.06, 88, 0.4)]:
        t = t_axis(length)
        f = midi_hz(note)
        tone = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2 * t)
        tone += 0.15 * (2 * np.abs(2 * ((f * t) % 1) - 1) - 1)
        tone *= env_exp(len(t), 0.002, 0.12 if length > 0.1 else 0.05)
        place(x, fade_tail(tone, 0.01), secs(at))
    return finish(roomy(x, 0.1), 0.6)


def sfx_whoosh():
    """Screens sliding in and out: a soft airy sweep."""
    t = t_axis(0.45)
    shape = np.sin(np.pi * np.clip(t / 0.45, 0, 1)) ** 2
    cut = 500 + 3500 * np.sin(np.pi * np.clip(t / 0.45, 0, 1))
    x = lowpass(highpass(noise(len(t)), 300), cut) * shape
    return finish(x, 0.45)


def sfx_poof():
    """The Remove booster: a vehicle popping away in a puff."""
    t = t_axis(0.3)
    f = 520 + 500 * (1 - np.exp(-t / 0.03))
    x = 0.6 * np.sin(phase_of(f)) * env_exp(len(t), 0.002, 0.05)
    x += lowpass(noise(len(t)), 2500 * np.exp(-t / 0.08) + 300) * env_exp(len(t), 0.004, 0.07)
    return finish(roomy(x, 0.1), 0.7)


def sfx_hint():
    """The Hint booster: a magic sparkle running upwards."""
    x = np.zeros(secs(1.2))
    run = [72, 76, 79, 83, 84, 88, 91, 96]
    for i, note in enumerate(run):
        place(x, (0.5 + 0.06 * i) * glock(note, 0.6), secs(0.045 * i))
    shimmer = t_axis(0.8)
    sh = highpass(noise(len(shimmer)), 7000) * np.sin(np.pi * shimmer / 0.8) ** 2 * 0.15
    place(x, sh, 0)
    return finish(roomy(x, 0.25, 0.6), 0.7)


def sfx_unlock():
    """A booster unlocked: a bright reveal chord."""
    x = np.zeros(secs(1.6))
    for i, note in enumerate([67, 72, 76, 79, 84]):
        place(x, 0.6 * glock(note + 12, 1.2), secs(0.03 * i))
        place(x, 0.5 * marimba(note, 0.8), secs(0.03 * i))
    place(x, 0.4 * pad([60, 64, 67, 72], 1.4), 0)
    for i in range(10):
        place(x, 0.12 * glock(int(rng.choice([96, 100, 103, 108])), 0.3), secs(0.15 + 0.06 * i))
    return finish(roomy(x, 0.25, 0.7), 0.75)


def sfx_star():
    """A star popping onto the win card (pitched up for each)."""
    x = glock(88, 0.6)
    place(x, 0.5 * marimba(76, 0.4), 0)
    t = t_axis(0.05)
    x[: len(t)] += 0.3 * bandpass(noise(len(t)), 3000, 9000) * np.exp(-t / 0.008)
    return finish(roomy(x, 0.15), 0.7)


# -- background music --------------------------------------------------------

BPM = 112
EIGHTH = 60 / BPM / 2
BAR = EIGHTH * 8

# Four bars, one chord each: C, Am, F, G. (root for the bass, triad for the pad)
CHORDS = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [55, 59, 62])]

# (eighth, midi, length in eighths) over a four-bar phrase.
PHRASE_A = [
    (0, 76, 1), (2, 79, 1), (4, 84, 2), (6, 79, 1), (7, 76, 1),
    (8, 81, 1), (10, 84, 1), (12, 81, 1), (13, 79, 1), (14, 76, 2),
    (16, 77, 1), (18, 81, 1), (20, 84, 2), (22, 81, 1), (23, 77, 1),
    (24, 79, 1), (25, 81, 1), (26, 79, 1), (27, 77, 1), (28, 74, 2), (30, 71, 1), (31, 74, 1),
]
PHRASE_B = [
    (0, 72, 1), (1, 76, 1), (2, 79, 1), (3, 84, 1), (4, 83, 1), (5, 84, 1), (6, 79, 2),
    (8, 76, 1), (9, 81, 1), (10, 84, 1), (11, 88, 1), (12, 86, 1), (13, 84, 1), (14, 81, 2),
    (16, 77, 1), (17, 81, 1), (18, 84, 1), (19, 81, 1), (20, 79, 1), (21, 77, 1), (22, 76, 1), (23, 77, 1),
    (24, 79, 3), (28, 74, 1), (29, 76, 1), (30, 77, 1), (31, 79, 1),
]
# Glockenspiel answers, only in the second half.
COUNTER = [(6, 91, 2), (14, 88, 2), (22, 89, 2), (30, 86, 2)]


def bgm():
    phrases = [PHRASE_A, PHRASE_B, PHRASE_A, PHRASE_B]
    bars = 4 * len(phrases)
    length = bars * BAR
    tail = 2.5
    n = secs(length + tail)

    lead = np.zeros(n)
    keys = np.zeros(n)
    bass = np.zeros(n)
    pads = np.zeros(n)
    drums = np.zeros(n)
    hats = np.zeros(n)

    for p, phrase in enumerate(phrases):
        full = p >= 2
        base = p * 4 * BAR

        for eighth, note, dur in phrase:
            at = base + eighth * EIGHTH
            swing = 0.018 if eighth % 2 else 0
            vel = 0.85 + 0.15 * (eighth % 4 == 0)
            place(lead, marimba(note, 0.2 + dur * EIGHTH, vel), secs(at + swing))

        if full:
            for eighth, note, dur in COUNTER:
                place(lead, 0.35 * glock(note, 0.8), secs(base + eighth * EIGHTH))

        for b in range(4):
            root, triad = CHORDS[b]
            bar_at = base + b * BAR

            # Bass: bouncy root / octave / fifth.
            for eighth, step, vel in [(0, 0, 1), (3, 12, 0.6), (4, 7, 0.85), (6, 0, 0.75)]:
                place(bass, pluck_bass(root + step, EIGHTH * 1.6, vel), secs(bar_at + eighth * EIGHTH))

            # Offbeat chord plucks for bounce.
            for eighth in (1, 3, 5, 7):
                swing = 0.018
                for note in triad:
                    place(keys, marimba(note, 0.25, 0.28), secs(bar_at + eighth * EIGHTH + swing))

            place(pads, pad(triad, BAR + 0.2), secs(bar_at))

            # Drums: lighter in the first half, fuller in the second.
            place(drums, kick(1.0), secs(bar_at))
            place(drums, kick(0.8), secs(bar_at + 4 * EIGHTH))
            if full:
                place(drums, kick(0.55), secs(bar_at + 5 * EIGHTH))
            for beat in (2, 6):
                place(drums, snap(0.55 if full else 0.4), secs(bar_at + beat * EIGHTH))
            steps = 16 if full else 8
            for s in range(steps):
                sub = BAR / steps
                accent = 1.0 if (s * 8 // steps) % 2 else 0.55
                if full and s % 2:
                    accent *= 0.6
                swing = 0.018 if (s * 8 // steps) % 2 and s % (steps // 8) == 0 else 0
                place(hats, shaker(0.35 * accent), secs(bar_at + s * sub + swing))

    # Mix into stereo with a little width, and a shared room.
    def spread(x, left, right):
        return np.stack([x * left, x * right])

    mix = (
        spread(lead, 0.9, 0.75)
        + spread(keys, 0.55, 0.75)
        + spread(bass, 0.95, 0.95)
        + spread(pads, 0.28, 0.3)
        + spread(drums, 0.55, 0.55)
        + spread(hats, 0.4, 0.55)
    )

    hall_l = reverb_ir(2.2, 0.55, 6000, seed=11)
    hall_r = reverb_ir(2.2, 0.55, 6000, seed=12)
    send = lead * 0.8 + keys * 0.5 + pads * 0.6 + hats * 0.2 + drums * 0.15
    mix[0] += 0.22 * convolve(send, hall_l)[:n]
    mix[1] += 0.22 * convolve(send, hall_r)[:n]

    # Wrap the tail round to the start so the loop joins without a seam.
    loop = secs(length)
    body = mix[:, :loop].copy()
    wrap = mix[:, loop:]
    body[:, : wrap.shape[1]] += wrap

    # Gentle glue: soft clip then normalise.
    body = np.tanh(body * 1.2) / np.tanh(1.2)
    body *= 0.8 / np.max(np.abs(body))
    return body


# ---------------------------------------------------------------------------

EFFECTS = {
    "tap": sfx_tap,
    "grab": sfx_grab,
    "step": sfx_step,
    "bump": sfx_bump,
    "gulp": sfx_gulp,
    "shatter": sfx_shatter,
    "home": sfx_home,
    "win": sfx_win,
    "fail": sfx_fail,
    "tick": sfx_tick,
    "coin": sfx_coin,
    "whoosh": sfx_whoosh,
    "poof": sfx_poof,
    "hint": sfx_hint,
    "unlock": sfx_unlock,
    "star": sfx_star,
}


def main():
    os.makedirs(OUT, exist_ok=True)

    for name, make in EFFECTS.items():
        path = write_mp3(name + ".mp3", make())
        print("wrote", os.path.relpath(path))

    music = bgm()
    path = write_mp3("bgm.mp3", music.T.reshape(-1), channels=2, kbps=160)
    print("wrote", os.path.relpath(path), "(%.1fs loop)" % (music.shape[1] / RATE))


if __name__ == "__main__":
    main()
