import * as mobilenet from "@tensorflow-models/mobilenet";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu"; // Wajib: Backend CPU agar stabil di server
import { env, pipeline, RawImage } from '@xenova/transformers';
import { Jimp } from 'jimp';
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// --- KONFIGURASI ---
// Matikan download model lokal Transformers jika di environment serverless
env.allowLocalModels = false;
env.useBrowserCache = false;

// Set backend TFJS ke CPU (Penting untuk menghindari error binary/GLib)
tf.setBackend('cpu');

// Singleton Cache
let wasteModel: mobilenet.MobileNet | null = null;
let waterSegmenter: any = null;

// --- HELPER 1: LOAD MOBILENET (OFFICIAL) ---
async function loadMobileNet() {
    if (wasteModel) return wasteModel;
    
    console.log("Loading MobileNet Official Model...");
    // Memuat model MobileNet versi 2.1 (Sama seperti CDN)
    // alpha: 1.0 memberikan akurasi terbaik, 0.25 lebih cepat tapi kurang akurat
    wasteModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    return wasteModel;
}

// --- HELPER 2: LOAD SEGFORMER (WATER ANALYSIS) ---
async function loadWaterModel() {
    if (!waterSegmenter) {
        console.log("Loading SegFormer Model...");
        waterSegmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512');
    }
    return waterSegmenter;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Baca Gambar dengan Jimp
        const jimpImage = await Jimp.read(buffer);

        // --- PIPELINE 1: KLASIFIKASI SAMPAH (MobileNet Official) ---
        // MobileNet membutuhkan Tensor3D sebagai input
        // Kita konversi Jimp -> Tensor secara manual
        
        const wasteRunner = await loadMobileNet();
        
        // Resize agar sesuai input standar MobileNet (biasanya 224x224, tapi library ini handle resize otomatis)
        // Namun, kita konversi ke Tensor3D int32 [height, width, 3] untuk performa terbaik
        const values = new Int32Array(jimpImage.bitmap.width * jimpImage.bitmap.height * 3);
        let i = 0;
        
        jimpImage.scan(0, 0, jimpImage.bitmap.width, jimpImage.bitmap.height, (x, y, idx) => {
            // Hapus channel Alpha, ambil RGB saja
            values[i++] = jimpImage.bitmap.data[idx];     // R
            values[i++] = jimpImage.bitmap.data[idx + 1]; // G
            values[i++] = jimpImage.bitmap.data[idx + 2]; // B
        });

        const tensor = tf.tensor3d(values, [jimpImage.bitmap.height, jimpImage.bitmap.width, 3], 'int32');

        // Jalankan klasifikasi (Top 3)
        const predictions = await wasteRunner.classify(tensor, 3);
        
        // Bersihkan tensor dari memori
        tensor.dispose();

        // Format Hasil MobileNet
        // MobileNet mengembalikan: [{ className: 'giant panda', probability: 0.99 }, ...]
        const wasteSuggestions = predictions.map(p => ({
            category: p.className, // Nama kelas bahasa Inggris (misal: "water bottle")
            confidence: p.probability
        }));


        // --- PIPELINE 2: DETEKSI AIR (SegFormer Transformers) ---
        // Konversi ke RawImage untuk Transformers
        const rawImage = new RawImage(
            jimpImage.bitmap.data,
            jimpImage.bitmap.width,
            jimpImage.bitmap.height,
            4
        );
        
        const waterRunner = await loadWaterModel();
        const segments = await waterRunner(rawImage);
        
        // Analisis Segmen Air
        const waterLabels = ['water', 'sea', 'river', 'lake'];
        const waterFound = segments.filter((s: any) => 
            waterLabels.some(l => s.label.toLowerCase().includes(l))
        );

        let waterInfo = { found: false, condition: "Tidak terdeteksi", confidence: 0 };

        if (waterFound.length > 0) {
            const mask = waterFound[0].mask;
            // Sampling warna air
            const analysisImg = jimpImage.clone().resize({w:mask.width, h:mask.height});
            const maskData = mask.data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let j = 0; j < maskData.length; j++) {
                if (maskData[j] > 100) { // Area air
                    const idx = j * 4;
                    if (idx + 2 < analysisImg.bitmap.data.length) {
                        r += analysisImg.bitmap.data[idx];
                        g += analysisImg.bitmap.data[idx+1];
                        b += analysisImg.bitmap.data[idx+2];
                        count++;
                    }
                }
            }

            if (count > 0) {
                r /= count; g /= count; b /= count;
                
                // Logika Kondisi Air
                let cond = "Normal";
                if (r > g+20 && r > b+20) cond = "Keruh (Coklat/Merah)";
                else if (g > r+20 && g > b+20) cond = "Hijau (Lumut)";
                else if (b > r && b > g) cond = "Jernih (Biru)";
                else if (r < 60 && g < 60 && b < 60) cond = "Gelap/Hitam";
                else if (r > 150 && g > 140 && b < 100) cond = "Keruh (Lumpur)";
                else cond = "Keruh (Abu-abu)";

                waterInfo = {
                    found: true,
                    condition: cond,
                    confidence: waterFound[0].score || 0.9
                };
            }
        }

        // --- GABUNGKAN HASIL ---
        const finalSuggestions = [...wasteSuggestions];
        
        // Jika ada air, taruh di paling atas
        if (waterInfo.found) {
            finalSuggestions.unshift({
                category: `Air: ${waterInfo.condition}`,
                confidence: waterInfo.confidence
            });
        }

        return NextResponse.json({
            suggestions: finalSuggestions,
            details: {
                waste: wasteSuggestions,
                water: waterInfo
            }
        });

    } catch (error: any) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: error.message || "Server Error" }, { status: 500 });
    }
}