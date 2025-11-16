"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import CountUp from "react-countup";
async function fetchStats() {
  try {
    const response = await fetch("/api/reports");
    const reports = await response.json();

    const total = reports.length;
    const active = reports.filter(
      (r: any) => r.status === "in_progress"
    ).length;
    const confirmed = reports.filter(
      (r: any) => r.status === "confirmed"
    ).length;
    const completed = reports.filter(
      (r: any) => r.status === "completed"
    ).length;

    return { active, total, completed };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { active: 0, total: 0, completed: 0 };
  }
}
export default function HeroSection() {
  const [stats, setStats] = useState({
    active: 6,
    total: 1,
    completed: 1,
  });

  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  const statItems = [
    {
      label: "Total Laporan",
      value: stats.total,
      color: "text-teal-600",
    },
    {
      label: "Laporan Aktif",
      value: stats.active,
      color: "text-orange-600",
    },
    {
      label: "Selesai",
      value: stats.completed,
      color: "text-green-600",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-teal-50 to-background py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">
              Lindungi Sungai Kita
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
            Jaga Kali Pekalongan
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl text-balance">
            Platform pelaporan interaktif untuk melacak dan membersihkan sampah
            serta limbah di Sungai Pekalongan. Bersama kita ciptakan lingkungan
            yang lebih sehat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link href="/peta" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Jelajahi Peta
              </Button>
            </Link>
            <Link href="/peta" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-transparent"
              >
                Laporkan Sampah
              </Button>
            </Link>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-6 w-full max-w-md">
            {statItems.map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className={`text-3xl font-bold ${item.color}`}>
                  <CountUp start={0} end={item.value} duration={5} />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
