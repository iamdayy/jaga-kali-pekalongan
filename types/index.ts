export interface WaterAnalysis {
    hex: string;
    condition: string;
}

export interface WasteDetection {
    label?: string; // Legacy/frontend mapped
    category: string; // API raw
    score?: number; // Legacy/frontend mapped
    confidence?: number; // API raw
    box: number[];
    polygon: number[][];
}
export interface CategorySuggestion {
    category: string;
    confidence: number;
}

export interface AnalysisDetails {
    water: WaterAnalysis;
    objects: WasteDetection[];
}

export interface ClassifyResponse {
    suggestions: CategorySuggestion[];
    details: AnalysisDetails;
}