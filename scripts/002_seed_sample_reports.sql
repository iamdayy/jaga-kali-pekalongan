-- Seed sample reports for Jaga Kali Pekalongan
-- Pekalongan River coordinates: -6.8902, 109.6809

INSERT INTO public.reports (
  title, 
  description, 
  report_type, 
  severity, 
  latitude, 
  longitude, 
  address,
  user_name,
  status,
  confirmations_count,
  is_anonymous,
  created_at
) VALUES
  (
    'Tumpukan Plastik di Sungai Kalibaru',
    'Ditemukan tumpukan plastik dan kemasan minuman di sekitar jembatan Kalibaru. Terlihat banyak botol plastik bekas dan tas kresek yang menumpuk di tepi sungai.',
    'plastic',
    'high',
    -6.8850,
    109.6750,
    'Jembatan Kalibaru, Pekalongan',
    'Budi Santoso',
    'pending',
    12,
    false,
    NOW() - INTERVAL '3 days'
  ),
  (
    'Limbah Industri Mencurigakan',
    'Limbah berwarna coklat mengalir dari pipa industri. Bau menyengat terdeteksi di area sekitar. Perlu penyelidikan lebih lanjut oleh pihak berwajib.',
    'hazardous',
    'high',
    -6.8920,
    109.6820,
    'Kawasan Industri Pekalongan Timur',
    'Ani Wijaya',
    'in_progress',
    28,
    false,
    NOW() - INTERVAL '5 days'
  ),
  (
    'Sampah Domestik Menumpuk',
    'Sampah rumah tangga termasuk kertas, karton, dan plastik menumpuk di pinggir sungai. Kemungkinan terbawa arus dari pemukiman di sekitar.',
    'waste',
    'medium',
    -6.8880,
    109.6790,
    'Pemukiman Panjang, Pekalongan',
    'Nama Anonym',
    'pending',
    5,
    true,
    NOW() - INTERVAL '1 day'
  ),
  (
    'Serpihan Gelas di Tepi Sungai',
    'Banyak potongan kaca dan serpihan gelas tersebar di tepi sungai. Berbahaya bagi siapa saja yang bermain air. Segera dibersihkan.',
    'waste',
    'high',
    -6.8870,
    109.6760,
    'Kawasan Wisata Sungai Pekalongan',
    'Ahmad Rizki',
    'completed',
    18,
    false,
    NOW() - INTERVAL '7 days'
  ),
  (
    'Jerigen Kimia Tergeletak',
    'Ditemukan 3 jerigen plastik ukuran besar berisi limbah yang tidak teridentifikasi. Jerigen sudah rusak dan mengeluarkan cairan ke sungai.',
    'hazardous',
    'high',
    -6.8900,
    109.6830,
    'Dekat Terminal Laut Pekalongan',
    'Siti Nurhaliza',
    'in_progress',
    35,
    false,
    NOW() - INTERVAL '2 days'
  ),
  (
    'Kaleng Minuman Berserakan',
    'Ratusan kaleng minuman bekas tertumpuk rapi namun mengotori sungai. Kemungkinan dari festival atau acara kemarin.',
    'plastic',
    'medium',
    -6.8860,
    109.6800,
    'Alun-Alun Kota Pekalongan',
    'Kelompok Lingkungan Hijau',
    'pending',
    8,
    false,
    NOW() - INTERVAL '6 hours'
  ),
  (
    'Sampah Organik dan Anorganik Campur',
    'Sampah organik seperti daun dan ranting tercampur dengan plastik dan kertas. Menciptakan bau tidak sedap di pagi hari.',
    'waste',
    'low',
    -6.8875,
    109.6815,
    'Hulu Sungai Pekalongan',
    'Nama Anonym',
    'pending',
    3,
    true,
    NOW() - INTERVAL '4 hours'
  ),
  (
    'Tas Plastik Besar di Bawah Air',
    'Tas plastik hitam besar terlihat terendam air. Dikhawatirkan berisi limbah berbahaya atau menyebabkan penyumbatan aliran sungai.',
    'plastic',
    'high',
    -6.8895,
    109.6825,
    'Jembatan Harjosari, Pekalongan',
    'Eko Prasetyo',
    'pending',
    15,
    false,
    NOW() - INTERVAL '12 hours'
  );

-- Insert some confirmations for reports
INSERT INTO public.confirmations (report_id, user_identifier, created_at) 
SELECT 
  id, 
  'user_' || SUBSTRING(id::TEXT, 1, 8) || '_' || (ROW_NUMBER() OVER (PARTITION BY id ORDER BY RANDOM()))::TEXT,
  NOW() - INTERVAL ((RANDOM() * 86400)::INT || ' seconds')
FROM public.reports
WHERE confirmations_count > 0
LIMIT (SELECT SUM(confirmations_count) FROM public.reports);
