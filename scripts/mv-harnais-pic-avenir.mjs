// mv-harnais-pic-avenir.mjs — lot PIC-AVENIR (pilotage.js)
//
// NE PAS relire ce fichier pour se rassurer : le lancer.
//   node scripts/mv-harnais-pic-avenir.mjs            (le lot)
//   node scripts/mv-harnais-pic-avenir.mjs --contre   (les contre-epreuves)
//
// POURQUOI IL EXISTE.
// Signale par Nico le 06/09/2026, capture a l'appui : « Effectif au pic
// 34,4 / 38,6 pers. — manque 4,1 pers. au pic · l'exercice », en orange, sur
// l'onglet AUJOURD'HUI, quatre jours apres le depart de l'equipe de vendange.
// Deux fautes, aucune arithmetique :
//   ① le pic affiche etait celui de la FENETRE — une semaine deja faite — sur
//     l'ecran qui propose d'embaucher ;
//   ② le chiffre en face du besoin etait `head`, un comptage de tetes proratise
//     sur les jours de CALENDRIER. Une equipe sous contrat du samedi au mercredi
//     y pese 5/7 alors que la semaine ne donne du travail que du lundi au
//     vendredi, dont elle ne couvre que trois. 34,4 n'a existe aucun jour.
//
// Methode C20 : on extrait les VRAIES fonctions du fichier livre, on leur donne
// des stubs minimaux, et on les EXECUTE. Aucune reecriture du code teste.
//
// ⚠️ Les contre-epreuves sont FONCTIONNELLES, pas textuelles : chercher un motif
//    de texte se laisse satisfaire par la meme phrase ecrite ailleurs (§42f).
// ⚠️ Une mutation qui casse la syntaxe ne prouve RIEN : chaque mutant passe par
//    `node --check` avant qu'on regarde sa couleur.
// ⚠️ Une sabotage dont l'ancre a disparu doit ECHOUER FORT, jamais passer en
//    silence : `mute()` leve si son ancre n'est pas trouvee exactement une fois.
// ⚠️ Un harnais qui plante compte pour ROUGE.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE   = path.join(RACINE, 'src', 'pilotage.js');
const SRC    = fs.readFileSync(FILE, 'utf8');
const CONTRE = process.argv.includes('--contre');

let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

// ── Extraction par balance d'accolades ───────────────────────────────────────
function bloc(s, motif, nom) {
  const m = motif.exec(s);
  if (!m) throw new Error('absent du fichier : ' + nom);
  const start = m.index + (s[m.index] === '\n' ? 1 : 0);
  let d = 0, j = s.indexOf('{', m.index + m[0].length - 1);
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  if (d !== 0) throw new Error('accolades non fermees : ' + nom);
  return s.slice(start, j + 1);
}
const fn = (n) => bloc(SRC, new RegExp('(?:^|\\n)function\\s+' + n + '\\s*\\(', 'm'), n);

const EXTRAIT = [
  fn('_pilAnnOrd'),
  fn('_pilOrdD'),
  fn('_pilDispoSem'),
  fn('_pilPicPortee'),
  fn('_pilSemLabO'),
].join('\n\n');

// ── Le module jouable : stubs minimaux + code reel ───────────────────────────
// `window` est un objet local : les fonctions extraites lisent la meme liaison
// de module. AUCUNE des fonctions testees n'est reecrite ici.
function moduleSrc(corps, aujIso, ann) {
  return `
const window = { _mvAujIso: () => ${JSON.stringify(aujIso)} };
const _PIL_SCOPE = { camp: null };
const _ANN = ${JSON.stringify(ann)};
function _pilAnnuelData(){ return _ANN; }
function _pilScopeVerif(){ /* no-op */ }
function _pilAnnPer(){ return null; }   // portee = l'exercice

${corps}

export { _pilPicPortee, _pilDispoSem, _pilSemLabO, _pilAnnOrd };
`;
}
async function charger(corps, aujIso, ann) {
  const s = moduleSrc(corps, aujIso, ann);
  // node --check AVANT d'importer : un mutant qui ne compile pas ne prouve rien.
  const tmp = path.join(os.tmpdir(), 'mv-pic-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(tmp, s, 'utf8');
  try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
  catch (e) { fs.unlinkSync(tmp); throw new Error('mutant non compilable'); }
  fs.unlinkSync(tmp);
  return import('data:text/javascript;base64,' + Buffer.from(s, 'utf8').toString('base64'));
}

// ── Le vignoble d'essai ──────────────────────────────────────────────────────
// Exercice 1er aout 2026 → 31 juillet 2027 (mois d'ouverture par defaut : aout).
// ⚠️ AUCUN nom de client, aucune donnee reelle : des chiffres choisis pour que
//    chaque assertion distingue head, headMax et capH/cap l'une de l'autre.
//      head   = 34,4  (40 saisonniers x 5/7 + le socle)
//      headMax= 45    (les corps du jour le plus fort)
//      capH/cap = 29  (1015 h travaillables / 35 h de capacite 1 ETP)
//    Les trois sont DIFFERENTS : une assertion ne peut pas passer par hasard.
const ORD = (iso) => Math.round((Date.parse(iso + 'T00:00:00') - Date.parse('2026-01-01T00:00:00')) / 86400000);
const sem = (iso, o) => Object.assign({ o0: ORD(iso), o1: ORD(iso) + 6, m: 0, per: 0 }, o);

const VENDANGE = sem('2026-08-29', { cap: 35, need: 38.6, head: 34.4, headMax: 45, capH: 1015 });
const HIVER    = sem('2026-11-02', { cap: 35, need: 4.2,  head: 5,    headMax: 5,  capH: 175  });
const PRINTEMPS= sem('2027-05-03', { cap: 35, need: 8.4,  head: 5,    headMax: 5,  capH: 175  });
const ANN = { s: ORD('2026-08-01'), e: ORD('2027-07-31'), weeks: [VENDANGE, HIVER, PRINTEMPS] };
const AUJ = '2026-09-06';                      // quatre jours apres la fin du contrat

// Second cadre : le pic tombe sur la semaine QUI CONTIENT aujourd'hui. Il
// distingue `o1 < oAuj` de `o0 < oAuj` — un ecart d'un cote ou de l'autre
// declare passee une semaine en cours, ou la retire du pic a venir.
const EN_COURS = sem('2026-09-05', { cap: 35, need: 12.0, head: 6, headMax: 6, capH: 210 });
const ANN2 = { s: ORD('2026-08-01'), e: ORD('2027-07-31'), weeks: [HIVER, EN_COURS, PRINTEMPS] };

// Troisieme cadre : TOUT est derriere. `av` doit valoir null, pas un objet a zero.
const ANN3 = { s: ORD('2026-08-01'), e: ORD('2027-07-31'), weeks: [VENDANGE] };

// Quatrieme cadre : capH absent (planning.js n'a pas su mesurer la semaine).
// Le repli sur `head` doit exister — sinon le pic tombe a zero en silence.
const SANS_CAPH = sem('2027-05-03', { cap: 35, need: 8.4, head: 5, headMax: 9, capH: null });
const ANN4 = { s: ORD('2026-08-01'), e: ORD('2027-07-31'), weeks: [SANS_CAPH] };

const pr2 = (v) => Math.round((v || 0) * 100) / 100;

// ── Le lot ───────────────────────────────────────────────────────────────────
async function lot(corps) {
  const r = { ok: 0, ko: 0 };
  const mark = () => { r.ok = ok; r.ko = ko; };

  const M  = await charger(corps, AUJ, ANN);
  const PP = M._pilPicPortee();

  t('le pic de la FENETRE reste la vendange (« L\'annee » ne perd rien)',
    PP.picW && PP.picW.o0 === VENDANGE.o0 && pr2(PP.pic) === 38.6,
    'pic=' + pr2(PP.pic));

  t('cette semaine est declaree PASSEE', PP.passe === true);

  t('le pic A VENIR n\'est pas la vendange',
    !!PP.av && PP.av.picW && PP.av.picW.o0 !== VENDANGE.o0);

  t('le pic A VENIR est la semaine de printemps',
    !!PP.av && PP.av.picW && PP.av.picW.o0 === PRINTEMPS.o0 && pr2(PP.av.pic) === 8.4,
    PP.av ? 'pic=' + pr2(PP.av.pic) : 'av = null');

  t('aucune semaine du pic a venir ne se termine avant aujourd\'hui',
    !!PP.av && PP.av.picW.o1 >= M._pilAnnOrd(AUJ));

  // ★ Le coeur du lot : ni head, ni headMax.
  t('le disponible se lit sur capH/cap (29), pas sur head (34,4)',
    pr2(PP.dispo) === 29, 'dispo=' + pr2(PP.dispo));
  t('… et pas non plus sur headMax (45)', pr2(PP.dispo) !== 45);
  t('le manque du pic se calcule sur ce disponible',
    pr2(PP.manque) === pr2(38.6 - 29), 'manque=' + pr2(PP.manque));

  // ★ Le faux negatif que headMax aurait ferme en silence.
  t('un pic couvert par headMax mais PAS par les heures reste signale',
    PP.manque > 0.05 && VENDANGE.headMax > VENDANGE.need,
    'headMax=' + VENDANGE.headMax + ' > need=' + VENDANGE.need + ' et pourtant manque=' + pr2(PP.manque));

  t('les corps du jour le plus fort restent lisibles, sous leur propre nom',
    PP.corps === 45, 'corps=' + PP.corps);

  t('head reste disponible pour qui en a besoin (rien n\'est supprime)',
    pr2(PP.head) === 34.4);

  // ── La semaine EN COURS ──
  const M2  = await charger(corps, AUJ, ANN2);
  const PP2 = M2._pilPicPortee();
  t('une semaine qui CONTIENT aujourd\'hui n\'est pas « passee »', PP2.passe === false);
  t('… et elle reste dans le pic a venir',
    !!PP2.av && PP2.av.picW && PP2.av.picW.o0 === EN_COURS.o0);

  // ── L'exercice entierement derriere ──
  const M3  = await charger(corps, AUJ, ANN3);
  const PP3 = M3._pilPicPortee();
  t('exercice entierement derriere : av vaut null, pas un objet a zero',
    PP3.av === null && PP3.ok === true && PP3.passe === true,
    'av=' + JSON.stringify(PP3.av));

  // ── Le repli quand planning.js n'a pas su mesurer ──
  const M4  = await charger(corps, AUJ, ANN4);
  const PP4 = M4._pilPicPortee();
  t('capH absent : repli sur head, jamais un zero silencieux',
    pr2(PP4.dispo) === 5, 'dispo=' + pr2(PP4.dispo));

  // ── L'etiquette ──
  t('la semaine du pic porte son ANNEE',
    /2026$/.test(M._pilSemLabO(VENDANGE.o0)), M._pilSemLabO(VENDANGE.o0));
  t('… et c\'est la bonne (pas de decalage d\'un jour)',
    M._pilSemLabO(VENDANGE.o0) === 'semaine du 29 août 2026', M._pilSemLabO(VENDANGE.o0));
  t('deux aouts d\'exercices differents ne s\'ecrivent plus pareil',
    M._pilSemLabO(VENDANGE.o0) !== M._pilSemLabO(VENDANGE.o0 + 364));

  mark();
  return r;
}

// ── Les contre-epreuves ──────────────────────────────────────────────────────
// Une par une. Chacune repose UNE faute reelle et doit faire rougir le lot.
function mute(s, avant, apres, nom) {
  const n = s.split(avant).length - 1;
  if (n !== 1) throw new Error('ancre introuvable ou multiple (' + n + ') : ' + nom);
  return s.replace(avant, apres);
}
const SABOTAGES = [
  ['le disponible retombe sur head (le defaut d\'origine)',
   (s) => mute(s, 'return (x.capH!=null && x.cap>0) ? (x.capH/x.cap) : (x.head||0);',
                   'return (x.head||0);', 'dispo→head')],
  ['le disponible passe a headMax (le faux negatif)',
   (s) => mute(s, 'return (x.capH!=null && x.cap>0) ? (x.capH/x.cap) : (x.head||0);',
                   'return (x.headMax!=null)?x.headMax:(x.head||0);', 'dispo→headMax')],
  ['le pic a venir cesse de filtrer les semaines finies',
   (s) => mute(s, 'var av=(oAuj==null)?null:_bal(wk.filter(function(x){ return x.o1>=oAuj; }));',
                   'var av=(oAuj==null)?null:_bal(wk);', 'filtre av')],
  ['le filtre glisse de o1 a o0 (la semaine en cours saute)',
   (s) => mute(s, 'return x.o1>=oAuj; }));', 'return x.o0>=oAuj; }));', 'o1→o0 filtre')],
  ['« passe » se juge sur le debut de semaine, pas sur sa fin',
   (s) => mute(s, 'T.picW && T.picW.o1<oAuj', 'T.picW && T.picW.o0<oAuj', 'passe o1→o0')],
  ['un pic a venir vide n\'est plus ramene a null',
   (s) => mute(s, 'if(av && !av.ok) av=null;', '', 'av vide')],
  ['le manque revient se calculer sur head',
   (s) => mute(s, 'dispo:dispo, manque:Math.max(0,pic-dispo),',
                   'dispo:dispo, manque:Math.max(0,pic-(picW?(picW.head||0):0)),', 'manque→head')],
  ['l\'annee quitte l\'etiquette de semaine',
   (s) => mute(s, "+MOA[dd.getUTCMonth()]+' '+dd.getUTCFullYear();", '+MOA[dd.getUTCMonth()];', 'annee')],
  ['le repli de capH disparait (zero silencieux)',
   (s) => mute(s, 'return (x.capH!=null && x.cap>0) ? (x.capH/x.cap) : (x.head||0);',
                   'return (x.cap>0) ? ((x.capH||0)/x.cap) : 0;', 'repli capH')],
];

// ── Exécution ────────────────────────────────────────────────────────────────
console.log('\n── LE PIC A VENIR — pilotage.js\n');
try {
  const r = await lot(EXTRAIT);
  if (r.ko) { console.log('\n\x1b[31m  ' + r.ko + ' ROUGE(S) sur ' + (r.ok + r.ko) + '\x1b[0m\n'); process.exit(1); }
  console.log('\n\x1b[32m  ✓ ' + r.ok + ' assertions vertes\x1b[0m\n');
} catch (e) {
  console.log('\x1b[31m  ✗ le harnais a plante : ' + e.message + '\x1b[0m\n');
  process.exit(1);
}

if (CONTRE) {
  console.log('── CONTRE-EPREUVES — chaque faute doit faire rougir le lot\n');
  let survivants = 0;
  for (const [nom, saboter] of SABOTAGES) {
    let mutant;
    try { mutant = saboter(EXTRAIT); }
    catch (e) {
      // Une sabotage dont l'ancre a disparu ne passe PAS en silence : le code a
      // change sous le harnais, et c'est exactement ce qu'il faut apprendre.
      console.log('  \x1b[31m✗\x1b[0m ' + nom + '\n      → ' + e.message);
      survivants++; continue;
    }
    ok = 0; ko = 0;
    const log = console.log; console.log = () => {};
    let rouge = false;
    try { const r = await lot(mutant); rouge = r.ko > 0; }
    catch (e) { rouge = true; }          // un mutant qui plante compte pour rouge
    console.log = log;
    if (rouge) console.log('  \x1b[32m✓\x1b[0m ' + nom + '\x1b[2m  → rouge, comme attendu\x1b[0m');
    else { console.log('  \x1b[31m✗\x1b[0m ' + nom + '\n      → SURVIT : le lot reste vert sur cette faute'); survivants++; }
  }
  if (survivants) { console.log('\n\x1b[31m  ' + survivants + ' faute(s) non detectee(s)\x1b[0m\n'); process.exit(1); }
  console.log('\n\x1b[32m  ✓ ' + SABOTAGES.length + ' fautes, ' + SABOTAGES.length + ' rouges\x1b[0m\n');
}
