//
//  MorphableLine.swift
//  Inkling
//
//  Created by Marcel on 23/08/2022.
//

import UIKit

class CanvasCurve: CanvasElement {
  var stroke: Stroke
  var nodes: [Node]
  var curvePoints: [CGVector]
  var curveLengths: [CGFloat]
  var sampledPointsOnCurve: [CGVector]
  
  init(_ stroke: Stroke, _ nodes: [CGVector]){
    self.stroke = stroke
    self.nodes = []
    self.curvePoints = ChaikinCurve(points: nodes)
    self.curveLengths = lineLengths(curvePoints)
    self.sampledPointsOnCurve = []
    self.nodes = nodes.map({ pos in
      Node(pos, self)
    })
    
    for length in self.stroke.lengths {
      let length = length / self.stroke.lengths[self.stroke.lengths.count-1]
      self.sampledPointsOnCurve.append(
        getPointAtLength(lengths: self.curveLengths, points: self.curvePoints, length: length * curveLengths[curveLengths.count-1])
      )
    }
    
  }
  
  func morph(){
    
    // Generate transform for all line segments
//    let oldCurvePoints = curvePoints
//    let oldCurveLengths = curveLengths
    let newCurvePoints = ChaikinCurve(points: nodes.map({ n in n.position }))
    let newCurveLengths = lineLengths(newCurvePoints)
    
    //print(oldSimplifiedCurvePoints.count, newSimplifiedCurvePoints.count)
    let actualCurveLength = stroke.lengths[stroke.lengths.count - 1]
    
    var newPointsOnCurve: [CGVector] = []
    //var lengthAccumulator: CGFloat = 0.0
    var lastPoint = stroke.points[0]
    for i in 0...stroke.points.count-1 {
      let dist = distance(lastPoint, stroke.points[i])
      let length = stroke.lengths[i] / actualCurveLength
      lastPoint = stroke.points[i]
      
      let oldPointOnCurve = sampledPointsOnCurve[i]
      let newPointOnCurve = getPointAtLength(lengths: newCurveLengths, points: newCurvePoints, length: length * newCurveLengths[newCurveLengths.count-1])
      newPointsOnCurve.append(newPointOnCurve)
      let delta = newPointOnCurve - oldPointOnCurve
      
      stroke.points[i] += delta
      
    }
    
    curvePoints = newCurvePoints
    curveLengths = newCurveLengths
    sampledPointsOnCurve = newPointsOnCurve
    stroke.updateVerts()
  }
  
  func getOffsetPositionForNode(_ node: Node) -> CGVector {
    var other = nodes[1]
    
    if node === nodes[nodes.count-1] {
      other = nodes[nodes.count-2]
    }
    
    let quaterDistance = distance(other.position, node.position) / 4.0
    
    return node.position + (other.position - node.position).normalized() * CGFloat.minimum(quaterDistance, 30.0)
  }
  
  func setDepth(depth: Float) {
    stroke.setDepth(depth: depth)
  }
  
  
  func render(_ renderer: Renderer) {
    stroke.render(renderer)
    //renderer.addShapeData(polyLineShape(points: ChaikinCurve(points: nodes.map({ n in n.position })), weight: 1.0, color: Color(255,0,0, 50)))
    
//    for pt in sampleCurve(stroke.points) {
//      renderer.addShapeData(circleShape(pos: pt, radius: 2.0, resolution: 4, color: Color(255, 0, 0)))
//    }
  }
}
