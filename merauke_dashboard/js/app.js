/**
 * ==========================================================================
 * app.js — Orkestrasi SPA: navigasi, render konten statis, aksi global
 * ==========================================================================
 */

'use strict';

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  'map-pin': '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  wheat: '<path d="M12 2v20M8 6c0 2 2 3 4 3s4-1 4-3M8 12c0 2 2 3 4 3s4-1 4-3M8 18c0 1 2 2 4 2s4-1 4-2"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  flow: '<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M7 7l10 0M7.5 8l4 8M16.5 8l-4 8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9z"/>',
  chart: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M4 20h16"/>',
  lightbulb: '<path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-3.6 10.8c.6.45 1.1 1.2 1.2 2.2h4.8c.1-1 .6-1.75 1.2-2.2A6 6 0 0 0 12 2z"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><circle cx="18" cy="9" r="2.6"/><path d="M15.5 14.3c2.7.3 4.5 2.2 4.5 4.9"/>',
};

let vegStatsCache = null;

async function fetchVegStats() {
  if (vegStatsCache) return vegStatsCache;
  const res = await fetch('assets/data/vegetation_stats.json');
  vegStatsCache = await res.json();
  return vegStatsCache;
}

/* ==========================================================================
   SIDEBAR NAV + ROUTING
   ========================================================================== */
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS.map((item) => `
    <button class="nav-item" data-nav="${item.id}">
      <svg viewBox="0 0 24 24">${ICONS[item.icon] || ''}</svg>
      <span>${item.label}</span>
    </button>
  `).join('');
}

function navigateTo(sectionId) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('page--active'));
  document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('nav-item--active'));

  const target = document.getElementById(`section-${sectionId}`);
  const navBtn = document.querySelector(`.nav-item[data-nav="${sectionId}"]`);
  if (!target) return;
  target.classList.add('page--active');
  if (navBtn) navBtn.classList.add('nav-item--active');

  const navItem = NAV_ITEMS.find((n) => n.id === sectionId);
  document.getElementById('topbar-title').textContent = navItem ? navItem.label : sectionId;

  document.getElementById('sidebar').classList.remove('sidebar--open');

  // Lazy init modul berat (GIS & Charts) hanya saat pertama kali dibuka
  if (sectionId === 'webgis') {
    GIS.init();
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 60);
  }
  if (sectionId === 'dashboard') CHARTS.init();
}

function bindNavClicks() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (btn) navigateTo(btn.dataset.nav);
  });
}

/* ==========================================================================
   HOME — ringkasan statistik
   ========================================================================== */
async function renderHomeStats() {
  const el = document.getElementById('home-stats');
  try {
    const stats = await fetchVegStats();
    const latest = stats.periods['2024_2025'].area_ha;
    const cumulative = stats.periods['2023_2025'].area_ha;
    const cards = [
      { label: 'Periode Dianalisis', value: '3', unit: 'rentang waktu' },
      { label: 'Total Area Teranalisis (2023–2025)', value: fmt(cumulative.loss + cumulative.gain + cumulative.stable), unit: 'Ha' },
      { label: 'Loss Terbaru (2024–2025)', value: fmt(latest.loss), unit: 'Ha' },
      { label: 'Gain Terbaru (2024–2025)', value: fmt(latest.gain), unit: 'Ha' },
    ];
    el.innerHTML = cards.map((c) => `
      <div class="stat-card">
        <span class="stat-card__label">${c.label}</span>
        <div class="stat-card__value">${c.value}<span class="stat-card__unit">${c.unit}</span></div>
      </div>
    `).join('');
  } catch (err) {
    console.error('[Home] gagal memuat statistik:', err);
  }
}

function fmt(v) { return Math.round(v).toLocaleString('id-ID'); }

/* ==========================================================================
   KABUPATEN MERAUKE (FR-INF-01)
   ========================================================================== */
function renderKabupaten() {
  const p = MERAUKE_PROFILE;
  const el = document.getElementById('kabupaten-content');
  el.innerHTML = `
    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Letak &amp; Administrasi</h3>
        <div class="def-list">
          <div class="def-row"><span class="def-row__label">Letak Astronomis</span><span class="def-row__value">${p.astronomis}</span></div>
          <div class="def-row"><span class="def-row__label">Ibu Kota</span><span class="def-row__value">${p.ibuKota}</span></div>
          <div class="def-row"><span class="def-row__label">Luas Wilayah</span><span class="def-row__value">${p.luasWilayah.toLocaleString('id-ID')} km²</span></div>
          <div class="def-row"><span class="def-row__label">Distrik / Kelurahan / Kampung</span><span class="def-row__value">${p.jumlahDistrik} / ${p.jumlahKelurahan} / ${p.jumlahKampung}</span></div>
          <div class="def-row"><span class="def-row__label">Penduduk (2024)</span><span class="def-row__value">${p.penduduk2024.toLocaleString('id-ID')} jiwa</span></div>
          <div class="def-row"><span class="def-row__label">Suku Asli</span><span class="def-row__value">${p.sukuAsli}</span></div>
          <div class="def-row"><span class="def-row__label">Didirikan</span><span class="def-row__value">${p.didirikan}</span></div>
        </div>
      </div>
      <div class="card">
        <h3 class="card__title">Batas Wilayah</h3>
        <div class="def-list">
          ${p.batasWilayah.map((b) => `<div class="def-row"><span class="def-row__label">${b.arah}</span><span class="def-row__value">${b.keterangan}</span></div>`).join('')}
        </div>
        <h3 class="card__title" style="margin-top:20px;">Potensi Perikanan</h3>
        <div class="def-list">
          <div class="def-row"><span class="def-row__label">Panjang Garis Pantai</span><span class="def-row__value">${p.potensiPerikanan.panjangPantaiKm.toLocaleString('id-ID')} km</span></div>
          <div class="def-row"><span class="def-row__label">Potensi Lestari</span><span class="def-row__value">${p.potensiPerikanan.potensiLestariTonTahun.toLocaleString('id-ID')} ton/tahun</span></div>
          <div class="def-row"><span class="def-row__label">Area Tambak Tersedia</span><span class="def-row__value">${p.potensiPerikanan.tambakHa.toLocaleString('id-ID')} Ha</span></div>
        </div>
      </div>
    </div>

    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Karakteristik Wilayah</h3>
        <div class="def-list">
          <div class="def-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <span class="def-row__label">Topografi</span>
            <span class="def-row__value" style="text-align:left; font-weight:400;">${p.karakteristik.topografi}</span>
          </div>
          <div class="def-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <span class="def-row__label">Iklim</span>
            <span class="def-row__value" style="text-align:left; font-weight:400;">${p.karakteristik.iklim}</span>
          </div>
          <div class="def-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <span class="def-row__label">Hidrologi</span>
            <span class="def-row__value" style="text-align:left; font-weight:400;">${p.karakteristik.hidrologi}</span>
          </div>
          <div class="def-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
            <span class="def-row__label">Tutupan Lahan</span>
            <span class="def-row__value" style="text-align:left; font-weight:400;">${p.karakteristik.tutupanLahan}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3 class="card__title">20 Distrik di Kabupaten Merauke</h3>
        <div class="chip-list">
          ${p.distrikList.map((d) => `<span class="chip">${d}</span>`).join('')}
        </div>
        <p class="chart-note" style="margin-top:14px;">Sumber: ${p.sumber}. Batas poligon presisi per distrik belum tersedia — lihat catatan di modul WebGIS.</p>
      </div>
    </div>
  `;
}

/* ==========================================================================
   FOOD ESTATE (FR-INF-02)
   ========================================================================== */
function renderFoodEstate() {
  const f = FOOD_ESTATE;
  const el = document.getElementById('food-estate-content');
  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3 class="card__title">Ringkasan Program</h3>
      <p style="font-size:13.5px; color:var(--color-text-secondary); line-height:1.65; margin:0 0 14px;">${f.ringkasan}</p>
      <p style="font-size:13.5px; color:var(--color-text-secondary); line-height:1.65; margin:0;">${f.statusTerkini}</p>
    </div>

    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Tujuan Program</h3>
        <ul class="bullet-list">${f.tujuan.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h3 class="card__title">Progres Cetak Sawah &amp; Infrastruktur</h3>
        ${f.progres.map((pr) => `
          <div class="progress-row">
            <span class="progress-row__label">${pr.label}</span>
            <span class="progress-row__value">${pr.nilai}<span class="progress-row__period">${pr.periode}</span></span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Alokasi Lahan (dokumen hukum)</h3>
        ${f.alokasiLahanDokumenHukum.map((a) => `
          <div class="alloc-bar-row">
            <div class="alloc-bar-row__label"><span>${a.kategori}</span><span>${a.persen}%</span></div>
            <div class="alloc-bar-track"><div class="alloc-bar-fill" style="width:${a.persen}%"></div></div>
          </div>
        `).join('')}
      </div>
      <div class="card">
        <h3 class="card__title">Isu &amp; Tantangan Kebijakan</h3>
        <ul class="bullet-list">${f.isuKebijakan.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
    </div>

    <div class="card">
      <h3 class="card__title">Linimasa Perkembangan</h3>
      <div class="timeline">
        ${f.timeline.map((t) => `
          <div class="timeline-item">
            <div class="timeline-item__year">${t.tahun}</div>
            <div class="timeline-item__body">
              <p class="timeline-item__title">${t.judul}</p>
              <p class="timeline-item__desc">${t.deskripsi}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <p class="chart-note" style="margin-top:16px;">Sumber: ${f.sumber}.</p>
    </div>
  `;
}

/* ==========================================================================
   DATASET
   ========================================================================== */
async function renderDataset() {
  const el = document.getElementById('dataset-content');
  const stats = await fetchVegStats();
  const b = stats.shared_bounds;

  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <h3 class="card__title">Raster Klasifikasi Perubahan Vegetasi</h3>
      <table class="data-table">
        <thead><tr><th>File</th><th>Periode</th><th>Resolusi</th><th>Sistem Koordinat</th><th>Ukuran</th></tr></thead>
        <tbody>
          <tr><td class="mono">Perubahan_Vegetasi_2023_2024.tif</td><td>2023 → 2024</td><td class="mono">~10m</td><td class="mono">EPSG:4326</td><td class="mono">37.617 × 27.831 px</td></tr>
          <tr><td class="mono">Perubahan_Vegetasi_2023_2025.tif</td><td>2023 → 2025</td><td class="mono">~10m</td><td class="mono">EPSG:4326</td><td class="mono">37.617 × 27.831 px</td></tr>
          <tr><td class="mono">Perubahan_Vegetasi_2024_2025.tif</td><td>2024 → 2025</td><td class="mono">~10m</td><td class="mono">EPSG:4326</td><td class="mono">37.617 × 27.831 px</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Skema Klasifikasi Piksel</h3>
        <div class="def-list">
          <div class="def-row"><span class="def-row__label"><span class="gis-legend-swatch" style="background:#5E7169; display:inline-block; margin-right:6px;"></span>0 — Non-vegetasi</span><span class="def-row__value">di luar cakupan analisis</span></div>
          <div class="def-row"><span class="def-row__label"><span class="gis-legend-swatch" style="background:#FF4757; display:inline-block; margin-right:6px;"></span>1 — Loss</span><span class="def-row__value">penyusutan vegetasi</span></div>
          <div class="def-row"><span class="def-row__label"><span class="gis-legend-swatch" style="background:#39FF8A; display:inline-block; margin-right:6px;"></span>2 — Gain</span><span class="def-row__value">penambahan vegetasi</span></div>
          <div class="def-row"><span class="def-row__label"><span class="gis-legend-swatch" style="background:#4C9A72; display:inline-block; margin-right:6px;"></span>3 — Stable</span><span class="def-row__value">tetap bervegetasi</span></div>
        </div>
      </div>
      <div class="card">
        <h3 class="card__title">Cakupan Spasial</h3>
        <div class="def-list">
          <div class="def-row"><span class="def-row__label">Barat – Timur</span><span class="def-row__value">${b.west.toFixed(3)}° – ${b.east.toFixed(3)}° BT</span></div>
          <div class="def-row"><span class="def-row__label">Selatan – Utara</span><span class="def-row__value">${b.south.toFixed(3)}° – ${b.north.toFixed(3)}° LS</span></div>
          <div class="def-row"><span class="def-row__label">Luas piksel</span><span class="def-row__value">~${stats.pixel_area_ha.toFixed(4)} Ha</span></div>
        </div>
        <div class="notice" style="margin-top:14px;">
          <span>&#9888;</span>
          <span><strong>Catatan:</strong> dataset ini berupa hasil klasifikasi akhir (loss/gain/stable), bukan citra RGB atau raster indeks (NDVI/NDMI/NDBI) mentah. Layer terkait ditampilkan non-aktif pada modul WebGIS sampai data tersebut diunggah.</span>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   METODOLOGI
   ========================================================================== */
function renderMetodologi() {
  const m = METHODOLOGY;
  const el = document.getElementById('metodologi-content');
  el.innerHTML = `
    <div class="card-grid card-grid--2">
      <div class="card">
        <h3 class="card__title">Sumber Data</h3>
        <div class="def-list">
          ${m.dataSumber.map((d) => `
            <div class="def-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
              <span class="def-row__label">${d.nama}</span>
              <span class="def-row__value" style="text-align:left; font-weight:400;">${d.keterangan}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h3 class="card__title">Status Integrasi Dataset</h3>
        <div class="notice notice--success" style="border-color:rgba(57,255,138,0.4); background:rgba(57,255,138,0.08); margin-bottom:16px;">
          <span style="font-size:16px; color:#39FF8A;">&#10003;</span>
          <span style="color:#EAF2ED;"><strong>Dataset &amp; Model Terhubung!</strong><br/>File <code>rf_evaluation_merauke_2023_2025.csv</code> (Akurasi 96,32%, F1-Score 96,40%), <code>feature_importance_merauke_2023_2025.csv</code>, serta <code>Batas_per_kecamatan.geojson</code> telah terhubung langsung dengan WebGIS &amp; Dashboard.</span>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn btn--primary" data-nav="dashboard">Lihat Evaluasi Model</button>
          <button class="btn btn--secondary" data-nav="webgis">Buka WebGIS Kecamatan</button>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card__title">Alur Kerja Analisis</h3>
      <div class="timeline">
        ${m.alurKerja.map((s, i) => `
          <div class="timeline-item">
            <div class="timeline-item__year">${String(i + 1).padStart(2, '0')}</div>
            <div class="timeline-item__body">
              <p class="timeline-item__title">${s.tahap}</p>
              <p class="timeline-item__desc">${s.deskripsi}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/* ==========================================================================
   INSIGHT (FR-INF-03)
   ========================================================================== */
function renderInsight() {
  const el = document.getElementById('insight-content');
  if (!el) return;
  fetchVegStats().then((stats) => {
    const periods = stats.periods;
    const lossByPeriod = Object.entries(periods).map(([k, v]) => ({ period: k, loss: v.area_ha.loss, gain: v.area_ha.gain }));
    const highestLoss = lossByPeriod.reduce((a, b) => (b.loss > a.loss ? b : a));
    const highestGain = lossByPeriod.reduce((a, b) => (b.gain > a.gain ? b : a));
    const cumulative = periods['2023_2025'].area_ha;
    const netCumulative = cumulative.gain - cumulative.loss;
    const trendLabel = netCumulative >= 0 ? 'net positif (penambahan lebih besar dari penyusutan)' : 'net negatif (penyusutan lebih besar dari penambahan)';

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <h3 class="card__title">Temuan Utama (Key Findings)</h3>
        <ul class="bullet-list">
          <li>Periode dengan luas <strong>loss tertinggi</strong> adalah <strong>${PERIOD_LABEL(highestLoss.period)}</strong> dengan sekitar ${fmt(highestLoss.loss)} Ha area terklasifikasi sebagai penyusutan vegetasi.</li>
          <li>Periode dengan luas <strong>gain tertinggi</strong> adalah <strong>${PERIOD_LABEL(highestGain.period)}</strong> dengan sekitar ${fmt(highestGain.gain)} Ha area terklasifikasi sebagai penambahan vegetasi.</li>
          <li>Secara kumulatif 2023–2025, tren perubahan vegetasi bersifat <strong>${trendLabel}</strong>, dengan selisih gain–loss sekitar ${fmt(Math.abs(netCumulative))} Ha.</li>
          <li>Total area teranalisis (loss+gain+stable) mencakup sekitar ${fmt(cumulative.loss + cumulative.gain + cumulative.stable)} Ha dari cakupan citra — sebagian wilayah kabupaten berupa badan air, area non-vegetasi, atau berada di luar mosaik citra yang tersedia.</li>
        </ul>
      </div>

      <div class="card-grid card-grid--2">
        <div class="card">
          <h3 class="card__title">Evaluasi Model Random Forest</h3>
          <div class="def-list">
            <div class="def-row"><span class="def-row__label">Overall Accuracy (Testing)</span><span class="def-row__value" style="color:var(--color-gain)">96.32%</span></div>
            <div class="def-row"><span class="def-row__label">F1-Score Vegetasi</span><span class="def-row__value" style="color:var(--color-accent)">96.40%</span></div>
            <div class="def-row"><span class="def-row__label">Precision</span><span class="def-row__value">95.71%</span></div>
            <div class="def-row"><span class="def-row__label">Recall</span><span class="def-row__value">97.10%</span></div>
            <div class="def-row"><span class="def-row__label">Accuracy Gap (train–test)</span><span class="def-row__value" style="color:var(--color-gain)">3.68% (low overfitting)</span></div>
            <div class="def-row"><span class="def-row__label">Sumber</span><span class="def-row__value" style="font-size:11px;font-family:var(--font-mono)">rf_evaluation_merauke_2023_2025.csv</span></div>
          </div>
          <div class="notice" style="margin-top:14px; border-color:rgba(57,255,138,0.3); background:rgba(57,255,138,0.06);">
            <span>&#10003;</span>
            <span><strong style="color:var(--color-gain)">Data terverifikasi.</strong> Metrik akurasi dihitung dari 136 sampel testing (30% split) menggunakan Random Forest 100 pohon pada Google Earth Engine — lihat detail lengkap di Dashboard Analitik.</span>
          </div>
        </div>
        <div class="card">
          <h3 class="card__title">Batasan Penelitian</h3>
          <ul class="bullet-list">
            <li>Analisis berbasis piksel dengan sampel training dan testing yang telah tersedia — akurasi model 96,32% dihitung secara otomatis dari evaluasi Random Forest di Google Earth Engine.</li>
            <li>Resolusi ~10m dapat menggabungkan objek kecil (mis. jalan sempit, kanal) ke dalam kelas vegetasi terdekat, memengaruhi akurasi spasial detail.</li>
            <li>Batas administratif yang ditampilkan pada WebGIS telah mencakup batas per kecamatan dari data GeoJSON resmi — namun peta kampung presisi belum tersedia.</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <h3 class="card__title">Rekomendasi Kebijakan</h3>
        <ul class="bullet-list">
          <li>Lakukan survei ground truth pada sampel titik loss/gain untuk mengukur akurasi klasifikasi sebelum hasil digunakan sebagai dasar kebijakan.</li>
          <li>Padukan hasil pemantauan ini dengan proses konsultasi FPIC terhadap masyarakat adat Marind di kawasan pengembangan Food Estate, mengingat sebagian area loss beririsan dengan zona pembukaan lahan.</li>
          <li>Perbarui data secara berkala (idealnya tahunan) mengingat cetak sawah KSPP Wanam masih berjalan aktif hingga 2026 dan berpotensi mengubah pola tutupan vegetasi secara signifikan.</li>
          <li>Lengkapi dataset dengan citra RGB dan indeks vegetasi (NDVI/NDMI/NDBI) mentah untuk analisis kesehatan vegetasi yang lebih rinci, tidak hanya klasifikasi biner loss/gain/stable.</li>
        </ul>
      </div>
    `;
  });
}

function PERIOD_LABEL(key) {
  return { '2023_2024': '2023–2024', '2023_2025': '2023–2025', '2024_2025': '2024–2025' }[key] || key;
}

/* ==========================================================================
   TENTANG KAMI
   ========================================================================== */
function renderTeam() {
  const el = document.getElementById('team-content');
  if (!el) return;

  el.innerHTML = TEAM.map((t, idx) => {
    const delay = idx * 60;
    return `
    <div class="team-card team-card--photo" style="animation-delay:${delay}ms">
      <div class="team-card__photo-container">
        <img src="${t.photo}" alt="${t.nama}" class="team-card__photo" />
      </div>
      <div class="team-card__info">
        <h3 class="team-card__name">${t.nama}</h3>
        <div class="team-card__divider"></div>
        <div class="team-card__nim-text">NIM ${t.nim}</div>
      </div>
    </div>
  `;
  }).join('');
}

/* ==========================================================================
   TOPBAR ACTIONS — Unduh Data & Bantuan (FR-NAV-02)
   ========================================================================== */
async function handleUnduhData() {
  const stats = await fetchVegStats();
  const rows = [['periode', 'kelas', 'luas_ha']];
  Object.entries(stats.periods).forEach(([period, data]) => {
    Object.entries(data.area_ha).forEach(([cls, ha]) => {
      rows.push([period, cls, ha.toFixed(2)]);
    });
  });
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'merauke_vegetation_stats.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function bindModals() {
  const bantuanModal = document.getElementById('modal-bantuan');
  document.getElementById('btn-bantuan').addEventListener('click', () => {
    bantuanModal.classList.remove('modal-overlay--hidden');
  });
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => bantuanModal.classList.add('modal-overlay--hidden'));
  });
  bantuanModal.addEventListener('click', (e) => {
    if (e.target === bantuanModal) bantuanModal.classList.add('modal-overlay--hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') bantuanModal.classList.add('modal-overlay--hidden');
  });
}

/* ==========================================================================
   MOBILE SIDEBAR TOGGLE
   ========================================================================== */
function bindSidebarToggle() {
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('sidebar--open');
  });
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  renderSidebarNav();
  bindNavClicks();
  bindModals();
  bindSidebarToggle();

  renderHomeStats();
  renderKabupaten();
  renderFoodEstate();
  renderDataset();
  renderMetodologi();
  renderInsight();
  renderTeam();

  document.getElementById('btn-unduh').addEventListener('click', handleUnduhData);

  navigateTo('home');
});
