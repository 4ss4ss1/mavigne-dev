// HARNAIS — PARC-1 (§274) : les Parcelles sur ordinateur, en liste + fiche (maquette v3), avec les MÊMES gestes.
//   node scripts/mv-harnais-parc1.mjs           → doit être vert
//   node scripts/mv-harnais-parc1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), html: L('index.html'), uti: L('src/utils.js'), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PARC-1 (§274)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PARC-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('la page Parcelles a sa colonne de fiche, juste après la liste', S.html.includes('<div id="pList"></div>\n      <aside class="pfx" id="p-fiche"'));
  T('sur ordinateur, renderParcelles dessine une ligne AVANT de choisir la carte', /if\(_pDesk\(\)\)return _pRow\(p,cl,_etat,hasDrae\?draeInfo:null,_proxPill,_cep\);\n    const _pvAct=/.test(S.app));
  T('la ligne porte les MÊMES gestes (_pvActions) et garde la classe que vise la visite guidée', S.app.includes("var tache=pTacheFilter!=='toutes', act=tache?_pvActions(p):''") && S.app.includes("'<div class=\"prow'+(act?' pcard-qv':'')"));
  T('la fiche reprend les gestes, l’état de la tâche, les travaux, les passages, le délai de réentrée et la fiche complète',
    S.app.includes("var act=(pTacheFilter!=='toutes')?_pvActions(p):'';") && S.app.includes('Travaux de la campagne') && S.app.includes('Derniers passages')
    && S.app.includes('var cl=getPCls(p), drae=getDraeParcelle(p.nom), cep=') && S.app.includes("onclick=\"openDP(\\''+_escAttr(p.nom)+'\\')\">Fiche compl\\u00e8te</button>"));
  T('après chaque rendu, la sélection suit la liste affichée', S.app.includes('  if(_pDesk())_pFicheSync(data);   // PARC-1 : AVANT les barres et la carte') && S.app.includes("if(!_pSelNom||noms.indexOf(_pSelNom)<0)_pSelNom=noms[0]||'';"));
  T('au téléphone, toucher une parcelle ouvre toujours sa fiche complète', S.app.includes("function _pSel(nom){\n  if(!_pDesk()){ openDP(nom); return; }"));
  T('les flèches et V : ordinateur, page Parcelles, rien n’ayant le focus', S.app.includes("if(!pg||!pg.classList.contains('active'))return;") && S.app.includes('if(ev.target&&ev.target!==document.body)return;') && S.app.includes(".pc-validate:not(.done)"));
  T('passer d’un écran large à un étroit redessine la liste', S.app.includes("window.matchMedia('(min-width:1024px)').addEventListener('change',function(){ if(window._dataReady)renderParcelles(); });"));
  T('_pSel est joignable depuis le balisage (onclick)', S.app.includes('window._pSel=_pSel;'));
  T('le bloc PARC-1 est posé après TETE-1, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ PARC-1 (§274)') > S.css.indexOf('★ FIN TETE-1') && dur.length === 0);
  T('deux colonnes à partir de 1 024 px, fiche collante ; cachée au téléphone',
    B.includes('#p-fiche{ display:none; }') && B.includes('grid-template-columns:minmax(0,var(--l-list,400px)) minmax(0,1fr)') && B.includes('position:sticky;'));
  T('l’aide, le guide et les nouveautés disent la liste + fiche, les flèches et V',
    S.uti.includes("['Sur un ordinateur', \"la liste passe à gauche") && S.guide.includes('<li><b>Sur un ordinateur</b>, la liste passe à gauche') && S.uti.includes("titre: 'Sur ordinateur, les Parcelles en liste et fiche'"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-parc1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-parc1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la colonne de fiche disparaît', 'html', '\n      <aside class="pfx" id="p-fiche" aria-live="polite" aria-label="Fiche de la parcelle choisie"></aside>', '', 0],
    ['l’ordinateur garde les cartes', 'app', 'if(_pDesk())return _pRow(p,cl,_etat,hasDrae?draeInfo:null,_proxPill,_cep);', '', 1],
    ['la ligne perd la classe de la visite', 'app', "'<div class=\"prow'+(act?' pcard-qv':'')", "'<div class=\"prow'+(act?' prow-qv':'')", 2],
    ['la fiche perd le délai de réentrée', 'app', 'var cl=getPCls(p), drae=getDraeParcelle(p.nom), cep=', 'var cl=getPCls(p), drae=null, cep=', 3],
    ['la sélection ne suit plus la liste', 'app', "if(!_pSelNom||noms.indexOf(_pSelNom)<0)_pSelNom=noms[0]||'';", '', 4],
    ['le téléphone n’ouvre plus la fiche complète', 'app', "  if(!_pDesk()){ openDP(nom); return; }\n", '', 5],
    ['les flèches agissent dans un champ', 'app', 'if(ev.target&&ev.target!==document.body)return;', '', 6],
    ['_pSel n’est plus joignable', 'app', 'window._pSel=_pSel;', '', 8],
    ['une couleur écrite en dur dans le bloc', 'css', "  #pList .prow:hover{ background:var(--survol); }", "  #pList .prow:hover{ background:#F2EFE7; }", 9],
    ['la fiche s’affiche au téléphone', 'css', '#p-fiche{ display:none; }', '#p-fiche{ display:block; }', 10],
    ['le guide oublie l’ordinateur', 'guide', '<li><b>Sur un ordinateur</b>, la liste passe à gauche', '<li>La liste passe à gauche', 11],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-parc1.mjs'],", '', 12]
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
