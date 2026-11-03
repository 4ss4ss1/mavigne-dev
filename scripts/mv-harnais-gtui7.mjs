// ═══════════════════════════════════════════════════════════
//  HARNAIS GT-UI-7 — TOUTE LA CONSOLE SUR LA CHARTE, SES ÉCRANS TÉLÉPHONE (§522)
// ═══════════════════════════════════════════════════════════
//  Le dernier lot du chantier « console GT » : Outils (le journal d'accès en
//  tableau, la maquette), Signalements, les blocs des fiches et les dernières
//  fenêtres passent sur la charte — plus aucune couleur écrite pour un fond
//  sombre hors de l'assistant d'installation (sa feuille propre) ; plus aucun
//  cadre « ancien rendu » ; les écrans téléphone de la maquette.
//
//  Usage :  node scripts/mv-harnais-gtui7.mjs
//           node scripts/mv-harnais-gtui7.mjs --contre
// ═══════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';

const CONTRE = process.argv.includes('--contre');
const lire = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SRC = { gt: lire('src/admin-gt.js'), css: lire('src/styles.css'), cli: lire('src/gt/clients.js') };
function bornes(src, nom) {
  const m = new RegExp('^(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) return null;
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return [m.index, j + 1];
  }
  return null;
}
const fonction = (src, nom) => { const b = bornes(src, nom); if (!b) throw new Error('ABSENTE : ' + nom); return src.slice(b[0], b[1]); };
// Le fichier sans l'assistant d'installation (sa feuille agi-* garde son propre fond, choix assumé).
function horsAssistant(src) {
  const plages = [];
  for (const m of src.matchAll(/^(?:async\s+)?function (_?agtIns\w*)\s*\(/gm)) { const b = bornes(src, m[1]); if (b) plages.push(b); }
  plages.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0; for (const [a, b] of plages) { out += src.slice(pos, a); pos = b; }
  return out + src.slice(pos);
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function journal(gt, log, q, type) {
  const v = /^var _agtLogQ='', _agtLogType='';\n/m.exec(gt) ? '' : 'throw new Error("états du journal absents");';
  const types = /^var _AGT_LOG_TYPES=\{[^\n]*\};/m.exec(gt);
  return new Function('_agtAccessLog', '_agtTenants', '_escHtml', '_agtDateFr', 'Q', 'T', v + 'var _agtLogQ=Q, _agtLogType=T;' + (types ? types[0] : '') + fonction(gt, '_agtBuildLog') + '\nreturn _agtBuildLog();')(log, [{ slug: 'clos', nom: 'Clos Saint-Aubin' }], esc, x => String(x).slice(0, 10).split('-').reverse().join('/'), q, type);
}
const LOG = [{ ts: '2026-11-01T15:06:00Z', tenant: 'clos', action: 'Préparation ouverte', type: 'donnees' }, { ts: '2026-11-01T13:24:00Z', tenant: 'clos', action: 'Relance préparée <b>', type: 'commercial' },
  { ts: '2026-11-02T10:30:00Z', tenant: '', action: 'Code d’essai : entrée', type: '' }];
const ESSAIS = {
  journal(gt) {
    const h = journal(gt, LOG, '', ''), hc = journal(gt, LOG, '', 'commercial'), hq = journal(gt, LOG, 'preparation', '');
    const iA = h.indexOf('Code d’essai'), iB = h.indexOf('Préparation ouverte');
    return h.indexOf('<table class="agt-tbl">') !== -1 && iA !== -1 && iA < iB && h.indexOf('Relance préparée &lt;b&gt;') !== -1 && h.indexOf('<b>') === -1
      && h.indexOf('Clos Saint-Aubin') !== -1 && h.indexOf('>Accès aux données<') !== -1 && h.indexOf('>Système<') !== -1
      && hc.indexOf('Préparation ouverte') === -1 && hc.indexOf('Relance préparée') !== -1 && hq.indexOf('Préparation ouverte') !== -1 && hq.indexOf('Relance') === -1;
  }
};
const LIB = { journal: '★★ le journal d’accès en tableau : le plus récent d’abord, le domaine nommé, le type en pastille, la recherche et le filtre par type ; une action piégée reste du texte' };
function statiques(S) {
  const r = [], H = horsAssistant(S.gt);
  const clair = (H.match(/(?<![\w-])color\s*:\s*(?:#fff\b|#FFF\b|#F0E8DC|rgba\(255,\s*255,\s*255)/g) || []).length;
  const fonds = (H.match(/background(?:-color)?\s*:\s*(?:rgba\(18,14,28|#0F0B16|#16111F|#120E1C|#1A1428)/g) || []).length;
  r.push([clair === 0 && fonds === 0, '★★★ plus aucune couleur écrite pour un fond sombre hors de l’assistant d’installation (' + clair + ' textes, ' + fonds + ' fonds)']);
  let mal = 0;
  for (const m of H.matchAll(/style="([^"]{0,900})"/g)) {
    const z = m[1];
    if (/background(?:-color)?:var\(--(?:accent|danger|ok)\)/.test(z) && /(?<![\w-])color:var\(--texte\)/.test(z)) mal++;
  }
  r.push([mal === 0, '★★ un texte posé sur un fond plein (accent, rouge, vert) prend la couleur « sur accent » (' + mal + ')']);
  r.push([/\.agi-card\{background:#141A20/.test(S.gt), 'l’assistant d’installation garde sa feuille et son fond (choix assumé, exclu du passage)']);
  r.push([!/agt-ancien\{|class=\\?"agt-ancien/.test(S.css + S.gt + S.cli), '★★ plus aucun cadre « ancien rendu » : Outils, Signalements, blocs des fiches, visite de la démo']);
  const o = fonction(S.gt, '_agtBuildOutils');
  r.push([/class="agt-inc-onglets" role="tablist"/.test(o) && /return h\+_agtBuildLog\(\)\+'<\/div>';\n\}$/.test(o), 'Outils : les sous-onglets soulignés de la maquette, le journal d’accès d’abord']);
  const tel = S.css.slice(S.css.indexOf('@media (max-width:700px){', S.css.indexOf('GT-UI-7 (§522)')));
  r.push([/\.agt-tbl thead\{display:none;\}/.test(tel) && /\.agt-inc-corps\.avec-fiche \.agt-inc-fiche\{position:fixed;inset:0;/.test(tel) && /\.agt-inc-outils\{flex-wrap:nowrap;overflow-x:auto;/.test(tel) && /\.agt-kpis\{grid-template-columns:1fr 1fr;/.test(tel),
    '★★ au téléphone : les tableaux en cartes, les filtres sur une ligne qui défile, la fiche plein écran, les chiffres sur deux colonnes']);
  return r;
}

let verts = 0, rouges = 0;
const pose = (c, q) => { if (c) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + q); } else { rouges++; console.log('  \x1b[31m✗ ' + q + '\x1b[0m'); } };
if (!CONTRE) {
  console.log('── 1 · le journal d’accès ──');
  for (const k of Object.keys(ESSAIS)) { let c = false; try { c = ESSAIS[k](SRC.gt); } catch (e) { console.log('    (' + e.message + ')'); } pose(c, LIB[k]); }
  console.log('\n── 2 · toute la console sur la charte ──');
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
  try { detecte = essai === 'statiques' ? !statiques(S2).every(x => x[0]) : !ESSAIS[essai](S2.gt); } catch (e) { detecte = true; }
  if (detecte) { okC.push(titre); console.log('  vert   ' + titre + ' → détecté'); }
  else { koC.push(titre); console.log('  ROUGE  ' + titre + ' → PASSÉ INAPERÇU'); }
}
mord('★★★ un texte blanc pour fond sombre revient', 'gt', "color:var(--texte-doux);font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px)\">Chargement…", "color:rgba(255,255,255,0.3);font-family:var(--font-ui,Outfit,sans-serif);font-size:var(--pt-txt,13px)\">Chargement…", 'statiques');
mord('★★ le cadre « ancien rendu » revient', 'gt', "body.innerHTML=ban+_agtBuildOutils();", "body.innerHTML=ban+'<div class=\"agt-ancien\">'+_agtBuildOutils()+'</div>';", 'statiques');
mord('★★ le journal oublie le plus récent d’abord', 'gt', "}).sort(function(x,y){ return String(y.ts||'')<String(x.ts||'')?-1:1; });", "});", 'journal');
mord('★★ une action piégée s’affiche telle quelle', 'gt', "'</td><td>'+_escHtml(e.action||'')+'</td>'", "'</td><td>'+(e.action||'')+'</td>'", 'journal');
mord('★ le filtre par type laisse tout passer', 'gt', "    if(_agtLogType && ty!==_agtLogType) return false;\n", '', 'journal');
mord('★★ au téléphone, la fiche reste coincée dans la page', 'css', ".agt-inc-corps.avec-fiche .agt-inc-fiche{position:fixed;inset:0;", ".agt-inc-corps.avec-fiche .agt-inc-fiche{position:static;inset:0;", 'statiques');
console.log('\n' + '─'.repeat(30) + '\n  ' + okC.length + ' vert · ' + koC.length + ' ROUGE\n' + '─'.repeat(30));
process.exit(koC.length ? 1 : 0);
