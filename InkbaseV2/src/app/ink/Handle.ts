import { GameObject, root } from '../GameObject';
import SVG from '../Svg';
import * as constraints from '../constraints';
import { generateId } from '../../lib/helpers';
import { Position } from '../../lib/types';
import Vec from '../../lib/vec';

export default class Handle extends GameObject {
  static create(position: Position, doAbsorb = true): Handle {
    const handle = new Handle(position);
    if (doAbsorb) {
      handle.absorbNearbyHandles();
    }
    return handle;
  }

  public readonly id = generateId();

  private readonly element = SVG.add('circle', SVG.inkElm, {
    class: 'handle',
    r: 3,
  });

  public readonly xVariable = constraints.variable(0, {
    object: this,
    property: 'x',
  });
  public readonly yVariable = constraints.variable(0, {
    object: this,
    property: 'y',
  });

  private constructor(position: Position) {
    super(root);
    this.position = position;
  }

  get x() {
    return this.xVariable.value;
  }

  get y() {
    return this.yVariable.value;
  }

  get position(): Position {
    return this;
  }

  set position(pos: Position) {
    ({ x: this.xVariable.value, y: this.yVariable.value } = pos);
  }

  remove() {
    this.removeFromDOM();
    super.remove();
  }

  absorb(that: Handle) {
    constraints.absorb(this, that);
  }

  absorbNearbyHandles() {
    this.page.forEach({
      what: aCanonicalHandle,
      near: this.position,
      do: that => {
        if (that !== this) {
          this.absorb(that);
        }
      },
    });
  }

  private _canonicalHandle: Handle = this;
  readonly absorbedHandles = new Set<Handle>();

  get isCanonical() {
    return this._canonicalHandle === this;
  }

  get canonicalInstance() {
    return this._canonicalHandle;
  }

  private set canonicalInstance(handle: Handle) {
    this._canonicalHandle = handle;
  }

  /** This method should only be called by the constraint system. */
  _absorb(that: Handle) {
    if (that === this) {
      return;
    }

    that.canonicalInstance.absorbedHandles.delete(that);
    for (const handle of that.absorbedHandles) {
      this._absorb(handle);
    }
    that.canonicalInstance = this;
    this.absorbedHandles.add(that);
  }

  /** This method should only be called by the constraint system. */
  _forgetAbsorbedHandles() {
    this.canonicalInstance = this;
    this.absorbedHandles.clear();
  }

  breakOff(handle: Handle) {
    if (this.absorbedHandles.has(handle)) {
      constraints.absorb(this, handle).remove();
      return;
    } else if (handle === this) {
      const absorbedHandles = [...this.absorbedHandles];
      const newCanonicalHandle = absorbedHandles.shift()!;
      constraints.absorb(this, newCanonicalHandle).remove();
      for (const absorbedHandle of absorbedHandles) {
        constraints.absorb(newCanonicalHandle, absorbedHandle);
      }
    } else {
      throw new Error('tried to break off a handle that was not absorbed');
    }
  }

  render(t: number, dt: number) {
    SVG.update(this.element, { cx: this.x, cy: this.y });
    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  private removeFromDOM() {
    this.element.remove();
  }

  distanceToPoint(point: Position) {
    return Vec.dist(this.position, point);
  }
}

export const aHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle ? gameObj : null;

export const aCanonicalHandle = (gameObj: GameObject) =>
  gameObj instanceof Handle && gameObj.isCanonical ? gameObj : null;
