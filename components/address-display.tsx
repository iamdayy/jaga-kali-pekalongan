"use client";

import { useEffect, useState } from "react";

interface AddressDisplayProps {
  latitude: number | null;
  longitude: number | null;
}

export function AddressDisplay({ latitude, longitude }: AddressDisplayProps) {
  const [address, setAddress] = useState("Pilih lokasi di peta");

  useEffect(() => {
    if (latitude && longitude) {
      setAddress("Memuat alamat...");
      async function fetchAddress() {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          setAddress(
            data && data.address ? data.display_name : "Alamat tidak ditemukan."
          );
        } catch (error) {
          console.error("Error during reverse geocoding:", error);
          setAddress("Error memuat alamat.");
        }
      }
      fetchAddress();
    } else {
      setAddress("Pilih lokasi di peta");
    }
  }, [latitude, longitude]);

  return <p className="text-sm text-wrap">{address}</p>;
}
