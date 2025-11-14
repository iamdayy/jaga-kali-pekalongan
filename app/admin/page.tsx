"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/admin-header"
import DashboardStats from "@/components/dashboard-stats"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardData {
  totalReports: number
  pendingReports: number
  inProgressReports: number
  completedReports: number
  reportsByType: Record<string, number>
  reportsBySeverity: Record<string, number>
  recentReports: any[]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/reports")
        if (!response.ok) throw new Error("Failed to fetch")

        const reports = await response.json()

        const data: DashboardData = {
          totalReports: reports.length,
          pendingReports: reports.filter((r: any) => r.status === "pending").length,
          inProgressReports: reports.filter((r: any) => r.status === "in_progress").length,
          completedReports: reports.filter((r: any) => r.status === "completed").length,
          reportsByType: reports.reduce((acc: Record<string, number>, r: any) => {
            acc[r.report_type] = (acc[r.report_type] || 0) + 1
            return acc
          }, {}),
          reportsBySeverity: reports.reduce((acc: Record<string, number>, r: any) => {
            acc[r.severity] = (acc[r.severity] || 0) + 1
            return acc
          }, {}),
          recentReports: reports.slice(0, 5),
        }

        setDashboardData(data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 md:px-6 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
              <p className="text-muted-foreground mt-1">Kelola dan pantau semua laporan sampah</p>
            </div>
            <Link href="/admin/reports">
              <Button className="bg-teal-600 hover:bg-teal-700">Kelola Laporan</Button>
            </Link>
          </div>

          {dashboardData && <DashboardStats data={dashboardData} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Reports */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Laporan Terbaru</h2>
              <div className="space-y-3">
                {dashboardData?.recentReports.map((report) => (
                  <Link key={report.id} href={`/admin/reports/${report.id}`}>
                    <div className="p-3 rounded-lg border border-border hover:border-teal-600 cursor-pointer transition-colors">
                      <p className="font-medium text-foreground text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Ringkasan Status</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending:</span>
                  <span className="font-semibold text-yellow-600">{dashboardData?.pendingReports || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress:</span>
                  <span className="font-semibold text-blue-600">{dashboardData?.inProgressReports || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-semibold text-green-600">{dashboardData?.completedReports || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
