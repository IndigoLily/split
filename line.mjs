import { Vec } from './vec.mjs';

function is_finite(n) {
    return n !== Infinity && n !== -Infinity;
}

export class Line {
    constructor(m = 1, b = 0) {
        this.m = m; // if infinite, line is vertical
        this.b = b; // if vertical, b is x location
    }
    static get segment() {
        return Segment;
    }
    static fromPoints(p0, p1) {
        const m = (p1.y - p0.y) / (p1.x - p0.x);
        const b = is_finite(m) ? p0.y - m * p0.x : p0.x;
        return new Line(m, b);
    }
    static intersection(L0, L1) {
        if (L0.m === L1.m) {
            return false;
        } else if (!is_finite(L0.m)) {
            return new Vec(L0.b, L1.y_at_x(L0.b));
        } else if (!is_finite(L1.m)) {
            return new Vec(L1.b, L0.y_at_x(L1.b));
        } else {
            const x = (L1.b - L0.b) / (L0.m - L1.m);
            return new Vec(x, L0.y_at_x(x));
        }
    }
    get is_vertical() {
        return !is_finite(this.m);
    }
    intersection(other) {
        return Line.intersection(this, other);
    }
    y_at_x(x) {
        return this.m*x+this.b;
    }
    draw(canvas) {
        const c = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const m = this.m;
        const b = this.b;
        if (is_finite(m)) {
            if (!((b < 0 && m*w+b < 0) || (b > h && m*w+b > h))) { // crosses through screen area
                c.beginPath();
                if (b >= 0 && b < h) { // starts on left edge
                    c.moveTo(0, b);
                } else { // starts on top or bottom edge
                    const bot = -b/m;
                    const top = (h-b)/m;
                    if (bot < top) {
                        c.moveTo(bot, 0);
                    } else {
                        c.moveTo(top, h);
                    }
                }
                if (m*w+b >= 0 && m*w+b < h) { // ends on right edge
                    c.lineTo(w, m*w+b);
                } else { // ends on top or bottom edge
                    const bot = -b/m;
                    const top = (h-b)/m;
                    if (bot > top) {
                        c.lineTo(bot, 0);
                    } else {
                        c.lineTo(top, h);
                    }
                }
                c.stroke();
            } else {
                return;
            }
        } else {
            c.beginPath();
            c.moveTo(b, 0);
            c.lineTo(b, h);
            c.stroke();
        }
    }
}

class Segment {
    constructor(p0, p1) {
        this.line = Line.fromPoints(p0, p1);
        if (is_finite(this.line.m)) {
            this.start = p0.x;
            this.end   = p1.x;
        } else {
            this.start = p0.y;
            this.end   = p1.y;
        }
        if (this.start > this.end) {
            const tmp = this.start;
            this.start = this.end;
            this.end = tmp;
        }
    }

    static intersection(s0, s1) {
        const intxn = Line.intersection(s0.line, s1.line);

        if (intxn) {
            if (!is_finite(s0.line.m)) {
                if (intxn.x >= s1.start && intxn.x <= s1.end && intxn.y >= s0.start && intxn.y <= s0.end) {
                    return intxn;
                } else {
                    return false;
                }
            }

            if (!is_finite(s1.line.m)) {
                if (intxn.x >= s0.start && intxn.x <= s0.end && intxn.y >= s1.start && intxn.y <= s1.end) {
                    return intxn;
                } else {
                    return false;
                }
            }

            if (intxn.x >= s0.start && intxn.x <= s0.end  &&  intxn.x >= s1.start && intxn.x <= s1.end) {
                return intxn;
            }
        }

        return false;
    }

    get is_vertical() {
        return this.line.is_vertical;
    }

    draw(canvas) {
        const c = canvas.getContext('2d');
        c.beginPath();
        if (is_finite(this.line.m)) {
            c.moveTo(this.start, this.line.y_at_x(this.start));
            c.lineTo(this.end, this.line.y_at_x(this.end));
        } else {
            c.moveTo(this.line.b, this.start);
            c.lineTo(this.line.b, this.end);
        }
        c.stroke();
    }
}
