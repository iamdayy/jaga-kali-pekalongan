import { ClassifyResponse } from "@/types";
import { useState } from "react";

export interface CategorySuggestion {
  label: string;
  score: number;
}

// Interface untuk data detail baru
export interface AnalysisResult {
    water?: {
        found: boolean;
        colorHex: string;
        condition: string;
    };
    waste?: Array<{
        label: string;
        score: number;
        box: any;
    }>;
}

export function useImageClassifier() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categorySuggestion, setCategorySuggestion] = useState<CategorySuggestion[]>([]);
  const [detailedResult, setDetailedResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setCategorySuggestion([]);
    setDetailedResult(null);

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

        // Mapping response API ke state UI
        // Data.suggestions berisi array sederhana untuk kompatibilitas
        if (data.suggestions) {
             const formattedSuggestions = data.suggestions.map((s: any) => ({
                label: s.category,
                score: Math.round(s.confidence * 100)
            }));
            setCategorySuggestion(formattedSuggestions);
        }

        // Simpan data detail (warna air, posisi sampah) untuk UI lanjutan
        if (data.details) {
            setDetailedResult(data.details);
        }
        
        // Kembalikan data untuk komponen yang memanggil langsung
        return {
            suggestions: data.suggestions,
            details: data.details
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
      categorySuggestion, // Kompatibel dengan UI lama
      detailedResult,     // Data baru (Warna air, dll)
      analyzeImage 
  }; 
}