//
//  StrokeCapture.swift
//  Inkling
//
//  Created by Marcel on 18/08/2022.
//

import Foundation
import UIKit

// Subsystem that captures pen movements and produces a Stroke Canvas Object

class StrokeCapture {
  var points: [CGVector] = []
  var weights: [CGFloat] = []
  
  var predicted_points: [CGVector] = []
  var predicted_weights: [CGFloat] = []
  
  var color: Color
  var verts: [Vertex] = []
  var active = false
  
  init(){
    points = []
    weights = []
    predicted_points = []
    predicted_weights = []
    color = Color.init(0, 0, 0)
    verts = []
  }
  
  // Process Stroke input data, Returns a new stroke once it's ready
  func update(_ touch_events: [TouchEvent]) -> Stroke? {
    // Reset predicted points every frame
    predicted_points = []
    
    var result: Stroke? = nil
    
    for event in touch_events {
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
    weights = [weight]
    predicted_points = []
    predicted_weights = []
    verts = []
    
    verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, Float(weight)), color: color.as_simd_transparent()))
    verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, Float(weight)), color: color.as_simd()))
  }
  
  func add_point(_ pos: CGVector, _ weight: CGFloat){
    if active {
      points.append(pos)
      weights.append(weight)
      verts.append(Vertex(position: SIMD4(Float(pos.dx), Float(pos.dy), 0.0, Float(weight)), color: color.as_simd()))
    }
  }
  
  func add_predicted_point(_ pos: CGVector, _ weight: CGFloat){
    if active {
      predicted_points.append(pos)
      predicted_weights.append(weight)
    }
  }
  
  func end_stroke(_ pos: CGVector, _ weight: CGFloat) -> Stroke? {
    if active {
      points.append(pos)
      weights.append(weight)
      let stroke = Stroke(points, weights, color)
      points = []
      predicted_points = []
      active = false
      return stroke
    }
    
    return nil
  }
  
  func render(_ renderer: Renderer) {
    if points.count == 0 {
      return
    }
    
    let predicted_verts = zip(predicted_points, predicted_weights).map { (pt, weight) in
      Vertex(position: SIMD4(Float(pt.dx), Float(pt.dy), 0.0, Float(weight)), color: color.as_simd())
    }
     
    var joined_verts = verts + predicted_verts
    var last = joined_verts.last!
    last.color[3] = Float(0.0)
    joined_verts.append(last)
    
    renderer.addStrokeData(joined_verts)
  }
}
