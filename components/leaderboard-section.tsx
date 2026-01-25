
"use client";

import { cn } from "@/lib/utils";
import { MapPin, Star, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardData {
  citizens: { name: string; score: number; reports: number }[];
  locations: { address: string; score: number; reports: number }[];
}

export default function LeaderboardSection() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-16 px-4 md:px-6 bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Klasemen Penjaga Sungai
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Apresiasi untuk warga dan wilayah yang paling aktif berkontribusi dalam menjaga kebersihan sungai kita.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <LeaderboardCard
            title="Pahlawan Sungai"
            icon={<User className="h-6 w-6 text-primary" />}
            loading={loading}
            items={data?.citizens.map((c) => ({
              label: c.name,
              score: c.score,
              subtext: `${c.reports} Laporan`,
            }))}
            type="citizen"
          />

          <LeaderboardCard
            title="Lokasi Teraktif"
            icon={<MapPin className="h-6 w-6 text-primary" />}
            loading={loading}
            items={data?.locations.map((l) => ({
              label: l.address,
              score: l.score,
              subtext: `${l.reports} Laporan`,
            }))}
            type="location"
          />
        </div>
      </div>
    </section>
  );
}

function LeaderboardCard({
  title,
  icon,
  loading,
  items,
  type,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  items?: { label: string; score: number; subtext: string }[];
  type: "citizen" | "location";
}) {
  return (
    <div className="rounded-xl border border-border shadow-lg bg-card/50 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-primary/20" />
      <div className="flex flex-row items-center gap-4 p-6 pb-2">
        <div className="p-3 rounded-full bg-primary/10">{icon}</div>
        <h3 className="font-semibold leading-none tracking-tight text-xl">{title}</h3>
      </div>
      <div className="p-6 pt-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items?.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Belum ada data tersedia.
              </div>
            )}
            {items?.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all hover:bg-muted/50",
                  index === 0 && "bg-yellow-500/10 border border-yellow-500/20",
                  index === 1 && "bg-slate-300/10 border border-slate-300/20",
                  index === 2 && "bg-orange-700/10 border border-orange-700/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-slate-300 text-slate-900"
                        : index === 2
                        ? "bg-orange-700 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index <= 2 ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">#{index + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium line-clamp-1">{item.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.subtext}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-sm">{item.score} Pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
