/**
 * diag-ephy.cjs — Diagnostic LOCAL des en-têtes E-Phy (v2, vrais noms _utf8).
 * Jetable, indépendant d'ephy.js et de Firebase.
 *   cd functions   &&   node diag-ephy.cjs
 */

const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');

const SLUG =
  'donnees-ouvertes-du-catalogue-e-phy-des-produits-phytopharmaceutiques-' +
  'matieres-fertilisantes-et-supports-de-culture-adjuvants-produits-mixtes-et-melanges';
const API = `https://www.data.gouv.fr/api/1/datasets/${SLUG}/`;
const UA = { headers: { 'User-Agent': 'MaVigne-Diag/1.0' } };

const norm = s => String(s == null ? '' : s)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[\s_]+/g, ' ').trim();
const isZip = r => (r.format && norm(r.format) === 'zip') || /\.zip(\?|$)/i.test(r.url || '');

(async () => {
  console.log('→ Liste des ressources data.gouv…');
  const ds = await (await fetch(API, UA)).json();
  const res = Array.isArray(ds.resources) ? ds.resources : [];
  const pick =
    res.find(r => { const t = norm(r.title) + ' ' + norm(r.url); return isZip(r) && t.includes('csv') && (t.includes('utf 8') || t.includes('utf8')); }) ||
    res.find(r => { const t = norm(r.title) + ' ' + norm(r.url); return isZip(r) && t.includes('csv'); });
  if (!pick) throw new Error('Archive ZIP CSV introuvable');
  const url = pick.latest || pick.url;
  console.log('→ Téléchargement :', url);

  const buf = Buffer.from(await (await fetch(url, UA)).arrayBuffer());
  const zip = new AdmZip(buf);

  const read = base => {
    const ent = zip.getEntries().find(e => !e.isDirectory && norm(e.entryName.split('/').pop()) === norm(base));
    if (!ent) return null;
    return parse(ent.getData().toString('utf8'), {
      delimiter: ';', columns: true, skip_empty_lines: true,
      relax_quotes: true, relax_column_count: true, bom: true, trim: true,
    });
  };

  const dump = (file, label) => {
    const rows = read(file);
    console.log(`\n══════════ ${label} (${file}) ══════════`);
    if (!rows || !rows.length) { console.log('(introuvable ou vide)'); return rows; }
    console.log('EN-TÊTES :', Object.keys(rows[0]));
    console.log('LIGNE 0  :', rows[0]);
    return rows;
  };

  dump('produits_utf8.csv', 'PRODUITS');
  const usg = dump('produits_usages_utf8.csv', 'PRODUITS_USAGES');
  dump('produits_condition_emploi_utf8.csv', 'CONDITION_EMPLOI (delai de rentree)');

  if (usg && usg.length) {
    const vigne = usg.find(r => Object.values(r).some(v => norm(v).includes('vigne')));
    console.log('\n══════════ 1re LIGNE USAGES CONTENANT "VIGNE" ══════════');
    console.log(vigne || '(aucune trouvee)');
  }

  console.log('\n✅ Termine — copie-moi tout ce qui est ci-dessus.');
})().catch(e => { console.error('\n❌ ERREUR:', e); process.exit(1); });
