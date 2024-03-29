import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Page from './Page';
import SVG from './Svg';
import Handle from './strokes/Handle';

interface Options {
  handleSnaps: boolean;
  alignmentSnaps: boolean;
}

export default class Snaps {
  private activeSnaps: Snap[] = [];

  // rendering
  private snapSvgElementById = new Map<string, SVGElement>();
  private needsRerender = false;

  constructor(
    private page: Page,
    private options: Options
  ) {}

  snapPositions(transformedPositions: Map<Handle, Position>) {
    const snaps: Snap[] = [];
    const snapPositions = new Map<Handle, Position>();
    const snapHandles = Array.from(Handle.all).filter(
      h => !transformedPositions.has(h)
    );
    const selectedHandles = Array.from(transformedPositions.keys());
    const connectedHandles = this.page.handlesReachableFrom(selectedHandles);

    for (const [handle, transformedPosition] of transformedPositions) {
      if (snaps.some(s => s.snapHandle === handle)) {
        // This handle is already being used as a snap.
        // If we move it (by snapping it to another handle), the UI feels shaky.
        snapPositions.set(handle, transformedPosition);
        continue;
      }

      const snapVectors: Position[] = [];

      if (this.options.handleSnaps) {
        // snap to handle
        for (const snapHandle of snapHandles) {
          const v = Vec.sub(snapHandle.position, transformedPosition);
          if (Vec.len(v) < 10) {
            snapVectors.push(v);
            snaps.push(new HandleSnap(handle, snapHandle));
            break;
          }
        }
      }

      if (this.options.alignmentSnaps && snapVectors.length === 0) {
        // vertical alignment
        for (const snapHandle of connectedHandles) {
          if (snapHandle === handle) {
            continue;
          }
          const dx = snapHandle.position.x - transformedPosition.x;
          if (Math.abs(dx) < 10) {
            const v = Vec(dx, 0);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(handle, snapHandle));
            break;
          }
        }

        // horizontal alignment
        for (const snapHandle of connectedHandles) {
          if (snapHandle === handle) {
            continue;
          }
          const dy = snapHandle.position.y - transformedPosition.y;
          if (Math.abs(dy) < 10) {
            const v = Vec(0, dy);
            snapVectors.push(v);
            snaps.push(new AlignmentSnap(handle, snapHandle));
            break;
          }
        }
      }

      const snappedPos = snapVectors.reduce(
        (p, v) => Vec.add(p, v),
        transformedPosition
      );

      snapPositions.set(handle, snappedPos);
    }

    this.setActiveSnaps(snaps);

    return snapPositions;
  }

  private setActiveSnaps(activeSnaps: Snap[]) {
    this.activeSnaps = activeSnaps;
    this.needsRerender = true;

    // Delete the svg elements associated w/ snaps that went away
    const activeSnapIds = new Set(activeSnaps.map(snap => snap.id));
    for (const [id, svgElem] of this.snapSvgElementById) {
      if (!activeSnapIds.has(id)) {
        svgElem.remove();
        this.snapSvgElementById.delete(id);
      }
    }
  }

  clear() {
    this.setActiveSnaps([]);
  }

  render() {
    if (!this.needsRerender) {
      return;
    }

    for (const snap of this.activeSnaps) {
      const id = snap.id;
      const { shapeType, shapeData } = snap.getShape();

      let svgElem = this.snapSvgElementById.get(id);
      if (!svgElem) {
        svgElem = SVG.add(shapeType, {
          ...shapeData,
          fill: 'none',
          stroke: 'rgb(180, 134, 255)',
        });
        this.snapSvgElementById.set(id, svgElem);
      } else {
        SVG.update(svgElem, shapeData);
      }
    }

    this.needsRerender = false;
  }
}

type Shape = CircleShape | LineShape;

interface CircleShape {
  shapeType: 'circle';
  shapeData: {
    cx: number;
    cy: number;
    r: number;
  };
}

interface LineShape {
  shapeType: 'line';
  shapeData: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

abstract class Snap {
  id: string;

  constructor(
    public handle: Handle,
    public snapHandle: Handle
  ) {
    this.id = `${handle.id}.${snapHandle.id}.${this.constructor.name}`;
  }

  abstract getShape(): Shape;
}

class HandleSnap extends Snap {
  constructor(handle: Handle, snapHandle: Handle) {
    super(handle, snapHandle);
  }

  getShape(): CircleShape {
    return {
      shapeType: 'circle',
      shapeData: {
        cx: this.handle.position.x,
        cy: this.handle.position.y,
        r: 7,
      },
    };
  }
}

class AlignmentSnap extends Snap {
  constructor(handle: Handle, snapHandle: Handle) {
    super(handle, snapHandle);
  }

  getShape(): LineShape {
    return {
      shapeType: 'line',
      shapeData: {
        x1: this.handle.position.x,
        y1: this.handle.position.y,
        x2: this.snapHandle.position.x,
        y2: this.snapHandle.position.y,
      },
    };
  }
}
