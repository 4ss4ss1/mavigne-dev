// HARNAIS — IDS-1, lot 4 (§254) : RENOMMER UNE PARCELLE (roue crantée de la Vigne, administrateur).
//   node scripts/mv-harnais-renom-parc.mjs           → doit être vert
//   node scripts/mv-harnais-renom-parc.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de reglages.js (_renameParcelle, _renParcelleErreur, saveRenParcelle, openRenParcelle,
// _mvAppliquerRenommages — tâches comprises) et le vrai mvIdsParcelles (src/ids.js), sur un domaine fictif qui porte
// le nom d'une parcelle dans TOUS les registres connus. La liste des registres vit ici : un registre oublié = un rouge.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE0 = { reg: lire('src/reglages.js'), fb: lire('src/firebase.js'), html: lire('index.html'), ids: lire('src/ids.js') };
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1); }
  throw new Error('accolade non fermée : ' + nom);
}
async function chargerIds(texte) {
  const f = path.join(R, 'scripts', '.mv-renp-' + process.pid + '-' + Math.random().toString(36).slice(2) + '.mjs');
  fs.writeFileSync(f, texte);
  try { return await import(pathToFileURL(f).href); } finally { fs.unlinkSync(f); }
}
const FNS = ['_renRang', '_renFusion', '_renameTache', '_mvAppliquerRenommages', '_rpNorm', '_renameParcelle', '_rpTravaux', '_rpEnregistrerRegistres', '_renParcelleErreur', 'openRenParcelle', 'saveRenParcelle'];
// Un domaine où « Les Crais » est écrit partout où un nom de parcelle peut vivre.
function domaine(ids, o) {
  o = o || {};
  const pc = ids.mvPidDe('Les Crais'), pj = ids.mvPidDe('La Justice');
  return {
    PARCELLES: [{ nom: 'Les Crais', pid: pc, statut: 'Actif' }, { nom: 'La Justice', pid: pj, statut: 'Actif' }, { nom: 'Vieille Vigne', pid: ids.mvPidDe('Vieille Vigne'), statut: 'Arrachee' }],
    JOURNAL: [{ id: 'j1', parcelle: 'Les Crais', pid: pc, tache: 'Taille' }, { id: 'j2', parcelle: 'Les Crais', tache: 'Taille' }, { id: 'j3', parcelle: 'La Justice', pid: pj }],
    SESSIONS: [{ id: 's1', parcellesFaites: ['Les Crais', { nom: 'Les Crais', t1: 5 }, 'La Justice'], parcelles: ['Les Crais'], parcelle: 'Les Crais' }],
    TRAITEMENTS: [{ parcelles: ['Les Crais', 'La Justice'] }, { parcelles: 'Les Crais' }],
    CAVE_VENDANGE: { recoltes: [{ parcelle: ' les crais ' }, { parcelle: 'La Justice' }], analyses: [{ parcelle: 'Les Crais' }], cuves_vinif: [{ parcelles: ['les Crais', 'La Justice'] }] },
    INTRANTS: { fertil: [{ parcs: ['Les Crais'], man: { 'Les Crais': '2026-03-01', 'La Justice': '2026-03-02' } }] },
    KML_POLYGONS_DYNAMIC: [{ name: 'LES CRAIS', pts: [[1, 2]] }, { name: 'La Justice', pts: [[3, 4]] }],
    CONFIG: { ordre_passage_t: { Taille: { ordre: ['La Justice', 'Les Crais'] } }, ordre_passage: ['Les Crais'], renommages_parcelles: o.regles || [], renommages_taches: o.reglesT || [] },
    HISTORIQUE: [{ campagne: '2025', parcelles: [{ nom: 'Les Crais' }] }],
    TRAVAUX: { Taille: { parcelles: ['Les Crais'] } }, TACHES: [{ nom: 'Taille' }, { nom: 'Relevage' }],
  };
}
function monter(B, ids, o) {
  o = o || {};
  const W = domaine(ids, o), E = { saves: [], intrants: 0, kml: 0, recalc: [], ov: [] };
  const el = {};
  const doc = { getElementById: id => el[id] || null, querySelector: () => null };
  const ctx = Object.assign(W, {
    document: doc, console: { log() {}, warn() {} }, Date, JSON, Math, String, Object, Array,
    isAdmin: () => o.admin !== false, currentUser: { nom: 'Nico' },
    saveData: k => E.saves.push(k), saveIntrants: () => { E.intrants++; }, fbSave: (k) => { if (k === 'kml_polygons') E.kml++; },
    recalcTravaux: t => { E.recalc.push(t); W.TRAVAUX[t] = { parcelles: W.PARCELLES.map(p => p.nom) }; },
    openOv: id => E.ov.push(id), closeOv() {}, _escHtml: s => String(s), _escAttr: s => String(s), _mvAvale() {},
    mvIdsParcelles: ids.mvIdsParcelles,
  });
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(FNS.map(n => fonction(B.reg, n)).join('\n'), ctx);
  return { W, E, el, ctx };
}
async function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  const ids = await chargerIds(B.ids);
  // ── Renommer, par l'administrateur ──
  let M = monter(B, ids);
  M.el['rparc-sel'] = { value: 'Les Crais' }; M.el['rparc-nom'] = { value: '  Crais du Haut ' }; M.el['rparc-err'] = { textContent: '' };
  const pidAvant = M.W.PARCELLES[0].pid;
  M.ctx.saveRenParcelle();
  const W = M.W, N = 'Crais du Haut';
  T('la parcelle prend le nouveau nom et GARDE son identifiant', W.PARCELLES[0].nom === N && W.PARCELLES[0].pid === pidAvant && M.el['rparc-err'].textContent === '');
  T('journal : ses entrées suivent (avec ou sans identifiant), pas celles des autres', W.JOURNAL[0].parcelle === N && W.JOURNAL[1].parcelle === N && W.JOURNAL[2].parcelle === 'La Justice');
  T('sessions tracteur : parcelles faites (texte et {nom}), parcelles, parcelle', W.SESSIONS[0].parcellesFaites[0] === N && W.SESSIONS[0].parcellesFaites[1].nom === N && W.SESSIONS[0].parcellesFaites[2] === 'La Justice' && W.SESSIONS[0].parcelles[0] === N && W.SESSIONS[0].parcelle === N);
  T('registre phyto : liste et texte seul', W.TRAITEMENTS[0].parcelles[0] === N && W.TRAITEMENTS[0].parcelles[1] === 'La Justice' && W.TRAITEMENTS[1].parcelles === N);
  T('Chai et Cuvier : récoltes et analyses (même saisies sans casse ni espaces), cuves de vinification', W.CAVE_VENDANGE.recoltes[0].parcelle === N && W.CAVE_VENDANGE.recoltes[1].parcelle === 'La Justice' && W.CAVE_VENDANGE.analyses[0].parcelle === N && W.CAVE_VENDANGE.cuves_vinif[0].parcelles[0] === N);
  T('fertilisation : parcelles de l’apport et dates posées à la main', W.INTRANTS.fertil[0].parcs[0] === N && W.INTRANTS.fertil[0].man[N] === '2026-03-01' && !('Les Crais' in W.INTRANTS.fertil[0].man) && W.INTRANTS.fertil[0].man['La Justice'] === '2026-03-02');
  T('carte : le contour (nom sans casse) suit', W.KML_POLYGONS_DYNAMIC[0].name === N && W.KML_POLYGONS_DYNAMIC[1].name === 'La Justice');
  T('tournées : celle de la tâche et l’ancienne liste', W.CONFIG.ordre_passage_t.Taille.ordre[1] === N && W.CONFIG.ordre_passage[0] === N);
  T('les archives des campagnes passées gardent le nom de l’époque', W.HISTORIQUE[0].parcelles[0].nom === 'Les Crais');
  const r = W.CONFIG.renommages_parcelles[0];
  T('le renommage devient une règle du domaine (ancien, nouveau, identifiant, date, auteur)', r && r.de === 'Les Crais' && r.vers === N && r.pid === pidAvant && r.quand && r.par === 'Nico');
  T('les travaux sont recalculés, pas recopiés', M.E.recalc.join() === 'Taille,Relevage' && W.TRAVAUX.Taille.parcelles.indexOf(N) >= 0 && !('Les Crais' in W.TRAVAUX));
  T('tout est enregistré : parcelles, journal, travaux, sessions, phyto, Chai, réglages, réserve, carte',
    ['parcelles', 'journal', 'travaux', 'sessions', 'traitements', 'cave_vendange', 'config'].every(k => M.E.saves.includes(k)) && M.E.intrants === 1 && M.E.kml === 1);
  // ── Refus ──
  M = monter(B, ids, { admin: false });
  M.el['rparc-sel'] = { value: 'Les Crais' }; M.el['rparc-nom'] = { value: 'Autre' }; M.el['rparc-err'] = { textContent: '' };
  M.ctx.saveRenParcelle();
  T('un non-administrateur ne renomme rien', M.W.PARCELLES[0].nom === 'Les Crais' && /administrateur/.test(M.el['rparc-err'].textContent) && !M.E.saves.length);
  M = monter(B, ids, { regles: [{ de: 'Ancien Clos', vers: 'La Justice', pid: 'pautre', quand: '2026-01-01' }] });
  const p0 = M.W.PARCELLES[0], err = n => M.ctx._renParcelleErreur(p0, n);
  T('refusé : un nom vide, ou le même', /vide/.test(err('')) && /déjà son nom/.test(err('Les Crais')));
  T('refusé : le nom d’une autre parcelle, même arrachée, sans souci de casse', /autre parcelle porte/.test(err('la justice')) && /autre parcelle porte/.test(err('Vieille vigne')));
  T('refusé : un ancien nom d’une AUTRE parcelle (elle hériterait de son historique)', /déjà été porté/.test(err('ancien clos')));
  T('refusé : plus de 60 caractères, ou un caractère de contrôle', /60/.test(err('x'.repeat(61))) && /non autorisé/.test(err('A\u0001B')));
  T('accepté : un nom libre, ou la même avec une autre casse', err('Crais du Haut') === '' && err('LES CRAIS') === '');
  // ── Un autre téléphone applique la règle ──
  const regle = { de: 'Les Crais', vers: 'Crais du Haut', pid: ids.mvPidDe('Les Crais'), quand: '2026-10-06T08:00:00Z' };
  M = monter(B, ids, { regles: [regle] });
  M.W.JOURNAL.push({ id: 'j9', parcelle: 'Les Crais', tache: 'Taille' });   // saisi hors ligne sous l'ancien nom
  const n1 = M.ctx._mvAppliquerRenommages('journal');
  T('un autre téléphone applique la règle à tous ses registres, saisies hors ligne comprises', n1 > 10 && M.W.PARCELLES[0].nom === 'Crais du Haut' && M.W.JOURNAL[3].parcelle === 'Crais du Haut' && M.W.KML_POLYGONS_DYNAMIC[0].name === 'Crais du Haut' && M.W.INTRANTS.fertil[0].parcs[0] === 'Crais du Haut');
  T('… et repasser ne change plus rien (aucune boucle d’enregistrements)', M.ctx._mvAppliquerRenommages('journal') === 0);
  T('… un appareil d’admin enregistre la correction', ['parcelles', 'journal', 'sessions', 'traitements', 'cave_vendange', 'config'].every(k => M.E.saves.includes(k)) && M.E.intrants >= 1);
  M = monter(B, ids, { regles: [regle], admin: false }); M.ctx._mvAppliquerRenommages('journal');
  T('… un appareil d’ouvrier corrige en mémoire sans rien enregistrer de lui-même', M.W.PARCELLES[0].nom === 'Crais du Haut' && M.E.saves.length === 0);
  M = monter(B, ids, { regles: [regle] });
  M.W.PARCELLES[0].nom = 'Crais du Haut';                                                        // déjà renommée…
  M.W.PARCELLES.push({ nom: 'Les Crais', pid: 'pneuve', statut: 'Actif' });                     // … et une NOUVELLE parcelle a repris l'ancien nom
  M.W.TRAITEMENTS.push({ parcelles: ['Les Crais'] });
  M.ctx._mvAppliquerRenommages('parcelles');
  T('une nouvelle parcelle qui reprend l’ancien nom n’est pas renommée, ni ses données', M.W.PARCELLES[3].nom === 'Les Crais' && M.W.TRAITEMENTS[2].parcelles[0] === 'Les Crais');
  M = monter(B, ids, { reglesT: [{ de: 'Taille', vers: 'Taille d’hiver', quand: '2026-01-01' }] });
  M.ctx._mvAppliquerRenommages('journal');
  T('les règles de TÂCHES s’appliquent toujours (aucune régression)', M.W.JOURNAL[0].tache === 'Taille d’hiver');
  M = monter(B, ids);
  const nb = M.ctx._renameParcelle('Les Crais', 'LES CRAIS', M.W.PARCELLES[0].pid), nb2 = M.ctx._renameParcelle('Les Crais', 'LES CRAIS', M.W.PARCELLES[0].pid);
  T('changer seulement la casse : appliqué une fois, puis plus rien (idempotent)', nb > 0 && nb2 === 0 && M.W.CAVE_VENDANGE.recoltes[0].parcelle === 'LES CRAIS');
  // ── Le formulaire et les branchements ──
  M = monter(B, ids); M.el['rparc-body'] = { innerHTML: '' }; M.ctx.openRenParcelle();
  T('le formulaire propose toutes les parcelles, arrachées signalées, et ouvre son panneau', /Les Crais/.test(M.el['rparc-body'].innerHTML) && /Vieille Vigne \(arrachée\)/.test(M.el['rparc-body'].innerHTML) && M.E.ov.join() === 'ovRenParcelle');
  const sec = B.html.slice(B.html.indexOf('<div class="set-sec" id="set-sec-secteurs">'), B.html.indexOf('<div class="set-sec" id="regl-docs-vigne">'));
  T('la ligne vit dans la roue crantée de la Vigne (Parcelles & secteurs météo), son panneau existe', /onclick="openRenParcelle\(\)"/.test(sec) && /<div class="overlay" id="ovRenParcelle"/.test(B.html) && /id="rparc-body"/.test(B.html));
  T('les données reçues de chaque registre repassent par les règles (firebase.js)', /\^\(config\|parcelles\|journal\|taches\|saisons\|travaux\|sessions\|traitements\|cave_vendange\|kml_polygons\|intrants\)\$/.test(B.fb));
  return out;
}
async function joue(B) { try { return await suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
(await joue(BASE0)).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENOMMER UNE PARCELLE : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['les sessions tracteur sont oubliées', B => ({ ...B, reg: B.reg.replace("(window.SESSIONS||[]).forEach(function(s){ if(!s) return; rl(s.parcellesFaites,eq); rl(s.parcelles,eq);", "(window.SESSIONS||[]).forEach(function(s){ if(!s) return;") })],
  ['les {nom} des parcelles faites sont oubliés', B => ({ ...B, reg: B.reg.replace("else if(a[i]&&typeof a[i]==='object'&&typeof a[i].nom==='string'&&f(a[i].nom)){ a[i].nom=newN; nb++; }", '') })],
  ['le Chai compare à la lettre (une saisie libre est oubliée)', B => ({ ...B, reg: B.reg.replace("var eqN=function(x){ return typeof x==='string'&&x!==newN&&_rpNorm(x)===o; };", "var eqN=function(x){ return x===oldN; };") })],
  ['la fertilisation est oubliée', B => ({ ...B, reg: B.reg.replace("((window.INTRANTS||{}).fertil||[]).forEach(function(op){ if(!op) return; rl(op.parcs,eq); mvk(op.man,eq); });", '') })],
  ['la carte est oubliée', B => ({ ...B, reg: B.reg.replace("(window.KML_POLYGONS_DYNAMIC||[]).forEach(function(k){ if(k&&eqN(k.name)){ k.name=newN; nb++; } });", '') })],
  ['les tournées sont oubliées', B => ({ ...B, reg: B.reg.replace("rl(cfg.ordre_passage,eq);\n  return nb;", "return nb;") })],
  ['la parcelle perd son identifiant', B => ({ ...B, reg: B.reg.replace("mvIdsParcelles(P);                                   // l'identifiant d'abord", "P.forEach(function(x){ delete x.pid; });  // l'identifiant d'abord") })],
  ['le renommage ne devient pas une règle', B => ({ ...B, reg: B.reg.replace("cfg.renommages_parcelles.push({ de:oldN, vers:n, pid:p.pid||'',", "[].push({ de:oldN, vers:n, pid:p.pid||'',") })],
  ['un non-administrateur peut renommer', B => ({ ...B, reg: B.reg.replace("if(!(typeof window.isAdmin==='function'&&window.isAdmin())){ if(err) err.textContent='Seul un administrateur renomme une parcelle.'; return; }", '') })],
  ['un ancien nom d’une autre parcelle est accepté', B => ({ ...B, reg: B.reg.replace("if(RP.some(function(r){ return r&&_rpNorm(r.de)===k&&r.pid!==p.pid; }))", "if(false)") })],
  ['la règle renomme aussi une nouvelle parcelle qui a repris l’ancien nom', B => ({ ...B, reg: B.reg.replace('if(!autre) nP+=_renameParcelle(r.de,r.vers,r.pid)||0;', 'nP+=_renameParcelle(r.de,r.vers,null)||0;') })],
  ['les travaux ne sont pas recalculés', B => ({ ...B, reg: B.reg.replace("  _renameParcelle(oldN,n,p.pid);\n  _rpTravaux();", "  _renameParcelle(oldN,n,p.pid);") })],
  ['la réserve n’est pas enregistrée', B => ({ ...B, reg: B.reg.replace("if(typeof window.saveIntrants==='function') window.saveIntrants();\n  var K=window.KML_POLYGONS_DYNAMIC;", "var K=window.KML_POLYGONS_DYNAMIC;") })],
  ['les données reçues des registres ne repassent pas par les règles', B => ({ ...B, fb: B.fb.replace('|sessions|traitements|cave_vendange|kml_polygons|intrants)$/', ')$/') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (Object.keys(BASE0).every(k => B2[k] === BASE0[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = (await joue(B2)).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
