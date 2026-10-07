// HARNAIS — IDS-1, activités (§258) : RENOMMER UNE ACTIVITÉ (fiche de l'activité, roue crantée du Tracteur, administrateur).
//   node scripts/mv-harnais-renom-act.mjs           → doit être vert
//   node scripts/mv-harnais-renom-act.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de reglages.js (_renameActivite, _renActiviteErreur, saveRenActivite, openRenActivite,
// _mvAppliquerRenommages) ; relit tracteur.js pour prouver que les TRACTEURS se renomment déjà sans risque (tout les désigne
// par leur identifiant, rien ne garde leur nom).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE0 = { reg: lire('src/reglages.js'), fb: lire('src/firebase.js'), html: lire('index.html'), trac: lire('src/tracteur.js'), phyto: lire('src/phyto.js') };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
const FNS = ['_renRang', '_renFusion', '_renameTache', '_rpNorm', '_renameParcelle', '_rpTravaux', '_rpEnregistrerRegistres', '_rmNorm', '_renameMembre', '_rmEnregistrer',
  '_mvAppliquerRenommages', '_raNorm', '_renameActivite', '_renActiviteErreur', 'openRenActivite', 'saveRenActivite'];
function monter(B, o) {
  o = o || {};
  const E = { saves: [], ov: [] }, el = {};
  const ctx = {
    ACTIVITES: o.activites || [{ nom: 'Rognage', tracteurDefautId: 't2' }, { nom: 'Griffage', tracteurDefautId: 't1' }, { nom: 'Traitement', tracteurDefautId: 't3' }],
    SESSIONS: [{ id: 's1', activite: 'Rognage', tracteurId: 't2' }, { id: 's2', activite: 'Griffage' }, { id: 's3', activite: 'Traitement', type: 'traitement' }],
    JOURNAL: [{ id: 'j1', tache: 'Rognage', parcelle: 'Les Crais' }],   // une TÂCHE du même nom : jamais touchée
    PARCELLES: [], MEMBRES: [], TACHES: [], TRAVAUX: {},
    CONFIG: { renommages_activites: o.regles || [], renommages_taches: [], renommages_parcelles: [], renommages_membres: [] },
    document: { getElementById: id => el[id] || null }, console: { log() {}, warn() {} }, Date, JSON, Math, String, Object, Array,
    isAdmin: () => o.admin !== false, currentUser: { nom: 'Nico' }, saveData: k => E.saves.push(k), fbSave() {}, saveIntrants() {}, recalcTravaux() {},
    openOv: id => E.ov.push(id), closeOv() {}, _escHtml: s => String(s), _escAttr: s => String(s), _mvAvale() {}, renderTracteurSet() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(FNS.map(n => fonction(B.reg, n)).join('\n'), ctx);
  return { ctx, el, E };
}
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  let M = monter(B);
  M.el['eat-act-nom'] = { value: 'Rognage' }; M.el['eat-title'] = { textContent: 'Rognage' }; M.el['ract-nom'] = { value: '  Rognage intercep ' }; M.el['ract-err'] = { textContent: '' };
  M.ctx.saveRenActivite();
  const W = M.ctx, N = 'Rognage intercep';
  T('l’activité prend le nouveau nom (tracteur par défaut gardé)', W.ACTIVITES[0].nom === N && W.ACTIVITES[0].tracteurDefautId === 't2' && M.el['ract-err'].textContent === '');
  T('ses sessions suivent, pas celles des autres activités', W.SESSIONS[0].activite === N && W.SESSIONS[1].activite === 'Griffage' && W.SESSIONS[2].activite === 'Traitement');
  T('une TÂCHE du même nom dans le journal n’est pas touchée', W.JOURNAL[0].tache === 'Rognage');
  const r = W.CONFIG.renommages_activites[0];
  T('le renommage devient une règle du domaine, tout est enregistré, la fiche suit', r && r.de === 'Rognage' && r.vers === N && r.par === 'Nico' && ['activites', 'sessions', 'config'].every(k => M.E.saves.includes(k)) && M.el['eat-act-nom'].value === N && M.el['eat-title'].textContent === N);
  // ── Refus ──
  M = monter(B, { admin: false });
  M.el['eat-act-nom'] = { value: 'Rognage' }; M.el['ract-nom'] = { value: 'Autre' }; M.el['ract-err'] = { textContent: '' };
  M.ctx.saveRenActivite();
  T('un non-administrateur ne renomme rien', M.ctx.ACTIVITES[0].nom === 'Rognage' && /administrateur/.test(M.el['ract-err'].textContent) && !M.E.saves.length);
  M = monter(B, { regles: [{ de: 'Broyage', vers: 'Griffage', quand: '2026-01-01' }] });
  const A = M.ctx.ACTIVITES, err = (a, n) => M.ctx._renActiviteErreur(a, n);
  T('« Traitement » ne se renomme pas, et aucun nom ne le devient (le registre phyto l’attend)', /ne se renomme pas/.test(err(A[2], 'Phyto')) && /réservé/.test(err(A[0], 'traitement')));
  T('refusé : vide, le même, le nom d’une autre activité (sans casse), un ancien nom d’une autre', /vide/.test(err(A[0], '')) && /déjà son nom/.test(err(A[0], 'Rognage')) && /Une autre activité/.test(err(A[0], 'griffage')) && /déjà été porté/.test(err(A[0], 'broyage')));
  T('refusé : plus de 40 caractères, un caractère de contrôle ; accepté : un nom libre, ou la casse', /40/.test(err(A[0], 'x'.repeat(41))) && /non autorisé/.test(err(A[0], 'A\u0001B')) && err(A[0], 'Rognage bis') === '' && err(A[0], 'ROGNAGE') === '');
  // ── Un autre téléphone ──
  const regle = { de: 'Rognage', vers: 'Rognage intercep', quand: '2026-10-07T08:00:00Z' };
  M = monter(B, { regles: [regle], activites: [{ nom: 'Rognage intercep' }, { nom: 'Griffage' }, { nom: 'Traitement' }] });
  M.ctx.SESSIONS.push({ id: 's9', activite: 'Rognage' });          // saisie hors ligne sous l'ancien nom
  const n1 = M.ctx._mvAppliquerRenommages('sessions');
  T('un autre téléphone (liste des activités reçue) réécrit ses sessions, saisies hors ligne comprises', n1 === 2 && M.ctx.SESSIONS[0].activite === 'Rognage intercep' && M.ctx.SESSIONS[3].activite === 'Rognage intercep');
  T('… repasser ne change rien, et un appareil d’admin enregistre les sessions', M.ctx._mvAppliquerRenommages('sessions') === 0 && M.E.saves.includes('sessions'));
  M = monter(B, { regles: [regle] });                                 // la liste des activités n'est pas encore arrivée
  M.ctx._mvAppliquerRenommages('sessions');
  T('tant qu’une activité porte encore l’ancien nom (liste pas reçue, ou nom repris), la règle ne touche à rien', M.ctx.SESSIONS[0].activite === 'Rognage' && M.ctx.ACTIVITES[0].nom === 'Rognage');
  // ── Les tracteurs : déjà sûrs ──
  const set = fonction(B.trac, 'saveEditTracteur');
  T('les tracteurs se renomment déjà dans leur fiche (le nom est un champ modifiable)', /t\.nom=document\.getElementById\('et-nom'\)\.value\.trim\(\);/.test(set));
  T('… et rien ne garde leur nom : sessions, entretiens, réparations les désignent par identifiant', /tracteurId:t\.id/.test(B.trac) && /REPARATEUR_HIST\[t\.id\]/.test(B.trac) && !/tracteur(Nom)?\s*:\s*t\.nom\b/.test(B.trac + B.phyto));
  T('« Traitement » reste le nom attendu par le registre phyto', /activite:'Traitement'/.test(B.phyto));
  // ── Branchements ──
  M = monter(B); M.el['eat-act-nom'] = { value: 'Rognage' }; M.el['ract-body'] = { innerHTML: '' }; M.ctx.openRenActivite();
  T('le formulaire ouvre son panneau et dit ce qui suit', /sessions de cette activit/.test(M.el['ract-body'].innerHTML) && M.E.ov.join() === 'ovRenActivite');
  T('le bouton vit dans la fiche de l’activité, son panneau existe', /id="eat-renommer"[^>]*onclick="openRenActivite\(\)"/.test(B.html) && /<div class="overlay" id="ovRenActivite"/.test(B.html) && /id="ract-body"/.test(B.html));
  const reg = (B.fb.match(/\/\^\(([a-z_|]+)\)\$\/\.test\(key\)\) window\._mvAppliquerRenommages\(key\)/) || [, ''])[1].split('|');
  T('les activités et les sessions reçues repassent par les règles (firebase.js)', reg.includes('activites') && reg.includes('sessions'));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENOMMER UNE ACTIVITÉ : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['les sessions ne suivent pas', B => ({ ...B, reg: B.reg.replace("arr(window.SESSIONS).forEach(function(s){ if(s&&s.activite===oldN){ s.activite=newN; nb++; } });", '') })],
  ['« Traitement » peut se renommer', B => ({ ...B, reg: B.reg.replace("if(a.nom==='Traitement') return", "if(false) return") })],
  ['un nom peut devenir « Traitement »', B => ({ ...B, reg: B.reg.replace("if(k===_raNorm('Traitement')) return", "if(false) return") })],
  ['un non-administrateur peut renommer', B => ({ ...B, reg: B.reg.replace("if(!(typeof window.isAdmin==='function'&&window.isAdmin())){ if(err) err.textContent='Seul un administrateur renomme une activit\\u00e9.'; return; }", '') })],
  ['le renommage ne devient pas une règle', B => ({ ...B, reg: B.reg.replace('cfg.renommages_activites.push({ de:oldN, vers:n,', '[].push({ de:oldN, vers:n,') })],
  ['la sortie rapide ignore les règles des activités', B => ({ ...B, reg: B.reg.replace('if(!L.length&&!RP.length&&!RM.length&&!RA.length) return 0;', 'if(!L.length&&!RP.length&&!RM.length) return 0;') })],
  ['la règle s’applique même si une activité porte encore l’ancien nom', B => ({ ...B, reg: B.reg.replace("if(!(window.ACTIVITES||[]).some(function(a){ return a&&a.nom===r.de; })) nA+=", "nA+=") })],
  ['l’appareil d’admin n’enregistre pas les sessions corrigées', B => ({ ...B, reg: B.reg.replace("    if(nA>0) window.saveData('sessions');\n", '') })],
  ['les activités reçues ne repassent pas par les règles', B => ({ ...B, fb: B.fb.replace('|paie|activites)$/', '|paie)$/') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (Object.keys(BASE0).every(k => B2[k] === BASE0[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = joue(B2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
