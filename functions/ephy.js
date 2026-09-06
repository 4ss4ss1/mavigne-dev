/**
 * ════════════════════════════════════════════════════════════════════════
 *  Ma Vigne — Synchronisation catalogue phyto E-Phy (ANSES) → Firestore
 *  GUERETTECH · functions/ephy.js   ·   v3 (multi-familles + noms de revente)
 * ────────────────────────────────────────────────────────────────────────
 *  Source : Données ouvertes E-Phy — Anses (data.gouv.fr, Licence Ouverte).
 *  Données INDICATIVES et NON OPPOSABLES (seul le registre officiel fait foi).
 *
 *  v3 — couvre TOUTES les familles utiles à la vigne :
 *    PPP · MFSC (engrais/biostimulants) · adjuvants · produits mixtes · mélanges.
 *
 *  Principe « tolérant » (comme v2, étendu) :
 *    - On lit TOUS les CSV de l'archive, sans présumer leurs noms exacts.
 *    - Chaque CSV est classé « produits » (colonne AMM + colonne nom, sans
 *      colonne usage) ou « usages » (colonne AMM + colonne identifiant usage).
 *    - Le filtre « vigne » se fait par VALEUR (toute cellule contenant
 *      « vigne ») → indépendant des noms de colonnes et des familles.
 *    - Les SECONDS NOMS COMMERCIAUX (noms de revente, ex. « Penn'Thiol
 *      Rainfree » = Microthiol Special Liquide) sont extraits par produit et
 *      stockés dans `noms2[]` → recherchables côté app sans gonfler le nombre
 *      d'entrées (1 entrée par AMM).
 *    - Garde-fou : compaction progressive si le doc Firestore approche 1 Mo.
 *
 *  ⚠️ DIAG : on logge la liste des fichiers du ZIP + les en-têtes des fichiers
 *     produits/usages détectés + un récap par famille (à lire dans les logs).
 *
 *  Dépendances : npm i adm-zip csv-parse   (fetch natif Node 22)
 * ════════════════════════════════════════════════════════════════════════
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ── Config ──────────────────────────────────────────────────────────────
const REGION = 'europe-west1';
const DATASET_SLUG =
  'donnees-ouvertes-du-catalogue-e-phy-des-produits-phytopharmaceutiques-' +
  'matieres-fertilisantes-et-supports-de-culture-adjuvants-produits-mixtes-et-melanges';
const DATAGOUV_API = `https://www.data.gouv.fr/api/1/datasets/${DATASET_SLUG}/`;
const TARGET_COL = 'ephy';
const TARGET_DOC = 'vigne';
const CULTURE_MATCH = 'vigne';

const MAX_DOC_BYTES = 950000;   // marge sous la limite Firestore 1 Mo
const USAGES_CAP_OK = 4;        // usages max conservés (produit autorisé)
const USAGES_CAP_KO = 1;        // usages max conservés (produit retiré)
const NOMS2_CAP     = 40;       // garde-fou noms de revente par produit

// ── Helpers normalisation ─────────────────────────────────────────────────
function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[\s_]+/g, ' ').trim();
}
// Match exact d'abord sur TOUS les candidats, puis "contient" — évite qu'un
// candidat large rafle une colonne voisine.
function findCol(headers, ...candidates) {
  const H = headers.map(h => ({ raw: h, n: norm(h) }));
  for (const cand of candidates) { const c = norm(cand); const hit = H.find(h => h.n === c); if (hit) return hit.raw; }
  for (const cand of candidates) { const c = norm(cand); const hit = H.find(h => h.n.includes(c)); if (hit) return hit.raw; }
  return null;
}
function val(row, col) { return col && row[col] != null ? String(row[col]).trim() : ''; }
function rowHasVigne(row) { return Object.values(row).some(v => norm(v).includes(CULTURE_MATCH)); }
function pickDate(row, c) { const v = val(row, c); return v && v !== '0' ? v : null; }

// Découpe la cellule « seconds noms commerciaux » en liste propre.
function splitNoms2(s) {
  const raw = String(s == null ? '' : s).trim();
  if (!raw) return [];
  const low = norm(raw);
  if (low === 'aucun' || low === '[aucun]' || low === '-' || low === 'neant') return [];
  const seen = new Set(); const out = [];
  raw.split(/[,;|]/).forEach(part => {
    const name = part.replace(/[[\]]/g, '').trim();
    const nn = norm(name);
    if (!name || nn === 'aucun' || nn === 'neant' || name === '-') return;
    if (!seen.has(nn)) { seen.add(nn); out.push(name); }
  });
  return out.slice(0, NOMS2_CAP);
}

// ── Dérivation taxonomie Ma Vigne ─────────────────────────────────────────
function deriveType(typeProduit, substance, fonction, mentions) {
  const tp = norm(typeProduit), s = norm(substance), f = norm(fonction), m = norm(mentions);
  // Familles non-PPP (prioritaires car le « type produit » est explicite)
  if (tp.includes('adjuvant')) return 'Adjuvant';
  if (tp.includes('mixte')) return 'Mixte';
  if (tp.includes('melange')) return 'Mélange';
  if (tp.includes('mfsc') || tp.includes('matiere fertilisante') || tp.includes('support de culture') || tp.includes('fertilisant')) return 'MFSC';
  // PPP — par substance / fonction
  if (/(cuivre|cuivrique|cuivreux|bouillie bordelaise)/.test(s)) return 'Cuivre';
  if (/\bsoufre\b/.test(s)) return 'Soufre';
  if (m.includes('biocontrole') || /(bacillus|trichoderma|aureobasidium|coniothyrium|pseudomonas|phosphonate|kaolin|huile essentielle|pyrethrin|laminarine|cerevisane|maltodextrine|cos oga|equisetum|metarhizium|beauveria|spinosad)/.test(s)) return 'Biocontrôle';
  if (f.includes('herbicide')) return 'Herbicide';
  if (f.includes('insecticide') || f.includes('acaricide') || f.includes('nematicide') || f.includes('molluscicide')) return 'Insecticide';
  if (f.includes('fongicide') || f.includes('bactericide')) return 'Fongicide';
  if (fonction) return String(fonction).split(/[,;/]/)[0].trim().replace(/^./, c => c.toUpperCase());
  return 'Autre';
}
function deriveAB(substance, mentions) {
  const m = norm(mentions || '');
  if (m.includes('agriculture biologique') || m.includes('utilisable en bio') || /\bab\b/.test(m)) return true;
  return /(cuivre|cuivreux|cuivrique|soufre|bacillus|trichoderma|aureobasidium|kaolin|huile|pyrethrin|spinosad|laminarine|phosphate ferrique)/.test(norm(substance));
}

// ── DRE/CLP — délai de rentrée dérivé de la classification (codes Hxxx) ────
//  Arrêté du 4 mai 2017 (art. 3-III) : DRE par défaut 6 h, porté à 24 h pour
//  H315/H318/H319 et à 48 h pour H317/H334 + tous les CMR. On repère les
//  codes PAR CONTENU (jamais par nom de colonne → robuste aux renommages
//  ANSES et aux nouveaux produits, repris automatiquement à chaque resync).
const H_CODE_RE = /\bH[234]\d{2}[A-Za-z]{0,2}\b/g;
const DRE_24 = new Set(['H315', 'H318', 'H319']);
const DRE_48 = new Set([
  'H317', 'H334', 'H340', 'H341', 'H350', 'H350I', 'H351',
  'H360F', 'H360D', 'H360FD', 'H360DF', 'H361F', 'H361D', 'H361FD', 'H362',
]);
function extractHCodes(s) {
  const m = String(s == null ? '' : s).match(H_CODE_RE);
  return m || [];
}
// 48 h prioritaire sur 24 h ; renvoie le code déclencheur (affichage app).
function dreFromCodes(codes) {
  let c24 = null;
  for (let i = 0; i < codes.length; i++) {
    const u = codes[i].toUpperCase();
    if (DRE_48.has(u)) return { h: 48, code: u };
    if (!c24 && DRE_24.has(u)) c24 = u;
  }
  return c24 ? { h: 24, code: c24 } : { h: 0, code: null };
}
// Repère les colonnes contenant des codes Hxxx (≥3 occurrences sur un
// échantillon → évite qu'un code apparu par hasard fasse un faux positif).
function detectDangerCols(file) {
  const sample = file.rows.slice(0, 600);
  const counts = {};
  for (let ci = 0; ci < file.headers.length; ci++) {
    const col = file.headers[ci];
    let n = 0;
    for (let ri = 0; ri < sample.length; ri++) {
      const v = sample[ri][col];
      if (v && String(v).match(H_CODE_RE)) n++;
    }
    if (n >= 3) counts[col] = n;
  }
  return counts;
}

// ── Découverte dynamique de l'URL du ZIP CSV (UTF-8) ──────────────────────
async function resolveCsvZipUrl() {
  const res = await fetch(DATAGOUV_API, { headers: { 'User-Agent': 'MaVigne-EphySync/1.0' } });
  if (!res.ok) throw new Error(`API data.gouv ${res.status}`);
  const ds = await res.json();
  const resources = Array.isArray(ds.resources) ? ds.resources : [];
  const isZip = r => (r.format && norm(r.format) === 'zip') || /\.zip(\?|$)/i.test(r.url || '');
  const pick = resources.find(r => { const t = norm(r.title) + ' ' + norm(r.url); return isZip(r) && t.includes('csv') && (t.includes('utf 8') || t.includes('utf8')); })
            || resources.find(r => { const t = norm(r.title) + ' ' + norm(r.url); return isZip(r) && t.includes('csv'); });
  if (!pick) throw new Error('Archive ZIP CSV introuvable dans les ressources data.gouv');
  return { url: pick.latest || pick.url, sourceDate: pick.last_modified || pick.published || null };
}

// ── Lecture de TOUS les CSV de l'archive ──────────────────────────────────
function readAllCsv(zip) {
  const out = [];
  const entries = zip.getEntries().filter(e => !e.isDirectory && norm(e.entryName.split('/').pop()).endsWith('csv'));
  for (const e of entries) {
    let rows;
    try {
      rows = parse(e.getData().toString('utf8'), {
        delimiter: ';', columns: true, skip_empty_lines: true,
        relax_quotes: true, relax_column_count: true, bom: true, trim: true,
      });
    } catch (err) { logger.warn('CSV illisible', { file: e.entryName, err: String(err) }); continue; }
    if (!rows || !rows.length) continue;
    out.push({ name: e.entryName, base: e.entryName.split('/').pop(), rows, headers: Object.keys(rows[0]) });
  }
  return out;
}

// Classe un fichier : produits vs usages (par présence de colonnes).
function classify(file) {
  const h = file.headers;
  const amm = findCol(h, 'numero AMM', 'AMM', 'numero d intrant', 'numero intrant', 'numero de permis', 'numero permis');
  const usage = findCol(h, 'identifiant usage lib court', 'identifiant usage', 'intitule usage', 'libelle usage');
  const name = findCol(h, 'nom produit', 'denomination', 'nom commercial', 'nom du produit', 'nom');
  return { amm, usage, name, isUsage: !!(amm && usage), isProduct: !!(amm && name && !usage) };
}

// ════════════════════════════════════════════════════════════════════════
async function runSync() {
  const t0 = Date.now();

  // 1) Résoudre + télécharger
  const { url, sourceDate } = await resolveCsvZipUrl();
  logger.info('E-Phy : téléchargement', { url });
  const dl = await fetch(url, { headers: { 'User-Agent': 'MaVigne-EphySync/1.0' } });
  if (!dl.ok) throw new Error(`Téléchargement ZIP ${dl.status}`);
  const zip = new AdmZip(Buffer.from(await dl.arrayBuffer()));

  // 2) Lire + classer tous les CSV
  const files = readAllCsv(zip);
  if (!files.length) throw new Error('Aucun CSV exploitable dans le ZIP');
  const classified = files.map(f => ({ f, c: classify(f) }));
  const productFiles = classified.filter(x => x.c.isProduct);
  const usageFiles = classified.filter(x => x.c.isUsage);
  if (!productFiles.length) throw new Error('Aucun fichier produits détecté');

  // 3) ░░░ DIAG ░░░
  logger.info('DIAG ZIP entries', { entries: zip.getEntries().map(e => e.entryName) });
  logger.info('DIAG fichiers produits', { files: productFiles.map(x => ({ f: x.f.base, n: x.f.rows.length, headers: x.f.headers })) });
  logger.info('DIAG fichiers usages', { files: usageFiles.map(x => ({ f: x.f.base, n: x.f.rows.length, headers: x.f.headers })) });

  // 4) Index produits (fusion multi-fichiers / multi-familles)
  const idx = new Map();
  for (const { f, c } of productFiles) {
    const h = f.headers;
    const C = {
      fonction:  findCol(h, 'fonctions', 'fonction'),
      substance: findCol(h, 'substances actives', 'substance active', 'substance', 'composition', 'nom substance active'),
      etat:      findCol(h, 'etat administratif produit', 'etat d autorisation', 'etat produit', 'etat autorisation', 'etat'),
      mentions:  findCol(h, 'mentions autorisees', 'mentions', 'gamme usage'),
      type:      findCol(h, 'type produit', 'type de produit', 'type commercial'),
      noms2:     findCol(h, 'seconds noms commerciaux', 'second nom commercial', 'seconds noms', 'noms commerciaux', 'autres noms'),
      dRetrait:  findCol(h, 'date retrait produit', 'date de retrait', 'date retrait'),
      dEcoul:    findCol(h, 'date fin distribution', 'date fin utilisation', 'date limite utilisation', 'date fin commercialisation'),
    };
    for (const r of f.rows) {
      const amm = val(r, c.amm); if (!amm) continue;
      const etat = norm(val(r, C.etat));
      const statut = etat.includes('retir') ? 'ko' : 'ok';
      const cur = idx.get(amm) || { nom: '', fonction: '', substance: '', statut: 'ok', mentions: '', typeProduit: '', noms2: [], retraitDate: null, ecoulement: null };
      const nom = val(r, c.name);
      if (nom && (!cur.nom || cur.nom === '(sans nom)')) cur.nom = nom;
      if (!cur.fonction) cur.fonction = val(r, C.fonction);
      if (!cur.substance) cur.substance = val(r, C.substance);
      if (!cur.mentions) cur.mentions = val(r, C.mentions);
      if (!cur.typeProduit) cur.typeProduit = val(r, C.type);
      cur.statut = statut;
      if (C.dRetrait) { const d = pickDate(r, C.dRetrait); if (d && !cur.retraitDate) cur.retraitDate = d; }
      if (C.dEcoul)   { const d = pickDate(r, C.dEcoul);   if (d && !cur.ecoulement)  cur.ecoulement  = d; }
      const n2 = splitNoms2(val(r, C.noms2));
      for (const x of n2) if (cur.noms2.indexOf(x) < 0) cur.noms2.push(x);
      cur.noms2 = cur.noms2.slice(0, NOMS2_CAP);
      idx.set(amm, cur);
    }
  }

  // 4bis) DRE/CLP — détection des codes de danger Hxxx PAR CONTENU
  //   Indépendant des noms de colonnes (ANSES peut les renommer). On scanne
  //   tous les fichiers (produits ET usages), on repère les colonnes portant
  //   des codes Hxxx, et on en dérive le délai de rentrée réglementaire.
  const dreByAmm = new Map();
  const dangerColsDiag = [];
  for (const { f, c } of classified) {
    const dcols = detectDangerCols(f);
    const dnames = Object.keys(dcols);
    if (!dnames.length) continue;
    dangerColsDiag.push({ file: f.base, cols: dcols });
    const ammCol = c.amm;
    if (!ammCol) continue;
    for (const r of f.rows) {
      const amm = val(r, ammCol); if (!amm) continue;
      const codes = [];
      for (const dn of dnames) { const hc = extractHCodes(r[dn]); for (let i = 0; i < hc.length; i++) codes.push(hc[i]); }
      if (!codes.length) continue;
      const dre = dreFromCodes(codes);
      if (dre.h > 0) { const prev = dreByAmm.get(amm); if (!prev || dre.h > prev.h) dreByAmm.set(amm, dre); }
    }
  }
  if (!dangerColsDiag.length) {
    logger.warn('⚠️ DRE/CLP : AUCUNE colonne de codes de danger Hxxx détectée dans l\'archive E-Phy. Le délai de rentrée dérivé restera 0 (le défaut légal 6 h s\'applique côté app). La classification CLP n\'est peut-être pas exportée par ANSES → prévoir une source complémentaire.');
  } else {
    logger.info('DIAG colonnes danger (CLP) détectées par contenu', { files: dangerColsDiag, ammClasses: dreByAmm.size });
  }

  // 5) Usages Vigne — FILTRE PAR VALEUR sur tous les fichiers « usages »
  const byAmm = new Map();
  function addUsage(amm, cible, dose, dar, znt, drae) {
    const cur = byAmm.get(amm) || { usages: [], drae: 0 };
    cur.usages.push({ cible, dose, dar, znt });
    if (drae > cur.drae) cur.drae = drae;
    byAmm.set(amm, cur);
  }
  for (const { f, c } of usageFiles) {
    const h = f.headers;
    const U = {
      cible:   findCol(h, 'identifiant usage lib court', 'identifiant usage', 'libelle usage', 'intitule usage', 'culture'),
      dose:    findCol(h, 'dose retenue', 'dose min par apport', 'dose'),
      unite:   findCol(h, 'dose retenue unite', 'dose unite', 'dose min par apport unite', 'unite dose', 'unite'),
      dar:     findCol(h, 'delai avant recolte', 'delai avant recolte (jour)', 'dar'),
      znt:     findCol(h, 'znt aquatique', 'znt aqua', 'znt'),
      rentree: findCol(h, 'delai de rentree', 'delai rentree'),
    };
    for (const r of f.rows) {
      if (!rowHasVigne(r)) continue;
      const amm = val(r, c.amm); if (!amm) continue;
      const dose = [val(r, U.dose), val(r, U.unite)].filter(Boolean).join(' ') || '—';
      const darRaw = val(r, U.dar);   const dar = darRaw && /\d/.test(darRaw) ? parseInt(darRaw, 10) : '—';
      const zntRaw = val(r, U.znt);   const znt = zntRaw && /\d/.test(zntRaw) ? parseFloat(zntRaw.replace(',', '.')) : '—';
      const rRaw   = val(r, U.rentree); const drae = rRaw && /\d/.test(rRaw) ? parseInt(rRaw, 10) : 0;
      const cible  = (val(r, U.cible) || 'Vigne').replace(/\*/g, ' · ');
      addUsage(amm, cible, dose, dar, znt, drae);
    }
  }

  // 6) Repli familles NON-PPP : usage « vigne » porté par la ligne produit
  //    (MFSC/adjuvants/mixtes/mélanges dont la culture est dans la fiche
  //    produit, sans ligne d'usage dédiée). On évite le texte libre des PPP.
  for (const { f, c } of productFiles) {
    const fam = norm(f.base);
    const isPPP = fam.includes('produit') && !fam.includes('mfsc') && !fam.includes('mixte') && !fam.includes('adjuvant') && !fam.includes('melange');
    if (isPPP) continue;
    for (const r of f.rows) {
      if (!rowHasVigne(r)) continue;
      const amm = val(r, c.amm); if (!amm) continue;
      if (byAmm.has(amm)) continue;
      addUsage(amm, 'Vigne', '—', '—', '—', 0);
    }
  }

  // 7) Construction du tableau de sortie (1 entrée par AMM)
  const finalAmms = new Set([...byAmm.keys()]);
  function buildEntry(amm, usagesCap) {
    const p = idx.get(amm) || { nom: '(AMM ' + amm + ')', substance: '', fonction: '', mentions: '', typeProduit: '', statut: 'ok', noms2: [], retraitDate: null, ecoulement: null };
    const agg = byAmm.get(amm) || { usages: [], drae: 0 };
    const ment = [];
    if (deriveAB(p.substance, p.mentions)) ment.push('AB');
    if (/abeille/.test(norm(p.mentions))) ment.push('Abeilles');
    const seen = new Set(); const usages = [];
    for (const u of agg.usages) { const k = norm(u.cible); if (seen.has(k)) continue; seen.add(k); usages.push(u); if (usages.length >= usagesCap) break; }
    const e = {
      nom: p.nom || '(sans nom)',
      type: deriveType(p.typeProduit, p.substance, p.fonction, p.mentions),
      amm,
      sub: p.substance || '—',
      statut: p.statut || 'ok',
      drae: agg.drae || 0,
      ment,
      usages,
    };
    var _dreCLP = dreByAmm.get(amm);
    if (_dreCLP && _dreCLP.h > 0) { e.dreH = _dreCLP.h; if (_dreCLP.code) e.dreHc = _dreCLP.code; }
    if (p.noms2 && p.noms2.length) e.noms2 = p.noms2;
    if (e.statut === 'ko' && p.retraitDate) e.retraitDate = p.retraitDate;
    if (e.statut === 'ko' && p.ecoulement) e.ecoulement = p.ecoulement;
    return e;
  }
  function buildAll(capOk, capKo) {
    const arr = [];
    for (const amm of finalAmms) {
      const stat = (idx.get(amm) || {}).statut || 'ok';
      arr.push(buildEntry(amm, stat === 'ko' ? capKo : capOk));
    }
    arr.sort((a, b) => a.statut === b.statut ? a.nom.localeCompare(b.nom, 'fr') : (a.statut === 'ok' ? -1 : 1));
    return arr;
  }

  // 8) Garde-fou taille Firestore (compaction progressive)
  let produitsOut = buildAll(USAGES_CAP_OK, USAGES_CAP_KO);
  let bytes = Buffer.byteLength(JSON.stringify(produitsOut), 'utf8');
  if (bytes > MAX_DOC_BYTES) {
    logger.warn('Catalogue volumineux — compaction niveau 1', { bytes, count: produitsOut.length });
    produitsOut = buildAll(2, 0);
    bytes = Buffer.byteLength(JSON.stringify(produitsOut), 'utf8');
  }
  if (bytes > MAX_DOC_BYTES) {
    logger.warn('Catalogue volumineux — compaction niveau 2 (retirés réduits)', { bytes });
    for (const e of produitsOut) { if (e.statut === 'ko') { e.usages = []; if (e.noms2) delete e.noms2; } }
    bytes = Buffer.byteLength(JSON.stringify(produitsOut), 'utf8');
  }

  // ── DIAG DRE/CLP : distribution du délai de rentrée dérivé ──────────
  var _withDre = produitsOut.filter(function (e) { return e.dreH > 0; });
  var _d48 = _withDre.filter(function (e) { return e.dreH === 48; }).length;
  var _d24 = _withDre.filter(function (e) { return e.dreH === 24; }).length;
  logger.info('DIAG DRE dérivé du CLP (par contenu)', {
    produits: produitsOut.length,
    dre48h: _d48, dre24h: _d24, defaut6h: produitsOut.length - _withDre.length,
    echantillon: _withDre.slice(0, 12).map(function (e) {
      return { nom: e.nom, amm: e.amm, dreH: e.dreH, code: e.dreHc || null };
    }),
  });

  // 9) Écriture Firestore
  const byType = {}; for (const e of produitsOut) byType[e.type] = (byType[e.type] || 0) + 1;
  await db.collection(TARGET_COL).doc(TARGET_DOC).set({
    updated: admin.firestore.FieldValue.serverTimestamp(),
    source: 'Données E-Phy — Anses', sourceUrl: 'https://ephy.anses.fr',
    sourceDate: sourceDate || null, count: produitsOut.length, produits: produitsOut,
  });

  const summary = {
    count: produitsOut.length, ammVigne: finalAmms.size, bytes,
    productFiles: productFiles.length, usageFiles: usageFiles.length, byType,
    dre48: _d48, dre24: _d24, ms: Date.now() - t0,
  };
  logger.info('E-Phy : synchro terminée', summary);
  return summary;
}

// ── Exports ───────────────────────────────────────────────────────────────
exports.syncEphyVigne = onSchedule(
  { schedule: 'every wednesday 05:00', timeZone: 'Europe/Paris', region: REGION, memory: '1GiB', timeoutSeconds: 300, retryCount: 1 },
  async () => { await runSync(); }
);
exports.syncEphyVigneNow = onCall(
  { region: REGION, enforceAppCheck: true, memory: '1GiB', timeoutSeconds: 300 },
  async (req) => {
    if (!req.auth || !(req.auth.token && req.auth.token.gtAdmin)) throw new HttpsError('permission-denied', 'Réservé à GUERETTECH (gtAdmin).');
    try { return await runSync(); } catch (e) { logger.error('syncEphyVigneNow', e); throw new HttpsError('internal', e.message || 'Échec synchro E-Phy'); }
  }
);
