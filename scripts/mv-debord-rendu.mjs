#!/usr/bin/env node
// =============================================================================
// Ma Vigne — LA RÈGLE DES DÉBORDEMENTS, MESURÉE SUR LE BUILD (DEBORD-1, §593)
// -----------------------------------------------------------------------------
// Lancer :  npm run build (ou, sans la chaîne : node scripts/mv-gt-page.mjs, npx vite build, inject-precache, mv-version-json)
//           npm run test:debord                       (CI : job « débordements »)
//           npm run test:debord -- --contre           (contre-épreuve : six défauts posés à l’écran doivent rougir, un par sorte)
//           npm run test:debord -- --largeurs 360,1366 (une partie des largeurs, pour aller vite pendant un lot ; la CI joue tout)
//           npm run test:debord -- --ecran "Cave ›"    (les écrans dont la clé contient ce texte)
// Bac à sable de Claude : MV_CHROMIUM=<chemin d’un Chromium>.
//
// POURQUOI. Nico, le 18/11 : « fais aussi une vérif des graphismes, exemple la bulle rouge de 2 cuves demandent… qui déborde,
// il ne faut plus voir ce genre de problème ». La bulle rouge du Pilotage peignait son fond SOUS sa bordure transparente (la
// zone de toucher de MOTS-5B) ; aucun des 780 contrôles ne la voyait : ils lisent les sources, ou mesurent des mots, des
// tailles et des contrastes, jamais une boîte qui sort d’une autre. Le relevé du 18/11 en a trouvé vingt autres, à 360 px
// comme à 1 024 ou 1 280 (§593a). UNE RÈGLE, PAS UN CLIQUET : un débordement rougit toujours, il se corrige.
// ★ LES ÉCRANS : les 46 de mv-mots-rendu.mjs (UNE seule liste, lue dans ce fichier-là), à SEPT LARGEURS — 360, 390 et 412
//   (les téléphones), 768 (la tablette debout), 1 024 (couchée, ou un petit portable), 1 280 et 1 366 (les ordinateurs). Les
//   défauts du 18/11 tenaient presque tous à une largeur : 1 024, où la colonne du milieu fait 290 à 420 px.
// ★ L’ÉTAT : la démo à l’horloge du 27/10 9 h, plus DEUX CUVES EN ALERTE (31 °C au dernier relevé) — la démo seule n’a pas
//   d’alerte de cave, et la bulle rouge ne se dessine qu’en alerte. Les variantes rares se posent ici, pas dans la démo.
// ★ CE QUI EST CHERCHÉ, dans la page active (hors bandeau, ligne d’écran, SVG, carte Leaflet) :
//   ① un texte qui sort de sa boîte peinte (pastille, bouton, carte), ou coupé net (sans « … ») par une boîte basse ;
//   ② une boîte peinte qui sort de la boîte peinte qui la contient, ou de l’écran (hors positionnée : bulle, pastille d’angle) ;
//   ③ un fond peint SOUS une bordure transparente (une zone de toucher qui se voit — la bulle rouge du 18/11) ;
//   ④ un texte recouvert par une autre boîte peinte (elementFromPoint, la page défilée) ;
//   ⑤ deux textes qui s’écrivent l’un sur l’autre ;
//   ⑥ un texte collé au bord d’une carte bordée (aucune marge intérieure).
//   Un défilement horizontal voulu (un tableau, une rangée de puces) n’est pas un débordement ; une liste repliée coupe ses
//   lignes en bas exprès ; un texte qui finit en « … » est abrégé, pas coupé ; une barre fixe passe au-dessus du contenu.
// ⚠️ Pas regardé : les fenêtres qui s’ouvrent par-dessus, la fiche d’une personne, le thème sombre, la vue de l’équipe, une
//   largeur entre deux de la liste. Le rendu reste à REGARDER sur un vrai téléphone : ce contrôle garde ce qui a été corrigé.
// =============================================================================
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), RACINE = path.resolve(ICI, '..'), DIST = path.join(RACINE, 'dist');
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/ absent : npm run build d’abord'); process.exit(2); }
let playwright; try { playwright = await import('playwright'); } catch (e) { console.error('Playwright absent : npm i, puis npx playwright install chromium'); process.exit(2); }
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre');
const opt = (k) => { const i = ARGS.indexOf(k); return i >= 0 ? String(ARGS[i + 1] || '') : ''; };
const HORLOGE = '2026-10-27T08:00:00Z';   // mardi 27 octobre 2026, 9 h à Paris — celle des mots et de l’expérience d’usage
const LARGEURS = (opt('--largeurs') || '360,390,412,768,1024,1280,1366').split(',').map(Number).filter((n) => n > 0);
const FILTRE = opt('--ecran');

// LES ÉCRANS : ceux du cliquet des mots, lus dans son source (une seule liste : un écran ajouté là est regardé ici).
const SRC_MOTS = fs.readFileSync(path.join(ICI, 'mv-mots-rendu.mjs'), 'utf8');
const a0 = SRC_MOTS.indexOf('const J = (s)'), a1 = SRC_MOTS.indexOf('const TAILLES');
if (a0 < 0 || a1 < a0) { console.error('la liste des écrans est introuvable dans mv-mots-rendu.mjs (const J … const TAILLES)'); process.exit(2); }
const ECRANS = (0, eval)('(() => { ' + SRC_MOTS.slice(a0, a1) + '; return ECRANS; })()');

// L’ÉTAT : deux cuves en alerte (la bulle rouge du Pilotage, « 2 cuves demandent un contrôle »).
const ETAT = "(function(){ var n=0; (window.CAVE_VENDANGE&&CAVE_VENDANGE.cuves_vinif||[]).forEach(function(c){ if(n>=2||!window._vendIsActive||!_vendIsActive(c)) return; var lm=window._vendLastMes&&_vendLastMes(c); if(lm){ lm.temp_c=31; n++; } }); return n; })()";

// LES DÉFAUTS de la contre-épreuve : un par sorte, posés dans Pilotage › Aujourd’hui › Terrain. Chacun doit être trouvé.
const DEFAUTS = [
  ['texte hors de sa boîte', '<span style="display:inline-block;width:40px;white-space:nowrap;background:#eee;font-size:14px">Un texte bien trop long pour sa pastille</span>'],
  ['boîte hors de sa carte', '<div style="background:#fff;border:1px solid #ccc;width:200px;padding:8px"><div style="background:#fcc;width:320px;height:20px"></div></div>'],
  ['fond sous la zone de toucher', '<button style="background:#fcc;border:0 solid transparent;border-width:0 8px 16px;font-size:12px">bulle</button>'],
  ['texte recouvert', '<div style="position:relative;height:40px"><span style="font-size:14px">Texte recouvert par une boîte</span><div style="position:absolute;left:0;top:0;width:200px;height:30px;background:#cfc"></div></div>'],
  ['textes superposés', '<div style="position:relative;height:40px"><span style="position:absolute;left:0;top:0;font-size:14px">Premier texte écrit ici</span><span style="position:absolute;left:10px;top:2px;font-size:14px">Second texte écrit dessus</span></div>'],
  ['texte collé au bord', '<div style="border:1px solid #ccc;padding:0;width:240px;min-height:48px;background:#fff">Le texte touche le bord de sa carte</div>'],
];

// LE RELEVÉ D’UN ÉCRAN (exécuté dans le navigateur).
// MOTS-10 (§594) — LA CONTRE-ÉPREUVE INVERSE : un tableau qui défile de côté dans une carte bordée, son texte au ras du bord. Ce n'est
//   PAS un débordement (le bord est celui du défilement) : la règle ne doit pas le trouver. Sans elle, la CI rougissait au gré de la
//   largeur des colonnes (« 0 € », Économie › Le détail, 390 px, 18/11).
const PAS_DEFAUT = '<div style="border:1px solid #ccc;padding:0;width:240px;min-height:48px;background:#fff"><div style="overflow-x:auto"><div style="width:600px">Ce tableau défile de côté et continue plus loin</div></div></div>';
const DEBORD = () => {
  const pg = document.querySelector('.page.active'); if (!pg) return { absente: true };
  const out = []; const transp = (c) => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
  const vis = (el) => { try { if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; } catch (e) {} const r = el.getBoundingClientRect(); return r.width >= 2 && r.height >= 2; };
  const peint = (el) => { const cs = getComputedStyle(el); if (!transp(cs.backgroundColor) || cs.backgroundImage !== 'none') return true;
    return ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && !transp(cs['border' + s + 'Color'])); };
  const clip = (el) => { const cs = getComputedStyle(el); return cs.overflowX !== 'visible' || cs.overflowY !== 'visible'; };
  const nom = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; const c = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 3); if (c.length) s += '.' + c.join('.'); return s; };
  const exclu = (el) => !!el.closest('svg, .leaflet-container, .mod-header, .mv-ecran, canvas, script, style, [aria-hidden="true"] *');
  const W = window.innerWidth;
  const defile = (el) => { let a = el.parentElement; while (a && a !== document.body) { const c = getComputedStyle(a); if (/(auto|scroll)/.test(c.overflowX)) return true; a = a.parentElement; } return false; };
  // ① un texte qui sort de sa boîte peinte (bulle, pastille, bouton, carte), ou coupé sans « … »
  const tw = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); const vus = new Set();
  while (tw.nextNode()) { const t = tw.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || exclu(el) || !vis(el)) continue;
    const cse = getComputedStyle(el); if (parseFloat(cse.fontSize) < 2) continue;
    const r = document.createRange(); r.selectNodeContents(t); const rs = Array.from(r.getClientRects()).filter((x) => x.width > 0.5 && x.height > 0.5); if (!rs.length) continue;
    let b = el, mode = '';
    while (b && b !== document.body) { if (clip(b)) { mode = 'clip'; break; } if (peint(b)) { mode = 'peint'; break; } b = b.parentElement; }
    if (!b || b === document.body) b = null;
    const R = b ? b.getBoundingClientRect() : { left: 0, right: W, top: -1e9, bottom: 1e9 };
    if (mode === 'clip') { const cs = getComputedStyle(b); if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY)) continue; if (cse.textOverflow === 'ellipsis' || getComputedStyle(b).textOverflow === 'ellipsis') continue; }
    const dx = Math.max(...rs.map((x) => Math.max(R.left - x.left, x.right - R.right)));
    // une liste repliée coupe ses lignes en bas, exprès : la coupe verticale ne compte que dans une boîte basse (une pastille, un bouton)
    let dy = Math.max(...rs.map((x) => Math.max(R.top - x.top, x.bottom - R.bottom)));
    if (mode === 'clip' && R.bottom - R.top > 80) dy = 0;
    const dW = defile(el) ? 0 : Math.max(...rs.map((x) => x.right - W));
    if (dx > 1.5 || dy > 3 || dW > 1) { const k = (b ? nom(b) : 'écran') + '|' + t.nodeValue.trim().slice(0, 40); if (vus.has(k)) continue; vus.add(k);
      const bb = b ? b.getBoundingClientRect() : null;
      out.push({ type: mode === 'clip' ? 'texte coupé' : (b ? 'texte hors de sa boîte' : 'texte hors écran'), dx: Math.round(dx), dy: Math.round(dy), dW: Math.round(dW), boite: b ? nom(b) : 'écran', txt: t.nodeValue.trim().slice(0, 70),
        rect: bb ? [Math.round(bb.left), Math.round(bb.top + scrollY), Math.round(bb.width), Math.round(bb.height)] : null }); } }
  // ② une boîte peinte qui sort de la boîte peinte qui la contient (ou de l'écran)
  pg.querySelectorAll('*').forEach((e) => { if (exclu(e) || !vis(e) || !peint(e)) return; const cs = getComputedStyle(e); if (/absolute|fixed|sticky/.test(cs.position)) return;
    let a = e.parentElement, m = ''; while (a && a !== document.body) { if (clip(a)) { m = 'clip'; break; } if (peint(a)) { m = 'peint'; break; } a = a.parentElement; }
    const r = e.getBoundingClientRect(); const dW = defile(e) ? 0 : r.right - W;
    if (a && a !== document.body) { const ca = getComputedStyle(a); if (m === 'clip' && /(auto|scroll)/.test(ca.overflowX)) return; const A = a.getBoundingClientRect();
      const dx = Math.max(A.left - r.left, r.right - A.right);
      if (dx > 1.5) out.push({ type: m === 'clip' ? 'boîte coupée' : 'boîte hors de sa carte', dx: Math.round(dx), boite: nom(e), dans: nom(a), txt: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), rect: [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)] });
    } else if (dW > 1) out.push({ type: 'boîte hors écran', dx: Math.round(dW), boite: nom(e), txt: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), rect: [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)] });
  });
  // ⑥ un texte collé au bord de sa carte (aucune marge intérieure) : on lit le bord gauche et le bord droit d'une boîte bordée
  { const tw6 = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); const vus6 = new Set();
    const ell6 = (e) => { for (let k = 0; k < 4 && e; k++, e = e.parentElement) if (getComputedStyle(e).textOverflow === 'ellipsis') return true; return false; };
    while (tw6.nextNode()) { const t = tw6.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || exclu(el) || !vis(el) || ell6(el)) continue;
      let b = el; while (b && b !== document.body && !peint(b)) b = b.parentElement; if (!b || b === document.body || b === pg) continue;
      // ★ MOTS-10 (§594) : un texte dans un tableau qui DÉFILE DE CÔTÉ (entre lui et la carte, un défilement qui déborde) touche le
      //   bord du défilement, pas celui de la carte : la suite du tableau est derrière. Sur la CI (18/11), « 0 € » d'Économie › Le
      //   détail tombait à 2 px du bord à 390 px ; ici, à 8 px — la largeur des colonnes varie d'un Chromium à l'autre.
      let sc6 = false; for (let a = el; a && a !== b; a = a.parentElement) { const ca = getComputedStyle(a); if (/(auto|scroll)/.test(ca.overflowX) && a.scrollWidth > a.clientWidth + 1) { sc6 = true; break; } }
      if (sc6) continue;
      const cs = getComputedStyle(b); const bord = (s) => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && !transp(cs['border' + s + 'Color']);
      if (!bord('Left') && !bord('Right')) continue; if (/^(TD|TH|TR|TABLE|INPUT|SELECT|TEXTAREA)$/.test(b.tagName)) continue;
      const R = b.getBoundingClientRect(); if (R.height < 40 || R.width < 120 || /^app-|^page-/.test(b.id || '')) continue;   // une pastille, un bouton : leur dessin est serré exprès
      const r = document.createRange(); r.selectNodeContents(t); const rs = Array.from(r.getClientRects()).filter((q) => q.width > 2);
      const g = Math.min(...rs.map((q) => q.left - R.left)), d = Math.min(...rs.map((q) => R.right - q.right));
      if ((bord('Left') && g < 4 && g > -1) || (bord('Right') && d < 4 && d > -1)) { const k = nom(b); if (vus6.has(k)) continue; vus6.add(k);
        out.push({ type: 'texte collé au bord', dx: Math.round(Math.min(g, d)), boite: nom(b), txt: t.nodeValue.trim().slice(0, 50), rect: [Math.round(R.left), Math.round(R.top + scrollY), Math.round(R.width), Math.round(R.height)] }); } } }
  // ③ un fond peint SOUS une bordure transparente (la zone de toucher) : la bulle déborde de son dessin
  pg.querySelectorAll('*').forEach((e) => { if (exclu(e) || !vis(e)) return; const cs = getComputedStyle(e); if (transp(cs.backgroundColor) && cs.backgroundImage === 'none') return;
    if (cs.backgroundClip !== 'border-box') return;
    const tr = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs['border' + s + 'Width']) >= 2 && cs['border' + s + 'Style'] !== 'none' && transp(cs['border' + s + 'Color']));
    if (tr.length) { const r = e.getBoundingClientRect(); out.push({ type: 'fond sous la zone de toucher', dx: Math.max(...tr.map((s) => Math.round(parseFloat(cs['border' + s + 'Width'])))), boite: nom(e), txt: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), rect: [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)] }); } });
  const fixe = (x) => { let a = x; while (a && a !== document.body) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return true; a = a.parentElement; } return false; };
  // ⑤ deux textes qui s'écrivent l'un sur l'autre (aucune boîte peinte entre eux : ④ ne les voit pas)
  { const L = []; const tw5 = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
    while (tw5.nextNode()) { const t = tw5.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || exclu(el) || !vis(el) || fixe(el)) continue; if (parseFloat(getComputedStyle(el).fontSize) < 2) continue;
      const clips = []; for (let a = el; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') clips.push(a.getBoundingClientRect()); }
      const r = document.createRange(); r.selectNodeContents(t);
      Array.from(r.getClientRects()).forEach((q) => { if (q.width < 3 || q.height < 6) return; let x0 = q.left, x1 = q.right, y0 = q.top, y1 = q.bottom;
        clips.forEach((c) => { x0 = Math.max(x0, c.left); x1 = Math.min(x1, c.right); y0 = Math.max(y0, c.top); y1 = Math.min(y1, c.bottom); });
        if (x1 - x0 < 3 || y1 - y0 < 6) return; L.push({ x0, x1, y0: y0 + scrollY, y1: y1 + scrollY, el, t: t.nodeValue.trim() }); }); }
    const B = new Map(); L.forEach((q, i) => { for (let k = Math.floor(q.y0 / 24); k <= Math.floor(q.y1 / 24); k++) { if (!B.has(k)) B.set(k, []); B.get(k).push(i); } });
    const vus5 = new Set();
    B.forEach((ids) => { for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const p = L[ids[a]], q = L[ids[b]]; if (p.el === q.el || p.el.contains(q.el) || q.el.contains(p.el)) continue;
      const ix = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), iy = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0); if (ix <= 2 || iy <= 3) continue;
      const aire = ix * iy, petite = Math.min((p.x1 - p.x0) * (p.y1 - p.y0), (q.x1 - q.x0) * (q.y1 - q.y0)); if (aire < petite * 0.25) continue;
      const k = p.t.slice(0, 20) + '|' + q.t.slice(0, 20); if (vus5.has(k)) continue; vus5.add(k);
      out.push({ type: 'textes superposés', dx: Math.round(ix), boite: nom(p.el), dans: nom(q.el), txt: p.t.slice(0, 30) + ' ⟂ ' + q.t.slice(0, 30), rect: [Math.round(Math.max(p.x0, q.x0)), Math.round(Math.max(p.y0, q.y0)), Math.round(ix), Math.round(iy)] }); } }); }
  // ④ un texte recouvert par une autre boîte (on fait défiler la page : elementFromPoint ne voit que l'écran)
  const txts = []; const tw2 = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
  const ellipse = (el) => { let a = el; for (let k = 0; k < 4 && a; k++, a = a.parentElement) if (getComputedStyle(a).textOverflow === 'ellipsis') return true; return false; };
  while (tw2.nextNode()) { const t = tw2.currentNode; if (!t.nodeValue.trim()) continue; const el = t.parentElement; if (!el || exclu(el) || !vis(el) || fixe(el) || ellipse(el)) continue; if (parseFloat(getComputedStyle(el).fontSize) < 2) continue; txts.push({ t, el }); }
  const H = Math.max(document.documentElement.scrollHeight, pg.scrollHeight), VH = window.innerHeight, faits = new Set(), vus4 = new Set();
  for (let y = 0; y < H; y += Math.round(VH * 0.7)) { window.scrollTo(0, y);
    txts.forEach((x, i) => { if (faits.has(i)) return; const r = document.createRange(); r.selectNodeContents(x.t); const rs = Array.from(r.getClientRects()).filter((q) => q.width > 4 && q.height > 4);
      if (!rs.length) { faits.add(i); return; } if (!rs.every((q) => q.top >= 0 && q.bottom <= VH)) return; faits.add(i);
      const clips = []; for (let a = x.el.parentElement; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') clips.push(a.getBoundingClientRect()); }
      for (const q of rs) { for (const fx of [0.2, 0.5, 0.8]) { const px = q.left + q.width * fx, py = q.top + q.height / 2; if (px < 0 || px >= W) continue;
        if (clips.some((c) => px < c.left || px > c.right || py < c.top || py > c.bottom)) continue;   // caché par une boîte qui coupe (une liste repliée) : pas recouvert
        const hit = document.elementFromPoint(px, py);
        if (!hit || hit === x.el || x.el.contains(hit) || hit.contains(x.el) || fixe(hit) || hit.closest('.mod-header, .mv-ecran')) continue;
        if (!/^(IMG|SVG|CANVAS|INPUT|SELECT|TEXTAREA|VIDEO)$/i.test(hit.tagName) && !peint(hit)) continue;   // une boîte sans fond ne cache rien
        try { if (!hit.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue; } catch (e) {}
        if (parseFloat(getComputedStyle(hit).opacity) < 0.05) continue;
        const hb = hit.getBoundingClientRect(); if (px < hb.left || px > hb.right || py < hb.top || py > hb.bottom) continue;   // une zone de toucher (::before transparent) hors de la boîte
        let pe = x.el, sansPe = false; for (let k = 0; k < 4 && pe; k++, pe = pe.parentElement) if (getComputedStyle(pe).pointerEvents === 'none') { sansPe = true; break; } if (sansPe) continue;   // posé exprès par-dessus (une unité dans un champ)
        const k = nom(hit) + '|' + x.t.nodeValue.trim().slice(0, 30); if (vus4.has(k)) continue; vus4.add(k);
        out.push({ type: 'texte recouvert', dx: 0, boite: nom(hit), dans: nom(x.el), txt: x.t.nodeValue.trim().slice(0, 60), rect: [Math.round(q.left), Math.round(q.top + scrollY), Math.round(q.width), Math.round(q.height)] }); break; } } }); }
  window.scrollTo(0, 0);
  return { out, sw: document.documentElement.scrollWidth, W };
};
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(DIST, p);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
await new Promise((ok) => srv.on('listening', ok));
const U = 'http://localhost:' + srv.address().port;
const exe = process.env.MV_CHROMIUM || '';
const nav = await playwright.chromium.launch({ headless: true, ...(exe ? { executablePath: exe, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-zygote'] } : {}) });
let chromeV = ''; try { chromeV = nav.version(); } catch (e) { chromeV = ''; }   // MOTS-10 (§594) : dit avec quel navigateur la règle a mesuré
const pose = async (page) => { let avant = -1;
  for (let k = 0; k < 15; k++) { await page.waitForTimeout(200); const n = await page.evaluate(() => { const p = document.querySelector('.page.active'); return p ? p.innerText.length : -1; }); if (n === avant && k >= 1) return; avant = n; } };

const trouves = [], erreurs = []; let nbEcrans = 0, nbAlerte = -1;
const LARG_JOUEES = CONTRE ? [390, 1366] : LARGEURS;
const ECRANS_JOUES = CONTRE ? ECRANS.filter((e) => e[0] === 'Pilotage › Aujourd’hui › Terrain') : ECRANS.filter((e) => !FILTRE || e[0].includes(FILTRE));
// Deux largeurs à la fois (MV_DEBORD_PAR) : vingt minutes en file, un peu plus de cinq en deux (bac à sable, 18/11) — la CI a deux cœurs.
const PAR = Math.max(1, Number(process.env.MV_DEBORD_PAR) || 2);
async function relever(w) {
  const tel = w < 900;
  const ctx = await nav.newContext({ viewport: { width: w, height: tel ? 800 : 900 }, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Europe/Paris', locale: 'fr-FR', isMobile: tel, hasTouch: tel });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(HORLOGE) }); await page.clock.resume();
  await page.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(U) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  let chargements = 0; page.on('load', () => { chargements++; });
  page.on('pageerror', (e) => erreurs.push(w + ' px : ' + String(e && e.message).slice(0, 160)));
  const menage = () => page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); document.querySelectorAll('[id^="mvt"], [class^="mvt-"], [class*=" mvt-"]').forEach((e) => { e.style.display = 'none'; }); });
  try {
    await page.goto(U + '/?tenant=e2e-test', { waitUntil: 'domcontentloaded', timeout: 90000 });
    for (let k = 0; k < 40 && chargements < 2; k++) await page.waitForTimeout(250);
    await page.waitForFunction(() => window.__MV_BOOTED === true && typeof window._startDemoVisite === 'function', null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { if (window._mvTutoCharger) window._mvTutoCharger(); window.fbLoginDemo = async () => true; window._authReady = true; window._startDemoVisite(); });
    await page.waitForFunction(() => { const ls = document.getElementById('login-screen'); return !ls || ls.style.display === 'none'; }, null, { timeout: 30000 });
    await page.waitForTimeout(2500);
    nbAlerte = await page.evaluate((s) => (0, eval)(s), ETAT);
    await menage();
    let courante = '';
    for (const [cle, pg, gestes] of ECRANS_JOUES) {
      if (courante !== pg) { await page.evaluate((p) => { document.querySelectorAll('.overlay.open').forEach((o) => o.classList.remove('open')); window.goTo(p); window.scrollTo(0, 0); }, pg); await page.waitForTimeout(1500); courante = pg; }
      let rate = '';
      for (const g of gestes) {
        if (g.js) { const nom = g.js.slice(0, g.js.indexOf('('));
          const ok = await page.evaluate(([nom, src]) => { if (typeof window[nom] !== 'function') return false; (0, eval)('window.' + src); return true; }, [nom, g.js]); if (!ok) rate = 'window.' + nom + ' introuvable'; }
        else { const ok = await page.evaluate((t) => { const p = document.querySelector('.page.active'); const e = p && Array.from(p.querySelectorAll('button,[onclick],[role=tab]')).find((x) => !x.closest('.mod-header,.mv-ecran') && x.getBoundingClientRect().width > 0 && x.textContent.trim() === t); if (e) e.click(); return !!e; }, g.clic);
          if (!ok) rate = 'le bouton « ' + g.clic + ' » introuvable'; }
        if (rate) break; await pose(page);
      }
      if (rate) { erreurs.push(w + ' px › ' + cle + ' : ' + rate); continue; }
      await page.evaluate(() => window.scrollTo(0, 0)); await pose(page); await menage();
      if (CONTRE) await page.evaluate((defs) => { const p = document.querySelector('.page.active'); const h = p.querySelector('.ck-page') || p;
        defs.forEach(([, html]) => { const d = document.createElement('div'); d.className = 'mv-contre'; d.style.cssText = 'margin:16px;max-width:300px'; d.innerHTML = html; h.prepend(d); }); }, DEFAUTS.concat([['', PAS_DEFAUT]]));
      const m = await page.evaluate(DEBORD);
      if (m.absente) { erreurs.push(w + ' px › ' + cle + ' : aucune page active'); continue; }
      nbEcrans++;
      (m.out || []).forEach((x) => trouves.push(Object.assign({ largeur: w, ecran: cle }, x)));
    }
  } catch (e) { erreurs.push(w + ' px ARRÊT : ' + e.message); }
  await ctx.close();
}
const file = LARG_JOUEES.slice();
await Promise.all(Array.from({ length: Math.min(PAR, file.length) }, async () => { while (file.length) await relever(file.shift()); }));
await nav.close(); srv.close();

console.log('\n\x1b[1mMA VIGNE — La règle des débordements, mesurée sur le build\x1b[0m  (' + nbEcrans + ' écrans relevés à ' + LARG_JOUEES.join(', ') + ' px, horloge au 27/10/2026 9 h, deux cuves en alerte' + (chromeV ? ', Chromium ' + chromeV : '') + ')');
let ko = 0;
const t = (nom, cond, det) => { if (cond) console.log('  \x1b[32m✓\x1b[0m ' + nom); else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
t('les écrans ont été relevés, sans erreur de page ni onglet introuvable', nbEcrans === LARG_JOUEES.length * ECRANS_JOUES.length && !erreurs.length, erreurs.slice(0, 6).join(' · '));
t('l’état est posé : deux cuves en alerte', nbAlerte === 2, 'cuves passées à 31 °C : ' + nbAlerte);
if (CONTRE) {
  const sortes = DEFAUTS.map(([s]) => s);
  sortes.forEach((s) => t('contre-épreuve : « ' + s + ' » est trouvé', trouves.some((x) => x.type === s), 'pas trouvé'));
  t('contre-épreuve inverse : un tableau qui défile de côté, texte au ras du bord, n’est pas trouvé', !trouves.some((x) => /défile de côté/.test(x.txt || '')),
    trouves.filter((x) => /défile de côté/.test(x.txt || '')).map((x) => x.type).join(', '));
  const n = sortes.filter((s) => trouves.some((x) => x.type === s)).length;
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + n + '/' + sortes.length + ' défauts posés sont trouvés');
  process.exit(ko ? 1 : 0);
}
const parType = {}; trouves.forEach((x) => { parType[x.type] = (parType[x.type] || 0) + 1; });
t('aucun débordement (texte hors de sa boîte, boîte hors de sa carte, fond sous la zone de toucher, texte recouvert, textes superposés, texte collé au bord, texte coupé)', trouves.length === 0,
  trouves.length + ' : ' + Object.entries(parType).map(([k, n]) => n + ' ' + k).join(', '));
trouves.slice(0, 40).forEach((x) => console.log('      ' + x.largeur + ' px · ' + x.ecran + ' · ' + x.type + ' (' + x.dx + ' px) · ' + x.boite + (x.dans ? ' / ' + x.dans : '') + ' · « ' + x.txt + ' »'));
if (trouves.length > 40) console.log('      … et ' + (trouves.length - 40) + ' de plus');
// ★ MOTS-10 (§594) : SUR LA CI, CE QUI EST TROUVÉ SE LIT SANS OUVRIR LE JOURNAL. Le 18/11, le job a rougi sur une PR qui ne
//   touchait que ci.yml, et la machine de Claude (Chromium de Playwright, polices réduites à celles de la CI) restait verte : le
//   détail n'était que dans le journal de l'étape. Une annotation par trouvaille (les dix premières) et un tableau dans le résumé
//   du job : l'écran, la largeur, la sorte, le texte — visibles sur la page du run.
if (process.env.GITHUB_ACTIONS) {
  const esc = (v) => String(v == null ? '' : v).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  erreurs.slice(0, 10).forEach((e) => console.log('::error title=Débordements — relevé incomplet::' + esc(e)));
  trouves.slice(0, 10).forEach((x) => console.log('::error title=Débordement ' + x.largeur + ' px::' + esc(x.ecran + ' · ' + x.type + ' (' + x.dx + ' px) · ' + x.boite + (x.dans ? ' / ' + x.dans : '') + ' · « ' + x.txt + ' »')));
  const res = process.env.GITHUB_STEP_SUMMARY;
  if (res) {
    const cel = (v) => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    let md = '### Débordements — ' + (ko ? '❌ ' + ko + ' échec(s)' : '✅ aucun') + ' · ' + nbEcrans + ' écrans relevés' + (chromeV ? ' · Chromium ' + chromeV : '') + '\n\n';
    if (erreurs.length) md += '**Relevé incomplet** : ' + erreurs.slice(0, 10).map(cel).join(' · ') + '\n\n';
    if (trouves.length) md += '| largeur | écran | sorte | écart | boîte | texte |\n|---|---|---|---|---|---|\n'
      + trouves.slice(0, 60).map((x) => '| ' + x.largeur + ' px | ' + cel(x.ecran) + ' | ' + cel(x.type) + ' | ' + x.dx + ' px | ' + cel(x.boite + (x.dans ? ' / ' + x.dans : '')) + ' | « ' + cel(x.txt) + ' » |').join('\n') + '\n';
    try { fs.appendFileSync(res, md + '\n'); } catch (e) { console.log('résumé du job non écrit : ' + e.message); }
  }
}
console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + (ko ? ko + ' échec(s)' : 'aucun débordement'));
process.exit(ko ? 1 : 0);
