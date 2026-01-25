import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ImageIcon, Loader, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddressDisplay } from "./address-display";

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  longitude: number | null;
  latitude: number | null;
}

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

export default function ReportFormModal({
  isOpen,
  onClose,
  onSuccess,
  longitude,
  latitude,
}: ReportFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    report_type: "plastic",
    severity: "medium",
    latitude: latitude,
    longitude: longitude,
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
  const [showMap, setShowMap] = useState(false);
  
  // Image handling state
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAnalyzing, categorySuggestion, analyzeImage } = useImageClassifier();
  const [aiTags, setAiTags] = useState<string[]>([]);

  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const resetForm = useCallback(() => {
    setFormData({
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
    setSuccess(false);
    setShowMap(false);
    setImagePreview([]);
    setFilesToUpload([]);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, []);

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
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));

      if (markerRef.current) {
        markerRef.current.remove();
      }
      markerRef.current = L.marker([lat, lng]).addTo(map);
    });

    mapRef.current = map;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      setFilesToUpload((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-fetch location on open if needed
  useEffect(() => {
    if (isOpen && !latitude && !longitude && "geolocation" in navigator) {
         navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => console.warn("Location error:", error)
      );
    }
  }, [isOpen, latitude, longitude]);

  const handleImageAnalysis = async (file: File) => {
    // Optional: Pass config here if we want to switch models dynamically
    const results = await analyzeImage(file); // Cast to any to access custom properties like .color
    
    if (results && results.suggestions.length > 0) {
      const topResult = results.suggestions[0];
      const colorAnalysis = results.details?.water?.colorHex;
      
      // Translate labels for UI
      const translatedTags = results.suggestions.map((r: any) => translateLabel(r.label));
      
      // Auto-fill form fields
      setFormData(prev => {
          // 1. Determine Type & Severity
          let newType = prev.report_type;
          let newSeverity = "medium";
          let detectedCondition = "";

          const lowerLabel = topResult.category.toLowerCase();
          const translatedLower = translateLabel(topResult.category).toLowerCase();
          const pLabel = (k: string) => lowerLabel.includes(k) || translatedLower.includes(k);

          // Water Context Check
          const isWaterContext = ["lake", "river", "dam", "seashore", "water", "fountain", "cliff", "danau", "sungai", "pantai", "air"].some(pLabel);
          console.log("isWaterContext", isWaterContext);
          console.log("colorAnalysis", colorAnalysis);

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
          // Pollution Detection via Color (if Water Context OR No Specific Object)
          

          // 2. Generate Smart Title
          const categoryName = translateLabel(topResult.category);
          const timeString = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          
          let generatedTitle = `Laporan ${categoryName} (${timeString})`;
          if (detectedCondition) {
              generatedTitle = `Laporan ${detectedCondition} (${timeString})`;
          }

          // 3. Generate Detailed Description
          const tagsString = translatedTags.join(", ");
          const urgencyText = newSeverity === 'high' ? "SANGAT MENDESAK" : newSeverity === 'medium' ? "Perlu perhatian" : "Dapat ditangani rutin";
          
          let generatedDesc = `Terdeteksi objek: ${tagsString}.\n`;
          
          if (detectedCondition) {
              //  generatedDesc += `Kondisi Air: ${detectedCondition} (Dominan Warna RGB: ${colorAnalysis?.r},${colorAnalysis?.g},${colorAnalysis?.b}).\n`;
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
      
      setAiTags(translatedTags);
    }
  };

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
      // 1. Upload images
      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        const uploadPromises = filesToUpload.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.filter((url): url is string => url !== null);
        
        if (uploadedUrls.length !== filesToUpload.length) {
           console.warn("Beberapa gambar gagal diupload");
        }
      }

      // 2. Submit data
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

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setFormData((prev) => ({ ...prev, latitude, longitude }));
    }
  }, [latitude, longitude]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Laporkan Sampah/Limbah</DialogTitle>
          <DialogDescription>
            Bantu kami menjaga Sungai Pekalongan dengan melaporkan sampah dan
            limbah yang Anda temukan.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
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
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Terima kasih!
            </h3>
            <p className="text-muted-foreground">
              Laporan Anda telah dikirim. Segera kami akan memproses laporan
              Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Foto Bukti (Prioritas Utama) */}
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Foto Bukti (Optional)
              </Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-teal-600 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Klik untuk upload foto
                </p>
                <p className="text-xs text-muted-foreground">
                  Format: JPG, PNG. Maks 3 foto.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handlePhotoUpload(e);
                  const files = e.target.files;
                  if (files && files[0]) {
                    handleImageAnalysis(files[0]);
                  }
                }}
                disabled={imagePreview.length >= 3}
              />

              {imagePreview.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {imagePreview.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <Loader className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {categorySuggestion.length > 0 && !isAnalyzing && (
                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Category:{" "}
                          {categorySuggestion[0].label} ({categorySuggestion[0].score}%)
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
                Deskripsi *
              </Label>
              <Textarea
                id="description"
                placeholder="Jelaskan kondisi sampah/limbah yang Anda temukan..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
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
                  id="modal_is_valuable"
                  checked={formData.is_valuable}
                  onChange={(e) =>
                    setFormData({ ...formData, is_valuable: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="modal_is_valuable" className="font-medium cursor-pointer">
                  Sampah Bernilai Ekonomis (Misal: Botol Plastik)
                </Label>
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">
                Lokasi *
              </Label>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleLocationClick}
              >
                <MapPin className="w-4 h-4 mr-2" />
                <AddressDisplay
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                />
              </Button>
              {showMap && (
                <div
                  ref={containerRef}
                  className="w-full h-64 border border-border rounded-md mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="address" className="text-base font-semibold">
                Alamat / Deskripsi Lokasi
              </Label>
              <Input
                id="address"
                placeholder="Contoh: Dekat Jembatan Kalibaru, Jalan Panjang"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="mt-2"
              />
            </div>
            
            <div className="border-t border-border pt-4">
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
                       user_name: isAnon ? "" : prev.user_name,
                       user_email: isAnon ? "" : prev.user_email,
                       user_phone: isAnon ? "" : prev.user_phone
                     }));
                  }}
                  className="rounded"
                />
                <Label
                  htmlFor="anonymous"
                  className="font-medium cursor-pointer"
                >
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
              <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-transparent"
              >
                Batal
              </Button>
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
                  "Kirim Laporan"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
