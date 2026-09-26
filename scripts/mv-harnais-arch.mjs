#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — ARCH-1 : L'ARCHIVE DE CAMPAGNE EST UNE PHOTO DE LA CAMPAGNE (§178)
   Lancer : node scripts/mv-harnais-arch.mjs
            node scripts/mv-harnais-arch.mjs --contre

   ══ POURQUOI ══
   Mesure du 26/09 (npm run taille, §177) : les deux archives de Marchand-Grillot
   portaient les MEMES 319 entrees — chaque cloture recopiait tout le journal
   depuis le premier jour. Et _clotExec enregistrait l'archive SANS attendre, puis
   activait la nouvelle campagne : un refus (document trop gros, hors ligne,
   protection) perdait l'archive en silence.

   ══ CE QU'IL TIENT (vraies fonctions de reglages.js, EXECUTEES) ══
     A. _arcDeLaCampagne : le journal et les sessions d'UNE campagne (regle
        _saisonForDate), sans la meteo ; campagne sans dates = on garde tout.
     B. _arcAlleger : les archives d'avant sont reduites a leur campagne, stats
        recalculees, marquees arcV:2, idempotent ; campagne sans dates intacte.
     C. _arcTaille : la regle de taille Firestore (exemple publie : 71 octets).
     D. _arcEnregistrer : vrai SEULEMENT si Firestore a accepte ; hors ligne,
        trop gros, protection, file d'attente, exception = faux.
     E. _clotExec : pas d'archive enregistree = PAS de nouvelle campagne, et
        HISTORIQUE revient a l'etat d'avant ; succes = la campagne s'active et
        l'archive ne porte que sa campagne ; double appui = une seule cloture.

   ⚠️ Contre-epreuves en memoire, garde d'injection (ancre absente = ERREUR).
   ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const BASE = { regl: fs.readFileSync(path.join(RACINE, 'src/reglages.js'), 'utf8'),
               utils: fs.readFileSync(path.join(RACINE, 'src/utils.js'), 'utf8'),
               pil: fs.readFileSync(path.join(RACINE, 'src/pilotage.js'), 'utf8') };
const c = { g:s=>`\x1b[32m${s}\x1b[0m`, r:s=>`\x1b[31m${s}\x1b[0m`, dim:s=>`\x1b[2m${s}\x1b[0m`, b:s=>`\x1b[1m${s}\x1b[0m` };

function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}
const SAISONS = [
  { nom: 'Hiver 2025-2026', debut: '2025-11-01', fin: '2026-03-15' },
  { nom: 'Printemps 2026',  debut: '2026-03-16', fin: '2026-07-31' },
  { nom: 'Sans dates' },
];
const JOURNAL = [
  { id: 'h1', date: '2025-12-02', parcelle: 'A', tache: 'Taille' },
  { id: 'h2', date: '2026-02-10', parcelle: 'B', tache: 'Taille' },
  { id: 'p1', date: '2026-04-20', parcelle: 'A', tache: 'Ebourgeonnage' },
  { id: 'p2', date: '2026-06-01', parcelle: 'C', tache: 'Relevage' },
  { id: 'm1', date: '2026-04-21', parcelle: 'Domaine', tache: 'Météo', meteo: true },
  { id: 'x1', date: '2024-05-01', parcelle: 'A', tache: 'Taille' },     // hors de toute campagne
];
const SESSIONS = [
  { id: 's1', date: '2026-01-15', saison: 'Hiver 2025-2026' },
  { id: 's2', date: '2026-05-05', saison: 'Printemps 2026' },
  { id: 's3', saison: 'Printemps 2026' },                              // sans date : son champ saison
];

function monter(S, opts = {}) {
  const noms = ['function _arcDatee(', 'function _arcDeLaCampagne(', 'function _arcSnapshot(', 'function _arcAlleger(',
                'function _arcTaille(', 'async function _arcEnregistrer(', 'function _calcHistoStats('];
  const parts = noms.map(n => bloc(S.regl, n));
  const sfd = bloc(S.utils, 'function _saisonForDate(');
  const clot = bloc(S.regl, 'async function _clotExec(');
  if (parts.some(x => !x) || !sfd || !clot) throw new Error('extraction impossible (ancre absente)');
  const W = {
    SAISONS: JSON.parse(JSON.stringify(SAISONS)), JOURNAL: JSON.parse(JSON.stringify(JOURNAL)),
    SESSIONS: JSON.parse(JSON.stringify(SESSIONS)), PARCELLES: [{ nom: 'A', statut: 'Actif', taches: {} }],
    TRAVAUX: {}, HISTORIQUE: [], toasts: [], activees: [], fbAppels: 0,
    getTachesSaison: () => [{ nom: 'Taille' }],
    showToast: (m) => W.toasts.push(m), logError: () => {},
    fbSave: async () => { W.fbAppels++; return opts.fb ? opts.fb() : { ok: true }; },
  };
  const DOC = { 'clot-name': { value: 'Été 2026' }, 'clot-deb': { value: '2026-08-01' }, 'clot-fin': { value: '2026-10-31' } };
  const code = 'var window=W; var navigator={onLine:' + (opts.horsLigne ? 'false' : 'true') + '};'
    + 'var document={getElementById:function(id){return DOC[id]||null;}};'
    + 'function showToast(m){W.toasts.push(m);} function deepClone(x){return JSON.parse(JSON.stringify(x));}'
    + 'var Blob=function(a){this.size=Buffer.byteLength(String(a[0]),"utf8");};'
    + 'var _CLOT={mode:"create"}; var _ARC_PLAFOND=' + (opts.plafond || 1000000) + ';'
    + 'function _nsPeriode(){return "";} function activateSaison(n){W.activees.push(n);} function _clotClose(){}'
    + 'function renderHistorique(){}\n'
    + sfd + '\nW._saisonForDate=_saisonForDate;\n' + parts.join('\n') + '\nvar _CLOT_EN_COURS=false;\n' + clot
    + '\nreturn {W:W, deCamp:_arcDeLaCampagne, alleger:_arcAlleger, taille:_arcTaille, enreg:_arcEnregistrer, snap:_arcSnapshot, clot:_clotExec};';
  return new Function('W', 'DOC', 'Buffer', code)(W, DOC, Buffer);
}
const ids = L => L.map(x => x.id).join(',');

// ── ARCH-2 (§179) : le bilan par année, sur les vraies fonctions de pilotage.js ──
function monterAn(S, opts = {}) {
  const u = ['function _mvAujIso(', 'function _mvExerciceMois(', 'function _mvExIso(', 'function _mvExerciceAn(', 'function _mvExercice(',
             'function _mvCampagneMois(', 'function _mvCampagneDe(', 'function _mvCampagneBornes(', 'function _saisonForDate('].map(n => bloc(S.utils, n));
  const lbl = (S.utils.match(/var MV_EX_MOIS_LBL = \[[^\]]*\];/) || [])[0];
  const p = ['function _pilEsc(', 'function _pilHa(', 'function _arcN(', 'function _arcCampMois(', 'function _arcCampagneDe(', 'function _arcBornes(',
             'function _arcCadre(', 'function _arcAnDe(', 'function _arcAnBornes(', 'function _arcAnnees(', 'function _arcBlocAnnuel(', 'function _arcSetCadre('].map(n => bloc(S.pil, n));
  if (u.concat(p).some(x => !x) || !lbl) throw new Error('extraction impossible (ARCH-2)');
  const W = { CONFIG: { eco: Object.assign({}, opts.eco || {}) }, SAISONS: JSON.parse(JSON.stringify(SAISONS)), HISTORIQUE: opts.H || [],
              toasts: [], rendus: 0, admin: !!opts.admin, showToast: m => W.toasts.push(m), logError: () => {} };
  W.isAdmin = () => W.admin;
  W._ecoCfgSet = (g, k, v) => { if (g === 'eco' && k === 'archive_cadre' && (v === 'vigne' || v === 'exercice')) W.CONFIG.eco[k] = v; };
  const defs = ['MV_EX_MOIS_DEF', 'MV_CAMP_MOIS_DEF'].map(n => (S.utils.match(new RegExp('var ' + n + ' = [^;]*;')) || [])[0]);
  if (defs.some(x => !x)) throw new Error('constantes d\u2019axe introuvables');
  const code = 'var window=W; ' + defs.join(' ') + ' ' + lbl + '\n' + u.join('\n')
    + '\nW._mvExercice=_mvExercice; W._mvExerciceAn=_mvExerciceAn; W._mvCampagneDe=_mvCampagneDe; W._mvCampagneMois=_mvCampagneMois; W._mvCampagneBornes=_mvCampagneBornes; W._saisonForDate=_saisonForDate;\n'
    + 'function _mvToday(){ return "' + (opts.auj || '2026-09-26') + '"; } function _pilFillContent(){ W.rendus++; } function _pilData(){ return {}; }\n'
    + p.join('\n') + '\nreturn { W:W, annees:_arcAnnees, bloc:_arcBlocAnnuel, setCadre:_arcSetCadre, cadre:_arcCadre };';
  return new Function('W', code)(W);
}
// Deux archives AU FORMAT D'AVANT (chacune porte TOUT le journal), comme chez MG le 26/09.
const archivesAvant = () => [
  { saisonNom: 'Printemps 2026', journal: JSON.parse(JSON.stringify(JOURNAL)), sessions: JSON.parse(JSON.stringify(SESSIONS)),
    stats: { hFaites: 300, tachesStats: [{ nom: 'Ebourgeonnage', h_done: 200 }, { nom: 'Relevage', h_done: 100 }] } },
  { saisonNom: 'Hiver 2025-2026', journal: JSON.parse(JSON.stringify(JOURNAL)), sessions: JSON.parse(JSON.stringify(SESSIONS)),
    stats: { hFaites: 100, tachesStats: [{ nom: 'Taille', h_done: 100 }] } },
];

async function jouer(S, silencieux) {
  let ok = 0, ko = 0; const rouges = [];
  const t = (lib, cond) => { if (cond) ok++; else { ko++; rouges.push(lib); } if (!silencieux) console.log('  ' + (cond ? c.g('✓') : c.r('✗')) + ' ' + lib); };
  const titre = s => { if (!silencieux) console.log('\n' + c.b(s)); };
  try {
    titre('A. Le journal d\u2019UNE campagne');
    let E = monter(S);
    t('Printemps : ses entrées datées, sans météo ni hiver', ids(E.deCamp('Printemps 2026', E.W.JOURNAL, 'date')) === 'p1,p2');
    t('Hiver : ses entrées seulement', ids(E.deCamp('Hiver 2025-2026', E.W.JOURNAL, 'date')) === 'h1,h2');
    t('Campagne sans dates : on garde tout (sauf la météo)', ids(E.deCamp('Sans dates', E.W.JOURNAL, 'date')) === 'h1,h2,p1,p2,x1');
    t('Sessions : par la date, et par le champ saison quand la date manque', ids(E.deCamp('Printemps 2026', E.W.SESSIONS, 'date')) === 's2,s3');

    titre('B. Les archives d\u2019avant sont allégées');
    E = monter(S);
    const H = [
      { saisonNom: 'Printemps 2026', journal: JSON.parse(JSON.stringify(JOURNAL)), sessions: JSON.parse(JSON.stringify(SESSIONS)), parcelles: [], taches: [{ nom: 'Taille' }], travaux: {}, stats: { nbEntries: 5 } },
      { saisonNom: 'Hiver 2025-2026', journal: JSON.parse(JSON.stringify(JOURNAL)), sessions: [], parcelles: [], taches: [], travaux: {} },
      { saisonNom: 'Campagne disparue', journal: JSON.parse(JSON.stringify(JOURNAL)), sessions: [] },
    ];
    E.alleger(H);
    t('Printemps 2026 : ne garde que p1, p2', ids(H[0].journal) === 'p1,p2' && ids(H[0].sessions) === 's2,s3');
    t('… et ses statistiques sont recalculées (2 entrées)', H[0].stats && H[0].stats.nbEntries === 2);
    t('Hiver 2025-2026 : ne garde que h1, h2', ids(H[1].journal) === 'h1,h2');
    t('Archive d\u2019une campagne absente de SAISONS : intacte', H[2].journal.length === JOURNAL.length && H[2].arcV === undefined);
    t('Marquées arcV:2, et une 2e passe ne change rien', H[0].arcV === 2 && (E.alleger(H), ids(H[0].journal) === 'p1,p2'));

    titre('C. La taille Firestore');
    t('Exemple publié : 71 octets de champs', E.taille({ type: 'Personal', done: false, priority: 1, description: 'Learn Cloud Firestore' }) === 71);

    titre('D. Enregistrer = attendre la réponse');
    t('Accepté par Firestore → vrai', await monter(S).enreg([{}]) === true);
    E = monter(S, { horsLigne: true });
    t('Hors ligne → faux, et rien n\u2019est envoyé', await E.enreg([{}]) === false && E.W.fbAppels === 0);
    E = monter(S, { plafond: 10 });
    t('Trop gros → faux, et rien n\u2019est envoyé', await E.enreg([{ journal: ['x'.repeat(50)] }]) === false && E.W.fbAppels === 0);
    t('Protection anti-perte → faux', await monter(S, { fb: () => ({ ok: false, blocked: true }) }).enreg([{}]) === false);
    t('Mis en file d\u2019attente → faux (pas encore sur le serveur)', await monter(S, { fb: () => ({ ok: false, queued: true }) }).enreg([{}]) === false);
    t('Exception → faux', await monter(S, { fb: () => { throw new Error('boum'); } }).enreg([{}]) === false);

    titre('E. La clôture');
    E = monter(S, { fb: () => ({ ok: false, blocked: true }) });
    E.W.HISTORIQUE = [{ saisonNom: 'Hiver 2025-2026', journal: [], arcV: 2 }];
    E.W.getSaisonActive = () => E.W.SAISONS[1];
    await E.clot();
    t('Archive refusée → la nouvelle campagne n\u2019est PAS activée', E.W.activees.length === 0);
    t('… et les archives reviennent à l\u2019état d\u2019avant', E.W.HISTORIQUE.length === 1 && E.W.HISTORIQUE[0].saisonNom === 'Hiver 2025-2026');
    E = monter(S);
    E.W.HISTORIQUE = [];
    E.W.getSaisonActive = () => E.W.SAISONS[1];
    await E.clot();
    t('Archive acceptée → « Été 2026 » est activée', E.W.activees.join() === 'Été 2026');
    t('… et l\u2019archive ne porte que Printemps 2026', E.W.HISTORIQUE[0] && E.W.HISTORIQUE[0].saisonNom === 'Printemps 2026' && ids(E.W.HISTORIQUE[0].journal) === 'p1,p2');
    E = monter(S, { fb: () => new Promise(r => setTimeout(() => r({ ok: true }), 20)) });
    E.W.getSaisonActive = () => E.W.SAISONS[1];
    await Promise.all([E.clot(), E.clot()]);
    t('Double appui → une seule clôture', E.W.activees.length === 1 && E.W.fbAppels === 1);

    titre('F. Le bilan par année (ARCH-2)');
    let A = monterAn(S, { H: archivesAvant() });
    let L = A.annees('vigne');
    const y25 = L.find(x => x.an === 2025), y26 = L.find(x => x.an === 2026);
    t('Année vigne : l\u2019hiver et le printemps tombent dans 2025–2026', y25 && y25.campagnes.slice().sort().join('|') === 'Hiver 2025-2026|Printemps 2026');
    t('Aucune intervention comptée deux fois (2 archives au format d\u2019avant) : 4', y25 && y25.inter === 4);
    t('Heures = somme des deux campagnes, rien de réparti', y25 && Math.round(y25.h) === 400 && y25.hRep === 0);
    t('Parcelles touchées sans le pseudo-lieu « Domaine » : A, B, C', y25 && y25.nParc === 3);
    t('Sessions dédoublonnées : 3', y25 && y25.sess === 3);
    t('L\u2019année en cours a sa carte, vide', y26 && y26.enCours && y26.campagnes.length === 0);
    const dup = [{ id: 'q1', date: '2024-05-02', parcelle: 'A' }, { id: 'q2', date: '2024-05-03', parcelle: 'B' }];
    A = monterAn(S, { H: [{ saisonNom: 'Ancienne A', journal: JSON.parse(JSON.stringify(dup)) }, { saisonNom: 'Ancienne B', journal: JSON.parse(JSON.stringify(dup)) }] });
    const y23 = A.annees('vigne').find(x => x.an === 2023);
    t('Campagnes absentes de SAISONS portant le même journal : dédoublonnées par id (2, pas 4)', y23 && y23.inter === 2);
    A = monterAn(S, { H: archivesAvant(), eco: { exercice_mois: 0, archive_cadre: 'exercice' } });
    L = A.annees('exercice');
    const e25 = L.find(x => x.an === 2025), e26 = L.find(x => x.an === 2026);
    t('Exercice janvier → décembre : l\u2019hiver est à cheval sur 2025 et 2026', e25 && e26 && e25.campagnes.includes('Hiver 2025-2026') && e26.campagnes.includes('Hiver 2025-2026'));
    t('… ses 100 h réparties au prorata de ses interventions (1 en déc., 1 en fév.)', e25 && Math.round(e25.h) === 50 && Math.round(e25.hRep) === 50);
    t('… 2026 reçoit l\u2019autre moitié plus tout le printemps (350 h)', e26 && Math.round(e26.h) === 350 && Math.round(e26.hRep) === 50);
    t('La carte le dit : « dont 50 h réparties »', /dont 50 h r\u00e9parties/.test(A.bloc()) || /dont 50 h r\\u00e9parties/.test(A.bloc()) );
    A = monterAn(S, { H: [{ saisonNom: 'Printemps 2026', journal: [{ id: 'z', date: '2026-04-02', parcelle: 'Clos d\u2019<b>Été</b>' }], stats: { hFaites: 10 } }] });
    A.W.SAISONS[1].nom = 'Printemps 2026';
    t('Le bloc échappe les noms (pas de balise injectée)', !/<b>Été<\/b>/.test(A.bloc()));
    A = monterAn(S, { admin: false });
    A.setCadre('exercice');
    t('Non-admin : le cadre ne change pas', A.cadre() === 'vigne' && A.W.rendus === 0);
    A = monterAn(S, { admin: true });
    A.setCadre('exercice');
    t('Admin : le cadre passe à l\u2019exercice et l\u2019écran se redessine', A.cadre() === 'exercice' && A.W.rendus === 1);
    t('Valeur inconnue refusée', (A.setCadre('civil'), A.cadre() === 'exercice'));
    t('Non-admin : pas de bouton, le cadre est seulement affiché', !/_arcSetCadre/.test(monterAn(S, { admin: false }).bloc()) && /_arcSetCadre/.test(monterAn(S, { admin: true }).bloc()));
  } catch (e) { ko++; rouges.push('PLANTE : ' + e.message); if (!silencieux) console.log('  ' + c.r('✗ PLANTE : ' + e.message)); }
  return { ok, ko, rouges };
}

if (!CONTRE) {
  console.log(c.b('MA VIGNE — Harnais ARCH-1'));
  const r = await jouer(BASE, false);
  console.log('\n  ' + r.ok + ' verts · ' + (r.ko ? c.r(r.ko + ' rouge(s)') : '0 rouge') + '\n');
  process.exit(r.ko ? 1 : 0);
}
function muter(S, f, ancre, rempl) {
  if (!S[f].includes(ancre)) throw new Error('ancre introuvable : ' + ancre.slice(0, 60));
  return Object.assign({}, S, { [f]: S[f].replace(ancre, rempl) });
}
const MUT = [
  ['l\u2019archive recopie de nouveau tout le journal', S => muter(S, 'regl', "  if(!_arcDatee(nom) || typeof window._saisonForDate!=='function') return L;", "  return L;")],
  ['les archives d\u2019avant ne sont plus allégées', S => muter(S, 'regl', "    if(!h || h.arcV===2 || !_arcDatee(h.saisonNom)) return;", "    return;")],
  ['_arcEnregistrer croit un enregistrement mis en file', S => muter(S, 'regl', "  if(!r || r.ok!==true){", "  if(!r){")],
  ['_arcEnregistrer envoie hors ligne', S => muter(S, 'regl', "  if(navigator.onLine===false){", "  if(false){")],
  ['la clôture active la campagne malgré le refus', S => muter(S, 'regl', "    if(!ok){ window.HISTORIQUE=avant; _CLOT_EN_COURS=false; return; }", "    if(!ok){ window.HISTORIQUE=avant; _CLOT_EN_COURS=false; }")],
  ['le double appui n\u2019est plus gardé', S => muter(S, 'regl', "  if(_CLOT_EN_COURS) return;", "")],
  ['ARCH-2 : les archives d\u2019avant sont comptées deux fois (plus de dédoublonnage)', S => muter(S, 'pil', "      if(j.id){ if(vus['j'+j.id]) return false; vus['j'+j.id]=1; }\n", "")],
  ['ARCH-2 : la campagne à cheval n\u2019est plus répartie (tout à sa 1re année)', S => muter(S, 'pil', "    if(a0===a1) parts[a0]=1;", "    if(true) parts[a0]=1;")],
  ['ARCH-2 : le cadre exercice est ignoré', S => muter(S, 'pil', "  if(cadre==='exercice' && typeof window._mvExercice==='function'){", "  if(false){")],
  ['ARCH-2 : un non-admin peut changer le cadre', S => muter(S, 'pil', "function _arcSetCadre(v){\n  if(!(typeof window.isAdmin==='function' && window.isAdmin())){", "function _arcSetCadre(v){\n  if(false){")],
];
console.log(c.b('MA VIGNE — Harnais ARCH-1 · contre-epreuves'));
let bad = 0;
for (const [lib, f] of MUT) {
  let S; try { S = f(BASE); } catch (e) { bad++; console.log('  ' + c.r('✗ ERREUR D\u2019INJECTION — ' + lib + ' : ' + e.message)); continue; }
  const r = await jouer(S, true);
  if (r.ko) console.log('  ' + c.g('✓') + ' rougit : ' + lib + c.dim('  (' + r.rouges[0].slice(0, 60) + ')'));
  else { bad++; console.log('  ' + c.r('✗ RESTE VERT : ' + lib)); }
}
console.log('\n  ' + (MUT.length - bad) + '/' + MUT.length + ' contre-epreuves rougissent\n');
process.exit(bad ? 1 : 0);
