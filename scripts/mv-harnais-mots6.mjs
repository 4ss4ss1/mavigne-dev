/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-6 (§588) : PILOTAGE › AUJOURD'HUI, LA VUE CAVE ALLÉGÉE — LES SIX CARTES GARDÉES, MOINS DE MOTS DANS CHACUNE
   Lancer :          node scripts/mv-harnais-mots6.mjs
   Contre-épreuves : node scripts/mv-harnais-mots6.mjs --contre

   POURQUOI IL EXISTE
   MOTS-5 (§586) a allégé la vue Terrain d'Aujourd'hui sans rien retirer de l'écran. La vue Cave suit la même règle, sur
   maquette validée le 17/11 (« Parfait pour la maquette ») : docs/maquettes/maquette-aujourdhui-cave-v1.html. Dans une
   carte, un chiffre, une barre ou une couleur ; le pourquoi du jour et la méthode derrière le « i » ; le détail d'une cuve,
   d'une cuvée, d'une étape du millésime ou d'un point se déplie au toucher ; « Ouvrir » mène à l'écran de la Cave.

   CE QU'IL GARDE
   ① les six cartes de la vue Cave sont au squelette, rangées comme avant sur ordinateur ; au téléphone, l'ordre de la vue Terrain ;
   ② chaque carte JOUÉE sur le domaine de démo (le modèle sort du vrai _pilCk2Cave, le dessin du vrai cockpit) : ce qui presse,
      le Cuvier, le Chai, la semaine, le millésime, En direct, À savoir — et ce qui était écrit reste lisible, derrière un « i »
      ou au toucher ;
   ③ rien n'est recalculé : le verdict reste celui de la Cave, mot pour mot ; elle le donne aussi en pièces (why, puis) ;
   ④ toujours aucun bouton de geste : chaque porte est un data-cave ;
   ⑤ la feuille (aujourdhui.css, pas styles.css au plafond), l'aide, le guide, l'annonce, les versions, la référence des mots,
      la maquette au dépôt, ce fichier dans la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { vue: lire('src/cockpit-vue.js'), pil: lire('src/pilotage.js'), cave: lire('src/cave.js'), css: lire('src/styles.css'), auj: lire('src/aujourdhui.css'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'),
  sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json'), lm: lire('docs/maquettes/LISEZMOI.md'),
  maq: lire('docs/maquettes/maquette-aujourdhui-cave-v1.html') };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0;
  for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const texte = (h) => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const N = '\u00a0';

// Le domaine de démo au mardi 27/10/2026, tel que la Cave le synthétise (les chiffres de la maquette).
const SEM = () => [
  { lundi: '2026-10-26', dim: '2026-11-01', items: [
    { kind: 'mesure', titre: 'Cuve 5 — bois 80 hL', detail: 'dernier relevé il y a 1 j', urgence: '', ref: 'v2', date: '2026-10-27' },
    { kind: 'mesure', titre: 'Cuve 7 — inox 60 hL', detail: 'dernier relevé il y a 2 j', urgence: 'due', ref: 'v3', date: '2026-10-27' },
    { kind: 'soutirage', titre: 'Gevrey-Chambertin VV ’25', detail: 'malo finie, pas encore soutirée', ref: 'c1', date: '2026-10-27' },
    { kind: 'soutirage', titre: 'Fixin 1er Cru ’25', detail: 'malo finie, pas encore soutirée', ref: 'c2', date: '2026-10-27' },
    { kind: 'ouillage', titre: 'Fixin 1er Cru ’25', detail: '3 fûts · ~21 L', urgence: 'due', futs: 3, ref: 'c2', date: '2026-10-27' },
    { kind: 'fa', titre: 'Cuve 3 — inox 120 hL', detail: 'fin de fermentation estimée · ± 1 j', note: 'densité 1007 · −7 pts/j', ref: 'v1', date: '2026-10-29' }] },
  { lundi: '2026-11-02', dim: '2026-11-08', items: [
    { kind: 'ouillage', titre: 'Gevrey-Chambertin VV ’25', detail: '10 fûts · ~70 L', futs: 10, ref: 'c1', date: '2026-11-06' },
    { kind: 'ouillage', titre: 'Bourgogne Pinot Noir ’25', detail: '8 fûts · ~56 L', futs: 8, ref: 'c3', date: '2026-11-06' }] },
  { lundi: '2026-11-09', dim: '2026-11-15', items: [{ kind: 'ouillage', titre: 'Vieilles Vignes ’26', detail: '22 fûts · ~154 L', futs: 22, ref: 'c4', date: '2026-11-11' }] },
  { lundi: '2026-11-16', dim: '2026-11-22', items: [] }];
const Y0 = (verdict) => ({ auj: '2026-10-27', mil: 2026, sem: SEM(), phase: 'elevage', suivies: 3, parc: null, diag: [], verdict,
  cuves: [
    { id: 'v1', nom: 'Cuve 3 — inox 120 hL', statut: 'fa', cap: 120, kg: 14550, hl: 107.8, parcelles: ['Les Charmes'], d20: 1007, temp: 23, jRel: 0, jEntree: 12, note: '', faPct: 86, proj: { etat: 'normal', date: '2026-10-29', marge: 1, pente: 7 }, decuvage: null, e: 'cours' },
    { id: 'v2', nom: 'Cuve 5 — bois 80 hL', statut: 'mpf', cap: 80, kg: 10050, hl: 74.4, parcelles: ['Aux Murgers'], d20: 1093, temp: 13, jRel: 1, jEntree: 5, note: '', faPct: null, proj: { etat: 'mpf' }, decuvage: null, e: 'faire' },
    { id: 'v3', nom: 'Cuve 7 — inox 60 hL', statut: 'termine', cap: 60, kg: 6850, hl: 0, parcelles: [], d20: 1015, temp: 24, jRel: 2, jEntree: 14, note: '', faPct: null, proj: null, decuvage: { date: '2026-10-26', cuvee: 'Vieilles Vignes ’26', hl: 50, faFinie: false }, e: 'faire' }],
  cuvees: [
    { id: 'c3', nom: 'Bourgogne Pinot Noir ’25', mil: 2025, futs: 8, hl: 18.2, tonneaux: [{ annee: 2024, nb: 8 }], ouillage: { g: '4 j', s: ' sur 14', d: '', cls: '', last: '2026-10-23' }, malo: { t: 'Pas d’analyse', cls: '', s: '' }, soutirer: false, sout: null, analyse: null, kinds: [], e: 'ok', pro: '2026-11-06' },
    { id: 'c1', nom: 'Gevrey-Chambertin VV ’25', mil: 2025, futs: 10, hl: 22.8, tonneaux: [{ annee: 2025, nb: 10 }], ouillage: { g: '6 j', s: ' sur 14', d: '', cls: '', last: '2026-10-21' }, malo: { t: 'Finie', cls: 'mvpas-fait', s: '' }, soutirer: true, sout: null, analyse: '2026-10-02', kinds: ['soutirage'], e: 'faire' },
    { id: 'c4', nom: 'Vieilles Vignes ’26', mil: 2026, futs: 22, hl: 50, tonneaux: [{ annee: 2026, nb: 22 }], ouillage: null, malo: { t: 'Après la FA', cls: '', s: 'la FA finit en fût' }, soutirer: false, sout: null, analyse: null, kinds: [], e: 'cours' },
    { id: 'c2', nom: 'Fixin 1er Cru ’25', mil: 2025, futs: 3, hl: 6.8, tonneaux: [{ annee: 2025, nb: 3 }], ouillage: { g: '19 j', s: ' sur 14', d: '+5' + N + 'j', cls: 'due', last: '2026-10-08' }, malo: { t: 'Finie', cls: 'mvpas-fait', s: '' }, soutirer: true, sout: null, analyse: null, kinds: ['soutirage', 'ouillage'], e: 'faire' }],
  btl: [{ id: 'c0', nom: 'Gevrey-Chambertin VV ’23', n: 1480, date: '2026-02-24' }],
  recents: [{ d: '2026-10-27', ic: 'thermometre', t: 'Relevé', q: 'Cuve 3 — inox 120 hL', s: '1006 à 23' + N + '°C' }, { d: '2026-10-26', ic: 'thermometre', t: 'Relevé', q: 'Cuve 3 — inox 120 hL', s: '1012 à 25' + N + '°C' },
    { d: '2026-10-26', ic: 'thermometre', t: 'Relevé', q: 'Cuve 5 — bois 80 hL', s: '1095 à 13' + N + '°C' }, { d: '2026-10-26', ic: 'cuve', t: 'Décuvage', q: 'Cuve 7 — inox 60 hL \u2192 Vieilles Vignes ’26', s: '' },
    { d: '2026-10-23', ic: 'goutte', t: 'Ouillage', q: 'Bourgogne Pinot Noir ’25', s: 'par Jean' }] });
const CHAINE = { kg: 35950, kgVendu: 4500, kgHl: 135, hlCuve: 182, hlDecuve: 50, futs: 22, hlFut: 50, btl: 0, parcelles: 8, cuves: [{ statut: 'fa' }, { statut: 'mpf' }, { statut: 'termine' }] };
const DIAG0 = ['c1', 'c2', 'c3', 'c4'].map((id) => ({ id, nom: id, g: 'ok', txt: '', mise: false, nAna: 0 }));

// Le vrai verdict de la Cave, le vrai modèle du Pilotage, le vrai dessin du cockpit — montés dans Node.
function monter(S) {
  const verdictDe = new Function('function _mvF1(v){ return String(v); }\n' + corps(S.cave, '_mlVerdict') + '\nreturn _mlVerdict;')();
  const modele = (o) => {
    o = o || {};
    const sem = o.sem || SEM(), Y = Y0(o.verdict || verdictDe(sem, { phase: 'elevage', diag: [] })); Y.sem = sem; if (o.Y) o.Y(Y);
    const win = { CAVE_ELEVAGE: { cuvees: [] }, CAVE_VENDANGE: { cuves_vinif: [] }, CONFIG: { cave_jours: o.cj || {} },
      _caveSynthese: () => Y, _mlGestes: (L) => (L || []).filter((i) => i && i.kind !== 'fa' && i.kind !== 'demarrage'),
      _mlChaine: (m) => (String(m) === '2026' ? (o.chaine || CHAINE) : (String(m) === '2025' ? { hlFut: 47.8, futs: 21, btl: 0 } : { hlFut: 0, futs: 0, btl: 1480 })),
      _mlRdtMoyen: () => (o.rdt || { hlHa: 38.2, ha: 6.12 }), _mlMillesimes: () => [2026, 2025, 2023], _dgnSynthese: () => DIAG0, _laboLignes: () => [], _mvModOff: () => false, _mvAvale: (e) => { throw e; } };
    return new Function('window', '_pilShow', corps(S.pil, '_pilCk2Cave') + '\nreturn _pilCk2Cave;')(win, () => true)({ savoir: [], admin: true });
  };
  const v = S.vue, i = v.indexOf('const btnI = '), j = v.indexOf("'</header>';", i), a = v.indexOf('const CV_PAS = '), b = v.indexOf('\nfunction majCave() {');
  if (i < 0 || j < 0 || a < 0 || b < 0) throw new Error('section de la vue Cave introuvable');
  const code = ligne(v, 'const esc = ') + ligne(v, 'const INFO_PLUS = ') + v.slice(i, j + 12) + '\n' + v.slice(a, b) + '\nreturn { cvVerdict, cvPlan, cvSemaine, cvMil, cvFil, cvSavoir, INFO_PLUS };';
  const dessin = (admin) => new Function('window', 'S', 'V', code)({}, { cvFiltre: null, cvGrp: {}, cvFil: false }, { admin: admin !== false });
  const bulle = (plus, k) => { let vu = null; const win = { _mvBulleOuvrir: (b, c) => { vu = c; } };
    new Function('window', 'INFO', 'INFO_PLUS', 'esc', corps(v, 'ouvrirInfo') + '\nreturn ouvrirInfo;')(win, { x: 'La méthode.', o: { t: 'Titre', p: ['Un.'] } }, plus, (s) => String(s))({ dataset: { info: k } }, false); return vu; };
  return { modele, dessin, bulle, verdictDe };
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const V = sansCom(S.vue), C = S.auj, sq = ligne(S.vue, 'window._ck2Squelette = function () {');
  // ① rien ne quitte l'écran
  T('① les six cartes de la vue Cave sont au squelette : ce qui presse, le millésime, la cave en direct, la semaine, En direct, À savoir',
    ['id="ck-cv-verdict"', 'id="ck-cv-mil"', 'id="ck-cv-plan"', 'id="ck-cv-semaine"', 'id="ck-cv-fil"', 'id="ck-cv-savoir"'].every((x) => sq.includes(x)));
  T('① sur ordinateur, les cartes gardent leur place', V.includes("c: { large: [['cv-verdict', 'cv-mil'], ['cv-plan', 'cv-semaine'], ['cv-fil', 'cv-savoir']],"));
  T('① au téléphone, « En direct » puis « À savoir » en tête, comme la vue Terrain', V.includes("petit: [['cv-fil', 'cv-savoir', 'cv-verdict', 'cv-plan', 'cv-semaine', 'cv-mil'], [], []] },"));
  T('① … et avant les tuiles : la feuille range la vue Cave comme la vue Terrain (order)', C.includes('.ck-page[data-taille="petit"]>:is(#ck-vue-terrain,#ck-vue-cave):not([hidden])>.ck-col>:is(#ck-fil,#ck-cv-fil){order:1}')
    && C.includes('>.ck-col>:is(#ck-savoir,#ck-cv-savoir){order:2}') && C.includes('.ck-page[data-taille="petit"]>:is(#ck-vue-terrain,#ck-vue-cave):not([hidden]),.ck-page[data-taille="petit"]>:is(#ck-vue-terrain,#ck-vue-cave):not([hidden])>.ck-col{display:contents}'));
  // ② les cartes, jouées
  let M = null;
  try { M = monter(S); } catch (e) { T('② le modèle et le dessin s’extraient (' + e.message + ')', false); return out; }
  let D, mo, H = {};
  try { mo = M.modele(); D = M.dessin(); H = { v: D.cvVerdict(mo), p: D.cvPlan(mo), s: D.cvSemaine(mo), m: D.cvMil(mo), f: D.cvFil(mo), a: D.cvSavoir(mo) }; }
  catch (e) { T('② les six cartes se dessinent sur le domaine de démo (' + e.message + ')', false); return out; }
  essai('② ce qui presse : le chiffre en grand, son mot, « aujourd’hui » en petit', () => [H.v.includes('<h2 class="ck-v-phrase cv-v-ph"><b>2</b><span>cuves à mesurer</span><small>aujourd’hui</small></h2>'), H.v.slice(0, 600)]);
  essai('② … ce qui suit en pastilles, dans l’ordre de la Cave ; « 2 cuvées ont fini leur malo » se dit « 2 malos finies »', () => [H.v.includes('<p class="cv-v-puis"><span class="ck-ph-pst">1 cuvée à ouiller</span><span class="ck-ph-pst">2' + N + 'malos finies</span></p>'), H.v]);
  essai('② … trois compteurs, en mots courts', () => { const t = texte(H.v); return [/cette semaine 5.gestes semaine prochaine 2.ouillages dans 2 à 4 sem\. 1.ouillage/.test(t), t]; });
  essai('② … plus de phrase de suite ni de ligne de cadre dans la carte : elles sont derrière le « i »', () => !/ck-v-sous|class="ck-cadre"|Puis/.test(H.v) && D.INFO_PLUS.cvverdict.length === 2
    && D.INFO_PLUS.cvverdict[0] === 'Pas de relevé depuis hier ou avant.' && /^Calculé par la Cave sur 3.cuves suivies au Cuvier et 4.cuvées en élevage/.test(D.INFO_PLUS.cvverdict[1]));
  essai('② … « Ouvrir la Cave » et « Le Chai » restent', () => H.v.includes('data-cave="auj">Ouvrir la Cave</button>') && H.v.includes('data-cave="elevage">Le Chai</button>'));
  essai('② rien ne presse : la phrase de la Cave, sans chiffre ni pastille ; ce qui est à jour derrière le « i »', () => { const m = M.modele({ sem: [{ lundi: '2026-10-26', items: [] }, { lundi: '2026-11-02', items: [] }] }), h = D.cvVerdict(m);
    return [h.includes('<h2 class="ck-v-phrase cv-v-ph"><span>Rien ne presse aujourd’hui</span></h2>') && !h.includes('cv-v-puis') && /^Ouillage à jour/.test(D.INFO_PLUS.cvverdict[0]), h.slice(0, 500)]; });
  essai('② le Cuvier : une cuve = son dessin, son nom, son état, sa mesure — rien d’autre avant le toucher', () => { const m = /<details class="cv-cuve cv-inox cv-e-cours" data-e="cours"><summary[^>]*>([\s\S]*?)<\/summary><div class="cv-dt">([\s\S]*?)<\/div><\/details>/.exec(H.p);
    return [!!m && /^Cuve 3 FA · 86.% 1007 · 23.°C$/.test(texte(m[1])) && /^inox · 120.hL · Fin de FA prévue jeu\..29 Ouvrir$/.test(texte(m[2])), m ? texte(m[1]) + ' | ' + texte(m[2]) : 'absent']; });
  essai('② … « Ouvrir » mène à la cuve ; le toucher de la ligne ne navigue plus', () => H.p.includes('<button type="button" class="ck-lien" data-cave="cuve:v1" aria-label="Ouvrir Cuve 3 dans la Cave">Ouvrir</button>') && !/<summary[^>]*data-cave/.test(H.p) && !/class="cv-cuve-m"/.test(H.p));
  essai('② le Chai : une cuvée = son nom, son état, ses fûts, son retard ; le reste au toucher', () => { const m = /<details class="cv-cuvee cv-e-faire" data-e="faire"><summary[^>]*>([\s\S]*?)<\/summary><div class="cv-dt">([\s\S]*?)<\/div><\/details>/.exec(H.p);
    return [!!m && /^Fixin 1er Cru ’25 À ouiller 3.fûts retard 5.j$/.test(texte(m[1])) && (m[1].match(/class="cv-fut"/g) || []).length === 3 && /^6,8.hL · malo finie, à soutirer Ouvrir$/.test(texte(m[2])) && m[2].includes('data-cave="cuvee:c2"'), m ? texte(m[1]) + ' | ' + texte(m[2]) : 'absent']; });
  essai('② … le Cuvier et le Chai se résument sans « environ »', () => H.p.includes('<b>Le Cuvier</b><span>3' + N + 'cuves · 182' + N + 'hL</span>') && H.p.includes('<b>Le Chai</b><span>4' + N + 'cuvées · 43' + N + 'fûts · 98' + N + 'hL</span>') && !H.p.includes('<p class="ck-cadre"'));
  T('② … une rangée « En cours » ou « À jour » : son nom, son compte, un chevron ; le prochain ouillage une fois dépliée', C.includes('.ck2 .cv-grp-ic,.ck2 .cv-grp-b>span{display:none}') && C.includes('.ck2 .cv-grp:not(.ouvert) .cv-grp-s{display:none}') && C.includes('.ck2 .cv-grp-h{grid-template-columns:minmax(0,1fr) auto;min-height:44px}'));
  essai('② … les bouteilles : le nom, la mise en bulle', () => H.p.includes('<button type="button" class="cv-btl" data-cave="elevage" title="1' + '\u202f' + '480 bouteilles · mises le 24' + N + 'févr."><b>Gevrey-Chambertin VV ’23</b></button>') || /class="cv-btl" data-cave="elevage" title="1.480 bouteilles · mises le 24.févr\."><b>Gevrey-Chambertin VV ’23<\/b><\/button>/.test(H.p));
  essai('② la semaine : cinq jours, aujourd’hui marqué, plus de légende ni de phrase de total', () => (H.s.match(/<div class="cv-j[ "]/g) || []).length === 5 && /<div class="cv-j auj" aria-current="date">/.test(H.s) && !/cv-leg-j|cv-tot"|comme au Planning/.test(H.s) && !H.s.includes('<p class="ck-cadre"'));
  essai('② … le manque en une ligne, avec « Prévoir »', () => [H.s.includes('<div class="cv-manque"><span><b>2' + N + 'soutirages, 1' + N + 'ouillage</b> sans journée de cave</span><button type="button" class="ck-sv-a" data-cave="planning">Prévoir</button></div>'), H.s.slice(H.s.indexOf('cv-manque') - 12, H.s.indexOf('cv-manque') + 260)]);
  essai('② … une ligne par période : ses gestes, « sans journée » en pastille, « Prévoir »', () => { const t = texte(H.s.slice(H.s.indexOf('<ul class="cv-suite">')));
    return [/^Semaine prochaine 2.nov\. – 6.nov\. 2.ouillages · 18.fûts · 126.L sans journée Prévoir Dans 2 à 4 semaines 9.nov\. – 20.nov\. 1.ouillage · 22.fûts · 154.L sans journée Prévoir Ouvrir le planning$/.test(t), t]; });
  essai('② … une journée de cave au planning : le manque se tait, la période dit ses journées, l’en-tête dit le total', () => { const m = M.modele({ cj: { '2026-10-28': { Camille: 'j' }, '2026-11-03': { Camille: 'm' } } }), h = D.cvSemaine(m);
    return [!h.includes('cv-manque') && h.includes('<span class="cv-tot-c">1' + N + 'jour de cave</span>') && h.includes('<span class="cv-s-j">0,5' + N + 'journée</span>') && /<span class="cv-pers j" title="Camille, la journée">C<\/span>/.test(h), texte(h)]; });
  essai('② … hors admin, pas de « Prévoir »', () => !M.dessin(false).cvSemaine(mo).includes('>Prévoir</button>') && M.dessin(false).cvSemaine(mo).includes('sans journée de cave'));
  essai('② … la phrase du total et la règle sont derrière le « i »', () => /^Aucune journée de cave au planning cette semaine\.$/.test(D.cvSemaine(mo) && D.INFO_PLUS.cvsemaine[0]));
  essai('② le millésime : le tonnage en grand, ses hectolitres et ses parcelles en petit', () => [H.m.includes('<p class="cv-mil-t"><b>36' + N + 't</b><small>environ 266' + N + 'hL · 8' + N + 'parcelles</small></p>'), H.m.slice(0, 700)]);
  essai('② … une ligne de légende par étape, en hL comme la barre ; ce qu’elle compte au toucher', () => { const L = [...H.m.matchAll(/<details class="cv-lg[^"]*"><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((x) => texte(x[1]) + ' → ' + texte(x[2]));
    return [L.length === 4 && /^raisin vendu 33.hL → 4,5.t$/.test(L[0]) && /^en cuve 182.hL → 2.cuves, d’après les caisses$/.test(L[1]) && /^au chai 50.hL → 22.fûts$/.test(L[2]) && L[3] === 'en bouteille à venir → rien n’est encore tiré', L.join(' | ')]; });
  essai('② … le rendement en chiffre, les autres millésimes, les deux liens ; la règle derrière le « i »', () => H.m.includes('<p class="cv-rdt"><span>rendement</span><b>38' + N + 'hL/ha</b></p>') && H.m.includes('data-cave="millesime">Le millésime</button>') && H.m.includes('data-cave="revient">Coût par bouteille</button>')
    && (H.m.match(/<li><b>20\d\d<\/b>/g) || []).length === 2 && !/cv-note|cv-mil-tete|kg\/hL/.test(H.m) && /135.kg\/hL/.test(D.INFO_PLUS.cvmil[0]) && /6,12.ha récoltés pour la cave/.test(D.INFO_PLUS.cvmil[1]));
  essai('② … sans rendement mesuré, pas de ligne « rendement » : le « i » dit qu’il se lira au décuvage', () => { const m = M.modele({ rdt: { hlHa: null } }), h = D.cvMil(m); return !h.includes('cv-rdt') && /se lira au décuvage/.test(D.INFO_PLUS.cvmil[1]); });
  essai('② En direct : le geste et son contenant, la mesure dessous, le moment en court — sans la matière ni la contenance', () => { const t = texte(H.f);
    return [/^En direct i Tout voir Relevé · Cuve 3 1006 · 23.°C auj\. Relevé · Cuve 3 1012 · 25.°C hier Relevé · Cuve 5 1095 · 13.°C hier Décuvage · Cuve 7 → Vieilles Vignes ’26 hier Ouillage · Bourgogne Pinot Noir ’25 par Jean /.test(t) && !/inox|bois/.test(t), t]; });
  T('② … trois gestes à l’écran, la suite sous « Tout voir »', C.includes('.ck2 .cv-fil:not(.ouvert) .cv-fil-l>li:nth-child(n+4){display:none}') && V.includes('const long = F.items.length > 3;') && V.includes("'<ul class=\"ck-fil-l tout cv-fil-l\">'"));
  essai('② À savoir : le compte en pastille, un point par ligne, ce qu’il change au toucher', () => { const n = (H.a.match(/<li class="ck-sv /g) || []).length, d = (H.a.match(/<details class="ck-sv-d"><summary>/g) || []).length;
    return [n === 4 && d === 4 && H.a.includes('<span class="ck-sv-n">4 points</span>') && !/ck-sv-k|class="ck-cadre"/.test(H.a) && H.a.includes('</summary><p class="ck-sv-s">3 fûts · environ 21 L. Dernier ouillage le 8' + N + 'oct.</p></details>'), n + ' points, ' + d + ' dépliables']; });
  essai('② … un bouton court, son nom long pour le lecteur d’écran', () => ['data-cave="cuvee:c2" aria-label="Ouvrir la cuvée">Cuvée</button>', 'data-cave="planning" aria-label="Prévoir au planning">Prévoir</button>', 'data-cave="diag" aria-label="Ouvrir le diagnostic">Diagnostic</button>'].every((x) => H.a.includes(x)));
  essai('② la bulle « i » lit d’abord ce que la carte ajoute, puis la méthode ; sans ajout, rien ne change', () => { const a = M.bulle({ x: ['Le pourquoi.'] }, 'x'), b = M.bulle({}, 'x'), c = M.bulle({ o: ['Jamais.'] }, 'o');
    return [JSON.stringify(a.p) === '["Le pourquoi.","La méthode."]' && JSON.stringify(b.p) === '["La méthode."]' && c.t === 'Titre' && JSON.stringify(c.p) === '["Un."]', JSON.stringify([a, b, c])]; });
  // ③ rien n'est recalculé
  essai('③ le verdict reste celui de la Cave, mot pour mot ; elle le donne aussi en pièces (why, puis)', () => { const v = M.verdictDe(SEM(), { phase: 'elevage' });
    return [v.t === '2 cuves à mesurer' && v.s === 'Pas de relevé depuis hier ou avant. Puis' + N + ': 1 cuvée à ouiller · 2 cuvées ont fini leur malo.' && v.why === 'Pas de relevé depuis hier ou avant.' && JSON.stringify(v.puis) === '["1 cuvée à ouiller","2 cuvées ont fini leur malo"]'
      && mo.verdict.phrase === '2 cuves à mesurer aujourd’hui.' && mo.verdict.sous === v.s && mo.verdict.t === v.t, JSON.stringify(v)]; });
  essai('③ un verdict sans pièces (ancienne forme) : pas de pastille inventée, la phrase entière derrière le « i »', () => { const m = M.modele({ verdict: { cls: 'due', t: '2 cuves à mesurer', s: 'Pas de relevé. Puis : 1 cuvée à ouiller.' } });
    return m.verdict.puis.length === 0 && m.verdict.pourquoi === 'Pas de relevé. Puis : 1 cuvée à ouiller.' && !D.cvVerdict(m).includes('cv-v-puis'); });
  essai('③ le retard d’une cuvée est celui de l’ouillage, sorti à part ; le détail garde le reste', () => { const c = mo.chai.cuvees[0], g = mo.chai.cuvees.find((x) => x.id === 'c1');
    return [c.nom === 'Fixin 1er Cru ’25' && c.rt === 5 && c.d === 'malo finie, à soutirer' && /En retard de 5.jours/.test(c.s) && g.rt === 0 && !/class="rt"/.test(D.cvPlan(mo).split('Gevrey-Chambertin VV ’25')[1].split('</summary>')[0]), JSON.stringify([c.rt, c.d, c.s, g.rt])]; });
  T('③ le modèle ne refait aucun calcul de cave : pas d’agenda, pas de verdict refait', !/_mlOuillages\(|_mlVerdict\(|_mlAgendaComplet\(/.test(corps(S.pil, '_pilCk2Cave')));
  // ④ aucun bouton de geste
  const sec = S.vue.slice(S.vue.indexOf('/* ═══ 11 bis. LA VUE CAVE'), S.vue.indexOf('/* ═══ 12. NAVIGATION'));
  T('④ toujours aucun bouton de geste dans la vue Cave : chaque porte est un data-cave', sec.length > 2000 && !/_mlGo|onclick|_caveQuickOp|openOvVendMesure/.test(sec) && (sec.match(/data-cave="/g) || []).length >= 8 && !/onclick|_mlGo/.test(Object.values(H).join('')));
  T('④ la ligne qui se déplie efface sa bulle ; la bulle dit le nouveau geste', S.vue.includes("if (ev.target.closest('#ck-cv-plan summary')) cvCacherTip();") && S.vue.includes("esc(T.p || 'Toucher déplie le détail ; « Ouvrir » mène à la Cave.')"));
  // ⑤ la feuille, l'aide, le guide, l'annonce, les versions
  T('⑤ les règles du lot sont dans aujourdhui.css, pas dans styles.css (au plafond)', C.includes('★★★ MOTS-6 (§588)') && !S.css.includes('MOTS-6') && !/\.cv-v-ph|\.cv-lgs|\.cv-mil-t\b/.test(S.css));
  T('⑤ les règles mortes de la vue Cave ont quitté styles.css', !/\.cv-etapes|\.cv-et\b|\.cv-mil-tete|\.cv-note|\.cv-leg-j|\.cv-tot\b|\.cv-cuvee-s|\.cv-btl-ic/.test(S.css) && Buffer.byteLength(S.css) <= 1024 * 1024);
  T('⑤ une ligne qui se déplie se touche sur 44 px au téléphone (la légende du millésime)', C.includes('@media (max-width:699px),(pointer:coarse){.ck2 .cv-lg>summary{min-height:44px}}'));
  T('⑤ un mot long ne sort pas de la case d’un jour', C.includes('.ck2 .cv-j-ev li{hyphens:auto;overflow-wrap:anywhere}'));
  const info = (k) => (S.vue.match(new RegExp("^ {2}" + k + ": '.*',$", 'm')) || [''])[0];
  T('⑤ les bulles « i » disent ce qui a quitté les cartes : les ronds du Planning, l’estimation des litres, le toucher', /un rond plein est une journée de cave, un demi-rond le matin ou l’après-midi/.test(info('cvsemaine')) && /Les litres d’ouillage sont une estimation/.test(info('cvsemaine'))
    && /Toucher une cuve ou une cuvée déplie son détail ; « Ouvrir » mène à l’écran de la Cave/.test(info('cvplan')) && /Toucher une ligne de la légende dit ce qu’elle compte/.test(info('cvmil')) && /Toucher un point dit ce qu’il change/.test(info('cvsavoir')));
  T('⑤ l’aide du Pilotage dit la règle et le geste', /Chaque carte tient en un chiffre, une barre ou une couleur : le « i » explique la méthode, et toucher une ligne déplie son détail\./.test(S.uti) && /« Ouvrir » et chaque bouton mènent à l’écran de la Cave/.test(S.uti));
  T('⑤ le guide aussi, et dit l’ordre du téléphone', /« Ouvrir » et chaque bouton mènent à l'écran de la Cave/.test(S.guide) && /<b>Ce qui presse<\/b> : le verdict de Cave › Aujourd'hui/.test(S.guide) && /Au téléphone, « En direct » et « À savoir » passent en tête, juste sous la phrase du jour, comme dans la vue Terrain/.test(S.guide));
  const wn = S.wn.slice(S.wn.indexOf("  { v: '11.16',"), S.wn.indexOf("  { v: '11.15',"));
  T('⑤ l’annonce 11.16 : pour l’admin, sans « & », et dit « Aucun calcul ne change »', wn.length > 300 && /pour: \['admin'\], emoji: 'barrique', titre: 'Aujourd’hui, vue Cave\\u00a0: les mêmes cartes, moins de mots'/.test(wn) && !/titre: '[^']*&/.test(wn) && /Aucun calcul ne change\./.test(wn));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1] || '0', nApp = parseFloat(app);
  T('⑤ les versions : APP 11.16 au moins, partout la même ; le service worker dit le lot', nApp >= 11.16 && (S.idx.match(new RegExp('v' + app.replace('.', '\\.') + '\\b', 'g')) || []).length >= 4 && S.idx.includes('/boot.js?v=' + app)
    && S.sw.includes('// v12.07 (17/11/2026) — MOTS-6 (§588)') && /const CACHE_NAME {3}= 'mavigne-v(\d+\.\d+)';/.test(S.sw) && parseFloat(S.sw.match(/const CACHE_NAME {3}= 'mavigne-v(\d+\.\d+)';/)[1]) >= 12.07, app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const rt = ref && ref.mesures && ref.mesures['téléphone'] && ref.mesures['téléphone']['Pilotage › Aujourd’hui › Cave'], ro = ref && ref.mesures && ref.mesures['ordinateur'] && ref.mesures['ordinateur']['Pilotage › Aujourd’hui › Cave'];
  T('⑤ la référence des mots est regravée : la vue Cave à 235 mots au plus au téléphone (485 avant), 240 sur ordinateur (533 avant), aucune phrase de 15 mots', !!rt && !!ro && rt.mots <= 235 && ro.mots <= 240 && rt.p15 === 0 && ro.p15 === 0, JSON.stringify([rt, ro]));
  T('⑤ la maquette validée est au dépôt, et dite au LISEZMOI', /Pilotage › Aujourd’hui, vue Cave, maquette v1/.test(S.maq) && /`maquette-aujourdhui-cave-v1\.html` — Pilotage › Aujourd’hui, vue Cave allégée/.test(S.lm));
  T('⑤ ce harnais et ses contre-épreuves sont dans la liste', S.liste.includes("['node scripts/mv-harnais-mots6.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots6.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-6 (§588) — Pilotage › Aujourd’hui, la vue Cave allégée\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['une carte quitte l’écran (le millésime)', sur('vue', '<section class="ck-panneau cv-mil" id="ck-cv-mil" aria-label="Le millésime"></section>', '')],
    ['sur ordinateur, « À savoir » quitte la colonne de droite', sur('vue', "['cv-plan', 'cv-semaine'], ['cv-fil', 'cv-savoir']],", "['cv-plan', 'cv-semaine', 'cv-savoir'], ['cv-fil']],")],
    ['au téléphone, l’ordre d’avant', sur('vue', "petit: [['cv-fil', 'cv-savoir', 'cv-verdict',", "petit: [['cv-verdict', 'cv-savoir', 'cv-fil',")],
    ['au téléphone, la feuille oublie la vue Cave', sur('auj', '>.ck-col>:is(#ck-fil,#ck-cv-fil){order:1}', '>.ck-col>:is(#ck-fil){order:1}')],
    ['la grande phrase du verdict revient', sur('vue', "(m ? '<b>' + esc(m[1]) + '</b><span>' + esc(m[2]) + '</span>' : '<span>' + esc(v.t || v.phrase) + '</span>')", "'<span>' + esc(v.phrase) + '</span>'")],
    ['ce qui suit le verdict disparaît (ni pastilles, ni phrase)', sur('vue', "((v.puis || []).length ? '<p class=\"cv-v-puis\">'", "(false ? '<p class=\"cv-v-puis\">'")],
    ['le pourquoi du verdict ne va nulle part', sur('vue', '  INFO_PLUS.cvverdict = [v.pourquoi, v.cadre].filter(Boolean);\n', '')],
    ['la ligne de cadre revient sous le verdict', sur('vue', "    + '<dl class=\"cv-sem3\">'", "    + '<p class=\"ck-cadre\">' + esc(v.cadre) + '</p><dl class=\"cv-sem3\">'")],
    ['les compteurs reprennent leurs mots longs', sur('vue', "'<div><dt>' + (CV_SEM3[k] || esc(x[0])) + '</dt>", "'<div><dt>' + esc(x[0]) + '</dt>")],
    ['la matière et la contenance reviennent sous la cuve', sur('vue', "+ cvCuveSvg(c) + '<span class=\"cv-cuve-n\">' + esc(c.nom) + '</span>'\n", "+ cvCuveSvg(c) + '<span class=\"cv-cuve-n\">' + esc(c.nom) + '</span><span class=\"cv-cuve-m\">' + esc(c.mat) + '</span>'\n")],
    ['le détail d’une cuve disparaît', sur('vue', "'<div class=\"cv-dt\"><span>' + esc([c.mat + ' · ' + String(c.cap).replace('.', ',') + '\\u00a0hL', c.s].filter(Boolean).join(' · ')) + '</span>' + cvOuvrir(c.go, c.nom) + '</div></details>'", "'<div class=\"cv-dt\">' + cvOuvrir(c.go, c.nom) + '</div></details>'")],
    ['une cuve ne mène plus à la Cave', sur('vue', "'</span>' + cvOuvrir(c.go, c.nom) + '</div></details>';\n  }).join('');", "'</span></div></details>';\n  }).join('');")],
    ['le toucher d’une cuve navigue au lieu de déplier', sur('vue', "'\"><summary data-tip=\"u' + esc(c.id) + '\"", "'\"><summary data-cave=\"' + esc(c.go) + '\" data-tip=\"u' + esc(c.id) + '\"")],
    ['le retard d’une cuvée n’est plus sur sa ligne', sur('vue', "(c.rt ? '<span class=\"rt\">retard ' + c.rt + '\\u00a0j</span>' : '')", "''")],
    ['le détail d’une cuvée disparaît', sur('vue', "'<div class=\"cv-dt\">' + (det ? '<span>' + esc(det) + '</span>' : '')", "'<div class=\"cv-dt\">'")],
    ['« environ » revient dans le résumé du Chai', sur('vue', 'esc(C.chai.court || C.chai.resume)', 'esc(C.chai.resume)')],
    ['le prochain ouillage reste écrit sur une rangée repliée', sur('auj', '.ck2 .cv-grp:not(.ouvert) .cv-grp-s{display:none}', '')],
    ['la légende des ronds revient sous la semaine', sur('vue', "    + '<div class=\"cv-jours\">' + jours + '</div>'\n", "    + '<div class=\"cv-jours\">' + jours + '</div><p class=\"cv-leg-j\">comme au Planning</p>'\n")],
    ['le manque reprend sa phrase', sur('vue', "(W.manqueC ? '<b>' + esc(W.manqueC) + '</b> sans journée de cave' : esc(W.manque))", 'esc(W.manque)')],
    ['« Prévoir » s’offre hors admin', sur('vue', "  const prevoir = V.admin ? '<button type=\"button\" class=\"ck-sv-a\" data-cave=\"planning\">Prévoir</button>' : '';", "  const prevoir = '<button type=\"button\" class=\"ck-sv-a\" data-cave=\"planning\">Prévoir</button>';")],
    ['une période sans journée ne le dit plus', sur('vue', "(x[4] ? '<span class=\"ck-ph-pst\">sans journée</span>'", "(false ? '<span class=\"ck-ph-pst\">sans journée</span>'")],
    ['les journées d’une période disparaissent', sur('vue', "(x[6] ? '<span class=\"cv-s-j\">' + esc(x[6]) + '</span>' : '')", "''")],
    ['le total de la semaine ne va nulle part', sur('vue', "  INFO_PLUS.cvsemaine = [W.tot + ' ' + W.totTxt];\n", '')],
    ['la phrase du millésime revient', sur('vue', "    + '<p class=\"cv-mil-t\"><b>' + esc(M.t) + '</b><small>' + esc(M.sousT) + '</small></p>'", "    + '<p class=\"cv-mil-tete\">' + M.tete + '</p>'")],
    ['ce que compte une étape disparaît', sur('vue', "'<details class=\"cv-lg' + (e[4] ? ' a-venir' : '') + '\"><summary>' + tete + '</summary><p>' + esc(e[3]) + '</p></details>'", "'<details class=\"cv-lg' + (e[4] ? ' a-venir' : '') + '\"><summary>' + tete + '</summary></details>'")],
    ['la légende du millésime compte en tonnes, la barre en hL', sur('pil', "leg:[['vendu','raisin vendu',nb(Math.round(hlVendu))+'\\u00a0hL',", "leg:[['vendu','raisin vendu',nb(Math.round((ch.kgVendu||0)/100)/10)+'\\u00a0t',")],
    ['un rendement vide s’affiche', sur('vue', "(M.rdtV ? '<p class=\"cv-rdt\"><span>rendement</span>", "(true ? '<p class=\"cv-rdt\"><span>rendement</span>")],
    ['la règle du Cuvier ne va nulle part', sur('vue', '  INFO_PLUS.cvmil = [M.note, M.rdtS].filter(Boolean);\n', '')],
    ['le fil redit la matière et la contenance de la cuve', sur('pil', "r.t+(r.q?' \\u00b7 '+qCourt(r.q):'')", "r.t+(r.q?' \\u00b7 '+r.q:'')")],
    ['tous les gestes restent à l’écran', sur('auj', '.ck2 .cv-fil:not(.ouvert) .cv-fil-l>li:nth-child(n+4){display:none}', '')],
    ['ce que change un point disparaît', sur('vue', "    + (x.s ? '</summary><p class=\"ck-sv-s\">' + esc(x.s) + '</p></details>' : '')\n    + (x.a ? '<button type=\"button\" class=\"ck-sv-a\" data-cave=", "    + (x.s ? '</summary></details>' : '')\n    + (x.a ? '<button type=\"button\" class=\"ck-sv-a\" data-cave=")],
    ['le bouton d’un point perd son nom long', sur('vue', "(x.ac ? ' aria-label=\"' + esc(x.a) + '\"' : '') + '>' + esc(x.ac || x.a)", "'>' + esc(x.ac || x.a)")],
    ['le compte des points disparaît', sur('vue', "<span class=\"ck-sv-n' + (L.some(x => x.alerte) ? ' alerte' : '') + '\">' + n + ' point'", "<span class=\"ck-sv-n\" hidden>' + n + ' point'")],
    ['la bulle « i » ignore ce que la carte ajoute', sur('vue', "if (plus.length && typeof f === 'string') {", "if (false && plus.length && typeof f === 'string') {")],
    ['la Cave ne donne plus son verdict en pièces', sur('cave', 'return {cls:first.cls, t:first.t, s:s, why:first.why, puis:suite};', 'return {cls:first.cls, t:first.t, s:s};')],
    ['le Pilotage redécoupe la phrase du verdict', sur('pil', "var vPuis=(Array.isArray(v.puis)?v.puis:[])", "var vPuis=(Array.isArray(v.puis)?v.puis:String(v.s||'').split('Puis').slice(1))")],
    ['le retard d’une cuvée est inventé', sur('pil', 'rt:retard, d:parts.filter(', 'rt:retard||5, d:parts.filter(')],
    ['un bouton de geste dans une cuvée', sur('vue', "const cvOuvrir = (go, nom) => '<button type=\"button\" class=\"ck-lien\" data-cave=\"' + esc(go) + '\"", "const cvOuvrir = (go, nom) => '<button type=\"button\" class=\"ck-lien\" onclick=\"_mlGo()\" data-x=\"' + esc(go) + '\"")],
    ['la bulle reste sur une ligne dépliée', sur('vue', "    if (ev.target.closest('#ck-cv-plan summary')) cvCacherTip();", '')],
    ['le bloc du lot retourne dans styles.css (au plafond)', (S) => ({ ...S, css: S.css + S.auj })],
    ['une règle morte revient dans styles.css', (S) => ({ ...S, css: S.css + '\n.ck2 .cv-note{margin:0}' })],
    ['la légende du millésime ne se touche plus sur 44 px', sur('auj', '@media (max-width:699px),(pointer:coarse){.ck2 .cv-lg>summary{min-height:44px}}', '')],
    ['un mot long sort de la case d’un jour', sur('auj', '.ck2 .cv-j-ev li{hyphens:auto;overflow-wrap:anywhere}', '')],
    ['la bulle de la semaine tait les ronds du Planning', sur('vue', 'Dans un jour, un rond plein est une journée de cave, un demi-rond le matin ou l’après-midi, comme au Planning. ', '')],
    ['l’aide tait la règle', sur('uti', 'Chaque carte tient en un chiffre, une barre ou une couleur : le « i » explique la méthode, et toucher une ligne déplie son détail. ', '')],
    ['le guide tait l’ordre du téléphone', sur('guide', 'Au téléphone, « En direct » et « À savoir » passent en tête, juste sous la phrase du jour, comme dans la vue Terrain.', '')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("  { v: '11.16',"); const j = S.wn.indexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.07 (17/11/2026) — MOTS-6 (§588)', '// v12.07 (17/11/2026) — divers')],
    ['la référence des mots garde l’ancienne vue Cave', (S) => { const r = JSON.parse(S.ref); r.mesures['téléphone']['Pilotage › Aujourd’hui › Cave'].mots = 485; return { ...S, ref: JSON.stringify(r) }; }],
    ['la maquette n’est pas dite au LISEZMOI', sur('lm', '`maquette-aujourdhui-cave-v1.html`', '`maquette-x.html`')],
    ['le harnais sort de la liste', sur('liste', "['node scripts/mv-harnais-mots6.mjs --contre']", "['node scripts/mv-harnais-mots6.mjs']")],
  ];
  let fuites = 0;
  console.log('\nMOTS-6 — contre-épreuves : chaque mutation doit rougir\n');
  for (const [nom, f] of mutants) {
    let rouge = false, note = '';
    try { rouge = suite(f(S0)).some((x) => !x[1]); } catch (e) { note = ' (' + e.message + ')'; rouge = !/motif absent/.test(e.message); if (!rouge) note += ' — MOTIF ABSENT'; }
    if (!rouge) fuites++;
    console.log('  ' + (rouge ? '\x1b[32m✓\x1b[0m rougit : ' : '\x1b[31m✗ RESTE VERT : \x1b[0m') + nom + note);
  }
  console.log('\n' + (fuites ? '\x1b[31mROUGE\x1b[0m — ' + fuites + ' contre-épreuve(s) sans effet' : '\x1b[32mVERT\x1b[0m — ' + mutants.length + ' contre-épreuves rougissent'));
  process.exit(fuites ? 1 : 0);
}
