# Jaga Kali Pekalongan

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/iamdayys-projects/jaga-kali-pekalongan)
![Tech Stack](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tech Stack](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tech Stack](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

**Jaga Kali Pekalongan** adalah platform web _crowdsourcing_ interaktif yang dirancang untuk memantau dan melaporkan polusi sampah serta limbah di sungai-sungai Pekalongan.

Proyek ini dibuat sebagai submisi untuk **INVOFEST 2025 National Web Design Competition** yang diselenggarakan oleh Universitas Harkat Negeri.

- **Tema Lomba:** "From Creation to Innovation"
- **Sub-tema:** "Digital Innovation for a Sustainable Nature"

## 🚀 Live Demo

Proyek ini di-hosting di Vercel.
[https://jaga-kali-pekalongan.iamdayy.my.id](https://jaga-kali-pekalongan.iamdayy.my.id)

## ✨ Fitur Utama

Aplikasi ini dibangun dengan beberapa fitur utama untuk memberdayakan masyarakat dan pemangku kepentingan:

- **Peta Interaktif:** Visualisasi semua laporan (tertunda, diproses, selesai) secara _real-time_ di peta Leaflet. Marker diberi kode warna berdasarkan tingkat urgensi.
- **Form Pelaporan Cerdas:** Form modal yang intuitif untuk mengirim laporan baru, lengkap dengan _location picker_ berbasis peta untuk akurasi data lintang/bujur.
- **Statistik Real-Time:** Halaman utama menampilkan statistik dinamis yang diambil langsung dari API, menunjukkan jumlah laporan tertunda, total, selesai, dan total validasi.
- **Validasi Komunitas:** Pengguna dapat "memvalidasi" laporan yang ada melalui halaman detail, berfungsi sebagai _upvote_ untuk membantu dinas terkait memprioritaskan laporan/page.tsx, iamdayy/jaga-kali-pekalongan/iamdayy-jaga-kali-pekalongan-d960af44eb398b496a90f35181829dae657b43f9/app/api/confirmations/route.ts].
- **Dukungan Anonim:** Memberi pengguna opsi untuk mengirim laporan secara anonim demi privasi dan keamanan.
- **API Backend:** Endpoint API yang _full-stack_ menggunakan Next.js App Router Route Handlers untuk operasi CRUD (Create, Read, Update) pada laporan route.

- **🤖 AI-Powered Reporting:** Mempermudah pelaporan dengan kecerdasan buatan.
  - **Analisis Gambar Otomatis:** Menggunakan **TensorFlow.js** (MobileNet) untuk mendeteksi jenis sampah (plastik, limbah, dll) secara langsung di browser.
  - **Smart Auto-fill:** Otomatis mengisi Judul, Deskripsi, Kategori, dan Urgensi based on hasil analisis gambar.

- **⚠️ Prediksi Sumbatan Sungai (Blockage Prediction):** Sistem peringatan dini banjir.
  - **Algoritma Clustering:** Mendeteksi akumulasi sampah dalam radius 100 meter.
  - **Visualisasi Risiko:** Menampilkan indikator berdenyut pada area kritis di peta.

- **✅ Bukti Penyelesaian (Proof of Work):**
  - Admin dapat mengunggah foto "Bukti Penyelesaian" setelah membersihkan area.
  - Foto "Before & After" ditampilkan transparan di halaman detail.

- **🔍 Manajemen Status & Filter:**
  - Filter laporan di peta berdasarkan status (Belum Selesai/Selesai).
  - Laporan selesai ditampilkan dimmed untuk fokus pada masalah aktif.

## 🛠️ Tumpukan Teknologi (Tech Stack)

Proyek ini dibangun menggunakan tumpukan teknologi modern berbasis TypeScript:

- **Framework:** [Next.js](https://nextjs.org/) (v16, App Router)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **AI/ML:** [TensorFlow.js](https://www.tensorflow.org/js) (Client-side classification)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Peta:** [Leaflet.js](https://leafletjs.com/)
- **Deployment:** [Vercel](https://vercel.com/)

## ⚙️ Menjalankan Secara Lokal

Untuk menjalankan proyek ini di lingkungan lokal Anda, ikuti langkah-langkah berikut:

1. **Clone Repositori**

    ```bash
    git clone https://github.com/iamdayy/jaga-kali-pekalongan.git
    cd jaga-kali-pekalongan
    ```

2. **Install Dependencies**
    Proyek ini menggunakan `pnpm` (berdasarkan `pnpm-lock.yaml`).

    ```bash
    pnpm install
    ```

3. **Setup Variabel Lingkungan (.env)**
    Buat file `.env.local` di direktori root dan isi dengan kredensial Supabase Anda. Anda bisa mendapatkannya dari dasbor proyek Supabase Anda (Settings > API).

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4. **Setup Database**
    Buka dasbor Supabase Anda dan navigasi ke **SQL Editor**.

    - Salin dan jalankan isi dari `scripts/001_create_reports_table.sql` untuk membuat tabel `reports` dan `confirmations` beserta Row Level Security (RLS) policies-nya.
    - (Opsional) Salin dan jalankan isi dari `scripts/002_seed_sample_reports.sql` untuk mengisi database Anda dengan data contoh.

5. **Jalankan Server Pengembangan**

    ```bash
    pnpm dev
    ```

    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---
