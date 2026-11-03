// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-3 — L'ÉCRAN CLIENTS, LES CONTACTS (D5), LES RELANCES À DÉCIDER (§518)
// ═══════════════════════════════════════════════════════════
//  La maquette v1 : les clients en tableau trié par santé, la fiche à onglets.
//  D5 : le contact de facturation. Et la règle de Nico (02/11) : « les relances
//  partent que si je décide de les faire partir » — une relance ne part JAMAIS
//  seule : la console ouvre un BROUILLON, le serveur prévient Nicolas.
//
//  Sur les VRAIES fonctions de src/gt/clients.js (santé, filtres, tri, dessin) et
//  de src/admin-gt.js (le délai d'une relance d'essai, l'adresse d'un contact) ;
//  le câblage lu dans admin-gt.js, clients.js, gt.js et functions/claims.js.
//
//  Usage :  node scripts/mv-harnais-gtui3.mjs
//           node scripts/mv-harnais-gtui3.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { cli: lire('src/gt/clients.js'), gt: lire('src/admin-gt.js'), entree: lire('src/gt.js'), cl: lire('functions/claims.js') };

function fonction(src, nom) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function monterCli(cli) {
  const fin = cli.indexOf("// ── Les gestes de l'écran");
  if (fin < 0) throw new Error('repère des gestes absent');
  const code = cli.slice(0, fin).replace(/^export (var|function) /gm, '$1 ');
  return new Function(code + '\nreturn { santeDe, filtrer, trier, compteFiltres, vue, E };')();
}
function monterGt(gt, clients) {
  const v = /^var _AGT_RELANCE_ESSAI_J\s*=[^\n]*;/m.exec(gt);
  if (!v) throw new Error('_AGT_RELANCE_ESSAI_J absente');
  const code = v[0] + '\n' + ['_agtEmailValide', '_agtContactEmail', '_agtRelanceEssaiJours', '_agtRelanceEssaiTexte'].map(n => fonction(gt, n)).join('\n');
  return new Function('_agtCli', code + '\nreturn { _agtEmailValide, _agtContactEmail, _agtRelanceEssaiJours, _agtRelanceEssaiTexte, J: _AGT_RELANCE_ESSAI_J };')(s => (clients || {})[s] || {});
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOW = Date.parse('2026-11-02T12:00:00Z'), J = 86400000, iso = d => new Date(NOW - d * J).toISOString();
function jeu() {
  const c = (slug, o) => Object.assign({ slug, nom: slug, statut: 'actif', statutLabel: 'Abonné', interne: false, du: 0, retard: 0, prix: 79, incidents: 0, crit: 0, membres: 5, parcelles: 19, echecs: [], derniere: iso(1), contact: {}, relanceJours: -1 }, o);
  return [
    c('bonne', { nom: 'Domaine des Tilleuls' }),
    c('retard', { nom: 'Château Fontrouge', du: 544, retard: 1 }),
    c('silence', { nom: 'Clos Saint-Aubin', derniere: iso(16) }),
    c('incid', { nom: 'Domaine Bérard', incidents: 2 }),
    c('echu', { nom: 'Maison Lerouge', statut: 'echu', statutLabel: 'Essai échu', prix: 0, relanceJours: 18, contact: { nom: 'Marc', email: 'marc@lerouge.fr' } }),
    c('interne', { nom: 'Domaine de référence', interne: true }),
    c('pose', { nom: 'Domaine de la Combe', statut: 'pending', statutLabel: 'À installer' }),
    c('piege', { nom: 'Piège <img onerror=x>', slug: "pi'ege", echecs: ['membres'], membres: null })
  ];
}
const D = () => ({ clients: jeu(), panneau: (s, o) => '<p>panneau ' + o + '</p>', esc, eur: v => v + ' €', relTime: () => '1 j', silenceJ: 14 });
const ESSAIS = {
  sante(cli) {
    const M = monterCli(cli), L = jeu(), S = slug => M.santeDe(L.find(x => x.slug === slug), NOW, 14);
    return S('bonne').cle === 'bonne' && S('retard').cle === 'risque' && /1 facture en retard/.test(S('retard').pourquoi.join())
      && S('silence').cle === 'risque' && /16 j/.test(S('silence').pourquoi.join()) && S('incid').cle === 'surveiller'
      && S('echu').cle === 'surveiller' && /relance/.test(S('echu').pourquoi.join()) && S('interne').cle === 'hors' && S('pose').cle === 'hors'
      && S("pi'ege").cle === 'risque' && /lecture impossible/.test(S("pi'ege").pourquoi.join());
  },
  filtres(cli) {
    const M = monterCli(cli), L = jeu(), F = e => M.filtrer(L, Object.assign({ filtre: 'tous', q: '' }, e)).map(c => c.slug).join(',');
    const n = M.compteFiltres(L);
    return F({ filtre: 'abonnes' }) === "bonne,retard,silence,incid,pi'ege" && F({ filtre: 'essais' }) === 'echu' && F({ filtre: 'ainstaller' }) === 'pose'
      && F({ filtre: 'interne' }) === 'interne' && F({ q: 'berard' }) === 'incid' && F({ q: 'marc@' }) === 'echu' && n.tous === 8 && n.abonnes === 5;
  },
  tri(cli) {
    const M = monterCli(cli), L = jeu(), T = e => M.trier(L, Object.assign({ filtre: 'tous', q: '', tri: 'sante', sens: 1 }, e), NOW, 14).map(c => c.slug);
    const s = T({}), du = T({ tri: 'du' }), nom = T({ tri: 'nom', sens: -1 });
    return ['retard', 'silence', "pi'ege"].indexOf(s[0]) >= 0 && s.indexOf('bonne') > s.indexOf('incid') && s.slice(-2).sort().join() === 'interne,pose'
      && du[0] === 'retard' && nom[nom.length - 1] === 'retard';
  },
  dessin(cli) {
    const M = monterCli(cli), d = D();
    Object.assign(M.E, { filtre: 'tous', q: '', tri: 'sante', sens: 1, ouvert: 'echu', onglet: 'ensemble' });
    const h = M.vue(d);
    Object.assign(M.E, { ouvert: 'bonne' });
    const h2 = M.vue(d);
    return h.indexOf('<img onerror') === -1 && h.indexOf('Piège &lt;img onerror=x&gt;') !== -1 && h.indexOf("agtCliOuvrir('pi&#39;ege')") !== -1 && h.indexOf("('pi'ege')") === -1
      && h.indexOf('value="marc@lerouge.fr"') !== -1 && h.indexOf("agtRelanceEssai('echu')") !== -1 && /adress\\u00e9 à marc@lerouge\.fr|adressé à marc@lerouge\.fr/.test(h)
      && h2.indexOf('agtRelanceEssai(') === -1 && h.indexOf('aria-sort="ascending"') !== -1;
  },
  relanceJours(cli, gt) {
    const M = monterGt(gt);
    const exp = n => NOW - n * J;
    return M.J === 15 && M._agtRelanceEssaiJours({ trialExp: exp(16) }, NOW) === 16 && M._agtRelanceEssaiJours({ trialExp: exp(14) }, NOW) === -1
      && M._agtRelanceEssaiJours({ trialExp: new Date(exp(20)).toISOString() }, NOW) === 20 && M._agtRelanceEssaiJours({ trialExp: exp(30), trialRenewals: 1 }, NOW) === -1
      && M._agtRelanceEssaiJours({ trialExp: exp(30), relanceFaite: '2026-11-01' }, NOW) === -1 && M._agtRelanceEssaiJours({}, NOW) === -1;
  },
  adresse(cli, gt) {
    const M = monterGt(gt, { a: { contact: { email: 'marc@lerouge.fr' } }, b: { contact: { email: 'pas une adresse' } }, c: { contact: { email: 'x@y.fr?cc=pirate@z.fr' } }, d: { contact: { email: 'x@evil.com?bcc=moi.fr' } }, e: { contact: { email: 'jean.dupont+vigne@domaine-du-clos.fr' } } });
    return M._agtContactEmail('a') === 'marc@lerouge.fr' && M._agtContactEmail('b') === '' && M._agtContactEmail('c') === '' && M._agtContactEmail('d') === '' && M._agtContactEmail('e') === 'jean.dupont+vigne@domaine-du-clos.fr' && M._agtContactEmail('zz') === ''
      && /essai de Ma Vigne s’est terminé|essai de Ma Vigne s\u2019est termin\u00e9/.test(M._agtRelanceEssaiTexte('X').corps);
  }
};
const LIB = {
  sante: '★★★ la santé et ses raisons : à risque (critique, retard, silence d’un abonné, lecture impossible), à surveiller (incident, relance à faire), bonne ; interne et à installer hors santé',
  filtres: '★★ les filtres par statut et la recherche (domaine, slug, contact)',
  tri: '★★ le tri par santé — à risque d’abord, hors santé à la fin — et sur chaque colonne',
  dessin: '★★★ le dessin : un nom piégé reste du texte, un slug piégé ne casse pas le gestionnaire, le contact pré-rempli, la relance seulement si elle est due',
  relanceJours: '★★ la relance d’essai : due quinze jours après la fin, jamais si l’essai a été reconduit ou si elle est faite',
  adresse: '★★ le brouillon n’est adressé qu’à une adresse valide — une adresse piégée (« ?cc= ») ne passe pas'
};
function statiques(S) {
  const r = [];
  const br = fonction(S.gt, 'agtBizRelance'), re = fonction(S.gt, 'agtRelanceEssai');
  const sansEnvoi = c => !/fbGtMaj\(|collection\(|fetch\(|httpsCallable|MAIL_COLLECTION/.test(c);
  r.push([/window\.location\.href=href;/.test(br) && /var href='mailto:'\+_agtContactEmail\((?:t|r)\.slug\)\+'\?subject='/.test(br) && sansEnvoi(br), '★★★ la relance de facture n’ouvre qu’un BROUILLON (mailto), adressé au contact — rien ne part sans « Envoyer »']);
  r.push([/window\.location\.href='mailto:'\+_agtContactEmail\(slug\)\+'\?subject='/.test(re) && sansEnvoi(re) && re.indexOf('_agtCliNoter(') !== -1, '★★★ la relance d’essai n’ouvre qu’un BROUILLON, et se note préparée (Annuler la retire)']);
  const tw = S.cl.slice(S.cl.indexOf('// ③ J+15 sec'), S.cl.indexOf('} catch (e) {', S.cl.indexOf('// ③ J+15 sec')));
  r.push([tw.length > 0 && tw.indexOf('to: [GT_EMAIL]') !== -1 && !/to:\s*\[who\.email\]/.test(tw) && tw.indexOf('Relance \\u00e0 faire') !== -1, '★★★ le serveur ne relance plus le client : il prévient Nicolas, « Relance à faire » (trialWatch)']);
  const nServ = /const TRIAL_RELANCE_D = (\d+);/.exec(S.cl), nCons = /var _AGT_RELANCE_ESSAI_J = (\d+);/.exec(S.gt);
  r.push([nServ && nCons && nServ[1] === nCons[1], 'la console et le serveur comptent le même délai (' + (nCons && nCons[1]) + ' jours)']);
  r.push([/if\(st\.cle==='echu'\)\{\n\s*var _rj=_agtRelanceEssaiJours\(_agtCli\(t\.slug\)\);/.test(fonction(S.gt, '_agtBizTodoRows')) && fonction(S.gt, '_agtBizTodoRows').indexOf("agtRelanceEssai(\\''+_escAttr(t.slug)+'\\')") !== -1, '« À traiter » propose la relance d’un essai échu']);
  r.push([/await _agtCliNoter\(slug, function\(y\)\{ y\.contact=x; \}\);/.test(S.gt) && /var r=await _agtMajRegistre\(function\(clients\)\{/.test(fonction(S.gt, '_agtCliNoter')) && /if\(x\.email && !_agtEmailValide\(x\.email\)\)/.test(S.gt),
    '★ le contact s’enregistre en transaction (le registre de GTFIX-1), une adresse invalide refusée']);
  r.push([/return window\._agtClientsVue \? window\._agtClientsVue\(window\._agtCliDonnees\(\)\) : '';/.test(fonction(S.gt, '_agtBuildClients')) && !/agtToggleTenant|_agtExpandedT|function _agtCnxBadge/.test(S.gt), 'l’onglet Clients dessine le tableau de src/gt/clients.js ; les cartes dépliables sont parties']);
  r.push([/window\._agtCliDonnees = function\(\)\{/.test(S.gt) && /if\(window\.agtCliOuvrir\) window\.agtCliOuvrir\(slug\);/.test(fonction(S.gt, 'agtGoClient')), 'la console expose ce que l’écran lit ; « Fiche » du Radar ouvre la fiche du tableau']);
  r.push([/import '\.\/gt\/incidents\.js';[^\n]*\nimport '\.\/gt\/clients\.js';/.test(S.entree), 'gt.js charge l’écran Clients']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · l’écran et les relances, sur des clients ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.cli, SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · le câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}
const okC = [], koC = [];
function mord(titre, fichier, ancre, remplace, essai) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const S2 = Object.assign({}, SRC, { [fichier]: SRC[fichier].replace(ancre, remplace) });
  let detecte;
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.cli, S2.gt); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ le serveur relance de nouveau le client', 'cl', "          await db.collection(MAIL_COLLECTION).add({\n            to: [GT_EMAIL],\n            message: _trialMailNico('\\u{1F4EC} Relance \\u00e0 faire", "          await db.collection(MAIL_COLLECTION).add({ to: [who.email], message: proposee });\n          await db.collection(MAIL_COLLECTION).add({\n            to: [GT_EMAIL],\n            message: _trialMailNico('\\u{1F4EC} Relance \\u00e0 faire", 'statiques');
mord('★★★ la relance d’essai part d’elle-même', 'gt', "  try{ window.location.href='mailto:'+_agtContactEmail(slug)+", "  try{ fetch('/envoyer-la-relance'); window.location.href='mailto:'+_agtContactEmail(slug)+", 'statiques');
mord('★★ un retard ne met plus à risque', 'cli', "  if (c.retard > 0) r.push(", "  if (false) r.push(", 'sante');
mord('★★ une lecture impossible passe pour bonne santé', 'cli', "  if (c.echecs && c.echecs.length) r.push('lecture impossible');\n", '', 'sante');
mord('★ le filtre Essais oublie les essais échus', 'cli', "!(c.statut === 'essai' || c.statut === 'echu')", "!(c.statut === 'essai')", 'filtres');
mord('★★ le tri par santé ne met plus le risque en tête', 'cli', "return [h.rang, -h.pourquoi.length, -(c.du || 0), plier(c.nom)];", "return [plier(c.nom)];", 'tri');
mord('★★★ un nom piégé s’affiche tel quel', 'cli', "'<td class=\"agt-tbl-titre\"><span class=\"agt-tbl-msg\">' + esc(c.nom)", "'<td class=\"agt-tbl-titre\"><span class=\"agt-tbl-msg\">' + (c.nom)", 'dessin');
mord('★★ la relance d’essai est due tout de suite', 'gt', "  return (j>=_AGT_RELANCE_ESSAI_J) ? j : -1;", "  return (j>=0) ? j : -1;", 'relanceJours');
mord('★★ une relance faite revient', 'gt', "  if(!exp || (c.trialRenewals>0) || c.relanceFaite) return -1;", "  if(!exp || (c.trialRenewals>0)) return -1;", 'relanceJours');
mord('★★ une adresse piégée adresse le brouillon', 'gt', "function _agtContactEmail(slug){ var c=(_agtCli(slug)||{}).contact||{}; return _agtEmailValide(c.email) ? String(c.email) : ''; }", "function _agtContactEmail(slug){ var c=(_agtCli(slug)||{}).contact||{}; return String(c.email||''); }", 'adresse');
mord('★★ « ?bcc= » repasse dans une adresse', 'gt', "/^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$/", "/^[^\\s@]+@[^\\s@]+\\.[A-Za-z]{2,}$/", 'adresse');
mord('★ la console et le serveur divergent sur le délai', 'gt', "var _AGT_RELANCE_ESSAI_J = 15;", "var _AGT_RELANCE_ESSAI_J = 10;", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
