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
// RAIL-1 (§313) : l'ordre du dock, gardé par thèmes — le Pilotage en tête et Réglages au pied, hors rubrique.
const RUB = { home: 'Terrain', phyto: 'Terrain', tracteur: 'Terrain', cave: 'Cave et réserve', reserve: 'Cave et réserve', planning: 'Organisation' };
const ORDRE_RUB = ['Terrain', 'Cave et réserve', 'Organisation'];
const TETE = 'pilotage', PIED = 'reglages';
// PRO-1 (§269) : les onglets du Pilotage se LISENT dans _PIL_TABS (une liste écrite ici proposait « Simuler » et
//   « L’équipe et les tâches », deux noms disparus de la barre ; Archives manquait). Repli : les noms du jour.
const ONGLETS_PIL_REPLI = [['auj', 'Aujourd’hui'], ['an', 'L’année'], ['avc', 'La campagne'], ['equ', 'L’équipe & le matériel'], ['sim', 'Décider'], ['eco', 'Économie'], ['cfm', 'Conformité'], ['arc', 'Archives']];
const ongletsPil = () => { const T = window._PIL_TABS; return Array.isArray(T) && T.length ? T.filter(t => Array.isArray(t) && t[0]).map(t => [t[0], String(t[2] || t[0]).replace(/'/g, '’')]) : ONGLETS_PIL_REPLI; };
const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
const TOUCHE = MAC ? '⌘ K' : 'Ctrl K';
// PRO-1 : sous 1 200 px, la barre reste repliée d'office (le contenu garderait moins de 960 px) ; le choix de la
//   personne reprend au-dessus. Déplier à la main reste possible à toute largeur.
const MQ_LARGE = (typeof matchMedia === 'function') ? matchMedia('(min-width: 1200px)') : { matches: true, addEventListener() {} };

// Les rubriques de la barre, dans l'ordre du dock à l'intérieur de chacune ; la tête et le pied à part (RAIL-1).
window._railRubriques = function (items) {
  const g = {}, tete = [], pied = [];
  (items || []).forEach(x => { if (x.p === TETE) tete.push(x); else if (x.p === PIED) pied.push(x); else { const r = RUB[x.p] || 'Organisation'; (g[r] = g[r] || []).push(x); } });
  return { tete, rub: ORDRE_RUB.filter(r => g[r]).map(r => ({ nom: r, items: g[r] })), pied };
};
function domaine() {
  const C = window.CONFIG || {}, P = window.PARCELLES || [], M = window.MEMBRES || [];
  const ha = P.filter(p => p && !/arrach/i.test(String(p.statut || ''))).reduce((s, p) => s + (Number(p.surface) || 0), 0);
  const n = M.filter(m => m && m.statut !== 'Inactif').length;
  return { nom: C.domaine_nom || window.DOMAINE_NOM || 'Ma Vigne', sous: (ha ? ha.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u202fha' : '') + (n ? (ha ? ', ' : '') + n + ' personne' + (n > 1 ? 's' : '') : '') };
}
// ★ VIF-1 (§414) — LES PASTILLES D'ALERTE DE LA BARRE, lues dans des sources qui existent déjà (aucun calcul neuf) :
//   Tracteur : les engins en réparation (window.REPARATEUR, le registre que lit le Pilotage) ; Planning (admin) : les
//   contrats qui finissent dans les 30 jours (fin_contrat) ; Cave : ce qui presse (agenda de cave, verdict « dû », comme
//   la carte Cave) ; Pilotage (admin) : les points prioritaires d'« À savoir », comptés quand Aujourd'hui se calcule.
window._railAlertes = function () {
  const a = {}, admin = (typeof window.isAdmin === 'function') && window.isAdmin();
  try { const R = window.REPARATEUR || {}; a.tracteur = (window.TRACTEURS_LIST || []).filter(t => t && R[t.id]).length; } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/alertes#trac'); }
  if (admin) {
    const t = new Date(), iso = k => { const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() + k); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
    const auj = iso(0), lim = iso(30);
    a.planning = (window.MEMBRES || []).filter(m => m && m.statut !== 'Inactif' && typeof m.fin_contrat === 'string' && m.fin_contrat >= auj && m.fin_contrat <= lim).length;
    a.pilotage = Number(window._ckSavoirFort) || 0;
  }
  try {
    if (typeof window._mlAgendaComplet === 'function' && typeof window._mlVerdict === 'function' && typeof window._mvToday === 'function') {
      const sem = window._mlAgendaComplet(window._mvToday(), 4), v = sem ? window._mlVerdict(sem, { phase: null, haReste: 0, parc: null }) : null;
      // ★ CAVEAUJ-1 (§434) : des gestes, comme la bande de la Cave (une fin de fermentation estimée n'est pas à faire).
      if (v && v.cls === 'due') a.cave = (sem[0] && sem[0].items) ? (typeof window._mlGestes === 'function' ? window._mlGestes(sem[0].items).length : sem[0].items.length) : 1;
    }
  } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/alertes#cave'); }
  Object.keys(a).forEach(k => { if (!(a[k] > 0)) delete a[k]; });
  return a;
};
// ★ JEQ-1 (§421) — LE COMPTEUR DE LA BARRE, AU JEU COMMUN (CHARTE-4). Nico (21/10) : « le chiffre dans le rond rouge […] c'est pas du
//   tout pro, c'est trop présent […] c'est pas aligné ». Le compteur prend la pièce neutre .mvpas-compteur (la règle de CHARTE-4 : le
//   compteur est neutre, rouge pour une vraie alerte seulement) ; la feuille ne lui donne que sa place. Barre repliée, il devient un
//   point (.mv-rail-point) : le nombre passe dans l'infobulle et dans le nom du bouton.
//   ★ Le libellé s'accorde : VIF-1 collait le « s » au bout de la phrase (« 2 point prioritaire à savoirs », « 2 contrat qui finit
//   dans le moiss »). Le Pilotage reprend le mot d'Aujourd'hui (ANTICIPE-1, §420) : « points à anticiper ».
const PASTILLE_LIB = { tracteur: ['engin en réparation', 'engins en réparation'], planning: ['contrat qui finit dans le mois', 'contrats qui finissent dans le mois'],
  cave: ['à faire en cave', 'à faire en cave'], pilotage: ['point à anticiper', 'points à anticiper'] };
function libelle(p, n) { const L = PASTILLE_LIB[p] || ['à voir', 'à voir']; return n + ' ' + L[n > 1 ? 1 : 0]; }
function pastille(p, n) {
  if (!(n > 0)) return '';
  const lib = libelle(p, n);
  return '<span class="mv-rail-badge mvpas-compteur" data-alerte="' + esc(p) + '" role="img" aria-label="' + esc(lib) + '" title="' + esc(lib) + '">' + (n > 9 ? '9+' : n) + '</span>'
    + '<span class="mv-rail-point" aria-hidden="true"></span>';
}
// Repeint les seules pastilles (le temps réel les rappelle sans reconstruire la barre).
window._railAlertesMaj = function () {
  const a = window._railAlertes();
  document.querySelectorAll('#mv-rail .mv-rail-b').forEach(b => {
    const p = b.getAttribute('data-page'), n = a[p] || 0, lbl = b.querySelector('.mv-rail-lbl');
    const nom = lbl ? lbl.textContent : String(b.getAttribute('aria-label') || '').split(' · ')[0];
    b.querySelectorAll('.mv-rail-badge, .mv-rail-point').forEach(x => x.remove());
    b.classList.toggle('mv-rail-alerte', n > 0);
    // JEQ-1 : barre repliée, l'infobulle (data-tip) et le nom du bouton disent le nombre que le point ne montre pas
    const dit = n > 0 ? nom + ' · ' + libelle(p, n) : nom;
    b.setAttribute('data-tip', dit); b.setAttribute('aria-label', dit);
    if (n > 0) b.insertAdjacentHTML('beforeend', pastille(p, n));
  });
};
window._railHtml = function (items, moi, dom) {
  const R = window._railRubriques(items);
  // ★ ETAIN-1 (§426) : l'icône posée dans sa tuile d'étain (.mv-rail-ic), comme la barre du bas et la feuille « Plus ».
  const bouton = x => '<button class="mv-rail-b" type="button" data-page="' + esc(x.p) + '" data-tip="' + esc(x.l) + '" aria-label="' + esc(x.l) + '"><span class="mv-rail-ic" aria-hidden="true">' + ico(x.ic, 20) + '</span>'
    + '<span class="mv-rail-lbl">' + esc(x.l) + '</span>' + (x.p === 'pilotage' ? '<span class="mv-rail-vif" aria-hidden="true"></span>' : '') + pastille(x.p, x.n) + '</button>';
  // RAIL-1 : le logo, dessiné pour 28 px, est posé par la feuille selon le thème (l'icône de l'appli y pâlissait).
  return '<div class="mv-rail-dom"><span class="mv-rail-logo" aria-hidden="true"></span><span class="mv-rail-lbl"><b>Ma Vigne</b><small title="' + esc(dom.sous) + '">' + esc(dom.nom) + '</small></span></div>'
    + '<button class="mv-rail-cherche" id="mv-rail-cherche" type="button" aria-label="Rechercher" data-tip="Rechercher, ' + TOUCHE + '">' + ico('loupe', 18) + '<span class="mv-rail-lbl">Rechercher</span><kbd class="mv-rail-lbl">' + TOUCHE + '</kbd></button>'
    + R.tete.map(bouton).join('')
    + R.rub.map(r => '<p class="mv-rail-sec"><span class="mv-rail-lbl">' + esc(r.nom) + '</span></p>' + r.items.map(bouton).join('')).join('')
    // MAJ-2 (§327) : la carte « Nouvelle version prête » (pastille barre repliée), peinte par app.js (_mvMajPeindre).
    + '<div class="mv-rail-maj-slot" id="mv-rail-maj">' + (typeof window._mvMajRailHtml === 'function' ? window._mvMajRailHtml() : '') + '</div>'
    + '<div class="mv-rail-bas">' + R.pied.map(bouton).join('') + '<div class="mv-rail-moi"><span class="mv-rail-av" data-tip="' + esc(moi.nom + ', ' + moi.role) + '">' + esc(moi.ini) + '</span>'
    + '<span class="mv-rail-lbl"><b>' + esc(moi.nom) + '</b><small>' + esc(moi.role) + '</small></span>'
    + '<button class="mv-rail-plier" id="mv-rail-plier" type="button" aria-expanded="true" aria-label="Réduire la barre" data-tip="Réduire ou déplier, touche [">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg></button></div></div>';
};
// Le geste de la personne, pour la session : un redimensionnement reconstruit la barre (_dockBuild) et ne doit pas
// défaire un dépliage fait à la main sous 1 200 px.
let manuel = null;
// ★ COTE-1 (§424) : le panneau du tuto, collé à droite sur ordinateur, prend sa largeur à la page. La règle de PRO-1 (barre
//   repliée sous 1 200 px : le contenu garde ~960 px) se juge alors sur la place QUI RESTE ; et le choix fait à la main repart
//   à zéro quand le panneau s'ouvre ou se ferme, comme quand la fenêtre passe le seuil.
let coteVu = false;
function coteTuto() {
  try { return (typeof window._mvTutoCote === 'function') ? (Number(window._mvTutoCote()) || 0) : 0; }
  catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/coteTuto'); return 0; }
}
function ouvert() {
  const cote = coteTuto();
  if ((cote > 0) !== coteVu) { coteVu = cote > 0; manuel = null; }
  if (manuel !== null) return manuel;
  let v = null; try { v = localStorage.getItem('mv-rail'); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/ouvert'); }
  const choix = v != null ? v === '1' : window.innerWidth >= 1280;
  return choix && MQ_LARGE.matches && window.innerWidth - cote >= 1200;
}
// PRO-1 (§269) : la page change de largeur pendant l'animation de la barre (0,4 s). Une fois la largeur posée, on
//   prévient tout ce qui se recale sur un redimensionnement de fenêtre (carte des parcelles, graphiques, grilles) :
//   plier la barre ne redimensionne pas la fenêtre, et ces écrans gardaient leur ancienne largeur.
let basculeT = 0;
function apresBascule() {
  clearTimeout(basculeT);
  basculeT = setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/apresBascule'); } }, 460);
}
function plier(on, garder) {
  const avant = document.body.classList.contains('mv-rail-ouvert');
  document.body.classList.toggle('mv-rail-ouvert', !!on);
  if (avant !== !!on) apresBascule();
  const b = document.getElementById('mv-rail-plier');
  if (b) { b.setAttribute('aria-expanded', String(!!on)); b.setAttribute('aria-label', on ? 'Réduire la barre' : 'Déplier la barre'); b.setAttribute('data-tip', on ? 'Réduire la barre' : 'Déplier la barre'); }
  if (garder) manuel = !!on;
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
  r.innerHTML = window._railHtml(window._dockDef(), { nom, ini: (nom.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('') || 'M'), role: admin ? 'Administration' : 'Équipe' }, domaine());
  window._railAlertesMaj();   // VIF-1 : les pastilles, dès la construction
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
  // COQ-2 (§271) : les groupes de la maquette v2 — « Aller à » (écrans, puis onglets du Pilotage), « Parcelles », « Actions ».
  (items || []).forEach(x => e.push({ g: 'Aller à', t: x.l, s: '', ic: x.ic, go: { page: x.p } }));
  if ((items || []).some(x => x.p === 'pilotage')) ongletsPil().forEach(([k, l]) => e.push({ g: 'Aller à', t: l, s: 'Pilotage', ic: 'graphique', go: { page: 'pilotage', tab: k } }));
  (parcs || []).forEach(p => { if (p && p.nom) e.push({ g: 'Parcelles', t: p.nom, s: p.appellation || '', ic: 'feuille', go: { parc: p.nom } }); });
  const de = (typeof document !== 'undefined') && document.documentElement, sombre = !!de && de.getAttribute('data-theme') === 'dark';
  if (typeof window.openJournalEntry === 'function') e.push({ g: 'Actions', t: 'Nouvelle entrée de journal', s: '', ic: 'journal', go: { act: 'journal' } });
  if (typeof window.applyTheme === 'function') e.push({ g: 'Actions', t: sombre ? 'Passer en thème clair' : 'Passer en thème sombre', s: '', ic: sombre ? 'soleil' : 'lune', go: { act: 'theme' } });
  e.push({ g: 'Actions', t: 'Réduire ou déplier la barre latérale', s: 'touche [', ic: 'liste', go: { act: 'barre' } });
  return e;
};
// Le classement : le titre qui COMMENCE par la recherche, puis le titre qui la contient, puis le sous-titre.
window._palTrier = function (entrees, q) {
  const n = sansAccent(q).trim();
  if (!n) return entrees.filter(x => x.g === 'Actions').slice(0, 1).concat(entrees.filter(x => x.g === 'Aller à' && !x.s)).slice(0, 12);   // sans rien taper : une action, puis les écrans
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
    + '<div class="mv-pal-pied"><span><kbd>↑</kbd><kbd>↓</kbd> choisir</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>Échap</kbd> fermer</span></div>';
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
  if (x.go.parc) { if (typeof window.openDP === 'function') window.openDP(x.go.parc); return; }   // FORME-1 (§301) : la fiche ; openSelParc attend une TÂCHE
  if (x.go.act === 'journal') { window.openJournalEntry(); return; }
  if (x.go.act === 'theme') { const m = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('mavigne_theme', m); } catch (e) { if (window._mvAvale) window._mvAvale(e, 'coquille.js/theme'); } window.applyTheme(m); return; }
  if (x.go.act === 'barre') { plier(!document.body.classList.contains('mv-rail-ouvert'), true); return; }
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
  if (ev.key === '/' && !champ && !ouverte) { ev.preventDefault(); window._palOuvrir(); return; }
  // COQ-2 (§271) : « [ » replie ou déplie la barre, hors d'un champ (le geste de la maquette v2).
  if (ev.key === '[' && !champ && !ouverte && !ev.ctrlKey && !ev.metaKey && !ev.altKey && document.body.classList.contains('mv-avec-rail')) { ev.preventDefault(); plier(!document.body.classList.contains('mv-rail-ouvert'), true); }
});
if (MQ_PC.addEventListener) MQ_PC.addEventListener('change', () => { if (!MQ_PC.matches) window._palFermer(); });
if (MQ_LARGE.addEventListener) MQ_LARGE.addEventListener('change', () => { manuel = null; if (document.body && document.body.classList.contains('mv-avec-rail')) plier(ouvert(), false); });
})();
