// Public Web Worker for Jaga Kali Pekalongan AI
// Loads TF.js from CDN to avoid bundler complexity for workers

importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1');

let model = null;
let currentModelType = 'mobilenet'; // 'mobilenet' or 'custom'
let customLabels = [];
let isLoading = false;

async function loadModel(config) {
    const modelType = config?.type || 'mobilenet';
    const modelUrl = config?.modelUrl;

    // Return existing if same type and (for customized) same URL not changed
    if (model && currentModelType === modelType) {
        return model;
    }
    
    // Safety check to prevent double loading
    if (isLoading) {
        while (isLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return model;
    }

    try {
        isLoading = true;
        
        if (modelType === 'custom' && modelUrl) {
            console.log(`[Worker] Loading Custom Model from ${modelUrl}...`);
            // Load custom model (Teachable Machine / Keras converted)
            // Expects model.json at the URL
            const modelJson = modelUrl.endsWith('model.json') ? modelUrl : `${modelUrl}model.json`;
            const metadataJson = modelUrl.endsWith('model.json') ? modelUrl.replace('model.json', 'metadata.json') : `${modelUrl}metadata.json`;

            // Load model
            model = await tf.loadLayersModel(modelJson);
            
            // Try loading metadata for labels
            try {
                const response = await fetch(metadataJson);
                const metadata = await response.json();
                customLabels = metadata.labels; // TM exports labels in metadata.json
                console.log("[Worker] Custom labels loaded:", customLabels);
            } catch (e) {
                console.warn("[Worker] Could not load metadata.json for labels. Using index.", e);
                customLabels = []; 
            }
            
            currentModelType = 'custom';
            console.log("[Worker] Custom Model loaded!");
        } else {
            console.log("[Worker] Loading MobileNet (default)...");
            // Load the official MobileNet model wrapper
            model = await mobilenet.load({ version: 2, alpha: 1.0 });
            currentModelType = 'mobilenet';
            console.log("[Worker] MobileNet loaded!");
        }
        
        return model;
    } catch (e) {
        console.error("[Worker] Failed to load model:", e);
        throw e;
    } finally {
        isLoading = false;
    }
}

// Helper to analyze dominant color
function analyzeColor(imageData) {
    const { data, width, height } = imageData;
    let r = 0, g = 0, b = 0;
    let count = 0;

    // Simple Geometric Masking: Skip top 35% of the image (Sky/Horizon)
    const startRow = Math.floor(height * 0.35);
    const startIndex = startRow * width * 4;

    for (let i = startIndex; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
    }

    if (count === 0) return { r: 0, g: 0, b: 0, hex: "#000000" };

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    return { r, g, b, hex: `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}` };
}

self.onmessage = async (event) => {
    const { imageData, config } = event.data;

    try {
        const loadedModel = await loadModel(config);
        
        // Analyze color
        const color = analyzeColor(imageData);
        console.log("[Worker] Dominant Color:", color);
        
        let suggestions = [];

        if (currentModelType === 'mobilenet') {
            // MobileNet library handles tensor conversion and normalization internally
            const predictions = await loadedModel.classify(imageData, 3); // Get top 3
            console.log("[Worker] MobileNet Predictions:", predictions);

            suggestions = predictions.map(p => ({
                category: p.className,
                confidence: p.probability
            }));

        } else if (currentModelType === 'custom') {
            // Manual prediction for Custom Model
            const parsedTensor = tf.tidy(() => {
                let tensor = tf.browser.fromPixels(imageData)
                    .resizeNearestNeighbor([224, 224])
                    .toFloat();
                
                 const offset = tf.scalar(127.5);
                 return tensor.sub(offset).div(offset).expandDims();
            });

            const prediction = await loadedModel.predict(parsedTensor).data();
            parsedTensor.dispose();

            // Map predictions to labels
            const results = Array.from(prediction)
                .map((p, i) => ({
                    category: customLabels[i] || `Class ${i}`,
                    confidence: p
                }))
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 3);

            console.log("[Worker] Custom Predictions:", results);
            suggestions = results;
        }

        self.postMessage({ success: true, suggestions, color });

    } catch (error) {
        console.error("[Worker] Prediction error:", error);
        self.postMessage({ success: false, error: error.message });
    }
};
