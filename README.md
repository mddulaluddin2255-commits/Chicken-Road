# Chicken Road Points

A high-performance, mobile-responsive arcade chicken crossing game with multiplier progression, crash mechanics, and rewarded VAST video advertisements.

> **IMPORTANT NOTICE: VIRTUAL POINTS ONLY**  
> No Cash Value • No Deposits • No Withdrawals • No Real-Money Betting • No Cryptocurrency.  
> All points and scores are purely virtual arcade metrics for entertainment.

---

## Features

1. **Arcade Chicken Road Gameplay**:
   - 11 dynamically simulated lanes (asphalt roads, city avenues, express highways, safe refuge islands, and a golden victory finish line).
   - Moving vehicles including sports cars, yellow taxis, freight trucks, buses, and delivery vans with animated headlights and rotating wheels.
   - Smooth 60 FPS HTML5 Canvas renderer with physics particles (feathers explosion on crash, coin cascade on point claims).
   - Touch-friendly, portrait-optimized mobile interface (360px - 412px phones, tablets, desktop).

2. **Starting Points & Entry Cost**:
   - Every new player starts with strictly **200 Virtual Points**.
   - Pressing **START GAME** deducts exactly **20 Virtual Points**.
   - If points drop below 20, the start button is disabled and instructs the player to watch a rewarded video ad for +200 points.
   - Balance never goes negative.

3. **Crash & Multiplier Progression**:
   - Progressing across road lanes increases the multiplier from `1.00x` up to `50.00x`.
   - Separate UI cards display **Current Multiplier** and **Current Round Points**.
   - Cryptographically randomized, unpredictable vehicle crash hazard on road lanes. Safe islands offer 0% crash risk.
   - Players can press **CLAIM POINTS** at any safe moment to bank the virtual points.

4. **Two VAST Video Ad Placements**:
   - **Location 1 (Rewarded Ad)**: `WATCH AD +200 POINTS` button on dashboard. Streams the official VAST video ad; awards +200 Virtual Points strictly upon verified completion. Duplicate reward callbacks are prevented.
   - **Location 2 (In-Game Sponsored Ad)**: Visually separated in-game sponsored video card (`SPONSORED VIDEO`). Does not award points unless explicitly watched via the rewarded ad flow.
   - Graceful fallback with clear feedback if ad servers are unreachable or restricted by browser CORS/adblock.

5. **Competitive Leaderboard & Profile**:
   - Navigation: `GAME | LEADERBOARD | PROFILE`.
   - Dynamic rankings with 🥇, 🥈, 🥉 trophies and user highlights.
   - Profile tracks games played, best multiplier, total points earned, and recent round histories.

---

## Deployment (Netlify / Static Hosting)

The application builds cleanly into static assets:
```bash
npm run build
```
Output directory: `dist/`  
Publish directory on Netlify: `dist`
