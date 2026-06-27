"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useImageClassifier } from "@/hooks/use-image-classifier";
import { translateLabel } from "@/lib/translations";
import { uploadImage } from "@/lib/upload-image";
import { ClassifyResponse, WasteDetection } from "@/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageIcon, Loader, MapPin, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
interface FormData {
  title: string;
  description: string;
  report_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  is_anonymous: boolean;
  is_valuable: boolean;
  image_urls: string[];
}

interface ReportFormPageProps {
  onSuccess: (reportId: string) => void;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
  detections: WasteDetection[];
  isAnalyzing: boolean;
}


export default function ReportFormPage({ onSuccess }: ReportFormPageProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    report_type: "plastic",
    severity: "medium",
    latitude: null,
    longitude: null,
    address: "",
    user_name: "",
    user_email: "",
    user_phone: "",
    is_anonymous: true,
    is_valuable: false,
    image_urls: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successReportId, setSuccessReportId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [address, setAddress] = useState("Pilih lokasi di peta");
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { analyzeImage, isModelReady } = useImageClassifier();
  const [aiTags, setAiTags] = useState<string[]>([]);

  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      setAddress("Memuat alamat...");
      async function fetchAddress() {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${formData.latitude}&lon=${formData.longitude}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          setAddress(
            data && data.address ? data.display_name : "Alamat tidak ditemukan."
          );
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
          setAddress("Error memuat alamat.");
        }
      }
      fetchAddress();
    } else {
      setAddress("Pilih lokasi di peta");
    }
  }, [formData.latitude, formData.longitude]);

  const handleLocationClick = () => {
    setShowMap(true);
    setTimeout(() => initializeMap(), 100);
  };

  const initializeMap = () => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [formData.latitude || -6.8902, formData.longitude || 109.6809],
      13
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    if (formData.latitude && formData.longitude) {
      markerRef.current = L.marker([
        formData.latitude,
        formData.longitude,
      ]).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setFormData({
        ...formData,
        latitude: lat,
        longitude: lng,
      });

      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = L.marker([lat, lng]).addTo(map);
    });




  };

  const updateFormFromAnalysis = (results: ClassifyResponse) => {
     if (results && results.details.objects.length > 0) {
      const topResult = results.details.objects[0];
      const colorAnalysis = results.details?.water?.hex;
      
      const translatedTags = results.details.objects.map((r) => translateLabel(r.category as string));
      setAiTags(translatedTags);

      // Auto-fill form fields
      setFormData(prev => {
          // 1. Determine Type & Severity
          let newType = prev.report_type;
          let newSeverity = "medium";
          let detectedCondition = "";

          const lowerLabel = topResult.category.toLowerCase();
          const translatedLower = translateLabel(topResult.category).toLowerCase();
          const pLabel = (k: string) => lowerLabel.includes(k) || translatedLower.includes(k);

          // Standard Object Detection
          if (["plastic", "bottle", "bag", "cup", "container", "plastik", "botol", "kantong"].some(pLabel)) {
              newType = "plastic";
              newSeverity = "medium";
          }
          else if (["glass", "ceramic", "break", "kaca", "gelas", "pecah", "beling"].some(pLabel)) {
              newType = "waste";
              newSeverity = "medium";
          }
          else if (["battery", "chemical", "toxic", "medical", "baterai", "kimia", "racun", "limbah", "obat"].some(pLabel)) {
              newType = "hazardous";
              newSeverity = "high"; // Hazardous is always high priority
          }
          else if (["paper", "cardboard", "wood", "textile", "cloth", "kertas", "kardus", "kayu", "kain"].some(pLabel)) {
              newType = "waste";
              newSeverity = "low"; 
          }
          else if (["trash", "garbage", "rubbish", "sampah"].some(pLabel)) {
               newType = "waste";
               newSeverity = "medium";
          }


          // Pollution Detection via Color
          if (colorAnalysis) {
             const hex = colorAnalysis.replace('#', '');
             const r = parseInt(hex.substring(0, 2), 16);
             const g = parseInt(hex.substring(2, 4), 16);
             const b = parseInt(hex.substring(4, 6), 16);
             
             // Brightness (Luma)
             const brightness = (r * 299 + g * 587 + b * 114) / 1000;

             if (brightness < 75) {
              console.log("Air Keruh/Gelap");
                 detectedCondition = "Air Keruh/Gelap";
                 newSeverity = "high";
             } else if (g > r + 20 && g > b + 20) {
              console.log("Air Berlumut/Hijau");
                  detectedCondition = "Air Berlumut/Hijau";
                  newSeverity = "medium";
             } else if (r > g + 30 && r > b + 30) { // Brownish/Reddish
              console.log("Air Keruh (Kecoklatan)");
                  detectedCondition = "Air Keruh (Kecoklatan)";
                  newSeverity = "high";
             } else {
                  // Assume clearer or bluish
                  // Check if it's explicitly water context to set low severity, else keep object detection severity
                  // But user asked to check condition, so we can optimistically say it's clear
                  if (!newSeverity || newSeverity === "medium") { // Only downgrade if not already high
                      console.log("Air Jernih");
                      detectedCondition = "Air Jernih";
                      newSeverity = "low";
                  }
             }
          }

          // 2. Generate Smart Title
          const categoryName = translateLabel(topResult.category);
          const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          
          let generatedTitle = `Laporan ${categoryName} (${timeString})`;
          if (detectedCondition) {
              generatedTitle = `Laporan ${detectedCondition} - ${categoryName} (${timeString})`;
          }

          // 3. Generate Detailed Description
          const tagsString = translatedTags.join(", ");
          const urgencyText = newSeverity === 'high' ? "SANGAT MENDESAK" : newSeverity === 'medium' ? "Perlu perhatian" : "Dapat ditangani rutin";
          
          let generatedDesc = `Terdeteksi objek: ${tagsString}.\n`;
          
          if (detectedCondition) {
             generatedDesc += `Kondisi Air: ${detectedCondition} (Hex: ${colorAnalysis}).\n`;
          }
          
          generatedDesc += `Kategori: ${newType.toUpperCase()}.\n` +
                           `Tingkat Urgensi: ${urgencyText}.\n` +
                           `Mohon segera ditindaklanjuti tim terkait.`;

          return {
              ...prev,
              title: prev.title || generatedTitle,
              description: prev.description || generatedDesc,
              report_type: newType,
              severity: newSeverity
          };
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = async () => {
             const newId = Math.random().toString(36).substr(2, 9);
             
             // Initial state
             setUploadedImages(prev => [...prev, {
                 id: newId,
                 file,
                 preview: base64,
                 width: img.width,
                 height: img.height,
                 detections: [],
                 isAnalyzing: true
             }]);

             // Analyze
             try {
                const results = await analyzeImage(file);
                
                setUploadedImages(prev => prev.map(item => {
                    if (item.id === newId) {
                        return {
                            ...item,
                            detections: results?.details?.objects || [],
                            isAnalyzing: false
                        };
                    }
                    return item;
                }));

                // Update form with the first valid result (or all)
                // We'll just run it for every image, latest wins or we can check logic
                if (results) {
                    updateFormFromAnalysis(results);
                }

             } catch (err) {
                 console.error("Analysis error", err);
                 setUploadedImages(prev => prev.map(item => 
                    item.id === newId ? { ...item, isAnalyzing: false } : item
                 ));
             }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Auto-fetch location on mount
  useEffect(() => {
    if (!formData.latitude && !formData.longitude && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => {
           console.warn("Location access denied or failed", error);
           setAddress("Lokasi tidak dapat diambil otomatis. Silakan pilih di peta.");
        }
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (
      !formData.title ||
      !formData.description ||
      formData.latitude === null ||
      formData.longitude === null
    ) {
      setError("Mohon isi semua field yang diperlukan");
      setLoading(false);
      return;
    }

    try {
      // 1. Upload foto ke Supabase Storage (jika ada)
      let uploadedUrls: string[] = [];
      const imagesToUpload = uploadedImages.map(img => img.file);
      
      if (imagesToUpload.length > 0) {
        const uploadPromises = imagesToUpload.map(file => {
          const fd = new FormData();
          fd.append("file", file);
          return uploadImage(fd);
        });
        const results = await Promise.all(uploadPromises);
        
        // Filter yang berhasil (tidak null)
        uploadedUrls = results.filter((url): url is string => url !== null);
        
        if (uploadedUrls.length !== imagesToUpload.length) {
           console.warn("Beberapa gambar gagal diupload");
           // Opsional: Tampilkan warning ke user atau stop process
        }
      }

      // 2. Siapkan data final
      const dataToSubmit = {
        ...formData,
        image_urls: uploadedUrls
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengirim laporan");
      }

      const data = await response.json();
      setSuccess(true);
      setSuccessReportId(data.id);
      setSuccessReport(data.id);
      setTimeout(() => {
        onSuccess(data.id);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const setSuccessReport = (id: string) => {
    setSuccessReportId(id);
  };

  if (success && successReportId) {
    return (
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Terima Kasih!
          </h2>
          <p className="text-muted-foreground mb-6">
            Laporan Anda telah berhasil dikirim. Segera kami akan memproses
            laporan Anda.
          </p>
          <div className="flex gap-3">
            <Link href="/peta" className="flex-1">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">
                Lihat di Peta
              </Button>
            </Link>
            <Link href={`/lapor/${successReportId}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Detail Laporan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Laporkan Masalah Sungai
        </h1>
        <p className="text-muted-foreground">
          Bantu kami menjaga Sungai Pekalongan dengan melaporkan sampah dan
          limbah yang Anda temukan secara detail.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-lg border border-border p-8 space-y-6"
      >
        {/* 1. Foto Bukti (Prioritas Utama) */}
        <div>
          <Label className="text-base font-semibold mb-2 block">
            Foto Bukti (Optional)
          </Label>
          <div
            className={`border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors ${!isModelReady ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-teal-600"}`}
            onClick={() => isModelReady && fileInputRef.current?.click()}
          >
            {isModelReady ? (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Klik untuk upload foto
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG hingga 5MB per foto (Maks 3 foto)
                </p>
              </>
            ) : (
              <>
                <Loader className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Sedang memuat AI Model...
                </p>
                <p className="text-xs text-muted-foreground">
                  Mohon tunggu beberapa saat sebelum mengunggah foto.
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={uploadedImages.length >= 3}
          />

          {uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedImages.map((img, idx) => (
                <div key={img.id} className="relative group border border-border rounded-lg overflow-hidden bg-black/5">
                  <div className="relative">
                    <img
                      src={img.preview || "/placeholder.svg"}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-48 object-contain"
                    />
                    
                    {/* SVG Overlay for Polygons */}
                    {img.detections.length > 0 && (
                        <svg 
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox={`0 0 ${img.width} ${img.height}`}
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {img.detections.map((det, i) => {
                                // Draw Polygon if available
                                if (det.polygon && det.polygon.length > 0) {
                                  const points = det.polygon.map(p => p.join(",")).join(" ");
                                  return (
                                    <polygon
                                        key={i}
                                        points={points}
                                        fill="rgba(20, 184, 166, 0.3)" // Teal transparent
                                        stroke="#0d9488" // Teal 600
                                        strokeWidth="2"
                                    />
                                  );
                                }
                                // Fallback to Box if no polygon
                                if (det.box && det.box.length === 4) {
                                  const [x1, y1, x2, y2] = det.box;
                                  return (
                                    <rect
                                        key={i}
                                        x={x1}
                                        y={y1}
                                        width={x2 - x1}
                                        height={y2 - y1}
                                        fill="rgba(20, 184, 166, 0.3)"
                                        stroke="#0d9488"
                                        strokeWidth="2"
                                    />
                                  );
                                }
                                return null;
                            })}
                        </svg>
                    )}
                  </div>

                  {/* Info Badge */}
                  {img.detections.length > 0 && (
                     <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                         {img.detections.map((d, i) => (
                             <span key={i} className="bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                 {d.label || d.category || "Object"} ({Math.round((d.confidence || d.score || 0) * 100)}%)
                             </span>
                         ))}
                     </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-100 hover:bg-red-700 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {img.isAnalyzing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <div className="text-center">
                          <Loader className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                          <p className="text-white text-xs font-medium">Menganalisis...</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Informasi Dasar */}
        <div>
          <Label htmlFor="title" className="text-base font-semibold">
            Judul Laporan *
          </Label>
          <Input
            id="title"
            placeholder="Contoh: Tumpukan Plastik di Jembatan Kalibaru"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-semibold">
            Deskripsi Detail *
          </Label>
          <Textarea
            id="description"
            placeholder="Jelaskan kondisi sampah/limbah yang Anda temukan. Berapa banyak? Apa dampaknya? Informasi akan membantu kami untuk tindakan cepat."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={5}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type" className="text-base font-semibold">
              Jenis Sampah *
            </Label>
            <Select
              value={formData.report_type}
              onValueChange={(value) =>
                setFormData({ ...formData, report_type: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plastic">Plastik</SelectItem>
                <SelectItem value="waste">Sampah Umum</SelectItem>
                <SelectItem value="hazardous">Limbah Berbahaya</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="severity" className="text-base font-semibold">
              Tingkat Urgency *
            </Label>
            <Select
              value={formData.severity}
              onValueChange={(value) =>
                setFormData({ ...formData, severity: value })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah - Belum mendesak</SelectItem>
                <SelectItem value="medium">
                  Sedang - Perlu diperhatikan
                </SelectItem>
                <SelectItem value="high">Tinggi - Sangat mendesak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <input
              type="checkbox"
              id="is_valuable"
              checked={formData.is_valuable}
              onChange={(e) =>
                setFormData({ ...formData, is_valuable: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="is_valuable" className="font-medium cursor-pointer">
              Sampah Bernilai Ekonomis (Misal: Botol Plastik, Kardus)
            </Label>
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Lokasi *</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleLocationClick}
          >
            <MapPin className="w-4 h-4 mr-2" />
            <p className="text-sm text-wrap">{address}</p>
          </Button>
          {showMap && (
            <div
              ref={containerRef}
              className="w-full h-80 border border-border rounded-md mt-3"
            />
          )}
        </div>

        <div>
          <Label htmlFor="address" className="text-base font-semibold">
            Alamat / Deskripsi Lokasi
          </Label>
          <Input
            id="address"
            placeholder="Contoh: Dekat Jembatan Kalibaru, Jalan Panjang, Kelurahan..."
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            className="mt-2"
          />
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => {
                const isAnon = e.target.checked;
                setFormData(prev => ({
                   ...prev, 
                   is_anonymous: isAnon,
                   // Clear data if switching TO anonymous
                   user_name: isAnon ? "" : prev.user_name,
                   user_email: isAnon ? "" : prev.user_email,
                   user_phone: isAnon ? "" : prev.user_phone
                }));
              }}
              className="rounded"
            />
            <Label htmlFor="anonymous" className="font-medium cursor-pointer">
              Laporan Anonim (Identitas Anda tidak akan ditampilkan)
            </Label>
          </div>

          {!formData.is_anonymous && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm">
                  Nama
                </Label>
                <Input
                  id="name"
                  placeholder="Nama Anda"
                  value={formData.user_name}
                  onChange={(e) =>
                    setFormData({ ...formData, user_name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={formData.user_email}
                  onChange={(e) =>
                    setFormData({ ...formData, user_email: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm">
                  Telepon
                </Label>
                <Input
                  id="phone"
                  placeholder="Nomor Telepon"
                  value={formData.user_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, user_phone: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm">
            <p className="font-semibold mb-1">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-6">
          <Link href="/peta" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Laporan Lengkap"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
