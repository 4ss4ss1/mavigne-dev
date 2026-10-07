// HARNAIS — IDS-1, salariés (§257) : RENOMMER UN SALARIÉ (fiche du salarié, Réglages › Équipe, administrateur).
//   node scripts/mv-harnais-renom-membre.mjs           → doit être vert
//   node scripts/mv-harnais-renom-membre.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de reglages.js (_renameMembre, _renMembreErreur, saveRenMembre, openRenMembre,
// _mvAppliquerRenommages) et le vrai _mvRefreshCurrentUserRoles d'app.js, sur un domaine fictif qui porte le nom d'un
// salarié dans TOUS les registres connus. La liste des registres vit ici : un registre oublié = un rouge.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE0 = { reg: lire('src/reglages.js'), app: lire('src/app.js'), fb: lire('src/firebase.js'), html: lire('index.html') };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
const FNS = ['_renRang', '_renFusion', '_renameTache', '_rpNorm', '_renameParcelle', '_rpTravaux', '_rpEnregistrerRegistres', '_mvAppliquerRenommages',
  '_rmNorm', '_renameMembre', '_rmEnregistrer', '_renMembreErreur', 'openRenMembre', 'saveRenMembre'];
// Un domaine où « Marc » est écrit partout où un nom de salarié peut vivre.
function domaine(o) {
  o = o || {};
  return {
    MEMBRES: [{ nom: 'Marc', email: 'marc@domaine.fr', roles: ['ouvrier'], statut: 'Actif' }, { nom: 'Julie', email: 'julie@domaine.fr', roles: ['ouvrier'], statut: 'Actif' }],
    PARCELLES: [], TACHES: [], TRAVAUX: {},
    JOURNAL: [{ id: 'j1', qui: 'Marc', membresEquipe: ['Marc', 'Julie'] }, { id: 'j2', qui: 'Julie', membresEquipe: [] }],
    SESSIONS: [{ id: 's1', conducteur: 'Marc' }], ENTRETIENS: [{ id: 'e1', conducteur: 'Marc' }], REPARATEUR_HIST: { t1: [{ depuis: '2026-09-01', retour: '2026-09-05', motif: 'casse' }] },   // un OBJET par tracteur, comme dans l'appli
    TRAITEMENTS: [{ conducteur: 'Marc', operateur: 'Marc' }, { conducteur: 'Julie', operateur: 'Julie' }],
    CONDUCTEURS: [{ nom: 'Marc', statut: 'Actif' }, { nom: 'Julie', statut: 'Actif' }],
    CAVE_ELEVAGE: { operations: [{ id: 'o1', operateur: 'Marc', intervenants: ['Marc', 'Julie'] }], analyses: [{ id: 'a1', uploaded_by: 'Marc' }] },
    CAVE_VENDANGE: { cuves_vinif: [{ id: 'c1', mesures_fa: [{ id: 'm1', qui: ['Marc'] }] }] },
    CONFIG: { equipes_jour: { '2026-10-07': [{ m: ['Marc', 'Julie'] }] }, home_layout: { Marc: ['meteo'], Julie: ['tri'] }, mur_mot: { txt: 'Bonjour', par: 'Marc' },
      renommages_membres: o.regles || [], renommages_parcelles: [], renommages_taches: [] },
    PLANNING_ENTRIES: { Marc: { 2026: { 10: { 7: { h: 7 } } } }, Julie: {} }, PLANNING_HSUP: { Marc: { '2026-10': { paye: 2 } } }, PLANNING_ACOMPTES: { Marc: { '2026-10': [{ m: 100 }] } },
    PAIE: { taux: { Marc: 13.2, Julie: 12.1 }, taux_hist: { Marc: [{ de: 12, a: 13.2, d: '2026-03-01' }] }, taux_serie: { Marc: [] }, gnr_appoints: [{ id: 'g1', par: 'Marc' }] },
    HISTORIQUE: [{ campagne: '2025', membres: [{ nom: 'Marc' }] }],
  };
}
function monter(B, o) {
  o = o || {};
  const W = domaine(o), E = { saves: [], paie: 0, ov: [] }, el = {}, stock = {};
  const ctx = Object.assign(W, {
    document: { getElementById: id => el[id] || null, querySelector: () => null }, console: { log() {}, warn() {} }, Date, JSON, Math, String, Object, Array, Promise,
    isAdmin: () => o.admin !== false, currentUser: { nom: 'Nico' },
    saveData: k => E.saves.push(k), saveIntrants() {}, fbSave: k => { if (k === 'paie') E.paie++; }, recalcTravaux() {},
    openOv: id => E.ov.push(id), closeOv() {}, _escHtml: s => String(s), _escAttr: s => String(s), _mvAvale() {}, renderReglages() {},
    localStorage: { getItem: k => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: k => { delete stock[k]; } },
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(FNS.map(n => fonction(B.reg, n)).join('\n'), ctx);
  return { W, E, el, ctx, stock };
}
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── Renommer, par l'administrateur ──
  let M = monter(B);
  M.el['em-nom'] = { value: 'Marc' }; M.el['em-title'] = { textContent: 'Modifier Marc' }; M.el['rmem-nom'] = { value: '  Marc Dupont ' }; M.el['rmem-err'] = { textContent: '' };
  M.ctx.saveRenMembre();
  const W = M.W, N = 'Marc Dupont';
  T('la fiche prend le nouveau nom, l’adresse et les rôles ne bougent pas', W.MEMBRES[0].nom === N && W.MEMBRES[0].email === 'marc@domaine.fr' && W.MEMBRES[0].roles.join() === 'ouvrier' && M.el['rmem-err'].textContent === '');
  T('journal : « qui » et les équipes, pas les entrées des autres', W.JOURNAL[0].qui === N && W.JOURNAL[0].membresEquipe.join() === N + ',Julie' && W.JOURNAL[1].qui === 'Julie');
  T('tracteur : sessions et entretiens', W.SESSIONS[0].conducteur === N && W.ENTRETIENS[0].conducteur === N);
  T('un registre qui n’est pas une liste (réparations, objet par tracteur) ne fait pas planter le renommage', W.REPARATEUR_HIST.t1[0].motif === 'casse' && W.PAIE.taux[N] === 13.2);
  T('registre phyto : conducteur et opérateur', W.TRAITEMENTS[0].conducteur === N && W.TRAITEMENTS[0].operateur === N && W.TRAITEMENTS[1].conducteur === 'Julie');
  T('la liste des conducteurs', W.CONDUCTEURS[0].nom === N && W.CONDUCTEURS[1].nom === 'Julie');
  T('Chai : opérations (opérateur, intervenants) et analyses ; Cuvier : relevés de cuve', W.CAVE_ELEVAGE.operations[0].operateur === N && W.CAVE_ELEVAGE.operations[0].intervenants.join() === N + ',Julie' && W.CAVE_ELEVAGE.analyses[0].uploaded_by === N && W.CAVE_VENDANGE.cuves_vinif[0].mesures_fa[0].qui[0] === N);
  T('réglages : équipes du jour, mise en page de l’accueil (clé déplacée), mot du mur', W.CONFIG.equipes_jour['2026-10-07'][0].m.join() === N + ',Julie' && W.CONFIG.home_layout[N].join() === 'meteo' && !('Marc' in W.CONFIG.home_layout) && W.CONFIG.mur_mot.par === N);
  T('planning : entrées, heures sup et acomptes passent sous le nouveau nom, sans rien perdre', W.PLANNING_ENTRIES[N][2026][10][7].h === 7 && !('Marc' in W.PLANNING_ENTRIES) && W.PLANNING_HSUP[N]['2026-10'].paye === 2 && W.PLANNING_ACOMPTES[N]['2026-10'][0].m === 100 && !('Marc' in W.PLANNING_ACOMPTES));
  T('paie : taux, historique et série passent sous le nouveau nom ; appoints GNR', W.PAIE.taux[N] === 13.2 && !('Marc' in W.PAIE.taux) && W.PAIE.taux_hist[N].length === 1 && Array.isArray(W.PAIE.taux_serie[N]) && W.PAIE.gnr_appoints[0].par === N && W.PAIE.taux.Julie === 12.1);
  T('les archives des campagnes passées gardent le nom de l’époque', W.HISTORIQUE[0].membres[0].nom === 'Marc');
  const r = W.CONFIG.renommages_membres[0];
  T('le renommage devient une règle du domaine (ancien, nouveau, adresse, date, auteur)', r && r.de === 'Marc' && r.vers === N && r.email === 'marc@domaine.fr' && r.quand && r.par === 'Nico');
  T('tout est enregistré, la paie par son propre chemin', ['membres', 'journal', 'sessions', 'entretiens', 'traitements', 'conducteurs', 'cave_elevage', 'cave_vendange', 'planning_entries', 'planning_hsup', 'planning_acomptes', 'config'].every(k => M.E.saves.includes(k)) && M.E.paie === 1);
  T('la fiche ouverte affiche le nouveau nom', M.el['em-nom'].value === N && /Marc Dupont/.test(M.el['em-title'].textContent));
  // ── Refus ──
  M = monter(B, { admin: false });
  M.el['em-nom'] = { value: 'Marc' }; M.el['rmem-nom'] = { value: 'Autre' }; M.el['rmem-err'] = { textContent: '' };
  M.ctx.saveRenMembre();
  T('un non-administrateur ne renomme rien', M.W.MEMBRES[0].nom === 'Marc' && /administrateur/.test(M.el['rmem-err'].textContent) && !M.E.saves.length);
  M = monter(B, { regles: [{ de: 'Paul', vers: 'Julie', email: 'paul@domaine.fr', quand: '2026-01-01' }] });
  const m0 = M.W.MEMBRES[0], err = n => M.ctx._renMembreErreur(m0, n);
  T('refusé : vide, le même, le nom d’un autre salarié (sans souci de casse)', /vide/.test(err('')) && /déjà son nom/.test(err('Marc')) && /Un autre salarié porte/.test(err('julie')));
  T('refusé : l’ancien nom d’un AUTRE salarié, plus de 60 caractères, un caractère de contrôle', /déjà été porté/.test(err('paul')) && /60/.test(err('x'.repeat(61))) && /non autorisé/.test(err('A\u0001B')));
  T('accepté : un nom libre, ou le même avec une autre casse', err('Marc Dupont') === '' && err('MARC') === '');
  // ── Un autre téléphone applique la règle ──
  const regle = { de: 'Marc', vers: 'Marc Dupont', email: 'marc@domaine.fr', quand: '2026-10-07T08:00:00Z' };
  M = monter(B, { regles: [regle] });
  M.W.JOURNAL.push({ id: 'j9', qui: 'Marc', membresEquipe: [] });      // saisi hors ligne sous l'ancien nom
  const n1 = M.ctx._mvAppliquerRenommages('membres');
  T('un autre téléphone applique la règle partout, saisies hors ligne comprises', n1 > 15 && M.W.MEMBRES[0].nom === 'Marc Dupont' && M.W.JOURNAL[2].qui === 'Marc Dupont' && M.W.PLANNING_ENTRIES['Marc Dupont'] && M.W.PAIE.taux['Marc Dupont'] === 13.2);
  T('… repasser ne change plus rien (aucune boucle d’enregistrements)', M.ctx._mvAppliquerRenommages('membres') === 0);
  T('… un appareil d’admin enregistre la correction, paie comprise', M.E.saves.includes('planning_entries') && M.E.saves.includes('membres') && M.E.paie >= 1);
  M = monter(B, { regles: [regle], admin: false }); M.ctx._mvAppliquerRenommages('membres');
  T('… un appareil d’ouvrier corrige en mémoire sans rien enregistrer de lui-même', M.W.MEMBRES[0].nom === 'Marc Dupont' && M.E.saves.length === 0 && M.E.paie === 0);
  M = monter(B, { regles: [regle] });
  M.W.MEMBRES[0].nom = 'Marc Dupont'; M.W.MEMBRES.push({ nom: 'Marc', email: 'marc.neuf@domaine.fr', roles: [], statut: 'Actif' });
  M.W.TRAITEMENTS.push({ conducteur: 'Marc' });
  M.ctx._mvAppliquerRenommages('membres');
  T('un NOUVEAU salarié qui reprend l’ancien nom n’est pas renommé, ni ses données', M.W.MEMBRES[2].nom === 'Marc' && M.W.TRAITEMENTS[2].conducteur === 'Marc');
  // ── Le téléphone du salarié renommé ──
  const fn = fonction(B.app, '_mvRefreshCurrentUserRoles') + '\n' + fonction(B.app, '_mvEmpreinteCle') + '\n' + fonction(B.app, '_mvEmpreinteLire');
  const stock = { mavigne_tenant: 'dom', mavigne_entree_v1_dom: JSON.stringify({ v: 1, nom: 'Marc', uid: 'u1', sel: 's', emp: 'e', iter: 1 }) };
  const cx = { window: null, console: { log() {} }, JSON, String, Array, Object, document: { querySelector: () => null },
    localStorage: { getItem: k => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    MEMBRES: [{ nom: 'Marc Dupont', email: 'marc@domaine.fr', roles: ['ouvrier'], statut: 'Actif' }],
    currentUser: { nom: 'Marc', email: 'marc@domaine.fr', roles: ['ouvrier'] }, _mvPrepOn: () => false, applyRoles() {}, _mvAvale() {} };
  cx.window = cx; vm.createContext(cx); vm.runInContext(fn, cx); cx._mvRefreshCurrentUserRoles();
  T('sur SON téléphone : la session prend le nouveau nom (retrouvée par l’adresse)', cx.currentUser.nom === 'Marc Dupont');
  T('… et la connexion sans réseau le reconnaît sous son nouveau nom (empreinte suivie, mot de passe intact)', JSON.parse(stock.mavigne_entree_v1_dom).nom === 'Marc Dupont' && JSON.parse(stock.mavigne_entree_v1_dom).emp === 'e');
  // ── Le formulaire et les branchements ──
  M = monter(B); M.el['em-nom'] = { value: 'Marc' }; M.el['rmem-body'] = { innerHTML: '' }; M.ctx.openRenMembre();
  T('le formulaire dit ce qui suit et ce qui ne suit pas, et ouvre son panneau', /Son compte ne change pas/.test(M.el['rmem-body'].innerHTML) && /historique du chat/.test(M.el['rmem-body'].innerHTML) && M.E.ov.join() === 'ovRenMembre');
  T('le bouton vit dans la fiche du salarié, son panneau existe', /id="em-renommer"[^>]*onclick="openRenMembre\(\)"/.test(B.html) && /<div class="overlay" id="ovRenMembre"/.test(B.html) && /id="rmem-body"/.test(B.html));
  const reg = (B.fb.match(/\/\^\(([a-z_|]+)\)\$\/\.test\(key\)\) window\._mvAppliquerRenommages\(key\)/) || [, ''])[1].split('|');
  T('les registres des salariés reçus repassent par les règles (firebase.js)', ['membres', 'entretiens', 'conducteurs', 'cave_elevage', 'planning_entries', 'planning_hsup', 'planning_acomptes', 'paie'].every(k => reg.includes(k)));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENOMMER UN SALARIÉ : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['le planning est oublié', B => ({ ...B, reg: B.reg.replace('cle(window.PLANNING_ENTRIES); cle(window.PLANNING_HSUP); cle(window.PLANNING_ACOMPTES);', 'cle(window.PLANNING_HSUP); cle(window.PLANNING_ACOMPTES);') })],
  ['la paie est oubliée', B => ({ ...B, reg: B.reg.replace('cle(P.taux); cle(P.taux_hist); cle(P.taux_serie);', '') })],
  ['une clé déplacée écrase la valeur existante… ou perd l’ancienne', B => ({ ...B, reg: B.reg.replace('if(!own.call(obj,newN)) obj[newN]=obj[oldN]; delete obj[oldN]; nb++;', 'delete obj[oldN]; nb++;') })],
  ['les équipes du journal sont oubliées', B => ({ ...B, reg: B.reg.replace("arr(window.JOURNAL).forEach(function(e){ if(!e) return; champ(e,'qui'); liste(e.membresEquipe); });", "arr(window.JOURNAL).forEach(function(e){ if(!e) return; champ(e,'qui'); });") })],
  ['le Chai est oublié', B => ({ ...B, reg: B.reg.replace("arr(E.operations).forEach(function(o){ if(!o) return; champ(o,'operateur'); liste(o.intervenants); });", '') })],
  ['le Cuvier est oublié', B => ({ ...B, reg: B.reg.replace("arr((window.CAVE_VENDANGE||{}).cuves_vinif).forEach(function(c){ arr(c&&c.mesures_fa).forEach(function(m){ if(m) liste(m.qui); }); });", '') })],
  ['la paie n’est pas enregistrée', B => ({ ...B, reg: B.reg.replace("if(window.PAIE&&typeof window.PAIE==='object'&&typeof window.fbSave==='function') window.fbSave('paie',window.PAIE);", '') })],
  ['un non-administrateur peut renommer', B => ({ ...B, reg: B.reg.replace("if(!(typeof window.isAdmin==='function'&&window.isAdmin())){ if(err) err.textContent='Seul un administrateur renomme un salari\\u00e9.'; return; }", '') })],
  ['l’ancien nom d’un autre salarié est accepté', B => ({ ...B, reg: B.reg.replace("if(RM.some(function(r){ return r&&_rmNorm(r.de)===k&&String(r.email||'').toLowerCase()!==em; }))", 'if(false)') })],
  ['la règle renomme aussi un nouveau salarié qui a repris l’ancien nom', B => ({ ...B, reg: B.reg.replace('if(!autre) nM+=_renameMembre(r.de,r.vers,r.email)||0;', "nM+=_renameMembre(r.de,r.vers,'')||0;") })],
  ['le renommage ne devient pas une règle', B => ({ ...B, reg: B.reg.replace('cfg.renommages_membres.push({ de:oldN, vers:n,', '[].push({ de:oldN, vers:n,') })],
  ['la sortie rapide ignore les règles des salariés', B => ({ ...B, reg: B.reg.replace('if(!L.length&&!RP.length&&!RM.length&&!RA.length) return 0;', 'if(!L.length&&!RP.length&&!RA.length) return 0;') })],
  ['le téléphone du salarié garde l’ancien nom', B => ({ ...B, app: B.app.replace('var _ancien=cu.nom; cu.nom=m.nom;', 'var _ancien=cu.nom;') })],
  ['l’empreinte hors réseau garde l’ancien nom', B => ({ ...B, app: B.app.replace("if(_E&&_k&&String(_E.nom)===String(_ancien)){ _E.nom=String(m.nom); localStorage.setItem(_k, JSON.stringify(_E)); }", '') })],
  ['les registres des salariés reçus ne repassent pas par les règles', B => ({ ...B, fb: B.fb.replace('|membres|entretiens|conducteurs|cave_elevage|planning_entries|planning_hsup|planning_acomptes|paie|', '|') })],
  ['un registre qui n’est pas une liste est parcouru de force', B => ({ ...B, reg: B.reg.replace("[window.SESSIONS, window.ENTRETIENS].forEach(function(L){ arr(L).forEach(", "[window.SESSIONS, window.ENTRETIENS, window.REPARATEUR_HIST].forEach(function(L){ (L||[]).forEach(") })],
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
