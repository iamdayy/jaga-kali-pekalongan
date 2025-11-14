"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader, MapPin, ImageIcon, X } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import Link from "next/link"

interface FormData {
  title: string
  description: string
  report_type: string
  severity: string
  latitude: number | null
  longitude: number | null
  address: string
  user_name: string
  user_email: string
  user_phone: string
  is_anonymous: boolean
  image_urls: string[]
}

interface ReportFormPageProps {
  onSuccess: (reportId: string) => void
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
    image_urls: [],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successReportId, setSuccessReportId] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLocationClick = () => {
    setShowMap(true)
    setTimeout(() => initializeMap(), 100)
  }

  const initializeMap = () => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView([formData.latitude || -6.8902, formData.longitude || 109.6809], 13)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    if (formData.latitude && formData.longitude) {
      markerRef.current = L.marker([formData.latitude, formData.longitude]).addTo(map)
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setFormData({
        ...formData,
        latitude: lat,
        longitude: lng,
      })

      if (markerRef.current) {
        markerRef.current.remove()
      }
      markerRef.current = L.marker([lat, lng]).addTo(map)
    })

    mapRef.current = map
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setImagePreview((prev) => [...prev, base64])
        // In production, upload to Vercel Blob here
        // For now, we'll store as base64 - ready for Blob integration
        setFormData((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, base64],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index))
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.title || !formData.description || formData.latitude === null || formData.longitude === null) {
      setError("Mohon isi semua field yang diperlukan")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Gagal mengirim laporan")

      const data = await response.json()
      setSuccess(true)
      setSuccessReportId(data.id)
      setSuccessReport(data.id)
      setTimeout(() => {
        onSuccess(data.id)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const setSuccessReport = (id: string) => {
    setSuccessReportId(id)
  }

  if (success && successReportId) {
    return (
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Terima Kasih!</h2>
          <p className="text-muted-foreground mb-6">
            Laporan Anda telah berhasil dikirim. Segera kami akan memproses laporan Anda.
          </p>
          <div className="flex gap-3">
            <Link href="/peta" className="flex-1">
              <Button className="w-full bg-teal-600 hover:bg-teal-700">Lihat di Peta</Button>
            </Link>
            <Link href={`/lapor/${successReportId}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Detail Laporan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Laporkan Masalah Sungai</h1>
        <p className="text-muted-foreground">
          Bantu kami menjaga Sungai Pekalongan dengan melaporkan sampah dan limbah yang Anda temukan secara detail.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-8 space-y-6">
        <div>
          <Label htmlFor="title" className="text-base font-semibold">
            Judul Laporan *
          </Label>
          <Input
            id="title"
            placeholder="Contoh: Tumpukan Plastik di Jembatan Kalibaru"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              onValueChange={(value) => setFormData({ ...formData, report_type: value })}
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
            <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah - Belum mendesak</SelectItem>
                <SelectItem value="medium">Sedang - Perlu diperhatikan</SelectItem>
                <SelectItem value="high">Tinggi - Sangat mendesak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Lokasi *</Label>
          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleLocationClick}>
            <MapPin className="w-4 h-4 mr-2" />
            {formData.latitude
              ? `Lat: ${formData.latitude.toFixed(4)}, Lon: ${formData.longitude?.toFixed(4)}`
              : "Klik untuk Pilih Lokasi di Peta"}
          </Button>
          {showMap && <div ref={containerRef} className="w-full h-80 border border-border rounded-md mt-3" />}
        </div>

        <div>
          <Label htmlFor="address" className="text-base font-semibold">
            Alamat / Deskripsi Lokasi
          </Label>
          <Input
            id="address"
            placeholder="Contoh: Dekat Jembatan Kalibaru, Jalan Panjang, Kelurahan..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Foto Bukti (Optional)</Label>
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-teal-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Klik untuk upload foto</p>
            <p className="text-xs text-muted-foreground">PNG, JPG hingga 5MB per foto (Maks 3 foto)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
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
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
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
                  onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
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
            <Button type="button" variant="outline" className="w-full bg-transparent">
              Batal
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
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
  )
}
