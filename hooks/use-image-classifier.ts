import { useEffect, useRef, useState } from "react";

export interface CategorySuggestion {
  label: string;
  score: number;
}

export interface ModelConfig {
    type: "mobilenet" | "custom";
    modelUrl?: string; // URL to model.json (for custom files)
}

export function useImageClassifier() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion[]>([]);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker once
  useEffect(() => {
    if (!workerRef.current) {
        workerRef.current = new Worker("/model-worker.js");
        console.log("AI Worker initialized");
    }
    
    return () => {
        // workerRef.current?.terminate();
    };
  }, []);

  const analyzeImage = async (file: File, config?: ModelConfig) => {
    setIsAnalyzing(true);
    setCategorySuggestion([]);

    try {
      // 1. Resize image to 224x224 and get ImageData (Main Thread)
      const imageData = await new Promise<ImageData>((resolve, reject) => {
          const img = document.createElement("img");
          const objectUrl = URL.createObjectURL(file);
          
          img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 224;
              canvas.height = 224;
              const ctx = canvas.getContext("2d");
              if (!ctx) { reject(new Error("Canvas context failed")); return; }
              
              ctx.drawImage(img, 0, 0, 224, 224);
              resolve(ctx.getImageData(0, 0, 224, 224));
              URL.revokeObjectURL(objectUrl);
          };
          img.onerror = (e) => {
             URL.revokeObjectURL(objectUrl);
             reject(e);
          };
          img.src = objectUrl;
      });

      // 2. Send to Worker
      return new Promise<CategorySuggestion[]>((resolve, reject) => {
          if (!workerRef.current) {
              reject(new Error("Worker not initialized"));
              return;
          }

          const handler = (e: MessageEvent) => {
              // Cleanup listener
              workerRef.current?.removeEventListener("message", handler);
              
              const { success, suggestions, color, error } = e.data;
              
              if (success) {
                   const uiSuggestions = suggestions.map((s: any) => ({
                        label: s.category,
                        score: Math.round(s.confidence * 100)
                    }));
                   setCategorySuggestion(uiSuggestions);
                   // We return the raw results + color now
                   resolve(Object.assign(uiSuggestions, { color }));
              } else {
                  console.error("Worker Error:", error);
                  resolve([]);
              }
              setIsAnalyzing(false);
          };

          workerRef.current.addEventListener("message", handler);
          workerRef.current.postMessage({ imageData, config });
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
      return null;
    }
  };

  return { isAnalyzing, categorySuggestion, analyzeImage }; 
}
