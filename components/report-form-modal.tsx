"use client";

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
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader, MapPin } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
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
    });
    setSuccess(false);
    setShowMap(false);
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
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Gagal mengirim laporan");

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 2000);
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
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  onChange={(e) =>
                    setFormData({ ...formData, is_anonymous: e.target.checked })
                  }
                  className="rounded"
                />
                <Label
                  htmlFor="anonymous"
                  className="font-medium cursor-pointer"
                >
                  Laporan Anonim
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
