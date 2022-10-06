//
//  CanvasElement.swift
//  Inkling
//
//  Created by Marcel on 30/08/2022.
//

import Foundation
import UIKit

protocol CanvasElement: AnyObject {
  var nodes: [Node] { get set }
  
  func render(_ renderer: Renderer)
  func setDepth(depth: Float)
  func morph()
  
  func getOffsetPositionForNode(_ node: Node) -> CGVector
}
