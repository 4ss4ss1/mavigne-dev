// HARNAIS — ECART-1 (§460) : l'écart au barème d'Aujourd'hui › Économie se lit en HEURES, et la tuile est le total de la carte.
//   node scripts/mv-harnais-ecart1.mjs           → doit être vert
//   node scripts/mv-harnais-ecart1.mjs --contre  → chaque défaut réinjecté doit rougir
// Nico (25/10, capture) : la tuile « Écart au barème » à 0,0 %, à côté de la Réparation à +620 % et du Dégraffage à +13 % ; deux
//   barres de la même longueur. La tuile lisait la cadence (0 sous 40 % du travail validé), la carte calculait en euros sous des
//   heures venues d'ailleurs, et la barre s'arrêtait à 10 %.
// A. EXÉCUTÉ dans l'appli entière (mv-app-node) — un hiver qui commence : la réparation et le dégraffage validés, la taille pas
//    commencée (avancement sous 40 % : la cadence ne se calcule pas), une étape d'arrachage, des taux horaires différents.
//    · chaque ligne de la carte = l'écart en heures de « Temps réel contre barème » (le même moteur, au chiffre près) ;
//    · la tuile = la somme des heures sur la somme des barèmes de ces lignes — ni la cadence, ni 0 ;
//    · l'arrachage (travail à l'heure) n'a pas de ligne ; la projection de l'atterrissage n'a pas bougé.
// A'. EXÉCUTÉ sur la vraie _pilCk2Eco, moteur écrit à la main : l'écart suit les heures, pas les euros ; rien à comparer → null ;
//    pas de « −100 % » sans heure versée ; un travail à l'heure jamais comparé.
// B. EXÉCUTÉ sur les vraies fonctions de la vue (cockpit-vue.js), extraites : le tiret, l'échelle à ±50 %, la pointe, les heures du
//    même calcul ; LU : la tuile et sa mise à jour, la carte redessinée quand une ligne manque, la pointe dans la feuille.
// C. LU : l'accompagnement (fiches « i », aide, guide, nouveautés) ; la liste joue ce fichier et sa contre-épreuve.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const pres = (a, b, e = 1e-9) => Math.abs(a - b) < e;

// ── A. Le domaine (fictif) ──────────────────────────────────────────────────
const iso = (m, d) => '2026-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
function modele() { const t = { _timings: {} }; for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '15:30' };
  const nd = new Date(2026, m + 1, 0).getDate(); for (let d = 1; d <= nd; d++) { const w = new Date(2026, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } } return t; }
function domaine() {
  const P = [['A', .62, 'Gevrey-Chambertin'], ['B', .55, 'Gevrey-Chambertin'], ['C', .71, 'Gevrey-Chambertin'], ['D', .48, 'Morey-Saint-Denis'],
    ['E', .40, 'Morey-Saint-Denis'], ['F', .33, 'Bourgogne'], ['G', .80, 'Bourgogne'], ['Crais', .45, 'Bourgogne Aligoté']];
  let n = 0; const J = [], EQ = ['Paul', 'Marc', 'Inès'];
  const v = (m, d, parc, tache, eq, x) => J.push(Object.assign({ id: (new Date(2026, m, d, 16).getTime()).toString(16) + String(n++).padStart(3, '0'), date: iso(m, d), parcelle: parc, tache, qui: 'Lucie', statut: 'Validé', equipe: eq.length > 0, membresEquipe: eq }, x || {}));
  v(8, 22, 'A', 'Reparation', EQ); v(8, 24, 'B', 'Reparation', ['Paul', 'Marc']);
  v(8, 25, 'C', 'Degraffage', EQ); v(8, 29, 'D', 'Degraffage', EQ); v(9, 5, 'E', 'Degraffage', ['Inès']);
  v(8, 30, 'Crais', 'Arrachage', ['Paul', 'Marc'], { etape: 'dem', etapeLbl: 'Démontage' });
  const VALID = { Reparation: ['A', 'B'], Degraffage: ['C', 'D', 'E'] };
  return {
    config: { domaine_nom: 'Essai', visuSaison: 'Hiver 2026', features: {}, eco: { prix_gnr_litre: 1.15, conso_gnr_lh: 6, h_jour: 7 },
      arrachage: { etapes: [{ id: 'dem', lbl: 'Démontage', presta: false }, { id: 'sou', lbl: 'Souches', presta: false }], apres: '*' },
      objectifs_fin: { 'Hiver 2026': '2027-03-26' }, photo: [] },
    saisons: [{ nom: 'Hiver 2026', active: true, debut: '2026-09-14', fin: '2027-03-31', taches: ['Reparation', 'Degraffage', 'Taille', 'Arrachage'] }],
    taches: [{ nom: 'Reparation', label: 'Réparation', hha: 8 }, { nom: 'Degraffage', label: 'Dégraffage', hha: 28 }, { nom: 'Taille', label: 'Taille', hha: 80 },
      { nom: 'Arrachage', label: 'Arrachage', anytime: true, tempsReel: true, complementaire: true }],
    parcelles: P.map(([nom, surface, appellation]) => { const p = { nom, surface, appellation, commune: 'Gevrey-Chambertin', statut: 'Actif', taches: {
      Reparation: VALID.Reparation.includes(nom) ? 'Validé' : 'Non démarré', Degraffage: VALID.Degraffage.includes(nom) ? 'Validé' : 'Non démarré', Taille: 'Non démarré' } };
      if (nom === 'Crais') { p.statut = 'Arrachee'; p.dateArrachage = '2026-10-02'; p.taches = { Arrachage: 'Validé' }; } return p; }),
    tracteurs_list: [], activites: [], sessions: [], traitements: [], journal: J.reverse(),
    paie: { taux: { Lucie: 21.4, Paul: 18.6, Marc: 18.9, Inès: 15.2 } },
    planning_templates: { 2026: { standard: modele() } }, planning_entries: {}, planning_hsup: {},
    membres: ['Lucie', 'Paul', 'Marc', 'Inès'].map((nom, i) => ({ nom, email: nom.toLowerCase().replace('è', 'e') + '@essai.test', roles: i ? ['ouvrier'] : ['admin', 'ouvrier'], statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard' })),
  };
}
const ORDRE = ['config', 'saisons', 'taches', 'parcelles', 'tracteurs_list', 'activites', 'sessions', 'traitements', 'journal', 'paie', 'planning_templates', 'planning_entries', 'planning_hsup', 'membres'];

async function partieA(pil, T) {
  const tmp = path.join(os.tmpdir(), 'mv-ecart1-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.js');
  fs.writeFileSync(tmp, pil + '\nwindow._pecData=_pecData; window._ecoTempsVigne=_ecoTempsVigne; window._pilMargeCalc=_pilMargeCalc;\n');
  // pathToFileURL : sous Windows, un chemin « C:\… » passé à import() se lit comme un schéma (C26 du preflight).
  const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts', 'mv-app-node.mjs')).href + '?' + Math.random());
  let A;
  try { A = await chargerApp({ remplace: { 'pilotage.js': tmp } }); } finally { fs.rmSync(tmp, { force: true }); }
  const { G, setAuj, JOURNAL_ERR } = A;
  setAuj([2026, 9, 8]);
  const D = domaine(), cles = {}; ORDRE.forEach(k => { cles[k] = D[k]; }); A.poser(cles);
  const TV = G._ecoTempsVigne(), E = G._pecData(), d = G._pilData(), m = G._pilMargeCalc(d), V = G._pilCk2Modele(d, m), C = G._pilCk2Eco(d, V);
  const comp = (TV.taches || []).filter(t => !t.hb && t.h > 0 && t.bar > 0), tv = n => comp.find(t => t.nom === n);
  const rep = tv('Reparation'), deg = tv('Degraffage');
  T('A1 la réparation et le dégraffage ont chacun leur ligne : l’écart en heures de « Temps réel contre barème », au chiffre près ('
    + (rep ? rep.ecart.toFixed(1) : '—') + ' % / ' + (deg ? deg.ecart.toFixed(1) : '—') + ' %)',
    !!C && !!rep && !!deg && comp.every(t => C.ecTache[t.nom] != null && pres(C.ecTache[t.nom], t.ecart / 100)) && Object.keys(C.ecTache).length === comp.length);
  T('A2 les heures écrites sous la ligne viennent du même calcul (le barème de ces validations, les heures versées)',
    !!C && comp.every(t => C.hBarTache[t.nom] === Math.round(t.bar * 10) / 10 && C.hReelTache[t.nom] === Math.round(t.h * 10) / 10));
  const sH = comp.reduce((s, t) => s + t.h, 0), sB = comp.reduce((s, t) => s + t.bar, 0);
  T('A3 la tuile = la somme des heures sur la somme des barèmes des lignes (' + (C && C.ecartMoy != null ? (C.ecartMoy * 100).toFixed(1) : '—') + ' %)', !!C && sB > 0 && pres(C.ecartMoy, (sH - sB) / sB));
  T('A4 sous 40 % du travail validé, la cadence ne se calcule pas (' + (E.avc || 0).toFixed(1) + ' %) — et la tuile donne quand même un chiffre, pas 0',
    E.cad.ok === false && E.avc < 40 && !!C && C.ecartMoy !== 0 && isFinite(C.ecartMoy));
  const arr = (TV.taches || []).find(t => t.nom === 'Arrachage');
  T('A5 l’arrachage (travail à l’heure) a ses heures, mais pas de ligne ni de place dans la tuile', !!arr && arr.hb === true && arr.h > 0 && !!C && !('Arrachage' in C.ecTache));
  T('A6 la projection de l’atterrissage n’a pas bougé : la fin projetée du moteur', !!C && pres(C.att, E.projFin, .01));
  T('A7 aucune erreur avalée pendant les calculs', JOURNAL_ERR.length === 0, JOURNAL_ERR.slice(0, 2).map(o => o.msg).join(' | '));
}

// ── A'. La vraie _pilCk2Eco, avec un moteur écrit à la main ─────────────────
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
function eco(pil, E) {
  const ctx = { Math, Number, String, Array, Object, JSON, Date, parseInt, isFinite };
  ctx.window = ctx; ctx.PARCELLES = [{ nom: 'A1', surface: 1, appellation: 'Bourgogne' }];
  vm.createContext(ctx);
  vm.runInContext(fnDe(pil, 'function _pilCk2Eco(d, V){') + `
    function _pecData(){ return ${JSON.stringify(E)}; }
    function _mvToday(){ return '2026-10-25'; }
    this.__E = _pilCk2Eco({}, { photos: [] });`, ctx);
  return ctx.__E;
}
// La capture de Nico : 15,4 h de barème pour 108,2 h réelles ; 322 h pour 374 h — en euros, le dégraffage écrivait +13,1 %.
const E1 = { configured: true, rate: 20, budget: 52536, engage: 14752, resteE: 37784, projFin: 57746, avc: 22, hbH: 0, tot: { moB: 40000, moF: 6000, moR: 30000 },
  postes: [{ k: 'mo', lab: 'Main-d’œuvre', fait: 7000, budget: 40000 }], cad: { ok: false, applic: false, ecart: 0 }, pairs: [],
  tasks: [{ nom: 'Reparation', fE: 300, ecE: 1860, reH: 108.2, reB: 15.4 }, { nom: 'Degraffage', fE: 6440, ecE: 844, reH: 374, reB: 322 },
    { nom: 'Vide', fE: 200, ecE: -200, reH: 0, reB: 10 }, { nom: 'Arr', fE: 0, ecE: null, reH: 30, reB: 12, reHb: true }, { nom: 'Sans', fE: 0, ecE: null, reH: 0, reB: 0 }] };
function partieA2(pil, T) {
  const e = eco(pil, E1);
  T('A8 le dégraffage en heures : 374 h pour 322 h, +16,1 % (en euros il écrivait +13,1 %)', pres(e.ecTache.Degraffage, 52 / 322) && !pres(e.ecTache.Degraffage, 844 / 6440, 1e-3));
  T('A9 la réparation en heures : 108,2 h pour 15,4 h', pres(e.ecTache.Reparation, (108.2 - 15.4) / 15.4));
  T('A10 la tuile = (108,2 + 374) h sur (15,4 + 322) h', pres(e.ecartMoy, (482.2 - 337.4) / 337.4));
  T('A11 pas de ligne sans heure versée (pas de « −100 % »), ni pour un travail à l’heure, ni sans barème', !('Vide' in e.ecTache) && !('Arr' in e.ecTache) && !('Sans' in e.ecTache) && Object.keys(e.ecTache).length === 2);
  T('A12 les heures de la ligne au dixième, et le total des heures réelles inchangé', e.hBarTache.Reparation === 15.4 && e.hReelTache.Reparation === 108.2 && e.hBarTache.Degraffage === 322 && e.hReel === 512);
  const e0 = eco(pil, Object.assign({}, E1, { tasks: [{ nom: 'Taille', fE: 900, ecE: -900, reH: 0, reB: 300 }] }));
  T('A13 rien à comparer : la tuile rend null (un tiret à l’écran), jamais 0', e0.ecartMoy === null && Object.keys(e0.ecTache).length === 0);
}

// ── B. La vue : les vraies fonctions de cockpit-vue.js, extraites et exécutées ─
const ligne = (s, debut, n = 1) => { const L = s.split('\n'), i = L.findIndex(l => l.startsWith(debut));
  if (i < 0 || L.filter(l => l.startsWith(debut)).length !== 1) throw new Error('ligne introuvable ou multiple : ' + debut); return L.slice(i, i + n).join('\n'); };
function vue(src) {
  const i = src.indexOf('\nconst NFH = '), j = src.indexOf('\n', src.indexOf('\nconst taHeures = ') + 1);
  if (i < 0 || j < i) throw new Error('les formats de l’écart au barème sont introuvables');
  const code = [ligne(src, 'const NF0 = '), ligne(src, 'const nb = '), ligne(src, 'const NF1 = '), ligne(src, 'const pct1 = '), src.slice(i + 1, j),
    ligne(src, 'const esc = '), ligne(src, 'const btnI = '), ligne(src, 'const entete = ', 2),
    "let TACHES = [{ id: 'reparation', cle: 'Reparation', nom: 'Réparation' }, { id: 'degraffage', cle: 'Degraffage', nom: 'Dégraffage' }, { id: 'taille', cle: 'Taille', nom: 'Taille' }];",
    "let V = { eco: { ecTache: { Reparation: (108.2 - 15.4) / 15.4, Degraffage: 52 / 322 } } };",
    ligne(src, 'const tachesE = '), fnDe(src, 'function htmlTaches(r) {'),
    'this.api = { ecTxt, ecCadre, hTxt, taBarre, taClasse, taHeures, htmlTaches };'].join('\n');
  const ctx = { Intl, Math, Number, String, Array, Object, isFinite }; vm.createContext(ctx); vm.runInContext(code, ctx); return ctx.api;
}
const NNBSP = '\u202f';
function partieB(S, T) {
  const v = vue(S.vue), code = sansCom(S.vue);
  T('B1 le tiret quand rien n’est à comparer ; un vrai zéro mesuré reste « 0,0 % »', v.ecTxt(null) === '\u2014' && v.ecTxt(NaN) === '\u2014' && v.ecTxt(.4292) === '+42,9' + NNBSP + '%' && v.ecTxt(0) === '0,0' + NNBSP + '%');
  const b1 = v.taBarre(13.1), b2 = v.taBarre(620.4), b3 = v.taBarre(50), b4 = v.taBarre(-70);
  T('B2 la barre à l’échelle jusqu’à ±50 % : 13 % prend 13 % de la piste, 620 % la remplit et passe hors échelle', pres(b1.w, 13.1) && !b1.hors && b2.w === 50 && b2.hors && b3.w === 50 && !b3.hors && b4.w === 50 && b4.hors);
  const h = v.htmlTaches({ t: { reparation: { ecart: (108.2 - 15.4) / 15.4, hB: 15.4, hR: 108.2 }, degraffage: { ecart: 52 / 322, hB: 322, hR: 374 }, taille: { ecart: 0, hB: 0, hR: 0 } } });
  const wDeg = (Math.min(50, 5200 / 322) / 50 * 50).toFixed(1);
  T('B3 la carte dessinée : la réparation pleine, en pointe ; le dégraffage à ' + wDeg + ' % ; la taille, sans rien à comparer, absente',
    h.includes('<i class="ck-ta-v lent hors" id="ck-ta-v-reparation" style="left:50%;width:50.0%">') && h.includes('<i class="ck-ta-v lent" id="ck-ta-v-degraffage" style="left:50%;width:' + wDeg + '%">')
    && !h.includes('ck-ta-v-taille') && h.includes('+602,6' + NNBSP + '%') && h.includes('+16,1' + NNBSP + '%'));
  T('B4 sous la ligne, les heures du même calcul — au dixième sous 100 h', h.includes('15,4' + NNBSP + 'h de barème, 108' + NNBSP + 'h réelles') && h.includes('322' + NNBSP + 'h de barème, 374' + NNBSP + 'h réelles')
    && v.hTxt(15.44) === '15,4' + NNBSP + 'h' && v.hTxt(374.4) === '374' + NNBSP + 'h');
  T('B5 la tuile lit le total, garde le tiret, et dit ce qu’elle compare', v.ecCadre({ ecartMoy: null }) === 'rien de validé à comparer' && v.ecCadre({ ecartMoy: .4 }) === 'heures réelles face au barème'
    && code.includes("{ const em = (v.eco || {}).ecartMoy; r.ecartMoy = (em == null || !isFinite(em)) ? null : em; }")
    && code.includes(`'<b id="ck-ek-ec">' + ecTxt(r.ecartMoy) + '</b>'`) && code.includes(`'<span id="ck-ek-ec-c">' + ecCadre(r) + '</span>'`)
    && code.includes("$('#ck-ek-ec').textContent = ecTxt(r.ecartMoy);") && code.includes("$('#ck-ek-ec-c').textContent = ecCadre(r);"));
  T('B6 en direct : une ligne qui manque fait redessiner la carte ; sinon la barre, sa pointe et ses heures se mettent à jour',
    code.includes("if (tachesE().length !== $$('#ck-etac .ck-ta').length || tachesE().some(t => !$('#ck-ta-v-' + t.id))) $('#ck-etac').innerHTML = htmlTaches(r);")
    && code.includes('  else tachesE().forEach(t => {') && code.includes('    v.className = taClasse(e);') && code.includes("    $('#ck-ta-s-' + t.id).textContent = taHeures(x);"));
  T('B7 plus d’échelle à 10 %, plus d’heures de barème venues de calcHeures dans la carte', !code.includes('Math.min(10, Math.abs(e)) / 10 * 50') && !/const B = 10/.test(code) && !code.includes("nb(x.hF) + ' h de barème"));
  T('B8 la feuille : la pointe vers l’extérieur, des deux côtés', /\.ck-ta-v\.hors\.lent\{clip-path:polygon\(/.test(S.css) && /\.ck-ta-v\.hors\.vite\{clip-path:polygon\(/.test(S.css));
}

// ── C. L'accompagnement ; D. le branchement ────────────────────────────────
function partieC(S, T) {
  T('C1 les fiches « i » : la tuile est le total de la carte ; la carte, ses heures et son échelle', S.vue.includes("  ecart: 'Le total de la carte « Écart au barème, par tâche » : toutes les heures réellement versées")
    && /  taches: '[^\n]*« Temps réel contre barème »[^\n]*La barre est à l’échelle jusqu’à 50 % ; au-delà, elle est pleine et finit en pointe\./.test(S.vue));
  T('C2 l’aide du Pilotage dit ce qu’est l’écart au barème', S.uti.includes('l’écart au barème (le total des tâches de la carte « par tâche », en heures réelles face au barème des parcelles validées ; un tiret tant que rien n’est à comparer)'));
  T('C3 le guide public le dit aussi', S.guide.includes("L'<b>écart au barème</b> est le total de la carte « Écart au barème, par tâche »"));
  T('C4 la nouveauté au Journal (niveau 0, une correction), pour les administrateurs', /\{ v: '10\.15', d: '2026-10-26', items: \[\n    \{ niv: 0, pour: \['admin'\], emoji: 'graphique', titre: 'Pilotage › Aujourd’hui, vue Économie : l’écart au barème dit la même chose partout',/.test(S.uti));
  T('C5 la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.includes("['node scripts/mv-harnais-ecart1.mjs']") && S.liste.includes("['node scripts/mv-harnais-ecart1.mjs --contre']"));
}

let ok = 0, ko = 0; const echecs = [];
const T = (nom, c, det) => { if (c) { ok++; if (!CONTRE) console.log('   ok     ' + nom); } else { ko++; echecs.push(nom); if (!CONTRE) console.log('   ROUGE  ' + nom + (det ? '  → ' + det : '')); } };
const BASE = { pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), uti: lire('src/utils.js'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
const garde = (f, S) => { try { f(S, T); } catch (e) { ko++; echecs.push('plantage : ' + (e && e.message)); if (!CONTRE) console.log('   ROUGE  plantage : ' + (e && e.message)); } };

if (!CONTRE) {
  console.log('\n  MA VIGNE — Harnais ECART-1 : l’écart au barème en heures, la tuile égale au total de la carte\n');
  try { await partieA(BASE.pil, T); } catch (e) { ko++; console.log('   ROUGE  plantage A : ' + (e && e.message)); }
  garde((S) => partieA2(S.pil, T), BASE); garde(partieB, BASE); garde(partieC, BASE);
  console.log(ko ? '\n' + ko + ' ROUGE(S) sur ' + (ok + ko) : '\nTOUT VERT — ' + ok + ' assertions');
  process.exit(ko ? 1 : 0);
}
// --contre : chaque défaut, réinjecté dans une copie, doit faire rougir au moins une assertion.
const DEFAUTS = [
  ['la tuile retombe sur la cadence', 'pil', 'att:att, ecartMoy:ecartMoy,', 'att:att, ecartMoy:(E.cad&&E.cad.ok&&E.cad.ecart!=null)?E.cad.ecart/100:0,'],
  ['l’écart par tâche repasse en euros', 'pil', 'ecTache[t.nom]=(h-b)/b;', 'ecTache[t.nom]=t.fE>0?t.ecE/t.fE:0;'],
  ['un « −100 % » sans heure versée', 'pil', 'if(h>0 && b>0 && !t.reHb){', 'if(b>0 && !t.reHb){'],
  ['un travail à l’heure comparé au barème', 'pil', 'if(h>0 && b>0 && !t.reHb){', 'if(h>0 && b>0){'],
  ['rien à comparer redevient 0', 'pil', 'var ecartMoy=sB>0?(sH-sB)/sB:null;', 'var ecartMoy=sB>0?(sH-sB)/sB:0;'],
  ['la ligne perd le barème du temps réel', 'pil', '    t.reB = x ? (Number(x.bar)||0) : 0;\n', '    t.reB = 0;\n'],
  ['le tiret redevient « 0,0 % »', 'vue', "const ecTxt = v => (v == null || !isFinite(v)) ? '\\u2014' : pct1(v * 100);", 'const ecTxt = v => pct1((v || 0) * 100);'],
  ['l’échelle retombe à 10 %', 'vue', 'const TA_ECH = 50;', 'const TA_ECH = 10;'],
  ['plus de pointe hors échelle', 'vue', "(taBarre(e).hors ? ' hors' : '')", "''"],
  ['les heures de la ligne reviennent de calcHeures', 'vue', 'const taHeures = x => hTxt(x.hB)', 'const taHeures = x => hTxt(x.hF)'],
  ['la tuile garde 0 quand rien n’est à comparer', 'vue', '{ const em = (v.eco || {}).ecartMoy; r.ecartMoy = (em == null || !isFinite(em)) ? null : em; }', 'r.ecartMoy = (v.eco || {}).ecartMoy || 0;'],
  ['la mise à jour ne redessine plus la carte', 'vue', "  if (tachesE().length !== $$('#ck-etac .ck-ta').length || tachesE().some(t => !$('#ck-ta-v-' + t.id))) $('#ck-etac').innerHTML = htmlTaches(r);\n  else tachesE().forEach(", '  tachesE().forEach('],
  ['la pointe sort de la feuille', 'css', '.ck-ta-v.hors.lent{clip-path:polygon(', '.ck-ta-v.hors.lent{opacity:polygon('],
];
console.log('\n  MA VIGNE — Harnais ECART-1, contre-épreuves (' + DEFAUTS.length + ')\n');
let mordent = 0;
for (const [nom, cle, avant, apres] of DEFAUTS) {
  if (BASE[cle].split(avant).length !== 2) { console.log('   ROUGE  ancre introuvable ou multiple : ' + nom); continue; }
  const S = Object.assign({}, BASE, { [cle]: BASE[cle].replace(avant, apres) });
  ok = 0; ko = 0; echecs.length = 0;
  if (cle === 'pil') { try { await partieA(S.pil, T); } catch (e) { ko++; echecs.push('plantage A : ' + (e && e.message)); } }
  garde((x) => partieA2(x.pil, T), S); garde(partieB, S); garde(partieC, S);
  if (ko) { mordent++; console.log('   mord   ' + nom + '  (' + echecs[0] + ')'); } else console.log('   ROUGE  muette : ' + nom);
}
console.log(mordent === DEFAUTS.length ? '\nTOUT VERT — ' + mordent + '/' + DEFAUTS.length + ' contre-épreuves mordent' : '\n' + (DEFAUTS.length - mordent) + ' contre-épreuve(s) muette(s)');
process.exit(mordent === DEFAUTS.length ? 0 : 1);
