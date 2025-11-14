"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/header"
import { Loader, MapPin, Calendar, User, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Report {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  address: string
  severity: string
  status: string
  report_type: string
  confirmations_count: number
  user_name: string
  image_urls: string[]
  created_at: string
  is_anonymous: boolean
}

const severityLabels: Record<string, string> = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
}

const typeLabels: Record<string, string> = {
  plastic: "Plastik",
  waste: "Sampah Umum",
  hazardous: "Limbah Berbahaya",
  other: "Lainnya",
}

const statusLabels: Record<string, string> = {
  pending: "Tertunda",
  in_progress: "Sedang Diproses",
  completed: "Selesai",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
}

export default function ReportDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingReport, setConfirmingReport] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`/api/reports/${id}`)
        if (!response.ok) throw new Error("Laporan tidak ditemukan")
        const data = await response.json()
        setReport(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat laporan")
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id])

  const handleConfirmReport = async () => {
    setConfirmingReport(true)
    try {
      const response = await fetch("/api/confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: id,
          user_identifier: `user_${Math.random().toString(36).substr(2, 9)}`,
        }),
      })

      if (!response.ok) throw new Error("Gagal menambah validasi")

      setReport({
        ...report!,
        confirmations_count: report!.confirmations_count + 1,
      })
    } catch (err) {
      console.error("Error confirming report:", err)
    } finally {
      setConfirmingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-muted-foreground">Memuat laporan...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-foreground mb-4">{error || "Laporan tidak ditemukan"}</p>
            <Link href="/peta">
              <Button className="bg-teal-600 hover:bg-teal-700">Kembali ke Peta</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const formattedDate = new Date(report.created_at).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <Link href="/peta" className="text-teal-600 hover:underline mb-6 inline-block">
            ← Kembali ke Peta
          </Link>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-4">{report.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                      {typeLabels[report.report_type]}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        report.severity === "high"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : report.severity === "medium"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-green-100 text-green-700 border-green-200"
                      }`}
                    >
                      Urgency: {severityLabels[report.severity]}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[report.status]}`}
                    >
                      {statusLabels[report.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Lapor</p>
                    <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lokasi</p>
                    <p className="text-sm font-medium text-foreground">{report.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Validasi</p>
                    <p className="text-sm font-medium text-foreground">{report.confirmations_count} orang</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-3">Deskripsi</h2>
                <p className="text-muted-foreground leading-relaxed">{report.description}</p>
              </div>

              {report.image_urls && report.image_urls.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-foreground mb-3">Foto</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.image_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url || "/placeholder.svg"}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8 p-4 bg-background rounded-lg border border-border">
                <h2 className="text-lg font-bold text-foreground mb-3">Informasi Pelapor</h2>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {report.is_anonymous ? "Pelapor Anonim" : report.user_name || "Tidak diberikan"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {report.is_anonymous ? "Laporan disampaikan secara anonim" : "Kontak tersedia untuk verifikasi"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmReport}
                  disabled={confirmingReport}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {confirmingReport ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Menambah Validasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Validasi Laporan (+1)
                    </>
                  )}
                </Button>
                <Link href="/peta" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Kembali ke Peta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
