import { useEffect, useRef, useState } from "react";

export interface CategorySuggestion {
  label: string;
  score: number;
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
        // Optional: terminate on unmount if we want to save memory, 
        // but keeping it alive for single-page nav might be better. 
        // For now, let's keep it simple.
    };
  }, []);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setCategorySuggestion([]);

    try {
      // 1. Resize image to 224x224 and get ImageData (Main Thread)
      const imageData = await new Promise<ImageData>((resolve, reject) => {
          const img = document.createElement("img");
          img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 224;
              canvas.height = 224;
              const ctx = canvas.getContext("2d");
              if (!ctx) { reject(new Error("Canvas context failed")); return; }
              
              ctx.drawImage(img, 0, 0, 224, 224);
              resolve(ctx.getImageData(0, 0, 224, 224));
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
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
              
              const { success, suggestions, error } = e.data;
              
              if (success) {
                   const uiSuggestions = suggestions.map((s: any) => ({
                        label: s.category,
                        score: Math.round(s.confidence * 100)
                    }));
                   setCategorySuggestion(uiSuggestions);
                   resolve(uiSuggestions);
              } else {
                  console.error("Worker Error:", error);
                  resolve([]);
              }
              setIsAnalyzing(false);
          };

          workerRef.current.addEventListener("message", handler);
          workerRef.current.postMessage({ imageData });
      });

    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
      return null;
    }
  };

  return { isAnalyzing, categorySuggestion, analyzeImage, model: null }; // No direct access to model
}
