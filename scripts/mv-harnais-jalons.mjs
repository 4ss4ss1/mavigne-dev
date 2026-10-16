/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — JALONS-1 (§340) : LE CALCUL DES JALONS ET LEUR MÉMOIRE
   Lancer : node scripts/mv-harnais-jalons.mjs          (le contrôle)
            node scripts/mv-harnais-jalons.mjs --contre  (la contre-épreuve)
   ⚠️ ON EXÉCUTE le bloc borné de src/jalons.js sur des données inventées.
   ⚠️ Les règles Firestore elles-mêmes sont jouées par le vrai moteur dans
      mv-harnais-rules (cas B18 à B25, émulateur, `npm run test:rules` / la CI) ;
      ici on vérifie seulement qu'elles sont écrites.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
const J = fs.readFileSync('src/jalons.js', 'utf8'), F = fs.readFileSync('src/firebase.js', 'utf8'), A = fs.readFileSync('src/app.js', 'utf8');
const R = fs.readFileSync('firestore.rules', 'utf8'), RT = fs.readFileSync('scripts/mv-harnais-rules.mjs', 'utf8');
const CONTRE = process.argv.includes('--contre');
const DEB = '// ── JALONS-1 : début du bloc exécutable', FIN = '// ── JALONS-1 : fin du bloc exécutable';
const i = J.indexOf(DEB), j = J.indexOf(FIN);
if (i < 0 || j < i) { console.log('  ✗ bloc JALONS-1 introuvable'); process.exit(1); }
const charger = src => import('data:text/javascript;base64,' + Buffer.from(src + '\nexport { MV_JALONS_SERIES, _mvJalonsCompteurs, _mvJalonsAtteints, _mvJalonsFusion, _mvJalonsOuverture, MV_JALONS_PHRASES, _mvJalonLibelle, _mvJalonsProchains, _mvJalDateFr };\n', 'utf8').toString('base64'));
// Un petit domaine inventé : 2 parcelles d'1 ha, rangs à 1 m, 10 000 pieds/ha.
const D0 = () => ({
  parcelles: [{ nom: 'P1', surface: 1 }, { nom: 'P2', surface: 1 }], vigne: { ec_rang: 1, ec_pied: 1, pieds: 10000 },
  journal: [
    { parcelle: 'P1', tache: 'Relevage', date: '2026-06-01', statut: 'Validé', qui: 'Paul' },
    { parcelle: 'P1', tache: 'Relevage', date: '2026-06-01', statut: 'Validé', qui: 'Paul' },           // doublon : ne compte pas
    { parcelle: 'P2', tache: 'Relevage', date: '2026-06-02', statut: 'Validé', qui: 'Léo', membresEquipe: ['Paul'] },   // à deux : la moitié
    { parcelle: 'P2', tache: 'Palissage', date: '2026-06-03', statut: 'Annulé', qui: 'Paul' },          // défait par ↩
    { parcelle: 'P1', tache: 'Palissage', date: '2026-06-04', statut: 'Validé', qui: 'Léo' },           // pas Paul
    { parcelle: 'P1', tache: 'Relevage', date: '2026-06-05', statut: 'En cours', qui: 'Paul' },
  ],
  activites: [{ nom: 'Tarière', champCustom: { label: 'Trous', feedsPlantation: true } }, { nom: 'Engrais' }],
  sessions: [
    { conducteur: 'Paul', activite: 'Tarière', statut: 'Terminé', parcellesFaites: [{ nom: 'P1', data: { Trous: '120' } }, { nom: 'P2', data: { Trous: 30 } }] },
    { conducteur: 'Paul', activite: 'Engrais', statut: 'En cours', parcellesFaites: [{ nom: 'P1' }] },
    { conducteur: 'Léo', activite: 'Tarière', statut: 'Terminé', parcellesFaites: [{ nom: 'P1', data: { Trous: 999 } }] },
  ],
  cave: { operations: [{ type: 'ouillage', intervenants: ['Paul', 'Léo'] }, { type: 'soutirage', operateur: 'Paul' }, { type: 'degustation', intervenants: ['Léo'] }] },
  membres: [{ nom: 'Paul', debut_contrat: '2025-03-01' }], aujourdhui: new Date('2026-06-12T10:00:00'), ouv: 10,
});
function controles(K) {
  const r = [], c = K._mvJalonsCompteurs('Paul', D0());
  r.push(['validations : les siennes et celles de son équipe, sans doublon, sans « Annulé » ni « En cours »', c.val === 2, 'val=' + c.val]);
  r.push(['kilomètres et pieds : à plusieurs, chacun sa part', c.km === 15 && c.pieds === 15000, 'km=' + c.km + ' pieds=' + c.pieds]);
  r.push(['le premier hectare, tâche par tâche', Math.abs(c.haTache.relevage - 1.5) < 1e-9 && !c.haTache.palissage]);
  r.push(['tracteur : sessions finies du conducteur, trous de la tarière, hectares d’engrais', c.ses === 1 && c.trous === 150 && c.eng === 1 && c.kmtr === 30, JSON.stringify({ ses: c.ses, trous: c.trous, eng: c.eng, kmtr: c.kmtr })]);
  r.push(['Chai : ouillages, soutirages, dégustations où il est noté (et l’ancien « opérateur »)', c.ouil === 1 && c.sout === 1 && c.degu === 0]);
  r.push(['un an au domaine depuis le début du contrat', c.an === 1]);
  const at = K._mvJalonsAtteints(c);
  r.push(['les paliers atteints, et seulement eux', at.includes('val.1') && !at.includes('val.10') && at.includes('ouv.10') && !at.includes('ouv.25') && at.includes('trous.100') && !at.includes('trous.250') && at.includes('km.1') && !at.includes('km.42.195') && at.includes('ha1.relevage') && at.includes('an.1'), at.join(' ')]);
  const f = K._mvJalonsFusion({ gagnes: { 'val.1': '2026-01-01', 'vieux.1': '2025-05-05' } }, ['val.1', 'val.10'], '2026-06-12');
  r.push(['un jalon gagné reste gagné, la date d’origine est gardée, le nouveau est daté', f.gagnes['vieux.1'] === '2025-05-05' && f.gagnes['val.1'] === '2026-01-01' && f.gagnes['val.10'] === '2026-06-12' && f.nouveaux.join() === 'val.10']);
  const o1 = K._mvJalonsOuverture({ n: 4, dern: '2026-06-12|am' }, new Date('2026-06-12T11:00:00'));
  const o2 = K._mvJalonsOuverture({ n: 4, dern: '2026-06-12|am' }, new Date('2026-06-12T14:00:00'));
  r.push(['une ouverture au plus par demi-journée', o1.compte === false && o1.ouv.n === 4 && o2.compte === true && o2.ouv.n === 5 && o2.ouv.dern === '2026-06-12|pm']);
  const v0 = K._mvJalonsCompteurs('', D0());
  r.push(['sans nom, rien ne se compte', v0.val === 0 && v0.ses === 0]);
  r.push(['les séries de Nico : tarière en neuf paliers jusqu’à 10 000, ouvertures et validations jusqu’à 1 000',
    JSON.stringify(K.MV_JALONS_SERIES.find(s => s.id === 'trous').seuils) === '[1,10,100,250,500,1000,2000,5000,10000]' &&
    K.MV_JALONS_SERIES.find(s => s.id === 'val').seuils.at(-1) === 1000 && K.MV_JALONS_SERIES.find(s => s.id === 'ouv').seuils.at(-1) === 1000]);
  r.push(['aucune série sur une vitesse, une durée ni une quantité épandue', !K.MV_JALONS_SERIES.some(s => /vitesse|dur[ée]e|dose|kg|litre/i.test(s.id + ' ' + s.t))]);
  // JALONS-2 (§341) : les mots des jalons
  const tous = K.MV_JALONS_SERIES.flatMap(s => s.seuils.map(x => s.id + '.' + x));
  const sans = tous.filter(id => { const L = K._mvJalonLibelle(id); return !L.titre || !L.phrase || L.titre === id; });
  r.push(['JALONS-2 : chaque palier de chaque série a son titre et sa phrase', !sans.length, sans.join(', ')]);
  const sales = tous.map(id => K._mvJalonLibelle(id)).filter(L => /[<>&"]|[\u0153\u2026\u202f]/.test(L.titre + L.phrase));
  r.push(['JALONS-2 : ni HTML, ni « œ », ni « … », ni espace fine (police embarquée)', !sales.length, sales.map(L => L.titre).join(', ')]);
  const L1 = K._mvJalonLibelle('trous.10000'), L2 = K._mvJalonLibelle('km.42.195'), L3 = K._mvJalonLibelle('ha1.relevage', 'Relevage');
  r.push(['JALONS-2 : les titres se lisent (« 10 000 trous de tarière », le marathon, le premier hectare d’une tâche)',
    L1.titre === '10\u00a0000 trous de tarière' && L2.titre === 'Le marathon des rangs' && L3.titre === 'Premier hectare de relevage']);
  const pr = K._mvJalonsProchains({ val: 18, trous: 150, ouv: 4 }, { 'val.1': 'x', 'val.10': 'x', 'trous.1': 'x', 'trous.10': 'x', 'trous.100': 'x', 'ouv.1': 'x' });
  r.push(['JALONS-2 : les prochains paliers, du plus proche au plus lointain', pr[0].id === 'val.25' && pr.some(p => p.id === 'trous.250') && pr.some(p => p.id === 'ouv.10') && pr[0].ratio >= pr[pr.length - 1].ratio, pr.map(p => p.id).join(' ')]);
  r.push(['JALONS-2 : la date en français', K._mvJalDateFr('2026-10-15') === '15/10/2026' && K._mvJalDateFr('') === '']);
  return r;
}
let ok = 0, ko = 0;
const t = (n, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + n); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d ? '\n      → ' + d : '')); } };
const K = await charger(J.slice(i, j));
// JALONS-2B (§342) : _mvJalonsSync, joué en entier avec un faux window (lecture, ouverture, fusion, écriture).
function sourceSync(srcJ) {
  const a = srcJ.indexOf('function _mvJalonsJour()'), b = srcJ.indexOf('window._mvJalonsSync = _mvJalonsSync;');
  return srcJ.slice(srcJ.indexOf(DEB), srcJ.indexOf(FIN)) + '\n' + srcJ.slice(a, b);
}
jouerSync.n = 0;
async function jouerSync(srcJ, lecture, maintenant) {
  const w = { currentUser: { nom: 'Paul' }, JOURNAL: [{ parcelle: 'P1', tache: 'Relevage', date: '2026-06-01', statut: 'Validé', qui: 'Paul' }],
              SESSIONS: [], ACTIVITES: [], PARCELLES: [{ nom: 'P1', surface: 1 }], CAVE_ELEVAGE: { operations: [] }, MEMBRES: [], _mvVigne: () => null };
  const ecrits = [];
  w.fbLireJalons = async () => lecture; w.fbEcrireJalons = async v => { ecrits.push(JSON.parse(JSON.stringify(v))); return true; };
  globalThis.__mvW = w; globalThis.__mvMaintenant = maintenant;
  const code = 'const window = globalThis.__mvW; const _D = globalThis.Date; class Date extends _D { constructor(...a) { super(...(a.length ? a : [globalThis.__mvMaintenant])); } static now() { return new _D(globalThis.__mvMaintenant).getTime(); } }\n'
             + sourceSync(srcJ) + '\nexport { _mvJalonsSync };\n// essai ' + (++jouerSync.n) + '\n';   // ⚠️ une adresse data: identique renverrait le module déjà chargé, avec l’ancien faux window
  const m = await import('data:text/javascript;base64,' + Buffer.from(code, 'utf8').toString('base64'));
  const r = await m._mvJalonsSync();
  return { r, ecrits };
}
async function controlesSync(srcJ) {
  const r = [], T0 = '2026-06-12T10:00:00';
  const s1 = await jouerSync(srcJ, { ok: false }, T0);
  r.push(['JALONS-2B : lecture refusée ou impossible → rien d’annoncé, rien d’écrit', s1.r === null && s1.ecrits.length === 0, JSON.stringify(s1)]);
  const s2 = await jouerSync(srcJ, { ok: true, value: null }, T0);
  r.push(['JALONS-2B : document absent, lu pour de vrai → premier calcul, écrit', s2.ecrits.length === 1 && !!s2.ecrits[0].gagnes && s2.ecrits[0].gagnes['val.1'] === '2026-06-12' && s2.ecrits[0].ouv.n === 1, JSON.stringify(s2.ecrits)]);
  const s3 = await jouerSync(srcJ, { ok: true, value: { ouv: { n: 4, dern: '2026-06-11|pm' }, gagnes: { 'val.1': '2025-01-01', 'ouv.1': '2025-01-01', 'ha1.relevage': '2025-01-01' } } }, T0);
  r.push(['JALONS-2B : seuls les jalons nouveaux partent — une date déjà posée n’est jamais réécrite', s3.ecrits.length === 1 && !('gagnes' in s3.ecrits[0]) && s3.ecrits[0].ouv.n === 5, JSON.stringify(s3.ecrits)]);
  const s4 = await jouerSync(srcJ, { ok: true, value: { ouv: { n: 4, dern: '2026-06-12|am' }, gagnes: { 'val.1': '2025-01-01', 'ouv.1': '2025-01-01', 'ha1.relevage': '2025-01-01' } } }, T0);
  r.push(['JALONS-2B : même demi-journée, rien de nouveau → aucune écriture', s4.ecrits.length === 0]);
  return r;
}
if (!CONTRE) {
  console.log('\n── JALONS-1 — le calcul des jalons et leur mémoire\n');
  for (const [n, c, d] of controles(K)) t(n, c, d);
  for (const [n, c, d] of await controlesSync(J)) t(n, c, d);
  t('firebase.js : la clé est jalons_<uid> de la personne connectée', /function _mvJalonsCle\(\) \{ var u = auth && auth\.currentUser; return \(u && u\.uid\) \? \('jalons_' \+ u\.uid\) : null; \}/.test(F));
  t('firebase.js : jamais en démo ni en mode préparation, lecture comme écriture', /function _mvJalonsPermis\(\) \{ return !!TENANT_ID && TENANT_ID !== 'domaine-dupont' && !\(window\._mvPrepOn && window\._mvPrepOn\(\)\); \}/.test(F) && (F.match(/if \(!_mvJalonsPermis\(\)\) return/g) || []).length === 2);
  t('JALONS-2B : la lecture distingue « absent » (ok, value null) de « refusé ou impossible » (ok:false)', /return \{ ok: true, value: snap\.exists\(\) \? \(snap\.data\(\)\.value \|\| null\) : null \};/.test(F) && ((F.slice(F.indexOf('window.fbLireJalons = async function'), F.indexOf('window.fbEcrireJalons = async function'))).match(/return \{ ok: false \};/g) || []).length === 3);
  t('firebase.js : écriture en fusion (deux appareils ne s’écrasent pas)', /setDoc\(fbDocRef\(k\), \{ value: v \}, \{ merge: true \}\)/.test(F));
  t('app.js : importe jalons.js et synchronise après le chargement', /^import '\.\/jalons\.js';/m.test(A) && /window\.fbNoterAppareil\(currentUser\.nom\);[^\n]*\n  if\(window\._mvJalonsSync && currentUser\) window\._mvJalonsSync\(\);/.test(A));
  t('JALONS-2 : la validation recalcule puis annonce (confirmValidation)', /_mvJalonsSync\(\)\.then\(function\(r\)\{ if\(r&&r\.nouveaux&&r\.nouveaux\.length&&window\._mvJalonsAnnonce\) window\._mvJalonsAnnonce\(r\.nouveaux\); \}\);/.test(A));
  t('JALONS-2 : l’annonce passe par textContent, et résume au-delà de trois', /el\.querySelector\('\.mvds-jal-t'\)\.textContent = L\.titre/.test(J) && /ids\.length > 3 \? \{ titre: ids\.length \+ ' nouveaux jalons'/.test(J) && !/innerHTML = [^;]*L\.titre/.test(J));
  t('JALONS-2 : « Mes jalons » dans « Ma trace »', /h\+=window\._mvJalonsSection\(\);/.test(A) && /function _mvJalonsSection\(\)/.test(J));
  t('JALONS-2 : le style, sans couleur en dur', (() => { const S = fs.readFileSync('src/styles.css', 'utf8'); const b = S.slice(S.indexOf('/* JALONS-2 (§341)'), S.indexOf('/* ★ TETE-2 (§329)')); return b.length > 100 && !/#[0-9a-fA-F]{3,6}\b/.test(b); })());
  t('jalons.js n’écrit que si quelque chose a changé', /if \(o\.compte \|\| f\.nouveaux\.length\) await window\.fbEcrireJalons\(envoi\);/.test(J));
  t('règles : la lecture générale exclut les jalons (membres et sous-collections)', (R.match(/!docId\.matches\('planning_moi_\.\*'\) && !docId\.matches\('jalons_\.\*'\);/g) || []).length === 2);
  t('règles : GUERETTECH ne lit pas les jalons', /allow read: if isGtAdmin\(\) && collection\.matches\('mavigne_\.\*'\) && !docId\.matches\('jalons_\.\*'\);/.test(R));
  t('règles : la personne lit SES jalons', /allow read: if isMyTenant\(collection\) && docId == 'jalons_' \+ request\.auth\.uid;/.test(R));
  t('règles : la règle 3 n’écrit pas les jalons d’un autre', /!isVuePlanning\(docId\)\n\s*&& !docId\.matches\('jalons_\.\*'\)\n\s*&& canWrite\(\)/.test(R));
  t('règles : la règle 6, la personne écrit SES jalons, lecture seule comprise, jamais en démo, forme bornée',
    /docId == 'jalons_' \+ request\.auth\.uid\n\s*&& request\.auth\.token\.get\('demo', false\) != true\n\s*&& shapeOk\(\)\n\s*&& request\.resource\.data\.value is map\n\s*&& request\.resource\.data\.value\.size\(\) <= 20;/.test(R));
  t('le moteur réel joue huit cas des jalons (B18 à B25, mv-harnais-rules)', ['B18', 'B19', 'B20', 'B21', 'B22', 'B23', 'B24', 'B25'].every(x => RT.includes("['" + x + "','B','") && RT.includes('jalons_')));
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── JALONS-1 — contre-épreuve\n');
const src = J.slice(i, j);
const essais = [
  ['un « Annulé » compté est vu', src.replace("j.statut !== 'Validé'", "j.statut === 'En cours'"), 'validations'],
  ['un doublon compté est vu', src.replace('if (vus[cle]) return;', ''), 'validations'],
  ['une fusion qui oublie un ancien jalon est vue', src.replace("var g = Object.assign({}, (ancien && ancien.gagnes) || {}), nouveaux = [];", "var g = {}, nouveaux = [];"), 'un jalon gagné reste gagné'],
  ['deux ouvertures dans la même demi-journée sont vues', src.replace('if (o.dern !== dj) {', 'if (true) {'), 'une ouverture au plus'],
  ['JALONS-2 : un palier sans phrase est vu', src.replace("2000: 'La tarière a pris l’habitude de vous.', ", ''), 'JALONS-2 : chaque palier'],
];
// JALONS-2B : la synchronisation entière, cassée de trois façons
const essaisSync = [
  ['une lecture refusée prise pour « aucun jalon » est vue', J.replace("    if (!lu || lu.ok !== true) return null;\n", ''), 'JALONS-2B : lecture refusée'],
  ['la table entière renvoyée à chaque écriture est vue', J.replace('if (f.nouveaux.length) envoi.gagnes = neufs;', 'envoi.gagnes = f.gagnes;'), 'JALONS-2B : seuls les jalons nouveaux'],
  ['une table vide envoyée quand rien n’est nouveau est vue', J.replace('if (f.nouveaux.length) envoi.gagnes = neufs;', 'envoi.gagnes = neufs;'), 'JALONS-2B : seuls les jalons nouveaux'],
];
let rates = 0;
for (const [n, srcJ, cible] of essaisSync) {
  let vu; try { vu = (await controlesSync(srcJ)).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); }
}
for (const [n, s, cible] of essais) {
  let vu; try { vu = controles(await charger(s)).some(([x, c]) => x.startsWith(cible) && !c); } catch (e) { vu = true; }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + n); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + n + ' — non vu'); }
}
console.log(`\n  ${essais.length + essaisSync.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length + essaisSync.length}\n`); process.exit(rates ? 1 : 0);
