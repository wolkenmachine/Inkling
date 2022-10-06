//
//  MorphableBezier.swift
//  Inkling
//
//  Created by Marcel on 24/08/2022.
//


import Foundation
import UIKit

class CanvasBezier: CanvasElement {
  var stroke: Stroke
  var nodes: [Node]
  var handles: [BezierNode]
  
  var controlPoints: [CGVector]
  
  init(_ stroke: Stroke, _ controlPoints: [CGVector]) {
    self.stroke = stroke
    self.controlPoints = controlPoints
    
    self.nodes = []
    self.handles = []
    
    self.nodes.append(Node(controlPoints[0], self))
    self.nodes.append(Node(controlPoints[3], self))
    
    self.handles.append(BezierNode(controlPoints[1], self.nodes[0], self))
    self.handles.append(BezierNode(controlPoints[2], self.nodes[1], self))
  }
  
  func morph(){
    controlPoints[0] = nodes[0].position
    controlPoints[3] = nodes[1].position
    
    controlPoints[1] = nodes[0].position + handles[0].position
    controlPoints[2] = nodes[1].position + handles[1].position
    
    var points: [CGVector] = []
    let size = stroke.points.count
    
    for i in 0..<size {
      let t = CGFloat(i) / CGFloat(size)
      let pt = bezierQ(controlPoints, t)
      points.append(pt)
    }
    
    stroke.points = points
    stroke.updateVerts()
  }
  
  func getOffsetPositionForNode(_ node: Node) -> CGVector {
    var other = nodes[0]
    
    if other === node {
      other = nodes[3]
    }
    
    return node.position + (other.position - node.position).normalized() * 20.0
  }
  
  func setDepth(depth: Float) {
    stroke.setDepth(depth: depth)
  }
  
  func render(_ renderer: Renderer) {
    stroke.render(renderer)
  }
}
