// HARNAIS — PHYTO-2 (§286) : le catalogue E-Phy en liste + fiche (maquette v7) — la fiche est le détail de l'appli, écrit dans la page.
//   node scripts/mv-harnais-phyto2.mjs           → doit être vert
//   node scripts/mv-harnais-phyto2.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE openEphyDetail : avec un conteneur, le détail s'y écrit et aucune fenêtre ne s'ouvre ; sans, la fenêtre comme avant.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { tr: L('src/tracteur.js'), css: L('src/styles.css'), html: L('index.html'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ PHYTO-2 (§286)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PHYTO-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function detail(S, dans) {
  const els = {}; const el = (id) => (els[id] = els[id] || { id, innerHTML: '', textContent: '' });
  const ouverts = [];
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const P = [{ nom: 'Bouillie <RSR>', type: 'Cuivre', amm: '9200417', sub: 'Cuivre', statut: 'ok', drae: 24, ment: ['Abeilles'], usages: [{ cible: 'Mildiou', dose: '4 kg/ha', dar: '21', znt: '5' }] }];
  const f = new Function('_ephyList', 'document', 'window', '_escHtml', '_escAttr', '_mvIcon', 'dreEffectif', fonction(S.tr, 'function openEphyDetail(amm,dans){') + '\nopenEphyDetail("9200417", arguments[7]);');
  f(() => P, { getElementById: el }, { openOv: (id) => ouverts.push(id) }, esc, esc, () => '', () => ({ h: 24, txt: '24 h', txtLong: '24 heures', defaut: false, na: false }), dans);
  return { fiche: (els['cat-fiche'] || {}).innerHTML || '', corps: (els['oed-body'] || {}).innerHTML || '', titre: (els['oed-title'] || {}).textContent || '', ouverts };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}; try { a = detail(S, 'cat-fiche'); b = detail(S, undefined); } catch (e) { a = { erreur: e.message, fiche: '', ouverts: ['x'] }; }
  T('avec un conteneur : le détail s’écrit dans la fiche (nom échappé, AMM, statut, usages, avertissement) et aucune fenêtre ne s’ouvre', a.fiche.includes('Bouillie &lt;RSR&gt;') && a.fiche.includes('AMM 9200417') && a.fiche.includes('Autoris') && a.fiche.includes('Usages homologu') && a.fiche.includes('Donnée indicative') && a.ouverts.length === 0 && a.titre === '');
  T('sans conteneur : la fenêtre comme avant (titre, corps, ouverture)', b.titre === 'Bouillie <RSR>' && b.corps.includes('Usages homologu') && b.ouverts[0] === 'ovEphyDetail' && b.fiche === '');
  T('sur ordinateur, toucher un produit le choisit ; au téléphone, la fenêtre', S.tr.includes("data-amm=\"'+_escAttr(p.amm)+'\" onclick=\"_catSel(\\'' + _escAttr(p.amm) + '\\')\"") && S.tr.includes("function _catSel(amm){\n  if(!_catDesk()){ openEphyDetail(amm); return; }"));
  T('la fiche suit la liste filtrée (garde de type pour les harnais qui jouent ephyRender seule)', S.tr.includes("  if(typeof _catFicheSync==='function')_catFicheSync(l);   // PHYTO-2 (§286)"));
  T('la page a la colonne de fiche', S.html.includes('<aside class="phf" id="cat-fiche"'));
  T('le bloc PHYTO-2 est posé après PHYTO-1, par jetons seulement (' + dur.length + ')', B.length > 2000 && S.css.indexOf('★ PHYTO-2 (§286)') > S.css.indexOf('★ FIN PHYTO-1') && dur.length === 0);
  T('liste + fiche au large, fiche collante ; la fiche partage les règles des autres fiches', B.includes('#page-phyto #tab-cat-trac{ display:grid; grid-template-columns:minmax(0,1fr) var(--l-fiche,440px);') && S.css.includes(':is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche) .trf-hd{'));
  T('l’aide dit la fiche du catalogue', S.uti.includes('Dans le Catalogue, toucher un produit ouvre de la même façon sa fiche E-Phy à droite'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-phyto2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-phyto2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la fiche ouvre aussi la fenêtre', 'tr', "+_corps+'</div>'; return; }", "+_corps+'</div>'; window.openOv('ovEphyDetail'); return; }", 0],
    ['le nom n’est plus échappé dans la fiche', 'tr', "<h2 class=\"trf-t\">'+_escHtml(p.nom)+'</h2><div class=\"trf-tags\"><span class=\"trf-tag\">AMM '", "<h2 class=\"trf-t\">'+p.nom+'</h2><div class=\"trf-tags\"><span class=\"trf-tag\">AMM '", 0],
    ['la fenêtre perd son titre', 'tr', "if(!dans){ document.getElementById('oed-title').textContent = p.nom;", "if(false){ document.getElementById('oed-title').textContent = p.nom;", 1],
    ['au téléphone, toucher choisit au lieu d’ouvrir', 'tr', "  if(!_catDesk()){ openEphyDetail(amm); return; }\n", '', 2],
    ['la fiche ne suit plus la liste', 'tr', "  if(typeof _catFicheSync==='function')_catFicheSync(l);   // PHYTO-2 (§286)\n", '', 3],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-phyto .ephy-tgl.on .sw{ background:var(--accent)!important; }', '#page-phyto .ephy-tgl.on .sw{ background:#7A2048!important; }', 5],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-phyto2.mjs'],", '', 8]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
