// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ★★ COQ-1 + PAL-1 (§268) — LA BARRE LATÉRALE ET LA RECHERCHE CTRL K, SUR ORDINATEUR SEULEMENT
// Nico (07/10) : « la barre latérale et Ctrl K […] que sur PC ». Celles de la maquette validée, branchées sur l'appli :
//   • la barre reprend les ENTRÉES DU DOCK (_dockDef : mêmes droits, mêmes modules vendus, Réglages jamais retiré) et
//     sa navigation (_dockGo) ; elle remplace le dock à partir de 1 024 px, le téléphone et la tablette gardent le dock ;
//   • repliable (choix mémorisé), rubriques, domaine en tête, la personne connectée en bas ;
//   • Ctrl K (ou ⌘K, ou « / » hors d'un champ) ouvre la recherche : écrans, onglets du Pilotage, parcelles.
// Rien n'est dupliqué : un module ajouté au dock arrive dans la barre et dans la recherche.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
(() => {
'use strict';
const MQ_PC = (typeof matchMedia === 'function') ? matchMedia('(min-width: 1024px)') : { matches: false, addEventListener() {} };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ico = (n, t) => (typeof window._mvIcon === 'function') ? window._mvIcon(n, t || 20) : '';
const RUB = { home: 'Terrain', phyto: 'Terrain', tracteur: 'Terrain', planning: 'Organisation', cave: 'Cave et réserve', reserve: 'Cave et réserve', pilotage: 'Gestion', reglages: 'Gestion' };
const ORDRE_RUB = ['Terrain', 'Organisation', 'Cave et réserve', 'Gestion'];
const ONGLETS_PIL = [['auj', 'Aujourd’hui'], ['avc', 'La campagne'], ['equ', 'L’équipe et les tâches'], ['sim', 'Simuler'], ['eco', 'Économie'], ['an', 'L’année'], ['cfm', 'Conformité']];

// Les rubriques de la barre, dans l'ordre du dock à l'intérieur de chacune.
window._railRubriques = function (items) {
  const g = {};
  (items || []).forEach(x => { const r = RUB[x.p] || 'Gestion'; (g[r] = g[r] || []).push(x); });
  return ORDRE_RUB.filter(r => g[r]).map(r => ({ nom: r, items: g[r] }));
};
function domaine() {
  const C = window.CONFIG || {}, P = window.PARCELLES || [], M = window.MEMBRES || [];
  const ha = P.filter(p => p && !/arrach/i.test(String(p.statut || ''))).reduce((s, p) => s + (Number(p.surface) || 0), 0);
  const n = M.filter(m => m && m.statut !== 'Inactif').length;
  return { nom: C.domaine_nom || window.DOMAINE_NOM || 'Ma Vigne', sous: (ha ? ha.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u202fha' : '') + (n ? (ha ? ', ' : '') + n + ' personne' + (n > 1 ? 's' : '') : '') };
}
window._railHtml = function (items, moi, dom) {
  const rub = window._railRubriques(items);
  return '<div class="mv-rail-dom"><img class="mv-rail-logo" src="/icon-192.png" alt=""><span class="mv-rail-lbl"><b>' + esc(dom.nom) + '</b><small>' + esc(dom.sous) + '</small></span></div>'
    + '<button class="mv-rail-cherche" id="mv-rail-cherche" type="button" aria-label="Rechercher" data-tip="Rechercher, Ctrl K">' + ico('loupe', 18) + '<span class="mv-rail-lbl">Rechercher</span><kbd class="mv-rail-lbl">Ctrl K</kbd></button>'
    + rub.map(r => '<p class="mv-rail-sec"><span class="mv-rail-lbl">' + esc(r.nom) + '</span></p>' + r.items.map(x =>
      '<button class="mv-rail-b" type="button" data-page="' + esc(x.p) + '" data-tip="' + esc(x.l) + '" aria-label="' + esc(x.l) + '">' + ico(x.ic, 20)
      + '<span class="mv-rail-lbl">' + esc(x.l) + '</span>' + (x.p === 'pilotage' ? '<span class="mv-rail-vif" aria-hidden="true"></span>' : '') + '</button>').join('')).join('')
    + '<div class="mv-rail-bas"><div class="mv-rail-moi" data-tip="' + esc(moi.nom + ', ' + moi.role) + '"><span class="mv-rail-av">' + esc(moi.ini) + '</span>'
    + '<span class="mv-rail-lbl"><b>' + esc(moi.nom) + '</b><small>' + esc(moi.role) + '</small></span></div>'
    + '<button class="mv-rail-plier" id="mv-rail-plier" type="button" aria-expanded="true" aria-label="Réduire la barre" data-tip="Déplier la barre">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6"/></svg><span class="mv-rail-lbl">Réduire</span></button></div>';
};
function ouvert() { try { const v = localStorage.getItem('mv-rail'); return v != null ? v === '1' : window.innerWidth >= 1500; } catch (e) { return window.innerWidth >= 1500; } }
function plier(on, garder) {
  document.body.classList.toggle('mv-rail-ouvert', !!on);
  const b = document.getElementById('mv-rail-plier');
  if (b) { b.setAttribute('aria-expanded', String(!!on)); b.setAttribute('aria-label', on ? 'Réduire la barre' : 'Déplier la barre'); }
  if (garder) { try { localStorage.setItem('mv-rail', on ? '1' : '0'); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/plier'); /* stockage indisponible : le choix vaut pour la session */ } }
}
window._railBuild = function () {
  const u = window.currentUser;
  let r = document.getElementById('mv-rail');
  if (!u || u._isGTAdmin || typeof window._dockDef !== 'function') { if (r) r.remove(); document.body.classList.remove('mv-avec-rail'); return; }
  if (!r) {
    r = document.createElement('nav'); r.id = 'mv-rail'; r.className = 'mv-rail'; r.setAttribute('aria-label', 'Modules');
    document.body.appendChild(r);
    r.addEventListener('click', ev => {
      const b = ev.target.closest('.mv-rail-b'); if (b && typeof window._dockGo === 'function') { window._dockGo(b.getAttribute('data-page')); return; }
      if (ev.target.closest('#mv-rail-cherche')) { window._palOuvrir(); return; }
      if (ev.target.closest('#mv-rail-plier')) plier(!document.body.classList.contains('mv-rail-ouvert'), true);
    });
  }
  const nom = String(u.nom || u.email || 'Moi'), admin = (typeof window.isAdmin === 'function') && window.isAdmin();
  r.innerHTML = window._railHtml(window._dockDef(), { nom, ini: nom.charAt(0).toUpperCase(), role: admin ? 'Administration' : 'Équipe' }, domaine());
  document.body.classList.add('mv-avec-rail');
  plier(ouvert(), false);
  const act = document.querySelector('.page.active'); window._railSync(act ? act.id.replace('page-', '') : '');
};
window._railSync = function (page) {
  document.querySelectorAll('#mv-rail .mv-rail-b').forEach(b => { if (b.getAttribute('data-page') === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
};

// ── LA RECHERCHE (Ctrl K) : écrans, onglets du Pilotage, parcelles ──────────────────────────────────
const sansAccent = s => String(s || '').toLowerCase().replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/ç/g, 'c');
window._palEntrees = function (items, parcs) {
  const e = [];
  (items || []).forEach(x => e.push({ g: 'Écrans', t: x.l, s: 'Ouvrir le module', ic: x.ic, go: { page: x.p } }));
  if ((items || []).some(x => x.p === 'pilotage')) ONGLETS_PIL.forEach(([k, l]) => e.push({ g: 'Pilotage', t: l, s: 'Onglet du Pilotage', ic: 'graphique', go: { page: 'pilotage', tab: k } }));
  (parcs || []).forEach(p => { if (p && p.nom) e.push({ g: 'Parcelles', t: p.nom, s: [p.appellation, p.surface ? String(p.surface).replace('.', ',') + '\u202fha' : ''].filter(Boolean).join(', '), ic: 'feuille', go: { parc: p.nom } }); });
  return e;
};
// Le classement : le titre qui COMMENCE par la recherche, puis le titre qui la contient, puis le sous-titre.
window._palTrier = function (entrees, q) {
  const n = sansAccent(q).trim();
  if (!n) return entrees.filter(x => x.g !== 'Parcelles').slice(0, 12);
  return entrees.map(x => { const t = sansAccent(x.t), s = sansAccent(x.s); return { x, sc: t.startsWith(n) ? 3 : t.includes(n) ? 2 : s.includes(n) ? 1 : 0 }; })
    .filter(o => o.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 12).map(o => o.x);
};
function surligne(t, q) {
  const n = sansAccent(q).trim(), i = n ? sansAccent(t).indexOf(n) : -1;
  return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + n.length)) + '</mark>' + esc(t.slice(i + n.length));
}
let PAL = [], IDX = 0;
function palMonter() {
  if (document.getElementById('mv-pal')) return;
  const v = document.createElement('div'); v.className = 'mv-pal-voile'; v.id = 'mv-pal-voile'; v.hidden = true;
  const p = document.createElement('div'); p.className = 'mv-pal'; p.id = 'mv-pal'; p.hidden = true;
  p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', 'Rechercher dans Ma Vigne');
  p.innerHTML = '<div class="mv-pal-in">' + ico('loupe', 18) + '<input id="mv-pal-q" type="text" placeholder="Une parcelle, un écran, un onglet…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="mv-pal-l" aria-autocomplete="list"><kbd>Échap</kbd></div>'
    + '<ul class="mv-pal-l" id="mv-pal-l" role="listbox" aria-label="Résultats"></ul>'
    + '<div class="mv-pal-pied"><span><kbd>↑</kbd><kbd>↓</kbd> pour choisir</span><span><kbd>Entrée</kbd> pour ouvrir</span><span><kbd>Ctrl K</kbd> partout</span></div>';
  document.body.appendChild(v); document.body.appendChild(p);
  v.addEventListener('click', window._palFermer);
  p.addEventListener('click', ev => { const li = ev.target.closest('.mv-pal-i'); if (li) lancer(+li.getAttribute('data-k')); });
  const q = document.getElementById('mv-pal-q');
  q.addEventListener('input', () => { IDX = 0; rendre(); });
  q.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); IDX = Math.min(PAL.length - 1, IDX + 1); rendre(); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); IDX = Math.max(0, IDX - 1); rendre(); }
    else if (ev.key === 'Enter') { ev.preventDefault(); lancer(IDX); }
    else if (ev.key === 'Escape') { ev.preventDefault(); window._palFermer(); }
  });
}
function rendre() {
  const q = document.getElementById('mv-pal-q'), l = document.getElementById('mv-pal-l'); if (!q || !l) return;
  PAL = window._palTrier(window._palEntrees(typeof window._dockDef === 'function' ? window._dockDef() : [], window.PARCELLES), q.value);
  let g = '';
  l.innerHTML = PAL.length ? PAL.map((x, k) => (x.g !== g ? '<li class="mv-pal-g" role="presentation">' + esc(g = x.g) + '</li>' : '')
    + '<li class="mv-pal-i' + (k === IDX ? ' actif' : '') + '" role="option" aria-selected="' + (k === IDX) + '" data-k="' + k + '">' + ico(x.ic, 18)
    + '<span class="t">' + surligne(x.t, q.value) + '</span><span class="s">' + esc(x.s) + '</span></li>').join('')
    : '<li class="mv-pal-vide">Rien ne correspond. Essayez un nom de parcelle ou d’écran.</li>';
}
function lancer(k) {
  const x = PAL[k]; if (!x) return;
  window._palFermer();
  if (x.go.parc) { if (typeof window.openSelParc === 'function') window.openSelParc(x.go.parc); return; }
  if (typeof window._dockGo === 'function') window._dockGo(x.go.page);
  if (x.go.tab) setTimeout(() => { if (typeof window._pilSetTab === 'function') window._pilSetTab(x.go.tab); }, 60);
}
window._palOuvrir = function () {
  palMonter();
  const p = document.getElementById('mv-pal'), v = document.getElementById('mv-pal-voile'), q = document.getElementById('mv-pal-q');
  p.hidden = false; v.hidden = false; q.value = ''; IDX = 0; rendre();
  requestAnimationFrame(() => { p.classList.add('ouvert'); v.classList.add('ouvert'); q.focus(); });
};
window._palFermer = function () {
  const p = document.getElementById('mv-pal'), v = document.getElementById('mv-pal-voile'); if (!p || p.hidden) return;
  p.classList.remove('ouvert'); v.classList.remove('ouvert'); p.hidden = true; v.hidden = true;
};
document.addEventListener('keydown', ev => {
  if (!MQ_PC.matches || !window.currentUser) return;                // sur ordinateur, une fois connecté
  const champ = /input|textarea|select/i.test((ev.target && ev.target.tagName) || '') || (ev.target && ev.target.isContentEditable);
  const p = document.getElementById('mv-pal'), ouverte = p && !p.hidden;
  if ((ev.key === 'k' || ev.key === 'K') && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); if (ouverte) window._palFermer(); else window._palOuvrir(); return; }
  if (ev.key === '/' && !champ && !ouverte) { ev.preventDefault(); window._palOuvrir(); }
});
if (MQ_PC.addEventListener) MQ_PC.addEventListener('change', () => { if (!MQ_PC.matches) window._palFermer(); });
})();
