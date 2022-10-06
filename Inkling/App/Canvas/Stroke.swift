//
//  Stroke.swift
//  Inkling
//
//  Created by Marcel on 18/08/2022.
//

import Foundation
import UIKit

class Stroke {
  var points: [CGVector]
  var weights: [CGFloat]
  var lengths: [CGFloat]
  
  var color: Color
  var verts: [Vertex]
  
  var depth: Float = 0.0
  
  init(_ points: [CGVector], _ weights: [CGFloat], _ color: Color) {
    assert(points.count == weights.count)
    
    self.points = points
    self.weights = weights
    self.color = color
    self.verts = []
    self.lengths = []
    
    computeLengths()
    updateVerts()
  }
  
  func resample(step: CGFloat = 1.0){
    let total_length = lengths[lengths.count-1]

    var resampled_points: [CGVector] = []
    var resampled_weights: [CGFloat] = []
    
    var length: CGFloat = 0;
    while length <= total_length {
      let (point, weight) = getPointAtLength(length)
      resampled_points.append(point)
      resampled_weights.append(weight)
      length += step
    }
    
    let (point, weight) = getPointAtLength(total_length)
    resampled_points.append(point)
    resampled_weights.append(weight)

    points = resampled_points
    weights = resampled_weights
    computeLengths()
    updateVerts()
  }
  
  func simplify(){
    let simplified_points = SimplifyStroke(line: points, epsilon: 10.0)
    
    var simplified_weights: [CGFloat] = []
    
    for simplified_point in simplified_points {
      // find key_point index
      let index = points.firstIndex(where: {$0 == simplified_point})!
      simplified_weights.append(weights[index])
    }
    
    points = simplified_points
    weights = simplified_weights
    computeLengths()
    resample()
    updateVerts()
  }
  
  func getPointAtLength(_ length: CGFloat) -> (CGVector, CGFloat) {
    if(length <= 0) {
      return (points[0], weights[0])
    }
    
    if(length >= lengths[lengths.count-1]) {
      return (points[points.count-1], weights[points.count-1])
    }
    
    let index = lengths.firstIndex(where: {$0 >= length})!
    
    let start_length = lengths[index-1]
    let end_length = lengths[index]
    
    let t = (length - start_length) / (end_length - start_length)
    
    return (
      lerp(start: points[index-1], end: points[index], t: t),
      weights[index-1] + (weights[index] - weights[index-1]) * t
    )
  }
  
  func computeLengths() {
    lengths = []
    var length_accumulator: CGFloat = 0
    lengths.append(length_accumulator)
    
    for i in 0..<points.count-1 {
      let length = distance(points[i+1], points[i])
      length_accumulator += length
      lengths.append(length_accumulator)
    }
  }
  
  func segment(_ start: Int, _ end: Int) -> Stroke {
    var end = end
    var start = start
    
//    if start > 0 {
//      start = start - 1
//    }
//
//    if end < points.count - 1 {
//      end = end + 1
//    }
    
    return Stroke(
      Array(points[start...end]),
      Array(weights[start...end]),
      color
    )
  }
  
  func setDepth(depth: Float) {
    self.depth = depth
    updateVerts()
  }
  
  func updateVerts(){
    verts = []
    
    let first = points.first!
    let first_weight = weights.first!
    verts.append(Vertex(position: SIMD4(Float(first.dx), Float(first.dy), depth, Float(first_weight)), color: color.as_simd_transparent()))
    for (pt, weight) in zip(points, weights) {
      verts.append(Vertex(position: SIMD4(Float(pt.dx), Float(pt.dy), depth, Float(weight)), color: color.as_simd()))
    }
    let last = points.last!
    let last_weight = weights.last!
    verts.append(Vertex(position: SIMD4(Float(last.dx), Float(last.dy), depth, Float(last_weight)), color: color.as_simd_transparent()))
  }
  
  func render(_ renderer: Renderer) {
    renderer.addStrokeData(verts);
  }
  
  func erase(_ position: CGVector) -> [Stroke]? {
    
    let index = findClosestPointInCollection(points: points, point: position, min_dist: 10.0)
    
    if index > -1 {
      if points.count  == 1 {
        return []
      }
      if index == 0 {
        return [segment(1, points.count-1)]
      } else if index == points.count-1 {
        return [segment(0, points.count-2)]
      } else {
        return [
          segment(0, index),
          segment(index+1, points.count-1)
        ]
      }
    }
    
    return nil
  }
}
