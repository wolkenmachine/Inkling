import { EventContext, Gesture } from '../Gesture';
import Token, { aPrimaryToken, aToken } from '../meta/Token';
import Vec from '../../lib/vec';
import NumberToken from '../meta/NumberToken';
import { createWire, isTokenWithVariable } from './effects/CreateWire';
import { createFormula } from './effects/CreateFormula';
import Formula from '../meta/Formula';

export const isNumberToken = (token: Token | null): token is NumberToken =>
  token instanceof NumberToken;

export function tokenCreateWireOrEditFormula(
  ctx: EventContext
): Gesture | void {
  if (ctx.metaToggle.active) {
    const primaryToken = ctx.page.find({
      what: aPrimaryToken,
      near: ctx.event.position,
    });
    if (primaryToken && isTokenWithVariable(primaryToken)) {
      return new Gesture('Create Wire or Edit Formula', {
        dragged(ctx) {
          return createWire(primaryToken.wirePort, ctx);
        },
        endedTap(ctx) {
          if (primaryToken.parent instanceof Formula) {
            primaryToken.parent.edit();
          } else {
            createFormula(ctx, primaryToken);
          }
        },
      });
    }
  }
}

export function tokenMoveOrToggleConstraint(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active) {
    const token = ctx.page.find({
      what: aToken,
      near: ctx.event.position,
    });

    if (token) {
      const offset = Vec.sub(token.position, ctx.event.position);

      return new Gesture('Touch Token', {
        dragged(ctx) {
          token.position = Vec.add(ctx.event.position, offset);
        },
        endedTap(ctx) {
          token.onTap();
        },
      });
    }
  }
}

export function numberTokenScrub(ctx: EventContext): Gesture | void {
  if (ctx.metaToggle.active && ctx.pseudo) {
    const token = ctx.page.find({
      what: aPrimaryToken,
      near: ctx.event.position,
    });

    if (isNumberToken(token)) {
      const v = token.getVariable();
      const wasLocked = v.isLocked;
      let initialY = ctx.event.position.y;
      let initialValue = v.value;
      let fingers = 0;

      return new Gesture('Scrub Number Token', {
        moved(ctx) {
          if (fingers !== ctx.pseudoCount) {
            fingers = ctx.pseudoCount;
            initialValue = v.value;
            initialY = ctx.event.position.y;
          }
          const delta = initialY - ctx.event.position.y;
          const m = 1 / Math.pow(10, fingers - 1);
          const value = Math.round((initialValue + delta * m) / m) * m;
          token.getVariable().lock(value, true);
        },
        ended(ctx) {
          if (!wasLocked) {
            token.getVariable().unlock();
          }
        },
      });
    }
  }
}
