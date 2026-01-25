export interface WaterAnalysis {
    found: boolean;
    colorHex: string;
    condition: string;
    confidence: number;
}

export interface WasteDetection {
    label: string;
    score: number;
    box: any;
}

export interface ClassifyResponse {
    suggestions: Array<{
        category: string;
        confidence: number;
    }>;
    details: {
        water: WaterAnalysis;
        waste: WasteDetection[];
    };
}