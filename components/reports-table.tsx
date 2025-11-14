"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface Report {
  id: string
  title: string
  report_type: string
  severity: string
  status: string
  created_at: string
  confirmations_count: number
  user_name: string
}

interface ReportsTableProps {
  reports: Report[]
}

const severityColors: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-yellow-50 text-yellow-700",
  low: "bg-green-50 text-green-700",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-green-50 text-green-700",
}

export default function ReportsTable({ reports }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Tidak ada laporan dengan filter ini</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Judul</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Jenis</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Urgency</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Validasi</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Tanggal</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-sm text-foreground font-medium">{report.title}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded text-xs bg-teal-50 text-teal-700">{report.report_type}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${severityColors[report.severity]}`}>
                    {report.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[report.status]}`}>{report.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">✓ {report.confirmations_count}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link href={`/admin/reports/${report.id}`}>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
