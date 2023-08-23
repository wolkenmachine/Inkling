import Vec from '../lib/vec';
import Events, { Event } from './NativeEvents';
import Page from './Page';
import FreehandStroke from './strokes/FreehandStroke';
import StrokeGroup from './strokes/StrokeGroup';

export default class FreehandSelection {
  readonly selectedStrokes = new Set<FreehandStroke>();
  clusterSelectionIndex = 0;
  currStrokeGroup: StrokeGroup | null = null;

  // Interaction State
  fingerDown: Event | null = null;
  fingerMoved: Event | null = null;

  constructor(private readonly page: Page) {}

  update(events: Events) {
    const fingerDown = events.did('finger', 'began');
    if (fingerDown) {
      this.fingerDown = fingerDown;
      const found = this.page.findFreehandStrokeNear(fingerDown.position);

      // Register longpress
      window.setTimeout(() => {
        if (
          this.fingerDown &&
          (!this.fingerMoved ||
            Vec.dist(this.fingerDown.position, this.fingerMoved.position) < 10)
        ) {
          this.createGroupFromSelection();
        }
      }, 750);

      if (found) {
        this.fingerDownOnStroke(found);
      } else {
        this.fingerDownOnEmptySpace();
      }
    }

    if (this.fingerDown) {
      const fingerMoved = events.did('finger', 'moved', this.fingerDown.id);
      if (fingerMoved) {
        this.fingerMoved = fingerMoved;
      }

      const fingerEnded = events.did('finger', 'ended', this.fingerDown.id);
      if (fingerEnded) {
        this.fingerDown = null;
        this.fingerMoved = null;
      }
    }
  }

  createGroupFromSelection() {
    // Don't create a group if it's already a group
    if (this.currStrokeGroup) {
      return;
    }

    // It doesn't make sense for the same stroke to be in more than one group.
    // E.g., what transform applies when the user has moved handles associated
    // with the more than one group that the stroke belongs to? That's why
    // we only consider strokes that are not already in a group.
    const ungroupedStrokes = new Set(
      Array.from(this.selectedStrokes).filter(s => !s.group)
    );
    if (ungroupedStrokes.size > 0) {
      this.currStrokeGroup = this.page.addStrokeGroup(ungroupedStrokes);
    }
  }

  fingerDownOnStroke(stroke: FreehandStroke) {
    if (this.selectedStrokes.has(stroke)) {
      const clusters = this.page.clusters.getClustersForStroke(stroke);

      if (!clusters) {
        return;
      }

      this.clusterSelectionIndex++;
      const cluster = clusters.get(
        this.clusterSelectionIndex % clusters.size()
      );

      this.clearSelection();
      for (const stroke of cluster) {
        this.select(stroke);
      }
    } else {
      this.select(stroke);
      if (this.selectedStrokes.size > 1) {
        for (const stroke of this.selectedStrokes) {
          this.page.clusters.addClusterForStroke(stroke, this.selectedStrokes);
        }
      }

      this.clusterSelectionIndex = 0;
    }
  }

  fingerDownOnEmptySpace() {
    this.clearSelection();
  }

  render() {
    // if (this.selectedStrokes) {
    //   this.selectedStrokes.render(svg)
    // }
  }

  select(stroke: FreehandStroke) {
    stroke.select();
    this.selectedStrokes.add(stroke);
  }

  clearSelection() {
    if (!this.selectedStrokes) {
      return;
    }

    for (const stroke of this.selectedStrokes) {
      stroke.deselect();
    }

    this.selectedStrokes.clear();
    this.currStrokeGroup = null;
  }
}
