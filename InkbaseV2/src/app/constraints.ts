import numeric from 'numeric';
import { Position } from '../lib/types';
import Vec from '../lib/vec';
import Handle from './strokes/Handle';
import Selection from './Selection';
import generateId from './generateId';

class Variable {
  static readonly all: Variable[] = [];

  readonly id = generateId();

  constructor(public value: number = 0) {
    Variable.all.push(this);
  }
}

interface Knowns {
  xs: Set<Handle>;
  ys: Set<Handle>;
  variables: Set<Variable>;
}

abstract class Constraint {
  static readonly all = new Set<Constraint>();

  readonly id = generateId();

  constructor(
    public readonly handles: Handle[],
    public readonly variables: Variable[]
  ) {
    Constraint.all.add(this);
  }

  remove() {
    Constraint.all.delete(this);
  }

  /**
   * If this constraint can determine the values of any xs, ys, or variables
   * based on other things that are already known, it should set the values
   * of those things, add them to the `knowns` object, and return `true`.
   * Otherwise, it should return `false`.
   */
  propagateKnowns(_knowns: Knowns): boolean {
    return false;
  }

  /** Returns the current error for this constraint. (OK if it's negative.) */
  abstract getError(
    handlePositions: Position[],
    variableValues: number[]
  ): number;

  involves(thing: Variable | Handle): boolean {
    return thing instanceof Variable
      ? this.variables.includes(thing)
      : this.handles.some(
          cHandle => cHandle.canonicalInstance === thing.canonicalInstance
        );
  }
}

export class FixedValueConstraint extends Constraint {
  constructor(
    private readonly variable: Variable,
    private readonly value: number
  ) {
    super([], [variable]);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.variables.has(this.variable)) {
      this.variable.value = this.value;
      knowns.variables.add(this.variable);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], values: number[]) {
    const [currentValue] = values;
    return currentValue - this.value;
  }
}

export class VariableEqualsConstraint extends Constraint {
  constructor(
    private readonly a: Variable,
    private readonly b: Variable
  ) {
    super([], [a, b]);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.variables.has(this.a) && knowns.variables.has(this.b)) {
      this.a.value = this.b.value;
      knowns.variables.add(this.a);
      return true;
    } else if (knowns.variables.has(this.a) && !knowns.variables.has(this.b)) {
      this.b.value = this.a.value;
      knowns.variables.add(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(_positions: Position[], values: number[]) {
    const [aValue, bValue] = values;
    return aValue - bValue;
  }
}

export class FixedPositionConstraint extends Constraint {
  constructor(
    private readonly handle: Handle,
    private readonly position: Position
  ) {
    super([handle], []);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.xs.has(this.handle) || !knowns.ys.has(this.handle)) {
      this.handle.position = this.position;
      knowns.xs.add(this.handle);
      knowns.ys.add(this.handle);
      return true;
    } else {
      return false;
    }
  }

  getError(positions: Position[], _values: number[]) {
    const [handlePos] = positions;
    return Vec.dist(handlePos, this.position);
  }
}

export class HorizontalConstraint extends Constraint {
  constructor(
    private readonly a: Handle,
    private readonly b: Handle
  ) {
    super([a, b], []);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.ys.has(this.a) && knowns.ys.has(this.b)) {
      this.a.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.ys.add(this.a);
      return true;
    } else if (knowns.ys.has(this.a) && !knowns.ys.has(this.b)) {
      this.b.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.ys.add(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(positions: Position[], _values: number[]) {
    const [aPos, bPos] = positions;
    return aPos.y - bPos.y;
  }
}

export class VerticalConstraint extends Constraint {
  constructor(
    private readonly a: Handle,
    private readonly b: Handle
  ) {
    super([a, b], []);
  }

  propagateKnowns(knowns: Knowns): boolean {
    if (!knowns.xs.has(this.a) && knowns.xs.has(this.b)) {
      this.a.position = { x: this.b.position.x, y: this.a.position.y };
      knowns.xs.add(this.a);
      return true;
    } else if (knowns.xs.has(this.a) && !knowns.xs.has(this.b)) {
      this.b.position = { x: this.a.position.x, y: this.b.position.y };
      knowns.xs.add(this.b);
      return true;
    } else {
      return false;
    }
  }

  getError(positions: Position[], _values: number[]) {
    const [aPos, bPos] = positions;
    return aPos.x - bPos.x;
  }
}

export class LengthConstraint extends Constraint {
  constructor(
    public readonly a: Handle,
    public readonly b: Handle,
    public readonly length = new Variable(Vec.dist(a.position, b.position))
  ) {
    super([a, b], [length]);
  }

  getError(positions: Position[], values: number[]): number {
    const [aPos, bPos] = positions;
    const [length] = values;
    return Vec.dist(aPos, bPos) - length;
  }
}

export class AngleConstraint extends Constraint {
  constructor(
    public readonly a1: Handle,
    public readonly a2: Handle,
    public readonly b1: Handle,
    public readonly b2: Handle,
    public readonly angle = new Variable(
      AngleConstraint.computeAngle(
        a1.position,
        a2.position,
        b1.position,
        b2.position
      ) ?? 0
    )
  ) {
    super([a1, a2, b1, b2], [angle]);
  }

  getError(positions: Position[], values: number[]): number {
    const [a1Pos, a2Pos, b1Pos, b2Pos] = positions;
    const [angle] = values;
    const currentAngle = AngleConstraint.computeAngle(
      a1Pos,
      a2Pos,
      b1Pos,
      b2Pos
    );
    return currentAngle === null ? angle : currentAngle - angle;
  }

  static computeAngle(
    a1Pos: Position,
    a2Pos: Position,
    b1Pos: Position,
    b2Pos: Position
  ): number | null {
    const va = Vec.sub(a2Pos, a1Pos);
    const vb = Vec.sub(b2Pos, b1Pos);
    return Vec.len(va) < 5 || Vec.len(vb) < 5
      ? null
      : Vec.angleBetweenClockwise(va, vb);
  }
}

export function runConstraintSolver(selection: Selection) {
  addSampleConstraints();
  if (Constraint.all.size === 0) {
    return;
  }

  // Temporarily treat whatever handles the user has selected as unmovable.
  // (This is the "finger of God" semantics that we've talked about.)
  const tempConstraintsForSelection = Array.from(selection.handles).map(
    handle => new FixedPositionConstraint(handle, handle.position)
  );

  const things = [...Variable.all, ...Handle.all];
  const knowns = computeKnowns();

  // The state that goes into `inputs` is the stuff that can be modified by the solver.
  // It excludes any value that we've already computed from known values like fixed position
  // and fixed value constraints.
  const inputs: number[] = [];
  const varIdx = new Map<Variable, number>();
  const xIdx = new Map<Handle, number>();
  const yIdx = new Map<Handle, number>();
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.variables.has(thing)) {
      varIdx.set(thing, inputs.length);
      inputs.push(thing.value);
    } else if (thing instanceof Handle) {
      if (!knowns.xs.has(thing)) {
        xIdx.set(thing, inputs.length);
        inputs.push(thing.position.x);
      }
      if (!knowns.ys.has(thing)) {
        yIdx.set(thing, inputs.length);
        inputs.push(thing.position.y);
      }
    }
  }

  const result = numeric.uncmin((currState: number[]) => {
    let error = 0;
    for (const c of Constraint.all) {
      const positions = c.handles.map(handle => {
        const xi = xIdx.get(handle);
        const yi = yIdx.get(handle);
        if (xi === undefined && yi === undefined) {
          return handle.position;
        } else {
          return {
            x: xi === undefined ? handle.position.x : currState[xi],
            y: yi === undefined ? handle.position.y : currState[yi],
          };
        }
      });
      const values = c.variables.map(variable => {
        const vi = varIdx.get(variable);
        return vi === undefined ? variable.value : currState[vi];
      });
      error += Math.pow(c.getError(positions, values), 2);
    }
    return error;
  }, inputs);

  // Now we write the solution from the solver back into our handles and variables.
  const outputs = result.solution;
  for (const thing of things) {
    if (thing instanceof Variable && !knowns.variables.has(thing)) {
      thing.value = outputs.shift()!;
    } else if (thing instanceof Handle) {
      const knowX = knowns.xs.has(thing);
      const knowY = knowns.ys.has(thing);
      if (knowX && knowY) {
        // no update required
        continue;
      }

      const x = knowX ? thing.position.x : outputs.shift()!;
      const y = knowY ? thing.position.y : outputs.shift()!;
      thing.position = { x, y };
    }
  }

  for (const tempConstraint of tempConstraintsForSelection) {
    tempConstraint.remove();
  }
}

function computeKnowns(): Knowns {
  const knowns: Knowns = { xs: new Set(), ys: new Set(), variables: new Set() };
  while (true) {
    let didSomething = false;
    for (const constraint of Constraint.all) {
      if (constraint.propagateKnowns(knowns)) {
        didSomething = true;
      }
    }
    if (!didSomething) {
      break;
    }
  }
  return knowns;
}

/** Adds a couple of constraints, if we don't have some already. */
function addSampleConstraints() {
  const unconstrainedHandles = Array.from(Handle.all).filter(
    handle =>
      !Array.from(Constraint.all).some(constraint =>
        constraint.involves(handle)
      )
  );
  while (Constraint.all.size === 0 && unconstrainedHandles.length >= 4) {
    const a1 = unconstrainedHandles.shift()!;
    const a2 = unconstrainedHandles.shift()!;
    const aLength = new LengthConstraint(a1, a2).length;
    // new FixedValueConstraint(aLength, aLength.value);

    const b1 = unconstrainedHandles.shift()!;
    const b2 = unconstrainedHandles.shift()!;
    const bLength = new LengthConstraint(b1, b2).length;

    new VariableEqualsConstraint(aLength, bLength);

    const angle = new AngleConstraint(a1, a2, b1, b2).angle;
    new FixedValueConstraint(angle, angle.value);
  }
}
