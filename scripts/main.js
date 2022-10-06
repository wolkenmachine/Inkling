habitat.registerCanvasObserver({
  clusterDragged(cluster, [dx, dy]) {
    //    habitat.moveCluster(cluster, [Math.round(dx / 50) * 50, Math.round(dy / 50) * 50]);
    //    return false; // Prevents the default handler from running
    return false;
  }
});
