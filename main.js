import {Vec} from './vec.mjs';
import {Line} from './line.mjs';
import * as dat from './dat.gui.mjs';

const gui = new dat.GUI();
const opts = {};
opts['dense'] = 1;
opts['angle'] = 90;
opts['deviance'] = 45;
opts['dtype'] = 'Boolean';
opts['bchance'] = 1;
opts['stype'] = 'Y';
gui.add(opts, 'dense').name('Density').min(0.1).max(3);
gui.add(opts, 'angle').name('Angle').min(1).max(180);
gui.add(opts, 'deviance').name('Deviance').min(0).max(180);
const dtypeCtl = gui.add(opts, 'dtype', ['Boolean', 'Smooth']).name('Deviance Type');
const bchanceCtl = gui.add(opts, 'bchance').name('Boolean Chance').min(0).max(100).step(0.1);
dtypeCtl.onChange(val => {
  if (val === 'Boolean') {
    bchanceCtl.__li.style.display = 'list-item';
  } else {
    bchanceCtl.__li.style.display = 'none';
  }
});

gui.add(opts, 'stype', ['\u2E85', 'Y']).name('Split Type');

opts['restart'] = start;
gui.add(opts, 'restart').name('Restart');

class Ray {
  constructor(start, angle) {
    this.alive = true;
    this.age = 0;
    this.start = start;
    this.vel = new Vec(1, 0);
    this.vel.degs = angle;
    this.end = new Vec(this.start.x + this.vel.x / 100, this.start.y + this.vel.y / 100);
  }
}

const prm = document.createElement('canvas');
const tmp = document.createElement('canvas');
prm.style.position = 'fixed';
tmp.style.position = 'fixed';
prm.style.top = '0';
tmp.style.top = '0';
prm.style.left = '0';
tmp.style.left = '0';
prm.style.zIndex = -2;
tmp.style.zIndex = -1;
document.body.appendChild(prm);
document.body.appendChild(tmp);
const prm_ctx = prm.getContext('2d');
const tmp_ctx = tmp.getContext('2d');
let id = null;

window.onload = start;

function start() {
  cancelAnimationFrame(id)

  const w = prm.width = tmp.width = innerWidth;
  const h = prm.height = tmp.height = innerHeight;
  prm_ctx.lineWidth = Math.sqrt(2);
  tmp_ctx.lineWidth = Math.sqrt(2);
  prm_ctx.strokeStyle = '#fff';
  tmp_ctx.strokeStyle = '#fff';

  const numBuckets = Math.floor(w / 10);

  function whichBucket(x) {
    return Math.floor(x / w * numBuckets);
  }

  function whichBuckets(line) {
    const buckets = [];
    if (line.is_vertical) {
      buckets.push(whichBucket(line.line.b));
    } else {
      const start = whichBucket(line.start);
      const end = whichBucket(line.end);
      for (let i = start; i <= end; i++) {
        buckets.push(i);
      }
    }
    return buckets;
  }

  const { dense, angle, deviance, stype, dtype, bchance } = opts;

  const rays = [];
  {
    const x = Math.random() * w;
    const y = Math.random() * h;
    rays.push(new Ray(new Vec(x, y), 0), new Ray(new Vec(x, y), 180));
  }
  window.rays = rays;

  draw();

  function draw() {
    tmp_ctx.clearRect(0, 0, w, h)
    const buckets = [];
    for (let i = 0; i < numBuckets + 1; i++) {
      buckets.push([]);
    }
    for (let i = 0; i < rays.length; i++) {
      const line = new Line.segment(rays[i].start, rays[i].end);
      line.ray = rays[i];
      let bucketIndexes = whichBuckets(line);
      for (let j = 0; j < bucketIndexes.length; j++) {
        buckets[bucketIndexes[j]].push(line);
      }
    }

    let any_alive = false;
    const times = 10;
    for (let t = 0; t < times; t++) {
      for (let i = 0; i < rays.length; i++) {
        const ray = rays[i];

        if (ray.alive) {
          ray.age++;
          const prev_end = ray.end;
          ray.end = Vec.add(ray.end, ray.vel);
          if (ray.end.x < 0) {
            ray.alive = false;
            ray.end.x = 0;
            (new Line.segment(ray.start, ray.end)).draw(prm);
          } else if (ray.end.y < 0) {
            ray.alive = false;
            ray.end.y = 0;
            (new Line.segment(ray.start, ray.end)).draw(prm);
          } else if (ray.end.x >= w) {
            ray.alive = false;
            ray.end.x = w;
            (new Line.segment(ray.start, ray.end)).draw(prm);
          } else if (ray.end.y >= h) {
            ray.alive = false;
            ray.end.y = h;
            (new Line.segment(ray.start, ray.end)).draw(prm);
          } else {
            const test = new Line.segment(prev_end, ray.end);
            const lines = [];
            whichBuckets(test).forEach(idx => {
              buckets[idx].forEach(line => {
                lines.push(line);
              });
            });
            for (let j = 0; j < lines.length; j++) {
              if (ray === lines[j].ray) continue;
              const intxn = Line.segment.intersection(test, lines[j]);
              if (intxn) {
                ray.alive = false;
                ray.end = intxn;
                const line = new Line.segment(ray.start, ray.end);
                line.draw(prm);
                let bucketIndexes = whichBuckets(line);
                for (let j = 0; j < bucketIndexes.length; j++) {
                  buckets[bucketIndexes[j]].push(line);
                }
                break;
              }
            }
          }

          //lines[i] = new Line.segment(rays[i].start, rays[i].end);
        }
        if (ray.alive) {
          any_alive = true;

          if (ray.age > 2 && Math.random() < 1 / 40 * dense) {
            // split into two
            ray.alive = false;
            (new Line.segment(ray.start, ray.end)).draw(prm);
            const nstart = new Vec(ray.end.x, ray.end.y);
            let degs = angle, nray1, nray2;
            if (stype === '\u2E85') {
              if (dtype === 'Boolean') {
                if (Math.random() < bchance / 100) {
                  if (Math.random() < 0.5) {
                    degs += deviance;
                  } else {
                    degs -= deviance;
                  }
                }
              } else if (dtype === 'Smooth') {
                degs += (Math.random() * deviance * 2) - deviance;
              }
              nray2 = new Ray(nstart, ray.vel.degs + degs + 180);
            } else if (stype === 'Y') {
              if (dtype === 'Boolean') {
                degs = angle - (Math.random() > bchance / 100 ? 0 : deviance);
              } else if (dtype === 'Smooth') {
                degs = angle - Math.random() * deviance;
              }
              nray2 = new Ray(nstart, ray.vel.degs - degs);
            }
            nray1 = new Ray(nstart, ray.vel.degs + degs);
            rays.push(nray1);
            rays.push(nray2);
          } else if (t === times - 1) {
            // is alive but not splitting
            (new Line.segment(ray.start, ray.end)).draw(tmp);
          }
        }

      }
    }

    if (any_alive) {
      id = requestAnimationFrame(draw);
    }
    else {
      console.log('done');
    }
  }
}
