// mv-harnais-kml-fusion.mjs — lot KML-FUSION (admin-gt.js)
//
// Methode C20 : on extrait les VRAIES fonctions du fichier livre, on leur donne
// des stubs minimaux, et on les EXECUTE. Aucune reecriture du code teste.
//
// ⚠️ Les contre-epreuves sont FONCTIONNELLES, pas textuelles. Une contre-epreuve
//    qui cherche un motif de texte se laisse satisfaire par la meme phrase ecrite
//    ailleurs dans le fichier (§42f) : deux des cinq ecrites d'abord ici etaient
//    fausses pour cette raison exacte, et disaient vert sur du code casse.
//
// ⚠️ Une mutation qui casse la syntaxe ne prouve RIEN : elle fait rougir sans que
//    l'assertion visee y soit pour quelque chose. D'ou le controle de syntaxe.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// ⚠️ AUCUN chemin de bac a sable en dur : six harnais du depot en portaient un et
//    se lisaient comme des succes alors qu'ils ne demarraient pas (§44).
// ⚠️⚠️ ET AUCUNE URL convertie a la main : sous Windows, la propriete `pathname`
//    d'une URL de fichier rend « /C:/Users/... », que Node repartait ensuite en
//    « C:\C:\Users\... ». Le harnais plantait chez Nico alors qu'il passait en bac
//    a sable Linux. `fileURLToPath` est la convention deja suivie par preflight.mjs
//    et mv-harnais-carte-parcelle.mjs.
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE   = process.argv[2] || path.join(RACINE, 'src', 'admin-gt.js');
const src = fs.readFileSync(FILE, 'utf8');

// ── Extraction d'une fonction par balance d'accolades ────────────────────────
function extract(s, name) {
  const re = new RegExp('(?:^|\\n)(?:async\\s+)?function\\s+' + name + '\\s*\\(', 'm');
  const m = re.exec(s);
  if (!m) throw new Error('fonction absente du fichier : ' + name);
  // ⚠️ le debut inclut « async » : le couper produirait un `await` hors fonction
  //    asynchrone, et le harnais planterait au lieu de tester.
  const start = m.index + (s[m.index] === '\n' ? 1 : 0);
  let d = 0, j = s.indexOf('{', m.index + m[0].length - 1);
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  return s.slice(start, j + 1);
}

const NOMS = ['_agtInsKey', '_agtGeoArea', '_agtKmlPlan', 'agtKmlSave', 'agtKmlRelire'];

// ── Bac a sable ──────────────────────────────────────────────────────────────
function makeEnv(opts) {
  opts = opts || {};
  const s      = opts.source || src;
  const base   = opts.base   || [];
  const fiches = opts.fiches || [];
  const ecrits = [], toasts = [];
  const env = {
    _agtKmlPolygons: opts.polys || [],
    _agtKmlMode:     opts.mode  || 'merge',
    _agtKmlCreerF:   opts.creerF !== false,
    _agtKmlSlug:     opts.slug  || 'domaine-chapelle-et-fils',
    _agtKmlLu:       opts.lu    || 'ok',
    _agtKmlBase: base, _agtKmlFiches: fiches,
    _agtKmlBusy: false, _agtKmlConfirm: false, _agtKmlFileName: 'f.kml',
    toasts, ecrits,
    showToast(m, c) { toasts.push({ m, c }); },
    agtRenderBody() { },
    window: {
      async fbAdminRead(slug, key) {
        if (opts.readFail) throw new Error('read KO');
        if (key === 'kml_polygons') return opts.baseNow   !== undefined ? opts.baseNow   : base;
        if (key === 'parcelles')    return opts.fichesNow !== undefined ? opts.fichesNow : fiches;
        return null;
      },
      async fbAdminWrite(slug, key, value) {
        if (opts.writeFail === key) return false;
        ecrits.push({ slug, key, value: JSON.parse(JSON.stringify(value)) });
        return true;
      }
    }
  };
  const code = NOMS.map(n => extract(s, n)).join('\n\n');
  const names = Object.keys(env);
  const api = new Function(...names, code +
    '\n; return { _agtKmlPlan, agtKmlSave, agtKmlRelire, _agtGeoArea, _agtInsKey,' +
    ' get etat(){ return { _agtKmlPolygons, _agtKmlBase, _agtKmlFiches, _agtKmlBusy, _agtKmlLu }; } };'
  )(...names.map(n => env[n]));
  return { env, api };
}
const planDe = o => { const { api } = makeEnv(o); return api._agtKmlPlan(o.base || [], o.fiches || []); };

// ── Jeux d'essai ─────────────────────────────────────────────────────────────
const P = (n, k) => ({ name: n, pts: Array.from({ length: k || 5 }, (_, i) => ({ lat: 47.08 + i * 4e-4, lng: 4.87 + i * 3e-4 })) });
const F = n => ({ nom: n, surface: 0.5, statut: 'Active', taches: {} });
const NOMS3 = ['Les Gravières', 'Clos Rousseau', 'La Comme'];
const CHAP  = NOMS3.map(n => P(n));
const CHAPF = NOMS3.map(F);
const VRIS = { // le vrai contour du fichier d'Alexandre
  name: 'Vris Bas',
  pts: [[47.0848224839936, 4.879692234485542], [47.0850805628112, 4.88012624847403],
  [47.08583234906222, 4.879317911624995], [47.08571469984102, 4.87909117883553],
  [47.08675573497941, 4.878024515360284], [47.08666770161081, 4.877880303056426],
  [47.0848224839936, 4.879692234485542]].map(([lat, lng]) => ({ lat, lng }))
};

// ── Compteur ─────────────────────────────────────────────────────────────────
let ok = 0, ko = 0;
const T = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \u2705 ' + nom); }
  else { ko++; console.log('  \u274C ' + nom + (detail ? '  \u2014 ' + detail : '')); }
};

console.log('\n=== HARNAIS KML-FUSION \u2014 ' + FILE + ' ===\n');
console.log('A. Le plan de fusion');

{ // A1 — le cas d'Alexandre : 3 en base, 1 dans le fichier, mode « completer »
  const p = planDe({ base: CHAP, fiches: CHAPF, polys: [VRIS], mode: 'merge' });
  T('A1 les 3 contours de base sont gardes', p.gardes.length === 3, 'gardes=' + p.gardes.length);
  T('A1 la sortie porte 4 contours', p.sortie.length === 4, 'sortie=' + p.sortie.length);
  T('A1 1 nouvelle, 0 mise a jour', p.nouveaux.length === 1 && p.majs.length === 0);
  T('A1 aucun perdu en mode completer', p.perdus.length === 0);
  T('A1 la fiche de Vris Bas est a creer', p.fichesAcreer.length === 1 && p.fichesAcreer[0].name === 'Vris Bas');
  T('A1 les 3 noms de depart sont tous dans la sortie', NOMS3.every(n => p.sortie.some(x => x.name === n)));
}
{ // A2 — mode remplacer : le comportement d'avant, mais nomme et compte
  const p = planDe({ base: CHAP, fiches: CHAPF, polys: [VRIS], mode: 'replace' });
  T('A2 sortie = le fichier seul', p.sortie.length === 1);
  T('A2 3 contours annonces perdus', p.perdus.length === 3, 'perdus=' + p.perdus.length);
}
{ // A3 — meme nom ecrit autrement : mise a jour, PAS un doublon
  const p = planDe({ base: CHAP, fiches: CHAPF, polys: [P('LES GRAVIERES.', 9)], mode: 'merge' });
  T('A3 « LES GRAVIERES. » reconnu comme « Les Gravières »', p.majs.length === 1 && p.nouveaux.length === 0,
    'majs=' + p.majs.length + ' nouveaux=' + p.nouveaux.length);
  T('A3 la sortie reste a 3 contours', p.sortie.length === 3, 'sortie=' + p.sortie.length);
  T('A3 le contour porte les 9 points du fichier', p.sortie.filter(x => x.pts.length === 9).length === 1);
  T('A3 aucune fiche a creer', p.fichesAcreer.length === 0);
}
{ // A4 — base vide
  const p = planDe({ base: [], fiches: [], polys: [VRIS], mode: 'merge' });
  T('A4 sortie = 1', p.sortie.length === 1);
  T('A4 fiche a creer', p.fichesAcreer.length === 1);
}
{ // A5 — la fiche existe, le contour non (parcelle saisie a la main)
  const f = CHAPF.concat([F('Vris Bas')]);
  const p = planDe({ base: CHAP, fiches: f, polys: [VRIS], mode: 'merge' });
  T('A5 contour ajoute', p.nouveaux.length === 1);
  T('A5 AUCUNE fiche en double', p.fichesAcreer.length === 0);
}
{ // A6 — la surface, par la vraie fonction du projet
  const { api } = makeEnv({});
  const s = Math.round(api._agtGeoArea(VRIS.pts) * 100) / 100;
  T('A6 Vris Bas = 0,66 ha', s === 0.66, 's=' + s);
}

console.log('\nB. L\'ecriture');

{ // B1 — chemin nominal : deux cles ecrites, et rien d'autre
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS] });
  await api.agtKmlSave();
  const k = env.ecrits.filter(e => e.key === 'kml_polygons');
  const f = env.ecrits.filter(e => e.key === 'parcelles');
  T('B1 kml_polygons ecrit une fois', k.length === 1);
  T('B1 4 contours ecrits', k[0] && k[0].value.length === 4, k[0] ? 'n=' + k[0].value.length : 'rien');
  T('B1 les 3 contours de depart sont dans l\'ecriture', !!k[0] && NOMS3.every(n => k[0].value.some(x => x.name === n)));
  T('B1 parcelles ecrit une fois', f.length === 1);
  T('B1 4 fiches ecrites', f[0] && f[0].value.length === 4, f[0] ? 'n=' + f[0].value.length : 'rien');
  T('B1 la fiche neuve porte 0,66 ha', !!(f[0] && f[0].value.find(x => x.nom === 'Vris Bas' && x.surface === 0.66)));
  T('B1 la fiche neuve est Active, taches vides',
    !!(f[0] && (x => x && x.statut === 'Active' && x.taches && !Object.keys(x.taches).length)(f[0].value.find(x => x.nom === 'Vris Bas'))));
  T('B1 aucune autre cle touchee', env.ecrits.every(e => e.key === 'kml_polygons' || e.key === 'parcelles'));
  T('B1 le fichier en attente est vide apres coup', api.etat._agtKmlPolygons.length === 0);
}
{ // B2 — case decochee : les contours partent, pas les fiches
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS], creerF: false });
  await api.agtKmlSave();
  T('B2 kml_polygons ecrit', env.ecrits.filter(e => e.key === 'kml_polygons').length === 1);
  T('B2 parcelles NON ecrit', env.ecrits.filter(e => e.key === 'parcelles').length === 0);
}
{ // B3 — la base a bouge depuis l'apercu : le plan suit la base, pas l'apercu
  const bougee = CHAP.concat([P('Champs Claude')]);
  const { env, api } = makeEnv({
    base: CHAP, fiches: CHAPF, polys: [VRIS],
    baseNow: bougee, fichesNow: CHAPF.concat([F('Champs Claude')])
  });
  await api.agtKmlSave();
  const k = env.ecrits.find(e => e.key === 'kml_polygons');
  T('B3 la parcelle apparue entre-temps est conservee',
    !!k && k.value.length === 5 && k.value.some(x => x.name === 'Champs Claude'),
    k ? 'n=' + k.value.length : 'rien');
}
{ // B4 — etat de la base inconnu : rien ne part
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS], lu: 'err' });
  await api.agtKmlSave();
  T('B4 aucune ecriture quand l\'etat de la base est inconnu', env.ecrits.length === 0);
}
{ // B5 — la relecture echoue : rien ne part, le bouton revient
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS], readFail: true });
  await api.agtKmlSave();
  T('B5 aucune ecriture si la relecture echoue', env.ecrits.length === 0);
  T('B5 le bouton est rendu (pas de blocage)', api.etat._agtKmlBusy === false);
}
{ // B6 — echec partiel : contours ecrits, fiches refusees -> le message le DIT
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS], writeFail: 'parcelles' });
  await api.agtKmlSave();
  T('B6 les contours sont bien ecrits', env.ecrits.filter(e => e.key === 'kml_polygons').length === 1);
  T('B6 le message annonce l\'echec des fiches', env.toasts.some(t => /fiches NON/i.test(t.m)),
    JSON.stringify(env.toasts.map(t => t.m)));
  T('B6 aucun message n\'annonce un succes complet', !env.toasts.some(t => /^Enregistr\u00e9 \u2014/.test(t.m)));
}
{ // B7 — echec sur les contours : on n'ecrit pas les fiches derriere
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS], writeFail: 'kml_polygons' });
  await api.agtKmlSave();
  T('B7 aucune fiche ecrite si les contours ont echoue', env.ecrits.filter(e => e.key === 'parcelles').length === 0);
}
{ // B8 — double clic
  const { env, api } = makeEnv({ base: CHAP, fiches: CHAPF, polys: [VRIS] });
  await Promise.all([api.agtKmlSave(), api.agtKmlSave()]);
  T('B8 un seul jeu d\'ecritures malgre deux appels',
    env.ecrits.filter(e => e.key === 'kml_polygons').length === 1,
    'n=' + env.ecrits.filter(e => e.key === 'kml_polygons').length);
}

console.log('\nC. Contre-epreuves \u2014 on reintroduit le defaut, le harnais DOIT rougir');

const CONTRES = [];
function contre(nom, mutation, verif) { CONTRES.push({ nom, mutation, verif }); }

async function runContres() {
  for (const c of CONTRES) {
    const mute = c.mutation(src);
    if (mute === src) { ko++; console.log('  \u274C ' + c.nom + ' \u2014 la mutation n\'a rien change'); continue; }
    // ⚠️ une mutation qui casse la syntaxe ferait rougir pour la mauvaise raison.
    try { execFileSync('node', ['--check', '--input-type=module'], { input: mute, stdio: 'pipe' }); }
    catch (e) { ko++; console.log('  \u274C ' + c.nom + ' \u2014 mutation invalide (syntaxe cassee)'); continue; }
    let vert;
    try { vert = !!(await c.verif(mute)); } catch (e) { vert = false; }
    if (!vert) { ok++; console.log('  \u2705 ' + c.nom + ' \u2014 rougit bien'); }
    else { ko++; console.log('  \u274C ' + c.nom + ' \u2014 LE DEFAUT PASSE'); }
  }
}

// C1 — le defaut d'origine : la sortie ignore ce qui est en base
contre('C1 sortie qui ecrase la base',
  s => s.replace(
    "sortie = gardes.map(function (p) { return { name: p.name, pts: p.pts }; })\n      .concat(_agtKmlPolygons.map(function (p) { return { name: p.name, pts: p.pts }; }));",
    "sortie = _agtKmlPolygons.map(function (p) { return { name: p.name, pts: p.pts }; });"),
  m => planDe({ source: m, base: CHAP, fiches: CHAPF, polys: [VRIS], mode: 'merge' }).sortie.length === 4);

// C2 — rapprochement sur le nom brut. ⚠️ La sortie fait 3 dans les DEUX cas :
//      seul `majs` distingue une mise a jour d'un remplacement silencieux.
contre('C2 rapprochement sans normalisation',
  s => s.replace(
    "base.forEach(function (p) { kBase[_agtInsKey(p && p.name)] = true; });",
    "base.forEach(function (p) { kBase[String(p && p.name)] = true; });"),
  m => planDe({ source: m, base: CHAP, fiches: CHAPF, polys: [P('LES GRAVIERES.', 9)], mode: 'merge' }).majs.length === 1);

// C3 — fiches non dedoublonnees
contre('C3 fiches non dedoublonnees',
  s => s.replace(
    "var fichesAcreer = nouveaux.filter(function (p) { return !kFiche[_agtInsKey(p.name)]; });",
    "var fichesAcreer = nouveaux.slice();"),
  m => planDe({ source: m, base: CHAP, fiches: CHAPF.concat([F('Vris Bas')]), polys: [VRIS], mode: 'merge' }).fichesAcreer.length === 0);

// C4 — verrou de double clic retire (contre-epreuve fonctionnelle : on double-clique)
contre('C4 verrou de double clic retire',
  s => s.replace('  if (_agtKmlBusy) return;\n', ''),
  async m => {
    const { env, api } = makeEnv({ source: m, base: CHAP, fiches: CHAPF, polys: [VRIS] });
    await Promise.all([api.agtKmlSave(), api.agtKmlSave()]);
    return env.ecrits.filter(e => e.key === 'kml_polygons').length === 1;
  });

// C5 — garde sur l'etat de lecture retiree. ⚠️ FONCTIONNELLE : le motif de texte
//      existe aussi dans _agtKmlEtatHtml, une verif textuelle disait vert a tort.
contre('C5 garde sur l\'etat de lecture retiree',
  s => s.replace("  if (_agtKmlLu !== 'ok') { showToast('État de la base inconnu — rechoisissez le domaine', '#E07060'); return; }\n", ''),
  async m => {
    const { env, api } = makeEnv({ source: m, base: CHAP, fiches: CHAPF, polys: [VRIS], lu: 'err' });
    await api.agtKmlSave();
    return env.ecrits.length === 0;
  });

// C6 — relecture supprimee : on ecrit sur la foi de l'apercu
contre('C6 ecriture sur l\'apercu au lieu d\'une relecture',
  s => s.replace(
    "    var baseNow   = await window.fbAdminRead(slug, 'kml_polygons');\n    var fichesNow = await window.fbAdminRead(slug, 'parcelles');",
    "    var baseNow   = _agtKmlBase;\n    var fichesNow = _agtKmlFiches;"),
  async m => {
    const bougee = CHAP.concat([P('Champs Claude')]);
    const { env, api } = makeEnv({
      source: m, base: CHAP, fiches: CHAPF, polys: [VRIS],
      baseNow: bougee, fichesNow: CHAPF.concat([F('Champs Claude')])
    });
    await api.agtKmlSave();
    const k = env.ecrits.find(e => e.key === 'kml_polygons');
    return !!k && k.value.some(x => x.name === 'Champs Claude');
  });

await runContres();

console.log('\nD. Cliquets de structure');
T('D1 agtKmlSave ne lit plus le <select> du DOM', !/getElementById\('agt-kml-slug'\)/.test(extract(src, 'agtKmlSave')));
T('D2 le <select> porte selected sur l\'etat retenu', /t\.slug === _agtKmlSlug \? ' selected'/.test(src));
T('D3 les 4 fonctions d\'ecran sont exposees sur window',
  ['agtKmlSlugChange', 'agtKmlMode', 'agtKmlCreerF', 'agtKmlConfirmSet']
    .every(n => new RegExp('window\\.' + n + '\\s*=').test(src)));
T('D4 le garde-fou marchand-grillot est present', /_agtKmlSlug === 'marchand-grillot'/.test(src));
T('D5 la relecture precede l\'ecriture dans agtKmlSave',
  (b => b.indexOf("fbAdminRead(slug, 'kml_polygons')") < b.indexOf("fbAdminWrite(slug, 'kml_polygons'"))(extract(src, 'agtKmlSave')));
T('D6 aucun emoji dans le code de ce lot',
  !/[\u{1F300}-\u{1FAFF}]/u.test(src.slice(src.indexOf('Fusion des contours'), src.indexOf('async function agtCheckKml'))));
T('D7 aucun demi-surrogate isole dans le fichier',
  !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/.test(src));

console.log('\n=== ' + ok + ' vert' + (ok > 1 ? 's' : '') + ', ' + ko + ' rouge' + (ko > 1 ? 's' : '') + ' ===');
process.exit(ko ? 1 : 0);
