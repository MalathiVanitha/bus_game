export class Trail {
    constructor(points) {
        this.points = points.map((p) => ({ x: p.x, y: p.y }));
    }

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


    sampleInto(out, count, s0, s1) {
        return samplePolyline(this.points, out, count, s0, s1);
    }
}

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