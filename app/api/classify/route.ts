
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu"; // Use CPU backend for Node.js environment
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

// Disable TF.js deprecation warnings and optimizations that might spam logs
tf.env().set("IS_BROWSER", false);

const CLASSES = [
  "Battery",
  "Biological",
  "Brown-Glass",
  "Cardboard",
  "Clothes",
  "Green-Glass",
  "Metal",
  "Paper",
  "Plastic",
  "Shoes",
  "Trash",
  "White-Glass",
];

// Singleton to hold the model in server memory
let model: tf.LayersModel | null = null;

// Helper to load model manually (since fetch file:// is not supported in pure Node/TFJS)
async function loadModel() {
  if (model) return model;

  try {
    // Check backend status
    console.log(`Current TF Backend: ${tf.getBackend()}`);
    if (tf.getBackend() !== 'cpu') {
        console.log("Setting backend to cpu...");
        await tf.setBackend('cpu');
    }
    await tf.ready();

    const modelDir = path.join(process.cwd(), "public", "model");
    const modelJsonPath = path.join(modelDir, "model.json");
    
    // 1. Read model.json
    console.log(`Reading model JSON from ${modelJsonPath}`);
    const modelJsonContent = fs.readFileSync(modelJsonPath, "utf-8");
    const parsedJson = JSON.parse(modelJsonContent);

    // 2. Read weights and collect specs
    const weightDataBuffers: Buffer[] = [];
    const weightSpecs: any[] = [];
    
    if (parsedJson.weightsManifest) {
        for (const manifest of parsedJson.weightsManifest) {
            // Collect specs
            weightSpecs.push(...manifest.weights);
            
            // Read binary files
            for (const filename of manifest.paths) {
                const weightPath = path.join(modelDir, filename);
                console.log(`Reading weight file: ${weightPath}`);
                const buffer = fs.readFileSync(weightPath);
                weightDataBuffers.push(buffer);
            }
        }
    }

    // 3. Concatenate weights
    const totalLength = weightDataBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const weightData = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of weightDataBuffers) {
        weightData.set(buf, offset);
        offset += buf.length;
    }
    console.log(`Total weight size: ${totalLength} bytes`);

    // 4. Load using fromMemory
    // Construct a clean ModelArtifacts object.
    // Important: Do NOT pass weightsManifest if we pass weightSpecs + weightData, to avoid ambiguity.
    const artifacts = {
        modelTopology: parsedJson.modelTopology,
        format: parsedJson.format,
        generatedBy: parsedJson.generatedBy,
        convertedBy: parsedJson.convertedBy,
        weightSpecs: weightSpecs,
        weightData: weightData.buffer
    };
    
    console.log("Loading layers model from artifacts...");
    model = await tf.loadLayersModel(tf.io.fromMemory(artifacts));
    
    console.log("Model loaded successfully via fs.");
    return model;

  } catch (error) {
    console.error("Failed to load model on server:", error);
    throw error;
  }
}

// Manual image decoding for Node.js
// @ts-ignore
import jpeg from "jpeg-js";
// @ts-ignore
import { PNG } from "pngjs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Ensure model is loaded (cached)
    const loadedModel = await loadModel();

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Decode and Preprocess Image
    const predictions = await tf.tidy(() => {
      let tensor: tf.Tensor3D | null = null;
      
      // Try Decoding as JPEG
      try {
        const decoded = jpeg.decode(buffer, { useTArray: true }); // returns { width, height, data: Uint8Array }
        // Create tensor from raw data [width, height, 4] (RGBA)
        const rawTensor = tf.tensor3d(decoded.data, [decoded.height, decoded.width, 4]);
        // Remove Alpha channel to get RGB
        tensor = rawTensor.slice([0, 0, 0], [-1, -1, 3]);
      } catch (e) {
         // Not JPEG, try PNG
         try {
             const png = PNG.sync.read(buffer);
             const rawTensor = tf.tensor3d(png.data, [png.height, png.width, 4]);
             tensor = rawTensor.slice([0, 0, 0], [-1, -1, 3]);
         } catch(pngError) {
             console.error("Failed to decode image as JPEG or PNG");
         }
      }

      if (!tensor) {
          throw new Error("Unsupported image format. Please upload JPG or PNG.");
      }
      
      // Resize to 224x224
      const resized = tf.image.resizeBilinear(tensor, [224, 224]);
      
      // Normalize (0-1)
      const normalized = resized.div(255.0);
      
      // Expand dims to match batch shape [1, 224, 224, 3]
      const batch = normalized.expandDims(0);
      
      // Predict
      return loadedModel.predict(batch) as tf.Tensor;
    });

    const values = await predictions.data();
    predictions.dispose(); // Cleanup

    // Process results
    const topK = Array.from(values)
        .map((value, index) => ({
          category: CLASSES[index],
          confidence: value,
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3); 

    return NextResponse.json({ suggestions: topK });

  } catch (error) {
    console.error("Server API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
