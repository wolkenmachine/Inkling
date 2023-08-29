// Work in progress
// TODO:
// [] Find shortest (Maximally turning) loops
// [] Find smooth continuation loops
// [] Find connectors between shapes
// [] Find blobbly clusters like text etc.

// [] Update graph when strokes are moved

import { Position, PositionWithPressure } from '../../lib/types';
import Page from '../Page';
import FreehandStroke from '../strokes/FreehandStroke';
import Vec, { Vector } from '../../lib/vec';
import Svg from '../Svg';

import StrokeGraph from './StrokeGraph';
import Polygon from '../../lib/polygon';

// **
// Stroke Analyzer: Responsible for running different analysis algorithms
// **

export default class StrokeAnalyzer {
  page: Page;
  graph = new StrokeGraph();

  loops = new Array<any>();

  loopcount = 0;

  constructor(page: Page) {
    this.page = page;
  }

  addStroke(stroke: FreehandStroke) {
    console.log(stroke);

    this.generateConnectionsForStroke(stroke);
    //this.generateLoopsForStroke(stroke);
  }

  generateConnectionsForStroke(stroke: FreehandStroke) {
    // Generate connections for this stroke to nearby strokes on the page

    for (const otherStroke of this.page.freehandStrokes) {

      if(stroke === otherStroke) {
        continue;
      }

      const connectionZonesForStroke = findConnectionZonesBetweenStrokes(
        stroke.points,
        otherStroke.points
      );


      for (const connectionZone of connectionZonesForStroke) {
        // Compute position of connection zone
        const position = Vec.mulS(
          Vec.add(
            stroke.points[connectionZone.mid[0]],
            otherStroke.points[connectionZone.mid[1]]
          ),
          0.5
        );

        const node = this.graph.addNode(position);
        this.graph.addEdge(stroke, node, connectionZone.mid[0]);
        this.graph.addEdge(otherStroke, node, connectionZone.mid[1]);
      }
    }

    // TODO: Find self intersections & closings
    this.loops = this.graph.findLoops();
    console.log(this.loops);



  }

  generateArrowLikes() {}

  render() {
    this.graph.render();

    this.loops.forEach(loop => {
      const points = Svg.points(Polygon.inset(loop.getPolygonPoints(), 5));
      Svg.now('polyline', {
        points,
        //stroke: "rgba(255,0,0,0.5)",
        fill: 'rgba(255,0,0,0.2)',
        'stroke-width': '5',
      });
    });

  }
}

interface ConnectionZone {
  start: [number, number];
  mid: [number, number];
  end: [number, number];
  dist: number;
}

function findConnectionZonesBetweenStrokes(
  strokeA: PositionWithPressure[],
  strokeB: PositionWithPressure[]
): ConnectionZone[] {
  const connections: ConnectionZone[] = [];

  let currentConnection: ConnectionZone | null = null;
  for (let i = 0; i < strokeA.length; i++) {
    const closest = findClosestPointOnStroke(strokeB, strokeA[i]);

    if (closest.dist < 10) {
      if (!currentConnection) {
        currentConnection = {
          start: [i, closest.index],
          end: [i, closest.index],
          mid: [i, closest.index],
          dist: closest.dist,
        };
      } else {
        currentConnection.end = [i, closest.index];
        if (closest.dist < currentConnection.dist) {
          currentConnection.mid = [i, closest.index];
          currentConnection.dist = closest.dist;
        }
      }
    } else {
      if (currentConnection) {
        connections.push(currentConnection);
        currentConnection = null;
      }
    }
  }

  if (currentConnection) {
    connections.push(currentConnection);
  }

  return connections;
}

// TODO: we can speed this up significantly if it becomes a bottleneck.
function findClosestPointOnStroke(
  stroke: PositionWithPressure[],
  point: PositionWithPressure
) {
  let minDist = Vec.dist(stroke[0], point);
  let index = 0;

  for (let i = 0; i < stroke.length; i++) {
    const dist = Vec.dist(stroke[i], point);
    if (dist < minDist) {
      minDist = dist;
      index = i;
    }
  }

  return { dist: minDist, index };
}
