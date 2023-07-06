import engine from "./engine";
import Canvas from "./canvas";
import Relax, {
  FixedPoint,
  Horizontal,
  Length,
  MinLength,
  Orientation,
  Point as RPoint,
  Var,
  Vertical,
} from "./lib/relax-pk";

import DrawSnap from "./draw_snap";

const draw = new DrawSnap();

const canvas = new Canvas(document.body, ctx => {
  ctx.clearRect(0,0, window.innerWidth, window.innerHeight);
  draw.render(ctx);
});

engine((events) => {
  draw.update(events);
  relax(events);
  canvas.render();
});

function relax(events) {
  const r = new Relax();
  for (const c of draw.constraints) {
    addConstraints(r, c);
  }
  addHandOfGodConstraints(r, events);
  r.iterateForUpToMillis(15);
}

// TODO: get this right
function addHandOfGodConstraints(r, events) {
  if (draw.mode !== 'move') {
    return;
  }

  const fixedPoints = new Set();

  function addConstraint(event) {
    const p = draw.find_point_near(event);
    if (p == null || fixedPoints.has(p)) {
      return;
    }
    p.pos = toRPoint(p.pos);
    r.add(new FixedPoint(p.pos, new RPoint(event.x, event.y)));
    fixedPoints.add(p);
  }

  for (let idx = events.pencil.length - 1; idx >= 0; idx--) {
    const event = events.pencil[idx];
    if (event.type === 'moved') {
      addConstraint(event);
    }
  }

  for (let idx = events.pencil.length - 1; idx >= 0; idx--) {
    const event = events.pencil[idx];
    if (event.type === 'began') {
      addConstraint(event);
    }
  }
}

function addConstraints(r, c) {
  if (c.type === 'vertical') {
    c.a.pos = toRPoint(c.a.pos);
    c.b.pos = toRPoint(c.b.pos);
    r.add(new Vertical(c.a.pos, c.b.pos));
  }

  if (c.type === 'horizontal') {
    c.a.pos = toRPoint(c.a.pos);
    c.b.pos = toRPoint(c.b.pos);
    r.add(new Horizontal(c.a.pos, c.b.pos));
  }

  if (c.type === 'length') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    c.b.a.pos = toRPoint(c.b.a.pos);
    c.b.b.pos = toRPoint(c.b.b.pos);
    const v = new Var(c.a.a.pos.distanceTo(c.a.b.pos));
    r.add(new Length(c.a.a.pos, c.a.b.pos, v));
    r.add(new Length(c.b.a.pos, c.b.b.pos, v));
  }

  if (c.type === 'minLength') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    r.add(new MinLength(c.a.a.pos, c.a.b.pos, c.b));
  }

  if (c.type === 'angle') {
    c.a.a.pos = toRPoint(c.a.a.pos);
    c.a.b.pos = toRPoint(c.a.b.pos);
    c.b.a.pos = toRPoint(c.b.a.pos);
    c.b.b.pos = toRPoint(c.b.b.pos);
    r.add(new Orientation(c.a.a.pos, c.a.b.pos, c.b.a.pos, c.b.b.pos, Math.PI * c.angle / 180));
  }
}

function toRPoint(p) {
  return p instanceof RPoint ? p : new RPoint(p.x, p.y);
}