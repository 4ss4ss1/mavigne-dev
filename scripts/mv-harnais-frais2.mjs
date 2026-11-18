#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
   HARNAIS — FRAIS-2 (§597) : L'ONGLET « FRAIS » SE VOIT ; LES ACOMPTES Y PASSENT
   Lancer : node scripts/mv-harnais-frais2.mjs            (le contrôle)
            node scripts/mv-harnais-frais2.mjs --contre   (chaque défaut reposé doit rougir)

   Nico (18/11), FRAIS-1 en ligne : « il n'y a pas frais ». L'onglet existait, poussé hors de la barre de la fiche : cinq
   onglets demandaient 423 px pour 324 (360 px), 354 (390 px) et 402 (la colonne de la fiche sur ordinateur). Décidé avec
   lui : « Congés et acomptes » devient « Congés », les acomptes passent dans « Frais » (« acomptes va avec frais »), sous
   la liste des frais ; les onglets se resserrent (8 px de marge par côté au lieu de 14).
   ⚠️ CE QUE CE HARNAIS NE MESURE PAS : la largeur à l'écran. Il tient un BUDGET, lu dans les sources et étalonné sur la
   mesure du 18/11 dans l'appli construite (Chromium, 360 px) : 30 lettres de libellés = 191 px de texte (6,4 px la lettre,
   à 12 px), plus, par onglet, deux marges et deux traits de bord, plus les écarts et la marge de la barre — au plus 324 px.
   Un libellé rallongé, un sixième onglet ou des marges élargies le dépassent : rouge. Le rendu reste à REGARDER.
   ───────────────────────────────────────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const S0 = { idx: lire('index.html'), pl: lire('src/planning.js'), fr: lire('src/planning-frais.js'), css: lire('src/frais.css'), uti: lire('src/utils.js'),
  guide: lire('guide/10-planning.html'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const ent = (s) => s.replace(/&eacute;/g, 'é').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// Le module des frais, chargé tel quel dans un bac à sable (l'import de utils.js remplacé par des doublures).
function monter(S) {
  const code = S.fr.replace(/^import [^\n]*\n/m, '');
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const win = { PLANNING_HSUP: {}, CONFIG: {}, _pY: () => 2026, _mvAujIso: () => '2026-11-18' };
  const ctx = { window: win, isAdmin: () => true, showToast: () => {}, _escHtml: esc, _escAttr: esc, _mvIcon: () => '<svg></svg>',
    _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', document: { getElementById: () => null }, setTimeout: () => 0,
    Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat, Promise };
  vm.createContext(ctx); vm.runInContext(code, ctx); return win;
}

let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const T = (nom, fn) => { let r; try { r = fn(); } catch (e) { r = false; nom += ' — plantage : ' + (e && e.message); } t(nom, r === true, r === true ? '' : String(r)); };

function jouer(S) {
  // ① la barre des onglets de la fiche : cinq, dans l'ordre, sous leurs noms
  const barre = (/<div class="mvu-tabs mvu-sub on-dark pl2-ftabs"[^>]*>([\s\S]*?)<\/div>/.exec(S.idx) || [])[1] || '';
  const ong = [...barre.matchAll(/<button[^>]*data-f="([a-z]+)"[^>]*>([^<]*)<\/button>/g)].map((m) => [m[1], ent(m[2]).trim()]);
  T('① la fiche a cinq onglets, dans l’ordre : Résumé, Jours, Compteur, Congés, Frais', () =>
    JSON.stringify(ong) === JSON.stringify([['resume', 'Résumé'], ['jours', 'Jours'], ['hsup', 'Compteur'], ['cp', 'Congés'], ['frais', 'Frais']]) || JSON.stringify(ong));
  // ② le budget de largeur (étalonné le 18/11 : voir l'en-tête)
  T('② les cinq onglets tiennent dans 324 px (la barre à 360 px) : lettres × 6,4 + par onglet 2 marges + 2 bords, + écarts et marge de la barre', () => {
    const m = /#ovPlanFiche \.pl2-ftabs \.mvu-tab\{padding-left:var\(--e-2,(\d+)px\);padding-right:var\(--e-2,(\d+)px\)\}/.exec(S.css);
    if (!m) return 'la règle des marges des onglets de la fiche est absente de src/frais.css';
    const lettres = ong.reduce((a, o) => a + o[1].length, 0), marge = Number(m[1]) + Number(m[2]);
    const largeur = Math.round(lettres * 6.4 + ong.length * (marge + 2) + Math.max(0, ong.length - 1) * 2 + 6);
    return largeur <= 324 || ('estimé ' + largeur + ' px pour 324 (' + lettres + ' lettres, ' + ong.length + ' onglets, ' + marge + ' px de marges par onglet)');
  });
  // ③ les acomptes : sortis de « Congés », posés dans « Frais » ; l'ancien lien « ac » ouvre « Frais »
  const pl = sansCom(S.pl);
  const conges = (/function _pfConges\(mbr,P\)\{[\s\S]*?\n\}/.exec(pl) || [''])[0];
  t('③ « Congés » ne pose plus les acomptes', !!conges && !/_planAcomptesCard/.test(conges));
  t('③ « Frais » pose les acomptes (planning-frais.js absent : les acomptes seuls)',
    pl.includes("else if(t==='frais')h=(typeof window._pfFrais==='function')?window._pfFrais(mbr,P,_planAcomptesCard(mbr,isAdmin())):_planAcomptesCard(mbr,isAdmin());"));
  t('③ un ancien lien « ac » (acomptes) ouvre « Frais », « mois » ouvre « Jours »', /var t=\{mois:'jours',ac:'frais'\}\[_planFicheTabId\]\|\|_planFicheTabId;/.test(pl));
  T('③ dans « Frais », les acomptes sont sous la liste des frais, avant la voiture et les km (avec ou sans frais)', () => {
    const W = monter(S), M = '<section id="MARQUE-ACOMPTES"></section>';
    const vide = W._pfFrais({ nom: 'Zoé' }, { m: 10 }, M);
    W.PLANNING_HSUP.Zoé = { frais: { voiture: null, lignes: [{ id: 'a1', n: 1, t: 'ticket', mois: '2026-11', date: '2026-11-04', motif: 'Ficelle', cat: 'achat', montant: 12, tva: null, paye: 'cb', photo: null }] } };
    const plein = W._pfFrais({ nom: 'Zoé' }, { m: 10 }, M);
    const place = (h) => { const i = h.indexOf(M), l = h.indexOf('class="frs-liste"'), u = Math.max(h.lastIndexOf('</ul>', i), h.lastIndexOf('frs-vide', i)), c = h.indexOf('class="frs-cote"');
      return i > l && l >= 0 && u > l && i < c && h.startsWith('</div><div class="frs-cote">', i + M.length); };
    const sans = W._pfFrais({ nom: 'Zoé' }, { m: 10 });
    return (place(vide) && place(plein) && !/MARQUE/.test(sans) && !/undefined/.test(sans)) || 'mal placés : ' + plein.slice(plein.indexOf('frs-liste'), plein.indexOf('frs-liste') + 300);
  });
  // ④ l'aide, le guide, la version
  t('④ l’aide : « Congés » le solde ; « Frais » porte les acomptes, sous la liste',
    /Congés : le solde de congés et les jours pris\. Frais : [^"]*acomptes/.test(S.uti) && /\['Les frais à rembourser', "[^"]*Sous la liste, les acomptes du mois/.test(S.uti) && !/Congés et acomptes/.test(S.uti));
  t('④ le guide : « Congés », et les acomptes dans « Frais »', /<li><b>Congés<\/b> — le solde de congés payés et les jours pris\.<\/li>/.test(S.guide)
    && /<li><b>Frais<\/b> — [\s\S]{0,300}<b>acomptes sur\s+salaire<\/b>/.test(S.guide) && !/Congés et acomptes/.test(S.guide) && !/Cong&eacute;s et acomptes/.test(S.idx));
  const v = (/export const APP_VERSION = '([\d.]+)'/.exec(S.uti) || [])[1];
  t('④ l’annonce 11.25 (admin) et la ligne du service worker v12.16', v && /\n  \{ v: '11\.25'[^\n]*FRAIS-2/.test(S.wn) && /\n\/\/ v12\.16 \(18\/11\/2026\) — FRAIS-2 \(§597\)/.test(S.sw));
  t('④ la liste joue ce fichier (et sa contre-épreuve)', S.liste.indexOf("mv-harnais-frais2.mjs'") > 0 && S.liste.indexOf("mv-harnais-frais2.mjs --contre'") > 0);
}

if (!CONTRE) {
  console.log('\n── FRAIS-2 (§597) — l’onglet « Frais » se voit ; les acomptes y passent\n');
  jouer(S0);
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n── CONTRE-ÉPREUVES — FRAIS-2 (§597)\n');
  const CAS = [
    ['« Congés et acomptes » revient (la barre déborde)', 'idx', 'onclick="planFicheTab(&#39;cp&#39;)">Cong&eacute;s</button>', 'onclick="planFicheTab(&#39;cp&#39;)">Cong&eacute;s et acomptes</button>'],
    ['les marges des onglets de la fiche reviennent à 14 px', 'css', '#ovPlanFiche .pl2-ftabs .mvu-tab{padding-left:var(--e-2,8px);padding-right:var(--e-2,8px)}', '#ovPlanFiche .pl2-ftabs .mvu-tab{padding-left:var(--e-2,14px);padding-right:var(--e-2,14px)}'],
    ['la règle des marges disparaît', 'css', '#ovPlanFiche .pl2-ftabs .mvu-tab{padding-left:var(--e-2,8px);padding-right:var(--e-2,8px)}', ''],
    ['un sixième onglet', 'idx', 'data-f="frais" onclick="planFicheTab(&#39;frais&#39;)">Frais</button>', 'data-f="frais" onclick="planFicheTab(&#39;frais&#39;)">Frais</button>\n        <button class="mvu-tab pl2-ftab" role="tab" data-f="docs" onclick="planFicheTab(&#39;docs&#39;)">Documents</button>'],
    ['les acomptes reviennent dans « Congés »', 'pl', "    +'</section>';   // ★ FRAIS-2 (§597)", "    +'</section>'+_planAcomptesCard(mbr,isAdmin());   // ★ FRAIS-2 (§597)"],
    ['« Frais » ne pose plus les acomptes', 'pl', "window._pfFrais(mbr,P,_planAcomptesCard(mbr,isAdmin())):_planAcomptesCard(mbr,isAdmin());", "window._pfFrais(mbr,P):'';"],
    ['le volet ne pose plus ce qu’on lui donne', 'fr', "'<p class=\"frs-vide\">Aucun frais ce mois-ci.</p>') + (apres || '') + '</div>'", "'<p class=\"frs-vide\">Aucun frais ce mois-ci.</p>') + '</div>'"],
    ['les acomptes sortent de la colonne de la liste', 'fr', "'<p class=\"frs-vide\">Aucun frais ce mois-ci.</p>') + (apres || '') + '</div>'", "'<p class=\"frs-vide\">Aucun frais ce mois-ci.</p>') + '</div>' + (apres || '')"],
    ['les acomptes passent au-dessus de la liste', 'fr', "h += '<div class=\"frs-g\"><div class=\"frs-liste\"><h4 class=\"frs-grp\">'", "h += '<div class=\"frs-g\"><div class=\"frs-liste\">' + (apres || '') + '<h4 class=\"frs-grp\">'"],
    ['un ancien lien « ac » rouvre « Congés »', 'pl', "var t={mois:'jours',ac:'frais'}[_planFicheTabId]", "var t={mois:'jours',ac:'cp'}[_planFicheTabId]"],
    ['l’aide dit encore « Congés et acomptes »', 'uti', 'Congés : le solde de congés et les jours pris. Frais :', 'Congés et acomptes : le solde de congés et les avances en euros. Frais :'],
    ['le guide dit encore « Congés et acomptes »', 'guide', '<li><b>Congés</b> — le solde de congés payés et les jours pris.</li>', '<li><b>Congés et acomptes</b> — le solde de congés payés et les jours pris.</li>'],
  ];
  let attrapes = 0;
  for (const [nom, f, a, b] of CAS) {
    const S = Object.assign({}, S0);
    if (S[f].indexOf(a) < 0) { console.log('  \x1b[31m✗\x1b[0m défaut non posé : ' + nom); ko++; continue; }
    S[f] = S[f].replace(a, b);
    const ok0 = ok, ko0 = ko, log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    const rouge = ko > ko0; ok = ok0; ko = ko0;
    if (rouge) { attrapes++; console.log('  \x1b[32m✓\x1b[0m ' + nom + ' → rougit'); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + ' → reste vert'); }
  }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mCONCLUANTE\x1b[0m') + ' — ' + attrapes + '/' + CAS.length + ' défauts attrapés');
  process.exit(ko ? 1 : 0);
}
