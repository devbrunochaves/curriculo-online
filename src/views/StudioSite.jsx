'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const WA = 'https://wa.me/5519997222986'

/* ─── CSS injetado escopado sob .studio-page ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&display=swap');

@keyframes fadeUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes s-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

.studio-page{
  --sp-bg:#f8f8f6;
  --sp-white:#ffffff;
  --sp-black:#0a0a0a;
  --sp-pink:#01aeff;
  --sp-pink-light:#e8f4ff;
  --sp-gray:#888888;
  --sp-gray-light:#e8e8e8;
  --sp-gray-mid:#f0f0ee;
  --sp-sans:'Inter',sans-serif;
  --sp-serif:'Playfair Display',serif;
  font-family:var(--sp-sans);
  background:var(--sp-bg);
  color:var(--sp-black);
  overflow-x:hidden;
  min-height:100vh;
}

/* ── SCROLL REVEAL ── */
.studio-page .reveal{opacity:0;transform:translateY(36px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.studio-page .reveal.on{opacity:1;transform:none}
.studio-page .reveal-left{opacity:0;transform:translateX(-36px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.studio-page .reveal-left.on{opacity:1;transform:none}
.studio-page .reveal-right{opacity:0;transform:translateX(36px);transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1)}
.studio-page .reveal-right.on{opacity:1;transform:none}
.studio-page .d1{transition-delay:.1s}
.studio-page .d2{transition-delay:.2s}
.studio-page .d3{transition-delay:.32s}

/* ── NAV ── */
.studio-page nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  height:68px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 60px;
  background:rgba(248,248,246,0);
  backdrop-filter:blur(0px);
  border-bottom:1px solid transparent;
  transition:all .4s;
}
.studio-page nav.solid{
  background:rgba(248,248,246,0.94);
  backdrop-filter:blur(18px);
  border-color:var(--sp-gray-light);
}
.studio-page .sp-nav-logo{font-family:var(--sp-sans);font-weight:900;font-size:18px;letter-spacing:-.5px;color:var(--sp-black);text-decoration:none}
.studio-page .sp-nav-logo span{color:var(--sp-pink)}
.studio-page .sp-nav-links{display:flex;align-items:center;gap:36px;list-style:none}
.studio-page .sp-nav-links a{font-size:13px;font-weight:500;color:var(--sp-black);text-decoration:none;opacity:.6;transition:opacity .2s;letter-spacing:.2px}
.studio-page .sp-nav-links a:hover{opacity:1}
.studio-page .sp-nav-cta{
  display:flex;align-items:center;gap:8px;
  background:transparent;color:var(--sp-black);
  border:1.5px solid rgba(10,10,10,.25);
  padding:9px 20px;
  font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;
  transition:all .2s;letter-spacing:.2px;
}
.studio-page .sp-nav-cta:hover{border-color:var(--sp-black);background:rgba(10,10,10,.04);transform:translateY(-1px)}
.studio-page .sp-nav-hamburger{display:none;background:none;border:none;font-size:22px;cursor:pointer;color:var(--sp-black);padding:4px 8px}

/* ── MOBILE MENU DRAWER ── */
.studio-page .sp-mobile-menu{
  display:none;
  position:fixed;inset:0;z-index:199;
  background:var(--sp-bg);
  flex-direction:column;align-items:center;justify-content:center;
  gap:0;
  opacity:0;transform:translateY(-12px);
  transition:opacity .3s ease,transform .3s ease;
  pointer-events:none;
}
.studio-page .sp-mobile-menu.open{
  opacity:1;transform:translateY(0);
  pointer-events:all;
}
.studio-page .sp-mobile-menu a{
  display:block;
  font-size:28px;font-weight:800;letter-spacing:-1px;
  color:var(--sp-black);text-decoration:none;
  padding:18px 0;
  border-bottom:1px solid var(--sp-gray-light);
  width:80%;text-align:center;
  transition:color .2s;
}
.studio-page .sp-mobile-menu a:last-child{border-bottom:none}
.studio-page .sp-mobile-menu a:hover{color:var(--sp-pink)}
.studio-page .sp-mobile-menu .sp-mm-cta{
  margin-top:32px;
  background:var(--sp-pink);color:var(--sp-white);
  border:none;padding:16px 40px;
  font-size:15px;font-weight:700;letter-spacing:.5px;
  cursor:pointer;text-decoration:none;
}
.studio-page .sp-mobile-menu .sp-mm-cta:hover{background:#0089cc;color:var(--sp-white)}

/* ── HERO ── */
.studio-page .sp-hero{
  min-height:100vh;
  display:flex;align-items:center;
  padding:100px 60px 80px;
  position:relative;overflow:hidden;
  background:var(--sp-bg);
}
.studio-page .sp-hero-inner{
  max-width:860px;margin:0 auto;width:100%;
  display:flex;flex-direction:column;align-items:center;
  text-align:center;
}
.studio-page .sp-hero-label{
  display:inline-flex;align-items:center;gap:8px;justify-content:center;
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:var(--sp-pink);margin-bottom:28px;
}
.studio-page .sp-hero-label::before{content:'';width:28px;height:1.5px;background:var(--sp-pink)}
.studio-page .sp-hero h1{
  font-family:var(--sp-sans);
  font-size:clamp(48px,6.5vw,88px);
  font-weight:900;line-height:1.0;
  letter-spacing:-3px;color:var(--sp-black);
  margin-bottom:28px;
}
.studio-page .sp-hero h1 em{font-style:italic;font-family:var(--sp-serif);font-weight:800;color:var(--sp-black)}
.studio-page .sp-hero-sub{
  font-size:17px;color:var(--sp-gray);line-height:1.75;
  margin-bottom:44px;max-width:540px;font-weight:400;
  margin-left:auto;margin-right:auto;
}
.studio-page .sp-hero-ctas{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:64px;justify-content:center}
.studio-page .sp-btn-primary{
  background:var(--sp-pink);color:#fff;
  border:none;padding:15px 32px;
  font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;
  display:inline-block;letter-spacing:.3px;transition:all .25s;
}
.studio-page .sp-btn-primary:hover{background:#0089cc;transform:translateY(-2px);box-shadow:0 12px 32px rgba(1,174,255,.25)}
.studio-page .sp-btn-outline{
  background:transparent;color:var(--sp-black);
  border:1.5px solid rgba(10,10,10,.2);
  padding:14px 32px;font-size:14px;font-weight:600;cursor:pointer;text-decoration:none;
  display:inline-block;letter-spacing:.3px;transition:all .25s;
}
.studio-page .sp-btn-outline:hover{border-color:var(--sp-black);background:rgba(10,10,10,.04)}
.studio-page .sp-hero-stats{display:flex;gap:44px;justify-content:center}
.studio-page .sp-hero-stat-val{font-size:26px;font-weight:900;color:var(--sp-black);letter-spacing:-1px}
.studio-page .sp-hero-stat-lbl{font-size:12px;color:var(--sp-gray);margin-top:3px;font-weight:400}
.studio-page .sp-hero-lines{
  position:absolute;right:0;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:6px;padding-right:20px;
}
.studio-page .sp-hero-line{height:1.5px;background:var(--sp-pink);opacity:.25}
.studio-page .sp-hero-line:nth-child(1){width:40px}
.studio-page .sp-hero-line:nth-child(2){width:24px}
.studio-page .sp-hero-line:nth-child(3){width:60px}
.studio-page .sp-hero-line:nth-child(4){width:16px}
.studio-page .sp-hero-line:nth-child(5){width:48px}
.studio-page .sp-hero-scroll{
  position:absolute;bottom:36px;left:60px;
  display:flex;align-items:center;gap:12px;
  font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;
  color:var(--sp-gray);
}
.studio-page .sp-hero-scroll::before{content:'';width:40px;height:1px;background:var(--sp-gray-light)}

/* ── MARQUEE ── */
.studio-page .sp-marquee-wrap{background:var(--sp-black);padding:16px 0;overflow:hidden}
.studio-page .sp-marquee-track{display:flex;width:max-content;animation:s-marquee 28s linear infinite}
.studio-page .sp-marquee-item{
  padding:0 40px;white-space:nowrap;
  font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
  color:rgba(255,255,255,.4);display:flex;align-items:center;gap:16px;
}
.studio-page .sp-marquee-dot{color:var(--sp-pink);font-size:7px}

/* ── SECTIONS COMUNS ── */
.studio-page section{padding:120px 60px;margin:0}
.studio-page .sp-container{max-width:1280px;margin:0 auto}
.studio-page .sp-eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
  color:var(--sp-pink);margin-bottom:20px;
}
.studio-page .sp-eyebrow::before{content:'';width:28px;height:1.5px;background:var(--sp-pink)}
.studio-page .sp-title{
  font-size:clamp(28px,4vw,52px);
  font-weight:900;line-height:1.1;letter-spacing:-1.5px;
  color:var(--sp-black);
}
.studio-page .sp-title em{font-style:italic;font-family:var(--sp-serif)}
.studio-page .sp-sub{font-size:16px;color:var(--sp-gray);line-height:1.75;max-width:520px;margin-top:16px}
.studio-page .sp-section-header{margin-bottom:64px}
.studio-page .sp-section-header.between{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;flex-wrap:wrap}

/* ── PROJETOS ── */
.studio-page .sp-proj-section{background:var(--sp-white);padding-top:100px;padding-bottom:100px}
.studio-page .sp-filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:52px}
.studio-page .sp-filter-btn{
  padding:9px 22px;
  font-size:13px;font-weight:600;cursor:pointer;
  border:1.5px solid var(--sp-gray-light);
  background:transparent;color:var(--sp-gray);
  transition:all .2s;font-family:var(--sp-sans);
}
.studio-page .sp-filter-btn:hover,.studio-page .sp-filter-btn.active{background:var(--sp-black);border-color:var(--sp-black);color:#fff}
.studio-page .sp-filter-btn.active{background:var(--sp-pink);border-color:var(--sp-pink)}
.studio-page .sp-proj-grid{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:260px;gap:16px}
.studio-page .sp-proj-card{position:relative;overflow:hidden;cursor:pointer;background:var(--sp-gray-mid)}
.studio-page .sp-proj-bg{width:100%;height:100%;transition:transform .6s cubic-bezier(.22,1,.36,1)}
.studio-page .sp-proj-card:hover .sp-proj-bg{transform:scale(1.05)}
.studio-page .sp-proj-overlay{
  position:absolute;inset:0;
  background:linear-gradient(to top,rgba(0,0,0,.80) 0%,transparent 55%);
  opacity:0;transition:opacity .35s;
  display:flex;flex-direction:column;justify-content:flex-end;padding:24px;
}
.studio-page .sp-proj-card:hover .sp-proj-overlay{opacity:1}
.studio-page .sp-proj-cat{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--sp-pink);margin-bottom:6px;display:block}
.studio-page .sp-proj-name{font-size:18px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:6px}
.studio-page .sp-proj-desc{font-size:12px;color:rgba(255,255,255,.65);line-height:1.5}
.studio-page .p-w8{grid-column:span 8}.studio-page .p-w4{grid-column:span 4}
.studio-page .p-w6{grid-column:span 6}.studio-page .p-w5{grid-column:span 5}
.studio-page .p-w7{grid-column:span 7}.studio-page .p-h2{grid-row:span 2}
.studio-page .pb-1{background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)}
.studio-page .pb-2{background:linear-gradient(135deg,#01aeff 0%,#01aeff 100%)}
.studio-page .pb-3{background:linear-gradient(135deg,#2d2d2d 0%,#555 100%)}
.studio-page .pb-4{background:linear-gradient(135deg,#f5e6d3 0%,#e8c9a0 100%)}
.studio-page .pb-5{background:linear-gradient(135deg,#0a3d62 0%,#1e3799 100%)}
.studio-page .pb-6{background:linear-gradient(135deg,#6c5ce7 0%,#a29bfe 100%)}
.studio-page .pb-7{background:linear-gradient(135deg,#00b894 0%,#00cec9 100%)}
.studio-page .pb-8{background:linear-gradient(135deg,#e17055 0%,#d63031 100%)}
.studio-page .sp-proj-mockup{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.studio-page .sp-proj-mockup::after{content:attr(data-label);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.35);text-align:center;white-space:nowrap}
.studio-page .sp-proj-mockup-shape{width:60%;height:60%;border:1.5px solid rgba(255,255,255,.15);}
.studio-page .pb-4 .sp-proj-mockup-shape{border-color:rgba(0,0,0,.12)}
.studio-page .pb-4 .sp-proj-mockup::after{color:rgba(0,0,0,.25)}

/* ── SOCIAL ── */
.studio-page .sp-social-section{background:var(--sp-white);padding:100px 60px}
.studio-page .sp-sgb{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.studio-page .sp-sgb-card{aspect-ratio:1080/1350;overflow:hidden;position:relative;cursor:pointer}
.studio-page .sp-sgb-card .sp-sc-bg{width:100%;height:100%;transition:transform .55s cubic-bezier(.22,1,.36,1)}
.studio-page .sp-sgb-card:hover .sp-sc-bg{transform:scale(1.07)}
.studio-page .sp-sgb-card .sp-sc-overlay{position:absolute;inset:0;background:rgba(1,174,255,0);transition:background .3s}
.studio-page .sp-sgb-card:hover .sp-sc-overlay{background:rgba(1,174,255,.12)}
.studio-page .sc-1{background:linear-gradient(135deg,#2d2d2d,#111)}
.studio-page .sc-2{background:linear-gradient(135deg,#c0392b,#96281b)}
.studio-page .sc-3{background:linear-gradient(135deg,#2980b9,#1a5276)}
.studio-page .sc-4{background:linear-gradient(135deg,#27ae60,#1e8449)}
.studio-page .sc-5{background:linear-gradient(135deg,#f39c12,#d68910)}
.studio-page .sc-6{background:linear-gradient(135deg,#8e44ad,#6c3483)}
.studio-page .sc-7{background:linear-gradient(135deg,#01aeff,#0a4b87)}
.studio-page .sc-8{background:linear-gradient(135deg,#1abc9c,#148f77)}
.studio-page .sc-9{background:linear-gradient(135deg,#e74c3c,#c0392b)}
.studio-page .sc-10{background:linear-gradient(135deg,#34495e,#2c3e50)}
.studio-page .sc-11{background:linear-gradient(135deg,#e67e22,#ca6f1e)}
.studio-page .sc-12{background:linear-gradient(135deg,#16a085,#0e6655)}

/* ── COM QUE TRABALHO ── */
.studio-page .sp-cqt-section{background:var(--sp-bg);padding:100px 60px}
.studio-page .sp-cqt-inner{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.studio-page .sp-cqt-visual{position:relative;display:flex;justify-content:center;padding:40px 0}
.studio-page .sp-cqt-bg{position:absolute;left:0;top:20px;bottom:20px;right:30%;background:#e0e0de;z-index:0}
.studio-page .sp-cqt-phone{position:relative;z-index:1;width:200px;background:#0a0a0a;padding:8px;box-shadow:0 32px 80px rgba(0,0,0,.22);transform:rotate(-4deg)}
.studio-page .sp-cqt-screen{background:#fff;overflow:hidden;padding:12px}
.studio-page .sp-cqt-notch{width:60px;height:6px;background:#0a0a0a;margin:0 auto 10px}
.studio-page .sp-cqt-ig-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.studio-page .sp-cqt-ig-avatar{width:32px;height:32px;flex-shrink:0;background:linear-gradient(135deg,#01aeff,#01aeff)}
.studio-page .sp-cqt-ig-stats{display:flex;justify-content:space-around;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f0f0ee}
.studio-page .sp-cqt-ig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.studio-page .sp-cqt-ig-thumb{aspect-ratio:1;}
.studio-page .sp-cqt-text{padding-left:20px}

/* ── SERVIÇOS PILLS ── */
.studio-page .sp-servicos-section{background:var(--sp-white);padding:100px 60px}
.studio-page .sp-pills-wrap{display:flex;flex-direction:column;gap:16px}
.studio-page .sp-pills-row{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.studio-page .sp-pills-row-offset{padding-left:60px}
.studio-page .sp-pill{
  padding:14px 28px;background:#f2f2f0;
  font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;
  color:var(--sp-pink);cursor:default;transition:all .25s;border:1.5px solid transparent;
}
.studio-page .sp-pill:hover{background:var(--sp-pink-light);border-color:rgba(1,174,255,.2);transform:translateY(-2px)}

/* ── SOBRE ── */
.studio-page .sp-sobre-section{background:var(--sp-white)}
.studio-page .sp-sobre-inner{display:grid;grid-template-columns:1fr 1fr;gap:100px;align-items:center}
.studio-page .sp-sobre-img-wrap{position:relative}
.studio-page .sp-sobre-img{width:100%;aspect-ratio:3/4;overflow:hidden;background:linear-gradient(135deg,#1a1a1a,#444);filter:grayscale(100%);display:flex;align-items:flex-end;position:relative}
.studio-page .sp-sobre-img::before{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.5),transparent 60%)}
.studio-page .sp-sobre-img-label{position:relative;z-index:1;padding:24px;font-size:13px;font-weight:600;color:rgba(255,255,255,.6)}
.studio-page .sp-sobre-badge{position:absolute;bottom:-20px;right:-20px;background:var(--sp-pink);color:#fff;padding:20px 24px;box-shadow:0 16px 48px rgba(1,174,255,.3)}
.studio-page .sp-sobre-badge-val{font-size:32px;font-weight:900;line-height:1}
.studio-page .sp-sobre-badge-lbl{font-size:12px;font-weight:600;opacity:.8;margin-top:4px}
.studio-page .sp-sobre-text{padding-left:20px}
.studio-page .sp-sobre-copy p{font-size:16px;color:var(--sp-gray);line-height:1.85;margin-bottom:20px}
.studio-page .sp-sobre-copy p strong{color:var(--sp-black);font-weight:700}
.studio-page .sp-sobre-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-top:44px;border-top:1px solid var(--sp-gray-light);padding-top:36px}
.studio-page .sp-sobre-stat{padding-right:24px;border-right:1px solid var(--sp-gray-light)}
.studio-page .sp-sobre-stat:last-child{border:none;padding-left:24px;padding-right:0}
.studio-page .sp-sobre-stat:nth-child(2){padding:0 24px}
.studio-page .sp-sobre-stat-val{font-size:36px;font-weight:900;color:var(--sp-black);letter-spacing:-1.5px}
.studio-page .sp-sobre-stat-lbl{font-size:12px;color:var(--sp-gray);margin-top:4px;line-height:1.4}

/* ── DEPOIMENTOS ── */
.studio-page .sp-dep-section{background:var(--sp-black);padding:100px 60px}
.studio-page .sp-dep-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.studio-page .sp-dep-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);padding:36px;transition:all .3s}
.studio-page .sp-dep-card:hover{background:rgba(255,255,255,.08);transform:translateY(-4px)}
.studio-page .sp-dep-stars{display:flex;gap:3px;margin-bottom:20px}
.studio-page .sp-dep-star{width:14px;height:14px;fill:var(--sp-pink)}
.studio-page .sp-dep-quote{font-size:15px;color:rgba(255,255,255,.75);line-height:1.75;margin-bottom:28px;font-style:italic;font-family:var(--sp-serif);font-weight:400}
.studio-page .sp-dep-author{display:flex;align-items:center;gap:14px;padding-top:24px;border-top:1px solid rgba(255,255,255,.08)}
.studio-page .sp-dep-avatar{width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0}
.studio-page .sp-dep-name{font-size:14px;font-weight:700;color:#fff}
.studio-page .sp-dep-company{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px}

/* ── PROCESSO ── */
.studio-page .sp-proc-section{background:var(--sp-white);padding:100px 60px}
.studio-page .sp-process-track{display:grid;grid-template-columns:repeat(5,1fr);gap:0;margin-top:20px;position:relative}
.studio-page .sp-process-track::before{content:'';position:absolute;top:28px;left:10%;right:10%;height:1px;background:var(--sp-gray-light);z-index:0}
.studio-page .sp-proc-step{position:relative;z-index:1;padding:0 20px;text-align:center}
.studio-page .sp-proc-num{width:56px;height:56px;background:var(--sp-white);border:1.5px solid var(--sp-gray-light);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:var(--sp-gray);margin:0 auto 20px;transition:all .3s;font-family:var(--sp-sans)}
.studio-page .sp-proc-step:hover .sp-proc-num{background:var(--sp-pink);border-color:var(--sp-pink);color:#fff}
.studio-page .sp-proc-title{font-size:14px;font-weight:800;color:var(--sp-black);margin-bottom:8px}
.studio-page .sp-proc-desc{font-size:12px;color:var(--sp-gray);line-height:1.6}

/* ── CONTATO ── */
.studio-page .sp-contato-section{background:var(--sp-black);padding:0;overflow:hidden}
.studio-page .sp-contato-inner{display:grid;grid-template-columns:1fr 1fr;min-height:520px;align-items:stretch}
.studio-page .sp-contato-photo{position:relative;overflow:hidden;min-height:480px}
.studio-page .sp-contato-photo-overlay{position:absolute;inset:0;background:linear-gradient(to right,transparent 70%,var(--sp-black) 100%)}
.studio-page .sp-contato-right{display:flex;flex-direction:column;justify-content:center;padding:80px 80px 80px 60px}
.studio-page .sp-contato-right .sp-eyebrow{color:var(--sp-pink);margin-bottom:24px}
.studio-page .sp-contato-right h2{font-family:var(--sp-sans);font-size:clamp(26px,3vw,42px);font-weight:900;line-height:1.15;letter-spacing:-1px;color:#fff;margin-bottom:28px}
.studio-page .sp-contato-right h2 em{font-style:italic;font-family:var(--sp-serif)}
.studio-page .sp-contato-desc{font-size:15px;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:16px}
.studio-page .sp-contato-contact{font-size:14px;color:rgba(255,255,255,.5);line-height:1.9;margin-bottom:44px}
.studio-page .sp-contato-contact strong{color:rgba(255,255,255,.85);font-weight:600}
.studio-page .sp-btn-orcamento{display:inline-block;background:#fff;color:var(--sp-black);border:none;padding:18px 44px;font-family:var(--sp-sans);font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;cursor:pointer;text-decoration:none;transition:all .25s;align-self:flex-start}
.studio-page .sp-btn-orcamento:hover{background:var(--sp-pink);color:#fff;transform:translateY(-2px)}

/* ── FAQ ── */
.studio-page .sp-faq-section{background:var(--sp-white);padding:100px 60px}
.studio-page .sp-faq-inner{display:grid;grid-template-columns:1fr 1fr;gap:100px;align-items:start}
.studio-page .sp-faq-list{display:flex;flex-direction:column;gap:0}
.studio-page .sp-faq-item{border-bottom:1px solid var(--sp-gray-light);overflow:hidden}
.studio-page .sp-faq-q{width:100%;background:none;border:none;display:flex;align-items:center;justify-content:space-between;padding:22px 0;font-family:var(--sp-sans);font-size:15px;font-weight:700;color:var(--sp-black);cursor:pointer;text-align:left;gap:20px;transition:color .2s}
.studio-page .sp-faq-q:hover{color:var(--sp-pink)}
.studio-page .sp-faq-icon{width:26px;height:26px;border:1.5px solid var(--sp-gray-light);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;transition:all .2s;color:var(--sp-gray)}
.studio-page .sp-faq-item.open .sp-faq-icon{background:var(--sp-pink);border-color:var(--sp-pink);color:#fff;transform:rotate(45deg)}
.studio-page .sp-faq-a{max-height:0;overflow:hidden;font-size:14px;color:var(--sp-gray);line-height:1.75;transition:max-height .4s cubic-bezier(.22,1,.36,1),padding .4s}
.studio-page .sp-faq-item.open .sp-faq-a{max-height:200px;padding-bottom:20px}

/* ── FOOTER ── */
.studio-page footer{background:var(--sp-black);padding:80px 60px 40px;margin:0}
.studio-page .sp-footer-top{display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:60px;margin-bottom:60px}
.studio-page .sp-footer-brand p{font-size:13px;color:rgba(255,255,255,.4);line-height:1.75;margin-top:16px;max-width:260px}
.studio-page .sp-footer-col h4{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.35);margin-bottom:20px}
.studio-page .sp-footer-col a{display:block;font-size:14px;color:rgba(255,255,255,.55);text-decoration:none;margin-bottom:12px;transition:color .2s}
.studio-page .sp-footer-col a:hover{color:#fff}
.studio-page .sp-footer-bottom{border-top:1px solid rgba(255,255,255,.08);padding-top:32px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:rgba(255,255,255,.25)}
.studio-page .sp-footer-socials{display:flex;gap:10px}
.studio-page .sp-footer-soc{width:38px;height:38px;border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;text-decoration:none;transition:all .2s}
.studio-page .sp-footer-soc:hover{border-color:var(--sp-pink);background:rgba(1,174,255,.1)}
.studio-page .sp-footer-soc svg{width:16px;height:16px;fill:rgba(255,255,255,.5);transition:fill .2s}
.studio-page .sp-footer-soc:hover svg{fill:var(--sp-pink)}

/* ── RESPONSIVO ── */
@media(max-width:1024px){
  .studio-page nav{padding:0 32px}
  .studio-page .sp-hero{padding:100px 32px 80px}
  .studio-page .sp-hero-inner{max-width:680px}
  .studio-page section{padding:80px 32px}
  .studio-page .sp-proj-grid{grid-auto-rows:200px}
  .studio-page .p-w8,.studio-page .p-w4,.studio-page .p-w6,.studio-page .p-w5,.studio-page .p-w7{grid-column:span 12}
  .studio-page .p-h2{grid-row:span 1}
  .studio-page .sp-sgb{grid-template-columns:repeat(3,1fr)}
  .studio-page .sp-sobre-inner{grid-template-columns:1fr;gap:60px}
  .studio-page .sp-sobre-text{padding-left:0}
  .studio-page .sp-dep-grid{grid-template-columns:1fr}
  .studio-page .sp-process-track{grid-template-columns:1fr 1fr;gap:40px}
  .studio-page .sp-process-track::before{display:none}
  .studio-page .sp-contato-inner{grid-template-columns:1fr}
  .studio-page .sp-contato-photo{min-height:340px}
  .studio-page .sp-contato-right{padding:60px 40px}
  .studio-page .sp-footer-top{grid-template-columns:1fr 1fr;gap:40px}
  .studio-page .sp-cqt-inner{grid-template-columns:1fr;gap:48px}
  .studio-page .sp-pills-row-offset{padding-left:0}
}
@media(max-width:640px){
  .studio-page nav{padding:0 20px}
  .studio-page .sp-nav-links,.studio-page .sp-nav-cta{display:none}
  .studio-page .sp-nav-hamburger{display:block}
  .studio-page .sp-mobile-menu{display:flex}
  .studio-page .sp-hero{padding:90px 20px 60px}
  .studio-page .sp-hero h1{letter-spacing:-1.5px}
  .studio-page .sp-hero-stats{gap:24px}
  .studio-page section{padding:60px 20px}
  .studio-page .sp-social-section{padding-left:0;padding-right:0}
  .studio-page .sp-social-section .sp-container{max-width:100%;padding-left:0;padding-right:0}
  .studio-page .sp-social-section .sp-container>div:first-child{padding-left:20px;padding-right:20px}
  .studio-page .sp-sgb{grid-template-columns:repeat(2,1fr);gap:2px}
  .studio-page .sp-dep-grid{grid-template-columns:1fr}
  .studio-page .sp-sobre-stats{grid-template-columns:1fr 1fr}
  .studio-page .sp-sobre-stat:nth-child(3){grid-column:span 2;border:none;padding:16px 0 0}
  .studio-page .sp-footer-top{grid-template-columns:1fr}
  .studio-page .sp-faq-inner{grid-template-columns:1fr;gap:48px}
  .studio-page .sp-contato-photo{min-height:260px}
  .studio-page .sp-contato-right{padding:44px 24px}
  .studio-page .sp-cqt-phone{width:160px}
  .studio-page .sp-pills-row{justify-content:center}
  .studio-page .sp-hero-scroll{display:none}
}
`

const WA_PATH = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"

const Stars = () => (
  <div className="sp-dep-stars">
    {[0,1,2,3,4].map(i => (
      <svg key={i} className="sp-dep-star" viewBox="0 0 24 24"><path d={STAR_PATH}/></svg>
    ))}
  </div>
)

const FAQ_ITEMS = [
  { q: 'Como funciona o processo de criação?', a: 'Iniciamos com um briefing detalhado para entender seu negócio e objetivos. Após o alinhamento e confirmação do pagamento, desenvolvemos a proposta criativa com rodadas de revisão incluídas.' },
  { q: 'Qual o prazo de entrega?', a: 'Os prazos variam conforme o projeto: identidade visual em até 15 dias úteis, sites em 20-30 dias úteis e social media em até 7 dias úteis para o primeiro pack.' },
  { q: 'Quantas revisões estão incluídas?', a: 'Incluímos 3 rodadas de revisão em todos os projetos. Revisões adicionais podem ser contratadas separadamente conforme necessidade.' },
  { q: 'Como é feito o pagamento?', a: 'Trabalhamos com 50% de entrada para início do projeto e 50% na aprovação final. Aceitamos PIX, transferência bancária e cartão de crédito em até 12x.' },
  { q: 'Trabalham com empresas de outros estados?', a: 'Sim! Atendemos clientes em todo o Brasil de forma 100% remota, com comunicação pelo WhatsApp e reuniões por videoconferência quando necessário.' },
]

const MARQUEE = ['Identidade Visual','Web Design','Social Media','Branding','Landing Pages','Materiais Impressos','UI/UX Design','Tráfego Pago']

export default function StudioSite() {
  const [solid, setSolid] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  /* Inject / remove scoped CSS */
  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'studio-page-css'
    el.textContent = CSS
    document.head.appendChild(el)
    return () => document.getElementById('studio-page-css')?.remove()
  }, [])

  /* Nav solid on scroll */
  useEffect(() => {
    const h = () => setSolid(window.scrollY > 60)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  /* Scroll reveal */
  useEffect(() => {
    const ro = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && e.target.classList.add('on')),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    const t = setTimeout(() => {
      document.querySelectorAll('.studio-page .reveal,.studio-page .reveal-left,.studio-page .reveal-right')
        .forEach(el => ro.observe(el))
    }, 80)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [])

  const toggleFaq = i => setOpenFaq(openFaq === i ? -1 : i)

  return (
    <div className="studio-page">

      {/* ── NAV ── */}
      <nav className={solid ? 'solid' : ''}>
        <a href="#inicio" className="sp-nav-logo">BRUNO<span>.</span>CHAVES</a>
        <ul className="sp-nav-links">
          <li><a href="#projetos">Projetos</a></li>
          <li><a href="#servicos">Serviços</a></li>
          <li><a href="#sobre">Sobre</a></li>
          <li><a href="#contato">Contato</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
        <a href={WA} className="sp-nav-cta" target="_blank" rel="noreferrer">
          {WA_PATH} WhatsApp
        </a>
        <button className="sp-nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── MOBILE MENU DRAWER ── */}
      <div className={`sp-mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#projetos" onClick={() => setMenuOpen(false)}>Projetos</a>
        <a href="#servicos" onClick={() => setMenuOpen(false)}>Serviços</a>
        <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
        <a href="#contato" onClick={() => setMenuOpen(false)}>Contato</a>
        <a href="/blog" onClick={() => setMenuOpen(false)}>Blog</a>
        <a href={WA} className="sp-mm-cta" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
          WhatsApp
        </a>
      </div>

      {/* ── HERO ── */}
      <section className="sp-hero" id="inicio">
        <div className="sp-hero-inner">
          <div style={{width:'100%'}}>
            <div className="sp-hero-label" style={{animation:'fadeUp .6s .1s both'}}>Design Studio</div>
            <h1 style={{animation:'fadeUp .7s .2s both'}}>
              Design que<br/>
              <em>transforma</em><br/>
              marcas em<br/>
              experiências.
            </h1>
            <p className="sp-hero-sub" style={{animation:'fadeUp .7s .35s both'}}>
              Sites, identidades visuais e criativos desenvolvidos para empresas que querem crescer, vender mais e se posicionar com autoridade.
            </p>
            <div className="sp-hero-ctas" style={{animation:'fadeUp .7s .48s both'}}>
              <a href="#projetos" className="sp-btn-primary">Ver Projetos</a>
              <a href="#contato" className="sp-btn-outline">Solicitar Orçamento</a>
            </div>
            <div className="sp-hero-stats" style={{animation:'fadeUp .7s .6s both'}}>
              <div><div className="sp-hero-stat-val">+15</div><div className="sp-hero-stat-lbl">Anos de experiência</div></div>
              <div style={{width:1,background:'var(--sp-gray-light)'}}/>
              <div><div className="sp-hero-stat-val">+300</div><div className="sp-hero-stat-lbl">Projetos entregues</div></div>
              <div style={{width:1,background:'var(--sp-gray-light)'}}/>
              <div><div className="sp-hero-stat-val">100%</div><div className="sp-hero-stat-lbl">Satisfação garantida</div></div>
            </div>
          </div>
        </div>
        <div className="sp-hero-lines">
          {[0,1,2,3,4].map(i => <div key={i} className="sp-hero-line"/>)}
        </div>
        <div className="sp-hero-scroll">Scroll</div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="sp-marquee-wrap">
        <div className="sp-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <div key={i} className="sp-marquee-item">{item} <span className="sp-marquee-dot">●</span></div>
          ))}
        </div>
      </div>

      {/* ── PROJETOS ── */}
      <section className="sp-proj-section" id="projetos">
        <div className="sp-container">
          <div className="sp-section-header between reveal">
            <div>
              <div className="sp-eyebrow">Projetos</div>
              <h2 className="sp-title">Trabalhos que<br/><em>falam por si.</em></h2>
            </div>
            <a href="#contato" className="sp-btn-outline">Ver todos →</a>
          </div>
          <div className="sp-filter-bar reveal">
            {['all','branding','social','web','impressos','publicidade'].map(f => (
              <button key={f} className={`sp-filter-btn${activeFilter===f?' active':''}`} onClick={() => setActiveFilter(f)}>
                {f==='all'?'Todos':f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div className="sp-proj-grid">
            {[
              {cls:'p-w8 p-h2 pb-1',label:'Identidade Visual',cat:'Branding',name:'Pierozah — Identidade Visual Completa',desc:'Marca, papelaria, manual e aplicações digitais'},
              {cls:'p-w4 pb-2',label:'Social Media',cat:'Social Media',name:'FJ — Feed & Stories',desc:'Conteúdo mensal Instagram'},
              {cls:'p-w4 pb-3',label:'Web Design',cat:'Web Design',name:'Landing Page — Curso Premium',desc:'Alta conversão, tráfego pago'},
              {cls:'p-w5 pb-8',label:'Publicidade',cat:'Publicidade',name:'Outdoor — Campanha Brasil Fitness',desc:'OOH + mídia digital integrada'},
              {cls:'p-w7 pb-4',label:'Impressos',cat:'Impressos',name:'Papelaria Corporativa — Linha Premium',desc:'Cartões, envelopes, pastas e brindes'},
              {cls:'p-w6 pb-5',label:'Branding',cat:'Branding',name:'Agro Brand — Identidade Visual',desc:'Posicionamento e aplicações'},
              {cls:'p-w6 pb-6',label:'UI/UX',cat:'Web Design',name:'App UI — Marketplace Digital',desc:'Interface e experiência do usuário'},
            ].map((p, i) => (
              <div key={i} className={`sp-proj-card ${p.cls} reveal${i>0?' d'+(i%3+1):''}`}>
                <div className="sp-proj-bg sp-proj-mockup" data-label={p.label}>
                  <div className="sp-proj-mockup-shape"/>
                </div>
                <div className="sp-proj-overlay">
                  <span className="sp-proj-cat">{p.cat}</span>
                  <div className="sp-proj-name">{p.name}</div>
                  <div className="sp-proj-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL MEDIA ── */}
      <section className="sp-social-section" id="social">
        <div className="sp-container">
          <div style={{textAlign:'center',maxWidth:640,margin:'0 auto 56px'}} className="reveal">
            <div className="sp-eyebrow" style={{justifyContent:'center'}}>Social Media</div>
            <h2 className="sp-title">Conteúdo que<br/><em>engaja e vende.</em></h2>
            <p style={{fontSize:15,color:'var(--sp-gray)',lineHeight:1.75,marginTop:16}}>
              Conheça alguns dos nossos projetos recentes para Instagram, pensados para elevar o padrão visual e a comunicação diária de cada negócio.
            </p>
          </div>
          <div className="sp-sgb reveal">
            {[
              'ARTE-ARTICULATO.jpg',
              'ARTE-BARBOSA.jpg',
              'ARTE-BRUNO-LUNA.jpg',
              'ARTE-BVG.jpg',
              'ARTE-CHOPPSUL1.jpg',
              'ARTE-CHOPPSUL2.jpg',
              'ARTE-CIA-DO-ACAI.jpg',
              'ARTE-DANI-VILHES.jpg',
              'ARTE-GREEN-STATION.jpg',
              'ARTE-HAMBURGUER.png',
              'ARTE-SOLMARIS.jpg',
              'ARTE-ZENVET.png',
            ].map((img, i) => (
              <div key={i} className="sp-sgb-card">
                <div className="sp-sc-bg" style={{ backgroundImage: `url('/${img}')`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }}/>
                <div className="sp-sc-overlay"/>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:48}} className="reveal">
            <a href="#contato" className="sp-btn-primary">Solicitar cotação →</a>
          </div>
        </div>
      </section>

      {/* ── COM QUE TRABALHO ── */}
      <section className="sp-cqt-section" id="trabalho">
        <div className="sp-container">
          <div className="sp-cqt-inner">
            <div className="sp-cqt-visual reveal-left">
              <div className="sp-cqt-bg"/>
              <div className="sp-cqt-phone">
                <div className="sp-cqt-screen">
                  <div className="sp-cqt-notch"/>
                  <div className="sp-cqt-ig-header">
                    <div className="sp-cqt-ig-avatar"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,fontWeight:700,color:'#0a0a0a'}}>brunochaves.studio</div>
                      <div style={{fontSize:8,color:'#888',marginTop:1}}>Designer & Desenvolvedor</div>
                    </div>
                    <div style={{fontSize:8,fontWeight:700,color:'var(--sp-pink)',border:'1px solid var(--sp-pink)',borderRadius:4,padding:'2px 6px'}}>Seguir</div>
                  </div>
                  <div className="sp-cqt-ig-stats">
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,fontWeight:700}}>+300</div><div style={{fontSize:8,color:'#888'}}>projetos</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,fontWeight:700}}>15k</div><div style={{fontSize:8,color:'#888'}}>seguidores</div></div>
                    <div style={{textAlign:'center'}}><div style={{fontSize:10,fontWeight:700}}>890</div><div style={{fontSize:8,color:'#888'}}>seguindo</div></div>
                  </div>
                  <div className="sp-cqt-ig-grid">
                    {['sc-1','sc-2','sc-3','sc-7','sc-5','sc-6'].map((c,i) => (
                      <div key={i} className={`sp-cqt-ig-thumb ${c}`}/>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="sp-cqt-text reveal-right">
              <div className="sp-eyebrow">Serviços</div>
              <h2 className="sp-title" style={{marginBottom:24}}>Com o que<br/><em>trabalho?</em></h2>
              <p style={{fontSize:16,color:'var(--sp-gray)',lineHeight:1.8,marginBottom:16}}>De forma geral, transformo suas ideias e as ideias da sua empresa em materiais de Design Gráfico de alto nível.</p>
              <p style={{fontSize:16,color:'var(--sp-black)',fontWeight:600,lineHeight:1.8,marginBottom:16}}>Minha contribuição em Design vai desde a criação de uma Identidade Visual para sua empresa, até a gestão completa das redes sociais dela.</p>
              <p style={{fontSize:15,color:'var(--sp-gray)',lineHeight:1.8}}>Trabalho com materiais para <strong style={{color:'var(--sp-black)'}}>Web</strong> — Redes Sociais, Sites, Landing Pages, Banners — quanto com materiais para <strong style={{color:'var(--sp-black)'}}>Impressão</strong> — Catálogos, Folders, Cartões, Outdoors.</p>
              <a href="#contato" className="sp-btn-primary" style={{marginTop:36,display:'inline-block'}}>Fale comigo →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS PILLS ── */}
      <section className="sp-servicos-section" id="servicos">
        <div className="sp-container">
          <div style={{textAlign:'center',marginBottom:60}} className="reveal">
            <div className="sp-eyebrow" style={{justifyContent:'center'}}>O que fazemos</div>
            <h2 className="sp-title">Soluções para<br/><em>cada necessidade.</em></h2>
          </div>
          <div className="sp-pills-wrap reveal">
            <div className="sp-pills-row">
              {['Identidades Visuais','Cartões de Visitas','Design de Sites','Apresentações Comerciais'].map((s,i) => <div key={i} className="sp-pill">{s}</div>)}
            </div>
            <div className="sp-pills-row sp-pills-row-offset">
              {['Artes para o Instagram','Artes para Anúncios','Landing Pages'].map((s,i) => <div key={i} className="sp-pill">{s}</div>)}
            </div>
            <div className="sp-pills-row">
              {['Catálogos de Produtos','Cardápios','Portfólios Institucionais','Logotipos'].map((s,i) => <div key={i} className="sp-pill">{s}</div>)}
            </div>
          </div>
          <div style={{textAlign:'center',marginTop:52}} className="reveal">
            <a href="#contato" className="sp-btn-primary">Solicitar orçamento →</a>
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section className="sp-sobre-section" id="sobre">
        <div className="sp-container">
          <div className="sp-sobre-inner">
            <div className="sp-sobre-img-wrap reveal-left">
              <div className="sp-sobre-img">
                <div className="sp-sobre-img-label">Bruno Chaves — Designer & Dev</div>
              </div>
              <div className="sp-sobre-badge reveal d3">
                <div className="sp-sobre-badge-val">+15</div>
                <div className="sp-sobre-badge-lbl">anos criando</div>
              </div>
            </div>
            <div className="sp-sobre-text reveal-right">
              <div className="sp-eyebrow">Sobre</div>
              <h2 className="sp-title" style={{marginBottom:28}}>Mais do que design,<br/><em>criamos posicionamento.</em></h2>
              <div className="sp-sobre-copy">
                <p>Acreditamos que marcas fortes nascem da combinação entre <strong>estratégia, estética e experiência.</strong> Cada projeto é tratado como único — do briefing à entrega final.</p>
                <p>Com mais de 15 anos de experiência, já transformamos centenas de marcas em experiências visuais memoráveis que geram resultado real para os nossos clientes.</p>
                <p>Nossa abordagem combina visão estratégica com execução criativa de alto nível, sempre alinhada aos objetivos de negócio de cada cliente.</p>
              </div>
              <div className="sp-sobre-stats reveal d2">
                <div className="sp-sobre-stat">
                  <div className="sp-sobre-stat-val">+15</div>
                  <div className="sp-sobre-stat-lbl">anos de<br/>experiência</div>
                </div>
                <div className="sp-sobre-stat">
                  <div className="sp-sobre-stat-val">+300</div>
                  <div className="sp-sobre-stat-lbl">projetos<br/>entregues</div>
                </div>
                <div className="sp-sobre-stat">
                  <div className="sp-sobre-stat-val">BR</div>
                  <div className="sp-sobre-stat-lbl">clientes em<br/>todo o Brasil</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="sp-dep-section" id="depoimentos">
        <div className="sp-container">
          <div className="reveal" style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',marginBottom:60}}>
            <div className="sp-eyebrow" style={{color:'rgba(255,255,255,.5)'}}>Depoimentos</div>
            <h2 className="sp-title" style={{color:'#fff'}}>O que dizem<br/><em style={{color:'var(--sp-pink)'}}>nossos clientes.</em></h2>
          </div>
          <div className="sp-dep-grid">
            {[
              {quote:'"O Bruno entregou exatamente o que a nossa marca precisava. A identidade visual ficou incrível e o resultado em vendas foi imediato."',name:'Ana Martins',co:'CEO — Clinica AM Estética',bg:'linear-gradient(135deg,#01aeff,#0a4b87)',initials:'AM'},
              {quote:'"Trabalhar com o Bruno foi transformador para o nosso negócio. O site novo triplicou as conversões no primeiro mês. Profissional incrível."',name:'Ricardo Ferreira',co:'Diretor — Agro Premium',bg:'linear-gradient(135deg,#0f3460,#533483)',initials:'RF'},
              {quote:'"A equipe do Bruno entende de negócios. Não é só design bonito — é estratégia visual que gera resultados reais e mensuráveis."',name:'Juliana Santos',co:'Fundadora — Academia JS Fitness',bg:'linear-gradient(135deg,#00b894,#00cec9)',initials:'JS'},
            ].map((d,i) => (
              <div key={i} className={`sp-dep-card reveal${i>0?' d'+i:''}`}>
                <Stars/>
                <p className="sp-dep-quote">{d.quote}</p>
                <div className="sp-dep-author">
                  <div className="sp-dep-avatar" style={{background:d.bg}}>{d.initials}</div>
                  <div>
                    <div className="sp-dep-name">{d.name}</div>
                    <div className="sp-dep-company">{d.co}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESSO ── */}
      <section className="sp-proc-section" id="processo">
        <div className="sp-container">
          <div className="reveal" style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',marginBottom:64}}>
            <div className="sp-eyebrow">Processo</div>
            <h2 className="sp-title">Como trabalhamos<br/><em>juntos.</em></h2>
            <p className="sp-sub" style={{textAlign:'center'}}>Um processo claro e transparente do briefing à entrega final.</p>
          </div>
          <div className="sp-process-track reveal">
            {[
              {n:'01',t:'Estratégia',d:'Entendemos seu negócio, público e objetivos antes de qualquer pixel.'},
              {n:'02',t:'Conceito',d:'Desenvolvemos a direção criativa alinhada à sua identidade.'},
              {n:'03',t:'Design',d:'Criação visual com refinamento e atenção a cada detalhe.'},
              {n:'04',t:'Desenvolvimento',d:'Implementação técnica com código limpo e performance.'},
              {n:'05',t:'Entrega',d:'Arquivos organizados, manual e suporte após a entrega.'},
            ].map((s,i) => (
              <div key={i} className="sp-proc-step">
                <div className="sp-proc-num">{s.n}</div>
                <div className="sp-proc-title">{s.t}</div>
                <div className="sp-proc-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATO ── */}
      <section className="sp-contato-section" id="contato">
        <div className="sp-contato-inner">
          <div className="sp-contato-photo reveal-left">
            <div style={{width:'100%',height:'100%',minHeight:520,background:'linear-gradient(160deg,#2a2a2a 0%,#111 100%)',display:'flex',alignItems:'flex-end',padding:40}}>
              <div style={{fontFamily:'var(--sp-serif)',fontSize:'clamp(22px,2.5vw,32px)',fontStyle:'italic',color:'rgba(255,255,255,.18)',lineHeight:1.3}}>
                "Design que comunica.<br/>Marca que permanece."
              </div>
            </div>
            <div className="sp-contato-photo-overlay"/>
          </div>
          <div className="sp-contato-right reveal-right">
            <div className="sp-eyebrow">Contato</div>
            <h2>Tire suas dúvidas e solicite um<br/><em>orçamento sem compromisso</em></h2>
            <p className="sp-contato-desc">
              Estou sempre aberto para novos projetos e parcerias. Se você tem uma ideia ou precisa de um olhar profissional para sua marca, me conta — vou adorar entender o seu negócio e apresentar a melhor solução.
            </p>
            <p className="sp-contato-contact">
              <strong>E-mail:</strong> brunochaves2102@gmail.com<br/>
              <strong>WhatsApp:</strong> (19) 99722-2986<br/>
              <strong>Resposta em até 24 horas úteis.</strong>
            </p>
            <a href={WA} target="_blank" rel="noreferrer" className="sp-btn-orcamento">
              Solicite um orçamento
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="sp-faq-section" id="faq">
        <div className="sp-container">
          <div className="sp-faq-inner">
            <div className="reveal-left">
              <div className="sp-eyebrow">Dúvidas</div>
              <h2 className="sp-title">Perguntas<br/><em>frequentes.</em></h2>
              <p className="sp-sub" style={{marginTop:16}}>Tem alguma outra dúvida? Fale diretamente pelo WhatsApp.</p>
              <a href={WA} className="sp-btn-primary" style={{marginTop:32,display:'inline-block'}} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
            </div>
            <div className="sp-faq-list reveal-right">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className={`sp-faq-item${openFaq===i?' open':''}`}>
                  <button className="sp-faq-q" onClick={() => toggleFaq(i)}>
                    {item.q}
                    <span className="sp-faq-icon">+</span>
                  </button>
                  <div className="sp-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="sp-container">
          <div className="sp-footer-top">
            <div className="sp-footer-brand">
              <a href="#inicio" className="sp-nav-logo" style={{color:'#fff',fontSize:20}}>BRUNO<span>.</span>CHAVES</a>
              <p>Design que transforma marcas em experiências memoráveis. Identidade visual, sites e criativos para empresas que querem crescer.</p>
            </div>
            <div className="sp-footer-col">
              <h4>Serviços</h4>
              <a href="#servicos">Identidade Visual</a>
              <a href="#servicos">Web Design</a>
              <a href="#servicos">Social Media</a>
              <a href="#servicos">Landing Pages</a>
              <a href="#servicos">Materiais Impressos</a>
            </div>
            <div className="sp-footer-col">
              <h4>Links</h4>
              <a href="#projetos">Projetos</a>
              <a href="#sobre">Sobre</a>
              <a href="#processo">Processo</a>
              <a href="#contato">Contato</a>
              <a href="/curriculo">Currículo</a>
            </div>
            <div className="sp-footer-col">
              <h4>Contato</h4>
              <a href="mailto:brunochaves2102@gmail.com">brunochaves2102@gmail.com</a>
              <a href={WA} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="#" target="_blank" rel="noreferrer">Instagram</a>
              <a href="#" target="_blank" rel="noreferrer">Behance</a>
            </div>
          </div>
          <div className="sp-footer-bottom">
            <span>© 2025 Bruno Chaves Studio. Todos os direitos reservados.</span>
            <div className="sp-footer-socials">
              <a href="#" className="sp-footer-soc" title="Instagram">
                <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="rgba(255,255,255,.5)" fill="none"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" className="sp-footer-soc" title="Behance">
                <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.5)"><path d="M22 7h-7V5h7v2zM9.4 9.6C10.4 9 11 8 11 6.7 11 4.1 9.1 3 6.6 3H1v18h6.1c2.7 0 5.2-1.3 5.2-4.3 0-1.9-.9-3.3-2.9-4.1zM3.8 5.4h2.3c1.1 0 2.1.4 2.1 1.7S7.2 9 6.1 9H3.8V5.4zm2.8 11.2H3.8v-4.2h2.9c1.3 0 2.3.6 2.3 2-.1 1.6-1.1 2.2-2.4 2.2zm7.9-7.5c-3.1 0-5 2.2-5 5.3S11.4 20 14.5 20c2.5 0 4.1-1.4 4.8-3.6h-2.4c-.3.9-1.2 1.5-2.3 1.5-1.6 0-2.6-1-2.7-2.6H19.4c.1-3.2-1.5-6.2-5-6.2h.1zm-2.1 4.2c.2-1.3 1-2.2 2.3-2.2 1.2 0 2.1.9 2.2 2.2h-4.5z"/></svg>
              </a>
              <a href={WA} className="sp-footer-soc" title="WhatsApp" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.5)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
