//
//  ScriptLoader.swift
//  Inkling
//
//  Created by Patrick Dubroy on 2022-09-19.
//

import JavaScriptCore
import Foundation

let scriptUrls = [
  "http://Patricks-M1-MacBook.local:8000/main.js"
]

class ScriptLoader {
  let context: JSContext

  init(_ api: ScriptingAPI) {
    context = JSContext()

    // Forward console.log to the Swift side
    let logImpl: @convention(block) (String) -> Void = { string in
      print(string)
    }
    context["console"]?["log"] = logImpl

    // Set up an exception handler which prints to the Swift console
    context.exceptionHandler = {_, exception in
      if let exception = exception {
        print(exception.toString()!)
      }
    }
    context["habitat"] = api
  }

  func loadAllScripts() {
    for url in scriptUrls {
      loadScript(urlString: url)
    }
  }

  func loadScript(urlString: String) {
    if let url = URL(string: urlString) {
      do {
        let scriptContents = try String(contentsOf: url)
        context.evaluateScript(scriptContents)
      } catch {
        print("Unable to load script from \(url)")
      }
    } else {
      assert(false, "bad url: \(urlString)")
    }
  }

  func getElementData(_ element: CanvasElement) -> [String:Any] {
    var elementData: [String: Any] = [
      "nodes": element.nodes.map { [
        "id": $0.id,
        "position": [$0.position.dx, $0.position.dy]
      ] }
    ]
    // TODO(pdubroy): Find a better way to do this - maybe implementing the Codable protocol
    // in the subclasses of CanvasElement?
    switch element {
    case is CanvasBezier:
      elementData["type"] = "bezier"
    case is CanvasCurve:
      elementData["type"] = "curve"
    case is CanvasLine:
      elementData["type"] = "line"
    default:
      print("unknown element type")
      print(element)
    }
    return elementData
  }
}
