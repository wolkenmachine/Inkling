import { clip } from '../lib/math';
import { Position, PositionWithPressure } from '../lib/types';
import Vec from '../lib/vec';

type Attributes = Record<string, string | number>;

const NS = 'http://www.w3.org/2000/svg';

const rootElm = document.querySelector('svg') as SVGSVGElement;
const nowElm = document.querySelector('#now') as SVGGElement;

function add(
  type: string,
  attributes: Attributes = {},
  parent: SVGElement = rootElm
) {
  return parent.appendChild(
    update(document.createElementNS(NS, type), attributes)
  );
}

/**
 * Use the sugar attribute `content` to set innerHTML.
 * E.g.: SVG.update(myTextElm, { content: 'hello' })
 */
function update<T extends SVGElement>(elm: T, attributes: Attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = ((elm as any).__cache ||= {});
    if (cache[key] === value) {
      return;
    }
    cache[key] = value;

    if (key === 'content') {
      elm.innerHTML = '' + value;
    } else {
      elm.setAttribute(key, '' + value);
    }
  });
  return elm;
}

// Store the current time whenever SVG.clearNow() is called, so that elements
// created by SVG.now() will live for a duration relative to that time.
let lastTime = 0;

/**
 * Puts an element on the screen for a brief moment, after which it's automatically deleted.
 * This allows for immediate-mode rendering — super useful for debug visuals.
 * By default, elements are removed whenever SVG.clearNow() is next called (typically every frame).
 * Include a `life` attribute to specify a minimum duration until the element is removed.
 */
function now(type: string, attributes: Attributes) {
  const life = +attributes.life || 0;
  delete attributes.life;

  const elm = add(type, attributes, nowElm);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (elm as any).__expiry = lastTime + life;

  return elm;
}

/**
 * Called every frame by App, but feel free to call it more frequently if needed
 * (E.g.: at the top of a loop body, so that only elements from the final iteration are shown).
 * Passing `currentTime` allows elements with a "life" to not be cleared until their time has passed.
 */
function clearNow(currentTime = Infinity) {
  if (isFinite(currentTime)) {
    lastTime = currentTime;
  }

  for (const elm of Array.from(nowElm.children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expiry = (elm as any).__expiry || 0;
    if (currentTime > expiry) {
      elm.remove();
    }
  }
}

/**
 * Helps you build a polyline from Positions (or arrays of Positions).
 * E.g.: SVG.now('polyline', { points: SVG.points(stroke.points), stroke: '#00F' });
 * E.g.: SVG.now('polyline', { points: SVG.points(pos1, pos2, posArr), stroke: '#F00' });
 */
function points(...positions: Array<Position | Position[]>) {
  return positions
    .flat()
    .map(p => p.x + ' ' + p.y)
    .join(' ');
}

/**
 * Helps you build the path for a semicircular arc, which is normally a huge pain.
 * NB: Can only draw up to a half circle when mirror is false.
 */
function arcPath(
  center: Position, // Center of the (semi)circle
  radius: number, // Radius of the (semi)circle
  angle: number, // Direction to start the arc. Radians, 0 is rightward.
  rotation: number, // Arc size of the (semi)circle. 0 to PI radians.
  mirror = true // Mirror the arc across the start. Required to draw more than a half-circle.
) {
  // Values outside this range produce nonsense arcs
  rotation = clip(rotation, -Math.PI, Math.PI);

  let S = Vec.add(center, Vec.polar(angle, radius));
  let path = '';

  if (mirror) {
    let B = Vec.add(center, Vec.polar(angle - rotation, radius));
    path += `M ${B.x}, ${B.y} A ${radius},${radius} 0 0,1 ${S.x}, ${S.y}`;
  } else {
    path += `M ${S.x}, ${S.y}`;
  }

  let A = Vec.add(center, Vec.polar(angle + rotation, radius));
  path += `A ${radius},${radius} 0 0,1 ${A.x}, ${A.y}`;

  return path;
}

/** Returns a string that can be used as the 'd' attribute of an SVG path element. */
function path(points: Position[] | PositionWithPressure[]) {
  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
}

const statusElement = add('text', {
  x: 20,
  content: '',
  stroke: '#bbb',
});

let statusHideTimeMillis = 0;

function showStatus(text: string, time = 3_000) {
  update(statusElement, {
    content: text,
    visibility: 'visible',
    y: window.innerHeight - 5,
  });
  statusHideTimeMillis = Date.now() + time;
  setTimeout(() => {
    if (Date.now() >= statusHideTimeMillis) {
      update(statusElement, { visibility: 'hidden' });
    }
  }, time);
}

export default {
  add,
  update,
  now,
  clearNow,
  points,
  arcPath,
  path,
  showStatus,
};
