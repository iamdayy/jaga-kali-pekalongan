"use client";

import FloatingActionButton from "@/components/floating-action-button";
import Header from "@/components/header";
import { Loader } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const MapContainer = dynamic(() => import("@/components/map-container"), {
  ssr: false,
  loading: () => (
    // Tampilkan loader kustom selagi komponen peta dimuat
    <div className="w-full h-full flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <Loader className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Memuat peta...</p>
      </div>
    </div>
  ),
});
export default function MapPage() {
  const [refreshMap, setRefreshMap] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <MapContainer key={refreshMap ? "refresh" : "default"} />
        <FloatingActionButton />
      </main>
    </div>
  );
}
