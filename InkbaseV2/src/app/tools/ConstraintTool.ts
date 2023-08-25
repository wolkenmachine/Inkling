import { Position } from '../../lib/types';
import Vec from '../../lib/vec';
import Events, { Event } from '../NativeEvents';
import Page from '../Page';
import * as constraints from '../constraints';
import FreehandStroke from '../strokes/FreehandStroke';
import StrokeGroup from '../strokes/StrokeGroup';
import Tool from './Tool';

export default class ConstraintTool extends Tool {
  private fingerDown?: Event;
  private fingerMoved?: Event;
  private refStrokeGroup: StrokeGroup | null = null;

  constructor(label: string, buttonX: number, buttonY: number, page: Page) {
    super(label, buttonX, buttonY, page, FreehandStroke);
  }

  update(events: Events) {
    super.update(events);

    const fingerDown = events.find('finger', 'began');
    if (fingerDown && !this.fingerDown) {
      this.fingerDown = fingerDown;
      setTimeout(() => {
        if (this.fingerDown?.id === fingerDown.id && !this.fingerMoved) {
          this.onLongPress(this.fingerDown.position);
        }
      }, 750);
    }

    if (!this.fingerDown) {
      return;
    }

    const fingerMoved = events.find('finger', 'moved');
    if (fingerMoved) {
      if (fingerMoved.id === this.fingerDown.id) {
        // The finger that moved is the finger that went down first.
        this.fingerMoved = fingerMoved;
      }

      // This will result in lots of false positives, i.e., it will call
      // onHandleMoved() when no handles were moved. It also won't tell me
      // which handle(s) moved. It's just an expedient way to get something
      // going.
      this.onHandleMoved();

      // TODO: it would be nice if a Tool could just override methods like
      // onHandleMoved() to react to higher-level events.
    }

    const fingerEnded = events.find('finger', 'ended', this.fingerDown.id);
    if (fingerEnded) {
      this.fingerDown = undefined;
      this.fingerMoved = undefined;
    }
  }

  private onLongPress(pos: Position) {
    this.refStrokeGroup = this.page.findStrokeGroupNear(pos);
    console.log('ref stroke group is now', this.refStrokeGroup);
  }

  private onHandleMoved() {
    for (const strokeGroup of this.page.strokeGroups) {
      this.addConstraintsRelativeToReferenceStrokeGroup(strokeGroup);
    }
  }

  private addConstraintsRelativeToReferenceStrokeGroup(
    strokeGroup: StrokeGroup
  ) {
    // add constraints based on this stroke group alone

    const a = strokeGroup.a;
    const b = strokeGroup.b;

    if (a.position.x - b.position.x === 0) {
      constraints.vertical(a, b);
    }

    if (a.position.y - b.position.y === 0) {
      constraints.horizontal(a, b);
    }

    if (strokeGroup === this.refStrokeGroup || !this.refStrokeGroup) {
      return;
    }

    // add constraints relative to the reference stroke group

    const ra = this.refStrokeGroup.a;
    const rb = this.refStrokeGroup.b;

    const refLen = Vec.dist(ra.position, rb.position);
    const len = Vec.dist(a.position, b.position);
    const lenDiff = Math.abs(refLen - len);
    if (lenDiff < 10) {
      const refLenVar = constraints.length(ra, rb).length;
      const newLenVar = constraints.length(a, b).length;
      constraints.variableEquals(refLenVar, newLenVar);
    }
  }
}
