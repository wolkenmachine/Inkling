import Events, { Event, InputState } from './NativeEvents';
import Page from './Page';
import Snaps from './Snaps';
// import Selection from './Selection';
// import FreehandSelection from './FreehandSelection';
// import ToolPicker from './ToolPicker';
// import FreehandTool from './tools/FreehandTool';
// import FormalTool from './tools/FormalTool';
// import ColorTool from './tools/ColorTool';
// import Tool from './tools/Tool';
// import ConstraintTool from './tools/ConstraintTool';
import SVG from './Svg';
import * as constraints from './constraints';
import { onEveryFrame } from '../lib/helpers';
import Gizmo from './Gizmo';
import { applyEvent } from './Input';
import { root } from './GameObject';
import FormulaEditor from './meta/FormulaEditor';
import Pencil from './tools/Pencil';
import FormulaParser from './meta/FormulaParser';
import MetaToggle from './gui/MetaToggle';
// import NumberToken from './meta/NumberToken';
// import Wire from './meta/Wire';
// import PropertyPicker from './meta/PropertyPicker';
// import '../lib/spreadsheet';

// This is a pretzel, because the interface between NativeEvents and Input is a work in progress.
const events = new Events((event: Event, state: InputState) => {
  applyEvent(event, state, events, root, pencil, formulaEditor, metaToggle);
});

const page = new Page({ strokeAnalyzer: false });
root.adopt(page);
root.currentPage = page;

const snaps = new Snaps({ handleSnaps: true, alignmentSnaps: false });
root.adopt(snaps);

// const selection = new Selection(page, snaps);
// const freehandSelection = new FreehandSelection(page);

const gizmo = new Gizmo(page, false);

const pencil = new Pencil();
root.adopt(pencil);

// FORMULA STUFF
const formulaEditor = new FormulaEditor();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).formulaEditor = formulaEditor;
root.adopt(formulaEditor);
formulaEditor.formulaParser = new FormulaParser(page);

const metaToggle = new MetaToggle();
root.adopt(metaToggle);

// gizmoo wiring testing for testing
const _g = gizmo.createTest();

// const n1 = new NumberToken(20);
// n1.position = { x: 400, y: 100 };
// page.adopt(n1);

// const n2 = new NumberToken(20);
// n2.position = { x: 400, y: 200 };
// page.adopt(n2);

// const p1 = new PropertyPicker();
// p1.position = { x: 300, y: 100 };
// page.adopt(p1);

// const p2 = new PropertyPicker();
// p2.position = { x: 300, y: 200 };
// page.adopt(p2);

// const w1 = new Wire();
// const w2 = new Wire();
// const w3 = new Wire();
// const w4 = new Wire();

// w1.attachFront(g.wirePort);
// w1.attachEnd(p1.inputPort);

// w2.attachFront(p1.outputPort);
// w2.attachEnd(n1.wirePort);

// w3.attachFront(g.wirePort);
// w3.attachEnd(p2.inputPort);

// w4.attachFront(p2.outputPort);
// w4.attachEnd(n2.wirePort);

// page.adopt(w1);
// page.adopt(w2);

// page.adopt(w3);
// page.adopt(w4);

// p1.setProperty("distance");
// p2.setProperty("angle");

onEveryFrame((dt, t) => {
  SVG.clearNow(t);
  constraints.now.clear();

  // Potentially deprecated — consider whether & how these should be migrated to Input.ts
  // toolPicker.update(events);
  // toolPicker.selected?.update(events);
  // selection.update1(events);
  gizmo.update(events);
  // selection.update2(events);
  // freehandSelection.update(events);

  // Tell NativeEvent to handle all events sent from Swift, evaluating Input for each
  events.update();

  constraints.solve();

  // render everything
  root.render(dt, t);

  // Ivan is currently using this to debug Input — he'll remove it soon
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
