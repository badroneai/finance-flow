<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>قيد العقار — Brand Identity System</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy: #0F1C2E;
    --navy-90: rgba(15, 28, 46, 0.9);
    --navy-60: rgba(15, 28, 46, 0.6);
    --navy-30: rgba(15, 28, 46, 0.3);
    --navy-10: rgba(15, 28, 46, 0.1);
    --navy-05: rgba(15, 28, 46, 0.05);
    --gray: #8A8F98;
    --gray-light: #C8CBD0;
    --gray-bg: #F4F5F6;
    --gold: #B8A76A;
    --gold-light: rgba(184, 167, 106, 0.15);
    --gold-subtle: rgba(184, 167, 106, 0.08);
    --white: #FFFFFF;
    --off-white: #FAFBFC;
    --border: rgba(15, 28, 46, 0.08);
    --shadow-sm: 0 1px 3px rgba(15, 28, 46, 0.04);
    --shadow-md: 0 4px 16px rgba(15, 28, 46, 0.06);
    --shadow-lg: 0 8px 32px rgba(15, 28, 46, 0.08);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    background: var(--off-white);
    color: var(--navy);
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* ── HERO ── */
  .hero {
    background: var(--navy);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .hero::before {
    content: '';
    position: absolute;
    top: -20%;
    left: -10%;
    width: 60%;
    height: 60%;
    background: radial-gradient(ellipse, rgba(184, 167, 106, 0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero::after {
    content: '';
    position: absolute;
    bottom: -10%;
    right: -10%;
    width: 40%;
    height: 40%;
    background: radial-gradient(ellipse, rgba(138, 143, 152, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    text-align: center;
    position: relative;
    z-index: 1;
    animation: fadeUp 1.2s ease-out;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .hero-logo {
    width: 88px;
    height: 88px;
    margin: 0 auto 40px;
    opacity: 0;
    animation: fadeUp 1s ease-out 0.3s forwards;
  }

  .hero-logo svg { width: 100%; height: 100%; }

  .hero-title {
    font-size: 56px;
    font-weight: 600;
    color: var(--white);
    letter-spacing: -0.5px;
    margin-bottom: 16px;
    opacity: 0;
    animation: fadeUp 1s ease-out 0.5s forwards;
  }

  .hero-subtitle {
    font-size: 18px;
    font-weight: 300;
    color: var(--gray);
    max-width: 440px;
    margin: 0 auto;
    opacity: 0;
    animation: fadeUp 1s ease-out 0.7s forwards;
  }

  .hero-tag {
    margin-top: 48px;
    display: inline-block;
    padding: 8px 24px;
    border: 1px solid rgba(184, 167, 106, 0.3);
    border-radius: 100px;
    color: var(--gold);
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.5px;
    opacity: 0;
    animation: fadeUp 1s ease-out 0.9s forwards;
  }

  .hero-scroll {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    animation: fadeUp 1s ease-out 1.2s forwards;
  }

  .hero-scroll span {
    display: block;
    width: 1px;
    height: 40px;
    background: linear-gradient(to bottom, var(--gold), transparent);
    margin: 0 auto;
    animation: scrollPulse 2s ease-in-out infinite;
  }

  @keyframes scrollPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.8; }
  }

  /* ── SECTIONS ── */
  .section {
    padding: 120px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-header { margin-bottom: 72px; }

  .section-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--gold);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 36px;
    font-weight: 600;
    color: var(--navy);
    line-height: 1.3;
  }

  .section-desc {
    font-size: 16px;
    color: var(--gray);
    margin-top: 12px;
    max-width: 500px;
    font-weight: 300;
  }

  /* ── LOGO SECTION ── */
  .logo-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }

  .logo-card {
    border-radius: var(--radius-lg);
    padding: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    border: 1px solid var(--border);
    transition: box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .logo-card:hover { box-shadow: var(--shadow-md); }
  .logo-card.dark { background: var(--navy); border-color: rgba(255,255,255,0.06); }
  .logo-card.light { background: var(--white); }
  .logo-card.gold-bg { background: linear-gradient(135deg, #B8A76A 0%, #A89555 100%); border-color: transparent; }
  .logo-card.gray-bg { background: var(--gray-bg); }
  .logo-card svg { width: 64px; height: 64px; }

  .logo-card .logo-label {
    font-size: 12px;
    color: var(--gray);
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .logo-card.dark .logo-label { color: rgba(255,255,255,0.4); }
  .logo-card.gold-bg .logo-label { color: rgba(255,255,255,0.6); }

  .logo-lockup {
    display: flex;
    align-items: center;
    gap: 16px;
    direction: rtl;
  }

  .logo-lockup svg { width: 48px; height: 48px; flex-shrink: 0; }

  .logo-lockup-text {
    font-size: 24px;
    font-weight: 600;
    white-space: nowrap;
  }

  .logo-lockup-text.white { color: var(--white); }
  .logo-lockup-text.dark { color: var(--navy); }

  .logo-clearspace {
    grid-column: 1 / -1;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .clearspace-box {
    position: relative;
    padding: 40px;
    border: 1px dashed var(--gold);
  }

  .clearspace-box svg { width: 56px; height: 56px; }

  .clearspace-label {
    position: absolute;
    font-size: 11px;
    color: var(--gold);
    font-weight: 500;
  }

  .clearspace-label.top { top: 8px; left: 50%; transform: translateX(-50%); }
  .clearspace-label.bottom { bottom: 8px; left: 50%; transform: translateX(-50%); }
  .clearspace-label.left { left: 8px; top: 50%; transform: translateY(-50%) rotate(-90deg); }
  .clearspace-label.right { right: 8px; top: 50%; transform: translateY(-50%) rotate(90deg); }

  /* ── COLOR PALETTE ── */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .color-card {
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--white);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .color-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .color-swatch { height: 180px; }
  .color-swatch.navy { background: var(--navy); }
  .color-swatch.gray { background: var(--gray); }
  .color-swatch.gold { background: var(--gold); }

  .color-info { padding: 24px; }

  .color-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }

  .color-name-en {
    font-size: 13px;
    color: var(--gray);
    font-weight: 400;
    margin-bottom: 16px;
    direction: ltr;
    text-align: right;
  }

  .color-values { display: flex; flex-direction: column; gap: 6px; }

  .color-val {
    font-size: 13px;
    color: var(--gray);
    direction: ltr;
    text-align: right;
    font-family: 'IBM Plex Sans Arabic', monospace;
  }

  .color-usage {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 13px;
    color: var(--navy-60);
    line-height: 1.6;
  }

  /* ── TYPOGRAPHY ── */
  .type-showcase { display: flex; flex-direction: column; gap: 48px; }

  .type-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    align-items: baseline;
    padding-bottom: 48px;
    border-bottom: 1px solid var(--border);
  }

  .type-row:last-child { border-bottom: none; }

  .type-meta { font-size: 12px; color: var(--gray); line-height: 2; }

  .type-meta strong {
    display: block;
    color: var(--navy);
    font-size: 13px;
    font-weight: 500;
  }

  .type-sample { color: var(--navy); }
  .type-sample.h1 { font-size: 48px; font-weight: 600; line-height: 1.2; }
  .type-sample.h2 { font-size: 36px; font-weight: 600; line-height: 1.3; }
  .type-sample.h3 { font-size: 24px; font-weight: 500; line-height: 1.4; }
  .type-sample.body { font-size: 16px; font-weight: 400; line-height: 1.8; color: var(--navy-60); max-width: 600px; }
  .type-sample.caption { font-size: 13px; font-weight: 400; color: var(--gray); line-height: 1.6; }

  /* ── COMPONENTS ── */
  .components-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  .comp-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 40px;
    transition: box-shadow 0.3s ease;
  }

  .comp-card:hover { box-shadow: var(--shadow-md); }

  .comp-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--gray);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 32px;
  }

  .btn-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: var(--radius-sm);
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    white-space: nowrap;
  }

  .btn-primary { background: var(--navy); color: var(--white); }
  .btn-primary:hover { background: #1a2d45; }
  .btn-secondary { background: transparent; color: var(--navy); border: 1px solid var(--navy-30); }
  .btn-secondary:hover { border-color: var(--navy); }
  .btn-gold { background: var(--gold); color: var(--white); }
  .btn-gold:hover { background: #a89555; }
  .btn-ghost { background: transparent; color: var(--navy); padding: 12px 16px; border: none; }
  .btn-ghost:hover { background: var(--navy-05); }
  .btn-sm { padding: 8px 20px; font-size: 13px; }

  .input-group { display: flex; flex-direction: column; gap: 16px; }
  .input-field label { display: block; font-size: 13px; font-weight: 500; color: var(--navy); margin-bottom: 8px; }

  .input-field input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'IBM Plex Sans Arabic', sans-serif;
    font-size: 14px;
    color: var(--navy);
    background: var(--off-white);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
    direction: rtl;
  }

  .input-field input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px var(--gold-light);
    background: var(--white);
  }

  .input-field input::placeholder { color: var(--gray-light); }

  .sample-card {
    background: var(--off-white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
  }

  .sample-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .sample-card-title { font-size: 15px; font-weight: 500; }

  .sample-card-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 100px;
    background: var(--gold-subtle);
    color: var(--gold);
  }

  .sample-card-amount { font-size: 28px; font-weight: 600; margin-bottom: 4px; direction: ltr; text-align: right; }
  .sample-card-label { font-size: 13px; color: var(--gray); }
  .sample-card-divider { height: 1px; background: var(--border); margin: 16px 0; }

  .sample-card-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--gray); margin-bottom: 8px; }
  .sample-card-row span:last-child { color: var(--navy); font-weight: 500; }

  .tags-row { display: flex; gap: 8px; flex-wrap: wrap; }

  .tag { padding: 6px 16px; border-radius: 100px; font-size: 12px; font-weight: 500; }
  .tag-navy { background: var(--navy-10); color: var(--navy); }
  .tag-gold { background: var(--gold-light); color: #8B7D3E; }
  .tag-gray { background: var(--gray-bg); color: var(--gray); }
  .tag-success { background: rgba(46, 125, 50, 0.08); color: #2E7D32; }
  .tag-danger { background: rgba(198, 40, 40, 0.08); color: #C62828; }

  .mini-table { width: 100%; font-size: 13px; }
  .mini-table th { text-align: right; font-weight: 500; color: var(--gray); padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
  .mini-table td { padding: 12px 0; border-bottom: 1px solid var(--border); color: var(--navy); }
  .mini-table td:last-child { direction: ltr; text-align: right; }
  .mini-table tr:last-child td { border-bottom: none; }

  .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-left: 6px; vertical-align: middle; }
  .status-dot.green { background: #2E7D32; }
  .status-dot.orange { background: #E65100; }
  .status-dot.red { background: #C62828; }

  /* ── MOCKUP SECTION ── */
  .mockup-section {
    background: var(--navy);
    padding: 120px 40px;
    position: relative;
    overflow: hidden;
  }

  .mockup-section::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: radial-gradient(ellipse at top right, rgba(184, 167, 106, 0.04) 0%, transparent 60%);
  }

  .mockup-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }
  .mockup-header { margin-bottom: 72px; }

  .dashboard-frame {
    background: var(--off-white);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.3);
  }

  .dash-topbar {
    background: var(--white);
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }

  .dash-topbar-right { display: flex; align-items: center; gap: 16px; }
  .dash-topbar-logo { display: flex; align-items: center; gap: 10px; }
  .dash-topbar-logo svg { width: 28px; height: 28px; }
  .dash-topbar-logo span { font-size: 16px; font-weight: 600; color: var(--navy); }
  .dash-topbar-left { display: flex; align-items: center; gap: 24px; }

  .dash-nav-item {
    font-size: 13px;
    color: var(--gray);
    cursor: pointer;
    padding: 4px 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .dash-nav-item.active { color: var(--navy); font-weight: 500; border-bottom-color: var(--gold); }

  .dash-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--navy);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    font-size: 13px;
    font-weight: 500;
  }

  .dash-body {
    padding: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
  }

  .stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    transition: box-shadow 0.2s;
  }

  .stat-card:hover { box-shadow: var(--shadow-sm); }
  .stat-card-label { font-size: 13px; color: var(--gray); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
  .stat-card-value { font-size: 28px; font-weight: 600; direction: ltr; text-align: right; }

  .stat-card-change {
    font-size: 12px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
    direction: ltr;
  }

  .stat-card-change.up { color: #2E7D32; }
  .stat-card-change.down { color: #C62828; }

  .dash-table-card {
    grid-column: 1 / -1;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
  }

  .dash-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .dash-table-title { font-size: 16px; font-weight: 500; }

  .dash-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .dash-table th { text-align: right; font-weight: 500; color: var(--gray); padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 12px; white-space: nowrap; }
  .dash-table td { padding: 14px 16px; border-bottom: 1px solid var(--border); white-space: nowrap; }
  .dash-table tr:last-child td { border-bottom: none; }
  .dash-table .amount { direction: ltr; text-align: right; font-weight: 500; }

  /* ── BRAND RULES ── */
  .rules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

  .rule-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
    transition: box-shadow 0.3s ease;
  }

  .rule-card:hover { box-shadow: var(--shadow-md); }

  .rule-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 20px;
  }

  .rule-icon.do { background: rgba(46, 125, 50, 0.08); color: #2E7D32; }
  .rule-icon.dont { background: rgba(198, 40, 40, 0.08); color: #C62828; }

  .rule-title { font-size: 15px; font-weight: 500; margin-bottom: 8px; }
  .rule-desc { font-size: 13px; color: var(--gray); line-height: 1.7; }

  /* ── TONE ── */
  .tone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  .tone-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 32px;
  }

  .tone-card.do-card { border-right: 3px solid #2E7D32; }
  .tone-card.dont-card { border-right: 3px solid #C62828; }

  .tone-badge { display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 500; margin-bottom: 16px; }
  .tone-badge.do-badge { background: rgba(46, 125, 50, 0.08); color: #2E7D32; }
  .tone-badge.dont-badge { background: rgba(198, 40, 40, 0.08); color: #C62828; }
  .tone-text { font-size: 15px; line-height: 1.8; color: var(--navy-60); }

  /* ── FOOTER ── */
  .brand-footer {
    text-align: center;
    padding: 80px 40px;
    background: var(--white);
    border-top: 1px solid var(--border);
  }

  .brand-footer svg { width: 40px; height: 40px; margin-bottom: 24px; }
  .brand-footer p { font-size: 14px; color: var(--gray); max-width: 400px; margin: 0 auto; line-height: 1.8; }
  .brand-footer .copyright { margin-top: 24px; font-size: 12px; color: var(--gray-light); }

  .section-divider { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
  .section-divider hr { border: none; height: 1px; background: var(--border); }

  /* ── Scroll reveal ── */
  .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .hero-title { font-size: 40px; }
    .section { padding: 80px 24px; }
    .logo-grid, .color-grid, .components-grid, .rules-grid, .tone-grid { grid-template-columns: 1fr; }
    .type-row { grid-template-columns: 1fr; gap: 12px; }
    .dash-body { grid-template-columns: 1fr; }
    .dash-topbar-left { display: none; }
    .section-title { font-size: 28px; }
  }
</style>
</head>
<body>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section class="hero">
  <div class="hero-content">
    <div class="hero-logo">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 18L22 42V78H40V58H60V78H78V42L50 18Z" stroke="#B8A76A" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
        <path d="M62 28V22H70V36" stroke="#B8A76A" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
        <path d="M18 82H82" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
        <path d="M24 86L20 82L24 78H76L80 82L76 86H24Z" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
        <path d="M28 78V86" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      </svg>
    </div>
    <h1 class="hero-title">قيد العقار</h1>
    <p class="hero-subtitle">دليل الهوية البصرية ونظام التصميم</p>
    <div class="hero-tag">Brand Identity System — V1.0</div>
  </div>
  <div class="hero-scroll"><span></span></div>
</section>

<!-- ═══════════════════ LOGO ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠١ — الشعار</div>
    <h2 class="section-title">علامة قيد العقار</h2>
    <p class="section-desc">أيقونة خطية تجمع بين رمز المنزل والقلم، تعبيراً عن العقار والتوثيق المالي.</p>
  </div>

  <div class="logo-grid">
    <div class="logo-card dark">
      <div class="logo-lockup">
        <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
        <span class="logo-lockup-text white">قيد العقار</span>
      </div>
      <span class="logo-label">على خلفية داكنة</span>
    </div>

    <div class="logo-card light">
      <div class="logo-lockup">
        <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(15,28,46,0.4)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(15,28,46,0.3)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
        <span class="logo-lockup-text dark">قيد العقار</span>
      </div>
      <span class="logo-label">على خلفية فاتحة</span>
    </div>

    <div class="logo-card gold-bg">
      <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="white" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
      <span class="logo-label">الأيقونة فقط — لون مميز</span>
    </div>

    <div class="logo-card gray-bg">
      <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(15,28,46,0.4)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(15,28,46,0.3)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
      <span class="logo-label">الأيقونة فقط — خلفية محايدة</span>
    </div>

    <div class="logo-clearspace">
      <div class="clearspace-box">
        <span class="clearspace-label top">x</span>
        <span class="clearspace-label bottom">x</span>
        <span class="clearspace-label left">x</span>
        <span class="clearspace-label right">x</span>
        <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(15,28,46,0.4)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(15,28,46,0.3)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
      </div>
      <p style="margin-top: 32px; font-size: 12px; color: var(--gray);">المساحة الآمنة — لا يجوز وضع أي عنصر داخل هذا الإطار</p>
    </div>
  </div>
</section>

<div class="section-divider"><hr></div>

<!-- ═══════════════════ COLORS ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠٢ — الألوان</div>
    <h2 class="section-title">لوحة الألوان</h2>
    <p class="section-desc">ثلاثة ألوان رئيسية تعكس الثقة والاحترافية والهدوء.</p>
  </div>

  <div class="color-grid">
    <div class="color-card">
      <div class="color-swatch navy"></div>
      <div class="color-info">
        <div class="color-name">أزرق كحلي</div>
        <div class="color-name-en">Navy Blue — Primary</div>
        <div class="color-values">
          <span class="color-val">HEX: #0F1C2E</span>
          <span class="color-val">RGB: 15, 28, 46</span>
        </div>
        <div class="color-usage">اللون الأساسي للعناوين والعناصر الرئيسية والخلفيات الداكنة.</div>
      </div>
    </div>
    <div class="color-card">
      <div class="color-swatch gray"></div>
      <div class="color-info">
        <div class="color-name">رمادي دافئ</div>
        <div class="color-name-en">Warm Gray — Secondary</div>
        <div class="color-values">
          <span class="color-val">HEX: #8A8F98</span>
          <span class="color-val">RGB: 138, 143, 152</span>
        </div>
        <div class="color-usage">للنصوص الثانوية والتسميات والحدود والأيقونات المساعدة.</div>
      </div>
    </div>
    <div class="color-card">
      <div class="color-swatch gold"></div>
      <div class="color-info">
        <div class="color-name">ذهبي زيتوني</div>
        <div class="color-name-en">Soft Olive Gold — Accent</div>
        <div class="color-values">
          <span class="color-val">HEX: #B8A76A</span>
          <span class="color-val">RGB: 184, 167, 106</span>
        </div>
        <div class="color-usage">يُستخدم باعتدال شديد للتمييز والعناصر التفاعلية المهمة فقط.</div>
      </div>
    </div>
  </div>
</section>

<div class="section-divider"><hr></div>

<!-- ═══════════════════ TYPOGRAPHY ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠٣ — الخطوط</div>
    <h2 class="section-title">نظام الخطوط</h2>
    <p class="section-desc">IBM Plex Arabic كخط رئيسي يجمع بين الوضوح والأناقة التقنية.</p>
  </div>

  <div class="type-showcase">
    <div class="type-row">
      <div class="type-meta"><strong>عنوان رئيسي — H1</strong>SemiBold 600<br>48px / 1.2</div>
      <div class="type-sample h1">إدارة مالية عقارية متقدمة</div>
    </div>
    <div class="type-row">
      <div class="type-meta"><strong>عنوان ثانوي — H2</strong>SemiBold 600<br>36px / 1.3</div>
      <div class="type-sample h2">تتبع الإيرادات والمصروفات</div>
    </div>
    <div class="type-row">
      <div class="type-meta"><strong>عنوان فرعي — H3</strong>Medium 500<br>24px / 1.4</div>
      <div class="type-sample h3">تقارير مالية احترافية ودقيقة</div>
    </div>
    <div class="type-row">
      <div class="type-meta"><strong>نص أساسي — Body</strong>Regular 400<br>16px / 1.8</div>
      <div class="type-sample body">منصة قيد العقار تقدم حلولاً متكاملة لإدارة التدفقات النقدية العقارية، مصممة لملاك العقارات ومكاتب العقار ومديري الشاليهات. واجهة بسيطة وتقارير دقيقة تساعدك على اتخاذ قرارات مالية واضحة.</div>
    </div>
    <div class="type-row">
      <div class="type-meta"><strong>نص توضيحي — Caption</strong>Regular 400<br>13px / 1.6</div>
      <div class="type-sample caption">آخر تحديث: ١٥ يناير ٢٠٢٦ — جميع الأرقام بالريال السعودي</div>
    </div>
  </div>
</section>

<div class="section-divider"><hr></div>

<!-- ═══════════════════ COMPONENTS ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠٤ — المكونات</div>
    <h2 class="section-title">عناصر التصميم</h2>
    <p class="section-desc">مكتبة مكونات الواجهة الأساسية المتسقة مع الهوية.</p>
  </div>

  <div class="components-grid">
    <div class="comp-card">
      <div class="comp-label">الأزرار</div>
      <div class="btn-row" style="margin-bottom: 16px;">
        <button class="btn btn-primary">إضافة عقار</button>
        <button class="btn btn-secondary">تصدير التقرير</button>
      </div>
      <div class="btn-row" style="margin-bottom: 16px;">
        <button class="btn btn-gold">تأكيد العملية</button>
        <button class="btn btn-ghost">إلغاء</button>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-sm">حفظ</button>
        <button class="btn btn-secondary btn-sm">عرض الكل</button>
      </div>
    </div>

    <div class="comp-card">
      <div class="comp-label">حقول الإدخال</div>
      <div class="input-group">
        <div class="input-field">
          <label>اسم العقار</label>
          <input type="text" placeholder="مثال: فيلا حي النرجس">
        </div>
        <div class="input-field">
          <label>المبلغ (ريال)</label>
          <input type="text" placeholder="٠.٠٠" style="direction: ltr; text-align: right;">
        </div>
      </div>
    </div>

    <div class="comp-card">
      <div class="comp-label">بطاقة الملخص</div>
      <div class="sample-card">
        <div class="sample-card-header">
          <span class="sample-card-title">فيلا حي النرجس</span>
          <span class="sample-card-badge">نشط</span>
        </div>
        <div class="sample-card-amount">٤٥,٠٠٠ ر.س</div>
        <div class="sample-card-label">إجمالي الإيرادات — يناير ٢٠٢٦</div>
        <div class="sample-card-divider"></div>
        <div class="sample-card-row"><span>المصروفات</span><span>١٢,٣٠٠ ر.س</span></div>
        <div class="sample-card-row"><span>صافي الربح</span><span style="color: #2E7D32;">٣٢,٧٠٠ ر.س</span></div>
      </div>
    </div>

    <div class="comp-card">
      <div class="comp-label">الحالات والتصنيفات</div>
      <div class="tags-row" style="margin-bottom: 20px;">
        <span class="tag tag-navy">سكني</span>
        <span class="tag tag-gold">تجاري</span>
        <span class="tag tag-gray">شاليه</span>
      </div>
      <div class="tags-row" style="margin-bottom: 20px;">
        <span class="tag tag-success">● مُحصّل</span>
        <span class="tag tag-danger">● متأخر</span>
        <span class="tag tag-gold">● معلّق</span>
      </div>
      <div style="margin-top: 16px;">
        <div class="comp-label" style="margin-bottom: 16px;">الجدول</div>
        <table class="mini-table">
          <thead><tr><th>المستأجر</th><th>الحالة</th><th>المبلغ</th></tr></thead>
          <tbody>
            <tr><td>أحمد محمد</td><td><span class="status-dot green"></span>محصّل</td><td>٣,٥٠٠ ر.س</td></tr>
            <tr><td>خالد عبدالله</td><td><span class="status-dot orange"></span>معلّق</td><td>٢,٨٠٠ ر.س</td></tr>
            <tr><td>سعد إبراهيم</td><td><span class="status-dot red"></span>متأخر</td><td>٤,٢٠٠ ر.س</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ DASHBOARD MOCKUP ═══════════════════ -->
<section class="mockup-section">
  <div class="mockup-container reveal">
    <div class="mockup-header">
      <div class="section-label">٠٥ — التطبيق</div>
      <h2 class="section-title" style="color: #fff;">لوحة التحكم</h2>
      <p class="section-desc" style="color: rgba(255,255,255,0.4);">تصور لواجهة المنصة الرئيسية مع تطبيق الهوية البصرية.</p>
    </div>

    <div class="dashboard-frame">
      <div class="dash-topbar">
        <div class="dash-topbar-right">
          <div class="dash-topbar-logo">
            <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="#0F1C2E" stroke-width="2.5" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="#0F1C2E" stroke-width="2.5" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(15,28,46,0.4)" stroke-width="2" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(15,28,46,0.3)" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>
            <span>قيد العقار</span>
          </div>
        </div>
        <div class="dash-topbar-left">
          <span class="dash-nav-item active">الرئيسية</span>
          <span class="dash-nav-item">العقارات</span>
          <span class="dash-nav-item">المالية</span>
          <span class="dash-nav-item">التقارير</span>
          <span class="dash-nav-item">الملاحظات</span>
          <div class="dash-avatar">ب</div>
        </div>
      </div>

      <div class="dash-body">
        <div class="stat-card">
          <div class="stat-card-label"><span>إجمالي الإيرادات</span><span style="font-size:11px;color:var(--gold);">هذا الشهر</span></div>
          <div class="stat-card-value">١٨٧,٥٠٠ <span style="font-size:14px;color:var(--gray);">ر.س</span></div>
          <div class="stat-card-change up">↑ ١٢.٥٪ عن الشهر السابق</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label"><span>المصروفات</span><span style="font-size:11px;color:var(--gray);">هذا الشهر</span></div>
          <div class="stat-card-value">٤٣,٢٠٠ <span style="font-size:14px;color:var(--gray);">ر.س</span></div>
          <div class="stat-card-change down">↓ ٣.٨٪ عن الشهر السابق</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label"><span>صافي الربح</span><span style="font-size:11px;color:#2E7D32;">●</span></div>
          <div class="stat-card-value">١٤٤,٣٠٠ <span style="font-size:14px;color:var(--gray);">ر.س</span></div>
          <div class="stat-card-change up">↑ ١٨.٢٪ عن الشهر السابق</div>
        </div>

        <div class="dash-table-card">
          <div class="dash-table-header">
            <span class="dash-table-title">آخر العمليات المالية</span>
            <button class="btn btn-secondary btn-sm">عرض الكل</button>
          </div>
          <table class="dash-table">
            <thead><tr><th>العقار</th><th>النوع</th><th>المستأجر</th><th>الحالة</th><th>التاريخ</th><th>المبلغ</th></tr></thead>
            <tbody>
              <tr>
                <td>فيلا حي النرجس</td>
                <td><span class="tag tag-navy" style="font-size:11px;padding:3px 10px;">سكني</span></td>
                <td>أحمد محمد العتيبي</td>
                <td><span class="status-dot green"></span> محصّل</td>
                <td style="color:var(--gray);">١٥ يناير ٢٠٢٦</td>
                <td class="amount" style="color:#2E7D32;">+٤٥,٠٠٠ ر.س</td>
              </tr>
              <tr>
                <td>مجمع الياسمين التجاري</td>
                <td><span class="tag tag-gold" style="font-size:11px;padding:3px 10px;">تجاري</span></td>
                <td>شركة الأفق للتجارة</td>
                <td><span class="status-dot green"></span> محصّل</td>
                <td style="color:var(--gray);">١٤ يناير ٢٠٢٦</td>
                <td class="amount" style="color:#2E7D32;">+٧٨,٠٠٠ ر.س</td>
              </tr>
              <tr>
                <td>شاليه بريدة الشمالي</td>
                <td><span class="tag tag-gray" style="font-size:11px;padding:3px 10px;">شاليه</span></td>
                <td>عبدالرحمن خالد</td>
                <td><span class="status-dot orange"></span> معلّق</td>
                <td style="color:var(--gray);">١٢ يناير ٢٠٢٦</td>
                <td class="amount" style="color:var(--gold);">٨,٥٠٠ ر.س</td>
              </tr>
              <tr>
                <td>عمارة حي الصفراء</td>
                <td><span class="tag tag-navy" style="font-size:11px;padding:3px 10px;">سكني</span></td>
                <td>صندوق الصيانة</td>
                <td><span class="status-dot red"></span> مصروف</td>
                <td style="color:var(--gray);">١٠ يناير ٢٠٢٦</td>
                <td class="amount" style="color:#C62828;">−١٢,٣٠٠ ر.س</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ TONE OF VOICE ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠٦ — الصوت والنبرة</div>
    <h2 class="section-title">أسلوب التواصل</h2>
    <p class="section-desc">نبرة احترافية وهادئة وواثقة ومباشرة.</p>
  </div>

  <div class="tone-grid">
    <div class="tone-card do-card">
      <span class="tone-badge do-badge">✓ هكذا نتحدث</span>
      <div class="tone-text">«تم تحصيل إيجار شهر يناير بنجاح. المبلغ ٤٥,٠٠٠ ر.س مسجل في حسابك.»</div>
    </div>
    <div class="tone-card dont-card">
      <span class="tone-badge dont-badge">✗ لا نتحدث هكذا</span>
      <div class="tone-text">«مبروووك!! تم تحصيل المبلغ 🎉🎉 وتم إضافته لحسابك!! تابع معنا دائماً 💪»</div>
    </div>
    <div class="tone-card do-card">
      <span class="tone-badge do-badge">✓ هكذا نتحدث</span>
      <div class="tone-text">«لم يتم تحصيل إيجار الوحدة ١٢ حتى الآن. ننصح بمتابعة المستأجر.»</div>
    </div>
    <div class="tone-card dont-card">
      <span class="tone-badge dont-badge">✗ لا نتحدث هكذا</span>
      <div class="tone-text">«تنبيه عاجل!! ⚠️ المستأجر لم يدفع!!! يجب اتخاذ إجراء فوري!!!»</div>
    </div>
  </div>
</section>

<div class="section-divider"><hr></div>

<!-- ═══════════════════ BRAND RULES ═══════════════════ -->
<section class="section reveal">
  <div class="section-header">
    <div class="section-label">٠٧ — القواعد</div>
    <h2 class="section-title">إرشادات التصميم</h2>
    <p class="section-desc">قواعد أساسية للحفاظ على اتساق الهوية البصرية.</p>
  </div>

  <div class="rules-grid">
    <div class="rule-card"><div class="rule-icon do">✓</div><div class="rule-title">مساحات بيضاء كافية</div><div class="rule-desc">اترك فراغات واسعة بين العناصر. الفراغ يعزز الوضوح والثقة.</div></div>
    <div class="rule-card"><div class="rule-icon do">✓</div><div class="rule-title">بطاقات ناعمة</div><div class="rule-desc">استخدم بطاقات بحدود رفيعة وظلال خفيفة جداً وزوايا مدورة.</div></div>
    <div class="rule-card"><div class="rule-icon do">✓</div><div class="rule-title">الذهبي باعتدال</div><div class="rule-desc">اللون المميز يُستخدم فقط للعناصر التفاعلية المهمة والتمييز.</div></div>
    <div class="rule-card"><div class="rule-icon dont">✗</div><div class="rule-title">بدون تدرجات قوية</div><div class="rule-desc">لا تستخدم تدرجات لونية واضحة أو ألوان صارخة في أي مكان.</div></div>
    <div class="rule-card"><div class="rule-icon dont">✗</div><div class="rule-title">بدون خطوط زخرفية</div><div class="rule-desc">التزم بـ IBM Plex Arabic فقط. لا خطوط منمقة أو غير احترافية.</div></div>
    <div class="rule-card"><div class="rule-icon dont">✗</div><div class="rule-title">بدون ألوان صاخبة</div><div class="rule-desc">تجنب الأحمر الفاقع والأخضر الصارخ. استخدم درجات هادئة دائماً.</div></div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="brand-footer reveal">
  <svg viewBox="0 0 100 100" fill="none"><path d="M50 20L24 44V76H38V60H62V76H76V44L50 20Z" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M62 30V24H68V36" stroke="#0F1C2E" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M20 80H80" stroke="rgba(15,28,46,0.4)" stroke-width="1.5" stroke-linecap="round"/><path d="M24 84L20 80L24 76H76L80 80L76 84H24Z" stroke="rgba(15,28,46,0.3)" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>
  <p>دليل الهوية البصرية لمنصة قيد العقار — مرجع موحّد لجميع التطبيقات الرقمية والمطبوعة.</p>
  <div class="copyright">قيد العقار © ٢٠٢٦ — جميع الحقوق محفوظة</div>
</footer>

<script>
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));
</script>

</body>
</html>