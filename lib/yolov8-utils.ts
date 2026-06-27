import * as tf from "@tensorflow/tfjs";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  score: number;
  classId: number;
}

/**
 * Preprocess image for YOLOv8
 * YOLOv8 usually expects [1, 3, 640, 640] normalized to [0, 1]
 */
export function preprocess(source: HTMLImageElement, modelWidth = 640, modelHeight = 640): [tf.Tensor, number, number] {
  const xRatio = source.width / modelWidth;
  const yRatio = source.height / modelHeight;
  
  const tensor = tf.browser.fromPixels(source)
    .resizeBilinear([modelWidth, modelHeight])
    .div(255.0)
    .expandDims(0);
    
  return [tensor, xRatio, yRatio];
}

/**
 * Process YOLOv8 output tensor
 * Output shape is usually [1, 4+num_classes, 8400]
 */
export async function processYoloOutput(
  outputTensor: tf.Tensor,
  xRatio: number,
  yRatio: number,
  labels: string[],
  confidenceThreshold = 0.25,
  iouThreshold = 0.45
): Promise<BoundingBox[]> {
  const [boxes, scores, classIndices] = tf.tidy(() => {
    // Squeeze the batch dimension, shape becomes [4+num_classes, 8400]
    const output = outputTensor.squeeze([0]);
    // Transpose to [8400, 4+num_classes]
    const transposed = output.transpose([1, 0]);

    // Split into boxes [8400, 4] and class probabilities [8400, num_classes]
    const numClasses = transposed.shape[1]! - 4;
    
    const boxes = transposed.slice([0, 0], [-1, 4]);
    const classProbs = transposed.slice([0, 4], [-1, numClasses]);

    // Get max score and corresponding class for each anchor
    const maxScores = classProbs.max(1);
    const classIndices = classProbs.argMax(1);

    return [boxes, maxScores, classIndices];
  });

  const scoresData = await scores.data();
  const boxesData = await boxes.data();
  const classIndicesData = await classIndices.data();

  // Filter out low confidence scores before NMS
  const validIndices = [];
  const validScores = [];
  const validBoxes = [];
  
  for (let i = 0; i < scoresData.length; ++i) {
    if (scoresData[i] > confidenceThreshold) {
      validIndices.push(i);
      validScores.push(scoresData[i]);
      
      // YOLOv8 box format: [x_center, y_center, width, height]
      const row = i * 4;
      const xc = boxesData[row];
      const yc = boxesData[row + 1];
      const w = boxesData[row + 2];
      const h = boxesData[row + 3];
      
      // Convert to [x1, y1, x2, y2]
      const x1 = xc - w / 2;
      const y1 = yc - h / 2;
      const x2 = xc + w / 2;
      const y2 = yc + h / 2;
      
      validBoxes.push([y1, x1, y2, x2]); // NMS expects [y1, x1, y2, x2]
    }
  }

  if (validBoxes.length === 0) {
    tf.dispose([boxes, scores, classIndices, outputTensor]);
    return [];
  }

  const boxesTensor = tf.tensor2d(validBoxes, [validBoxes.length, 4]);
  const scoresTensor = tf.tensor1d(validScores);

  // Perform Non-Maximum Suppression
  const nmsIndices = await tf.image.nonMaxSuppressionAsync(
    boxesTensor,
    scoresTensor,
    100, // max output size
    iouThreshold,
    confidenceThreshold
  );

  const selectedIndices = await nmsIndices.array();
  
  tf.dispose([boxesTensor, scoresTensor, nmsIndices, boxes, scores, classIndices, outputTensor]);

  const results: BoundingBox[] = [];
  for (let i = 0; i < selectedIndices.length; ++i) {
    const originalIndex = validIndices[selectedIndices[i]];
    const score = validScores[selectedIndices[i]];
    const classId = classIndicesData[originalIndex];
    const label = labels[classId] || `Class ${classId}`;
    
    // Original coords were stored in validBoxes as [y1, x1, y2, x2]
    // We map them back to original image size
    const box = validBoxes[selectedIndices[i]];
    
    results.push({
      x1: box[1] * xRatio,
      y1: box[0] * yRatio,
      x2: box[3] * xRatio,
      y2: box[2] * yRatio,
      score: score,
      classId: classId,
      label: label
    });
  }

  return results;
}
