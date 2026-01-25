"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReportFormModal from "./report-form-modal";

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
  // Fields not returned in map mode
  user_name?: string;
  image_urls?: string[];
  created_at?: string;
}

const severityColors: Record<string, string> = {
  high: "#dc2626",
  medium: "#eab308",
  low: "#16a34a",
};

export default function MapContainer() {
  const [latitude, setLatitude] = useState(-6.8902);
  const [longitude, setLongitude] = useState(109.6809);
  const [latitudeForModal, setLatitudeForModal] = useState<number | null>(null);
  const [longitudeForModal, setLongitudeForModal] = useState<number | null>(
    null
  );
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports?mode=map");
      const data = await response.json();
      setReports(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView(
      [latitude, longitude], // Pekalongan River center
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      minZoom: 10,
    }).addTo(map);

    mapRef.current = map;

    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setLatitudeForModal(lat);
      setLongitudeForModal(lng);
      setModalOpen(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.setView(
            [position.coords.latitude, position.coords.longitude],
            19
          );
          const marker = L.marker([
            position.coords.latitude,
            position.coords.longitude,
          ]).addTo(mapRef.current!);
          markersRef.current.push(marker);
        },
        (error) => { console.error("Error getting location:", error); }
      );
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing report markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filter reports for display
    const visibleReports = reports.filter(r => {
      if (statusFilter === "active") return r.status !== "completed";
      if (statusFilter === "completed") return r.status === "completed";
      return true; // all
    });

    // Helper for Blockage Detection
    // Algorithm: Connected Components (clustering) based on 100m distance
    // Score: High=3, Medium=2, Low=1. Threshold >= 3.
    // ONLY consider active reports for blockage detection
    const activeReports = reports.filter(r => r.status !== "completed");
    
    const visited = new Set<string>();
    const blockagePoints: { lat: number; lng: number; score: number; count: number }[] = [];

    const getRiskScore = (severity: string) => {
      switch (severity) {
        case "high": return 3;
        case "medium": return 2;
        default: return 1;
      }
    };

    activeReports.forEach((report) => {
      if (visited.has(report.id)) return;

      const cluster: Report[] = [report];
      const queue: Report[] = [report];
      visited.add(report.id);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentLatLng = L.latLng(current.latitude, current.longitude);

        activeReports.forEach((other) => {
          if (!visited.has(other.id)) {
            const dist = currentLatLng.distanceTo(L.latLng(other.latitude, other.longitude));
            if (dist <= 100) { // 100 meters clustering radius
              visited.add(other.id);
              cluster.push(other);
              queue.push(other);
            }
          }
        });
      }

      // Calculate cluster risk
      const totalScore = cluster.reduce((sum, r) => sum + getRiskScore(r.severity), 0);
      
      if (totalScore >= 3) {
        // Find centroid
        const totalLat = cluster.reduce((sum, r) => sum + r.latitude, 0);
        const totalLng = cluster.reduce((sum, r) => sum + r.longitude, 0);
        blockagePoints.push({
          lat: totalLat / cluster.length,
          lng: totalLng / cluster.length,
          score: totalScore,
          count: cluster.length
        });
      }
    });

    // Render Blockage Points (Pulse Effect)
    // Only show blockage points if we are showing active reports or all
    if (statusFilter !== "completed") {
      blockagePoints.forEach((point) => {
         const pulseHtml = `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; background-color: #dc2626; border-radius: 9999px; opacity: 0.75;" class="animate-ping"></div>
            <div style="position: relative; width: 24px; height: 24px; background-color: #dc2626; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; z-index: 50;">
              <span style="color: white; font-size: 14px; font-weight: bold;">!</span>
            </div>
          </div>
        `;
  
        const pulseIcon = L.divIcon({
          html: pulseHtml,
          className: "", // Disable default leaflet styling
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
  
        const start = L.marker([point.lat, point.lng], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(mapRef.current!);
        
        start.bindPopup(`
          <div class="font-sans text-sm p-1">
            <strong class="text-red-600 block mb-1">⚠️ Potensi Sumbatan!</strong>
            <span class="text-gray-600">Area rawan banjir (Radius 100m)</span><br/>
            <span class="text-xs text-gray-500">Total ${point.count} laporan. Skor Risiko: ${point.score}</span>
          </div>
        `);
        
        markersRef.current.push(start);
      });
    }

    // Add markers for each visible report
    visibleReports.forEach((report) => {
      const color = severityColors[report.severity] || severityColors.medium;
      // Dim color if completed
      const opacity = report.status === "completed" ? 0.5 : 1;

      const html = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}">
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

      const imageHtml = report.image_urls && report.image_urls.length > 0 
        ? `<div class="mb-2"><img src="${report.image_urls[0]}" class="w-full h-32 object-cover rounded-md" alt="Foto Laporan" /></div>` 
        : "";

      const popupContent = `
        <div class="p-3 w-64">
          ${imageHtml}
          <h3 class="font-bold text-foreground mb-2">${report.title}</h3>
          <p class="text-sm text-muted-foreground mb-2">${report.address}</p>
          <div class="flex gap-2 mb-2">
            <span class="text-xs px-2 py-1 rounded bg-background text-foreground">${report.report_type}</span>
            <span class="text-xs px-2 py-1 rounded" style="background-color: ${color}; color: white;">${report.severity}</span>
            <span class="text-xs px-2 py-1 rounded bg-background text-foreground">${report.status}</span>
          </div>
          <p class="text-sm text-muted-foreground mb-2 line-clamp-2">${report.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs text-muted-foreground">✓ ${report.confirmations_count} validasi</span>
            <a href="/lapor/${report.id}" class="text-xs text-teal-600 hover:underline">Detail →</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [reports, statusFilter]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-400 bg-white p-2 rounded-lg shadow-md flex flex-col gap-2 w-48">
         <select 
            className="w-full p-2 text-sm border rounded bg-background text-foreground"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
         >
            <option value="active">Belum Selesai</option>
            <option value="completed">Selesai</option>
            <option value="all">Semua</option>
         </select>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-1000">
          <div className="flex flex-col items-center gap-2">
            <Loader className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Memuat peta...</p>
          </div>
        </div>
      )}
      <ReportFormModal
        isOpen={modalOpen}
        longitude={longitudeForModal}
        latitude={latitudeForModal}
        onClose={() => {
          setModalOpen(false);
          setLatitudeForModal(null);
          setLongitudeForModal(null);
        }}
        onSuccess={() => {
          fetchReports();
          setModalOpen(false);
          setLatitudeForModal(null);
          setLongitudeForModal(null);
        }}
      />
    </div>
  );
}
