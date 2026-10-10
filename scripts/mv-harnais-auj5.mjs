// HARNAIS — AUJ-5 (§307) : le cockpit Aujourd'hui remis à la maquette, le planning qui fait foi.
//   node scripts/mv-harnais-auj5.mjs           → doit être vert
//   node scripts/mv-harnais-auj5.mjs --contre  → chaque défaut réinjecté doit rougir
// A. cockpit.js/_ckSvAbsences EXÉCUTÉ : un week-end ne coupe plus une absence ni ne sert de retour ; l'arrêt dit sa fin.
// B. pilotage.js EXÉCUTÉ dans l'appli entière (mv-app-node) : un samedi sans travail au planning, personne n'est
//    « présent » ; le cockpit montre le prochain jour travaillé ; jours travaillés et nom de la saison lus au planning.
// C. Lu : l'ouverture sur Aujourd'hui, la disposition (trois colonnes dès 1 000 px, « À savoir » à droite et collant),
//    la carte qui se redessine, la charge en points, la météo en couleurs, la pastille qui clignote.
import fs from 'fs'; import os from 'os'; import path from 'path'; import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
const BASE = { ck: lire('src/cockpit.js'), pil: lire('src/pilotage.js'), vue: lire('src/cockpit-vue.js'), css: lire('src/styles.css'), app: lire('src/app.js') };
const { chargerApp } = await import(pathToFileURL(path.join(R, 'scripts/mv-app-node.mjs')).href);

function partieA(S, T) {
  const ctx = { console, Date, Math, JSON, Intl, Number, String, Array, Object, Set, Map, isFinite, parseFloat, parseInt,
    setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => null, setItem() {} }, navigator: { onLine: true },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: () => ({ style: {} }) } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(S.ck, ctx);
  const now = new Date(2026, 9, 10, 9, 0);   // samedi
  const PE = { Hugo: { 2026: { 9: {} } }, Alicia: { 2026: { 9: {} } }, Paul: { 2026: { 9: {} } }, Loin: { 2026: { 9: {} } }, Ines: { 2026: { 9: {} } }, Theo: { 2026: { 9: {} } } };
  [14, 15].forEach(d => { PE.Ines[2026][9][d] = { absent: true, comment: 'Formation CACES' }; });
  [12, 13].forEach(d => { PE.Theo[2026][9][d] = { type: 'cp' }; }); PE.Theo[2026][9][14] = { type: 'recup' };
  [12, 13, 14, 15, 16, 19, 20, 21, 22, 23].forEach(d => { PE.Hugo[2026][9][d] = { type: 'cp' }; });
  [12, 13].forEach(d => { PE.Alicia[2026][9][d] = { absent: true, comment: 'Maladie' }; });
  [12, 13, 14, 15, 16].forEach(d => { PE.Paul[2026][9][d] = { type: 'cp' }; });
  PE.Loin[2026][9][20] = { type: 'cp' };
  const etatDe = e => { if (e.type === 'cp') return { etat: 'cp', motif: '' }; if (e.type === 'recup') return { etat: 'recup', motif: '' }; if (e.absent) return { etat: /malad/i.test(e.comment || '') ? 'maladie' : 'absent', motif: e.comment || '' }; return { etat: 'present', motif: '' }; };
  const M = [{ nom: 'Hugo' }, { nom: 'Alicia' }, { nom: 'Paul' }, { nom: 'Loin' }, { nom: 'Ines' }, { nom: 'Theo' }];
  const ab = ctx._ckSvAbsences(M, PE, etatDe, now), par = n => ab.find(x => x.titre.startsWith(n));
  T('A1 un congé de deux semaines est UNE absence (le week-end ne la coupe pas)', par('Hugo') && par('Hugo').quand === 'Du lun. 12 oct. au ven. 23 oct.');
  T('A2 le retour tombe le lundi suivant, jamais un samedi', par('Hugo') && par('Hugo').sous === 'De retour le lun. 26 oct.' && par('Paul') && par('Paul').sous === 'De retour le lun. 19 oct.');
  T('A3 un arrêt maladie dit sa fin, sans double point', par('Alicia') && par('Alicia').titre === 'Alicia en arrêt' && par('Alicia').sous === 'Fin d’arrêt le mar. 13 oct.');
  T('A4 une absence qui commence au-delà de la semaine n’est pas annoncée', !par('Loin'));
  T('A6 le motif ne cache plus la date de retour', par('Ines') && par('Ines').sous === 'Formation CACES. De retour le ven. 16 oct.');
  T('A7 une autre absence qui enchaîne est dite, pas « pas de retour »', par('Theo') && par('Theo').sous === 'Puis en récupération.');
  const ab2 = ctx._ckSvAbsences(M, PE, etatDe, now, () => true);
  T('A5 la question est posée au planning : s’il prévoit le samedi, le retour est samedi', ab2.find(x => x.titre.startsWith('Paul')).sous === 'De retour le sam. 17 oct.');
}

async function partieB(S, T) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-auj5-')), f = path.join(tmp, 'pilotage.js'); fs.writeFileSync(f, S.pil);
  const A = await chargerApp({ remplace: { 'pilotage.js': f } }); fs.rmSync(tmp, { recursive: true, force: true });
  const { G, poser, setAuj, mem } = A;
  const mod = () => { const t = { _timings: {} }; for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new Date(2026, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(2026, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7.5 : 0; } } return t; };
  const PE = { Hugo: { 2026: { 9: {} } }, Alicia: { 2026: { 9: {} } } };
  [12, 13, 14, 15, 16].forEach(d => { PE.Hugo[2026][9][d] = { type: 'cp' }; }); [12, 13].forEach(d => { PE.Alicia[2026][9][d] = { absent: true, comment: 'Maladie' }; });
  const MB = ['Nico', 'Victor', 'Shana', 'Alicia', 'Hugo'].map(n => ({ nom: n, statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['ouvrier'] })).concat([{ nom: 'Chloe', statut: 'Actif', bureau: true, planning_id: 'standard', roles: [] }]);
  setAuj([2026, 9, 10]);
  poser({ membres: MB, planning_templates: { 2026: { standard: mod() } }, planning_entries: PE, saisons: [{ nom: 'Automne 2026', active: true, debut: '2026-09-21', fin: '2026-12-20' }],
    parcelles: [{ nom: 'Clos A', surface: 0.5, statut: 'Actif', appellation: 'Bourgogne', taches: {} }], config: { domaine_nom: 'Test' } });
  G.METEO_DAILY = { time: ['2026-10-10', '2026-10-11', '2026-10-12'], code: [0, 0, 0], tmax: [12, 12, 12], tmin: [4, 4, 4] }; G.METEO_HOURLY = null;
  let d = null, V = null;
  try { d = G._pilData(); V = G._pilCk2Modele(d, { obj: new Date(2026, 9, 23) }); } catch (e) { T('B0 le modèle se calcule (' + e.message + ')', false); return; }
  T('B1 samedi sans travail au planning : personne n’est présent, la journée est chômée', d.jourTravaille === false && d.nVchamp === 0 && d.presences.filter(p => !p.bureau).every(p => p.etat === 'repos'));
  T('B2 le cockpit montre le prochain jour travaillé et le dit', V.jourTravaille === false && V.jourEff === '2026-10-12' && /^Lundi : 3 sur 5/.test(V.decision.pres.v) && /^Repos aujourd’hui · lundi : /.test(V.absTxt));
  T('B3 les jours travaillés viennent du planning (lundi oui, samedi et dimanche non)', Array.isArray(V.ouvres) && V.ouvres.includes('2026-10-12') && !V.ouvres.includes('2026-10-11') && !V.ouvres.includes('2026-10-17'));
  T('B4 le brûlage suit le planning : chômé samedi et dimanche, possible lundi', V.meteo.length === 3 && V.meteo[0].brul === 0 && V.meteo[1].brul === 0 && V.meteo[2].brul === 1);
  T('B5 la phrase de fin prévue nomme la saison de la période (« d’automne »)', V.saisonDe === 'd’automne');
  setAuj([2026, 9, 12]); d = G._pilData();
  const et = n => (d.presences.find(p => p.nom === n) || {}).etat;
  T('B6 lundi : les absents du planning manquent, les autres sont là', d.jourTravaille === true && et('Hugo') === 'cp' && et('Alicia') === 'maladie' && et('Nico') === 'present' && d.nVchamp === 5 && d.presentFiches === 3);
  G._pilOuvrirAujourdhui();
  T('B7 à l’ouverture, le Pilotage repart sur Aujourd’hui', Object.keys(mem).some(k => k.indexOf('mavigne_pil_tab_') === 0 && mem[k] === 'auj'));
}

function partieC(S, T) {
  const app = sansCom(S.app), vue = sansCom(S.vue), css = S.css;
  T('C1 goHub ouvre le Pilotage sur Aujourd’hui avant d’atterrir', /function goHub\(\)\{[^\n]*_pilOuvrirAujourdhui\(\)[^\n]*_goLanding\(\); \}/.test(app));
  T('C2 trois colonnes dès 1 000 px de contenu, « À savoir » à droite entre 760 et 1 000', vue.includes("const taille = w >= 1000 ? 'large' : w >= 760 ? 'moyen' : 'petit';") && vue.includes("moyen: [['verdict', 'decision', 'plan', 'chant', 'courbe', 'fil'], [], ['savoir']]"));
  T('C3 « À savoir » colle : la page du Pilotage n’est plus un conteneur de défilement', css.includes('#page-pilotage:has(.ck2){overflow-x:clip;overflow-y:visible}') && css.includes('[data-taille="large"] #ck-t-c,[data-taille="moyen"] #ck-t-c{position:sticky;'));
  T('C4 la carte se redessine : sa case est observée, et une case sans largeur est réessayée', vue.includes('if (ci) obs.observe(ci);') && /if \(W < 120\) \{ if \(planEssais\+\+ < 30\) requestAnimationFrame\(\(\) => dessinerPlan\(true\)\); return; \}/.test(vue));
  T('C5 la charge restante en points : plus de zone remplie', !vue.includes("ck-c-aire") && vue.includes('<g id="ck-c-mes" class="ck-c-mes"></g>') && vue.includes("mes.innerHTML = pts.slice(0, -1).map("));
  T('C6 la tuile Budget se lit en clair', (vue.match(/du budget main-d’œuvre dépensé, pour /g) || []).length === 2 && !vue.includes('de la main-d’œuvre, pour'));
  T('C7 la météo a ses couleurs à elle, tirées de la racine', css.includes(':root{--meteo-soleil:var(--or);--meteo-pluie:var(--bleu);--meteo-nuage:var(--texte-doux)}') && vue.includes('class="m-sol"') && vue.includes('class="m-eau"') && vue.includes('class="m-nuage"'));
  T('C8 la pastille de présence clignote un jour travaillé, fixe si les animations sont coupées', vue.includes("calque.classList.toggle('vif', !!(V && V.jourTravaille !== false));") && css.includes('.ck2 .ck-calque.vif .ck-eq::before{display:block;') && css.includes('@media (prefers-reduced-motion:reduce){.ck2 .ck-calque.vif .ck-eq::before{display:none}}'));
  T('C9 une seule échelle : la phrase de fin prévue à 28 px, titres et réponses à 20 px', css.includes('.ck2 .ck-v-phrase{max-width:16em;font-size:var(--pt-xl,28px);line-height:1.15}') && css.includes('.ck2 .ck-titre-p,.ck2 .ck-dz-v,.ck2 .ck-ek-calme{font-size:var(--pt-md,20px)}'));
}

async function verifier(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  for (const [lib, f] of [['A', () => partieA(S, T)], ['B', () => partieB(S, T)], ['C', () => partieC(S, T)]]) {
    try { await f(); } catch (e) { T(lib + ' a planté : ' + e.message, false); }
  }
  return out;
}
const remp = (s, a, b) => { if (!s.includes(a)) throw new Error('contre-épreuve introuvable : ' + a.slice(0, 60)); return s.replace(a, b); };
if (!CONTRE) {
  const res = await verifier(BASE); let ko = 0;
  res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  vert  ' : '  ROUGE ') + n); });
  console.log(ko ? `AUJ-5 : ${ko} ROUGE(S) sur ${res.length}` : `AUJ-5 : ${res.length} vertes`); process.exit(ko ? 1 : 0);
} else {
  const DEF = [
    ['un week-end coupe de nouveau une absence', S => ({ ...S, ck: remp(S.ck, 'if(!prevu(m, _ckPlusJ(t, k))) continue;', 'if(false) continue;') })],
    ['le motif cache de nouveau la date de retour', S => ({ ...S, ck: remp(S.ck, "(pl.motif ? _ckPt(pl.motif) + ' ' : '') + fin;", '(pl.motif || fin);') })],
    ['« Fin d’arrêt le mar. 13 oct.. » revient', S => ({ ...S, ck: remp(S.ck, "_ckPt('Fin d’arrêt le ' + _ckJc(d1))", "'Fin d’arrêt le ' + _ckJc(d1) + '.'") })],
    ['un jour sans travail redevient « présent »', S => ({ ...S, pil: remp(S.pil, "if(!_pilPrevuLe(m,_now)){ etat='repos'; motif=''; }", '') })],
    ['« de la saison » revient', S => ({ ...S, pil: remp(S.pil, "var sais=(typeof d.saison==='string')", "var sais=(false)") })],
    ['le seuil des trois colonnes remonte à 1 150 px', S => ({ ...S, vue: remp(S.vue, 'w >= 1000 ?', 'w >= 1150 ?') })],
    ['la page du Pilotage redevient un conteneur de défilement', S => ({ ...S, css: remp(S.css, '#page-pilotage:has(.ck2){overflow-x:clip;overflow-y:visible}', '') })],
    ['goHub n’ouvre plus Aujourd’hui', S => ({ ...S, app: remp(S.app, " try{ if(window._pilOuvrirAujourdhui) window._pilOuvrirAujourdhui(); }catch(e){ if(window._mvAvale) window._mvAvale(e,'app.js/goHub#auj'); }", '') })],
    ['la zone remplie de la charge revient', S => ({ ...S, vue: remp(S.vue, '<g id="ck-c-mes" class="ck-c-mes"></g>', '<path id="ck-c-aire" class="ck-c-aire"/>') })],
  ];
  let muettes = 0;
  for (const [lib, f] of DEF) {
    let rougit = false;
    try { const res = await verifier(f(BASE)); rougit = res.some(([, ok]) => !ok); } catch (e) { rougit = true; }
    console.log((rougit ? '  rougit   ' : '  MUETTE   ') + lib); if (!rougit) muettes++;
  }
  console.log(muettes ? `AUJ-5 contre-épreuves : ${muettes} MUETTE(S) sur ${DEF.length}` : `AUJ-5 contre-épreuves : ${DEF.length} sur ${DEF.length} rougissent`);
  process.exit(muettes ? 1 : 0);
}
