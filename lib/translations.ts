export const WASTE_TRANSLATIONS: Record<string, string> = {
  // MobileNet Common Classes (Environmental/Waste)
  "water bottle": "Botol Air",
  "pop bottle": "Botol Minuman",
  "plastic bag": "Kantong Plastik",
  "trash can": "Tempat Sampah",
  "bucket": "Ember",
  "soap dispenser": "Botol Sabun",
  "paper towel": "Tisu Kertas",
  "carton": "Kardus/Karton",
  "can": "Kaleng",
  "lotion": "Botol Losion",
  "cup": "Gelas",
  "coffee mug": "Cangkir Kopi",
  "espresso": "Kopi",
  "coffeepot": "Teko Kopi",
  "teapot": "Teko Teh",
  "pitcher": "Teko Air",
  "wine bottle": "Botol Anggur",
  "beer bottle": "Botol Bir",
  "pill bottle": "Botol Obat",
  "refrigerator": "Kulkas",
  "washer": "Mesin Cuci",
  "lighter": "Korek Api",
  "matchstick": "Korek Api",
  "broom": "Sapu",
  "mop": "Pel",
  "plunger": "Penyedot WC",
  "umbrella": "Payung",
  "shoe": "Sepatu",
  "sandal": "Sandal",
  "running shoe": "Sepatu Lari",
  "boot": "Sepatu Boot",
  "sock": "Kaos Kaki",
  "jean": "Celana Jeans",
  "jersey": "Baju Jersey",
  "shirt": "Kemeja/Kaos",
  "miniskirt": "Rok Mini",
  "overskirt": "Rok",
  "kimono": "Pakaian",
  "cardigan": "Kardigan",
  "sweatshirt": "Jaket/Sweater",
  "diaper": "Popok",
  "band aid": "Plester Luka",
  "computer keyboard": "Keyboard",
  "mouse": "Mouse",
  "monitor": "Monitor",
  "laptop": "Laptop",
  "cellular telephone": "Ponsel",
  "remote control": "Remote TV",
  "television": "Televisi",
  "radio": "Radio",
  "cassette": "Kaset",
  "cd player": "Pemutar CD",
  "mp3 player": "MP3 Player",
  "camera": "Kamera",
  "lens cap": "Tutup Lensa",
  "sunglasses": "Kacamata Hitam",
  "sunglass": "Kacamata Hitam",
  "wallet": "Dompet",
  "purse": "Tas Tangan",
  "backpack": "Tas Punggung",
  "shopping basket": "Keranjang Belanja",
  "crate": "Peti Kayu",
  "mask": "Masker",
  "snorkel": "Alat Selam",
  "lifeboat": "Sekoci",
  "canoe": "Kano",
  "padlock": "Gembok",
  "chain": "Rantai",
  "scale": "Timbangan",
  "rule": "Penggaris",
  "envelope": "Amplop",
  "toilet tissue": "Tisu Toilet",
  "beer glass": "Gelas Bir",
  "cocktail shaker": "Pengocok Minuman",
  "nipple": "Dot Bayi",
  "bib": "Celemek Bayi",
  "oxygen mask": "Masker Oksigen",
  "traffic light": "Lampu Lalu Lintas",
  "street sign": "Rambu Jalan",
  "book jacket": "Sampul Buku",
  "comic book": "Komik",
  "menu": "Buku Menu",
  "plate": "Piring",
  "tray": "Nampan",
  "candle": "Lilin",
  "spotlight": "Lampu Sorot",
  "lampshade": "Kap Lampu",
  "pillow": "Bantal",
  "sleeping bag": "Kantong Tidur",
  "printer": "Printer",
  "vending machine": "Mesin Penjual Otomatis",
  "safe": "Brankas",

  // Water / Nature Context
  "lakeside": "Tepi Danau/Sungai",
  "seashore": "Tepi Pantai",
  "fountain": "Air Mancur",
  "dam": "Bendungan",
  "cliff": "Tebing",
  "sandbar": "Gosong Pasir",
  "coral reef": "Terumbu Karang",
  "sea snake": "Ular Laut",
  "jellyfish": "Ubur-ubur",
  
  // Generic Fallbacks for common words if partial match
  "bottle": "Botol",
  "glass": "Kaca/Gelas",
  "plastic": "Plastik",
  "paper": "Kertas",
  "metal": "Logam",
  "box": "Kotak",
  "bag": "Tas/Kantong"
};

export function translateLabel(label: string): string {
  if (!label) return label;
  
  const lowerLabel = label.toLowerCase().trim();
  
  // Direct match
  if (WASTE_TRANSLATIONS[lowerLabel]) {
    return WASTE_TRANSLATIONS[lowerLabel];
  }

  // Iterate to find partial matches for generic types (fallback)
  // e.g., "green plastic bag" -> check "plastic bag", then "bag"
  for (const [key, value] of Object.entries(WASTE_TRANSLATIONS)) {
    if (lowerLabel.includes(key) && key.length > 3) { // Avoid short words like "can" matching "candle" wrongly
         // Simple replacement strategy? 
         // For now, if we detect a specific waste keyword, we might just return that category
         // Or keep original if it's too risky.
         // Let's stick to direct check or specific suffix checks.
    }
  }

  // Capitalize first letter if no translation found
  return label.charAt(0).toUpperCase() + label.slice(1);
}
