// HARNAIS — TRAC-3 (§284) : les heures et le GNR d'une session (chrono, sinon barème ; consommation réglée, 6 L/h par défaut),
//   la quatrième case de la bande, le bouton « Démarrer une session » sur ordinateur, les fenêtres du Tracteur au kit.
//   node scripts/mv-harnais-trac3.mjs           → doit être vert
//   node scripts/mv-harnais-trac3.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { tr: L('src/tracteur.js'), css: L('src/styles.css'), html: L('index.html'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ TRAC-3 (§284)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TRAC-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function calc(S, conso) {
  const P = [{ nom: 'A', surface: '1' }, { nom: 'B', surface: '0.5' }];
  const ACT = [{ nom: 'Rognage', h_ha: '2' }];
  const src = ['function _chrMes(x){', 'function _chrNom(x){', 'function _chrSurf(nom){', 'function _sessBaremeMin(s,surface){', 'function _trMinutes(s){', 'function _trConsoLh(){', 'function _trHeuresFr(h){'].map((d) => fonction(S.tr, d)).join('\n');
  return new Function('PARCELLES', 'ACTIVITES', 'window', src + '\nvar s={activite:"Rognage",parcellesFaites:[{nom:"A",mes:90},"B"]}; var m=_trMinutes(s); return { mes:m.mes, bar:m.bar, total:m.total, lh:_trConsoLh(), fr:_trHeuresFr(m.total/60) };')(P, ACT, { CONFIG: conso == null ? {} : { eco: { conso_gnr_lh: conso } } });
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = {}, b = {}; try { a = calc(S, null); b = calc(S, 8); } catch (e) { a = { erreur: e.message }; }
  T('les heures : le chrono quand il a mesuré (90 min), sinon le barème (2 h/ha × 0,5 ha = 60 min) ; 2,5 h', a.mes === 90 && a.bar === 60 && a.total === 150 && a.fr === '2,5');
  T('le GNR : 6 L/h par défaut, la consommation réglée sinon (8 L/h)', a.lh === 6 && b.lh === 8);
  T('la fiche affiche heures et GNR, et dit d’où viennent les heures', S.tr.includes("var mn=_trMinutes(s), hh=mn.total/60, lh=_trConsoLh()") && S.tr.includes("\\u00a0h au chrono, '") && S.tr.includes("', valeur par défaut'"));
  T('la bande a sa quatrième case, comptée comme la fiche', S.html.includes('id="trac-stat-h"') && S.tr.includes("stH.textContent=_trHeuresFr(_SS.reduce(function(a,x){ return a+(x.type==='traitement'?0:_trMinutes(x).total); },0)/60);"));
  T('« Démarrer une session » : un bouton de la barre sur ordinateur, visible pour qui peut démarrer', S.html.includes('id="trac-new-btn" onclick="openNewSession()"') && S.tr.includes("var nb=document.getElementById('trac-new-btn'); if(nb)nb.style.display=(_tracOnglet==='sessions'&&(isTractoriste()||isAdmin()))?'':'none';"));
  T('le bloc TRAC-3 est posé après TRAC-2, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ TRAC-3 (§284)') > S.css.indexOf('★ FIN TRAC-2') && dur.length === 0);
  T('au large, le bouton se montre et le bouton flottant se cache ; à l’étroit, l’inverse', /@media \(min-width:1024px\)\{\s*#trac-fab\{ display:none!important; \}/.test(B) && !B.includes('#page-tracteur .trac-new{ display:inline-flex!important; }') && B.includes('#page-tracteur .trac-new{ display:none!important; }'));
  T('les fenêtres du Tracteur au kit : enregistrer à l’accent, plus de bleu acier dans la feuille de travail', B.includes('#ovSession button[onclick*="saveSession"],#ovSessionDetail button[onclick*="closeSessionDetail"]{') && B.includes('#ovSessionDetail .modal-hd > div[style*="acier-pale"]{ background:var(--bg-doux)!important;'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-trac3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-trac3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le barème ne relaie plus le chrono', 'tr', "bar+=_sessBaremeMin(s,_chrSurf(_chrNom(x)));", '', 0],
    ['le chrono est ignoré', 'tr', "var m=_chrMes(x); if(m>0){ mes+=m; return; }", 'var m=0;', 0],
    ['le défaut passe à 5 L/h', 'tr', "var c=(e.conso_gnr_lh!=null&&e.conso_gnr_lh!=='')?Number(e.conso_gnr_lh):6; return isFinite(c)&&c>0?c:6;", "var c=(e.conso_gnr_lh!=null&&e.conso_gnr_lh!=='')?Number(e.conso_gnr_lh):5; return isFinite(c)&&c>0?c:5;", 1],
    ['la consommation réglée est ignorée', 'tr', "var c=(e.conso_gnr_lh!=null&&e.conso_gnr_lh!=='')?Number(e.conso_gnr_lh):6;", 'var c=6;', 1],
    ['la bande perd sa quatrième case', 'html', ' <div class="mvu-kpi"><div class="mvu-kpi-v" id="trac-stat-h">0</div><div class="mvu-kpi-l">Heures de moteur</div></div>', '', 3],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-tracteur .trac-new:hover{ background:var(--accent-survol); }', '#page-tracteur .trac-new:hover{ background:#6A2246; }', 5],
    ['le bouton flottant reste sur ordinateur', 'css', '  #trac-fab{ display:none!important; }\n', '', 6],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-trac3.mjs'],", '', 8]
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
