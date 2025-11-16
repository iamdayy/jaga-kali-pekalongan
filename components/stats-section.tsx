"use client";

import { AlertCircle, CheckCircle2, Droplets, Users } from "lucide-react";
import { useEffect, useState } from "react";
import CountUp from "react-countup";

async function fetchStats() {
  try {
    const response = await fetch("/api/reports");
    const reports = await response.json();

    const total = reports.length;
    const pending = reports.filter((r: any) => r.status === "pending").length;
    const completed = reports.filter(
      (r: any) => r.status === "completed"
    ).length;
    const confirmations = reports.reduce(
      (sum: number, r: any) => sum + (r.confirmations_count || 0),
      0
    );

    return { total, pending, completed, confirmations };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { total: 0, pending: 0, completed: 0, confirmations: 0 };
  }
}

export default function StatsSection() {
  const [stats, setStats] = useState({
    total: 8,
    pending: 6,
    completed: 1,
    confirmations: 112,
  });

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  const statItems = [
    {
      icon: AlertCircle,
      label: "Laporan Tertunda",
      value: stats.pending,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Droplets,
      label: "Total Laporan",
      value: stats.total,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      icon: CheckCircle2,
      label: "Selesai",
      value: stats.completed,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Users,
      label: "Validasi Masyarakat",
      value: stats.confirmations,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <section id="statistik" className="py-12 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Statistik Real-Time
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Monitor perkembangan pembersihan Sungai Pekalongan secara langsung
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`rounded-lg border border-border p-6 ${item.bgColor}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={`text-3xl font-bold ${item.color} mt-2`}>
                      <CountUp start={0} end={item.value} duration={5} />
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${item.color} opacity-20`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
