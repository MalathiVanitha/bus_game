/**
 * The path the tractor leaves behind it. points[0] is the live leading point, the
 * one the drag pulls around; every later point is a corner the tractor already
 * drove through. The carts are read off it by arc length, so each one runs over
 * exactly the ground the vehicle in front of it covered.
 */
export class Trail {
    constructor(points) {
        this.points = points.map((p) => ({ x: p.x, y: p.y }));
    }

    /** Drop everything further than `maxLen` behind the leading point. */
    trim(maxLen) {
        let len = 0;

        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1];
            const b = this.points[i];
            const seg = Math.hypot(b.x - a.x, b.y - a.y);

            if (len + seg >= maxLen) {
                const t = seg > 0 ? (maxLen - len) / seg : 0;

                this.points.length = i + 1;
                this.points[i] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
                return;
            }

            len += seg;
        }
    }

    /** Position at arc length `s` measured back from the leading point. */
    pointAt(s) {
        if (s <= 0) return { x: this.points[0].x, y: this.points[0].y };

        let len = 0;

        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1];
            const b = this.points[i];
            const seg = Math.hypot(b.x - a.x, b.y - a.y);

            if (len + seg >= s) {
                const t = seg > 0 ? (s - len) / seg : 0;
                return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }

            len += seg;
        }

        const last = this.points[this.points.length - 1];

        return { x: last.x, y: last.y };
    }

    /**
     * Fill `out` with `count` evenly spaced positions between arc lengths s0 and
     * s1. One walk of the polyline instead of one per sample, because this runs
     * for every convoy on every frame.
     */
    sampleInto(out, count, s0, s1) {
        return samplePolyline(this.points, out, count, s0, s1);
    }
}

/**
 * The same even spacing over any run of points, not just a Trail's own. The rig
 * lays the road the convoy is about to drive onto the front of the trail it has
 * already left, and needs that joined-up run walked the same way.
 */
export function samplePolyline(pts, out, count, s0, s1) {
    const step = count > 1 ? (s1 - s0) / (count - 1) : 0;

    let i = 1;
    let segStart = 0;
    let segLen = i < pts.length ?
        Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) : 0;

    for (let k = 0; k < count; k++) {
        const s = s0 + step * k;

        while (i < pts.length - 1 && segStart + segLen < s) {
            segStart += segLen;
            i++;
            segLen = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        }

        const a = pts[i - 1];
        const b = pts[i] || a;
        const t = segLen > 0 ? Math.min(1, Math.max(0, (s - segStart) / segLen)) : 0;

        out[k].x = a.x + (b.x - a.x) * t;
        out[k].y = a.y + (b.y - a.y) * t;
    }

    return out;
}

/**
 * In-place binomial smoothing. The trail turns a hard 90 degrees at every grid
 * corner, and a vehicle reading its heading straight off that would snap round
 * in one frame, so the sampled points get rounded off first - that rounding is
 * the whole of the turn the convoy is seen to make. Both ends stay put, which
 * keeps the tractor exactly on the path the drag routed it along.
 */
export function smoothTrailPoints(pts, passes) {
    const n = pts.length;

    if (n < 3) return pts;

    for (let p = 0; p < passes; p++) {
        let prevX = pts[0].x;
        let prevY = pts[0].y;

        for (let i = 1; i < n - 1; i++) {
            const cx = pts[i].x;
            const cy = pts[i].y;

            pts[i].x = prevX * 0.25 + cx * 0.5 + pts[i + 1].x * 0.25;
            pts[i].y = prevY * 0.25 + cy * 0.5 + pts[i + 1].y * 0.25;
            prevX = cx;
            prevY = cy;
        }
    }

    return pts;
}
