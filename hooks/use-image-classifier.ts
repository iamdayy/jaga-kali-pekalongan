import { ClassifyResponse, CategorySuggestion, WasteDetection } from "@/types";
import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { preprocess, processYoloOutput } from "@/lib/yolov8-utils";
import { kMeansColor } from "@/lib/color-utils";

// Labels for your YOLOv8 model
const YOLO_LABELS = [
  "plastic", "organic", "hazardous", "metal", "glass", "paper", "fabric", "other"
];

// Model URLs (Update these paths after putting the model files in public directory)
const YOLO_MODEL_URL = "/models/yolov8n_web_model/model.json";

export function useImageClassifier() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const yoloModelRef = useRef<tf.GraphModel | null>(null);
  const classifierPipelineRef = useRef<any>(null);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        // Load YOLOv8
        if (!yoloModelRef.current) {
          yoloModelRef.current = await tf.loadGraphModel(YOLO_MODEL_URL);
        }

        // Polyfill process.env for transformers.js in the browser (especially with Turbopack)
        if (typeof process === 'undefined') {
          (window as any).process = { env: {} };
        } else if (!process.env) {
          (process as any).env = {};
        }

        // Load Zero-shot Image Classifier (CLIP)
        // We use @huggingface/transformers (V3) which is completely rewritten for the browser
        // and drops all Node.js polyfills, making it 100% compatible with Next 15/16 Turbopack
        if (!classifierPipelineRef.current) {
          // @ts-ignore
          const { pipeline, env } = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.2.4');
          env.allowLocalModels = false;
          classifierPipelineRef.current = await pipeline(
            'zero-shot-image-classification',
            'Xenova/clip-vit-base-patch32'
          );
        }

        setIsModelReady(true);
      } catch (error) {
        console.error("Failed to load models. Make sure model files exist.", error);
      }
    }
    loadModels();
  }, []);

  const analyzeImage = async (file: File): Promise<ClassifyResponse | null> => {
    if (!isModelReady || !yoloModelRef.current || !classifierPipelineRef.current) {
      console.error("Models are not loaded yet.");
      return null;
    }

    setIsAnalyzing(true);

    try {
      // 1. Load image into HTMLImageElement
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 2. YOLOv8 Inference
      const [inputTensor, xRatio, yRatio] = preprocess(img, 640, 640);
      const yoloOutput = await yoloModelRef.current.predict(inputTensor) as tf.Tensor;
      const boundingBoxes = await processYoloOutput(yoloOutput, xRatio, yRatio, YOLO_LABELS);

      const objects: WasteDetection[] = boundingBoxes.map(box => ({
        category: box.label,
        confidence: box.score,
        box: [box.x1, box.y1, box.x2, box.y2],
        polygon: [] // YOLOv8n doesn't output polygons
      }));

      // 3. Water Color Analysis (K-Means)
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Analyze the lower half of the image for water color (assuming water is usually at the bottom)
      const waterHeight = Math.floor(img.height / 2);
      const imageData = ctx.getImageData(0, img.height - waterHeight, img.width, waterHeight);
      const dominantHex = kMeansColor(imageData, 3);

      // 4. Zero-shot Classification for Water Condition
      // We pass the object URL directly to transformers.js pipeline
      const conditionClasses = ["clear water", "murky water", "brown muddy water", "polluted green water", "trash filled water"];
      const conditionResults = await classifierPipelineRef.current(imageUrl, conditionClasses);
      const bestCondition = conditionResults[0]?.label || "unknown condition";

      // 5. General Image Suggestions (Top categories)
      // Aggregate YOLO results for suggestions
      const categoryCounts: Record<string, number> = {};
      objects.forEach(obj => {
        const conf = obj.confidence || 0;
        categoryCounts[obj.category] = (categoryCounts[obj.category] || 0) + conf;
      });

      const suggestions: CategorySuggestion[] = Object.entries(categoryCounts)
        .map(([category, confidence]) => ({ category, confidence }))
        .sort((a, b) => b.confidence - a.confidence);

      URL.revokeObjectURL(imageUrl);

      return {
        suggestions,
        details: {
          water: {
            hex: dominantHex,
            condition: bestCondition
          },
          objects
        }
      };

    } catch (error) {
      console.error("Analysis failed:", error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    isModelReady,
    analyzeImage
  };
}