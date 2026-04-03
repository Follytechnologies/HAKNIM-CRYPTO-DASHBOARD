// ─── Config ───────────────────────────────────────────────────────────────────
// CoinGecko free public API — NO API key required, works straight from browser
const API_BASE     = 'https://api.coingecko.com/api/v3';
const COINS_URL    = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d`;
const GLOBAL_URL   = `${API_BASE}/global`;
const REFRESH_MS   = 60000; // refresh every 60 seconds

// ─── State ────────────────────────────────────────────────────────────────────
let allCoins     = [];
let watchlist    = JSON.parse(localStorage.getItem('pulse_watchlist') || '[]');
let currentSort  = 'market_cap';
let currentView  = 'grid';
let searchQuery  = '';
let selectedCoin = null;

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const coinsGrid      = document.getElementById('coinsGrid');
const heroCards      = document.getElementById('heroCards');
const coinCount      = document.getElementById('coinCount');
const searchInput    = document.getElementById('searchInput');
const lastUpdated    = document.getElementById('lastUpdated');
const refreshRing    = document.getElementById('refreshRing');
const modalOverlay   = document.getElementById('modalOverlay');
const modalClose     = document.getElementById('modalClose');
const watchlistGrid  = document.getElementById('watchlistGrid');
const clearWatchlist = document.getElementById('clearWatchlist');

// ─── Formatting ───────────────────────────────────────────────────────────────
function formatPrice(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1)    return '$' + n.toFixed(4);
  return '$' + n.toFixed(6);
}

function formatLarge(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

function formatChange(n) {
  if (n === null || n === undefined) return '—';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(2) + '%';
}

function changeClass(n) {
  return n >= 0 ? 'positive' : 'negative';
}

function changeTextClass(n) {
  return n >= 0 ? 'positive-text' : 'negative-text';
}

// ─── Sparkline Drawing ────────────────────────────────────────────────────────
function drawSparkline(canvas, prices, color) {
  if (!prices || prices.length < 2) return;
  const ctx  = canvas.getContext('2d');
  const w    = canvas.width;
  const h    = canvas.height;
  const min  = Math.min(...prices);
  const max  = Math.max(...prices);
  const range = max - min || 1;

  ctx.clearRect(0, 0, w, h);

  const pts = prices.map((p, i) => ({
    x: (i / (prices.length - 1)) * w,
    y: h - ((p - min) / range) * h * 0.85 - h * 0.05
  }));

  // Fill
  ctx.beginPath();
  ctx.moveTo(pts[0].x, h);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + '40');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Fetch Global Market Data ─────────────────────────────────────────────────
async function fetchGlobal() {
  try {
    const res  = await fetch(GLOBAL_URL);
    const json = await res.json();
    const data = json.data;

    document.getElementById('totalMarketCap').textContent =
      formatLarge(data.total_market_cap?.usd);
    document.getElementById('totalVolume').textContent =
      formatLarge(data.total_volume?.usd);
    document.getElementById('btcDominance').textContent =
      data.market_cap_percentage?.btc?.toFixed(1) + '%';
  } catch (e) {
    console.warn('Global fetch failed:', e);
  }
}

// ─── Fetch Coins ──────────────────────────────────────────────────────────────
async function fetchCoins() {
  refreshRing.classList.add('spinning');

  try {
    const res  = await fetch(COINS_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allCoins = await res.json();

    renderHero();
    renderCoins();
    renderWatchlist();

    lastUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch (err) {
    console.error('Fetch failed:', err);
    lastUpdated.textContent = 'Update failed — retrying...';
  } finally {
    refreshRing.classList.remove('spinning');
  }
}

// ─── Render Hero Cards (Top 3) ────────────────────────────────────────────────
function renderHero() {
  const top3 = [...allCoins].slice(0, 3);
  heroCards.innerHTML = '';

  top3.forEach((coin, idx) => {
    const change = coin.price_change_percentage_24h;
    const color  = change >= 0 ? '#39d353' : '#f85149';
    const card   = document.createElement('div');
    card.className = 'hero-card';
    card.innerHTML = `
      <div class="hero-rank">${idx + 1}</div>
      <div class="hero-coin-row">
        <img class="hero-icon" src="${coin.image}" alt="${coin.name}" loading="lazy"/>
        <div>
          <div class="hero-name">${coin.name}</div>
          <div class="hero-symbol">${coin.symbol}</div>
        </div>
      </div>
      <div class="hero-price">${formatPrice(coin.current_price)}</div>
      <div class="hero-change ${changeTextClass(change)}">${formatChange(change)} (24h)</div>
      <canvas class="hero-sparkline" width="180" height="50"></canvas>
    `;

    const canvas = card.querySelector('canvas');
    setTimeout(() => drawSparkline(canvas, coin.sparkline_in_7d?.price, color), 0);

    card.addEventListener('click', () => openModal(coin));
    heroCards.appendChild(card);
  });
}

// ─── Render Coin Cards ────────────────────────────────────────────────────────
function renderCoins() {
  let coins = [...allCoins];

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    coins = coins.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  }

  // Sort
  if (currentSort === 'price_change') {
    coins.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  } else if (currentSort === 'volume') {
    coins.sort((a, b) => b.total_volume - a.total_volume);
  } else if (currentSort === 'price') {
    coins.sort((a, b) => b.current_price - a.current_price);
  }
  // default: market_cap (already sorted from API)

  coinCount.textContent = `${coins.length} coins`;
  coinsGrid.innerHTML = '';

  if (coins.length === 0) {
    coinsGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;font-family:var(--font-mono);color:var(--muted);">No coins found for "${searchQuery}"</div>`;
    return;
  }

  coins.forEach((coin, idx) => {
    const change   = coin.price_change_percentage_24h;
    const color    = change >= 0 ? '#39d353' : '#f85149';
    const starred  = watchlist.includes(coin.id);
    const card     = document.createElement('div');
    card.className = `coin-card${currentView === 'list' ? ' list-view' : ''}`;
    card.style.animationDelay = `${Math.min(idx * 30, 300)}ms`;

    card.innerHTML = `
      <button class="star-btn ${starred ? 'starred' : ''}" data-id="${coin.id}" title="Add to watchlist">★</button>
      <div class="card-top">
        <div class="card-coin-info">
          <img class="coin-icon" src="${coin.image}" alt="${coin.name}" loading="lazy"/>
          <div class="coin-name-block">
            <span class="coin-name">${coin.name}</span>
            <span class="coin-symbol">${coin.symbol}</span>
          </div>
        </div>
        <span class="card-rank">#${coin.market_cap_rank}</span>
      </div>
      <canvas class="card-sparkline" width="200" height="36"></canvas>
      <div class="card-price">${formatPrice(coin.current_price)}</div>
      <div class="card-bottom">
        <span class="card-change ${changeClass(change)}">${formatChange(change)}</span>
        <span class="card-volume">Vol ${formatLarge(coin.total_volume)}</span>
      </div>
    `;

    const canvas = card.querySelector('canvas');
    setTimeout(() => drawSparkline(canvas, coin.sparkline_in_7d?.price, color), 0);

    // Star button
    card.querySelector('.star-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleWatchlist(coin.id);
      renderCoins();
      renderWatchlist();
    });

    card.addEventListener('click', () => openModal(coin));
    coinsGrid.appendChild(card);
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────
function toggleWatchlist(id) {
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter(w => w !== id);
  } else {
    watchlist.push(id);
  }
  localStorage.setItem('pulse_watchlist', JSON.stringify(watchlist));
}

function renderWatchlist() {
  const coins = allCoins.filter(c => watchlist.includes(c.id));
  watchlistGrid.innerHTML = '';

  if (coins.length === 0) {
    watchlistGrid.innerHTML = `<div class="watchlist-empty">Click the ★ on any coin to add it here</div>`;
    return;
  }

  coins.forEach(coin => {
    const change = coin.price_change_percentage_24h;
    const el = document.createElement('div');
    el.className = 'watchlist-card';
    el.innerHTML = `
      <img class="wl-icon" src="${coin.image}" alt="${coin.name}" loading="lazy"/>
      <div class="wl-name">${coin.name}</div>
      <div class="wl-price ${changeTextClass(change)}">${formatChange(change)}</div>
    `;
    el.addEventListener('click', () => openModal(coin));
    watchlistGrid.appendChild(el);
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(coin) {
  selectedCoin = coin;
  const change = coin.price_change_percentage_24h;
  const color  = change >= 0 ? '#39d353' : '#f85149';

  document.getElementById('modalIcon').src   = coin.image;
  document.getElementById('modalIcon').alt   = coin.name;
  document.getElementById('modalName').textContent   = coin.name;
  document.getElementById('modalSymbol').textContent = coin.symbol.toUpperCase();
  document.getElementById('modalPrice').textContent  = formatPrice(coin.current_price);

  const modalChange = document.getElementById('modalChange');
  modalChange.textContent  = formatChange(change) + ' (24h)';
  modalChange.className    = 'modal-change ' + changeTextClass(change);

  const stats = [
    { label: 'MARKET CAP',   value: formatLarge(coin.market_cap) },
    { label: '24H VOLUME',   value: formatLarge(coin.total_volume) },
    { label: 'RANK',         value: '#' + coin.market_cap_rank },
    { label: '24H HIGH',     value: formatPrice(coin.high_24h) },
    { label: '24H LOW',      value: formatPrice(coin.low_24h) },
    { label: 'CIRCULATING',  value: formatLarge(coin.circulating_supply) },
  ];

  document.getElementById('modalStats').innerHTML = stats.map(s => `
    <div class="stat-block">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.value}</div>
    </div>
  `).join('');

  const canvas = document.getElementById('modalChart');
  setTimeout(() => drawSparkline(canvas, coin.sparkline_in_7d?.price, color), 0);

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  renderCoins();
});

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSort = tab.dataset.sort;
    renderCoins();
  });
});

document.getElementById('viewGrid').addEventListener('click', () => {
  currentView = 'grid';
  coinsGrid.classList.remove('list-view');
  document.getElementById('viewGrid').classList.add('active');
  document.getElementById('viewList').classList.remove('active');
  renderCoins();
});

document.getElementById('viewList').addEventListener('click', () => {
  currentView = 'list';
  coinsGrid.classList.add('list-view');
  document.getElementById('viewList').classList.add('active');
  document.getElementById('viewGrid').classList.remove('active');
  renderCoins();
});

clearWatchlist.addEventListener('click', () => {
  watchlist = [];
  localStorage.removeItem('pulse_watchlist');
  renderCoins();
  renderWatchlist();
});

// ─── Init & Auto-refresh ──────────────────────────────────────────────────────
fetchGlobal();
fetchCoins();
setInterval(() => {
  fetchGlobal();
  fetchCoins();
}, REFRESH_MS);
