// HARNAIS — AUJ-8 (§312) : « À savoir » donne des faits, plus de verdict.
//   node scripts/mv-harnais-auj8.mjs           → doit être vert
//   node scripts/mv-harnais-auj8.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (11/10) : « enlève la tâche de brûlage ici, ce n'est pas à l'appli de décider si oui ou non il est possible de faire une
// tâche » ; puis « rajoute la probabilité de pluie aussi » ; puis « les jours non travaillés ne doivent pas être grisés ».
// A. src/cockpit.js EXÉCUTÉ : _ckMeteoJour (vent inconnu ≠ 0 km/h), _ckSvMeteo (ce qui est en cours dans les communes touchées,
//    commune rangée en objet, fenêtre pas ouverte, tâche finie, plus de trois tâches, domaine), _ckSavoirHtml (rien d'écrit).
// B. src/pilotage.js EXÉCUTÉ dans l'appli entière (mv-app-node) : la bande des cinq jours — risque, cumul, vent, le MÊME calcul
//    que les lignes, rien d'inventé, ni brûlage ni jour grisé.
// C. src/cockpit-vue.js : la VRAIE htmlSavoir, extraite et exécutée (barre, %, mm, vent, légende, phrase vide).
// D. Lu : la bulle « i », la fiche MV_INFO, le guide, la nouveauté, la feuille.
import fs from 'fs'; import os from 'os'; import path from 'path'; import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE = { ck: lire('src/cockpit.js'), pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'),
  uti: lire('src/utils.js'), guide: lire('guide/11-pilotage.html') };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);
const morceau = (src, debut, fin) => { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); const j = src.indexOf(fin, i); if (j < 0) throw new Error('fin introuvable : ' + fin); return src.slice(i, j + fin.length); };
const VERDICT = /attendra|craint|possible|Non travaill/;

// Une prévision heure par heure : jours × 24 h ; f(k, h) → [pluie, vent].
function serie(jours, f) {
  const o = { time: [], temp: [], precip: [], wind: [] };
  jours.forEach((d, k) => { for (let h = 0; h < 24; h++) { const v = f(k, h); o.time.push(d + 'T' + String(h).padStart(2, '0') + ':00'); o.temp.push(10); o.precip.push(v[0]); o.wind.push(v[1]); } });
  return o;
}

// ── A. cockpit.js ─────────────────────────────────────────────────────────────────────────────
function partieA(S, T) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, Set, parseInt, isFinite, setTimeout: () => 0, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx.tNom = n => ({ Brulage: 'Brûlage', Reparation: 'Réparation' })[n] || n;
  vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  const W = ctx;
  T('A1 la bande prend le calcul des lignes : _ckMeteoJour est exposé', typeof W._ckMeteoJour === 'function');
  const sansVent = { time: ['2027-01-13T08:00', '2027-01-13T09:00'], precip: [1.25, 1.25] };
  const calme = { time: ['2027-01-13T08:00', '2027-01-13T09:00'], precip: [0, 0], wind: [0, 0] };
  const jv = W._ckMeteoJour(sansVent, '2027-01-13'), jc = W._ckMeteoJour(calme, '2027-01-13');
  T('A2 un vent jamais relevé est inconnu (null), un vent nul est 0 ; le cumul garde une décimale', jv.vu && jv.vent === null && jv.mm === 2.5 && jc.vent === 0);

  const now = new Date(2027, 0, 12, 9, 0);   // mardi 12 janvier 2027 : demain le 13, après-demain le 14
  const J2 = ['2027-01-13', '2027-01-14'];
  const brochon = serie(J2, (k, h) => [k === 0 && h >= 8 && h <= 10 ? 2 : 0, k === 1 && h === 15 ? 45 : 10]);
  const gevrey = serie(J2, (k, h) => [k === 0 && h === 9 ? 1 : 0, 10]);
  const sect = (h1, h2) => [{ nom: 'Brochon', h: { time: h1.time, precip: h1.precip, wind: h1.wind } }, { nom: 'Gevrey-Chambertin', h: { time: h2.time, precip: h2.precip, wind: h2.wind } }];
  const com = n => ({ nom: n, lat: 47.2, lng: 4.97 });   // ★ la forme réelle : { nom, lat, lng } (FORME-1, §301)
  const parcs = [{ nom: 'Les Charmes', commune: com('Brochon') }, { nom: 'Vignois', commune: com('Brochon') }, { nom: 'Champs', commune: com('Brochon'), statut: 'Arrachee' },
    { nom: 'Les Crais', commune: com('Gevrey-Chambertin') }, { nom: 'Sans commune' }];
  const journal = [{ date: '2027-01-05', parcelle: 'Les Charmes', tache: 'Brulage', statut: 'Validé' }, { date: '2027-01-10', parcelle: 'Vignois', tache: 'Taille', statut: 'En cours' }];
  // fenêtres en jours depuis le 01/01/2026 : Taille 02/12, Brûlage 10/12, Réparation 01/11 (finie), Tirage 16/01 (pas ouverte le 13)
  const fen = [{ nom: 'Taille', ws: 335, we: 441 }, { nom: 'Brulage', ws: 343, we: 441 }, { nom: 'Reparation', ws: 304, we: 340 }, { nom: 'Tirage', ws: 380, we: 441 }, { nom: 'Ebourgeonnage', ws: 300, we: 441 }];
  const rows = [{ nom: 'Taille', pct: 40 }, { nom: 'Brulage', pct: 20 }, { nom: 'Reparation', pct: 100 }, { nom: 'Tirage', pct: 0 }, { nom: 'Ebourgeonnage', pct: 0, type: 'passages' }];
  const plan = { parcs, journal, fen };
  const m1 = W._ckSvMeteo(null, rows, now, sect(brochon, gevrey), plan);
  T('A3 la pluie par secteur garde son titre (le fait)', m1[0] && m1[0].quand === 'Demain' && m1[0].titre === 'Pluie annoncée sur Brochon : 6\u202fmm, de 8\u00a0h à 11\u00a0h');
  T('A4 dessous, ce qui est en cours sur la commune touchée, dans l’ordre de la campagne — commune rangée en objet, arrachée, faite, finie, pas ouverte et passages exclus',
    m1[0] && m1[0].prio === 1 && m1[0].sous === 'En cours sur Brochon : taille, 2 parcelles pas encore faites ; brûlage, 1.');
  T('A5 le vent fort dit où il souffle, avec ce qui y est en cours', m1[1] && /^Vent annoncé à 45\u202fkm\/h sur Brochon$/.test(m1[1].titre) && m1[1].sous.indexOf('En cours sur Brochon : ') === 0);
  const W0 = W._domaineCommuneNom; W._domaineCommuneNom = 'Gevrey-Chambertin';
  const m2 = W._ckSvMeteo(null, rows, now, [{ nom: 'Gevrey-Chambertin', h: { time: brochon.time, precip: brochon.precip, wind: brochon.wind } }], plan);
  W._domaineCommuneNom = W0;
  T('A6 une parcelle sans commune est dans le secteur du domaine', m2[0] && m2[0].sous === 'En cours sur Gevrey-Chambertin : taille, 2 parcelles pas encore faites ; brûlage, 2.');
  const dom = W._ckSvMeteo({ time: brochon.time, precip: brochon.precip, wind: brochon.wind }, rows, now, null, plan);
  T('A7 au niveau du domaine : toutes les parcelles, sans nom de commune', dom[0] && dom[0].sous === 'En cours : taille, 4 parcelles pas encore faites ; brûlage, 3.' && dom[0].prio === 1);
  const oct = W._ckSvMeteo({ time: serie(['2026-10-13'], (k, h) => [h === 9 ? 3 : 0, 10]).time, precip: serie(['2026-10-13'], (k, h) => [h === 9 ? 3 : 0, 10]).precip }, rows, new Date(2026, 9, 12, 9, 0), null, plan);
  T('A8 en octobre, une tâche pas encore ouverte au calendrier n’est pas « en cours » : rien d’écrit, rang ordinaire', oct.length === 1 && oct[0].sous === '' && oct[0].prio === 2);
  T('A9 sans plan : la pluie seule, rien d’inventé', W._ckSvMeteo({ time: brochon.time, precip: brochon.precip, wind: brochon.wind }, rows, now)[0].sous === '');
  const quatre = ['Taille', 'Brulage', 'Pliage', 'Attachage'].map(n => ({ nom: n, pct: 10 }));
  const fen4 = quatre.map((x, k) => ({ nom: x.nom, ws: 330 + k, we: 441 }));
  const m4 = W._ckSvMeteo({ time: brochon.time, precip: brochon.precip, wind: brochon.wind }, quatre, now, null, { parcs, journal: [], fen: fen4 });
  T('A10 plus de trois tâches : les trois premières, puis le reste compté', m4[0] && m4[0].sous === 'En cours : taille, 4 parcelles pas encore faites ; brûlage, 4 ; pliage, 4 ; et 1 autre tâche.');
  T('A11 aucun verdict dans ce que disent les lignes', ![m1, m2, dom, oct, m4].some(m => VERDICT.test(JSON.stringify(m))));
  const h = W._ckSavoirHtml([{ cat: 'meteo', prio: 2, quand: 'Demain', titre: 'Pluie', sous: '' }, { cat: 'meteo', prio: 1, quand: 'Jeudi', titre: 'Vent', sous: 'En cours : <b>x</b>' }], '');
  T('A12 rien en cours : aucune phrase vide sous la ligne ; sinon la phrase, échappée', (h.match(/class="ck-sv-s"/g) || []).length === 1 && h.includes('En cours : &lt;b&gt;x&lt;/b&gt;'));
}

// ── B. pilotage.js dans l'appli entière ───────────────────────────────────────────────────────
async function partieB(S, T) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-auj8-'));
  const fp = path.join(tmp, 'pilotage.js'), fc = path.join(tmp, 'cockpit.js'); fs.writeFileSync(fp, S.pil); fs.writeFileSync(fc, S.ck);
  const A = await chargerApp({ remplace: { 'pilotage.js': fp, 'cockpit.js': fc } }); fs.rmSync(tmp, { recursive: true, force: true });
  const { G, poser, setAuj, JOURNAL_ERR } = A;
  const mod = () => { const t = { _timings: {} }; for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new Date(2026, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(2026, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7.5 : 0; } } return t; };
  const MB = ['Nico', 'Victor', 'Shana'].map(n => ({ nom: n, statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['ouvrier'] }));
  setAuj([2026, 9, 12]);   // lundi 12 octobre 2026
  poser({ membres: MB, planning_templates: { 2026: { standard: mod() } }, planning_entries: {}, saisons: [{ nom: 'Automne 2026', active: true, debut: '2026-09-21', fin: '2026-12-20' }],
    parcelles: [{ nom: 'Clos A', surface: 0.5, statut: 'Actif', appellation: 'Bourgogne', taches: {} }], config: { domaine_nom: 'Test' } });
  const J5 = ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16'];
  G.METEO_DAILY = { time: J5, code: [61, 61, 3, 61, 2], tmax: [15, 18, 19, 21, 20], tmin: [9, 9, 12, 14, 11], pp: [80, 30.6, null, 0, 55] };
  const H = serie(J5, (k, h) => [k === 0 ? (h >= 8 && h <= 11 ? 0.5 : 0) : k === 1 ? (h >= 8 && h <= 11 ? 1.5 : 0) : k === 2 ? (h === 14 || h === 15 ? 0.2 : 0) : k === 3 ? (h === 9 || h === 10 ? 1.25 : 0) : 0,
    k === 0 ? (h === 16 ? 32 : 10) : k === 1 ? 0 : k === 2 ? 12 : k === 3 ? (h === 15 ? 45 : 10) : null]);
  G.METEO_HOURLY = H;
  const e0 = JOURNAL_ERR.length;
  let V = null;
  try { V = G._pilCk2Modele(G._pilData(), { obj: new Date(2026, 9, 23) }); } catch (e) { T('B0 le modèle se calcule (' + e.message + ')', false); return; }
  const M = V.meteo || [];
  T('B1 cinq jours, et sous chacun le risque de pluie, le cumul et le vent — plus de brûlage, aucun jour grisé',
    M.length === 5 && M.every(m => 'pp' in m && 'mm' in m && 'vent' in m && !('brul' in m) && !('chome' in m)));
  T('B2 le MÊME calcul que les lignes d’« À savoir » (_ckMeteoJour) : même cumul, même vent, jour par jour',
    M.length === 5 && M.every((m, k) => { const j = G._ckMeteoJour(H, J5[k]); return m.mm === j.mm && m.vent === j.vent; }));
  T('B3 les valeurs : 2 mm et 32 km/h, 6 mm par temps calme (0 km/h), 0,4 mm, 2,5 mm et 45 km/h, vent inconnu le dernier jour',
    M.length === 5 && M[0].mm === 2 && M[0].vent === 32 && M[1].mm === 6 && M[1].vent === 0 && M[2].mm === 0.4 && M[3].mm === 2.5 && M[3].vent === 45 && M[4].vent === null);
  T('B4 le risque, arrondi et borné ; absent, il reste absent', M.length === 5 && M[0].pp === 80 && M[1].pp === 31 && M[2].pp === null && M[3].pp === 0 && M[4].pp === 55);
  T('B5 la bulle de chaque jour dit les faits, sans rien inventer',
    M.length === 5 && M[0].txt === 'Pluie, risque de pluie 80\u00a0%, 2\u202fmm, vent jusqu’à 32\u202fkm/h' && M[2].txt === 'Couvert, vent jusqu’à 12\u202fkm/h' && M[4].txt === 'Éclaircies, risque de pluie 55\u00a0%');
  const met = (V.savoir || []).filter(x => x.cat === 'meteo');
  T('B6 la ligne de pluie de demain est là, sans verdict dessous', met.length >= 1 && met[0].quand === 'Demain' && met[0].titre === 'Pluie annoncée : 6\u202fmm, de 8\u00a0h à 12\u00a0h'
    && met.every(x => x.sous === '' || x.sous.indexOf('En cours') === 0) && !VERDICT.test(JSON.stringify(met)));
  G.METEO_HOURLY = null; delete G.METEO_DAILY.pp;
  let V2 = null; try { V2 = G._pilCk2Modele(G._pilData(), { obj: new Date(2026, 9, 23) }); } catch (e) { V2 = null; }
  T('B7 sans prévision heure par heure ni risque : rien d’inventé (pas de 0 km/h, pas de 0 %)', V2 && V2.meteo.length === 5 && V2.meteo.every(m => m.pp === null && m.vent === null && m.mm === 0));
  const av = JOURNAL_ERR.slice(e0).filter(x => /pilotage|cockpit/.test(String(x.msg || '')));
  T('B8 aucune erreur avalée dans le modèle', av.length === 0);
}

// ── C. cockpit-vue.js : la vraie htmlSavoir ────────────────────────────────────────────────────
function partieC(S, T) {
  const code = ['let METEO = [], V = null; const S = { svTout: false };', morceau(S.vue, 'const esc = s => ', '\n'), morceau(S.vue, 'const INFO = {', '\n};\n'),
    morceau(S.vue, 'const SVG = ', '\n\n'), morceau(S.vue, 'function savoirItems() {', '\n}\n'), morceau(S.vue, 'function htmlSavoir(r) {', '\n}\n'),
    'this.__r = (M, VV) => { METEO = M; V = VV; return htmlSavoir(); }; this.__info = INFO;'].join('\n');
  const ctx = { Math, Number, String, Array, Object, JSON }; vm.createContext(ctx); vm.runInContext(code, ctx);
  const M = [{ j: 'Auj.', ic: 'pluie', tmax: 15, tmin: 9, mm: 2.5, pp: 80, vent: 32, txt: 'a' }, { j: 'Lun.', ic: 'nuage', tmax: 18, tmin: 9, mm: 0, pp: null, vent: null, txt: 'b' },
    { j: 'Mar.', ic: 'soleil', tmax: 19, tmin: 12, mm: 0.4, pp: 140, vent: 0, txt: 'c' }];
  const sv = [{ cat: 'meteo', prio: 2, quand: 'Demain', titre: 'Pluie annoncée : 6 mm', sous: '' }, { cat: 'meteo', prio: 1, quand: 'Jeudi', titre: 'Vent', sous: 'En cours : brûlage, 3 parcelles pas encore faites.' }];
  const h = ctx.__r(M, { savoir: sv });
  const col = h.slice(0, h.indexOf('<ul')).split('<div class="ck-met-j').slice(1);   // les cinq colonnes seules (sans la liste dessous)
  T('C1 plus de brûlage ni de jour grisé dans la bande', !/brûlage possible|ck-met-br|après-midi|Non travaillé|chome/.test(h.slice(0, h.indexOf('ck-sv-l'))));
  T('C2 un jour complet : la barre à 80 %, « 80 % », « 2,5 mm », le vent avec son pictogramme', col.length === 3 && col[0].includes('<i style="width:80%"></i>') && col[0].includes('>80\u00a0%<')
    && col[0].includes('>2,5\u202fmm<') && /<span class="ck-met-v"><svg[^>]*>.*<\/svg><span>32<\/span><span class="ck-met-vu">km\/h<\/span><\/span>/.test(col[0]));
  T('C3 une valeur inconnue laisse sa ligne vide (ni %, ni km/h, ni 0)', col.length === 3 && col[1].includes('ck-met-pp vide') && !col[1].includes('%') && !col[1].includes('km/h'));
  T('C4 le risque borné à 100 % ; un vent nul s’écrit 0 km/h ; 0,4 mm ne s’écrit pas', col.length === 3 && col[2].includes('width:100%') && col[2].includes('>100\u00a0%<')
    && col[2].includes('</svg><span>0</span><span class="ck-met-vu">km/h</span>') && !col[2].includes('mm<'));
  T('C5 la légende ne dit qu’une chose : le risque de pluie', h.includes('<p class="ck-met-leg"><i></i>risque de pluie</p>') && !ctx.__r(M.map(m => Object.assign({}, m, { pp: null })), { savoir: sv }).includes('ck-met-leg'));
  T('C6 rien en cours : pas de phrase vide sous la ligne', (h.match(/class="ck-sv-s"/g) || []).length === 1 && h.includes('En cours : brûlage, 3 parcelles pas encore faites.'));
  const bande = h.slice(0, h.indexOf('<ul'));
  T('C7 une bande bien formée : balises équilibrées, ni undefined ni NaN', (bande.match(/<div/g) || []).length === (bande.match(/<\/div>/g) || []).length
    && (bande.match(/<span/g) || []).length === (bande.match(/<\/span>/g) || []).length && !/undefined|NaN/.test(h));
  T('C8 la bulle « i » d’« À savoir » dit ce que montre la bande', /risque de pluie/.test(ctx.__info.savoir) && /vent le plus fort/.test(ctx.__info.savoir) && /en cours/.test(ctx.__info.savoir) && !/brûlage/.test(ctx.__info.savoir));
}

// ── D. Ce qui se lit ───────────────────────────────────────────────────────────────────────────
function partieD(S, T) {
  const info = (S.uti.match(/'pil\.savoir': \{ t: 'À savoir', p: \[\n    '([^']*)'/) || [])[1] || '';
  T('D1 la fiche MV_INFO dit les faits de la bande et ce qui est en cours, plus de « devront attendre »',
    /risque de pluie/.test(info) && /vent le plus fort/.test(info) && /ce qui est en cours dans les communes touchées/.test(info) && !/brûlage/.test(info));
  T('D2 le guide décrit la bande et ce qui est en cours', S.guide.includes('le risque de pluie, le cumul en millimètres et le vent le plus fort') && S.guide.includes('avec ce qui est en cours dans les communes touchées'));
  T('D3 la nouveauté 8.80 : pastille sur « À savoir », pour l’admin', /\{ v: '8\.80', d: '2026-10-11', items: \[\n    \{ niv: 1, pour: \['admin'\], cible: '#ck-savoir'/.test(S.uti));
  T('D4 la feuille : la barre du brûlage partie, la barre du risque et la ligne du vent là, aucun jour grisé',
    !S.css.includes('.ck-met-br') && S.css.includes('.ck-met-pp{') && S.css.includes('.ck-met-v{') && S.css.includes('.ck2 .ck-met-pp i,') && !/\.ck-met-j\.(chome|repos|off)/.test(S.css));
  T('D5 petit téléphone : « km/h » passe dessous pour les cinq jours à la fois (requête de conteneur), jamais pour un seul',
    S.css.includes('.ck-met{container:ck-met / inline-size}') && S.css.includes('@container ck-met (max-width:290px){.ck-met-vu{flex-basis:100%}}') && S.css.includes('.ck-met-vu{white-space:nowrap}'));
}

async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const p of [partieA, partieC, partieD]) { try { p(S, T); } catch (e) { T('plantage ' + p.name + ' : ' + (e && e.message), false); } }
  try { await partieB(S, T); } catch (e) { T('plantage partieB : ' + (e && e.message), false); }
  return out;
}
const remp = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('ancre introuvable ou multiple : ' + a.slice(0, 60)); return s.replace(a, b); };

if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert    ' : '  ROUGE   ') + n); });
  console.log(ko ? `AUJ-8 : ${ko} ROUGE(S) sur ${res.length}` : `AUJ-8 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['le vent inconnu redevient 0 km/h', S => ({ ...S, ck: remp(S.ck, 'vent: vuV ? Math.round(vent) : null', 'vent: Math.round(vent)') })],
    ['la commune relue comme un texte (« [object Object] »)', S => ({ ...S, ck: remp(S.ck, "return String((c && typeof c === 'object') ? (c.nom || '') : (c || '')).trim();", "return String(c || '').trim();") })],
    ['une tâche pas encore ouverte au calendrier dite en cours', S => ({ ...S, ck: remp(S.ck, 'if(!deb || deb > iso) return;', 'if(!deb) return;') })],
    ['une tâche finie dite en cours', S => ({ ...S, ck: remp(S.ck, 'if((Number(r.pct) || 0) >= 100) return;', '') })],
    ['la parcelle sans commune sortie du secteur du domaine', S => ({ ...S, ck: remp(S.ck, 'communes.indexOf(_ckCommuneDe(p) || dom) >= 0', 'communes.indexOf(_ckCommuneDe(p)) >= 0') })],
    ['toutes les tâches écrites, sans limite', S => ({ ...S, ck: remp(S.ck, 'var t = l.slice(0, 3).map(', 'var t = l.slice(0, 9).map(') })],
    ['un verdict revenu sous la ligne par secteur', S => ({ ...S, ck: remp(S.ck, 'var sous = _ckEnCoursTxt(ec, com), prio = ec.length ? 1 : 2;', "var sous = ec.length ? 'Le brûlage attendra un temps sec.' : 'Aucun chantier en cours ne craint ce temps.', prio = ec.length ? 1 : 2;") })],
    ['la phrase vide écrite quand même (ancien cockpit)', S => ({ ...S, ck: remp(S.ck, "+ (x.sous ? '<p class=\"ck-sv-s\">' + _ckEsc(x.sous) + '</p>' : '')", "+ '<p class=\"ck-sv-s\">' + _ckEsc(x.sous) + '</p>'") })],
    ['la bande refait son propre cumul, sans le vent (pilotage)', S => ({ ...S, pil: remp(S.pil, 'var jr=MJ?MJ(MH,String(iso)):null,', 'var jr=null,') })],
    ['le risque de pluie oublié par le modèle', S => ({ ...S, pil: remp(S.pil, 'mm:mm, pp:pp, vent:vent,', 'mm:mm, pp:null, vent:vent,') })],
    ['la phrase vide écrite quand même (cockpit)', S => ({ ...S, vue: remp(S.vue, "+ (x.sous ? '<p class=\"ck-sv-s\">' + esc(x.sous) + '</p>' : '')", "+ '<p class=\"ck-sv-s\">' + esc(x.sous) + '</p>'") })],
    ['la légende du brûlage revient', S => ({ ...S, vue: remp(S.vue, "(METEO.some(m => m.pp != null) ? '<p class=\"ck-met-leg\"><i></i>risque de pluie</p>' : '')", "'<p class=\"ck-met-leg\"><i></i>brûlage possible <i class=\"demi\"></i>l’après-midi seulement</p>'") })],
    ['un vent inconnu écrit « 0 km/h »', S => ({ ...S, vue: remp(S.vue, "(m.vent != null ? ICO.vent +", "(true ? ICO.vent +") })],
    ['le risque de pluie hors de 0–100 %', S => ({ ...S, vue: remp(S.vue, 'const pc = v => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));', 'const pc = v => Number(v) || 0;') })],
    ['la règle de la barre du brûlage revient dans la feuille', S => ({ ...S, css: remp(S.css, '/* ★ AUJ-8 (§312) : sous chaque jour', '.ck-met-br{width:20px}\n/* ★ AUJ-8 (§312) : sous chaque jour') })],
    ['la requête de conteneur perdue : « km/h » ne passe dessous que pour certains jours', S => ({ ...S, css: remp(S.css, '@container ck-met (max-width:290px){.ck-met-vu{flex-basis:100%}}', '') })],
    ['la fiche MV_INFO reparle des parcelles qui devront attendre', S => ({ ...S, uti: remp(S.uti, 'avec ce qui est en cours dans les communes touchées — un fait', '(avec les parcelles de brûlage qui devront attendre) — un fait') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; console.log('    (' + e.message + ')'); }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `AUJ-8 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `AUJ-8 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
