// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-5 — FACTURATION ET LEADS SUR LA MAQUETTE (§520)
// ═══════════════════════════════════════════════════════════
//  La maquette v1 : la Facturation — quatre chiffres, les encaissements en
//  barres (date de paiement ou de facture), toutes les factures en tableau, la
//  fiche d'une facture avec le paiement saisi sur place et la relance en aperçu
//  (un brouillon) ; les Leads — en colonnes par statut ou en tableau, une fiche.
//  L'argent ne se calcule PAS dans l'écran : il vient du moteur de GTFIX-3.
//
//  Sur les VRAIES fonctions de src/gt/facturation.js et src/gt/leads.js ; le
//  câblage lu dans admin-gt.js et gt.js.
//
//  Usage :  node scripts/mv-harnais-gtui5.mjs
//           node scripts/mv-harnais-gtui5.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { fac: lire('src/gt/facturation.js'), lea: lire('src/gt/leads.js'), gt: lire('src/admin-gt.js'), entree: lire('src/gt.js') };
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
const monter = (src, ret) => new Function(src.slice(0, src.indexOf("// ── Les gestes de l'écran")).replace(/^export (var|function) /gm, '$1 ') + '\nreturn {' + ret + '};')();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const F = (o) => Object.assign({ i: 0, k: 0, slug: 'clos', client: 'Clos', ref: 'MV-2026-0001', type: 'abo', typeLbl: 'Abonnement', libelle: '', date: '2026-10-01', echeance: '2026-10-31', montant: 79, reste: 79, statut: 'emise', retardJ: 0, payeLe: '', mode: '', modeLbl: '', per: '', interne: false, supprime: false }, o);
const JEU = () => [
  F({ k: 0, ref: 'MV-2026-0021', client: 'Château Fontrouge', slug: 'fontrouge', type: 'inst', montant: 990, reste: 495, retardJ: 12, date: '2026-09-20' }),
  F({ k: 1, ref: 'MV-2026-0021', client: 'Château Fontrouge', slug: 'fontrouge', type: 'geste', montant: -495, reste: 0, date: '2026-09-20', statut: 'applique' }),
  F({ k: 2, ref: 'MV-2026-0025', client: 'Domaine des Tilleuls', slug: 'tilleuls', date: '2026-11-01' }),
  F({ k: 3, ref: 'MV-2026-0022', client: 'Domaine des Tilleuls', slug: 'tilleuls', statut: 'payee', reste: 0, payeLe: '2026-10-09', date: '2026-10-01' }),
  F({ k: 4, ref: 'MV-2026-0030', client: "Piège <img onerror=x>", slug: "pi'ege", date: '2026-08-01', reste: 120, montant: 120 })
];
const ESSAIS = {
  pastilles(fac) {
    const M = monter(fac, 'pastille'), L = JEU();
    return M.pastille(L[0]).label === 'En retard de 12 j' && M.pastille(L[1]).cle === 'avoir' && M.pastille(L[2]).cle === 'aencaisser'
      && M.pastille(L[3]).cle === 'payee' && M.pastille(F({ reste: 0 })).cle === 'soldee' && /mvpas-retard/.test(M.pastille(L[0]).classe);
  },
  filtres(fac) {
    const M = monter(fac, 'filtrer'), L = JEU(), q = e => M.filtrer(L, Object.assign({ filtre: 'toutes', client: '', q: '' }, e)).map(f => f.k).join('');
    return q({}) === '01234' && q({ filtre: 'aencaisser' }) === '024' && q({ filtre: 'retard' }) === '0' && q({ filtre: 'payees' }) === '3' && q({ filtre: 'avoirs' }) === '1'
      && q({ client: 'tilleuls' }) === '23' && q({ q: 'fontrouge' }) === '01' && q({ q: 'mv-2026-0025' }) === '2';
  },
  tri(fac) {
    const M = monter(fac, 'trier'), L = JEU(), t = e => M.trier(L, Object.assign({ sens: 1 }, e)).map(f => f.k);
    const d = t({ tri: 'date' }), r = t({ tri: 'reste' }), dInv = t({ tri: 'date', sens: -1 });
    return d[0] === 2 && d[d.length - 1] === 4 && dInv[0] === 4 && r[0] === 0 && r[1] === 4 && t({ tri: 'montant' })[0] === 0;
  },
  barres(fac) {
    const M = monter(fac, 'hauteurs'), h = M.hauteurs([0, 79, 1068, 10, 0]);
    return h[0] === 0 && h[2] === 100 && h[1] === 7 && h[3] === 4 && h.length === 5 && M.hauteurs([0, 0]).every(x => x === 0);
  },
  dessin(fac) {
    const M = monter(fac, 'vue, E'), L = JEU();
    const d = { factures: L, an: 2026, annees: [2026, 2025], moisPaiement: [79, 79, 574, 158, 158, 653, 237, 1068, 158, 158, 0, 0], moisFacture: [0,0,0,0,0,0,0,0,0,0,0,0],
      kpis: { mrr: 272.83, du: 702, retard: 544, ech30: 158 }, clients: [{ i: 0, slug: 'fontrouge', nom: 'Château Fontrouge', ty: 'abo' }], types: [['abo', 'Abonnement']],
      avoirsDe: () => -495, relance: () => ({ txt: 'Bonjour, il reste 495 € <b>', dest: 'compta@fontrouge.fr' }), cible: () => '', cibles: () => [],
      modes: { virement: 'Virement' }, prochaine: 'MV-2026-0031', arme: '', aujourdhui: '2026-11-03', esc, eur: v => v + ' €', dateFr: x => x, nombre: v => String(Math.round(v)) };
    Object.assign(M.E, { ouvert: '0:0', nouvelle: -2 });
    const h = M.vue(d);
    return h.indexOf('<img onerror') === -1 && h.indexOf('Piège &lt;img onerror=x&gt;') !== -1 && h.indexOf('id="agt-paie-date"') !== -1 && h.indexOf('id="agt-paie-mode"') !== -1
      && h.indexOf('onclick="_agtPaieValider(0,0)"') !== -1 && h.indexOf('Enregistrer le paiement de 495 €') !== -1 && h.indexOf('Bonjour, il reste 495 € &lt;b&gt;') !== -1
      && h.indexOf('onclick="agtBizRelance(0,0)"') !== -1 && h.indexOf('adressé à compta@fontrouge.fr') !== -1 && h.indexOf('<b>495 €</b>') !== -1 && h.indexOf('Net</dt><dd><b>495 €</b>') !== -1
      && h.indexOf("agtFacOuvrir('0:4')") !== -1 && h.indexOf('>1068<') !== -1;
  },
  leads(fac, lea) {
    const M = monter(lea, 'ranger, sousTitre, chercher, vue, E');
    const L = [{ _id: 'a', domaine: 'Château Lamothe', region: 'Gironde', surface: 38, createdAt: new Date(Date.parse('2026-11-03T10:00:00Z') - 20 * 3600e3).toISOString(), st: 'nouveau' },
      { _id: 'b', domaine: 'EARL des Coteaux', commune: 'Mâcon', surface: 16, createdAt: '2026-10-16T10:00:00Z', st: 'repondu', note: 'Rappeler après les vendanges' },
      { _id: "c'x", domaine: '<script>', st: 'inconnu' }];
    const c = M.ranger(L), st = M.sousTitre(L[0], Date.parse('2026-11-03T10:00:00Z'));
    Object.assign(M.E, { vue: 'colonnes', ouvert: 'b', q: '' });
    const h = M.vue({ leads: L, st: { nouveau: 'Nouveau', repondu: 'Répondu', mer: 'Mise en route', installe: 'Installé', perdu: 'Sans suite' }, esc, dateFr: x => x || '—' });
    return c.nouveau.length === 2 && c.repondu.length === 1 && st === 'Gironde · 38 ha · reçu il y a 20 h' && M.chercher(L, 'macon').length === 1
      && h.indexOf('<script>') === -1 && h.indexOf("agtLeadsOuvrir('c&#39;x')") !== -1 && h.indexOf("agtLeadSet('b','installe')") !== -1 && h.indexOf("agtLeadMail('b')") !== -1;
  }
};
const LIB = {
  pastilles: '★★ la pastille d’une ligne : en retard (ses jours), à encaisser, payée, soldée, avoir appliqué',
  filtres: '★★ les filtres (toutes, à encaisser, en retard, payées, avoirs), le client, la recherche',
  tri: '★ le tri : la date d’abord (la plus récente), le reste dû, le montant, dans les deux sens',
  barres: '★ les barres : à l’échelle du plus haut mois, un mois à zéro garde un trait, une petite valeur reste visible',
  dessin: '★★★ la fiche d’une facture : le reste dû, l’avoir déduit, le paiement saisi sur place (les champs de GTFIX-3), la relance en aperçu — et un nom piégé reste du texte',
  leads: '★★ les Leads : les colonnes par statut, ce qu’on dit d’une demande, la recherche, la fiche — et une demande piégée reste du texte'
};
function statiques(S) {
  const r = [], rb = fonction(S.gt, 'agtRenderBody');
  r.push([/window\._agtFacturationVue \? window\._agtFacturationVue\(window\._agtFacDonnees\(\)\)/.test(rb) && /window\._agtLeadsVue \? window\._agtLeadsVue\(window\._agtLeadsDonnees\(\)\)/.test(rb), 'Facturation et Leads dessinés par leurs écrans neufs']);
  r.push([!/function _agtBuildBusiness|function _agtBuildLeads|function _agtBizCard|function _agtBizG1|var _agtLeadFilter/.test(S.gt), '★ les anciens écrans sont partis (une fonction morte est une invitation)']);
  const fd = S.gt.slice(S.gt.indexOf('window._agtFacDonnees = function(){'), S.gt.indexOf('window._agtLeadsDonnees = function(){'));
  r.push([fd.indexOf('_agtRefReste(x.t.slug, f.ref)') !== -1 && fd.indexOf('_agtFEncInfo(x.t.slug, f)') !== -1 && fd.indexOf('_agtBizMois(an)') !== -1 && fd.indexOf('_agtBizLignes(0)') !== -1,
    '★★★ l’argent vient du moteur de GTFIX-3 (reste dû, encaissé au règlement, domaines supprimés) — rien recalculé dans l’écran']);
  r.push([/function _agtRelanceFacture\(i,k\)\{/.test(S.gt) && /var r=_agtRelanceFacture\(i,k\); if\(!r\) return;/.test(fonction(S.gt, 'agtBizRelance')) && fd.indexOf('relance:function(i,k){ return _agtRelanceFacture(i,k); }') !== -1,
    '★★ l’aperçu de la relance et le brouillon disent la même chose (un seul texte)']);
  r.push([/onclick="_agtPaieValider\(' \+ f\.i \+ ',' \+ f\.k \+ '\)"/.test(S.fac) && /id="agt-paie-date"/.test(S.fac) && /id="agt-paie-mode"/.test(S.fac) && /id="agt-paie-err"/.test(S.fac), '★★ le paiement se saisit dans la fiche, par la validation de GTFIX-3 (date réelle, mode)']);
  r.push([/onclick="agtFactAdd\(' \+ i \+ '\)"/.test(S.fac) && /id="agt-biz-sg' \+ i \+ '"/.test(S.fac) && ['ref', 'dat', 'ech', 'per', 'mnt', 'lib', 'cw'].every(x => S.fac.indexOf('id="agt-biz-' + x + "' + i + '\"") !== -1),
    'une nouvelle facture passe par le formulaire et l’enregistrement d’avant (agtFactAdd, numérotation continue)']);
  r.push([/if\(tab==='business'\) return '<button class="agt-tete-principal" onclick="agtFacNouvelle\(-1\)">/.test(S.gt), '« Nouvelle facture » dans l’en-tête, comme la maquette']);
  r.push([['agtBizAbo', 'agtBizInterne', 'agtBizRattache', 'agtBizPer', 'agtBizRecap', 'agtFactDel', 'agtBizReleve'].every(g => S.fac.indexOf('onclick="' + g + '(') !== -1 || S.fac.indexOf('onchange="' + g + '(') !== -1),
    '★ aucun geste perdu : tarif, interne, rattacher une remise, périodicité, récapitulatif, supprimer, relevé']);
  r.push([/import '\.\/gt\/facturation\.js';[^\n]*\nimport '\.\/gt\/leads\.js';/.test(S.entree), 'gt.js charge les deux écrans']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · les deux écrans, sur des données ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.fac, SRC.lea); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.fac, S2.lea); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★ une facture soldée par un avoir passe « à encaisser »', 'fac', "  if (!(f.reste > 0)) return { cle: 'soldee'", "  if (false) return { cle: 'soldee'", 'pastilles');
mord('★★ « À encaisser » oublie les retards', 'fac', "!(p === 'aencaisser' || p === 'retard')", "!(p === 'aencaisser')", 'filtres');
mord('★ le tri par date oublie le plus récent d’abord', 'fac', "if (e.tri === 'date') return [-(Date.parse(f.date) || 0), String(f.ref)];", "if (e.tri === 'date') return [(Date.parse(f.date) || 0), String(f.ref)];", 'tri');
mord('★ une petite valeur disparaît des barres', 'fac', "Math.max(4, Math.round(v / max * 100))", "Math.round(v / max * 100)", 'barres');
mord('★★★ un nom de client piégé s’affiche tel quel', 'fac', "<td class=\"agt-tbl-titre\"><span class=\"agt-tbl-msg\">' + esc(f.client)", "<td class=\"agt-tbl-titre\"><span class=\"agt-tbl-msg\">' + (f.client)", 'dessin');
mord('★★ le paiement réclame le montant brut', 'fac', "'Enregistrer le paiement de ' + esc(eur(f.reste))", "'Enregistrer le paiement de ' + esc(eur(f.montant))", 'dessin');
mord('★★★ l’écran recalcule le reste dû lui-même', 'gt', "var reste=(ty==='geste')?0:_agtRefReste(x.t.slug, f.ref);", "var reste=(ty==='geste')?0:(Number(f.montant)||0);", 'statiques');
mord('★★ la relance a deux textes', 'gt', "relance:function(i,k){ return _agtRelanceFacture(i,k); }", "relance:function(i,k){ return { txt:'Bonjour' }; }", 'statiques');
mord('★★ une demande inconnue sort des colonnes', 'lea', "(c[COLONNES.indexOf(l.st) >= 0 ? l.st : 'nouveau']).push(l);", "if (c[l.st]) c[l.st].push(l);", 'leads');
mord('★ le geste « Rattacher » se perd', 'fac', "onchange=\"agtBizRattache(", "onchange=\"agtBizRattacheX(", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
