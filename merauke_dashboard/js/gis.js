/**
 * gis.js — Modul WebGIS Merauke Vegetation Monitor
 * Kecamatan dari Batas_per_kecamatan.geojson (20 distrik).
 * Klik poligon → neon glowing border + popup nama & luas wilayah + leader line.
 */

'use strict';

const GIS = (() => {
  let map = null;
  let overviewMap = null;
  let overviewRect = null;
  let canvasRenderer = null;
  let measureActive = false;
  let measurePoints = [];
  let measureLine = null;
  let measureMarkers = [];
  let vegStats = null;
  let loadedOverlayLayers = {};
  let aoiOutlineLayer = null;
  let kecamatanLayer = null;
  let activeKecamatanLayer = null;
  let clickLeaderLine = null;
  let clickMarker = null;
  // Separate pulsing neon highlight layer for clicked polygon
  let neonHighlightLayer = null;

  const OVERLAY_IMG_DIR = 'assets/img/overlays/';
  const STATS_URL = 'assets/data/vegetation_stats.json';
  const KECAMATAN_URL = 'assets/data/Batas_per_kecamatan.geojson';

  const CLASS_META = {
    loss:   { label: 'Loss',   color: '#FF4757' },
    gain:   { label: 'Gain',   color: '#39FF8A' },
    stable: { label: 'Stable', color: '#4C9A72' },
  };

  const PERIOD_META = {
    '2023_2024': '2023–2024',
    '2023_2025': '2023–2025',
    '2024_2025': '2024–2025',
  };

  // Keys must match NAME_3 exactly from GeoJSON
  const KECAMATAN_DESC = {
    'Animha':      'Distrik wilayah barat laut Merauke dengan hamparan lahan basah dan hutan sagu alami.',
    'Eligobel':    'Distrik wilayah tengah dengan dominasi hutan tropis. Aksesibilitas masih terbatas, jalur darat sedang dikembangkan.',
    'Ilyawab':     'Lokasi utama KSPP Wanam (Kawasan Sentra Produksi Pangan). Pembukaan lahan cetak sawah 1,18 juta Ha dimulai Agustus 2024.',
    'Jagebob':     'Distrik pedalaman dengan vegetasi hutan rawa dan lahan basah. Potensi perikanan sungai cukup tinggi.',
    'Kaptel':      'Distrik pedalaman dengan vegetasi savana khas Papua Selatan. Kawasan pengembalaan dan perburuan tradisional.',
    'Kimaam':      'Distrik kepulauan di delta Sungai Maro, berbatasan Laut Arafura. Ekosistem unik perpaduan hutan mangrove dan savana.',
    'Kurik':       'Distrik yang mendukung kawasan pertanian dan hutan produksi. Dilalui jalur sungai utama sebagai sarana transportasi.',
    'Malind':      'Distrik yang secara budaya merupakan wilayah adat suku Marind Anim, suku asli Merauke.',
    'Merauke':     'Ibu kota Kabupaten Merauke sekaligus Provinsi Papua Selatan. Pusat pemerintahan, perdagangan, dan transportasi utama wilayah.',
    'Muting':      'Distrik yang masuk dalam koridor pengembangan KSPP Wanam. Kawasan Food Estate aktif dengan cetak sawah berjalan.',
    'Naukenjerai': 'Distrik pesisir dengan ekosistem mangrove dan lahan basah yang kaya. Berbatasan langsung dengan Laut Arafura di bagian selatan.',
    'Ngguti':      'Distrik wilayah utara berbatasan Boven Digoel. Dominasi hutan lebat dan lahan basah rawa.',
    'Okaba':       'Distrik pesisir barat dengan akses ke Laut Arafura. Potensi perikanan tangkap dan tambak yang besar.',
    'Semangga':    'Distrik pertanian yang berkembang pesat. Terdapat kawasan perkebunan dan sentra produksi padi lokal.',
    'Sota':        'Distrik perbatasan Indonesia–Papua Nugini. Terdapat PLBN Terpadu Sota dan Tugu Titik Nol KM Timur Indonesia.',
    'Tabonji':     'Distrik kepulauan dengan budaya maritim kuat. Komunitas nelayan tradisional dan penghasil sagu.',
    'TanahMiring': 'Salah satu distrik pertanian dengan lahan sawah dan perkebunan. Kawasan pengembangan pangan lokal yang aktif.',
    'Tubang':      'Distrik pedalaman dengan potensi kehutanan. Kawasan eksplorasi sumber daya alam yang masih terjaga.',
    'Ulilin':      'Distrik yang berbatasan dengan Papua Nugini di sisi timur. Kawasan perbatasan dengan potensi wisata alam.',
    'Waan':        'Distrik wilayah barat laut dengan hutan alam yang masih luas. Potensi ekowisata dan konservasi tinggi.',
  };

  // Display label (adds space for TanahMiring)
  function displayName(raw) {
    if (raw === 'TanahMiring') return 'Tanah Miring';
    if (raw === 'Eligobel') return 'Eligobel';
    return raw;
  }

  /* -----------------------------------------------------------------------
     AREA CALCULATION (geodesic, km²)
  ----------------------------------------------------------------------- */
  function calculatePolygonAreaKm2(geometry) {
    const R = 6371;
    function areaRing(ring) {
      if (!ring || ring.length < 3) return 0;
      let area = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        const lon1 = ring[i][0] * Math.PI / 180;
        const lat1 = ring[i][1] * Math.PI / 180;
        const lon2 = ring[i+1][0] * Math.PI / 180;
        const lat2 = ring[i+1][1] * Math.PI / 180;
        area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
      }
      return Math.abs(area * R * R / 2);
    }
    let total = 0;
    if (geometry.type === 'Polygon') {
      total += areaRing(geometry.coordinates[0]);
      for (let i = 1; i < geometry.coordinates.length; i++) total -= areaRing(geometry.coordinates[i]);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(poly => {
        total += areaRing(poly[0]);
        for (let i = 1; i < poly.length; i++) total -= areaRing(poly[i]);
      });
    }
    return Math.abs(total);
  }

  /* -----------------------------------------------------------------------
     INIT
  ----------------------------------------------------------------------- */
  async function init() {
    if (map) { map.invalidateSize(); return; }

    map = L.map('map', {
      center: [-8.0, 139.3],
      zoom: 8,
      zoomControl: false,
      attributionControl: true,
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    canvasRenderer = L.canvas({ padding: 0.5 });

    buildBasemaps();
    map.on('mousemove', onMouseMove);
    map.on('click', onMapClickBackground);

    initOverviewMap();
    initMeasureTool();
    initFullscreen();
    initPrint();
    initSearch();
    initDistrikFilter();

    try {
      const res = await fetch(STATS_URL);
      vegStats = await res.json();
      buildOverlayLayers();
      buildLayerControl();
      fitToBounds();
    } catch (err) {
      console.error('[GIS] Gagal memuat statistik vegetasi:', err);
    }

    loadKecamatanLayer();
  }

  /* -----------------------------------------------------------------------
     BASEMAPS
  ----------------------------------------------------------------------- */
  let basemapLayers = {};
  function buildBasemaps() {
    basemapLayers = {
      'Citra Satelit (Esri)': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri' }
      ),
      'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
      }),
      'Terrain (Esri)': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 13, attribution: 'Tiles &copy; Esri' }
      ),
      'Topografi (OpenTopoMap)': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17, attribution: 'Map data: &copy; OpenStreetMap contributors | Style: &copy; OpenTopoMap',
      }),
    };
    basemapLayers['Citra Satelit (Esri)'].addTo(map);
  }

  /* -----------------------------------------------------------------------
     KECAMATAN LAYER
  ----------------------------------------------------------------------- */
  async function loadKecamatanLayer() {
    try {
      const res = await fetch(KECAMATAN_URL);
      const geojson = await res.json();

      kecamatanLayer = L.geoJSON(geojson, {
        style: styleDefault,
        onEachFeature: (feature, layer) => {
          const nameRaw = feature.properties.NAME_3 || '';
          const label   = displayName(nameRaw);
          const tipe    = feature.properties.TYPE_3 || 'Distrik';
          const desc    = KECAMATAN_DESC[nameRaw] || 'Distrik di Kabupaten Merauke, Papua Selatan.';
          const areaKm2 = calculatePolygonAreaKm2(feature.geometry);
          const areaHa  = Math.round(areaKm2 * 100);

          layer.on({
            mouseover: e => onHover(e, label),
            mouseout:  e => onOut(e),
            click:     e => onKecamatanClick(e, layer, feature, nameRaw, label, tipe, desc, areaKm2, areaHa),
          });
        },
      });

      // ON by default
      kecamatanLayer.addTo(map);

    } catch (err) {
      console.error('[GIS] Gagal memuat kecamatan:', err);
    }
  }

  /* ---- Styles ---- */
  function styleDefault() {
    return {
      color: '#22D3EE',
      weight: 1.5,
      opacity: 0.8,
      fillColor: '#22D3EE',
      fillOpacity: 0.05,
    };
  }

  function styleHover() {
    return {
      color: '#39FF8A',
      weight: 2.5,
      opacity: 1,
      fillColor: '#39FF8A',
      fillOpacity: 0.15,
    };
  }

  function styleActive() {
    // The active/selected polygon keeps its neon fill but the glowing outline
    // is handled by a separate neonHighlightLayer on top
    return {
      color: '#00FFFF',
      weight: 3,
      opacity: 1,
      fillColor: '#00FFFF',
      fillOpacity: 0.12,
    };
  }

  /* ---- Hover ---- */
  function onHover(e, label) {
    const layer = e.target;
    if (layer !== activeKecamatanLayer) {
      layer.setStyle(styleHover());
      layer.bringToFront();
    }
    layer.bindTooltip(
      `<div style="font-family:var(--font-display,sans-serif);font-weight:700;color:#39FF8A;font-size:13px;">
         Distrik ${label}
       </div>
       <div style="font-size:10px;color:#93A69D;margin-top:2px;">Klik untuk detail &amp; luas wilayah</div>`,
      { sticky: true, direction: 'top', className: 'kecamatan-tooltip' }
    ).openTooltip();
  }

  function onOut(e) {
    const layer = e.target;
    if (layer !== activeKecamatanLayer) {
      kecamatanLayer.resetStyle(layer);
    }
    layer.closeTooltip();
  }

  /* ---- Click: neon highlight + popup + leader line ---- */
  function onKecamatanClick(e, layer, feature, nameRaw, label, tipe, desc, areaKm2, areaHa) {
    L.DomEvent.stopPropagation(e);

    const clickLL = e.latlng;
    const center  = layer.getBounds().getCenter();

    // 1. Reset previous active
    if (activeKecamatanLayer) {
      kecamatanLayer.resetStyle(activeKecamatanLayer);
    }
    activeKecamatanLayer = layer;
    layer.setStyle(styleActive());
    layer.bringToFront();

    // 2. Neon glowing outline highlight — separate GeoJSON layer on top
    removeNeonHighlight();
    neonHighlightLayer = L.geoJSON(feature, {
      style: {
        color: '#00FFFF',
        weight: 4,
        opacity: 1,
        fillOpacity: 0,
        className: 'neon-border',
      },
    }).addTo(map);

    // 3. Leader line + click marker
    clearLeaderLine();
    clickLeaderLine = L.polyline([clickLL, center], {
      color: '#00FFFF',
      weight: 2,
      dashArray: '6,5',
      opacity: 0.85,
    }).addTo(map);

    clickMarker = L.circleMarker(clickLL, {
      radius: 7,
      color: '#00FFFF',
      fillColor: '#040806',
      fillOpacity: 1,
      weight: 2.5,
    }).addTo(map);

    // 4. Popup
    const fmtKm2 = areaKm2.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtHa  = areaHa.toLocaleString('id-ID');

    const html = `
      <div class="kecamatan-popup">
        <div class="kecamatan-popup__header">
          <span class="kecamatan-popup__badge">${tipe}</span>
          <h4 class="kecamatan-popup__title">Distrik ${label}</h4>
        </div>
        <div class="kecamatan-popup__body">
          <div class="popup-metric-box">
            <span class="popup-metric-lbl">Luas Wilayah</span>
            <div class="popup-metric-val">${fmtKm2} <small>km²</small></div>
            <span class="popup-metric-sub">${fmtHa} Ha</span>
          </div>
          <p class="kecamatan-popup__desc">${desc}</p>
          <div class="popup-coord-info">
            <span>Koordinat klik</span>
            <code>${clickLL.lat.toFixed(4)}°, ${clickLL.lng.toFixed(4)}°</code>
          </div>
        </div>
        <div class="kecamatan-popup__footer">
          <span>Kabupaten Merauke</span>
          <span>Papua Selatan</span>
        </div>
      </div>`;

    L.popup({ maxWidth: 300, className: 'kecamatan-popup-wrap' })
      .setLatLng(clickLL)
      .setContent(html)
      .openOn(map);
  }

  function removeNeonHighlight() {
    if (neonHighlightLayer) { map.removeLayer(neonHighlightLayer); neonHighlightLayer = null; }
  }

  function clearLeaderLine() {
    if (clickLeaderLine) { map.removeLayer(clickLeaderLine); clickLeaderLine = null; }
    if (clickMarker)     { map.removeLayer(clickMarker);     clickMarker = null;     }
  }

  /* -----------------------------------------------------------------------
     MAP BACKGROUND CLICK (deselect)
  ----------------------------------------------------------------------- */
  function onMapClickBackground(e) {
    if (measureActive) { addMeasurePoint(e.latlng); return; }
    // deselect if click was not consumed by a polygon
    if (!e.originalEvent._stopped) {
      if (activeKecamatanLayer) {
        kecamatanLayer.resetStyle(activeKecamatanLayer);
        activeKecamatanLayer = null;
      }
      removeNeonHighlight();
      clearLeaderLine();
    }
  }

  /* -----------------------------------------------------------------------
     OVERLAY LAYERS
  ----------------------------------------------------------------------- */
  function buildOverlayLayers() {
    const b = vegStats.shared_bounds;
    const bounds = [[b.south, b.west], [b.north, b.east]];

    aoiOutlineLayer = L.rectangle(bounds, {
      renderer: canvasRenderer,
      color: '#FFD60A', weight: 1.5, dashArray: '5,5', fill: false, interactive: false,
    });

    Object.keys(PERIOD_META).forEach(period => {
      Object.keys(CLASS_META).forEach(cls => {
        const key = `${cls}_${period}`;
        loadedOverlayLayers[key] = L.imageOverlay(
          `${OVERLAY_IMG_DIR}${key}.png`, bounds, { opacity: 0.88, interactive: false }
        );
      });
    });
  }

  function fitToBounds() {
    const b = vegStats.shared_bounds;
    map.fitBounds([[b.south, b.west], [b.north, b.east]], { padding: [20, 20] });
  }

  /* -----------------------------------------------------------------------
     LAYER CONTROL
  ----------------------------------------------------------------------- */
  function buildLayerControl() {
    const overlays = {};

    Object.keys(PERIOD_META).forEach(period => {
      Object.entries(CLASS_META).forEach(([cls, meta]) => {
        const key   = `${cls}_${period}`;
        const chip  = `<span class="layer-chip layer-chip--${cls}"></span>`;
        const label = `${chip}<span>${meta.label} ${PERIOD_META[period]}</span>`;
        overlays[label] = loadedOverlayLayers[key];
        if (period === '2023_2025') loadedOverlayLayers[key].addTo(map);
      });
    });

    const aoiLabel = '<span class="layer-chip layer-chip--target"></span><span>Cakupan Analisis</span>';
    overlays[aoiLabel] = aoiOutlineLayer;
    aoiOutlineLayer.addTo(map);

    const kecLabel = '<span class="layer-chip layer-chip--kecamatan"></span><span>Batas Kecamatan</span>';

    const control = L.control.layers(basemapLayers, overlays, { collapsed: true, position: 'topright' }).addTo(map);

    // Add kecamatan overlay once loaded
    const waitForKec = setInterval(() => {
      if (kecamatanLayer) {
        clearInterval(waitForKec);
        control.addOverlay(kecamatanLayer, kecLabel);
        groupAndAnnotateControl(control);
      }
    }, 150);

    map.on('overlayadd overlayremove', updateLegend);
    updateLegend();
  }

  const GROUP_DEFS = [
    { title: 'Peta Perubahan Vegetasi (data asli)', size: 9 },
    { title: 'Batas Administrasi', size: 1 },
  ];
  const DISABLED_ROWS = [
    { group: 'Citra & Indeks Vegetasi (segera hadir)', items: ['Citra RGB Sentinel-2 2023', 'Citra RGB Sentinel-2 2025', 'Indeks NDVI', 'Indeks NDMI', 'Indeks NDBI'] },
  ];

  function groupAndAnnotateControl(control) {
    const container = control.getContainer();
    const overlaysList = container.querySelector('.leaflet-control-layers-overlays');
    if (!overlaysList) return;
    const rows = overlaysList.querySelectorAll('label');

    let cursor = 0;
    GROUP_DEFS.forEach(g => {
      const refRow = rows[cursor];
      if (refRow) {
        const header = document.createElement('div');
        header.className = 'layer-group-header';
        header.textContent = g.title;
        overlaysList.insertBefore(header, refRow);
      }
      cursor += g.size;
    });

    DISABLED_ROWS.forEach(section => {
      const header = document.createElement('div');
      header.className = 'layer-group-header';
      header.textContent = section.group;
      overlaysList.appendChild(header);
      section.items.forEach(label => {
        const row = document.createElement('label');
        row.className = 'layer-row--disabled';
        row.innerHTML = `<input type="checkbox" disabled class="leaflet-control-layers-selector" />
          <span>${label}</span><span class="layer-soon-tag">segera hadir</span>`;
        overlaysList.appendChild(row);
      });
    });
  }

  /* -----------------------------------------------------------------------
     LEGEND
  ----------------------------------------------------------------------- */
  function updateLegend() {
    const el = document.getElementById('gis-legend-items');
    if (!el || !map) return;
    const activeClasses = new Set();
    let showKec = false;

    Object.entries(loadedOverlayLayers).forEach(([key, layer]) => {
      if (map.hasLayer(layer)) activeClasses.add(key.split('_')[0]);
    });
    if (kecamatanLayer && map.hasLayer(kecamatanLayer)) showKec = true;

    const items = [];
    activeClasses.forEach(cls => {
      const meta = CLASS_META[cls];
      items.push(`<div class="gis-legend-item"><span class="gis-legend-swatch" style="background:${meta.color}"></span>${meta.label}</div>`);
    });
    if (showKec) {
      items.push(`<div class="gis-legend-item"><span class="gis-legend-swatch" style="background:transparent;border:2px solid #22D3EE;border-radius:2px;"></span>Batas Kecamatan</div>`);
    }
    el.innerHTML = items.length
      ? items.join('')
      : '<span style="color:var(--color-text-muted);font-size:11px;">Tidak ada layer aktif</span>';
  }

  /* -----------------------------------------------------------------------
     COORDINATE READOUT
  ----------------------------------------------------------------------- */
  function onMouseMove(e) {
    const el = document.getElementById('gis-coord-readout');
    if (el) el.textContent = `Lat: ${e.latlng.lat.toFixed(4)}  Lng: ${e.latlng.lng.toFixed(4)}`;
  }

  /* -----------------------------------------------------------------------
     OVERVIEW MAP
  ----------------------------------------------------------------------- */
  function initOverviewMap() {
    overviewMap = L.map('gis-overview-map', {
      zoomControl: false, attributionControl: false, dragging: false,
      scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, touchZoom: false,
    }).setView([-8.0, 139.3], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 10 }).addTo(overviewMap);
    overviewRect = L.rectangle(map.getBounds(), { color: '#22D3EE', weight: 1.5, fillOpacity: 0.08 }).addTo(overviewMap);
    map.on('moveend', () => overviewRect.setBounds(map.getBounds()));
  }

  /* -----------------------------------------------------------------------
     MEASURE TOOL
  ----------------------------------------------------------------------- */
  function initMeasureTool() {
    const btn      = document.getElementById('gis-measure');
    const clearBtn = document.getElementById('gis-measure-clear');
    btn.addEventListener('click', () => {
      measureActive = !measureActive;
      btn.classList.toggle('gis-tool-btn--active', measureActive);
      map.getContainer().style.cursor = measureActive ? 'crosshair' : '';
    });
    clearBtn.addEventListener('click', clearMeasure);
  }

  function addMeasurePoint(latlng) {
    measurePoints.push(latlng);
    measureMarkers.push(
      L.circleMarker(latlng, { radius: 4, color: '#22D3EE', fillColor: '#22D3EE', fillOpacity: 1 }).addTo(map)
    );
    if (measureLine) map.removeLayer(measureLine);
    if (measurePoints.length > 1) {
      measureLine = L.polyline(measurePoints, { color: '#22D3EE', weight: 2, dashArray: '4,4' }).addTo(map);
    }
    updateMeasureReadout();
  }

  function updateMeasureReadout() {
    const readout  = document.getElementById('gis-measure-readout');
    const valueEl  = document.getElementById('gis-measure-value');
    if (measurePoints.length < 2) { readout.classList.add('gis-measure-readout--hidden'); return; }
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) total += haversineMeters(measurePoints[i-1], measurePoints[i]);
    valueEl.textContent = (total / 1000).toFixed(2);
    readout.classList.remove('gis-measure-readout--hidden');
  }

  function haversineMeters(a, b) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function clearMeasure() {
    measurePoints = [];
    measureMarkers.forEach(m => map.removeLayer(m));
    measureMarkers = [];
    if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
    document.getElementById('gis-measure-readout').classList.add('gis-measure-readout--hidden');
  }

  /* -----------------------------------------------------------------------
     FULLSCREEN & PRINT
  ----------------------------------------------------------------------- */
  function initFullscreen() {
    const btn = document.getElementById('gis-fullscreen');
    btn.addEventListener('click', () => {
      const shell = document.querySelector('.gis-shell');
      if (!document.fullscreenElement) { shell.requestFullscreen?.(); btn.classList.add('gis-tool-btn--active'); }
      else { document.exitFullscreen?.(); btn.classList.remove('gis-tool-btn--active'); }
    });
    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => map && map.invalidateSize(), 150);
      if (!document.fullscreenElement) document.getElementById('gis-fullscreen').classList.remove('gis-tool-btn--active');
    });
  }

  function initPrint() {
    document.getElementById('gis-print').addEventListener('click', () => window.print());
  }

  /* -----------------------------------------------------------------------
     SEARCH
  ----------------------------------------------------------------------- */
  function initSearch() {
    const input     = document.getElementById('gis-search-input');
    const resultsEl = document.getElementById('gis-search-results');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { resultsEl.classList.remove('gis-search__results--visible'); return; }
      renderSearchResults(GIS_PLACES.filter(p => p.name.toLowerCase().includes(q)), resultsEl, input);
    });
    input.addEventListener('focus', () => {
      if (input.value.trim()) resultsEl.classList.add('gis-search__results--visible');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.gis-search')) resultsEl.classList.remove('gis-search__results--visible');
    });
  }

  function renderSearchResults(matches, resultsEl, input) {
    if (!matches.length) {
      resultsEl.innerHTML = '<div class="gis-search__result">Lokasi tidak ditemukan.</div>';
    } else {
      resultsEl.innerHTML = matches.map((p, i) =>
        `<div class="gis-search__result" data-idx="${i}">
           <span class="gis-search__result-name">${p.name}</span>${p.note}
         </div>`
      ).join('');
      resultsEl.querySelectorAll('.gis-search__result').forEach((row, i) => {
        row.addEventListener('click', () => {
          const p = matches[i];
          map.flyTo([p.lat, p.lng], p.zoom, { duration: 1.1 });
          L.popup().setLatLng([p.lat, p.lng]).setContent(`<strong>${p.name}</strong><br/>${p.note}`).openOn(map);
          input.value = p.name;
          resultsEl.classList.remove('gis-search__results--visible');
        });
      });
    }
    resultsEl.classList.add('gis-search__results--visible');
  }

  /* -----------------------------------------------------------------------
     FILTER DISTRIK
  ----------------------------------------------------------------------- */
  function initDistrikFilter() {
    const select = document.getElementById('gis-filter-distrik');

    // Use names from GeoJSON (raw NAME_3) for options, but show display label
    const kecNames = [
      'Animha','Eligobel','Ilyawab','Jagebob','Kaptel','Kimaam','Kurik','Malind',
      'Merauke','Muting','Naukenjerai','Ngguti','Okaba','Semangga','Sota',
      'Tabonji','TanahMiring','Tubang','Ulilin','Waan',
    ];
    kecNames.forEach(raw => {
      const opt = document.createElement('option');
      opt.value = raw;
      opt.textContent = displayName(raw);
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      if (!select.value) return;
      const targetRaw = select.value;
      if (kecamatanLayer) {
        let found = null;
        kecamatanLayer.eachLayer(l => {
          if ((l.feature.properties.NAME_3 || '') === targetRaw) found = l;
        });
        if (found) {
          map.flyToBounds(found.getBounds(), { padding: [40, 40], duration: 1.1 });
          setTimeout(() => found.fire('click', { latlng: found.getBounds().getCenter() }), 1200);
          return;
        }
      }
      const known = GIS_PLACES.find(p => p.name.toLowerCase().includes(targetRaw.toLowerCase()));
      if (known) map.flyTo([known.lat, known.lng], known.zoom, { duration: 1.1 });
    });
  }

  return { init };
})();
