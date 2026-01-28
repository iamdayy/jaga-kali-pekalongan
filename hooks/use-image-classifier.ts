import { ClassifyResponse } from "@/types";
import { useState } from "react";



export function useImageClassifier() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);

    try {
        const formData = new FormData();
        formData.append("image", file);

        // Panggil API Next.js kita
        const response = await fetch("/api/classify", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Gagal menganalisis gambar");
        }

        const data: ClassifyResponse = await response.json();
        
        // Kembalikan data mentah dari API tanpa filtering
        return data;

    } catch (error) {
        console.error("Analysis failed:", error);
        return null;
    } finally {
        setIsAnalyzing(false);
    }
  };

  return { 
      isAnalyzing,
      analyzeImage 
  }; 
}