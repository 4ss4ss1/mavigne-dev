/* ───────────────────────────────────────────────────────
   HARNAIS — FRAIS-1 (§595) : LES FRAIS À REMBOURSER ET LES INDEMNITÉS KM, AVEC LA PAIE
   Lancer :          node scripts/mv-harnais-frais1.mjs
   Contre-épreuves : node scripts/mv-harnais-frais1.mjs --contre

   POURQUOI IL EXISTE
   Nico (18/11) : rembourser ce qu'un salarié a avancé pour le domaine (tickets, carte) et ses trajets avec sa voiture, en même
   temps que la paie, sur la feuille de la compta ; les km « selon la puissance du véhicule et les kilomètres parcourus ». Puis :
   un trajet = les km en plus et le motif, rien d'autre. L'admin seul saisit. Maquette validée (« parfait, on suit les
   recommandations ») : docs/maquettes/maquette-frais-v2.html.

   CE QU'IL GARDE
   ① le barème : les chiffres publiés le 9 avril 2026 (Service-Public A14686, revenus 2025), l'électrique à +20 % ;
   ② le calcul au fil de l'année : chaque trajet = barème(après) − barème(avant), arrondi au centime ; la somme tombe sur le
      barème de l'année ; le palier franchi (Arthur, 4 930 → 5 120 km : 96,07 €) ; le taux du domaine (km × taux) ;
   ③ le mois : un mois figé garde ses montants (fige.frais.mt) ; un frais saisi sur un mois figé part avec le suivant ;
      l'instantané de « Figer » ; les totaux du mois, le ticket sans photo compté « manquant » ;
   ④ des données d'avant ou abîmées ne cassent rien (RELEVE-3, §24 n°20) ; le motif est échappé ;
   ⑤ le branchement : l'onglet et la fenêtre (index.html), le volet, « Pour la compta », Figer, le relevé (planning.js), le
      chargement (app.js), les photos (firebase.js, storage.rules : l'admin seul), l'aide, le « i », le guide, l'annonce, les
      versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { fr: lire('src/planning-frais.js'), pl: lire('src/planning.js'), app: lire('src/app.js'), fb: lire('src/firebase.js'), st: lire('storage.rules'),
  idx: lire('index.html'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), guide: lire('guide/10-planning.html'),
  css: lire('src/frais.css'), aj: lire('scripts/mv-harnais-ajour1.mjs'), liste: lire('scripts/mv-harnais-liste.mjs'),
  lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-frais-v2.html') };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');

// Le module, chargé tel quel dans un bac à sable : l'import de utils.js remplacé par des doublures.
function monter(S, H, cfg) {
  const code = S.fr.replace(/^import [^\n]*\n/m, '');
  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const win = { PLANNING_HSUP: H || {}, CONFIG: cfg || {}, _pY: () => 2026, _mvAujIso: () => '2026-11-18' };
  const ctx = { window: win, isAdmin: () => true, showToast: () => {}, _escHtml: esc, _escAttr: esc, _mvIcon: () => '<svg></svg>',
    _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '">i</button>', document: { getElementById: () => null },
    setTimeout: (f) => { (win.__minuteurs = win.__minuteurs || []).push(f); return 0; },   // les minuteurs du module, joués à la main
    Math, Number, String, Array, Object, Date, JSON, isFinite, isNaN, parseInt, parseFloat, Promise };
  vm.createContext(ctx); vm.runInContext(code, ctx); return win;
}
const tr = (id, n, mois, km, o) => Object.assign({ id, n, t: 'trajet', mois, date: mois + '-10', motif: 'm' + id, km, cv: 5, elec: false }, o || {});
const tk = (id, n, mois, montant, o) => Object.assign({ id, n, t: 'ticket', mois, date: mois + '-04', motif: 'Ticket ' + id, cat: 'achat', montant, tva: null, paye: 'cb', photo: { demo: 1 } }, o || {});
// Marie : 386 km payés avant novembre (des trajets d'octobre), puis 24, 24 et 22 km en novembre — la maquette v2
const MARIE = () => ({ Marie: { frais: { voiture: { cv: 5, energie: 'essence', carte: 'personne', carteGrise: null }, lignes: [
  tr('o1', 1, '2026-10', 386), tr('a', 2, '2026-11', 24), tk('b', 3, '2026-11', 38.9), tr('c', 4, '2026-11', 24), tk('d', 5, '2026-11', 3.5), tr('e', 6, '2026-11', 22), tk('f', 7, '2026-11', 18, { photo: null })] } } });

let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
const T = (nom, fn) => { let r; try { r = fn(); } catch (e) { r = false; nom += ' — plantage : ' + (e && e.message); } t(nom, r === true, r === true ? '' : String(r)); };

function jouer(S) {
  // ① le barème
  T('① barème : les chiffres publiés le 9 avril 2026 (5 CV : 0,636 · 0,357 + 1 395 · 0,427 ; 7 CV : 0,697 · 0,394 + 1 515 · 0,470)', () => {
    const W = monter(S), b = W._fraisBareme;
    return Math.abs(b(5, false, 1000) - 636) < 1e-6 && Math.abs(b(5, false, 10000) - (3570 + 1395)) < 1e-6 && Math.abs(b(5, false, 30000) - 12810) < 1e-6
      && Math.abs(b(7, false, 4930) - 3436.21) < 1e-6 && Math.abs(b(7, false, 5120) - 3532.28) < 1e-6 && Math.abs(b(3, false, 100) - 52.9) < 1e-6;
  });
  T('① l’électrique : +20 % sur toute la table (arrondie comme la publication), 3 CV et moins, 7 CV et plus', () => {
    const W = monter(S), b = W._fraisBareme;
    for (const cv of [3, 4, 5, 6, 7]) for (const d of [1000, 12000, 25000]) if (Math.abs(b(cv, true, d) - b(cv, false, d) * 1.2) > d * 0.0006 + 1) return 'cv ' + cv + ' d ' + d;
    return Math.abs(b(2, false, 100) - 52.9) < 1e-6 && Math.abs(b(9, true, 100) - 83.6) < 1e-6;
  });
  // ② le calcul au fil de l'année
  T('② Marie : 386 km avant novembre, puis 24, 24 et 22 km → 15,26 €, 15,26 €, 13,99 € ; 456 km payés en 2026', () => {
    const W = monter(S, MARIE()), C = W._fraisCalcAnnee('Marie', '2026');
    return (C.L.a.mt === 15.26 && C.L.c.mt === 15.26 && C.L.e.mt === 13.99 && C.cumul === 456) || JSON.stringify(C.L);
  });
  T('② Arthur passe le palier : 7 CV diesel, 4 930 km puis 190 km → 96,07 € (et non 132,43 € au taux du palier 1)', () => {
    const W = monter(S, { Arthur: { frais: { voiture: { cv: 7, energie: 'diesel' }, lignes: [tr('x', 1, '2026-09', 4930, { cv: 7 }), tr('y', 2, '2026-11', 190, { cv: 7 })] } } });
    const C = W._fraisCalcAnnee('Arthur', '2026'); return C.L.y.mt === 96.07 || C.L.y.mt;
  });
  T('② au 31 décembre, la somme des trajets tombe sur le barème de l’année (au centime près par trajet)', () => {
    const L = []; let tot = 0; for (let i = 1; i <= 40; i++) { const km = 37 + (i * 53) % 410; tot += km; L.push(tr('t' + i, i, '2026-' + String(1 + (i % 12)).padStart(2, '0'), km, { cv: 6 })); }
    const W = monter(S, { P: { frais: { voiture: { cv: 6, energie: 'essence' }, lignes: L } } }), C = W._fraisCalcAnnee('P', '2026');
    const som = Object.values(C.L).reduce((a, x) => a + x.mt, 0), cible = W._fraisBareme(6, false, tot);
    return (tot > 5000 && Math.abs(som - cible) <= 40 * 0.005 + 1e-9) || ('somme ' + som + ' cible ' + cible + ' km ' + tot);
  });
  T('② une autre année repart de zéro (le palier se lit sur l’année civile)', () => {
    const W = monter(S, { P: { frais: { lignes: [tr('a', 1, '2026-12', 4000), tr('b', 2, '2027-01', 100)] } } });
    return W._fraisCalcAnnee('P', '2027').L.b.mt === 63.6 || W._fraisCalcAnnee('P', '2027').L.b.mt;
  });
  T('② le taux du domaine remplace le barème : km × taux, sans palier', () => {
    const W = monter(S, MARIE(), { frais_km: 0.5 }), C = W._fraisCalcAnnee('Marie', '2026');
    return (C.taux === 0.5 && C.L.a.mt === 12 && C.L.e.mt === 11) || JSON.stringify(C.L);
  });
  // ③ le mois
  T('③ les totaux de novembre : 60,40 € de tickets (3), 44,51 € de km (70 km), 104,91 € ; 1 ticket manquant', () => {
    const W = monter(S, MARIE()), m = W._fraisMois('Marie', '2026-11');
    return (m.tk === 60.4 && m.ntk === 3 && m.ik === 44.51 && m.km === 70 && m.tot === 104.91 && m.manq === 1 && !m.fige) || JSON.stringify({ tk: m.tk, ik: m.ik, tot: m.tot, manq: m.manq });
  });
  T('③ un mois figé garde ses montants, même si un trajet d’avant change', () => {
    const H = MARIE(); H.Marie['2026-11'] = { fige: { le: '2026-11-25', frais: { mt: { a: 15.26, c: 15.26, e: 13.99 }, tot: 104.91 } } };
    H.Marie.frais.lignes[0].km = 5500;   // octobre corrigé après coup (le palier change) : novembre ne bouge pas
    const W = monter(S, H), C = W._fraisCalcAnnee('Marie', '2026');
    return (C.L.a.mt === 15.26 && C.L.e.mt === 13.99) || JSON.stringify(C.L);
  });
  T('③ un frais saisi sur un mois figé part avec le suivant (et le suivant figé aussi : le d’après)', () => {
    const H = MARIE(); H.Marie['2026-11'] = { fige: { le: '2026-11-25' } };
    let W = monter(S, H); const a = W._pfFrais({ nom: 'Marie' }, { m: 10 });
    H.Marie['2026-12'] = { fige: { le: '2026-12-20' } }; W = monter(S, H); const b = W._pfFrais({ nom: 'Marie' }, { m: 10 });
    return (/part avec la paie de décembre/.test(a) && /part avec la paie de janvier/.test(b)) || 'a : ' + /paie de [a-zé]+/.exec(a);
  });
  T('③ l’instantané de « Figer » : les montants des trajets, les totaux ; rien pour un mois sans frais', () => {
    const W = monter(S, MARIE()), i = W._fraisInstantane('Marie', 2026, 10);
    return (i && i.tot === 104.91 && i.mt.a === 15.26 && i.mt.e === 13.99 && i.n === 6 && W._fraisInstantane('Marie', 2026, 9 - 9) === null) || JSON.stringify(i);
  });
  T('③ « Pour la compta » : le bloc à part, hors salaire, avec ses trois lignes ; la phrase du mois figé dit les frais', () => {
    const H = MARIE(); const W = monter(S, H), c = W._fraisCompta('Marie', 2026, 10);
    H.Marie['2026-11'] = { fige: { le: '2026-11-25', frais: { tot: 104.91, mt: {} } } }; const W2 = monter(S, H);
    return (/Remboursements, hors salaire/.test(c) && /Frais avancés/.test(c) && /Indemnités km/.test(c) && /104,91/.test(c) && W._fraisCompta('Marie', 2026, 0) === ''
      && /104,91.*de frais/.test(W2._fraisFigeTexte('Marie', 2026, 10))) || c.slice(0, 200);
  });
  T('③ le relevé : la page des frais (tickets, trajets, total, justificatifs) et le bloc du cadre ; rien sans frais', () => {
    const W = monter(S, MARIE()), p = W._fraisRelevePage('Marie', 2026, 10), c = W._fraisReleveCadre('Marie', 2026, 10);
    return (/Tickets et paiements/.test(p.html) && /Indemnités kilométriques/.test(p.html) && /Justificatifs/.test(p.html) && /104,91/.test(p.html) && /ticket manquant/.test(p.html)
      && /\.frs-tab/.test(p.css) && /Remboursements, hors salaire/.test(c) && W._fraisRelevePage('Marie', 2026, 0).html === '') || p.html.slice(0, 160);
  });
  // ④ robustesse et échappement
  T('④ des données d’avant ou abîmées ne cassent rien (frais absent, chaîne, lignes non tableau, ligne sans id)', () => {
    const W = monter(S, { A: {}, B: { frais: 'x' }, C: { frais: { lignes: 'x' } }, D: { frais: { lignes: [null, 3, { t: 'trajet' }, { id: 'z', t: 'trajet', mois: '2026-11', km: 'abc' }] } } });
    for (const n of ['A', 'B', 'C', 'D', 'Inconnu']) { W._fraisMois(n, '2026-11'); W._pfFrais({ nom: n }, { m: 10 }); W._fraisRelevePage(n, 2026, 10); }
    return W._fraisMois('D', '2026-11').ik === 0;
  });
  T('④ le motif est échappé (volet, relevé)', () => {
    const H = MARIE(); H.Marie.frais.lignes[1].motif = '<img src=x onerror=alert(1)>';
    const W = monter(S, H), v = W._pfFrais({ nom: 'Marie' }, { m: 10 }), p = W._fraisRelevePage('Marie', 2026, 10).html;
    return (!/<img src=x/.test(v) && !/<img src=x/.test(p) && /&lt;img/.test(v)) || 'motif cru';
  });
  T('④ supprimer un frais se répare : « Annuler » le remet à sa place ; sa photo ne part du serveur qu’après le toast (ANNULER-1)', () => {
    const H = MARIE(); H.Marie.frais.lignes[2].photo = { url: 'u', path: 'tenants/t/frais/b.jpg' };
    const W = monter(S, H); let fn = null; const supprimees = [];
    W._planFicheCtx = () => ({ nom: 'Marie', m: 10, y: 2026 }); W.fbSaveToast = () => Promise.resolve({ ok: true });
    W.showToastAnnuler = (m, f) => { fn = f; }; W.fbFraisPhotoSuppr = (c) => { supprimees.push(c); };
    W.openPlanFrais('ticket', 'b'); W.planFraisSuppr();
    const parti = !W.PLANNING_HSUP.Marie.frais.lignes.some((l) => l.id === 'b');
    if (!parti || typeof fn !== 'function') return 'pas supprimé, ou pas d’Annuler';
    if (supprimees.length) return 'photo effacée tout de suite';
    if (!(W.__minuteurs || []).length) return 'aucun effacement prévu après le toast';
    fn(); const L = W.PLANNING_HSUP.Marie.frais.lignes;
    (W.__minuteurs || []).forEach((f) => f());
    return (L[2] && L[2].id === 'b' && L.length === 7 && supprimees.length === 0) || ('remis : ' + L.map((l) => l.id).join(','));
  });
  T('④ sans « Annuler », la photo du frais supprimé part du serveur une fois le toast passé', () => {
    const H = MARIE(); H.Marie.frais.lignes[2].photo = { url: 'u', path: 'tenants/t/frais/b.jpg' };
    const W = monter(S, H), supprimees = [];
    W._planFicheCtx = () => ({ nom: 'Marie', m: 10, y: 2026 }); W.fbSaveToast = () => Promise.resolve({ ok: true });
    W.showToastAnnuler = () => {}; W.fbFraisPhotoSuppr = (c) => { supprimees.push(c); };
    W.openPlanFrais('ticket', 'b'); W.planFraisSuppr(); (W.__minuteurs || []).forEach((f) => f());
    return (supprimees.length === 1 && supprimees[0] === 'tenants/t/frais/b.jpg') || ('effacées : ' + supprimees.length);
  });
  // ⑤ le branchement
  const pl = sansCom(S.pl), idx = S.idx;
  t('⑤ index.html : l’onglet « Frais » de la fiche et la fenêtre de saisie (ovPlanFrais)', /data-f="frais" onclick="planFicheTab\(&#39;frais&#39;\)">Frais</.test(idx) && /id="ovPlanFrais"[\s\S]{0,600}id="pfr-body"[\s\S]{0,200}id="pfr-foot"/.test(idx));
  t('⑤ planning.js : le volet, « Pour la compta », Figer, le relevé (cadre et page 3), la roue, le contexte de la fiche',
    /\['resume','jours','hsup','cp','frais'\]/.test(pl) && /t==='frais'\)h=\(typeof window\._pfFrais==='function'\)\?window\._pfFrais\(mbr,P[,)]/.test(pl)
    && /window\._fraisCompta\(mbr\.nom,_pY\(\),P\.m\)/.test(pl) && /window\._fraisInstantane\(mbr\.nom,_pY\(\),m\)[\s\S]{0,40}if\(fr\)o\.frais=fr;/.test(pl)
    && /window\._fraisReleveCadre\(nom,_pY\(\),m\)/.test(pl) && /FR\.html\?'<section class="pg pg3">'/.test(pl) && /window\._fraisCadreHtml\(\)/.test(pl)
    && /window\._planFicheCtx\s*=/.test(pl) && /window\._fraisFigeTexte\(mbr\.nom,_pY\(\),P\.m\)/.test(pl));
  t('⑤ app.js : planning-frais.js juste après planning-modeles.js, frais.css après pilotage.css, la photo réduite exposée, les frais de Jean (démo)',
    /import '\.\/planning-modeles\.js';[^\n]*\nimport '\.\/planning-frais\.js';/.test(S.app) && /import '\.\/pilotage\.css';[^\n]*\nimport '\.\/frais\.css';/.test(S.app)
    && /window\._mvPhotoReduire=_obsCompresser;/.test(S.app) && /_hs\['Jean'\]\.frais=/.test(S.app));
  t('⑤ les photos : tenants/<domaine>/frais/, l’admin seul (storage.rules : lire, déposer, supprimer), 1 Mo, une image, jamais remplacée',
    /'tenants\/' \+ TENANT_ID \+ '\/frais\/'/.test(S.fb) && /window\.fbFraisPhotoSuppr\s*=/.test(S.fb)
    && /match \/tenants\/\{tenant\}\/frais\/\{filename\} \{\s*allow read:\s*if !isDemoAccount\(\) && \(isTenantAdmin\(tenant\) \|\| isGtAdmin\(\)\);\s*allow create: if !isDemoAccount\(\)\s*&& isTenantAdmin\(tenant\)\s*&& request\.resource\.size <= 1 \* 1024 \* 1024\s*&& request\.resource\.contentType\.matches\('image\/\.\*'\);\s*allow update: if false;/.test(S.st));
  t('⑤ la fenêtre se range (AJOUR-1 : FORMULAIRE) ; la feuille pose ses styles sans fond de bouton (les pièces .mvbtn)',
    /ovPlanFrais: \['FORMULAIRE'/.test(S.aj) && /\.frs-ph\{/.test(S.css) && !/\.mvbtn[^{]*\{[^}]*background/.test(S.css));
  // ★ CHAINE-1 (§596) : l’annonce de FRAIS-1 n’est plus EN TÊTE dès le lot suivant — on la cherche à SA version (11.23), et la
  //   ligne de son service worker là où elle est (plus forcément la deuxième). « En tête » rougissait au premier lot d’après.
  t('⑤ l’aide (cinq onglets, « Les frais à rembourser »), le « i » des km, le guide, l’annonce (11.23)',
    /'La fiche d’un salarié', "cinq onglets/.test(S.uti) && /\['Les frais à rembourser',/.test(S.uti) && /'plan\.frais\.km': \{ t:/.test(S.uti) && /_mvInfoBtn\('plan\.frais\.km'\)/.test(S.fr)
    && /<h3>\{ic:recu\} Les frais à rembourser<\/h3>/.test(S.guide) && /\n  \{ v: '11\.23'[^\n]*FRAIS-1/.test(S.wn)
    && /\n\/\/ v12\.14 \(18\/11\/2026\) — FRAIS-1 \(§595\)/.test(S.sw));
  t('⑤ la maquette v2 et sa ligne au LISEZMOI ; la liste joue ce fichier (et sa contre-épreuve)',
    /<title>Ma Vigne — Frais à rembourser, maquette v2<\/title>/.test(S.maq) && /maquette-frais-v2\.html/.test(S.lm)
    && S.liste.indexOf("mv-harnais-frais1.mjs'") > 0 && S.liste.indexOf("mv-harnais-frais1.mjs --contre'") > 0);
}

if (!CONTRE) {
  console.log('\n── FRAIS-1 (§595) — les frais à rembourser et les indemnités km\n');
  jouer(S0);
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n── CONTRE-ÉPREUVES — FRAIS-1 (§595)\n');
  const CAS = [
    ['le barème du 5 CV change (0,636 → 0,606)', 'fr', '5: [0.636, 0.357, 1395, 0.427]', '5: [0.606, 0.357, 1395, 0.427]'],
    ['l’électrique perd ses +20 %', 'fr', "var t = (elec ? FRAIS_BAREME.e : FRAIS_BAREME.v)[_frCv(cv)];\n  if (!t || !(d > 0)) return 0;", "var t = FRAIS_BAREME.v[_frCv(cv)];\n  if (!t || !(d > 0)) return 0;"],
    ['chaque barème arrondi avant la différence (14,00 € au lieu de 13,99 €)', 'fr', 'else mt = _frR2(_fraisBareme(l.cv, !!l.elec, c + km) - _fraisBareme(l.cv, !!l.elec, c));', 'else mt = _frR2(_frR2(_fraisBareme(l.cv, !!l.elec, c + km)) - _frR2(_fraisBareme(l.cv, !!l.elec, c)));'],
    ['le palier se lit sur le trajet seul, pas sur l’année', 'fr', 'else mt = _frR2(_fraisBareme(l.cv, !!l.elec, c + km) - _fraisBareme(l.cv, !!l.elec, c));', 'else mt = _frR2(_fraisBareme(l.cv, !!l.elec, km));'],
    ['le taux du domaine est ignoré', 'fr', 'else if (taux > 0) mt = _frR2(km * taux);', 'else if (false) mt = _frR2(km * taux);'],
    ['un mois figé se recalcule', 'fr', "if (fg && fg.frais && fg.frais.mt && typeof fg.frais.mt[l.id] === 'number') mt = fg.frais.mt[l.id];\n      else if", "if (false) mt = 0;\n      else if"],
    ['un frais saisi sur un mois figé y reste', 'fr', 'while (_fraisFige(nom, k) && i < 24)', 'while (false && i < 24)'],
    ['un ticket sans photo n’est plus compté manquant', 'fr', "if (!l.photo) t.manq++;", ''],
    ['le motif n’est plus échappé dans le volet', 'fr', "<span class=\"frs-m\">' + _escHtml(l.motif || '')", "<span class=\"frs-m\">' + (l.motif || '')"],
    ['une ligne abîmée (sans id) entre dans le calcul', 'fr', ".filter(function (l) { return l && typeof l === 'object' && l.id; })", ".filter(function (l) { return true; })"],
    ['supprimer un frais ne propose plus « Annuler »', 'fr', "  window.showToastAnnuler(dit, function () {", "  _frFini(dit); if (0) window.showToastAnnuler(dit, function () {"],
    ['la photo d’un frais supprimé part du serveur tout de suite', 'fr', "if (l.photo && l.photo.path) _frPlusTard(", "if (l.photo && l.photo.path) window.fbFraisPhotoSuppr(l.photo.path), _frPlusTard("],
    ['la fiche ne rend plus le volet', 'pl', "else if(t==='frais')h=(typeof window._pfFrais==='function')?window._pfFrais(mbr,P,_planAcomptesCard(mbr,isAdmin())):_planAcomptesCard(mbr,isAdmin());", ''],   // FRAIS-2 (§597) : la ligne porte les acomptes
    ['Figer ne fige plus les frais', 'pl', 'if(fr)o.frais=fr;', ''],
    ['le relevé perd sa page des frais', 'pl', "+(FR.html?'<section class=\"pg pg3\">'+tete(3)+FR.html+pied()+'</section>':'')", ''],
    ['un salarié lit les photos des frais', 'st', 'allow read:   if !isDemoAccount() && (isTenantAdmin(tenant) || isGtAdmin());\n      allow create: if !isDemoAccount()\n                    && isTenantAdmin(tenant)', 'allow read:   if !isDemoAccount() && (isTenantMember(tenant) || isGtAdmin());\n      allow create: if !isDemoAccount()\n                    && isTenantAdmin(tenant)'],
    ['app.js ne charge plus le module', 'app', "import './planning-frais.js';", ''],
    ['la fenêtre n’a plus sa case AJOUR-1', 'aj', "ovPlanFrais: ['FORMULAIRE'", "ovPlanFraisX: ['FORMULAIRE'"],
    ['l’aide dit encore quatre onglets', 'uti', "'La fiche d’un salarié', \"cinq onglets", "'La fiche d’un salarié', \"quatre onglets"]
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
