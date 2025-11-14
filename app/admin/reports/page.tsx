"use client"

import { useEffect, useState } from "react"
import Header from "@/components/admin-header"
import ReportsTable from "@/components/reports-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

interface Report {
  id: string
  title: string
  description: string
  report_type: string
  severity: string
  status: string
  created_at: string
  confirmations_count: number
  user_name: string
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setReports(data)
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  useEffect(() => {
    let filtered = reports

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter)
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.report_type === typeFilter)
    }
    if (severityFilter !== "all") {
      filtered = filtered.filter((r) => r.severity === severityFilter)
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredReports(filtered)
  }, [reports, statusFilter, typeFilter, severityFilter, searchQuery])

  const handleExport = () => {
    const csv = [
      ["ID", "Judul", "Jenis", "Urgency", "Status", "Validasi", "Tanggal"],
      ...filteredReports.map((r) => [
        r.id,
        r.title,
        r.report_type,
        r.severity,
        r.status,
        r.confirmations_count,
        r.created_at,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reports-${new Date().toISOString()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading reports...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 md:px-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kelola Laporan</h1>
              <p className="text-muted-foreground mt-1">Total: {filteredReports.length} laporan</p>
            </div>
            <Button onClick={handleExport} className="bg-teal-600 hover:bg-teal-700">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cari</label>
              <Input
                placeholder="Cari judul atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Jenis</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="plastic">Plastik</SelectItem>
                  <SelectItem value="waste">Sampah Umum</SelectItem>
                  <SelectItem value="hazardous">Limbah Berbahaya</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Urgency</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reports Table */}
          <ReportsTable reports={filteredReports} />
        </div>
      </main>
    </div>
  )
}
