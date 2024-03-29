import { PositionWithPressure } from "../../lib/types";
import Events, { PencilEvent } from "../NativeEvents";
import Page from "../Page";
import SVG, { generatePathFromPoints, updateSvgElement } from "../Svg";
import { strokeSvgProperties } from "../strokes/FreehandStroke";
import { Tool } from "./Tool";

type Mode = "unistroke" | "multistroke";

export default class Free extends Tool {
  mode: Mode = "unistroke";
  points?: Array<PositionWithPressure>;
  strokeElement: SVGElement;
  multistrokeModeDotElement?: SVGElement;
  pencilIsDown = false;
  dirty = false;

  constructor(svg: SVG, buttonX: number, buttonY: number, private page: Page) {
    super(svg, buttonX, buttonY);
    this.strokeElement = svg.addElement("path", { d: "", ...strokeSvgProperties });
  }

  update(events: Events) {
    const pencilDown = events.did("pencil", "began") as PencilEvent | undefined;
    if (pencilDown != null) {
      this.pencilIsDown = true;
      if (this.points == null) {
        this.startStroke({ ...pencilDown.position, pressure: pencilDown.pressure });
      } else {
        this.extendStroke({ ...pencilDown.position, pressure: -1 });
        this.extendStroke({ ...pencilDown.position, pressure: pencilDown.pressure });
      }
    }

    if (this.points == null) {
      return;
    }

    const pencilMoves = events.didAll("pencil", "moved") as PencilEvent[];
    pencilMoves.forEach((pencilMove) => {
      this.extendStroke({ ...pencilMove.position, pressure: pencilMove.pressure });
    });

    const pencilUp = events.did("pencil", "ended");
    if (pencilUp != null) {
      this.pencilIsDown = false;
    }

    if (!this.pencilIsDown && this.mode === "unistroke") {
      this.endStroke();
    }
  }

  startStroke(point: PositionWithPressure) {
    this.points = [point];
    this.dirty = true;
  }

  extendStroke(point: PositionWithPressure) {
    this.points!.push(point);
    this.dirty = true;
  }

  endStroke() {
    this.page.addFreehandStroke(this.points!);
    this.points = undefined;
    this.dirty = true;
  }

  onAction() {
    if (this.mode === "unistroke") {
      this.mode = "multistroke";
      this.multistrokeModeDotElement = this.svg.addElement("circle", {
        cx: this.buttonX,
        cy: this.buttonY,
        r: 10,
        fill: "white",
      });
    } else {
      this.mode = "unistroke";
      this.multistrokeModeDotElement!.remove();
      this.multistrokeModeDotElement = undefined;
    }
  }

  onDeselected() {
    if (this.points != null) {
      this.endStroke();
      this.updatePath();
    }

    super.onDeselected();
    this.mode = "unistroke";
  }

  render() {
    if (!this.dirty) {
      return;
    }

    this.updatePath();
    this.dirty = false;
  }

  updatePath() {
    const path = this.points == null ? "" : generatePathFromPoints(this.points);
    updateSvgElement(this.strokeElement, { d: path });
  }
}
