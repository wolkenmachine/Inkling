//
//  MorphableLine.swift
//  Inkling
//
//  Created by Marcel on 23/08/2022.
//

import UIKit

class CanvasLine: CanvasElement {
  var stroke: Stroke
  var nodes: [Node]
  
  init(_ stroke: Stroke){
    self.stroke = stroke
    self.nodes = []
    self.nodes.append(Node(self.stroke.points.first!, self))
    self.nodes.append(Node(self.stroke.points.last!, self))
  }
  
  func morph(){
    let new_a = self.nodes[0].position
    let new_b = self.nodes[1].position
    
    let a = stroke.points.first!
    let b = stroke.points.last!
    
    var old_transform = TransformMatrix()
    old_transform.from_line(a, b)
    old_transform = old_transform.get_inverse()
    
    let new_transform = TransformMatrix()
    new_transform.from_line(new_a, new_b)
    
    let old_vec_length = distance(a, b)
    let new_vec_length = distance(new_a, new_b)
    let scale = new_vec_length / old_vec_length
    
    //let scale_width = new_vec_length < old_vec_length
    
    for i in 0...stroke.points.count - 1 {
      let point = stroke.points[i]
      var projected = old_transform.transform_vector(point)
      projected.dx = projected.dx * scale
      let new_point = new_transform.transform_vector(projected)
      stroke.points[i] = new_point
    }
    
    stroke.updateVerts()
  }
  
  func getOffsetPositionForNode(_ node: Node) -> CGVector {
    var other = nodes[0]
    
    if other === node {
      other = nodes[1]
    }
    
    let quaterDistance = distance(other.position, node.position) / 4.0
    
    return node.position + (other.position - node.position).normalized() * CGFloat.minimum(quaterDistance, 30.0)
  }
  
  func setDepth(depth: Float) {
    stroke.setDepth(depth: depth)
  }
  
  func render(_ renderer: Renderer) {
    stroke.render(renderer)
  }
}
