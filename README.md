# Haknim — Real-Time Crypto Dashboard

> Live cryptocurrency market data for 50 coins, powered by the free CoinGecko API. No API key. No backend. No build step.

---

## ✨ Features

- **Live Data** — Top 50 coins by market cap, auto-refreshes every 60 seconds
- **Global Stats** — Total market cap, 24h volume, BTC dominance in the header
- **Hero Cards** — Top 3 coins highlighted with large sparkline charts
- **Interactive Grid** — Search, sort by market cap / price / 24h change / volume
- **Grid & List View** — Toggle between layouts
- **Sparkline Charts** — 7-day price trend drawn on every card (pure Canvas API)
- **Coin Detail Modal** — Full stats + 7-day chart on click
- **Watchlist** — Star any coin to pin it; saved to localStorage
- **Zero Dependencies** — Pure HTML, CSS, Vanilla JS. No npm, no build tools.

---

## 🖥️ Live Demo

> **[View Live Demo](#)** ← *[](https://github.com/Follytechnologies/pulse-crypto-dashboard.git)*

---

## 🚀 Getting Started

Because this project uses only the browser's built-in `fetch` API and no server-side code, it runs directly from GitHub Pages.

```bash
# Clone the repo
git clone https://github.com/Follytechnologies/pulse-crypto-dashboard.git
cd pulse-crypto-dashboard

# Open in browser — that's it!
open index.html
```

No `npm install`. No `.env` file. No server needed.

---

## 📁 Project Structure

```
pulse-crypto-dashboard/
│
├── index.html    ← Markup only
├── style.css     ← All styles, animations, responsive design
├── app.js        ← All logic: fetch, render, charts, watchlist, modal
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styles | CSS3 (grid, custom properties, animations, backdrop-filter) |
| Logic | Vanilla JavaScript (ES6+, async/await) |
| Charts | HTML5 Canvas API (custom sparklines) |
| Data | CoinGecko Public API (free, no key) |
| Storage | localStorage (watchlist persistence) |
| Fonts | Google Fonts — Bebas Neue, IBM Plex Mono, IBM Plex Sans |

---

## 📡 API Used

**CoinGecko Free API** — `https://api.coingecko.com/api/v3`

| Endpoint | Purpose |
|---|---|
| `/coins/markets` | Top 50 coins with prices, changes, sparklines |
| `/global` | Total market cap, volume, BTC dominance |

- ✅ No API key required
- ✅ No rate limit for public use (60 calls/min)
- ✅ CORS-friendly — works directly from browser

---

## ⚙️ How It Works

1. On load, fetches global market stats and top 50 coins simultaneously
2. Renders hero cards for top 3, then all 50 coins as cards
3. Sparklines drawn using the Canvas API from 7-day price data
4. Search filters in real-time; sort tabs re-sort without re-fetching
5. Clicking a card opens a modal with full stats and a larger chart
6. Watchlist saved to `localStorage` — persists across sessions
7. Auto-refreshes every 60 seconds

---

## 🔧 Customization

| What | Where in `app.js` |
|---|---|
| Number of coins | Change `per_page=50` in `COINS_URL` |
| Refresh interval | Change `REFRESH_MS = 60000` |
| Default currency | Change `vs_currency=usd` to `gbp`, `eur`, etc. |
| Default sort | Change `currentSort` initial value |

---

## 📄 License

MIT — free to use and modify.

---

## 👤 Author

**Abdulhakeem Ahmad** — Pure Mathematics student & Software Developer  
🖨️ Founder of **Folly Technologies & D'BEST Design & Prints**

- GitHub: [@Abdulhakeem Ahmad Folorunso](https://github.com/Follytechnologies)

---

