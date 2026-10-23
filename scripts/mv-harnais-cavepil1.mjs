/* ───────────────────────────────────────────────────────
   HARNAIS — CAVEPIL-1 (§436) : LA VUE CAVE DU PILOTAGE (bascule Terrain · Cave · Économie)
   Lancer :          node scripts/mv-harnais-cavepil1.mjs
   Contre-épreuves : node scripts/mv-harnais-cavepil1.mjs --contre

   POURQUOI IL EXISTE
   Nico (22/10) : « l'introduction du module Cave dans le module de pilotage » ; maquette validée le 23/10 (« go »,
   « exactement comme la maquette »). Le danger connu est celui de CAVE-3 (§96) : un Pilotage qui refait les calculs de la
   Cave et finit par dire autre chose qu'elle. Ce harnais grave :
   1. le verdict est celui de la Cave, mot pour mot (sa pastille : Prioritaire / À faire / À jour) ;
   2. l'état d'une cuve ou d'une cuvée vient de la synthèse de la Cave ; une cuve décuvée sans geste est « vide » ;
   3. la semaine : du lundi au vendredi, les journées de cave du Planning comptées en jours (journée 1, demi ½), et le manque
      dit seulement quand un soutirage ou un ouillage n'a pas de journée de cave ;
   4. le millésime lit la chaîne de la Cave ; « environ », jamais « ≈ » (hors de la police) ;
   5. « À savoir » : un signe fort en tête, un ouillage en retard, les soutirages à prévoir, le Diagnostic sans signe ;
   6. la ligne Cave de Terrain n'est jamais un « point à anticiper » (prio 2), et se masque ;
   7. module masqué ou vue décochée : pas de vue ;
   8. côté Cave : _caveSynthese exposée, le signe fort du Diagnostic en tête du verdict, et l'Aujourd'hui de la Cave le passe ;
      côté Diagnostic : _dgnSynthese fait le calcul de l'onglet ;
   9. côté cockpit : la vue entre Terrain et Économie, aucune bascule Cave sans modèle, aucun bouton de geste, les pastilles
      du jeu commun, une feuille par jetons, la matière dans la charte (les deux sombres identiques) ;
  10. il est branché dans la liste des contrôles.
   ⚠️ Il ne regarde pas un écran : la preuve au navigateur se fait au lot (captures).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), cave: lire('src/cave.js'), diag: lire('src/diagnostic.js'), vue: lire('src/cockpit-vue.js'),
  css: lire('src/styles.css'), charte: lire('src/charte.css'), liste: lire('scripts/mv-harnais-liste.mjs') };

function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
function bloc(src, debut, fin) { const i = src.indexOf(debut), j = src.indexOf(fin, i + 1); return (i < 0 || j < 0) ? '' : src.slice(i, j + fin.length); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }

// Le domaine de démo au 22/10/2026, tel que la Cave le synthétise (relevé dans l'appli construite).
const SEM = () => [
  { lundi: '2026-10-19', dim: '2026-10-25', items: [
    { kind: 'mesure', titre: 'Cuve 5 — bois 80 hL', detail: 'dernier relevé il y a 1 j', urgence: '', ref: 'v2', date: '2026-10-22' },
    { kind: 'mesure', titre: 'Cuve 7 — inox 60 hL', detail: 'dernier relevé il y a 2 j', urgence: 'due', ref: 'v3', date: '2026-10-22' },
    { kind: 'soutirage', titre: 'Gevrey-Chambertin VV ’25', detail: 'malo finie, pas encore soutirée', ref: 'c1', date: '2026-10-22' },
    { kind: 'soutirage', titre: 'Fixin 1er Cru ’25', detail: 'malo finie, pas encore soutirée', ref: 'c2', date: '2026-10-22' },
    { kind: 'ouillage', titre: 'Fixin 1er Cru ’25', detail: '3 fûts · ~21 L', urgence: 'due', futs: 3, ref: 'c2', date: '2026-10-22' },
    { kind: 'fa', titre: 'Cuve 3 — inox 120 hL', detail: 'fin de fermentation estimée · ± 1 j', note: 'densité 1007 · −7 pts/j', ref: 'v1', date: '2026-10-24' }] },
  { lundi: '2026-10-26', dim: '2026-11-01', items: [
    { kind: 'ouillage', titre: 'Gevrey-Chambertin VV ’25', detail: '10 fûts · ~70 L', futs: 10, ref: 'c1', date: '2026-10-30' },
    { kind: 'ouillage', titre: 'Bourgogne Pinot Noir ’25', detail: '8 fûts · ~56 L', futs: 8, ref: 'c3', date: '2026-10-30' }] },
  { lundi: '2026-11-02', dim: '2026-11-08', items: [{ kind: 'ouillage', titre: 'Vieilles Vignes ’26', detail: '22 fûts · ~154 L', futs: 22, ref: 'c4', date: '2026-11-04' }] },
  { lundi: '2026-11-09', dim: '2026-11-15', items: [] }];
const Y0 = () => ({ auj: '2026-10-22', mil: 2026, sem: SEM(), phase: 'vendange', suivies: 4, parc: null, diag: [],
  verdict: { cls: 'due', t: '2 cuves à mesurer', s: 'Pas de relevé depuis hier ou avant. Puis : 1 cuvée à ouiller · 2 cuvées ont fini leur malo.' },
  cuves: [
    { id: 'v1', nom: 'Cuve 3 — inox 120 hL', statut: 'fa', cap: 120, kg: 14550, hl: 107.8, parcelles: ['Les Charmes', 'La Combotte'], d20: 1006, temp: 23, jRel: 0, jEntree: 12, note: 'Fin de FA proche', faPct: 86, proj: { etat: 'normal', date: '2026-10-24', marge: 1, pente: 7 }, decuvage: null, e: 'cours' },
    { id: 'v2', nom: 'Cuve 5 — bois 80 hL', statut: 'mpf', cap: 80, kg: 10050, hl: 74.4, parcelles: ['Aux Murgers'], d20: 1095, temp: 13, jRel: 1, jEntree: 5, note: 'Grappes entières', faPct: null, proj: { etat: 'mpf' }, decuvage: null, e: 'faire' },
    { id: 'v3', nom: 'Cuve 7 — inox 60 hL', statut: 'termine', cap: 60, kg: 6850, hl: 0, parcelles: [], d20: 1015, temp: 24, jRel: 2, jEntree: 14, note: '', faPct: null, proj: null, decuvage: { date: '2026-10-21', cuvee: 'Vieilles Vignes ’26', hl: 50, faFinie: false }, e: 'faire' },
    { id: 'v4', nom: 'Cuve 9 — inox 40 hL', statut: 'termine', cap: 40, kg: 3000, hl: 0, parcelles: [], d20: 994, temp: 18, jRel: 6, jEntree: 20, note: '', faPct: null, proj: null, decuvage: { date: '2026-10-15', cuvee: 'Rosé ’26', hl: 20, faFinie: true }, e: 'ok' }],
  cuvees: [
    { id: 'c3', nom: 'Bourgogne Pinot Noir ’25', mil: 2025, futs: 8, hl: 18.2, tonneaux: [{ annee: 2024, nb: 8 }], ouillage: { g: '4 j', s: ' sur 14', d: '', cls: '', last: '2026-10-18' }, malo: { t: 'Pas d’analyse', cls: '', s: '' }, soutirer: false, sout: '2026-10-18', analyse: null, kinds: [], e: 'ok' },
    { id: 'c1', nom: 'Gevrey-Chambertin VV ’25', mil: 2025, futs: 10, hl: 22.8, tonneaux: [{ annee: 2025, nb: 6 }, { annee: 2023, nb: 4 }], ouillage: { g: '6 j', s: ' sur 14', d: 'prochain ven. 30', cls: '', last: '2026-10-16' }, malo: { t: 'Finie', cls: 'mvpas-fait', s: '' }, soutirer: true, sout: null, analyse: '2026-10-02', kinds: ['soutirage'], e: 'faire' },
    { id: 'c4', nom: 'Vieilles Vignes ’26', mil: 2026, futs: 22, hl: 50, tonneaux: [{ annee: 2026, nb: 6 }, { annee: 2025, nb: 8 }, { annee: 2023, nb: 8 }], ouillage: null, malo: { t: 'Après la FA', cls: '', s: 'la FA finit en fût' }, soutirer: false, sout: null, analyse: null, kinds: [], e: 'cours' },
    { id: 'c2', nom: 'Fixin 1er Cru ’25', mil: 2025, futs: 3, hl: 6.8, tonneaux: [{ annee: 2025, nb: 3 }], ouillage: { g: '19 j', s: ' sur 14', d: '+5\u00a0j', cls: 'due', last: '2026-10-03' }, malo: { t: 'Finie', cls: 'mvpas-fait', s: '' }, soutirer: true, sout: null, analyse: null, kinds: ['soutirage', 'ouillage'], e: 'faire' }],
  btl: [{ id: 'c0', nom: 'Gevrey-Chambertin VV ’23', n: 1480, date: '2026-02-24' }],
  recents: [{ d: '2026-10-22', ic: 'thermometre', t: 'Relevé', q: 'Cuve 3 — inox 120 hL', s: '1006 à 23 °C' },
    { d: '2026-10-21', ic: 'cuve', t: 'Décuvage', q: 'Cuve 7 — inox 60 hL \u2192 Vieilles Vignes ’26', s: '' },
    { d: '2026-10-18', ic: 'hautbas', t: 'Soutirage', q: 'Bourgogne Pinot Noir ’25', s: 'par Jean' }] });
const CHAINE = { kg: 35950, kgVendu: 4500, kgHl: 135, hlCuve: 182, hlDecuve: 50, futs: 22, hlFut: 50, btl: 0, parcelles: 8, cuves: [{ statut: 'fa' }, { statut: 'mpf' }, { statut: 'termine' }] };
const DIAG0 = [{ id: 'c1', nom: 'Gevrey-Chambertin VV', g: 'ok', txt: 'Aucune anomalie', mise: false, nAna: 2 }, { id: 'c2', nom: 'Fixin 1er Cru', g: 'ok', txt: '', mise: false, nAna: 0 },
  { id: 'c3', nom: 'Bourgogne Pinot Noir', g: 'ok', txt: '', mise: false, nAna: 0 }, { id: 'c4', nom: 'Vieilles Vignes', g: 'ok', txt: '', mise: false, nAna: 0 }];

function monter(S) {
  const code = corps(S.pil, '_pilCk2Cave');
  return (o) => {
    o = o || {};
    const Y = o.Y || Y0(), show = o.show || {};
    const win = { CAVE_ELEVAGE: { cuvees: [] }, CAVE_VENDANGE: { cuves_vinif: [] }, CONFIG: { cave_jours: o.cj || {} },
      _caveSynthese: () => Y, _mlGestes: (L) => (L || []).filter((i) => i && i.kind !== 'fa' && i.kind !== 'demarrage'),
      _mlChaine: (m) => (String(m) === '2026' ? CHAINE : (String(m) === '2025' ? { hlFut: 47.8, futs: 21, btl: 0 } : { hlFut: 0, futs: 0, btl: 1480 })),
      _mlRdtMoyen: () => ({ hlHa: null }), _mlMillesimes: () => [2026, 2025, 2023], _dgnSynthese: () => (o.diag || DIAG0),
      _laboLignes: () => [{ date: '2026-10-02' }, { date: '2026-09-04' }], _mvModOff: (m) => !!o.off && m === 'cave', _mvAvale: (e) => { throw e; } };
    const V = { savoir: [], admin: true };
    const f = new Function('window', '_pilShow', code + '\nreturn _pilCk2Cave;')(win, (k) => show[k] !== 0);
    return { C: f(V), V };
  };
}

function verifier(S) {
  const R = []; const T = (nom, ok) => R.push([nom, !!ok]);
  const essai = (nom, f) => { try { T(nom, f()); } catch (e) { T(nom + ' (' + e.message + ')', false); } };
  let mk = null;
  try { mk = monter(S); } catch (e) { T('la fonction s\u2019extrait (' + e.message + ')', false); return R; }
  // 1. le verdict de la Cave, mot pour mot
  essai('le verdict est celui de la Cave, mot pour mot, avec sa pastille (Prioritaire)', () => { const { C } = mk(); return C.verdict.phrase === '2 cuves à mesurer aujourd’hui.' && C.verdict.sous === Y0().verdict.s && C.verdict.etat === 'ko' && C.verdict.etatTxt === 'Prioritaire'; });
  essai('rien ne presse : « À jour », ni point sur la bascule, ni mot dans la phrase du haut', () => { const Y = Y0(); Y.verdict = { cls: 'ok', t: 'Rien ne presse aujourd’hui', s: 'Ouillage à jour.' }; const { C, V } = mk({ Y }); return C.verdict.etatTxt === 'À jour' && C.verdict.phrase === 'Rien ne presse aujourd’hui.' && C.pt === '' && C.lien === '' && !V.savoir.length; });
  essai('les trois chiffres comptent des gestes, puis des ouillages', () => { const { C } = mk(); const s = C.verdict.sem; return s[0][1] === '5' && s[0][2] === 'gestes' && s[1][1] === '2' && s[1][2] === 'ouillages' && s[2][1] === '1' && s[2][2] === 'ouillage'; });
  // 2. les états viennent de la synthèse
  essai('la cuve qui fermente : son % de FA et ses bulles ; la macération : son flocon, « À mesurer »', () => { const { C } = mk(); const c3 = C.cuvier.cuves[0], c5 = C.cuvier.cuves[1]; return c3.puce === 'FA · 86\u00a0%' && c3.bulles && !c3.froid && c3.nom === 'Cuve 3' && c3.mat === 'inox' && c5.puce === 'À mesurer' && c5.froid && c5.mat === 'bois'; });
  essai('une cuve décuvée sans geste est vide ; avec un relevé attendu, elle reste « À mesurer »', () => { const { C } = mk(); const c7 = C.cuvier.cuves[2], c9 = C.cuvier.cuves[3]; return c7.e === 'faire' && c7.puce === 'À mesurer' && c9.e === 'vide' && c9.puce === 'Décuvée' && !c9.bulles; });
  essai('les cuvées : ce qui presse d’abord, le retard en clair, un rond par fût', () => { const { C } = mk(); const L = C.chai.cuvees; return L[0].nom === 'Fixin 1er Cru ’25' && /En retard de 5\u00a0jours/.test(L[0].s) && L[0].puce === 'À ouiller' && L[1].puce === 'À soutirer' && L[L.length - 1].e === 'ok' && C.chai.resume.indexOf('43\u00a0fûts') >= 0; });
  // 3. la semaine
  essai('la semaine va du lundi au vendredi ; aujourd’hui est marqué ; les gestes du jour sont comptés', () => { const { C } = mk(); const J = C.semaine.jours; return J.length === 5 && J[0].d === '19' && J[4].d === '23' && J[3].auj && J[3].ev.length === 3; });
  essai('les journées de cave se comptent en jours : journée 1, demi-journée ½', () => { const { C } = mk({ cj: { '2026-10-21': { Camille: 'j', 'Théo': 'j' }, '2026-10-22': { Lucie: 'm' } } }); return C.semaine.tot === '2,5 jours' && C.semaine.jours[2].gens.length === 2 && C.fil.enCe.length === 1 && /ce matin/.test(C.fil.enCe[0][1]); });
  essai('le manque se dit quand soutirages et ouillage n’ont pas de journée de cave, et se tait sinon', () => { const a = mk().C.semaine.manque, b = mk({ cj: { '2026-10-23': { Camille: 'j' } } }).C.semaine.manque; return a === 'Les 2\u00a0soutirages et 1\u00a0ouillage n’ont pas encore de journée de cave au planning.' && b === ''; });
  essai('la semaine prochaine et les deux d’après : ouillages, fûts, litres, journées au planning', () => { const { C } = mk(); const s = C.semaine.suite; return /2\u00a0ouillages · 18\u00a0fûts · environ 126\u00a0L/.test(s[0][2]) && s[0][3] === 'Aucune journée de cave au planning' && s[0][4] === true; });
  // 4. le millésime
  essai('le millésime lit la chaîne de la Cave, en « environ », jamais en « ≈ »', () => { const { C } = mk(); const M = C.mil; return M && M.barre[1][1] === 182 && M.barre[2][1] === 50 && /36\u00a0t<\/b> rentrées de 8\u00a0parcelles, soit environ 266\u00a0hL/.test(M.tete) && M.aussi.length === 2 && JSON.stringify(C).indexOf('\u2248') < 0; });
  // 5. À savoir
  essai('« À savoir » : l’ouillage en retard, les soutirages à prévoir, la fin de fermentation, le Diagnostic sans signe', () => { const { C } = mk(); const L = C.savoir; return L[0].t === 'Fixin 1er Cru ’25 à ouiller' && L[0].fort && L[0].q === 'En retard de 5\u00a0j' && L[1].a === 'Prévoir au planning' && L[2].ic === 'sablier' && L[3].t === 'Diagnostic du Chai\u00a0: aucun signe' && /3\u00a0cuvées n’ont encore aucune analyse/.test(L[3].s); });
  essai('un signe fort du Diagnostic passe en tête de « À savoir », en rouge, et rougit le point de la bascule', () => { const Y = Y0(); Y.diag = [{ id: 'c1', nom: 'Gevrey-Chambertin VV ’25', txt: 'Piqûre acétique ?' }]; Y.verdict = { cls: 'due', t: 'Un signe fort au Chai\u00a0: piqûre acétique ?', s: 'Sur le Gevrey-Chambertin VV ’25, …' };
    const { C } = mk({ Y }); return C.savoir[0].alerte && C.savoir[0].k === 'Signes forts' && C.pt === 'alerte' && C.lien === 'un signe fort au Chai' && C.verdict.phrase === 'Un signe fort au Chai\u00a0: piqûre acétique ?' && C.chai.cuvees[0].puce === 'Signes forts'; });
  // 6. la ligne Cave de Terrain
  essai('la ligne Cave de Terrain n’est jamais un point à anticiper (prio 2), et mène à la vue Cave', () => { const { V } = mk(); const x = V.savoir[0]; return V.savoir.length === 1 && x.cat === 'cave' && x.prio === 2 && x.fn === 'cave' && x.action === 'Voir la cave'; });
  essai('« Choisir les indicateurs » masque la ligne, ou toute la vue', () => mk({ show: { auj_cave_sv: 0 } }).V.savoir.length === 0 && mk({ show: { auj_cave: 0 } }).C === null);
  // 7. module masqué
  essai('module Cave masqué : pas de vue Cave', () => mk({ off: true }).C === null);
  // 8. côté Cave et Diagnostic
  T('la Cave s\u2019expose en lecture (_caveSynthese), avec son verdict et ses pièces', /window\._caveSynthese=_caveSynthese;/.test(S.cave) && /var diag=_mlDiagForts\(\), v=_mlVerdict\(sem,\{phase:_mlPhase\(\), haReste:haR, parc:parc, diag:diag\}\);/.test(S.cave) && /_aujOuillageEtat\(c,auj,pro\), m=_aujMalo\(c,x\)/.test(S.cave) && S.cave.includes('.filter(_vendSuivie).map('));
  essai('le verdict de la Cave met un signe fort en tête, avant une alerte de cuve ; sans signe, rien ne change', () => {
    const V = new Function('function _mvF1(v){ return String(v); }\n' + corps(S.cave, '_mlVerdict') + '\nreturn _mlVerdict;')();
    const sem = [{ items: [{ kind: 'alerte', titre: 'Cuve 5', ref: 'v2', urgence: 'due', note: 'la fermentation ralentit' }] }];
    const a = V(sem, { diag: [{ nom: 'Gevrey-Chambertin VV ’25', txt: 'Piqûre acétique ?' }] }), b = V(sem, {});
    return a.cls === 'due' && a.t === 'Un signe fort au Chai\u00a0: piqûre acétique ?' && /^Sur le Gevrey-Chambertin VV ’25/.test(a.s) && /Puis/.test(a.s) && !/signe fort/.test(b.t); });
  T('l\u2019Aujourd\u2019hui de la Cave passe les signes forts au verdict (même définition)', S.cave.includes('var v=_mlVerdict(sem,{phase:_mlPhase(), haReste:haR, parc:parc, diag:_mlDiagForts()});'));
  T('le Diagnostic s\u2019expose avec le calcul de son onglet (recalc puis statutListe)', /window\._dgnSynthese = function \(\) \{[\s\S]{0,200}recalc\(\);[\s\S]{0,400}statutListe\(M\)/.test(S.diag));
  // 9. côté cockpit
  T('la vue Cave est entre Terrain et Économie, et n\u2019a de bouton dans la bascule qu\u2019avec un modèle', S.vue.indexOf('id="ck-vue-cave"') > S.vue.indexOf('id="ck-vue-terrain"') && S.vue.indexOf('id="ck-vue-cave"') < S.vue.indexOf('id="ck-vue-eco"') && S.vue.includes("(V.cave ? '<button type=\"button\" role=\"tab\" data-mode=\"cave\""));
  const dessin = bloc(S.vue, '/* ═══ 11 bis. LA VUE CAVE', '/* ═══ 12. NAVIGATION');
  T('aucun bouton de geste dans la vue Cave : chaque ligne porte data-cave', dessin.length > 2000 && !/_mlGo|onclick|_caveQuickOp|openOvVendMesure/.test(dessin) && (dessin.match(/data-cave="/g) || []).length >= 6 && S.vue.includes("window._pilCaveAller(ca.dataset.cave)"));
  T('les pastilles de la vue Cave sont celles de l\u2019appli (.mvpas)', dessin.includes("'<span class=\"mvpas mvpas-statut ' + (CV_PAS[c.e] || '') + '\">'") && !/class="cv-puce/.test(dessin));
  const feuille = bloc(S.css, '/* ══ ★★ CAVEPIL-1 (§436)', '/* ★ FIN CAVEPIL-1 */');
  T('la feuille de la vue Cave : par jetons, aucune couleur écrite, rangée après CAVEAUJ-2', feuille.length > 3000 && !/#[0-9a-fA-F]{3,8}\b/.test(sansVar(feuille)) && S.css.indexOf('/* ★ FIN CAVEAUJ-2 */') < S.css.indexOf('/* ══ ★★ CAVEPIL-1 (§436)') && S.css.indexOf('/* ══ ★★ CAVEPIL-1 (§436)') < S.css.indexOf('/* ★ TETE-2 (§329)'));
  const sombres = S.charte.split('\n').filter((l) => l.includes('--vin-liq:') && l.includes('--froid-doux:') && !/^:root\{/.test(l)).map((l) => l.slice(l.indexOf('{') + 1, l.lastIndexOf('}')));
  T('la matière de la cave est dans la charte, clair et sombre — les deux sombres identiques', /:root\{--vin-liq:/.test(S.charte) && sombres.length === 2 && sombres[0] === sombres[1]);
  // 10.
  T('ce harnais est branch\u00e9 dans la liste des contr\u00f4les', S.liste.includes("['node scripts/mv-harnais-cavepil1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cavepil1.mjs --contre'],"));
  return R;
}

const MUT = [
  ['le Pilotage refait le verdict', (S) => ({ ...S, pil: S.pil.replace("var v=Y.verdict||{cls:'ok', t:'Rien ne presse aujourd\\u2019hui', s:''}", "var v={cls:'warn', t:'Cave', s:''}") })],
  ['une demi-journée compte une journée', (S) => ({ ...S, pil: S.pil.replace("gensDu(x).forEach(function(p){ n+=p[1]==='j'?1:0.5; });", 'gensDu(x).forEach(function(p){ n+=1; });') })],
  ['le manque se dit même avec une journée de cave', (S) => ({ ...S, pil: S.pil.replace('if(lourds.length&&!joursDe(auj,add(lu,4))){', 'if(lourds.length){') })],
  ['« ≈ » revient', (S) => ({ ...S, pil: S.pil.replace(", soit environ '+Math.round((ch.kg||0)/kgHl)", ", soit \\u2248 '+Math.round((ch.kg||0)/kgHl)") })],
  ['le signe fort ne passe plus en tête', (S) => ({ ...S, pil: S.pil.replace("dg.forEach(function(d,k){ sv.push(", "dg.slice(0,0).forEach(function(d,k){ sv.push(") })],
  ['la ligne Cave devient un point à anticiper', (S) => ({ ...S, pil: S.pil.replace("V.savoir.push({cat:'cave', prio:2,", "V.savoir.push({cat:'cave', prio:1,") })],
  ['la vue ignore le module masqué', (S) => ({ ...S, pil: S.pil.replace("if((typeof window._mvModOff==='function'&&window._mvModOff('cave'))", "if(false&&(typeof window._mvModOff==='function'&&window._mvModOff('cave'))") })],
  ['le verdict de la Cave oublie le signe fort', (S) => ({ ...S, cave: S.cave.replace('var dgF=(ctx.diag||[]).filter(', 'var dgF=([]).filter(') })],
  ['l\u2019Aujourd\u2019hui de la Cave oublie le Diagnostic', (S) => ({ ...S, cave: S.cave.replace('parc:parc, diag:_mlDiagForts()});', 'parc:parc});') })],
  ['un bouton de geste dans la vue Cave', (S) => ({ ...S, vue: S.vue.replace("'<button type=\"button\" class=\"ck-sv-a\" data-cave=\"' + esc(x.go || 'auj') + '\">'", "'<button type=\"button\" class=\"ck-sv-a\" onclick=\"_mlGo(\\'ouillage\\')\">'") })],
  ['une couleur écrite dans la feuille', (S) => ({ ...S, css: S.css.replace('.ck2 .cv-cuvee-s .rt{font-weight:600;color:var(--danger-texte)}', '.ck2 .cv-cuvee-s .rt{font-weight:600;color:#BA361A}') })],
  ['les deux sombres ne disent plus la même chose', (S) => ({ ...S, charte: S.charte.replace('--froid-doux:rgba(143,190,232,.15);}', '--froid-doux:rgba(143,190,232,.25);}') })],
];

console.log('\n\u2500\u2500 CAVEPIL-1 : la vue Cave du Pilotage\n');
const res = verifier(S0); let ko = 0;
for (const [nom, ok] of res) { console.log((ok ? '  \u2713 ' : '  \u2717 ') + nom); if (!ok) ko++; }
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions');
if (CONTRE) {
  let rate = 0;
  console.log('\n\u2500\u2500 Contre-\u00e9preuves : chaque mutation doit rougir');
  for (const [nom, f] of MUT) {
    const S = f(S0), meme = Object.keys(S0).every((k) => S[k] === S0[k]);
    const rouge = verifier(S).some(([, ok]) => !ok);
    console.log((rouge && !meme ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom + (meme ? ' (MOTIF ABSENT)' : ''));
    if (!rouge || meme) rate++;
  }
  console.log('\n' + (rate ? 'ROUGE \u2014 ' + rate + ' contre-\u00e9preuve(s) sans effet' : 'VERT \u2014 ' + MUT.length + ' contre-\u00e9preuves rougissent'));
  process.exit(ko || rate ? 1 : 0);
}
process.exit(ko ? 1 : 0);
