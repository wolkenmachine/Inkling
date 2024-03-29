import Token, { aToken } from './Token';
import SVG from '../Svg';
import Vec from '../../lib/vec';
import NumberToken, { aNumberToken } from './NumberToken';
import OpToken from './OpToken';
import EmptyToken, { anEmptyToken } from './EmptyToken';
import WritingCell, { aWritingCell } from './WritingCell';
import { GameObject } from '../GameObject';
import FormulaCompiler from './FormulaCompiler';
import LabelToken from './LabelToken';
import PropertyPicker from './PropertyPicker';
import { Position, Removable } from '../../lib/types';

const PADDING = 3;

// TODO:
// We're computing the amount of writing cell super ad-hoc right now
// Can be improved significiantly if we have a better interface

export default class Formula extends Token {
  // maxHp = 120;
  // hp = this.maxHp;

  readonly height = 30 + PADDING * 2;

  protected readonly boxElement = SVG.add('rect', SVG.metaElm, {
    x: this.position.x,
    y: this.position.y,
    width: this.width,
    height: this.height,
    rx: 3,
    class: 'parsed-formula',
  });

  private constraint: Removable | null = null;

  isPrimary() {
    return false;
  }

  edit() {
    // remove existing constraint
    if (this.constraint) {
      this.constraint.remove();
      this.constraint = null;
    }

    // create new empty spaces
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());
    this.adopt(new EmptyToken());

    // Toggle embedded numbers
    for (const numberToken of this.findAll({ what: aNumberToken })) {
      numberToken.refreshEditValue();
    }

    // Toggle mode
    this.editing = true;
    this.updateCells();
  }

  close() {
    if (!this.editing) {
      return;
    }

    const tokens = this.findAll({ what: aToken });
    const filteredTokens = tokens.filter(t => !(t instanceof EmptyToken));

    if (filteredTokens.length === 0) {
      this.editing = false;
      this.remove();
      return;
    }

    // Detach single token formulas
    if (filteredTokens.length === 1) {
      const firstToken = tokens[0];
      firstToken.embedded = false;
      firstToken.editing = false;
      if (firstToken instanceof NumberToken) {
        firstToken.refreshValue();
      }
      this.page.adopt(firstToken);
      this.editing = false;
      this.remove();
      return;
    }

    // Find if there is an =
    const equalsIndex = filteredTokens.findIndex(
      token => token instanceof OpToken && token.stringValue === '='
    );
    if (equalsIndex < 0) {
      this.adopt(new OpToken('='));
      this.adopt(new NumberToken());
    } else if (equalsIndex === filteredTokens.length - 1) {
      this.adopt(new NumberToken());
    }

    for (const numberToken of this.findAll({ what: aNumberToken })) {
      numberToken.refreshValue();
    }

    // Compile the formula
    const compiler = new FormulaCompiler(this.page);
    const newFormulaConstraint = compiler.compile(this.getFormulaAsText());
    if (!newFormulaConstraint) {
      // Don't close the editor
      return;
    }

    this.constraint = newFormulaConstraint;
    this.discardEmptyTokens();

    this.editing = false;
    this.updateCells();
  }

  discardEmptyTokens() {
    const emptyTokens = this.findAll({ what: anEmptyToken });
    for (const token of emptyTokens) {
      token.remove();
    }
  }

  updateCells() {
    if (!this.editing) {
      for (const cell of this.findAll({ what: aWritingCell })) {
        cell.remove();
      }
      return;
    }

    let totalCellCount = 0;
    for (const token of this.findAll({ what: aToken })) {
      totalCellCount +=
        token instanceof NumberToken ? token.editValue.length : 1;
    }

    const currentCells = this.findAll({ what: aWritingCell });

    console.log(currentCells.length, totalCellCount);
    console.log(currentCells);

    if (currentCells.length < totalCellCount) {
      const diff = totalCellCount - currentCells.length;
      for (let i = 0; i < diff; i++) {
        this.adopt(new WritingCell());
      }
    } else if (currentCells.length > totalCellCount) {
      const diff = currentCells.length - totalCellCount;
      for (let i = 0; i < diff; i++) {
        const cell = currentCells.pop();
        cell?.remove();
      }
    }
  }

  layoutCells() {
    if (!this.editing) {
      return;
    }

    const cells = this.findAll({ what: aWritingCell });
    for (const token of this.findAll({ what: aToken })) {
      if (token instanceof NumberToken) {
        for (let i = 0; i < token.editValue.length; i++) {
          const cell = cells.shift();
          if (cell) {
            cell.position = Vec.add(token.position, {
              x: (24 + PADDING) * i,
              y: 0,
            });
          }
        }
      } else {
        const cell = cells.shift();
        if (cell) {
          cell.position = token.position;
          cell.width = token.width;
        }
      }
    }
  }

  getFormulaAsText() {
    const formula = [];
    for (const token of this.findAll({ what: aToken })) {
      if (token instanceof OpToken) {
        formula.push(token.stringValue);
      } else if (token instanceof NumberToken) {
        formula.push('@' + token.id);
      } else if (token instanceof LabelToken) {
        formula.push('#' + token.id);
      } else if (token instanceof PropertyPicker) {
        formula.push('!' + token.id);
      } else if (token instanceof EmptyToken) {
        // NO-OP
      } else {
        throw new Error(
          'unexpected token type in formula: ' + token.constructor.name
        );
      }
    }
    return formula.join(' ');
  }

  updateWritingCells() {
    const tokens = this.findAll({ what: aToken });
    let tokenIndex = 0;
    let token = tokens[tokenIndex];
    let offsetInsideToken = -1;

    const cells = this.findAll({ what: aWritingCell });

    for (const cell of cells) {
      // Step forward through tokens
      offsetInsideToken += 1;

      const tokenSize =
        token instanceof NumberToken ? token.editValue.length : 1;

      if (offsetInsideToken === tokenSize) {
        offsetInsideToken = 0;
        tokenIndex += 1;
        token = tokens[tokenIndex];
      }

      if (cell.stringValue !== '') {
        // Handle all tokenizations
        // If it's a number token and
        if (token instanceof NumberToken) {
          if (isNumeric(cell.stringValue)) {
            token.updateCharAt(offsetInsideToken, cell.stringValue);
          } else {
            // Split this number token
            const start = token.editValue.slice(0, offsetInsideToken);
            const end = token.editValue.slice(offsetInsideToken + 1);
            token.editValue = start;
            tokens.splice(tokenIndex + 1, 0, new OpToken(cell.stringValue));
            if (end !== '') {
              const numToken = new NumberToken();
              numToken.editValue = end;
              tokens.splice(tokenIndex + 2, 0, numToken);
            }
          }
        } else if (token instanceof EmptyToken || token instanceof OpToken) {
          if (isNumeric(cell.stringValue)) {
            const prev = tokens[tokenIndex - 1];
            const next = tokens[tokenIndex + 1];
            if (prev instanceof NumberToken) {
              prev.addChar(cell.stringValue);
              // Merge two number tokens
              if (next instanceof NumberToken) {
                prev.editValue += next.editValue;
                tokens[tokenIndex].remove();
                tokens[tokenIndex + 1].remove();
                tokens.splice(tokenIndex, 2);
              } else {
                tokens[tokenIndex].remove();
                tokens.splice(tokenIndex, 1);
                tokens.push(new EmptyToken());
              }
            } else {
              const numToken = new NumberToken();
              numToken.addChar(cell.stringValue);
              tokens[tokenIndex].remove();
              tokens[tokenIndex] = numToken;
              tokens.push(new EmptyToken());
            }
          } else {
            const opToken = new OpToken(cell.stringValue);
            tokens[tokenIndex].remove();
            tokens[tokenIndex] = opToken;
            tokens.push(new EmptyToken());
          }
        }

        cell.stringValue = '';

        for (const t of tokens) {
          this.adopt(t);
        }

        this.updateCells();
      }
    }
  }

  insertInto(emptyToken: EmptyToken, newToken: Token) {
    const tokens = this.findAll({ what: aToken });
    const idx = tokens.indexOf(emptyToken);
    if (idx < 0) {
      throw new Error('bad call to Formula.insertInto()');
    }
    tokens.splice(idx, 0, newToken);
    newToken.editing = true;

    // update the order of the children in this game object
    for (const t of tokens) {
      this.adopt(t);
    }

    this.updateCells();
  }

  render(dt: number, t: number): void {
    // // Heal
    // this.hp = clip(this.hp + 1, 0, this.maxHp);
    // SVG.update(this.boxElement, {
    //   opacity: this.hp / this.maxHp,
    // });

    // Process input
    if (this.editing) {
      this.updateWritingCells();
    }

    // Layout child tokens in horizontal sequence
    let nextTokenPosition = Vec.add(this.position, Vec(PADDING, PADDING));
    for (const token of this.findAll({ what: aToken })) {
      token.position = nextTokenPosition;

      token.embedded = true;
      token.editing = this.editing;

      nextTokenPosition = Vec.add(
        nextTokenPosition,
        Vec(token.width + PADDING, 0)
      );
    }

    this.width = nextTokenPosition.x - this.position.x;

    // Update box wrapper
    if (this.children.size === 0) {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: 0,
      });
      this.width -= PADDING * 2;
    } else {
      SVG.update(this.boxElement, {
        x: this.position.x,
        y: this.position.y,
        width: this.width,
      });
    }

    // Move cells
    this.layoutCells();

    // render children
    for (const child of this.children) {
      child.render(dt, t);
    }
  }

  erase(position: Position) {
    // TODO: erase cell at position
  }

  remove() {
    this.constraint?.remove();
    this.boxElement.remove();
    for (const child of this.children) {
      child.remove();
    }
    super.remove();
  }
}

function isNumeric(v: string) {
  return '0' <= v && v <= '9';
}

export const aFormula = (gameObj: GameObject) =>
  gameObj instanceof Formula ? gameObj : null;
