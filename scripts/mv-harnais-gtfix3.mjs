// ═══════════════════════════════════════════════════════════
//  HARNAIS GTFIX-3 — L'ARGENT JUSTE (§512)
// ═══════════════════════════════════════════════════════════
//  L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) :
//   GT-B08 — l'encaissé rangé à la date de FACTURE (le livre des recettes suit la
//            date où l'argent arrive) ; la date du paiement = celle du clic ;
//   GT-B09 — la relance, « À traiter », les retards au montant BRUT (990 € au lieu
//            de 495 € après l'offre de lancement) ;
//   GT-B10 — un domaine supprimé sorti des totaux, de l'export, de la numérotation ;
//   GT-B13 — un abonnement annuel « à émettre » tous les mois ;
//   GT-B14 — un domaine sans fiche commerciale compté abonné.
//  Décision D6 (01/11) : la console produit le livre des recettes.
//
//  Sur les VRAIES fonctions du moteur de facturation de src/admin-gt.js, jouées
//  sur un jeu de factures chiffré, à une date fixée (le 1er novembre 2026) :
//  aucun harnais ne couvrait ce moteur avant ce lot.
//
//  Usage :  node scripts/mv-harnais-gtfix3.mjs
//           node scripts/mv-harnais-gtfix3.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const GT = readFileSync(new URL('../src/admin-gt.js', import.meta.url), 'utf8');

/* ══ EXTRACTION ══ */
function fonction(src, nom) {
  const m = new RegExp('^(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function ligneVar(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=[^\\n]*;', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE : ' + nom);
  return m[0];
}
function blocVar(src, nom) {
  const m = new RegExp('^var ' + nom + '\\s*=\\s*\\{', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, src.indexOf(';', j) + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
const FN = ['_agtEur', '_agtD', '_agtDateFr', '_agtCli', '_agtEmailValide', '_agtContactEmail', '_agtPlan', '_agtStatutOf', '_agtFacts', '_agtFType', '_agtIso', '_agtJours',
  '_agtFEch', '_agtFRetard', '_agtFAn', '_agtInterne', '_agtRefEtat', '_agtFVent', '_agtFPayeLe', '_agtRefReglement', '_agtFEncInfo',
  '_agtRefReste', '_agtBizSlugs', '_agtPaieDateErr', '_agtAboProchain', '_agtBizDu', '_agtBizEnc', '_agtBizFactTot', '_agtBizAnnee',
  '_agtBizLignes', '_agtBizMois', '_agtBizTodoRows', '_agtLivreLignes', 'agtBizLivre', 'agtBizCsv', '_agtBizNextRef',
  '_agtAboRemise', '_agtAboPrix', 'agtBizRelance'];
function bloc(src) {
  return [blocVar(src, '_AGT_TY'), ligneVar(src, '_AGT_INST'), ligneVar(src, '_AGT_ECH_J'), ligneVar(src, '_AGT_PRIX'), ligneVar(src, '_AGT_MODES')]
    .concat(FN.map(n => fonction(src, n))).join('\n');
}

/* ══ LE JEU DE FACTURES (le 1er novembre 2026) ══ */
const NOW = new Date('2026-11-01T12:00:00');
class FDate extends Date { constructor(...a) { if (a.length === 0) super(NOW.getTime()); else super(...a); } static now() { return NOW.getTime(); } }
function monter(src) {
  const BILLING = {
    'domaine-berard': { fact: [
      { ref: 'MV-2025-0004', type: 'inst', date: '2025-12-15', echeance: '2026-01-14', montant: 990, statut: 'payee', paye_le: '2026-01-09', mode: 'virement' },
      { ref: 'MV-2025-0004', type: 'geste', date: '2025-12-15', montant: -495, statut: 'applique', libelle: 'Offre de lancement' },
      { ref: 'MV-2026-0015', type: 'abo', date: '2026-08-01', montant: 790, statut: 'payee', paye_le: '2026-08-19', mode: 'virement', per: 'annuel' }] },
    'chateau-fontrouge': { fact: [
      { ref: 'MV-2026-0021', type: 'inst', date: '2026-09-20', echeance: '2026-10-20', montant: 990, statut: 'emise' },
      { ref: 'MV-2026-0021', type: 'geste', date: '2026-09-20', montant: -495, statut: 'applique' },
      { ref: 'MV-2026-0024', type: 'abo', date: '2026-10-01', echeance: '2026-10-31', montant: 49, statut: 'emise' }] },
    'clos-saint-aubin': { fact: [
      { ref: 'MV-2026-0011', type: 'inst', date: '2026-06-02', montant: 990, statut: 'payee' },
      { ref: 'MV-2026-0023', type: 'abo', date: '2026-10-01', montant: 79, statut: 'payee', paye_le: '2026-10-29', mode: 'cheque' }] },
    'ancien-domaine': { fact: [
      { ref: 'MV-2026-0030', type: 'abo', date: '2026-03-01', montant: 79, statut: 'payee', paye_le: '2026-03-05', mode: 'prelevement' }] },
    'marchand-grillot': { fact: [{ ref: 'X-1', type: 'abo', date: '2026-05-01', montant: 1, statut: 'payee', paye_le: '2026-05-02' }] }
  };
  const TENANTS = [{ slug: 'domaine-berard', nom: 'Domaine Bérard' }, { slug: 'chateau-fontrouge', nom: 'Château Fontrouge' },
    { slug: 'clos-saint-aubin', nom: 'Clos Saint-Aubin' }, { slug: 'domaine-test', nom: 'Domaine test' }, { slug: 'marchand-grillot', nom: 'Domaine de référence' }];
  const CLIENTS = { 'domaine-berard': { plan: 'domaine', status: 'active' }, 'chateau-fontrouge': { plan: 'domaine', status: 'active' },
    'clos-saint-aubin': { plan: 'domaine', status: 'active' } };
  const E = { fichiers: [], toasts: [], mail: '' };
  const window = { dlFile(contenu, nom) { E.fichiers.push({ contenu, nom }); }, location: {} };
  Object.defineProperty(window.location, 'href', { set(v) { E.mail = decodeURIComponent(String(v)); } });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const api = new Function('Date', 'window', '_agtTenants', '_agtBilling', '_agtClients', '_escHtml', 'showToast',
    'var _agtBizAn=null;\n' + bloc(src) + '\nreturn {' + FN.join(',') + '};')(
    FDate, window, TENANTS, BILLING, CLIENTS, esc, (m) => E.toasts.push(m));
  return Object.assign(api, { E });
}
const ESSAIS = {
  encaisseAuPaiement(M) {
    const m26 = M._agtBizMois(2026), m25 = M._agtBizMois(2025);
    const enc25 = m25.reduce((s, o) => s + o.enc, 0);
    return m26[0].enc === 495 && enc25 === 0 && m25[11].inst === 990 && m25[11].geste === -495;
  },
  aDater(M) {
    const m26 = M._agtBizMois(2026);
    const rows = M._agtBizTodoRows();
    return m26[5].enc === 990 && m26[5].aDater === 990 && rows.some(r => /1 paiement sans date/.test(r.t));
  },
  supprime(M) {
    const s = M._agtBizSlugs();
    const anc = s.find(x => x.slug === 'ancien-domaine');
    return anc && anc.supprime === true && anc.i === -1 && !s.some(x => x.slug === 'marchand-grillot') && M._agtBizMois(2026)[2].enc === 79;
  },
  resteDu(M) {
    const rows = M._agtBizTodoRows();
    const fr = rows.filter(r => /MV-2026-0021/.test(r.t));
    return M._agtRefReste('chateau-fontrouge', 'MV-2026-0021') === 495 && fr.length === 1 && /495/.test(fr[0].m) && !/990/.test(fr[0].m)
      && rows.some(r => /MV-2026-0024/.test(r.t) && /49/.test(r.m)) && M._agtRefReste('domaine-berard', 'MV-2025-0004') === 0;
  },
  relance(M) {
    M.agtBizRelance(1, 0);
    return /Il reste 495/.test(M.E.mail) && /avoir d\u00e9duit/.test(M.E.mail) && !/montant de 990/.test(M.E.mail);
  },
  periodicite(M) {
    const rows = M._agtBizTodoRows().filter(r => /abonnement \u00e0 \u00e9mettre/.test(r.t));
    return rows.some(r => /Fontrouge/.test(r.t)) && !rows.some(r => /B\u00e9rard/.test(r.t));
  },
  aQualifier(M) {
    return M._agtStatutOf('domaine-test').cle === 'aqualifier' && M._agtStatutOf('domaine-berard').cle === 'actif'
      && M._agtBizTodoRows().some(r => /Domaine test/.test(r.t) && /\u00e0 qualifier/.test(r.t));
  },
  livre(M) {
    const L = M._agtLivreLignes(2026);
    const vu = L.map(o => o.date + '|' + o.ref + '|' + o.montant + '|' + (o.mode || '') + '|' + (o.aDater ? 'D' : ''));
    return JSON.stringify(vu) === JSON.stringify(['2026-01-09|MV-2025-0004|495|virement|', '2026-03-05|MV-2026-0030|79|prelevement|',
      '2026-06-02|MV-2026-0011|990||D', '2026-08-19|MV-2026-0015|790|virement|', '2026-10-29|MV-2026-0023|79|cheque|'])
      && L[1].client === 'ancien-domaine (supprim\u00e9)' && L[0].nature === 'Installation';
  },
  livreCsv(M) {
    M.agtBizLivre();
    const f = M.E.fichiers[M.E.fichiers.length - 1]; if (!f) return false;
    const L = f.contenu.replace(/^\uFEFF/, '').split('\r\n');
    return /livre_recettes_2026\.csv$/.test(f.nom)
      && L[0] === 'Date d\u2019encaissement;N\u00b0 de facture;Client;Nature;Montant encaiss\u00e9 (\u20ac);Mode de r\u00e8glement;Remarque'
      && L.length === 7 && /"09\/01\/2026";"MV-2025-0004";"Domaine B\u00e9rard";"Installation";495;"Virement"/.test(L[1])
      && /2433/.test(L[6]) && /date de paiement \u00e0 saisir/.test(L[3]);
  },
  exportCsv(M) {
    M.agtBizCsv();
    const f = M.E.fichiers[M.E.fichiers.length - 1]; if (!f) return false;
    const L = f.contenu.replace(/^\uFEFF/, '').split('\r\n');
    return /;Payee le;Mode;Reste du \(reference\);/.test(L[0]) && L.some(l => /"ancien-domaine"/.test(l) && /"oui"$/.test(l))
      && L.some(l => /"MV-2026-0021"/.test(l) && /;495;/.test(l));
  },
  numerotation(M) { return M._agtBizNextRef() === 'MV-2026-0031'; },
  datePaiement(M) {
    return M._agtPaieDateErr('2026-11-02', '2026-11-01') !== '' && M._agtPaieDateErr('', '2026-11-01') !== ''
      && M._agtPaieDateErr('2026-10-30', '2026-11-01') === '' && M._agtPaieDateErr('2026-11-01', '2026-11-01') === '';
  }
};
const LIB = {
  encaisseAuPaiement: '★★★ l’encaissé au mois du RÈGLEMENT : facture de décembre 2025 réglée le 09/01/2026 → 495 € en janvier 2026, rien en 2025 (GT-B08)',
  aDater: '★ une ligne réglée sans date (d’avant le lot) : à sa date de facture, comptée « à dater », et signalée dans « À traiter »',
  supprime: '★★ un domaine supprimé reste dans les totaux et les courbes ; l’interne en sort (GT-B10)',
  resteDu: '★★★ « À traiter » au reste dû, avoir déduit : 495 € et non 990 €, une ligne par référence (GT-B09)',
  relance: '★★★ la relance réclame le reste dû et dit l’avoir',
  periodicite: '★★ l’abonnement annuel ne réclame rien avant douze mois ; le mensuel, au bout d’un mois (GT-B13)',
  aQualifier: '★★ un domaine sans fiche commerciale est « à qualifier », et le dit (GT-B14)',
  livre: '★★★ le livre des recettes : une ligne par encaissement, dans l’ordre des règlements, montants nets, modes, la ligne à dater marquée',
  livreCsv: '★★ son export : les six mentions en tête, le total, la remarque « à saisir » (décision D6)',
  exportCsv: '★ l’export comptable : date et mode du paiement, reste dû, domaines supprimés',
  numerotation: '★ la numérotation compte TOUTES les factures, domaine supprimé compris',
  datePaiement: '★ la date d’un paiement : réelle, jamais dans le futur'
};
function statiques(src) {
  const r = [];
  const fp = fonction(src, 'agtFactPaye');
  r.push([fp.indexOf('agt-paie-ov') !== -1 && !/f\.statut\s*=\s*\(f\.statut==='payee'\)/.test(fp), '★★ « payée » ouvre la saisie du paiement (date et mode), plus de bascule à la date du clic']);
  r.push([/window\._agtPaieValider=async function[\s\S]{0,600}_agtPaieDateErr\([\s\S]{0,400}f\.paye_le=d; f\.mode=mo;/.test(src), 'la saisie valide la date puis écrit la date ET le mode']);
  r.push([/window\.agtBizLivre\s*=\s*agtBizLivre;/.test(src) && src.indexOf('onclick="agtBizLivre()"') !== -1, 'le livre des recettes a son bouton, et sa fonction est exposée']);
  r.push([/window\.agtBizPer\s*=\s*agtBizPer;/.test(src) && src.indexOf('onclick="agtBizPer(') !== -1, 'la périodicité se règle sur la ligne d’abonnement']);
  r.push([fonction(src, 'agtBizRecap').indexOf('_agtRefReste(') !== -1, 'le récapitulatif imprimé dit le net à payer (reste dû)']);
  r.push([fonction(src, '_agtBuildBusiness').indexOf('_agtRefReste(') !== -1 && fonction(src, '_agtBuildBusiness').indexOf('_agtBizSlugs()') !== -1,
    'les chiffres du haut : retards nets, domaines supprimés compris']);
  r.push([/if\(r\.b\) h\+='<button onclick="'\+r\.a\+'"/.test(src) && (src.match(/if\(r\.b\) h\+='<button onclick="'\+r\.a\+'"/g) || []).length === 2,
    'une ligne sans geste n’affiche pas de bouton vide (Radar, À traiter)']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (ok, q) => { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · le moteur, sur un jeu chiffré ──');
  for (const k of Object.keys(ESSAIS)) { let ok = false; try { ok = ESSAIS[k](monter(GT)); } catch (e) { console.log('    (' + e.message + ')'); } pose(ok, LIB[k]); }
  console.log('\n── 2 · le câblage ──');
  for (const [c, q] of statiques(GT)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}

const okC = [], koC = [];
function mord(titre, ancre, remplace, essai) {
  const n = GT.split(ancre).length - 1;
  if (n !== 1) { koC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const mute = GT.replace(ancre, remplace);
  let detecte;
  try { detecte = essai === 'statiques' ? !statiques(mute).every(x => x[0]) : !ESSAIS[essai](monter(mute)); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ l’encaissé repart à la date de facture', "var e=_agtFEncInfo(x.t.slug, x.f), de=e.enc?_agtD(e.date):null;", "var e=_agtFEncInfo(x.t.slug, x.f), de=e.enc?_agtD(x.f.date):null;", 'encaisseAuPaiement');
mord('★★ l’avoir ne suit plus le règlement de sa facture', "    if(rg) return { enc:v.enc, date:rg.date, aDater:rg.aDater, mode:rg.mode };", "    if(rg) return { enc:v.enc, date:String(f.date||''), aDater:rg.aDater, mode:rg.mode };", 'encaisseAuPaiement');
mord('★★★ le reste dû oublie les avoirs', "  _agtFacts(slug).forEach(function(f){ if(_agtFType(f)==='geste' && String(f.ref||'')===r) s+=Number(f.montant)||0; });\n  return Math.max(0, Math.round(s*100)/100);", "  return Math.max(0, Math.round(s*100)/100);", 'resteDu');
mord('★★★ « À traiter » repart au montant brut', "      m:_agtEur(reste), b:(x.i>=0?'Relancer':'')", "      m:_agtEur(x.f.montant), b:(x.i>=0?'Relancer':'')", 'resteDu');
mord('★★★ la relance repart au montant brut', "+'. Il reste '+_agtEur(reste)+' \\u00e0 r\\u00e9gler'", "+'. Il reste '+_agtEur(brut)+' \\u00e0 r\\u00e9gler'", 'relance');
mord('★★ un domaine supprimé sort de nouveau des totaux', "    if(vus[sl] || _agtInterne(sl) || !_agtFacts(sl).length) return;", "    return;", 'supprime');
mord('★★ l’annuel redevient mensuel', "  d.setMonth(d.getMonth()+((f.per==='annuel')?12:1));", "  d.setMonth(d.getMonth()+1);", 'periodicite');
mord('★★ sans fiche, « Abonné » par défaut', "  if(!c.status && !c.plan && !c.trialExp && !c.trialDays && !c.created_at && !c.activated_at)\n    return { cle:'aqualifier', label:'\\u00c0 qualifier', color:'#9CA3AF', jours:0 };\n", '', 'aQualifier');
mord('★★★ le livre range à la date de facture', "      var d=_agtD(e.date); if(!d || d.getFullYear()!==an) return;\n      var cle=x.slug", "      var d=_agtD(f.date); if(!d || d.getFullYear()!==an) return;\n      var cle=x.slug", 'livre');
mord('★ la numérotation oublie les domaines supprimés', "  Object.keys(_agtBilling||{}).forEach(function(sl){\n    _agtFacts(sl).forEach(function(f){", "  _agtTenants.map(function(t){ return t.slug; }).forEach(function(sl){\n    _agtFacts(sl).forEach(function(f){", 'numerotation');
mord('★ un paiement se date dans le futur', "  if(String(v) > String(aujourdhui)) return 'Un paiement ne se date pas dans le futur';\n", '', 'datePaiement');
mord('★ le paiement redevient une bascule à la date du clic', "  var paye=(f.statut==='payee'), auj=_agtIso(new Date());", "  f.statut = (f.statut==='payee') ? 'emise' : 'payee';\n  var paye=(f.statut==='payee'), auj=_agtIso(new Date());", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
