import { EventContext, Gesture } from './gestures/Gesture';
import { handleDrag } from './gestures/HandleDrag';
import { pencilInk } from './gestures/PencilInk';
import { Event, TouchId } from './NativeEvents';
import { touchMetaToggle } from './gestures/MetaToggle';
import SVG from './Svg';
import { pencilMeta } from './gestures/PencilMeta';
import { scrubToken } from './gestures/ScrubToken';
import {
  closeFormulaEditor,
  pencilFormulaEditor,
} from './gestures/FormulaGestures';
import { pencilTapPropertyPicker } from './gestures/PropertyPicker';
import { touchToken } from './gestures/DragToken';

const gestureCreators = {
  finger: [
    closeFormulaEditor,
    scrubToken,
    touchToken,
    handleDrag,
    touchMetaToggle,
  ],
  pencil: [pencilTapPropertyPicker, pencilFormulaEditor, pencilMeta, pencilInk],
};

const pseudoTouches: Record<TouchId, Event> = {};
const gesturesByTouchId: Record<TouchId, Gesture> = {};

// This function is called by NativeEvent (via App) once for every event sent from Swift.
export function applyEvent(ctx: EventContext) {
  // Terminology:
  // Event — a single finger or pencil event sent to us from Swift, either "began", "moved", or "ended".
  // Touch — a series of finger or pencil events (from "began" to "ended) with a consistent TouchId.
  // Gesture — a class instance that "claims" one or more touches and then receives all their events.
  // Gesture Creator — a function that looks at a "began" event to decide whether to create a new Gesture for it.
  // Pseudo — a finger touch that's not claimed by any gesture
  // Pseudo Gesture — a gesture that's only created when some pseudo touches exist.

  // Key Assumption #1: The pencil will always match a gesture.
  // Key Assumption #2: A finger will always match a gesture or become a pseudo.

  // STEP ZERO — Update existing pseudo touches, or prepare pseudo-related state.
  if (pseudoTouches[ctx.event.id]) {
    if (ctx.event.state === 'ended') {
      delete pseudoTouches[ctx.event.id];
    } else {
      pseudoTouches[ctx.event.id] = ctx.event;
    }
    return;
  }
  ctx.pseudoTouches = pseudoTouches;
  ctx.pseudoCount = Object.keys(pseudoTouches).length;
  ctx.pseudo = ctx.pseudoCount > 0;

  // STEP ONE — Try to match this event to a gesture that previously claimed this touch.
  let gestureForTouch = gesturesByTouchId[ctx.event.id];
  if (gestureForTouch) {
    runGesture(gestureForTouch, ctx);
    if (ctx.event.state === 'ended') {
      delete gesturesByTouchId[ctx.event.id];
    }
    return;
  }

  // Key Assumption #3: every touch is claimed by a gesture or pseudo right from the "began".
  // So if we didn't match an existing gesture/pseudo above, and the event isn't a "began", that means we have a bug!
  if (ctx.event.state !== 'began') {
    throw new Error('A non-began event failed to match any gesture/pseudo.');
  }

  // STEP TWO — see if any existing gestures want to claim this new touch.
  // (There's no sense of priority here; gestures are checked in creation order. Might need to revise this.)
  for (const id in gesturesByTouchId) {
    let gesture = gesturesByTouchId[id];
    if (gesture.claimsTouch(ctx)) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }

  // STEP THREE — try to create a new gesture for this touch.
  for (const gestureCreator of gestureCreators[ctx.event.type]) {
    let gesture = gestureCreator(ctx);
    if (gesture) {
      gesturesByTouchId[ctx.event.id] = gesture;
      runGesture(gesture, ctx);
      return;
    }
  }

  // STEP FOUR — track this touch as a candidate for a pseudo-mode.
  if (ctx.event.type === 'finger') {
    pseudoTouches[ctx.event.id] = ctx.event;
    return;
  }

  // Finally…
  throw new Error('Touches are not allowed to fall through the cracks.');
}

function runGesture(gesture: Gesture, ctx: EventContext) {
  let result = gesture.applyEvent(ctx);

  if (result instanceof Gesture) {
    // Replace the old gesture with the new gesture
    for (const id in gesturesByTouchId) {
      if (gesturesByTouchId[id] === gesture) {
        gesturesByTouchId[id] = result;
      }
    }
    // Run the new gesture immediately
    runGesture(result, ctx);
  }
}

export function render() {
  for (const id in gesturesByTouchId) {
    gesturesByTouchId[id].render();
  }

  for (const id in pseudoTouches) {
    const event = pseudoTouches[id];
    SVG.now('circle', {
      cx: event.position.x,
      cy: event.position.y,
      r: 40,
      fill: 'none',
      stroke: '#00000005',
      'stroke-width': 5,
    });
  }
}
