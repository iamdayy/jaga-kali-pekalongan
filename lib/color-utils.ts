export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

export function kMeansColor(imageData: ImageData, k: number = 3): string {
  const pixels = imageData.data;
  const numPixels = pixels.length / 4;
  
  // Randomly initialize k centroids
  let centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const randomIdx = Math.floor(Math.random() * numPixels) * 4;
    centroids.push([pixels[randomIdx], pixels[randomIdx + 1], pixels[randomIdx + 2]]);
  }
  
  const MAX_ITERATIONS = 10;
  let assignments = new Int32Array(numPixels);
  let hasChanged = true;
  let iterations = 0;
  
  while (hasChanged && iterations < MAX_ITERATIONS) {
    hasChanged = false;
    
    // Assignment step
    for (let i = 0; i < numPixels; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      
      let minDistance = Infinity;
      let closestCentroid = 0;
      
      for (let c = 0; c < k; c++) {
        const cr = centroids[c][0];
        const cg = centroids[c][1];
        const cb = centroids[c][2];
        
        // Euclidean distance squared
        const distance = (r - cr)**2 + (g - cg)**2 + (b - cb)**2;
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = c;
        }
      }
      
      if (assignments[i] !== closestCentroid) {
        assignments[i] = closestCentroid;
        hasChanged = true;
      }
    }
    
    // Update step
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);
    
    for (let i = 0; i < numPixels; i++) {
      const cluster = assignments[i];
      const idx = i * 4;
      sums[cluster][0] += pixels[idx];
      sums[cluster][1] += pixels[idx + 1];
      sums[cluster][2] += pixels[idx + 2];
      counts[cluster]++;
    }
    
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = [
          Math.floor(sums[c][0] / counts[c]),
          Math.floor(sums[c][1] / counts[c]),
          Math.floor(sums[c][2] / counts[c]),
        ];
      }
    }
    
    iterations++;
  }
  
  // Find the largest cluster
  let maxCount = 0;
  let dominantCentroid = centroids[0];
  
  const finalCounts = new Int32Array(k);
  for (let i = 0; i < numPixels; i++) {
    finalCounts[assignments[i]]++;
  }
  
  for (let c = 0; c < k; c++) {
    if (finalCounts[c] > maxCount) {
      maxCount = finalCounts[c];
      dominantCentroid = centroids[c];
    }
  }
  
  return rgbToHex(dominantCentroid[0], dominantCentroid[1], dominantCentroid[2]);
}
