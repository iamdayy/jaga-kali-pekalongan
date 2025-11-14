"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStatsProps {
  data: {
    totalReports: number
    pendingReports: number
    inProgressReports: number
    completedReports: number
    reportsByType: Record<string, number>
    reportsBySeverity: Record<string, number>
  }
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const statusData = [
    { name: "Pending", value: data.pendingReports, fill: "#eab308" },
    { name: "In Progress", value: data.inProgressReports, fill: "#3b82f6" },
    { name: "Completed", value: data.completedReports, fill: "#16a34a" },
  ]

  const typeData = Object.entries(data.reportsByType).map(([type, count]) => ({
    name: type,
    count,
  }))

  const severityData = [
    { name: "High", value: data.reportsBySeverity["high"] || 0, fill: "#dc2626" },
    { name: "Medium", value: data.reportsBySeverity["medium"] || 0, fill: "#eab308" },
    { name: "Low", value: data.reportsBySeverity["low"] || 0, fill: "#16a34a" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Reports Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground font-medium">Total Laporan</p>
        <p className="text-3xl font-bold text-foreground mt-2">{data.totalReports}</p>
        <p className="text-xs text-teal-600 mt-2">Semua waktu</p>
      </div>

      {/* Pending Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground font-medium">Menunggu</p>
        <p className="text-3xl font-bold text-yellow-600 mt-2">{data.pendingReports}</p>
        <p className="text-xs text-muted-foreground mt-2">Perlu diproses</p>
      </div>

      {/* In Progress Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground font-medium">Sedang Diproses</p>
        <p className="text-3xl font-bold text-blue-600 mt-2">{data.inProgressReports}</p>
        <p className="text-xs text-muted-foreground mt-2">Dalam penanganan</p>
      </div>

      {/* Completed Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <p className="text-sm text-muted-foreground font-medium">Selesai</p>
        <p className="text-3xl font-bold text-green-600 mt-2">{data.completedReports}</p>
        <p className="text-xs text-muted-foreground mt-2">Tertangani</p>
      </div>

      {/* Status Distribution Pie Chart */}
      <div className="bg-card rounded-lg border border-border p-6 md:col-span-2">
        <h3 className="text-sm font-bold text-foreground mb-4">Distribusi Status</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Severity Distribution */}
      <div className="bg-card rounded-lg border border-border p-6 md:col-span-2">
        <h3 className="text-sm font-bold text-foreground mb-4">Tingkat Urgency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={severityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Bar dataKey="value" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reports by Type */}
      <div className="bg-card rounded-lg border border-border p-6 md:col-span-4">
        <h3 className="text-sm font-bold text-foreground mb-4">Laporan Berdasarkan Jenis</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={typeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Bar dataKey="count" fill="#0d9488" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
