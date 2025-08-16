// Dynamic Neon Glow Visitor Badge (Blue/Purple)
// Endpoint: /api/neon-visitors?page_id=chiragvaze.chiragvaze

module.exports = async function (req, res) {
  try {
    const { searchParams } = new URL(req.url, "http://localhost");
    const page_id = searchParams.get("page_id") || "chiragvaze.chiragvaze";
    const theme = (searchParams.get("theme") || "dark").toLowerCase();
    const scale = Math.max(0.5, Math.min(2, Number(searchParams.get("scale") || 1)));
    const glowOn = (searchParams.get("glow") || "on").toLowerCase() !== "off";

    const upstream = `https://visitor-badge.laobi.icu/badge?page_id=${encodeURIComponent(
      page_id
    )}&left_color=${theme === "dark" ? "0b0f1a" : "e6f0ff"}&right_color=4f46e5&left_text=Profile%20Views`;

    const r = await fetch(upstream, {
      headers: { "User-Agent": "neon-visitor-badge/1.0" }
    });

    if (!r.ok) {
      throw new Error(`Upstream fetch failed: ${r.status} ${r.statusText}`);
    }

    const svgBadge = await r.text();
    const svgBase64 = Buffer.from(svgBadge).toString("base64");
    const dataHref = `data:image/svg+xml;base64,${svgBase64}`;

    const baseW = 360;
    const baseH = 100;
    const W = Math.round(baseW * scale);
    const H = Math.round(baseH * scale);

    const neon1 = "#22d3ee"; // cyan-blue
    const neon2 = "#8b5cf6"; // purple

    const bgStart = theme === "dark" ? "#060b16" : "#eef2ff";
    const bgEnd   = theme === "dark" ? "#0b1224" : "#e0e7ff";
    const panel   = theme === "dark" ? "#0b0f1a" : "#ffffff";

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${baseW} ${baseH}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgStart}"/>
      <stop offset="100%" stop-color="${bgEnd}"/>
    </linearGradient>

    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="50%" stop-color="rgba(255,255,255,0.12)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>

    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
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

  <rect width="${baseW}" height="${baseH}" fill="url(#bgGrad)"/>

  <g transform="translate(20,14)">
    <rect width="${baseW - 40}" height="${baseH - 28}" rx="16" ry="16" fill="${panel}" filter="url(#innerShadow)"/>
    <rect x="1" y="1" width="${baseW - 42}" height="${baseH - 30}" fill="url(#scan)" opacity="0.35"/>
  </g>

  <g transform="translate(${baseW/2 - 140/2}, ${baseH/2 - 24/2})">
    ${glowOn ? `<image href="${dataHref}" width="140" height="24" filter="url(#neonGlow)" opacity="0.95" />` : ``}
    <image href="${dataHref}" width="140" height="24" />
  </g>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).send(svg);

  } catch (err) {
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
};
