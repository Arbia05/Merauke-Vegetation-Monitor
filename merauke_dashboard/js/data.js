/**
 * ==========================================================================
 * data.js — Konten statis & konfigurasi aplikasi
 * Merauke Vegetation Monitor
 * ==========================================================================
 */

'use strict';

/** FR-NAV-01 — struktur menu navigasi utama. */
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'tentang', label: 'Tentang', icon: 'info' },
  { id: 'kabupaten', label: 'Kabupaten Merauke', icon: 'map-pin' },
  { id: 'food-estate', label: 'Food Estate', icon: 'wheat' },
  { id: 'dataset', label: 'Dataset', icon: 'database' },
  { id: 'metodologi', label: 'Metodologi', icon: 'flow' },
  { id: 'webgis', label: 'WebGIS', icon: 'globe' },
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'insight', label: 'Insight', icon: 'lightbulb' },
  { id: 'tentang-kami', label: 'Tentang Kami', icon: 'users' },
];

/** FR-INF-01 — Profil Kabupaten Merauke (fakta publik, diringkas ulang). */
const MERAUKE_PROFILE = {
  astronomis: '137°30′–141°00′ BT dan 6°00′–9°00′ LS',
  ibuKota: 'Distrik Merauke — sekaligus ibu kota Provinsi Papua Selatan',
  luasWilayah: 46791.63, // km²
  luasWilayahHa: 4679163,
  didirikan: '12 Februari 1902',
  jumlahDistrik: 20,
  jumlahKelurahan: 11,
  jumlahKampung: 179,
  penduduk2023: 232357,
  penduduk2024: 246397,
  sukuAsli: 'Marind Anim',
  batasWilayah: [
    { arah: 'Utara', keterangan: 'Kabupaten Boven Digoel & Kabupaten Mappi' },
    { arah: 'Timur', keterangan: 'Negara Papua Nugini (perbatasan darat langsung)' },
    { arah: 'Selatan', keterangan: 'Laut Arafura' },
    { arah: 'Barat', keterangan: 'Laut Arafura' },
  ],
  karakteristik: {
    topografi:
      'Didominasi dataran rendah dengan hamparan rawa luas dan dua sungai besar, Sungai Maro dan Sungai Bian, yang menjadi jalur transportasi air sekaligus sumber kehidupan masyarakat pesisir.',
    iklim:
      'Iklim tropis lembap dengan musim hujan dan kemarau yang cukup tegas; curah hujan tinggi turut membentuk luasnya kawasan rawa dan lahan basah di wilayah selatan.',
    hidrologi:
      'Jaringan sungai besar (Maro, Bian) dan garis pantai sepanjang lebih dari 846 km menghadap Laut Arafura menjadikan Merauke kaya potensi perikanan tangkap maupun budidaya tambak.',
    tutupanLahan:
      'Mozaik hutan rawa, savana, dan lahan basah — termasuk Taman Nasional Wasur seluas ±4.138 km², lahan basah terluas di Papua, rumah bagi kanguru pohon, cendrawasih, dan buaya air tawar.',
  },
  potensiPerikanan: {
    panjangPantaiKm: 846.36,
    luasLautKm2: 6269.86,
    potensiLestariTonTahun: 232500,
    tambakHa: 34958,
    kolamHa: 23711,
  },
  distrikList: [
    'Animha','Eligobel','Ilyawab','Jagebob','Kaptel','Kimaam','Kurik','Malind',
    'Merauke','Muting','Naukenjerai','Ngguti','Okaba','Semangga','Sota',
    'Tabonji','TanahMiring','Tubang','Ulilin','Waan',
  ],
  sumber: 'Pemda Kabupaten Merauke & BPK Perwakilan Papua (data 2024–2025)',
};

/** FR-INF-02 — Modul Food Estate (fakta publik, diringkas ulang). */
const FOOD_ESTATE = {
  ringkasan:
    'Program lumbung pangan di Merauke berjalan lebih dari dua dekade dengan beberapa nama dan skala berbeda — dari Merauke Integrated Rice Estate (2005), Merauke Integrated Food & Energy Estate/MIFEE (2010), hingga proyek cetak sawah skala nasional yang berjalan saat ini di bawah payung Proyek Strategis Nasional (PSN).',
  tujuan: [
    'Memperkuat cadangan pangan nasional dan mengurangi ketergantungan pada impor beras.',
    'Menjadikan Papua Selatan sebagai salah satu pusat produksi pangan baru di Indonesia timur.',
    'Membangun infrastruktur pendukung (jalan, irigasi, pelabuhan) di kawasan food estate.',
  ],
  statusTerkini:
    'Fokus pengembangan saat ini berpusat pada Kawasan Sentra Produksi Pangan (KSPP) Wanam, dengan lokasi utama di Kampung Wanam, Distrik Ilwayab. Proyek cetak sawah seluas sekitar 1,18 juta hektare mulai dibuka 5 Agustus 2024, membentuk koridor sepanjang ±135,5 km yang menghubungkan Distrik Ilwayab dan Distrik Muting.',
  progres: [
    { label: 'Land clearing', nilai: '±17.000 Ha', periode: '2024–2025' },
    { label: 'Land leveling', nilai: '±14.000 Ha', periode: '2024–2025' },
    { label: 'Olah lahan', nilai: '6.401 Ha', periode: '2024–2025' },
    { label: 'Lahan sudah ditanami', nilai: '3.053 Ha', periode: '2024–2025' },
    { label: 'Jalan akses KSPP Wanam dirintis', nilai: '58,44 km (11,53 km telah diperkeras)', periode: 'per akhir Januari 2026' },
  ],
  alokasiLahanDokumenHukum: [
    { kategori: 'Kehutanan', persen: 44.1 },
    { kategori: 'Tebu', persen: 35.5 },
    { kategori: 'Kelapa Sawit', persen: 17.6 },
    { kategori: 'Tanaman Pangan', persen: 2.8 },
  ],
  timeline: [
    { tahun: '2005', judul: 'Merauke Integrated Rice Estate (MIRE)', deskripsi: 'Rintisan awal pertanian skala luas di Merauke.' },
    { tahun: '2010', judul: 'MIFEE diluncurkan', deskripsi: 'Target awal 1,28 juta hektare, kemudian membesar hingga lebih dari 2 juta hektare.' },
    { tahun: '2023', judul: 'Ditetapkan sebagai PSN', deskripsi: 'Permenko Perekonomian No. 8/2023 menetapkan Merauke Food and Energy Development Area sebagai Proyek Strategis Nasional.' },
    { tahun: '2024', judul: 'Cetak sawah 1,18 juta Ha dimulai', deskripsi: 'Pembukaan lahan di Kampung Wanam, Distrik Ilwayab dimulai 5 Agustus 2024.' },
    { tahun: '2025', judul: 'Panen perdana demplot', deskripsi: 'Panen percontohan ±4 Ha di Wanam menghasilkan sekitar 2,8 ton gabah/hektare.' },
    { tahun: '2026', judul: 'Perluasan infrastruktur berjalan', deskripsi: 'Pembangunan jalan akses KSPP Wanam dan sarana pendukung terus dikebut.' },
  ],
  isuKebijakan: [
    'Potensi konflik agrarian dan hak ulayat masyarakat adat Marind, termasuk prinsip Free, Prior and Informed Consent (FPIC) yang menurut sejumlah kajian belum sepenuhnya dijalankan secara bermakna.',
    'Dampak ekologis dari pembukaan lahan rawa dan hutan alami berskala besar terhadap ekosistem lahan basah.',
    'Alokasi lahan menurut dokumen hukum masih didominasi kehutanan dan komoditas ekspor (tebu, sawit), bukan tanaman pangan.',
  ],
  sumber: 'Kementerian Koordinator Bidang Perekonomian, Pemda Merauke, Kemhan RI, dan liputan media nasional (2024–2026)',
};

/** FR-INF-03 pendukung — ringkasan metodologi analisis perubahan vegetasi. */
const METHODOLOGY = {
  dataSumber: [
    { nama: 'Citra Satelit Sentinel-2 (ESA Copernicus)', keterangan: 'Resolusi spasial ±10m, digunakan sebagai basis interpretasi tutupan vegetasi multi-temporal.' },
    { nama: 'Periode Analisis', keterangan: '2023, 2024, dan 2025 — dibandingkan berpasangan (2023→2024, 2023→2025, 2024→2025).' },
    { nama: 'Dataset Evaluasi RF (TERHUBUNG)', keterangan: 'rf_evaluation_merauke_2023_2025.csv — memuat Overall Testing Accuracy (96.32%), F1-Score (96.40%), Precision, dan Recall.' },
    { nama: 'Dataset Feature Importance (TERHUBUNG)', keterangan: 'feature_importance_merauke_2023_2025.csv — memuat bobot kontribusi 10 fitur citra (NDVI 25.77%, NDWI 20.86%, dll).' },
    { nama: 'Batas Administrasi Kecamatan (TERHUBUNG)', keterangan: 'Batas_per_kecamatan.geojson — poligon batas 20 distrik di Kabupaten Merauke.' },
  ],
  alurKerja: [
    { tahap: 'Pra-pemrosesan citra', deskripsi: 'Koreksi atmosferik & penyusunan mosaik bebas awan per tahun acuan.' },
    { tahap: 'Klasifikasi tutupan lahan', deskripsi: 'Klasifikasi vegetasi vs non-vegetasi menggunakan algoritma Random Forest berbasis piksel.' },
    { tahap: 'Deteksi perubahan (change detection)', deskripsi: 'Perbandingan hasil klasifikasi antar tahun untuk mengidentifikasi piksel Loss, Gain, dan Stable.' },
    { tahap: 'Kuantifikasi luas & evaluasi model', deskripsi: 'Konversi jumlah piksel per kelas menjadi luas area (hektare) serta evaluasi akurasi menggunakan 136 sampel testing.' },
    { tahap: 'Visualisasi WebGIS', deskripsi: 'Publikasi hasil sebagai layer interaktif pada peta berbasis Leaflet.js dengan batas kecamatan & dashboard analitik.' },
  ],
  catatan:
    'Seluruh dataset evaluasi model Random Forest (Testing Accuracy 96,32%, F1-Score 96,40%), Feature Importance, serta Batas Kecamatan GeoJSON telah sukses diunggah dan terhubung penuh dengan modul WebGIS, Dashboard Analitik & Insight.',
};

/** Gazetteer lokasi nyata untuk fitur pencarian pada WebGIS (FR-GIS-03). */
const GIS_PLACES = [
  { name: 'Kota Merauke (Pusat Pemerintahan)', lat: -8.4956, lng: 140.4013, zoom: 12, note: 'Ibu kota Kabupaten Merauke sekaligus Provinsi Papua Selatan.' },
  { name: 'Bandara Mopah', lat: -8.5203, lng: 140.4177, zoom: 14, note: 'Bandar udara utama Merauke (kode IATA: MKQ).' },
  { name: 'Distrik Sota (Titik Nol KM Timur Indonesia)', lat: -8.4228, lng: 140.9981, zoom: 13, note: 'PLBN Terpadu Sota, perbatasan darat RI–Papua Nugini, ±80km dari Kota Merauke.' },
  { name: 'Taman Nasional Wasur', lat: -8.55, lng: 140.85, zoom: 10, note: 'Kawasan konservasi lahan basah seluas ±4.138 km², terluas di Papua.' },
  { name: 'Kawasan Food Estate Ilwayab–Muting', lat: -8.35, lng: 140.55, zoom: 9, note: 'Lokasi indikatif koridor KSPP Wanam (±135,5 km) — belum berupa titik presisi.' },
];

/** Data tim peneliti Merauke Vegetation Monitor (Tanpa role & tugas, menggunakan foto dari gambar). */
const TEAM = [
  {
    nama: 'Febi Khusnul Khotimah',
    nim: '1242002032',
    photo: 'assets/img/team_febi.png',
  },
  {
    nama: 'Muhammad Al Ghifari',
    nim: '1232002042',
    photo: 'assets/img/team_ghifari.png',
  },
  {
    nama: 'Muhammad Arbia Rijaldi',
    nim: '1242002066',
    photo: 'assets/img/team_arbia.png',
  },
  {
    nama: 'Muhammad Rizqy',
    nim: '1232002029',
    photo: 'assets/img/team_rizqy.png',
  },
  {
    nama: 'Nazwa Alya Azrin',
    nim: '1232002028',
    photo: 'assets/img/team_nazwa.png',
  },
  {
    nama: 'Rara Kholillah',
    nim: '1232002047',
    photo: 'assets/img/team_rara.png',
  },
];
