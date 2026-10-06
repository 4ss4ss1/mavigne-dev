// HARNAIS — AOC-1 (§255) : les appellations dans la roue crantée de la Cave — deux lignes qui résument, deux fenêtres.
//   node scripts/mv-harnais-aoc-cave.mjs           → doit être vert
//   node scripts/mv-harnais-aoc-cave.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions de reglages.js (_aocResumeHtml, _aocPlafondsHtml, _aocRattachHtml, _aocRenderCard, les
// ouvertures, les bascules, et les actions _aocSetParc / _aocSetMax) sur un domaine fictif ; relit cave.js, index.html,
// styles.css. Validé sur maquette par Nico (06/10).
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const BASE0 = { reg: lire('src/reglages.js'), cave: lire('src/cave.js'), html: lire('index.html'), css: lire('src/styles.css') };
function bloc(src, debut) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('ABSENT : ' + debut);
  const k = src.indexOf('{', i); let d = 0;
  for (let j = k; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1) + (src[j + 1] === ';' ? ';' : ''); }
  throw new Error('accolade non fermée : ' + debut);
}
const FNS = ['_aocNorm', '_aocAll', '_aocSave', '_aocTrouve', '_aocMils', '_aocParcelles', '_aocEsc', '_aocAtt', '_aocActives', '_aocMax', '_aocNb',
  '_aocResumeHtml', '_aocPlafondsHtml', '_aocRattachHtml', '_aocEstOuverte', '_aocRenderCard', 'openAocPlafonds', 'openAocRattach',
  '_aocChoisirMil', '_aocBasculer', '_aocFiltrer', '_aocChoisirParc', '_aocAttacher'];
function monter(B, o) {
  o = o || {};
  const el = {}, ouvert = {}, E = { saves: [] };
  const mk = id => (el[id] = { id, innerHTML: '', classList: { contains: c => c === 'open' && !!ouvert[id] } });
  ['cave-reg-mil', 'aocp-body', 'aocr-body', 'ovAocPlafonds', 'ovAocRattach'].forEach(mk);
  const P = o.parcelles || [
    { nom: 'Les Grandes Vignes', surface: 0.42, cepage: 'Pinot noir', appellation: 'Gevrey-Chambertin' },
    { nom: 'Clos du Moulin', surface: 0.85, appellation: 'Gevrey-Chambertin' },
    { nom: 'La Combe', surface: 0.31, appellation: 'Bourgogne' },
    { nom: 'Aux Corvées', surface: 0.49, cepage: 'Pinot noir' },
    { nom: 'Vieille Vigne', statut: 'Arrachee' },
  ];
  const ctx = {
    document: { getElementById: id => el[id] || null }, console: { log() {}, warn() {} }, Date, Math, String, Number, Object, Array, JSON,
    isAdmin: () => true, _escHtml: s => String(s), _escAttr: s => String(s), _mvIcon: n => '<i data-ic="' + n + '"></i>',
    showToast() {}, logError() {}, PARCELLES: P,
    CONFIG: { appellations: o.aoc || [{ nom: 'Gevrey-Chambertin', rdt_max_hist: [{ mil: '2025', max: 40 }, { mil: '2026', max: 40 }] }, { nom: 'Bourgogne', rdt_max_hist: [{ mil: '2025', max: 60 }] }] },
    _mlMillesimes: () => [2025, 2026], saveData: k => E.saves.push(k),
    openOv: id => { ouvert[id] = true; }, closeOv: () => {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const vars = (B.reg.match(/^var _aocMilSel=null, _aocOuvert='', _aocFiltre='', _aocChoix='';$/m) || [''])[0];
  vm.runInContext(vars + '\n' + FNS.map(n => bloc(B.reg, 'function ' + n + '(')).join('\n') + '\n' + bloc(B.reg, 'window._aocSetParc=function(') + '\n' + bloc(B.reg, 'window._aocSetMax=function('), ctx);
  return { ctx, el, ouvert, E };
}
const txt = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // ── Les deux lignes ──
  let M = monter(B);
  M.ctx._aocRenderCard();
  const res = M.el['cave-reg-mil'].innerHTML;
  T('le bloc « Le Millésime » reçoit deux lignes, chacune ouvre sa fenêtre', (res.match(/class="creg-row"/g) || []).length === 2 && /onclick="openAocPlafonds\(\)"/.test(res) && /onclick="openAocRattach\(\)"/.test(res));
  T('la première résume : nombre d’appellations et plafonds du millésime', /2 appellations · plafond 2026 : 40 hL\/ha/.test(txt(res)));
  T('la seconde résume : parcelles rattachées, et celles sans appellation en orange (arrachées non comptées)', /3 parcelles rattachées · 1 sans appellation/.test(txt(res)) && /color:var\(--orange-tx/.test(res));
  M = monter(B, { aoc: [] }); M.ctx._aocRenderCard();
  T('sans appellation déclarée, les lignes le disent', /Aucune appellation déclarée/.test(txt(M.el['cave-reg-mil'].innerHTML)) && /Déclarez d’abord une appellation/.test(txt(M.el['cave-reg-mil'].innerHTML)));
  // ── Fenêtre des plafonds ──
  M = monter(B); M.ctx.openAocPlafonds();
  let h = M.el['aocp-body'].innerHTML;
  T('la fenêtre des plafonds s’ouvre, millésime le plus récent choisi', M.ouvert.ovAocPlafonds && /class="on" onclick="_aocChoisirMil\(2026\)"/.test(h) && /onclick="_aocChoisirMil\(2025\)"/.test(h));
  T('une ligne par appellation : nom, parcelles, plafond qu’on touche pour le modifier', /Gevrey-Chambertin/.test(h) && /2 parcelles/.test(txt(h)) && /onclick="window\._aocSetMax\('Gevrey-Chambertin',2026\)">40 hL\/ha/.test(h));
  T('un plafond absent se signale : « Poser le plafond »', /class="aoc-pill vide" onclick="window\._aocSetMax\('Bourgogne',2026\)">Poser le plafond/.test(h));
  M.ctx._aocBasculer('Bourgogne'); h = M.el['aocp-body'].innerHTML;
  T('« ⋯ » ouvre Renommer et Supprimer, pour cette appellation seulement', /window\._aocRenommer\('Bourgogne'\)/.test(h) && /window\._aocSupprimer\('Bourgogne'\)/.test(h) && !/_aocRenommer\('Gevrey-Chambertin'\)/.test(h));
  M.ctx._aocChoisirMil(2025); h = M.el['aocp-body'].innerHTML;
  T('changer de millésime change les plafonds affichés', /window\._aocSetMax\('Bourgogne',2025\)">60 hL\/ha/.test(h));
  T('« + Ajouter une appellation » est là', /onclick="window\._aocAjouter\(\)"/.test(h));
  // ── Fenêtre du rattachement ──
  M = monter(B); M.ctx.openAocRattach();
  h = M.el['aocr-body'].innerHTML;
  T('les filtres comptent : toutes, chaque appellation, sans (arrachées exclues)', /Toutes · 4/.test(txt(h)) && /Gevrey-Chambertin · 2/.test(txt(h)) && /Bourgogne · 1/.test(txt(h)) && /Sans · 1/.test(txt(h)) && !/Vieille Vigne/.test(h));
  T('les parcelles sans appellation viennent EN TÊTE, avec « Rattacher »', txt(h).indexOf('Sans appellation') < txt(h).indexOf('Les Grandes Vignes') && /class="aoc-act or" onclick="_aocChoisirParc\('Aux Corvées'\)">Rattacher/.test(h));
  T('les autres ont « Changer »', /onclick="_aocChoisirParc\('Les Grandes Vignes'\)">Changer/.test(h));
  M.ctx._aocChoisirParc('Les Grandes Vignes'); h = M.el['aocr-body'].innerHTML;
  T('« Changer » propose les AUTRES appellations et « Aucune »', /_aocAttacher\('Les Grandes Vignes','Bourgogne'\)/.test(h) && !/_aocAttacher\('Les Grandes Vignes','Gevrey-Chambertin'\)/.test(h) && /_aocAttacher\('Les Grandes Vignes',''\)">Aucune/.test(h));
  M.ctx._aocAttacher('Les Grandes Vignes', 'Bourgogne');
  T('… et un choix fait referme la liste (parcelle déplacée, enregistrée)', !/aoc-tiroir/.test(M.el['aocr-body'].innerHTML) && M.ctx.PARCELLES[0].appellation === 'Bourgogne' && M.E.saves.includes('parcelles'));
  M = monter(B); M.ctx.openAocRattach();
  M.ctx._aocFiltrer('Bourgogne'); h = M.el['aocr-body'].innerHTML;
  T('un filtre ne montre que son groupe', /La Combe/.test(h) && !/Les Grandes Vignes/.test(h) && !/Aux Corvées/.test(h));
  M.ctx._aocFiltrer(''); M.ctx.window._aocSetParc('Aux Corvées', 'Bourgogne');
  T('rattacher enregistre les parcelles et redessine la fenêtre et le résumé', M.E.saves.includes('parcelles') && /Bourgogne · 2/.test(txt(M.el['aocr-body'].innerHTML)) && /4 parcelles rattachées/.test(txt(M.el['cave-reg-mil'].innerHTML)) && !/sans appellation/.test(txt(M.el['cave-reg-mil'].innerHTML)));
  // ── Les branchements ──
  const rc = bloc(B.reg, 'function _aocRenderCard(');
  T('la carte ne s’accroche plus dans Réglages › Domaine', !/saisons-list|aoc-card|insertBefore/.test(rc));
  T('la roue crantée de la Cave dessine les deux lignes (cave.js)', /if\(typeof window\._aocRenderCard==='function'\) window\._aocRenderCard\(\);/.test(B.cave) && !/_caveGoAoc|'aoc-card'/.test(B.cave.replace(/^\s*\/\/.*$/gm, '')));   // code sans commentaires (un commentaire n'est pas une preuve)
  T('les deux fenêtres existent (index.html)', /<div class="overlay" id="ovAocPlafonds"/.test(B.html) && /id="aocp-body"/.test(B.html) && /<div class="overlay" id="ovAocRattach"/.test(B.html) && /id="aocr-body"/.test(B.html));
  T('leur gabarit est dans styles.css', /\.aoc-row\{/.test(B.css) && /\.aoc-pill\.vide\{/.test(B.css) && /\.aoc-seg button\.on\{/.test(B.css));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nAOC-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['les parcelles arrachées sont comptées', B => ({ ...B, reg: B.reg.replace("return p&&p.nom&&s!=='arrachée'&&s!=='arrachee';", 'return p&&p.nom;') })],
  ['le résumé tait les parcelles sans appellation', B => ({ ...B, reg: B.reg.replace("+(sans?(' \\u00b7 <b style=\"color:var(--orange-tx,#9C4E14)\">'+sans+' sans appellation</b>'):''));", "+'');") })],
  ['le plafond s’ouvre sur le mauvais millésime', B => ({ ...B, reg: B.reg.replace("onclick=\"window._aocSetMax('+q+','+m+')\"", "onclick=\"window._aocSetMax('+q+','+mils[0]+')\"") })],
  ['un plafond absent ne se signale pas', B => ({ ...B, reg: B.reg.replace("(v==null?'Poser le plafond':(_aocNb(v)+' hL/ha'))", "(v==null?'\\u2014':(_aocNb(v)+' hL/ha'))") })],
  ['les sans-appellation ne viennent plus en tête', B => ({ ...B, reg: B.reg.replace("  if(!_aocFiltre||_aocFiltre==='__sans__') h+=groupe('Sans appellation',sans);\n  A.forEach(function(a){ if(!_aocFiltre||_aocFiltre===a.nom) h+=groupe(_aocEsc(a.nom),P.filter(function(p){ return de(p)===a.nom; })); });", "  A.forEach(function(a){ if(!_aocFiltre||_aocFiltre===a.nom) h+=groupe(_aocEsc(a.nom),P.filter(function(p){ return de(p)===a.nom; })); });\n  if(!_aocFiltre||_aocFiltre==='__sans__') h+=groupe('Sans appellation',sans);") })],
  ['« Changer » propose aussi l’appellation actuelle', B => ({ ...B, reg: B.reg.replace("A.forEach(function(a){ if(a.nom!==d) g+=", "A.forEach(function(a){ g+=") })],
  ['la liste reste ouverte après un choix', B => ({ ...B, reg: B.reg.replace("function _aocAttacher(nomParc, nomAoc){ _aocChoix=''; window._aocSetParc", "function _aocAttacher(nomParc, nomAoc){ window._aocSetParc") })],
  ['le filtre est ignoré', B => ({ ...B, reg: B.reg.replace("if(!_aocFiltre||_aocFiltre===a.nom) h+=groupe(", "h+=groupe(") })],
  ['la fenêtre ouverte n’est plus redessinée après une action', B => ({ ...B, reg: B.reg.replace("if(_aocEstOuverte('ovAocRattach')){ var c=document.getElementById('aocr-body'); if(c) c.innerHTML=_aocRattachHtml(); }", '') })],
  ['la carte revient dans Réglages › Domaine', B => ({ ...B, reg: B.reg.replace("  var mil=document.getElementById('cave-reg-mil'); if(mil) mil.innerHTML=_aocResumeHtml();", "  var host=document.getElementById('saisons-list'); var mil=document.getElementById('cave-reg-mil'); if(mil) mil.innerHTML=_aocResumeHtml();") })],
  ['la roue de la Cave ne dessine plus les lignes', B => ({ ...B, cave: B.cave.replace("if(typeof window._aocRenderCard==='function') window._aocRenderCard();", '') })],
  ['une fenêtre manque', B => ({ ...B, html: B.html.replace('<div class="overlay" id="ovAocRattach"', '<div class="overlay" id="ovAocRattachX"') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE0);
  if (Object.keys(BASE0).every(k => B2[k] === BASE0[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = joue(B2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
