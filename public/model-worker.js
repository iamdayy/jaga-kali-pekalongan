// Public Web Worker for Jaga Kali Pekalongan AI
// Loads TF.js from CDN to avoid bundler complexity for workers

importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1');

let model = null;
let isLoading = false;

async function loadModel() {
    if (model) return model;
    
    // Safety check to prevent double loading
    if (isLoading) {
        while (isLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return model;
    }

    try {
        isLoading = true;
        console.log("[Worker] Loading MobileNet (default)...");
        // Load the official MobileNet model wrapper
        model = await mobilenet.load({ version: 2, alpha: 1.0 });
        console.log("[Worker] MobileNet loaded!");
        return model;
    } catch (e) {
        console.error("[Worker] Failed to load model:", e);
        throw e;
    } finally {
        isLoading = false;
    }
}

self.onmessage = async (event) => {
    const { imageData } = event.data;

    try {
        const loadedModel = await loadModel();
        
        // MobileNet library handles tensor conversion and normalization internally
        const predictions = await loadedModel.classify(imageData, 3); // Get top 3

        console.log("[Worker] Predictions:", predictions);

        // Map MobileNet structure { className, probability } to our UI structure
        const suggestions = predictions.map(p => ({
            category: p.className,
            confidence: p.probability
        }));

        self.postMessage({ success: true, suggestions });

    } catch (error) {
        console.error("[Worker] Prediction error:", error);
        self.postMessage({ success: false, error: error.message });
    }
};
