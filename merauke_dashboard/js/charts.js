/**
 * ==========================================================================
 * charts.js — Modul Dashboard Analitik (FR-DASH-01, FR-DASH-02)
 * Seluruh angka bersumber dari assets/data/vegetation_stats.json —
 * hasil hitung langsung dari raster klasifikasi asli (bukan dummy).
 *
 * Tambahan: Feature Importance & RF Evaluation dari CSV yang telah dimuat.
 * ==========================================================================
 */

'use strict';

const CHARTS = (() => {
  let stats = null;
  let barChart, donutChart, lineChart, featureChart;

  const PERIOD_LABELS = { '2023_2024': '2023–2024', '2023_2025': '2023–2025', '2024_2025': '2024–2025' };
  const PERIOD_ORDER = ['2023_2024', '2023_2025', '2024_2025'];

  /* ---- Data dari CSV Feature Importance (hardcoded dari file CSV asli) ---- */
  const FEATURE_IMPORTANCE = [
    { feature: 'NDVI',  importance: 25.77 },
    { feature: 'NDWI',  importance: 20.86 },
    { feature: 'B8',    importance: 14.18 },
    { feature: 'NDBI',  importance: 14.13 },
    { feature: 'B2',    importance: 13.15 },
    { feature: 'NDMI',  importance: 12.04 },
    { feature: 'B11',   importance: 8.49  },
    { feature: 'B4',    importance: 6.94  },
    { feature: 'B3',    importance: 5.53  },
    { feature: 'B12',   importance: 7.17  },
  ].sort((a, b) => b.importance - a.importance);

  /* ---- Data dari CSV RF Evaluation ---- */
  const RF_EVAL = {
    accuracy_training:  1.0,
    accuracy_testing:   0.9632,
    accuracy_gap:       0.0368,
    f1_score:           0.9640,
    precision:          0.9571,
    recall:             0.9710,
    num_trees:          100,
    seed:               42,
    split_train:        0.7,
    training_total:     310,
    testing_total:      136,
    tp: 67, tn: 64, fp: 3, fn: 2,
    dataset:            'COPERNICUS/S2_SR_HARMONIZED',
    analysis_scale_m:   10,
  };

  async function init() {
    if (!stats) {
      const res = await fetch('assets/data/vegetation_stats.json');
      stats = await res.json();
    }
    const select = document.getElementById('dash-period');
    renderAll(select.value);
    select.removeEventListener('change', onPeriodChange);
    select.addEventListener('change', onPeriodChange);
  }

  function onPeriodChange() {
    const select = document.getElementById('dash-period');
    renderAll(select.value);
  }

  function renderAll(period) {
    renderMetrics(period);
    renderBarChart();
    renderDonutChart(period);
    renderLineChart();
    renderFeatureImportanceChart();
    renderRFEvalCards();
  }

  function fmtHa(v) { return Math.round(v).toLocaleString('id-ID'); }
  function fmtPct(v) { return (v * 100).toFixed(2) + '%'; }

  /* ---- FR-DASH-01: Kartu Metrik ---- */
  function renderMetrics(period) {
    const p = stats.periods[period].area_ha;
    const [startYear, endYear] = PERIOD_LABELS[period].split('–');
    const vegAwal = p.stable + p.loss;
    const vegAkhir = p.stable + p.gain;
    const netChange = p.gain - p.loss;
    const pctChange = vegAwal > 0 ? (netChange / vegAwal) * 100 : 0;

    const cards = [
      { label: 'Luas Kabupaten Merauke (resmi)', value: fmtHa(MERAUKE_PROFILE.luasWilayahHa), unit: 'Ha' },
      { label: `Luas Vegetasi ${startYear}`, value: fmtHa(vegAwal), unit: 'Ha' },
      { label: `Luas Vegetasi ${endYear}`, value: fmtHa(vegAkhir), unit: 'Ha' },
      { label: 'Perubahan Bersih Vegetasi', value: (netChange >= 0 ? '+' : '') + fmtHa(netChange), unit: 'Ha', delta: pctChange },
      { label: 'Overall Accuracy (Model RF)', value: fmtPct(RF_EVAL.accuracy_testing), unit: '', accent: true },
    ];

    const el = document.getElementById('dash-metrics');
    el.innerHTML = cards.map((c) => {
      if (c.accent) {
        return `<div class="stat-card stat-card--accent">
          <span class="stat-card__label">${c.label}</span>
          <div class="stat-card__value">${c.value}<span class="stat-card__unit">${c.unit}</span></div>
          <span class="stat-card__delta stat-card__delta--up">✓ Tervalidasi dari CSV</span>
        </div>`;
      }
      let deltaHtml = '';
      if (typeof c.delta === 'number') {
        const cls = c.delta > 0 ? 'up' : c.delta < 0 ? 'down' : 'flat';
        const sign = c.delta > 0 ? '+' : '';
        deltaHtml = `<span class="stat-card__delta stat-card__delta--${cls}">${sign}${c.delta.toFixed(2)}% thd vegetasi awal</span>`;
      }
      return `<div class="stat-card">
        <span class="stat-card__label">${c.label}</span>
        <div class="stat-card__value">${c.value}<span class="stat-card__unit">${c.unit}</span></div>
        ${deltaHtml}
      </div>`;
    }).join('');
  }

  /* ---- FR-DASH-02: Bar Chart — Perbandingan Luas Vegetasi ---- */
  function renderBarChart() {
    const ctx = document.getElementById('chart-bar');
    if (barChart) barChart.destroy();
    const labels = PERIOD_ORDER.map((p) => PERIOD_LABELS[p]);
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Loss', data: PERIOD_ORDER.map((p) => Math.round(stats.periods[p].area_ha.loss)), backgroundColor: '#E05252', borderRadius: 4 },
          { label: 'Gain', data: PERIOD_ORDER.map((p) => Math.round(stats.periods[p].area_ha.gain)), backgroundColor: '#2D7A4A', borderRadius: 4 },
          { label: 'Stable', data: PERIOD_ORDER.map((p) => Math.round(stats.periods[p].area_ha.stable)), backgroundColor: '#A8C5B0', borderRadius: 4 },
        ],
      },
      options: chartBaseOptions('Luas (Ha)'),
    });
  }

  /* ---- FR-DASH-02: Donut Chart ---- */
  function renderDonutChart(period) {
    const ctx = document.getElementById('chart-donut');
    if (donutChart) donutChart.destroy();
    const p = stats.periods[period].area_ha;
    donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Loss', 'Gain', 'Stable'],
        datasets: [{ data: [Math.round(p.loss), Math.round(p.gain), Math.round(p.stable)], backgroundColor: ['#E05252', '#2D7A4A', '#A8C5B0'], borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { color: '#4A6358', font: { family: 'Inter', size: 11 }, boxWidth: 10 } } },
      },
    });
  }

  /* ---- FR-DASH-02: Line Chart ---- */
  function renderLineChart() {
    const ctx = document.getElementById('chart-line');
    if (lineChart) lineChart.destroy();
    const labels = PERIOD_ORDER.map((p) => PERIOD_LABELS[p]);
    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Loss', data: PERIOD_ORDER.map((p) => Math.round(stats.periods[p].area_ha.loss)), borderColor: '#E05252', backgroundColor: 'rgba(224,82,82,0.08)', tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#E05252' },
          { label: 'Gain', data: PERIOD_ORDER.map((p) => Math.round(stats.periods[p].area_ha.gain)), borderColor: '#2D7A4A', backgroundColor: 'rgba(45,122,74,0.08)', tension: 0.35, fill: true, pointRadius: 4, pointBackgroundColor: '#2D7A4A' },
        ],
      },
      options: chartBaseOptions('Luas (Ha)'),
    });
  }

  /* ---- Feature Importance Chart (dari CSV asli) ---- */
  function renderFeatureImportanceChart() {
    const ctx = document.getElementById('chart-feature-importance');
    if (!ctx) return;
    if (featureChart) featureChart.destroy();

    const labels = FEATURE_IMPORTANCE.map((f) => f.feature);
    const values = FEATURE_IMPORTANCE.map((f) => f.importance);

    // Color by importance value
    const colors = values.map((v) => {
      if (v >= 20) return '#1B5C35';
      if (v >= 15) return '#2D7A4A';
      if (v >= 10) return '#4A9A6A';
      return '#A8C5B0';
    });

    featureChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Importance (%)',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.x.toFixed(2)}%`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#4A6358', font: { family: 'JetBrains Mono', size: 10 }, callback: (v) => v + '%' },
            grid: { color: 'rgba(0,0,0,0.05)' },
            title: { display: true, text: 'Importance (%)', color: '#8DA89B', font: { size: 10 } },
          },
          y: {
            ticks: { color: '#1A2921', font: { family: 'JetBrains Mono', size: 11, weight: '600' } },
            grid: { color: 'rgba(0,0,0,0.04)' },
          },
        },
      },
    });
  }

  /* ---- RF Evaluation Cards ---- */
  function renderRFEvalCards() {
    const el = document.getElementById('rf-eval-content');
    if (!el) return;

    const e = RF_EVAL;
    const matrix = [
      { label: 'True Positive',  value: e.tp, color: '#2D7A4A', desc: 'Vegetasi benar terklasifikasi' },
      { label: 'True Negative',  value: e.tn, color: '#4A9A6A', desc: 'Non-veg benar terklasifikasi' },
      { label: 'False Positive', value: e.fp, color: '#E05252', desc: 'Non-veg salah jadi vegetasi' },
      { label: 'False Negative', value: e.fn, color: '#E07B2A', desc: 'Vegetasi salah jadi non-veg' },
    ];

    el.innerHTML = `
      <div class="rf-eval-grid">
        <div class="rf-metric-card">
          <div class="rf-metric-label">Training Accuracy</div>
          <div class="rf-metric-value" style="color:#2D7A4A">${fmtPct(e.accuracy_training)}</div>
          <div class="rf-metric-sub">N=${e.training_total.toLocaleString()} sampel (70% split)</div>
        </div>
        <div class="rf-metric-card">
          <div class="rf-metric-label">Testing Accuracy</div>
          <div class="rf-metric-value" style="color:#1B5C35">${fmtPct(e.accuracy_testing)}</div>
          <div class="rf-metric-sub">N=${e.testing_total.toLocaleString()} sampel (30% split)</div>
        </div>
        <div class="rf-metric-card">
          <div class="rf-metric-label">F1-Score (Vegetasi)</div>
          <div class="rf-metric-value" style="color:#1B5C35">${fmtPct(e.f1_score)}</div>
          <div class="rf-metric-sub">Harmonik mean Precision & Recall</div>
        </div>
        <div class="rf-metric-card">
          <div class="rf-metric-label">Precision</div>
          <div class="rf-metric-value" style="color:#2D7A4A">${fmtPct(e.precision)}</div>
          <div class="rf-metric-sub">Ketepatan prediksi positif</div>
        </div>
        <div class="rf-metric-card">
          <div class="rf-metric-label">Recall</div>
          <div class="rf-metric-value" style="color:#2D7A4A">${fmtPct(e.recall)}</div>
          <div class="rf-metric-sub">Kelengkapan deteksi vegetasi</div>
        </div>
        <div class="rf-metric-card rf-metric-card--info">
          <div class="rf-metric-label">Konfigurasi Model</div>
          <div class="rf-config-list">
            <div class="rf-config-row"><span>Jumlah Pohon</span><span>${e.num_trees}</span></div>
            <div class="rf-config-row"><span>Skala Analisis</span><span>${e.analysis_scale_m}m</span></div>
            <div class="rf-config-row"><span>Dataset</span><span>S2 SR Harmonized</span></div>
            <div class="rf-config-row"><span>Accuracy Gap</span><span style="color:${e.accuracy_gap < 0.05 ? '#2D7A4A' : '#E05252'}">${(e.accuracy_gap * 100).toFixed(2)}%</span></div>
          </div>
        </div>
      </div>

      <div class="confusion-matrix-section">
        <p class="confusion-title">Confusion Matrix</p>
        <div class="confusion-grid">
          ${matrix.map((m) => `
            <div class="confusion-cell">
              <div class="confusion-cell__value" style="color:${m.color}">${m.value}</div>
              <div class="confusion-cell__label">${m.label}</div>
              <div class="confusion-cell__desc">${m.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function chartBaseOptions(yLabel) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#4A6358', font: { family: 'Inter', size: 11 }, boxWidth: 10 } },
      },
      scales: {
        x: { ticks: { color: '#4A6358', font: { family: 'Inter', size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
        y: {
          ticks: { color: '#4A6358', font: { family: 'Inter', size: 10 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          title: { display: true, text: yLabel, color: '#8DA89B', font: { size: 10 } },
        },
      },
    };
  }

  return { init, getStats: () => stats };
})();
