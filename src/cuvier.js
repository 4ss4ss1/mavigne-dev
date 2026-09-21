// ════════════════════════════════════════════════════════════════════════════
// MA VIGNE — src/cuvier.js
// Module Le Cuvier : réceptions, cuves de vinification, relevés, opérations,
// décuvage, tournée, analyses de maturité, ventes en vrac et leurs documents.
// Sorti de cave.js au lot CUV-DEC (§164) : cave.js touchait le plafond de 1 024 ko.
// © 2026 Nicolas GUERET / GUERETTECH
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠️ Chargé JUSTE APRÈS cave.js (app.js). Il lit le Chai par window, et le Chai le
//   lit par window : un nom déclaré dans un module et lu dans un autre n'existe pas
//   après le build s'il n'est pas posé sur window (CLAUDE.md §24 n°6). Les deux blocs
//   « LA FRONTIÈRE », en fin de fichier ici et dans cave.js, sont le seul passage.
// ⚠️ Aucun état mutable partagé : la section active se lit par _caveSectionAct(),
//   l'onglet du Cuvier se remet par _vendOngletCuves(). CAVE_VENDANGE et CAVE_ELEVAGE
//   sont le même objet, posé sur window par cave.js au chargement, muté en place,
//   jamais réaffecté.
// ⚠️ Rien ne s'exécute au chargement hors déclarations et expositions : aucun des deux
//   fichiers ne lit l'autre avant le premier geste (mv-harnais-cuvier).
// ════════════════════════════════════════════════════════════════════════════

import { isAdmin, canWrite, showToast, _escHtml, _escAttr, _mvBadge, _mvIcon } from './utils.js';

const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

var _vendTab = 'cuves';
var _vendEditId = null;
var _vendVendu = false;
var _vendEraflage = 'total';
var _vcuvEditId = null;
// Cuve du parc rattachee a la cuve de vinification en cours d'edition.
var _vcuvRef = null;
var _vcuvMpfActive = false;
var _vmesureCuveId = null;
var _vmesureEditId = null;   // releve en cours de correction, null en creation
var _vmRem = 2;
var _vmPig = 1;
// ══════ REFONTE VENDANGE — « Le Cuvier » (mvv) ══════
function _vendInjectCss(){
  if(document.getElementById('mvv-vend-css')) return;
  var s=document.createElement('style'); s.id='mvv-vend-css';
  s.textContent=`
.mvv-wrap{background:var(--bg-app,#F2EFE7);min-height:60vh;color:var(--texte,#1A1A14);
  padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))}
.mvv-wrap *{box-sizing:border-box}
.mvv-hdr{padding:0 14px 6px;background:var(--bg-app,#F2EFE7)}
.mvv-kpis{display:flex;gap:8px;margin-bottom:10px}
.mvv-kpi{flex:1;background:var(--bg-card,#FBFAF6);border:1px solid var(--gris-clair,#ECE6DA);border-radius:13px;padding:10px 6px;text-align:center;box-shadow:0 2px 8px rgba(20,17,13,.04)}
.mvv-kpi.live{background:var(--or-pale,#FAF3E0);border-color:rgba(194,161,77,.32)}
.mvv-kpi-num{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-md,20px);line-height:1;color:var(--cave,#14110D)}
.mvv-kpi.live .mvv-kpi-num{color:var(--or,#C2A14D)}
.mvv-kpi-lbl{font-size:var(--pt-nano,9.5px);letter-spacing:.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.2}
.mvv-health{position:relative}
.mvv-health-track{height:7px;border-radius:5px;background:var(--gris-clair,#ECE6DA);overflow:hidden;display:flex}
.mvv-health-ok{height:100%;background:linear-gradient(90deg,#5B8C3E,#3D6B27);transition:width .5s ease}
.mvv-health-due{height:100%;background:linear-gradient(90deg,#C86A4E,#B0412C);transition:width .5s ease}
.mvv-health-lbl{display:flex;justify-content:space-between;font-size:var(--pt-micro,11px);margin-top:5px;color:var(--texte-med,#4A4A3A)}
.mvv-health-lbl b{color:var(--texte,#1A1A14)}
.mvv-tabs{display:flex;gap:5px;padding:12px 14px 2px;background:var(--bg-app,#F2EFE7)}
.mvv-tab{flex:1;border:1px solid transparent;background:var(--gris-clair,#ECE6DA);border-radius:11px;padding:9px 4px;
  color:var(--texte-doux,#5F5F5F);font-size:var(--pt-txt,12.5px);font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;transition:.18s;font-family:inherit}
.mvv-tab .t-ico{font-size:var(--pt-base,14px)}
.mvv-tab.active{background:var(--bg-card,#FBFAF6);border-color:rgba(138,90,56,.14);color:var(--cave,#14110D);box-shadow:0 1px 4px rgba(20,17,13,.14)}
.mvv-tab .t-badge{background:#E8836F;color:#fff;font-size:var(--pt-nano,9.5px);font-weight:700;border-radius:8px;padding:1px 6px;min-width:16px;text-align:center}
.mvu-tabs.mvu-sub .mvu-tab .t-badge{background:#E8836F;color:#fff}
/* Bande de chiffres commune (#cave-kpis) : « en fermentation » est un etat vivant,
   pas un retard — il prend l'or, pas le rouge de .mvu-kpi.due du Chai. */
.mvu-kpi.live{background:var(--or-pale,#FAF3E0);border-color:rgba(194,161,77,.32)}
.mvu-kpi.live .mvu-kpi-v{color:var(--or-tx,#7A5E12)}
.mvv-body{padding:2px 14px 0}
.mvv-alert{border-radius:14px;padding:12px 13px;margin:8px 0 12px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(232,131,111,.12),rgba(232,131,111,.05));border:1px solid rgba(232,131,111,.28)}
.mvv-alert::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#C86A4E,#B0412C)}
.mvv-alert-t{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14);display:flex;align-items:center;gap:7px}
.mvv-alert-d{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);margin-top:3px;line-height:1.4}
.mvv-alert-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.mvv-alert-chip{background:var(--bg-card,#FBFAF6);border:1px solid rgba(200,106,78,.38);color:#B0412C;font-family:inherit;
  font-size:var(--pt-micro,11px);font-weight:600;border-radius:9px;padding:7px 11px;display:flex;align-items:center;gap:5px;cursor:pointer;min-height:40px}
.mvv-alert-chip small{opacity:.72;font-weight:500}
.mvv-seclbl{font-size:var(--pt-lbl,10.5px);letter-spacing:.13em;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:600;margin:18px 2px 9px}
.mvv-cuve{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);
  border-radius:16px;padding:13px 14px 13px 17px;margin-bottom:11px;position:relative;overflow:hidden;
  box-shadow:0 1px 7px rgba(20,17,13,.05);transition:transform .12s,box-shadow .12s}
.mvv-cuve::after{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:16px 0 0 16px;background:linear-gradient(180deg,#9A93A8,#6E6878)}
.mvv-cuve.act::after{background:linear-gradient(180deg,#5B8C3E,#3D6B27)}
.mvv-cuve.due::after{background:linear-gradient(180deg,#C86A4E,#B0412C)}
.mvv-cuve.due{border-color:rgba(200,106,78,.30)}
.mvv-cuve-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.mvv-cuve-name{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-md,20px);line-height:1.12;color:var(--texte,#1A1A14)}
.mvv-cuve-meta{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:1px}
.mvv-cuve-par{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;opacity:.9}
.mvv-vol{text-align:right;flex-shrink:0}
.mvv-vol-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-md,20px);color:var(--terre,#8A5A38);line-height:1}
.mvv-vol-u{font-size:var(--pt-nano,9.5px);letter-spacing:1px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-edit{background:none;border:none;color:var(--texte-doux,#5F5F5F);font-size:var(--pt-base,14px);padding:4px;margin:-4px -4px 0 0;line-height:1;cursor:pointer}
.mvv-steps{display:flex;align-items:center;margin:12px 0 4px}
.mvv-step{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;position:relative;gap:5px}
.mvv-step .dot{width:9px;height:9px;border-radius:50%;background:var(--gris,#DED7C9);border:1.5px solid var(--gris-clair,#ECE6DA);z-index:2}
.mvv-step.done .dot{background:var(--or,#C2A14D);border-color:var(--or,#C2A14D)}
.mvv-step.cur .dot{background:var(--terre,#8A5A38);border-color:var(--terre,#8A5A38);box-shadow:0 0 0 4px rgba(138,90,56,.18)}
.mvv-step .lb{font-size:var(--pt-nano,9.5px);letter-spacing:.3px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);text-align:center;white-space:nowrap}
.mvv-step.done .lb{color:var(--texte-med,#4A4A3A)}
.mvv-step.cur .lb{color:var(--terre,#8A5A38);font-weight:700}
.mvv-step::before{content:"";position:absolute;top:4px;left:-50%;width:100%;height:1.5px;background:var(--gris-clair,#ECE6DA);z-index:1}
.mvv-step:first-child::before{display:none}
.mvv-step.done::before,.mvv-step.cur::before{background:var(--or,#C2A14D)}
/* PARC-1 : la date du passage, sous le libelle de l'etape. */
.mvv-step .dt{font-size:var(--pt-nano,9.5px);letter-spacing:.2px;line-height:1;color:var(--texte-doux,#5F5F5F);text-align:center;white-space:nowrap}
.mvv-step.done .dt{color:var(--texte-med,#4A4A3A)}
.mvv-step.cur .dt{color:var(--terre,#8A5A38);font-weight:600}
.mvv-parc{margin:6px 0 2px;font-size:var(--pt-micro,11px);line-height:1.5;text-align:center;color:var(--texte-med,#4A4A3A)}
.mvv-parc b{color:var(--terre,#8A5A38);font-weight:700}
.mvv-parc .nd{color:var(--texte-doux,#5F5F5F)}
.mvv-ferm{margin-top:14px;background:var(--bg-app,#F2EFE7);border-radius:13px;padding:12px 13px 11px;border:1px solid rgba(138,90,56,.10)}
.mvv-ferm-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
.mvv-ferm-lbl{font-size:var(--pt-micro,11px);letter-spacing:.4px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:500}
.mvv-ferm-pct{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-lg,23px);line-height:1;color:var(--terre,#8A5A38)}
.mvv-ferm-pct small{font-family:inherit;font-size:var(--pt-lbl,10.5px);font-weight:600;color:var(--texte-doux,#5F5F5F);letter-spacing:.5px;margin-left:3px}
.mvv-gauge{height:11px;border-radius:7px;background:rgba(138,90,56,.11);position:relative;overflow:hidden}
.mvv-gauge-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,#8A5A38 0,#C2871E 55%,#3D6B27 100%);transition:width .5s cubic-bezier(.4,0,.2,1)}
.mvv-gauge-mk{position:absolute;top:-3px;width:2px;height:17px;background:var(--texte,#1A1A14);border-radius:2px;opacity:.55;transition:left .5s}
.mvv-ferm-scale{display:flex;justify-content:space-between;font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);margin-top:6px}
.mvv-spark{margin-top:11px}
.mvv-spark-lbl{font-size:var(--pt-nano,9.5px);letter-spacing:1px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-bottom:4px;display:flex;justify-content:space-between}
.mvv-spark svg{display:block;width:100%;height:38px;overflow:visible}
.mvv-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:11px}
.mvv-chip{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);border-radius:9px;padding:5px 9px;font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-med,#4A4A3A);display:flex;align-items:center;gap:4px}
.mvv-chip .u{color:var(--texte-doux,#5F5F5F);font-weight:400;font-size:var(--pt-lbl,10.5px)}
.mvv-chip.cool{border-color:rgba(74,159,200,.28);color:var(--ink-info,#4A9FC8);background:rgba(74,159,200,.10)}
.mvv-chip.warm{border-color:rgba(184,145,58,.30);color:#8A6A12;background:rgba(184,145,58,.12)}
.mvv-chip.hot{border-color:rgba(176,65,44,.32);color:#B0412C;background:rgba(176,65,44,.10)}
.mvv-recency{display:inline-flex;align-items:center;gap:5px;font-size:var(--pt-micro,11px);font-weight:600;border-radius:9px;padding:6px 11px;margin-top:11px}
.mvv-recency.ok{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.26);color:var(--vert-med,#3D6B27)}
.mvv-recency.watch{background:rgba(184,145,58,.12);border:1px solid rgba(184,145,58,.30);color:#8A6A12}
.mvv-recency.late{background:rgba(176,65,44,.10);border:1px solid rgba(176,65,44,.30);color:#B0412C}
.mvv-recency .pulse{animation:mvvPulse 1.6s infinite}
@keyframes mvvPulse{0%,100%{opacity:1}50%{opacity:.35}}
.mvv-act-btn{margin-top:12px;width:100%;padding:11px;border-radius:11px;font-size:var(--pt-base,14px);font-weight:600;display:flex;align-items:center;justify-content:center;gap:7px;transition:.15s;cursor:pointer;font-family:inherit;min-height:44px;
  background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38)}
.mvv-act-btn.measure{background:linear-gradient(135deg,var(--terre,#8A5A38),#6E4526);border:0;color:#fff;box-shadow:0 2px 9px rgba(138,90,56,.24)}
.mvv-act-btn.measure:active{transform:translateY(1px)}
.mvv-act-btn.ghost{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38)}
.mvv-done-tag{display:inline-flex;align-items:center;gap:6px;font-size:var(--pt-micro,11px);font-weight:600;color:var(--vert-med,#3D6B27);background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.26);border-radius:9px;padding:6px 11px;margin-top:11px}
.mvv-camp{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:16px;padding:15px 15px 13px;margin:6px 0 14px;position:relative;overflow:hidden;box-shadow:0 1px 7px rgba(20,17,13,.05)}
.mvv-camp::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--horizon,linear-gradient(90deg,#8A5A38 0%,#C2871E 50%,#3D6B27 100%))}
.mvv-camp-lbl{font-size:var(--pt-nano,9.5px);letter-spacing:2px;text-transform:uppercase;color:var(--terre,#8A5A38);font-weight:700;margin-bottom:11px}
.mvv-camp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.mvv-camp-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-xl,27px);line-height:1;color:var(--texte,#1A1A14)}
.mvv-camp-n .u{font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-doux,#5F5F5F);margin-left:3px}
.mvv-camp-cl{font-size:var(--pt-nano,9.5px);letter-spacing:.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);margin-top:4px}
.mvv-camp-sold{font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);margin-top:12px;padding-top:10px;border-top:1px solid rgba(138,90,56,.12);display:flex;align-items:center;gap:6px}
.mvv-rec{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:13px 14px;margin-bottom:10px;display:flex;gap:11px;align-items:flex-start;box-shadow:0 1px 5px rgba(20,17,13,.04);transition:.16s;cursor:pointer}
.mvv-rec-l{flex:1;min-width:0}
.mvv-rec-nm{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-sm,17px);color:var(--texte,#1A1A14);line-height:1.1}
.mvv-rec-mt{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:3px}
.mvv-rec-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.mvv-b{font-size:var(--pt-lbl,10.5px);font-weight:600;border-radius:8px;padding:3px 8px;display:inline-flex;align-items:center;gap:4px}
.mvv-b.san-hi{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}
.mvv-b.san-mid{background:rgba(184,145,58,.12);border:1px solid rgba(184,145,58,.28);color:#8A6A12}
.mvv-b.san-lo{background:rgba(176,65,44,.10);border:1px solid rgba(176,65,44,.28);color:#B0412C}
.mvv-b.er{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);color:var(--texte-med,#4A4A3A)}
.mvv-b.vendu{background:rgba(194,161,77,.14);border:1px solid rgba(194,161,77,.32);color:#8A6A12}
.mvv-rec-r{text-align:right;flex-shrink:0}
.mvv-rec-hl{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-sm,17px);color:var(--terre,#8A5A38);line-height:1}
.mvv-rec-hl .su{font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);font-weight:400;font-family:inherit;display:block}
.mvv-rec-hl.sold{color:var(--texte-doux,#5F5F5F);font-size:var(--pt-txt,12.5px);font-family:inherit;font-weight:500}
.mvv-rec-kg{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:3px}
.mvv-empty{text-align:center;padding:46px 20px;color:var(--texte-doux,#5F5F5F)}
.mvv-empty-ic{font-size:var(--pt-xxl,31px);opacity:.5}
.mvv-empty-tx{font-size:var(--pt-txt,12.5px);margin-top:10px;line-height:1.5}
/* —— Encore sur pied : ce qui n'est PAS rentré ——
   Encres uniquement : --texte / --texte-doux / --terre / --vert-tx / --orange-tx.
   Aucune variable de SURFACE (--cave, --bg-*, --*-pale) en couleur de texte (§67). */
.mvv-reste{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:16px;
  margin:6px 0 14px;box-shadow:0 1px 7px rgba(20,17,13,.05);overflow:hidden}
.mvv-reste-hd{display:flex;align-items:center;gap:9px;padding:13px 14px;width:100%;background:none;border:0;
  font-family:inherit;text-align:left;color:var(--texte,#1A1A14);min-height:48px}
button.mvv-reste-hd{cursor:pointer}
.mvv-reste-ic{display:flex;align-items:center;color:var(--terre,#8A5A38);flex-shrink:0}
.mvv-reste-t{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-sm,17px);line-height:1.1}
.mvv-reste-n{margin-left:auto;font-size:var(--pt-lbl,10.5px);letter-spacing:.4px;text-transform:uppercase;
  color:var(--texte-doux,#5F5F5F);text-align:right;line-height:1.3}
.mvv-reste-n b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:var(--pt-md,20px);
  font-weight:700;letter-spacing:0;text-transform:none;color:var(--texte,#1A1A14)}
.mvv-reste-ch{display:flex;align-items:center;color:var(--texte-doux,#5F5F5F);transition:transform .18s;flex-shrink:0}
.mvv-reste.ouv .mvv-reste-ch{transform:rotate(90deg)}
.mvv-reste-li{display:flex;align-items:center;gap:11px;width:100%;padding:10px 14px;background:none;border:0;
  border-top:1px solid rgba(138,90,56,.10);font-family:inherit;text-align:left;color:var(--texte,#1A1A14);min-height:52px}
button.mvv-reste-li{cursor:pointer}
.mvv-reste-l{flex:1;min-width:0}
.mvv-reste-nm{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-sm,17px);line-height:1.15}
.mvv-reste-sub{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:3px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mvv-reste-r{text-align:right;flex-shrink:0}
.mvv-reste-v{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-sm,17px);line-height:1;color:var(--terre,#8A5A38)}
.mvv-reste-v .u{font-family:inherit;font-size:var(--pt-nano,9.5px);font-weight:600;color:var(--texte-doux,#5F5F5F);margin-left:2px}
.mvv-reste-a{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:3px}
.mvv-reste-ft{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);line-height:1.45;padding:10px 14px;
  border-top:1px solid rgba(138,90,56,.10)}
.mvv-reste-ft.warn{color:var(--orange-tx,#9C4E14)}
.mvv-reste.tout .mvv-reste-ic{color:var(--vert-tx,#31601C)}
.mvv-fab{margin:16px 0 0;padding:2px 0}
.mvv-fab-btn{width:100%;padding:14px;border-radius:14px;border:none;font-size:var(--pt-base,14px);font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;cursor:pointer;background:linear-gradient(180deg,var(--or,#C2A14D),#B8952F);color:#241B08;box-shadow:0 3px 12px rgba(194,161,77,.25);min-height:44px}
.mvv-fab-btn:active{transform:translateY(1px)}
.mvv-set{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:14px;margin-bottom:11px;box-shadow:0 1px 5px rgba(20,17,13,.04)}
.mvv-set-t{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14);display:flex;align-items:center;gap:7px}
.mvv-set-d{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.5}
.mvv-prow{display:flex;align-items:center;justify-content:space-between;margin-top:13px;gap:10px}
.mvv-prow-l{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);font-weight:500}
.mvv-fi{width:78px;background:#fff;border:1px solid rgba(138,90,56,.3);border-radius:9px;padding:9px 10px;color:var(--texte,#1A1A14);font-size:var(--pt-base,14px);font-weight:600;text-align:center;font-family:inherit}
.mvv-fi:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.12)}
.mvv-preview{background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.16);border-radius:10px;padding:10px 12px;margin-top:12px;font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A)}
.mvv-preview b{color:var(--terre,#8A5A38)}
.mvv-save{width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(180deg,var(--or,#C2A14D),#B8952F);color:#241B08;font-size:var(--pt-base,14px);font-weight:600;margin-top:4px;font-family:inherit;cursor:pointer;min-height:44px}
.mvv-wrap :focus-visible{outline:2px solid var(--terre,#8A5A38);outline-offset:2px;border-radius:6px}
@media (prefers-reduced-motion: reduce){.mvv-wrap *{animation-duration:.001ms !important;transition-duration:.001ms !important}}
.mvv-dlots{display:flex;flex-direction:column;gap:2px;margin-bottom:4px}
.mvv-dlot{display:flex;align-items:center;gap:10px;padding:9px 0}
.mvv-dlot+.mvv-dlot{border-top:1px solid rgba(138,90,56,.12)}
.mvv-dlot-b{flex:1;min-width:0}
.mvv-dlot-n{display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14)}
.mvv-dlot-m{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;line-height:1.9}
.mvv-dstp{display:flex;align-items:center;gap:3px;flex-shrink:0}
.mvv-dstp button{width:38px;height:38px;border-radius:9px;border:1px solid rgba(138,90,56,.28);background:var(--bg-app,#F2EFE7);color:var(--terre,#8A5A38);font-size:var(--pt-sm,17px);font-family:inherit;cursor:pointer;line-height:1}
.mvv-dstp button:disabled{opacity:.32;cursor:default}
.mvv-dstp>span{min-width:32px;text-align:center;font-size:var(--pt-sm,17px);font-weight:700;color:var(--texte,#1A1A14)}
.mvv-dtot{display:flex;align-items:baseline;gap:8px;padding:11px 0 2px;margin-top:4px;border-top:1px dashed rgba(138,90,56,.24)}
.mvv-dtot-n{font-family:'Cormorant Garamond',Georgia,serif;font-size:var(--pt-xl,27px);font-weight:700;color:var(--terre,#8A5A38);line-height:1}
.mvv-dtot-n.ko{color:var(--orange,#B85A1A)}
.mvv-dtot-l{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F)}
.mvv-dwarn{background:var(--orange-pale,#FBF0E6);border:1px solid rgba(184,90,26,.3);border-radius:11px;padding:10px 12px;margin-top:9px;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);line-height:1.5}
.mvv-dwarn b{color:#8A4212}
.mvv-dlnote{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);font-style:italic;line-height:1.5;margin:4px 0 2px}
.mvv-dneuf{font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);line-height:1.5;margin-top:7px;padding:8px 11px;background:var(--or-pale,#FAF3E0);border:1px solid rgba(194,161,77,.3);border-radius:10px}
.mvv-dneuf b{color:var(--terre,#8A5A38)}
.mvv-dseg{display:flex;gap:6px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.14);border-radius:13px;padding:4px;margin-top:6px}
.mvv-dseg button{flex:1;padding:9px 4px;border:0;border-radius:10px;background:transparent;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte-doux,#5F5F5F);cursor:pointer;min-height:44px;display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1.2}
.mvv-dseg button.on{background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);box-shadow:0 1px 5px rgba(20,17,13,.05)}
.mvv-dseg button .sm{font-size:var(--pt-nano,9.5px);font-weight:500;opacity:.8}
.mvc-dfit{font-size:var(--pt-lbl,10.5px);font-weight:600;border-radius:7px;padding:3px 8px;white-space:nowrap;display:inline-block}
.mvc-dfit.good{background:rgba(61,107,39,.10);color:var(--vert-med,#3D6B27)}
.mvc-dfit.tight{background:rgba(184,145,58,.14);color:#8A6A12}
.mvv-dcap{display:inline-flex;align-items:center;gap:4px;font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;color:var(--terre-tx,#8A5A38);background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.30);border-radius:7px;padding:4px 8px;cursor:pointer;min-height:30px;vertical-align:middle}
.mvv-dcap.perso{background:var(--or-pale,#FAF3E0);border-color:rgba(194,161,77,.55);color:var(--or-tx,#7A5E12)}
.mvv-dcap.nb{cursor:default}
.mvv-dvol{margin-top:8px;background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.16);border-radius:11px;padding:8px 12px}
.mvv-dvol-t{display:block;font-size:var(--pt-micro,11px);letter-spacing:.8px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:700;margin:0 0 4px}
.mvv-dvol-h{display:flex;align-items:baseline;gap:8px}
.mvv-dvol-h .mvv-dtot-l{flex:1;min-width:0}
.mvv-dvol .mvv-act2{margin-top:8px;width:100%}

/* ═══════════ LE CUVIER — liste dense, plan de cuverie, fusion ═══════════
   ⚠️ ALIGNEMENT : min-width:0 sur tout conteneur flex portant du texte,
   nowrap+ellipsis sur les lignes simples, flex-shrink:0 a droite, et
   AUCUNE hauteur fixe sur du texte. Voir §69 de CLAUDE.md. */
.mvv-tools{padding:2px 0 0}
.mvv-srch{position:relative;margin-bottom:8px}
.mvv-srch input{width:100%;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.2);
  border-radius:11px;padding:11px 34px 11px 36px;font-family:inherit;font-size:var(--pt-base,14px);font-weight:500;
  color:var(--texte,#1A1A14);min-height:44px}
.mvv-srch input:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.11)}
.mvv-srch-ic{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.45;pointer-events:none;
  display:flex;line-height:0}
.mvv-srch-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:0;
  color:var(--texte-doux,#5F5F5F);cursor:pointer;padding:6px;line-height:0;border-radius:8px}
.mvv-fils{display:flex;gap:6px;overflow-x:auto;padding-bottom:9px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mvv-fils::-webkit-scrollbar{display:none}
.mvv-fil{flex:0 0 auto;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.18);
  color:var(--texte-med,#4A4A3A);border-radius:20px;padding:8px 13px;font-family:inherit;font-size:var(--pt-micro,11px);
  font-weight:600;cursor:pointer;white-space:nowrap;min-height:36px}
.mvv-fil.on{background:var(--terre,#8A5A38);border-color:var(--terre,#8A5A38);color:#FFFFFF}
.mvv-fil .n{opacity:.62;font-weight:500;margin-left:5px}
.mvv-fil.on .n{opacity:.8}
.mvv-sortrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:10px}
.mvv-seg{display:flex;gap:4px;background:var(--gris-clair,#ECE6DA);border-radius:10px;padding:3px;min-width:0}
.mvv-seg button{background:transparent;border:0;border-radius:8px;padding:7px 10px;font-family:inherit;
  font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-doux,#5F5F5F);cursor:pointer;white-space:nowrap;min-height:36px}
.mvv-seg button.on{background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);box-shadow:0 1px 3px rgba(20,17,13,.10)}
.mvv-seg.vues button{padding:7px 9px;display:flex;align-items:center;line-height:0}

/* ── la ligne de cuve ── */
.mvv-row{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:13px;
  margin-bottom:7px;overflow:hidden;position:relative}
.mvv-row::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#9A93A8}
.mvv-row.fa::before{background:linear-gradient(180deg,#5B8C3E,#3D6B27)}
.mvv-row.due::before{background:linear-gradient(180deg,#C86A4E,#B0412C)}
.mvv-row.fini::before{background:#C0BAAE}
.mvv-row.open{border-color:rgba(138,90,56,.30);box-shadow:0 3px 14px rgba(20,17,13,.09)}
.mvv-hd{display:flex;align-items:center;gap:11px;width:100%;min-width:0;background:none;border:0;
  padding:11px 12px 11px 15px;cursor:pointer;text-align:left;font-family:inherit;color:inherit}
.mvv-ref{flex:0 0 auto;min-width:40px;max-width:66px;padding:5px 4px;border-radius:10px;
  background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);text-align:center;overflow:hidden}
.mvv-ref-n{font-size:var(--pt-txt,12.5px);font-weight:700;color:var(--terre,#8A5A38);line-height:1.15;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-ref-u{font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);letter-spacing:.4px;margin-top:2px;line-height:1}
.mvv-mid{flex:1 1 auto;min-width:0}
.mvv-nom{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-sm,17px);line-height:1.18;
  color:var(--texte,#1A1A14);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-sub{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-sub .sp{opacity:.4;padding:0 4px}
.mvv-mini{height:4px;background:var(--gris-clair,#ECE6DA);border-radius:3px;margin-top:6px;overflow:hidden}
.mvv-mini-f{height:100%;background:linear-gradient(90deg,#8A5A38,#C2A14D);border-radius:3px}
.mvv-rt{flex:0 0 auto;display:flex;align-items:center;gap:8px}
.mvv-pct{text-align:right;line-height:1}
.mvv-pct-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-md,20px);
  color:var(--terre,#8A5A38);line-height:1}
.mvv-pct-u{display:block;font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);letter-spacing:.4px;margin-top:2px}
.mvv-etat{font-size:var(--pt-nano,9.5px);font-weight:700;padding:4px 7px;border-radius:6px;white-space:nowrap;
  background:var(--gris-clair,#ECE6DA);color:var(--texte-doux,#5F5F5F)}
.mvv-etat.ok{background:rgba(61,107,39,.12);color:var(--vert-med,#3D6B27)}
.mvv-etat.due{background:rgba(176,65,44,.12);color:#B0412C}
.mvv-chev{flex:0 0 auto;opacity:.35;transition:transform .2s;line-height:0}
.mvv-row.open .mvv-chev{transform:rotate(90deg);opacity:.7}
@media(prefers-reduced-motion:reduce){.mvv-chev{transition:none}}
.mvv-det{padding:0 12px 12px 15px;border-top:1px solid var(--gris-clair,#ECE6DA)}
.mvv-det-g{margin-top:11px}
.mvv-3{display:flex;gap:6px;margin-top:10px}
.mvv-3 .c{flex:1 1 0;min-width:0;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);
  border-radius:9px;padding:8px 6px;text-align:center;overflow:hidden}
.mvv-3 .v{font-size:var(--pt-base,14px);font-weight:700;color:var(--texte,#1A1A14);line-height:1.2;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-3 .l{font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);margin-top:3px;line-height:1.25}
.mvv-detnote{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:10px;line-height:1.55;
  overflow-wrap:anywhere}

/* ── le plan de cuverie ── */
.mvv-plan{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:9px}
.mvv-cell{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.12);border-radius:13px;
  padding:10px 7px 9px;cursor:pointer;text-align:center;font-family:inherit;color:inherit;min-width:0;overflow:hidden}
.mvv-cell.due{border-color:rgba(176,65,44,.35);background:rgba(224,112,96,.06)}
.mvv-cell.open{border-color:var(--terre,#8A5A38);box-shadow:0 0 0 2px rgba(138,90,56,.14)}
.mvv-cell-r{font-size:var(--pt-lbl,10.5px);font-weight:700;color:var(--texte-doux,#5F5F5F);letter-spacing:.4px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* ⚠️ line-clamp, PAS de height fixe : un nom long se coupe proprement a deux
   lignes au lieu d'etre tranche au milieu d'une lettre. */
.mvv-cell-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-txt,12.5px);line-height:1.2;
  margin-top:5px;color:var(--texte,#1A1A14);display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;
  -webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.mvv-cell-s{font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.3;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-cell-s.due{color:#B0412C;font-weight:600}
.mvv-cell-sv{display:flex;justify-content:center;margin:5px 0 1px;line-height:0}

/* ── le bandeau « a mesurer », inchange dans l'esprit ── */
.mvv-fusrow{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;
  background:var(--bg-app,#F2EFE7);border:1px dashed rgba(138,90,56,.28);border-radius:11px;
  padding:10px 13px;margin-bottom:7px}
.mvv-fusrow .l{flex:1 1 auto;min-width:0}
.mvv-fusrow .n{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte,#1A1A14);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-fusrow .u{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-fusrow .r{flex:0 0 auto;font-size:var(--pt-lbl,10.5px);font-weight:600;color:var(--terre,#8A5A38);white-space:nowrap}

/* ── la feuille de fusion ── */
.mvv-pick{display:flex;align-items:center;gap:11px;width:100%;min-width:0;text-align:left;
  background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.14);border-radius:13px;
  padding:11px 13px;margin-bottom:7px;cursor:pointer;font-family:inherit;color:inherit;min-height:56px}
.mvv-pick.sel{border-color:var(--terre,#8A5A38);background:var(--terre-pale,#F3EADF);
  box-shadow:0 0 0 2px rgba(138,90,56,.10)}
.mvv-pick[disabled]{opacity:.5;cursor:not-allowed}
.mvv-box{flex:0 0 auto;width:21px;height:21px;border-radius:6px;border:2px solid rgba(138,90,56,.4);
  position:relative;background:#FFFFFF}
.mvv-pick.sel .mvv-box{background:var(--terre,#8A5A38);border-color:var(--terre,#8A5A38)}
.mvv-pick.sel .mvv-box::after{content:"";position:absolute;left:6px;top:2px;width:5px;height:10px;
  border:solid #FFFFFF;border-width:0 2px 2px 0;transform:rotate(42deg)}
.mvv-rad{flex:0 0 auto;width:21px;height:21px;border-radius:50%;border:2px solid rgba(138,90,56,.4);
  position:relative;background:#FFFFFF}
.mvv-pick.sel .mvv-rad{border-color:var(--terre,#8A5A38)}
.mvv-pick.sel .mvv-rad::after{content:"";position:absolute;left:3px;top:3px;right:3px;bottom:3px;
  border-radius:50%;background:var(--terre,#8A5A38)}
.mvv-pick-b{flex:1 1 auto;min-width:0}
.mvv-pick-n{display:block;font-size:var(--pt-base,14px);font-weight:600;line-height:1.2;color:var(--texte,#1A1A14);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-pick-m{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mvv-pick-r{flex:0 0 auto}
.mvv-ftot{margin-top:16px;background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.18);
  border-radius:14px;padding:15px;text-align:center}
.mvv-ftot-n{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-hero,40px);
  line-height:1;color:var(--terre,#8A5A38)}
.mvv-ftot-n.ko{color:#B0412C}
.mvv-ftot-l{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:7px;line-height:1.5}
.mvv-ftot-s{display:block;font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);margin-top:9px;padding-top:9px;
  border-top:1px solid rgba(138,90,56,.16);line-height:1.55;overflow-wrap:anywhere}
`;
  document.head.appendChild(s);
}

function _vendFrDate(s){ if(!s) return ''; var p=String(s).split('-'); return p.length===3?(p[2]+'/'+p[1]):s; }
/* ★ CUV-8 : l'avancement va du depart REELLEMENT LU au seuil de CETTE cuve.
   Entre 1085 et 990 pour tout le monde, une cuve partie a 1060 affichait
   26 % le jour de son encuvage. Sans premier releve exploitable, l'ancien
   depart sert de repli — a l'identique. */
function _vendFaPct(c,d){
  if(d==null||!(d>0)) return 0;
  var ds=_vendDSec(c), d0=_vendD0(c);
  if(d0==null||!(d0>ds+10)) d0=1085;
  return Math.max(0,Math.min(100,Math.round((d0-d)/(d0-ds)*100)));
}
function _vendHlRange(kg){ var c=_vendCfg(); if(!kg) return '0'; return (kg/c.ratio_max).toFixed(1)+'–'+(kg/c.ratio_min).toFixed(1); }
function _vendEtatBadge(p){ p=parseInt(p)||0;
  if(p>=80) return _mvBadge('Sanitaire '+p+' %','vert');
  if(p>=55) return _mvBadge('Sanitaire '+p+' %','ambre');
  return '<span class="mvv-b san-lo">▲ Tri renforcé '+p+'%</span>';
}
/* ★★★ CUV-13 — L'ETAPE S'APPELLE PRESSURAGE, ET SA CLE RESTE `decuvage`.
   Nico, 15/09 : « le decuvage ici est en fait un pressurage ». A cette etape
   on PRESSE, et le jus peut finir sa fermentation dans une AUTRE cuve avant
   d'etre entonne. Le mot « Decuvage » disait l'inverse — que le vin etait
   parti — et il portait le meme nom que le bouton « Decuver → Le Chai », qui
   cree la cuvee. Deux gestes, un seul mot : on lisait le second comme fait.
   ⚠⚠ LA CLE NE CHANGE PAS : `statut_hist` porte deja des 'decuvage' dates, et
     les renommer serait une migration pour un libelle. Tout ce qui s'affiche
     lit ces deux tables — frise, parcours, badge, graphe, legende, toast,
     cahier de cuverie imprime — sauf l'option du formulaire « Modifier »,
     ecrite dans index.html et corrigee dans le meme lot.
   ⚠ Ce que l'etape change au SUIVI est dans `_vendPressee`. */
var _VEND_STAT={setup:{i:0,lbl:'Setup'},mpf:{i:1,lbl:'MPF'},fa:{i:2,lbl:'FA'},decuvage:{i:3,lbl:'Pressurage'},fml:{i:4,lbl:'FML'},termine:{i:5,lbl:'Terminé'}};
var _VEND_STEPS=[['setup','Setup'],['mpf','MPF'],['fa','FA'],['decuvage','Press.'],['fml','FML'],['termine','Fini']];
function _vendStatLbl(st){ return (_VEND_STAT[st]||{lbl:st||'—'}).lbl; }
function _vendTempCls(t){ return t>=30?'hot':t>=26?'warm':'cool'; }
function _vendIsActive(c){ return c.statut==='fa'||c.statut==='mpf'; }

/* ═══════════ LE PARCOURS D'UNE CUVE — PARC-1 ═══════════
   ⚠⚠⚠ `statut` EST UN SCALAIRE : il dit ou en est la cuve, jamais depuis
   quand. Rien n'ecrivait la date d'un passage MPF -> FA. Tout ce qui compte
   des jours partait donc de `date_entree`, et une cuve avait l'air d'etre
   dans son etat courant DEPUIS L'ENCUVAGE. C'est le defaut signale par Nico.
   ★ `statut_hist` est la liste des passages : [{id,statut,date}]. Elle
   s'empile a chaque changement REEL, et elle se corrige ligne a ligne —
   meme porte que les releves de CUV-1.
   ⚠⚠ AUCUN RATTRAPAGE INVENTE sur les cuves d'avant ce lot : on ne connait
   pas la date de leur etat courant, et `date_entree` ne la donne pas. La
   frise ecrit « — » plutot qu'une fausse date. Un tiret se corrige, une
   date fausse se croit. */
function _vendHist(c){
  var h=(c&&c.statut_hist)||[];
  if(h.length>1) h.sort(_vendTriDate);
  for(var i=0;i<h.length;i++) if(h[i]&&!h[i].id) h[i].id='vst_r'+i+'_'+String(h[i].date||'').replace(/-/g,'');
  return h;
}
/* La DERNIERE occurrence d'une etape, pas la premiere. Un retour en arriere
   (FA -> MPF pour rattraper une saisie) est possible : « depuis quand est-elle
   en FA » doit lire le dernier passage. */
function _vendStatIdx(c,st){
  var h=_vendHist(c);
  for(var i=h.length-1;i>=0;i--) if(h[i].statut===st) return i;
  return -1;
}
function _vendStatDeb(c,st){ var i=_vendStatIdx(c,st); return i<0?null:_vendHist(c)[i].date; }
function _vendStatFin(c,st){ var h=_vendHist(c),i=_vendStatIdx(c,st); return (i<0||i+1>=h.length)?null:h[i+1].date; }
/* Jours passes dans une etape. null quand la date d'entree est inconnue —
   JAMAIS zero : zero est un nombre, et un nombre se croit. */
function _vendStatDuree(c,st,auj){
  var d=_vendStatDeb(c,st); if(!d) return null;
  var n=_mlEcartJ(d,_vendStatFin(c,st)||auj||_mlAuj());
  return (n!=null&&isFinite(n)&&n>=0)?n:null;
}
/* Empile un passage. Rend l'entree ecrite, ou null si rien n'a change :
   deux enregistrements de suite sur le meme statut ne doivent pas produire
   deux lignes. */
function _vendHistPose(c,st,date){
  if(!c||!st) return null;
  if(!Array.isArray(c.statut_hist)) c.statut_hist=[];
  var h=_vendHist(c);
  if(h.length && h[h.length-1].statut===st) return null;
  var e={id:'vst_'+Date.now()+'_'+st, statut:st, date:date||_mlAuj()};
  c.statut_hist.push(e); _vendHist(c);
  return e;
}

/* ═══════════ L'ECRAN DU CUVIER — CUV-2 ═══════════
   ⚠️⚠️ CE QUI A CHANGE, ET POURQUOI. Une cuve en fermentation occupait
   ~726 px : le graphe densite/temperature en fait 232 a lui seul, et il
   s'affiche des le 3e releve. La zone de liste d'un telephone fait ~520 px
   — UNE cuve n'y tenait pas en entier, et 12 cuves demandaient 17 hauteurs
   d'ecran. C'est le defaut du Pilotage de §34, sur un autre ecran : tout
   arrivait ouvert.
   ⚠️⚠️⚠️ ET L'ORDRE N'ETAIT PAS STABLE. Le tri se faisait sur _vendStale,
   donc MESURER UNE CUVE LA FAISAIT CHANGER DE PLACE. Aucune memoire
   spatiale possible. Le tri par defaut est desormais le REPERAGE DE
   CUVERIE — celui ecrit sur la cuve, dans l'ordre ou l'on marche dans la
   cave. L'urgence ne decide plus de la place : elle passe dans le bandeau
   et dans la pastille de l'onglet, ou elle etait deja. */
var _vendVue='liste', _vendFiltre='toutes', _vendTri='cuve', _vendOuvert=null, _vendQ='';

/* Le repere ecrit sur la cuve. Il vient du PARC (CONFIG.cave.cuves[].nom),
   jamais d'une numerotation inventee : c'est ce que Nico lit en passant
   devant. Une cuve de vinification sans cuve physique declaree n'en a pas,
   et la colonne se replie plutot que d'afficher un faux numero. */
function _vendRepere(c){
  if(!c||!c.cuve_ref) return '';
  var p=_caveCuve(c.cuve_ref);
  return (p&&p.nom)?String(p.nom):'';
}
/* Un cuvon sans repere ne doit pas remonter en tete : il part a la fin. */
function _vendTriRepere(a,b){
  var ra=_vendRepere(a), rb=_vendRepere(b);
  if(!ra && !rb) return String(a.nom||'').localeCompare(String(b.nom||''),'fr');
  if(!ra) return 1;
  if(!rb) return -1;
  /* numeric:true, sinon « Cuve 10 » se range entre « Cuve 1 » et « Cuve 2 ». */
  return ra.localeCompare(rb,'fr',{numeric:true,sensitivity:'base'});
}
function _vendADecuver(c){ 
  if(c.statut!=='fa') return false;
  var l=_vendLastMes(c);
  return !!l && _vendFaPct(c,_vendMesD20(l))>=90;
}
function _vendADue(c){ return _vendSuivie(c) && _vendStale(c)>=1; }
function _vendEstFusionnee(c){ return !!(c && c.fusion && c.fusion.vers); }

var _VEND_FILS=[['toutes','Toutes'],['fa','En fermentation'],['due','\u00c0 mesurer'],
                ['dec','\u00c0 d\u00e9cuver'],['setup','En attente']];
var _VEND_TRIS=[['cuve','Cuverie'],['urg','Urgence'],['fa','Avancement']];

function _vendPasseFiltre(c,k){
  if(k==='fa')    return _vendIsActive(c);
  if(k==='due')   return _vendADue(c);
  if(k==='dec')   return _vendADecuver(c);
  if(k==='setup') return c.statut==='setup';
  return true;
}
/* La recherche lit ce que Nico a sous les yeux : le nom de la cuvee, le
   repere de cuverie, et les parcelles. Rien d'autre — chercher dans un id
   technique ferait remonter des lignes sans raison visible. */
function _vendCherche(c,q){
  if(!q) return true;
  var t=[c.nom||'', _vendRepere(c)].concat(c.parcelles||[]).join(' ');
  return t.toLowerCase().indexOf(q)!==-1;
}
function _vendListe(cuves){
  var q=String(_vendQ||'').trim().toLowerCase();
  var l=cuves.filter(function(c){ return _vendPasseFiltre(c,_vendFiltre) && _vendCherche(c,q); });
  if(_vendTri==='urg')     l.sort(function(a,b){ return (_vendStale(b)-_vendStale(a)) || _vendTriRepere(a,b); });
  else if(_vendTri==='fa') l.sort(function(a,b){
    var pa=_vendLastMes(a), pb=_vendLastMes(b);
    var va=pa?_vendFaPct(a,_vendMesD20(pa)):-1, vb=pb?_vendFaPct(b,_vendMesD20(pb)):-1;
    return (vb-va) || _vendTriRepere(a,b);
  });
  else l.sort(_vendTriRepere);
  return l;
}
function _vendSetVue(v){ _vendVue=(v==='plan'?'plan':'liste'); renderVendCuves(); }
function _vendSetFiltre(k){ _vendFiltre=k; _vendOuvert=null; renderVendCuves(); }
function _vendSetTri(k){ _vendTri=k; renderVendCuves(); }
function _vendBascOuv(id){ _vendOuvert=(_vendOuvert===id?null:id); renderVendCuves(); }
/* ⚠️ On ne repeint PAS a chaque frappe : le champ perdrait le focus, meme
   piege que _vendDecCuveVol. On repeint la liste seule, et on remet le
   curseur ou il etait. */
function _vendSetQ(v){
  _vendQ=v||'';
  var host=document.getElementById('mvv-corps');
  if(!host){ renderVendCuves(); return; }
  host.innerHTML=_vendCorpsHtml();
  _vendPeindreGraphes();
  _vendMajFils();
}
function _vendVideQ(){
  _vendQ='';
  var i=document.getElementById('mvv-q'); if(i) i.value='';
  _vendSetQ('');
}
// ⚠️⚠️ L'ORDRE DU TABLEAU N'EST PLUS SUPPOSE ACQUIS (CUV-1).
// Une mesure peut etre saisie en rattrapage a une date passee, ou sa date
// corrigee apres coup. Or TOUT ce qui suit lit m[m.length-1] ou m.slice(-3)
// comme « la plus recente » : _vendLastMes, _vendStale, _vendSparkline,
// _mlProjFA (pente et projection de fin de FA), _mlAMesurer, _mlAgenda
// (alerte temperature). Sans tri, une date corrigee fait mentir la jauge,
// la courbe, la date de fin estimee et les alertes — en silence.
// Le tri est applique A LA LECTURE autant qu'a l'enregistrement : il repare
// aussi les tableaux deja desordonnes par un rattrapage saisi avant ce lot.
function _vendTriDate(a,b){
  var da=String((a&&a.date)||''), db=String((b&&b.date)||'');
  if(da!==db) return da<db?-1:1;
  return String((a&&a.id)||'')<String((b&&b.id)||'')?-1:1;   // meme jour : ordre de saisie
}
// Un releve sans id ne serait pas corrigeable : on lui en pose un, stable
// tant que l'ordre l'est — et l'ordre l'est, puisqu'on vient de trier.
function _vendTriMes(c){
  var m=(c&&c.mesures_fa)||[];
  if(m.length>1) m.sort(_vendTriDate);
  for(var i=0;i<m.length;i++) if(m[i]&&!m[i].id) m[i].id='vm_r'+i+'_'+String(m[i].date||'').replace(/-/g,'');
  return m;
}
function _vendTriOps(c){
  var o=(c&&c.operations)||[];
  if(o.length>1) o.sort(_vendTriDate);
  for(var i=0;i<o.length;i++) if(o[i]&&!o[i].id) o[i].id='vop_r'+i+'_'+String(o[i].date||'').replace(/-/g,'');
  return o;
}
function _vendLastMes(c){ var m=_vendTriMes(c); return m.length?m[m.length-1]:null; }
/* ⚠⚠ CUV-7 — LE DERNIER RELEVÉ N'EST PAS TOUJOURS LE DERNIER RELEVÉ CHIFFRÉ.
   Depuis la tournée, un relevé peut ne porter qu'une température ou qu'un
   compteur de pigeages : `densite` y est absente. Tout ce qui CALCULE (le % de
   FA, la courbe, la projection de fin) doit donc partir du dernier relevé QUI
   PORTE UNE DENSITÉ, jamais du dernier tout court — sinon une cuve suivie
   depuis trois semaines affiche « 0 % » parce qu'on a pigé ce matin. */
function _vendLastD(c){
  var m=_vendTriMes(c);
  for(var i=m.length-1;i>=0;i--) if(m[i]&&m[i].densite!=null) return m[i];
  return null;
}
function _vendSince(s){ if(!s) return 999; var t=new Date(s).getTime(); if(!t) return 999; return Math.floor((Date.now()-t)/86400000); }
function _vendStale(c){ var l=_vendLastMes(c); return l?_vendSince(l.date):999; }

function _vendSparkline(mes,uid,w){
  // ⚠ CUV-7 : un relevé sans densité ferait tomber min() à 0 et écraserait
  //   toute la courbe. Même filtre que _vendFermSvg.
  mes=(mes||[]).filter(function(m){ return m && m.date && m.densite!=null; });
  if(!mes||mes.length<2) return '';
  // preserveAspectRatio="none" ecrasait le dessin : le point de fin sortait en
  // ovale et l'epaisseur du trait n'etait pas la meme selon la direction.
  var c=window._mvGraphCadre(w,44,{padL:3,padR:3,padT:3,padB:3});
  var W=c.w,H=c.h,pad=3;
  var ds=mes.map(function(m){return _vendMesD20(m);});
  var min=Math.min.apply(null,ds.concat([992])), max=Math.max.apply(null,ds.concat([1085]));
  var rng=(max-min)||1;
  var pts=mes.map(function(m,i){
    var dv=_vendMesD20(m);
    var x=pad+(i/(mes.length-1))*(W-2*pad);
    var y=pad+(1-(dv-min)/rng)*(H-2*pad);
    return x.toFixed(1)+','+y.toFixed(1);
  });
  var lastX=(W-pad).toFixed(1); var lastY=pts[pts.length-1].split(',')[1];
  var gid='mvvsg-'+uid;
  var g='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="1" y2="0">'
    +'<stop offset="0" stop-color="'+c.col.mesure+'"/>'
    +'<stop offset="0.55" stop-color="'+c.col.prevu+'"/>'
    +'<stop offset="1" stop-color="'+c.col.fait+'"/></linearGradient></defs>'
    +'<polyline points="'+pts.join(' ')+'" fill="none" stroke="url(#'+gid+')" stroke-width="'+c.trait.mesure+'" stroke-linecap="round" stroke-linejoin="round"/>'
    +'<circle cx="'+lastX+'" cy="'+lastY+'" r="2.6" fill="'+c.col.mesure+'"/>';
  var aria='Cin\u00e9tique de la fermentation : '+mes.length+' relev\u00e9s, densit\u00e9 de '
    +Math.round(ds[0])+' \u00e0 '+Math.round(ds[ds.length-1])+'.';
  return '<div class="mvv-spark"><div class="mvv-spark-lbl"><span>Cin\u00e9tique \u2014 densit\u00e9</span><span>'+mes.length+' relev\u00e9s</span></div>'
    +window._mvGraphSvg(c,aria,g)+'</div>';
}
/* ★ La frise prend la CUVE, plus son seul statut : elle porte desormais la
   date de chaque passage. Une etape franchie dont la date est inconnue
   affiche « — » — c'est une invitation a la poser, pas un trou. */
function _vendStepper(c){
  var st=(c&&c.statut)||'setup';
  var cur=(_VEND_STAT[st]||{i:0}).i;
  return '<div class="mvv-steps">'+_VEND_STEPS.map(function(s,i){
    var cls=i<cur?'done':i===cur?'cur':'';
    var d=(i<=cur)?_vendStatDeb(c,s[0]):null;
    return '<div class="mvv-step '+cls+'"><div class="dot"></div><div class="lb">'+s[1]+'</div>'
      +'<div class="dt">'+(d?_vendFrDate(d):(i<=cur?'\u2014':''))+'</div></div>';
  }).join('')+'</div>';
}
/* La phrase que la frise ne peut pas dire : DEPUIS QUAND, et combien de
   jours. Rien ne s'affiche tant qu'on ne le sait pas. */
function _vendParcLigne(c){
  var st=(c&&c.statut)||'', d=_vendStatDeb(c,st);
  if(!d) return '';
  var n=(st==='termine')?null:_vendStatDuree(c,st);
  return '<div class="mvv-parc"><b>'+_escHtml(_vendStatLbl(st))+'</b> depuis le '+_vendFrDate(d)
    +(n!=null?' <span class="nd">\u00b7 '+n+'\u00a0j</span>':'')+'</div>';
}
/* Le parcours complet, corrigeable ligne a ligne. Meme anatomie que
   l'historique des releves : c'est la porte de la correction. */
function _vendParcHist(c,canEdit){
  var h=_vendHist(c);
  if(!h.length) return '';
  var auj=_mlAuj();
  var rows=h.slice().reverse().map(function(e,k){
    var i=h.length-1-k;
    var fin=(i+1<h.length)?h[i+1].date:null;
    var n=_mlEcartJ(e.date,fin||auj);
    var det=fin?('jusqu\u2019au '+_vendFrDate(fin)):'en cours';
    if(e.statut!=='termine'&&n!=null&&n>=0) det+=' \u00b7 '+n+' j';
    return '<div class="mvv-hrow"><div class="mvv-hrow-l">'
      +'<div class="mvv-hrow-d">'+_vendFrDate(e.date)+' \u00b7 <b>'+_escHtml(_vendStatLbl(e.statut))+'</b></div>'
      +'<div class="mvv-hrow-u">'+_escHtml(det)+'</div></div>'
      +(canEdit?'<button class="mv-gh mvv-icbtn" onclick="openVendStat(\''+_escAttr(c.id)+'\',\''+_escAttr(e.id)+'\')" title="Corriger cette \u00e9tape" aria-label="Corriger cette \u00e9tape">'+_mvIcon('crayon',16)+'</button>':'')
      +'</div>';
  }).join('');
  return '<details class="mvv-histwrap"><summary>Parcours \u2014 '+h.length+' \u00e9tape'+(h.length>1?'s':'')
    +' <span class="u">\u00b7 depuis le '+_vendFrDate(h[0].date)+'</span></summary>'+rows+'</details>';
}
function _vendErLbl(r){ return r.erasflage==='total'?'Éraflage total':r.erasflage==='partiel'?('Partiel '+(r.er_pct||30)+'%'):'Vendange entière'; }

function _vendKpiData(){
  var cfg=_vendCfg(); var recs=CAVE_VENDANGE.recoltes||[]; var cuves=CAVE_VENDANGE.cuves_vinif||[];
  var caisses=recs.reduce(function(s,r){return s+_recCaisses(r);},0);
  var kg=recs.reduce(function(s,r){return s+_recKg(r);},0);
  // Le volume cuve ne compte QUE la part domaine : une recolte peut etre a la
  // fois vinifiee et vendue depuis ce lot.
  var kgCuve=recs.reduce(function(s,r){return s+_recKgDom(r);},0);
  var hl=(kgCuve/cfg.ratio_max).toFixed(0)+'–'+(kgCuve/cfg.ratio_min).toFixed(0);
  var active=cuves.filter(_vendIsActive);
  /* ★★ CUV-13 — LE BADGE « A MESURER » COMPTE CE QUE L'ALERTE COMPTE. Il lisait
     `_vendIsActive` pendant que l'alerte de la liste lit `_vendADue`, donc
     `_vendSuivie` : une cuve decuvee qui finit au chai etait « a mesurer »
     dans l'alerte, absente du badge de l'onglet, et la barre de sante disait
     « Fermentations suivies » juste au-dessus. Une cuve pressuree aurait vecu
     la meme contradiction des le premier jour. Une seule regle : ce qui
     RECLAME passe par `_vendSuivie` (§129a) — et une cuve fusionnee ne
     reclame rien, son vin est ailleurs. */
  var suivies=cuves.filter(function(c){ return c&&!_vendEstFusionnee(c)&&_vendSuivie(c); });
  var due=suivies.filter(function(c){return _vendStale(c)>=1;}).length;
  return {caisses:caisses,tonnes:(kg/1000).toFixed(1),hl:hl,enFA:active.length,due:due,activeN:suivies.length};
}
function _vendCockpitHtml(){
  // Meme anatomie que Le Chai et Le millesime : les chiffres vivent dans la
  // bande commune #cave-kpis (hors de cette vue), il ne reste ici que la barre
  // d'etat. La barre d'onglets n'est plus .on-dark : le Cuvier est sur papier.
  return '<div class="mvv-hdr">'
    +'<div class="mvv-health"><div class="mvv-health-track" id="mvv-health-track"></div><div class="mvv-health-lbl" id="mvv-health-lbl"></div></div>'
    +'</div>'
    +'<div class="mvu-tabs mvu-sub">'
    // ★ Lot CAVE-2 : l'onglet « Cuvier » dans « Le Cuvier » s'appelle Cuves,
    //   « Analyses » (les maturites, a la vigne) s'appelle Maturites — le Chai a
    //   ses analyses labo, un mot pour deux choses ne renvoie nulle part. Les
    //   CLES ne changent pas ('rec','cuves','ana') : seuls les libelles.
    // ★★ Lot CAVE-6 : l'ORDRE suit la vendange, de l'amont vers l'aval —
    //   Maturites (a la vigne, avant de couper) → Recoltes (ce qui rentre) →
    //   Cuves (ce qui fermente). L'ordre precedent partait du milieu.
    //   ⚠ Seule la position des trois boutons change : les cles, les handlers
    //   et l'onglet d'arrivee (_vendTab) sont inchanges.
    +'<button class="mvu-tab" id="mvv-tab-ana" onclick="switchVendOng(\'ana\')"><span class="t-ico"></span> Maturités</button>'
    +'<button class="mvu-tab" id="mvv-tab-rec" onclick="switchVendOng(\'rec\')"><span class="t-ico"></span> Récoltes</button>'
    +'<button class="mvu-tab" id="mvv-tab-cuves" onclick="switchVendOng(\'cuves\')"><span class="t-ico"></span> Cuves</button>'
    // ★★ Lot CUV-7 : « Tournée » est le geste QUOTIDIEN, en aval des cuves —
    //   il garde donc l'ordre amont → aval posé par CAVE-6. L'onglet d'arrivée
    //   reste `cuves` : on n'atterrit pas dans un écran de saisie.
    +'<button class="mvu-tab" id="mvv-tab-tour" onclick="switchVendOng(\'tour\')"><span class="t-ico"></span> Tournée</button>'
    +'</div>';
}
function _vendRefreshCockpit(){
  var d=_vendKpiData();
  // La bande #cave-kpis est celle de la Cave entiere, ecrite par renderCave
  // (lot CAVE-1). On la rafraichit ici parce qu'un releve ou un apport vient
  // peut-etre de changer ses chiffres.
  _caveKpisRender();
  var ok=d.activeN-d.due; var okPct=d.activeN?Math.round(ok/d.activeN*100):100;
  var ht=document.getElementById('mvv-health-track');
  if(ht) ht.innerHTML='<div class="mvv-health-ok" style="width:'+okPct+'%"></div><div class="mvv-health-due" style="width:'+(100-okPct)+'%"></div>';
  var hlb=document.getElementById('mvv-health-lbl');
  if(hlb) hlb.innerHTML='<span><b>'+ok+'</b> cuve'+(ok>1?'s':'')+' à jour</span><span>'+(d.due?'<b>'+d.due+'</b> à mesurer':'Fermentations suivies ✔')+'</span>';
  var tb=document.getElementById('mvv-tab-cuves');
  if(tb){ var b=tb.querySelector('.t-badge');
    if(d.due>0){ if(!b){b=document.createElement('span');b.className='t-badge';tb.appendChild(b);} b.textContent=d.due; }
    else if(b){ b.remove(); } }
}
function _vendRenderTab(){
  if(!window._dataReady){ var _vb=document.getElementById('mvv-body'); if(_vb)_vb.innerHTML=window._mvSk('cuvier'); return; }
  ['ana','rec','cuves','tour'].forEach(function(t){var b=document.getElementById('mvv-tab-'+t); if(b) b.classList.toggle('active',t===_vendTab);});
  if(_vendTab==='ana') renderVendAna();
  else if(_vendTab==='rec') renderVendRec();
  else if(_vendTab==='tour') renderVendTour();
  else renderVendCuves();
}

/* ══════ ENCORE SUR PIED — les parcelles SANS récolte enregistrée ══════
   Le Cuvier ne savait dire que ce qui EST rentré. La question du matin pendant
   la vendange est l'inverse : qu'est-ce qu'il reste ?

   ⚠️ LA COMPARAISON SE FAIT SUR UN NOM NORMALISÉ. Le champ parcelle d'une
   récolte redevient LIBRE quand aucune parcelle n'est enregistrée
   (_vendInjectParcelleSelect) : « les grandes vignes » saisi à la main contre
   « Les Grandes Vignes » au parcellaire aurait laissé la parcelle dans les
   non-rentrées. Un écran qui réclame une récolte déjà saisie est pire que pas
   d'écran du tout.

   ⚠️ UNE PARCELLE ARRACHÉE N'EST PAS « ENCORE SUR PIED ». _mlResteARentrer ne
   regardait pas le statut — Le millésime annonçait donc sur pied des parcelles
   qui n'existent plus — et il exigeait une surface > 0, ce qui EFFAÇAIT sans un
   mot une parcelle dont la surface n'est pas renseignée. Les deux écrans lisent
   désormais la même fonction. */
var _vendResteOuv = null;    // null = pas encore décidé : ouvert si la liste est courte
var _VEND_RESTE_MAX = 8;     // au-delà, la carte s'ouvre au doigt

function _vendResteCle(nom){ return _matNorm(nom); }
function _vendResteActives(){
  return (window.PARCELLES||[]).filter(function(p){
    return p && String(p.nom||'').trim() && p.statut!=='Arrachee';
  });
}

/* Les parcelles sans récolte enregistrée sur la campagne `mil`.
   Le filtre de campagne est celui de _mlRecoltesDe — l'ANNÉE de la date — et
   non la campagne août→juillet : deux règles pour un même écran en feraient
   diverger les comptes. */
function _vendResteARentrer(mil){
  var an=String(mil), faites={}, connues={}, inconnues={}, der={};
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){
    return r && r.parcelle && String(r.date||'').slice(0,4)===an;
  });
  recs.forEach(function(r){ faites[_vendResteCle(r.parcelle)]=1; });
  var actives=_vendResteActives();
  actives.forEach(function(p){ connues[_vendResteCle(p.nom)]=1; });
  /* Une récolte qui porte un nom hors parcellaire ne rentre AUCUNE parcelle de
     la liste : le dire, sinon le compte paraît faux sans qu'on sache pourquoi. */
  recs.forEach(function(r){
    if(!connues[_vendResteCle(r.parcelle)]) inconnues[String(r.parcelle).trim()]=1;
  });
  (CAVE_VENDANGE.analyses||[]).forEach(function(a){
    if(!a||!a.parcelle||String(a.date||'').slice(0,4)!==an) return;
    var k=_vendResteCle(a.parcelle);
    if(!der[k]||a.date>der[k].date) der[k]=a;
  });
  var tj=Date.parse(_mvToday());
  var lignes=[];
  actives.forEach(function(p){
    var nom=String(p.nom).trim(), k=_vendResteCle(nom);
    if(faites[k]) return;
    var a=der[k]||null;
    var ceps=(p.cepages&&p.cepages.length)?p.cepages:(p.cepage?[p.cepage]:[]);
    lignes.push({p:p, nom:nom, ha:parseFloat(p.surface)||0, cep:ceps.join(' · '),
      ana:a, suc:a?_matSuc(a):null, jours:a?_matJours(a.date,tj):null});
  });
  lignes.sort(_vendResteCmp);
  return {lignes:lignes, inconnues:Object.keys(inconnues).sort(function(a,b){
    return a.localeCompare(b,'fr'); })};
}

/* La plus mûre d'abord, puis ce qui n'a jamais été mesuré, par ordre
   alphabétique. Une ligne ne redescend jamais après un geste : saisir la
   récolte la fait SORTIR de la liste — le piège de la liste des cuves (§6.73,
   mesurer une cuve la renvoyait en bas) ne s'applique pas ici.

   ⚠️⚠️ UN COMPARATEUR DOIT ÊTRE COHÉRENT, et la première version ne l'était
   pas : elle laissait `y.suc - x.suc` voir un `null`. La coercition (null - 198
   = -198) rendait l'ordre JUSTE — au point qu'aucun décor ne pouvait le prendre
   en défaut — pendant que le couple symétrique, lui, répondait sur le NOM. Le
   comparateur se contredisait donc, et la norme n'impose alors AUCUN résultat :
   c'est le moteur qui décide, et il peut changer d'avis d'une version à
   l'autre. Le rang est calculé AVANT toute soustraction, qui ne voit plus que
   deux nombres. C'est le harnais qui l'a trouvé, en refusant de rougir. */
function _vendResteCmp(x,y){
  var mx=(x.suc==null)?1:0, my=(y.suc==null)?1:0;
  if(mx!==my) return mx-my;                                 // mesurée avant non mesurée
  if(mx===0 && x.suc!==y.suc) return y.suc-x.suc;            // la plus mûre d'abord
  return x.nom.localeCompare(y.nom,'fr');                    // à défaut, l'alphabet
}

/* L'unité suit le MODE de la mesure, jamais un réglage d'affichage : ce qui est
   montré est ce qui a été lu au réfractomètre ou au mustimètre. */
function _vendResteVal(e){
  if(e.suc==null) return '';
  return (e.ana&&e.ana.mode==='alc')
    ? (_mvF1(e.ana.val||0)+'<span class="u">%vol</span>')
    : (Math.round(e.suc)+'<span class="u">g/L</span>');
}

function _vendResteHtml(){
  var nAct=_vendResteActives().length;
  if(!nAct) return '';                       // parcellaire vide : rien à comparer
  var mil=_mlCampagne(), r=_vendResteARentrer(mil), l=r.lignes;
  var pied=r.inconnues.length
    ? ('<div class="mvv-reste-ft warn">Hors parcellaire : <b>'
        +r.inconnues.map(function(n){return _escHtml(n);}).join(', ')
        +'</b>. Ces récoltes ne rentrent aucune parcelle de la liste.</div>')
    : '';
  if(!l.length){
    return '<div class="mvv-reste tout"><div class="mvv-reste-hd">'
      +'<span class="mvv-reste-ic">'+_mvIcon('check',18)+'</span>'
      +'<span class="mvv-reste-t">Tout est rentré</span>'
      +'<span class="mvv-reste-n"><b>'+nAct+'</b>parcelle'+(nAct>1?'s':'')+'</span></div>'
      +'<div class="mvv-reste-ft">Campagne '+mil+' : chaque parcelle active porte au moins une récolte.</div>'
      +pied+'</div>';
  }
  var ha=l.reduce(function(s,e){return s+e.ha;},0);
  var ouv=(_vendResteOuv==null)?(l.length<=_VEND_RESTE_MAX):!!_vendResteOuv;
  _vendResteOuv=ouv;                         // l'état devient explicite : le bouton n'a plus à le recalculer
  var canEdit=canWrite();
  var h='<div class="mvv-reste'+(ouv?' ouv':'')+'">'
    +'<button type="button" class="mvv-reste-hd" aria-expanded="'+ouv+'" onclick="_vendResteToggle()">'
    +'<span class="mvv-reste-ic">'+_mvIcon('raisin',18)+'</span>'
    +'<span class="mvv-reste-t">Encore sur pied</span>'
    +'<span class="mvv-reste-n"><b>'+l.length+'</b>parcelle'+(l.length>1?'s':'')
      +(ha>0?(' · '+_mvF1(ha)+' ha'):'')+'</span>'
    +'<span class="mvv-reste-ch">'+_mvIcon('chevron',16)+'</span></button>';
  if(ouv){
    l.forEach(function(e){
      var sub=(e.ha>0?(_mvF1(e.ha)+' ha'):'surface non renseignée')
        +(e.cep?(' · '+_escHtml(e.cep)):'');
      var droite=(e.suc!=null)
        ? ('<span class="mvv-reste-v">'+_vendResteVal(e)+'</span>'
           +'<span class="mvv-reste-a" style="display:block">'
           +(e.jours<=0?'aujourd’hui':('il y a '+e.jours+' j'))+'</span>')
        : '<span class="mvv-reste-a">jamais analysée</span>';
      /* §54 : dans un slot onclick, _escHtml est DÉFAIT — l'attribut décode
         &#39; AVANT que le JS ne soit compilé. C'est _escAttr, et lui seul.
         ⚠️ Le nom de balise est une VARIABLE : écrire les deux branches en
         clair (`<button…>` d'un côté, `<div>` de l'autre) fait lire au préflight
         un <div> DANS un <button> — §24, un faux positif qui apprend à ignorer
         un contrôle juste. Un seul élément, dont seul le type change. */
      var tg=canEdit?'button':'div';
      h+='<'+tg+' class="mvv-reste-li"'
        +(canEdit?(' type="button" onclick="openOvVendRec(null,\''+_escAttr(e.nom)+'\')"'):'')+'>'
        +'<span class="mvv-reste-l"><span class="mvv-reste-nm">'+_escHtml(e.nom)+'</span>'
        +'<span class="mvv-reste-sub">'+sub+'</span></span>'
        +'<span class="mvv-reste-r">'+droite+'</span>'
        +'</'+tg+'>';
    });
    h+='<div class="mvv-reste-ft">Campagne '+mil+' · parcelles actives sans aucune récolte saisie, '
      +'la plus mûre en premier'+(canEdit?'. Touchez-en une pour peser sa première benne.':'.')+'</div>';
  }
  return h+pied+'</div>';
}
function _vendResteToggle(){ _vendResteOuv=!_vendResteOuv; renderVendRec(); }

function renderVendRec() {
  var el=document.getElementById('mvv-body'); if(!el) return;
  var cfg=_vendCfg();
  var recoltes=CAVE_VENDANGE.recoltes||[];
  var canEdit=canWrite();
  var caisses=recoltes.reduce(function(s,r){return s+_recCaisses(r);},0);
  var kg=recoltes.reduce(function(s,r){return s+_recKg(r);},0);
  var kgCuve=recoltes.reduce(function(s,r){return s+_recKgDom(r);},0);
  var kgVendu=recoltes.reduce(function(s,r){return s+_recKgCli(r);},0);
  var html=_caveSaisBanner();
  if(recoltes.length){
    html+='<div class="mvv-camp"><div class="mvv-camp-lbl">Campagne '+(new Date().getFullYear())+' · '+recoltes.length+' récolte'+(recoltes.length>1?'s':'')+'</div><div class="mvv-camp-grid">'
      +'<div><div class="mvv-camp-n">'+caisses+'</div><div class="mvv-camp-cl">Caisses</div></div>'
      +'<div><div class="mvv-camp-n">'+(kg/1000).toFixed(1)+'<span class="u">t</span></div><div class="mvv-camp-cl">Récoltés</div></div>'
      +'<div><div class="mvv-camp-n">'+(kgCuve/cfg.ratio_max).toFixed(0)+'<span class="u">hL</span></div><div class="mvv-camp-cl">Estimés cuvés</div></div>'
      +'</div>'
      +(kgVendu>0?('<div class="mvv-camp-sold" onclick="openVendVrac()" style="cursor:pointer">'
          +_mvIcon('carton',16)+' <span>'+kgVendu.toLocaleString('fr-FR')+' kg vendus en raisin · '
          +(function(){var d=_vendRetoursDus();
              return d?('<b style="color:var(--orange,#B85A1A)">'+d+' retour'+(d>1?'s':'')+' client attendu'+(d>1?'s':'')+'</b>')
                      :'tous les retours reçus';})()
          +'</span> '+_mvIcon('chevron',16)+'</div>'):'')
      +'</div>';
    html+=_vendResteHtml();
    window._mvGraphOublier('#mvg-ap-');
    html+='<div class="mvmat-card"><div class="mvmat-ttl">Apports par parcelle</div>'
      +'<div id="mvg-ap-all"></div></div>';
    (function(rr){ window._mvGraphSuivre('#mvg-ap-all', function(lg){ return _vendApportsSvg(rr,lg); }); })(recoltes);
    html+='<div class="mvv-seclbl">Détail des récoltes</div>';
    recoltes.forEach(function(r){
      var kg_=_recKg(r);
      var surf_=_vendParcSurf(r.parcelle);
      html+='<div class="mvv-rec" onclick="openOvVendRec(\''+r.id+'\')"><div class="mvv-rec-l">'
        +'<div class="mvv-rec-nm">'+_escHtml(r.parcelle)+'</div>'
        +'<div class="mvv-rec-mt">'+_vendFrDate(r.date)+' · '+_recCaisses(r)+' caisses'
        +(_recDests(r).length>1?(' · '+_recDests(r).length+' destinataires'):'')+'</div>'
        +'<div class="mvv-rec-badges">'+_vendEtatBadge(r.etat_pct||0)
        +'<span class="mvv-b er">'+_vendErLbl(r)+'</span>'
        +_recDests(r).map(function(pt){
            return pt.dom?_mvBadge('Domaine '+_vpCs(pt)+' c.','vert')
                         :_mvBadge(_vpNom(pt)+' '+_vpCs(pt)+' c.','neutre'); }).join('')
        +'</div></div>'
        +'<div class="mvv-rec-r">'
        +(_recKgDom(r)>0?('<div class="mvv-rec-hl">'+_vendHlRange(_recKgDom(r))+'<span class="su">hL est.</span></div>')
                        :'<div class="mvv-rec-hl sold">vendu</div>')
        +'<div class="mvv-rec-kg">'+kg_.toLocaleString('fr-FR')+' kg</div>'
        +(surf_>0?'<div class="mvv-rec-kg">'+Math.round(kg_/surf_).toLocaleString('fr-FR')+' kg/ha</div>':'')
        +'</div></div>';
    });
  } else {
    html+='<div class="mvv-empty"><div class="mvv-empty-ic">'+_mvIcon('raisin',40)+'</div><div class="mvv-empty-tx">Aucune récolte saisie.<br>Pesez votre première benne pour lancer la campagne.</div></div>';
    html+=_vendResteHtml();
  }
  html+=_vendRendHistHtml();
  if(canEdit) html+='<div class="mvv-fab"><button class="mvv-fab-btn" onclick="openOvVendRec(null)">+ Nouvelle récolte</button></div>';
  el.innerHTML=html;
  _vendRefreshCockpit();
}
function _vendOutilsHtml(cuves){
  var h='<div class="mvv-tools">';
  /* La recherche n'apparait qu'a partir de 6 cuves : sur trois cuves, un
     champ de recherche est du bruit. */
  if(cuves.length>=6){
    h+='<div class="mvv-srch"><span class="mvv-srch-ic">'+_mvIcon('loupe',16)+'</span>'
      +'<input id="mvv-q" type="search" inputmode="search" autocomplete="off" '
      +'placeholder="Chercher une cuve ou une parcelle" aria-label="Chercher une cuve" '
      +'value="'+_escAttr(_vendQ||'')+'" oninput="_vendSetQ(this.value)">'
      +(_vendQ?'<button type="button" class="mvv-srch-x" onclick="_vendVideQ()" aria-label="Effacer la recherche">'
        +_mvIcon('croix',16)+'</button>':'')
      +'</div>';
  }
  h+='<div class="mvv-fils" id="mvv-fils">'+_vendFilsHtml(cuves)+'</div>';
  h+='<div class="mvv-sortrow"><div class="mvv-seg" role="group" aria-label="Trier les cuves">'
    +_VEND_TRIS.map(function(t){
      return '<button type="button" class="'+(_vendTri===t[0]?'on':'')+'" '
        +'aria-pressed="'+(_vendTri===t[0])+'" onclick="_vendSetTri(\''+_escAttr(t[0])+'\')">'+t[1]+'</button>';
    }).join('')
    +'</div><div class="mvv-seg vues" role="group" aria-label="Affichage">'
    +'<button type="button" class="'+(_vendVue==='liste'?'on':'')+'" aria-pressed="'+(_vendVue==='liste')
    +'" onclick="_vendSetVue(\'liste\')" aria-label="Vue liste" title="Liste">'+_mvIcon('liste',16)+'</button>'
    +'<button type="button" class="'+(_vendVue==='plan'?'on':'')+'" aria-pressed="'+(_vendVue==='plan')
    +'" onclick="_vendSetVue(\'plan\')" aria-label="Plan de cuverie" title="Plan de cuverie">'+_mvIcon('carre',16)+'</button>'
    +'</div></div></div>';
  return h;
}
function _vendFilsHtml(cuves){
  return _VEND_FILS.map(function(f){
    var n=cuves.filter(function(c){ return _vendPasseFiltre(c,f[0]); }).length;
    /* Un filtre vide reste affiche : sa disparition ferait bouger la barre
       d'un jour a l'autre, et c'est exactement ce qu'on vient de corriger. */
    return '<button type="button" class="mvv-fil'+(_vendFiltre===f[0]?' on':'')+'" '
      +'aria-pressed="'+(_vendFiltre===f[0])+'" onclick="_vendSetFiltre(\''+_escAttr(f[0])+'\')">'
      +f[1]+'<span class="n">'+n+'</span></button>';
  }).join('');
}
function _vendMajFils(){
  var el=document.getElementById('mvv-fils');
  if(el) el.innerHTML=_vendFilsHtml((CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){
    return c && !_vendEstFusionnee(c); }));
}

/* Une ligne. ~68 px fermee, contre ~726 px avant. */
function _vendLigneHtml(c,canEdit){
  var ouv=(_vendOuvert===c.id), last=_vendLastMes(c), act=_vendIsActive(c);
  var lastD=_vendLastD(c);
  var pct=lastD?_vendFaPct(c,_vendMesD20(lastD)):0;
  var stale=_vendStale(c);
  /* ★ CUV-9 : « décuvée » ne prime plus sur « à mesurer ». Une cuve décuvée
     qui fermente encore doit se voir comme une cuve à relever, pas comme une
     affaire classée. */
  var cls=_vendADue(c)?'due':(c.statut==='termine'?'fini':(act?'fa':''));
  var rep=_vendRepere(c);
  var etat = _vendFaEnCours(c)    ? '<span class="mvv-etat due">D\u00e9cuv\u00e9e \u00b7 FA</span>'
    : c.statut==='termine'        ? '<span class="mvv-etat">D\u00e9cuv\u00e9e</span>'
    : c.statut==='setup'          ? '<span class="mvv-etat">Encuvage</span>'
    : _vendADue(c)                ? '<span class="mvv-etat due">'+stale+' j</span>'
    : act                         ? '<span class="mvv-etat ok">\u00e0 jour</span>'
    : '<span class="mvv-etat">'+_escHtml(_vendStatLbl(c.statut))+'</span>';
  var bits=[];
  if(c.parcelles&&c.parcelles.length) bits.push(_escHtml(c.parcelles.join(', ')));
  if(last&&last.densite!=null) bits.push(Math.round(_vendMesD20(last)));
  if(last&&last.temp_c!=null)  bits.push(_vendCuvF1(last.temp_c)+'\u00a0\u00b0C');
  var h='<div class="mvv-row '+cls+(ouv?' open':'')+'">'
    +'<button type="button" class="mvv-hd" aria-expanded="'+ouv+'" onclick="_vendBascOuv(\''+_escAttr(c.id)+'\')">'
    +(rep?'<span class="mvv-ref"><span class="mvv-ref-n">'+_escHtml(rep)+'</span>'
          +'<span class="mvv-ref-u">CUVE</span></span>':'')
    +'<span class="mvv-mid"><span class="mvv-nom">'+_escHtml(c.nom||'Cuve')+'</span>'
    +(bits.length?'<span class="mvv-sub">'+bits.join('<span class="sp">\u00b7</span>')+'</span>':'')
    +(act&&pct?'<span class="mvv-mini"><span class="mvv-mini-f" style="width:'+pct+'%"></span></span>':'')
    +'</span>'
    +'<span class="mvv-rt">'
    +(act&&pct?'<span class="mvv-pct"><span class="mvv-pct-n">'+pct+'</span>'
              +'<span class="mvv-pct-u">% FA</span></span>':'')
    +etat
    +'<span class="mvv-chev">'+_mvIcon('chevron',16)+'</span>'
    +'</span></button>';
  h+='<div class="mvv-det"'+(ouv?'':' hidden')+'>'+(ouv?_vendDetailHtml(c,canEdit):'')+'</div>';
  return h+'</div>';
}

/* Le detail. Il n'est construit QUE pour la cuve ouverte : c'est ce qui fait
   passer la page de ~8700 px a ~900 px sur douze cuves. */
function _vendDetailHtml(c,canEdit){
  var h='', last=_vendLastMes(c), act=_vendIsActive(c);
  var mes=_vendTriMes(c);
  /* La frise des etapes : elle dit OU EN EST la cuve dans son parcours.
     La ligne fermee n'en montre que l'aboutissement (le badge d'etat) ;
     ici on remet le parcours entier. */
  h+=_vendStepper(c);
  h+=_vendParcLigne(c);
  if(mes.length>=3){
    h+='<div class="mvv-det-g" id="mvg-fm-'+_mvgId(c.id)+'"></div>';
  } else if(mes.length>=2){
    h+='<div class="mvv-det-g" id="mvg-fa-'+_mvgId(c.id)+'"></div>';
  }
  if(last){
    h+='<div class="mvv-3">'
      +'<div class="c"><div class="v">'+(_vendLastD(c)?Math.round(_vendMesD20(_vendLastD(c))):'\u2014')+'</div><div class="l">densit\u00e9 \u00e0 20\u00a0\u00b0C</div></div>'
      +'<div class="c"><div class="v">'+(last.temp_c!=null?_vendCuvF1(last.temp_c)+'\u00a0\u00b0C':'\u2014')+'</div><div class="l">temp\u00e9rature</div></div>'
      +'<div class="c"><div class="v">'+(_vendStale(c)===0?'aujourd\u2019hui':'il y a '+_vendStale(c)+'\u00a0j')+'</div><div class="l">dernier relev\u00e9</div></div>'
      +'</div>';
    /* ★ Ce que la ligne fermee ne peut pas dire : le degre potentiel qui
       reste a faire, et la temperature COLOREE — une cuve a 31 °C doit se
       voir, pas seulement s'ecrire. */
    var chips=[];
    if(last.temp_c!=null)
      chips.push('<span class="mvv-chip '+_vendTempCls(last.temp_c)+'">'+_vendCuvF1(last.temp_c)
        +'<span class="u">\u00b0C</span></span>');
    if(act && last.densite!=null)
      chips.push('<span class="mvv-chip">reste ~'+_vendCuvF1(_vendSucreRest(c,_vendMesD20(last)))
        +'<span class="u">g/L de sucre</span></span>');
    if(last.remontages>0) chips.push('<span class="mvv-chip">'+last.remontages+'<span class="u">remont.</span></span>');
    if(last.pigeages>0)   chips.push('<span class="mvv-chip">'+last.pigeages+'<span class="u">pigeage'+(last.pigeages>1?'s':'')+'</span></span>');
    if(chips.length) h+='<div class="mvv-chips">'+chips.join('')+'</div>';
    /* ★★ CUV-10 — LE REPERE SE PRESENTE COMME UN REPERE. Il etait dessine sur
       la courbe sans jamais dire d'ou il venait ni ce qu'il vaut. Ecrit ici,
       avec sa provenance et le jour ou la courbe est passee dessous, il
       redevient ce qu'il est : une aide a la lecture. C'est la degustation
       qui declare la fin de FA (§117). */
    if(last&&last.densite!=null){
      var _js=_vendJourSec(c);
      h+='<div class="mvv-detnote">Rep\u00e8re de densit\u00e9\u00a0: <b>'+_escHtml(_vendDSecTxt(c))+'</b>'
        +(_js?(' \u00b7 courbe pass\u00e9e dessous le '+_vendFrDate(_js)):'')
        +'. Un rep\u00e8re de lecture, pas un verdict\u00a0: la fin de fermentation se constate '
        +'\u00e0 la d\u00e9gustation.</div>';
    }
  }
  var det=[];
  var cs=_vendCuvCsDom(c.id);
  if(cs>0) det.push(cs+' caisse'+(cs>1?'s':'')+' du domaine');
  if(_vendVolLoge(c)>0) det.push(_vendCuvF1(_vendVolLoge(c))+'\u00a0hL log\u00e9s');
  else if(cs>0)         det.push('~'+_vendCuvF1(_vendHlKg(_vendCuvKgDom(c.id)))+'\u00a0hL estim\u00e9s');
  if(c.volume_hl)       det.push('contenance '+_vendCuvF1(c.volume_hl)+'\u00a0hL');
  if(c.date_entree)     det.push('entr\u00e9e le '+_vendFrDate(c.date_entree));
  if(det.length) h+='<div class="mvv-detnote">'+_escHtml(det.join(' \u00b7 '))+'</div>';
  /* ★ Une cuve qui a absorbe d'autres cuves le dit : les releves d'AVANT la
     date d'assemblage portent sur un autre volume. Le taire ferait lire la
     courbe comme si rien n'avait change. */
  if(c.fusion_src&&c.fusion_src.length){
    var d=c.fusion_src[c.fusion_src.length-1];
    h+='<div class="mvv-detnote"><b>Assemblage le '+_vendFrDate(d.date)+'</b> \u2014 '
      +_escHtml(c.fusion_src.map(function(x){return x.nom;}).join(', '))
      +' rejoint'+(c.fusion_src.length>1?'s':'')+' cette cuve. Les relev\u00e9s ant\u00e9rieurs portent sur un autre volume.</div>';
  }
  /* ★★★ CUV-13 — LA CUVE PRESSUREE DIT CE QUI CONTINUE. La frise porte
     « Pressurage » et les boutons « Decuver » : sans cette ligne, on les lirait
     comme le meme geste, deja fait. La phrase du rattachement ne sort que si
     la cuve a un repere de cuverie — c'est lui que la tournee affiche, et il
     devient faux quand le jus change de cuve. */
  if(_vendPressee(c)){
    h+='<div class="mvv-detnote"><b>Pressur\u00e9e</b>\u00a0: le jus reste suivi. Il garde sa place dans la tourn\u00e9e, '
      +'et ses relev\u00e9s continuent la m\u00eame courbe.'
      +(_vendRepere(c)?' S\u2019il a chang\u00e9 de cuve, \u00ab\u00a0Modifier\u00a0\u00bb le rattache \u00e0 la nouvelle.':'')
      +' \u00ab\u00a0D\u00e9cuver\u00a0\u00bb l\u2019envoie ensuite au Chai.</div>';
  }
  /* ★★ CUV-9 — LE MOT QUI MANQUAIT. Une cuve décuvée avec du sucre n'est ni
     finie ni en panne : elle finit sa fermentation ailleurs. L'écran le dit,
     avec le seuil ET d'où il vient. */
  if(_vendDecuvee(c)){
    var _df=_vendDecD20(c);
    var _fut=(_df!=null)?(' Densit\u00e9 \u00e0 la mise en f\u00fbt\u00a0: <b>'+Math.round(_df)
      +'</b> \u00e0 20\u00a0\u00b0C, goutte et presse assembl\u00e9es.'):'';
    if(_vendFaEnCours(c)){
      h+='<div class="mvv-detnote"><b>D\u00e9cuv\u00e9e le '+_vendFrDate(c.decuvage.date)
        +', fermentation \u00e0 finir au chai.</b> Vous l\u2019avez indiqu\u00e9 au d\u00e9cuvage\u00a0: '
        +'elle se termine en phase liquide. Continuez \u00e0 relever, c\u2019est la m\u00eame courbe.'
        +_fut+'</div>';
    } else if(c.decuvage.fa_finie===true){
      h+='<div class="mvv-detnote"><b>D\u00e9cuv\u00e9e le '+_vendFrDate(c.decuvage.date)
        +'</b> \u2014 fermentation constat\u00e9e termin\u00e9e en cuve.'+_fut+'</div>';
    } else {
      h+='<div class="mvv-detnote"><b>D\u00e9cuv\u00e9e le '+_vendFrDate(c.decuvage.date)
        +'</b>. L\u2019\u00e9tat de la fermentation n\u2019a pas \u00e9t\u00e9 not\u00e9 \u00e0 ce moment-l\u00e0\u00a0: '
        +'l\u2019\u00e9cran ne le devine pas.'+_fut+'</div>';
    }
    h+=_vendDvolHtml(c, canEdit);
    /* ★★ CUV-11 — la porte reste ouverte, et l'ecran dit ce qu'elle ne fait pas. */
    h+='<div class="mvv-detnote">La densit\u00e9 se rel\u00e8ve encore\u00a0: \u00ab\u00a0Saisir une mesure\u00a0\u00bb '
      +'\u00e9crit dans la <b>m\u00eame courbe</b>. Un relev\u00e9 ne rouvre rien \u2014 ni l\u2019\u00e9tape de la cuve, '
      +'ni ce qui a \u00e9t\u00e9 constat\u00e9 au d\u00e9cuvage.</div>';
  }
  if(_vendEstFusionnee(c)){
    h+='<div class="mvv-detnote">Fusionn\u00e9e le '+_vendFrDate(c.fusion.date)+' dans <b>'
      +_escHtml(c.fusion.vers_nom||'une autre cuve')+'</b>. Ses relev\u00e9s et ses op\u00e9rations restent au registre.</div>';
  }
  if(canEdit && !_vendEstFusionnee(c)){
    h+='<div class="mvv-actrow" style="flex-wrap:wrap">';
    if(_vendMesurable(c)) h+='<button class="mvv-act2 dec" onclick="openOvVendMesure(\''+_escAttr(c.id)+'\')">Saisir une mesure</button>';
    if(c.statut==='setup') h+='<button class="mvv-act2 dec" onclick="openOvVendCuve(\''+_escAttr(c.id)+'\')">D\u00e9marrer la fermentation</button>';
    if(c.statut!=='termine')
      h+='<button class="mvv-act2" onclick="openVendStat(\''+_escAttr(c.id)+'\')">Changer l\u2019\u00e9tape</button>';
    h+='<button class="mvv-act2" onclick="openVendOp(\''+_escAttr(c.id)+'\')">Op\u00e9ration</button>';
    if(c.statut!=='termine'&&c.statut!=='setup')
      h+='<button class="mvv-act2" onclick="openVendDecuvage(\''+_escAttr(c.id)+'\')">D\u00e9cuver</button>';
    h+='<button class="mvv-act2" onclick="openOvVendCuve(\''+_escAttr(c.id)+'\')">Modifier</button>';
    h+='</div>';
  }
  h+=_vendParcHist(c,canEdit&&!_vendEstFusionnee(c));
  h+=_vendMesHist(c,canEdit&&!_vendEstFusionnee(c));
  h+=_vendOpsSummary(c,canEdit&&!_vendEstFusionnee(c));
  return h;
}
/* ★★★ CUV-14 — LE VOLUME DECUVE SE LIT, ET SE CORRIGE. C'est lui qui fait le
   rendement des parcelles de la cuve. Il dit d'ou il vient : mesure (saisi au
   decuvage, ou corrige depuis), ou d'apres les contenants remplis — le seul
   chiffre qui existait avant ce lot. Absent de `vol_decuve_src` = contenants. */
function _vendDvolHtml(c, canEdit){
  if(!_vendDecuvee(c) || _vendEstFusionnee(c)) return '';
  var v=_vendVolLoge(c), src;
  if(c.vol_decuve_src==='mesure')
    src='hL \u00b7 <b>mesur\u00e9</b>'+((c.vol_decuve_le && c.vol_decuve_le!==c.decuvage.date)
      ?(', corrig\u00e9 le '+_vendFrDate(c.vol_decuve_le)):'');
  else src='hL \u00b7 d\u2019apr\u00e8s les contenants remplis au d\u00e9cuvage';
  var h='<div class="mvv-dvol"><span class="mvv-dvol-t">Volume d\u00e9cuv\u00e9</span>'
    +'<div class="mvv-dvol-h"><span class="mvv-dtot-n">'+(v>0?_vendDecF2(v):'\u2014')+'</span>'
    +'<span class="mvv-dtot-l">'+(v>0?src:'aucun contenant n\u2019a \u00e9t\u00e9 rempli')+'</span></div>'
    +'<div class="mvv-detnote">C\u2019est ce volume que Le mill\u00e9sime retient pour le rendement des parcelles de la cuve'
    +'\u00a0; mesur\u00e9, c\u2019est aussi l\u2019\u00e9tape \u00ab\u00a0Entonn\u00e9\u00a0\u00bb de la cha\u00eene De la r\u00e9colte \u00e0 la bouteille. '
    +'S\u2019il a \u00e9t\u00e9 mesur\u00e9 autrement, corrigez-le\u00a0: Le Chai, lui, garde ses f\u00fbts.</div>';
  if(canEdit) h+='<button class="mvv-act2" onclick="_vendDvolCorriger(\''+_escAttr(c.id)+'\')">Corriger le volume</button>';
  return h+'</div>';
}
function _vendDvolCorriger(id){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){ return x.id===id; });
  if(!c || !_vendDecuvee(c) || _vendEstFusionnee(c)) return;
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#C0392B'); return; }
  var cap=parseFloat(c.volume_hl)||0, v=_vendVolLoge(c);
  window.openPrompt({icone:'cuve', titre:'Volume d\u00e9cuv\u00e9',
    sub:(c.nom||'Cette cuve')+' \u2014 goutte et presse assembl\u00e9es. Le rendement des parcelles de la cuve suivra '
      +'ce chiffre, et au Chai le f\u00fbt entam\u00e9 aussi.',
    valeur:v>0?String(Math.round(v*100)/100).replace('.',','):'', unite:'hL', type:'nombre', btnLabel:'Enregistrer',
    cb:function(x){
      var n=parseFloat(String(x).replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
      if(!isFinite(n)||n<=0){ showToast('Volume attendu, en hL','#B85A1A'); return; }
      if(cap>0 && n>cap){ showToast('Plus que la contenance de la cuve ('+_mvF1(cap)+' hL) \u2014 le volume se saisit en hL','#B85A1A'); return; }
      c.vol_decuve_hl=Math.round(n*100)/100; c.vol_decuve_src='mesure'; c.vol_decuve_le=_mvToday();
      /* ★ ASM-1 — le fut entame suit la mesure corrigee (§153a). */
      var _cles=['cave_vendange'];
      var _cu=(CAVE_ELEVAGE.cuvees||[]).find(function(x){ return x&&c.decuvage&&x.id===c.decuvage.cuvee_id; });
      if(_cu && isFinite(parseFloat(_cu.manque_l))){
        _cu.manque_l=Math.max(0,Math.min(_caveFutsL(_cu),Math.round(parseFloat(_cu.manque_l)-(c.vol_decuve_hl-(v>0?v:0))*100)));
        window.CAVE_ELEVAGE=CAVE_ELEVAGE; _cles.push('cave_elevage');
      }
      window.CAVE_VENDANGE=CAVE_VENDANGE;
      _vendFbSave('Volume d\u00e9cuv\u00e9\u00a0: '+_vendDecF2(c.vol_decuve_hl)+' hL \u2014 le rendement suit','#3D6B27',_cles);
      // ★ VOL-1 — repeindre l'ecran d'ou l'on vient (§152c).
      if(_caveSectionAct()==='vendange'||typeof renderCave!=='function') renderVendCuves(); else renderCave();
    }});
}
window._vendDvolCorriger=_vendDvolCorriger;

/* Le plan de cuverie : la cave vue d'un coup d'oeil, chaque cuve avec son
   niveau et sa couleur d'etat. */
function _vendCellHtml(c){
  var ouv=(_vendOuvert===c.id), last=_vendLastMes(c);
  var lastD=_vendLastD(c);
  var pct=lastD?_vendFaPct(c,_vendMesD20(lastD)):0;
  var cap=parseFloat(c.volume_hl)||0;
  var dedans=_vendVolContenu(c).hl;   // VOL-1
  var niv = (c.statut==='setup'||!(cap>0)) ? 0 : Math.max(8,Math.min(100,Math.round(dedans/cap*100)));
  var col = c.statut==='termine' ? '#C0BAAE' : _vendADue(c) ? '#C86A4E'
          : (_vendIsActive(c)||_vendPressee(c)) ? '#8A5A38' : '#9A93A8';
  var H=52, y=6+(H)*(1-niv/100);
  var sous = _vendFaEnCours(c) ? 'd\u00e9cuv\u00e9e \u00b7 FA en cours'
    : c.statut==='termine' ? 'd\u00e9cuv\u00e9e' : c.statut==='setup' ? 'en attente'
    : _vendADue(c) ? _vendStale(c)+' j sans relev\u00e9'
    : _vendPressee(c) ? 'pressur\u00e9e'                  /* CUV-13 : suivie, pas finie */
    : (pct?pct+'\u00a0% FA':'suivie');
  var rep=_vendRepere(c);
  var uid=_mvgId(c.id);
  return '<button type="button" class="mvv-cell'+(_vendADue(c)?' due':'')+(ouv?' open':'')+'" '
    +'aria-pressed="'+ouv+'" onclick="_vendBascOuv(\''+_escAttr(c.id)+'\')">'
    +'<span class="mvv-cell-r">'+_escHtml(rep||'\u2014')+'</span>'
    +'<span class="mvv-cell-sv"><svg width="46" height="'+(H+12)+'" viewBox="0 0 46 '+(H+12)+'" '
    +'aria-hidden="true" focusable="false">'
    +'<clipPath id="vcp'+uid+'"><rect x="7" y="6" width="32" height="'+H+'" rx="5"/></clipPath>'
    +'<rect x="7" y="6" width="32" height="'+H+'" rx="5" fill="var(--bg-card,#FBFAF6)" '
    +'stroke="rgba(138,90,56,.32)" stroke-width="1.4"/>'
    +(niv?'<rect x="7" y="'+y.toFixed(1)+'" width="32" height="'+(H+6-y).toFixed(1)+'" fill="'+col
      +'" opacity=".82" clip-path="url(#vcp'+uid+')"/>':'')
    +'<rect x="13" y="2" width="20" height="5" rx="2" fill="rgba(138,90,56,.3)"/>'
    +'</svg></span>'
    +'<span class="mvv-cell-n">'+_escHtml(c.nom||'Cuve')+'</span>'
    +'<span class="mvv-cell-s'+(_vendADue(c)?' due':'')+'">'+sous+'</span>'
    +'</button>';
}

/* Le corps seul — extrait pour que la recherche le repeigne sans reconstruire
   la barre d'outils (le champ perdrait le focus a chaque frappe). */
function _vendCorpsHtml(){
  var cuves=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){ return c && !_vendEstFusionnee(c); });
  var canEdit=canWrite();
  var l=_vendListe(cuves);
  if(!l.length){
    return '<div class="mvv-empty"><div class="mvv-empty-tx">'
      +(cuves.length?'Aucune cuve ne correspond.<br>Change le filtre ou efface la recherche.'
                    :'Aucune cuve de vinification.<br>Cr\u00e9ez votre premi\u00e8re cuve pour suivre la fermentation.')
      +'</div></div>';
  }
  if(_vendVue==='plan'){
    var h='<div class="mvv-plan">'+l.map(_vendCellHtml).join('')+'</div>';
    var o=l.filter(function(c){ return c.id===_vendOuvert; })[0];
    if(o) h+='<div class="mvv-row '+(o.statut==='termine'?'fini':(_vendADue(o)?'due':'fa'))+' open" style="margin-top:10px">'
      +'<div class="mvv-hd" style="cursor:default"><span class="mvv-mid">'
      +'<span class="mvv-nom">'+_escHtml(o.nom||'Cuve')+'</span></span></div>'
      +'<div class="mvv-det">'+_vendDetailHtml(o,canEdit)+'</div></div>';
    return h;
  }
  return l.map(function(c){ return _vendLigneHtml(c,canEdit); }).join('');
}

/* Les graphes se posent APRES l'ecriture du HTML : _mvGraphSuivre mesure la
   largeur du conteneur, qui n'existe pas encore pendant la construction. */
function _vendPeindreGraphes(){
  window._mvGraphOublier('#mvg-fa-');
  window._mvGraphOublier('#mvg-fm-');
  var c=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(x){ return x && x.id===_vendOuvert; })[0];
  if(c){
    var mes=_vendTriMes(c);
    if(mes.length>=3){
      (function(cu){ window._mvGraphSuivre('#mvg-fm-'+_mvgId(cu.id), function(lg){ return _vendFermSvg(cu,lg); }); })(c);
    } else if(mes.length>=2){
      (function(cu){ window._mvGraphSuivre('#mvg-fa-'+_mvgId(cu.id), function(lg){ return _vendSparkline(cu.mesures_fa,cu.id,lg); }); })(c);
    }
  }
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
}

function renderVendCuves() {
  var el=document.getElementById('mvv-body'); if(!el) return;
  window._mvGraphOublier('#mvg-fa-');
  window._mvGraphOublier('#mvg-fm-');
  window._mvGraphOublier('#mvg-cv-');
  var toutes=CAVE_VENDANGE.cuves_vinif||[];
  var cuves=toutes.filter(function(c){ return c && !_vendEstFusionnee(c); });
  var canEdit=canWrite();
  var actives=cuves.filter(function(c){ return c.statut!=='termine'; });
  var due=cuves.filter(_vendADue);

  var h=_caveSaisBanner();
  if(due.length){
    h+='<div class="mvv-alert"><div class="mvv-alert-t">'+due.length+' cuve'+(due.length>1?'s':'')+' \u00e0 mesurer</div>'
      +'<div class="mvv-alert-d">En fermentation active, un relev\u00e9 de densit\u00e9 par jour suit la cin\u00e9tique et anticipe un arr\u00eat.</div>'
      +'<div class="mvv-alert-chips">'+due.map(function(c){
        return '<button class="mvv-alert-chip" onclick="_vendBascOuv(\''+_escAttr(c.id)+'\')">'
          +_escHtml(c.nom)+' <small>\u00b7 '+_vendStale(c)+' j</small></button>';
      }).join('')+'</div></div>';
  }
  /* ★ Le remplissage parcelle par parcelle reste, mais REPLIE : il repond a
     « la journee de recolte de demain peut-elle partir ? », pas a « ou est ma
     cuve ? ». Deplie, il repoussait la liste d'un ecran entier. */
  if(actives.length){
    h+='<details class="mvv-histwrap" style="margin-bottom:10px"><summary>Remplissage des cuves '
      +'<span class="u">\u00b7 parcelle par parcelle</span></summary>'
      +'<div id="mvg-cv-all"></div></details>';
    (function(cc,rr){ window._mvGraphSuivre('#mvg-cv-all', function(lg){ return _vendRemplirSvg(cc,rr,lg); }); })(actives, CAVE_VENDANGE.recoltes||[]);
  }
  if(cuves.length) h+=_vendOutilsHtml(cuves);
  h+='<div id="mvv-corps">'+_vendCorpsHtml()+'</div>';

  /* Les cuves absorbees par une fusion : hors de la liste, jamais perdues. */
  h+=_vendFusionneesSection(toutes.filter(_vendEstFusionnee));
  h+=_vendDecuveesSection(cuves.filter(function(c){ return c.statut==='termine'; }));

  if(canEdit){
    h+='<div class="mvv-fab">';
    if(actives.length>=2)
      h+='<button class="mvv-fab-btn" style="background:var(--bg-card,#FBFAF6);color:var(--terre,#8A5A38);'
        +'border:1px solid rgba(138,90,56,.3);margin-bottom:8px" onclick="openVendFusion()">Fusionner des cuves</button>';
    h+='<button class="mvv-fab-btn" onclick="openOvVendCuve(null)">+ Nouvelle cuve</button></div>';
  }
  el.innerHTML=h;
  _vendPeindreGraphes();
  _vendRefreshCockpit();
}

function _vendCfg(){return Object.assign({poids_caisse_kg:25,ratio_min:130,ratio_max:140,sucre_par_degre:16.83},CAVE_VENDANGE.config||{});}
function renderVendParam() {
  // Lot CAVE-2 : les reglages du Cuvier vivent dans la roue crantee de la Cave.
  var el=document.getElementById('cave-reg-cuvier'); if(!el) return;
  var cfg=_vendCfg();
  var pck=cfg.poids_caisse_kg, rMin=cfg.ratio_min, rMax=cfg.ratio_max;
  var ex=100*pck;
  var admin=(typeof isAdmin==='function'&&isAdmin());
  var html=_caveSaisBanner();
  html+='<div class="mvv-set"><div class="mvv-set-t">Pesée</div>'
    +'<div class="mvv-set-d">Poids moyen d\'une caisse de vendange, utilisé pour convertir les caisses en kilos.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Poids par caisse</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-pck" type="number" min="10" max="60" value="'+pck+'"><span style="font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)">kg</span></div></div>'
    // Le poids par défaut ne vaut QUE pour les saisies à venir : chaque apport
    // fige le sien (VD-1). La correction des apports déjà saisis a sa porte.
    +'<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">Poids proposé aux prochaines saisies. Chaque apport garde celui du jour où il a été pesé.</div>'
    +(canWrite()?'<button class="mvv-save ghost2" style="margin-top:10px" onclick="openVendPoids()">Corriger un poids déjà saisi</button>':'')
    +'</div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Rendement jus</div>'
    +'<div class="mvv-set-d">Kilos de raisin pour produire 1 hL de jus. Standard Bourgogne rouge : 130–140 kg/hL.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Ratio minimum</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-rmin" type="number" min="80" max="200" value="'+rMin+'"><span style="font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)">kg/hL</span></div></div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Ratio maximum</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-rmax" type="number" min="80" max="200" value="'+rMax+'"><span style="font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)">kg/hL</span></div></div>'
    +'<div class="mvv-preview">100 caisses de '+pck+' kg → <b>'+(ex/rMax).toFixed(1)+'–'+(ex/rMin).toFixed(1)+' hL</b></div></div>';
  var _rb=_vendRdtBase();
  html+='<div class="mvv-set"><div class="mvv-set-t">Base du rendement</div>'
    +'<div class="mvv-set-d">Le client rend deux chiffres apr\u00e8s pressurage : les litres de jus et les litres '
    +'de lie. Celui qui compte pour votre d\u00e9claration se r\u00e8gle ici \u2014 l\u2019application ne le devine pas.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Volume retenu</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="mvv-save ghost2" style="width:auto;padding:8px 12px;margin:0;'
      +(_rb==='jus'?'background:rgba(138,90,56,.16);border-color:rgba(138,90,56,.4)':'')
      +'" onclick="_vendSetRdtBase(\'jus\')">Jus clair</button>'
    +'<button class="mvv-save ghost2" style="width:auto;padding:8px 12px;margin:0;'
      +(_rb==='total'?'background:rgba(138,90,56,.16);border-color:rgba(138,90,56,.4)':'')
      +'" onclick="_vendSetRdtBase(\'total\')">Jus + lies</button></div></div>'
    +'<div class="mvv-preview">'+(_rb==='jus'
        ?'Seul le jus clair entre dans le rendement.'
        :_mvIcon('alerte',16)+' Jus et lies comptent. Le volume du domaine est un volume log\u00e9 : ses lies ne sont compt\u00e9es nulle part.')
    +'</div></div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Chaptalisation</div>'
    +'<div class="mvv-set-d">Sucre pour enrichir de 1° d’alcool potentiel. Standard : 16,83 g/L (≈ 17 g/L). Utilisé par l’assistant d’opération sur cuve.</div>'
    +'<div class="mvv-prow"><div class="mvv-prow-l">Sucre par degré</div><div style="display:flex;align-items:center;gap:7px"><input class="mvv-fi" id="vpfi-spd" type="number" min="15" max="20" step="0.01" value="'+cfg.sucre_par_degre+'"><span style="font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F)">g/L</span></div></div></div>';
  html+='<div class="mvv-set"><div class="mvv-set-t">Clients vrac</div>'
    +'<div class="mvv-set-d">Acheteurs de raisin en vrac, avec leur poids par caisse. Sert à convertir les caisses vendues et suivre les volumes livrés.</div>'
    +(canWrite()?'<button class="mvv-save ghost2" style="margin-top:12px" onclick="openVendClients()">Gérer les clients ('+_vendClients().length+')</button>':'')
    +'<button class="mvv-save ghost2" style="margin-top:8px" onclick="openVendVrac()">Livraisons et bons</button>'
    +'</div>';
  if(admin) html+='<button class="mvv-save" onclick="_vendSaveParam()">Enregistrer les paramètres</button>';
  el.innerHTML=html;
  _vendRefreshCockpit();
}

function _vndUpdateCalc() {
  var elC=document.getElementById('vrec-caisses'); if(!elC) return;
  var nb=parseInt(elC.value)||0;
  var clObj=_vendClient((document.getElementById('vrec-client')||{}).value||'');
  var kg=nb*((clObj&&clObj.poids_caisse_kg)||_vendCfg().poids_caisse_kg||25);
  var wrap=document.getElementById('vrec-calc-wrap'); if(!wrap) return;
  if(nb<=0){wrap.innerHTML='';return;}
  var hlHtml=!_vendVendu?('<b style="color:var(--terre,#8A5A38)">'+_vendHlRange(kg)+' hl</b>'):'<span style="color:var(--texte-doux,#5F5F5F);">\u2014 (vendu en raisin)</span>';
  wrap.innerHTML='<div class="vend-calc-band" style="margin-bottom:10px"><div class="vend-calc-cell"><div class="vend-calc-v">'+kg.toLocaleString('fr-FR')+'</div><div class="vend-calc-l">kg</div></div><div class="vend-calc-sep"></div><div class="vend-calc-cell"><div style="font-size:var(--pt-txt,12.5px);font-weight:600;margin:2px 0;">'+hlHtml+'</div><div class="vend-calc-l">hl estim\u00e9s</div></div></div>';
}
function _vndAdjCaisses(d) {
  var el=document.getElementById('vrec-caisses'); if(!el) return;
  el.value=Math.max(0,(parseInt(el.value)||0)+d);
  _vndUpdateCalc();
}
function _vndSyncCaisses() { _vndUpdateCalc();
  if(!_vcuvSel.volTouched){ _vcuvSel.vol=null; if(document.getElementById('vrec-cuv-att')) _vendCuvAtt(); }
}
function _vndSetEtat(v) {
  var el=document.getElementById('vrec-etat-pct'); if(el) el.textContent=v+'%';
  var bd=document.getElementById('vrec-etat-badge'); if(bd) bd.innerHTML=_vendEtatBadge(parseInt(v));
}
function _vndToggleVendu() {
  _vendVendu=!_vendVendu;
  _renderVendVenduWrap();
  var vs=document.getElementById('vrec-vinif-section');
  if(vs){vs.style.opacity=_vendVendu?'0.35':'1';vs.style.pointerEvents=_vendVendu?'none':'';}
  _vendSyncDest();
  _vndUpdateCalc();
}
function _renderVendVenduWrap() {
  var wrap=document.getElementById('vrec-vendu-wrap'); if(!wrap) return;
  var bg=_vendVendu?'rgba(205,148,38,.06)':'rgba(74,159,200,.04)';
  var bd=_vendVendu?'rgba(205,148,38,.3)':'rgba(74,159,200,.2)';
  var col=_vendVendu?'#8A6A12':'var(--texte,#1A1A14)';
  var swBg=_vendVendu?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var knobLeft=_vendVendu?'23':'3';
  var knobBg='#FFFFFF';
  var lbl=_vendVendu?(_mvIcon('lien',16)+' Vendu en raisin'):(_mvIcon('seau',16)+' Vinifi\u00e9 au domaine');
  var sub=_vendVendu?'Pes\u00e9e conserv\u00e9e \u2014 pas de cuve cr\u00e9\u00e9e':'Mise en cuve apr\u00e8s r\u00e9colte';
  wrap.innerHTML='<div onclick="_vndToggleVendu()" style="display:flex;align-items:center;justify-content:space-between;border-radius:12px;padding:11px 13px;margin-bottom:10px;cursor:pointer;border:1px solid '+bd+';background:'+bg+'"><div><div style="font-size:var(--pt-txt,12.5px);font-weight:600;color:'+col+'">'+lbl+'</div><div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:2px">'+sub+'</div></div><div style="width:46px;height:26px;background:'+swBg+';border-radius:13px;position:relative;flex-shrink:0;"><div style="position:absolute;top:3px;left:'+knobLeft+'px;width:20px;height:20px;border-radius:10px;background:'+knobBg+'"></div></div></div>';
}
function _vndSetEr(e) {
  _vendEraflage=e;
  ['total','partiel','entiere'].forEach(function(b){
    var el=document.getElementById('vrec-er-'+b); if(!el) return;
    var on=b===e;
    el.style.background=on?'rgba(192,132,90,.18)':'rgba(192,132,90,.04)';
    el.style.borderColor=on?'rgba(192,132,90,.4)':'rgba(192,132,90,.15)';
    el.style.color=on?'#8A5A38':'#5F5F5F';
  });
  var pw=document.getElementById('vrec-er-pct-wrap'); if(pw) pw.style.display=e==='partiel'?'block':'none';
}
function openOvVendRec(id, presetParc) {
  if(!canWrite()) return;
  _vendEditId=id||null;
  var r=id?(CAVE_VENDANGE.recoltes||[]).find(function(x){return x.id===id;}):null;
  var titleEl=document.getElementById('ov-vend-rec-title');
  if(titleEl) titleEl.textContent=r?'Modifier la r\u00e9colte':'Nouvelle r\u00e9colte';
  var el;
  /* presetParc n'existe QUE pour une création : sur une modification, la
     parcelle de la récolte fait foi et rien ne doit la déplacer. */
  _vendInjectParcelleSelect(r?r.parcelle:(presetParc||''));
  el=document.getElementById('vrec-date'); if(el) el.value=r?r.date:_mvToday();
  el=document.getElementById('vrec-caisses'); if(el) el.value=r?_recCsDom(r):0;
  el=document.getElementById('vrec-temp'); if(el) el.value=r&&r.temp_c?r.temp_c:'';
  var etatPct=r?(r.etat_pct||0):0;
  el=document.getElementById('vrec-etat-range'); if(el) el.value=etatPct;
  _vndSetEtat(etatPct);
  _vendVendu=r?!!r.vendu:false;
  _vendEraflage=r?(r.erasflage||'total'):'total';
  _renderVendVenduWrap();
  var vs=document.getElementById('vrec-vinif-section');
  if(vs){vs.style.opacity=_vendVendu?'0.35':'1';vs.style.pointerEvents=_vendVendu?'none':'';}
  _vndSetEr(_vendEraflage);
  _vendInjectDestFields(r);
  el=document.getElementById('vrec-er-pct'); if(el) el.value=r?(r.er_pct||30):30;
  el=document.getElementById('vrec-note'); if(el) el.value=r?(r.note||''):'';
  el=document.getElementById('vrec-id'); if(el) el.value=id||'';
  el=document.getElementById('vrec-del-btn'); if(el) el.style.display=r?'block':'none';
  _vendRepInject(r);
  _vndUpdateCalc();
  var ov=document.getElementById('ovVendRec'); if(ov) ov.classList.add('open');
}
// ════════════════════════════════════════════════════════════════════════════
// VD-GARDE / VD-SAVE — deux mensonges du Cuvier, corriges ensemble (01/09)
// ════════════════════════════════════════════════════════════════════════════
// 1. QUATORZE ecrivains de la vendange sur dix-neuf ne verifiaient AUCUN role.
//    Un compte en lecture seule voyait « + Nouvelle recolte », saisissait, et
//    recevait un refus du serveur en travers de l'ecran. L'ecran proposait un
//    geste que le serveur refusait — ce n'est pas une erreur de l'utilisateur.
//
// ⚠️⚠️ NE PAS UTILISER canWrite() ICI. Cote client (utils.js) il vaut
//    `isAdmin() || (ouvrier && !saisonnier)` : il rend FAUX pour un TRACTORISTE,
//    alors que le serveur, lui, l'autorise (deriveRo, functions/claims.js:155,
//    ne pose `ro` que sur saisonnier/pilotage SANS role d'ecriture). Poser
//    canWrite() sur la vendange priverait les tractoristes d'un ecran qu'ils
//    utilisent aujourd'hui. _vendLectureSeule() est le miroir EXACT de deriveRo.
//    ⚠️ Dette assumee : deux copies d'une meme regle, une par machine. Le jour ou
//    deriveRo bouge, celle-ci doit bouger avec — sinon l'ecran et le serveur ne
//    diront plus la meme chose, et c'est l'utilisateur qui paiera l'ecart.
function _vendLectureSeule(){
  try{
    var u=window.currentUser, r=(u&&u.roles)||[];
    if(!u||!r.length) return false;
    if(r.indexOf('admin')>=0||r.indexOf('ouvrier')>=0||r.indexOf('tractoriste')>=0) return false;
    return r.indexOf('saisonnier')>=0||r.indexOf('pilotage')>=0;
  }catch(e){
    if(window.logError) window.logError({level:'info',cat:'cave',msg:'Role illisible (vendange)',detail:String(e)});
    return false;   // en cas de doute on laisse faire : le serveur tranchera
  }
}
function _vendGarde(){
  if(!_vendLectureSeule()) return true;
  showToast('Acc\u00e8s en lecture seule','#B85A1A');
  return false;
}

// 2. LE VERT PARTAIT AVANT LA REPONSE DU SERVEUR. `fbSave` est asynchrone et rend
//    un etat (contrat §68) ; personne ici ne le lisait. « R\u00e9colte enregistr\u00e9e »
//    s'affichait en vert dans la milliseconde, l'ecriture pouvait echouer juste
//    apres, et la recolte disparaissait au rechargement. C'est le signalement du
//    01/09, en pleine vendange. *Un message de succes qui ne depend pas du succes
//    n'est pas un message, c'est une decoration.*
//    Le message de l'appelant n'est plus affiche que sur `ok`. Sinon l'ecran dit
//    ce qui s'est reellement passe — et dans les deux cas la saisie est vivante :
//    en file (reseau) ou au coffre (AUTH-1, firebase.js).
//    ⚠️ Le toast d'attente est DIFFERE de 700 ms : sans lui, un reseau lent laisse
//    l'ecran muet ~7 s (fbSave fait 3 tentatives) et l'utilisateur ressaisit ; avec
//    lui pose tout de suite, un enregistrement normal ferait clignoter deux toasts
//    et vibrer le telephone deux fois.
function _vendFbSave(msg,coul,cles){
  var K=(cles&&cles.length)?cles:['cave_vendange'];
  var paires={};
  K.forEach(function(k){ paires[k]=(k==='cave_elevage')?CAVE_ELEVAGE:CAVE_VENDANGE; });
  // ⚠️ UNE SEULE implementation du contrat, dans firebase.js : deux copies d'une
  // regle de message auraient diverge au premier lot qui n'en touche qu'une.
  if(window.fbSaveToast) return window.fbSaveToast(paires,msg,coul);
  if(msg) showToast(msg,coul||'#3D6B27');   // repli : firebase.js pas encore charge
}
function saveVendRec() {
  if(!_vendGarde()) return;
  var parcelle=((document.getElementById('vrec-parcelle')||{}).value||'').trim();
  if(!parcelle){showToast('Saisissez le nom de la parcelle','#E07060');return;}
  var _parts=_vendRepParts();
  if(!_parts.length){showToast('Saisissez au moins une caisse','#E07060');return;}
  // Champs derives, conserves pour tout ce qui lit encore l'ancien modele.
  var nb=_parts.reduce(function(a,pt){return a+_vpCs(pt);},0);
  var _cliParts=_parts.filter(function(pt){return !pt.dom;});
  var date=(document.getElementById('vrec-date')||{}).value||'';
  var temp=parseFloat((document.getElementById('vrec-temp')||{}).value)||null;
  var etatPct=parseInt((document.getElementById('vrec-etat-range')||{}).value)||0;
  var erPct=parseInt((document.getElementById('vrec-er-pct')||{}).value)||30;
  var note=((document.getElementById('vrec-note')||{}).value||'');
  var id=((document.getElementById('vrec-id')||{}).value||'');
  var vendu=!_parts.some(function(pt){return pt.dom;});
  var client=(_cliParts.length===1)?(_cliParts[0].client||''):'';
  var prev=id?(CAVE_VENDANGE.recoltes||[]).find(function(r){return r.id===id;}):null;
  // ── cuvee de destination : registre + rattachement de cuve ──
  var _mill=_vendMillOfDate(date), _cuv=null;
  if(!vendu){
    if(_vcuvSel.id) _cuv=_vendCuvById(_vcuvSel.id);
    if(_cuv&&_cuv.millesime!==_mill) _cuv=_vendCuvEnsure(_cuv.nom,_mill);
    if(!_cuv&&(_vcuvSel.nom||'').trim()) _cuv=_vendCuvEnsure(_vcuvSel.nom,_mill);
    if(!_cuv){showToast('Choisissez ou cr\u00e9ez une cuv\u00e9e de destination','#E07060');return;}
  }
  var cuvee=_cuv?_cuv.nom:'';
  var _vcid=_cuv?_cuv.id:null;
  var _prevCuve=prev?(prev.cuve_id||null):null;
  var _cuveId=null;
  if(_cuv){
    var _cvs=_vendCuvStats(_cuv.id).cuves;
    if(_cvs.length){
      if(_vcuvSel.cuveIdx>=0&&_cvs[_vcuvSel.cuveIdx]) _cuveId=_cvs[_vcuvSel.cuveIdx].id;
    } else if(_prevCuve){ _cuveId=_prevCuve; }
  }
  var obj={id:id||'vrec_'+Date.now(),parcelle:parcelle,date:date,parts:_parts,nb_caisses:nb,temp_c:temp,etat_pct:etatPct,erasflage:_vendEraflage,er_pct:erPct,vendu:vendu,client:client,cuvee:cuvee,vcuvee_id:_vcid,note:note,cuve_id:_cuveId};
  if(!CAVE_VENDANGE.recoltes) CAVE_VENDANGE.recoltes=[];
  // la recolte quitte son ancienne cuve
  if(_prevCuve&&_prevCuve!==_cuveId){
    var _oc=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===_prevCuve;});
    if(_oc&&Array.isArray(_oc.recolte_ids)) _oc.recolte_ids=_oc.recolte_ids.filter(function(x){return x!==obj.id;});
  }
  // ... et rejoint la nouvelle (volume propose, modifiable)
  if(_cuveId){
    var _nc=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===_cuveId;});
    if(_nc){
      if(!Array.isArray(_nc.recolte_ids)) _nc.recolte_ids=[];
      if(_nc.recolte_ids.indexOf(obj.id)===-1) _nc.recolte_ids.push(obj.id);
      if(_vcuvSel.vol!=null&&_vcuvSel.vol>0) _nc.volume_hl=_vcuvSel.vol;
      if(_vcid&&!_nc.vcuvee_id) _nc.vcuvee_id=_vcid;
    }
  }
  if(id){var idx=CAVE_VENDANGE.recoltes.findIndex(function(r){return r.id===id;});if(idx!==-1)CAVE_VENDANGE.recoltes[idx]=obj;else CAVE_VENDANGE.recoltes.push(obj);}
  else{CAVE_VENDANGE.recoltes.push(obj);}
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(id?'R\u00e9colte mise \u00e0 jour':'R\u00e9colte enregistr\u00e9e','#3D6B27');
  _vendRecordRendement(obj,prev);
  if(window.closeOv) window.closeOv(null,'ovVendRec');
  renderVendRec();
}
function deleteVendRec() {
  if(!_vendGarde()) return;
  var id=((document.getElementById('vrec-id')||{}).value||'');
  if(!id) return;
  var rec=(CAVE_VENDANGE.recoltes||[]).find(function(r){return r.id===id;});
  var pnom=rec?rec.parcelle:'';
  window.openConfirmDel('Supprimer cette récolte ?','',function(){
    var _dc=rec&&rec.cuve_id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===rec.cuve_id;}):null;
    if(_dc&&Array.isArray(_dc.recolte_ids)) _dc.recolte_ids=_dc.recolte_ids.filter(function(x){return x!==id;});
    CAVE_VENDANGE.recoltes=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return r.id!==id;});
    _vendCuvSync();
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('R\u00e9colte supprim\u00e9e','#B85A1A');
    _vendUnrecordRendement(id,pnom);
    if(window.closeOv) window.closeOv(null,'ovVendRec');
    renderVendRec();
  });
}
function _vndToggleMpf() {
  _vcuvMpfActive=!_vcuvMpfActive;
  var sw=document.getElementById('vcuv-mpf-sw');
  if(sw) sw.style.background=_vcuvMpfActive?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var kn=document.getElementById('vcuv-mpf-knob');
  if(kn){kn.style.left=_vcuvMpfActive?'23px':'3px';kn.style.background='#FFFFFF';}
  var p=document.getElementById('vcuv-mpf-params'); if(p) p.style.display=_vcuvMpfActive?'block':'none';
}
// ══ LE CUVIER PIOCHE DANS LE PARC ═════════════════════════════════════════
// ⚠️⚠️ C'est ce rattachement qui rend l'occupation du parc HONNETE. Sans lui,
//   « Le parc a cuves » annonce « Cuve 3 libre » pendant qu'elle fermente :
//   il ne voit que Le Chai, la moitie de la verite.
// Rien n'est obligatoire : une cuve saisie a la main, sans reference au parc,
// continue de marcher exactement comme avant. On ajoute un raccourci, pas une
// contrainte.
function _vcuvParcRender(){
  var host=document.getElementById('vcuv-parc'); if(!host) return;
  var parc=_caveParc();
  if(!parc.length){
    host.innerHTML='<div class="mvc-pk-vide">Aucune cuve d\u00e9clar\u00e9e. '
      +'Le parc se remplit dans la roue crant\u00e9e de la Cave, bloc Le Chai.</div>';
    return;
  }
  // La cuve deja rattachee a CETTE cuve de vinification reste proposee : sinon
  // rouvrir la fiche pour corriger un volume ferait perdre le rattachement.
  var dispo=parc.filter(function(p){ return !_caveCuveOcc(p.id, _vcuvEditId) || p.id===_vcuvRef; });
  if(!dispo.length){
    host.innerHTML='<div class="mvc-pk-vide">Toutes les cuves du parc sont occup\u00e9es.<br>'
      +'Vous pouvez saisir une cuve \u00e0 la main ci-dessous.</div>';
    return;
  }
  var h='';
  dispo.forEach(function(p){
    var sel=(_vcuvRef===p.id), m=_caveMat(p.matiere);
    h+='<button type="button" class="mvc-pk mvc-aff-c'+(sel?' sel':'')+'" onclick="_vcuvPick(\'' + _escAttr(p.id) + '\')">'
      +'<span class="mvc-aff-rad"></span>'
      +'<span class="mvc-pk-ic '+_caveMatKey(p.matiere)+'">'+_mvIcon('cuve',18)+'</span>'
      +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(p.nom||'Cuve')+'</span>'
      +'<span class="mvc-pk-m">'+_escHtml(m.lbl)+' \u00b7 '+_mvF1((parseFloat(p.litres)||0)/100)+' hL de contenance</span></span>'
      +'<span class="mvc-pk-r"><span class="mvc-pk-occ libre">Libre</span></span></button>';
  });
  h+='<div class="mvc-pk-tot" id="vcuv-parc-note">'+_vcuvParcNote()+'</div>';
  host.innerHTML=h;
}
function _vcuvParcNote(){
  var p=_caveCuve(_vcuvRef);
  if(!p) return 'Sans cuve du parc, la saisie fonctionne comme avant \u2014 le parc ne saura simplement pas que cette cuve est prise.';
  return _escHtml(p.nom||'Cuve')+' sera marqu\u00e9e occup\u00e9e dans le parc jusqu\u2019au d\u00e9cuvage.';
}
// ⚠️ On ne remplit QUE les champs vides. Ecraser un nom ou un volume deja
//   saisis \u2014 par la main, ou par le groupement de recoltes \u2014 detruirait une
//   donnee reelle au profit d'une valeur par defaut.
function _vcuvPick(ref){
  if(_vcuvRef===ref){ _vcuvRef=null; _vcuvParcRender(); return; }
  var p=_caveCuve(ref); if(!p) return;
  _vcuvRef=ref;
  var el=document.getElementById('vcuv-nom');
  if(el && !String(el.value||'').trim()) el.value=p.nom||'';
  el=document.getElementById('vcuv-volume');
  if(el && !String(el.value||'').trim()) el.value=_mvF1((parseFloat(p.litres)||0)/100).replace(',','.');
  _vcuvParcRender();
}

function openOvVendCuve(id) {
  if(!canWrite()) return;
  _vcuvEditId=id||null;
  var c=id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===id;}):null;
  var titleEl=document.getElementById('ov-vend-cuv-title');
  if(titleEl) titleEl.textContent=c?'Modifier la cuve':'Nouvelle cuve';
  var el;
  _vcuvRef=(c&&c.cuve_ref)?c.cuve_ref:null;
  _caveV2InjectCss();
  el=document.getElementById('vcuv-nom'); if(el) el.value=c?c.nom:'';
  el=document.getElementById('vcuv-volume'); if(el) el.value=c?c.volume_hl:'';
  el=document.getElementById('vcuv-date'); if(el) el.value=c?c.date_entree:_mvToday();
  el=document.getElementById('vcuv-parcelles'); if(el) el.value=c&&c.parcelles?c.parcelles.join(', '):'';
  el=document.getElementById('vcuv-statut'); if(el) el.value=c?(c.statut||'setup'):'setup';
  el=document.getElementById('vcuv-so2'); if(el) el.value=c&&c.so2_g_hl?c.so2_g_hl:'';
  el=document.getElementById('vcuv-levures'); if(el) el.value=c?(c.levures||'indigenes'):'indigenes';
  el=document.getElementById('vcuv-erasflage'); if(el) el.value=c?(c.erasflage||'total'):'total';
  _vcuvMpfActive=c&&c.mpf?!!c.mpf.active:false;
  var sw=document.getElementById('vcuv-mpf-sw');
  if(sw) sw.style.background=_vcuvMpfActive?'rgba(205,148,38,.5)':'rgba(192,132,90,.15)';
  var kn=document.getElementById('vcuv-mpf-knob');
  if(kn){kn.style.left=_vcuvMpfActive?'23px':'3px';kn.style.background='#FFFFFF';}
  el=document.getElementById('vcuv-mpf-temp'); if(el) el.value=c&&c.mpf?(c.mpf.temp_c||12):12;
  el=document.getElementById('vcuv-mpf-duree'); if(el) el.value=c&&c.mpf?(c.mpf.duree_j||4):4;
  var p=document.getElementById('vcuv-mpf-params'); if(p) p.style.display=_vcuvMpfActive?'block':'none';
  _vcuvParcRender();
  el=document.getElementById('vcuv-id'); if(el) el.value=id||'';
  _vcuvStat0=c?(c.statut||'setup'):null;
  _vcuvInjectStatDate(c);
  el=document.getElementById('vcuv-del-btn'); if(el) el.style.display=c?'block':'none';
  _vendInjectCuveFrom(!c);
  var ov=document.getElementById('ovVendCuve'); if(ov) ov.classList.add('open');
}
/* ═════ LE CHAMP « DEPUIS LE » DE LA FICHE — PARC-1 ═════
   Pose sous le select de statut, et VISIBLE SEULEMENT si le statut change :
   corriger un nom n'a aucune date a demander. index.html n'est pas touche —
   meme patron que le champ client de l'overlay recolte. */
var _vcuvStat0=null;
function _vcuvInjectStatDate(c){
  var sel=document.getElementById('vcuv-statut'); if(!sel) return;
  sel.onchange=_vcuvStatChange;
  var row=document.getElementById('vcuv-stdate-row');
  if(!row){
    row=document.createElement('div'); row.id='vcuv-stdate-row';
    row.innerHTML='<div class="fl">Depuis le <span style="font-weight:500;text-transform:none;letter-spacing:0;opacity:.8">\u2014 date du changement d\u2019\u00e9tape</span></div>'
      +'<input type="date" class="fi ac" id="vcuv-stdate">'
      +'<div id="vcuv-stdate-note" style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);margin-top:5px;line-height:1.45"></div>';
    if(sel.parentNode) sel.parentNode.insertBefore(row,sel.nextSibling);
  }
  var d=document.getElementById('vcuv-stdate'); if(d) d.value=_mlAuj();
  row.style.display='none';
  var n=document.getElementById('vcuv-stdate-note'); if(n) n.textContent='';
}
function _vcuvStatChange(){
  var sel=document.getElementById('vcuv-statut'), row=document.getElementById('vcuv-stdate-row');
  if(!sel||!row) return;
  var chg=(_vcuvStat0!=null && sel.value!==_vcuvStat0);
  row.style.display=chg?'block':'none';
  var n=document.getElementById('vcuv-stdate-note');
  if(n) n.textContent=chg
    ? ('Le passage en \u00ab '+_vendStatLbl(sel.value)+' \u00bb sera dat\u00e9 de ce jour. Ce qui pr\u00e9c\u00e8de garde son \u00e9tape.')
    : '';
}
function saveVendCuve() {
  if(!_vendGarde()) return;
  var nom=((document.getElementById('vcuv-nom')||{}).value||'').trim();
  if(!nom){showToast('Saisissez le nom de la cuve','#E07060');return;}
  var vol=parseFloat((document.getElementById('vcuv-volume')||{}).value)||0;
  var date=(document.getElementById('vcuv-date')||{}).value||'';
  var parTxt=((document.getElementById('vcuv-parcelles')||{}).value||'');
  var parcelles=parTxt.split(',').map(function(s){return s.trim();}).filter(Boolean);
  var statut=(document.getElementById('vcuv-statut')||{}).value||'setup';
  var so2=parseFloat((document.getElementById('vcuv-so2')||{}).value)||null;
  var levures=(document.getElementById('vcuv-levures')||{}).value||'indigenes';
  var erasflage=(document.getElementById('vcuv-erasflage')||{}).value||'total';
  var mpfT=parseFloat((document.getElementById('vcuv-mpf-temp')||{}).value)||12;
  var mpfD=parseInt((document.getElementById('vcuv-mpf-duree')||{}).value)||4;
  var id=((document.getElementById('vcuv-id')||{}).value||'');
  var existing=id?(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===id;}):null;
  /* ★ PARC-1 — un changement d'etape se DATE. Le controle passe AVANT
     toute ecriture : un refus doit laisser la fiche intacte. */
  var _stChg=!!(existing && statut!==existing.statut);
  var _stDate=_stChg?(String(((document.getElementById('vcuv-stdate')||{}).value)||'').slice(0,10)||_mlAuj()):'';
  if(_stChg){
    if(date && _stDate<date){ showToast('Le passage est ant\u00e9rieur \u00e0 l\u2019encuvage du '+_vendFrDate(date),'#B85A1A'); return; }
    if(_stDate>_mlAuj()){ showToast('Un passage ne se pose pas dans le futur','#B85A1A'); return; }
  }
  // ⚠️ Dernier filet : la cuve a pu etre prise depuis l'ouverture de la fiche.
  if(_vcuvRef && _caveCuveOcc(_vcuvRef, id||null)){
    var _pk=_caveCuve(_vcuvRef);
    showToast(((_pk&&_pk.nom)||'Cette cuve')+' vient d\u2019\u00eatre prise','#B85A1A'); return;
  }
  var obj={id:id||'vcuv_'+Date.now(),nom:nom,volume_hl:vol,statut:statut,cuve_ref:_vcuvRef||null,parcelles:parcelles,date_entree:date,erasflage:erasflage,so2_g_hl:so2,levures:levures,mpf:{active:_vcuvMpfActive,temp_c:mpfT,duree_j:mpfD},mesures_fa:existing?(existing.mesures_fa||[]):[],decuvage:existing?(existing.decuvage||null):null,
    vol_decuve_hl:existing?(existing.vol_decuve_hl!=null?existing.vol_decuve_hl:null):null,
    /* ★ CUV-14 — d'ou vient ce volume, et depuis quand : rebati de zero, l'objet les perdait. */
    vol_decuve_src:existing?(existing.vol_decuve_src||undefined):undefined,
    vol_decuve_le:existing?(existing.vol_decuve_le||undefined):undefined,
    recolte_ids:existing&&Array.isArray(existing.recolte_ids)?existing.recolte_ids.slice():undefined,
    // ⚠️ `obj` est rebati de zero : sans ces deux lignes, rouvrir la fiche
    //   d'une cuve fusionnee effacerait la fusion. Piege recurrent du projet.
    fusion:existing?(existing.fusion||null):null,
    fusion_src:existing&&Array.isArray(existing.fusion_src)?existing.fusion_src.slice():undefined};
  if(!id && _vcuvFromGrp){
    var _d=_vcuvFromGrp;
    obj.cuvee_src=_d.cuvee; obj.vcuvee_id=_d.id||null; obj.recolte_ids=_d.ids.slice(); obj.nb_caisses=_d.caisses;
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(_d.ids.indexOf(r.id)!==-1) r.cuve_id=obj.id; });
  }
  if(existing&&existing.vcuvee_id&&!obj.vcuvee_id) obj.vcuvee_id=existing.vcuvee_id;
  if(existing&&existing.cuvee_src&&!obj.cuvee_src) obj.cuvee_src=existing.cuvee_src;
  if(existing&&existing.recolte_ids&&!obj.recolte_ids) obj.recolte_ids=existing.recolte_ids.slice();
  if(existing&&existing.nb_caisses!=null&&obj.nb_caisses==null) obj.nb_caisses=existing.nb_caisses;
  /* ⚠⚠ `obj` est rebati de zero : sans cette ligne, rouvrir la fiche
     effacerait tout le parcours. Meme piege que `fusion` juste au-dessus. */
  obj.statut_hist=(existing&&Array.isArray(existing.statut_hist))?existing.statut_hist.slice():[];
  /* Une cuve NEUVE entre dans son etat le jour de l'encuvage : ce n'est pas
     une date inventee, c'est la seule qu'on connaisse, et elle est juste. */
  if(!existing) _vendHistPose(obj,statut,date||_mlAuj());
  else if(_stChg) _vendHistPose(obj,statut,_stDate);
  if(!CAVE_VENDANGE.cuves_vinif) CAVE_VENDANGE.cuves_vinif=[];
  if(id){var idx=CAVE_VENDANGE.cuves_vinif.findIndex(function(c){return c.id===id;});if(idx!==-1)CAVE_VENDANGE.cuves_vinif[idx]=obj;else CAVE_VENDANGE.cuves_vinif.push(obj);}
  else{CAVE_VENDANGE.cuves_vinif.push(obj);}
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(id?'Cuve mise \u00e0 jour':'Cuve cr\u00e9\u00e9e','#3D6B27');
  if(window.closeOv) window.closeOv(null,'ovVendCuve');
  renderVendCuves();
}
function deleteVendCuve() {
  if(!_vendGarde()) return;
  var id=((document.getElementById('vcuv-id')||{}).value||'');
  if(!id) return;
  window.openConfirmDel('Supprimer cette cuve ?','Toutes ses mesures seront également supprimées.',function(){
    CAVE_VENDANGE.cuves_vinif=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){return c.id!==id;});
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.cuve_id===id) r.cuve_id=null; });
    _vendCuvSync();
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('Cuve supprim\u00e9e','#B85A1A');
    if(window.closeOv) window.closeOv(null,'ovVendCuve');
    renderVendCuves();
  });
}
// —— L'historique des releves : sans lui, « corriger » n'a pas de porte ——
function _vendMesHist(c,canEdit){
  var m=_vendTriMes(c);
  if(!m.length) return '';
  var rows=m.slice().reverse().map(function(x){
    var d20=_vendMesD20(x), det=[];
    if(d20!=null&&x.densite!=null&&Math.round(d20)!==Math.round(x.densite)) det.push(Math.round(d20)+' à 20 °C');
    if(x.temp_c!=null) det.push(_vendCuvF1(x.temp_c)+' °C');
    if(x.remontages) det.push(x.remontages+' remont.');
    if(x.pigeages) det.push(x.pigeages+' pigeage'+(x.pigeages>1?'s':''));
    if(x.note) det.push(x.note);
    return '<div class="mvv-hrow"><div class="mvv-hrow-l">'
      +'<div class="mvv-hrow-d">'+_vendFrDate(x.date)+' · <b>'+(x.densite!=null?Math.round(x.densite):'—')+'</b></div>'
      +(det.length?'<div class="mvv-hrow-u">'+_escHtml(det.join(' · '))+'</div>':'')
      +'</div>'
      +(canEdit?'<button class="mv-gh mvv-icbtn" onclick="openOvVendMesure(\''+_escAttr(c.id)+'\',\''+_escAttr(x.id)+'\')" title="Corriger ce relevé" aria-label="Corriger ce relevé">'+_mvIcon('crayon',16)+'</button>':'')
      +'</div>';
  }).join('');
  return '<details class="mvv-histwrap"><summary>'+m.length+' relevé'+(m.length>1?'s':'')
    +' <span class="u">· depuis le '+_vendFrDate(m[0].date)+'</span></summary>'+rows+'</details>';
}
function _vmAdjRem(d){_vmRem=Math.max(0,_vmRem+d);var el=document.getElementById('vm-rem-val');if(el)el.textContent=_vmRem;}
function _vmAdjPig(d){_vmPig=Math.max(0,_vmPig+d);var el=document.getElementById('vm-pig-val');if(el)el.textContent=_vmPig;}
// Le bouton de suppression n'existe pas dans index.html : on le pose ici, comme
// _vendInjectClientField pose le champ client dans l'overlay recolte. Le module
// reste seul touche — donc aucun bump.
function _vmInjectActions(mesId){
  var body=document.querySelector('#ovVendMesure .modal-body');
  if(!body) return;
  _vendEnsureSheetCss();                       // .mvv-del et .mvv-fnote vivent la
  var host=document.getElementById('vm-actions');
  if(!host){ host=document.createElement('div'); host.id='vm-actions'; body.appendChild(host); }
  host.innerHTML = mesId
    ? '<button class="mvv-del" onclick="_vendMesDel()">Supprimer ce relevé</button>'
      +'<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">Corriger la date remet le relevé à sa place dans la courbe et recalcule la fin de fermentation estimée.</div>'
    : '';
}
function openOvVendMesure(cuveId, mesureId) {
  if(!canWrite()) return;
  _vmesureCuveId=cuveId;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  var m=mesureId?_vendTriMes(c).find(function(x){return x.id===mesureId;}):null;
  _vmesureEditId=m?mesureId:null;
  var titleEl=document.getElementById('ov-vend-mes-title');
  if(titleEl) titleEl.textContent=(m?'Corriger le relevé \u2014 ':'Mesure FA \u2014 ')+(c?_escHtml(c.nom):'');
  // ⚠️ Prerempli a la correction, vide a la creation — jamais l'inverse, jamais
  // « ce qui trainait dans le DOM » (§20, defaut 3 : l'analyse rouverte).
  _vmRem=m?(m.remontages||0):2; _vmPig=m?(m.pigeages||0):1;
  var el;
  el=document.getElementById('vm-date'); if(el) el.value=(m&&m.date)||_mvToday();
  el=document.getElementById('vm-densite'); if(el) el.value=(m&&m.densite!=null)?m.densite:'';
  el=document.getElementById('vm-temp'); if(el) el.value=(m&&m.temp_c!=null)?m.temp_c:'';
  el=document.getElementById('vm-rem-val'); if(el) el.textContent=_vmRem;
  el=document.getElementById('vm-pig-val'); if(el) el.textContent=_vmPig;
  el=document.getElementById('vm-note'); if(el) el.value=(m&&m.note)||'';
  _vmInjectActions(_vmesureEditId);
  var ov=document.getElementById('ovVendMesure'); if(ov) ov.classList.add('open');
}
function _vendMesDel(){
  if(!_vendGarde()) return;
  var cuveId=_vmesureCuveId, mesId=_vmesureEditId;
  if(!cuveId||!mesId) return;
  window.openConfirmDel('Supprimer ce relevé ?','La courbe de fermentation et la fin estimée seront recalculées sans lui.',function(){
    var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
    if(!c) return;
    c.mesures_fa=(c.mesures_fa||[]).filter(function(x){return x.id!==mesId;});
    _vmesureEditId=null;
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('Relevé supprimé','#B85A1A');
    if(window.closeOv) window.closeOv(null,'ovVendMesure');
    renderVendCuves();
  });
}
function saveVendMesure() {
  if(!_vendGarde()) return;
  var cuveId=_vmesureCuveId; if(!cuveId) return;
  var densite=parseFloat((document.getElementById('vm-densite')||{}).value)||null;
  if(!densite){showToast('Saisissez la densit\u00e9','#E07060');return;}
  var date=(document.getElementById('vm-date')||{}).value||_mvToday();
  // ⚠️ `parseFloat(...)||null` avalait un 0 : une cuve a 0 °C perdait sa
  // temperature, donc sa correction de densite. Le zero est une valeur.
  var _t=parseFloat((document.getElementById('vm-temp')||{}).value);
  var tempC=isFinite(_t)?_t:null;
  var note=((document.getElementById('vm-note')||{}).value||'');
  var idx=(CAVE_VENDANGE.cuves_vinif||[]).findIndex(function(c){return c.id===cuveId;});
  if(idx===-1) return;
  var cu=CAVE_VENDANGE.cuves_vinif[idx];
  if(!cu.mesures_fa) cu.mesures_fa=[];
  var editId=_vmesureEditId;
  var mesure={id:editId||('vm_'+Date.now()),date:date,densite:densite,temp_c:tempC,remontages:_vmRem,pigeages:_vmPig,note:note};
  var pos=editId?cu.mesures_fa.findIndex(function(x){return x.id===editId;}):-1;
  if(pos!==-1) cu.mesures_fa[pos]=mesure; else cu.mesures_fa.push(mesure);
  _vendTriMes(cu);            // la date vient peut-etre de changer : on range
  _vmesureEditId=null;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(pos!==-1?'Relev\u00e9 corrig\u00e9':'Mesure enregistr\u00e9e','#3D6B27');
  if(window.closeOv) window.closeOv(null,'ovVendMesure');
  renderVendCuves();
}
function _vendSaveParam() {
  if(typeof isAdmin==='function'&&!isAdmin()) return;
  var pck=parseFloat((document.getElementById('vpfi-pck')||{}).value)||25;
  var rMin=parseFloat((document.getElementById('vpfi-rmin')||{}).value)||130;
  var rMax=parseFloat((document.getElementById('vpfi-rmax')||{}).value)||140;
  var spd=parseFloat((document.getElementById('vpfi-spd')||{}).value)||16.83;
  // \u26a0\u26a0\u26a0 CES QUATRE CHIFFRES PILOTENT TOUS LES VOLUMES DE L'APPLICATION, ET
  // RIEN NE LES VERIFIAIT. Les min/max des champs sont des attributs HTML : sans
  // soumission de formulaire, ils ne bloquent rien \u2014 on lisait `.value` sec.
  // ratio_min/ratio_max alimentent `_mlKgHl`, donc `_mlRdtMoyen`, donc le rendement
  // hL/ha, qui est un indicateur reglementaire. Une saisie a cote ne doit pas
  // pouvoir s'enregistrer en silence.
  // \u2605 Et l'ORDRE compte : le ratio est en kg/hL, donc le ratio MAXIMUM donne le
  // volume MINIMUM. Inverser les deux champs est une confusion naturelle, et elle
  // retournait toutes les fourchettes de l'app (\u00ab 15,4\u201314,3 \u00bb). On les remet dans
  // l'ordre plutot que de refuser : le vigneron a saisi deux bornes, on sait
  // lesquelles \u2014 mais on le DIT.
  var _bor=function(v,lo,hi){ return Math.min(hi,Math.max(lo,v)); };
  var _av=[pck,rMin,rMax,spd].join('|');
  pck=_bor(pck,10,60); rMin=_bor(rMin,80,200); rMax=_bor(rMax,80,200); spd=_bor(spd,15,20);
  var _inv=(rMin>rMax);
  if(_inv){ var _t=rMin; rMin=rMax; rMax=_t; }
  var _corr=(_av!==[pck,rMin,rMax,spd].join('|'));
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config={};
  CAVE_VENDANGE.config.poids_caisse_kg=pck;
  CAVE_VENDANGE.config.ratio_min=rMin;
  CAVE_VENDANGE.config.ratio_max=rMax;
  CAVE_VENDANGE.config.sucre_par_degre=spd;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(_inv?'Ratios remis dans l\u2019ordre \u00b7 min '+rMin+', max '+rMax
                  :(_corr?'Param\u00e8tres enregistr\u00e9s \u00b7 valeur(s) ramen\u00e9e(s) aux bornes'
                         :'Param\u00e8tres enregistr\u00e9s'),
              (_inv||_corr)?'#B85A1A':'#3D6B27');
  renderVendParam();
}

// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2 — densité @20°C · opérations cuve · clients vrac · décuvage → Chai
// (cave.js seul — CSS injecté en JS, bottom-sheets construits en JS)
// ═══════════════════════════════════════════════════════════════════════════

function _vendEnsureSheetCss(){
  if(document.getElementById('mvv-sheet-css')) return;
  var s=document.createElement('style'); s.id='mvv-sheet-css';
  s.textContent=`
.mvv-ov{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.58);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.mvv-ov.open{opacity:1;pointer-events:auto}
.mvv-sheet{width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.12);border-bottom:none;border-radius:24px 24px 0 0;padding:18px 17px calc(20px + env(safe-area-inset-bottom,0px));color:var(--texte,#1A1A14);transform:translateY(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);font-family:inherit;box-shadow:0 -12px 40px rgba(20,17,13,.22)}
.mvv-ov.open .mvv-sheet{transform:translateY(0)}
.mvv-sheet *{box-sizing:border-box}
.mvv-sheet-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:4px}
.mvv-sheet-t{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-lg,23px);color:var(--texte,#1A1A14);line-height:1.1}
.mvv-sheet-x{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.18);color:var(--texte-doux,#5F5F5F);width:38px;height:38px;border-radius:10px;font-size:var(--pt-base,14px);cursor:pointer;flex-shrink:0}
.mvv-sheet-sub{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);line-height:1.5;margin-bottom:6px}
.mvv-flbl{display:block;font-size:var(--pt-micro,11px);letter-spacing:.8px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:700;margin:14px 0 6px}
.mvv-fhint{text-transform:none;letter-spacing:0;color:var(--texte-doux,#5F5F5F);font-weight:400}
.mvv-tin{width:100%;background:#fff;border:1px solid rgba(138,90,56,.3);border-radius:11px;padding:11px 13px;color:var(--texte,#1A1A14);font-size:var(--pt-base,14px);font-weight:500;font-family:inherit}
.mvv-tin:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.12)}
.mvv-fnote{font-size:var(--pt-micro,11px);color:#8A4212;margin-top:8px;line-height:1.45}
.mvv-step2{display:flex;align-items:center;gap:12px;margin-top:4px}
.mvv-step2-b{width:44px;height:44px;border-radius:12px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.28);color:var(--terre,#8A5A38);font-size:var(--pt-lg,23px);font-weight:700;cursor:pointer;line-height:1}
.mvv-step2-v{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-xxl,31px);color:var(--texte,#1A1A14);min-width:44px;text-align:center}
.mvv-step2-u{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F)}
.mvv-optabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px}
.mvv-optab{border:1px solid rgba(138,90,56,.2);background:transparent;color:var(--texte-med,#4A4A3A);border-radius:10px;padding:9px 12px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;font-family:inherit;min-height:40px}
.mvv-optab.on{background:var(--cave,#14110D);border-color:var(--cave,#14110D);color:#F0E2C8}
.mvv-bigcalc{margin-top:14px;background:var(--terre-pale,#F3EADF);border:1px solid rgba(138,90,56,.18);border-radius:14px;padding:15px;text-align:center}
.mvv-bigcalc-n{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-hero,40px);line-height:1;color:var(--terre,#8A5A38)}
.mvv-bigcalc-l{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:6px}
.mvv-bigcalc-cum{font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);margin-top:9px;min-height:0}
.mvv-clrow{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.12);border-radius:12px;padding:11px 13px;margin-bottom:8px}
.mvv-clrow-nm{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14)}
.mvv-clrow-mt{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-clrow-r{display:flex;gap:6px;flex-shrink:0}
.mvv-icbtn{width:40px;height:40px;border-radius:10px;background:#fff;border:1px solid rgba(138,90,56,.18);color:var(--texte-doux,#5F5F5F);font-size:var(--pt-base,14px);cursor:pointer}
.mvv-cllist{margin-top:4px}
.mvv-del{width:100%;padding:12px;border-radius:11px;background:var(--rouge-pale,#FAEAE8);border:1px solid rgba(160,41,30,.28);color:var(--rouge-tx,#A0291E);font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;margin-top:10px;font-family:inherit;min-height:44px}
.mvv-save.ghost2{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.24);color:var(--terre,#8A5A38)}
.mvv-actrow{display:flex;gap:8px;margin-top:9px}
.mvv-act2{flex:1;padding:11px;border-radius:10px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;font-family:inherit;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.2);color:var(--terre,#8A5A38);min-height:44px}
.mvv-act2.dec{background:rgba(200,106,78,.10);border-color:rgba(200,106,78,.32);color:#B0412C}
.mvv-opslist{margin-top:10px;font-size:var(--pt-micro,11px);color:var(--texte-med,#4A4A3A);background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);border-radius:9px;padding:7px 10px}
.mvv-opslist .u,.mvv-histwrap>summary .u{color:var(--texte-doux,#5F5F5F);font-weight:400}
.mvv-decwrap{margin-top:16px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);border-radius:12px;padding:2px 12px 8px}
.mvv-decsum{font-size:var(--pt-micro,11px);letter-spacing:1.5px;text-transform:uppercase;color:var(--texte-doux,#5F5F5F);font-weight:600;padding:11px 2px;cursor:pointer;list-style:none}
.mvv-decsum::-webkit-details-marker{display:none}
.mvv-decrow{display:flex;justify-content:space-between;gap:10px;font-size:var(--pt-txt,12.5px);color:var(--texte-med,#4A4A3A);padding:7px 2px;border-top:1px solid rgba(138,90,56,.10)}
.mvv-decrow .u{color:var(--texte-doux,#5F5F5F)}
.mvc-fa-line{display:flex;align-items:center;gap:6px;margin:7px 0 2px;padding:6px 9px;border-radius:9px;background:rgba(200,106,78,.12);color:#A8452C;font-size:var(--pt-micro,11px);line-height:1.4}
.mvc-fut-line{display:flex;align-items:center;gap:6px;margin:7px 0 2px;padding:6px 9px;border-radius:9px;background:rgba(138,90,56,.08);color:var(--texte-med,#4A4A3A);font-size:var(--pt-micro,11px);line-height:1.4}
.mvv-decfa{display:inline-block;margin-left:7px;padding:1px 7px;border-radius:8px;background:rgba(200,106,78,.14);color:#C86A4E;font-weight:700;font-size:var(--pt-nano,9.5px);letter-spacing:.3px;text-transform:uppercase}
.mvv-histwrap{margin-top:10px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.10);border-radius:9px;padding:0 10px 6px}
.mvv-histwrap>summary{font-size:var(--pt-micro,11px);letter-spacing:0;text-transform:none;color:var(--texte-med,#4A4A3A);font-weight:600;padding:8px 0}
.mvv-hrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid rgba(138,90,56,.10)}
.mvv-hrow-l{min-width:0;flex:1}
.mvv-hrow-d{font-size:var(--pt-txt,12.5px);color:var(--texte,#1A1A14)}
.mvv-hrow-u{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px;line-height:1.4}
.mvv-hrow .mvv-icbtn{width:34px;height:34px;flex-shrink:0}
.mvv-degchip{display:inline-block;font-size:var(--pt-lbl,10.5px);font-weight:600;color:var(--ink-info,#4A9FC8);background:rgba(74,159,200,.10);border:1px solid rgba(74,159,200,.26);border-radius:8px;padding:2px 7px;margin-left:6px}
`;
  document.head.appendChild(s);
}

// —— Densité corrigée à 20 °C (table Véron / OIV) ——
var _VEND_DCORR={10:-2.5,11:-2.5,12:-2.0,13:-2.0,14:-1.5,15:-1.5,16:-1.0,17:-1.0,18:-0.5,19:-0.5,20:0,21:0.5,22:0.5,23:1.0,24:1.0,25:1.5,26:1.5,27:2.0,28:2.0,29:2.5,30:2.5};
function _vendCorrTerm(t){
  if(t==null||isNaN(t)) return 0;
  if(t<=10) return -2.5+(t-10)*0.25;   // extrapolation ±0,25/°C
  if(t>=30) return 2.5+(t-30)*0.25;
  var lo=Math.floor(t),hi=Math.ceil(t);
  if(lo===hi) return _VEND_DCORR[lo];
  return _VEND_DCORR[lo]+(_VEND_DCORR[hi]-_VEND_DCORR[lo])*(t-lo);
}
function _vendD20(densite,temp){
  if(densite==null) return densite;
  if(temp==null||isNaN(temp)) return densite;         // pas de température → densité brute
  return densite+_vendCorrTerm(temp)-_vendCorrTerm(20); // C(20)=0
}
function _vendMesD20(m){ return m?_vendD20(m.densite,m.temp_c):null; }
/* Le sucre d'un MOUT, lu sur sa densite. Vrai AVANT la fermentation, et la
   seulement : dans une cuve qui fermente, l'alcool a deja fait descendre la
   densite. Pour le sucre qui reste en cours de FA, c'est _vendSucreRest. */
function _vendSucre(d20){ if(d20==null) return 0; return Math.max(0,2.564*d20-2581.5); }

/* ═══════════════════════════════════════════════════════════════════════════
   CUV-8 — LE SEUIL DU VIN SEC APPARTIENT A LA CUVE, PAS A L'APPLICATION
   ═══════════════════════════════════════════════════════════════════════════
   Un seul nombre servait de « vin sec » pour tout le monde : 996. Ce nombre
   n'existe pas. La densite d'un vin sec depend de son ALCOOL, donc du sucre
   qu'il y avait dans le mout. Table IFV Occitanie (mutage des vins doux), lue
   a l'envers : a densite donnee, le sucre restant depend du degre potentiel du
   mout AVANT mise en fermentation.
     - la densite a sucre nul vaut 1007,18 - 1,101 x degre potentiel ;
     - c'est CE point-la qui est bien cale dans la table, et c'est le seul
       qu'on lui emprunte.
   ⚠⚠ LA PENTE DE LA TABLE (2,59 g/L par point) N'A PAS ETE REPRISE. Elle est
     vraie autour de 0,990-1,040, la ou la table a ete faite, et FAUSSE des
     qu'on l'etire jusqu'au mout : prolongee a 1092, elle annonce 257 g/L la
     ou le mout en porte 218. La pente utilisee ici sort d'un bilan de
     matiere, exact aux deux bouts : le sucre passe de S0 au mout a zero a la
     densite ci-dessus, et un gramme de sucre qui part enleve a la fois son
     propre poids (1/2,564 point) et celui de l'alcool qu'il fabrique
     (1,101/spd point). Soit spd / (spd/2,564 + 1,101) = 2,20 g/L par point
     avec le reglage par defaut. Un harnais du cahier de cuverie a attrape
     l'ecart : il attendait 218 g/L sur un mout a 1092, la pente de la table
     en rendait 257.
   Un mout a 12 deg est sec vers 994, un mout a 14 deg vers 992. Avec 996 pour
   tout le monde, l'ecran declarait sec un vin qui portait encore 5,7 g/L sur
   un millesime chaud, et refusait de declarer sec un vin a 1 g/L sur un
   millesime leger. Les DEUX erreurs, dans la meme constante.

   ⚠ CE N'EST QU'UNE ESTIMATION. Le seul verdict est l'analyse : sucres
     reducteurs sous 2 g/L. L'ecran ecrit « seuil estime », jamais « sec »
     comme un fait mesure.
   ⚠⚠ LE DEGRE POTENTIEL N'EST JAMAIS INVENTE. Trois sources, dans cet ordre :
       1. le premier releve de la cuve, s'il est encore un mout (>= 1050) ;
       2. a defaut, les controles de maturite des parcelles de la cuve ;
       3. a defaut, RIEN — et la cuve retombe sur le seuil general (996), en
          le disant.
     Une chaptalisation datee ajoute ses degres dans les trois cas.
   ⚠ `_cmpVigne` est appele par `typeof` : les harnais qui extraient une
     poignee de fonctions n'ont pas a monter toute la chaine des maturites
     pour eprouver un seuil.
*/
var _VEND_SEC_A   = 1007.18;   // densite a sucre nul = A - B x degre potentiel
var _VEND_SEC_B   = 1.101;
var _VEND_SEC_G   = 2;         // g/L : le seuil oenologique du vin sec
var _VEND_D_MOUT  = 1050;      // en dessous, un releve n'est plus un mout
/* La pente suit le reglage « sucre par degre » de la cave : la changer sans
   changer la pente ferait mentir les deux ecrans qui l'affichent. */
function _vendSucPente(){
  var spd=_vendCfg().sucre_par_degre||16.83;
  return spd/(spd/2.564+_VEND_SEC_B);
}

/* Les relevés portant une densite, dans l'ordre des dates. */
function _vendMesD(c){
  return (((c&&c.mesures_fa)||[]).filter(function(m){ return m&&m.date&&m.densite!=null; })
    .slice().sort(function(a,b){ return a.date<b.date?-1:1; }));
}
function _vendD0(c){ var m=_vendMesD(c); return m.length?_vendMesD20(m[0]):null; }
/* Les degres apportes par les chaptalisations DATEES de la cuve. */
function _vendChaptDeg(c){
  return ((c&&c.operations)||[]).reduce(function(s,o){
    var d=(o&&o.type==='chaptalisation')?parseFloat(o.degre):0;
    return s+((d>0)?d:0);
  },0);
}
/* Le degre potentiel du mout avant FA, chaptalisation comprise. null = inconnu. */
function _vendDPot(c){
  if(!c) return null;
  var spd=_vendCfg().sucre_par_degre||16.83;
  var base=null, d0=_vendD0(c);
  if(d0!=null&&d0>=_VEND_D_MOUT) base=_vendSucre(d0)/spd;
  if(base==null&&typeof _cmpVigne==='function'){
    var vg=null; try{ vg=_cmpVigne(c); }catch(e){ vg=null; }
    if(vg&&vg.suc>0) base=vg.suc/spd;
  }
  if(!(base>0)) return null;
  return base+_vendChaptDeg(c);
}
/* La densite a 20 C a laquelle CETTE cuve n'a plus de sucre du tout. */
function _vendDZero(c){
  var dp=_vendDPot(c);
  return (dp==null)?null:(_VEND_SEC_A-_VEND_SEC_B*dp);
}
/* La densite a 20 C sous laquelle CETTE cuve est seche (2 g/L). */
function _vendDSec(c){
  var dz=_vendDZero(c);
  if(dz==null) return (_ML_D20_SEC||996);
  var d=dz+_VEND_SEC_G/_vendSucPente();
  return Math.round(Math.max(984,Math.min(999,d))*10)/10;
}
/* Le seuil ecrit, et d'ou il vient. Un seuil sans provenance se croit. */
function _vendDSecTxt(c){
  var dp=_vendDPot(c), d=_vendDSec(c);
  return (Math.round(d*10)/10).toString().replace('.',',')
    +(dp==null?' (seuil g\u00e9n\u00e9ral)':' (mo\u00fbt \u00e0 '+(Math.round(dp*10)/10).toString().replace('.',',')+'\u00b0)');
}
/* Le sucre encore fermentescible a cette densite, DANS CETTE CUVE. */
function _vendSucreRest(c,d20){
  if(d20==null) return 0;
  var dz=_vendDZero(c);
  if(dz==null) return _vendSucre(d20);
  return Math.max(0,_vendSucPente()*(d20-dz));
}

/* ═══════════════════════════════════════════════════════════════════════════
   CUV-9 — LA FERMENTATION CONTINUE APRES LE DECUVAGE
   ═══════════════════════════════════════════════════════════════════════════
   Decuver avant la fin de la FA est une pratique, pas un accident : on ecoule
   tot pour arreter l'extraction du marc, et la fermentation se termine EN
   PHASE LIQUIDE dans le contenant d'arrivee. L'application, elle, fermait le
   dossier au decuvage : plus de bouton pour relever, la cuve disparaissait de
   la tournee, et le comparatif la laissait « pas encore » seche pour toujours.
   ⚠ LE STATUT NE CHANGE PAS. La cuve est decuvee, son parcours est clos
     (§81, PARC-1) : corriger une date ne doit pas la rouvrir. Ce qui continue,
     c'est la SERIE de densites — la meme, jamais une seconde.
   ⚠ Une cuve FUSIONNEE ne suit rien : son vin est ailleurs, sous un autre nom.
*/
function _vendDecuvee(c){ return !!(c&&c.decuvage&&c.decuvage.date); }
/* ★★★ CUV-10 — LE DECUVAGE EST UN FAIT CONSTATE, PAS UNE DENSITE COMPAREE.
   Ce predicat comparait la derniere densite a un seuil calcule. Faux ici :
   chez ce domaine LA FA FINIT EN CUVE, et sortir le marc, c'est avoir constate
   que c'etait fini. Nico, 12/09 : « il n'y a pas de seuil, c'est fini plus ou
   moins en fonction de l'etat de ce qu'il y a dans la cuve et de ce qu'on
   goute ». Le seuil declarait donc « en fermentation » quatre cuves finies.
   ⚠ SEULE la case decochee au decuvage arme ce predicat. Aucun chiffre.
   ⚠⚠ PAS DE BACKFILL (regle PARC-1) : une cuve decuvee AVANT ce lot n'a pas de
     `fa_finie`. Elle n'est donc ni « en FA » ni « declaree finie » — l'ecran
     dit « decuvee le … », ce qui est vrai, sans pretendre savoir le reste. */
function _vendFaEnCours(c){
  if(!_vendDecuvee(c)||_vendEstFusionnee(c)) return false;
  return c.decuvage.fa_finie===false;
}
/* Le jour ou la cuve est passee sous son REPERE de densite. Jamais interpole,
   jamais devine — et ce n'est PAS un verdict de fin de FA : c'est un reperage
   de courbe, que la degustation confirme ou non (§117). */
function _vendJourSec(c){
  var ds=_vendDSec(c), m=_vendMesD(c);
  for(var i=0;i<m.length;i++) if(_vendMesD20(m[i])<=ds) return m[i].date;
  return null;
}
/* ★★★ CUV-13 — PRESSURER N'EST PAS DECUVER.
   Nico, 15/09 : « quand on est au decuvage, on remet le jus dans une autre
   cuve, surtout quand il reste du sucre, pour qu'il finisse la fermentation ;
   une fois finie, on la met en tonneau. » L'etape du parcours (cle
   'decuvage', libelle « Pressurage ») n'etait ni active ni decuvee : la cuve
   perdait « Saisir une mesure », sa ligne de tournee et toute relance,
   exactement au moment ou le jus finit de fermenter hors du marc.
   Reponse de Nico a la question « acceptee ou reclamee ? » : RECLAMEE. La
   cuve pressuree rentre donc dans `_vendSuivie` — tournee, cuves a mesurer,
   badge — et, par la meme, dans `_vendMesurable`.
   ⚠⚠ LE DECUVAGE RESTE UN FAIT (§118) : une cuve qui porte `decuvage.date` est
     gouvernee par sa reponse `fa_finie`, pas par l'etape. Le formulaire
     « Modifier » permet de reposer 'decuvage' sur une cuve deja decuvee :
     elle ne doit PAS revenir dans la tournee pour autant.
   ⚠ Une cuve FUSIONNEE ne suit rien : son vin est ailleurs, sous un autre nom.
   ⚠ `_vendIsActive` NE BOUGE PAS : « en fermentation » (filtre, KPI, fin de FA
     estimee) garde son sens. Meme patron que CUV-9 pour `_vendFaEnCours`. */
function _vendPressee(c){
  return !!c && c.statut==='decuvage' && !_vendDecuvee(c) && !_vendEstFusionnee(c);
}
/* La cuve est-elle encore suivie ? En FA, decuvee avec du sucre, ou pressuree
   (CUV-13 : le jus finit peut-etre sa fermentation dans une autre cuve). */
function _vendSuivie(c){ return _vendIsActive(c)||_vendFaEnCours(c)||_vendPressee(c); }
/* ★★★ CUV-11 — POUVOIR RELEVER N'EST PAS DEVOIR RELEVER.
   `_vendSuivie` dit qui l'application RECLAME : la tournee, l'agenda, le badge
   « a mesurer ». Il n'a jamais eu a dire qui elle ACCEPTE. Les deux etaient
   confondus, et c'est le defaut que Nico decrit : une cuve decuvee n'avait
   plus aucune porte pour un releve — ni bouton dans son detail, ni champ dans
   la tournee — alors que le vin, lui, continue d'exister, de se gouter et de
   se mesurer.
   ⚠ LE CAS COURANT ETAIT LE PLUS FERME : depuis §118 la feuille de decuvage
     coche « terminee en cuve » d'avance, donc `_vendFaEnCours` est faux, donc
     plus rien. Et une cuve decuvee AVANT §118 n'a pas de `fa_finie` du tout.
   ⚠⚠ CE PREDICAT N'ARME RIEN. Il ouvre une porte, il ne pose aucune relance :
     une cuve declaree finie au decuvage ne revient PAS dans la tournee, et un
     releve ne rouvre aucune fermentation — le decuvage est un FAIT (§118), un
     chiffre ne le contredit pas.
   ⚠ Une cuve FUSIONNEE reste dehors : son vin est ailleurs, sous un autre nom. */
function _vendMesurable(c){
  if(!c||_vendEstFusionnee(c)) return false;
  /* ★ CUV-13 : ce qui est RECLAME doit etre ACCEPTE — suivie ⇒ mesurable.
     La cuve pressuree est reclamee (`_vendSuivie`), elle est donc ici aussi. */
  return _vendIsActive(c)||_vendDecuvee(c)||_vendPressee(c);
}
/* ★★ CUV-10 — LA DENSITE DE MISE EN FUT. Au decuvage on PRESSE pour extraire
   les jus restes dans les raisins, et le pressurage RELARGUE du sucre : la
   densite de la masse remonte par rapport au vin de goutte. La valeur qui
   compte pour la suite est donc celle de la masse assemblee, goutte + presse,
   au moment de l'entonnage. Elle n'existait nulle part.
   ⚠ Elle ne rejoint PAS `mesures_fa` : ce n'est pas un releve de cuve, c'est
     le point de fermeture de la cuve et d'ouverture de la cuvee. L'y verser
     ferait remonter la courbe de fermentation sans qu'aucune chaptalisation
     ne l'explique (§20, piege connu). */
function _vendDecD20(c){
  var d=c&&c.decuvage; if(!d||d.densite_fut==null) return null;
  return _vendD20(d.densite_fut,(d.temp_fut!=null)?d.temp_fut:null);
}

// —— Clients vrac + poids récolte ——
function _vendClients(){ if(!CAVE_VENDANGE.clients) CAVE_VENDANGE.clients=[]; return CAVE_VENDANGE.clients; }
function _vendClient(nom){ if(!nom) return null; return _vendClients().find(function(c){return c.nom===nom;})||null; }

// ═══════════════════════════════════════════════════════════════════════════
// VD-1 — UNE RÉCOLTE, PLUSIEURS DESTINATAIRES
// ═══════════════════════════════════════════════════════════════════════════
// Une parcelle de Côte de Nuits se vend souvent à plusieurs négoces à la fois.
// Le modèle ne portait qu'UN destinataire (`vendu` + `client`), ce qui obligeait
// à saisir deux récoltes le même jour sur la même parcelle — et faisait compter
// la parcelle deux fois partout où on la compte une fois.
//
// Une récolte porte désormais `parts[]` : une ligne par destinataire.
//   part = { dom:true }                                    → vinifié au domaine
//   part = { dom:false, client:'Maison Bouchard' }          → vendu en vrac
//   + caisses, pck (kg par caisse), surface (ha, optionnel)
//
// ⚠️ `pck` EST FIGÉ DANS LA PART. Avant ce lot, `_vendRecPck` relisait la fiche
// client à chaque affichage : corriger un client de 24 à 26 kg déplaçait
// rétroactivement TOUS les kilos qu'il avait déjà reçus, y compris ceux d'un
// bon déjà signé. Le poids change d'un jour à l'autre — la fiche client ne fait
// plus que le PROPOSER à la saisie.
//
// ⚠️ RÉTROCOMPATIBILITÉ DANS LES DEUX SENS. `_vendParts()` fabrique la part
// unique d'une récolte d'avant le lot (lecture seule, rien n'est réécrit tant
// que la récolte n'est pas rouverte), et `saveVendRec` continue d'écrire
// `nb_caisses`, `vendu` et `client` — Pilotage, les documents et les écrans non
// repris par ce lot les lisent encore.
// ═══════════════════════════════════════════════════════════════════════════

// Poids par caisse d'une récolte de l'ANCIEN modèle : la fiche client, comme
// avant. Sert uniquement à fabriquer la part de migration.
function _vendPckLegacy(r){
  var cl=_vendClient(r&&r.client);
  return (cl&&cl.poids_caisse_kg)||_vendCfg().poids_caisse_kg||25;
}
function _vendParts(r){
  if(!r) return [];
  if(Array.isArray(r.parts)&&r.parts.length) return r.parts;
  var vendu=!!(r.vendu||r.client);
  return [{dom:!vendu, client:vendu?(r.client||''):'', caisses:(r.nb_caisses||0),
           pck:_vendPckLegacy(r), _mig:true}];
}
function _vpPck(p){ var v=Number(p&&p.pck); return v>0?v:(_vendCfg().poids_caisse_kg||25); }
function _vpCs(p){ return Math.max(0,parseInt(p&&p.caisses,10)||0); }
function _vpKg(p){ return _vpCs(p)*_vpPck(p); }
function _vpNom(p){ return (p&&p.dom)?'Domaine':((p&&p.client)||'Vrac sans client'); }
function _vpSurf(p){ var v=parseFloat(p&&p.surface); return v>0?v:0; }

function _recKg(r){ return _vendParts(r).reduce(function(s,p){ return s+_vpKg(p); },0); }
function _recCaisses(r){ return _vendParts(r).reduce(function(s,p){ return s+_vpCs(p); },0); }
function _recKgDom(r){ return _vendParts(r).reduce(function(s,p){ return s+(p.dom?_vpKg(p):0); },0); }
function _recCsDom(r){ return _vendParts(r).reduce(function(s,p){ return s+(p.dom?_vpCs(p):0); },0); }
function _recKgCli(r){ return _vendParts(r).reduce(function(s,p){ return s+(p.dom?0:_vpKg(p)); },0); }
// Une récolte alimente le cuvier si une part domaine porte des caisses.
function _recHasDom(r){ return _vendParts(r).some(function(p){ return p.dom&&_vpCs(p)>0; }); }
// ...et elle est vendue, au moins en partie, si une part client en porte.
function _recSold(r){ return _vendParts(r).some(function(p){ return !p.dom&&_vpCs(p)>0; }); }
// Kilos livrés à UN client nommé, sur une récolte.
function _recKgPour(r,nom){
  return _vendParts(r).reduce(function(s,p){ return s+((!p.dom&&(p.client||'')===nom)?_vpKg(p):0); },0);
}
// Les destinataires d'une récolte, dans l'ordre de saisie.
function _recDests(r){ return _vendParts(r).filter(function(p){ return _vpCs(p)>0; }); }

// ── La répartition à la saisie (cave.js seul : rien à changer dans index.html) ──
// Le compteur d'origine `#vrec-caisses` n'est pas supprimé : il est masqué et
// tenu à jour avec les caisses DU DOMAINE. Tout le code de cuverie qui le lit
// (proposition de volume, rattachement à une cuve) continue donc de marcher, et
// lit exactement ce qu'il doit lire : ce qui entre au cuvier, pas ce qui part.
var _vrep=[];
function _vendRepCss(){
  if(document.getElementById('mvv-rep-css')) return;
  var st=document.createElement('style'); st.id='mvv-rep-css';
  st.textContent=''
  +'.vrp{border:1px solid rgba(138,90,56,.16);border-radius:14px;overflow:hidden;background:var(--bg-card,#FBFAF6)}'
  +'.vrp-l{padding:11px 12px;border-bottom:1px solid rgba(138,90,56,.10)}'
  +'.vrp-l:last-child{border-bottom:none}'
  +'.vrp-l.dom{background:rgba(61,107,39,.045)}'
  +'.vrp-h{display:flex;align-items:center;gap:8px}'
  +'.vrp-d{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:var(--or,#C2A14D)}'
  +'.vrp-l.dom .vrp-d{background:var(--vert-med,#3D6B27)}'
  +'.vrp-h select{flex:1;min-width:0;padding:7px 9px;font-size:var(--pt-txt,12.5px);font-weight:600;border-radius:8px;'
    +'border:1px solid rgba(138,90,56,.18);background:var(--bg-app,#F2EFE7);font-family:Outfit,sans-serif;color:var(--texte,#1A1A14)}'
  +'.vrp-x{width:30px;height:30px;flex-shrink:0;border:none;background:rgba(160,41,30,.07);color:var(--rouge,#A0291E);'
    +'border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center}'
  +'.vrp-r{display:flex;align-items:center;gap:7px;margin-top:9px;flex-wrap:wrap}'
  +'.vrp-st{display:flex;align-items:center;gap:5px}'
  +'.vrp-st button{width:34px;height:34px;border-radius:9px;background:rgba(192,132,90,.12);'
    +'border:1px solid rgba(192,132,90,.22);color:var(--terre,#8A5A38);font-size:var(--pt-sm,17px);cursor:pointer;font-weight:600}'
  +'.vrp-st input{width:58px;height:34px;text-align:center;border-radius:9px;border:1px solid var(--gris,#DED7C9);'
    +'background:var(--bg-card,#FBFAF6);font-family:Outfit,sans-serif;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14)}'
  +'.vrp-u{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F)}'
  +'.vrp-p{display:flex;align-items:center;gap:5px;margin-left:auto}'
  +'.vrp-p input{width:52px;height:30px;text-align:center;border-radius:8px;border:1px solid var(--gris,#DED7C9);'
    +'background:var(--bg-card,#FBFAF6);font-family:Outfit,sans-serif;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte,#1A1A14)}'
  +'.vrp-s{display:flex;align-items:center;gap:6px;margin-top:9px;padding-top:9px;'
    +'border-top:1px dashed rgba(138,90,56,.16);flex-wrap:wrap}'
  +'.vrp-s input{width:80px;height:30px;text-align:center;border-radius:8px;border:1px solid var(--gris,#DED7C9);'
    +'background:var(--bg-card,#FBFAF6);font-family:Outfit,sans-serif;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte,#1A1A14)}'
  +'.vrp-s .rs{flex:1;text-align:right;font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);min-width:100px}'
  +'.vrp-s .rs b{color:var(--terre,#8A5A38);font-weight:600}'
  +'.vrp-kg{display:flex;align-items:baseline;justify-content:space-between;margin-top:8px;gap:8px}'
  +'.vrp-kg .v{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:var(--pt-md,20px);color:var(--terre,#8A5A38)}'
  +'.vrp-kg .v small{font-size:var(--pt-lbl,10.5px);font-family:Outfit,sans-serif;font-weight:600;color:var(--texte-doux,#5F5F5F);margin-left:3px}'
  +'.vrp-tag{font-size:var(--pt-nano,9.5px);font-weight:600;border-radius:7px;padding:3px 7px;display:inline-block}'
  +'.vrp-tag.d{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}'
  +'.vrp-tag.r{background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.16);color:var(--texte-med,#4A4A3A)}'
  +'.vrp-tag.p{background:rgba(184,90,26,.10);border:1px solid rgba(184,90,26,.28);color:var(--orange,#B85A1A)}'
  +'.vrp-add{width:100%;padding:11px;border:1px dashed rgba(138,90,56,.35);background:rgba(194,161,77,.05);'
    +'color:var(--terre,#8A5A38);border-radius:12px;font-family:Outfit,sans-serif;font-size:var(--pt-txt,12.5px);font-weight:600;'
    +'cursor:pointer;margin-top:10px}'
  +'.vrp-add:disabled{opacity:.45;cursor:default}'
  +'.vrp-tot{background:var(--cave,#14110D);border-radius:12px;padding:11px 13px;margin-top:10px;color:#F0E8DC}'
  +'.vrp-tot-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}'
  +'.vrp-tot-n{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:var(--pt-md,20px);line-height:1;color:#F5EFE3}'
  +'.vrp-tot-n small{font-size:var(--pt-nano,9.5px);font-family:Outfit,sans-serif;font-weight:600;color:rgba(240,232,220,.5);margin-left:3px}'
  +'.vrp-tot-l{font-size:var(--pt-nano,9.5px);letter-spacing:.09em;text-transform:uppercase;color:rgba(240,232,220,.45);margin-top:4px}'
  +'.vrp-tot-d{margin-top:9px;padding-top:8px;border-top:1px solid rgba(240,232,220,.13);'
    +'font-size:var(--pt-lbl,10.5px);line-height:1.6;color:rgba(240,232,220,.75)}'
  +'.vrp-tot-d b{color:var(--or-clair,#D8BC72);font-weight:600}';
  document.head.appendChild(st);
}
// Masque un élément d'index.html sans le supprimer : le code qui le lit reste bon.
// ⚠️⚠️⚠️ CE QUI EST MASQUÉ SE DÉCIDE UNE SEULE FOIS, ET SE MARQUE.
//   Version d'origine : on retrouvait le libellé « Nombre de caisses » par
//   `rowCs.previousElementSibling`. Or le bloc de répartition s'insère JUSTE
//   AVANT cette même ligne — il DEVIENT donc le voisin précédent. À la
//   deuxième ouverture de l'écran, ce « libellé » n'était plus le libellé :
//   c'était le bloc lui-même, et il se masquait tout seul. L'écran se vidait
//   de sa répartition, de sa destination et de ses caisses à la fois.
//   ★ Vécu en production le 24/08, invisible à la première ouverture.
//   La parade n'est pas de mieux viser : c'est de ne plus RE-viser. Les
//   éléments à cacher sont marqués au premier passage, quand le voisinage est
//   encore intact, et c'est la marque qu'on relit ensuite.
function _vendRepHide(el){
  if(!el||el.id==='vrec-rep') return;
  el.setAttribute('data-vd-off','1'); el.style.display='none';
}
function _vendRepInject(rec){
  _vendRepCss();
  var elC=document.getElementById('vrec-caisses'); if(!elC) return;
  var rowCs=elC.parentNode;                     // le rang [−][input][+]
  var box=document.getElementById('vrec-rep');
  if(!box){
    // Premier passage : le voisinage d'origine est intact, c'est le SEUL
    // moment où l'on peut désigner sans se tromper.
    _vendRepHide(rowCs);
    _vendRepHide(rowCs?rowCs.previousElementSibling:null);   // « Nombre de caisses »
    var vw0=document.getElementById('vrec-vendu-wrap');
    _vendRepHide(vw0);
    _vendRepHide(vw0?vw0.previousElementSibling:null);       // « Destination »
    box=document.createElement('div'); box.id='vrec-rep'; box.style.marginBottom='12px';
    if(rowCs&&rowCs.parentNode) rowCs.parentNode.insertBefore(box,rowCs);
  } else {
    // Passages suivants : on relit la marque, on ne redésigne rien.
    var off=document.querySelectorAll('[data-vd-off]');
    for(var z=0;z<off.length;z++) off[z].style.display='none';
  }
  // ⚠️ Et on réaffirme que NOTRE bloc, lui, se voit : cela répare aussi un
  //   écran déjà éteint par la version fautive, sans rien avoir à recharger.
  box.style.display='';
  _vrep=(_vendParts(rec)||[]).map(function(p){
    return {dom:!!p.dom, client:p.client||'', caisses:_vpCs(p), pck:_vpPck(p),
            surface:_vpSurf(p)||null, retour:p.retour||null};
  });
  if(!_vrep.length) _vrep=[{dom:true,client:'',caisses:0,pck:_vendCfg().poids_caisse_kg||25,surface:null,retour:null}];
  _vendRepRender();
}
// Les clients encore disponibles : un même client ne prend pas deux lignes.
function _vendRepLibres(cur){
  var pris={}; _vrep.forEach(function(p){ if(!p.dom&&p.client) pris[p.client]=1; });
  return _vendClients().filter(function(c){ return c.nom===cur || !pris[c.nom]; });
}
function _vendRepRender(){
  var box=document.getElementById('vrec-rep'); if(!box) return;
  var h='<div class="fl" style="margin-top:0">R\u00e9partition des caisses</div><div class="vrp">';
  _vrep.forEach(function(p,i){ h+=_vendRepLigne(p,i); });
  h+='</div>';
  var reste=_vendRepLibres(null).length;
  h+='<button type="button" class="vrp-add" onclick="_vendRepAdd()"'+(reste?'':' disabled')+'>'
    +(reste?'+ Ajouter un destinataire':'Tous les clients sont d\u00e9j\u00e0 sur cette r\u00e9colte')+'</button>';
  h+='<div id="vrec-rep-tot">'+_vendRepTotHtml()+'</div>';
  box.innerHTML=h;
  _vendRepPush();
}
function _vendRepLigne(p,i){
  var cfg=_vendCfg();
  var def=p.dom?(cfg.poids_caisse_kg||25):((_vendClient(p.client)||{}).poids_caisse_kg||cfg.poids_caisse_kg||25);
  var ecart=_vpPck(p)!==def;
  var h='<div class="vrp-l'+(p.dom?' dom':'')+'">';
  h+='<div class="vrp-h"><span class="vrp-d"></span><select onchange="_vendRepDest('+i+',this.value)">'
   +'<option value="D"'+(p.dom?' selected':'')+'>Domaine \u2014 vinifi\u00e9 ici</option>'
   +_vendRepLibres(p.dom?null:p.client).map(function(c){
       return '<option value="C:'+_escHtml(c.nom)+'"'+((!p.dom&&p.client===c.nom)?' selected':'')+'>'
         +_escHtml(c.nom)+'</option>'; }).join('')
   +'<option value="C:"'+((!p.dom&&!p.client)?' selected':'')+'>Vrac sans client</option>'
   +'</select>'
   +(_vrep.length>1?'<button type="button" class="vrp-x" onclick="_vendRepDel('+i+')" title="Retirer" aria-label="Retirer">'+_mvIcon('croix',16)+'</button>':'')
   +'</div>';
  h+='<div class="vrp-r"><div class="vrp-st">'
   +'<button type="button" onclick="_vendRepAdj('+i+',-1)">\u2212</button>'
   +'<input type="number" min="0" inputmode="numeric" value="'+_vpCs(p)+'" oninput="_vendRepCs('+i+',this.value)">'
   +'<button type="button" onclick="_vendRepAdj('+i+',1)">+</button>'
   +'<span class="vrp-u">caisses</span></div>'
   +'<div class="vrp-p"><input type="text" inputmode="decimal" value="'+_vendNbTxt(_vpPck(p),0)+'" oninput="_vendRepPck('+i+',this.value)">'
   +'<span class="vrp-u">kg/caisse</span></div></div>';
  h+='<div class="vrp-kg" id="vrp-kg-'+i+'">'+_vendRepKgHtml(i)+'</div>';
  h+='<div class="vrp-s" id="vrp-s-'+i+'">'+_vendRepSurfHtml(i)+'</div>';
  h+='</div>';
  return h;
}
function _vendRepKgHtml(i){
  var p=_vrep[i]; if(!p) return '';
  var cfg=_vendCfg();
  var def=p.dom?(cfg.poids_caisse_kg||25):((_vendClient(p.client)||{}).poids_caisse_kg||cfg.poids_caisse_kg||25);
  var ecart=_vpPck(p)!==def;
  return '<div><span class="vrp-tag '+(p.dom?'d':(ecart?'p':'r'))+'">poids du jour \u00b7 '+_vpPck(p)+' kg</span>'
   +(ecart&&!p.dom?' <span class="vrp-tag r">habituel '+def+' kg</span>':'')
   +'</div><div class="v">'+_vpKg(p).toLocaleString('fr-FR')+'<small>kg</small></div>';
}
// Surface récoltée pour ce destinataire. Vide = tout le reste de la parcelle.
/* Le texte à droite du champ — « le reste : 0,22 ha », « 5 600 kg/ha », un
   dépassement. Isolé parce qu'il se rafraîchit à chaque frappe, alors que le
   champ, lui, ne doit SURTOUT pas être recréé : il a le curseur. */
function _vendRepSurfRs(i){
  var p=_vrep[i]; if(!p) return '';
  var nomP=((document.getElementById('vrec-parcelle')||{}).value||'').trim();
  var sp=_vendParcSurf(nomP);
  var autres=_vrep.reduce(function(s,x,j){ return s+((j!==i&&_vpSurf(x)>0)?_vpSurf(x):0); },0);
  var reste=Math.round((sp-autres)*10000)/10000;
  var sans=_vrep.filter(function(x,j){ return j!==i && !(_vpSurf(x)>0); }).length;
  var val=_vpSurf(p);
  var eff=val>0?val:(reste>0?(sans?reste/(sans+1):reste):0);
  var kgha=eff>0?Math.round(_vpKg(p)/eff):0;
  var trop=val>0&&reste<0;
  var rs;
  if(sp<=0) rs='surface de la parcelle inconnue';
  else if(val>0) rs=trop?('<b style="color:var(--rouge,#A0291E)">d\u00e9passe la parcelle de '+_vendHa(-reste)+' ha</b>')
                       :(kgha>0?(kgha.toLocaleString('fr-FR')+' kg/ha'):'');
  else if(reste>0) rs='le reste : <b>'+_vendHa(eff)+' ha</b>'+(sans?' (au prorata)':'')+(kgha>0?(' \u00b7 '+kgha.toLocaleString('fr-FR')+' kg/ha'):'');
  else rs='<b style="color:var(--rouge,#A0291E)">plus rien \u00e0 r\u00e9partir</b>';
  return rs;
}
function _vendRepSurfHtml(i){
  var p=_vrep[i]; if(!p) return '';
  return '<span class="vrp-u">Surface r\u00e9colt\u00e9e</span>'
   +'<input type="text" inputmode="decimal" placeholder="tout le reste" value="'+_vendNbTxt(_vpSurf(p),2)+'" '
   +'oninput="_vendRepSurf('+i+',this.value)"><span class="vrp-u">ha</span>'
   +'<span class="rs" id="vrp-rs-'+i+'">'+_vendRepSurfRs(i)+'</span>';
}
function _vendHa(x){ return (Math.round(x*10000)/10000).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:4}); }
/* ⚠️⚠️ UN `input type="number"` REFUSE LA VIRGULE, ET LE FAIT EN SILENCE.
   Sur un clavier français on tape « 0,12 » : le navigateur juge la valeur
   invalide et rend une chaîne VIDE. Le code recevait donc « rien » et effaçait
   la surface — sans message, sans trace. Les champs décimaux de la vendange
   sont désormais en `text` + `inputmode="decimal"` (le pavé numérique sort
   quand même sur téléphone), et c'est cette fonction qui lit ce que le vigneron
   a écrit : virgule ou point, avec ou sans espaces. */
function _vendLireNb(v){
  if(v==null) return NaN;
  var t=String(v).replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
  if(t==='') return NaN;
  var n=parseFloat(t);
  return isFinite(n)?n:NaN;
}
/* Ce qu'on REMET dans un champ : la virgule française, jamais le point. */
function _vendNbTxt(x,dec){
  if(!(x>0)) return '';
  return (Math.round(x*10000)/10000).toLocaleString('fr-FR',
    {minimumFractionDigits:(dec==null?0:dec),maximumFractionDigits:4});
}
function _vendRepTotHtml(){
  var cfg=_vendCfg();
  var cs=_vrep.reduce(function(s,p){return s+_vpCs(p);},0);
  var kg=_vrep.reduce(function(s,p){return s+_vpKg(p);},0);
  var kd=_vrep.reduce(function(s,p){return s+(p.dom?_vpKg(p):0);},0);
  var kv=kg-kd;
  var h='<div class="vrp-tot"><div class="vrp-tot-g">'
   +'<div><div class="vrp-tot-n">'+cs+'</div><div class="vrp-tot-l">Caisses</div></div>'
   +'<div><div class="vrp-tot-n">'+(kg/1000).toFixed(2).replace('.',',')+'<small>t</small></div><div class="vrp-tot-l">R\u00e9colt\u00e9s</div></div>'
   +'<div><div class="vrp-tot-n">'+(kd>0?((kd/cfg.ratio_max).toFixed(0)+'\u2013'+(kd/cfg.ratio_min).toFixed(0)):'\u2014')
   +'<small>hL</small></div><div class="vrp-tot-l">Estim\u00e9s cuv\u00e9s</div></div></div>';
  h+='<div class="vrp-tot-d">';
  _vrep.forEach(function(p){
    if(_vpCs(p)<=0) return;
    h+=_escHtml(_vpNom(p))+' \u2014 '+_vpCs(p)+' \u00d7 '+_vpPck(p)+' kg = <b>'+_vpKg(p).toLocaleString('fr-FR')+' kg</b><br>';
  });
  h+='<span style="color:rgba(240,232,220,.5)">Total '+kg.toLocaleString('fr-FR')+' kg \u00b7 dont '
   +kd.toLocaleString('fr-FR')+' kg au domaine et '+kv.toLocaleString('fr-FR')+' kg vendus en raisin</span></div></div>';
  return h;
}
// Le pont vers le code de cuverie : #vrec-caisses porte les caisses DU DOMAINE.
function _vendRepPush(){
  var elC=document.getElementById('vrec-caisses');
  if(elC){
    var cd=_vrep.reduce(function(s,p){return s+(p.dom?_vpCs(p):0);},0);
    if(String(elC.value)!==String(cd)) elC.value=cd;
  }
  _vendVendu=!_vrep.some(function(p){ return p.dom&&_vpCs(p)>0; });
  _vendSyncDest();
  if(!_vcuvSel.volTouched){ _vcuvSel.vol=null; if(document.getElementById('vrec-cuv-att')) _vendCuvAtt(); }
}
function _vendRepMaj(i){
  var k=document.getElementById('vrp-kg-'+i); if(k) k.innerHTML=_vendRepKgHtml(i);
  /* Les kg/ha bougent quand les caisses bougent : on rafraîchit le TEXTE des
     surfaces, jamais les champs — l'un d'eux peut avoir le curseur. */
  _vrep.forEach(function(_,j){ var rs=document.getElementById('vrp-rs-'+j); if(rs) rs.innerHTML=_vendRepSurfRs(j); });
  var t=document.getElementById('vrec-rep-tot'); if(t) t.innerHTML=_vendRepTotHtml();
  _vendRepPush();
}
function _vendRepDest(i,v){
  var p=_vrep[i]; if(!p) return;
  var cfg=_vendCfg();
  var avant=p.dom?(cfg.poids_caisse_kg||25):((_vendClient(p.client)||{}).poids_caisse_kg||cfg.poids_caisse_kg||25);
  var touche=_vpPck(p)!==avant;
  if(v==='D'){ p.dom=true; p.client=''; }
  else { p.dom=false; p.client=v.slice(2); }
  if(!touche){
    p.pck=p.dom?(cfg.poids_caisse_kg||25):((_vendClient(p.client)||{}).poids_caisse_kg||cfg.poids_caisse_kg||25);
  }
  _vendRepRender();
}
function _vendRepCs(i,v){ if(!_vrep[i]) return; _vrep[i].caisses=Math.max(0,parseInt(v,10)||0); _vendRepMaj(i); }
function _vendRepAdj(i,d){ if(!_vrep[i]) return; _vrep[i].caisses=Math.max(0,_vpCs(_vrep[i])+d); _vendRepRender(); }
function _vendRepPck(i,v){ if(!_vrep[i]) return; var n=_vendLireNb(v); _vrep[i].pck=isNaN(n)?0:Math.max(0,n); _vendRepMaj(i); }
function _vendRepSurf(i,v){
  if(!_vrep[i]) return;
  var x=_vendLireNb(v);
  _vrep[i].surface=(x>0)?x:null;
  /* ⚠️ ON NE RÉÉCRIT PAS LA LIGNE QU'ON EST EN TRAIN DE REMPLIR. Réécrire le
     bloc recrée l'`<input>`, donc perd le curseur : impossible de taper une
     deuxième décimale. Seul le texte de droite est rafraîchi ici ; les AUTRES
     lignes, dont le « reste » vient de changer, se redessinent entièrement. */
  var rs=document.getElementById('vrp-rs-'+i); if(rs) rs.innerHTML=_vendRepSurfRs(i);
  _vrep.forEach(function(_,j){
    if(j===i) return;
    var s=document.getElementById('vrp-s-'+j); if(s) s.innerHTML=_vendRepSurfHtml(j);
  });
}
function _vendRepAdd(){
  var libre=_vendRepLibres(null)[0];
  var cfg=_vendCfg();
  _vrep.push({dom:false, client:libre?libre.nom:'',
              caisses:0, pck:(libre&&libre.poids_caisse_kg)||cfg.poids_caisse_kg||25, surface:null, retour:null});
  _vendRepRender();
}
function _vendRepDel(i){ if(_vrep.length<=1) return; _vrep.splice(i,1); _vendRepRender(); }
// Ce qui part en base : les parts nettoyées, sans ligne vide ni champ inutile.

// ═══════════════════════════════════════════════════════════════════════════
// VD-2 — LES LIVRAISONS, LEURS BONS, ET LE RETOUR DU CLIENT
// ═══════════════════════════════════════════════════════════════════════════
// L'unité du bon n'est pas l'apport, c'est LA LIVRAISON : un client qui reçoit
// deux parcelles le même jour ne connaît qu'un chargement. Une livraison, c'est
// donc un client + une date, et les parts de toutes les récoltes de ce jour-là.
//
// ⚠️ DEUX MESURES QUI NE SE MÉLANGENT PAS. Les kilos sont mesurés par le domaine
// le jour de la vendange. Les litres — jus et lie — sont mesurés par le client,
// des semaines plus tard, après pressurage. Corriger les uns ne touche jamais
// aux autres, et le document dit qui a mesuré quoi.
//
// ⚠️ LE BON NE PORTE QUE DES KILOS ET DES LITRES. Aucun prix, aucun montant :
// décision de Nico. La facturation vit ailleurs.
//
//   retour = { jus:L, lie:L, le:'AAAA-MM-JJ', src:'saisi'|'prorata' }
// posé sur CHAQUE part de la livraison. Quand le client ne donne qu'un chiffre
// global pour plusieurs parcelles, il est réparti au prorata des kilos et
// marqué `prorata` — un chiffre déduit ne se présente jamais comme une mesure.
// ═══════════════════════════════════════════════════════════════════════════

// Toutes les livraisons d'un client, de la plus récente à la plus ancienne.

// ═══════════════════════════════════════════════════════════════════════════
// VD-3 — LE RENDEMENT DE LA PARCELLE, ET CE QU'IL VAUT VRAIMENT
// ═══════════════════════════════════════════════════════════════════════════
// Une parcelle partagée reçoit son volume de trois endroits, et ils ne se valent
// pas. L'ESCALIER DES SOURCES, du mesuré au deviné :
//
//   1. CLIENT   — litres rendus par l'acheteur après pressurage : mesuré, chez lui
//   2. CUVE     — volume logé au domaine après décuvage : mesuré, au domaine
//   3. ESTIMÉ   — kilos ÷ ratio (130–140) : une fourchette, jamais un chiffre
//
// ⚠️⚠️⚠️ LA RÈGLE QUI TIENT TOUT L'ÉCRAN : un hL/ha ne s'affiche comme MESURE que
// si 100 % des kilos de la parcelle ont un volume connu. Sinon c'est une
// fourchette, et elle dit quelle part elle a mesurée.
//
// Sans cette règle, une parcelle dont deux volumes sur trois manquent afficherait
// un rendement effondré — et, pire, un « % du maximum d'appellation » calculé
// dessus. C'est §33 à l'identique : un indicateur bâti sur un signal partiel ment
// avec l'autorité d'une mesure.
//
// ⚠️ `kg_ha` RESTE RAPPORTÉ À LA PARCELLE ENTIÈRE (décision de Nico) : le domaine
// travaille toute la vigne même quand il en vend une part, et c'est ce rapport
// que Pilotage lit pour son prix de revient. Le rendement d'une PORTION vit à
// côté, dans `parts[]`, avec sa propre base — et chacun porte son étiquette.
// ═══════════════════════════════════════════════════════════════════════════

// La base du rendement : le jus clair seul, ou jus + lies. Le client rend deux
// chiffres ; celui qui compte pour la déclaration se règle, il ne se devine pas.
function _vendRdtBase(){ return (_vendCfg().rdt_base==='total')?'total':'jus'; }
function _vendSetRdtBase(b){
  if(!canWrite()) return;
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config=_vendCfg();
  CAVE_VENDANGE.config.rdt_base=(b==='total')?'total':'jus';
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(b==='total'?'Rendement sur jus + lies':'Rendement sur le jus clair','#3D6B27');
  renderVendParam();
}
function _vendLitresRetour(p){
  var r=p&&p.retour; if(!r) return 0;
  var j=Number(r.jus)||0, l=Number(r.lie)||0;
  return (_vendRdtBase()==='total')?(j+l):j;
}
// Volume réellement logé au domaine pour une récolte : celui de sa cuve, au
// prorata des kilos quand la cuve rassemble plusieurs récoltes.
// ⚠️ Un volume de cuve réparti entre parcelles est DÉDUIT, pas mesuré par
// parcelle : il sort marqué `prorata`.
// ★★★ RDT-1 — LE VOLUME MESURE D'UNE CUVE N'EXISTE QU'APRES LE DECUVAGE.
// Tant que la cuve macere ou fermente, elle contient du RAISIN : aucun volume de
// vin n'a ete compte, et il n'y a rien a mesurer. `volume_hl` est la CONTENANCE
// de la cuve — elle se pre-remplit depuis le parc (_vcuvPick) et la jauge de
// remplissage la lit comme telle (_cuveCouches, champ `cap`). La prendre pour un
// volume produit multipliait le rendement par l'inverse du taux de remplissage :
// une cuve de 60 hL a moitie pleine rendait 60 hL de vin.
// La mesure, c'est ce qui a ete LOGE au Chai : `vol_decuve_hl`, ecrit une fois,
// au decuvage, par saveVendDecuvage.
function _vendVolLoge(cv){
  if(!cv||!cv.decuvage) return 0;
  var v=parseFloat(cv.vol_decuve_hl);
  if(isFinite(v)&&v>0) return v;
  // Cuves decuvees AVANT ce lot : le volume se relit sur la cuvee d'elevage nee
  // du decuvage — futs entonnes + cuves logees. Lecture seule, aucune reecriture.
  var cu=((typeof CAVE_ELEVAGE!=='undefined'&&CAVE_ELEVAGE.cuvees)||[]).find(function(x){
    return x&&x.id===cv.decuvage.cuvee_id; });
  var l=cu?_caveVolL(cu):0;
  return l>0?Math.round(l/100*100)/100:0;
}
/* ★★★ VOL-1 — CE QU'IL Y A DANS UNE CUVE, LA SEULE PORTE : jamais `volume_hl` (§152a). */
function _vendSortiesHl(c){
  // Saignees et prelevements (ASM-1) : plus dans la cuve (§153c).
  return ((c&&c.operations)||[]).reduce(function(s,o){
    var v=(o&&(o.type==='saignee'||o.type==='prelevement'))?parseFloat(o.volume_hl):0;
    return s+((isFinite(v)&&v>0)?v:0);
  },0);
}
/* ★ ASM-1 — le preleve : hors du contenu, garde au rendement (§153c). */
function _vendPrelevHl(c){
  return ((c&&c.operations)||[]).reduce(function(s,o){
    var v=(o&&o.type==='prelevement')?parseFloat(o.volume_hl):0;
    return s+((isFinite(v)&&v>0)?v:0);
  },0);
}
function _vendVolContenu(c, exclId){
  if(!c) return {hl:0, src:'aucun', kg:0};
  var m=_vendVolLoge(c);
  if(m>0) return {hl:Math.round(m*100)/100, src:'mesure', kg:0};
  var kg=_vendCuvKgDom(c.id, exclId);
  if(!(kg>0)) return {hl:0, src:'aucun', kg:0};
  var e=Math.max(0, _vendHlKg(kg)-_vendSortiesHl(c));
  return {hl:Math.round(e*100)/100, src:'estime', kg:kg};
}
// Les caisses DOMAINE rattachees a une cuve. Recalculees depuis les recoltes a
// chaque appel : rien ne s'accumule dans un champ, donc rien ne peut doubler.
function _vendCuvCsDom(cuveId, exclId){
  if(!cuveId) return 0;
  return (CAVE_VENDANGE.recoltes||[]).reduce(function(s,x){
    return s+((x&&x.cuve_id===cuveId&&x.id!==exclId)?_recCsDom(x):0); },0);
}
function _vendVolCuve(r){
  if(!r||!r.cuve_id) return null;
  var cv=(CAVE_VENDANGE.cuves_vinif||[]).find(function(c){ return c&&c.id===r.cuve_id; });
  var vol=_vendVolLoge(cv);
  if(!(vol>0)) return null;
  vol+=_vendPrelevHl(cv);   // ASM-1
  var mine=(CAVE_VENDANGE.recoltes||[]).filter(function(x){ return x&&x.cuve_id===cv.id; });
  var tot=mine.reduce(function(s,x){ return s+_recKgDom(x); },0);
  var kd=_recKgDom(r);
  if(!(tot>0)||!(kd>0)) return null;
  return {hl:vol*kd/tot, src:'cuve', prorata:mine.length>1};
}
// Le volume d'UNE part, avec la marche d'escalier d'où il vient.
function _vendVolPart(r,p){
  if(p.dom){
    var c=_vendVolCuve(r);
    if(c){
      var kd=_recKgDom(r);
      return {hl:(kd>0?c.hl*_vpKg(p)/kd:0), src:'cuve', prorata:c.prorata};
    }
    return {hl:null, src:'estime'};
  }
  if(p.retour) return {hl:_vendLitresRetour(p)/100, src:'client',
                       prorata:p.retour.src==='prorata'};
  return {hl:null, src:'attente'};
}
function _vendSrcLbl(t){
  return t==='client'?'rendu par le client'
       :(t==='cuve'?'log\u00e9 au domaine'
       :(t==='attente'?'retour attendu':'pas encore de volume'));
}

// ── Les surfaces d'une parcelle sur un millésime ───────────────────────────
// ⚠️ LA SURFACE NE S'ADDITIONNE PAS D'UN PASSAGE À L'AUTRE. Deux récoltes sur la
// même parcelle le même millésime, c'est deux fois la même vigne : on retient la
// surface DÉCLARÉE par destinataire, jamais leur somme.
function _vendSurfParc(nom,mil){
  var sp=_vendParcSurf(nom), dest={}, ord=[], conflit=[];
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    if(!r||r.parcelle!==nom) return;
    if(_vendMillOfDate(r.date)!==mil) return;
    _vendParts(r).forEach(function(p){
      if(_vpCs(p)<=0) return;
      var k=p.dom?'\u2014domaine':(p.client||'\u2014vrac');
      if(!dest[k]){ dest[k]={cle:k, dom:!!p.dom, nom:_vpNom(p), kg:0, decl:0, vals:{}}; ord.push(k); }
      var d=dest[k]; d.kg+=_vpKg(p);
      var sv=_vpSurf(p);
      if(sv>0){ d.vals[sv]=1; if(sv>d.decl) d.decl=sv; }
    });
  });
  var lst=ord.map(function(k){ return dest[k]; });
  lst.forEach(function(d){
    var v=Object.keys(d.vals);
    if(v.length>1) conflit.push(d.nom+' : '+v.join(' et ')+' ha');
  });
  var declaree=lst.reduce(function(a,d){ return a+d.decl; },0);
  var sans=lst.filter(function(d){ return d.decl<=0; });
  var reste=Math.round((sp-declaree)*10000)/10000;
  var kgSans=sans.reduce(function(a,d){ return a+d.kg; },0);
  lst.forEach(function(d){
    if(d.decl>0){ d.ha=d.decl; d.src='declaree'; }
    else if(reste>0){ d.ha=(sans.length===1)?reste:(kgSans>0?reste*d.kg/kgSans:0);
                      d.src=(sans.length===1)?'reste':'reste-prorata'; }
    else { d.ha=0; d.src='aucune'; }
    d.kgHa=d.ha>0?d.kg/d.ha:0;
  });
  return {surface:sp, lignes:lst, declaree:declaree,
          attribuee:lst.reduce(function(a,d){ return a+d.ha; },0),
          conflit:conflit,
          depasse:(reste<-0.0005)?Math.abs(reste):0,
          orphelin:(sans.length===0&&reste>0.0005)?reste:0};
}
function _vendSurfLbl(t){
  return t==='declaree'?'surface achet\u00e9e'
       :(t==='reste'?'le reste':(t==='reste-prorata'?'reste au prorata':'sans surface'));
}
function _vendHaTxt(x){
  return (Math.round(x*10000)/10000).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:4});
}

// ── Le volume d'une parcelle sur un millésime, source par source ───────────
function _vendVolParc(nom,mil){
  var hl=0,kgOk=0,kgKo=0,kg=0,srcs={},prorata=false,lignes=[];
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    if(!r||r.parcelle!==nom) return;
    if(_vendMillOfDate(r.date)!==mil) return;
    _vendParts(r).forEach(function(p){
      if(_vpCs(p)<=0) return;
      var k=_vpKg(p), v=_vendVolPart(r,p);
      kg+=k;
      if(v.hl!=null){ hl+=v.hl; kgOk+=k; srcs[v.src]=1; if(v.prorata) prorata=true; }
      else kgKo+=k;
      lignes.push({cle:p.dom?'\u2014domaine':(p.client||'\u2014vrac'), dom:!!p.dom, nom:_vpNom(p),
                   kg:k, hl:v.hl, src:v.src, prorata:!!v.prorata, date:r.date});
    });
  });
  var types=Object.keys(srcs);
  var cfg=_vendCfg();
  return {kg:kg, hl:hl, kgOk:kgOk, kgKo:kgKo, lignes:lignes,
          src:types.length>1?'mixte':(types[0]||'aucune'), prorata:prorata,
          statut:kgKo<=0?(kgOk>0?'mesure':'aucune'):(kgOk>0?'partiel':'estime'),
          hlMin:hl+kgKo/(cfg.ratio_max||140), hlMax:hl+kgKo/(cfg.ratio_min||130),
          pctOk:kg>0?Math.round(kgOk/kg*100):0};
}
// Le détail d'une parcelle : volume ET surfaces, regroupés par destinataire.
function _vendRdtParc(nom,mil){
  var v=_vendVolParc(nom,mil), s=_vendSurfParc(nom,mil);
  var par={};
  v.lignes.forEach(function(l){
    if(!par[l.cle]) par[l.cle]={cle:l.cle,dom:l.dom,nom:l.nom,kg:0,hl:0,connu:0,src:l.src,prorata:false};
    var o=par[l.cle]; o.kg+=l.kg;
    if(l.hl!=null){ o.hl+=l.hl; o.connu+=l.kg; o.src=l.src; if(l.prorata) o.prorata=true; }
    else if(o.connu<=0) o.src=l.src;
  });
  s.lignes.forEach(function(d){
    var o=par[d.cle]; if(!o) return;
    o.ha=d.ha; o.haSrc=d.src;
    o.kgHa=d.ha>0?o.kg/d.ha:0;
    o.hlHa=(d.ha>0&&o.connu>0)?o.hl/d.ha:null;
  });
  // ⚠️ Le dénominateur du chiffre global est la PARCELLE ENTIÈRE, pas la somme
  // des portions : le domaine travaille toute la vigne. Les portions ont leur
  // propre rapport, et chacun porte son étiquette à l'écran.
  return {nom:nom, millesime:mil, surface:s.surface, surf:s, vol:v,
          parts:Object.keys(par).map(function(k){ return par[k]; })};
}

function _vendLivs(nom){
  var by={},ord=[];
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    _vendParts(r).forEach(function(p){
      if(p.dom||(p.client||'')!==nom||_vpCs(p)<=0) return;
      var d=r.date||'';
      if(!by[d]){ by[d]={client:nom,date:d,lignes:[]}; ord.push(d); }
      by[d].lignes.push({parcelle:r.parcelle||'',rec:r,part:p});
    });
  });
  ord.sort(); ord.reverse();
  return ord.map(function(d){ return by[d]; });
}
function _livKg(l){ return l.lignes.reduce(function(s,x){ return s+_vpKg(x.part); },0); }
function _livCs(l){ return l.lignes.reduce(function(s,x){ return s+_vpCs(x.part); },0); }
function _livJus(l){ return l.lignes.reduce(function(s,x){ return s+((x.part.retour&&Number(x.part.retour.jus))||0); },0); }
function _livLie(l){ return l.lignes.reduce(function(s,x){ return s+((x.part.retour&&Number(x.part.retour.lie))||0); },0); }
function _livVol(l){ return _livJus(l)+_livLie(l); }
function _livRetour(l){ return l.lignes.some(function(x){ return !!x.part.retour; }); }
function _livProrata(l){ return l.lignes.some(function(x){ return x.part.retour&&x.part.retour.src==='prorata'; }); }
function _livDateRet(l){ var d=''; l.lignes.forEach(function(x){ if(x.part.retour&&x.part.retour.le>d) d=x.part.retour.le; }); return d; }
// Kilos pour faire un hectolitre. C'est le rendement réel, celui que seul le
// client peut donner ; tout le reste du Cuvier travaille sur une estimation.
function _vendRendKgHl(kg,litres){ return litres>0?(kg/(litres/100)):0; }
function _vendL1(x){ return (Math.round(x*10)/10).toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1}); }
function _vendKgTxt(x){ return Math.round(x||0).toLocaleString('fr-FR'); }
function _vendAujId(){ var d=new Date(),p=function(x){return (x<10?'0':'')+x;};
  return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
// Initiales d'un client, pour le repère du bon.
function _vendInit(nom){
  return String(nom||'').split(/[^A-Za-z\u00C0-\u00FF]+/).filter(Boolean).slice(0,2)
    .map(function(m){ return m.charAt(0).toUpperCase(); }).join('')||'CL';
}

// ── L'écran : la sheet « Ventes en vrac » ──────────────────────────────────
var _vlivNom='', _vliv=null;
function _vendVracCss(){
  if(document.getElementById('mvv-liv-css')) return;
  var st=document.createElement('style'); st.id='mvv-liv-css';
  st.textContent=''
  +'.mvl-liv{border:1px solid rgba(138,90,56,.14);border-radius:12px;padding:11px 12px;margin-bottom:9px;background:#fff}'
  +'.mvl-h{display:flex;align-items:center;gap:8px}'
  +'.mvl-d{font-size:var(--pt-txt,12.5px);font-weight:600;flex:1;color:var(--texte,#1A1A14)}'
  +'.mvl-k{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--terre,#8A5A38);white-space:nowrap}'
  +'.mvl-p{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:4px;line-height:1.55}'
  +'.mvl-b{font-size:var(--pt-nano,9.5px);font-weight:600;border-radius:7px;padding:3px 7px}'
  +'.mvl-b.att{background:rgba(184,90,26,.10);border:1px solid rgba(184,90,26,.28);color:var(--orange,#B85A1A)}'
  +'.mvl-b.ok{background:rgba(61,107,39,.10);border:1px solid rgba(61,107,39,.24);color:var(--vert-med,#3D6B27)}'
  +'.mvl-ret{font-size:var(--pt-lbl,10.5px);color:var(--vert,#1E3A12);margin-top:7px;background:rgba(61,107,39,.06);'
    +'border:1px solid rgba(61,107,39,.16);border-radius:9px;padding:7px 9px;line-height:1.55}'
  +'.mvl-ret b{font-weight:600}'
  +'.mvl-a{display:flex;gap:6px;margin-top:9px}'
  +'.mvl-a button{flex:1;border:1px solid rgba(138,90,56,.20);background:rgba(138,90,56,.06);color:var(--terre,#8A5A38);'
    +'border-radius:9px;padding:9px;font-family:inherit;font-size:var(--pt-micro,11px);font-weight:600;cursor:pointer;min-height:40px}'
  +'.mvl-a button.w{background:rgba(184,90,26,.09);border-color:rgba(184,90,26,.28);color:var(--orange,#B85A1A)}'
  +'.mvl-row{display:flex;align-items:center;gap:7px;padding:9px 0;border-bottom:1px solid rgba(138,90,56,.10)}'
  +'.mvl-row:last-child{border-bottom:none}'
  +'.mvl-row .nm{flex:1;min-width:0;font-size:var(--pt-txt,12.5px);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'.mvl-row input{width:56px;height:36px;text-align:center;border-radius:9px;border:1px solid rgba(138,90,56,.3);'
    +'background:#fff;font-family:inherit;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14)}'
  +'.mvl-row .u{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F)}'
  +'.mvl-row .kg{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--terre,#8A5A38);min-width:64px;text-align:right;white-space:nowrap}'
  +'.mvl-duo{display:flex;gap:9px}.mvl-duo>div{flex:1}'
  +'.mvl-calc{background:var(--cave,#14110D);border-radius:12px;padding:11px 13px;margin-top:12px;color:#F0E8DC}'
  +'.mvl-calc-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}'
  +'.mvl-calc-n{font-family:"Cormorant Garamond",Georgia,serif;font-weight:700;font-size:var(--pt-md,20px);line-height:1;color:#F5EFE3}'
  +'.mvl-calc-n small{font-size:var(--pt-nano,9.5px);font-family:inherit;font-weight:600;color:rgba(240,232,220,.5);margin-left:3px}'
  +'.mvl-calc-l{font-size:var(--pt-nano,9.5px);letter-spacing:.09em;text-transform:uppercase;color:rgba(240,232,220,.45);margin-top:4px}'
  +'.mvl-calc-w{margin-top:10px;padding-top:8px;border-top:1px solid rgba(240,232,220,.13);font-size:var(--pt-lbl,10.5px);'
    +'line-height:1.55;color:rgba(240,232,220,.75)}'
  +'.mvl-calc-w b{color:var(--or-clair,#D8BC72);font-weight:600}'
  +'.mvl-chk{display:flex;align-items:center;gap:9px;padding:10px 11px;border:1px solid rgba(138,90,56,.18);'
    +'border-radius:11px;background:#fff;margin-top:11px;cursor:pointer}'
  +'.mvl-chk .bx{width:20px;height:20px;border-radius:6px;border:1.5px solid rgba(138,90,56,.35);flex-shrink:0;'
    +'display:flex;align-items:center;justify-content:center;color:#fff;font-size:var(--pt-txt,12.5px)}'
  +'.mvl-chk.on .bx{background:var(--vert-med,#3D6B27);border-color:var(--vert-med,#3D6B27)}'
  +'.mvl-chk .tx{font-size:var(--pt-txt,12.5px);font-weight:500}'
  +'.mvl-chk .sb{font-size:var(--pt-lbl,10.5px);color:var(--texte-doux,#5F5F5F);margin-top:2px}';
  document.head.appendChild(st);
}
// Combien de retours manquent, tous clients confondus.
function _vendRetoursDus(){
  var n=0;
  _vendClients().forEach(function(c){ _vendLivs(c.nom).forEach(function(l){ if(!_livRetour(l)) n++; }); });
  return n;
}
function openVendVrac(){
  _vendVracCss();
  var cls=_vendClients();
  var rows=cls.map(function(c,i){
    var ls=_vendLivs(c.nom); if(!ls.length) return '';
    var kg=ls.reduce(function(s,l){ return s+_livKg(l); },0);
    var vol=ls.reduce(function(s,l){ return s+_livVol(l); },0);
    var att=ls.filter(function(l){ return !_livRetour(l); }).length;
    return '<div class="mvv-clrow"><div style="flex:1;min-width:0">'
      +'<div class="mvv-clrow-nm">'+_escHtml(c.nom)+'</div>'
      +'<div class="mvv-clrow-mt">'+ls.length+' livraison'+(ls.length>1?'s':'')+' \u00b7 '+_vendKgTxt(kg)+' kg'
      +(vol>0?(' \u00b7 '+_vendL1(vol/100)+' hL rendus'):'')
      +(att?(' \u00b7 <span style="color:var(--orange,#B85A1A)">'+att+' retour'+(att>1?'s':'')+' attendu'+(att>1?'s':'')+'</span>'):'')
      +'</div></div>'
      +'<div class="mvv-clrow-r"><button class="mv-gh mvv-icbtn" onclick="openVendLivs('+i+')" '
      +'title="Livraisons" aria-label="Livraisons">'+_mvIcon('chevron',18)+'</button></div></div>';
  }).join('');
  var html='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Ventes en vrac</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">Un client, ses livraisons, ses bons. Le bon part avec la remorque et ne dit '
    +'que des kilos ; le retour \u2014 litres de jus et de lie \u2014 arrive apr\u00e8s pressurage.</div>'
    +'<div class="mvv-cllist">'+(rows||'<div class="mvv-fnote">Aucune vente en vrac saisie pour l\u2019instant.</div>')+'</div>';
  _vendSheet(html);
}
function openVendLivs(ci){
  _vendVracCss();
  var c=_vendClients()[ci]; if(!c) return;
  _vlivNom=c.nom;
  var ls=_vendLivs(c.nom);
  var kg=ls.reduce(function(s,l){ return s+_livKg(l); },0);
  var vol=ls.reduce(function(s,l){ return s+_livVol(l); },0);
  var kgRet=ls.filter(_livRetour).reduce(function(s,l){ return s+_livKg(l); },0);
  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+_escHtml(c.nom)+'</div>'
   +'<button class="mv-gh mvv-sheet-x" onclick="openVendVrac()" title="Retour" aria-label="Retour">'+_mvIcon('croix',18)+'</button></div>'
   +'<div class="mvv-sheet-sub">'+_vendKgTxt(kg)+' kg livr\u00e9s'
   +(vol>0?(' \u00b7 '+_vendL1(vol/100)+' hL rendus \u00b7 <b>'+_vendKgTxt(_vendRendKgHl(kgRet,vol))+' kg/hL</b> r\u00e9el'):'')
   +'</div>';
  ls.forEach(function(l,li){
    var ret=_livRetour(l);
    h+='<div class="mvl-liv"><div class="mvl-h"><span class="mvl-d">'+_vendFrDate(l.date)+'</span>'
     +'<span class="mvl-b '+(ret?'ok':'att')+'">'+(ret?'retour re\u00e7u':'retour attendu')+'</span>'
     +'<span class="mvl-k">'+_livCs(l)+' c. \u00b7 '+_vendKgTxt(_livKg(l))+' kg</span></div>'
     +'<div class="mvl-p">'+l.lignes.map(function(x){
         return _escHtml(x.parcelle)+' \u2014 '+_vpCs(x.part)+' \u00d7 '+_vpPck(x.part)+' kg'; }).join('<br>')+'</div>';
    if(ret){
      var v=_livVol(l);
      h+='<div class="mvl-ret"><b>'+_vendKgTxt(_livJus(l))+' L de jus</b> \u00b7 '+_vendKgTxt(_livLie(l))+' L de lie \u00b7 '
       +_vendL1(v/100)+' hL \u2192 <b>'+_vendKgTxt(_vendRendKgHl(_livKg(l),v))+' kg/hL</b>'
       +(_livProrata(l)?'<br><span style="color:var(--orange,#B85A1A)">r\u00e9parti au prorata entre les parcelles</span>':'')
       +'<br><span style="color:var(--texte-doux,#5F5F5F)">re\u00e7u le '+_vendFrDate(_livDateRet(l))+'</span></div>';
    }
    h+='<div class="mvl-a">'
     +(canWrite()?('<button onclick="openVendRetour('+ci+','+li+')" class="'+(ret?'':'w')+'">'
        +(ret?'Modifier':'Saisir le retour')+'</button>'):'')
     +'<button onclick="_vendDocBon('+ci+','+li+')">Bon de livraison</button></div></div>';
  });
  if(!ls.length) h+='<div class="mvv-fnote">Aucune livraison pour ce client.</div>';
  else h+='<button class="mvv-save ghost2" style="margin-top:12px" onclick="_vendDocRecap('+ci+')">R\u00e9cap de campagne</button>';
  _vendSheet(h);
}

// ── La saisie du retour ────────────────────────────────────────────────────
function openVendRetour(ci,li){
  if(!canWrite()) return;
  var c=_vendClients()[ci]; if(!c) return;
  var l=_vendLivs(c.nom)[li]; if(!l) return;
  var detail=l.lignes.length>1 && l.lignes.every(function(x){ return x.part.retour&&x.part.retour.src==='saisi'; });
  _vliv={ci:ci,li:li,nom:c.nom,date:l.date,detail:detail,le:_livDateRet(l)||_vendAujId(),
    lignes:l.lignes.map(function(x){
      var r=x.part.retour||null;
      return {parcelle:x.parcelle,part:x.part,rec:x.rec,caisses:_vpCs(x.part),pck:_vpPck(x.part),
              jus:r?(Number(r.jus)||0):0, lie:r?(Number(r.lie)||0):0};
    })};
  _vliv.jus=_vliv.lignes.reduce(function(s,x){ return s+x.jus; },0);
  _vliv.lie=_vliv.lignes.reduce(function(s,x){ return s+x.lie; },0);
  _vendRetourRender();
}
function _vlKg(){ return _vliv.lignes.reduce(function(s,x){ return s+x.caisses*x.pck; },0); }
function _vlJus(){ return _vliv.detail?_vliv.lignes.reduce(function(s,x){ return s+x.jus; },0):(Number(_vliv.jus)||0); }
function _vlLie(){ return _vliv.detail?_vliv.lignes.reduce(function(s,x){ return s+x.lie; },0):(Number(_vliv.lie)||0); }
function _vendRetourRender(){
  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Livraison du '+_vendFrDate(_vliv.date)+'</div>'
   +'<button class="mv-gh mvv-sheet-x" onclick="openVendLivs('+_vliv.ci+')" title="Retour" aria-label="Retour">'+_mvIcon('croix',18)+'</button></div>'
   +'<div class="mvv-sheet-sub">'+_escHtml(_vliv.nom)+'</div>';
  h+='<label class="mvv-flbl">Ce qui est parti</label>';
  _vliv.lignes.forEach(function(x,i){
    h+='<div class="mvl-row"><span class="nm">'+_escHtml(x.parcelle)+'</span>'
     +'<input type="number" min="0" inputmode="numeric" value="'+x.caisses+'" oninput="_vendRetSet('+i+',\'caisses\',this.value)">'
     +'<span class="u">\u00d7</span>'
     +'<input type="number" min="1" max="80" step="0.5" value="'+x.pck+'" oninput="_vendRetSet('+i+',\'pck\',this.value)">'
     +'<span class="u">kg</span><span class="kg" id="mvl-kg-'+i+'">'+_vendKgTxt(x.caisses*x.pck)+' kg</span></div>';
  });
  h+='<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">Corriger ici change le bon de livraison. '
   +'Le retour du client, lui, reste ce qu\u2019il a annonc\u00e9.</div>';
  h+='<label class="mvv-flbl">Ce que le client a rendu</label>';
  if(_vliv.lignes.length>1){
    h+='<div class="mvl-chk'+(_vliv.detail?' on':'')+'" onclick="_vendRetDetail()"><div class="bx">'+(_vliv.detail?_mvIcon('check',16):'')+'</div>'
     +'<div><div class="tx">Le client a d\u00e9taill\u00e9 par parcelle</div>'
     +'<div class="sb">Sinon les litres sont r\u00e9partis au prorata des kilos, et le document le dit.</div></div></div>';
  }
  if(_vliv.detail){
    _vliv.lignes.forEach(function(x,i){
      h+='<div class="mvl-row"><span class="nm">'+_escHtml(x.parcelle)+'</span>'
       +'<input type="text" inputmode="decimal" value="'+_vendNbTxt(x.jus,0)+'" oninput="_vendRetSet('+i+',\'jus\',this.value)"><span class="u">L jus</span>'
       +'<input type="text" inputmode="decimal" value="'+_vendNbTxt(x.lie,0)+'" oninput="_vendRetSet('+i+',\'lie\',this.value)"><span class="u">L lie</span></div>';
    });
  } else {
    h+='<div class="mvl-duo"><div><label class="mvv-flbl" style="margin-top:8px">Litres de jus</label>'
     +'<input class="mvv-tin" type="text" inputmode="decimal" value="'+_vendNbTxt(_vliv.jus,0)+'" placeholder="0" oninput="_vendRetGlob(\'jus\',this.value)"></div>'
     +'<div><label class="mvv-flbl" style="margin-top:8px">Litres de lie</label>'
     +'<input class="mvv-tin" type="text" inputmode="decimal" value="'+_vendNbTxt(_vliv.lie,0)+'" placeholder="0" oninput="_vendRetGlob(\'lie\',this.value)"></div></div>';
  }
  h+='<label class="mvv-flbl">Re\u00e7u le</label><input class="mvv-tin" type="date" value="'+_vliv.le+'" onchange="_vendRetDate(this.value)">';
  h+='<div id="mvl-calc">'+_vendRetCalcHtml()+'</div>';
  h+='<button class="mvv-save" style="margin-top:14px" onclick="_vendRetSave()">Enregistrer</button>';
  if(_vliv.lignes.some(function(x){ return !!x.part.retour; }))
    h+='<button class="mvv-del" onclick="_vendRetClear()">Effacer le retour du client</button>';
  _vendSheet(h);
}
function _vendRetCalcHtml(){
  var kg=_vlKg(), jus=_vlJus(), lie=_vlLie(), vol=jus+lie, cfg=_vendCfg();
  var h='<div class="mvl-calc"><div class="mvl-calc-g">'
   +'<div><div class="mvl-calc-n">'+_vendKgTxt(kg)+'<small>kg</small></div><div class="mvl-calc-l">Livr\u00e9s</div></div>'
   +'<div><div class="mvl-calc-n">'+(vol>0?_vendL1(vol/100):'\u2014')+'<small>hL</small></div><div class="mvl-calc-l">Rendus</div></div>'
   +'<div><div class="mvl-calc-n">'+(vol>0?_vendKgTxt(_vendRendKgHl(kg,vol)):'\u2014')+'<small>kg/hL</small></div>'
   +'<div class="mvl-calc-l">Rendement</div></div></div>';
  if(vol>0){
    h+='<div class="mvl-calc-w"><b>'+_vendKgTxt(jus)+' L de jus</b> et '+_vendKgTxt(lie)+' L de lie \u2014 la lie fait '
     +_vendL1(lie/vol*100)+' % du volume rendu.<br>Sur le seul jus clair : <b>'+_vendKgTxt(_vendRendKgHl(kg,jus))
     +' kg/hL</b>. Sur le volume total : <b>'+_vendKgTxt(_vendRendKgHl(kg,vol))+' kg/hL</b>.'
     +(_vendRendKgHl(kg,vol)>cfg.ratio_max+15
        ? '<br><span style="color:#E0A060">Rendement inhabituel \u2014 v\u00e9rifier l\u2019unit\u00e9 annonc\u00e9e par le client : des litres, pas des hectolitres.</span>':'')
     +'</div>';
  } else {
    h+='<div class="mvl-calc-w">Aucun retour saisi : cette livraison n\u2019entre dans aucun volume.</div>';
  }
  return h+'</div>';
}
function _vendRetCalc(){ var el=document.getElementById('mvl-calc'); if(el) el.innerHTML=_vendRetCalcHtml(); }
function _vendRetSet(i,champ,v){
  var x=_vliv.lignes[i]; if(!x) return;
  if(champ==='caisses') x.caisses=Math.max(0,parseInt(v,10)||0);
  else { var n=_vendLireNb(v); x[champ]=isNaN(n)?0:Math.max(0,n); }
  var k=document.getElementById('mvl-kg-'+i); if(k) k.textContent=_vendKgTxt(x.caisses*x.pck)+' kg';
  _vendRetCalc();
}
function _vendRetGlob(champ,v){ var n=_vendLireNb(v); _vliv[champ]=isNaN(n)?0:Math.max(0,n); _vendRetCalc(); }
function _vendRetDate(v){ if(_vliv) _vliv.le=v||_vendAujId(); }
function _vendRetDetail(){
  if(!_vliv.detail){
    var r=_vendRetProrata(_vlJus(),_vlLie());
    _vliv.lignes.forEach(function(x,i){ x.jus=r[i].jus; x.lie=r[i].lie; });
    _vliv.detail=true;
  } else { _vliv.jus=_vlJus(); _vliv.lie=_vlLie(); _vliv.detail=false; }
  _vendRetourRender();
}
// Répartition au prorata des kilos. ⚠️ La DERNIÈRE ligne reçoit le reste, pour
// que la somme des lignes retombe EXACTEMENT sur le total annoncé par le client.
// Un arrondi ligne à ligne fabriquerait un litre qui n'existe pas.
function _vendRetProrata(jus,lie){
  var kg=_vlKg(), out=[], cj=0, cl=0, n=_vliv.lignes.length;
  _vliv.lignes.forEach(function(x,i){
    if(i===n-1){ out.push({jus:Math.round((jus-cj)*10)/10, lie:Math.round((lie-cl)*10)/10}); return; }
    var q=kg>0?(x.caisses*x.pck)/kg:0;
    var j=Math.round(jus*q*10)/10, w=Math.round(lie*q*10)/10;
    cj+=j; cl+=w; out.push({jus:j,lie:w});
  });
  return out;
}
function _vendRetSave(){
  if(!_vendGarde()) return;
  var jus=_vlJus(), lie=_vlLie(), vol=jus+lie, kg=_vlKg();
  var rep=_vliv.detail?_vliv.lignes.map(function(x){ return {jus:x.jus,lie:x.lie}; }):_vendRetProrata(jus,lie);
  var seule=(_vliv.lignes.length===1);
  _vliv.lignes.forEach(function(x,i){
    x.part.caisses=x.caisses; x.part.pck=x.pck;
    // ⚠️ La part n'est peut-être encore qu'une part de migration : l'écrire dans
    // la récolte, sinon la correction serait perdue au prochain chargement.
    if(!Array.isArray(x.rec.parts)||!x.rec.parts.length) x.rec.parts=_vendParts(x.rec);
    if(vol>0) x.part.retour={jus:rep[i].jus,lie:rep[i].lie,le:_vliv.le,
                             src:(_vliv.detail||seule)?'saisi':'prorata'};
    else if(x.part.retour) delete x.part.retour;
    x.rec.nb_caisses=_recCaisses(x.rec);
  });
  // ⚠️ DÉFAUT CUV-5 : cet écran corrige des CAISSES et des POIDS, donc des
  //   kilos — et il ne prévenait pas la parcelle. `rendement_hist` gardait les
  //   anciens kg/ha, et Pilotage lisait la vieille valeur pour son prix de
  //   revient. Le Cuvier juste, le Pilotage faux, aucun des deux écrans ne
  //   paraissant malade. `_vendRecordRendement` n'avait qu'UN appelant
  //   (`saveVendRec`) alors que deux écrans écrivent des kilos.
  //   Une récolte peut porter plusieurs lignes de la même livraison : on ne la
  //   recalcule qu'une fois, et le lot ne fait qu'une écriture de parcelles.
  _vendParcLot(function(){
    var _vus={};
    _vliv.lignes.forEach(function(x){
      if(!x.rec||!x.rec.id||_vus[x.rec.id]) return;
      _vus[x.rec.id]=1; _vendRecordRendement(x.rec,null);
    });
  });
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(vol>0?('Retour enregistr\u00e9 \u00b7 '+_vendKgTxt(_vendRendKgHl(kg,vol))+' kg/hL'):'Livraison mise \u00e0 jour','#3D6B27');
  openVendLivs(_vliv.ci);
  if(_vendTab==='rec') renderVendRec();
}
function _vendRetClear(){
  if(!_vendGarde()) return;
  var ci=_vliv.ci;
  _vliv.lignes.forEach(function(x){ if(x.part.retour) delete x.part.retour; });
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave('Retour effac\u00e9','#B85A1A');
  openVendLivs(ci);
}

// ── Les documents : bon de livraison et récap de campagne ──────────────────
// Ils passent par MV_DOC (`_mvDocOpen`, utils.js) : mêmes marges, même bandeau
// à filet d'or, même pied, comme les treize autres documents de l'application.
// ⚠️ Le document porte le nom du DOMAINE, jamais celui de GUERETTECH.
var VD_BL_CSS=''
+'.bl-part{display:flex;gap:14px;margin-bottom:14px}'
+'.bl-box{flex:1;border:1px solid #E4DAC8;border-radius:8px;padding:9px 11px;background:#FBFAF6}'
+'.bl-box .k{font-size:var(--pt-nano,9.5px);letter-spacing:.13em;text-transform:uppercase;color:#8B8175;font-weight:700}'
+'.bl-box .v{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-base,14px);font-weight:600;color:#2A241C;margin-top:3px;line-height:1.2}'
+'.bl-box .s{font-size:var(--pt-nano,9.5px);color:#6F675C;margin-top:3px;line-height:1.4}'
+'.bl-sec{font-size:var(--pt-nano,9.5px);letter-spacing:.14em;text-transform:uppercase;color:#8A5A38;font-weight:700;'
 +'margin:18px 0 7px;padding-bottom:4px;border-bottom:1.5px solid rgba(194,161,77,.35)}'
+'.bl-t{width:100%;border-collapse:collapse;font-size:var(--pt-lbl,10.5px)}'
+'.bl-t th{text-align:left;font-size:var(--pt-nano,9.5px);letter-spacing:.07em;text-transform:uppercase;color:#8B8175;'
 +'font-weight:600;padding:5px 7px;border-bottom:1px solid #E4DAC8}'
+'.bl-t th.n,.bl-t td.n{text-align:right;white-space:nowrap}'
+'.bl-t td{padding:6px 7px;border-bottom:1px solid #F0EAE0}'
+'.bl-t td.b{font-weight:600}.bl-t td.g{color:#A09684}'
+'.bl-t tfoot td{border-top:1.5px solid #C2A14D;border-bottom:0;font-weight:700;color:#8A5A38;padding-top:7px;font-size:var(--pt-micro,11px)}'
+'.bl-tiles{display:flex;gap:9px;margin-top:12px}'
+'.bl-tile{flex:1;border:1px solid #E4DAC8;border-radius:9px;padding:10px 11px;background:#FBFAF6}'
+'.bl-tile .v{font-family:"Cormorant Garamond",Georgia,serif;font-size:var(--pt-lg,23px);font-weight:700;color:#8A5A38;line-height:1}'
+'.bl-tile .v small{font-size:var(--pt-micro,11px);margin-left:3px;color:#8B8175;font-weight:500}'
+'.bl-tile .l{font-size:var(--pt-nano,9.5px);letter-spacing:.05em;text-transform:uppercase;color:#8B8175;margin-top:4px}'
+'.bl-att{border:1px dashed #D8C9AE;border-radius:9px;padding:10px 12px;background:#FDFBF6;'
 +'font-size:var(--pt-nano,9.5px);color:#8B8175;margin-top:10px}'
+'.bl-sig{display:flex;gap:14px;margin-top:16px}'
+'.bl-sig div{flex:1;border:1px solid #E4DAC8;border-radius:8px;padding:9px 11px 34px}'
+'.bl-sig .k{font-size:var(--pt-nano,9.5px);letter-spacing:.1em;text-transform:uppercase;color:#8B8175;font-weight:700}'
+'.bl-sig .s{font-size:var(--pt-nano,9.5px);color:#A09684;margin-top:2px}';

// Les lignes d'un document : une par part livrée.
function _vendBlLignes(livs){
  var out=[];
  livs.forEach(function(l){
    l.lignes.forEach(function(x){
      out.push({date:l.date,parcelle:x.parcelle,caisses:_vpCs(x.part),pck:_vpPck(x.part),
                kg:_vpKg(x.part),ha:_vpSurf(x.part),retour:x.part.retour||null});
    });
  });
  out.sort(function(a,b){ return String(a.date).localeCompare(String(b.date)); });
  return out;
}
function _vendBlCorps(client,lignes,mode){
  var kg=0,cs=0,jus=0,lie=0,kgRet=0,pk={},parc={},prorata=false,sansRet=0;
  lignes.forEach(function(x){
    kg+=x.kg; cs+=x.caisses; pk[x.pck]=1; parc[x.parcelle]=1;
    if(x.retour){ jus+=(Number(x.retour.jus)||0); lie+=(Number(x.retour.lie)||0); kgRet+=x.kg;
                  if(x.retour.src==='prorata') prorata=true; }
    else sansRet++;
  });
  var vol=jus+lie;
  var poids=Object.keys(pk).map(Number).sort(function(a,b){return a-b;});
  var nbP=Object.keys(parc).length;
  // ⚠️ Les surfaces ne s'additionnent pas d'un passage à l'autre : deux
  // vendanges sur la même vigne ne font pas deux fois la surface.
  var haU={}; lignes.forEach(function(x){ if(x.ha>0) haU[x.parcelle]=Math.max(haU[x.parcelle]||0,x.ha); });
  var haNoms=Object.keys(haU), haTot=haNoms.reduce(function(a,k){ return a+haU[k]; },0);
  var avecHa=haNoms.length>0;

  var h='<div class="bl-part">'
   +'<div class="bl-box"><div class="k">Livr\u00e9 par</div><div class="v">'+_escHtml(window.DOMAINE_NOM||'Mon domaine')+'</div>'
   +'<div class="s">R\u00e9colte manuelle en caisses</div></div>'
   +'<div class="bl-box"><div class="k">Livr\u00e9 \u00e0</div><div class="v">'+_escHtml(client.nom)+'</div>'
   +'<div class="s">'+_escHtml(client.adresse||'')+'</div></div></div>';

  h+='<div class="bl-sec">Raisin livr\u00e9</div>'
   +'<table class="bl-t"><thead><tr><th>Date</th><th>Parcelle</th>'
   +(avecHa?'<th class="n">Surface</th>':'')
   +'<th class="n">Caisses</th><th class="n">kg/caisse</th><th class="n">Poids</th></tr></thead><tbody>';
  lignes.forEach(function(x){
    h+='<tr><td>'+_vendFrDate(x.date)+'</td><td class="b">'+_escHtml(x.parcelle)+'</td>'
     +(avecHa?('<td class="n">'+(x.ha>0?(_vendHa(x.ha)+' ha'):'\u2014')+'</td>'):'')
     +'<td class="n">'+x.caisses+'</td><td class="n">'+x.pck+' kg</td>'
     +'<td class="n b">'+_vendKgTxt(x.kg)+' kg</td></tr>';
  });
  h+='</tbody><tfoot><tr><td colspan="2">Total '+(mode==='jour'?'de la livraison':'de la campagne')+'</td>'
   +(avecHa?('<td class="n">'+_vendHa(haTot)+' ha</td>'):'')
   +'<td class="n">'+cs+'</td><td class="n"></td><td class="n">'+_vendKgTxt(kg)+' kg</td></tr></tfoot></table>';
  h+='<div class="bl-tiles">'
   +'<div class="bl-tile"><div class="v">'+_vendKgTxt(kg)+'<small>kg</small></div><div class="l">Poids livr\u00e9</div></div>'
   +'<div class="bl-tile"><div class="v">'+cs+'</div><div class="l">Caisses</div></div>'
   +'<div class="bl-tile"><div class="v">'+nbP+'</div><div class="l">Parcelle'+(nbP>1?'s':'')+'</div></div></div>';

  // Le retour du client n'apparaît que s'il existe : un tableau vide dirait
  // « rien n'a été pressé » là où il faut lire « on attend encore ».
  if(vol>0){
    h+='<div class="bl-sec">Retour du client \u2014 volumes obtenus</div>'
     +'<table class="bl-t"><thead><tr><th>Date</th><th>Parcelle</th><th class="n">Poids</th>'
     +'<th class="n">Jus</th><th class="n">Lie</th><th class="n">kg/hL</th></tr></thead><tbody>';
    lignes.forEach(function(x){
      var r=x.retour, v=r?((Number(r.jus)||0)+(Number(r.lie)||0)):0;
      h+='<tr><td>'+_vendFrDate(x.date)+'</td><td class="b">'+_escHtml(x.parcelle)+'</td>'
       +'<td class="n">'+_vendKgTxt(x.kg)+' kg</td>'
       +(r?('<td class="n">'+_vendKgTxt(r.jus||0)+' L</td><td class="n">'+_vendKgTxt(r.lie||0)+' L</td>'
            +'<td class="n b">'+_vendKgTxt(_vendRendKgHl(x.kg,v))+'</td>')
          :'<td class="n g" colspan="3">en attente</td>')+'</tr>';
    });
    h+='</tbody><tfoot><tr><td colspan="2">Total</td><td class="n">'+_vendKgTxt(kgRet)+' kg</td>'
     +'<td class="n">'+_vendKgTxt(jus)+' L</td><td class="n">'+_vendKgTxt(lie)+' L</td>'
     +'<td class="n">'+_vendKgTxt(_vendRendKgHl(kgRet,vol))+'</td></tr></tfoot></table>'
     +'<div class="bl-tiles">'
     +'<div class="bl-tile"><div class="v">'+_vendL1(vol/100)+'<small>hL</small></div><div class="l">Volume rendu</div></div>'
     +'<div class="bl-tile"><div class="v">'+_vendL1(lie/vol*100)+'<small>%</small></div><div class="l">Part de lie</div></div>'
     +'<div class="bl-tile"><div class="v">'+_vendKgTxt(_vendRendKgHl(kgRet,vol))+'<small>kg/hL</small></div>'
     +'<div class="l">Rendement</div></div></div>';
    if(sansRet>0)
      h+='<div class="bl-att">'+sansRet+' livraison'+(sansRet>1?'s':'')+' encore sans retour : les totaux de cette '
       +'section ne portent que sur '+_vendKgTxt(kgRet)+' kg des '+_vendKgTxt(kg)+' kg livr\u00e9s.</div>';
  } else {
    h+='<div class="bl-att">Volumes obtenus : en attente du retour du client (litres de jus et de lie).</div>';
  }

  h+='<div class="mvdoc-lim"><b>Comment ce poids est \u00e9tabli.</b> Nombre de caisses multipli\u00e9 par le poids '
   +'d\u00e9clar\u00e9 par caisse le jour de la r\u00e9colte'
   +(poids.length>1?(' \u2014 '+poids.join(' kg, ')+' kg selon les jours'):(' \u2014 '+(poids[0]||0)+' kg'))
   +'. Ce n\u2019est pas une pes\u00e9e : en cas d\u2019\u00e9cart, le pont-bascule du r\u00e9ceptionnaire fait foi.'
   +(avecHa?' <b>Les surfaces sont celles achet\u00e9es sur chaque parcelle</b>, telles que convenues avec le domaine ; '
            +'une parcelle vendang\u00e9e en deux passages n\u2019est compt\u00e9e qu\u2019une fois.':'')
   +(vol>0?(' <b>Les volumes sont ceux annonc\u00e9s par le client</b>, ils n\u2019engagent pas le domaine.'
            +(prorata?' Le d\u00e9tail par parcelle est une r\u00e9partition au prorata des kilos, pas une mesure.':'')):'')
   +' Document produit par Ma Vigne \u00e0 partir du journal de vendange du domaine.</div>';
  h+='<div class="bl-sig"><div><div class="k">Le livreur</div><div class="s">Date et signature</div></div>'
   +'<div><div class="k">Le r\u00e9ceptionnaire</div><div class="s">Date, signature et cachet</div></div></div>';
  return h;
}
function _vendDocBon(ci,li){
  var c=_vendClients()[ci]; if(!c) return;
  var l=_vendLivs(c.nom)[li]; if(!l){ showToast('Livraison introuvable','#E07060'); return; }
  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var an=String(l.date).slice(0,4);
  var num='BL '+an+'-'+String(l.date).slice(5,7)+String(l.date).slice(8,10)+'-'+_vendInit(c.nom);
  var maj=_livRetour(l)?('Compl\u00e9t\u00e9 du retour client le '+_vendFrDate(_livDateRet(l))):'';
  window._mvDocOpen({
    titre:'Bon de livraison \u2014 raisin en vrac', domaine:(window.DOMAINE_NOM||'Mon domaine'), cat:'cave',
    metas:[num,'Mill\u00e9sime '+an,'Livraison du '+_vendFrDate(l.date),maj],
    corps:_vendBlCorps(c,_vendBlLignes([l]),'jour'), css:VD_BL_CSS
  });
}
function _vendDocRecap(ci){
  var c=_vendClients()[ci]; if(!c) return;
  var ls=_vendLivs(c.nom); if(!ls.length){ showToast('Aucune livraison','#E07060'); return; }
  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var lignes=_vendBlLignes(ls);
  var an=String(lignes[0].date).slice(0,4);
  window._mvDocOpen({
    titre:'R\u00e9capitulatif de campagne \u2014 raisin en vrac', domaine:(window.DOMAINE_NOM||'Mon domaine'), cat:'cave',
    metas:['RC '+an+'-'+_vendInit(c.nom),'Mill\u00e9sime '+an,
           ls.length+' livraison'+(ls.length>1?'s':'')+' du '+_vendFrDate(lignes[0].date)
           +' au '+_vendFrDate(lignes[lignes.length-1].date)],
    corps:_vendBlCorps(c,lignes,'campagne'), css:VD_BL_CSS
  });
}

function _vendRepParts(){
  return _vrep.filter(function(p){ return _vpCs(p)>0; }).map(function(p){
    var o={dom:!!p.dom, caisses:_vpCs(p), pck:_vpPck(p)};
    if(!p.dom) o.client=p.client||'';
    if(_vpSurf(p)>0) o.surface=_vpSurf(p);
    if(p.retour) o.retour=p.retour;
    return o;
  });
}

function _vendParcSurf(nom){
  if(!nom) return 0;
  var ps=window.PARCELLES||[]; var k=String(nom).trim().toLowerCase();
  var p=ps.find(function(x){return x&&String(x.nom||'').trim().toLowerCase()===k;});
  return p?(parseFloat(p.surface)||0):0;
}

// —— Hôte bottom-sheet (cave.js seul, indépendant d'index.html) ——
function _vendSheet(html){
  _vendEnsureSheetCss();
  var ov=document.getElementById('mvv-ov');
  if(!ov){ ov=document.createElement('div'); ov.id='mvv-ov'; ov.className='mvv-ov';
    ov.addEventListener('click',function(e){ if(e.target===ov) _vendSheetClose(); });
    document.body.appendChild(ov); }
  ov.innerHTML='<div class="mvv-sheet" onclick="event.stopPropagation()">'+html+'</div>';
  requestAnimationFrame(function(){ ov.classList.add('open'); });
}
function _vendSheetClose(){ var ov=document.getElementById('mvv-ov'); if(ov) ov.classList.remove('open'); }

// —— Injection du champ « client » dans l'overlay récolte (cave.js seul) ——
function _vendInjectClientField(sel){
  var anchor=document.getElementById('vrec-vinif-section');
  if(!anchor||!anchor.parentNode) return;
  var row=document.getElementById('vrec-client-row');
  if(!row){
    row=document.createElement('div'); row.id='vrec-client-row'; row.style.marginBottom='12px';
    row.innerHTML='<label style="display:block;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--terre,#8A5A38);margin-bottom:6px">Client (vente en vrac)</label>'
      +'<select id="vrec-client" class="fi ac" style="width:100%" onchange="_vndSyncCaisses()"></select>';
    anchor.parentNode.insertBefore(row,anchor);
  }
  var s=document.getElementById('vrec-client');
  if(s){
    s.innerHTML='<option value="">— Aucun (vinifié / vrac générique) —</option>'
      +_vendClients().map(function(c){return '<option value="'+_escHtml(c.nom)+'"'+(c.nom===sel?' selected':'')+'>'+_escHtml(c.nom)+' · '+(c.poids_caisse_kg||25)+' kg/caisse</option>';}).join('');
  }
}

// —— Décuvage → élevage (Le Chai) ——
var _vendDecNb=2, _vendDecCuveId=null;
// Ou part le vin : 'fut' (comme avant) | 'cuve' | 'mixte'.
// ⚠️ 'fut' est le DEFAUT et le reste : un domaine sans cuve ne doit voir aucune
//   difference. La bascule n'apparait meme pas si le parc a cuves est vide.
var _vendDecMode='fut', _vendDecCuveRef=null, _vendDecCuveL=0;
/* CUV-10 : coche par defaut. Chez ce domaine la FA finit en cuve — le cas
   courant ne doit demander aucun geste. */
var _vendDecFaFinie=true;
// Choix des futs a l'entonnage : {lot_id: nb}. Vide = on retombe sur le simple
// compte de barriques, comme avant ce lot.
var _vendDecChoix={};
/* ★★★ CUV-14 — LE VOLUME DECUVE SE SAISIT. null = pas saisi : les futs se
   proposent sur l'estimation des caisses, et le volume ecrit reste celui des
   contenants remplis, exactement comme avant. Saisi, c'est un FAIT MESURE : il
   fait le rendement (vol_decuve_hl, vol_decuve_src='mesure') et la proposition. */
var _vendDecVolSaisi=null;
// Le volume loge en cuve a-t-il ete retouche a la main ? Sinon il suit le volume decuve.
var _vendDecCuveTouche=false;
// Ce que la liste dit apres un fut hors format ajoute.
var _vendDecNote='';
function openVendDecuvage(cuveId){
  if(!canWrite()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  if(!c){ showToast('Cuve introuvable','#E07060'); return; }
  _vendDecCuveId=cuveId;
  var yr=new Date().getFullYear();
  _vendDecMode='fut'; _vendDecCuveRef=null; _vendDecCuveL=0;
  _vendDecFaFinie=true;
  _vendDecVolSaisi=null; _vendDecCuveTouche=false; _vendDecNote='';
  // ⚠️ Le CSS du parc vit dans _caveV2InjectCss : sans cet appel, le selecteur
  //   de cuve sortirait SANS STYLE quand on decuve sans etre passe par Le Chai.
  _caveV2InjectCss();
  // Proposition : du plus VIEUX au plus neuf. Un fut age doit tourner ; le neuf
  // se garde pour les cuvees qui le meritent. Proposition, jamais contrainte.
  _vendDecChoix={};
  _vendDecPropose();
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Décuver → Le Chai</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">La cuve sort du Cuvier et devient une cuvée en élevage dans « Le Chai ». Le vin en barrique commence son suivi d\'ouillage.</div>'
    +'<label class="mvv-flbl">Nom de la cuvée</label>'
    +'<input id="vdec-nom" class="mvv-tin" type="text" value="'+_escHtml(c.nom||'')+'">'
    +'<label class="mvv-flbl">Millésime</label>'
    +'<input id="vdec-mil" class="mvv-tin" type="number" value="'+yr+'" min="2000" max="'+(yr+1)+'">'
    +_vendDecFaHtml(c)
    +_vendDecVolHtml()
    +_vendDecSegHtml()
    +'<div id="vdec-zone"></div>'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendDecuvage()" id="vdec-go">D\u00e9cuver et cr\u00e9er la cuv\u00e9e</button>';
  _vendSheet(html);
  _vendDecVolBind();
  _vendDecZone();
}

/* ★★★ CUV-10 — CE QUE LE DECUVAGE ENREGISTRE EN PLUS.
   Deux choses, et elles sont dans le meme geste parce qu'elles se decident au
   meme moment, la main sur la vanne :
     - l'etat de la fermentation, CONSTATE : « termin\u00e9e » par defaut, parce que
       c'est le cas courant ici. La decocher est un acte volontaire — on ecoule
       expres avec du sucre pour finir en phase liquide ;
     - la densite de la masse a l'entonnage, goutte et presse assemblees.
   ⚠ Aucun des deux n'est OBLIGATOIRE : un decuvage sans densite reste un
     decuvage. Un champ qui bloque une vanne se contourne par un faux chiffre. */
function _vendDecFaHtml(c){
  var rep=_vendLastD(c), d=rep?Math.round(_vendMesD20(rep)):null;
  return '<label class="mvv-flbl">La fermentation est-elle termin\u00e9e\u00a0?</label>'
    +'<div class="mvv-optabs" id="vdec-fa">'
    +'<button type="button" class="mvv-optab on" onclick="_vendDecFaSet(1)">Termin\u00e9e en cuve</button>'
    +'<button type="button" class="mvv-optab" onclick="_vendDecFaSet(0)">Elle finira au chai</button>'
    +'</div>'
    +'<div class="mvv-fnote" id="vdec-fa-note">C\u2019est vous qui le constatez, \u00e0 la d\u00e9gustation '
    +'et \u00e0 l\u2019\u00e9tat de la cuve. Aucun chiffre ne le d\u00e9cide.'
    +(d!=null?(' Dernier relev\u00e9\u00a0: <b>'+d+'</b> \u00e0 20\u00a0\u00b0C.'):'')+'</div>'
    +'<label class="mvv-flbl">Densit\u00e9 \u00e0 la mise en f\u00fbt <span class="mvv-fhint">(facultatif)</span></label>'
    +'<div style="display:flex;gap:9px">'
    +'<input id="vdec-dens" class="mvv-tin" type="number" step="0.1" inputmode="decimal" placeholder="densit\u00e9">'
    +'<input id="vdec-temp" class="mvv-tin" type="number" step="0.1" inputmode="decimal" placeholder="\u00b0C">'
    +'</div>'
    +'<div class="mvv-fnote">La masse assembl\u00e9e, <b>goutte et presse</b>\u00a0: le pressurage relargue '
    +'du sucre, la densit\u00e9 remonte. C\u2019est celle-l\u00e0 que Le Chai affichera.</div>';
}
function _vendDecFaSet(v){
  _vendDecFaFinie=!!v;
  var z=document.getElementById('vdec-fa');
  if(z){ var b=z.querySelectorAll('.mvv-optab');
    if(b[0]) b[0].classList.toggle('on',_vendDecFaFinie);
    if(b[1]) b[1].classList.toggle('on',!_vendDecFaFinie); }
}
window._vendDecFaSet=_vendDecFaSet;

/* ★★★ CUV-14 — LE CHAMP « VOLUME DECUVE ». Facultatif, comme la densite : un
   decuvage sans volume saisi reste un decuvage, et le volume ecrit est alors
   celui des contenants remplis. Un champ qui bloque une vanne se contourne par
   un faux chiffre ; seul un volume IMPOSSIBLE (plus que la cuve) est refuse, a
   l'enregistrement — le piege des litres tapes en hL. */
function _vendDecVolHtml(){
  var est=_vendDecVolEst();
  return '<label class="mvv-flbl" for="vdec-vol">Volume d\u00e9cuv\u00e9 <span class="mvv-fhint">(goutte et presse)</span></label>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<input id="vdec-vol" class="mvv-tin" type="text" inputmode="decimal" autocomplete="off" placeholder="'
    +(est>0?('environ '+_vendCuvF1(est)+(_vendDecEstCaisses()?' d\u2019apr\u00e8s les caisses':' (contenance de la cuve)')):'volume mesur\u00e9')+'">'
    +'<span class="mvv-step2-u">hL</span></div>'
    +'<div class="mvv-fnote" id="vdec-vol-note">'+_vendDecVolNote()+'</div>';
}
function _vendDecVolNote(){
  var c=_vendDecCuveObj(), cap=parseFloat(c&&c.volume_hl)||0, est=_vendDecVolEst();
  if(_vendDecVolSaisi==null)
    return 'Pas encore saisi\u00a0: les f\u00fbts se proposent sur '
      +(est>0?((_vendDecEstCaisses()?'l\u2019estimation des caisses':'la contenance de la cuve')+' (environ '+_vendCuvF1(est)+'\u00a0hL)'):'le volume de la cuve')
      +'. Saisissez le volume <b>mesur\u00e9</b>\u00a0: c\u2019est lui qui fera le rendement des parcelles de la cuve. '
      +'Laiss\u00e9 vide, on retient le volume des contenants remplis, comme avant.';
  if(cap>0 && _vendDecVolSaisi>cap)
    return '<b>Plus que la contenance de la cuve ('+_vendCuvF1(cap)+'\u00a0hL).</b> Le volume se saisit en hL\u00a0: '
      +'1\u202f130\u00a0L\u00a0= 11,30\u00a0hL. Il ne s\u2019enregistrera pas ainsi.';
  return '<b>Mesur\u00e9</b>\u00a0: c\u2019est ce volume qui fera le rendement des parcelles de la cuve. Les f\u00fbts se proposent dessus.';
}
function _vendDecVolBind(){
  var vi=document.getElementById('vdec-vol'); if(!vi) return;
  vi.addEventListener('input',function(){
    var x=parseFloat(String(vi.value||'').replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
    _vendDecVolSaisi=(isFinite(x)&&x>0)?Math.round(x*100)/100:null;
    var n=document.getElementById('vdec-vol-note'); if(n) n.innerHTML=_vendDecVolNote();
    _vendDecRecap();
  });
  /* ⚠️⚠️ Sur `change` — le champ perd le focus — la proposition se refait SUR
     PLACE (_vendDecRender), jamais en reconstruisant la zone : `change` tombe au
     moment precis ou le doigt touche un « + », et un bouton reconstruit a cet
     instant avale le toucher. Vu sur la maquette v1 : le « + » ne faisait rien. */
  vi.addEventListener('change',function(){
    _vendDecNote='';
    if(_vendDecMode!=='fut' && _vendDecCuveRef && !_vendDecCuveTouche){
      var p=_caveCuve(_vendDecCuveRef);
      if(p) _vendDecCuveL=Math.min(parseFloat(p.litres)||0, Math.round(_vendDecVolHl()*100));
    }
    _vendDecPropose(); _vendDecRender();
  });
}

// La bascule n'existe que s'il y a des cuves : sinon, l'ecran d'avant, a l'identique.
function _vendDecSegHtml(){
  if(!_caveParc().length) return '';
  var o=[['fut','En barriques','comme avant'],['cuve','En cuve','du parc'],['mixte','Les deux','cuve + f\u00fbts']];
  return '<label class="mvv-flbl">O\u00f9 part le vin ?</label><div class="mvv-dseg" id="vdec-seg">'
    +o.map(function(x){
      return '<button type="button" data-m="'+x[0]+'"'+(x[0]===_vendDecMode?' class="on"':'')
        +' onclick="_vendDecMode2(\'' + x[0] + '\')">'+x[1]+'<span class="sm">'+x[2]+'</span></button>';
    }).join('')+'</div>';
}
function _vendDecCuveObj(){
  return (CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendDecCuveId;})||null;
}
// ★ RDT-3 — le nombre de barriques se propose sur le volume ATTENDU dans la
// cuve (les caisses du domaine au ratio kg/hL), plus sur `volume_hl` qui est la
// contenance : une cuve a moitie pleine proposait deux fois trop de futs.
function _vendDecVolEst(){
  var c=_vendDecCuveObj(); if(!c) return 0;
  // ★ VOL-1 — la seule porte ; sans caisse, la contenance ne fait que PROPOSER (§152a).
  var v=_vendVolContenu(c);
  return v.hl>0?v.hl:(parseFloat(c.volume_hl)||0);
}
function _vendDecEstCaisses(){
  var c=_vendDecCuveObj(); if(!c) return false;
  var v=_vendVolContenu(c); return v.src==='estime' && v.hl>0;
}
// ★ CUV-14 — le volume de reference : le MESURE s'il est saisi, sinon l'estime.
function _vendDecVolHl(){ return (_vendDecVolSaisi!=null)?_vendDecVolSaisi:_vendDecVolEst(); }

// ⚠️ On ne re-rend QUE la zone : reconstruire la feuille effacerait le nom et le
//   millesime deja saisis. Meme piege que _vendDecRender.
function _vendDecMode2(m){
  _vendDecMode=m; _vendDecNote='';
  if(m==='fut'){ _vendDecCuveRef=null; _vendDecCuveL=0; }
  if(m==='cuve'){ _vendDecChoix={}; }
  _vendDecPropose();
  var seg=document.getElementById('vdec-seg');
  if(seg) Array.prototype.forEach.call(seg.querySelectorAll('button'),function(b){
    b.classList.toggle('on', b.getAttribute('data-m')===m);
  });
  _vendDecZone();
}
/* ★★ FUT-CAP — LA PROPOSITION SE FAIT AU VOLUME, chaque lot a SA contenance.
   Des futs pleins d'abord, du plus vieux au plus neuf, puis un dernier si le
   reste en remplit au moins la moitie. Sur des lots tous au reglage du domaine,
   c'est exactement l'arrondi d'avant (volume / 2,28) : le harnais le rejoue
   litre par litre. Ce que la cuve ne prend pas part en barriques (mixte).
   ⚠️ Un fut HORS FORMAT (demi-muid, feuillette…) n'est jamais propose d'office :
   il se choisit. Ceux qui sont choisis restent, et les barriques se recalculent
   sur ce qu'ils ne prennent pas.
   ⚠️ Plancher a 0, sauf « En barriques » : en mixte la cuve peut tout prendre. */
function _vendDecPropose(){
  var resteL=Math.round(_vendDecVolHl()*100)-(_vendDecMode==='mixte'?_vendDecCuveL:0);
  if(_vendDecMode==='cuve'){ _vendDecChoix={}; _vendDecNb=0; return; }
  if(_vendDecParcVide()){
    _vendDecChoix={};
    _vendDecNb=Math.max(_vendDecMode==='fut'?1:0, Math.round(Math.max(0,resteL)/_caveFutL()));
    return;
  }
  var lots=window._mvFutStock(window.INTRANTS).lots, garde={};
  lots.forEach(function(l){
    var n=Math.min(parseInt(_vendDecChoix[l.id],10)||0, l.qte);
    if(n>0 && _caveHorsFormat(_vendDecLotL(l))){ garde[l.id]=n; resteL-=n*_vendDecLotL(l); }
  });
  var std=lots.filter(function(l){ return !_caveHorsFormat(_vendDecLotL(l)); });
  _vendDecChoix=_vendDecPropVol(std, resteL, garde);
  if(_vendDecMode==='fut' && !_vendDecTotal()){
    var v=std.filter(function(l){ return l.qte>0; }).sort(_vendDecVieux)[0];
    if(v) _vendDecChoix[v.id]=1;
  }
  _vendDecNb=_vendDecTotal();
}
function _vendDecVieux(a,b){
  if(a.annee==null) return 1;
  if(b.annee==null) return -1;
  return a.annee-b.annee;
}
function _vendDecLotL(l){ var v=parseFloat(l&&l.l); return (isFinite(v)&&v>0)?v:_caveFutL(); }
// Pure (le harnais la rejoue) : lots au format, reste en LITRES, choix deja poses.
function _vendDecPropVol(lots, resteL, choix){
  var out=Object.assign({}, choix||{});
  var std=lots.filter(function(l){ return l.qte>0; }).slice().sort(_vendDecVieux);
  std.forEach(function(l){
    if(resteL<=0) return;
    var cap=_vendDecLotL(l), n=Math.min(l.qte-(out[l.id]||0), Math.floor(resteL/cap));
    if(n>0){ out[l.id]=(out[l.id]||0)+n; resteL-=n*cap; }
  });
  var nx=std.filter(function(l){ return (out[l.id]||0)<l.qte; })[0];
  if(nx && resteL>0 && resteL>=_vendDecLotL(nx)/2) out[nx.id]=(out[nx.id]||0)+1;
  return out;
}

function _vendDecPickHtml(){
  var libres=_caveParc().filter(function(p){ return !_caveCuveOcc(p.id, _vendDecCuveId); });
  if(!libres.length)
    return '<div class="mvv-dlnote">Aucune cuve libre dans le parc. Lib\u00e9rez-en une, '
      +'ou d\u00e9clarez-en une nouvelle dans la roue crant\u00e9e de la Cave, bloc Le Chai.</div>';
  var volHl=_vendDecVolHl();
  var h='<label class="mvv-flbl">Quelle cuve</label>';
  libres.forEach(function(p){
    var cap=(parseFloat(p.litres)||0)/100, sel=(_vendDecCuveRef===p.id), m=_caveMat(p.matiere);
    var ok=cap>=volHl;
    h+='<button type="button" class="mvc-pk mvc-aff-c'+(sel?' sel':'')+'" onclick="_vendDecPick(\'' + _escAttr(p.id) + '\')">'
      +'<span class="mvc-aff-rad"></span>'
      +'<span class="mvc-pk-ic '+_caveMatKey(p.matiere)+'">'+_mvIcon('cuve',18)+'</span>'
      +'<span class="mvc-pk-b"><span class="mvc-pk-n">'+_escHtml(p.nom||'Cuve')+'</span>'
      +'<span class="mvc-pk-m">'+_escHtml(m.lbl)+' \u00b7 '+_mvF1(cap)+' hL de contenance</span></span>'
      +'<span class="mvc-pk-r"><span id="vdec-fit-'+_escAttr(p.id)+'" class="mvc-dfit '+(ok?'good':'tight')+'">'
      +(ok?'tout tient':('reste '+_mvF1(volHl-cap)+' hL'))+'</span></span></button>';
  });
  if(_vendDecCuveRef){
    var p2=_caveCuve(_vendDecCuveRef), cap2=(parseFloat(p2&&p2.litres)||0)/100;
    h+='<label class="mvv-flbl" for="vdec-cl">Volume log\u00e9 '
      +'<span class="mvv-fhint">(contenance '+_mvF1(cap2)+' hL)</span></label>'
      +'<input id="vdec-cl" class="mvv-tin" type="number" step="0.1" inputmode="decimal" '
      +'value="'+_mvF1(_vendDecCuveL/100).replace(',','.')+'" oninput="_vendDecCuveVol(this.value)">';
    if(!_caveMat(p2&&p2.matiere).ouille && _vendDecMode==='cuve')
      h+='<div class="mvv-dneuf">'+_escHtml((p2&&p2.nom)||'Cette cuve')+' ne respire pas : cette cuv\u00e9e '
        +'arrivera au Chai <b>sans suivi d\u2019ouillage</b>. C\u2019est voulu, pas un oubli.</div>';
  }
  return h;
}
function _vendDecPick(ref){
  var p=_caveCuve(ref); if(!p) return;
  _vendDecCuveRef=ref; _vendDecCuveTouche=false;
  _vendDecCuveL=Math.min(parseFloat(p.litres)||0, Math.round(_vendDecVolHl()*100));
  if(_vendDecMode==='mixte') _vendDecPropose();
  _vendDecZone();
}
function _vendDecCuveVol(v){
  var p=_caveCuve(_vendDecCuveRef); if(!p) return;
  var x=parseFloat(String(v||'').replace(',','.'));
  _vendDecCuveL = isFinite(x)&&x>0 ? Math.round(x*100) : 0;
  _vendDecCuveTouche=true;
  // ⚠️ On ne re-rend PAS la zone ici : le champ perdrait le focus a chaque
  //   frappe. Seuls le recap et, en mixte, le reste en barriques se mettent
  //   a jour — et le nombre de barriques n'est recalcule qu'a la sortie du champ.
  _vendDecRecap();
}
function _vendDecCuveVolFin(){
  // ★ CUV-14 — a la sortie du champ : SUR PLACE (voir _vendDecVolBind).
  if(_vendDecMode==='mixte'){ _vendDecPropose(); _vendDecRender(); }
}
function _vendDecLogeHl(){
  var futsL=0;
  if(_vendDecMode!=='cuve'){
    if(_vendDecParcVide()) futsL=_vendDecNb*_caveFutL();
    else window._mvFutStock(window.INTRANTS).lots.forEach(function(l){
      futsL+=(parseInt(_vendDecChoix[l.id],10)||0)*_vendDecLotL(l); });
  }
  return (futsL+(_vendDecMode==='fut'?0:_vendDecCuveL))/100;
}
// La plus petite contenance choisie : ce que « le dernier fut » peut attendre.
function _vendDecMinL(){
  if(_vendDecMode==='cuve') return 0;
  if(_vendDecParcVide()) return _vendDecNb>0?_caveFutL():0;
  var m=0;
  window._mvFutStock(window.INTRANTS).lots.forEach(function(l){
    if((parseInt(_vendDecChoix[l.id],10)||0)>0){ var c=_vendDecLotL(l); if(!m||c<m) m=c; } });
  return m;
}
function _vendDecF2(x){
  return (Math.round((x||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
/* ★★ CUV-14 — LE BILAN SE LIT AU LITRE QUAND LE VOLUME EST MESURE. Pur (le
   harnais le rejoue). Estime : la tolerance d'avant (0,6 hL), et le libelle dit
   d'ou vient le chiffre (pas de « ≈ » : il n'est pas dans les polices de l'app). Mesure : un reste plus petit qu'un fut n'est pas une
   faute, c'est « le dernier fut attend 10 L » — il se complete a l'ouillage.
   Un fut de trop, ou plus de 0,6 hL sans contenant, reste orange. */
function _vendDecBilan(vol, mesure, loge, minL, mode, estLbl){
  var ec=vol-loge, ecL=Math.round(ec*100), ko=false, t;
  if(!mesure){
    if(Math.abs(ec)>0.6){ ko=true; t= ec>0 ? ' \u2014 il reste '+_mvF1(ec)+' hL sans contenant' : ' \u2014 '+_mvF1(-ec)+' hL de trop'; }
    else t=' \u2014 le compte est bon';
    return {ko:ko, n:_mvF1(loge), l:'hL log\u00e9s sur '+_mvF1(vol)+' hL'+(estLbl?(' '+estLbl):'')+t};
  }
  if(Math.abs(ecL)<=2) t=' \u2014 le compte est bon';
  else if(ecL<0){
    if(mode!=='cuve' && minL>0 && -ecL<minL) t=' \u2014 le dernier f\u00fbt attend '+(-ecL)+'\u00a0L';
    else { ko=true; t=' \u2014 '+_vendDecF2(-ec)+' hL de contenants en trop'; }
  } else if(ec>0.6){ ko=true; t=' \u2014 il reste '+_vendDecF2(ec)+' hL sans contenant'; }
  else t=' \u2014 il reste '+ecL+'\u00a0L sans contenant';
  return {ko:ko, n:_vendDecF2(loge), l:'hL log\u00e9s sur '+_vendDecF2(vol)+' hL d\u00e9cuv\u00e9s'+t};
}
function _vendDecRecapHtml(){
  var b=_vendDecBilan(_vendDecVolHl(), _vendDecVolSaisi!=null, _vendDecLogeHl(), _vendDecMinL(), _vendDecMode,
    _vendDecEstCaisses()?'estim\u00e9s d\u2019apr\u00e8s les caisses':'(contenance de la cuve)');
  return '<div class="mvv-dtot"><span class="mvv-dtot-n'+(b.ko?' ko':'')+'">'+b.n+'</span>'
    +'<span class="mvv-dtot-l">'+b.l+'</span></div>';
}
function _vendDecRecap(){ var e=document.getElementById('vdec-recap'); if(e) e.innerHTML=_vendDecRecapHtml(); }

function _vendDecZone(){
  var z=document.getElementById('vdec-zone'); if(!z) return;
  var c=_vendDecCuveObj(); if(!c) return;
  var _futHl=_caveFutHl(), _futTxt=String(_futHl).replace('.',',');
  var h='';
  if(_vendDecMode!=='fut') h+=_vendDecPickHtml();
  if(_vendDecMode!=='cuve'){
    h+=(_vendDecParcVide()
      ? ('<label class="mvv-flbl">Nombre de barriques <span class="mvv-fhint">(<span id="vdec-nb-vol">'
        +_vendDecNbVolTxt()+'</span> \u00f7 '+_futTxt+' hL)</span></label>'
        +'<div class="mvv-step2"><button class="mvv-step2-b" onclick="_vendDecAdj(-1)">\u2212</button>'
        +'<span id="vdec-nb" class="mvv-step2-v">'+_vendDecNb+'</span>'
        +'<button class="mvv-step2-b" onclick="_vendDecAdj(1)">+</button>'
        +'<span class="mvv-step2-u">barriques ('+_futTxt+' hL)</span></div>')
      : '')
      +_vendDecLotsHtml();
  }
  h+='<div id="vdec-recap">'+_vendDecRecapHtml()+'</div>';
  z.innerHTML=h;
  var cl=document.getElementById('vdec-cl');
  if(cl) cl.addEventListener('change', _vendDecCuveVolFin);
  _vendDecRender();
}
function _vendDecNbVolTxt(){ return _vendDecMode==='mixte'?'pour le reste':('\u2248 '+_vendCuvF1(_vendDecVolHl())+' hL'); }
function _vendDecGoLbl(tot){
  var go=document.getElementById('vdec-go'); if(!go) return;
  if(_vendDecMode==='cuve'){
    var p=_caveCuve(_vendDecCuveRef);
    go.textContent = p ? ('D\u00e9cuver dans '+p.nom) : 'Choisissez une cuve';
    return;
  }
  var hf=0;   // un demi-muid n'est pas une barrique : le bouton dit « futs »
  if(tot>0 && !_vendDecParcVide()) window._mvFutStock(window.INTRANTS).lots.forEach(function(l){
    if(_caveHorsFormat(_vendDecLotL(l))) hf+=parseInt(_vendDecChoix[l.id],10)||0; });
  var mot=hf?'f\u00fbt':'barrique';
  go.textContent = tot>0 ? ('D\u00e9cuver dans '+tot+' '+mot+(tot>1?'s':'')
    +(_vendDecCuveRef?' et une cuve':'')) : 'D\u00e9cuver et cr\u00e9er la cuv\u00e9e';
}

// ⚠️ Plancher a 0, pas a 1 : en mixte la cuve peut tout prendre, et « au moins
//   une barrique » forcerait un fut fantome dans la cuvee.
function _vendDecAdj(d){
  _vendDecNb=Math.max(_vendDecMode==='fut'?1:0,_vendDecNb+d);
  _vendDecRender();
}

// ── ENTONNAGE : piocher les futs dans le parc ─────────────────────────────
// Le parc vit dans La Reserve (INTRANTS.futs) ; le moteur dans utils.js. Si l'un
// ou l'autre manque — domaine qui n'a jamais rempli son parc, utils.js anterieur
// a ce lot — on retombe sur le simple compte de barriques d'avant. Personne n'est
// bloque parce qu'il n'a pas fait son inventaire.
function _vendDecParcVide(){
  if(typeof window._mvFutStock!=='function' || !window.INTRANTS) return true;
  return !window._mvFutStock(window.INTRANTS).lots.length;
}
function _vendDecTotal(){
  return (typeof window._mvFutTotal==='function') ? window._mvFutTotal(_vendDecChoix) : 0;
}
function _vendDecLotsHtml(){
  if(_vendDecParcVide()){
    return '<div class="mvv-dlnote">Aucun f\u00fbt libre dans La R\u00e9serve. '
      + 'Renseignez votre parc \u00e0 f\u00fbts pour choisir vos barriques une \u00e0 une.</div>';
  }
  var st=window._mvFutStock(window.INTRANTS), adm=(typeof isAdmin==='function'&&isAdmin());
  var h='<label class="mvv-flbl">Quelles barriques '
    +'<span class="mvv-fhint">('+_caveLTxt(_caveFutL())+'\u00a0L chacune, sauf mention)</span></label>'
    +'<div class="mvv-dlots">';
  st.lots.forEach(function(l){
    var cap=_vendDecLotL(l), perso=(cap!==_caveFutL()), capTxt=_caveLTxt(cap)+'\u00a0L', id=_escAttr(l.id);
    h+='<div class="mvv-dlot"><span class="mvv-dlot-b">'
      +'<span class="mvv-dlot-n">'+_escHtml(l.nom)+(_caveHorsFormat(cap)?'<span class="mvc-dhf">hors format</span>':'')+'</span>'
      +'<span class="mvv-dlot-m">'+(l.annee||'ann\u00e9e inconnue')+' \u00b7 '
      +window._mvFutAge(l.vins)+' \u00b7 '+l.qte+' libre'+(l.qte>1?'s':'')+' \u00b7 '
      +(adm
        ? ('<button type="button" class="mvv-dcap'+(perso?' perso':'')+'" onclick="_vendDecCap(\''+_escAttr(l.id)+'\')" '
          +'aria-label="Contenance d\u2019un f\u00fbt de ce lot\u00a0: '+capTxt+'. Modifier">'+capTxt+_mvIcon('crayon',16)+'</button>')
        : ('<span class="mvv-dcap nb'+(perso?' perso':'')+'">'+capTxt+'</span>'))
      +'</span></span>'
      +'<span class="mvv-dstp">'
      +'<button type="button" id="vdec-m-'+id+'" onclick="_vendDecAdjLot(\''+_escAttr(l.id)+'\',-1)" aria-label="Un f\u00fbt de moins">\u2212</button>'
      +'<span id="vdec-n-'+id+'">0</span>'
      +'<button type="button" id="vdec-p-'+id+'" onclick="_vendDecAdjLot(\''+_escAttr(l.id)+'\',1)" aria-label="Un f\u00fbt de plus">+</button></span></div>';
  });
  return h+'</div><div id="vdec-lots-tot"></div>';
}
function _vendDecHorsHl(){
  var s=0;
  if(!_vendDecParcVide()) window._mvFutStock(window.INTRANTS).lots.forEach(function(l){
    if(_caveHorsFormat(_vendDecLotL(l))) s+=(parseInt(_vendDecChoix[l.id],10)||0)*_vendDecLotL(l); });
  return s/100;
}
function _vendDecLotsTotHtml(st){
  var tot=_vendDecTotal(), neuf=0, hf=0, libres=false;
  st.lots.forEach(function(l){
    var n=parseInt(_vendDecChoix[l.id],10)||0, h=_caveHorsFormat(_vendDecLotL(l));
    if(l.vins===0) neuf+=n;
    if(h) hf+=n;
    if(!h && n<l.qte) libres=true;
  });
  var o='<div class="mvv-dtot"><span class="mvv-dtot-n">'+tot+'</span><span class="mvv-dtot-l">f\u00fbt'+(tot>1?'s':'')
    +' choisi'+(tot>1?'s':'')+(hf?(' dont '+hf+' hors format'):'')+'</span></div>';
  if(neuf>0) o+='<div class="mvv-dneuf">'+_mvIcon('etincelles',16)+' dont <b>'+neuf+' barrique'+(neuf>1?'s':'')+' neuve'
    +(neuf>1?'s':'')+'</b> \u2014 v\u00e9rifiez que cette cuv\u00e9e les m\u00e9rite.</div>';
  if(_vendDecNote) o+='<div class="mvv-dlnote">'+_vendDecNote+'</div>';
  else if(st.lots.some(function(l){ return _caveHorsFormat(_vendDecLotL(l)); }))
    o+='<div class="mvv-dlnote">Un f\u00fbt hors format n\u2019est jamais propos\u00e9 d\u2019office\u00a0: ajoutez-le avec +, '
      +'les barriques se recalculent sur le reste.</div>';
  if(!libres && _vendDecVolHl()-_vendDecLogeHl()>0.6)
    o+='<div class="mvv-dwarn">Plus de f\u00fbt libre au format du domaine pour ce volume. '
      +'Compl\u00e9tez votre parc dans La R\u00e9serve, ou d\u00e9cuvez quand m\u00eame \u2014 rien n\u2019est bloqu\u00e9.</div>';
  return o;
}
/* ⚠️⚠️ CUV-14 — LA LISTE SE REND UNE FOIS (_vendDecZone). Ici on met a jour SUR
   PLACE compteurs, total, bilan et bouton : reconstruire les boutons au `change`
   d'un champ avale le toucher qui l'a provoque (voir _vendDecVolBind). Et
   jamais la feuille entiere : elle effacerait le nom et le millesime saisis. */
function _vendDecRender(){
  var st=_vendDecParcVide()?null:window._mvFutStock(window.INTRANTS);
  if(st && _vendDecMode!=='cuve'){
    st.lots.forEach(function(l){
      var n=parseInt(_vendDecChoix[l.id],10)||0;
      var e=document.getElementById('vdec-n-'+l.id), m=document.getElementById('vdec-m-'+l.id),
          p=document.getElementById('vdec-p-'+l.id);
      if(e) e.textContent=n;
      if(m) m.disabled=(n<=0);
      if(p) p.disabled=(n>=l.qte);
    });
    var t=document.getElementById('vdec-lots-tot'); if(t) t.innerHTML=_vendDecLotsTotHtml(st);
  }
  var nb=document.getElementById('vdec-nb'); if(nb) nb.textContent=_vendDecNb;
  var nv=document.getElementById('vdec-nb-vol'); if(nv) nv.textContent=_vendDecNbVolTxt();
  var vol=_vendDecVolHl();
  _caveParc().forEach(function(p){
    var b=document.getElementById('vdec-fit-'+p.id); if(!b) return;
    var cap=(parseFloat(p.litres)||0)/100, ok=cap>=vol;
    b.className='mvc-dfit '+(ok?'good':'tight');
    b.textContent=ok?'tout tient':('reste '+_mvF1(vol-cap)+' hL');
  });
  var cl=document.getElementById('vdec-cl');
  if(cl && document.activeElement!==cl) cl.value=_mvF1(_vendDecCuveL/100).replace(',','.');
  _vendDecRecap();
  _vendDecGoLbl((_vendDecMode==='cuve'||_vendDecParcVide())?0:_vendDecTotal());
}
function _vendDecAdjLot(id,d){
  var lot=window._mvFutStock(window.INTRANTS).lots.find(function(l){ return l.id===id; });
  if(!lot) return;
  var v=(parseInt(_vendDecChoix[id],10)||0)+d;
  if(v<0) v=0;
  if(v>lot.qte) v=lot.qte;      // on ne pose jamais plus que le disponible
  _vendDecChoix[id]=v;
  // Un fut hors format ajoute ou retire : les barriques se recalculent sur le reste.
  if(_caveHorsFormat(_vendDecLotL(lot))){
    _vendDecPropose();
    var hl=_vendDecHorsHl();
    _vendDecNote=hl>0?('Les f\u00fbts hors format prennent <b>'+_vendDecF2(hl)+'\u00a0hL</b>\u00a0: '
      +'les barriques se recalculent sur le reste.'):'';
  } else _vendDecNote='';
  _vendDecRender();
}
/* ★★ FUT-CAP — LA CONTENANCE D'UN LOT SE CORRIGE D'ICI, la main sur la vanne.
   Elle s'ecrit dans La Reserve (tout le lot), pas dans cette feuille : c'est une
   propriete du fut. Administrateur seulement, comme le formulaire du lot. */
function _vendDecCap(id){
  if(!(typeof isAdmin==='function'&&isAdmin())){ showToast('R\u00e9serv\u00e9 \u00e0 l\u2019administrateur','#C0392B'); return; }
  if(typeof window.openPrompt!=='function'){ showToast('Saisie indisponible','#C0392B'); return; }
  var f=((window.INTRANTS&&window.INTRANTS.futs)||[]).find(function(x){ return x.id===id; });
  if(!f) return;
  var dom=_caveFutL(), cur=_vendDecLotL(f), nomLot=(window._mvFutRef&&window._mvFutRef(f))||'Ce lot';
  window.openPrompt({icone:'barrique', titre:'Contenance d\u2019un f\u00fbt',
    sub:nomLot+(f.annee?(' \u2014 '+f.annee):'')+'. Vaut pour tout le lot, dans La R\u00e9serve. '
      +_caveLTxt(dom)+'\u00a0L\u00a0= le r\u00e9glage du domaine.',
    valeur:_caveLTxt(cur), unite:'L', type:'nombre', btnLabel:'Enregistrer',
    cb:function(v){
      var n=parseFloat(String(v).replace(/[\s\u00a0\u202f]/g,'').replace(',','.'));
      if(!isFinite(n)||n<50||n>5000){ showToast('Contenance attendue entre 50 et 5000\u00a0L','#B85A1A'); return; }
      n=Math.round(n*10)/10;
      var avant=_caveHorsFormat(cur);
      if(n===dom) delete f.l; else f.l=n;
      if(typeof window.saveIntrants==='function') window.saveIntrants();
      if(avant!==_caveHorsFormat(n)) _vendDecPropose();
      _vendDecNote='';
      _vendDecZone();
      showToast(nomLot+'\u00a0: '+_caveLTxt(n)+'\u00a0L par f\u00fbt \u2014 La R\u00e9serve est \u00e0 jour','#3D6B27');
    }});
}
window._vendDecAdjLot = _vendDecAdjLot;
window._vendDecRender = _vendDecRender;
window._vendDecMode2   = _vendDecMode2;
window._vendDecPick    = _vendDecPick;
window._vendDecCuveVol = _vendDecCuveVol;
window._vendDecCap     = _vendDecCap;
function saveVendDecuvage(){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendDecCuveId;});
  if(!c) return;
  /* ★ CUV-14 — le seul refus : un volume plus grand que la cuve. Il passe AVANT
     toute ecriture : un refus doit laisser la cuve et le parc intacts. */
  var _cap=parseFloat(c.volume_hl)||0;
  if(_vendDecVolSaisi!=null && _cap>0 && _vendDecVolSaisi>_cap){
    showToast('Plus que la contenance de la cuve \u2014 le volume se saisit en hL','#B85A1A'); return;
  }
  /* ⚠️⚠️ CUV-14 — « la cuve vient d'etre prise » passait APRES l'entonnage : le
     refus laissait les futs sortis du parc (et enregistres), sans cuvee pour les
     porter. Le controle remonte ici, avant tout geste. */
  var _cv=null;
  if(_vendDecMode!=='fut' && _vendDecCuveRef && _vendDecCuveL>0){
    _cv=_caveCuve(_vendDecCuveRef);
    // ⚠️ Dernier filet : la cuve a pu etre prise entre l'affichage et le clic.
    if(_cv && _caveCuveOcc(_cv.id, _vendDecCuveId)){
      showToast(_cv.nom+' vient d\u2019\u00eatre prise','#B85A1A'); return;
    }
  }
  var nom=((document.getElementById('vdec-nom')||{}).value||'').trim()||c.nom||'Cuvée';
  var mil=parseInt((document.getElementById('vdec-mil')||{}).value)||new Date().getFullYear();
  // Les futs choisis SORTENT du parc et emportent leur identite : tonnelier,
  // reference, annee d'achat, lot d'origine.
  // ⚠️ L'ancien chemin ecrivait {annee: millesime de la cuvee} : tout fut cree au
  // decuvage passait pour NEUF, meme avec cinq vins. Piocher dans le parc corrige
  // ce biais, l'annee venant du lot et non de la vendange.
  // ★ FUT-CAP — et leur CONTENANCE : un demi-muid reste un demi-muid au Chai.
  // ⚠️⚠️ CUV-14 — le repli « compte simple » ne sert plus que parc VIDE. Il
  //   posait `_vendDecNb||1` : en « Les deux », une cuve qui prenait tout
  //   ajoutait UN FUT FANTOME a la cuvee — et a son volume decuve.
  var nb=0, _ton=null;
  if(_vendDecMode!=='cuve'){
    if(!_vendDecParcVide() && _vendDecTotal()>0 && typeof window._mvFutEntonner==='function'){
      _ton=window._mvFutEntonner(_vendDecChoix, window.INTRANTS, nom+' '+mil);
      if(_ton && _ton.length && typeof window.saveIntrants==='function') window.saveIntrants();
    }
    if(_ton && _ton.length) nb=_ton.reduce(function(s,t){ return s+(t.nb||0); },0);
    else if(_vendDecParcVide()) nb=_vendDecNb;
  }
  // ⚠️ nb=0 ne doit PAS produire [{annee:mil,nb:0}] : une entree a zero fut
  //   traine ensuite dans la repartition et dans la pyramide des ages.
  var _tonf=(_ton&&_ton.length)?_ton:(nb>0?[{annee:mil,nb:nb}]:[]);
  var cuvee={id:'cuv_'+Date.now(),nom:nom,millesime:mil,
    tonneaux:_tonf,
    statut:'elevage',fml_terminee:false,last_ouillage:null,last_analyse:null};
  // La cuve part avec la cuvee. Le volume ecrit est celui qu'on a saisi : un
  // FAIT DATE, pas la contenance du parc.
  if(_cv) cuvee.cuves=[{ref:_cv.id, litres:_vendDecCuveL}];
  if(!CAVE_ELEVAGE.cuvees) CAVE_ELEVAGE.cuvees=[];
  CAVE_ELEVAGE.cuvees.push(cuvee);
  var _dfd=parseFloat((document.getElementById('vdec-dens')||{}).value);
  var _dft=parseFloat((document.getElementById('vdec-temp')||{}).value);
  c.decuvage={date:_mvToday(),cuvee_id:cuvee.id,
    fa_finie:!!_vendDecFaFinie,
    densite_fut:(isFinite(_dfd)&&_dfd>0)?_dfd:null,
    temp_fut:isFinite(_dft)?_dft:null};
  /* ★★★ RDT-2 — LE VOLUME MESURE, ECRIT UNE FOIS, AU SEUL MOMENT OU IL EXISTE.
     C'est ce qui vient d'etre loge au Chai : futs entonnes + cuves remplies. Il
     ne touche PAS `volume_hl`, qui reste la contenance de la cuve — la jauge de
     remplissage du Cuvier en a besoin. Deux nombres, deux sens, deux champs. */
  /* ★★★ CUV-14 — SAISI, LE VOLUME MESURE PRIME : c'est lui le fait. Non saisi,
     on garde le volume des contenants remplis, comme avant. `vol_decuve_src` dit
     lequel des deux : l'ecran ne presente pas un calcul comme une mesure. */
  cuvee.manque_l=0;   // ASM-1
  var _vdec=_caveVolL(cuvee)/100;
  if(_vendDecVolSaisi!=null){ c.vol_decuve_hl=_vendDecVolSaisi; c.vol_decuve_src='mesure'; }
  else { c.vol_decuve_hl=(_vdec>0)?Math.round(_vdec*100)/100:null; c.vol_decuve_src='contenants'; }
  /* ★★★ ASM-1 — mesure sous les futs : le manque va a la cuvee (§153a). */
  if(_vendDecVolSaisi!=null){
    var _Fl=_caveFutsL(cuvee), _Cl=_caveVolCuvesL(cuvee);
    cuvee.manque_l=(_Fl>0)?Math.max(0,Math.min(_Fl,Math.round(_Fl-Math.max(0,_vendDecVolSaisi*100-_Cl)))):0;
  }
  c.vol_decuve_le=c.decuvage.date;
  c.statut='termine';
  _vendHistPose(c,'termine',c.decuvage.date);   /* PARC-1 : le decuvage EST un passage */
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  window.CAVE_ELEVAGE=CAVE_ELEVAGE;
  _vendSheetClose();
  var _ou=[];
  if(nb>0) _ou.push(nb+' f\u00fbt'+(nb>1?'s':''));
  if(_cv) _ou.push(_cv.nom);
  _vendFbSave(nom+' \u2192 Le Chai ('+(_ou.length?_ou.join(' + '):'sans contenant')+')'
    +((_ton&&_ton.length)?' \u00b7 f\u00fbts sortis du parc':''),'#3D6B27',['cave_vendange','cave_elevage']);
  renderVendCuves();
}

// —— Opérations sur cuve (chaptalisation, saignée, thermo, levurage, nutriment, SO₂, délestage) ——
var _VEND_OPS=[
  {k:'chaptalisation',lbl:'Chaptalisation'},
  {k:'saignee',lbl:'Saignée'},
  {k:'refroidissement',lbl:'Refroidir'},
  {k:'rechauffement',lbl:'Réchauffer'},
  {k:'levurage',lbl:'Levurage'},
  {k:'nutriment',lbl:'Nutriment'},
  {k:'tanins',lbl:'Tanins'},
  {k:'enzymes',lbl:'Enzymes'},
  {k:'bentonite',lbl:'Bentonite'},
  {k:'so2',lbl:'SO₂'},
  {k:'delestage',lbl:'Délestage'}
];
var _vendOpType='chaptalisation', _vendOpCuveId=null, _vendOpEditId=null, _vendOpEditOp=null;
// ★ ASM-1 — hors de _VEND_OPS : il ne se cree qu'au Chai (§153c).
function _vendOpLbl(k){ if(k==='prelevement') return 'Pr\u00e9l\u00e8vement';
  var o=_VEND_OPS.find(function(x){return x.k===k;}); return o?o.lbl:k; }

// —— Par quel moyen le froid (ou le chaud) a-t-il ete fait ? ——
// « Refroidir » ne disait que la cible. Or la carboglace et l'azote sont des
// intrants : ce qui compte au registre, c'est le moyen et la quantite.
var _VEND_FROID=[
  {k:'groupe',    lbl:'Groupe de froid'},
  {k:'echangeur', lbl:'Échangeur'},
  {k:'carbo',     lbl:'Glace carbonique'},
  {k:'azote',     lbl:'Azote liquide'},
  {k:'co2liq',    lbl:'CO\u2082 liquide'},
  {k:'eau',       lbl:'Eau froide'},
  {k:'autre',     lbl:'Autre'}
];
var _VEND_CHAUD=[
  {k:'ceinture',  lbl:'Ceinture chauffante'},
  {k:'echangeur', lbl:'Échangeur'},
  {k:'plongeur',  lbl:'Thermoplongeur'},
  {k:'remontage', lbl:'Remontage à chaud'},
  {k:'autre',     lbl:'Autre'}
];
function _vendMoyTbl(type){ return type==='rechauffement'?_VEND_CHAUD:_VEND_FROID; }
function _vendMoyLbl(type,k){
  if(!k) return '';
  var o=_vendMoyTbl(type).find(function(x){return x.k===k;});
  return o?o.lbl:k;
}
// Ces trois-la se comptent en kilos ; les autres sont du materiel.
function _vendMoyKg(k){ return k==='carbo'||k==='azote'||k==='co2liq'; }

// ═══════════════ LES TROIS INTRANTS DE CUVERIE (INTR-1) ═══════════════
// Tanins, enzymes, bentonite se saisissent de la MEME facon : un produit pris
// dans La Reserve, une dose, un volume — et la quantite qui en decoule.
// ⚠️⚠️ LE PRODUIT N'EST PAS UN CHAMP LIBRE. Levurage et Nutriment, eux, portent
//   un texte libre (`souche`, `ntype`) : c'est pour ca qu'ils ne sortent
//   d'aucun stock. Un texte ne se rapproche d'une fiche produit qu'a
//   l'orthographe pres, et un bilan matiere qui se trompe de produit ment sans
//   le dire. Sans produit choisi, l'operation s'enregistre quand meme — elle
//   ne bouge simplement aucun stock, et l'ecran l'ecrit.
var _VEND_INTR=['tanins','enzymes','bentonite'];
function _vendEstIntrant(k){ return _VEND_INTR.indexOf(k)!==-1; }
// Les produits oeno de La Reserve. Lecture seule, et DEFENSIVE : cave.js est
// charge AVANT reserve.js dans l'ordre des modules. On ne lit donc jamais
// INTRANTS au chargement, mais a l'ouverture de la feuille, longtemps apres.
function _vendIntrProds(){
  var I=window.INTRANTS;
  if(!I||!I.produits) return [];
  return I.produits.filter(function(p){ return p&&p.cat==='oeno'; });
}
function _vendIntrProd(id){
  if(!id) return null;
  return _vendIntrProds().find(function(p){ return p.id===id; })||null;
}
// L'unite de dose DECOULE de l'unite du produit : kg -> g/hL, L -> mL/hL. La
// faire saisir ouvrirait la porte a « 24 mL/hL » sur un sac de bentonite : une
// quantite fausse d'un facteur mille, sans rien d'anormal a l'ecran.
function _vendIntrUnite(p){ return (p&&p.unite==='L')?'mL/hL':'g/hL'; }
function _vendIntrUniteQ(p){ return (p&&p.unite==='L')?'L':'kg'; }
// ⚠️⚠️ `c.volume_hl` est la CONTENANCE de la cuve, pas ce qu'il y a dedans.
// ⚠️ `volume_hl` est la CONTENANCE : le repere des doses est le CONTENU (§152b).
function _vendIntrVol(c){
  var v=_vendVolContenu(c);
  return {hl:v.hl, src:v.src};
}
function _vendIntrVolLbl(s){
  return s==='mesure' ? 'Volume mesur\u00e9 au d\u00e9cuvage.'
       : s==='saisi'  ? 'Volume saisi \u00e0 la main.'
       : s==='aucun'  ? 'Aucune caisse rattach\u00e9e \u00e0 cette cuve\u00a0: saisissez le volume.'
       : 'Volume estim\u00e9 d\u2019apr\u00e8s les caisses, \u00e0 la r\u00e8gle du Cuvier ('
         +_vendCuvF1(_mlKgHl())+'\u00a0kg/hL), saign\u00e9es d\u00e9duites.';
}
// dose (g ou mL par hL) x volume (hL) -> quantite dans l'unite du produit.
// 1 g/hL sur 1 hL = 1 g = 0,001 kg. Meme rapport pour mL -> L.
function _vendIntrQte(dose,vol){
  if(!isFinite(dose)||!isFinite(vol)||dose<=0||vol<=0) return 0;
  return dose*vol/1000;
}
// Sous le kilo on affiche des grammes : arrondir 126 g en « 0,1 kg » ferait
// disparaitre l'ordre de grandeur que l'utilisateur vient de saisir.
function _vendIntrQteTxt(q,unite){
  var L=(unite==='L');
  if(!(q>0)) return {n:'\u2014', u:L?'litres':'kilos'};
  if(q<1) return {n:Math.round(q*1000).toLocaleString('fr-FR'), u:L?'mL':'g'};
  return {n:(Math.round(q*100)/100).toString().replace('.',','), u:L?'L':'kg'};
}
function _vendIntrFields(c,op){
  var prods=_vendIntrProds();
  var pid=(op&&op.prod_id)||'';
  var ref=_vendIntrVol(c);
  var vol=(op&&op.volume_hl!=null)?op.volume_hl:ref.hl;
  var vsrc=(op&&op.vol_src)||ref.src;
  var h='<label class="mvv-flbl">Produit <span class="mvv-fhint">\u2014 La R\u00e9serve, cat\u00e9gorie \u0152no</span></label>';
  if(!prods.length){
    h+='<input type="hidden" id="vop-prod" value="">'
      +'<div class="mvv-fnote">Aucun intrant \u0153nologique dans La R\u00e9serve. L\u2019op\u00e9ration s\u2019enregistre quand m\u00eame, mais elle ne sortira d\u2019aucun stock : enregistrez l\u2019achat dans La R\u00e9serve pour que le bilan mati\u00e8re la voie.</div>';
  } else {
    h+='<select id="vop-prod" class="mvv-tin" onchange="_vendIntrProdChg()">'
      +'<option value="">\u2014 Aucun produit (hors bilan mati\u00e8re) \u2014</option>'
      +prods.map(function(p){
          return '<option value="'+_escAttr(p.id)+'"'+(p.id===pid?' selected':'')+'>'+_escHtml(p.nom)+'</option>';
        }).join('')
      +'</select>';
  }
  h+='<label class="mvv-flbl">Dose <span class="mvv-fhint" id="vop-dose-u">\u2014 g/hL</span></label>'
    +'<input id="vop-dose" class="mvv-tin" type="number" value="'+((op&&op.dose!=null)?op.dose:'')+'" min="0" step="0.1" placeholder="ex. 24" oninput="_vendIntrCalc()">'
    +'<label class="mvv-flbl">Volume trait\u00e9 (hL)</label>'
    +'<input id="vop-vol" class="mvv-tin" type="number" value="'+(vol>0?vol:'')+'" min="0" step="0.1" placeholder="volume dans la cuve" oninput="_vendIntrCalc()">'
    +'<input type="hidden" id="vop-volsrc" value="'+_escAttr(vsrc)+'">'
    +'<div class="mvv-fnote" id="vop-volsrc-note"></div>'
    +'<div class="mvv-bigcalc"><div class="mvv-bigcalc-n" id="vop-qte">\u2014</div>'
    +'<div class="mvv-bigcalc-l" id="vop-qte-l">quantit\u00e9</div>'
    +'<div class="mvv-bigcalc-cum" id="vop-stock"></div></div>';
  return h;
}
function _vendIntrProdChg(){
  var p=_vendIntrProd(((document.getElementById('vop-prod')||{}).value)||'');
  var u=document.getElementById('vop-dose-u');
  if(u) u.textContent='\u2014 '+_vendIntrUnite(p);
  _vendIntrCalc();
}
// ⚠️ La source du volume n'est PAS un champ de saisie : elle se DEDUIT en
//   comparant ce qui est dans la case au volume de reference de la cuve. Une
//   source qu'on demanderait pourrait etre contredite par le chiffre d'a
//   cote ; celle-la ne peut pas mentir.
function _vendIntrCalc(){
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  var p=_vendIntrProd(((document.getElementById('vop-prod')||{}).value)||'');
  var dose=parseFloat((document.getElementById('vop-dose')||{}).value);
  var vol=parseFloat((document.getElementById('vop-vol')||{}).value);
  var ref=_vendIntrVol(c);
  var src=(isFinite(vol)&&Math.abs(vol-ref.hl)>0.001)?'saisi':ref.src;
  var hid=document.getElementById('vop-volsrc'); if(hid) hid.value=src;
  var note=document.getElementById('vop-volsrc-note');
  if(note) note.textContent=_vendIntrVolLbl(src);
  var q=_vendIntrQte(dose,vol);
  var t=_vendIntrQteTxt(q,_vendIntrUniteQ(p));
  var el=document.getElementById('vop-qte'); if(el) el.textContent=t.n;
  var lb=document.getElementById('vop-qte-l'); if(lb) lb.textContent=t.u+(p?'':' \u00b7 aucun produit');
  var st=document.getElementById('vop-stock'); if(!st) return;
  if(!p||!(q>0)){ st.innerHTML=''; return; }
  // Le stock EXCLUT l'operation en cours de correction, sinon elle serait
  // comptee deux fois dans la projection « apres ».
  var s=window._rsvStockPour?window._rsvStockPour(p.id,_vendOpEditId):null;
  if(!s){ st.innerHTML=''; return; }
  if(!s.suit){
    st.innerHTML='<span style="color:#B85A1A">Ce produit ne se consomme pas depuis le cuvier ('+_escHtml(s.srcLbl)+') : cette op\u00e9ration ne bougera pas son stock.</span>';
    return;
  }
  var apres=s.q-q;
  var av=_vendIntrQteTxt(Math.abs(s.q),s.unite), ap=_vendIntrQteTxt(Math.abs(apres),s.unite);
  // ⚠️⚠️ AUCUN GARDE-FOU ICI, ET C'EST VOULU. Refuser un tanin deja dans la
  //   cuve parce que la facture n'est pas saisie, ce serait faire mentir le
  //   suivi pour proteger le stock. Le negatif est une INFORMATION, et La
  //   Reserve sait deja le nommer « ecart ».
  st.innerHTML='Stock '+(s.q<0?'\u2212':'')+av.n+' '+av.u+' \u2192 <b'+(apres<0?' style="color:#A0291E"':'')+'>'
    +(apres<0?'\u2212':'')+ap.n+' '+ap.u+'</b>'
    +(apres<0?' \u2014 \u00e9cart \u00e0 r\u00e9gulariser, l\u2019op\u00e9ration s\u2019enregistre quand m\u00eame.':'');
}
window._vendEstIntrant=_vendEstIntrant;
window._vendIntrQte=_vendIntrQte;
window._vendIntrQteTxt=_vendIntrQteTxt;
window._vendIntrVol=_vendIntrVol;
window._vendIntrProdChg=_vendIntrProdChg;
window._vendIntrCalc=_vendIntrCalc;
window._vendSo2Calc=_vendSo2Calc;
function openVendOp(cuveId,opId){
  if(!canWrite()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  if(!c) return;
  var op=opId?_vendTriOps(c).find(function(x){return x.id===opId;}):null;
  // ★ ASM-1 — se defait au Chai, depuis l'assemblage (§153c).
  if(op&&op.type==='prelevement'){
    showToast('Ce pr\u00e9l\u00e8vement se d\u00e9fait depuis l\u2019assemblage, dans la fiche de '+((op.vers&&op.vers.nom)||'la cuv\u00e9e'),'#B85A1A');
    return;
  }
  _vendOpCuveId=cuveId;
  _vendOpEditId=op?opId:null;
  _vendOpEditOp=op||null;
  _vendOpType=(op&&op.type)||'chaptalisation';
  var chips=_VEND_OPS.map(function(o){
    return '<button class="mvv-optab'+(o.k===_vendOpType?' on':'')+'" onclick="_vendOpSet(\''+o.k+'\')">'+o.lbl+'</button>';
  }).join('');
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+(op?'Corriger l\u2019opération':'Opération')+' — '+_escHtml(c.nom)+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-optabs">'+chips+'</div>'
    +'<label class="mvv-flbl">Date</label><input id="vop-date" class="mvv-tin" type="date" value="'+((op&&op.date)||_mvToday())+'">'
    +'<div id="vop-fields"></div>'
    +'<label class="mvv-flbl">Note</label><input id="vop-note" class="mvv-tin" type="text" placeholder="Observation…" value="'+_escHtml((op&&op.note)||'')+'">'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendOp()">'+(op?'Enregistrer la correction':'Enregistrer l\u2019opération')+'</button>'
    +(op?'<button class="mvv-del" onclick="_vendOpDel()">Supprimer cette opération</button>':'');
  _vendSheet(html);
  _vendOpFields(c);
}
function _vendOpSet(k){
  _vendOpType=k;
  var tabs=document.querySelectorAll('#mvv-ov .mvv-optab');
  tabs.forEach(function(b,i){ if(_VEND_OPS[i]) b.classList.toggle('on',_VEND_OPS[i].k===k); });
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  _vendOpFields(c);
}
function _vendOpFields(c){
  var el=document.getElementById('vop-fields'); if(!el||!c) return;
  // On ne prerempli que si l'onglet est reste sur le type de l'operation :
  // changer de type, c'est demander une autre operation, pas la meme autrement.
  var op=(_vendOpEditOp&&_vendOpEditOp.type===_vendOpType)?_vendOpEditOp:null;
  /* ★ VOL-1 — repere : le contenu, jamais la contenance (§152b). */
  var ref=_vendIntrVol(c), vol=ref.hl; var h='';
  var _v=function(x){ return (x!=null&&x!=='')?x:''; };
  if(_vendOpType==='chaptalisation'){
    var spd=_vendCfg().sucre_par_degre||16.83;
    var vch=(op&&op.volume_hl!=null)?op.volume_hl:vol;
    h='<label class="mvv-flbl">Volume à chaptaliser (hL)</label><input id="vop-vol" class="mvv-tin" type="number" value="'+(vch>0?vch:'')+'" min="0" step="0.1" placeholder="volume dans la cuve" oninput="_vendOpCalc()">'
      +'<input type="hidden" id="vop-volsrc" value="'+_escAttr((op&&op.vol_src)||ref.src)+'">'
      +'<div class="mvv-fnote" id="vop-volsrc-note"></div>'
      +'<label class="mvv-flbl">Enrichissement visé (° d\'alcool)</label><input id="vop-deg" class="mvv-tin" type="number" value="'+(op&&op.degre!=null?op.degre:1)+'" min="0" max="3" step="0.1" oninput="_vendOpCalc()">'
      +'<div class="mvv-bigcalc"><div class="mvv-bigcalc-n" id="vop-kg">—</div><div class="mvv-bigcalc-l">kg de sucre <span style="opacity:.6">· base '+spd+' g/L</span></div><div class="mvv-bigcalc-cum" id="vop-cum"></div></div>';
  } else if(_vendOpType==='saignee'){
    // ⚠️ Repere APRES cette saignee ; le plafond la rend. Plus de contenance touchee (§152b).
    var volMax=vol+((op&&op.type==='saignee'&&op.volume_hl)||0);
    h='<label class="mvv-flbl">Volume saigné (hL)</label><input id="vop-vol" class="mvv-tin" type="number" value="'+(op&&op.volume_hl!=null?op.volume_hl:0)+'" min="0"'+(volMax>0?' max="'+volMax+'"':'')+' step="0.1">'
      +'<div class="mvv-fnote">'+(volMax>0
        ? ('Retiré de ce que contient la cuve\u00a0: environ '+_vendCuvF1(vol)+' hL'+(ref.src==='mesure'?' mesurés':' d\u2019après les caisses')
          +(op?', soit '+_vendCuvF1(volMax)+' hL avant cette saignée':'')+'. La contenance de la cuve ne change pas.')
        : 'Aucune caisse rattachée à cette cuve\u00a0: son volume n\u2019est pas estimé.')+'</div>';
  } else if(_vendOpType==='refroidissement'||_vendOpType==='rechauffement'){
    var tbl=_vendMoyTbl(_vendOpType), moy=(op&&op.moyen)||'';
    h='<label class="mvv-flbl">Température cible (°C)</label><input id="vop-temp" class="mvv-tin" type="number" value="'+_v(op&&op.temp_c)+'" min="0" max="45" step="0.5" placeholder="ex. 18">'
      +'<label class="mvv-flbl">Comment <span class="mvv-fhint">— ce que le registre retient</span></label>'
      +'<select id="vop-moyen" class="mvv-tin" onchange="_vendOpMoyChg()">'
      +'<option value="">— Non précisé —</option>'
      +tbl.map(function(o){ return '<option value="'+o.k+'"'+(o.k===moy?' selected':'')+'>'+o.lbl+'</option>'; }).join('')
      +'</select><div id="vop-moy-row"></div>';
  } else if(_vendOpType==='levurage'){
    h='<label class="mvv-flbl">Souche / levain</label><input id="vop-souche" class="mvv-tin" type="text" placeholder="ex. indigènes, RC212…" value="'+_escHtml((op&&op.souche)||'')+'">'
      +'<label class="mvv-flbl">Dose (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="'+_v(op&&op.dose)+'" min="0" step="1" placeholder="ex. 20">';
  } else if(_vendOpType==='nutriment'){
    h='<label class="mvv-flbl">Type (azote / nutriment)</label><input id="vop-ntype" class="mvv-tin" type="text" placeholder="ex. DAP, azote organique…" value="'+_escHtml((op&&op.ntype)||'')+'">'
      +'<label class="mvv-flbl">Dose (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="'+_v(op&&op.dose)+'" min="0" step="1" placeholder="ex. 30">';
  } else if(_vendEstIntrant(_vendOpType)){
    h=_vendIntrFields(c,op);
  } else if(_vendOpType==='so2'){
    /* ★ VOL-1 — le SO2 du Cuvier porte son volume (§152b). */
    var vs=(op&&op.volume_hl!=null)?op.volume_hl:vol;
    h='<label class="mvv-flbl">Dose SO₂ (g/hL)</label><input id="vop-dose" class="mvv-tin" type="number" value="'+_v(op&&op.dose)+'" min="0" step="0.5" placeholder="ex. 3" oninput="_vendSo2Calc()">'
      +'<label class="mvv-flbl">Volume sulfité (hL)</label><input id="vop-vol" class="mvv-tin" type="number" value="'+(vs>0?vs:'')+'" min="0" step="0.1" placeholder="volume dans la cuve" oninput="_vendSo2Calc()">'
      +'<input type="hidden" id="vop-volsrc" value="'+_escAttr((op&&op.vol_src)||ref.src)+'">'
      +'<div class="mvv-fnote" id="vop-volsrc-note"></div>'
      +'<div class="mvv-bigcalc"><div class="mvv-bigcalc-n" id="vop-so2g">\u2014</div><div class="mvv-bigcalc-l">grammes de SO<sub>2</sub></div></div>';
  } else if(_vendOpType==='delestage'){
    h='<label class="mvv-flbl">Nombre de délestages</label><input id="vop-nb" class="mvv-tin" type="number" value="'+(op&&op.nb!=null?op.nb:1)+'" min="1" step="1">';
  }
  el.innerHTML=h;
  if(_vendOpType==='chaptalisation') _vendOpCalc();
  if(_vendOpType==='so2') _vendSo2Calc();
  if(_vendOpType==='refroidissement'||_vendOpType==='rechauffement') _vendOpMoyChg(op&&op.qte_kg);
  if(_vendEstIntrant(_vendOpType)) _vendIntrProdChg();
}
// La quantite n'a de sens que pour ce qui se pese. Pour la carboglace,
// l'ordre de grandeur est stable et connu du metier ; pour l'azote et le CO2
// liquide il depend trop du materiel pour etre annonce, donc on ne l'annonce pas.
function _vendOpMoyChg(qte){
  var row=document.getElementById('vop-moy-row'); if(!row) return;
  var k=((document.getElementById('vop-moyen')||{}).value)||'';
  if(!_vendMoyKg(k)){ row.innerHTML=''; return; }
  var val=(qte!=null&&qte!=='')?qte:'';
  var lbl=k==='carbo'?'Glace carbonique (kg)':k==='azote'?'Azote liquide (kg)':'CO\u2082 liquide (kg)';
  row.innerHTML='<label class="mvv-flbl">'+lbl+'</label>'
    +'<input id="vop-qte" class="mvv-tin" type="number" value="'+val+'" min="0" step="0.5" placeholder="ex. 20" oninput="_vendOpQteCalc()">'
    +'<div class="mvv-fnote" id="vop-qte-note" style="color:var(--texte-doux,#5F5F5F)"></div>';
  _vendOpQteCalc();
}
function _vendOpQteCalc(){
  var note=document.getElementById('vop-qte-note'); if(!note) return;
  var k=((document.getElementById('vop-moyen')||{}).value)||'';
  var kg=parseFloat((document.getElementById('vop-qte')||{}).value);
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  var _vr=_vendIntrVol(c), vol=_vr.hl;   // VOL-1
  if(k!=='carbo'){
    note.innerHTML='La quantité part au registre des manipulations. L\u2019abaissement obtenu dépend trop du matériel pour être estimé ici.';
    return;
  }
  if(!isFinite(kg)||kg<=0||vol<=0){ note.innerHTML=''; return; }
  // Sublimation du CO2 : ~571 kJ/kg. Un hL de mout ~107 kg a ~3,8 kJ/(kg·K),
  // soit ~407 kJ par degre et par hL -> ~1,4 °C par kg et par hL.
  var dT=1.4*kg/vol;
  note.innerHTML='Environ \u2212'+_vendCuvF1(dT)+' °C sur les '+_vendCuvF1(vol)+' hL '+(_vr.src==='mesure'?'mesurés':'estimés')+' dans la cuve. '
    +'Ordre de grandeur : la cuve n\u2019est pas isolée, et le résultat dépend de la répartition de la glace.';
}
function _vendOpCalc(){
  var vol=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
  var deg=parseFloat((document.getElementById('vop-deg')||{}).value)||0;
  var spd=_vendCfg().sucre_par_degre||16.83;
  var kg=spd*deg*vol/10;
  var el=document.getElementById('vop-kg'); if(el) el.textContent=kg>0?kg.toFixed(1):'—';
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  // ★ VOL-1 — la source du volume se DEDUIT, comme pour les intrants (§71d).
  var _r=_vendIntrVol(c), _s=(vol>0&&Math.abs(vol-_r.hl)>0.001)?'saisi':_r.src;
  var _hs=document.getElementById('vop-volsrc'); if(_hs) _hs.value=_s;
  var _ns=document.getElementById('vop-volsrc-note'); if(_ns) _ns.textContent=_vendIntrVolLbl(_s);
  var prev=((c&&c.operations)||[]).filter(function(o){return o.type==='chaptalisation';}).reduce(function(s,o){return s+(o.kg_sucre||0);},0);
  var cu=document.getElementById('vop-cum');
  if(cu){
    if(prev>0){
      var tot=prev+kg;
      var degTot=vol>0?(tot/(spd*vol/10)):0;
      cu.innerHTML='Cumul cuve : <b>'+tot.toFixed(1)+' kg</b>'+(degTot>2?' <span style="color:#B0412C">— soit ~'+degTot.toFixed(1)+'° cumulés, surveiller le plafond réglementaire</span>':'');
    } else cu.innerHTML='';
  }
}
/* ★ VOL-1 — SO2 du Cuvier : volume, grammes, source deduite (§71d, §152b). */
function _vendSo2Calc(){
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  var ref=_vendIntrVol(c);
  var dose=parseFloat((document.getElementById('vop-dose')||{}).value);
  var vol=parseFloat((document.getElementById('vop-vol')||{}).value);
  var src=(isFinite(vol)&&vol>0&&Math.abs(vol-ref.hl)>0.001)?'saisi':ref.src;
  var hid=document.getElementById('vop-volsrc'); if(hid) hid.value=src;
  var note=document.getElementById('vop-volsrc-note'); if(note) note.textContent=_vendIntrVolLbl(src);
  var g=(isFinite(dose)&&dose>0&&isFinite(vol)&&vol>0)?dose*vol:0;
  var el=document.getElementById('vop-so2g'); if(el) el.textContent=g>0?_vendCuvF1(g):'\u2014';
}
function saveVendOp(){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  if(!c) return;
  var date=(document.getElementById('vop-date')||{}).value||_mvToday();
  var note=((document.getElementById('vop-note')||{}).value||'').trim();
  var editId=_vendOpEditId;
  var prev=editId?((c.operations||[]).find(function(o){return o.id===editId;})||null):null;
  // ⚠️ Une saignee d'avant VOL-1 (sans `cap_intacte`) rend la contenance qu'elle avait prise (§152b).
  if(prev&&prev.type==='saignee'&&prev.volume_hl&&!prev.cap_intacte) c.volume_hl=(c.volume_hl||0)+prev.volume_hl;
  var op={id:editId||('vop_'+Date.now()),type:_vendOpType,date:date,note:note};
  if(_vendOpType==='chaptalisation'){
    op.volume_hl=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
    op.degre=parseFloat((document.getElementById('vop-deg')||{}).value)||0;
    var spd=_vendCfg().sucre_par_degre||16.83;
    op.kg_sucre=spd*op.degre*op.volume_hl/10;
    // ★ VOL-1 — le registre dit « (estime) » quand le volume vient des caisses.
    op.vol_src=((document.getElementById('vop-volsrc')||{}).value)||null;
  } else if(_vendOpType==='saignee'){
    op.volume_hl=parseFloat((document.getElementById('vop-vol')||{}).value)||0;
    op.cap_intacte=true;   // VOL-1
  } else if(_vendOpType==='refroidissement'||_vendOpType==='rechauffement'){
    var _t=parseFloat((document.getElementById('vop-temp')||{}).value);
    op.temp_c=isFinite(_t)?_t:null;                      // 0 °C est une cible, pas une absence
    op.moyen=((document.getElementById('vop-moyen')||{}).value)||null;
    var _q=parseFloat((document.getElementById('vop-qte')||{}).value);
    op.qte_kg=(_vendMoyKg(op.moyen)&&isFinite(_q))?_q:null;
  } else if(_vendOpType==='levurage'){
    op.souche=((document.getElementById('vop-souche')||{}).value||'').trim();
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
  } else if(_vendOpType==='nutriment'){
    op.ntype=((document.getElementById('vop-ntype')||{}).value||'').trim();
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
  } else if(_vendEstIntrant(_vendOpType)){
    op.prod_id=((document.getElementById('vop-prod')||{}).value)||null;
    var _ip=_vendIntrProd(op.prod_id);
    // Le nom est FIGE sur l'operation : supprimer un produit de La Reserve ne
    // doit pas effacer ce qui a ete mis dans la cuve.
    op.produit=_ip?_ip.nom:null;
    var _idz=parseFloat((document.getElementById('vop-dose')||{}).value);
    op.dose=isFinite(_idz)?_idz:null;
    op.dose_unit=_vendIntrUnite(_ip);
    var _ivl=parseFloat((document.getElementById('vop-vol')||{}).value);
    op.volume_hl=(isFinite(_ivl)&&_ivl>0)?_ivl:null;   // VOL-1
    op.vol_src=((document.getElementById('vop-volsrc')||{}).value)||'estime';
    op.qte=_vendIntrQte(op.dose,op.volume_hl);
    op.qte_unite=_vendIntrUniteQ(_ip);
  } else if(_vendOpType==='so2'){
    op.dose=parseFloat((document.getElementById('vop-dose')||{}).value)||null;
    // ★ VOL-1 — le volume sulfite, et d'ou il vient : le registre en tire les grammes.
    var _sv=parseFloat((document.getElementById('vop-vol')||{}).value);
    op.volume_hl=(isFinite(_sv)&&_sv>0)?_sv:null;
    op.vol_src=(op.volume_hl!=null)?(((document.getElementById('vop-volsrc')||{}).value)||'saisi'):null;
  } else if(_vendOpType==='delestage'){
    op.nb=parseInt((document.getElementById('vop-nb')||{}).value)||1;
  }
  if(!c.operations) c.operations=[];
  var pos=editId?c.operations.findIndex(function(o){return o.id===editId;}):-1;
  if(pos!==-1) c.operations[pos]=op; else c.operations.push(op);
  _vendTriOps(c);
  _vendOpEditId=null; _vendOpEditOp=null;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(_vendOpLbl(_vendOpType)+(pos!==-1?' corrigée':' enregistrée'),'#3D6B27');
  _vendSheetClose();
  renderVendCuves();
}
function _vendOpDel(){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vendOpCuveId;});
  var id=_vendOpEditId;
  if(!c||!id) return;
  var op=(c.operations||[]).find(function(o){return o.id===id;});
  if(!op) return;
  var avert=(op.type==='saignee'&&op.volume_hl)
    ? ('Les '+_vendCuvF1(op.volume_hl)+' hL saignés seront rendus à la cuve.')
    : 'Elle disparaîtra du suivi et du registre des manipulations.';
  window.openConfirmDel('Supprimer cette '+_vendOpLbl(op.type).toLowerCase()+' ?',avert,function(){
    if(op.type==='saignee'&&op.volume_hl&&!op.cap_intacte) c.volume_hl=(c.volume_hl||0)+op.volume_hl;   // VOL-1
    c.operations=(c.operations||[]).filter(function(o){return o.id!==id;});
    _vendOpEditId=null; _vendOpEditOp=null;
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('Opération supprimée','#B85A1A');
    _vendSheetClose();
    renderVendCuves();
  });
}
// Le detail court d'une operation, partage par le resume et l'historique.
function _vendOpDet(o){
  if(!o) return '';
  if(o.type==='prelevement') return _vendCuvF1(o.volume_hl||0)+' hL \u2192 '+((o.vers&&o.vers.nom)||'une cuv\u00e9e du Chai');
  if(o.type==='chaptalisation') return (o.kg_sucre!=null)
    ? (o.kg_sucre||0).toFixed(1).replace('.',',')+' kg de sucre'
    : ('+'+_vendCuvF1(o.degre||0)+'\u00b0 vis\u00e9, volume inconnu');   // VOL-1
  if(o.type==='saignee') return _vendCuvF1(o.volume_hl||0)+' hL';
  if(o.type==='delestage') return (o.nb||1)+'\u00d7';
  if(_vendEstIntrant(o.type)){
    var di=[];
    if(o.produit) di.push(o.produit);
    if(o.dose!=null) di.push(_vendCuvF1(o.dose)+' '+(o.dose_unit||'g/hL'));
    if(o.qte>0){ var tq=_vendIntrQteTxt(o.qte,o.qte_unite||'kg'); di.push(tq.n+' '+tq.u); }
    if(o.vol_src==='estime') di.push('volume estim\u00e9');
    if(!o.prod_id) di.push('hors bilan mati\u00e8re');
    return di.join(' \u00b7 ');
  }
  var d=[];
  if(o.temp_c!=null) d.push('cible '+_vendCuvF1(o.temp_c)+' °C');
  if(o.moyen) d.push(_vendMoyLbl(o.type,o.moyen));
  if(o.qte_kg!=null) d.push(_vendCuvF1(o.qte_kg)+' kg');
  if(o.souche) d.push(o.souche);
  if(o.ntype) d.push(o.ntype);
  if(o.dose!=null) d.push(_vendCuvF1(o.dose)+' g/hL');
  return d.join(' · ');
}
function _vendOpsSummary(c,canEdit){
  var ops=_vendTriOps(c).slice().reverse();
  if(!ops.length) return '';
  var last=ops[0], det=_vendOpDet(last);
  var rows=ops.map(function(o){
    var d=_vendOpDet(o), sub=d+((d&&o.note)?' · ':'')+(o.note||'');
    return '<div class="mvv-hrow"><div class="mvv-hrow-l">'
      +'<div class="mvv-hrow-d">'+_vendFrDate(o.date)+' · <b>'+_escHtml(_vendOpLbl(o.type))+'</b></div>'
      +(sub?'<div class="mvv-hrow-u">'+_escHtml(sub)+'</div>':'')
      +'</div>'
      +(canEdit?'<button class="mv-gh mvv-icbtn" onclick="openVendOp(\''+_escAttr(c.id)+'\',\''+_escAttr(o.id)+'\')" title="Corriger cette opération" aria-label="Corriger cette opération">'+_mvIcon('crayon',16)+'</button>':'')
      +'</div>';
  }).join('');
  return '<details class="mvv-histwrap"><summary>'+_escHtml(_vendOpLbl(last.type))
    +' <span class="u">'+_vendFrDate(last.date)+(det?' · '+_escHtml(det):'')+'</span>'
    +(ops.length>1?' <span class="u">· '+ops.length+' au total</span>':'')
    +'</summary>'+rows+'</details>';
}
/* ═══════════ FUSIONNER DES CUVES (FUS-1) ═══════════ */
var _vendFusSel={}, _vendFusDest=null, _vendFusNom='', _vendFusNomTouche=false;

function _vendFusCuves(){
  return (CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){
    return c && c.statut!=='termine' && !_vendEstFusionnee(c);
  });
}
function _vendFusPris(){
  return _vendFusCuves().filter(function(c){ return _vendFusSel[c.id]; });
}
/* Le volume attendu d'une cuve : les caisses du domaine au ratio kg/hL.
   ⚠️ JAMAIS `volume_hl`, qui est la CONTENANCE — c'est la faute RDT-1, et
   elle se rejouerait ici a l'identique. */
function _vendFusHl(c){ return _vendHlKg(_vendCuvKgDom(c.id)); }
function _vendFusTotHl(){
  return _vendFusPris().reduce(function(s,c){ return s+_vendFusHl(c); },0);
}
function _vendFusNomAuto(){
  var p=_vendFusPris();
  return p.length<2 ? '' : p.map(function(c){ return c.nom||'Cuve'; }).join(' + ');
}
/* La cuve d'arrivee : soit une des cuves choisies (elle garde sa cuverie),
   soit une cuve LIBRE du parc — la premiere cuve choisie devient alors la
   porteuse et son cuve_ref bascule. On ne cree jamais d'objet cuve neuf :
   il faudrait recopier mesures et operations, et une copie se desynchronise. */
function _vendFusParcLibre(){
  var pris=_vendFusPris().map(function(c){ return c.id; });
  return _caveParc().filter(function(p){
    var occ=_caveCuveOcc(p.id,null);
    if(!occ) return true;
    /* Une cuve tenue par une cuve qu'on est en train d'absorber se libere. */
    return _vendFusPris().some(function(c){ return c.cuve_ref===p.id; });
  });
}
function _vendFusDestObj(){
  if(!_vendFusDest) return null;
  var c=_vendFusPris().filter(function(x){ return x.id===_vendFusDest; })[0];
  if(c) return {kind:'cuve', id:c.id, nom:c.nom||'Cuve', cap:parseFloat(c.volume_hl)||0,
                lbl:_vendRepere(c)||c.nom||'Cuve'};
  var p=_caveCuve(_vendFusDest);
  if(p) return {kind:'parc', id:p.id, nom:p.nom||'Cuve', cap:(parseFloat(p.litres)||0)/100,
                lbl:p.nom||'Cuve'};
  return null;
}
function openVendFusion(){
  if(!canWrite()) return;
  _vendFusSel={}; _vendFusDest=null; _vendFusNom=''; _vendFusNomTouche=false;
  _caveV2InjectCss();          // le selecteur de cuve du parc vit la
  _vendFusPeindre(true);
}
function _vendFusBasc(id){
  if(_vendFusSel[id]) delete _vendFusSel[id]; else _vendFusSel[id]=1;
  /* Une destination qui n'est plus selectionnee cesse d'etre une destination. */
  if(_vendFusDest && !_vendFusSel[_vendFusDest] && !_caveCuve(_vendFusDest)) _vendFusDest=null;
  if(!_vendFusNomTouche) _vendFusNom='';
  _vendFusPeindre(false);
}
function _vendFusPick(id){ _vendFusDest=id; _vendFusPeindre(false); }
function _vendFusSetNom(v){ _vendFusNom=v; _vendFusNomTouche=true; _vendFusRecap(); }

function _vendFusHtml(){
  var all=_vendFusCuves(), p=_vendFusPris(), n=p.length;
  var hl=_vendFusTotHl();
  /* ⚠️ Les totaux (caisses, parcelles) sont calcules par _vendFusRecapHtml,
     pas ici : les dupliquer laisserait deux sources pour le meme chiffre. */

  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Fusionner des cuves</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'
    +_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">Plusieurs cuves n\u2019en font plus qu\u2019une. Les raisins, les kilos et les '
    +'parcelles suivent. Les relev\u00e9s et les op\u00e9rations de chaque cuve de d\u00e9part restent au registre '
    +'sous leur nom d\u2019origine.</div>';

  h+='<label class="mvv-flbl">Quelles cuves <span class="mvv-fhint">(au moins deux)</span></label>';
  all.forEach(function(c){
    var sel=!!_vendFusSel[c.id], rep=_vendRepere(c), last=_vendLastD(c);
    var pct=last?_vendFaPct(c,_vendMesD20(last)):0;
    var m=[]; if(rep) m.push(rep);
    m.push(_vendCuvF1(_vendFusHl(c))+'\u00a0hL');
    if(c.parcelles&&c.parcelles.length) m.push(c.parcelles.join(', '));
    h+='<button type="button" class="mvv-pick'+(sel?' sel':'')+'" onclick="_vendFusBasc(\''+_escAttr(c.id)+'\')">'
      +'<span class="mvv-box"></span><span class="mvv-pick-b">'
      +'<span class="mvv-pick-n">'+_escHtml(c.nom||'Cuve')+'</span>'
      +'<span class="mvv-pick-m">'+_escHtml(m.join(' \u00b7 '))+'</span></span>'
      +'<span class="mvv-pick-r"><span class="mvc-dfit '+(pct?'good':'tight')+'">'
      +(pct?pct+'\u00a0% FA':_escHtml(_vendStatLbl(c.statut)))+'</span></span></button>';
  });

  if(n<2){
    h+='<div class="mvv-ftot"><span class="mvv-ftot-n">'+n+'</span>'
      +'<span class="mvv-ftot-l">cuve s\u00e9lectionn\u00e9e \u2014 il en faut au moins deux</span></div>'
      +'<button class="mvv-save" disabled>Choisissez les cuves \u00e0 fusionner</button>';
    return h;
  }

  h+='<label class="mvv-flbl">O\u00f9 va le vin</label>';
  p.forEach(function(c){
    var cap=parseFloat(c.volume_hl)||0, ok=cap>=hl, rep=_vendRepere(c);
    h+='<button type="button" class="mvv-pick'+(_vendFusDest===c.id?' sel':'')+'" '
      +'onclick="_vendFusPick(\''+_escAttr(c.id)+'\')">'
      +'<span class="mvv-rad"></span><span class="mvv-pick-b">'
      +'<span class="mvv-pick-n">'+_escHtml(rep||c.nom||'Cuve')+'</span>'
      +'<span class="mvv-pick-m">d\u00e9j\u00e0 occup\u00e9e par '+_escHtml(c.nom||'cette cuve')
      +(cap?' \u00b7 '+_vendCuvF1(cap)+'\u00a0hL':'')+'</span></span>'
      +'<span class="mvv-pick-r"><span class="mvc-dfit '+(ok?'good':'tight')+'">'
      +(ok?'tout tient':'reste '+_vendCuvF1(hl-cap)+'\u00a0hL')+'</span></span></button>';
  });
  _vendFusParcLibre().forEach(function(q){
    if(p.some(function(c){ return c.cuve_ref===q.id; })) return;   // deja propose ci-dessus
    var cap=(parseFloat(q.litres)||0)/100, ok=cap>=hl, mt=_caveMat(q.matiere);
    h+='<button type="button" class="mvv-pick'+(_vendFusDest===q.id?' sel':'')+'" '
      +'onclick="_vendFusPick(\''+_escAttr(q.id)+'\')">'
      +'<span class="mvv-rad"></span><span class="mvv-pick-b">'
      +'<span class="mvv-pick-n">'+_escHtml(q.nom||'Cuve')+'</span>'
      +'<span class="mvv-pick-m">'+_escHtml(mt.lbl)+' \u00b7 '+_vendCuvF1(cap)
      +'\u00a0hL \u00b7 libre dans le parc</span></span>'
      +'<span class="mvv-pick-r"><span class="mvc-dfit '+(ok?'good':'tight')+'">'
      +(ok?'tout tient':'reste '+_vendCuvF1(hl-cap)+'\u00a0hL')+'</span></span></button>';
  });

  h+='<label class="mvv-flbl">Nom de la cuve apr\u00e8s fusion</label>'
    +'<input id="vfus-nom" class="mvv-tin" type="text" '
    +'value="'+_escAttr(_vendFusNom||_vendFusNomAuto())+'" oninput="_vendFusSetNom(this.value)">'
    +'<label class="mvv-flbl">Date</label>'
    +'<input id="vfus-date" class="mvv-tin" type="date" value="'+_mvToday()+'">';

  h+='<div id="vfus-recap">'+_vendFusRecapHtml()+'</div>'
    +'<button class="mvv-save" id="vfus-go" onclick="saveVendFusion()">'+_vendFusGoLbl()+'</button>';
  return h;
}
function _vendFusRecapHtml(){
  var p=_vendFusPris(), n=p.length, hl=_vendFusTotHl();
  var d=_vendFusDestObj(), trop=!!(d && d.cap>0 && d.cap<hl);
  var cs=p.reduce(function(s,c){ return s+_vendCuvCsDom(c.id); },0);
  var parc={}; p.forEach(function(c){ (c.parcelles||[]).forEach(function(x){ if(x) parc[x]=1; }); });
  var nbP=Object.keys(parc).length;
  var h='<div class="mvv-ftot"><span class="mvv-ftot-n'+(trop?' ko':'')+'">'+_vendCuvF1(hl)+'</span>'
    +'<span class="mvv-ftot-l">hL r\u00e9unis'
    +(d&&d.cap>0 ? ' sur '+_vendCuvF1(d.cap)+'\u00a0hL de contenance \u2014 '
        +(trop?'il manque '+_vendCuvF1(hl-d.cap)+'\u00a0hL':'le compte est bon') : '')
    +'</span><span class="mvv-ftot-s">'+cs+' caisse'+(cs>1?'s':'')+' \u00b7 '
    +nbP+' parcelle'+(nbP>1?'s':'')+'<br>'
    +_escHtml(p.map(function(c){ return c.nom||'Cuve'; }).join(' \u00b7 '))+'</span></div>';
  h+='<div class="mvv-dneuf">Les '+n+' cuves de d\u00e9part quittent la liste des cuves en cours et lib\u00e8rent '
    +'leur cuve dans le parc. Leurs relev\u00e9s et leurs op\u00e9rations restent consultables.</div>';
  /* ⚠️ Le volume est ESTIME tant que rien n'est decuve (RDT-1). L'ecrire
     evite de faire lire une estimation comme une mesure. */
  h+='<div class="mvv-dlnote">Volume estim\u00e9 d\u2019apr\u00e8s les caisses du domaine : rien n\u2019a encore '
    +'\u00e9t\u00e9 mesur\u00e9 en cuve.</div>';
  if(trop) h+='<div class="mvv-dwarn">Le volume d\u00e9passe la contenance. Prends une cuve plus grande, ou '
    +'fusionne moins de cuves \u2014 rien n\u2019est bloqu\u00e9, mais la jauge de remplissage sortira au-dessus de 100\u00a0%.</div>';
  return h;
}
function _vendFusGoLbl(){
  var d=_vendFusDestObj(), n=_vendFusPris().length;
  if(!d) return 'Choisissez la cuve d\u2019arriv\u00e9e';
  return 'Fusionner '+n+' cuves dans '+d.lbl;
}
/* Recap seul : reconstruire la feuille effacerait le nom deja saisi et
   ferait perdre le focus au champ. Meme piege que _vendDecCuveVol. */
function _vendFusRecap(){
  var e=document.getElementById('vfus-recap'); if(e) e.innerHTML=_vendFusRecapHtml();
  var g=document.getElementById('vfus-go');
  if(g){ g.textContent=_vendFusGoLbl(); g.disabled=!_vendFusDestObj(); }
}
function _vendFusPeindre(neuf){
  if(neuf){ _vendSheet(_vendFusHtml()); return; }
  var sh=document.querySelector('#mvv-sheet-host .mvv-sheet');
  var nom=(document.getElementById('vfus-nom')||{}).value;
  var dat=(document.getElementById('vfus-date')||{}).value;
  _vendSheet(_vendFusHtml());
  if(nom!=null){ var i=document.getElementById('vfus-nom'); if(i&&_vendFusNomTouche) i.value=nom; }
  if(dat){ var j=document.getElementById('vfus-date'); if(j) j.value=dat; }
}

function saveVendFusion(){
  if(!_vendGarde()) return;
  var p=_vendFusPris();
  if(p.length<2){ showToast('Choisissez au moins deux cuves','#E07060'); return; }
  var d=_vendFusDestObj();
  if(!d){ showToast('Choisissez la cuve d\u2019arriv\u00e9e','#E07060'); return; }
  var nom=((document.getElementById('vfus-nom')||{}).value||'').trim() || _vendFusNomAuto();
  var date=(document.getElementById('vfus-date')||{}).value || _mvToday();
  var hl=_vendFusTotHl();

  /* La porteuse : la cuve d'arrivee si c'en est une, sinon la premiere
     choisie, dont le cuve_ref bascule vers la cuve libre du parc. */
  var porteuse = (d.kind==='cuve')
    ? p.filter(function(c){ return c.id===d.id; })[0]
    : p[0];
  if(!porteuse){ showToast('Cuve d\u2019arriv\u00e9e introuvable','#E07060'); return; }

  if(d.kind==='parc'){
    /* ⚠️ Dernier filet : la cuve du parc a pu etre prise depuis l'affichage. */
    var occ=_caveCuveOcc(d.id, porteuse.id);
    if(occ && !p.some(function(c){ return c.cuve_ref===d.id; })){
      showToast((d.nom||'Cette cuve')+' vient d\u2019\u00eatre prise','#B85A1A'); return;
    }
    porteuse.cuve_ref=d.id;
    if(!(parseFloat(porteuse.volume_hl)>0)) porteuse.volume_hl=d.cap;
  }

  var absorbees=p.filter(function(c){ return c.id!==porteuse.id; });
  var noms=absorbees.map(function(c){ return c.nom||'Cuve'; });

  /* ★★★ LE GESTE CENTRAL, ET LE SEUL : les recoltes changent de cuve.
     Tout le reste — kilos, caisses, hL, prorata, rendements, bilan — se
     recalcule depuis elles, donc rien ne peut compter double. */
  var ids={}; absorbees.forEach(function(c){ ids[c.id]=1; });
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    if(r && ids[r.cuve_id]) r.cuve_id=porteuse.id;
  });

  /* Les parcelles se reunissent, sans doublon et sans perdre l'ordre. */
  var vues={}, pl=[];
  [porteuse].concat(absorbees).forEach(function(c){
    (c.parcelles||[]).forEach(function(x){ if(x && !vues[x]){ vues[x]=1; pl.push(x); } });
  });
  porteuse.parcelles=pl;
  porteuse.nom=nom;
  if(!Array.isArray(porteuse.fusion_src)) porteuse.fusion_src=[];
  absorbees.forEach(function(c){
    porteuse.fusion_src.push({id:c.id, nom:c.nom||'Cuve', date:date});
  });
  /* Les identifiants de recolte suivent, quand la porteuse en tient une liste. */
  if(Array.isArray(porteuse.recolte_ids)){
    absorbees.forEach(function(c){
      if(Array.isArray(c.recolte_ids)) c.recolte_ids.forEach(function(x){
        if(porteuse.recolte_ids.indexOf(x)===-1) porteuse.recolte_ids.push(x);
      });
    });
  }

  /* Les absorbees : 'termine' + `fusion`. Pas de `decuvage`, donc
     _vendVolLoge rend 0 et aucun volume n'est compte deux fois. Leur
     cuve_ref est LACHE : c'est ce qui libere la cuve dans le parc. */
  absorbees.forEach(function(c){
    c.statut='termine';
    _vendHistPose(c,'termine',date);            /* PARC-1 : la fusion aussi */
    c.fusion={vers:porteuse.id, vers_nom:nom, date:date};
    c.cuve_ref=null;
  });

  /* Une ligne au registre des manipulations, posee sur la porteuse. */
  if(!Array.isArray(porteuse.operations)) porteuse.operations=[];
  porteuse.operations.push({id:'vop_fus_'+Date.now(), type:'assemblage', date:date,
    sources:noms, volume_hl:Math.round(hl*10)/10, estime:true,
    note:'Assemblage de '+(absorbees.length+1)+' cuves'});
  _vendTriOps(porteuse);

  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(noms.join(' + ')+' \u2192 '+nom,'#3D6B27');
  _vendSheetClose();
  _vendOuvert=porteuse.id;
  renderVendCuves();
}

window.openVendFusion  = openVendFusion;
window._vendFusBasc    = _vendFusBasc;
window._vendFusPick    = _vendFusPick;
window._vendFusSetNom  = _vendFusSetNom;
window.saveVendFusion  = saveVendFusion;

function _vendFusionneesSection(list){
  if(!list.length) return '';
  var rows=list.slice().sort(function(a,b){
    var da=(a.fusion||{}).date||'', db=(b.fusion||{}).date||''; return da>db?-1:1;
  }).map(function(c){
    return '<div class="mvv-fusrow"><span class="l"><span class="n">'+_escHtml(c.nom||'Cuve')+'</span>'
      +'<span class="u">'+_vendFrDate((c.fusion||{}).date)+' \u00b7 dans '
      +_escHtml((c.fusion||{}).vers_nom||'une autre cuve')+'</span></span>'
      +'<button class="mv-gh mvv-icbtn r" onclick="_vendBascOuv(\''+_escAttr(c.id)+'\')" '
      +'title="Voir ses relev\u00e9s" aria-label="Voir ses relev\u00e9s">'+_mvIcon('oeil',16)+'</button></div>';
  }).join('');
  return '<details class="mvv-decwrap"><summary class="mvv-decsum">Fusionn\u00e9es ('+list.length+')</summary>'
    +'<div class="mvv-dlnote">Ces cuves ont rejoint une autre cuve. Leurs relev\u00e9s et leurs op\u00e9rations '
    +'restent au registre sous leur nom d\u2019origine.</div>'+rows+'</details>';
}
function _vendDecuveesSection(list){
  if(!list.length) return '';
  var rows=list.slice().sort(function(a,b){var da=(a.decuvage||{}).date||'',db=(b.decuvage||{}).date||'';return da>db?-1:1;}).map(function(c){
    var d=c.decuvage||{};
    /* ★ CUV-9 : une ligne de décuvage dit aussi où en est la fermentation.
       Sans ça, il fallait déplier les cuves une par une pour le savoir. */
    var _dd=_vendDecD20(c);
    var fa=_vendFaEnCours(c) ? '<span class="mvv-decfa">FA au chai</span>'
      : (_dd!=null ? (' · mise en fût à '+Math.round(_dd)) : '');
    /* ★ CUV-11 : la série continue après le décuvage — on montre son dernier point,
       sinon il faut déplier chaque cuve pour savoir laquelle a été relevée. */
    var _ap=_vendMesD(c).filter(function(m){ return m.date>(d.date||''); });
    var _sv=_ap.length ? (' · relevée à '+Math.round(_vendMesD20(_ap[_ap.length-1]))
      +' le '+_vendFrDate(_ap[_ap.length-1].date)) : '';
    // ★ VOL-1 — le volume parti au Chai, plus la contenance de la cuve.
    var _vl=_vendVolLoge(c);
    return '<div class="mvv-decrow"><span>'+_escHtml(c.nom)+'</span><span class="u">'+(d.date?_vendFrDate(d.date):'')+' · '
      +(_vl>0?(_vendCuvF1(_vl)+' hL'+(c.vol_decuve_src==='mesure'?' mesurés':'')):'volume non saisi')+' → Le Chai'+fa+_sv+'</span></div>';
  }).join('');
  var nFa=list.filter(_vendFaEnCours).length;
  return '<details class="mvv-decwrap"'+(nFa?' open':'')+'><summary class="mvv-decsum">Décuvées ('+list.length+')'
    +(nFa?' — '+nFa+' à finir au chai':'')+'</summary>'+rows+'</details>';
}

// —— Gestionnaire de clients vrac ——
var _vendClientEdit=null;
function openVendClients(){
  var cls=_vendClients();
  var totBy={};
  cls.forEach(function(c){ totBy[c.nom]=0; });
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){
    cls.forEach(function(c){ totBy[c.nom]+=_recKgPour(r,c.nom); });
  });
  var rows=cls.length?cls.map(function(c,i){
    var tot=totBy[c.nom]||0;
    return '<div class="mvv-clrow"><div style="flex:1;min-width:0"><div class="mvv-clrow-nm">'+_escHtml(c.nom)+'</div>'
      +'<div class="mvv-clrow-mt">'+(c.poids_caisse_kg||25)+' kg/caisse'+(tot>0?' · '+tot.toLocaleString('fr-FR')+' kg livrés':'')+'</div></div>'
      +'<div class="mvv-clrow-r"><button class="mv-gh mvv-icbtn" onclick="openVendClient('+i+')" title="Modifier" aria-label="Modifier">'+_mvIcon('crayon',18)+'</button>'
      +'<button class="mv-gh mv-gh-rouge mvv-icbtn" onclick="deleteVendClient('+i+')" title="Supprimer" aria-label="Supprimer">'+_mvIcon('corbeille',18)+'</button></div></div>';
  }).join(''):'<div class="mvv-fnote">Aucun client vrac. Ajoutez-en un pour tracer les ventes de raisin en vrac et leur poids par caisse.</div>';
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Clients vrac</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">Référentiel propre à la vendange. Le poids par caisse de chaque client sert à convertir les caisses vendues en kilos.</div>'
    +'<div class="mvv-cllist">'+rows+'</div>'
    +'<button class="mvv-save ghost2" style="margin-top:14px" onclick="openVendClient(-1)">+ Ajouter un client</button>';
  _vendSheet(html);
}
function openVendClient(i){
  _vendClientEdit=i;
  var cls=_vendClients(); var c=(i>=0)?cls[i]:null;
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+(c?'Modifier le client':'Nouveau client')+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="openVendClients()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<label class="mvv-flbl">Nom du client</label><input id="vcl-nom" class="mvv-tin" type="text" value="'+_escHtml(c?c.nom:'')+'" placeholder="ex. Maison Bouchard">'
    +'<label class="mvv-flbl">Poids par caisse (kg)</label><input id="vcl-pck" class="mvv-tin" type="text" inputmode="decimal" value="'+_vendNbTxt(c?(c.poids_caisse_kg||25):25,0)+'">'
    // Poids PROPOSE, et non impose : depuis VD-1 chaque apport fige le sien.
    +'<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">Poids proposé à la saisie. Le modifier ne change aucun apport déjà enregistré.</div>'
    +'<label class="mvv-flbl">Adresse (pour le bon de livraison)</label><input id="vcl-adr" class="mvv-tin" type="text" value="'+_escHtml(c?(c.adresse||''):'')+'" placeholder="ex. 12 rue du Chapitre, 21200 Beaune">'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendClient()">Enregistrer</button>'
    +(c?'<button class="mvv-del" onclick="deleteVendClient('+i+')">Supprimer ce client</button>':'');
  _vendSheet(html);
}
function saveVendClient(){
  if(!_vendGarde()) return;
  var nom=((document.getElementById('vcl-nom')||{}).value||'').trim();
  if(!nom){ showToast('Saisissez un nom','#E07060'); return; }
  var pck=_vendLireNb((document.getElementById('vcl-pck')||{}).value);
  pck=(isNaN(pck)||pck<=0)?25:Math.min(80,pck);
  var adr=(((document.getElementById('vcl-adr')||{}).value)||'').trim();
  var cls=_vendClients();
  if(_vendClientEdit!=null&&_vendClientEdit>=0&&cls[_vendClientEdit]){
    var old=cls[_vendClientEdit].nom;
    if(old!==nom&&cls.some(function(x,j){return j!==_vendClientEdit&&x.nom===nom;})){ showToast('Ce client existe déjà','#E07060'); return; }
    cls[_vendClientEdit]={nom:nom,poids_caisse_kg:pck,adresse:adr};
    if(old&&old!==nom){ (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.client===old) r.client=nom; }); }
  } else {
    if(cls.some(function(x){return x.nom===nom;})){ showToast('Ce client existe déjà','#E07060'); return; }
    cls.push({nom:nom,poids_caisse_kg:pck,adresse:adr});
  }
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave('Client enregistré','#3D6B27');
  openVendClients();
}
function deleteVendClient(i){
  if(!_vendGarde()) return;
  var cls=_vendClients(); var c=cls[i]; if(!c) return;
  var nm=c.nom;
  _vendSheetClose();
  window.openConfirmDel('Supprimer le client « '+nm+' » ?','Les récoltes liées repasseront en vrac générique.',function(){
    var arr=_vendClients();
    var idx=arr.findIndex(function(x){return x.nom===nm;});
    if(idx===-1){ openVendClients(); return; }
    (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r.client===nm) r.client=''; });
    arr.splice(idx,1);
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('Client supprimé','#B85A1A');
    openVendClients();
  });
}

/* ═════ CHANGER L'ETAPE, ET LA DATER — PARC-1 ═════
   Deux entrees, un seul ecran : le bouton du detail pose un passage neuf,
   le crayon du parcours corrige un passage deja pose. Une correction n'est
   qu'un passage dont on rectifie la date — leur donner deux ecrans
   differents aurait fabrique deux verites.
   ⚠ Le statut de la cuve SUIT la derniere etape du parcours, sinon la frise
   et le badge se contrediraient. Deux exceptions, et elles sont fermes :
   une cuve FUSIONNEE ou DECUVEE reste 'termine'. Son parcours est clos ;
   corriger une date ne doit pas la rouvrir alors que la cuvee existe deja
   au Chai. */
var _vstCuveId=null, _vstEditId=null, _vstSel='';
function openVendStat(cuveId,histId){
  if(!canWrite()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===cuveId;});
  if(!c) return;
  var e=histId?_vendHist(c).find(function(x){return x.id===histId;}):null;
  _vstCuveId=cuveId; _vstEditId=e?histId:null;
  _vstSel=e?e.statut:(c.statut||'setup');
  var chips=_VEND_STEPS.map(function(s){
    /* ⚠ C24b : `s[0]` est une constante litterale de _VEND_STEPS, mais on
       l'echappe quand meme — graver une exception au cliquet coute plus cher
       que trois caracteres (§72e). */
    return '<button class="mvv-optab'+(s[0]===_vstSel?' on':'')+'" onclick="_vstSet(\''+_escAttr(s[0])+'\')">'
      +_vendStatLbl(s[0])+'</button>';
  }).join('');
  var html=''
    +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">'+(e?'Corriger l\u2019\u00e9tape':'Changer l\u2019\u00e9tape')
      +' \u2014 '+_escHtml(c.nom||'Cuve')+'</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">La date est celle du <b>passage</b>, pas celle de l\u2019encuvage. '
      +'Ce qui a \u00e9t\u00e9 fait avant garde son \u00e9tape.</div>'
    +'<label class="mvv-flbl">\u00c9tape</label><div class="mvv-optabs">'+chips+'</div>'
    +'<label class="mvv-flbl">Depuis le</label>'
    +'<input id="vst-date" class="mvv-tin" type="date" value="'+_escAttr((e&&e.date)||_mlAuj())+'">'
    +'<div class="mvv-fnote">'+(c.date_entree?('Encuvage le '+_vendFrDate(c.date_entree)+'. '):'')
      +'Une date ant\u00e9rieure \u00e0 l\u2019encuvage, ou post\u00e9rieure \u00e0 aujourd\u2019hui, est refus\u00e9e.</div>'
    +'<button class="mvv-save" style="margin-top:18px" onclick="saveVendStat()">'
      +(e?'Enregistrer la correction':'Enregistrer le passage')+'</button>'
    +(e?'<button class="mvv-del" onclick="_vendStatDel()">Supprimer cette \u00e9tape</button>':'');
  _vendSheet(html);
}
function _vstSet(k){
  _vstSel=k;
  var tabs=document.querySelectorAll('#mvv-ov .mvv-optab');
  tabs.forEach(function(b,i){ if(_VEND_STEPS[i]) b.classList.toggle('on',_VEND_STEPS[i][0]===k); });
}
function saveVendStat(){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vstCuveId;});
  if(!c) return;
  var d=String(((document.getElementById('vst-date')||{}).value)||'').slice(0,10);
  if(!d){ showToast('Choisissez la date du passage','#E07060'); return; }
  if(c.date_entree && d<c.date_entree){
    showToast('Ant\u00e9rieur \u00e0 l\u2019encuvage du '+_vendFrDate(c.date_entree),'#B85A1A'); return; }
  if(d>_mlAuj()){ showToast('Un passage ne se pose pas dans le futur','#B85A1A'); return; }
  if(!Array.isArray(c.statut_hist)) c.statut_hist=[];
  if(_vstEditId){
    var e=_vendHist(c).find(function(x){return x.id===_vstEditId;});
    if(!e){ showToast('\u00c9tape introuvable','#B85A1A'); return; }
    e.statut=_vstSel; e.date=d;
  } else {
    c.statut_hist.push({id:'vst_'+Date.now()+'_'+_vstSel, statut:_vstSel, date:d});
  }
  var h=_vendHist(c);
  var clos=_vendEstFusionnee(c)||!!(c.decuvage&&c.decuvage.date);
  if(h.length && !clos) c.statut=h[h.length-1].statut;
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  /* ⚠ VD-SAVE : le vert ne part QUE sur ok. Passer par window.fbSave nu
     afficherait « enregistré » sur une ecriture partie en file. */
  _vendFbSave(_vendStatLbl(_vstSel)+' \u00b7 '+_vendFrDate(d),'#3D6B27');
  _vendSheetClose();
  renderVendCuves();
}
/* ⚠ Supprimer une etape ne RETROGRADE pas la cuve : on efface une date, pas
   un fait. Retirer le dernier passage ferait repasser une cuve en FA parce
   qu'on a corrige une faute de frappe — le statut reste ou il est. */
function _vendStatDel(){
  if(!_vendGarde()) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===_vstCuveId;});
  if(!c||!_vstEditId) return;
  var _id=_vstEditId;
  window.openConfirmDel('Supprimer cette \u00e9tape ?',
    'Le parcours perdra cette date. Le statut de la cuve ne change pas.',function(){
    c.statut_hist=(c.statut_hist||[]).filter(function(x){return x.id!==_id;});
    window.CAVE_VENDANGE=CAVE_VENDANGE;
    _vendFbSave('\u00c9tape supprim\u00e9e','#B85A1A');
    _vendSheetClose();
    renderVendCuves();
  });
}

// —— Exports fenêtre (Vendange v2) ——
window._vendSetVue          = _vendSetVue;
window._vendSetFiltre       = _vendSetFiltre;
window._vendSetTri          = _vendSetTri;
window._vendBascOuv         = _vendBascOuv;
window._vendSetQ            = _vendSetQ;
window._vendVideQ           = _vendVideQ;
window._vendSheetClose      = _vendSheetClose;
window.openVendStat         = openVendStat;
window._vstSet              = _vstSet;
window.saveVendStat         = saveVendStat;
window._vendStatDel         = _vendStatDel;
window.openVendDecuvage     = openVendDecuvage;
window._vendDecAdj          = _vendDecAdj;
window.saveVendDecuvage     = saveVendDecuvage;
window.openVendOp           = openVendOp;
window._vendOpSet           = _vendOpSet;
window._vendOpCalc          = _vendOpCalc;
window._vendOpMoyChg        = _vendOpMoyChg;
window._vendOpQteCalc       = _vendOpQteCalc;
window.saveVendOp           = saveVendOp;
window._vendOpDel           = _vendOpDel;
window.openVendClients      = openVendClients;
window.openVendVrac         = openVendVrac;
window._vendSetRdtBase      = _vendSetRdtBase;
window.openVendLivs         = openVendLivs;
window.openVendRetour       = openVendRetour;
window._vendRetSet          = _vendRetSet;
window._vendRetGlob         = _vendRetGlob;
window._vendRetDate         = _vendRetDate;
window._vendRetDetail       = _vendRetDetail;
window._vendRetSave         = _vendRetSave;
window._vendRetClear        = _vendRetClear;
window._vendDocBon          = _vendDocBon;
window._vendDocRecap        = _vendDocRecap;
window.openVendClient       = openVendClient;
window.saveVendClient       = saveVendClient;
window.deleteVendClient     = deleteVendClient;

// ═══════════════════════════════════════════════════════════════════════════
// CUV-5 — CORRIGER UN POIDS DE CAISSE APRÈS COUP (06/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
// Signalé par Nico en pleine vendange : les caisses annoncées à 25 kg et à
// 12 kg pesaient en réalité 20 kg et 10 kg. Quarante-sept récoltes déjà
// saisies. Ce n'est pas la saisie qui s'est trompée — c'est la caisse.
//
// `pck` est FIGÉ dans chaque apport depuis VD-1, et la règle est bonne :
// corriger une fiche client ne doit pas déplacer un bon déjà signé. Mais figé
// ne veut pas dire sans issue, et il manquait la porte. Rouvrir 47 récoltes
// une par une, c'est 47 occasions d'en oublier une — et RIEN ne dirait
// laquelle : l'écran n'affiche que des kilos, jamais le poids qui les a faits.
//
// ⚠️⚠️ CE QUI FAIT LE PRIX DE CE LOT N'EST PAS LE CHAMP, C'EST LE RECALCUL.
//   Les kilos ne vivent pas qu'au Cuvier. `rendement_hist` les dénormalise
//   dans la PARCELLE, et c'est là que Pilotage lit son prix de revient. Un
//   correcteur qui n'écrirait que `parts[].pck` laisserait le Cuvier juste et
//   le Pilotage faux — l'écart le plus cher à trouver, parce que les deux
//   écrans ont l'air sains chacun de son côté.
//   La correction repasse donc par `_vendRecordRendement`, LA MÊME fonction
//   que l'enregistrement d'une récolte. Pas une copie du calcul : la fonction.
// ═══════════════════════════════════════════════════════════════════════════

var _vpc = {mil:null, ancien:null, nouveau:null, defaut:true, clients:true};

// Les millésimes qui portent au moins une récolte, du plus récent au plus ancien.
function _vpcMillesimes(){
  var s={};
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ if(r) s[_vendMillOfDate(r.date)]=1; });
  return Object.keys(s).map(Number).sort(function(a,b){ return b-a; });
}
function _vpcRecs(mil){
  return (CAVE_VENDANGE.recoltes||[]).filter(function(r){
    return r && _vendMillOfDate(r.date)===mil;
  });
}
// Les poids RÉELLEMENT posés sur les apports d'un millésime, et ce qu'ils pèsent.
// ⚠️ On lit `_vpPck()`, jamais `part.pck` en direct : une récolte d'avant VD-1
//    n'a pas de `parts[]` et son poids vient encore de la fiche client. Sans
//    ça, la seule récolte que le correcteur ne verrait pas serait justement la
//    plus ancienne — celle qu'on aurait le plus de mal à retrouver à la main.
function _vpcPoids(mil){
  var by={};
  _vpcRecs(mil).forEach(function(r){
    _vendParts(r).forEach(function(p){
      var cs=_vpCs(p); if(cs<=0) return;
      var k=_vpPck(p);
      var o=by[k]||(by[k]={pck:k,recs:{},apports:0,caisses:0,kg:0,dests:{}});
      o.recs[r.id]=1; o.apports++; o.caisses+=cs; o.kg+=cs*k;
      var n=_vpNom(p); o.dests[n]=(o.dests[n]||0)+cs*k;
    });
  });
  return Object.keys(by).map(Number).sort(function(a,b){ return b-a; })
    .map(function(k){ var o=by[k]; o.recoltes=Object.keys(o.recs).length; return o; });
}
function _vpcLigne(mil,pck){
  var l=_vpcPoids(mil).filter(function(o){ return o.pck===pck; });
  return l.length?l[0]:null;
}
// Les fiches client qui annoncent encore l'ancien poids.
function _vpcClientsVises(anc){
  return _vendClients().filter(function(c){ return Number(c.poids_caisse_kg)===anc; });
}

function openVendPoids(){
  if(!_vendGarde()) return;
  var ms=_vpcMillesimes();
  if(!ms.length){ showToast('Aucune récolte à corriger','#B85A1A'); return; }
  if(ms.indexOf(_vpc.mil)===-1) _vpc.mil=ms[0];
  var ps=_vpcPoids(_vpc.mil);
  if(!ps.length) _vpc.ancien=null;
  else if(!ps.some(function(o){ return o.pck===_vpc.ancien; })) _vpc.ancien=ps[0].pck;
  _vpcRender();
}
function _vpcRender(){
  var ms=_vpcMillesimes(), ps=_vpcPoids(_vpc.mil);
  var h=''
   +'<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Corriger un poids de caisse</div>'
   +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" title="Fermer" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
   +'<div class="mvv-sheet-sub">Le poids d’une caisse est figé au jour de la saisie, et c’est ce qui protège '
   +'un bon déjà signé. Ici, et seulement ici, il se reprend en bloc — quand ce n’est pas la saisie qui '
   +'s’est trompée, mais la caisse.</div>';

  h+='<label class="mvv-flbl">Millésime</label>'
   +'<select class="mvv-tin" id="vpc-mil" onchange="_vpcSetMil(this.value)">'
   +ms.map(function(m){ return '<option value="'+m+'"'+(m===_vpc.mil?' selected':'')+'>'+m+'</option>'; }).join('')
   +'</select>';

  h+='<label class="mvv-flbl">Poids en place</label>';
  if(!ps.length){
    h+='<div class="mvv-fnote">Aucun apport saisi sur ce millésime.</div>';
    _vendSheet(h); return;
  }
  h+='<div class="mvv-cllist">'+ps.map(function(o){
    var on=(o.pck===_vpc.ancien);
    return '<button type="button" class="mvv-clrow" style="width:100%;text-align:left;border:none;'
     +'background:'+(on?'rgba(192,132,90,.12)':'transparent')+';cursor:pointer" onclick="_vpcSetAnc('+o.pck+')">'
     +'<span class="vrp-d" style="background:'+(on?'var(--terre,#8A5A38)':'rgba(138,90,56,.22)')+'"></span>'
     +'<span style="flex:1;min-width:0;margin-left:9px"><span class="mvv-clrow-nm">'+_vendNbTxt(o.pck,0)+' kg par caisse</span>'
     +'<span class="mvv-clrow-mt" style="display:block">'+o.recoltes+' récolte'+(o.recoltes>1?'s':'')
     +' · '+o.apports+' apport'+(o.apports>1?'s':'')+' · '+o.caisses+' caisses · '
     +_vendL1(o.kg/1000)+' t</span></span></button>';
  }).join('')+'</div>';

  h+='<label class="mvv-flbl">Poids réel (kg)</label>'
   +'<input id="vpc-nv" class="mvv-tin" type="text" inputmode="decimal" placeholder="ex. 20" '
   +'value="'+_vendNbTxt(_vpc.nouveau,0)+'" oninput="_vpcSetNv(this.value)">';

  h+='<div id="vpc-bas">'+_vpcBasHtml()+'</div>';
  _vendSheet(h);
}
// Le bas de la feuille se rafraîchit à chaque frappe. Il est isolé pour la
// raison habituelle de ce fichier : réécrire la feuille entière recrée
// `#vpc-nv`, donc perd le curseur, et on ne peut plus taper le second chiffre.
function _vpcBasHtml(){
  var anc=_vpc.ancien, nv=_vpc.nouveau, o=_vpcLigne(_vpc.mil,anc);
  if(!o) return '';
  var pret=(nv>0&&nv!==anc);
  var h='<div class="vrp-tot" style="margin-top:12px"><div class="vrp-tot-g">'
   +'<div><div class="vrp-tot-n">'+o.recoltes+'</div><div class="vrp-tot-l">Récoltes</div></div>'
   +'<div><div class="vrp-tot-n">'+_vendL1(o.kg/1000)+'<small>t</small></div><div class="vrp-tot-l">Aujourd’hui</div></div>'
   +'<div><div class="vrp-tot-n">'+(pret?(_vendL1(o.kg/anc*nv/1000)+'<small>t</small>'):'—')
   +'</div><div class="vrp-tot-l">Après</div></div></div>';
  h+='<div class="vrp-tot-d">';
  if(pret){
    var d=o.kg/anc*nv-o.kg;
    Object.keys(o.dests).sort().forEach(function(n){
      h+=_escHtml(n)+' — '+_vendKgTxt(o.dests[n])+' kg → <b>'+_vendKgTxt(o.dests[n]/anc*nv)+' kg</b><br>';
    });
    h+='<span style="color:rgba(240,232,220,.5)">Écart total '+(d>0?'+':'−')+' '
     +_vendKgTxt(Math.abs(d))+' kg sur le millésime '+_vpc.mil+'.</span>';
  } else {
    h+='<span style="color:rgba(240,232,220,.5)">Saisissez le poids réel d’une de ces caisses.</span>';
  }
  h+='</div></div>';

  if(pret && _vpcEnorme(anc,nv)){
    // ⚠️ CUV-6 — le 06/09, un « 10 » resté d'une autre ligne a affiché un écart
    //   de 16 215 kg sur une campagne, avec l'aplomb d'un chiffre juste. Une
    //   correction de plus de 40 % n'est pas impossible, mais elle n'est jamais
    //   anodine : elle doit se voir AVANT qu'on appuie, pas après.
    h+='<div class="mvv-fnote" style="border-left:3px solid var(--orange,#B85A1A);'
     +'padding-left:9px;color:var(--orange,#B85A1A)"><b>Vérifiez ce poids.</b> Passer de '
     +_vendNbTxt(anc,0)+' à '+_vendNbTxt(nv,0)+' kg, c\u2019est '
     +Math.round(Math.abs(nv-anc)/anc*100)+'\u00a0% du poids d\u2019une caisse. '
     +'C\u2019est possible, mais c\u2019est aussi ce que donne un poids tap\u00e9 pour une autre ligne.</div>';
  }
  if(pret){
    var majD=(_vendCfg().poids_caisse_kg===anc);
    var majC=_vpcClientsVises(anc);
    if(majD){
      h+='<div class="mvl-chk'+(_vpc.defaut?' on':'')+'" onclick="_vpcTog(\'defaut\')"><div class="bx">'
       +(_vpc.defaut?_mvIcon('check',16):'')+'</div><div><div class="tx">Corriger aussi le poids par défaut du Cuvier</div>'
       +'<div class="sb">'+_vendNbTxt(anc,0)+' → '+_vendNbTxt(nv,0)+' kg. C’est lui qui sert aux prochaines saisies '
       +'et aux hectolitres estimés d’une cuve non décuvée.</div></div></div>';
    }
    if(majC.length){
      h+='<div class="mvl-chk'+(_vpc.clients?' on':'')+'" onclick="_vpcTog(\'clients\')"><div class="bx">'
       +(_vpc.clients?_mvIcon('check',16):'')+'</div><div><div class="tx">Corriger aussi '+majC.length+' fiche'
       +(majC.length>1?'s':'')+' client</div>'
       +'<div class="sb">'+_escHtml(majC.map(function(c){ return c.nom; }).join(', '))
       +' — poids habituel proposé à la saisie.</div></div></div>';
    }
    h+='<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">'
     +'<b>Ce que la correction déplace</b> : les kilos, les rendements kg/ha et hL/ha de chaque parcelle, '
     +'les bons de livraison, le bilan de campagne.<br>'
     +'<b>Ce qu’elle ne touche pas</b> : les litres de jus et de lie rendus par un client — c’est sa mesure, '
     +'pas la vôtre —, la contenance des cuves, et un bon déjà imprimé et remis.</div>'
     +'<button class="mvv-save" style="margin-top:14px" onclick="_vpcConfirmer()">Appliquer la correction</button>';
  }
  return h;
}
function _vpcEnorme(anc,nv){ return anc>0 && nv>0 && Math.abs(nv-anc)/anc>0.4; }
function _vpcMaj(){ var el=document.getElementById('vpc-bas'); if(el) el.innerHTML=_vpcBasHtml(); }
// ⚠️ DÉFAUT CUV-6 — `_vpc.nouveau` SURVIVAIT AU CHANGEMENT DE LIGNE.
//   Le correcteur sélectionne d'office le poids le plus lourd à l'ouverture.
//   Un « 10 » tapé pour les caisses de 12 restait en place quand on revenait
//   sur celles de 25, et l'aperçu annonçait tranquillement 27 025 → 10 810 kg,
//   soit 16 215 kg d'écart sur une campagne. Le chiffre était juste au sens
//   arithmétique : c'est la question qui n'était plus celle qu'on posait.
//   Un poids réel ne veut rien dire hors du poids qu'il remplace : il se vide
//   avec lui.
function _vpcSetMil(v){ _vpc.mil=parseInt(v,10)||_vpc.mil; var ps=_vpcPoids(_vpc.mil);
  _vpc.ancien=ps.length?ps[0].pck:null; _vpc.nouveau=null; _vpcRender(); }
function _vpcSetAnc(v){ var k=Number(v); if(k!==_vpc.ancien) _vpc.nouveau=null;
  _vpc.ancien=k; _vpcRender(); }
function _vpcSetNv(v){ var n=_vendLireNb(v); _vpc.nouveau=(isNaN(n)||n<=0)?null:n; _vpcMaj(); }
function _vpcTog(k){ _vpc[k]=!_vpc[k]; _vpcMaj(); }

function _vpcConfirmer(){
  var anc=_vpc.ancien, nv=_vpc.nouveau, o=_vpcLigne(_vpc.mil,anc);
  if(!o||!(nv>0)||nv===anc) return;
  var sub=_vendNbTxt(anc,0)+' kg → '+_vendNbTxt(nv,0)+' kg par caisse sur le millésime '+_vpc.mil
      +' · '+_vendL1(o.kg/1000)+' t deviennent '+_vendL1(o.kg/anc*nv/1000)+' t.';
  if(_vpcEnorme(anc,nv)) sub='Attention, '+Math.round(Math.abs(nv-anc)/anc*100)
    +' % du poids d\u2019une caisse. '+sub;
  window.openConfirmDel(
    'Corriger ' + o.recoltes + ' récolte' + (o.recoltes>1?'s':'') + ' ?',
    sub, _vpcAppliquer, 'balance', 'Corriger', '#8A5A38');
}
function _vpcAppliquer(){
  if(!_vendGarde()) return;
  var anc=_vpc.ancien, nv=_vpc.nouveau, mil=_vpc.mil;
  if(!(anc>0)||!(nv>0)||nv===anc) return;
  var nRec=0, nApp=0;
  // ⚠️ Une rafale de 47 corrections, c'est 47 `saveData('parcelles')` si on ne
  //    fait rien — 47 transactions sur la collection la plus protégée de
  //    l'application. `_vendParcLot` les regroupe en une seule écriture.
  _vendParcLot(function(){
    _vpcRecs(mil).forEach(function(r){
      var ps=_vendParts(r);
      if(!ps.some(function(p){ return _vpCs(p)>0 && _vpPck(p)===anc; })) return;
      // ⚠️ Une récolte d'avant VD-1 n'a pas encore de `parts[]` : `_vendParts`
      //    lui en fabrique une EN LECTURE, qui n'est stockée nulle part. La
      //    corriger sans l'écrire dans la récolte perdrait la correction au
      //    prochain chargement, sans un mot. Même piège que `_vendRetSave`.
      if(!Array.isArray(r.parts)||!r.parts.length) r.parts=ps;
      r.parts.forEach(function(p){
        if(_vpCs(p)>0 && _vpPck(p)===anc){ p.pck=nv; nApp++; }
      });
      r.nb_caisses=_recCaisses(r);
      // `prev` reste nul : la parcelle ne bouge pas, il n'y a aucune entrée de
      // rendement à retirer ailleurs. L'upsert par `recolte_id` fait le reste.
      _vendRecordRendement(r,null);
      nRec++;
    });
  });
  // ⚠️⚠️ DÉFAUT CUV-6 — CE GARDE-FOU ÉTAIT EN DESSOUS DES DEUX MUTATIONS.
  //   Une exécution qui ne corrigeait AUCUN apport changeait quand même le
  //   poids par défaut et les fiches client EN MÉMOIRE, puis repartait sans
  //   enregistrer. Ces modifications orphelines partaient ensuite dans le
  //   premier enregistrement venu, depuis n'importe quel écran — un réglage
  //   déplacé sans que personne ne l'ait demandé, et rien pour le dire.
  //   ★★★ RIEN NE DOIT ÊTRE TOUCHÉ TANT QU'ON N'EST PAS SÛR D'ALLER AU BOUT.
  //   Une sortie anticipée doit laisser l'état exactement comme elle l'a
  //   trouvé — c'est la seule forme qui reste vraie quand on ajoutera une
  //   troisième mutation en dessous.
  if(!nRec){ showToast('Aucun apport à ce poids','#B85A1A'); return; }
  var suite=[];
  if(_vpc.defaut && _vendCfg().poids_caisse_kg===anc){
    if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config={};
    CAVE_VENDANGE.config.poids_caisse_kg=nv;
    suite.push('poids par défaut');
  }
  if(_vpc.clients){
    var cl=_vpcClientsVises(anc);
    cl.forEach(function(c){ c.poids_caisse_kg=nv; });
    if(cl.length) suite.push(cl.length+' fiche'+(cl.length>1?'s':'')+' client');
  }
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(nRec+' récolte'+(nRec>1?'s':'')+' corrigée'+(nRec>1?'s':'')
    +' · '+nApp+' apport'+(nApp>1?'s':'')+(suite.length?(' · '+suite.join(' et ')):''),'#3D6B27');
  _vpc.nouveau=null;
  _vendSheetClose();
  if(_caveSectionAct()==='reglages') renderVendParam();
  else if(_vendTab==='rec') renderVendRec();
}

window.openVendPoids  = openVendPoids;
window._vpcSetMil     = _vpcSetMil;
window._vpcSetAnc     = _vpcSetAnc;
window._vpcSetNv      = _vpcSetNv;
window._vpcTog        = _vpcTog;
window._vpcConfirmer  = _vpcConfirmer;
window._vpcAppliquer  = _vpcAppliquer;


// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2.1 — parcelle en liste · cuvée · liaison Récolte→Cuve · PDF récoltes
// (cave.js seul — champs injectés dans les overlays existants)
// ═══════════════════════════════════════════════════════════════════════════

// —— Noms des parcelles enregistrées (window.PARCELLES) ——
function _vendParcelleNames(){
  var ps=window.PARCELLES||[];
  var names=ps.map(function(p){return (p&&p.nom||'').trim();}).filter(Boolean);
  return Array.from(new Set(names)).sort(function(a,b){return a.localeCompare(b,'fr');});
}

// —— Transforme #vrec-parcelle en menu déroulant des parcelles ——
function _vendInjectParcelleSelect(cur){
  var el=document.getElementById('vrec-parcelle'); if(!el) return;
  var names=_vendParcelleNames();
  if(!names.length){ el.value=cur||''; return; }              // aucune parcelle → saisie libre
  if(cur&&names.indexOf(cur)===-1) names=[cur].concat(names);  // préserve une valeur hors liste
  var opts='<option value="">— Choisir une parcelle —</option>'
    +names.map(function(n){return '<option value="'+_escHtml(n)+'"'+(n===cur?' selected':'')+'>'+_escHtml(n)+'</option>';}).join('');
  if(el.tagName==='SELECT'){ el.innerHTML=opts; el.value=cur||''; return; }
  var sel=document.createElement('select');
  sel.id='vrec-parcelle';
  if(el.className) sel.className=el.className;
  sel.setAttribute('style', el.getAttribute('style')||'width:100%');
  sel.innerHTML=opts;
  el.parentNode.replaceChild(sel,el);
  sel.value=cur||'';
}

// ══════ REGISTRE DES CUVÉES DE VENDANGE (anti-doublon) ══════
// Modèle : CAVE_VENDANGE.cuvees = [{id:'vcv_…', nom, millesime}]
//          récolte.vcuvee_id  → clé réelle ; récolte.cuvee → miroir (PDF/export/legacy)
// ⚠️ vcuvee_id ≠ cuvee_id : ce dernier désigne une cuvée d'ÉLEVAGE (op.cuvee_id, decuvage.cuvee_id).
var _vcuvSel = {mode:'pick', id:null, nom:'', dup:null, force:false, cuveIdx:0, vol:null};
var _vcuvIdx = {cur:[], old:[], cuves:[]};
var _vrecDateHooked = false;
// Millésime = ANNÉE CIVILE de la date de récolte (convention vin, cf. rendement_hist)
function _vendMillOfDate(d){
  var y=parseInt(String(d||'').slice(0,4),10);
  return y>1900?y:(new Date()).getFullYear();
}
function _vendCuvById(id){
  if(!id) return null;
  return (CAVE_VENDANGE.cuvees||[]).find(function(c){return c&&c.id===id;})||null;
}
// Reconstruction déterministe : migre les récoltes legacy (cuvee texte, sans vcuvee_id)
// et élague les cuvées orphelines. EN MÉMOIRE — aucune écriture Firestore spontanée.
function _vendCuvSync(){
  if(!CAVE_VENDANGE.cuvees) CAVE_VENDANGE.cuvees=[];
  var reg=CAVE_VENDANGE.cuvees, recs=CAVE_VENDANGE.recoltes||[], chg=false;
  var byKey={};
  reg.forEach(function(c){ if(c&&c.id) byKey[_cuvKey(c.nom)+'|'+c.millesime]=c; });
  recs.forEach(function(r){
    if(!r||!_recHasDom(r)) return;
    var nom=(r.cuvee||'').trim(); if(!nom) return;
    var mil=_vendMillOfDate(r.date), k=_cuvKey(nom)+'|'+mil;
    var c=r.vcuvee_id?_vendCuvById(r.vcuvee_id):null;
    if(!c){
      c=byKey[k];
      if(!c){
        c={id:'vcv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),nom:nom,millesime:mil};
        reg.push(c); byKey[k]=c; chg=true;
      }
      r.vcuvee_id=c.id; chg=true;
    }
    if(r.cuvee!==c.nom){ r.cuvee=c.nom; chg=true; }
  });
  var used={};
  recs.forEach(function(r){ if(r&&r.vcuvee_id) used[r.vcuvee_id]=1; });
  (CAVE_VENDANGE.cuves_vinif||[]).forEach(function(c){ if(c&&c.vcuvee_id) used[c.vcuvee_id]=1; });
  var keep=reg.filter(function(c){ return c&&c.id&&used[c.id]; });
  if(keep.length!==reg.length){ CAVE_VENDANGE.cuvees=keep; chg=true; }
  return chg;
}
function _vendCuvList(mill){
  _vendCuvSync();
  return (CAVE_VENDANGE.cuvees||[]).filter(function(c){return c&&c.millesime===mill;})
    .sort(function(a,b){return String(a.nom).localeCompare(String(b.nom),'fr');});
}
// Noms des millésimes antérieurs, non encore repris cette année
function _vendCuvPast(mill){
  _vendCuvSync();
  var pris={}, vus={}, out=[];
  (CAVE_VENDANGE.cuvees||[]).forEach(function(c){ if(c&&c.millesime===mill) pris[_cuvKey(c.nom)]=1; });
  (CAVE_VENDANGE.cuvees||[]).filter(function(c){return c&&c.millesime<mill;})
    .sort(function(a,b){return (b.millesime-a.millesime)||String(a.nom).localeCompare(String(b.nom),'fr');})
    .forEach(function(c){
      var k=_cuvKey(c.nom); if(!k||pris[k]||vus[k]) return; vus[k]=1; out.push(c);
    });
  return out;
}
// Voisin le plus proche dans le millésime — seuil proportionnel à la longueur
function _vendCuvNear(nom,mill){
  var k=_cuvKey(nom); if(k.length<3) return null;
  var best=null;
  _vendCuvList(mill).forEach(function(c){
    var ck=_cuvKey(c.nom), d;
    if(ck===k) d=0;
    else if(ck.indexOf(k)===0||k.indexOf(ck)===0) d=1;
    else d=_cuvLev(ck,k);
    var seuil=Math.max(1,Math.floor(Math.min(ck.length,k.length)/6));
    if(d<=seuil&&(!best||d<best.d)) best={cuvee:c,d:d};
  });
  return best;
}
function _vendCuvEnsure(nom,mill){
  nom=String(nom||'').trim(); if(!nom) return null;
  if(!CAVE_VENDANGE.cuvees) CAVE_VENDANGE.cuvees=[];
  var k=_cuvKey(nom);
  var ex=(CAVE_VENDANGE.cuvees||[]).find(function(c){return c&&c.millesime===mill&&_cuvKey(c.nom)===k;});
  if(ex) return ex;
  var c={id:'vcv_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),nom:nom,millesime:mill};
  CAVE_VENDANGE.cuvees.push(c);
  return c;
}
function _vendCuvStats(id){
  var rs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return r&&_recHasDom(r)&&r.vcuvee_id===id;});
  var parc=[];
  rs.forEach(function(r){ var n=(r.parcelle||'').trim(); if(n&&parc.indexOf(n)===-1) parc.push(n); });
  var cids={};
  rs.forEach(function(r){ if(r.cuve_id) cids[r.cuve_id]=1; });
  var cuves=(CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){return c&&(c.vcuvee_id===id||cids[c.id]);});
  return {n:rs.length,caisses:rs.reduce(function(s,r){return s+_recCsDom(r);},0),
          kg:rs.reduce(function(s,r){return s+_recKgDom(r);},0),parcelles:parc,cuves:cuves};
}
// ═══════════════════════════════════════════════════════════════════════════
// CUV-6 — DES HECTOLITRES CALCULÉS SUR DES KILOS, PLUS SUR DES CAISSES
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️⚠️ `_vendCuvHl(caisses)` multipliait un NOMBRE DE CAISSES par UN poids —
//   celui du réglage. Sur un domaine qui a trois tailles de caisse (25, 20 et
//   12 kg chez Nico), cette fonction ne pouvait STRUCTURELLEMENT jamais tomber
//   juste, quel que soit le réglage : diagnostic du 06/09, 1 378 caisses,
//   31 101 kg réels contre 27 560 kg annoncés — 3 541 kg d'écart, et tous les
//   hectolitres estimés des onze cuves faux avec.
//   ★★★ C'ÉTAIT LA SECONDE SOURCE DE VÉRITÉ POUR LES MÊMES KILOS. `_recKg` en
//   donnait une (les apports, avec leur poids figé), le réglage global en
//   donnait une autre. Corriger un poids ne bougeait que la première. Deux
//   écrans sains chacun de son côté, un total impossible.
//   Il n'y a plus qu'une source : les kilos des apports.
function _vendHlKg(kg){ var r=_mlKgHl(); return (kg||0)/(r||135); }
// ⚠️ `_vendCuvHl(caisses)` est SUPPRIMÉE, pas dépréciée. Une fonction morte qui
//   traîne est une invitation : le prochain lot pressé la rappellerait et
//   réintroduirait la seconde source de vérité sans s'en apercevoir. Zéro
//   appelant restant, vérifié par le harnais.
// Le jumeau en kilos de `_vendCuvCsDom` — même filtre, même exclusion.
function _vendCuvKgDom(cuveId, exclId){
  if(!cuveId) return 0;
  return (CAVE_VENDANGE.recoltes||[]).reduce(function(s,x){
    return s+((x&&x.cuve_id===cuveId&&x.id!==exclId)?_recKgDom(x):0); },0);
}
function _vendCuvF1(n){ return (Math.round((n||0)*10)/10).toString().replace('.',','); }

// —— Champs de destination : cuvée (vinifié) vs client (vrac) ——
function _vendCuvInjectCss(){
  if(document.getElementById('mvv-cuvsel-css')) return;
  var s=document.createElement('style'); s.id='mvv-cuvsel-css';
  s.textContent=[
".mvcs-list{display:flex;flex-direction:column;gap:6px}",
".mvcs-sep{font-size:var(--pt-nano,9.5px);letter-spacing:1.4px;text-transform:uppercase;color:var(--texte-doux);font-weight:700;margin:11px 2px 3px;display:flex;align-items:center;gap:8px}",
".mvcs-sep::after{content:'';flex:1;height:1px;background:var(--gris-clair)}",
".mvcs-row{display:flex;align-items:center;gap:11px;width:100%;min-height:56px;padding:9px 12px;border-radius:12px;border:1.5px solid var(--gris-clair);background:var(--bg-card);font-family:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}",
".mvcs-row:hover{border-color:rgba(192,132,90,.45);background:rgba(192,132,90,.05)}",
".mvcs-row:focus-visible{outline:2px solid #8A5A38;outline-offset:2px}",
".mvcs-row.on{border-color:#8A5A38;background:rgba(138,90,56,.10);box-shadow:0 0 0 3px rgba(138,90,56,.10)}",
".mvcs-ico{width:34px;height:34px;flex-shrink:0;border-radius:9px;background:var(--terre-pale);display:flex;align-items:center;justify-content:center;font-size:var(--pt-sm,17px)}",
".mvcs-row.on .mvcs-ico{background:rgba(138,90,56,.20)}",
".mvcs-mid{flex:1;min-width:0}",
".mvcs-nom{display:block;font-size:var(--pt-base,14px);font-weight:600;color:var(--texte);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-sub{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-tag{flex-shrink:0;max-width:38%;font-size:var(--pt-lbl,10.5px);font-weight:700;padding:3px 8px;border-radius:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
".mvcs-tag.wait{background:var(--or-pale);color:#7A6320}",
".mvcs-tag.cuve{background:var(--vert-pale);color:#2D5016}",
".mvcs-tag.past{background:var(--gris-clair);color:var(--texte-doux)}",
".mvcs-row.new{border-style:dashed;border-color:rgba(138,90,56,.5);background:rgba(138,90,56,.04)}",
".mvcs-row.new .mvcs-ico{background:rgba(138,90,56,.14);color:#7A4A28;font-weight:700}",
".mvcs-row.new .mvcs-nom{color:#7A4A28}",
".mvcs-box{border:1.5px solid rgba(138,90,56,.5);border-radius:12px;padding:12px;background:rgba(138,90,56,.05)}",
".mvcs-act{display:flex;gap:7px;margin-top:9px}",
".mvcs-b{flex:1;min-height:44px;padding:10px 12px;border-radius:10px;font-family:inherit;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;border:1px solid transparent}",
".mvcs-b:focus-visible{outline:2px solid #8A5A38;outline-offset:2px}",
".mvcs-b.p{background:#8A5A38;color:#FFF6EA;font-weight:700}",
".mvcs-b.p:disabled{opacity:.45;cursor:not-allowed}",
".mvcs-b.s{background:var(--bg-card);border-color:var(--gris);color:var(--texte-med)}",
".mvcs-dup{margin-top:10px;border-radius:11px;padding:11px 12px;position:relative;overflow:hidden;background:var(--orange-pale);border:1px solid rgba(184,90,26,.35)}",
".mvcs-dup::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--orange)}",
".mvcs-dup-t{font-size:var(--pt-txt,12.5px);font-weight:700;color:#8A4212;display:flex;gap:6px;align-items:flex-start}",
".mvcs-dup-d{font-size:var(--pt-micro,11px);color:#8A4212;opacity:.9;margin-top:3px;line-height:1.4}",
".mvcs-dup-a{display:flex;gap:7px;margin-top:10px;flex-wrap:wrap}",
".mvcs-dup-a .mvcs-b{min-width:132px}",
".mvcs-b.j{background:#B85A1A;color:#FFF6EA;font-weight:700}",
".mvcs-b.k{background:transparent;border-color:rgba(184,90,26,.45);color:#8A4212}",
".mvcs-att{margin-top:12px;border-radius:13px;overflow:hidden;border:1px solid rgba(61,107,39,.3);background:var(--vert-pale)}",
".mvcs-att-h{padding:10px 13px;background:rgba(61,107,39,.10);font-size:var(--pt-txt,12.5px);font-weight:700;color:#2D5016;display:flex;align-items:center;gap:7px}",
".mvcs-att-b{padding:11px 13px 13px}",
".mvcs-opt{display:flex;align-items:flex-start;gap:10px;padding:10px 11px;border-radius:11px;border:1.5px solid rgba(61,107,39,.22);background:var(--bg-card);cursor:pointer;margin-bottom:7px;min-height:44px}",
".mvcs-opt:last-child{margin-bottom:0}",
".mvcs-opt.on{border-color:#3D6B27;box-shadow:0 0 0 3px rgba(61,107,39,.10)}",
".mvcs-opt input{margin:3px 0 0;accent-color:#3D6B27;width:17px;height:17px;flex-shrink:0}",
".mvcs-opt-t{display:block;font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte)}",
".mvcs-opt-s{display:block;font-size:var(--pt-micro,11px);color:var(--texte-doux);margin-top:2px;line-height:1.35}",
".mvcs-vol{display:flex;align-items:center;gap:8px;margin-top:9px;padding-top:9px;border-top:1px dashed rgba(61,107,39,.25)}",
".mvcs-vol label{font-size:var(--pt-micro,11px);font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#2D5016;flex:1}",
".mvcs-vol input{width:86px;text-align:center;background:var(--bg-card);border:2px solid rgba(61,107,39,.25);border-radius:9px;padding:9px;font-family:inherit;font-size:var(--pt-base,14px);font-weight:700;color:var(--texte);outline:none}",
".mvcs-vol input:focus{border-color:#3D6B27;box-shadow:0 0 0 3px rgba(61,107,39,.14)}",
".mvcs-vol span{font-size:var(--pt-txt,12.5px);font-weight:600;color:#2D5016}",
".mvcs-hint{font-size:var(--pt-lbl,10.5px);color:#2D5016;opacity:.8;margin-top:6px;line-height:1.4}",
".mvcs-empty{font-size:var(--pt-txt,12.5px);color:var(--texte-doux);padding:2px 2px 6px;line-height:1.45}"
].join('\n');
  document.head.appendChild(s);
}

// —— Champ « cuvée de destination » : sélecteur, plus jamais de saisie libre répétée ——
function _vendCuvMill(){
  var d=(document.getElementById('vrec-date')||{}).value||'';
  return _vendMillOfDate(d);
}
function _vendCuvRowHtml(c,on,tag,tagCls,sub,ico,fn,i){
  return '<button type="button" class="mvcs-row'+(on?' on':'')+'" role="radio" aria-checked="'+(on?'true':'false')+'"'
    +' onclick="'+fn+'('+i+')">'
    +'<span class="mvcs-ico">'+ico+'</span>'
    +'<span class="mvcs-mid"><span class="mvcs-nom">'+_escHtml(c.nom)+'</span>'
    +'<span class="mvcs-sub">'+sub+'</span></span>'
    +(tag?'<span class="mvcs-tag '+tagCls+'">'+_escHtml(tag)+'</span>':'')+'</button>';
}
function _vendCuvRender(){
  var box=document.getElementById('vrec-cuv-box'); if(!box) return;
  var mill=_vendCuvMill();
  var caisses=parseInt((document.getElementById('vrec-caisses')||{}).value)||0;
  var h='';
  if(_vcuvSel.mode==='new'){
    h='<div class="mvcs-box"><input id="vrec-cuv-new" type="text" class="fi" autocomplete="off"'
      +' placeholder="ex. Gevrey Villages, Charmes 1er Cru…" oninput="_vendCuvInput(this.value)">';
    if(_vcuvSel.dup&&!_vcuvSel.force){
      var dc=_vcuvSel.dup.cuvee, st=_vendCuvStats(dc.id);
      h+='<div class="mvcs-dup"><div class="mvcs-dup-t"><span>&#9888;&#65039;</span><span>'
        +(_vcuvSel.dup.d===0?'Ce nom existe d\u00e9j\u00e0':'Un nom tr\u00e8s proche existe d\u00e9j\u00e0')+' pour '+mill+'</span></div>'
        +'<div class="mvcs-dup-d"><b>'+_escHtml(dc.nom)+'</b>'
        +(st.parcelles.length?' \u2014 '+st.parcelles.length+' parcelle'+(st.parcelles.length>1?'s':'')+' d\u00e9j\u00e0 rentr\u00e9e'+(st.parcelles.length>1?'s':'')+' ('+_escHtml(st.parcelles.join(', '))+').':'.')
        +'<br>Cr\u00e9er un second nom couperait la cuv\u00e9e en deux.</div>'
        +'<div class="mvcs-dup-a">'
        +'<button type="button" class="mvcs-b j" onclick="_vendCuvJoinDup()">Rejoindre '+_escHtml(dc.nom)+'</button>'
        +'<button type="button" class="mvcs-b k" onclick="_vendCuvForce()">Cr\u00e9er quand m\u00eame</button></div></div>';
    }
    h+='<div class="mvcs-act"><button type="button" class="mvcs-b s" onclick="_vendCuvCancel()">Annuler</button>'
      +'<button type="button" class="mvcs-b p" onclick="_vendCuvKeep()"'
      +((!_vcuvSel.nom.trim()||(_vcuvSel.dup&&!_vcuvSel.force))?' disabled':'')+'>Utiliser ce nom</button></div></div>';
    box.innerHTML=h;
    var inp=document.getElementById('vrec-cuv-new');
    if(inp){ inp.value=_vcuvSel.nom; try{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){ if(window._mvAvale) window._mvAvale(e,'cave.js/_vendCuvRender'); } }
    _vendCuvAtt(); return;
  }
  var cur=_vendCuvList(mill); _vcuvIdx.cur=cur;
  h+='<div class="mvcs-list" role="radiogroup" aria-label="Cuv\u00e9e de destination">';
  if(cur.length){
    cur.forEach(function(c,i){
      var st=_vendCuvStats(c.id);
      var sub=(st.parcelles.length?st.parcelles.length+' parcelle'+(st.parcelles.length>1?'s':'')+' \u00b7 ':'')
        +st.caisses+' caisses \u00b7 '+_vendCuvF1(_vendHlKg(st.kg))+' hL';
      var tag,cls;
      if(st.cuves.length>1){ tag=st.cuves.length+' cuves'; cls='cuve'; }
      else if(st.cuves.length===1){ tag=st.cuves[0].nom||'en cuve'; cls='cuve'; }
      else { tag='sans cuve'; cls='wait'; }
      h+=_vendCuvRowHtml(c,_vcuvSel.id===c.id,tag,cls,sub,'\uD83E\uDED9','_vendCuvPick',i);
    });
  } else {
    h+='<div class="mvcs-empty">Aucune cuv\u00e9e ouverte pour '+mill+'. Cr\u00e9ez la premi\u00e8re ci-dessous.</div>';
  }
  h+='</div>';
  var old=_vendCuvPast(mill); _vcuvIdx.old=old;
  if(old.length){
    h+='<div class="mvcs-sep">Mill\u00e9simes pr\u00e9c\u00e9dents</div><div class="mvcs-list">';
    old.forEach(function(c,i){
      h+=_vendCuvRowHtml(c,false,String(c.millesime),'past','Reprendre ce nom pour '+mill,'\u21ba','_vendCuvReuse',i);
    });
    h+='</div>';
  }
  h+='<div class="mvcs-list" style="margin-top:10px">'
    +'<button type="button" class="mvcs-row new" onclick="_vendCuvNew()">'
    +'<span class="mvcs-ico">+</span>'
    +'<span class="mvcs-mid"><span class="mvcs-nom">Nouvelle cuv\u00e9e\u2026</span>'
    +'<span class="mvcs-sub">Un nom qui n\u2019existe pas encore</span></span></button></div>';
  box.innerHTML=h;
  var hid=document.getElementById('vrec-cuvee');
  var sc=_vcuvSel.id?_vendCuvById(_vcuvSel.id):null;
  if(hid) hid.value=sc?sc.nom:'';
  _vendCuvAtt(caisses);
}
/* ★ VOL-1 — ce qui est deja dans la cuve (§152b). */
function _vendDedansTxt(cv, exclId){
  var v=_vendVolContenu(cv, exclId);
  if(!(v.hl>0)) return 'rien dedans pour l\u2019instant';
  return (v.src==='mesure'?'':'environ ')+_vendCuvF1(v.hl)+' hL dedans';
}
// Panneau de rattachement : compléter une cuve existante ou en créer une de plus
function _vendCuvAtt(caisses){
  var z=document.getElementById('vrec-cuv-att'); if(!z) return;
  z.innerHTML='';
  if(_vcuvSel.mode!=='pick'||!_vcuvSel.id) return;
  var st=_vendCuvStats(_vcuvSel.id); _vcuvIdx.cuves=st.cuves;
  if(!st.cuves.length) return;
  if(caisses==null) caisses=parseInt((document.getElementById('vrec-caisses')||{}).value)||0;
  // ⚠️ Ici la récolte n'est pas encore enregistrée : les kilos viennent de la
  //   répartition en cours de saisie, qui porte déjà son poids par ligne. Le
  //   repli sur le réglage ne sert qu'au tout premier instant, avant qu'une
  //   seule caisse soit tapée — et il est alors sans conséquence.
  var _rp=(typeof _vendRepParts==='function')?_vendRepParts():[];
  var _rkg=_rp.reduce(function(s,x){ return s+_vpKg(x); },0);
  var add=_vendHlKg(_rkg>0?_rkg:((caisses||0)*(_vendCfg().poids_caisse_kg||25)));
  var idx=_vcuvSel.cuveIdx; if(idx>=st.cuves.length) idx=st.cuves.length-1;
  var h='<div class="mvcs-att"><div class="mvcs-att-h"><span>'+_mvIcon('fiole',16)+'</span><span>Cette cuv\u00e9e a d\u00e9j\u00e0 '
    +(st.cuves.length>1?'des cuves':'une cuve')+'</span></div><div class="mvcs-att-b">';
  var _ridA=((document.getElementById('vrec-id')||{}).value||'');   // la recolte qu'on corrige ne compte pas deux fois
  st.cuves.forEach(function(cv,i){
    var on=idx===i;
    h+='<label class="mvcs-opt'+(on?' on':'')+'"><input type="radio" name="vrec-att" '+(on?'checked':'')+' onchange="_vendCuvSetCuve('+i+')">'
      +'<span><span class="mvcs-opt-t">Compl\u00e9ter \u00ab\u00a0'+_escHtml(cv.nom||'cuve')+'\u00a0\u00bb</span>'
      +'<span class="mvcs-opt-s">'+_vendDedansTxt(cv,_ridA)
      +(cv.statut?' \u00b7 '+_escHtml(String(cv.statut).toUpperCase()):'')+'</span></span></label>';
  });
  var onNew=idx<0;
  h+='<label class="mvcs-opt'+(onNew?' on':'')+'"><input type="radio" name="vrec-att" '+(onNew?'checked':'')+' onchange="_vendCuvSetCuve(-1)">'
    +'<span><span class="mvcs-opt-t">Cr\u00e9er une '+(st.cuves.length+1)+'\u1d49 cuve pour cette cuv\u00e9e</span>'
    +'<span class="mvcs-opt-s">M\u00eame cuv\u00e9e, cuve s\u00e9par\u00e9e \u2014 le nom reste unique</span></span></label>';
  if(idx>=0){
    var cv=st.cuves[idx];
    /* ★★★ RDT-3 — CE CHAMP EST UNE CONTENANCE, PAS UN CUMUL. L'ancien panneau
       proposait `contenance + estime` et saveVendRec l'ecrivait sans condition :
       rouvrir une recolte pour corriger une faute de frappe ajoutait une seconde
       fois son volume, et le prorata repartissait l'erreur sur toutes les
       parcelles de la cuve. Ce qui est deja dedans se RECALCULE depuis les
       recoltes a chaque affichage — rien ne s'accumule, donc rien ne double. */
    var _rid=((document.getElementById('vrec-id')||{}).value||'');
    var deja=_vendHlKg(_vendCuvKgDom(cv.id,_rid));
    var cap=Math.round((parseFloat(cv.volume_hl)||0)*10)/10;
    if(_vcuvSel.vol==null) _vcuvSel.vol=cap;
    var apres=deja+add;
    h+='<div class="mvcs-vol"><label for="vrec-cuv-vol">Contenance de la cuve</label>'
      +'<input id="vrec-cuv-vol" type="number" step="0.1" min="0" value="'+(_vcuvSel.vol)+'" onchange="_vendCuvVol(this.value)">'
      +'<span>hL</span></div>'
      +'<div class="mvcs-hint">D\u00e9j\u00e0 dedans : <b>'+_vendCuvF1(deja)+' hL</b> estim\u00e9s. Avec cet apport : <b>'
      +_vendCuvF1(apres)+' hL</b>'+(cap>0?(' sur '+_vendCuvF1(cap)+' hL de contenance ('+Math.round(apres/cap*100)+'\u00a0%)'):'')
      +(cap>0&&apres>cap?' \u2014 <b>cet apport d\u00e9passe la contenance.</b>':'')
      +' Le rendement, lui, se lira au d\u00e9cuvage, sur le volume r\u00e9ellement log\u00e9.</div>';
  }
  h+='</div></div>';
  z.innerHTML=h;
}
function _vendCuvPick(i){
  var c=_vcuvIdx.cur[i]; if(!c) return;
  _vcuvSel.mode='pick'; _vcuvSel.id=c.id; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null; _vcuvSel.volTouched=false;
  _vendCuvRender();
}
function _vendCuvReuse(i){
  var c=_vcuvIdx.old[i]; if(!c) return;
  _vcuvSel.mode='new'; _vcuvSel.id=null; _vcuvSel.nom=c.nom; _vcuvSel.force=false;
  _vcuvSel.dup=_vendCuvNear(c.nom,_vendCuvMill());
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvNew(){
  _vcuvSel.mode='new'; _vcuvSel.id=null; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvCancel(){
  _vcuvSel.mode='pick'; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vendCuvRender();
}
function _vendCuvInput(v){
  _vcuvSel.nom=v; _vcuvSel.force=false;
  var was=_vcuvSel.dup?_vcuvSel.dup.cuvee.id+'/'+_vcuvSel.dup.d:'';
  _vcuvSel.dup=_vendCuvNear(v,_vendCuvMill());
  var now=_vcuvSel.dup?_vcuvSel.dup.cuvee.id+'/'+_vcuvSel.dup.d:'';
  var btn=document.getElementById('vrec-cuv-new');
  if(was===now){
    var b=document.querySelector('#vrec-cuv-box .mvcs-b.p');
    if(b) b.disabled=(!v.trim()||(_vcuvSel.dup&&!_vcuvSel.force));
    return;                       // pas de re-render : la saisie n’est jamais interrompue
  }
  var pos=btn?btn.selectionStart:null;
  _vendCuvRender();
  var n=document.getElementById('vrec-cuv-new');
  if(n&&pos!=null){ try{n.setSelectionRange(pos,pos);}catch(e){ if(window._mvAvale) window._mvAvale(e,'cave.js/_vendCuvInput'); } }
}
function _vendCuvForce(){ _vcuvSel.force=true; _vendCuvRender(); }
function _vendCuvJoinDup(){
  if(!_vcuvSel.dup) return;
  var id=_vcuvSel.dup.cuvee.id;
  _vcuvSel.mode='pick'; _vcuvSel.id=id; _vcuvSel.nom=''; _vcuvSel.dup=null; _vcuvSel.force=false;
  _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  _vendCuvRender();
}
function _vendCuvKeep(){
  var nom=(_vcuvSel.nom||'').trim(); if(!nom) return;
  _vcuvSel.mode='pick'; _vcuvSel.id=null; _vcuvSel.nom=nom; _vcuvSel.cuveIdx=0; _vcuvSel.vol=null;
  var box=document.getElementById('vrec-cuv-box');
  if(box){
    box.innerHTML='<div class="mvcs-list"><button type="button" class="mvcs-row on" onclick="_vendCuvNew()">'
      +'<span class="mvcs-ico">'+_mvIcon('cuve',18)+'</span><span class="mvcs-mid">'
      +'<span class="mvcs-nom">'+_escHtml(nom)+'</span>'
      +'<span class="mvcs-sub">Nouvelle cuv\u00e9e \u2014 cr\u00e9\u00e9e \u00e0 l\u2019enregistrement</span></span>'
      +'<span class="mvcs-tag wait">nouvelle</span></button></div>';
  }
  var hid=document.getElementById('vrec-cuvee'); if(hid) hid.value=nom;
  _vendCuvAtt();
}
function _vendCuvSetCuve(i){ _vcuvSel.cuveIdx=i; _vcuvSel.vol=null; _vcuvSel.volTouched=false; _vendCuvAtt(); }
function _vendCuvVol(v){
  var n=parseFloat(String(v).replace(',','.'));
  if(isFinite(n)&&n>=0){ _vcuvSel.vol=n; _vcuvSel.volTouched=true; }
}

function _vendInjectDestFields(rec){
  _vendCuvInjectCss();
  var anchor=document.getElementById('vrec-vinif-section');
  if(anchor&&anchor.parentNode){
    var crow=document.getElementById('vrec-cuvee-row');
    if(!crow){
      crow=document.createElement('div'); crow.id='vrec-cuvee-row'; crow.style.marginBottom='12px';
      crow.innerHTML='<div class="fl" style="margin-top:0">Cuv\u00e9e de destination</div>'
        +'<div id="vrec-cuv-box"></div><div id="vrec-cuv-att"></div>'
        +'<input type="hidden" id="vrec-cuvee">';
      anchor.parentNode.insertBefore(crow,anchor);
    }
  }
  _vendCuvSync();
  var mill=_vendMillOfDate(rec?rec.date:((document.getElementById('vrec-date')||{}).value||''));
  var cur=rec&&rec.vcuvee_id?_vendCuvById(rec.vcuvee_id):null;
  if(!cur&&rec&&(rec.cuvee||'').trim()){
    var k=_cuvKey(rec.cuvee);
    cur=_vendCuvList(mill).find(function(c){return _cuvKey(c.nom)===k;})||null;
  }
  _vcuvSel={mode:'pick',id:cur?cur.id:null,nom:cur?'':((rec&&rec.cuvee)||''),dup:null,force:false,cuveIdx:0,vol:null,volTouched:false};
  if(!cur&&_vcuvSel.nom.trim()) _vcuvSel.mode='pick';
  if(rec&&rec.cuve_id&&cur){
    var st=_vendCuvStats(cur.id);
    var ix=st.cuves.findIndex(function(c){return c.id===rec.cuve_id;});
    _vcuvSel.cuveIdx=ix===-1?-1:ix;
  }
  if(!_vrecDateHooked){
    var de=document.getElementById('vrec-date');
    if(de){ de.addEventListener('change',function(){ _vcuvSel.id=null; _vcuvSel.vol=null; _vendCuvRender(); }); _vrecDateHooked=true; }
  }
  _vendCuvRender();
  if(_vcuvSel.nom.trim()&&!_vcuvSel.id) _vendCuvKeep();
  _vendInjectClientField(rec?(rec.client||''):'');
  _vendSyncDest();
}
function _vendSyncDest(){
  var crow=document.getElementById('vrec-cuvee-row');
  var clrow=document.getElementById('vrec-client-row');
  // La cuvee ne concerne que la part domaine : elle disparait quand tout part
  // chez des clients. Le select client d'avant VD-1 ne sert plus a rien : la
  // repartition le remplace. Il reste dans le DOM, masque, pour ne pas casser
  // le code qui le lit encore.
  if(crow) crow.style.display=_vendVendu?'none':'block';
  if(clrow) clrow.style.display='none';
  var vs=document.getElementById('vrec-vinif-section');
  if(vs){ vs.style.opacity=_vendVendu?'0.35':'1'; vs.style.pointerEvents=_vendVendu?'none':''; }
}

// —— Récoltes vinifiées disponibles (non affectées à une cuve), agrégées par cuvée ——
function _vendRecoltesDispo(){
  _vendCuvSync();
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return _recHasDom(r) && (r.cuvee||'').trim() && !r.cuve_id;});
  var by={},ord=[];
  recs.forEach(function(r){
    var c=r.vcuvee_id?_vendCuvById(r.vcuvee_id):null;
    var k=c?c.id:('nom:'+_cuvKey(r.cuvee)+'|'+_vendMillOfDate(r.date));
    if(!by[k]){ by[k]={id:c?c.id:null,cuvee:c?c.nom:(r.cuvee||'').trim(),millesime:c?c.millesime:_vendMillOfDate(r.date),
                       ids:[],caisses:0,kg:0,parcelles:[],erasflage:r.erasflage||'total'}; ord.push(k); }
    by[k].ids.push(r.id); by[k].caisses+=_recCsDom(r); by[k].kg+=_recKgDom(r);
    var pn=(r.parcelle||'').trim(); if(pn&&by[k].parcelles.indexOf(pn)===-1) by[k].parcelles.push(pn);
  });
  return ord.map(function(k){return by[k];});
}

// —— Sélecteur « depuis une récolte » (nouvelle cuve seulement) ——
var _vcuvFromGrp=null;
var _vcuvFromList=[];
function _vendInjectCuveFrom(isNew){
  var existing=document.getElementById('vcuv-from-row');
  if(existing&&existing.parentNode) existing.parentNode.removeChild(existing);
  _vcuvFromGrp=null; _vcuvFromList=[];
  if(!isNew) return;
  var dispo=_vendRecoltesDispo();
  if(!dispo.length) return;
  _vcuvFromList=dispo;
  var nomEl=document.getElementById('vcuv-nom'); if(!nomEl) return;
  var host=nomEl.closest('div')||nomEl;
  var row=document.createElement('div'); row.id='vcuv-from-row'; row.style.marginBottom='14px';
  row.innerHTML='<div class="fl" style="margin-top:0">'+_mvIcon('raisin',16)+' Depuis une r\u00e9colte enregistr\u00e9e</div>'
    +'<select id="vcuv-from" class="fi" style="width:100%" onchange="_vendCuveFromRecolte(this.value)">'
    +'<option value="">\u2014 Saisie manuelle \u2014</option>'
    +dispo.map(function(d,i){return '<option value="'+i+'">'+_escHtml(d.cuvee)+' \u00b7 '+d.caisses+' caisses'+(d.parcelles.length?' \u00b7 '+d.parcelles.length+' parcelle'+(d.parcelles.length>1?'s':''):'')+'</option>';}).join('')
    +'</select>'
    +'<div style="font-size:var(--pt-lbl,10.5px);color:var(--texte-doux);margin-top:5px">Reprend le nom, les parcelles et le volume estim\u00e9 automatiquement.</div>';
  host.parentNode.insertBefore(row,host);
}
function _vendCuveFromRecolte(idx){
  var i=parseInt(idx,10);
  _vcuvFromGrp=(idx===''||isNaN(i))?null:(_vcuvFromList[i]||null);
  var d=_vcuvFromGrp; if(!d) return;
  var el=document.getElementById('vcuv-nom'); if(el) el.value=d.cuvee;
  el=document.getElementById('vcuv-parcelles'); if(el) el.value=d.parcelles.join(', ');
  /* ★ RDT-3 — la contenance ne se deduit PAS des kilos rentres. Elle vient du
     parc a cuves (_vcuvPick) ou de la main. Pre-remplir ce champ avec un volume
     de vin estime melangeait les deux sens du meme nombre. */
  el=document.getElementById('vcuv-erasflage'); if(el&&['total','partiel','entiere'].indexOf(d.erasflage)!==-1) el.value=d.erasflage;
}

// —— Export PDF des récoltes (cuvier + vrac) ——
/* ★★★ TROIS DEFAUTS CORRIGES ICI (lot TRI-1), tous de la meme famille : un
   chiffre juste, pose sur le mauvais perimetre.
   1. LE MILLESIME. Le document prenait `CAVE_VENDANGE.recoltes` EN ENTIER et se
      titrait avec l'annee courante. Des la vendange suivante, une feuille
      intitulee « Recoltes 2027 » aurait liste 2026. Le millesime se DEMANDE.
   2. LE RENDEMENT D'UN APPORT N'EXISTE PAS. La colonne divisait les kilos d'UNE
      BENNE par la surface de TOUTE la parcelle. Trois bennes sur La Justice
      affichaient trois tiers de rendement, chacun presente comme un rendement.
   3. LES DEUX DESTINATIONS. Une parcelle qui part au cuvier ET en vrac a UN
      rendement, pas deux : il se calcule sur la somme de ses kilos du
      millesime. Section par section, chaque moitie aurait ete annoncee comme
      le rendement de la parcelle.
   ⚠️ Le rendement appartient a la PARCELLE et au MILLESIME. `_vendRecRdt` est
   le seul endroit qui le calcule ici, et il lit TOUJOURS toutes les recoltes du
   millesime — jamais la liste de la section en cours de rendu. */

/* Le millesime d'une recolte. Meme regle que partout : la date fait foi. */
function _vendRecMil(r){ return String(_vendMillOfDate(r&&r.date)); }

/* Les millesimes qui ont au moins une recolte, du plus recent au plus ancien. */
function _vendRecAnnees(){
  var s={};
  (CAVE_VENDANGE.recoltes||[]).forEach(function(r){ s[_vendRecMil(r)]=1; });
  return Object.keys(s).sort().reverse();
}

/* Le rendement d'une parcelle sur un millesime, en kg/ha. TOUS ses kilos,
   cuvier et vrac reunis, sur sa surface. 0 quand la surface est inconnue :
   un rendement sans denominateur n'est pas un petit rendement. */
function _vendRecRdt(nom, mil){
  var surf=_vendParcSurf(nom); if(!(surf>0)) return 0;
  var kg=(CAVE_VENDANGE.recoltes||[]).reduce(function(s,r){
    return s+((r.parcelle===nom && _vendRecMil(r)===String(mil)) ? _recKg(r) : 0);
  },0);
  return kg/surf;
}

/* Les cles de tri offertes. `grp` borne une cle a un groupement : trier des
   LIGNES par date n'a plus de sens quand une ligne agrege plusieurs journees. */
var MV_TRI_RECOLTES = [
  { v:'saisie',  lbl:'Ordre de saisie', a:'du premier au dernier', z:'du dernier au premier', grp:['apport'] },
  { v:'nom',     lbl:'Parcelle',        a:'A \u2192 Z',            z:'Z \u2192 A' },
  { v:'surface', lbl:'Surface',         a:'la plus petite d\u2019abord', z:'la plus grande d\u2019abord' },
  { v:'rdt',     lbl:'Rendement',       a:'le plus faible d\u2019abord', z:'le plus fort d\u2019abord' },
  { v:'kg',      lbl:'Kilos rentr\u00e9s', a:'les moins lourds d\u2019abord', z:'les plus lourds d\u2019abord', grp:['apport'] },
  { v:'date',    lbl:'Date',            a:'la plus ancienne d\u2019abord', z:'la plus r\u00e9cente d\u2019abord', grp:['apport'] }
];

/* Trier des APPORTS. ⚠️ Une cle de PARCELLE (nom, surface, rendement) range les
   parcelles, PAS les bennes : a l'interieur d'une parcelle, les apports gardent
   l'ordre du calendrier. Deux bennes de la meme parcelle ne se comparent pas
   sur un nom ou une surface — elles porteraient la meme valeur, et l'ordre
   final dependrait de la stabilite du tri du navigateur. */
function _vendRecTriApports(list, c){
  var sg=(c.sens==='desc')?-1:1, mil=String(c.an);
  var rang={}; (CAVE_VENDANGE.recoltes||[]).forEach(function(r,i){ rang[r.id]=i; });
  var parc=(c.cle==='nom'||c.cle==='surface'||c.cle==='rdt');
  var val=function(r){
    if(c.cle==='surface') return _vendParcSurf(r.parcelle);
    if(c.cle==='rdt')     return _vendRecRdt(r.parcelle, mil);
    if(c.cle==='kg')      return _recKg(r);
    if(c.cle==='date')    return String(r.date||'');
    return rang[r.id]!=null?rang[r.id]:0;
  };
  return list.slice().sort(function(x,y){
    if(parc){
      if((x.parcelle||'')!==(y.parcelle||'')){
        var d=(c.cle==='nom') ? String(x.parcelle||'').localeCompare(String(y.parcelle||''),'fr')
                              : (val(x)-val(y));
        if(d) return sg*d;
        return String(x.parcelle||'').localeCompare(String(y.parcelle||''),'fr');
      }
      return String(x.date||'').localeCompare(String(y.date||''));
    }
    var a=val(x), b=val(y);
    var e=(typeof a==='string')?a.localeCompare(b,'fr'):(a-b);
    if(e) return sg*e;
    return (rang[x.id]||0)-(rang[y.id]||0);
  });
}

/* Regrouper par parcelle. L'etat moyen est PONDERE PAR LES KILOS : une benne de
   30 kg ne pese pas autant qu'une de 2 000 dans l'etat sanitaire d'une parcelle. */
function _vendRecGrouper(list, c){
  var m={}, ord=[];
  list.forEach(function(r){
    var k=r.parcelle||'\u2014';
    if(!m[k]){ m[k]={nom:k,n:0,cs:0,kg:0,d0:r.date,d1:r.date,dest:[],er:{},etat:0}; ord.push(k); }
    var g=m[k], kg=_recKg(r);
    g.n++; g.cs+=(r.nb_caisses||0); g.kg+=kg; g.etat+=(r.etat_pct||0)*kg;
    g.er[r.erasflage||'total']=1;
    if(String(r.date||'')<String(g.d0||'')) g.d0=r.date;
    if(String(r.date||'')>String(g.d1||'')) g.d1=r.date;
    var d=(r.vendu?(r.client||'Vrac g\u00e9n\u00e9rique'):(r.cuvee||'\u2014'));
    if(g.dest.indexOf(d)===-1) g.dest.push(d);
  });
  var sg=(c.sens==='desc')?-1:1, mil=String(c.an);
  var arr=ord.map(function(k){return m[k];});
  arr.sort(function(x,y){
    var d;
    if(c.cle==='nom')          d=x.nom.localeCompare(y.nom,'fr');
    else if(c.cle==='surface') d=_vendParcSurf(x.nom)-_vendParcSurf(y.nom);
    else if(c.cle==='rdt')     d=_vendRecRdt(x.nom,mil)-_vendRecRdt(y.nom,mil);
    else if(c.cle==='kg')      d=x.kg-y.kg;
    else                       d=String(x.d0||'').localeCompare(String(y.d0||''));
    if(d) return sg*d;
    return x.nom.localeCompare(y.nom,'fr');
  });
  return arr;
}

/* L'entree du catalogue : on demande le millesime et l'ordre, puis on edite. */
window.exportVendRecoltesPdf = function(){
  var ans=_vendRecAnnees();
  if(!ans.length){ showToast('Aucune r\u00e9colte \u00e0 exporter','#B85A1A'); return; }
  var opts={
    titre:'R\u00e9coltes de la vendange', icone:'raisin', memo:'recoltes',
    sub:'Le millesime, puis l\u2019ordre des lignes. Le document \u00e9crit cet ordre dans son en-t\u00eate.',
    annees:ans, anLbl:'Mill\u00e9sime',
    groupes:[{v:'apport',lbl:'Apport'},{v:'parcelle',lbl:'Parcelle'}],
    grpLbl:'Une ligne par', grpHint:'ce que compte une ligne du tableau',
    cles:MV_TRI_RECOLTES, defaut:{cle:'nom',sens:'asc',groupe:'apport'},
    btn:'\u00c9diter le document',
    compte:function(c){
      var l=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return _vendRecMil(r)===String(c.an);});
      var n=(c.groupe==='parcelle') ? Object.keys(l.reduce(function(o,r){o[r.parcelle||'\u2014']=1;return o;},{})).length : l.length;
      return n+' ligne'+(n>1?'s':'');
    },
    note:function(c){
      if(c.groupe==='parcelle')
        return 'Les apports du mill\u00e9sime sont additionn\u00e9s, la p\u00e9riode va de la premi\u00e8re benne '
             + '\u00e0 la derni\u00e8re. C\u2019est la vue qui r\u00e9pond \u00e0 \u00ab combien a fait cette parcelle \u00bb.';
      if(c.cle==='nom'||c.cle==='surface'||c.cle==='rdt')
        return 'Le tri range les <b>parcelles</b>\u00a0; \u00e0 l\u2019int\u00e9rieur de chacune, les apports gardent '
             + 'l\u2019ordre du calendrier.';
      return 'Le tri range les <b>lignes</b> une \u00e0 une\u00a0: deux bennes d\u2019une m\u00eame parcelle peuvent '
           + 'se retrouver \u00e9loign\u00e9es dans le tableau.';
    },
    cb:function(c){ _vendRecoltesDoc(c); }
  };
  // Repli : si la feuille de tri manque (fichier en retard chez un client), le
  // document sort quand meme, sur le millesime le plus recent et dans l'ordre
  // de saisie — l'ordre d'avant ce lot. Un document est plus utile qu'un toast.
  if(typeof window._mvTriOuvrir!=='function' || !window._mvTriOuvrir(opts)){
    _vendRecoltesDoc({an:ans[0],cle:'saisie',sens:'asc',groupe:'apport'});
  }
};

function _vendRecoltesDoc(c){
  c=c||{}; var mil=String(c.an||_vendRecAnnees()[0]||new Date().getFullYear());
  if(!c.cle) c.cle='saisie'; if(!c.sens) c.sens='asc'; if(!c.groupe) c.groupe='apport';
  var recs=(CAVE_VENDANGE.recoltes||[]).filter(function(r){return _vendRecMil(r)===mil;});
  if(!recs.length){ showToast('Aucune r\u00e9colte sur '+mil,'#B85A1A'); return; }
  var domNom=window.DOMAINE_NOM||'Ma Vigne';
  var now=new Date().toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});
  var erLbl={total:'\u00c9rafl\u00e9e',partiel:'Partielle',entiere:'Vendange enti\u00e8re'};
  var grp=(c.groupe==='parcelle');
  var nf=function(n){ return Math.round(n).toLocaleString('fr-FR'); };
  var rdtTxt=function(nom){ var v=_vendRecRdt(nom,mil); return v>0?nf(v)+' kg/ha':'\u2014'; };
  // Combien d'apports cette parcelle a-t-elle sur le millesime ? Au-dela d'un
  // seul, la valeur affichee n'est pas celle de la ligne : elle est marquee.
  var nApp={}; recs.forEach(function(r){ var k=r.parcelle||'\u2014'; nApp[k]=(nApp[k]||0)+1; });
  var partout={}; recs.forEach(function(r){ var k=r.parcelle||'\u2014';
    if(!partout[k]) partout[k]={c:0,v:0}; partout[k][r.vendu?'v':'c']++; });
  var marque=function(nom){
    var p=partout[nom]||{c:0,v:0};
    if(p.c&&p.v)        return '<span class="rq">toute la parcelle</span>';
    if((nApp[nom]||0)>1) return '<span class="rq">parcelle</span>';
    return '';
  };

  function ligneApport(r,vrac){
    var kg=_recKg(r), nom=r.parcelle||'\u2014';
    var dest=vrac?(r.client||'Vrac g\u00e9n\u00e9rique'):(r.cuvee||'\u2014');
    return '<tr><td>'+_escHtml(nom)+'</td>'
      +'<td>'+_vendFrDate(r.date)+'</td>'
      +'<td>'+_escHtml(dest)+'</td>'
      +'<td class="n">'+(r.nb_caisses||0)+'</td>'
      +'<td class="n">'+nf(kg)+'</td>'
      +'<td class="n">'+rdtTxt(nom)+marque(nom)+'</td>'
      +'<td class="n">'+(r.etat_pct||0)+'\u202f%</td>'
      +'<td>'+(erLbl[r.erasflage]||'\u2014')+'</td>'
      +(vrac?'':'<td class="n">'+_vendHlRange(kg)+' hL</td>')
      +'</tr>';
  }
  function ligneParcelle(g,vrac){
    var er=Object.keys(g.er);
    return '<tr><td>'+_escHtml(g.nom)+'</td>'
      +'<td class="n">'+(_vendParcSurf(g.nom)>0?_vendParcSurf(g.nom).toFixed(2):'\u2014')+'</td>'
      +'<td>'+(g.d0===g.d1?_vendFrDate(g.d0):_vendFrDate(g.d0)+' \u2192 '+_vendFrDate(g.d1))+'</td>'
      +'<td>'+_escHtml(g.dest.join(' \u00b7 '))+'</td>'
      +'<td class="n">'+g.n+'</td>'
      +'<td class="n">'+g.cs+'</td>'
      +'<td class="n">'+nf(g.kg)+'</td>'
      +'<td class="n">'+rdtTxt(g.nom)+marque(g.nom)+'</td>'
      +'<td class="n">'+(g.kg>0?Math.round(g.etat/g.kg):0)+'\u202f%</td>'
      +'<td>'+(er.length>1?'Mixte':(erLbl[er[0]]||'\u2014'))+'</td>'
      +(vrac?'':'<td class="n">'+_vendHlRange(g.kg)+' hL</td>')
      +'</tr>';
  }

  function section(titre, list, vrac){
    if(!list.length) return '';
    var cs=list.reduce(function(s,r){return s+(r.nb_caisses||0);},0);
    var kg=list.reduce(function(s,r){return s+_recKg(r);},0);
    var cols, corps, nSom, nTete;
    if(grp){
      var gs=_vendRecGrouper(list,c);
      cols=['Parcelle','ha','P\u00e9riode',vrac?'Client(s)':'Cuv\u00e9e(s)','Apports','Caisses','kg','kg/ha','\u00c9tat moy.','\u00c9raflage'].concat(vrac?[]:['hL est.']);
      corps=gs.map(function(g){return ligneParcelle(g,vrac);}).join('');
      nTete=4; nSom='<td class="n">'+list.length+'</td><td class="n">'+cs+'</td><td class="n">'+nf(kg)+'</td>';
      var nP=gs.length;
      var titre2=titre+' \u2014 '+nP+' parcelle'+(nP>1?'s':'');
      return _vendRecTable(titre2,cols,corps,nTete,nSom,3,vrac);
    }
    cols=['Parcelle','Date',vrac?'Client':'Cuv\u00e9e','Caisses','kg','kg/ha parcelle','\u00c9tat','\u00c9raflage'].concat(vrac?[]:['hL est.']);
    corps=_vendRecTriApports(list,c).map(function(r){return ligneApport(r,vrac);}).join('');
    nTete=3; nSom='<td class="n">'+cs+'</td><td class="n">'+nf(kg)+'</td>';
    return _vendRecTable(titre+' \u2014 '+list.length+' apport'+(list.length>1?'s':''),
                         cols,corps,nTete,nSom,2,vrac);
  }
  /* Le pied ne totalise QUE ce qui s'additionne. Un rendement moyen ne se somme
     pas : la case reste vide plutot que fausse. Le colspan de queue se CALCULE
     — un nombre ecrit a la main devient faux au premier ajout de colonne. */
  function _vendRecTable(titre,cols,corps,nTete,nSom,nbSom,vrac){
    var num={'Caisses':1,'kg':1,'kg/ha':1,'kg/ha parcelle':1,'\u00c9tat':1,'\u00c9tat moy.':1,
             'hL est.':1,'ha':1,'Apports':1};
    var th=cols.map(function(x){ return '<th'+(num[x]?' class="n"':'')+'>'+x+'</th>'; }).join('');
    var reste=cols.length-nTete-nbSom;
    return '<h2>'+titre+'</h2>'
      +'<table><thead><tr>'+th+'</tr></thead><tbody>'+corps
      +'<tr class="tot"><td colspan="'+nTete+'">Total</td>'+nSom
      +(reste>0?'<td colspan="'+reste+'"></td>':'')+'</tr>'
      +'</tbody></table>';
  }

  var cuvier=recs.filter(function(r){return !r.vendu;});
  var vrac=recs.filter(function(r){return r.vendu;});
  var tot=function(l){ return {c:l.reduce(function(s,r){return s+(r.nb_caisses||0);},0),
                               k:l.reduce(function(s,r){return s+_recKg(r);},0)}; };
  var tc=tot(cuvier), tv=tot(vrac), ta=tot(recs);
  var parcs=Object.keys(nApp);
  var sansSurf=parcs.filter(function(n){ return !(_vendParcSurf(n)>0); });
  var mixtes=parcs.filter(function(n){ var p=partout[n]; return p&&p.c&&p.v; });

  var note='<div class="rnote"><b>Le rendement porte sur toute la parcelle</b>\u00a0: ses kilos du '
    +'mill\u00e9sime, cuvier et vrac r\u00e9unis, ramen\u00e9s \u00e0 sa surface. Ce n\u2019est jamais le rendement '
    +'d\u2019un apport\u00a0: une benne n\u2019a pas de rendement.'
    +(mixtes.length?' '+mixtes.length+' parcelle'+(mixtes.length>1?'s partent':' part')
      +' \u00e0 la fois au cuvier et en vrac\u00a0: le m\u00eame chiffre appara\u00eet dans les deux sections, '
      +'et non deux moiti\u00e9s.':'')
    +(sansSurf.length?' <b>'+sansSurf.length+' parcelle'+(sansSurf.length>1?'s':'')+' sans surface '
      +'enregistr\u00e9e</b>\u00a0: '+_escHtml(sansSurf.join(', '))+'. Leur rendement ne peut pas \u00eatre '
      +'calcul\u00e9 \u2014 il est laiss\u00e9 vide, pas estim\u00e9.':'')
    +'</div>';

  var css='*{box-sizing:border-box;margin:0;padding:0}'
    +'h1{font-size:var(--pt-md,20px);color:#1A0E05;margin-bottom:3px}'
    +'.kpis{display:flex;gap:22px;flex-wrap:wrap;background:#FAF5EE;border:1px solid #E8D5B0;border-radius:8px;padding:10px 16px;margin-bottom:16px}'
    +'.kpi strong{display:block;font-size:var(--pt-nano,9.5px);text-transform:uppercase;letter-spacing:.5px;color:#8B6020;margin-bottom:2px}'
    +'.kpi{font-size:var(--pt-base,14px);color:#3A2A0E;font-weight:700}'
    +'h2{font-size:var(--pt-base,14px);color:#2D1B09;margin:18px 0 8px}'
    +'table{width:100%;border-collapse:collapse;font-size:var(--pt-txt,12.5px);margin-bottom:6px}'
    +'th{text-align:left;padding:7px 9px;background:#2D1B09;color:#F5E6CC;font-size:var(--pt-lbl,10.5px);text-transform:uppercase;letter-spacing:.5px}'
    +'th.n{text-align:right}'
    +'td{border-bottom:1px solid #EEE;padding:6px 9px}'
    +'td.n{text-align:right;white-space:nowrap}'
    +'tr:nth-child(even) td{background:#FAFAFA}'
    +'tr.tot td{background:#F5F0E8;font-weight:700;border-top:2px solid #C8A060;border-bottom:none}'
    +'.rq{display:inline-block;background:#EFE3C6;color:#6B4A10;font-size:var(--pt-nano,9.5px);'
      +'font-weight:700;padding:1px 5px;border-radius:4px;margin-left:5px;letter-spacing:.2px}'
    +'.rnote{font-size:var(--pt-nano,9.5px);color:#7A7263;line-height:1.55;margin:2px 0 10px}'
    +'';
  if(typeof window._mvDocOpen!=='function'){ showToast('Mise \u00e0 jour incompl\u00e8te \u2014 rechargez l\u2019application','#B85A1A'); return; }
  var corps='<div class="kpis"><div class="kpi"><strong>Caisses</strong>'+ta.c+'</div>'
    +'<div class="kpi"><strong>R\u00e9colt\u00e9</strong>'+(ta.k/1000).toFixed(2)+' t</div>'
    +'<div class="kpi"><strong>Au cuvier</strong>'+(tc.k/1000).toFixed(2)+' t</div>'
    +'<div class="kpi"><strong>En vrac</strong>'+(tv.k/1000).toFixed(2)+' t</div>'
    +'<div class="kpi"><strong>Parcelles</strong>'+parcs.length+'</div></div>'
    +section('Parti au cuvier',cuvier,false)+note+section('Vendu en vrac',vrac,true);
  var ordre=(typeof window._mvTriPhrase==='function')
    ? window._mvTriPhrase({cles:MV_TRI_RECOLTES},c) : '';
  window._mvDocOpen({
    titre:'R\u00e9coltes de la vendange', domaine:domNom, orient:'paysage', cat:'cave',
    metas:['Mill\u00e9sime '+mil,
           recs.length+' apport'+(recs.length>1?'s':'')+' \u00b7 '+parcs.length+' parcelle'+(parcs.length>1?'s':''),
           'Une ligne par '+(grp?'parcelle':'apport'),
           ordre?('Tri\u00e9 par '+ordre):'',
           '\u00c9dit\u00e9 le '+now],
    corps:corps, css:css
  });
}
window._vendRecoltesDoc = _vendRecoltesDoc;
window._vendRecRdt      = _vendRecRdt;
window._vendRecAnnees   = _vendRecAnnees;

window._vendCuveFromRecolte  = _vendCuveFromRecolte;

// ── registre des cuvees de vendange (anti-doublon) ──
window._vendCuvPick     = _vendCuvPick;
window._vendCuvReuse    = _vendCuvReuse;
window._vendCuvNew      = _vendCuvNew;
window._vendCuvCancel   = _vendCuvCancel;
window._vendCuvInput    = _vendCuvInput;
window._vendCuvForce    = _vendCuvForce;
window._vendCuvJoinDup  = _vendCuvJoinDup;
window._vendCuvKeep     = _vendCuvKeep;
window._vendCuvSetCuve  = _vendCuvSetCuve;
window._vendCuvVol      = _vendCuvVol;
window._vendCuvSync     = _vendCuvSync;
window._vendCuvList     = _vendCuvList;
window._vendCuvStats    = _vendCuvStats;
window._vendCuvNear     = _vendCuvNear;

// ═══════════════════════════════════════════════════════════════════════════
// VENDANGE v2.2 — Rendement pluriannuel par climat (cave.js seul)
// kg/ha dénormalisé dans p.rendement_hist[] à la validation d'une récolte.
// Écriture parcelles via saveData('parcelles') (garde anti-perte saison-aware)
// — jamais de write brut. MERGE : seul rendement_hist est touché.
// ═══════════════════════════════════════════════════════════════════════════
function _vendParcByName(nom){
  if(!nom) return null;
  var ps=window.PARCELLES||[]; var k=String(nom).trim().toLowerCase();
  return ps.find(function(x){return x&&String(x.nom||'').trim().toLowerCase()===k;})||null;
}
// ⚠️ UNE CORRECTION EN MASSE NE DOIT PAS FAIRE UNE ÉCRITURE PAR RÉCOLTE.
//   `_vendRecordRendement` enregistre les parcelles à chaque appel : corriger
//   47 récoltes déclencherait 47 transactions sur la collection la plus
//   protégée de l'application. `_vendParcLot` regroupe la rafale.
//   ⚠️⚠️ LA FORME EST UN ENCADREMENT, PAS UN COUPLE OUVRIR/FERMER. Il n'y a
//   pas de « flush » à oublier, et une exception au milieu du lot ne peut pas
//   laisser les écritures de parcelles muettes pour le reste de la session :
//   c'est le `finally` qui rend la main, pas la bonne volonté de l'appelant.
var _vendParcDiff=0, _vendParcSale=false;
function _vendSaveParcelles(){
  if(_vendParcDiff){ _vendParcSale=true; return; }
  var fn=window.saveData||window._saveData;
  if(typeof fn==='function') fn('parcelles');
}
function _vendParcLot(fn){
  _vendParcDiff++;
  try{ fn(); }
  finally{
    _vendParcDiff--;
    if(_vendParcDiff<0) _vendParcDiff=0;
    if(!_vendParcDiff && _vendParcSale){ _vendParcSale=false; _vendSaveParcelles(); }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ★★★ UN PLAFOND DE RENDEMENT N'EST PAS UNE CONSTANTE DE LA PARCELLE.
//   Le rendement annuel autorise est fixe par arrete, campagne par campagne :
//   une parcelle n'a pas UN plafond, elle en a un PAR MILLESIME. `p.rdt_max`
//   etait un scalaire — le poser depuis l'ecran d'un millesime reecrivait
//   TOUS les autres, en silence, sur un ecran qui affichait pourtant une
//   annee en toutes lettres. C'est §81 vu depuis la vigne : un champ qui n'a
//   qu'une valeur ne peut pas porter une histoire.
//
//   `p.rdt_max_hist` = [{mil, max}] — une ligne par millesime, corrigeable
//   ligne a ligne, meme porte que `statut_hist` et que les releves de CUV-1.
//
// ⚠️⚠️ AUCUN RATTRAPAGE INVENTE. L'ancien `p.rdt_max` n'est PAS recopie dans un
//   millesime : on ne sait pas de quelle campagne il vient, et `date_entree`
//   de la parcelle ne le dirait pas davantage. Il devient le REPLI, annonce
//   comme « herite » partout ou il sert, et se corrige millesime par
//   millesime. Un chiffre date d'office se croirait ; un « herite » se corrige.
//
// ⚠️ SOURCE UNIQUE : `_mlRendements` (Le millesime) et la carte du Pilotage
//   lisent tous les deux CETTE fonction, via window. Deux definitions du meme
//   plafond, ce sont deux ecrans qui finiront par ne pas dire la meme chose.
// ═══════════════════════════════════════════════════════════════════════════
/* ── L'APPELLATION : la ou le plafond a un sens ─────────────────────────────
   ★★★ UN ARRETE NE VISE PAS UNE PARCELLE, IL VISE UNE APPELLATION. Poser le
   plafond parcelle par parcelle etait un contournement : 45 saisies pour un
   seul chiffre, et 45 endroits ou il pourra diverger. Les appellations se
   declarent une fois (Reglages > Domaine), portent leur plafond PAR
   MILLESIME, et les parcelles s'y rattachent.
   ⚠️ `CONFIG.appellations` = [{nom, rdt_max_hist:[{mil,max}]}]. Le rattachement
   est `p.appellation`, le NOM — pas un identifiant : il survit a un re-import
   KML en clair, et se relit dans un export sans table de correspondance.
   ⚠️⚠️ La comparaison est NORMALISEE (§80) : « Gevrey-Chambertin » et
   « gevrey-chambertin  » sont la meme appellation. Comparer des noms bruts,
   c'est exactement ce qui faisait disparaitre des parcelles en silence. */
function _vendAocNorm(s){ return String(s==null?'':s).trim().toLowerCase().replace(/\s+/g,' '); }
function _vendAocList(){
  var C=(window.CONFIG&&window.CONFIG.appellations);
  return Array.isArray(C)?C.filter(function(a){ return a&&_vendAocNorm(a.nom); }):[];
}
function _vendAocDe(p){
  var k=_vendAocNorm(p&&p.appellation); if(!k) return null;
  var out=null;
  _vendAocList().forEach(function(a){ if(_vendAocNorm(a.nom)===k) out=a; });
  return out;
}
/* Le plafond d'une appellation pour un millesime. Meme forme que celui d'une
   parcelle : une liste, pas un scalaire — un arrete par campagne. */
function _vendAocMax(a,mil){
  if(!a) return null;
  var k=String(mil), v=null;
  (a.rdt_max_hist||[]).forEach(function(x){ if(x&&String(x.mil)===k) v=parseFloat(x.max); });
  return (isFinite(v)&&v>0)?v:null;
}

/* ★★★ L'ORDRE DE RESOLUTION, ET IL EST DELIBERE :
     1. la parcelle pour CE millesime  -> 'mil'    (l'exception assumee)
     2. son appellation pour CE millesime -> 'aoc' (la regle generale)
     3. l'ancien scalaire sans annee   -> 'herite' (le repli, jamais date)
   ⚠️ La parcelle passe AVANT l'appellation : un plafond pose a la main sur une
   parcelle est une decision explicite de quelqu'un. La faire ecraser par un
   reglage general reviendrait a defaire une saisie sans le dire. */
function _vendRdtMax(p,mil){
  if(!p) return {max:null,src:null,aoc:null};
  var aoc=_vendAocDe(p), nom=aoc?aoc.nom:null;
  var k=String(mil), h=null;
  (p.rdt_max_hist||[]).forEach(function(x){ if(x&&String(x.mil)===k) h=x; });
  if(h){ var v=parseFloat(h.max); if(isFinite(v)&&v>0) return {max:v,src:'mil',aoc:nom}; }
  var a=_vendAocMax(aoc,mil);
  if(a!=null) return {max:a,src:'aoc',aoc:nom};
  var g=parseFloat(p.rdt_max);
  if(isFinite(g)&&g>0) return {max:g,src:'herite',aoc:nom};
  return {max:null,src:null,aoc:nom};
}
// Ecriture d'un plafond pour UN millesime. `val` nul ou <= 0 retire la ligne :
// effacer une valeur fausse doit couter aussi peu que la poser.
// ⚠️ N'ECRIT JAMAIS `p.rdt_max`. L'ancien scalaire est un heritage, pas une
//   case ou ranger du neuf : l'ecraser ferait disparaitre le repli de TOUS les
//   autres millesimes en posant celui-ci.
function _vendSetRdtMax(p,mil,val){
  if(!p||mil==null||mil==='') return false;
  if(!Array.isArray(p.rdt_max_hist)) p.rdt_max_hist=[];
  var k=String(mil), i=-1;
  p.rdt_max_hist.forEach(function(x,n){ if(x&&String(x.mil)===k) i=n; });
  var v=parseFloat(val);
  if(!(isFinite(v)&&v>0)){
    if(i<0) return false;
    p.rdt_max_hist.splice(i,1);
    return true;
  }
  v=Math.round(v*10)/10;
  if(i<0) p.rdt_max_hist.push({mil:k,max:v}); else p.rdt_max_hist[i].max=v;
  return true;
}
// Upsert par recolte_id. Millésime = année civile de la date de récolte.
function _vendRecordRendement(rec, prev){
  try{
    if(!rec||!rec.id) return;
    var moved=false;
    if(prev&&prev.parcelle&&String(prev.parcelle).trim().toLowerCase()!==String(rec.parcelle||'').trim().toLowerCase()){
      var oldP=_vendParcByName(prev.parcelle);
      if(oldP&&Array.isArray(oldP.rendement_hist)){
        var n0=oldP.rendement_hist.length;
        oldP.rendement_hist=oldP.rendement_hist.filter(function(e){return e&&e.recolte_id!==rec.id;});
        if(oldP.rendement_hist.length!==n0) moved=true;
      }
    }
    var p=_vendParcByName(rec.parcelle);
    if(p){
      if(!Array.isArray(p.rendement_hist)) p.rendement_hist=[];
      var surf=parseFloat(p.surface)||0;
      var kg=_recKg(rec);
      var mil=parseInt(String(rec.date||'').slice(0,4),10)||new Date().getFullYear();
      /* ★ VD-3 — kg_ha RESTE rapporte a la parcelle entiere (decision de Nico :
         le domaine travaille toute la vigne meme quand il en vend une part, et
         c'est ce rapport que Pilotage lit pour son prix de revient).
         ⚠️ Ce qui change, c'est que l'entree DIT sur quoi elle est calculee au
         lieu de le laisser deviner au prochain lecteur : `kg_ha_base`. Le
         rendement d'une PORTION vit dans `parts[]`, avec sa propre base. */
      var _sf=_vendSurfParc(rec.parcelle,mil);
      var _vl=0,_ok=0,_ko=0,_ty={},_pro=false;
      _vendParts(rec).forEach(function(pt){
        if(_vpCs(pt)<=0) return;
        var k=_vpKg(pt), v=_vendVolPart(rec,pt);
        if(v.hl!=null){ _vl+=v.hl; _ok+=k; _ty[v.src]=1; if(v.prorata) _pro=true; }
        else _ko+=k;
      });
      var _tys=Object.keys(_ty);
      var entry={recolte_id:rec.id,millesime:mil,kg:kg,caisses:_recCaisses(rec),
        kg_ha:surf>0?Math.round(kg/surf):null, kg_ha_base:'parcelle_entiere',
        surface_parcelle_ha:surf||null,
        surface_attribuee_ha:_sf.attribuee?Math.round(_sf.attribuee*10000)/10000:null,
        vol:{ hl:Math.round(_vl*100)/100,
              hl_ha:(surf>0&&_vl>0)?Math.round(_vl/surf*100)/100:null,
              hl_ha_base:'parcelle_entiere',
              base:_vendRdtBase(), src:_tys.length>1?'mixte':(_tys[0]||'aucune'),
              kg_couverts:Math.round(_ok), kg_manquants:Math.round(_ko),
              complet:_ko<=0&&_ok>0, prorata:_pro },
        parts:_vendParts(rec).filter(function(pt){ return _vpCs(pt)>0; }).map(function(pt){
          var v=_vendVolPart(rec,pt);
          var d=_sf.lignes.find(function(x){ return x.cle===(pt.dom?'\u2014domaine':(pt.client||'\u2014vrac')); });
          var ha=d?d.ha:0;
          return {dest:pt.dom?'domaine':(pt.client||''), kg:Math.round(_vpKg(pt)),
                  caisses:_vpCs(pt), pck:_vpPck(pt),
                  surface_ha:ha?Math.round(ha*10000)/10000:null,
                  surface_src:d?d.src:'aucune',
                  kg_ha:ha>0?Math.round(_vpKg(pt)/ha):null, kg_ha_base:'portion',
                  hl:v.hl!=null?Math.round(v.hl*100)/100:null,
                  hl_ha:(v.hl!=null&&ha>0)?Math.round(v.hl/ha*100)/100:null,
                  vol_src:v.hl!=null?v.src:null};
        }),
        date:rec.date||''};
      var i=p.rendement_hist.findIndex(function(e){return e&&e.recolte_id===rec.id;});
      if(i!==-1) p.rendement_hist[i]=entry; else p.rendement_hist.push(entry);
      _vendSaveParcelles();
    } else if(moved){
      _vendSaveParcelles();
    }
  }catch(e){
    // ⚠️ CUV-6 — CE CATCH ÉTAIT TOTALEMENT MUET. L'intention était bonne (ne
    //   jamais faire échouer l'enregistrement d'une récolte pour un rendement),
    //   le silence ne l'était pas : une correction en masse pouvait laisser
    //   `rendement_hist` périmé sur toute une campagne sans qu'une seule ligne
    //   n'apparaisse nulle part, et le Pilotage aurait lu les vieux kg/ha.
    //   ★ On avale toujours — c'est le contrat — mais on le DIT.
    if(window.logError) window.logError({level:'info',cat:'cuvier',
      msg:'rendement non enregistré pour '+((rec&&rec.id)||'?')+' : '+(e&&e.message||e)});
  }
}
function _vendUnrecordRendement(recId, parcelleNom){
  try{
    if(!recId) return;
    var p=_vendParcByName(parcelleNom);
    if(p&&Array.isArray(p.rendement_hist)){
      var n0=p.rendement_hist.length;
      p.rendement_hist=p.rendement_hist.filter(function(e){return e&&e.recolte_id!==recId;});
      if(p.rendement_hist.length!==n0) _vendSaveParcelles();
    }
  }catch(e){ if(window._mvAvale) window._mvAvale(e,'cave.js/_vendUnrecordRendement'); }
}
// Agrège rendement_hist de toutes les parcelles, groupé climat -> millésime
function _vendRendHistData(){
  var ps=window.PARCELLES||[]; var out=[];
  ps.forEach(function(p){
    var h=Array.isArray(p.rendement_hist)?p.rendement_hist:[];
    if(!h.length) return;
    var surf=parseFloat(p.surface)||0, byM={};
    h.forEach(function(e){
      if(!e) return;
      var m=e.millesime||parseInt(String(e.date||'').slice(0,4),10)||0;
      if(!m) return;
      if(!byM[m]) byM[m]={millesime:m,kg:0,caisses:0};
      byM[m].kg+=(e.kg||0); byM[m].caisses+=(e.caisses||0);
    });
    var years=Object.keys(byM).map(Number).sort(function(a,b){return a-b;});
    if(!years.length) return;
    var rows=years.map(function(m){var o=byM[m]; o.kg_ha=surf>0?Math.round(o.kg/surf):null; return o;});
    out.push({nom:p.nom,surface:surf,rows:rows});
  });
  out.sort(function(a,b){return String(a.nom||'').localeCompare(String(b.nom||''),'fr');});
  return out;
}
function _vendRendInjectCss(){
  if(document.getElementById('mvv-rh-css')) return;
  var s=document.createElement('style'); s.id='mvv-rh-css';
  s.textContent=`
.mvv-rh{margin-top:20px}
.mvv-rh-p{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.10);border-radius:15px;padding:13px 14px;margin-bottom:10px;box-shadow:0 1px 5px rgba(20,17,13,.04)}
.mvv-rh-nm{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:var(--pt-sm,17px);color:var(--texte,#1A1A14);line-height:1.1}
.mvv-rh-sub{font-size:var(--pt-micro,11px);color:var(--texte-doux,#5F5F5F);margin-top:2px}
.mvv-rh-years{margin-top:11px;display:flex;flex-direction:column;gap:7px}
.mvv-rh-row{display:flex;align-items:center;gap:9px}
.mvv-rh-yr{font-size:var(--pt-txt,12.5px);font-weight:600;color:var(--texte-med,#4A4A3A);width:40px;flex-shrink:0}
.mvv-rh-bar{flex:1;height:9px;border-radius:5px;background:var(--gris-clair,#ECE6DA);overflow:hidden}
.mvv-rh-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--terre,#8A5A38),#C2871E)}
.mvv-rh-val{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-base,14px);color:var(--terre,#8A5A38);width:104px;text-align:right;flex-shrink:0}
.mvv-rh-val .u{font-family:inherit;font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);font-weight:400;margin-left:2px}
.mvv-rh-val.na{color:var(--texte-doux,#5F5F5F);font-size:var(--pt-micro,11px);font-family:inherit;font-weight:500}
.mvv-rh-delta{font-size:var(--pt-lbl,10.5px);font-weight:600;width:50px;text-align:right;flex-shrink:0}
.mvv-rh-delta.up{color:var(--vert-med,#3D6B27)}
.mvv-rh-delta.down{color:#B0412C}
.mvv-rh-delta.flat{color:var(--texte-doux,#5F5F5F)}
`;
  document.head.appendChild(s);
}
function _vendRendHistHtml(){
  var data=_vendRendHistData();
  if(!data.length) return '';
  _vendRendInjectCss();
  var html='<div class="mvv-rh"><div class="mvv-seclbl">Rendements par climat · pluriannuel</div>';
  data.forEach(function(d){
    var vals=d.rows.map(function(r){return r.kg_ha||0;});
    var max=Math.max.apply(null,vals.concat([1]));
    var rowsH=d.rows.map(function(r,i){
      var prev=i>0?d.rows[i-1]:null, delta;
      if(prev&&prev.kg_ha&&r.kg_ha){
        var dp=Math.round((r.kg_ha/prev.kg_ha-1)*100);
        var cls=dp>2?'up':dp<-2?'down':'flat';
        delta='<span class="mvv-rh-delta '+cls+'">'+(dp>0?'+':'')+dp+'%</span>';
      } else delta='<span class="mvv-rh-delta flat">—</span>';
      var w=r.kg_ha?Math.max(4,Math.round(r.kg_ha/max*100)):0;
      var valH=r.kg_ha!=null
        ?'<span class="mvv-rh-val">'+r.kg_ha.toLocaleString('fr-FR')+'<span class="u">kg/ha</span></span>'
        :'<span class="mvv-rh-val na">'+(r.kg||0).toLocaleString('fr-FR')+' kg</span>';
      return '<div class="mvv-rh-row"><span class="mvv-rh-yr">'+r.millesime+'</span>'
        +'<span class="mvv-rh-bar"><span class="mvv-rh-fill" style="width:'+w+'%"></span></span>'
        +valH+delta+'</div>';
    }).join('');
    var span=d.rows.length>1?(d.rows[0].millesime+'–'+d.rows[d.rows.length-1].millesime):String(d.rows[0].millesime);
    html+='<div class="mvv-rh-p"><div class="mvv-rh-nm">'+_escHtml(d.nom||'')+'</div>'
      +'<div class="mvv-rh-sub">'+d.rows.length+' millésime'+(d.rows.length>1?'s':'')+' · '+span+(d.surface>0?' · '+_mvF1(d.surface)+' ha':'')+'</div>'
      +'<div class="mvv-rh-years">'+rowsH+'</div></div>';
  });
  return html+'</div>';
}

/* ★ CUV-DEC (§164) — le Chai remet Le Cuvier sur l'onglet Cuves par ici. */
function _vendOngletCuves(){ _vendTab='cuves'; }
function switchVendOng(tab) {
  // L'ancien onglet Reglages du Cuvier est dans la roue crantee (lot CAVE-2) :
  // une cle 'param' encore demandee y atterrit au lieu de viser le vide.
  if(tab==='param'){ _caveOpenReglages(); return; }
  if(['rec','cuves','ana','tour'].indexOf(tab)<0) tab='cuves';
  _vendTab = tab;
  _vendRenderTab();
}

// ═══════════════════════════════════════════════════════════════════════════
// CUV-7 — LA TOURNÉE DU CUVIER
// ═══════════════════════════════════════════════════════════════════════════
// Quinze cuves, un téléphone tenu d'une main, au milieu du cuvier. L'ancien
// geste demandait, PAR CUVE : ouvrir la feuille, saisir, enregistrer, fermer.
// Quinze fois. La tournée met les quinze cuves sur un seul écran et enchaîne
// les champs au clavier — le clavier ne se ferme jamais entre deux cuves.
//
// ⚠ LA TOURNÉE N'INVENTE AUCUNE ENTITÉ. Elle écrit dans `mesures_fa[]` et
//   `operations[]`, exactement comme la feuille par cuve. Un relevé fait à la
//   tournée est un relevé, corrigible depuis « Saisir une mesure » comme les
//   autres.
//
// ⚠⚠ UN RELEVÉ PAR CUVE ET PAR JOUR. La feuille par cuve EMPILE un relevé à
//   chaque enregistrement : en tournée, corriger une faute de frappe aurait
//   posé un deuxième point le même jour dans la courbe. La tournée cherche le
//   relevé du jour et le MET À JOUR ; elle n'en crée un que s'il n'y en a pas.
//
// ⚠⚠ ELLE N'ÉCRIT JAMAIS UN VIDE SUR UNE VALEUR. Un champ laissé vide veut
//   dire « je n'ai pas saisi », pas « efface ». Pour effacer une valeur, on
//   passe par « Saisir une mesure », qui reconstruit le relevé en entier.
//
// ⚠⚠ AUCUN RE-RENDU PENDANT LA SAISIE. Reconstruire la liste à chaque frappe
//   ferait perdre le focus et refermerait le clavier virtuel : c'est le seul
//   défaut qui rendrait l'écran inutilisable sur le terrain. On ne touche que
//   les classes de la ligne et le contenu des compteurs.
var _VT_BUF = {};          // {cuveId:{t:'',d:'',p:0,r:0}} — tampon de la tournée
var _VT_FILT = 'cours';    // cours | reste | tout
var _VT_WHO = [];          // intervenants de la tournée
var _VT_TMR = null;        // minuterie de l'écriture différée
var _VT_OPK = 'chaptalisation';
var _VT_SEL = [];          // cuves retenues pour l'intervention groupée

function _vtJour(){ return _mvToday(); }
function _vtNum(v){
  if(v==null) return null;
  var s=String(v).trim().replace(',','.');
  if(s==='') return null;
  var n=parseFloat(s);
  return isFinite(n)?n:null;
}
/* ★ CUV-9 : une cuve decuvee dont la FA n'est pas finie RESTE dans la
   tournee. C'est meme la ou le releve compte le plus : plus de marc, plus
   de chapeau, rien dans le cuvier ne rappelle qu'il faut aller voir. */
function _vtActives(){
  return (CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){
    return _vendSuivie(c) && !_vendEstFusionnee(c);
  });
}
/* ★ CUV-11 — CE QU'ON PEUT ECRIRE EST PLUS LARGE QUE CE QU'ON RECLAME.
   La tournee (`_vtActives`) ne bouge pas : c'est le tour de cuverie, et une
   cuve declaree finie au decuvage n'a rien a y faire tous les matins. Mais
   le filtre « Tout » montre TOUTES les cuves, et depuis ce lot une cuve
   decuvee y porte ses champs.
   ⚠⚠ Le tampon et l'ecriture couvrent donc le meme ensemble que l'affichage.
     Un champ ou l'on peut taper et que personne n'enregistre est PIRE que
     pas de champ du tout : il rend une saisie faite, et elle est perdue. */
function _vtMesurables(){
  return (CAVE_VENDANGE.cuves_vinif||[]).filter(_vendMesurable);
}
// Le relevé du jour, s'il existe — quel que soit l'écran qui l'a écrit.
function _vtMesJour(c){
  var m=_vendTriMes(c), j=_vtJour();
  for(var i=m.length-1;i>=0;i--) if(m[i]&&m[i].date===j) return m[i];
  return null;
}
// Le tampon part de ce qui est DÉJÀ enregistré aujourd'hui : rouvrir la
// tournée en milieu de matinée doit montrer les cuves déjà faites comme faites.
function _vtLoad(){
  _VT_BUF={};
  _vtMesurables().forEach(function(c){
    var m=_vtMesJour(c);
    _VT_BUF[c.id]={
      t:(m&&m.temp_c!=null)?String(m.temp_c).replace('.',','):'',
      d:(m&&m.densite!=null)?String(m.densite):'',
      p:(m&&m.pigeages)||0,
      r:(m&&m.remontages)||0
    };
    if(m&&m.qui&&m.qui.length&&!_VT_WHO.length) _VT_WHO=m.qui.slice();
  });
  if(!_VT_WHO.length && window.currentUser && window.currentUser.nom) _VT_WHO=[window.currentUser.nom];
  _VT_FILT=_vtFiltDef();
}
function _vtB(id){ if(!_VT_BUF[id]) _VT_BUF[id]={t:'',d:'',p:0,r:0}; return _VT_BUF[id]; }
function _vtFait(id){ var b=_vtB(id); return b.t!=='' && b.d!==''; }
function _vtPart(id){ var b=_vtB(id); return !_vtFait(id) && (b.t!==''||b.d!==''||b.p>0||b.r>0); }
function _vtVisibles(){
  if(_VT_FILT==='tout') return (CAVE_VENDANGE.cuves_vinif||[]).filter(function(c){return !_vendEstFusionnee(c);});
  var a=_vtActives();
  if(_VT_FILT==='reste') return a.filter(function(c){ return !_vtFait(c.id); });
  return a;
}
/* ★★ CUV-11 — LA TOURNEE COMPTE CE QU'ELLE MONTRE. Une seule regle, pour la
   barre de progression comme pour le bilan de fin : l'ensemble AFFICHE et
   relevable. Sous « En cours » et « Reste a faire » c'est exactement
   `_vtActives()` — rien ne change. Sous « Toutes », les decuvees comptent
   aussi, puisque depuis ce lot elles y portent leurs champs : une barre qui
   ignore la moitie des lignes ouvertes ne mesure plus rien, et un bilan qui
   annonce « 0 releve » apres trois densites saisies est un mensonge.
   ⚠ Ce n'est PAS une relance : ce qui RECLAME (badge « a mesurer », agenda,
     alerte de la liste) passe toujours par `_vendSuivie`. */
function _vtBase(){ return _vtVisibles().filter(_vendMesurable); }
/* ★★★ CUV-11 — LA TOURNEE NE S'OUVRE PLUS SUR UNE LISTE VIDE. Quand plus rien
   ne fermente mais qu'il reste des cuves relevables, elle s'ouvre sur
   « Toutes » : c'est la SEULE vue ou elles sont. Decide au chargement, pas a
   chaque rendu — sinon un clic sur « En cours » serait annule aussitot. */
function _vtFiltDef(){
  return (!_vtActives().length && _vtMesurables().length) ? 'tout' : _VT_FILT;
}

// ── L'écran ──────────────────────────────────────────────────────────────
function renderVendTour(){
  var host=document.getElementById('mvv-body'); if(!host) return;
  _vtCss(); _vendEnsureSheetCss();
  if(!Object.keys(_VT_BUF).length) _vtLoad();
  /* ★★★ CUV-11 — L'ECRAN VIDE SE DECIDE SUR CE QU'ON PEUT RELEVER, PAS SUR CE
     QUI FERMENTE. Cette garde rendait « Aucune cuve en fermentation » AVANT de
     regarder le filtre : une fois la derniere cuve decuvee, la tournee etait
     une IMPASSE — pas de liste, donc pas de chip « Toutes », donc aucune porte.
     Le reste du lot avait ouvert la ligne, le champ et l'ecriture ; ils etaient
     inatteignables. Et c'est l'etat NORMAL du cuvier apres la vendange, pas un
     cas limite : toutes les cuves finissent decuvees. */
  if(!_vtMesurables().length){
    host.innerHTML='<div class="vt-vide"><div class="vt-vide-t">Aucune cuve à relever</div>'
      +'<div class="vt-vide-d">La tournée s\'ouvre dès qu\'une cuve passe en macération ou en fermentation, '
      +'et une cuve décuvée y reste relevable : le vin continue de se goûter et de se mesurer. '
      +'Les cuves se créent depuis l\'onglet Cuves.</div>'
      +'<button class="mvv-act2 dec" onclick="switchVendOng(\'cuves\')">Aller aux cuves</button></div>';
    return;
  }
  var canEdit=canWrite();
  var vis=_vtVisibles();
  var h='<div class="vt">'+_vtBandeauHtml()+'<div class="vt-list" id="vt-list">';
  /* Le filtre choisi ne ramene rien, mais il reste des cuves a relever
     ailleurs : on le DIT et on donne le chemin, au lieu d'un blanc. */
  if(!vis.length)
    h+='<div class="vt-vide"><div class="vt-vide-d">Plus rien en fermentation active. '
      +'Les cuves décuvées se relèvent sous «&nbsp;Toutes&nbsp;».</div>'
      +'<button class="mvv-act2 dec" onclick="_vtFilt(\'tout\')">Voir toutes les cuves</button></div>';
  vis.forEach(function(c){ h+=_vtRowHtml(c,canEdit); });
  h+='</div>';
  if(canEdit) h+='<div class="vt-bot">'
    +'<button class="vt-fin" onclick="_vtFin()">Terminer la tournée <small id="vt-fin-n"></small></button>'
    +'<button class="vt-fab" onclick="_vtSheet()" aria-label="Intervention groupée">'+_mvIcon('plus',24)+'</button>'
    +'</div>';
  h+='</div>';
  host.innerHTML=h;
  _vtMaj();
}
function _vtBandeauHtml(){
  var j=new Date();
  var J=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  var M=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  var f=[['cours','En cours'],['reste','Reste à faire'],['tout','Toutes']];
  return '<div class="vt-hd">'
    +'<div class="vt-hd-top">'
    +'<div><div class="vt-t">La tournée</div><div class="vt-d">'+J[j.getDay()]+' '+j.getDate()+' '+M[j.getMonth()]+'</div></div>'
    +'<button class="vt-who" onclick="_vtWho()">'+_escHtml(_VT_WHO.length?_caveIntLabel(_VT_WHO):'Qui ?')+'</button>'
    +'</div>'
    +'<div class="vt-prog"><div class="vt-prog-bar"><div class="vt-prog-f" id="vt-pf"></div></div>'
    +'<div class="vt-prog-n"><span id="vt-pn">0</span><small id="vt-pt">/0</small></div></div>'
    +'<div class="vt-filt">'
    +f.map(function(x){ return '<button class="vt-fb'+(x[0]===_VT_FILT?' on':'')+'" onclick="_vtFilt(\''+_escAttr(x[0])+'\')">'+_escHtml(x[1])+'</button>'; }).join('')
    +'</div></div>'
    +'<div class="vt-leg"><span><b>P</b> pigeage</span><span><b>R</b> remontage</span><span>appui long = −1</span></div>';
}
function _vtRowHtml(c,canEdit){
  /* ★★★ CUV-11 — CETTE LIGNE FERMAIT LA TOURNEE QUE §116 VENAIT D'OUVRIR.
     CUV-9 avait fait entrer les cuves decuvees dont la FA continue dans
     `_vtActives` — « c'est la que le releve compte le plus » — mais leur
     ligne se rendait SANS AUCUN CHAMP, parce que la condition d'edition
     etait restee `_vendIsActive`. Le tag « decuvee » s'affichait au-dessus
     de rien. Verifie au bac sur la fonction reelle avant correction.
     ⚠ C'est bien `_vendMesurable` et non `_vendSuivie` : sous le filtre
       « Tout », une cuve decuvee et declaree finie doit pouvoir etre
       relevee elle aussi, sans pour autant etre reclamee. */
  var b=_vtB(c.id), inact=!_vendMesurable(c);
  var cls=_vtFait(c.id)?'done':(_vtPart(c.id)?'part':'');
  var mj=_vtMesJour(c);
  var h='<div class="vt-cv '+cls+'" id="vt-cv-'+_escAttr(c.id)+'">'
    +'<div class="vt-l1">'
    +(function(){var rp=_vendRepere(c);return rp?'<span class="vt-rep">'+_escHtml(rp)+'</span>':'';})()
    +'<span class="vt-nom">'+_escHtml(c.nom||'Cuve')+'</span>'
    +'<span class="vt-tags" id="vt-tg-'+_escAttr(c.id)+'">'+_vtTags(c)+'</span>'
    +'<span class="vt-chk">'+_mvIcon('check',16)+'</span>'
    +'</div>';
  if(!inact){
    if(canEdit){
      var lt=_vendLastD(c), pt=(mj&&mj.temp_c!=null)?String(mj.temp_c).replace('.',','):((lt&&lt.temp_c!=null)?_vendCuvF1(lt.temp_c):'—');
      var pd=(mj&&mj.densite!=null)?String(mj.densite):((lt&&lt.densite!=null)?String(Math.round(lt.densite)):'—');
      h+='<div class="vt-l2">'
        +'<div class="vt-fld"><span class="u">T °C</span>'
        +'<input id="vt-t-'+_escAttr(c.id)+'" data-vtnav="1" type="text" inputmode="decimal" enterkeyhint="next" '
        +'placeholder="'+_escAttr(pt)+'" value="'+_escAttr(b.t)+'" '
        +'oninput="_vtIn(\''+_escAttr(c.id)+'\')" onkeydown="_vtNav(event,this)" onfocus="this.select()" '
        +'aria-label="Température de '+_escAttr(c.nom||'la cuve')+'"></div>'
        +'<div class="vt-fld"><span class="u">DENSITÉ</span>'
        +'<input id="vt-d-'+_escAttr(c.id)+'" data-vtnav="1" type="text" inputmode="numeric" enterkeyhint="next" '
        +'placeholder="'+_escAttr(pd)+'" value="'+_escAttr(b.d)+'" '
        +'oninput="_vtIn(\''+_escAttr(c.id)+'\')" onkeydown="_vtNav(event,this)" onfocus="this.select()" '
        +'aria-label="Densité de '+_escAttr(c.nom||'la cuve')+'">'
        +'<span class="ec" id="vt-ec-'+_escAttr(c.id)+'"></span></div>'
        +_vtCntHtml(c.id,'p','P')+_vtCntHtml(c.id,'r','R')
        +'</div>';
    } else if(mj){
      h+='<div class="vt-ro">'+(mj.densite!=null?Math.round(mj.densite):'—')+' · '
        +(mj.temp_c!=null?_vendCuvF1(mj.temp_c)+' °C':'—')+'</div>';
    }
  }
  return h+'</div>';
}
function _vtCntHtml(id,k,lbl){
  var v=_vtB(id)[k];
  var a=_escAttr(id);
  return '<button type="button" class="vt-cnt'+(v>0?' has':'')+'" id="vt-'+k+'-'+a+'" '
    +'onpointerdown="_vtDown(event,\''+_escAttr(id)+'\',\''+_escAttr(k)+'\')" onpointerup="_vtUp(event,\''+_escAttr(id)+'\',\''+_escAttr(k)+'\')" '
    +'onpointercancel="_vtCancel()" onpointerleave="_vtCancel()" oncontextmenu="return false" '
    +'aria-label="'+(k==='p'?'Pigeages':'Remontages')+'">'
    +'<span class="k">'+lbl+'</span><span class="v">'+v+'</span></button>';
}
// Les pastilles disent ce qu'un chiffre seul ne dit pas : une cuve à 31 °C doit
// SE VOIR, et une densité qui ne bouge plus est le signal d'un arrêt.
function _vtTags(c){
  var b=_vtB(c.id), o='';
  var lt=_vendLastD(c);
  var t=_vtNum(b.t); if(t==null) t=(lt&&lt.temp_c!=null)?lt.temp_c:null;
  var d=_vtNum(b.d);
  if(c.statut==='mpf') o+='<span class="vt-tag">macération</span>';
  if(_vendDecuvee(c)) o+='<span class="vt-tag">décuvée</span>';
  /* ★ CUV-13 : le jus a peut-etre change de cuve — la ligne le dit. */
  if(_vendPressee(c)) o+='<span class="vt-tag">pressurée</span>';
  if(t!=null&&t>=30) o+='<span class="vt-tag hot">'+_vendCuvF1(t)+' °C</span>';
  if(d!=null){
    /* ★ CUV-10 : un repere, pas un verdict. C'est la degustation qui tranche. */
    if(d<=_vendDSec(c)) o+='<span class="vt-tag fin">sous le repère</span>';
    else if(lt&&lt.densite!=null&&(lt.densite-d)<=1&&_vendSince(lt.date)>=1)
      o+='<span class="vt-tag pal">palier</span>';
  }
  return o;
}

// ── La saisie ────────────────────────────────────────────────────────────
// ⚠ On ne re-rend RIEN ici. Le focus et le clavier virtuel doivent survivre.
function _vtIn(id){
  var b=_vtB(id);
  var et=document.getElementById('vt-t-'+id), ed=document.getElementById('vt-d-'+id);
  b.t=et?et.value:''; b.d=ed?ed.value:'';
  var row=document.getElementById('vt-cv-'+id);
  if(row){ row.classList.toggle('done',_vtFait(id)); row.classList.toggle('part',_vtPart(id)); }
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===id;});
  var tg=document.getElementById('vt-tg-'+id);
  if(tg&&c) tg.innerHTML=_vtTags(c);
  _vtEcart(id); _vtMaj(); _vtPlan();
}
// L'écart depuis le dernier relevé : le seul chiffre qu'on lit vraiment au
// milieu des cuves. Il dit si la fermentation avance, ralentit ou s'arrête.
function _vtEcart(id){
  var el=document.getElementById('vt-ec-'+id); if(!el) return;
  var c=(CAVE_VENDANGE.cuves_vinif||[]).find(function(x){return x.id===id;});
  var last=c?_vendLastD(c):null;
  var v=_vtNum(_vtB(id).d);
  if(!last||last.densite==null||v==null||last.date===_vtJour()){ el.className='ec'; el.textContent=''; return; }
  var w=Math.round(v-last.densite);
  el.textContent=(w>0?'+':'−')+Math.abs(w);
  el.className='ec show '+(w<=-4?'ok':(w>=-1?'lent':''));
}
// Entrée / Suivant : T° cuve 1 → densité cuve 1 → T° cuve 2 … Le clavier ne se
// ferme pas, et le champ visé est ramené au centre pour ne jamais passer dessous.
function _vtNav(ev,el){
  if(ev.key!=='Enter'&&ev.key!=='Tab') return;
  ev.preventDefault();
  var all=[].slice.call(document.querySelectorAll('[data-vtnav]'));
  var i=all.indexOf(el);
  var nx=all[i+(ev.shiftKey?-1:1)];
  if(!nx){ el.blur(); return; }
  nx.focus();
  if(nx.scrollIntoView) nx.scrollIntoView({block:'center',behavior:'smooth'});
}
// ── Les compteurs ────────────────────────────────────────────────────────
// Un appui = +1. Un appui long = −1 : corriger ne doit pas demander un autre
// écran, et il n'y a pas la place pour deux boutons par geste.
var _VT_PTMR=null, _VT_LONG=false;
function _vtDown(ev,id,k){
  if(ev.button&&ev.button!==0) return;
  _VT_LONG=false;
  _VT_PTMR=setTimeout(function(){
    _VT_LONG=true;
    var b=_vtB(id); b[k]=Math.max(0,b[k]-1);
    _vtCntMaj(id,k,true); _vtBuzz(24); _vtPlan();
  },480);
}
function _vtUp(ev,id,k){
  if(ev.preventDefault) ev.preventDefault();
  clearTimeout(_VT_PTMR);
  if(_VT_LONG){ _VT_LONG=false; return; }
  var b=_vtB(id); b[k]=b[k]+1;
  _vtCntMaj(id,k,false); _vtBuzz(8); _vtPlan();
}
function _vtCancel(){ clearTimeout(_VT_PTMR); _VT_LONG=false; }
function _vtCntMaj(id,k,bas){
  var v=_vtB(id)[k];
  var el=document.getElementById('vt-'+k+'-'+id); if(!el) return;
  var n=el.querySelector('.v'); if(n) n.textContent=v;
  el.classList.toggle('has',v>0);
  el.classList.add(bas?'down':'bump');
  setTimeout(function(){ el.classList.remove('down','bump'); },260);
  var row=document.getElementById('vt-cv-'+id);
  if(row){ row.classList.toggle('part',_vtPart(id)); }
}
function _vtBuzz(ms){ if(navigator.vibrate) navigator.vibrate(ms); }
function _vtFilt(k){
  _VT_FILT=k;
  renderVendTour();
}
function _vtMaj(){
  var a=_vtBase(), n=a.filter(function(c){return _vtFait(c.id);}).length;
  var pn=document.getElementById('vt-pn'); if(pn) pn.textContent=n;
  var pt=document.getElementById('vt-pt'); if(pt) pt.textContent='/'+a.length;
  var pf=document.getElementById('vt-pf'); if(pf) pf.style.width=(a.length?Math.round(n/a.length*100):0)+'%';
  var fn=document.getElementById('vt-fin-n');
  if(fn) fn.textContent=(n<a.length)?('· '+(a.length-n)+' restante'+((a.length-n)>1?'s':'')):'· complète';
}
// ── L'écriture ───────────────────────────────────────────────────────────
// ⚠⚠ `_vendFbSave` réécrit TOUT le document `cave_vendange`. Une écriture par
//   frappe, c'est des centaines de documents complets pendant une tournée : on
//   attend 1,2 s après la dernière frappe, et on n'écrit qu'une fois.
function _vtPlan(){
  clearTimeout(_VT_TMR);
  _vtEtat('en cours');
  _VT_TMR=setTimeout(_vtEcrire,1200);
}
function _vtEtat(s){
  var el=document.getElementById('vt-sv');
  if(!el){
    var l=document.getElementById('vt-list'); if(!l) return;
    el=document.createElement('div'); el.id='vt-sv'; el.className='vt-sv';
    l.parentNode.insertBefore(el,l);
  }
  if(s==='en cours'){ el.className='vt-sv show'; el.textContent='Enregistrement…'; }
  else if(s==='ok'){ el.className='vt-sv show ok'; el.textContent='Enregistré';
    clearTimeout(el._h); el._h=setTimeout(function(){ el.className='vt-sv'; },1500); }
  else { el.className='vt-sv show ko'; el.textContent='Non enregistré — la saisie est conservée'; }
}
function _vtEcrire(){
  if(!canWrite()) return;
  var jour=_vtJour(), n=0;
  _vtMesurables().forEach(function(c){
    var b=_VT_BUF[c.id]; if(!b) return;
    var d=_vtNum(b.d), t=_vtNum(b.t);
    if(d==null&&t==null&&!b.p&&!b.r) return;
    var m=_vtMesJour(c);
    if(!m){
      m={id:'vm_'+Date.now()+'_'+String(c.id).slice(-4),date:jour};
      if(!c.mesures_fa) c.mesures_fa=[];
      c.mesures_fa.push(m);
    }
    // ⚠ On IMPOSE seulement ce que la tournée porte. `note`, et tout ce qu'un
    //   autre écran aurait écrit sur ce relevé, survivent.
    if(d!=null) m.densite=d;
    if(t!=null) m.temp_c=t;
    m.pigeages=b.p; m.remontages=b.r;
    if(_VT_WHO.length) m.qui=_VT_WHO.slice();
    m.tour=true;
    _vendTriMes(c);
    n++;
  });
  if(!n){ _vtEtat('ok'); return; }
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  // Message vide : un succès ne dit rien, un échec parle (contrat §68).
  var p=_vendFbSave(null,null);
  if(p&&typeof p.then==='function') p.then(function(r){ _vtEtat((r&&r.ok===true)?'ok':'ko'); });
  else _vtEtat('ok');
  _vendRefreshCockpit();
}
function _vtFin(){
  clearTimeout(_VT_TMR); _vtEcrire();
  /* ★ CUV-11 : le bilan porte sur l'ensemble affiche (`_vtBase`). Sur
     `_vtActives`, une tournee faite entierement sur des cuves decuvees
     annoncait « 0 releve » alors que trois venaient d'etre ecrits. */
  var a=_vtBase();
  var n=a.filter(function(c){return _vtFait(c.id);}).length;
  var pg=0,rm=0;
  a.forEach(function(c){ var b=_vtB(c.id); pg+=b.p; rm+=b.r; });
  var d=[n+' relevé'+(n>1?'s':'')];
  if(pg) d.push(pg+' pigeage'+(pg>1?'s':''));
  if(rm) d.push(rm+' remontage'+(rm>1?'s':''));
  if(n<a.length) d.push((a.length-n)+' cuve'+((a.length-n)>1?'s':'')+' sans relevé');
  showToast(d.join(' · '),n<a.length?'#B85A1A':'#3D6B27');
}
// ── L'intervenant ────────────────────────────────────────────────────────
function _vtWho(){
  var mbrs=(window.MEMBRES||[]).map(function(m){return m.nom;}).filter(Boolean);
  if(!mbrs.length&&window.currentUser&&window.currentUser.nom) mbrs=[window.currentUser.nom];
  if(!mbrs.length){ showToast('Aucun membre enregistré','#B85A1A'); return; }
  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Qui fait la tournée ?</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<div class="mvv-sheet-sub">Le nom est écrit sur chaque relevé de la tournée. Il répond à « qui a pigé ? » trois semaines plus tard.</div>'
    +'<div class="vt-who-list">'
    +mbrs.map(function(nm){
      var sel=_VT_WHO.indexOf(nm)!==-1;
      var col=(window.COULEURS_MBR||{})[nm]||'#7A4F2E';
      var nj=String(nm).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return '<button class="vt-whob'+(sel?' on':'')+'" onclick="_vtWhoTog(\''+_escAttr(nj)+'\')">'
        +'<span class="av" style="background:'+col+'">'+_escHtml(String(nm).charAt(0).toUpperCase())+'</span>'
        +'<span class="nm">'+_escHtml(nm)+'</span>'+(sel?_mvIcon('check',16):'')+'</button>';
    }).join('')
    +'</div><button class="mvv-save" style="margin-top:16px" onclick="_vendSheetClose()">Continuer</button>';
  _vendSheet(h);
}
function _vtWhoTog(nm){
  var i=_VT_WHO.indexOf(nm);
  if(i>=0) _VT_WHO.splice(i,1); else _VT_WHO.push(nm);
  _vtWho();
  var b=document.querySelector('.vt-who');
  if(b) b.textContent=_VT_WHO.length?_caveIntLabel(_VT_WHO):'Qui ?';
}

// ── L'intervention groupée ───────────────────────────────────────────────
// Un sulfitage se fait sur huit cuves d'affilée. Le faire cuve par cuve, c'est
// huit fois le même geste et sept occasions d'en oublier une.
// ⚠⚠ LE VOLUME EST CELUI DE CHAQUE CUVE, jamais un volume commun : une dose
//   juste sur un volume faux donne une quantité fausse, affichée avec l'aplomb
//   d'un calcul (c'est la faute de RDT-1, elle se rejouerait ici à l'identique).
var _VT_OPS=[
  {k:'chaptalisation',l:'Chaptalisation'},
  {k:'so2',l:'SO₂'},
  {k:'levurage',l:'Levurage'},
  {k:'nutriment',l:'Nutriment'},
  {k:'tanins',l:'Tanins'},
  {k:'enzymes',l:'Enzymes'},
  {k:'refroidissement',l:'Refroidir'},
  {k:'delestage',l:'Délestage'}
];
function _vtSheet(){
  if(!_vendGarde()) return;
  var a=_vtActives();
  if(!a.length){ showToast('Aucune cuve en fermentation','#B85A1A'); return; }
  var h='<div class="mvv-sheet-hd"><div class="mvv-sheet-t">Intervention groupée</div>'
    +'<button class="mv-gh mvv-sheet-x" onclick="_vendSheetClose()" aria-label="Fermer">'+_mvIcon('croix',18)+'</button></div>'
    +'<label class="mvv-flbl">Opération</label>'
    +'<div class="vt-ops">'+_VT_OPS.map(function(o){
      return '<button class="vt-op'+(o.k===_VT_OPK?' on':'')+'" onclick="_vtOpSet(\''+_escAttr(o.k)+'\')">'+_escHtml(o.l)+'</button>';
    }).join('')+'</div>'
    +'<label class="mvv-flbl">Cuves <span class="mvv-fhint" id="vt-seln"></span></label>'
    +'<div class="vt-cuves">'
    +'<button class="vt-cb all" id="vt-cb-all" onclick="_vtAll()">Toutes</button>'
    +a.map(function(c){
      var v=_vendIntrVol(c);
      return '<button class="vt-cb'+(_VT_SEL.indexOf(c.id)!==-1?' on':'')+'" id="vt-cb-'+_escAttr(c.id)+'" '
        +'onclick="_vtTog(\''+_escAttr(c.id)+'\')">'+_escHtml(_vendRepere(c)||c.nom||'Cuve')
        +' <span class="hl">'+(v.hl>0?_vendCuvF1(v.hl)+' hL':'\u2014 hL')+'</span></button>';
    }).join('')+'</div>'
    +'<label class="mvv-flbl">Date</label>'
    +'<input id="vt-date" class="mvv-tin" type="date" value="'+_vtJour()+'">'
    +'<div id="vt-fields"></div>'
    +'<div class="mvv-bigcalc"><div class="mvv-bigcalc-n" id="vt-calc-n">—</div>'
    +'<div class="mvv-bigcalc-l" id="vt-calc-l">quantité totale</div></div>'
    +'<button class="mvv-save" id="vt-go" style="margin-top:16px" onclick="_vtValider()">Enregistrer</button>'
    +'<div class="mvv-fnote" style="color:var(--texte-doux,#5F5F5F)">Une opération est écrite dans chaque cuve retenue, avec son propre volume\u00a0: estimé d\u2019après ses caisses, à la règle du Cuvier, mesuré si elle est décuvée — jamais sa contenance. Chacune reste corrigible depuis sa cuve.</div>';
  _vendSheet(h);
  _vtOpSet(_VT_OPK);
}
function _vtOpSet(k){
  _VT_OPK=k;
  var bs=document.querySelectorAll('#mvv-ov .vt-op');
  [].slice.call(bs).forEach(function(b,i){ if(_VT_OPS[i]) b.classList.toggle('on',_VT_OPS[i].k===k); });
  var el=document.getElementById('vt-fields'); if(!el) return;
  var h='';
  if(k==='chaptalisation'){
    var spd=_vendCfg().sucre_par_degre||16.83;
    h='<label class="mvv-flbl">Enrichissement visé <span class="mvv-fhint">· ° d\'alcool · base '+spd+' g/L</span></label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="decimal" value="1" oninput="_vtCalc()">';
  } else if(k==='so2'){
    h='<label class="mvv-flbl">Dose <span class="mvv-fhint">· g/hL</span></label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="decimal" placeholder="0" oninput="_vtCalc()">';
  } else if(k==='levurage'||k==='nutriment'){
    h='<label class="mvv-flbl">'+(k==='levurage'?'Souche':'Produit')+'</label>'
      +'<input id="vt-v2" class="mvv-tin" type="text" placeholder="'+(k==='levurage'?'RC 212…':'DAP, Fermaid…')+'">'
      +'<label class="mvv-flbl">Dose <span class="mvv-fhint">· g/hL</span></label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="decimal" placeholder="0" oninput="_vtCalc()">';
  } else if(_vendEstIntrant(k)){
    var prods=_vendIntrProds();
    h='<label class="mvv-flbl">Produit <span class="mvv-fhint">· La Réserve</span></label>'
      +'<select id="vt-prod" class="mvv-tin" onchange="_vtCalc()"><option value="">— sans produit —</option>'
      +prods.map(function(p){ return '<option value="'+_escAttr(p.id)+'">'+_escHtml(p.nom)+'</option>'; }).join('')
      +'</select>'
      +'<label class="mvv-flbl">Dose <span class="mvv-fhint" id="vt-du">· g/hL</span></label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="decimal" placeholder="0" oninput="_vtCalc()">'
      +(prods.length?'':'<div class="mvv-fnote">Aucun produit œnologique dans La Réserve : l\'opération s\'enregistre, mais ne bougera aucun stock.</div>');
  } else if(k==='refroidissement'){
    h='<label class="mvv-flbl">Température visée <span class="mvv-fhint">· °C</span></label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="decimal" placeholder="0" oninput="_vtCalc()">'
      +'<label class="mvv-flbl">Moyen</label><select id="vt-moy" class="mvv-tin">'
      +_VEND_FROID.map(function(m){ return '<option value="'+m.k+'">'+_escHtml(m.lbl)+'</option>'; }).join('')
      +'</select>';
  } else if(k==='delestage'){
    h='<label class="mvv-flbl">Nombre par cuve</label>'
      +'<input id="vt-v1" class="mvv-tin" type="text" inputmode="numeric" value="1" oninput="_vtCalc()">';
  }
  el.innerHTML=h;
  _vtSelN(); _vtCalc();
}
function _vtTog(id){
  var i=_VT_SEL.indexOf(id);
  if(i>=0) _VT_SEL.splice(i,1); else _VT_SEL.push(id);
  var b=document.getElementById('vt-cb-'+id);
  if(b) b.classList.toggle('on',_VT_SEL.indexOf(id)!==-1);
  var all=document.getElementById('vt-cb-all');
  if(all) all.classList.toggle('on',_VT_SEL.length===_vtActives().length);
  _vtBuzz(6); _vtSelN(); _vtCalc();
}
function _vtAll(){
  var a=_vtActives();
  _VT_SEL=(_VT_SEL.length===a.length)?[]:a.map(function(c){return c.id;});
  a.forEach(function(c){
    var b=document.getElementById('vt-cb-'+c.id);
    if(b) b.classList.toggle('on',_VT_SEL.indexOf(c.id)!==-1);
  });
  var all=document.getElementById('vt-cb-all');
  if(all) all.classList.toggle('on',_VT_SEL.length===a.length);
  _vtBuzz(10); _vtSelN(); _vtCalc();
}
function _vtSelCuves(){
  return _VT_SEL.map(function(id){
    return (CAVE_VENDANGE.cuves_vinif||[]).find(function(c){return c.id===id;});
  }).filter(Boolean);
}
function _vtVolTot(){
  return _vtSelCuves().reduce(function(s,c){ return s+_vendIntrVol(c).hl; },0);
}
function _vtSelN(){
  var el=document.getElementById('vt-seln'); if(!el) return;
  el.textContent=_VT_SEL.length?('· '+_VT_SEL.length+' retenue'+(_VT_SEL.length>1?'s':'')+', '+_vendCuvF1(_vtVolTot())+' hL'):'';
}
function _vtCalc(){
  var n=document.getElementById('vt-calc-n'), l=document.getElementById('vt-calc-l');
  var go=document.getElementById('vt-go');
  var v=_vtNum((document.getElementById('vt-v1')||{}).value);
  var vol=_vtVolTot(), k=_VT_OPK;
  if(go){
    go.disabled=!(_VT_SEL.length&&v!=null&&v>0);
    go.textContent=_VT_SEL.length?('Enregistrer sur '+_VT_SEL.length+' cuve'+(_VT_SEL.length>1?'s':'')):'Choisir au moins une cuve';
  }
  if(_vendEstIntrant(k)){
    var p=_vendIntrProd((document.getElementById('vt-prod')||{}).value);
    var du=document.getElementById('vt-du');
    if(du) du.textContent='· '+_vendIntrUnite(p);
  }
  if(!n||!l) return;
  if(v==null||!vol||k==='refroidissement'||k==='delestage'){
    n.textContent='—';
    l.textContent=_VT_SEL.length?(k==='refroidissement'?'cible posée sur chaque cuve':(k==='delestage'?'délestages par cuve':'quantité totale')):'aucune cuve retenue';
    return;
  }
  if(k==='chaptalisation'){
    var spd=_vendCfg().sucre_par_degre||16.83;
    var kg=spd*v*vol/10;
    n.textContent=_vendCuvF1(kg); l.textContent='kg de sucre · '+_vendCuvF1(vol)+' hL';
  } else {
    var pr=_vendEstIntrant(k)?_vendIntrProd((document.getElementById('vt-prod')||{}).value):null;
    var q=_vendIntrQte(v,vol);
    var tq=_vendIntrQteTxt(q,_vendIntrUniteQ(pr));
    n.textContent=tq.n; l.textContent=tq.u+' · '+_vendCuvF1(vol)+' hL';
  }
}
function _vtValider(){
  if(!_vendGarde()) return;
  var cs=_vtSelCuves(); if(!cs.length) return;
  var v=_vtNum((document.getElementById('vt-v1')||{}).value);
  if(v==null||v<=0){ showToast('Saisissez une valeur','#E07060'); return; }
  var date=(document.getElementById('vt-date')||{}).value||_vtJour();
  var k=_VT_OPK, spd=_vendCfg().sucre_par_degre||16.83;
  var txt=((document.getElementById('vt-v2')||{}).value||'').trim();
  var pid=((document.getElementById('vt-prod')||{}).value)||null;
  var prod=_vendIntrProd(pid);
  var moy=((document.getElementById('vt-moy')||{}).value)||null;
  var note='Tournée'+(_VT_WHO.length?' · '+_caveIntLabel(_VT_WHO):'');
  var base=Date.now(), i=0;
  cs.forEach(function(c){
    var ref=_vendIntrVol(c);
    var op={id:'vop_'+(base+(i++))+'_'+String(c.id).slice(-4),type:k,date:date,note:note,groupe:true};
    if(k==='chaptalisation'){
      /* ★ VOL-1 — plus de chaptalisation sur la contenance ; sans caisse, pas de kilos (§152b). */
      op.volume_hl=ref.hl>0?ref.hl:null; op.vol_src=ref.hl>0?ref.src:null; op.degre=v;
      op.kg_sucre=ref.hl>0?spd*v*ref.hl/10:null;
    } else if(k==='so2'){
      op.dose=v; op.volume_hl=ref.hl>0?ref.hl:null; op.vol_src=ref.hl>0?ref.src:null;
    } else if(k==='levurage'){
      op.souche=txt; op.dose=v;
    } else if(k==='nutriment'){
      op.ntype=txt; op.dose=v;
    } else if(_vendEstIntrant(k)){
      op.prod_id=pid; op.produit=prod?prod.nom:null;
      op.dose=v; op.dose_unit=_vendIntrUnite(prod);
      op.volume_hl=ref.hl; op.vol_src=ref.src;
      op.qte=_vendIntrQte(v,ref.hl); op.qte_unite=_vendIntrUniteQ(prod);
    } else if(k==='refroidissement'){
      op.temp_c=v; op.moyen=moy; op.qte_kg=null;
    } else if(k==='delestage'){
      op.nb=Math.max(1,Math.round(v));
    }
    if(!c.operations) c.operations=[];
    c.operations.push(op);
    _vendTriOps(c);
  });
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  var lbl=(_VT_OPS.find(function(o){return o.k===k;})||{}).l||k;
  _vendFbSave(lbl+' · '+cs.length+' cuve'+(cs.length>1?'s':''),'#3D6B27');
  _VT_SEL=[];
  _vendSheetClose();
  _vendRefreshCockpit();
}

// ── L'habillage ──────────────────────────────────────────────────────────
// Injection idempotente, comme `_vendEnsureSheetCss` : la tournée ne touche
// pas `styles.css`, donc elle ne coûte pas de bump à elle seule.
function _vtCss(){
  if(document.getElementById('vt-css')) return;
  var s=document.createElement('style'); s.id='vt-css';
  s.textContent=[
".vt{padding:0 0 150px}",
".vt-hd{position:sticky;top:0;z-index:40;background:var(--cave,#14110D);color:#F0E2C8;padding:13px 14px 0;border-radius:0 0 16px 16px;box-shadow:0 6px 20px rgba(20,17,13,.16)}",
".vt-hd-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}",
".vt-t{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:var(--pt-lg,23px);line-height:1.05;color:#F5EBD6}",
".vt-d{font-size:var(--pt-micro,11px);color:rgba(240,226,200,.62);margin-top:2px}",
".vt-who{background:rgba(240,226,200,.10);border:1px solid rgba(240,226,200,.22);color:#F0E2C8;border-radius:999px;padding:8px 12px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;min-height:38px;white-space:nowrap;font-family:inherit;max-width:46%;overflow:hidden;text-overflow:ellipsis}",
".vt-prog{display:flex;align-items:center;gap:9px;margin-top:11px}",
".vt-prog-bar{flex:1;height:5px;border-radius:999px;background:rgba(240,226,200,.14);overflow:hidden}",
".vt-prog-f{height:100%;width:0;background:linear-gradient(90deg,var(--or,#C2A14D),#8DC868);border-radius:999px;transition:width .3s cubic-bezier(.4,0,.2,1)}",
".vt-prog-n{font-family:'Cormorant Garamond',serif;font-weight:700;font-size:var(--pt-sm,17px);color:#F5EBD6;min-width:52px;text-align:right}",
".vt-prog-n small{font-size:var(--pt-micro,11px);font-weight:400;color:rgba(240,226,200,.55)}",
".vt-filt{display:flex;gap:6px;padding:11px 0 12px;overflow-x:auto;scrollbar-width:none}",
".vt-filt::-webkit-scrollbar{display:none}",
".vt-fb{background:transparent;border:1px solid rgba(240,226,200,.22);color:rgba(240,226,200,.72);border-radius:10px;padding:7px 11px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;white-space:nowrap;min-height:36px;font-family:inherit}",
".vt-fb.on{background:rgba(240,226,200,.94);border-color:rgba(240,226,200,.94);color:var(--cave,#14110D)}",
".vt-leg{display:flex;justify-content:flex-end;gap:13px;padding:9px 14px 2px;font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);letter-spacing:.3px}",
".vt-leg b{color:var(--texte-med,#4A4A3A);font-weight:700}",
".vt-sv{text-align:center;font-size:var(--pt-micro,11px);font-weight:600;color:var(--texte-doux,#5F5F5F);height:0;overflow:hidden;transition:height .18s}",
".vt-sv.show{height:20px}",
".vt-sv.ok{color:var(--vert-med,#3D6B27)}",
".vt-sv.ko{color:var(--orange,#B85A1A)}",
".vt-list{padding:5px 12px 0;display:flex;flex-direction:column;gap:7px}",
".vt-cv{background:var(--bg-card,#FBFAF6);border:1px solid rgba(138,90,56,.16);border-left:3px solid var(--gris,#DED7C9);border-radius:13px;padding:8px 9px 9px 10px;transition:border-left-color .2s,background .2s}",
".vt-cv.part{border-left-color:var(--or,#C2A14D)}",
".vt-cv.done{border-left-color:var(--vert-med,#3D6B27);background:#F7FAF3}",
".vt-l1{display:flex;align-items:center;gap:8px;min-height:24px}",
".vt-rep{font-family:'Cormorant Garamond',serif;font-weight:700;font-size:var(--pt-base,14px);color:var(--terre-tx,#8A5A38);background:var(--terre-pale,#F3EADF);border-radius:7px;min-width:26px;height:24px;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0 5px}",
".vt-nom{font-size:var(--pt-base,14px);font-weight:600;color:var(--texte,#1A1A14);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}",
".vt-tags{display:flex;gap:4px;flex-shrink:0;align-items:center}",
".vt-tag{font-size:var(--pt-nano,9.5px);font-weight:700;letter-spacing:.3px;border-radius:5px;padding:3px 6px;background:var(--bleu-pale,#E8F0FA);color:var(--bleu-tx,#1A4A7A);white-space:nowrap}",
".vt-tag.hot{background:var(--rouge-pale,#FAEAE8);color:var(--rouge-tx,#A0291E)}",
".vt-tag.pal{background:var(--orange-pale,#FBF0E6);color:var(--orange,#B85A1A)}",
".vt-tag.fin{background:var(--vert-pale,#EAF3E2);color:var(--vert-med,#3D6B27)}",
".vt-chk{width:20px;height:20px;border-radius:50%;background:var(--vert-med,#3D6B27);color:#fff;display:none;align-items:center;justify-content:center;flex-shrink:0}",
".vt-cv.done .vt-chk{display:flex}",
".vt-l2{display:flex;align-items:center;gap:6px;margin-top:7px}",
".vt-fld{position:relative;flex:1;min-width:0}",
".vt-fld input{width:100%;height:46px;background:#fff;border:1px solid rgba(138,90,56,.28);border-radius:11px;padding:15px 8px 4px 9px;font-size:var(--pt-sm,17px);font-weight:600;color:var(--texte,#1A1A14);font-family:inherit}",
".vt-fld input:focus{border-color:var(--terre,#8A5A38);outline:none;box-shadow:0 0 0 3px rgba(138,90,56,.13)}",
".vt-fld input::placeholder{color:#B9B0A0;font-weight:500}",
".vt-fld .u{position:absolute;left:9px;top:5px;font-size:var(--pt-nano,9.5px);font-weight:700;letter-spacing:.5px;color:var(--texte-doux,#5F5F5F);pointer-events:none}",
".vt-fld .ec{position:absolute;right:8px;bottom:5px;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:var(--pt-base,14px);color:var(--texte-doux,#5F5F5F);pointer-events:none;opacity:0;transition:opacity .2s}",
".vt-fld .ec.show{opacity:1}",
".vt-fld .ec.ok{color:var(--vert-med,#3D6B27)}",
".vt-fld .ec.lent{color:var(--orange,#B85A1A)}",
".vt-cnt{width:46px;height:46px;border-radius:11px;background:var(--bg-app,#F2EFE7);border:1px solid rgba(138,90,56,.24);cursor:pointer;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;padding:0;font-family:inherit;transition:transform .09s,background .15s,border-color .15s;touch-action:manipulation;user-select:none;-webkit-user-select:none}",
".vt-cnt .k{font-size:var(--pt-nano,9.5px);font-weight:700;letter-spacing:.5px;color:var(--texte-doux,#5F5F5F)}",
".vt-cnt .v{font-family:'Cormorant Garamond',serif;font-weight:700;font-size:var(--pt-md,20px);color:var(--texte-med,#4A4A3A);margin-top:1px}",
".vt-cnt.has{background:var(--terre-pale,#F3EADF);border-color:rgba(138,90,56,.42)}",
".vt-cnt.has .v,.vt-cnt.has .k{color:var(--terre,#8A5A38)}",
".vt-cnt.bump{animation:vtBump .22s ease}",
".vt-cnt.down{background:var(--rouge-pale,#FAEAE8);border-color:rgba(160,41,30,.3)}",
"@keyframes vtBump{0%{transform:scale(1)}45%{transform:scale(1.13)}100%{transform:scale(1)}}",
".vt-ro{margin-top:6px;font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F)}",
"/* Le socle (#mv-dock) est en position:fixed bottom:0 z-index:90 : une barre posee a bottom:0 passe DESSOUS, boutons compris. Convention du projet (.pl2-mbar) : on se cale sur la hauteur du socle et on passe au-dessus. 93 = au-dessus du socle, sous la feuille du socle (#mv-dock-sheet-bg 95). */",
".vt-bot{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:93;width:100%;max-width:430px;padding:22px 12px 11px;display:flex;align-items:center;gap:9px;background:linear-gradient(180deg,rgba(242,239,231,0) 0%,var(--bg-app,#F2EFE7) 34%);pointer-events:none}",
".vt-bot>*{pointer-events:auto}",
".vt-fin{flex:1;min-height:50px;border-radius:13px;background:var(--cave,#14110D);border:none;color:#F0E2C8;font-size:var(--pt-base,14px);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit;box-shadow:0 6px 20px rgba(20,17,13,.2)}",
".vt-fin small{font-weight:500;font-size:var(--pt-micro,11px);color:rgba(240,226,200,.6)}",
".vt-fab{width:50px;height:50px;border-radius:14px;background:var(--terre,#8A5A38);border:none;color:#fff;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(138,90,56,.3)}",
".vt-vide{padding:34px 20px;text-align:center}",
".vt-vide-t{font-family:'Cormorant Garamond',serif;font-weight:700;font-size:var(--pt-md,20px);color:var(--texte,#1A1A14)}",
".vt-vide-d{font-size:var(--pt-txt,12.5px);color:var(--texte-doux,#5F5F5F);line-height:1.55;margin:8px 0 16px}",
".vt-ops{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:2px 0 4px}",
".vt-ops::-webkit-scrollbar{display:none}",
".vt-op{background:transparent;border:1px solid rgba(138,90,56,.22);color:var(--texte-med,#4A4A3A);border-radius:12px;padding:12px 15px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;white-space:nowrap;min-height:46px;flex-shrink:0;font-family:inherit}",
".vt-op.on{background:var(--cave,#14110D);border-color:var(--cave,#14110D);color:#F0E2C8}",
".vt-cuves{display:flex;flex-wrap:wrap;gap:7px}",
".vt-cb{border:1px solid rgba(138,90,56,.22);background:#fff;color:var(--texte-med,#4A4A3A);border-radius:11px;padding:10px 12px;font-size:var(--pt-txt,12.5px);font-weight:600;cursor:pointer;min-height:44px;display:flex;align-items:center;gap:6px;font-family:inherit}",
".vt-cb.on{background:var(--terre-pale,#F3EADF);border-color:var(--terre,#8A5A38);color:var(--terre-tx,#8A5A38)}",
".vt-cb .hl{font-size:var(--pt-nano,9.5px);color:var(--texte-doux,#5F5F5F);font-weight:500}",
".vt-cb.on .hl{color:rgba(138,90,56,.75)}",
".vt-cb.all{background:var(--bg-app,#F2EFE7);border-style:dashed}",
".vt-cb.all.on{background:var(--cave,#14110D);border-color:var(--cave,#14110D);border-style:solid;color:#F0E2C8}",
".vt-who-list{display:flex;flex-direction:column;gap:7px;margin-top:4px}",
".vt-whob{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:8px 12px;border-radius:12px;border:1.5px solid var(--gris-clair,#ECE6DA);background:var(--bg-card,#FBFAF6);cursor:pointer;font-family:inherit;text-align:left;color:var(--texte,#1A1A14)}",
".vt-whob.on{border-color:var(--terre,#8A5A38);background:var(--terre-pale,#F3EADF)}",
".vt-whob .av{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:var(--pt-txt,12.5px);flex-shrink:0}",
".vt-whob .nm{flex:1;font-size:var(--pt-base,14px);font-weight:600}",
"@media (prefers-reduced-motion:reduce){.vt-cnt,.vt-prog-f,.vt-cv{transition:none;animation:none}}"
  ].join('\n');
  document.head.appendChild(s);
}
window.switchVendOng        = switchVendOng;
window.renderVendTour       = renderVendTour;
window._vtIn                = _vtIn;
window._vtNav               = _vtNav;
window._vtDown              = _vtDown;
window._vtUp                = _vtUp;
window._vtCancel            = _vtCancel;
window._vtFilt              = _vtFilt;
window._vtFin               = _vtFin;
window._vtWho               = _vtWho;
window._vtWhoTog            = _vtWhoTog;
window._vtSheet             = _vtSheet;
window._vtOpSet             = _vtOpSet;
window._vtTog               = _vtTog;
window._vtAll               = _vtAll;
window._vtCalc              = _vtCalc;
window._vtValider           = _vtValider;
window._vendLastD           = _vendLastD;
window.openOvVendRec        = openOvVendRec;
window._vendResteToggle     = _vendResteToggle;
window._vendResteARentrer   = _vendResteARentrer;
window.saveVendRec          = saveVendRec;
window.deleteVendRec        = deleteVendRec;
window.openOvVendCuve       = openOvVendCuve;
window.saveVendCuve         = saveVendCuve;
window._vcuvPick            = _vcuvPick;
window.deleteVendCuve       = deleteVendCuve;
window.openOvVendMesure     = openOvVendMesure;
window.saveVendMesure       = saveVendMesure;
window._vendMesDel          = _vendMesDel;
window._vndAdjCaisses       = _vndAdjCaisses;
window._vendRepAdd          = _vendRepAdd;
window._vendRepDel          = _vendRepDel;
window._vendRepDest         = _vendRepDest;
window._vendRepCs           = _vendRepCs;
window._vendRepAdj          = _vendRepAdj;
window._vendRepPck          = _vendRepPck;
window._vendRepSurf         = _vendRepSurf;
window._vndSyncCaisses      = _vndSyncCaisses;
window._vndSetEtat          = _vndSetEtat;
window._vndToggleVendu      = _vndToggleVendu;
window._vndSetEr            = _vndSetEr;
window._vndToggleMpf        = _vndToggleMpf;
window._vmAdjRem            = _vmAdjRem;
window._vmAdjPig            = _vmAdjPig;
window._vendSaveParam       = _vendSaveParam;



// ══════════════════════════════════════════════════════════════════
// ── AJOUTS v2 : Analyses maturité (Cuvier) · Millésimes + Mise en
//    bouteille (Le Chai). Injections DOM+CSS idempotentes → aucun bump.
// ══════════════════════════════════════════════════════════════════
var _vendAnaUnitMode = 'sucre';   // 'sucre' (g/L) | 'alc' (%vol)
function _vendAnaAlc(a){ var spd=_anaSpd(a); return a.mode==='alc'?(a.val||0):((a.val||0)/spd); }

// ─────────── ANALYSES DE MATURITÉ (Cuvier) ───────────
// ═══════════════════════════════════════════════════════════════════════════
// LOT M2 — Apports par parcelle. Ce qui se decide : rien. Ce qu'il prouve :
// le rendement de chaque parcelle sort tout seul, le jour meme.
// ═══════════════════════════════════════════════════════════════════════════
var MV_APP_MAX = 10;

function _vendApportsSvg(recs, w){
  var rs = _apportsRangs(recs || []);
  if(!rs.length) return window._mvGraphVide('Aucun apport pes\u00e9 pour l\u2019instant',
    'Chaque pes\u00e9e de caisses au quai alimente ce graphe.');
  var caches = Math.max(0, rs.length - MV_APP_MAX);
  rs = rs.slice(0, MV_APP_MAX);

  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  var rowH = et ? 46 : 30, pT = et ? 12 : 14, pB = 8;
  var c = window._mvGraphCadre(w, pT + rs.length * rowH + pB,
    { padL: et ? 0 : 168, padR: et ? 0 : 150, padT: pT, padB: pB });
  var W = c.w, iw = c.iw, mx = rs[0].caisses || 1;
  var g = '';
  rs.forEach(function(o, i){
    var y = pT + i * rowH, bw = Math.max(2, o.caisses / mx * iw);
    var kgTxt = Math.round(o.kg) + ' kg';
    var rdt = o.hlHa != null ? _mvF1(o.hlHa) + ' hL/ha' : '\u2014';
    if(et){
      g += '<text x="0" y="' + (y + 11) + '" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(o.nom) + '</text>'
        + '<text x="' + W + '" y="' + (y + 11) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + kgTxt + ' \u00b7 ' + rdt + '</text>'
        + '<rect x="0" y="' + (y + 18) + '" width="' + iw.toFixed(1) + '" height="15" rx="4" fill="' + c.col.mesure + '" opacity=".16"/>'
        + '<rect x="0" y="' + (y + 18) + '" width="' + bw.toFixed(1) + '" height="15" rx="4" fill="' + c.col.mesure + '"/>'
        + '<text x="7" y="' + (y + 29) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="#fff">' + o.caisses + ' caisses</text>';
    } else {
      g += '<text x="' + (c.padL - 12) + '" y="' + (y + 15) + '" text-anchor="end" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(o.nom) + '</text>'
        + '<text x="' + (c.padL - 12) + '" y="' + (y + 26) + '" text-anchor="end" font-size="' + c.txt.mini + '" fill="' + c.col.texte + '">' + (o.ha > 0 ? _mvF1(o.ha) + ' ha' : '') + '</text>'
        + '<rect x="' + c.padL + '" y="' + (y + 4) + '" width="' + iw.toFixed(1) + '" height="18" rx="4" fill="' + c.col.mesure + '" opacity=".16"/>'
        + '<rect x="' + c.padL + '" y="' + (y + 4) + '" width="' + bw.toFixed(1) + '" height="18" rx="4" fill="' + c.col.mesure + '"/>'
        + '<text x="' + (c.padL + 8) + '" y="' + (y + 17) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="#fff">' + o.caisses + ' caisses</text>'
        + '<text x="' + (W - 80) + '" y="' + (y + 17) + '" text-anchor="end" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + kgTxt + '</text>'
        + '<text x="' + W + '" y="' + (y + 17) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + rdt + '</text>';
    }
  });
  var tete = rs[0].nom, teteC = rs[0].caisses;
  var aria = 'Apports par parcelle : ' + rs.length + ' parcelles pes\u00e9es, ' + tete + ' en t\u00eate avec ' + teteC + ' caisses.';
  return window._mvGraphSvg(c, aria, g) + _apportsPied(rs, caches);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOT M3 — La fermentation : densite, temperature, et les operations DATEES
// sur le meme axe. La seule remontee de la courbe s'explique par une
// chaptalisation ; sans les reperes, personne ne peut le voir.
// ═══════════════════════════════════════════════════════════════════════════
/* CUVGR-3 — `opts.sansTouche` : le cahier de cuverie part a l'imprimante, des
   zones de touche invisibles n'y servent a rien et pesent. */
function _vendFermSvg(cu, w, opts){
  var mes = ((cu && cu.mesures_fa) || []).slice()
    .filter(function(m){ return m && m.date && m.densite != null; })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  if(mes.length < 3) return window._mvGraphVide('Pas encore assez de relev\u00e9s sur cette cuve',
    'Trois densit\u00e9s suffisent \u00e0 tracer la cin\u00e9tique et \u00e0 projeter la fin.');

  var t0 = Date.parse(mes[0].date), t1 = Date.parse(mes[mes.length-1].date);
  if(!(t1 > t0)) t1 = t0 + 86400000;
  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  // A l'etroit, l'axe des temperatures passe dans la legende : deux axes
  // chiffres ne tiennent pas sur un telephone.
  var deuxAxes = !et;
  var c = window._mvGraphCadre(w, et ? 232 : 288,
    { padL: et ? 44 : 52, padR: deuxAxes ? 44 : 12, padT: 26, padB: et ? 30 : 34 });
  var W = c.w, pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;

  var ds = mes.map(function(m){ return _vendMesD20(m); });
  var dSec = _vendDSec(cu);   /* ★ CUV-8 : le seuil de CETTE cuve. */
  var dMin = Math.min(dSec - 6, Math.min.apply(null, ds) - 4);
  var dMax = Math.max.apply(null, ds) + 6;
  var temps = mes.map(function(m){ return m.temp_c; }).filter(function(x){ return x != null; });
  var tMin = temps.length ? Math.min.apply(null, temps) - 3 : 10;
  var tMax = temps.length ? Math.max.apply(null, temps) + 3 : 35;
  if(tMax - tMin < 8){ tMax = tMin + 8; }

  function X(t){ return pL + (Math.max(t0, Math.min(t1, t)) - t0) / (t1 - t0) * iw; }
  function Yd(v){ return pT + ih - (Math.max(dMin, Math.min(dMax, v)) - dMin) / (dMax - dMin) * ih; }
  function Yt(v){ return pT + ih - (Math.max(tMin, Math.min(tMax, v)) - tMin) / (tMax - tMin) * ih; }
  function jour(t){ return Math.round((t - t0) / 86400000); }

  var g = '';
  for(var i = 0; i <= c.grad; i++){
    var v = dMin + (dMax - dMin) * i / c.grad, y = Yd(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + y.toFixed(1) + '" stroke="' + c.col.grille + '" stroke-width="' + c.trait.grille + '"/>'
      + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
    if(deuxAxes){
      var tv = tMin + (tMax - tMin) * i / c.grad;
      g += '<text x="' + (W - c.padR + 8) + '" y="' + (y + 4).toFixed(1) + '" font-size="' + c.txt.axe + '" fill="' + c.col.attention + '">' + Math.round(tv) + '\u00b0</text>';
    }
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="' + c.txt.unite + '" fill="' + c.col.texte + '">d20</text>';

  // Le seuil du vin sec : le meme nombre que la projection de fin.
  var ysec = Yd(dSec);
  g += '<line x1="' + pL + '" y1="' + ysec.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + ysec.toFixed(1) + '" stroke="' + c.col.fait + '" stroke-width="' + c.trait.seuil + '" stroke-dasharray="5 4"/>'
    + '<text x="' + (pL + 6) + '" y="' + (ysec - 6).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="' + c.col.fait + '">' + _mvF1(dSec) + ' \u00b7 vin sec</text>';

  // Les operations, posees sur l'axe des dates. C'est la piece qui manquait.
  var ops = ((cu && cu.operations) || []).slice()
    .filter(function(o){ var t = Date.parse(o.date); return !isNaN(t) && t >= t0 && t <= t1; })
    .sort(function(a,b){ return a.date < b.date ? -1 : 1; });
  ops.forEach(function(o){
    var x = X(Date.parse(o.date));
    g += '<line x1="' + x.toFixed(1) + '" y1="' + (pT - 8) + '" x2="' + x.toFixed(1) + '" y2="' + (pT + ih) + '" stroke="' + c.col.prevu + '" stroke-width="1.2"/>'
      + '<circle cx="' + x.toFixed(1) + '" cy="' + (pT - 8) + '" r="3.4" fill="' + c.col.prevu + '"/>';
  });

  /* ★ LES CHANGEMENTS D'ETAT, sur le meme axe des dates. Une remontee
     s'explique par une chaptalisation ; un PALIER, lui, s'explique par un
     passage — cinq jours a 12 °C en macerati""on prefermentaire ne sont pas
     une fermentation qui traine.
     ⚠⚠ `statut_hist` (PARC-1) est la SEULE source. Aucune date n'est deduite
     de `date_entree` : une cuve d'avant PARC-1 n'a donc AUCUN repere ici, et
     c'est voulu. Un tiret se corrige, une date fausse se croit.
     ⚠ Borne a la fenetre du graphe, comme les operations : X() ramene une
     date hors champ sur le bord, et un passage colle au bord se lit comme un
     passage AU bord — c'est-a-dire faux. */
  var ets = _vendHist(cu).filter(function(e){
    var t = Date.parse(e && e.date); return !isNaN(t) && t >= t0 && t <= t1; });
  var _xEt = -99;
  ets.forEach(function(e){
    var x = X(Date.parse(e.date));
    g += '<line x1="' + x.toFixed(1) + '" y1="' + pT + '" x2="' + x.toFixed(1) + '" y2="' + (pT + ih) + '" stroke="' + c.col.texte + '" stroke-width="1.2" stroke-dasharray="4 3"/>';
    /* Le nom vit dans la marge HAUTE : la seule bande ou il ne croise ni la
       courbe, ni la temperature, ni les reperes d'operation (poses 5 px plus
       bas). Deux passages trop proches ne s'ecrivent PAS l'un sur l'autre :
       le trait reste, le nom part en legende, qui les date tous. */
    var lbl = _vendStatLbl(e.statut), lg = lbl.length * 5.6;
    if(x - _xEt < 34) return;
    var fin = (x + 6 + lg) > (W - 2);
    g += '<text x="' + (fin ? (x - 4) : (x + 4)).toFixed(1) + '" y="' + (pT - 13) + '"'
      + (fin ? ' text-anchor="end"' : '') + ' font-size="' + c.txt.mini + '" font-weight="600" fill="'
      + c.col.texte + '">' + _escHtml(lbl) + '</text>';
    _xEt = x;
  });

  // Temperature : une mesure, mais pas LA mesure de cet ecran — trait fin.
  if(temps.length >= 2){
    var dt = mes.filter(function(m){ return m.temp_c != null; })
      .map(function(m){ return X(Date.parse(m.date)).toFixed(1) + ',' + Yt(m.temp_c).toFixed(1); });
    g += '<polyline points="' + dt.join(' ') + '" fill="none" stroke="' + c.col.attention + '" stroke-width="' + c.trait.prevu + '" stroke-dasharray="5 4" stroke-linejoin="round"/>';
  }

  var dd = mes.map(function(m){ return X(Date.parse(m.date)).toFixed(1) + ',' + Yd(_vendMesD20(m)).toFixed(1); });
  g += '<polyline points="' + dd.join(' ') + '" fill="none" stroke="' + c.col.mesure + '" stroke-width="' + c.trait.mesure + '" stroke-linejoin="round" stroke-linecap="round"/>';
  mes.forEach(function(m){
    g += '<circle cx="' + X(Date.parse(m.date)).toFixed(1) + '" cy="' + Yd(_vendMesD20(m)).toFixed(1) + '" r="3.2" fill="' + c.col.mesure + '"/>';
  });

  /* ★ CUVGR-3 — UNE COLONNE DE TOUCHE PAR RELEVE, sur toute la hauteur. Viser
     un point de 3 px au doigt est impossible ; viser la bande verticale qui le
     contient ne demande rien. Les colonnes se touchent bord a bord : aucun
     creux entre deux ou le doigt tomberait dans le vide.
     ⚠️ Emises EN DERNIER, donc au-dessus de tout le trace : un <rect> pose
     avant la courbe serait recouvert et n'attraperait plus rien. */
  if(!(opts && opts.sansTouche)){
    mes.forEach(function(m, k){
      var xm = X(Date.parse(m.date));
      var xa = (k === 0) ? pL : (xm + X(Date.parse(mes[k-1].date))) / 2;
      var xb = (k === mes.length-1) ? (W - c.padR) : (xm + X(Date.parse(mes[k+1].date))) / 2;
      var opJ = ops.filter(function(o){ return o.date === m.date; });
      var etJ = ets.filter(function(e){ return e.date === m.date; });
      var tt = '<div class="t">' + _escHtml(_vendFrDate(m.date)) + ' \u00b7 J' + jour(Date.parse(m.date)) + '</div>'
        + '<div class="r"><i>densit\u00e9 \u00e0 20 \u00b0C</i><b>' + _mvF1(_vendMesD20(m)) + '</b></div>'
        + (m.temp_c != null ? ('<div class="r"><i>temp\u00e9rature</i><b>' + _mvF1(m.temp_c) + ' \u00b0C</b></div>') : '')
        + ((m.pigeages != null || m.remontages != null)
            ? ('<div class="r"><i>pigeages / remontages</i><b>' + (m.pigeages || 0) + ' / ' + (m.remontages || 0) + '</b></div>') : '')
        + (etJ.length ? ('<div class="o">' + _escHtml(etJ.map(function(e){ return _vendStatLbl(e.statut); }).join(' \u00b7 ')) + '</div>') : '')
        + (opJ.length ? ('<div class="o">' + _escHtml(opJ.map(function(o){ return _vendOpLbl(o.type); }).join(' \u00b7 ')) + '</div>') : '')
        + (m.note ? ('<div class="o">' + _escHtml(m.note) + '</div>') : '');
      g += window._mvGraphHit(c, xm, Yd(_vendMesD20(m)), xa, xb, tt);
    });
  }

  var pas = et ? Math.max(1, Math.ceil(jour(t1) / 3)) : Math.max(1, Math.ceil(jour(t1) / 6));
  for(var j = 0; j <= jour(t1); j += pas){
    var xj = X(t0 + j * 86400000);
    g += '<text x="' + xj.toFixed(1) + '" y="' + (c.h - 11) + '" text-anchor="middle" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">J' + j + '</text>';
  }

  var der = _vendMesD20(mes[mes.length-1]);
  var aria = 'Fermentation de ' + (cu.nom || 'la cuve') + ' : ' + mes.length + ' relev\u00e9s, densit\u00e9 de '
    + Math.round(ds[0]) + ' \u00e0 ' + Math.round(der) + ', ' + ops.length + ' op\u00e9rations dat\u00e9es'
    + (ets.length ? (', ' + ets.length + ' changement' + (ets.length > 1 ? 's' : '') + ' d\u2019\u00e9tat') : '') + '.';
  return window._mvGraphSvg(c, aria, g) + _fermLegende(cu, ops, t0, mes, deuxAxes, ets);
}

// ═══════════════════════════════════════════════════════════════════════════
// LOT M4 — Le remplissage des cuves, parcelle par parcelle. Ce que ca decide :
// si la journee de recolte de demain peut etre lancee.
// ═══════════════════════════════════════════════════════════════════════════
var MV_CUV_LARG = 92;   // largeur minimale d'une cuve lisible
var MV_CUV_GAP  = 12;   // gouttiere entre deux cuves
var MV_CUV_PIED = 44;   // les trois lignes de legende sous une cuve

/* ★★★ TOUTES LES CUVES, SANS EXCEPTION.
   Avant : les cuves qui ne tenaient pas sur UNE rangee etaient coupees
   (`slice(0, tient)`) — 3 sur un telephone, 7 sur un ecran large — et le pied
   disait « N cuves de plus, visibles sur un ecran plus large ». Deux
   consequences, dont la seconde etait invisible :
   ① on ne voyait pas ses cuves ;
   ② ⚠️⚠️ LE TAUX DE REMPLISSAGE NE PORTAIT QUE SUR LES CUVES AFFICHEES.
      « La cuverie est remplie a 62 % » se calculait sur 3 cuves sur 15, et
      c'est le chiffre qui decide si la journee de recolte de demain part.
      Un total qui n'est pas l'agregat de ce que l'ecran montre est faux — le
      test de §92, rejoue ici.
   Desormais les cuves passent A LA LIGNE. La largeur d'une cuve ne descend
   jamais sous MV_CUV_LARG : c'est le plancher de lisibilite, on ajoute une
   rangee plutot que de retrecir. La hauteur du corps se resserre quand il y a
   plusieurs rangees, sinon un cuvier de quinze cuves ferait trois ecrans.
   ⚠️ L'echelle verticale (`capMax`) est GLOBALE : une cuve de 50 hL doit
   paraitre plus petite qu'une de 100 hL, qu'elles soient sur la meme rangee ou
   non. Une echelle par rangee ferait mentir la comparaison.
   ⚠️ L'ordre est celui de la liste du Cuvier (`_vendTriRepere`, le repere ecrit
   sur la cuve) : §72a a etabli que la memoire spatiale prime. Avant, la coupe
   gardait les N premieres de l'ordre de stockage — arbitraire.
   ⚠️ Une cuve sans contenance NI contenu n'etait pas dessinee du tout. Elle
   l'est maintenant, en tirete : une cuve qui disparait sans le dire est
   exactement ce qu'on corrige ici. Elle ne compte pas dans le taux, et le pied
   le dit. */
function _vendRemplirSvg(cuves, recs, w){
  var cs = (cuves || []).slice().sort(_vendTriRepere).map(function(cu){
    var d = _cuveCouches(cu, recs);
    return { cu:cu, couches:d.couches, plein:d.plein, cap:d.cap };
  });
  if(!cs.length) return window._mvGraphVide('Aucune cuve de vinification en cours',
    'Cr\u00e9ez une cuve et rattachez-y vos pes\u00e9es pour voir l\u2019assemblage se dessiner.');

  // La largeur utile se mesure AVANT de connaitre la hauteur : c'est elle qui
  // dit combien de cuves tiennent sur une rangee, donc combien de rangees.
  var c0 = window._mvGraphCadre(w, 100, { padL: 4, padR: 4 }), et = c0.etroit;
  var iw = c0.iw;
  var parLigne = Math.max(1, Math.floor((iw + MV_CUV_GAP) / (MV_CUV_LARG + MV_CUV_GAP)));
  var lignes = Math.ceil(cs.length / parLigne);
  var hCorps = lignes >= 4 ? (et ? 110 : 124)
             : lignes >= 2 ? (et ? 134 : 150)
             :               (et ? 186 : 228);
  var hRang = hCorps + MV_CUV_PIED;
  var hTot = 10 + lignes * hRang + (lignes - 1) * 10 + 6;

  var c = window._mvGraphCadre(w, hTot, { padL: 4, padR: 4, padT: 10, padB: 6 });
  var parRang = Math.min(parLigne, cs.length);
  var bw = (c.iw - MV_CUV_GAP * (parRang - 1)) / parRang;
  var capMax = Math.max.apply(null, cs.map(function(x){ return Math.max(x.cap, x.plein); })) || 1;

  var g = '';
  cs.forEach(function(x, i){
    var r  = Math.floor(i / parLigne), k0 = i % parLigne;
    var bx = c.padL + k0 * (bw + MV_CUV_GAP);
    var yT = c.padT + r * (hRang + 10);
    // La hauteur du CONTOUR est la contenance, jamais le contenu : le rectangle
    // est le recipient. Une cuve remplie au-dela de sa contenance deborde
    // VOLONTAIREMENT par le haut (c'est le signal, cf. la fusion) — mais le
    // debordement est borne a la rangee, sinon il irait ecrire par-dessus les
    // noms de la rangee du dessus.
    var hCuve = Math.max(30, x.cap / capMax * hCorps);
    var by = yT + (hCorps - hCuve);
    var vide = (x.cap <= 0 && x.plein <= 0);
    var den = x.cap || x.plein || 1;
    var hPile = (x.plein / den) * hCuve;
    var kEch = (hPile > hCorps) ? (hCorps / hPile) : 1;
    // La cuve : un contour, et le vide au-dessus qui se voit. En tirete quand
    // la contenance n'est pas renseignee — le trait dit ce qui manque.
    g += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + bw.toFixed(1)
       + '" height="' + hCuve.toFixed(1) + '" rx="4" fill="var(--bg-card)" stroke="' + c.col.grille
       + '" stroke-width="1.5"' + (x.cap > 0 ? '' : ' stroke-dasharray="4 3"') + '/>';
    var acc = 0;
    x.couches.forEach(function(o, kk){
      var hh = (o.hl / den) * hCuve * kEch;
      var y = by + hCuve - acc - hh;
      var op = 1 - kk * 0.16;
      g += '<rect x="' + (bx + 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + Math.max(1, hh).toFixed(1) + '" fill="' + c.col.mesure + '" opacity="' + Math.max(0.3, op).toFixed(2) + '"/>';
      if(hh >= 15)
        g += '<text x="' + (bx + 7).toFixed(1) + '" y="' + (y + 13).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="600" fill="#fff">' + _escHtml(_apTronc(o.nom, et ? 11 : 15)) + '</text>'
           + '<text x="' + (bx + 7).toFixed(1) + '" y="' + (y + 24).toFixed(1) + '" font-size="' + c.txt.mini + '" fill="#fff" opacity=".85">' + _mvF1(o.hl) + ' hL</text>';
      acc += hh;
    });
    // Les trois lignes de legende, calees sous LA RANGEE, jamais sous le SVG.
    var yL = yT + hCorps;
    var pct = x.cap > 0 ? Math.round(x.plein / x.cap * 100) : 0;
    var sous = x.cap > 0 ? 'sur ' + _mvF1(x.cap) + ' \u00b7 ' + pct + ' %' : 'contenance ?';
    g += '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (yL + 16).toFixed(1) + '" text-anchor="middle" font-size="' + c.txt.axe + '" font-weight="600" fill="var(--texte)">' + _escHtml(_apTronc(x.cu.nom || '', et ? 12 : 16)) + '</text>'
      + '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (yL + 29).toFixed(1) + '" text-anchor="middle" font-size="' + c.txt.mini + '" font-weight="700" fill="' + (vide ? c.col.texte : c.col.mesure) + '">' + (vide ? '\u2014' : _mvF1(x.plein) + ' hL') + '</text>'
      + '<text x="' + (bx + bw/2).toFixed(1) + '" y="' + (yL + 41).toFixed(1) + '" text-anchor="middle" font-size="' + c.txt.mini + '" fill="' + c.col.texte + '">' + sous + '</text>';
  });

  var tPlein = cs.reduce(function(s,x){ return s + x.plein; }, 0);
  var tCap = cs.reduce(function(s,x){ return s + x.cap; }, 0);
  var sansCap = cs.filter(function(x){ return !(x.cap > 0); }).length;
  var aria = 'Remplissage des cuves : ' + cs.length + ' cuve' + (cs.length > 1 ? 's' : '')
    + ', ' + _mvF1(tPlein) + ' hectolitres'
    + (tCap > 0 ? ' pour ' + _mvF1(tCap) + ' de cuverie' : '') + '.';
  return window._mvGraphSvg(c, aria, g) + _remplirPied(tPlein, tCap, sansCap, cs.length);
}

// ── CANDIDAT — Maturite par parcelle, une seule courbe pour tout le domaine ──
// Remplace les N sparklines separees de renderVendAna par UN graphe qui compare.
// Ce qui se decide ici : l'ordre de recolte. Le graphe ne sert qu'a le montrer.
//
// Aucune saisie nouvelle : tout vient de CAVE_VENDANGE.analyses, deja saisies.

// Palette CATEGORIELLE — une parcelle, une couleur. Ce ne sont pas des roles de
// la charte, mais toutes les teintes sortent des variables existantes.
var MV_MAT_COL = ['var(--rouge)','var(--or)','var(--vert-med)','var(--terre)','var(--phyto-med)','var(--bleu)'];
var MV_MAT_MAX = 6;   // au-dela, on garde les plus avancees et on le dit

// Sucre en g/L, quelle que soit l'unite de saisie.
function _matSuc(a, spd){ var s = _anaSpd(a, spd); return a.mode === 'alc' ? (a.val || 0) * s : (a.val || 0); }

// Le classement : derniere valeur, et vitesse sur les deux derniers releves.
// La vitesse est le vrai signal — deux parcelles au meme sucre ne se recoltent
// pas le meme jour si l'une monte deux fois plus vite.
function _matClasse(byP, spd){
  return Object.keys(byP).map(function(nom){
    var arr = byP[nom].slice().sort(function(a,b){ return (a.date||'') < (b.date||'') ? -1 : 1; });
    var der = arr[arr.length - 1], suc = _matSuc(der, spd), vit = null;
    if(arr.length >= 2){
      var av = arr[arr.length - 2];
      var dj = (Date.parse(der.date) - Date.parse(av.date)) / 86400000;
      if(dj > 0) vit = (suc - _matSuc(av, spd)) / dj;
    }
    return { nom:nom, arr:arr, suc:suc, alc:suc / spd, vit:vit, date:der.date };
  }).sort(function(a,b){ return b.suc - a.suc; });
}

function _vendMatSvg(byP, w, opt){
  opt = opt || {};
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  var rangs = _matClasse(byP, spd);
  var traces = rangs.filter(function(r){ return r.arr.length >= 2; });
  if(traces.length < 1) return window._mvGraphVide(
    'Pas encore de suivi de maturit\u00e9 \u00e0 comparer',
    'Il faut deux analyses sur une m\u00eame parcelle pour tracer une courbe.');

  var caches = Math.max(0, traces.length - MV_MAT_MAX);
  traces = traces.slice(0, MV_MAT_MAX);

  var c0 = window._mvGraphCadre(w, 100), et = c0.etroit;
  // A l'aise, on pose l'etiquette de fin a droite du trace. A l'etroit, il n'y a
  // pas la place : la legende passe sous le graphe, en HTML.
  var padR = et ? 14 : 96;
  var c = window._mvGraphCadre(w, et ? 244 : 288, { padL: et ? 42 : 52, padR: padR, padT: 28, padB: et ? 34 : 32 });
  var W = c.w, pL = c.padL, pT = c.padT, iw = c.iw, ih = c.ih;

  var ts = [], vs = [];
  traces.forEach(function(r){ r.arr.forEach(function(a){
    var t = Date.parse(a.date); if(!isNaN(t)) ts.push(t);
    vs.push(_matSuc(a, spd));
  }); });
  var t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts);
  if(!(t1 > t0)) t1 = t0 + 86400000;
  var vMin = Math.floor((Math.min.apply(null, vs) - 8) / 10) * 10;
  var vMax = Math.ceil((Math.max.apply(null, vs) + 8) / 10) * 10;
  if(opt.objectif > 0){ vMin = Math.min(vMin, opt.objectif - 10); vMax = Math.max(vMax, opt.objectif + 10); }
  if(vMax - vMin < 20) vMax = vMin + 20;

  function X(t){ return pL + (t - t0) / (t1 - t0) * iw; }
  function Y(v){ return pT + ih - (Math.max(vMin, Math.min(vMax, v)) - vMin) / (vMax - vMin) * ih; }

  var g = '';
  for(var i = 0; i <= c.grad; i++){
    var v = vMin + (vMax - vMin) * i / c.grad, y = Y(v);
    g += '<line x1="' + pL + '" y1="' + y.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + y.toFixed(1) + '" stroke="' + c.col.grille + '" stroke-width="' + c.trait.grille + '"/>'
       + '<text x="' + (pL - 8) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + Math.round(v) + '</text>';
  }
  g += '<text x="' + (pL - 8) + '" y="' + (pT - 10) + '" text-anchor="end" font-size="' + c.txt.unite + '" fill="' + c.col.texte + '">g/L</text>';

  // Axe des dates : la premiere et la derniere, plus celle du milieu si la place
  // le permet. On retire des reperes, on ne reduit pas la police.
  var jours = [t0, t1];
  if(!et) jours = [t0, t0 + (t1 - t0) / 2, t1];
  jours.forEach(function(t, k){
    var d = new Date(t);
    var lab = d.getUTCDate() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0');
    g += '<text x="' + X(t).toFixed(1) + '" y="' + (c.h - 12) + '" text-anchor="' + (k === 0 ? 'start' : (k === jours.length - 1 ? 'end' : 'middle')) + '" font-size="' + c.txt.axe + '" fill="' + c.col.texte + '">' + lab + '</text>';
  });

  // L'objectif n'existe que si le domaine l'a pose. Rien d'invente.
  if(opt.objectif > 0){
    var yo = Y(opt.objectif);
    g += '<line x1="' + pL + '" y1="' + yo.toFixed(1) + '" x2="' + (W - c.padR) + '" y2="' + yo.toFixed(1) + '" stroke="' + c.col.alerte + '" stroke-width="' + c.trait.seuil + '" stroke-dasharray="6 4"/>'
       + '<text x="' + (pL + 6) + '" y="' + (yo - 7).toFixed(1) + '" font-size="' + c.txt.mini + '" font-weight="700" fill="' + c.col.alerte + '">objectif ' + Math.round(opt.objectif) + ' g/L \u00b7 ' + _mvF1(opt.objectif / spd) + ' %vol</text>';
  }

  traces.forEach(function(r, k){
    var col = MV_MAT_COL[k % MV_MAT_COL.length];
    var pts = r.arr.map(function(a){ return X(Date.parse(a.date)).toFixed(1) + ',' + Y(_matSuc(a, spd)).toFixed(1); });
    g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + c.trait.mesure + '" stroke-linejoin="round" stroke-linecap="round"/>';
    r.arr.forEach(function(a){
      g += '<circle cx="' + X(Date.parse(a.date)).toFixed(1) + '" cy="' + Y(_matSuc(a, spd)).toFixed(1) + '" r="3.4" fill="' + col + '"/>';
    });
    if(!et){
      var yl = Y(r.suc);
      g += '<text x="' + (W - c.padR + 8) + '" y="' + (yl + 4).toFixed(1) + '" font-size="' + c.txt.axe + '" font-weight="600" fill="' + col + '">' + _mvF1(r.alc) + ' %vol</text>';
    }
  });

  var premiere = traces[0].nom;
  var aria = 'Maturit\u00e9 par parcelle : ' + traces.length + ' parcelles suivies, de '
    + Math.round(traces[traces.length - 1].suc) + ' \u00e0 ' + Math.round(traces[0].suc)
    + ' grammes de sucre par litre. ' + premiere + ' est la plus avanc\u00e9e.';
  return window._mvGraphSvg(c, aria, g) + _matLegende(traces, caches, et);
}

// La legende vit SOUS le graphe, en HTML : elle reste lisible quand le graphe
// retrecit, et elle porte l'ordre de recolte — c'est elle le vrai livrable.
function _matLegende(traces, caches, etroit){
  var h = '<div class="mvmat-lg">';
  traces.forEach(function(r, k){
    var col = MV_MAT_COL[k % MV_MAT_COL.length];
    h += '<span class="mvmat-it"><i style="background:' + col + '"></i>'
      + '<b>' + _escHtml(r.nom) + '</b>'
      + '<em>' + Math.round(r.suc) + ' g/L'
      + (etroit ? ' \u00b7 ' + _mvF1(r.alc) + ' %vol' : '')
      + (r.vit != null ? ' \u00b7 ' + (r.vit >= 0 ? '+' : '\u2212') + _mvF1(Math.abs(r.vit)) + ' g/L par jour' : '')
      + '</em></span>';
  });
  h += '</div>';
  if(caches > 0) h += '<div class="mvmat-note">Les ' + traces.length + ' parcelles les plus avanc\u00e9es. '
    + caches + ' autre' + (caches > 1 ? 's' : '') + ' suivie' + (caches > 1 ? 's' : '') + ' plus bas, fiche par fiche.</div>';
  var t = traces[0];
  h += '<div class="mvmat-ord"><b>' + _escHtml(t.nom) + '</b> est la plus avanc\u00e9e'
    + (t.vit != null && t.vit > 0 ? ', et elle monte de ' + _mvF1(t.vit) + ' g/L par jour' : '')
    + '. L\u2019ordre de r\u00e9colte se lit dans cette liste, du haut vers le bas.</div>';
  return h;
}

function _vendAnaSpark(arr,w){
  if(arr.length<2) return window._mvGraphVide('Une seule analyse sur cette parcelle',
    'La courbe de maturit\u00e9 se trace \u00e0 partir de deux mesures.');
  var c=window._mvGraphCadre(w,126,{padL:26,padR:8,padT:20,padB:26});
  var W=c.w,H=c.h,pad=c.padL;
  var ys=arr.map(_vendAnaAlc);
  var mn=Math.min.apply(null,ys)-0.4, mx=Math.max.apply(null,ys)+0.4;
  if(mx-mn<0.2){mn-=0.5;mx+=0.5;}
  var px=function(i){return pad+i*(W-pad-c.padR)/(arr.length-1);};
  var py=function(v){return H-c.padB-(v-mn)/(mx-mn)*c.ih;};
  var pts=arr.map(function(a,i){return px(i)+','+py(_vendAnaAlc(a));}).join(' ');
  var pas=arr.length>7?Math.ceil(arr.length/7):1;
  var dots=arr.map(function(a,i){
    return '<circle cx="'+px(i)+'" cy="'+py(_vendAnaAlc(a))+'" r="3.5" fill="'+c.col.mesure+'"/>'
      +((i%pas===0||i===arr.length-1)
        ? '<text x="'+px(i)+'" y="'+(H-6)+'" font-size="'+c.txt.mini+'" fill="'+c.col.texte+'" text-anchor="middle">'+(a.date?a.date.slice(8)+'/'+a.date.slice(5,7):'')+'</text>'
        : '');
  }).join('');
  var last=_vendAnaAlc(arr[arr.length-1]);
  var g='<line x1="'+pad+'" y1="'+c.padT+'" x2="'+pad+'" y2="'+(H-c.padB)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
    +'<line x1="'+pad+'" y1="'+(H-c.padB)+'" x2="'+(W-c.padR)+'" y2="'+(H-c.padB)+'" stroke="'+c.col.grille+'" stroke-width="'+c.trait.grille+'"/>'
    +'<polyline points="'+pts+'" fill="none" stroke="'+c.col.mesure+'" stroke-width="'+c.trait.mesure+'"/>'+dots
    +'<text x="'+(W-c.padR)+'" y="'+(c.txt.axe+3)+'" font-size="'+c.txt.axe+'" fill="var(--texte)" text-anchor="end" font-weight="600">~'+_mvF1(last)+'% vol potentiel</text>';
  return window._mvGraphSvg(c,'Maturit\u00e9 : '+arr.length+' analyses, degr\u00e9 potentiel jusqu\u2019\u00e0 '+_mvF1(last)+' pour cent volume.',g);
}

// ══════════════════════════════════════════════════════════════════
// ── SYNTHESE DE MATURITE A DATE (Cuvier › Analyses)
//    Repond a « ou en est-on » quand on n'a mesure qu'une partie du
//    domaine : trois moyennes (domaine / rouges / blancs) et le
//    classement de TOUTES les parcelles. Aucune saisie nouvelle —
//    analyses, surfaces, cepages et recoltes existent deja.
//
//    ⚠️ Le calcul vit toujours en SUCRE. La conversion est lineaire :
//    moyenner en g/L puis reconvertir redonne exactement le degre.
//    C'est l'AFFICHAGE qui suit l'unite de saisie du domaine. Un
//    domaine qui lit son degre au refractometre ne doit pas trouver un
//    chiffre en g/L en gros : personne ne l'a mesure.
// ══════════════════════════════════════════════════════════════════
var _matFen      = 7;      // fenetre de fraicheur, en jours
var _matFiltre   = 'dom';  // 'dom' | 'rge' | 'bl'
var _matVoirTout = false;  // deplier les parcelles jamais analysees
var _matUn       = 's';    // unite d'affichage : 's' g/L | 'a' %vol
var _MAT_CAMP_J  = 150;    // au-dela, c'est la vendange precedente

function _matNorm(s){
  var t = String(s || '').trim().toLowerCase();
  return t.normalize ? t.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : t;
}
function _vendSetCoul(nom, c){
  if(!canWrite()){ showToast('Accès lecture seule', '#B85A1A'); return; }
  if(!CAVE_VENDANGE.config) CAVE_VENDANGE.config = {};
  if(!CAVE_VENDANGE.config.coul_parc) CAVE_VENDANGE.config.coul_parc = {};
  if(CAVE_VENDANGE.config.coul_parc[nom] === c) delete CAVE_VENDANGE.config.coul_parc[nom];
  else CAVE_VENDANGE.config.coul_parc[nom] = c;
  window.CAVE_VENDANGE = CAVE_VENDANGE;
  _vendFbSave(null);
  renderVendAna();
}

function _matJours(d, tj){ return Math.round((tj - Date.parse(d)) / 86400000); }

// Le calcul. Rien n'est invente : une parcelle sans mesure n'a pas de valeur,
// une mesure trop vieille sort de la moyenne mais reste affichee.
//
// ★ `refIso` n'existe QUE pour le document imprime : il rejoue la synthese a
// une date passee. Sans lui, rien ne change — l'ecran appelle _matSynth(_matFen)
// et lit aujourd'hui, exactement comme avant ce lot. Avec lui, il faut aussi
// borner PAR LE HAUT : _matJours rend un ecart NEGATIF pour une mesure
// posterieure a la reference, donc le filtre des 150 jours la laisse passer.
// Un releve de la vendange suivante se serait invite dans le document de
// l'annee precedente — un seul moteur, mais deux bornes.
function _matSynth(fen, refIso){
  var o = { frais:[], vieilles:[], jamais:[], rentrees:[], nonClass:[], tiles:{} };
  var ref = refIso || _mvToday();
  var tj = Date.parse(ref);

  var byP = {};
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(!a || !a.parcelle || !a.date) return;
    if(_matJours(a.date, tj) > _MAT_CAMP_J) return;   // vendange precedente
    if(refIso && a.date > ref) return;                // vendange suivante
    (byP[a.parcelle] = byP[a.parcelle] || []).push(a);
  });
  // Une recolte de l'an dernier ne sort pas la parcelle de cette campagne.
  var rec = {};
  (CAVE_VENDANGE.recoltes || []).forEach(function(r){
    if(!r || !r.parcelle || !r.date) return;
    if(_matJours(r.date, tj) > _MAT_CAMP_J) return;
    if(refIso && r.date > ref) return;
    if(!rec[r.parcelle] || r.date > rec[r.parcelle]) rec[r.parcelle] = r.date;
  });

  var actives = (window.PARCELLES || []).filter(function(p){
    return p && p.nom && p.statut !== 'Arrachee';
  });

  actives.forEach(function(p){
    var nom = String(p.nom).trim();
    var e = { nom:nom, ha:parseFloat(p.surface) || 0, coul:_parcCoul(nom),
              suc:null, date:null, age:null, vit:null, mode:null, rentree:rec[nom] || null };
    if(e.coul === '?') o.nonClass.push(e);
    var arr = (byP[nom] || []).slice().sort(function(a, b){ return (a.date || '') < (b.date || '') ? -1 : 1; });
    if(arr.length){
      var der = arr[arr.length - 1];
      e.suc = _matSuc(der); e.date = der.date; e.age = _matJours(der.date, tj);
      e.mode = der.mode === 'alc' ? 'a' : 's';
      if(arr.length >= 2){
        var av = arr[arr.length - 2], dj = (Date.parse(der.date) - Date.parse(av.date)) / 86400000;
        if(dj > 0) e.vit = (e.suc - _matSuc(av)) / dj;
      }
    }
    if(e.rentree)        o.rentrees.push(e);
    else if(e.suc == null) o.jamais.push(e);
    else if(e.age > fen)   o.vieilles.push(e);
    else                   o.frais.push(e);
  });

  o.frais.sort(function(a, b){ return b.suc - a.suc; });
  o.vieilles.sort(function(a, b){ return b.suc - a.suc; });
  o.jamais.sort(function(a, b){ return a.nom.localeCompare(b.nom, 'fr'); });
  o.nonClass = o.nonClass.filter(function(e){ return !e.rentree; });

  // Pondere par la SURFACE : une moyenne simple ferait peser 0,26 ha autant
  // que 1,54 ha. Le denominateur, lui, est tout ce qui reste a rentrer.
  function bloc(f){
    var m = o.frais.filter(f);
    var tous = actives.filter(function(p){
      var nom = String(p.nom).trim();
      return !rec[nom] && f({ coul:_parcCoul(nom) });
    });
    var haTot = tous.reduce(function(s, p){ return s + (parseFloat(p.surface) || 0); }, 0);
    if(!m.length) return { n:0, nTot:tous.length, haTot:haTot };
    var haM = m.reduce(function(s, x){ return s + x.ha; }, 0);
    if(!(haM > 0)) haM = m.length;   // surfaces non renseignees : moyenne simple
    return { n:m.length, nTot:tous.length, ha:haM, haTot:haTot,
      pond:   m.reduce(function(s, x){ return s + x.suc * (x.ha || 1); }, 0) / (haM || 1),
      simple: m.reduce(function(s, x){ return s + x.suc; }, 0) / m.length,
      pct:    haTot > 0 ? Math.round(haM / haTot * 100) : 0 };
  }
  o.tiles.dom = bloc(function(){ return true; });
  o.tiles.rge = bloc(function(x){ return x.coul === 'r'; });
  o.tiles.bl  = bloc(function(x){ return x.coul === 'b'; });
  return o;
}


// ─────────── Rendu de la synthese ───────────
function _matUnite(){ return _matUn === 'a' ? '%vol' : 'g/L'; }
function _matGros(suc, spd){ return _matUn === 'a' ? _mvF1(suc / spd) : String(Math.round(suc)); }
function _matPetit(suc, spd){
  return _matUn === 'a' ? Math.round(suc) + ' g/L' : '~' + _mvF1(suc / spd) + ' %vol';
}
function _matTuile(cls, lab, b, spd){
  var sel = _matFiltre === cls ? ' sel' : '';
  if(!b.n) return '<button type="button" class="mvsy-t vide ' + cls + sel + '" onclick="_matSetFiltre(\'' + cls + '\')">'
    + '<span class="lb">' + lab + '</span><span class="gl">—</span>'
    + '<span class="cv">aucune mesure<br>dans la fenêtre</span></button>';
  return '<button type="button" class="mvsy-t ' + cls + sel + '" onclick="_matSetFiltre(\'' + cls + '\')">'
    + '<span class="lb">' + lab + '</span>'
    + '<span class="gl">' + _matGros(b.pond, spd) + '<em>' + _matUnite() + '</em></span>'
    + '<span class="al">' + _matPetit(b.pond, spd) + '</span>'
    + '<span class="cv">' + b.n + ' parc. sur ' + b.nTot + '<br>' + _mvF1(b.ha) + ' ha · ' + b.pct + ' %</span></button>';
}

function _matSynthHtml(){
  var r = _matSynth(_matFen);
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  // L'unite d'affichage suit la majorite des saisies retenues.
  var tot = 0, alc = 0;
  r.frais.concat(r.vieilles).forEach(function(e){ if(e.mode){ tot++; if(e.mode === 'a') alc++; } });
  _matUn = (tot && alc > tot / 2) ? 'a' : 's';

  var h = '<div class="mvsy">'
    + '<div class="mvsy-hd"><div class="mvsy-ttl">Où en est la maturité</div>'
    + '<div class="mvsy-dt">au ' + _mvToday().slice(8, 10) + '/' + _mvToday().slice(5, 7) + '</div></div>'
    + '<div class="mvsy-fen">'
    + [[7, '7 derniers jours'], [14, '14 jours'], [_MAT_CAMP_J, 'Cette vendange']].map(function(f){
        return '<button type="button" class="' + (_matFen === f[0] ? 'on' : '') + '" onclick="_matSetFen(' + f[0] + ')">' + f[1] + '</button>';
      }).join('')
    + '</div>'
    + '<div class="mvsy-tiles">' + _matTuile('dom', 'Domaine', r.tiles.dom, spd)
    + _matTuile('rge', 'Rouges', r.tiles.rge, spd) + _matTuile('bl', 'Blancs', r.tiles.bl, spd) + '</div>';

  var b = r.tiles[_matFiltre] || r.tiles.dom;
  if(b.n) h += '<div class="mvsy-simple">moyenne pondérée par la surface · sans pondération : '
    + _matGros(b.simple, spd) + ' ' + _matUnite() + '</div>';

  // ── Classement : TOUTES les parcelles, une piste commune ──
  function garde(e){ return _matFiltre === 'dom' || e.coul === (_matFiltre === 'rge' ? 'r' : 'b'); }
  var frais = r.frais.filter(garde), vieilles = r.vieilles.filter(garde),
      jamais = r.jamais.filter(garde), rent = r.rentrees.filter(garde);
  // Une parcelle rentree (ou listee) sans analyse porte suc = null : la laisser
  // entrer ici ferait Math.min(null, ...) = 0 et l'echelle partirait a zero.
  var vals = frais.concat(vieilles, rent)
    .filter(function(e){ return e.suc != null; }).map(function(e){ return e.suc; });
  var obj = parseFloat(_vendCfg().mat_objectif) || 0;
  if(obj > 0) vals.push(obj);

  h += '<div class="mvcl"><div class="mvcl-hd"><div class="mvcl-ttl">Classement à date'
    + (_matFiltre === 'rge' ? ' · rouges' : _matFiltre === 'bl' ? ' · blancs' : '') + '</div>'
    + '<div class="mvcl-n">' + (frais.length + vieilles.length + jamais.length + rent.length) + ' parcelles</div></div>';

  if(!vals.length){
    h += '<div class="mvcl-vide">Aucune mesure à classer dans cette fenêtre.</div></div></div>';
    return h;
  }

  var vMin = Math.floor((Math.min.apply(null, vals) - 8) / 10) * 10;
  var vMax = Math.ceil((Math.max.apply(null, vals) + 8) / 10) * 10;
  if(vMax - vMin < 30) vMax = vMin + 30;
  function pos(v){ return ((v - vMin) / (vMax - vMin) * 100).toFixed(1); }

  // Graduations posees sur des valeurs RONDES DANS L'UNITE AFFICHEE : des g/L
  // reconvertis donneraient 10,1 · 11,3 · 12,5.
  var gr = '';
  if(_matUn === 'a'){
    var aMin = Math.ceil(vMin / spd * 2) / 2, aMax = vMax / spd, pasA = (aMax - aMin) > 3 ? 1 : 0.5;
    for(var a = aMin; a <= aMax + 0.01; a += pasA) gr += '<span style="left:' + pos(a * spd) + '%">' + _mvF1(a) + '</span>';
  } else {
    var pasS = Math.max(10, Math.round((vMax - vMin) / 4 / 10) * 10);
    for(var v = vMin; v <= vMax; v += pasS) gr += '<span style="left:' + pos(v) + '%">' + v + '</span>';
  }
  h += '<div class="mvcl-grad"><div></div><div class="g">' + gr + '</div><div></div></div>';

  var ov = '';
  if(b.n) ov += '<i style="left:' + pos(b.pond) + '%"></i><b class="moy" style="left:' + pos(b.pond) + '%">moy.</b>';
  if(obj > 0) ov += '<i class="obj" style="left:' + pos(obj) + '%"></i><b class="obj" style="left:' + pos(obj) + '%">objectif</b>';

  var nConv = 0;
  function ligne(e, cls, dot, sous){
    var conv = e.suc != null && e.mode && e.mode !== _matUn;
    if(conv) nConv++;
    return '<div class="mvcl-r' + (cls ? ' ' + cls : '') + '">'
      + '<span class="n">' + _escHtml(e.nom) + '</span>'
      + '<span class="pi">' + (e.suc != null ? '<i class="dot ' + dot + '" style="left:' + pos(e.suc) + '%"></i>' : '') + '</span>'
      + '<span class="v' + (conv ? ' conv' : '') + '">' + (e.suc != null ? '<b>' + _matGros(e.suc, spd) + '</b>' : '—')
      + '<s>' + sous + '</s></span></div>';
  }
  var rows = '';
  frais.forEach(function(e){ rows += ligne(e, '', e.coul === '?' ? 'q' : e.coul, _matPetit(e.suc, spd)); });
  if(vieilles.length){
    rows += '<div class="mvcl-sep">Mesure de plus de ' + _matFen + ' jours — hors moyenne</div>';
    vieilles.forEach(function(e){ rows += ligne(e, 'pale', 'old ' + (e.coul === '?' ? 'q' : e.coul), 'le ' + e.date.slice(8) + '/' + e.date.slice(5, 7)); });
  }
  if(jamais.length){
    // Ce qui est MESURE reste toujours visible. Ce qui n'a rien se COMPTE :
    // sur quarante parcelles, la liste des muettes noierait le classement.
    rows += '<div class="mvcl-sep">Jamais analysées — ' + jamais.length + ' parcelles · '
      + _mvF1(jamais.reduce(function(x, e){ return x + e.ha; }, 0)) + ' ha</div>';
    (_matVoirTout ? jamais : jamais.slice(0, 3)).forEach(function(e){ rows += ligne(e, 'pale', '', _mvF1(e.ha) + ' ha'); });
    if(jamais.length > 3) rows += '<button type="button" class="mvcl-plus" onclick="_matVoirPlus()">'
      + (_matVoirTout ? 'replier' : 'voir les ' + (jamais.length - 3) + ' autres') + '</button>';
  }
  if(rent.length){
    rows += '<div class="mvcl-sep">Déjà rentrées</div>';
    rent.forEach(function(e){ rows += ligne(e, 'pale out', 'old ' + (e.coul === '?' ? 'q' : e.coul), 'le ' + e.rentree.slice(8) + '/' + e.rentree.slice(5, 7)); });
  }
  h += '<div class="mvcl-zone"><div class="mvcl-ov">' + ov + '</div>' + rows + '</div>'
    + '<div class="mvcl-lg"><span><i class="pl"></i>mesure dans la fenêtre</span>'
    + '<span><i class="cr"></i>mesure plus ancienne, hors moyenne</span>'
    + '<span><i class="tr"></i>moyenne</span>'
    + (nConv ? '<span><i class="cv">' + (_matUn === 'a' ? '12,7' : '214') + '</i>valeur convertie, pas mesurée</span>' : '')
    + '</div>';
  if(nConv) h += '<div class="mvcl-pied">' + (_matUn === 'a'
      ? 'Les ' + nConv + ' valeurs soulignées ont été saisies en sucre et converties : sucre ÷ ' + _mvF1(spd) + '.'
      : 'Les ' + nConv + ' valeurs soulignées ont été lues en degré au réfractomètre et converties : degré × ' + _mvF1(spd) + '.') + '</div>';
  h += '</div>';

  // ── L'ecart, ce que la benne mettrait ensemble ──
  if(frais.length > 1){
    var hi = frais[0], lo = frais[frais.length - 1], d = hi.suc - lo.suc;
    h += '<div class="mvsy-ec"><b>' + _escHtml(hi.nom) + '</b> en tête, <b>' + _escHtml(lo.nom) + '</b> en queue : <b>'
      + (_matUn === 'a' ? _mvF1(d / spd) + ' %vol d’écart</b>, ' + Math.round(d) + ' g/L'
                        : Math.round(d) + ' g/L d’écart</b>, ' + _mvF1(d / spd) + ' %vol')
      + '. C’est ce que la même benne mettrait ensemble.</div>';
  }

  if(vieilles.length){
    h += '<div class="mvsy-warn"><b>' + vieilles.length + ' parcelle' + (vieilles.length > 1 ? 's écartées' : ' écartée')
      + '</b> du calcul : rien depuis plus de ' + _matFen + ' jours. ';
    vieilles.forEach(function(e){
      h += _escHtml(e.nom) + ' en est restée au ' + e.date.slice(8) + '/' + e.date.slice(5, 7)
        + ' (' + e.age + ' j, ' + _matGros(e.suc, spd) + ' ' + _matUnite() + ')';
      // La projection est une projection : elle se dit, elle ne se compte pas.
      h += (e.vit != null && e.vit > 0)
        ? ' — à ' + (_matUn === 'a' ? _mvF1(e.vit / spd) + ' %vol' : _mvF1(e.vit) + ' g/L') + ' par jour elle serait vers '
          + _matGros(e.suc + e.vit * e.age, spd) + ', mais personne ne l’a mesurée. '
        : '. ';
    });
    h += '</div>';
  }

  h += '<div class="mvsy-info"><b>Ce chiffre n’est pas la moyenne du domaine</b> : c’est la moyenne des parcelles '
    + 'qui ont une mesure fraîche, pondérée par leur surface. ' + r.jamais.length + ' parcelle'
    + (r.jamais.length > 1 ? 's n’ont' : ' n’a') + ' aucune analyse cette vendange.'
    + (r.rentrees.length ? ' ' + r.rentrees.length + ' parcelle' + (r.rentrees.length > 1 ? 's déjà rentrées ne comptent' : ' déjà rentrée ne compte') + ' plus.' : '')
    + '</div>';

  if(r.nonClass.length && canWrite()){
    h += '<div class="mvsy-cls"><div class="t"><b>' + r.nonClass.length + ' parcelle'
      + (r.nonClass.length > 1 ? 's' : '') + ' sans couleur.</b> Le cépage ne permet pas de trancher. '
      + (r.nonClass.length > 1 ? 'Elles comptent' : 'Elle compte') + ' dans le domaine, pas dans les deux colonnes.</div>';
    var cp = _vendCfg().coul_parc || {};
    r.nonClass.forEach(function(e){
      h += '<div class="mvsy-clr"><span class="n">' + _escHtml(e.nom) + ' · ' + _mvF1(e.ha) + ' ha</span>'
        + '<button type="button" class="r' + (cp[e.nom] === 'r' ? ' on' : '') + '" onclick="_vendSetCoul(' + _mvQ(e.nom) + ',\'r\')">Rouge</button>'
        + '<button type="button" class="b' + (cp[e.nom] === 'b' ? ' on' : '') + '" onclick="_vendSetCoul(' + _mvQ(e.nom) + ',\'b\')">Blanc</button></div>';
    });
    h += '</div>';
  }
  return h + '</div>';
}
function _matSetFen(f){ _matFen = f; renderVendAna(); }
function _matSetFiltre(k){ _matFiltre = (_matFiltre === k ? 'dom' : k); renderVendAna(); }
function _matVoirPlus(){ _matVoirTout = !_matVoirTout; renderVendAna(); }

function renderVendAna(){
  _caveV2InjectCss();
  var el=document.getElementById('mvv-body'); if(!el) return;
  var spd=(_vendCfg().sucre_par_degre)||16.83;
  var names=_vendParcelleNames();
  var opts='<option value="">— Choisir une parcelle —</option>'+names.map(function(n){return '<option value="'+_escHtml(n)+'">'+_escHtml(n)+'</option>';}).join('');
  var sucOn=_vendAnaUnitMode==='sucre';
  var canEdit=canWrite();
  var html='';
  if(canEdit){
    html+='<div class="mva-form">'
      +'<div class="mva-frow">'
        +'<div class="mva-fld" style="min-width:150px"><label>Parcelle</label><select id="mva-parc">'+opts+'</select></div>'
        +'<div class="mva-fld" style="max-width:150px"><label>Date</label><input id="mva-date" type="date" value="'+(_mvToday())+'"></div>'
        +'<div class="mva-fld" style="max-width:160px"><label>Mesure</label><div class="mva-useg">'
          +'<button id="mva-u-suc" class="'+(sucOn?'on':'')+'" onclick="_vendAnaUnit(\'sucre\')">Sucre g/L</button>'
          +'<button id="mva-u-alc" class="'+(sucOn?'':'on')+'" onclick="_vendAnaUnit(\'alc\')">°alc %vol</button>'
        +'</div></div>'
        +'<div class="mva-fld" style="max-width:120px"><label id="mva-vlab">'+(sucOn?'Sucre (g/L)':'°alc (%vol)')+'</label><input id="mva-val" type="number" step="'+(sucOn?'1':'0.1')+'" value="'+(sucOn?'200':'12')+'" oninput="_vendAnaLive()"></div>'
        +'<div class="mva-fld" style="flex:0 0 auto"><button class="mva-add" onclick="_vendAnaAdd()">+ Ajouter</button></div>'
      +'</div>'
      +'<div class="mva-derived"><div>Sucre<b id="mva-d-suc">—</b></div><div>Degré potentiel<b id="mva-d-alc">—</b></div><div>Estimation alcoolique<b id="mva-d-est" style="color:var(--bordeaux,#7A1020)">—</b></div></div>'
    +'</div>';
  }
  html+='<div class="mva-hint">Réfractomètre : saisie en sucre (g/L) ou en degré potentiel (%vol). Degré = sucre ÷ '+_mvF1(spd)+'. Courbe d\'évolution par parcelle.</div>';
  var all=CAVE_VENDANGE.analyses||[];
  var byP={};
  all.forEach(function(a){ if(!a||!a.parcelle) return; (byP[a.parcelle]=byP[a.parcelle]||[]).push(a); });
  var parcs=Object.keys(byP).sort(function(a,b){return a.localeCompare(b,'fr');});
  if(!parcs.length){
    html+='<div class="mvb-empty">Aucune analyse enregistrée.<br>Ajoutez une première mesure de maturité ci-dessus.</div>';
  } else {
    window._mvGraphOublier('#mvg-mat-');
    // La synthese « ou en est-on » AVANT tout : c'est la question qu'on se pose
    // en montant au cuvier. Le graphe d'evolution et les fiches restent dessous.
    html+=_matSynthHtml();
    // Le graphe qui COMPARE. Les fiches par parcelle restent dessous :
    // elles portent le detail des mesures et leur suppression.
    html+='<div class="mvmat-card"><div class="mvmat-ttl">Maturit\u00e9 par parcelle \u00b7 r\u00e9fractom\u00e8tre</div>'
      +'<div id="mvg-mat-all"></div></div>';
    (function(bp){
      window._mvGraphSuivre('#mvg-mat-all', function(lg){
        // L'objectif n'existe que si le domaine l'a pose : absent, la ligne ne
        // s'affiche pas. Rien n'est invente, et le jour ou le reglage existe,
        // il n'y a rien d'autre a brancher.
        return _vendMatSvg(bp, lg, { objectif: parseFloat(_vendCfg().mat_objectif) || 0 });
      });
    })(byP);
    parcs.forEach(function(p,pi){
      var arr=byP[p].slice().sort(function(a,b){return (a.date||'')<(b.date||'')?-1:1;});
      var last=arr[arr.length-1];
      var lastSuc=_matSuc(last,spd);
      html+='<div class="mva-card"><div class="mva-cname">'+_escHtml(p)+'</div>'
        +'<div class="mva-meta">'+arr.length+' analyse'+(arr.length>1?'s':'')+' · dernière le '+(last.date?last.date.slice(8)+'/'+last.date.slice(5,7):'')+'</div>'
        +'<div class="mva-line"><span>'+Math.round(lastSuc)+' g/L</span><span class="pot">~'+_mvF1(_vendAnaAlc(last))+'% vol potentiel</span></div>'
        +'<div id="mvg-mat-'+pi+'"></div>';
      (function(a2,ix){ window._mvGraphSuivre('#mvg-mat-'+ix, function(lg){ return _vendAnaSpark(a2,lg); }); })(arr,pi);
      html+='<div class="mva-rows">';
      arr.slice().reverse().forEach(function(a){
        var suc=_matSuc(a,spd);
        html+='<div class="mva-row"><span>'+(a.date?a.date.slice(8)+'/'+a.date.slice(5,7)+'/'+a.date.slice(0,4):'')+' · '+Math.round(suc)+' g/L · ~'+_mvF1(_vendAnaAlc(a))+'% vol</span>'
          +(canEdit?'<button class="mva-x" onclick="_vendAnaDel(\''+a.id+'\')" aria-label="Supprimer">×</button>':'')+'</div>';
      });
      html+='</div></div>';
    });
  }
  el.innerHTML=html;
  if(window._mvGraphRepeindre) window._mvGraphRepeindre();
  if(canEdit) _vendAnaLive();
  _vendRefreshCockpit();
}
function _vendAnaUnit(u){
  _vendAnaUnitMode=u;
  var bs=document.getElementById('mva-u-suc'), ba=document.getElementById('mva-u-alc');
  if(bs) bs.classList.toggle('on',u==='sucre'); if(ba) ba.classList.toggle('on',u==='alc');
  var lab=document.getElementById('mva-vlab'); if(lab) lab.textContent=u==='sucre'?'Sucre (g/L)':'°alc (%vol)';
  var v=document.getElementById('mva-val'); if(v){ v.value=u==='sucre'?200:12; v.step=u==='sucre'?'1':'0.1'; }
  _vendAnaLive();
}
function _vendAnaLive(){
  var el=document.getElementById('mva-val'); if(!el) return;
  var spd=(_vendCfg().sucre_par_degre)||16.83;
  var v=parseFloat(el.value)||0;
  var suc=_vendAnaUnitMode==='sucre'?v:(v*spd);
  var alc=_vendAnaUnitMode==='sucre'?(v/spd):v;
  var ds=document.getElementById('mva-d-suc'); if(ds) ds.textContent=Math.round(suc)+' g/L';
  var da=document.getElementById('mva-d-alc'); if(da) da.textContent='~'+_mvF1(alc)+'% vol';
  var de=document.getElementById('mva-d-est'); if(de) de.textContent='~'+_mvF1(alc)+'% vol';
}
function _vendAnaAdd(){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  var p=(document.getElementById('mva-parc')||{}).value||'';
  var d=(document.getElementById('mva-date')||{}).value||'';
  var v=parseFloat((document.getElementById('mva-val')||{}).value);
  if(!p){ showToast('Choisissez une parcelle','#E07060'); return; }
  if(!(v>0)){ showToast('Saisissez une mesure','#E07060'); return; }
  if(!CAVE_VENDANGE.analyses) CAVE_VENDANGE.analyses=[];
  CAVE_VENDANGE.analyses.push({id:'vana_'+Date.now(),parcelle:p,date:d||_mvToday(),
    mode:_vendAnaUnitMode,val:v,spd:(_vendCfg().sucre_par_degre)||16.83});
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave('Analyse enregistrée','#C0845A');
  renderVendAna();
}
function _vendAnaDel(id){
  if(!canWrite()){ showToast('Accès lecture seule','#B85A1A'); return; }
  CAVE_VENDANGE.analyses=(CAVE_VENDANGE.analyses||[]).filter(function(a){return a.id!==id;});
  window.CAVE_VENDANGE=CAVE_VENDANGE;
  _vendFbSave(null);
  renderVendAna();
}

// ── expositions v2 ──
window.renderVendAna        = renderVendAna;
window._vendAnaUnit         = _vendAnaUnit;
window._vendAnaLive         = _vendAnaLive;
window._vendAnaAdd          = _vendAnaAdd;
window._matSetFen           = _matSetFen;
window._matSetFiltre        = _matSetFiltre;
window._matVoirPlus         = _matVoirPlus;
window._vendSetCoul         = _vendSetCoul;
window._vendAnaDel          = _vendAnaDel;
// ★ Lus par le Pilotage : le plafond n'a qu'UNE definition, et elle est ici.
window._vendRdtMax         = _vendRdtMax;
window._vendSetRdtMax      = _vendSetRdtMax;
// ★ Lus par Reglages (declaration) et par le Pilotage (affichage).
window._vendAocList        = _vendAocList;
window._vendAocDe          = _vendAocDe;
window._vendAocMax         = _vendAocMax;
window._vendAocNorm        = _vendAocNorm;

/* ── Le controle de maturite ───────────────────────────────────────────────
   Une matrice : une ligne par parcelle, une colonne par jour de releve. C'est
   la forme que le papier sait faire mieux que l'ecran — la courbe compare deux
   parcelles, le tableau les compare toutes. */

/* Les annees ou l'on a mesure quelque chose, la plus recente d'abord. */
function _matAnnees(){
  var s = {};
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(a && a.date && String(a.date).length >= 4) s[String(a.date).slice(0, 4)] = 1;
  });
  return Object.keys(s).sort().reverse();
}

/* La date a laquelle le document se place. L'annee en cours se lit AUJOURD'HUI,
   comme l'ecran. Une annee passee se lit a son DERNIER releve : sinon la
   fenetre de fraicheur de sept jours ne contiendrait plus rien et les trois
   moyennes sortiraient vides d'un document pourtant plein de mesures. */
function _matRefIso(an){
  var today = _mvToday();
  if(String(an) === today.slice(0, 4)) return today;
  var last = '';
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(a && a.date && String(a.date).slice(0, 4) === String(an) && a.date > last) last = a.date;
  });
  return last || (an + '-12-31');
}

/* Formatage seul — le calcul vit en sucre, l'affichage suit l'unite de saisie
   majoritaire. Un domaine qui lit son degre au refractometre ne doit pas
   trouver un chiffre en g/L en gros : personne ne l'a mesure. */
function _matDocVal(suc, spd, un){ return un === 'a' ? _mvF1(suc / spd) : String(Math.round(suc)); }
function _matDocAlt(suc, spd, un){ return un === 'a' ? (Math.round(suc) + ' g/L') : ('~' + _mvF1(suc / spd) + ' %vol'); }
function _matDocUn(un){ return un === 'a' ? '%vol' : 'g/L'; }

/* ── TRI-3 — l'ordre du contrôle de maturité ────────────────────────────────
   ⚠️ `_matClasse` rend deja les parcelles du plus mur au moins mur, sans
   departage : sur la cle par defaut on rend donc la liste TELLE QUELLE, sans
   la retrier. Un comparateur « equivalent » ajouterait un departage par nom
   que le document n'avait pas, et deux tirages identiques ne le seraient plus.
   ⚠️ Une valeur absente (pas de vitesse faute d'un second releve) part en fin
   de liste dans les deux sens : on ne sait pas qu'elle est lente, on ne sait
   rien d'elle. */
var MV_TRI_MATURITE = [
  { v:'maturite', lbl:'Maturit\u00e9',  a:'la moins m\u00fbre d\u2019abord', z:'la plus m\u00fbre d\u2019abord' },
  { v:'nom',      lbl:'Parcelle',   a:'A \u2192 Z', z:'Z \u2192 A' },
  { v:'surface',  lbl:'Surface',    a:'la plus petite d\u2019abord', z:'la plus grande d\u2019abord' },
  { v:'vitesse',  lbl:'Vitesse',    a:'la plus lente d\u2019abord', z:'la plus rapide d\u2019abord' },
  { v:'releve',   lbl:'Dernier rel\u00e8vement', a:'le plus ancien d\u2019abord', z:'le plus r\u00e9cent d\u2019abord' }
];
function _matTrier(rangs, c){
  c = c || { cle:'maturite', sens:'desc' };
  if(c.cle === 'maturite')
    return (c.sens === 'asc') ? rangs.slice().reverse() : rangs;
  var sg = (c.sens === 'desc') ? -1 : 1;
  var val = function(r){
    if(c.cle === 'nom')     return String(r.nom || '');
    if(c.cle === 'surface') { var h = _vendParcSurf(r.nom); return h > 0 ? h : null; }
    if(c.cle === 'vitesse') return (r.vit == null) ? null : r.vit;
    if(c.cle === 'releve')  return r.date ? String(r.date) : null;
    return null;
  };
  return rangs.slice().sort(function(a, b){
    var x = val(a), y = val(b);
    if(x == null || y == null){
      if(x == null && y == null) return String(a.nom).localeCompare(String(b.nom), 'fr');
      return x == null ? 1 : -1;
    }
    var d = (typeof x === 'string') ? x.localeCompare(y, 'fr') : (x - y);
    return d ? sg * d : String(a.nom).localeCompare(String(b.nom), 'fr');
  });
}
window._matTrier = _matTrier;

function _matDoc(an, mtri){
  var spd = (_vendCfg().sucre_par_degre) || 16.83;
  var ref = _matRefIso(an);
  var tj  = Date.parse(ref);
  var S;
  try{ S = _matSynth(_matFen, ref); }
  catch(err){
    if(window.logError) window.logError({ level:'error', cat:'cave', msg:'controle de maturite' });
    showToast('Document impossible à produire', '#C0392B'); return;
  }

  /* Le meme filtre que la synthese, au caractere pres : ce qui est dans le
     tableau est ce qui est dans les moyennes. */
  var byP = {}, jours = {}, nAlc = 0, nTot = 0;
  (CAVE_VENDANGE.analyses || []).forEach(function(a){
    if(!a || !a.parcelle || !a.date) return;
    if(a.date > ref) return;
    if(_matJours(a.date, tj) > _MAT_CAMP_J) return;
    (byP[a.parcelle] = byP[a.parcelle] || []).push(a);
    jours[a.date] = 1; nTot++; if(a.mode === 'alc') nAlc++;
  });
  if(!nTot){ showToast('Aucun relevé de maturité sur ' + an, '#B85A1A'); return; }

  var un    = (nAlc > nTot / 2) ? 'a' : 's';
  var toutes = Object.keys(jours).sort();
  var cols   = toutes.length > 8 ? toutes.slice(-8) : toutes;
  var caches = toutes.length - cols.length;
  var rangs  = _matTrier(_matClasse(byP, spd), mtri);

  /* Rentrees : la synthese sait deja lesquelles, et depuis quand. */
  var rentree = {};
  (S.rentrees || []).forEach(function(e){ rentree[e.nom] = e.rentree; });

  function tuile(lab, b){
    if(!b || !b.n) return '<div class="cd-k"><b>' + lab + '</b><span>—</span>'
      + '<i>aucune mesure dans la fenêtre</i></div>';
    return '<div class="cd-k"><b>' + lab + '</b>'
      + '<span>' + _matDocVal(b.pond, spd, un) + ' <small>' + _matDocUn(un) + '</small></span>'
      + '<i>' + _matDocAlt(b.pond, spd, un) + '<br>' + b.n + ' parcelle' + (b.n > 1 ? 's' : '')
      + ' sur ' + b.nTot + ' · ' + _mvF1(b.ha || 0) + ' ha (' + b.pct + ' %)</i></div>';
  }

  var nConv = 0;
  function cell(arr, d){
    var v = null;
    for(var i = 0; i < arr.length; i++) if(arr[i].date === d) v = arr[i];
    if(!v) return '<td class="n">·</td>';
    var suc  = _matSuc(v, spd);
    var conv = (un === 'a') !== (v.mode === 'alc');
    if(conv) nConv++;
    return '<td class="n' + (conv ? ' cd-conv' : '') + '">' + _matDocVal(suc, spd, un) + '</td>';
  }

  var lignes = rangs.map(function(r){
    var ha  = _vendParcSurf(r.nom);
    var c   = _parcCoul(r.nom);
    var age = _matJours(r.date, tj);
    var etat = rentree[r.nom]
      ? ('Rentrée le ' + _vendFrDate(rentree[r.nom]))
      : (age <= _matFen ? 'À jour' : ('Relevé il y a ' + age + ' j'));
    var vit = (r.vit == null) ? '—'
      : ((r.vit >= 0 ? '+' : '−') + _mvF1(Math.abs(un === 'a' ? r.vit / spd : r.vit)));
    return '<tr><td>' + _escHtml(r.nom) + '</td>'
      + '<td>' + (c === 'r' ? 'Rouge' : c === 'b' ? 'Blanc' : '—') + '</td>'
      + '<td class="n">' + _mvF1(ha) + '</td>'
      + cols.map(function(d){ return cell(r.arr, d); }).join('')
      + '<td class="n">' + _matDocVal(r.suc, spd, un) + '</td>'
      + '<td class="n">' + vit + '</td>'
      + '<td>' + etat + '</td></tr>';
  }).join('');

  var tete = '<tr><th>Parcelle</th><th>Couleur</th><th class="n">ha</th>'
    + cols.map(function(d){ return '<th class="n">' + _vendFrDate(d) + '</th>'; }).join('')
    + '<th class="n">Dernier</th><th class="n">Vitesse</th><th>État</th></tr>';

  var corps = '<div class="cd-kpis">'
    + tuile('Domaine', S.tiles.dom) + tuile('Rouges', S.tiles.rge) + tuile('Blancs', S.tiles.bl)
    + '</div>'
    + '<h2>' + ((!mtri || mtri.cle === 'maturite') ? 'Ordre de maturité' : 'Les parcelles suivies')
      + ' — ' + rangs.length + ' parcelle' + (rangs.length > 1 ? 's' : '')
    + ' suivie' + (rangs.length > 1 ? 's' : '') + '</h2>'
    + '<table><thead>' + tete + '</thead><tbody>' + lignes + '</tbody></table>'
    + '<div class="cd-note">Valeurs en ' + _matDocUn(un) + '. La vitesse est calculée sur les deux '
    + 'derniers relevés de la parcelle, en ' + _matDocUn(un) + ' par jour. Un point signifie : pas de '
    + 'relevé ce jour-là.'
    + (nConv ? ' Les ' + nConv + ' valeur' + (nConv > 1 ? 's' : '') + ' en italique '
        + (nConv > 1 ? 'ont' : 'a') + ' été saisie' + (nConv > 1 ? 's' : '')
        + ' dans l’autre unité puis convertie' + (nConv > 1 ? 's' : '') + '.' : '')
    + (caches ? ' Les ' + caches + ' premier' + (caches > 1 ? 's' : '') + ' jour'
        + (caches > 1 ? 's' : '') + ' de relevé ne tiennent pas dans le tableau : seuls les huit '
        + 'derniers sont affichés.' : '')
    + '</div>';

  if(S.jamais && S.jamais.length){
    corps += '<h2>Sans aucun relevé — ' + S.jamais.length + ' parcelle'
      + (S.jamais.length > 1 ? 's' : '') + '</h2>'
      + '<div class="cd-vide">' + S.jamais.map(function(e){
          return _escHtml(e.nom) + ' <span style="color:#9A9080">(' + _mvF1(e.ha) + ' ha)</span>';
        }).join(' · ') + '</div>';
  }
  if(S.nonClass && S.nonClass.length){
    corps += '<div class="cd-note"><b>' + S.nonClass.length + ' parcelle'
      + (S.nonClass.length > 1 ? 's ne sont pas classées' : ' n’est pas classée')
      + ' en rouge ou blanc</b> — cépage non renseigné, ou deux couleurs complantées : '
      + S.nonClass.map(function(e){ return _escHtml(e.nom); }).join(', ')
      + '. Elles comptent dans la moyenne du domaine, jamais dans celle d’une couleur.</div>';
  }

  corps += '<div class="mvdoc-lim"><b>Ce document présente vos propres mesures.</b> '
    + 'C’est un état interne : il ne tient lieu d’aucune déclaration. '
    + 'Les trois moyennes sont <b>pondérées par la surface</b> et ne retiennent que les relevés '
    + 'des ' + _matFen + ' derniers jours au ' + _vendFrDate(ref) + ' — une parcelle mesurée avant '
    + 'reste dans le tableau, pas dans la moyenne. Le pourcentage dit quelle part de la surface '
    + 'encore sur pied est couverte par ces relevés. La conversion sucre ↔ degré utilise le '
    + 'coefficient <b>figé au moment de chaque saisie</b> (réglage actuel : ' + _mvF1(spd)
    + ' g/L par degré) : changer ce réglage ne réécrit pas le passé.</div>';

  if(typeof window._mvDocOpen !== 'function'){
    showToast('Mise à jour incomplète — rechargez l’application', '#B85A1A'); return;
  }
  var d1 = toutes[0], d2 = toutes[toutes.length - 1];
  window._mvDocOpen({
    titre: 'Contrôle de maturité ' + an,
    orient: 'paysage', cat: 'cave', css: MV_CUVDOC_CSS, corps: corps,
    metas: [nTot + ' relevé' + (nTot > 1 ? 's' : '') + ' sur ' + rangs.length + ' parcelle'
              + (rangs.length > 1 ? 's' : ''),
            'du ' + _vendFrDate(d1) + ' au ' + _vendFrDate(d2),
            (typeof window._mvTriPhrase === 'function' && mtri)
              ? ('Trié par ' + window._mvTriPhrase({ cles: MV_TRI_MATURITE }, mtri)) : '',
            'Édité le ' + new Date().toLocaleDateString('fr-FR')]
  });
  showToast('Contrôle de maturité ' + an, '#3D6B27');
}

/* Ne jamais poser une question dont la reponse est unique. */
window._matExportChoix = function(){
  var ans = _matAnnees();
  if(!ans.length){ showToast('Aucun relev\u00e9 de maturit\u00e9 enregistr\u00e9', '#B85A1A'); return; }
  /* ⚠️ UNE SEULE FEUILLE, PAS DEUX QUESTIONS A LA SUITE. `openPrompt` posait
     l'annee ; MV_TRI la pose AUSSI, et n'affiche la rangee que s'il y en a
     plusieurs. Le geste ne s'allonge donc pas, il gagne le tri. */
  var opts = {
    titre:'Contr\u00f4le de maturit\u00e9', icone:'raisin', memo:'maturite',
    sub:'Le contr\u00f4le se lit vendange par vendange. Choisissez l\u2019ann\u00e9e, puis l\u2019ordre des parcelles.',
    annees:ans, anLbl:'Vendange',
    cles:MV_TRI_MATURITE, defaut:{ cle:'maturite', sens:'desc' },
    btn:'\u00c9diter le relev\u00e9',
    note:function(c){
      if(c.cle === 'maturite')
        return 'L\u2019ordre du document depuis toujours\u00a0: la parcelle la plus avanc\u00e9e en t\u00eate, '
             + 'celle qui d\u00e9cide de la date de vendange.';
      if(c.cle === 'vitesse')
        return 'La vitesse se calcule sur les <b>deux derniers</b> rel\u00e8vements. Une parcelle qui n\u2019en '
             + 'a qu\u2019un n\u2019a pas de vitesse\u00a0: elle part en fin de liste, pas en t\u00eate.';
      return 'Le titre du tableau suit l\u2019ordre choisi\u00a0: il ne dira \u00ab ordre de maturit\u00e9 \u00bb que '
           + 'si c\u2019en est un.';
    },
    cb:function(c){ _matDoc(c.an, c); }
  };
  if(typeof window._mvTriOuvrir !== 'function' || !window._mvTriOuvrir(opts))
    _matDoc(ans[0], { cle:'maturite', sens:'desc' });
};

window._matDoc     = _matDoc;
window._matAnnees  = _matAnnees;
/* CUVGR-3 : la courbe est expos\u00e9e pour que le harnais lise le VRAI svg,
   pas une copie. */
window._vendFermSvg   = _vendFermSvg;

// ══ LA FRONTIÈRE — ce que le Chai (cave.js) lit du Cuvier ═════════════════
// ★ CUV-DEC (§164) — chacun de ces noms est lu par cave.js (au premier geste, jamais au
//   chargement : cave.js est évalué AVANT ce fichier). Retirer une ligne : ReferenceError.
window._vendInjectCss = _vendInjectCss;
window._vendFrDate = _vendFrDate;
window._vendFaPct = _vendFaPct;
window._vendStatLbl = _vendStatLbl;
window._vendIsActive = _vendIsActive;
window._vendHist = _vendHist;
window._vendStatDeb = _vendStatDeb;
window._vendStatDuree = _vendStatDuree;
window._vendEstFusionnee = _vendEstFusionnee;
window._vendTriMes = _vendTriMes;
window._vendLastMes = _vendLastMes;
window._vendCockpitHtml = _vendCockpitHtml;
window._vendRenderTab = _vendRenderTab;
window._vendCfg = _vendCfg;
window.renderVendParam = renderVendParam;
window._vendFbSave = _vendFbSave;
window._vendEnsureSheetCss = _vendEnsureSheetCss;
window._vendMesD20 = _vendMesD20;
window._vendSucre = _vendSucre;
window._vendDSec = _vendDSec;
window._vendSucreRest = _vendSucreRest;
window._vendDecuvee = _vendDecuvee;
window._vendFaEnCours = _vendFaEnCours;
window._vendSuivie = _vendSuivie;
window._vendDecD20 = _vendDecD20;
window._recKg = _recKg;
window._recCaisses = _recCaisses;
window._recKgDom = _recKgDom;
window._recCsDom = _recCsDom;
window._recSold = _recSold;
window._vendRdtBase = _vendRdtBase;
window._vendVolLoge = _vendVolLoge;
window._vendSortiesHl = _vendSortiesHl;
window._vendPrelevHl = _vendPrelevHl;
window._vendVolContenu = _vendVolContenu;
window._vendSrcLbl = _vendSrcLbl;
window._vendSurfLbl = _vendSurfLbl;
window._vendHaTxt = _vendHaTxt;
window._vendRdtParc = _vendRdtParc;
window._vendRendKgHl = _vendRendKgHl;
window._vendParcSurf = _vendParcSurf;
window._vendSheet = _vendSheet;
window._vendOpLbl = _vendOpLbl;
window._vendMoyLbl = _vendMoyLbl;
window._vendHlKg = _vendHlKg;
window._vendCuvKgDom = _vendCuvKgDom;
window._vendCuvF1 = _vendCuvF1;
window._vendParcByName = _vendParcByName;
window._vendSaveParcelles = _vendSaveParcelles;
window._vendParcLot = _vendParcLot;
window._vendOngletCuves = _vendOngletCuves;
window._matSuc = _matSuc;
window._vendMatSvg = _vendMatSvg;
window._MAT_CAMP_J = _MAT_CAMP_J;
window._matNorm = _matNorm;
window._matJours = _matJours;
