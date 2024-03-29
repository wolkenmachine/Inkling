import TransformationMatrix from "../lib/transform_matrix";
import Vec from "../lib/vec";

export default class Selection {
    constructor(page, snaps) {
        this.page = page;
        this.snaps = snaps;

        this.points = new Set();
        this.origPosition = new Map(); // point -> position

        // gesture state
        this.tappedOn = null; // point
        this.firstFinger = null;
        this.firstFingerMoved = null;
        this.secondFinger = null;
        this.secondFingerMoved = null;

    }

    update(events) {
        const fingerDown = events.did('finger', 'began');
        if (fingerDown) {
            // If we weren't already holding down a finger
            if (!this.firstFinger) { 
                this.firstFinger = fingerDown;
                this.firstFingerMoved = fingerDown;

                const point = this.page.findPointNear(fingerDown.position);
                if (point) {
                    this.selectPoint(point);
                    this.tappedOn = point;
                } else {
                    this.tappedOn = null;
                }

                // Set initial offset transform
                const transform = new TransformationMatrix();
                const p = fingerDown.position;
                transform.translate(p.x, p.y).inverse();
                for (const point of this.points) {
                    this.origPosition.set(point, transform.transformPoint(point.position));
                }
            } else { // Two fingers, go into full transform mode
                this.secondFinger = fingerDown;
                this.secondFingerMoved = fingerDown;

                // Set initial offset transform
                const transform = new TransformationMatrix();
                const a = Vec.divS(Vec.add(this.firstFingerMoved.position, this.secondFinger.position), 2);
                const b = this.secondFinger.position;
                transform.fromLine(a, b).inverse();
                for (const point of this.points) {
                    this.origPosition.set(point, transform.transformPoint(point.position));
                }
            }
        }

        // If we're already holding down a finger, switch to pinch gesture
        if (this.firstFinger) {
            const fingerMove = events.didLast('finger', 'moved', this.firstFinger.id);
            if (fingerMove) {
                this.firstFingerMoved = fingerMove;
                this.transformSelection();
            }

            const fingerUp = events.did('finger', 'ended', this.firstFinger.id);
            if (fingerUp) {
                const shortTap = fingerUp.timestamp - this.firstFinger.timestamp < 0.2;
                if (shortTap) {
                    const tappedOnEmptySpace = this.tappedOn == null;
                    if (tappedOnEmptySpace) {
                        this.clearSelection();
                    }
                } else {
                    if (this.tappedOn != null && this.points.size === 1) {
                        this.clearSelection();
                    }
                }

                for (const point of this.points) {
                    this.page.mergePoint(point)
                }
                
                
                this.firstFinger = null;
                this.firstFingerMoved = null;

                // TODO: this could be done better
                this.secondFinger = null;
                this.secondFingerMoved = null;

                this.snaps.clear();
            }
        }

        if (this.secondFinger) {
            const fingerMove = events.did('finger', 'moved', this.secondFinger.id);
            if (fingerMove) {
                this.secondFingerMoved = fingerMove;
                this.transformSelection();
            }

            let fingerTwoUp = events.did('finger', 'ended', this.secondFinger.id);
            if (fingerTwoUp) {
                this.secondFinger = null;
                this.secondFingerMoved = null;

                // TODO: this could be done better
                this.firstFinger = null;
                this.firstFingerMoved = null;
            }
        }
    }

    selectPoint(point) {
        this.points.add(point);
        point.select();

        for (const ls of this.page.lineSegments) {
            if (this.points.has(ls.a) && this.points.has(ls.b)) {
                ls.select();
            } else {
                ls.deselect();
            }
        }
    }

    clearSelection() {
        for (const point of this.points) {
            point.deselect();
        }
        this.points = new Set();
        this.origPosition = new Map();

        for (const ls of this.page.lineSegments) {
            ls.deselect();
        }
    }

    transformSelection() {

        // TODO(alex): Why do we need to do this?
        // for (const [point, vs] of this.snapVectors) {
        //     const unsnappedPos =
        //         vs.reduce(
        //             (p, v) => Vec.sub(p, v),
        //             point.position
        //         );
        //     point.setPosition(unsnappedPos);
        // }

        const transform = new TransformationMatrix();
        if (this.firstFingerMoved && this.secondFingerMoved) {
            const a =
                Vec.divS(
                    Vec.add(
                        this.firstFingerMoved.position,
                        this.secondFingerMoved.position
                    ),
                    2
                );
            const b = this.secondFingerMoved.position;
            transform.fromLine(a, b);
        } else {
            const p = this.firstFingerMoved.position;
            transform.translate(p.x, p.y);
        }

        const transformedPositions = new Map();
        for (const point of this.points) {
            const oldPos = this.origPosition.get(point);
            const newPos = transform.transformPoint(oldPos);
            transformedPositions.set(point, newPos);
        }

        const snappedPositions = this.snaps.snapPositions(transformedPositions);
        for (const point of this.points) {
            point.setPosition(snappedPositions.get(point));
        }
    }
}