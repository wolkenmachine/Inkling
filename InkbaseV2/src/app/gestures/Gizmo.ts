import { EventContext, Gesture } from './Gesture';
import { aGizmo } from '../meta/Gizmo';

export function touchGizmo(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    // TODO: We only want to perform this gesture on a tap near the center of the gizmo.
    // But for other gestures, we want to perform them when any part of the gizmo is touched.
    // The current GameObject.find() method doesn't seemingly allow for this sort of distinction,
    // where different find() calls need a different distanceToPoint() implementation.
    const gizmo = ctx.root.find({
      what: aGizmo,
      near: ctx.event.position,
      tooFar: 50,
    });

    if (gizmo) {
      return new Gesture('Touch Gizmo', {
        ended(ctx) {
          gizmo.cycleConstraints();
        },
      });
    }
  }
}
