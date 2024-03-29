# TODO

## UX Improvements

- P1: fix clock demo (it broke w/ new finger constraint)
  (Alex)

- P1: finger constraint needs to feel better (e.g., when manipulating gizmo w/ locked distance and/or angle)
  (Alex)

- P1: (Possibly repeat of above) — Make a gizmo with 1 locked handle, locked angle. Drag the free handle. It moves and flickers.
  (Alex)

- P1: when breaking apart handles, put a temp pin constraint
  on left over handle

- P1: when erasing inside a formula, call a different method (not remove)
  (Marcel)

- P2: When removing a canonicalInstance handle, pick one of the absorbed handles to become the new canonicalInstance

- P2: tokens snap to each other, and can be moved together w/ a single finger
  (e.g., two number tokens, or a number token right next to a property picker)
  (Marcel)

- P2: more fluid gesture to get a wire out of a property picker:
  ATM you have to first pick a property (w/ tap) then drag out the wire.
  We should be able to do this in a single gesture.
  (Marcel)

- P4: in meta mode, should you be able to break apart ink handles?

- P4: should we be able to delete a handle w/ a pin if it's not
  connected to anything? (right now we can't)

- P1292: When using KB+M, a way to put a finger down and leave it there (and remove it later)

## Bugs

- P1/2: can't erase a connection between a number outside a formula and inside
  (deleting the line does nothing)

- P1/2: Wires to formula cells render behind the formula box. This is bad.
  (Ivan)

- P2: when writing a label in the formula editor, sometimes the label.display in LabelToken is undefined and errors.
  (Marcel)

- P#wontfix: It's possible to erase 1 handle from a strokegroup. We'll "fix" this by implementing Components.
  (Ivan)

## Formulas / Wires / Meta

- P2/3: using / in formulas causes gradient errors
  More generally, need to fix unsatisfiable formula constraints
  (Alex)

- P2/3: "orange" numbers for results of spreadsheet formulas
  (this info needs to be in Variable so Tokens can render...)
  (opposite of locked number tokens: cannot be changed / scrubbed)
  (Alex)

- P2/3: tweaks to property picker token design
  (Ivan)

- P3/4: toggle formula "equals" <==> "arrow" (spreadsheet/diode mode)
  (Alex)

## Constraints

- P2: Should we make it impossible to have both handles in a stroke group or gizmo absorb one another?

- P2/3: consider unlocking a locked variable instead of pausing a constraint
  when solver gives up -- this would be easier to understand since
  the variables' locked/unlocked state is always shown on the canvas.
  (As opposed to, say, pausing a PolarVector constraint which leaves
  the Gizmo that owns it looking like a functional Gizmo when it isn't.)
  (Alex)

- P4: constraints should only have weak refs to handles

## Clean-up

- P3: If tapping and dragging perform different actions to the same object,
  they need to be handled by the same gesture, because they both need to claim the touch.
  This is awkward! For instance, in meta, tapping empty space currently creates a formula,
  and dragging empty space creates a gizmo. (In this example, "empty space" is the object).
  (We will probably replace both of these with some sort of "create seed" gesture. Set that aside for a sec.)
  We have a separate gesture for creating a gizmo by dragging on a handle.
  This is bad.
  (Ivan)

- P3: Idea: We can continue tracking a "hold still" timer to check for dead touches, but only actually
  perform the reap when we toggle in/out of meta mode, which should make reaping less awful.
