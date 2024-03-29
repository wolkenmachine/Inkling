import Events, { Event, InputState } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
import Selection from './Selection';
import FreehandSelection from './FreehandSelection';
import ToolPicker from './ToolPicker';
import FreehandTool from './tools/FreehandTool';
import FormalTool from './tools/FormalTool';
import ColorTool from './tools/ColorTool';
import Tool from './tools/Tool';
import ConstraintTool from './tools/ConstraintTool';
import SVG from './Svg';
import Handle from './strokes/Handle';
import Stroke from './strokes/Stroke';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import Gizmo from './Gizmo';
import { applyEvent } from './Input';
import NumberToken from './meta/NumberToken';
import MetaLayer from './meta/MetaLayer';
import Token from './meta/Token';

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  applyEvent(event, state, events, page, selection, metaLayer);
});

const page = new Page({ strokeAnalyzer: false });
const snaps = new Snaps(page, { handleSnaps: true, alignmentSnaps: false });

const selection = new Selection(page, snaps);
const freehandSelection = new FreehandSelection(page);

const gizmo = new Gizmo(page, selection, false);

const metaLayer = new MetaLayer();



onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  constraints.now.clear();

  // Tell NativeEvent to handle all events sent from Swift, evaluating Input for each
  events.update();

  for (const handle of selection.handles) {
    constraints.now.pin(handle);
  }
  constraints.solve();
  

  //page.render();
  // for (const handle of Handle.all) {
  //   handle.render();
  // }

  //gizmo.render(dt, t);

  // Ivan is currently using this to debug Input — he'll remove it soon
  // SVG.now('foreignObject', {
  //   x: 50,
  //   y: 50,
  //   width: 1000,
  //   height: 1000,
  //   content: JSON.stringify({
  //     pencil: events.pencilState,
  //     fingers: events.fingerStates,
  //   }),
  // });
});
