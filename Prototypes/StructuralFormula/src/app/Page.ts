import Vec from '../lib/vec';
import ArcSegment from './strokes/ArcSegment';
import LineSegment from './strokes/LineSegment';
import FreehandStroke from './strokes/FreehandStroke';
import StrokeGroup from './strokes/StrokeGroup';
import Stroke from './strokes/Stroke';
import StrokeClusters from './StrokeClusters';
import { Position, PositionWithPressure } from '../lib/types';
import Handle from './strokes/Handle';
import StrokeAnalyzer from './StrokeAnalyzer';
import { makeIterableIterator } from '../lib/helpers';
import Formula from './strokes/Formula';

interface Options {
  strokeAnalyzer: boolean;
}

export default class Page {
  // Stroke clusters are possible stroke Groups
  readonly clusters = new StrokeClusters();

  // Stroke graph looks at the page and tries to be smart about finding structure
  readonly analyzer: StrokeAnalyzer | null;

  // TODO: figure out a better model for how to store different kinds of strokes
  // For now just keep them separate, until we have a better idea of what freehand strokes look like
  readonly lineSegments: Array<LineSegment | ArcSegment> = [];
  readonly strokeGroups: StrokeGroup[] = [];
  readonly strokes: Stroke[] = [];
  readonly formulas: Formula[] = [];

  constructor(options: Options) {
    this.analyzer = options.strokeAnalyzer ? new StrokeAnalyzer(this) : null;
  }

  get freehandStrokes() {
    return makeIterableIterator(
      [this.strokes],
      (s: Stroke): s is FreehandStroke => s instanceof FreehandStroke
    );
  }

  addLineSegment(aPos: Position, bPos: Position) {
    const ls = new LineSegment(aPos, bPos);
    this.lineSegments.push(ls);
    return ls;
  }

  addArcSegment(aPos: Position, bPos: Position, cPos: Position) {
    const as = new ArcSegment(aPos, bPos, cPos);
    this.lineSegments.push(as);
    return as;
  }

  addStrokeGroup(strokes: Set<FreehandStroke>): StrokeGroup {
    const sg = new StrokeGroup(strokes);
    this.strokeGroups.push(sg);
    return sg;
  }

  addStroke<S extends Stroke>(stroke: S) {
    this.strokes.push(stroke);
    return stroke;
  }

  removeStroke<S extends Stroke>(stroke: S) {
    let index = this.strokes.findIndex(s=> s == stroke);
    
    this.strokes[index].remove();
    this.strokes.splice(index, 1);
  }

  addFormula(formula: Formula){
    this.formulas.push(formula)
  }

  findFormulaTokenNear(position: Position) {
    for(const formula of this.formulas) {
      let found = formula.findTokenNear(position);
      if(found) return found
    }
  }

  onstrokeUpdated(stroke: Stroke) {
    if (stroke instanceof FreehandStroke) {
      this.analyzer?.addStroke(stroke);
    }
  }

  addFreehandStroke(points: Array<PositionWithPressure>) {
    const s = new FreehandStroke(points);
    this.addStroke(s);
    this.analyzer?.addStroke(s);
    return s;
  }

  findHandleNear(pos: Position, dist = 20): Handle | null {
    let closestHandle: Handle | null = null;
    let closestDistance = dist;

    for (const handle of Handle.all) {
      const d = Vec.dist(handle.position, pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestHandle = handle;
      }
    }

    return closestHandle;
  }

  handlesReachableFrom(startHandles: Handle[]) {
    const reachableHandles = new Set(
      startHandles.map(handle => handle.canonicalInstance)
    );
    const things = [...this.lineSegments, ...this.strokeGroups];
    while (true) {
      const oldSize = reachableHandles.size;

      for (const thing of things) {
        if (reachableHandles.has(thing.a.canonicalInstance)) {
          reachableHandles.add(thing.b.canonicalInstance);
        }
        if (reachableHandles.has(thing.b.canonicalInstance)) {
          reachableHandles.add(thing.a.canonicalInstance);
        }
      }

      if (reachableHandles.size === oldSize) {
        break;
      }
    }
    return reachableHandles;
  }

  /**
   * returns a set of handles that are immediately connected to the given handle
   * (but not to its canonical handle, if it has been absorbed)
   */
  getHandlesImmediatelyConnectedTo(handle: Handle) {
    const connectedHandles = new Set<Handle>();

    for (const thing of [...this.lineSegments, ...this.strokeGroups]) {
      if (handle === thing.a) {
        connectedHandles.add(thing.b);
      }
      if (handle === thing.b) {
        connectedHandles.add(thing.a);
      }
    }

    return connectedHandles;
  }

  findFreehandStrokeNear(pos: Position, dist = 20) {
    let closestStroke = null;
    let closestDistance = dist;

    for (const stroke of this.freehandStrokes) {
      const d = stroke.minDistanceFrom(pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestStroke = stroke;
      }
    }

    return closestStroke;
  }

  findStrokeGroupNear(pos: Position, dist = 20) {
    let closestStrokeGroup = null;
    let closestDistance = dist;

    for (const strokeGroup of this.strokeGroups) {
      const d = strokeGroup.minDistanceFrom(pos);
      if (d < closestDistance) {
        closestDistance = d;
        closestStrokeGroup = strokeGroup;
      }
    }

    return closestStrokeGroup;
  }

  render(dt: number, time: number) {
    this.lineSegments.forEach(render);
    this.strokes.forEach(render);
    this.analyzer?.render();
    this.formulas.forEach(s=>{
      s.render(dt, time);
    });

    this.strokeGroups.forEach(render);
  }
}

type Renderable = { render: Function };
const render = (s: Renderable) => s.render();
