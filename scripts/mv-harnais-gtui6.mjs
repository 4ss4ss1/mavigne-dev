// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-6 — « SANTÉ DU SYSTÈME », LA RELANCE D'UN LEAD À SA DATE (§521)
// ═══════════════════════════════════════════════════════════
//  La maquette v1 : l'écran « Santé du système » — l'état écrit par les tâches
//  planifiées elles-mêmes (sauvegarde, export, E-Phy, e-mails), les versions du
//  parc, « Avant le déploiement général ». Nico (03/11) : la relance d'un lead à
//  sa date — un mail à LUI, la ligne au Radar ; rien ne part chez le prospect.
//
//  Sur les VRAIES fonctions (sante.js : etatTache, parc ; leads.js : la pastille ;
//  admin-gt.js : _agtLeadRelanceRetard) ; le câblage lu dans les sources, côté
//  console ET côté serveur (functions/sante.js, index.js, ephy.js, claims.js).
//
//  Usage :  node scripts/mv-harnais-gtui6.mjs
//           node scripts/mv-harnais-gtui6.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { sa: lire('src/gt/sante.js'), lea: lire('src/gt/leads.js'), gt: lire('src/admin-gt.js'), html: lire('src/gt/console.html'), co: lire('src/gt/coquille.js'), entree: lire('src/gt.js'),
  fsa: lire('functions/sante.js'), fix: lire('functions/index.js'), fep: lire('functions/ephy.js'), fcl: lire('functions/claims.js') };
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
const monterSa = sa => new Function(sa.slice(0, sa.indexOf('window._agtSanteVue')).replace(/^export (var|function) /gm, '$1 ') + '\nreturn { etatTache, parc, vue, TACHES };')();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOW = Date.parse('2026-11-03T09:00:00Z'), H = h => new Date(NOW - h * 3600000).toISOString();
const ESSAIS = {
  taches(sa) {
    const M = monterSa(sa);
    return M.etatTache(null, 26, NOW).cle === 'attente' && M.etatTache({ quand: H(5), ok: true }, 26, NOW).cle === 'ok' && M.etatTache({ quand: H(30), ok: true }, 26, NOW).cle === 'attention'
      && M.etatTache({ quand: H(1), ok: false }, 26, NOW).cle === 'alerte' && M.etatTache({ quand: H(3), ok: true }, 2, NOW).cle === 'attention';
  },
  parc(sa) {
    const M = monterSa(sa);
    const p = M.parc([{ nom: 'Tilleuls', appareils: { a: { v: '10.59', f: 4 }, b: { v: '10.57', f: 4 }, c: { v: '8.39', f: 2 } } }, { nom: 'Vide', appareils: {} }, { nom: 'Clos', appareils: { d: { v: '10.60', f: 4 } } }], '10.59', 4);
    return p.tot.n === 4 && p.tot.aJour === 2 && p.tot.retard === 1 && p.tot.bloques === 1 && p.lignes.length === 2 && p.versions[0].v === '10.60' && p.versions[p.versions.length - 1].v === '8.39' && p.versions[p.versions.length - 1].bloque;
  },
  dessin(sa) {
    const M = monterSa(sa);
    const h = M.vue({ sante: { sauvegarde: { quand: H(7), ok: true, detail: 'export lancé · gardé 7 jours' }, ephy: { quand: H(1), ok: false, detail: 'échec : <script>' }, mails: { quand: H(1), ok: true, dernier: H(3), detail: 'rien en attente' } },
      version: '10.59', format: 4, domaines: [{ nom: 'Clos <b>', appareils: { a: { v: '8.39', f: 2 } } }], esc, relTime: x => 'il y a 2 h' });
    return h.indexOf('<script>') === -1 && h.indexOf('échec : &lt;script&gt;') !== -1 && h.indexOf('Clos &lt;b&gt;') !== -1 && h.indexOf('agt-sante-bloc alerte') !== -1 && h.indexOf('en attente du premier passage') !== -1
      && h.indexOf('dernier envoi il y a 2 h') !== -1 && h.indexOf('non : 1 appareil') !== -1;
  },
  relance(sa, lea, gt) {
    const R = new Function(fonction(gt, '_agtLeadRelanceRetard') + '\nreturn _agtLeadRelanceRetard;')();
    const now = Date.parse('2026-11-03T12:00:00');
    const P = new Function(lea.slice(lea.indexOf('export function relancePastille'), lea.indexOf('export function chercher')).replace(/^export function /gm, 'function ') + '\nreturn relancePastille;')();
    return R({ relance: '2026-10-26', st: 'repondu' }, now) === 8 && R({ relance: '2026-11-03', st: 'nouveau' }, now) === 0 && R({ relance: '2026-11-10', st: 'nouveau' }, now) === -1
      && R({ relance: '2026-10-01', st: 'installe' }, now) === -1 && R({ relance: '2026-10-01', st: 'perdu' }, now) === -1 && R({}, now) === -1
      && /Relance en retard de 8 jours/.test(P({ relance: '2026-10-26', st: 'repondu', retard: 8 })) && /Relancer le 10\/11/.test(P({ relance: '2026-11-10', st: 'nouveau', retard: -1 })) && P({ relance: '2026-10-01', st: 'perdu', retard: 30 }) === '';
  }
};
const LIB = {
  taches: '★★ l’état d’une tâche : en attente (jamais passée), bonne, en retard sur son rythme, en échec',
  parc: '★★ le parc : à jour, en retard, bloqué (format trop ancien) — par domaine et par version',
  dessin: '★★ l’écran : un détail ou un nom piégé reste du texte, l’échec et l’attente se disent, le dernier envoi des e-mails, l’appareil bloqué nommé',
  relance: '★★★ la relance d’un lead : due à sa date, en retard de ses jours, jamais pour une demande installée ou sans suite'
};
function statiques(S) {
  const r = [];
  r.push([/async function noterSante\(nom, etat\)/.test(S.fsa) && /\} catch \(err\) \{\n\s*logger\.warn\('\[sante\] '/.test(S.fsa) && /'_guerettech\/sante'/.test(S.fsa) && /\{ merge: true \}/.test(S.fsa),
    '★★★ noter l’état ne fait jamais échouer la tâche (une écriture ratée se dit, et c’est tout), fusionné dans _guerettech/sante']);
  r.push([/noterSante\('sauvegarde', \{ ok: true/.test(S.fix) && /noterSante\('sauvegarde', \{ ok: false/.test(S.fix) && /noterSante\('export', \{ ok: ok === tenantCols\.length/.test(S.fix)
    && /noterSante\('ephy', \{ ok: true/.test(S.fep) && /noterSante\('ephy', \{ ok: false/.test(S.fep) && /async \(\) => \{ await _syncEtNoter\(\); \}/.test(S.fep)
    && /await noterSante\('mails', \{\n\s*ok: !stuck\.length,/.test(S.fcl), '★★ chaque tâche planifiée écrit son passage : sauvegarde, export, E-Phy (et la synchro à la main), e-mails — l’échec aussi']);
  const tw = S.fcl.slice(S.fcl.indexOf('LA RELANCE D\'UN LEAD À SA DATE'), S.fcl.indexOf("logger.info('[trialWatch] ' + Object.keys(clients).length"));
  r.push([tw.length > 0 && /to: \[GT_EMAIL\]/.test(tw) && !/to: \[(?!GT_EMAIL)/.test(tw) && /e2\.relanceVue !== e2\.relance/.test(tw) && /relanceVue: val\[id\]\.relance/.test(tw) && /e2\.st !== 'installe' && e2\.st !== 'perdu'/.test(tw),
    '★★★ la relance d’un lead : un mail à NICOLAS seulement, une fois par date, jamais pour une demande close']);
  r.push([/var _AUTRES=\[[^\]]*'sante'\]/.test(S.gt) && /_agtSante = \(GT\.sante && typeof GT\.sante==='object'\) \? GT\.sante : \{\};/.test(S.gt) && fonction(S.gt, '_agtRadarSante').indexOf("_agtSante[cle]") !== -1,
    'la console lit l’état des tâches ; la carte du Radar le montre (fini « leur état arrive avec GT-UI-6 »)']);
  r.push([/data-tab="sante" onclick="agtSwitchTab\('sante'\)"/.test(S.html) && /sante: 'sante'/.test(S.co) && /if\(tb==='sante'\)\s+body\.innerHTML=ban\+\(window\._agtSanteVue/.test(fonction(S.gt, 'agtRenderBody')) && /import '\.\/gt\/sante\.js';/.test(S.entree),
    'l’écran « Santé du système » : la barre latérale, l’onglet du téléphone, #sante, le rendu']);
  r.push([/async function agtLeadRelance\(id, date\)\{/.test(S.gt) && /if\(await _agtSaveLeadSt\(id\)\)\{ showToast\(date\?/.test(S.gt) && /id="agt-lead-rel"/.test(S.lea),
    '★ « Relancer le » se saisit dans la fiche d’une demande, par l’écriture de fiche de GTFIX-1']);
  r.push([fonction(S.gt, '_agtRadarRows').indexOf('_agtLeadRelanceRetard(') !== -1 && fonction(S.gt, '_agtRadarRows').indexOf("ty:'Lead'") !== -1, '★★ une relance de lead due remonte au Radar, même pour un lead « Répondu »']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · la santé et les relances, sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.sa, SRC.lea, SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · le câblage, console et serveur ──');
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.sa, S2.lea, S2.gt); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★ une tâche en échec passe pour bonne', 'sa', "  if (e.ok === false) return { cle: 'alerte', label: '\\u00e9chec' };\n", '', 'taches');
mord('★★ un appareil bloqué compte « à jour »', 'sa', "      if (bloque) l.bloques++;\n      else if", "      if (false) l.bloques++;\n      else if", 'parc');
mord('★★ un détail piégé s’affiche tel quel', 'sa', "<span>' + esc(detail) + '</span>'", "<span>' + (detail) + '</span>'", 'dessin');
mord('★★★ une demande sans suite se relance encore', 'gt', "  if(!e.relance || e.st==='installe' || e.st==='perdu') return -1;", "  if(!e.relance) return -1;", 'relance');
mord('★★★ noter l’état fait échouer la tâche', 'fsa', "  } catch (err) {\n    logger.warn('[sante] '", "  } catch (err) { throw err;\n    logger.warn('[sante] '", 'statiques');
mord('★★★ la relance d’un lead part chez le prospect', 'fcl', "          await db.collection(MAIL_COLLECTION).add({ to: [GT_EMAIL], message: {", "          await db.collection(MAIL_COLLECTION).add({ to: [e2.email], message: {", 'statiques');
mord('★★ la même relance se signale chaque matin', 'fcl', " && e2.relanceVue !== e2.relance;", ";", 'statiques');
mord('★ la sauvegarde ratée ne se dit plus', 'fix', "      await noterSante('sauvegarde', { ok: false, detail: 'échec : ' + ((err && err.message) || String(err)) });\n", '', 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
