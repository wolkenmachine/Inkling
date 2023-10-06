import * as constraints from '../constraints';

// This file implements the semantics of meta ink independently of the visual language
// There are two main types: 

// Meta Value
// A meta value can be a Number, Struct or Collection
export interface MetaValue {
  wireTo(other: MetaValue): MetaConnection | null;
}

// Meta Connection
// An abstract "wire" between two values
export interface MetaConnection {
  remove(): void;
}

// NUMBERS
export class MetaNumber implements MetaValue {
  constructor(public variable: constraints.Variable) {

  }

  wireTo(other: MetaValue) : MetaNumberConnection | null {
    if(other instanceof MetaNumber) {
      return new MetaNumberConnection(this, other);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}

export class MetaNumberConnection implements MetaConnection {
  constraint: constraints.AddConstraintResult<never>;

  constructor(a: MetaNumber, b: MetaNumber){
    this.constraint = constraints.equals(a.variable, b.variable);
  }

  remove() {
    this.constraint.remove();
  }
}

// STRUCTS
export class MetaStruct implements MetaValue {
  values: Map<string, MetaValue>;

  constructor(input: any) {
    this.values = new Map();
    Object.keys(input).forEach(key=>{
      this.values.set(key, input[key]);
    });
  }

  isEmpty(){
    return this.values.size == 0;
  }

  get(key: string): MetaValue | undefined {
    console.log(this.values);
    
    return this.values.get(key);
  }

  wireTo(other: MetaValue): MetaStructConnection | null {
    if(other instanceof MetaStruct) {
      return new MetaStructConnection(this, other);
    } else {
      console.error("You can't wire those things together silly billy!");
      return null;
    }
  }
}

export class MetaStructConnection implements MetaConnection {
  constructor(a: MetaStruct, b: MetaStruct){
    // Make sure 'b' is the empty one, so we always unify towards the empty struct
    if(a.isEmpty()) {
      [a,b] = [b,a];
    }

    // Just js object equality is fine here?
    b.values = a.values; 
  }

  remove() {
    return;
  }
}

export class MetaCollection implements MetaValue {
  wireTo(other: MetaValue) {
    return null;
  }
}

