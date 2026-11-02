// ═══════════════════════════════════════════════════════════
//  HARNAIS GTFIX-1 — LES ÉCRITURES DE LA CONSOLE GT EN TRANSACTION (§510)
// ═══════════════════════════════════════════════════════════
//  L'audit du 01/11 (docs/maquettes/audit-console-gt-2026-11-01.md) : la console
//  prenait une lecture RATÉE pour une liste vide, puis réécrivait le document
//  entier (registre des clients, équipe, config, journal d'accès), ou réécrivait
//  la copie chargée à l'ouverture du panneau (journal d'accès, erreurs,
//  facturation, leads, codes) et effaçait ce qui avait été écrit depuis.
//
//  Sur les VRAIES fonctions extraites de src/firebase.js (fbGtMaj, fbAdminMaj,
//  fbGtMajRegistre, fbAdminLire), de src/admin-gt.js (les mutations) et de
//  functions/claims.js (_alGarder). Bouchon : une base Firestore factice qui sait
//  tomber en panne de lecture, et faire glisser une écriture concurrente entre la
//  lecture et l'écriture d'une transaction (qui doit alors être rejouée).
//
//  CE QUE CE HARNAIS PROUVE
//   1. lecture ratée → RIEN d'écrit, base intacte — pour chaque porte ;
//   2. registre : les autres clients restent, statuts recalculés, `clients` hors
//      de `tenants`, écriture concurrente gardée (transaction rejouée) ;
//   3. équipe : ajout à la liste RELUE, doublon d'adresse refusé, forme inconnue
//      refusée, document absent = équipe neuve ;
//   4. journal d'accès : entrées notées entre-temps gardées, un an par la date,
//      plafond de 2 000 lignes, forme inconnue intacte — et la même règle que le
//      serveur (mêmes nombres, mêmes réponses) ;
//   5. erreurs : traiter / purger sans perdre celles arrivées entre-temps ;
//   6. config : champs inconnus gardés, case vide sans effet (GT-B17) ;
//   7. facturation et leads : un autre domaine modifié entre-temps est gardé ; le
//      même modifié entre-temps = conflit, rien d'écrit ; l'ordre des clés ne
//      crée pas de faux conflit ;
//   8. codes d'essai : ajout et retrait sur la liste relue ;
//   9. le câblage, lu dans les sources : plus aucune écriture GT hors transaction
//      en dehors des cinq exceptions nommées ; le serveur ne purge plus les accès
//      d'un domaine supprimé.
//
//  Usage :  node scripts/mv-harnais-gtfix1.mjs
//           node scripts/mv-harnais-gtfix1.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync, existsSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { fb: lire('src/firebase.js'), gt: lire('src/admin-gt.js'), cl: lire('functions/claims.js') };

/* ══ EXTRACTION ══ */
function fonction(src, nom, fichier) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) { console.error('ABSENTE de ' + fichier + ' : ' + nom); process.exit(1); }
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1).replace(/^export\s+/, '');
  }
  console.error('accolade non fermée : ' + nom); process.exit(1);
}
function affectation(src, nom, fichier) {
  const i = src.indexOf('window.' + nom + ' = ');
  if (i < 0) { console.error('AFFECTATION ABSENTE de ' + fichier + ' : window.' + nom); process.exit(1); }
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, src.indexOf(';', j) + 1);
  }
  console.error('accolade non fermée : window.' + nom); process.exit(1);
}
function ligne(src, motif, fichier) {
  const m = motif.exec(src);
  if (!m) { console.error('LIGNE ABSENTE de ' + fichier + ' : ' + motif); process.exit(1); }
  return m[0];
}

const BLOC_FB = [
  ligne(SRC.fb, /^var _FB_GT_PLAFOND\s*=[^\n]*;/m, 'src/firebase.js'),
  fonction(SRC.fb, '_fbGtTaille', 'src/firebase.js'),
  affectation(SRC.fb, 'fbGtMaj', 'src/firebase.js'),
  affectation(SRC.fb, 'fbAdminMaj', 'src/firebase.js'),
  affectation(SRC.fb, 'fbGtMajRegistre', 'src/firebase.js'),
  affectation(SRC.fb, 'fbAdminLire', 'src/firebase.js')
].join('\n');
const GT_FN = ['_agtNowISO', '_agtJsonStable', '_agtRegClients', '_agtRegSortie', '_agtMajRegistre', '_agtAlGarder',
  '_agtMutJournal', '_agtMutErreurs', '_agtMutMembres', '_agtMutConfigDomaine', '_agtMutCodes', '_agtMutBilling', '_agtMutLeadSt'];
const BLOC_GT = [
  ligne(SRC.gt, /^var _AGT_AL_JOURS\s*=[^\n]*;/m, 'src/admin-gt.js'),
  ligne(SRC.gt, /^var _AGT_MBR_COLORS\s*=[^\n]*;/m, 'src/admin-gt.js')
].concat(GT_FN.map(n => fonction(SRC.gt, n, 'src/admin-gt.js'))).join('\n');
const BLOC_CL = ligne(SRC.cl, /^const AL_JOURS\s*=[^\n]*;/m, 'functions/claims.js') + '\n' + fonction(SRC.cl, '_alGarder', 'functions/claims.js');

/* ══ LA BASE FACTICE ══ */
function fausseBase() {
  const store = new Map(), version = new Map();
  let panne = false, glisse = null, rejouees = 0;
  const erreurPanne = () => Object.assign(new Error('Failed to get document because the client is offline.'), { code: 'unavailable' });
  const snap = p => { const v = store.get(p); return { exists: () => v !== undefined, data: () => (v === undefined ? undefined : JSON.parse(v)) }; };
  return {
    store, version,
    panne(v) { panne = v; }, glisser(f) { glisse = f; },
    get rejouees() { return rejouees; },
    poser(p, v) { store.set(p, JSON.stringify(v)); version.set(p, (version.get(p) || 0) + 1); },
    lireV(p) { const v = store.get(p); return v === undefined ? undefined : JSON.parse(v); },
    doc(db, coll, key) { return { path: coll + '/' + key }; },
    async getDocFromServer(ref) { if (panne) throw erreurPanne(); return snap(ref.path); },
    async runTransaction(db, fn) {
      for (let essai = 0; essai < 5; essai++) {
        const lus = new Map(), ecrits = new Map();
        const tx = {
          async get(ref) { if (panne) throw erreurPanne(); lus.set(ref.path, version.get(ref.path) || 0); return snap(ref.path); },
          set(ref, val) { ecrits.set(ref.path, JSON.stringify(val)); }
        };
        const res = await fn(tx);
        if (glisse) { const f = glisse; glisse = null; f(this); }
        let conflit = false;
        for (const [p, v] of lus) if ((version.get(p) || 0) !== v) conflit = true;
        if (conflit) { rejouees++; continue; }
        for (const [p, v] of ecrits) { store.set(p, v); version.set(p, (version.get(p) || 0) + 1); }
        return res;
      }
      throw new Error('transaction abandonnée');
    }
  };
}
function monter(blocFb, blocGt) {
  const B = fausseBase();
  const window = {};
  new Function('db', 'doc', 'runTransaction', 'getDocFromServer', 'window', blocFb)
    ({}, B.doc.bind(B), B.runTransaction.bind(B), B.getDocFromServer.bind(B), window);
  const GT = new Function('window', blocGt + '\nreturn {' + GT_FN.join(',') + ', _AGT_AL_JOURS, _AGT_AL_MAX };')(window);
  return { B, window, GT };
}
const CL = new Function(BLOC_CL + '\nreturn { _alGarder, AL_JOURS, AL_MAX };')();
const vide = async p => { try { await p; return false; } catch (e) { return true; } };   // vrai si ça LÈVE
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const J = 86400000;

/* ══ LES ESSAIS (vrais sur le code sain, faux si le défaut revient) ══ */
const REG = { tenants: { slugs: ['a', 'b', 'c'], statuts: { a: 'active' }, autre: 1, clients: { fuite: true } },
              clients: { clients: { a: { status: 'active', plan: 'domaine' }, b: { status: 'pending' }, c: { plan: 'vigneron' } } } };
function poserRegistre(B) { B.poser('_guerettech/tenants', REG.tenants); B.poser('_guerettech/clients', REG.clients); }
const ajouterD = GT => GT._agtMajRegistre(function (clients, slugs) { slugs.push('d'); clients.d = { status: 'pending', plan: 'essentiel' }; });

const ESSAIS = {
  async regPanne(M) {
    poserRegistre(M.B); M.B.panne(true);
    const leve = await vide(ajouterD(M.GT));
    M.B.panne(false);
    return leve && egal(M.B.lireV('_guerettech/tenants'), REG.tenants) && egal(M.B.lireV('_guerettech/clients'), REG.clients);
  },
  async regAjout(M) {
    poserRegistre(M.B);
    await ajouterD(M.GT);
    const t = M.B.lireV('_guerettech/tenants'), c = M.B.lireV('_guerettech/clients');
    return egal(t.slugs, ['a', 'b', 'c', 'd']) && t.autre === 1 && !('clients' in t)
      && egal(t.statuts, { a: 'active', b: 'pending', d: 'pending' })
      && Object.keys(c.clients).sort().join() === 'a,b,c,d' && c.clients.c.plan === 'vigneron';
  },
  async regConcurrent(M) {
    poserRegistre(M.B);
    M.B.glisser(B => { const t = B.lireV('_guerettech/tenants'); t.slugs.push('e'); B.poser('_guerettech/tenants', t);
      const c = B.lireV('_guerettech/clients'); c.clients.e = { status: 'pending' }; B.poser('_guerettech/clients', c); });
    await ajouterD(M.GT);
    const t = M.B.lireV('_guerettech/tenants');
    return M.B.rejouees >= 1 && t.slugs.indexOf('d') !== -1 && t.slugs.indexOf('e') !== -1;
  },
  async regRefus(M) {   // rendre false = ne rien écrire (slug déjà là)
    poserRegistre(M.B);
    const v0 = M.B.version.get('_guerettech/tenants');
    const r = await M.GT._agtMajRegistre(function () { return false; });
    return r.ecrit === false && M.B.version.get('_guerettech/tenants') === v0;
  },
  async mbrAjout(M) {
    M.B.poser('mavigne_dom/membres', { value: [{ nom: 'A', email: 'a@x.fr' }, { nom: 'B', email: 'b@x.fr' }] });
    M.B.glisser(B => { const v = B.lireV('mavigne_dom/membres'); v.value.push({ nom: 'C', email: 'c@x.fr' }); B.poser('mavigne_dom/membres', v); });
    await M.window.fbAdminMaj('dom', 'membres', (l, ex) => M.GT._agtMutMembres(l, ex, [{ nom: 'N', email: 'N@x.fr' }, { nom: 'A2', email: 'A@X.FR' }]));
    const v = M.B.lireV('mavigne_dom/membres').value.map(m => m.nom);
    return egal(v, ['A', 'B', 'C', 'N']);
  },
  async mbrPanne(M) {
    M.B.poser('mavigne_dom/membres', { value: [{ nom: 'A', email: 'a@x.fr' }] }); M.B.panne(true);
    const leve = await vide(M.window.fbAdminMaj('dom', 'membres', (l, ex) => M.GT._agtMutMembres(l, ex, [{ nom: 'N', email: 'n@x.fr' }])));
    M.B.panne(false);
    return leve && M.B.lireV('mavigne_dom/membres').value.length === 1;
  },
  async mbrAbsentEtInconnu(M) {
    await M.window.fbAdminMaj('neuf', 'membres', (l, ex) => M.GT._agtMutMembres(l, ex, [{ nom: 'N', email: 'n@x.fr' }]));
    const neuf = M.B.lireV('mavigne_neuf/membres').value;
    M.B.poser('mavigne_bizarre/membres', { autre: 1 });
    const leve = await vide(M.window.fbAdminMaj('bizarre', 'membres', (l, ex) => M.GT._agtMutMembres(l, ex, [{ nom: 'N', email: 'n@x.fr' }])));
    return neuf.length === 1 && neuf[0].couleur && leve && egal(M.B.lireV('mavigne_bizarre/membres'), { autre: 1 });
  },
  async jrnConcurrent(M) {
    M.B.poser('_guerettech/access_log', { value: [{ id: 'x1', ts: new Date().toISOString() }] });
    M.B.glisser(B => { const v = B.lireV('_guerettech/access_log'); v.value.unshift({ id: 'serveur', ts: new Date().toISOString() }); B.poser('_guerettech/access_log', v); });
    const e = { id: 'moi', ts: new Date().toISOString() };
    await M.window.fbGtMaj('access_log', (d, ex) => M.GT._agtMutJournal(d, ex, e));
    const ids = M.B.lireV('_guerettech/access_log').value.map(x => x.id);
    return egal(ids, ['moi', 'serveur', 'x1']);
  },
  async jrnPanneEtInconnu(M) {
    M.B.poser('_guerettech/access_log', { value: [{ id: 'x1' }] }); M.B.panne(true);
    const leve = await vide(M.window.fbGtMaj('access_log', (d, ex) => M.GT._agtMutJournal(d, ex, { id: 'moi' })));
    M.B.panne(false);
    M.B.poser('_guerettech/access_log', { foo: 1 });
    const r = await M.window.fbGtMaj('access_log', (d, ex) => M.GT._agtMutJournal(d, ex, { id: 'moi' }));
    return leve && r.ecrit === false && egal(M.B.lireV('_guerettech/access_log'), { foo: 1 });
  },
  jrnDate(M) {
    const t0 = Date.now(), L = [{ id: 'a', ts: new Date(t0 - 10 * J).toISOString() }, { id: 'b', ts: new Date(t0 - 364 * J).toISOString() },
      { id: 'c', ts: new Date(t0 - 366 * J).toISOString() }, { id: 'sansdate' }];
    const g = M.GT._agtAlGarder(L.slice(), t0).map(e => e.id);
    const big = M.GT._agtAlGarder(Array.from({ length: 2500 }, (_, i) => ({ id: 'e' + i, ts: new Date(t0 - i * 1000).toISOString() })), t0);
    return egal(g, ['a', 'b', 'sansdate']) && big.length === 2000 && big[1999].id === 'e1999';
  },
  jrnServeur(M) {   // la console et le serveur gardent la même chose
    const t0 = Date.now(), L = Array.from({ length: 2600 }, (_, i) => ({ id: 'e' + i, ts: new Date(t0 - i * 4 * 3600000).toISOString() })).concat([{ id: 'nul', ts: 'pas une date' }]);
    return M.GT._AGT_AL_JOURS === CL.AL_JOURS && M.GT._AGT_AL_MAX === CL.AL_MAX
      && egal(M.GT._agtAlGarder(L.slice(), t0), CL._alGarder(L.slice(), t0));
  },
  async errTraiter(M) {
    M.B.poser('mavigne_dom/error_log', { value: [{ id: 'e1' }, { id: 'e2' }] });
    M.B.glisser(B => { const v = B.lireV('mavigne_dom/error_log'); v.value.push({ id: 'e3' }); B.poser('mavigne_dom/error_log', v); });
    const ids = { e1: true };
    await M.window.fbAdminMaj('dom', 'error_log', (l, ex) => M.GT._agtMutErreurs(l, ex, ids, false));
    const v = M.B.lireV('mavigne_dom/error_log').value;
    return v.length === 3 && v[0].resolved === true && !v[1].resolved && v[2].id === 'e3';
  },
  async errPurge(M) {
    M.B.poser('mavigne_dom/error_log', { value: [{ id: 'e1', resolved: true }, { id: 'e2' }] });
    M.B.glisser(B => { const v = B.lireV('mavigne_dom/error_log'); v.value.push({ id: 'e3' }); B.poser('mavigne_dom/error_log', v); });
    await M.window.fbAdminMaj('dom', 'error_log', (l, ex) => M.GT._agtMutErreurs(l, ex, {}, true));
    const absent = await M.window.fbAdminMaj('vide', 'error_log', (l, ex) => M.GT._agtMutErreurs(l, ex, {}, true));
    return egal(M.B.lireV('mavigne_dom/error_log').value.map(e => e.id), ['e2', 'e3']) && absent.ecrit === false && M.B.lireV('mavigne_vide/error_log') === undefined;
  },
  async cfgChamps(M) {
    M.B.poser('mavigne_dom/config', { value: { domaine_nom: 'Ancien', lat: 47.2, lon: 4.9, features: { cave: false }, campagne_mois: 8 } });
    await M.window.fbAdminMaj('dom', 'config', (c, ex) => M.GT._agtMutConfigDomaine(c, ex, 'Nouveau', NaN, NaN));
    const v = M.B.lireV('mavigne_dom/config').value;
    M.B.panne(true);
    const leve = await vide(M.window.fbAdminMaj('dom', 'config', (c, ex) => M.GT._agtMutConfigDomaine(c, ex, 'X', 1, 2)));
    M.B.panne(false);
    return v.domaine_nom === 'Nouveau' && v.lat === 47.2 && v.lon === 4.9 && v.campagne_mois === 8 && v.features.cave === false
      && leve && M.B.lireV('mavigne_dom/config').value.domaine_nom === 'Nouveau';
  },
  async cfgInconnue(M) {   // un document sans `value` n'est pas « absent » : on n'y écrit rien
    M.B.poser('mavigne_bz/config', { autre: 1 });
    const leve = await vide(M.window.fbAdminMaj('bz', 'config', (c, ex) => M.GT._agtMutConfigDomaine(c, ex, 'X', 1, 2)));
    return leve && egal(M.B.lireV('mavigne_bz/config'), { autre: 1 });
  },
  async facAutreGarde(M) {
    const b0 = { a: { fact: [{ ref: 'MV-1', montant: 990 }] }, b: { fact: [] } };
    M.B.poser('_guerettech/billing', { value: b0 });
    const base = M.GT._agtJsonStable(b0.a);
    M.B.glisser(B => { const v = B.lireV('_guerettech/billing'); v.value.b.fact.push({ ref: 'MV-2', montant: 79 }); B.poser('_guerettech/billing', v); });
    const local = { fact: [{ ref: 'MV-1', montant: 990 }, { ref: 'MV-3', montant: -495 }] };
    await M.window.fbGtMaj('billing', (d, ex) => M.GT._agtMutBilling(d, ex, 'a', local, base));
    const v = M.B.lireV('_guerettech/billing').value;
    return v.a.fact.length === 2 && v.b.fact.length === 1 && v.b.fact[0].ref === 'MV-2';
  },
  async facConflit(M) {
    const b0 = { a: { fact: [{ ref: 'MV-1', montant: 990 }] } };
    M.B.poser('_guerettech/billing', { value: b0 });
    const base = M.GT._agtJsonStable(b0.a);
    M.B.poser('_guerettech/billing', { value: { a: { fact: [{ ref: 'MV-1', montant: 990, statut: 'payee' }] } } });   // ailleurs, entre-temps
    let conflit = false;
    try { await M.window.fbGtMaj('billing', (d, ex) => M.GT._agtMutBilling(d, ex, 'a', { fact: [] }, base)); } catch (e) { conflit = !!e.conflit && !!e.frais; }
    return conflit && M.B.lireV('_guerettech/billing').value.a.fact.length === 1;
  },
  async facOrdreCles(M) {   // Firestore ne garde pas l'ordre des clés : pas de faux conflit
    M.B.poser('_guerettech/billing', { value: { a: { fact: [{ montant: 990, ref: 'MV-1' }], abo: { prix: 49, motif: 'x' } } } });
    const base = M.GT._agtJsonStable({ abo: { motif: 'x', prix: 49 }, fact: [{ ref: 'MV-1', montant: 990 }] });
    await M.window.fbGtMaj('billing', (d, ex) => M.GT._agtMutBilling(d, ex, 'a', { fact: [] }, base));
    return M.B.lireV('_guerettech/billing').value.a.fact.length === 0;
  },
  async leadConflit(M) {
    M.B.poser('_guerettech/leads_status', { value: { l1: { st: 'nouveau' }, l2: { st: 'repondu' } } });
    const base = M.GT._agtJsonStable({ st: 'nouveau' });
    M.B.glisser(B => { const v = B.lireV('_guerettech/leads_status'); v.value.l2 = { st: 'mer' }; B.poser('_guerettech/leads_status', v); });
    await M.window.fbGtMaj('leads_status', (d, ex) => M.GT._agtMutLeadSt(d, ex, 'l1', { st: 'repondu' }, base));
    const v = M.B.lireV('_guerettech/leads_status').value;
    let conflit = false;
    try { await M.window.fbGtMaj('leads_status', (d, ex) => M.GT._agtMutLeadSt(d, ex, 'l2', { st: 'perdu' }, M.GT._agtJsonStable({ st: 'repondu' }))); } catch (e) { conflit = !!e.conflit; }
    return v.l1.st === 'repondu' && v.l2.st === 'mer' && conflit && M.B.lireV('_guerettech/leads_status').value.l2.st === 'mer';
  },
  async codes(M) {
    M.B.poser('_guerettech/demo_tokens', { value: [{ id: 't1', code: 'A' }] });
    M.B.glisser(B => { const v = B.lireV('_guerettech/demo_tokens'); v.value.push({ id: 't2', code: 'B' }); B.poser('_guerettech/demo_tokens', v); });
    await M.window.fbGtMaj('demo_tokens', (d, ex) => M.GT._agtMutCodes(d, ex, v => { v.push({ id: 't3', code: 'C' }); return v; }));
    await M.window.fbGtMaj('demo_tokens', (d, ex) => M.GT._agtMutCodes(d, ex, v => v.filter(t => t.id !== 't1')));
    M.B.poser('_guerettech/demo_tokens', { foo: 1 });
    const leve = await vide(M.window.fbGtMaj('demo_tokens', (d, ex) => M.GT._agtMutCodes(d, ex, v => v)));
    return leve && egal(M.B.lireV('_guerettech/demo_tokens'), { foo: 1 });
  },
  async codesResultat(M) {
    M.B.poser('_guerettech/demo_tokens', { value: [{ id: 't1', code: 'A' }] });
    M.B.glisser(B => { const v = B.lireV('_guerettech/demo_tokens'); v.value.push({ id: 't2', code: 'B' }); B.poser('_guerettech/demo_tokens', v); });
    await M.window.fbGtMaj('demo_tokens', (d, ex) => M.GT._agtMutCodes(d, ex, v => { v.push({ id: 't3', code: 'C' }); return v; }));
    return egal(M.B.lireV('_guerettech/demo_tokens').value.map(t => t.id), ['t1', 't2', 't3']);
  },
  async taille(M) {
    M.B.poser('_guerettech/access_log', { value: [] });
    const enorme = 'x'.repeat(1000 * 1024);
    const leve = await vide(M.window.fbGtMaj('access_log', () => ({ value: [{ id: 'gros', action: enorme }] })));
    return leve && M.B.lireV('_guerettech/access_log').value.length === 0;
  },
  async lireServeur(M) {
    M.B.poser('mavigne_dom/parcelles', { value: [{ nom: 'P1' }] });
    const r = await M.window.fbAdminLire('dom', 'parcelles'), abs = await M.window.fbAdminLire('dom', 'rien');
    M.B.panne(true); const leve = await vide(M.window.fbAdminLire('dom', 'parcelles')); M.B.panne(false);
    return r.existe && r.valeur.length === 1 && abs.existe === false && leve;
  }
};
const LIBELLES = {
  regPanne: '★★★ registre : lecture ratée → rien d’écrit, les deux documents intacts (GT-B01)',
  regAjout: '★★ registre : les autres clients restent, statuts recalculés, champs inconnus gardés, `clients` hors de `tenants`',
  regConcurrent: '★ registre : écriture concurrente → transaction rejouée, les deux ajouts présents',
  regRefus: 'registre : rendre false n’écrit rien',
  mbrAjout: '★★ équipe : ajout à la liste RELUE, membre ajouté entre-temps gardé, doublon d’adresse refusé (GT-B02)',
  mbrPanne: '★★★ équipe : lecture ratée → rien d’écrit (l’ancienne version remplaçait l’équipe par le nouveau)',
  mbrAbsentEtInconnu: 'équipe : document absent = équipe neuve (couleur posée) ; forme inconnue = refus, rien d’écrit',
  jrnConcurrent: '★★★ journal : une entrée notée entre-temps (serveur, préparation) est gardée (GT-B06)',
  jrnPanneEtInconnu: '★★ journal : lecture ratée → rien ; forme inconnue → intacte',
  jrnDate: '★ journal : gardé un an par la date, plafond de 2 000 lignes, entrée sans date gardée',
  jrnServeur: '★ journal : la console et le serveur appliquent la MÊME règle (mêmes nombres, mêmes réponses)',
  errTraiter: '★★ erreurs : traiter garde celles arrivées entre-temps (GT-B07, en attendant GT-SUIVI-1)',
  errPurge: 'erreurs : la purge ne retire que les traitées ; journal absent → rien d’écrit',
  cfgChamps: '★★ config : champs inconnus gardés, case vide sans effet (GT-B17), lecture ratée → rien',
  cfgInconnue: 'config : un document de forme inconnue n’est pas écrasé',
  facAutreGarde: '★★ facturation : un autre domaine modifié entre-temps est gardé',
  facConflit: '★★ facturation : le même domaine modifié entre-temps → conflit, rien d’écrit',
  facOrdreCles: 'facturation : l’ordre des clés ne crée pas de faux conflit',
  leadConflit: '★ leads : fiche voisine gardée, même fiche modifiée ailleurs → conflit',
  codes: 'codes d’essai : forme inconnue → refus, rien d’écrit',
  codesResultat: 'codes d’essai : un code créé entre-temps est gardé',
  taille: 'un document trop gros est refusé AVANT l’envoi',
  lireServeur: 'fbAdminLire : présent, absent, et une panne qui LÈVE'
};

/* ══ LE CÂBLAGE, lu dans les sources ══ */
const sansCom = c => c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
function statiques(S) {
  const r = [];
  const gt = sansCom(S.gt), cl = sansCom(S.cl);
  r.push([gt.indexOf('fbAdminWriteGT(') === -1, '★★ la console n’appelle plus fbAdminWriteGT (toute écriture GT passe par une transaction)']);
  r.push([gt.indexOf('_agtWriteClients') === -1, '★ _agtWriteClients a disparu (une fonction morte est une invitation)']);
  const ecr = gt.split('\n').filter(l => l.indexOf('fbAdminWrite(') !== -1);
  // ★ GTFIX-2 (§511) : la fiche client ne réécrit plus les données du domaine (D1) — `_fcSave` est parti.
  const permis = [/fbAdminWrite\(slug, 'kml_polygons', p\.sortie\)/, /fbAdminWrite\(slug, 'parcelles', fusion\)/,
    /fbAdminWrite\(slug, 'tracteurs_list', _agtIns\.mach\)/, /fbAdminWrite\(slug, 'kml_polygons', _agtIns\.parc\.map/];
  r.push([ecr.length === 4 && ecr.every(l => permis.some(p => p.test(l))),
    '★ fbAdminWrite ne reste qu’aux 4 exceptions nommées (KML relu au serveur ×2, installation d’un domaine neuf ×2) — trouvé ' + ecr.length]);
  // Les écrivains seulement : les fenêtres d'affichage (Config, Journal, Erreurs) lisent encore avec un repli —
  // une lecture ratée y est affichée comme vide (GT-B12, GTFIX-4), mais rien n'est écrit derrière.
  // ★ GTFIX-4 (§513) : la fenêtre Config (agtSaveConfig) est partie — un seul écran, la fiche › Domaine (_fcSaveDom).
  const ecrivains = ['agtSaveAddMembre', 'agtLotGo', 'agtKmlSave'].map(n => fonction(S.gt, n, 'src/admin-gt.js'))
    .concat(['_fcSaveDom', '_fcSaveAbo'].map(n => { const i = S.gt.search(new RegExp('window\\.' + n + '\\s*=\\s*async function')); const k = S.gt.indexOf('\n};', i); return i < 0 || k < 0 ? 'fbAdminRead( introuvable' : S.gt.slice(i, k); }));
  r.push([ecrivains.every(c => c.indexOf('fbAdminRead(') === -1), '★★ aucun écrivain ne relit plus par fbAdminRead (lecture ratée prise pour du vide)']);
  r.push([!/fbAdminReadGT\('tenants'\)\)?\s*\|\|\s*\{\}/.test(gt) && gt.indexOf("['marchand-grillot'];\n    var clients") === -1,
    '★★ plus aucun registre reconstruit sur une lecture ratée']);
  const kml = fonction(S.gt, 'agtKmlSave', 'src/admin-gt.js');
  r.push([kml.indexOf('fbAdminLire(') !== -1 && kml.indexOf('fbAdminRead(') === -1, '★ l’import KML relit au serveur (fbAdminLire), plus par fbAdminRead']);
  // ★ GTFIX-3 (§512) : la saisie du paiement, son annulation et la périodicité écrivent aussi — chaque appel nomme son domaine.
  const appelsFact = (gt.match(/_agtSaveBilling\(/g) || []).length - 1, nommes = (gt.match(/_agtSaveBilling\(t\.slug\)/g) || []).length;
  r.push([!/_agtSaveBilling\(\s*\)/.test(gt) && appelsFact >= 7 && nommes === appelsFact, 'chaque écriture de facturation nomme son domaine (' + nommes + ' sur ' + appelsFact + ')']);
  r.push([!/_agtSaveLeadSt\(\s*\)/.test(gt) && (gt.match(/await _agtSaveLeadSt\(id\)/g) || []).length === 3, 'les 3 écritures de leads nomment leur fiche']);
  r.push([/_agtBillingNoter\(_agtBilling\);\s*\/\/ ★ GTFIX-1/.test(S.gt) && /_agtLeadStNoter\(_agtLeadSt\);\s*\/\/ ★ GTFIX-1/.test(S.gt),
    'la base de comparaison est notée au chargement (facturation, leads)']);
  r.push([/_agtBillingBase=\{\}/.test(gt) && /_agtLeadStBase=\{\}/.test(gt), 'la sortie de session efface aussi les bases de comparaison']);
  const purge = fonction(S.gt, 'agtPurgeErrors', 'src/admin-gt.js');
  r.push([purge.indexOf('openConfirmDel') !== -1, 'la purge des erreurs se confirme']);
  r.push([cl.indexOf("a.tenant !== slug") === -1, '★★ le serveur ne purge plus les accès d’un domaine supprimé (décision D4)']);
  const i4 = S.cl.indexOf('// 4. Tracer la suppression'), j4 = S.cl.indexOf('return { ok: true, slug: slug');
  const supp = (i4 > 0 && j4 > i4) ? sansCom(S.cl.slice(i4, j4)) : '';
  r.push([supp.length > 0 && !/length\s*>\s*100/.test(fonction(S.cl, 'appendAccessLog', 'functions/claims.js') + supp),
    '★ le serveur ne coupe plus le journal d’accès à 100 lignes']);
  r.push([(cl.match(/_alGarder\(list\)/g) || []).length === 2, 'les deux écritures serveur du journal appliquent _alGarder']);
  r.push([gt.indexOf('Conservés 90 jours') === -1 && S.gt.indexOf('Gardés un an, par la date') !== -1, 'l’écran ne promet plus « 90 jours »']);
  r.push([existsSync(new URL('../docs/maquettes/audit-console-gt-2026-11-01.md', import.meta.url)) && existsSync(new URL('../docs/maquettes/maquette-console-gt-v1.html', import.meta.url)),
    'l’audit et la maquette de la console sont rangés dans docs/maquettes/']);
  return r;
}

/* ══ MODE NORMAL ══ */
let rouges = 0, verts = 0;
const pose = (ok, quoi) => { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { rouges++; console.log('  \x1b[31m✗ ' + quoi + '\x1b[0m'); } };

if (!CONTRE) {
  console.log('── 1 · les portes, sur une base qui tombe en panne et qui bouge ──');
  for (const k of Object.keys(ESSAIS)) {
    let ok = false;
    try { ok = await ESSAIS[k](monter(BLOC_FB, BLOC_GT)); } catch (e) { ok = false; console.log('    (exception : ' + (e && e.message) + ')'); }
    pose(ok, LIBELLES[k]);
  }
  console.log('\n── 2 · le câblage ──');
  for (const [c, q] of statiques(SRC)) pose(c, q);
  console.log('\n' + '─'.repeat(30) + '\n  ' + verts + ' vert · ' + rouges + ' rouge\n' + '─'.repeat(30));
  process.exit(rouges ? 1 : 0);
}

/* ══ CONTRE-ÉPREUVE : on remet chaque défaut, le harnais DOIT rougir ══ */
const vertsC = [], rougesC = [];
async function mord(titre, bloc, ancre, remplace, essai) {
  const src = bloc === 'fb' ? BLOC_FB : BLOC_GT;
  const n = src.split(ancre).length - 1;
  if (n !== 1) { rougesC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const mute = src.replace(ancre, remplace);
  let detecte = false;
  try { detecte = !(await ESSAIS[essai](bloc === 'fb' ? monter(mute, BLOC_GT) : monter(BLOC_FB, mute))); } catch (e) { detecte = true; }
  if (detecte) { vertsC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { rougesC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
function mordS(titre, fichier, ancre, remplace) {
  const n = SRC[fichier].split(ancre).length - 1;
  if (n !== 1) { rougesC.push(titre); console.log('  ROUGE  ' + titre + ' → ANCRE ' + (n ? 'NON UNIQUE (' + n + ')' : 'INTROUVABLE')); return; }
  const S2 = Object.assign({}, SRC); S2[fichier] = SRC[fichier].replace(ancre, remplace);
  const tousVerts = statiques(S2).every(x => x[0]);
  if (!tousVerts) { vertsC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { rougesC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
// Le défaut d'origine : une lecture ratée (null) reconstruite en registre vide ou réduit.
await mord('★★★ le registre repart d’une liste réduite (l’ancien repli)', 'gt',
  "var slugs = (tenants && Array.isArray(tenants.slugs)) ? tenants.slugs.slice() : [];", "var slugs = ['a'];", 'regAjout');
await mord('★★★ la transaction ne relit plus (document vu comme absent)', 'fb',
  "    var existe = snap.exists();\n    var suite = fn(existe ? snap.data() : null, existe);", "    var existe = false;\n    var suite = fn(null, existe);", 'jrnConcurrent');
await mord('★★ fbAdminMaj écrit même quand la fonction ne rend rien', 'fb',
  "    if (suite === undefined) return { ecrit: false, valeur: existe ? snap.data().value : undefined };", "", 'errPurge');
await mord('★★★ l’équipe repart de zéro (lecture prise pour du vide)', 'gt',
  "  if (liste === undefined){ if (existe) throw new Error('liste des membres illisible'); liste = []; }\n  if (!Array.isArray(liste)) throw new Error('liste des membres illisible');",
  "  liste = [];", 'mbrAjout');
await mord('★ le doublon d’adresse n’est plus refusé', 'gt', "    if (cle && vus[cle]) return;\n", '', 'mbrAjout');
await mord('★★ la facturation écrit sans comparer (écrasement silencieux)', 'gt',
  "  if (_agtJsonStable(v[slug]) !== base){ var c = new Error('facturation modifi\\u00e9e ailleurs'); c.conflit = true; c.frais = v; throw c; }", '', 'facConflit');
await mord('★ la comparaison redevient sensible à l’ordre des clés', 'gt',
  "  return '{' + Object.keys(v).sort().filter(", "  return '{' + Object.keys(v).filter(", 'facOrdreCles');
await mord('★★ le lead écrit sans comparer', 'gt',
  "  if (_agtJsonStable(v[id]) !== base){ var c = new Error('lead modifi\\u00e9 ailleurs'); c.conflit = true; c.frais = v; throw c; }", '', 'leadConflit');
await mord('★ le journal ne se garde plus par la date', 'gt',
  "  var lim = (maintenant || Date.now()) - _AGT_AL_JOURS * 86400000;", "  var lim = 0;", 'jrnDate');
await mord('★ la console et le serveur divergent (plafond)', 'gt',
  "var _AGT_AL_JOURS = 365, _AGT_AL_MAX = 2000;", "var _AGT_AL_JOURS = 365, _AGT_AL_MAX = 100;", 'jrnServeur');
await mord('★★ traiter une erreur repart de la copie (purge totale)', 'gt',
  "  if (purge) return liste.filter(function(e){ return !(e && e.resolved); });", "  if (purge) return [];", 'errPurge');
await mord('★★ la config écrit 0 pour une case vide (GT-B17)', 'gt',
  "  if (!isNaN(lat)) cfg.lat = lat;", "  cfg.lat = lat || 0;", 'cfgChamps');
await mord('★ la config d’une forme inconnue est écrasée', 'gt',
  "  if (cfg === undefined){ if (existe) throw new Error('config illisible'); cfg = {}; }", "  if (cfg === undefined) cfg = {};", 'cfgInconnue');
await mord('★ la forme inconnue des codes est écrasée', 'gt',
  "  else throw new Error('liste des codes illisible');", "  else v = [];", 'codes');
await mord('★ le plafond de taille saute', 'fb',
  "    if (_fbGtTaille(suite) > _FB_GT_PLAFOND) throw new Error('document trop gros : ' + key);\n    tx.set(ref, suite);", "    tx.set(ref, suite);", 'taille');
mordS('★★ une écriture GT repasse par fbAdminWriteGT', 'gt',
  "    var _rc=await window.fbGtMaj('demo_tokens',function(d,existe){ return _agtMutCodes(d,existe,function(v){ v.push(entry); return v; }); });",
  "    await window.fbAdminWriteGT('demo_tokens',{value:_agtEssais}); var _rc={valeur:{value:_agtEssais}};");
mordS('★★ le KML relit de nouveau par fbAdminRead', 'gt',
  "    var _lk = await window.fbAdminLire(slug, 'kml_polygons');", "    var _lk = { existe:true, valeur: await window.fbAdminRead(slug, 'kml_polygons') };");
mordS('★★ le serveur purge de nouveau les accès d’un domaine supprimé', 'cl',
  "      const list = logSnap.exists ? logSnap.data().value : [];", "      const list = (logSnap.exists ? logSnap.data().value : []).filter((a) => a && a.tenant !== slug);");
mordS('★ une écriture de facturation oublie son domaine', 'gt',
  "  fs.splice(k,1);\n  if(await _agtSaveBilling(t.slug)){", "  fs.splice(k,1);\n  if(await _agtSaveBilling()){");
console.log('\n' + '─'.repeat(30) + '\n  ' + vertsC.length + ' vert · ' + rougesC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(rougesC.length ? 1 : 0);
