/**
 * Inline SVG mockups for portal product cards.
 *
 * We embed the markup directly (instead of `<img src="…/foo.svg">`) so that:
 *  - rendering never depends on a network request,
 *  - PWA service workers / browser HTTP caches cannot serve a stale 404,
 *  - image swaps do not require a deploy of `public/` assets.
 *
 * When a real screenshot becomes available, replace the corresponding entry
 * with a `<picture>` + WebP in `PortalHome.tsx`. See `docs/PORTAL_PREVIEWS.md`.
 */

export const HIT_FACTOR_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hit Factor calculator preview">
  <defs>
    <linearGradient id="hf-bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#fefce8"/>
      <stop offset="100%" stop-color="#fef9c3"/>
    </linearGradient>
    <linearGradient id="hf-card" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="640" height="400" fill="url(#hf-bg)"/>

  <text x="40" y="50" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="800" fill="#0f172a">Hit Factor</text>
  <rect x="155" y="34" width="56" height="20" rx="10" fill="#fde68a"/>
  <text x="183" y="48" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="#92400e">Major</text>

  <g>
    <rect x="40" y="72" width="170" height="64" rx="10" fill="url(#hf-card)" stroke="#e2e8f0"/>
    <text x="56" y="92" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Required hits</text>
    <text x="56" y="124" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="800" fill="#0f172a">12</text>

    <rect x="226" y="72" width="170" height="64" rx="10" fill="url(#hf-card)" stroke="#e2e8f0"/>
    <text x="242" y="92" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Time</text>
    <text x="242" y="124" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="800" fill="#0f172a">11.53 s</text>

    <rect x="412" y="72" width="188" height="64" rx="10" fill="url(#hf-card)" stroke="#e2e8f0"/>
    <text x="428" y="92" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Misses · Penalties</text>
    <rect x="428" y="102" width="40" height="24" rx="6" fill="#fee2e2"/>
    <text x="448" y="119" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="#b91c1c">M 1</text>
    <rect x="476" y="102" width="56" height="24" rx="6" fill="#fef3c7"/>
    <text x="504" y="119" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="#92400e">PE 1</text>
  </g>

  <rect x="40" y="156" width="356" height="120" rx="14" fill="#4f46e5"/>
  <text x="60" y="184" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="#c7d2fe">HIT FACTOR</text>
  <text x="60" y="246" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="800" fill="#ffffff">5.20</text>
  <text x="232" y="246" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="#c7d2fe">/ max 6.50</text>

  <rect x="412" y="156" width="188" height="58" rx="10" fill="url(#hf-card)" stroke="#e2e8f0"/>
  <text x="428" y="176" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">HF loss</text>
  <text x="428" y="202" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="800" fill="#dc2626">1.30</text>

  <rect x="412" y="218" width="188" height="58" rx="10" fill="url(#hf-card)" stroke="#e2e8f0"/>
  <text x="428" y="238" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Cost in seconds</text>
  <text x="428" y="264" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="800" fill="#0f172a">+2.50 s</text>

  <rect x="40" y="296" width="560" height="64" rx="14" fill="#ecfeff" stroke="#a5f3fc"/>
  <circle cx="76" cy="328" r="16" fill="#22d3ee"/>
  <text x="76" y="333" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#ffffff">A</text>
  <text x="106" y="324" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="#0e7490">FOCUS · ACCURACY</text>
  <text x="106" y="346" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#0f172a">Misses cost more than 1 s — slow down to add Alphas.</text>
</svg>`

export const RO_HELPER_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" role="img" aria-label="RO Helper rules reference preview">
  <defs>
    <linearGradient id="ro-bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#f5f3ff"/>
      <stop offset="100%" stop-color="#ede9fe"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="640" height="400" fill="url(#ro-bg)"/>

  <rect x="40" y="28" width="560" height="40" rx="10" fill="#ffffff" stroke="#e2e8f0"/>
  <circle cx="64" cy="48" r="7" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <line x1="69" y1="53" x2="76" y2="60" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
  <text x="86" y="53" font-family="Inter, system-ui, sans-serif" font-size="13" fill="#94a3b8">Search rules: 5.7 trigger, SOS, FPSU…</text>
  <rect x="528" y="36" width="60" height="24" rx="6" fill="#4f46e5"/>
  <text x="558" y="52" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="#ffffff">Cite</text>

  <g font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700">
    <rect x="40" y="84" width="80" height="24" rx="12" fill="#4f46e5"/>
    <text x="80" y="100" text-anchor="middle" fill="#ffffff">Procedures</text>
    <rect x="128" y="84" width="68" height="24" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="162" y="100" text-anchor="middle" fill="#475569">Penalties</text>
    <rect x="204" y="84" width="64" height="24" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="236" y="100" text-anchor="middle" fill="#475569">Scoring</text>
    <rect x="276" y="84" width="76" height="24" rx="12" fill="#ffffff" stroke="#cbd5e1"/>
    <text x="314" y="100" text-anchor="middle" fill="#475569">Equipment</text>
  </g>

  <rect x="40" y="124" width="560" height="74" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="40" y="124" width="6" height="74" fill="#f59e0b"/>
  <text x="62" y="148" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a">5.7.4 — Hand on the gun before the START signal</text>
  <text x="62" y="170" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#475569">Procedural penalty for any contact with the gun before START.</text>
  <rect x="62" y="178" width="56" height="18" rx="9" fill="#fef3c7"/>
  <text x="90" y="191" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#92400e">Procedural</text>
  <rect x="124" y="178" width="78" height="18" rx="9" fill="#f1f5f9"/>
  <text x="163" y="191" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#475569">IPSC · Handgun</text>

  <rect x="40" y="208" width="560" height="74" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="40" y="208" width="6" height="74" fill="#dc2626"/>
  <text x="62" y="232" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a">10.5.1 — SOS (cease fire procedure)</text>
  <text x="62" y="254" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#475569">Stop, observe, ensure safety — what every RO must do first.</text>
  <rect x="62" y="262" width="40" height="18" rx="9" fill="#fee2e2"/>
  <text x="82" y="275" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#b91c1c">Safety</text>

  <rect x="40" y="292" width="560" height="74" rx="12" fill="#ffffff" stroke="#e2e8f0"/>
  <rect x="40" y="292" width="6" height="74" fill="#16a34a"/>
  <text x="62" y="316" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="800" fill="#0f172a">9.1 — Scoring zones and hit values</text>
  <text x="62" y="338" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#475569">A=5, C=4 (Major) / 3 (Minor), D=2, M=−10, NS=−10.</text>
  <rect x="62" y="346" width="48" height="18" rx="9" fill="#dcfce7"/>
  <text x="86" y="359" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#15803d">Scoring</text>

  <rect x="380" y="376" width="220" height="18" rx="9" fill="#fde68a"/>
  <text x="490" y="389" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" font-weight="700" fill="#92400e">Always verify with the official PDF</text>
</svg>`
