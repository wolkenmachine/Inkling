import ClipperShape from "@doodle3d/clipper-js"

import { Position } from "./types";

export default function Polygon(){}

Polygon.area = (vertices: Array<Position>) => {
    let shape = new ClipperShape([vertices], true, true, true, true)
    return Math.abs(shape.totalArea())
    // if (vertices.length < 3) {
    //     return 0; // A polygon with less than 3 vertices doesn't have an area
    // }

    // let area = 0;
    // const numVertices = vertices.length;

    // for (let i = 0; i < numVertices; i++) {
    //     const currentVertex = vertices[i];
    //     const nextVertex = vertices[(i + 1) % numVertices]; // Wrap around to the first vertex for the last iteration

    //     area += (currentVertex.x * nextVertex.y) - (nextVertex.x * currentVertex.y);
    // }

    // return Math.abs(area / 2);
}

Polygon.inset = (vertices, amount) => {
    vertices = vertices.map(pt=>({X: Math.round(pt.x), Y: Math.round(pt.y)}));
    
    
    let shape = new ClipperShape([vertices], true, false, false, true)
    shape = shape.offset( -5, {
      jointType: 'jtSquare',
      endType: 'etClosedPolygon',
    //   miterLimit: 2.0,
    //   roundPrecision: 0.25
    })


    let paths = shape.paths.map(path=>{
        return path.map(pt=>({x: pt.X, y: pt.Y}))
    })

    return paths[0] || []
}
  