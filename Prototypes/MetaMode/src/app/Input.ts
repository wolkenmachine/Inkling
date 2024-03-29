import Vec from '../lib/vec';
import Gizmo from './Gizmo';
import Events, { TouchId, Event, InputState } from './NativeEvents';
import Page from './Page';
import Selection from './Selection';
import SVG from './Svg';
import MetaLayer from './meta/MetaLayer';

// Variables that store state needed by our gestures go here.

// THINKING OUT LOUD
// One possible way we could use this objects collection is to add some sort of "pre" and "post" code
// to applyEvent(). In the "pre" section (which could just be at the top of applyEvent),
// we'd capture any object(s?) that (eg) were under each finger/pencil "began" event.
// In the "post" section (which would have to be outside applyEvent(), since we eagerly return)
// we'd clean up any objects that are associated with each ended finger/pencil.
let objects: Record<TouchId, any> = {}; // The objects we're currently manipulating with each finger/pencil.

// End gesture state variables.

// This is called by NativeEvent (via App) once for every event given to us by Swift.
export function applyEvent(
  event: Event, // The current event we're processing.
  state: InputState, // The current state of the pencil or finger that generated this event.
  events: Events, // The full NativeEvents instance, so we can look at other the pencil/fingers.
  page: Page,
  selection: Selection,
  //gizmo: Gizmo,
  metaLayer: MetaLayer
) {
  // This is a good place to set up any state needed by the below gesture recognizers.
  // Please don't fret about the performance burden of gathering this state on every event —
  // it rounds to zero! We can optimize the heck out of this later, once we know what we even want.

  //const handleNearEvent = page.findHandleNear(event.position);
  //const gizmoNearEvent = gizmo.findNear(event.position);

  const tokenNearEvent = metaLayer.findAtPosition(event.position);

  //console.log(state);
  

  // Below here, you'll find a list of each gesture recognizer in the system, one by one.
  // Each recognized gesture should end with a return, to keep the cyclomatic complexity super low.
  // In other words, we should try really hard to only have blocks (like `if`) go one level deep.
  // If we find that we can't express what we want with this pattern, we likely need a state machine.

  // TODO: We could potentially split these up to handle pencil separately from finger, and handle
  // each state separately, since (in theory) these separations cleanly split the gesture space
  // into non-overlapping sets.

  // TOKEN DRAGGING
  // HOLD A TOKEN & DRAG IT
  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    events.fingerStates.length === 1 &&
    tokenNearEvent
  ) {
    objects['dragging'] = { dragging: tokenNearEvent, originalPosition: Vec.clone(tokenNearEvent.position), finger: event.id };

    return;
  }

  let draggingState = objects['dragging']
  // DISLODGE A TOKEN FROM IT's parent
  if (
    event.type === 'finger' &&
    event.state === 'began' &&
    events.fingerStates.length === 2 &&
    draggingState != null &&
    draggingState.finger != event.id &&
    tokenNearEvent
  ) {
    console.log("second finger");
    console.log(draggingState);
    if(draggingState.dragging.type == "collection") {
      let found = draggingState.dragging.findAtPosition(event.position);

      if(found) {
        objects['dragging'] = { dragging: found, originalPosition: Vec.clone(found.position), finger: event.id };
        metaLayer.dislodge(found);  
        return;
      }
    }
  }

  // DRAG A TOKEN
  if (
    event.type === 'finger' &&
    event.state === 'moved' &&
    state.drag &&
    draggingState
  ) {
    let newPosition = Vec.add(draggingState.originalPosition, state.dragDelta!);

    const snapOpportunity = metaLayer.findSnapOpportunity(draggingState.dragging, event.position);
    objects["snap"] = snapOpportunity;
    if(snapOpportunity) {
      draggingState.dragging.position = snapOpportunity.position;
    } else {
      draggingState.dragging.position = newPosition;
    }
    
    draggingState.dragging.updateView();

    return;
  }

  // DROP A TOKEN
  if (
    event.type === 'finger' &&
    event.state === 'ended' &&
    draggingState
  ) {

    if(objects["snap"]) {
      metaLayer.doSnap(objects["snap"]);
    }
    objects['dragging'] = null;
    objects["snap"] = null;
    return;
  }


  // Formula Editor Writing
  if (
    event.type === 'pencil' &&
    event.state === 'began'
  ) {
    
    const isInFormulaEditor = metaLayer.editor.isPointInside(event.position);
    if(isInFormulaEditor) {
      if(metaLayer.editor.isToggleMode(event.position)) {
        metaLayer.editor.toggleMode();
        return;
      } else {
        objects['writing'] = true;
        metaLayer.editor.addStroke(event.position);  
      }
      
      return;
    } else if(metaLayer.editor.active) {
      metaLayer.editor.close();
    }
  }

  if (
    event.type === 'pencil' &&
    event.state === 'moved' &&
    objects['writing']
  ) {
    metaLayer.editor.addStrokePoint (event.position);
    return;
  }

  if (
    event.type === 'pencil' &&
    event.state === 'ended' &&
    objects['writing']
  ) {
    objects['writing'] = false;
    metaLayer.editor.endStroke(metaLayer);
    return;
  }

  // DRAW WIRES / META-INK
  // BEGIN WIRE
  if (
    event.type === 'pencil' &&
    event.state === 'began'
  ) {
    
    const snap = metaLayer.findTokenAtPosition(event.position);
    
    if(snap) {
      let wire = metaLayer.addWire(snap.midPoint());
      wire.input = snap;
      objects['wire'] = wire;
    } else {
      objects['wire'] = metaLayer.addWire(event.position);
    }
    return;
  }

  // DRAW WIRE
  if (
    event.type === 'pencil' &&
    event.state === 'moved' &&
    objects['wire']
  ) {
    const snap = metaLayer.findTokenAtPosition(event.position);
    if(snap) {
      objects['wire'].drawPoint(snap.midPoint());
      objects['wire'].output = snap;
    } else {
      objects['wire'].drawPoint(event.position);
      objects['wire'].output = null;
    }
    return;
  }

  // END WIRE
  if (
    event.type === 'pencil' &&
    event.state === 'ended' &&
    objects['wire']
  ) {
    metaLayer.updateWireConnections(objects['wire']);
    objects['wire'] = null;
  }

  // Long hold
  if (
    event.type === 'pencil' &&
    event.state === 'longhold' &&
    objects['wire']
  ) {
    metaLayer.removeWire(objects['wire']);
    objects['wire'] = null;
    metaLayer.activateEditor(event.position);
  }
  

  // TAP A GIZMO -> TOGGLE THE GIZMO
  // if (event.type === 'finger' && event.state === 'began' && gizmoNearEvent) {
  //   return gizmoNearEvent.tap(event.position);
  // }

  // CLEAR SELECTION WHEN A FINGER IS TAPPED
  // if (
  //   event.type === 'finger' &&
  //   event.state === 'ended' &&
  //   !state.drag &&
  //   !handleNearEvent
  //   // TODO: We may want to track the max number of fingers seen since the gesture began,
  //   // so we can only invoke this gesture when that === 1
  //   // TODO: Rather than determining whether a drag has happened in NativeEvent, we might
  //   // want to determine it here, so that each different gesture can decide how much of a drag
  //   // is enough (or too much) to warrant responding to. So in NativeEvent, it'd just accumulate
  //   // the total distance travelled by the pencil/finger.
  // ) {
  //   return selection.clearSelection();
  // }

  // // MOVE SELECTED HANDLES
  // if (event.type === 'finger' && event.state === 'moved') {
  //   // TODO: Implement this
  //   return;
  // }
}
