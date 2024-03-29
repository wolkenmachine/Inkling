import * as ohm from 'ohm-js';

const spreadsheetGrammar = ohm.grammar(String.raw`

Spreadsheet {
  Properties
    = Property*

  Property
    = name Edges Formula

  Edges
    = edges Edge*  -- edges
    |              -- none

  Edge
    = dir Value

  Formula
    = Exp

  Exp
    = IfExp

  IfExp
    = if EqExp then EqExp else IfExp  -- if
    | EqExp

  EqExp
    = RelExp "=" RelExp  -- eq
    | RelExp

  RelExp
    = AddExp ("<=" | "<" | ">=" | ">") AddExp  -- rel
    | AddExp

  AddExp
    = AddExp ("+" | "-") MulExp  -- add
    | MulExp

  MulExp
    = MulExp ("*" | "/" | "%") PropExp  -- mul
    | PropExp

  PropExp
    = dir+ name  -- prop
    | UnExp

  UnExp
    = "-" CallExp  -- neg
    | CallExp

  CallExp
    = name "(" ListOf<Exp, ","> ")"  -- call
    | PriExp

  PriExp
    = "(" Exp ")"  -- paren
    | Value

  Value
    = number
    | string

  // lexical rules

  dir  (a direction)
    = "←"  -- left
    | "→"  -- right
    | "↑"  -- up
    | "↓"  -- down
    | "•"  -- here

  number  (a number literal)
    = digit* "." digit+  -- fract
    | digit+             -- whole

  string  (a string literal)
    = "\"" (~"\"" ~"\n" any)* "\""

  name  (a name)
    = ~keyword letter alnum*

  edges = "edges" ~alnum
  if = "if" ~alnum
  then = "then" ~alnum
  else = "else" ~alnum
  keyword = edges | if | then | else

}

`);

const NOT_AVAILABLE = 'n/a';

type Value = number | string;

interface Property {
  name: string;
  formula(cell: Cell): Value;
  edgeValues?: Record<string, Value>;
}

class Cell {
  readonly neighbors = new Map<string, Cell>();
  readonly propertyValues = new Map<string, Value>();

  constructor(
    readonly spreadsheet: Spreadsheet,
    value?: Value
  ) {
    if (value !== undefined) {
      this.set('value', value);
    }
  }

  connect(name: string, that: Cell): this {
    this.neighbors.set(name, that);
    return this;
  }

  set(propertyName: string, value: Value): this {
    this.propertyValues.set(propertyName, value);
    return this;
  }

  get(path: string[], propertyName: string): Value {
    let cell: Cell | undefined = this;
    for (const name of path) {
      cell = cell.neighbors.get(name);
      if (!cell) {
        return this.spreadsheet.getEdgeValue(name, propertyName);
      }
    }
    const value = cell.propertyValues.get(propertyName);
    if (value !== undefined) {
      return value;
    } else {
      throw NOT_AVAILABLE;
    }
  }

  compute(property: Property) {
    if (this.propertyValues.has(property.name)) {
      // already computed it!
      return false;
    }

    try {
      this.propertyValues.set(property.name, property.formula(this));
      return true;
    } catch (e) {
      if (e !== NOT_AVAILABLE) {
        throw e;
      } else {
        return false;
      }
    }
  }

  toJSON(): Record<string, Value> {
    const obj = {} as Record<string, Value>;
    for (const [name, value] of this.propertyValues.entries()) {
      obj[name] = value;
    }
    return obj;
  }
}

class Spreadsheet {
  static semantics = spreadsheetGrammar
    .createSemantics()
    .addOperation('parse', {
      Properties(ps) {
        const properties = {} as Record<string, Property>;
        for (const p of ps.children) {
          const property = p.parse();
          properties[property.name] = property;
        }
        return properties;
      },
      Property(name, edges, formula) {
        return {
          name: name.parse(),
          edgeValues: edges.parse(),
          formula: formula.parse(),
        };
      },
      Edges_edges(_edges, edges) {
        const edgeValues = {} as Record<string, Value>;
        for (const edgeNode of edges.children) {
          const edge = edgeNode.parse();
          edgeValues[edge.name] = edge.value;
        }
        return edgeValues;
      },
      Edges_none() {
        return {};
      },
      Edge(name, value) {
        return {
          name: name.parse(),
          value: value.parse(),
        };
      },
      Formula(exp) {
        const fnSource = `cell => ${exp.parse()}`;
        // console.log(fnSource);
        return eval(fnSource);
      },
      IfExp_if(_if, cond, _then, trueBranch, _else, falseBranch) {
        return `(${cond.parse()} ? ${trueBranch.parse()} : ${falseBranch.parse()})`;
      },
      EqExp_eq(a, _eq, b) {
        return `(${a.parse()} === ${b.parse()})`;
      },
      RelExp_rel(a, op, b) {
        return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
      },
      AddExp_add(a, op, b) {
        return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
      },
      MulExp_mul(a, op, b) {
        return `(${a.parse()} ${op.sourceString} ${b.parse()})`;
      },
      PropExp_prop(names, propertyName) {
        return `cell.get([${names
          .parse()
          .map((name: string) => JSON.stringify(name))
          .join(', ')}], ${JSON.stringify(propertyName.parse())})`;
      },
      UnExp_neg(_minusSign, exp) {
        return `(-${exp.parse()})`;
      },
      CallExp_call(funcName, _openParen, args, _closeParen) {
        return `cell.spreadsheet.callBuiltinFn(${JSON.stringify(
          funcName.parse()
        )}, ${args.children.map(arg => arg.parse()).join(', ')})`;
      },
      PriExp_paren(_openParen, exp, _closeParen) {
        return `(${exp.parse()})`;
      },
      name(_firstLetter, _rest) {
        return this.sourceString;
      },
      dir(_name) {
        return this.sourceString;
      },
      number(_) {
        return parseFloat(this.sourceString);
      },
      string(_openQuote, _meat, _closeQuote) {
        return this.sourceString;
      },

      EmptyListOf() {
        return [];
      },
      NonemptyListOf(x, _commas, xs) {
        return [x.parse(), ...xs.parse()];
      },
      _iter(...children) {
        return children.map(child => child.parse());
      },
      _terminal() {
        return this.sourceString;
      },
    });

  static parse(properties: string): Record<string, Property> {
    const m = spreadsheetGrammar.match(properties);
    if (m.failed()) {
      console.log(m.message);
      throw new Error(
        'failed to parse spreadsheet formulas -- see console for details'
      );
    }
    return Spreadsheet.semantics(m).parse();
  }

  readonly properties: Record<string, Property>;
  readonly rows: Cell[][];

  constructor(cellValues: (Value | undefined)[][], properties: string) {
    this.properties = Spreadsheet.parse(properties);
    console.log(properties);
    // console.log(this.properties);

    this.rows = cellValues.map(row => row.map(value => new Cell(this, value)));
    for (let row = 0; row < this.rows.length; row++) {
      for (let col = 0; col < this.rows[row].length; col++) {
        const here = this.getCell(row, col)!;
        const up = this.getCell(row - 1, col);
        const down = this.getCell(row + 1, col);
        const left = this.getCell(row, col - 1);
        const right = this.getCell(row, col + 1);
        here.connect('•', here);
        if (up) {
          here.connect('↑', up);
        }
        if (down) {
          here.connect('↓', down);
        }
        if (left) {
          here.connect('←', left);
        }
        if (right) {
          here.connect('→', right);
        }
      }
    }
  }

  private getCell(rowIdx: number, colIdx: number) {
    if (rowIdx < 0 || rowIdx >= this.rows.length) {
      return null;
    }
    const row = this.rows[rowIdx];
    if (colIdx < 0 || colIdx >= row.length) {
      return null;
    }
    return row[colIdx];
  }

  compute(options?: Partial<{ maxIterations: number; showResult: boolean }>) {
    const { maxIterations = 1_000, showResult = true } = options ?? {};
    let n = 0;
    while (n++ < maxIterations) {
      let didSomething = false;
      for (const row of this.rows) {
        for (const cell of row) {
          for (const property of Object.values(this.properties)) {
            didSomething = cell.compute(property) || didSomething;
          }
        }
      }
      if (!didSomething) {
        break;
      }
    }
    if (showResult) {
      console.log(this.getCellValues());
    }
    console.log('done in', n, 'iterations');
  }

  getEdgeValue(name: string, propertyName: string): Value {
    const property = this.properties[propertyName];
    if (
      !property ||
      !property.edgeValues ||
      property.edgeValues[name] === undefined
    ) {
      throw NOT_AVAILABLE;
    }
    return property.edgeValues[name];
  }

  callBuiltinFn(name: string, ...args: Value[]) {
    switch (name) {
      case 'min':
        return Math.min(...(args as number[]));
      case 'max':
        return Math.max(...(args as number[]));
      default:
        throw new Error('unsupported function: ' + name);
    }
  }

  getCellValues(): Record<string, Value>[][] {
    return this.rows.map(row => row.map(cell => cell.toJSON()));
  }
}

console.log('--- squares ---');
const squares = new Spreadsheet(
  [
    [1, undefined],
    [2, undefined],
    [3, undefined],
    [4, undefined],
    [5, undefined],
  ],
  String.raw`
    value
      ←value * ←value
  `
);
squares.compute();

console.log('--- habit tracker ---');
const habitTracker = new Spreadsheet(
  [['x', 'x', '', 'x', 'x', 'x']],
  String.raw`
    n
      edges
        ← 0
        → 0
      if •value = "x"
      then ←n + 1
      else 0

    subscript
      if •n > →n
      then "" + •n
      else ""
  `
);
habitTracker.compute();

console.log('--- wave ---');
const wave = new Spreadsheet(
  [
    [1, 2, 3, 4], //
    [5, 6, 7, 8], //
    [9, 10, 11, 12], //
    [13, 14, 15, 16], //
  ],
  String.raw`
    acc
      edges
        ↑ 0
        ← 0
      •value + ↑acc + ←acc

    subscript
      •acc
  `
);
wave.compute();
