// Dynamic Neon Glow Visitor Badge (Blue/Purple)
// Endpoint: /api/neon-visitors?page_id=chiragvaze.chiragvaze
// Optional query params:
//   page_id (required)  -> your visitor-badge page_id
//   theme               -> "dark" (default) or "light"
//   scale               -> number scale factor for badge (default 1)
//   glow                -> "on" (default) or "off"

export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, "http://localhost");
    const page_id = searchParams.get("page_id") || "chiragvaze.chiragvaze";
    const theme = (searchParams.get("theme") || "dark").toLowerCase();
    const scale = Math.max(0.5, Math.min(2, Number(searchParams.get("scale") || 1)));
    const glowOn = (searchParams.get("glow") || "on").toLowerCase() !== "off";

    // Build the upstream badge URL (SVG)
    // Tweak colors to fit the cyberpunk palette; these are just cosmetics,
    // the glow comes from our wrapper SVG filter below.
    const upstream = `https://visitor-badge.laobi.icu/badge?page_id=${encodeURIComponent(
      page_id
    )}&left_color=${theme === "dark" ? "0b0f1a" : "e6f0ff"}&right_color=4f46e5&left_text=Profile%20Views`;

    // Fetch the upstream SVG
    const r = await fetch(upstream, {
      headers: { "User-Agent": "neon-visitor-badge/1.0" }
    });

    if (!r.ok) {
      throw new Error(`Upstream fetch failed: ${r.status} ${r.statusText}`);
    }

    const svgBadge = await r.text();

    // Base64-encode the SVG so we can embed it safely as a data URI.
    const svgBase64 = Buffer.from(svgBadge).toString("base64");
    const dataHref = `data:image/svg+xml;base64,${svgBase64}`;

    // Canvas size; the badge is ~110-140px wide typically—give room for glow.
    const baseW = 360;
    const baseH = 100;
    const W = Math.round(baseW * scale);
    const H = Math.round(baseH * scale);

    // Neon colors (blue/purple blend)
    const neon1 = "#22d3ee"; // cyan-blue
    const neon2 = "#8b5cf6"; // purple

    // Light/dark background
    const bgStart = theme === "dark" ? "#060b16" : "#eef2ff";
    const bgEnd   = theme === "dark" ? "#0b1224" : "#e0e7ff";
    const panel   = theme === "dark" ? "#0b0f1a" : "#ffffff";

    // SVG with:
    // - Gradient background
    // - Rounded panel
    // - Glow filter using feGaussianBlur + feMerge
    // - Two layers of the badge: blurred (glow) + crisp on top
    // - Slight scale centering
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${baseW} ${baseH}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>

    <!-- Subtle animated scan line for vibe (safe for GitHub as it's inside the image) -->
    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="50%" stop-color="rgba(255,255,255,0.12)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>

    <!-- Neon glow filter -->
    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <!-- Tint the blur in two passes for blue/purple mix -->
      <feFlood flood-color="${neon1}" flood-opacity="0.9" result="f1"/>
      <feComposite in="f1" in2="blur" operator="in" result="b1"/>
      <feGaussianBlur in="b1" stdDeviation="2" result="b1g"/>

      <feFlood flood-color="${neon2}" flood-opacity="0.9" result="f2"/>
      <feComposite in="f2" in2="blur" operator="in" result="b2"/>
      <feGaussianBlur in="b2" stdDeviation="4" result="b2g"/>

      <feMerge>
        <feMergeNode in="b1g"/>
        <feMergeNode in="b2g"/>
      </feMerge>
    </filter>

    <!-- Soft inner shadow around the panel -->
    <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feOffset dx="0" dy="0"/>
      <feGaussianBlur stdDeviation="2" result="shadow"/>
      <feComposite in="shadow" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="
         0 0 0 0 0
         0 0 0 0 0
         0 0 0 0 0
         0 0 0 0.7 0" />
      <feComposite in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${baseW}" height="${baseH}" fill="url(#bgGrad)"/>

  <!-- Card panel -->
  <g transform="translate(20,14)">
    <rect width="${baseW - 40}" height="${baseH - 28}" rx="16" ry="16" fill="${panel}" filter="url(#innerShadow)"/>
    <!-- Scan line -->
    <rect x="1" y="1" width="${baseW - 42}" height="${baseH - 30}" fill="url(#scan)" opacity="0.35"/>
  </g>

  <!-- Center group for the badge -->
  <g transform="translate(${baseW/2 - 140/2}, ${baseH/2 - 24/2})">
    <!-- GLOW layer -->
    ${
      glowOn
        ? `<image href="${dataHref}" width="140" height="24" filter="url(#neonGlow)" opacity="0.95" />`
        : ``
    }
    <!-- Crisp badge on top -->
    <image href="${dataHref}" width="140" height="24" />
  </g>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    // Avoid heavy caching so new visits update quickly.
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(svg);
  } catch (err) {
    // Fallback text badge if anything fails
    const msg = (err && err.message) ? String(err.message).slice(0, 200) : "Unknown error";
    const fallback = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="100" viewBox="0 0 360 100">
  <rect width="360" height="100" fill="#0b0f1a"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="14" fill="#22d3ee">
    Neon Visitors: ${msg}
  </text>
</svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(fallback);
  }
}
