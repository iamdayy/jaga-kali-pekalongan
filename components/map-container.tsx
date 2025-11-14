"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Report {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  severity: string;
  status: string;
  report_type: string;
  confirmations_count: number;
  user_name: string;
  image_urls: string[];
  created_at: string;
}

const severityColors: Record<string, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#16a34a",
};

export default function MapContainer() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        const data = await response.json();
        setReports(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView(
      [-6.8902, 109.6809], // Pekalongan River center
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      minZoom: 10,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for each report
    reports.forEach((report) => {
      const color = severityColors[report.severity] || severityColors.medium;

      const html = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="${color}" opacity="0.2" stroke="${color}" strokeWidth="2"/>
          <circle cx="16" cy="16" r="8" fill="${color}"/>
        </svg>
      `;

      const icon = L.divIcon({
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([report.latitude, report.longitude], {
        icon,
      }).addTo(mapRef.current!);

      const popupContent = `
        <div class="p-3 w-64">
          <h3 class="font-bold text-foreground mb-2">${report.title}</h3>
          <p class="text-sm text-muted-foreground mb-2">${report.address}</p>
          <div class="flex gap-2 mb-2">
            <span class="text-xs px-2 py-1 rounded bg-background text-foreground">${report.report_type}</span>
            <span class="text-xs px-2 py-1 rounded" style="background-color: ${color}; color: white;">${report.severity}</span>
            <span class="text-xs px-2 py-1 rounded bg-background text-foreground">${report.status}</span>
          </div>
          <p class="text-sm text-muted-foreground mb-2">${report.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-muted-foreground">✓ ${report.confirmations_count} validasi</span>
            <a href="/lapor/${report.id}" class="text-xs text-teal-600 hover:underline">Detail →</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [reports]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Memuat peta...</p>
          </div>
        </div>
      )}
    </div>
  );
}
