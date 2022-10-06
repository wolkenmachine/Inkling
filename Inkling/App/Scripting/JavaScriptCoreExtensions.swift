//
//  JavaScriptCoreExtensions.swift
//  Inkling
//
//  Created by Patrick Dubroy on 2022-10-05.
//

import Foundation
import JavaScriptCore

// Some extensions that make it more convenient to access and manipulate
// objects in a JSContext.

public extension JSContext {
  subscript(_ key: NSString) -> JSValue? {
    get { return objectForKeyedSubscript(key) }
    set { fatalError("get: cannot be used to set") }
  }

  subscript(_ key: NSString) -> Any? {
    get { fatalError("set: cannot be used to get") }
    set { setObject(newValue, forKeyedSubscript: key) }
  }
}

public extension JSValue {
  subscript(_ key: NSString) -> JSValue? {
    get { return objectForKeyedSubscript(key) }
    set { fatalError("get: cannot be used to set") }
  }

  subscript(_ key: NSString) -> Any? {
    get { fatalError("set: cannot be used to get") }
    set { setObject(newValue, forKeyedSubscript: key) }
  }
}
