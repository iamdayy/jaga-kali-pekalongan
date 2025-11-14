"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader, Trash2 } from "lucide-react"
import Link from "next/link"
import ConfirmationDialog from "@/components/confirmation-dialog"

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
  admin_notes: string | null
  assigned_to: string | null
}

interface AdminLog {
  id: string
  action: string
  admin_user: string
  details: any
  created_at: string
}

const statusLabels: Record<string, string> = {
  pending: "Tertunda",
  in_progress: "Sedang Diproses",
  completed: "Selesai",
}

export default function AdminReportEditorPage() {
  const params = useParams()
  const id = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, logsRes] = await Promise.all([
          fetch(`/api/reports/${id}`),
          fetch(`/api/admin/logs?reportId=${id}`),
        ])

        if (!reportRes.ok) throw new Error("Failed to fetch report")

        const reportData = await reportRes.json()
        setReport(reportData)
        setNewStatus(reportData.status)
        setAdminNotes(reportData.admin_notes || "")

        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setAdminLogs(logsData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading report")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleStatusChange = async () => {
    if (newStatus === report?.status) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          updates: { status: newStatus, last_updated_by: "admin" },
        }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      const updated = await response.json()
      setReport(updated)

      // Log the action
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          action: "status_update",
          adminUser: "admin",
          details: { from: report?.status, to: newStatus },
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating status")
    } finally {
      setSaving(false)
    }
  }

  const handleNotesUpdate = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          updates: { admin_notes: adminNotes, last_updated_by: "admin" },
        }),
      })

      if (!response.ok) throw new Error("Failed to update notes")

      const updated = await response.json()
      setReport(updated)

      // Log the action
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          action: "note_added",
          adminUser: "admin",
          details: { note: adminNotes },
        }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating notes")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReport = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete report")

      // Log the action
      await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: id,
          action: "report_deleted",
          adminUser: "admin",
          details: { reason: "admin_delete" },
        }),
      })

      // Redirect to reports list
      setTimeout(() => {
        window.location.href = "/admin/reports"
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting report")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error && !report) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-foreground mb-4">{error}</p>
            <Link href="/admin/reports">
              <Button className="bg-teal-600 hover:bg-teal-700">Back to Reports</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!report) return null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl space-y-6">
          <Link href="/admin/reports" className="text-teal-600 hover:underline inline-block">
            ← Back to Reports
          </Link>

          <div className="bg-card rounded-lg border border-border p-6 md:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">{report.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded-lg border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Jenis</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{report.report_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Urgency</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{report.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Validasi</p>
                  <p className="text-sm font-semibold text-foreground mt-1">✓ {report.confirmations_count}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Deskripsi</h2>
              <p className="text-muted-foreground leading-relaxed">{report.description}</p>
            </div>

            {/* Status Management */}
            <div className="p-4 bg-background rounded-lg border border-border">
              <h2 className="text-lg font-bold text-foreground mb-4">Kelola Status</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="md:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleStatusChange}
                  disabled={saving || newStatus === report.status}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : "Update Status"}
                </Button>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">Catatan Admin</h2>
              <Textarea
                placeholder="Tambahkan catatan tentang laporan ini..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="mb-3"
              />
              <Button
                onClick={handleNotesUpdate}
                disabled={saving || adminNotes === report.admin_notes}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : "Simpan Catatan"}
              </Button>
            </div>

            {/* Admin Logs */}
            {adminLogs.length > 0 && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4">Riwayat Admin</h2>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {adminLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-teal-600 pl-4 py-2">
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">by {log.admin_user}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="p-4 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

            {/* Delete Section */}
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Danger Zone</h2>
              <Button onClick={() => setDeleteConfirmOpen(true)} className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus Laporan
              </Button>
            </div>
          </div>
        </div>
      </main>

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Hapus Laporan"
        description="Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus secara permanen dari sistem."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
        loading={saving}
        onConfirm={handleDeleteReport}
      />
    </div>
  )
}
