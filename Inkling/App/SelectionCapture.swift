//
//  Selection.swift
//  Inkling
//
//  Created by Marcel on 18/08/2022.
//

import Foundation
import UIKit

// Subsystem that captures pen movements and produces a Stroke Canvas Object

class SelectionCaputure {
  var points: [CGVector] = []
  var predicted_points: [CGVector] = []
    
  let color: Color
  var verts: [Vertex] = []
  var active = false
  

  
  init(){
    points = []
    predicted_points = []
    color = Color(73, 172, 214)
    verts = []
  }
  
  
  // Process Stroke input data, Returns a new stroke once it's ready  
  func update(_ touches: Touches) -> [CGVector]? {
    // Reset predicted points every frame
    predicted_points = []
    
    var result: [CGVector]? = nil
    
    for event in touches.events {
      if event.type == .Pencil {
        switch event.event_type {
        case .Begin: begin_stroke(event.pos, event.force!)
        case .Move: add_point(event.pos, event.force!)
        case .Predict: add_predicted_point(event.pos, event.force!)
        case .End: result = end_stroke(event.pos, event.force!)
        }
      }
    }
    
    return result
  }
  
  func begin_stroke(_ pos: CGVector, _ weight: CGFloat){
    active = true
    points = [pos]
    predicted_points = []
    verts = []
    
    verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, 1.0), color: color.as_simd_transparent()))
    verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, 1.0), color: color.as_simd()))
  }
  
  func add_point(_ pos: CGVector, _ weight: CGFloat){
    if active {
      if distance(points.last!, pos) > 5.0 {
        points.append(pos)
        verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, 1.0), color: color.as_simd()))
      }
      
    }
  }
  
  func add_predicted_point(_ pos: CGVector, _ weight: CGFloat){
    if active {
      predicted_points.append(pos)
    }
  }
  
  func end_stroke(_ pos: CGVector, _ weight: CGFloat) -> [CGVector]? {
    if active {
      points.append(pos)
      let result = points
      points = []
      predicted_points = []
      active = false
      return result
    }
    return nil
  }
  
  func render(_ renderer: Renderer) {
    // Render line
    if points.count > 0 {
      let predicted_verts = predicted_points.map { (pt) in
        Vertex(position: SIMD4(Float(pt.dx), Float(pt.dy), 0.0, 1.0), color: color.as_simd())
      }
       
      var joined_verts = verts + predicted_verts
      var last = joined_verts.last!
      last.color[3] = Float(0.0)
      joined_verts.append(last)
      
      renderer.addStrokeData(joined_verts)
    }
  }
}
