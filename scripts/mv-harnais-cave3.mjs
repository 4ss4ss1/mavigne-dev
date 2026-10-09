// HARNAIS — CAVE-3 (§290) : le Chai en liste + fiche (maquette v8) — la fiche est celle de l'appli, écrite dans la page.
//   node scripts/mv-harnais-cave3.mjs           → doit être vert
//   node scripts/mv-harnais-cave3.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES _chaiSel / _chaiFicheSync (openCuveeDetail espionnée) ; lit openCuveeDetail pour ses trois aiguillages.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { cave: L('src/cave.js'), css: L('src/styles.css'), html: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ CAVE-3 (§290)'); if (i < 0) return ''; const j = css.indexOf('★ FIN CAVE-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function jeu(S, large) {
  const appels = [], marques = [];
  const pane = { innerHTML: '' };
  const src = 'var _chaiSelId="";\n' + fonction(S.cave, 'function _chaiDesk(){') + '\n' + fonction(S.cave, 'function _chaiFicheSync(liste){') + '\n' + fonction(S.cave, 'function _chaiSel(id){')
    + '\n_chaiFicheSync([{id:"a"},{id:"b"}]); var r1=_chaiSelId; _chaiSel("b"); var r2=_chaiSelId; _chaiFicheSync([{id:"c"}]); var r3=_chaiSelId; _chaiFicheSync([]); return {r1:r1,r2:r2,r3:r3};';
  const r = new Function('window', 'document', 'openCuveeDetail', '_chaiMarque', src)({ matchMedia: () => ({ matches: large }) }, { getElementById: () => pane }, (id, dans) => appels.push([id, dans || '']), (id) => marques.push(id));
  return { r, appels, pane: pane.innerHTML };
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}; try { a = jeu(S, true); b = jeu(S, false); } catch (e) { a = { r: {}, appels: [], erreur: e.message }; b = a; }
  T('au large : la première cuvée s’ouvre dans la fiche, toucher en choisit une autre, la liste filtrée garde la fiche juste', a.r.r1 === 'a' && a.r.r2 === 'b' && a.r.r3 === 'c' && JSON.stringify(a.appels.slice(0, 3)) === JSON.stringify([['a', 'chai-fiche'], ['b', 'chai-fiche'], ['c', 'chai-fiche']]) && a.pane.includes('Aucune cuvée'));
  T('au téléphone : rien dans la fiche, toucher ouvre la fenêtre comme avant', b.appels.length === 1 && b.appels[0][0] === 'b' && b.appels[0][1] === '');
  const f = fonction(S.cave, 'function openCuveeDetail(cuvId,dans){');
  T('openCuveeDetail : avec un conteneur, l’en-tête et le corps s’y écrivent et la fenêtre ne s’ouvre pas', f.includes("bodyEl=document.getElementById('cuvf-bd');") && f.includes("var tEl=document.getElementById(dans?'cuvf-t':'cuvd-title');") && f.includes("if(!dans){ var ov3=document.getElementById('ovCuveeDetail');if(ov3)ov3.classList.add('open'); }"));
  T('au large, liste affichée : tout appel (rafraîchissement après une opération compris) va dans la fiche', f.includes("if(!dans&&typeof _chaiDesk==='function'&&_chaiDesk()){ var _vw=document.getElementById('mvc-view-cuv'); if(_vw&&_vw.offsetParent!==null&&document.getElementById('chai-fiche')){ dans='chai-fiche';"));
  T('la carte choisit, la liste se synchronise (garde de type), la page a la fiche', S.cave.includes("data-cuv=\"'+_escAttr(c.id)+'\" onclick=\"_chaiSel(\\''+c.id+'\\')\"") && S.cave.includes("  if(typeof _chaiFicheSync==='function')_chaiFicheSync(sorted.filter(_caveDansFiltre));   // CAVE-3 (§290)") && S.html.includes('<aside class="phf" id="chai-fiche"'));
  T('le bloc CAVE-3 est posé après CAVE-2, par jetons seulement (' + dur.length + ')', B.length > 1500 && S.css.indexOf('★ CAVE-3 (§290)') > S.css.indexOf('★ FIN CAVE-2') && dur.length === 0);
  T('la grille gagne sur le display:block écrit en ligne, la vue cachée le reste', B.includes('#page-cave #mvc-view-cuv:not([style*="none"]){ display:grid!important;') && S.css.includes(':is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche) .trf-hd{'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-cave3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-cave3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la fiche garde une cuvée sortie du filtre', 'cave', "  if(ids.indexOf(_chaiSelId)<0)_chaiSelId=ids[0]||'';\n  _chaiMarque(_chaiSelId);", "  _chaiMarque(_chaiSelId);", 0],
    ['au téléphone, toucher choisit au lieu d’ouvrir', 'cave', "  if(!_chaiDesk()){ openCuveeDetail(id); return; }\n", '', 1],
    ['la fenêtre s’ouvre aussi en mode fiche', 'cave', "if(!dans){ var ov3=document.getElementById('ovCuveeDetail');if(ov3)ov3.classList.add('open'); }", "var ov3=document.getElementById('ovCuveeDetail');if(ov3)ov3.classList.add('open');", 2],
    ['un rafraîchissement rouvre la fenêtre au large', 'cave', "if(_vw&&_vw.offsetParent!==null&&document.getElementById('chai-fiche')){ dans='chai-fiche';", "if(false){ dans='chai-fiche';", 3],
    ['la liste ne synchronise plus la fiche', 'cave', "  if(typeof _chaiFicheSync==='function')_chaiFicheSync(sorted.filter(_caveDansFiltre));   // CAVE-3 (§290)\n", '', 4],
    ['la grille perd son !important', 'css', '#page-cave #mvc-view-cuv:not([style*="none"]){ display:grid!important;', '#page-cave #mvc-view-cuv:not([style*="none"]){ display:grid;', 6],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-cave3.mjs'],", '', 7]
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
