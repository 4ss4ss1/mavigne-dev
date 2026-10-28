#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
//  FORME-2 (§315) — LES PARCELLES DE LA CARTE DE L'ACCUEIL À LEUR VRAIE FORME
//  Exécute le VRAI moteur des formes (utils.js, bloc FORME-1), la VRAIE _homeForme et la VRAIE _homePrioCarte (app.js)
//  sur un faux DOM et un domaine fabriqué : une lanière, un carré, une équerre, une parcelle en deux morceaux, une miette
//  sous le plancher, un contour illisible, une parcelle sans contour, une arrachée. Lit sur le texte la feuille de style,
//  l'aide, le guide, les nouveautés et la liste des contrôles.
//    node scripts/mv-harnais-forme2.mjs [--contre]
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const S0 = { uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')), app: L('src/app.js'), css: L('src/styles.css'), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
const blocDe = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return s.slice(i, j); };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
// Des contours [lat, lng] à la latitude de Gevrey, en mètres vers l'est (x) et vers le nord (y), fermés comme dans un KML.
const LAT0 = 47.2265, LNG0 = 4.9655, KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const pt = (x, y) => [LAT0 + y / 110540, LNG0 + x / KX];
const rect = (w, h, x = 0, y = 0) => [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h), pt(x, y)];
const equerre = () => [pt(0, 0), pt(60, 0), pt(60, 15), pt(15, 15), pt(15, 60), pt(0, 60), pt(0, 0)];
// « le carré » écrit en minuscules : le nom se compare sans la casse, la même règle que la carte.
const KML = [{ name: 'La Lanière', pts: rect(100, 20) }, { name: 'le carré', pts: rect(50, 50) }, { name: 'L’Équerre', pts: equerre() },
  { name: 'Les Deux Bouts', pts: rect(30, 10) }, { name: 'Les Deux Bouts', pts: rect(30, 10, 0, 40) }, { name: 'La Miette', pts: rect(6, 4) },
  { name: 'Illisible', pts: [pt(0, 0), pt(10, 0)] }];
const P = [{ nom: 'La Lanière', surface: '0,2', statut: 'Active' }, { nom: 'Le Carré', surface: '0,25', statut: 'Active' },
  { nom: 'L’Équerre', surface: '0,1575', statut: 'Active' }, { nom: 'Les Deux Bouts', surface: '0,06', statut: 'Active' },
  { nom: 'La Miette', surface: '0,0024', statut: 'Active' }, { nom: 'Sans <Contour>', surface: '0,1', statut: 'Active' },
  { nom: 'Illisible', surface: '0,05', statut: 'Active' }, { nom: 'Arrachée', surface: '1', statut: 'Arrachee' }];
const ST = { 'La Lanière': 'Validé', 'Le Carré': 'En cours' };
const ORDRE = ['La Lanière', 'Le Carré', 'L’Équerre', 'Sans <Contour>', 'Les Deux Bouts', 'Illisible', 'La Miette'];
const MAXS = 0.25, R = n => parseFloat(P.find(p => p.nom === n).surface.replace(',', '.')) / MAXS;

// Le moteur des formes d'utils.js (avec ou sans contours), puis les fonctions de la carte d'app.js dans le même contexte.
function contexte(S, kml, sansMoteur) {
  const ctx = { Math, Object, String, Array, Number, isFinite, JSON, KML_POLYGONS_DYNAMIC: kml };
  ctx.window = ctx; vm.createContext(ctx);
  if (!sansMoteur) vm.runInContext(blocDe(S.uti, "/* ★ FORME-1 (§301) — LA FORME D'UNE PARCELLE", '/* ★ FIN FORME-1 */'), ctx);
  vm.runInContext(['function _homeSurf(p){', 'function _homeHa(x){', 'function _homeForme(f,r){', 'function _homePrioCarte(){'].map(d => fonction(S.app, d)).join('\n')
    + '\nthis._homeForme = _homeForme; this._homePrioCarte = _homePrioCarte;', ctx);
  return ctx;
}
function carte(S, kml, avecPrio, sansMoteur) {
  const ctx = contexte(S, kml, sansMoteur);
  const el = id => ({ id, parentNode: null, className: '', classList: { add() {} }, innerHTML: '' });
  const w = el('w'), kp = el('home-kpis'), eq = el('home-eqj-wrap'), corps = { v: null };
  w.insertBefore = n => { n.parentNode = w; if (n.id === 'home-prio-corps') corps.v = n; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  Object.assign(ctx, {
    document: { querySelector: () => w, getElementById: id => (id === 'home-kpis' ? kp : id === 'home-eqj-wrap' ? eq : id === 'home-prio-corps' ? corps.v : null), createElement: () => el('home-prio-corps') },
    PARCELLES: P, _prioItems: () => (avecPrio ? [{ t: 'Taille', equipe: [] }] : []), getTacheStatut: p => ST[p.nom],
    getPCls: p => ({ pct: ST[p.nom] === 'Validé' ? 100 : ST[p.nom] ? 40 : 0 }), tNom: t => t, _escAttr: esc, _escHtml: esc, _pvSurfFr: s => s
  });
  ctx._homePrioCarte();
  const html = corps.v ? corps.v.innerHTML : '';
  const btn = {}, noms = [];
  html.replace(/<button[^>]*data-nom="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g, (m, n, dans) => { const nom = n.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); noms.push(nom); btn[nom] = m; return m; });
  return { html, btn, noms, ctx };
}
const num = (b, k) => { const m = new RegExp('--' + k + ':([0-9.]+)').exec(b || ''); return m ? parseFloat(m[1]) : NaN; };
const vb = b => { const m = /viewBox="0 0 ([0-9.]+) ([0-9.]+)"/.exec(b || ''); return m ? [parseFloat(m[1]), parseFloat(m[2])] : [NaN, NaN]; };
const proche = (a, b, tol) => Math.abs(a - b) <= tol;
const dDe = b => { const m = /<path d="([^"]*)"/.exec(b || ''); return m ? m[1] : ''; };

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  let A = { html: 'plantage', btn: {}, noms: [] }, B = A, C = A, D = A;
  try { A = carte(S, KML, true); } catch (e) { A = { html: 'plantage ' + e.message, btn: {}, noms: [] }; }
  try { B = carte(S, [], false); } catch (e) { B = { html: 'plantage ' + e.message, btn: {}, noms: [] }; }
  try { C = carte(S, KML, false, true); } catch (e) { C = { html: 'plantage ' + e.message, btn: {}, noms: [] }; }
  try { D = { f: A.ctx._homeForme({ w: 10, h: 5, rings: [[[0, 0], [NaN, 1], [3, 4]]] }, 1), g: A.ctx._homeForme(null, 1), h: A.ctx._homeForme({ w: 0, h: 5, rings: [[[0, 0], [0, 5], [0, 2]]] }, 1) }; } catch (e) { D = { plantage: e.message }; }
  const lan = A.btn['La Lanière'], fwL = num(lan, 'fw'), fhL = num(lan, 'fh'), [vwL, vhL] = vb(lan);
  T('la lanière de 100 m sur 20 garde ses proportions : largeur cinq fois la hauteur, dessin de 100 × 20 m', proche(fwL / fhL, 5, 0.02) && proche(vwL, 100, 0.2) && proche(vhL, 20, 0.2) && /<path d="M[^"]+Z"\/>/.test(lan || ''));
  // L'ancien rectangle : --h-row-2 × √r de large (jamais moins d'un tiers), format 8/5 → surface 5/8 × max(√r, 1/3)², en parts de --h-row-2².
  const ecarts = ['La Lanière', 'Le Carré', 'L’Équerre', 'Les Deux Bouts', 'La Miette'].map(n => { const b = A.btn[n], av = 0.625 * Math.pow(Math.max(Math.sqrt(R(n)), 1 / 3), 2); return Math.abs(num(b, 'fw') * num(b, 'fh') - av) / av; });
  T('chaque forme a la surface de son ancien rectangle (écart max ' + (Math.max(...ecarts) * 100).toFixed(2) + ' %)', ecarts.every(e => e < 0.01));
  T('la miette (0,0024 ha) garde le plancher du rectangle : un tiers de la plus grande en largeur, soit 1/9 en surface', proche(num(A.btn['La Miette'], 'fw') * num(A.btn['La Miette'], 'fh'), 0.625 / 9, 0.002));
  const deux = A.btn['Les Deux Bouts'] || '', [vwD, vhD] = vb(deux), equ = A.btn['L’Équerre'] || '';
  T('une parcelle en deux morceaux garde ses deux morceaux et l’écart entre eux ; l’équerre ses six sommets', (dDe(deux).match(/M/g) || []).length === 2 && proche(vwD, 30, 0.2) && proche(vhD, 50, 0.2) && (dDe(equ).match(/L/g) || []).length === 5 && (dDe(equ).match(/M/g) || []).length === 1);
  T('le nom se compare sans la casse (« le carré » du contour = « Le Carré »), nord en haut (le dessin est un carré de 50 m)', /hpc-fo/.test(A.btn['Le Carré'] || '') && proche(vb(A.btn['Le Carré'])[0], 50, 0.2) && proche(vb(A.btn['Le Carré'])[1], 50, 0.2));
  const sc = A.btn['Sans <Contour>'] || '';
  T('sans contour, dans un domaine qui en a : le rectangle d’avant, en pointillé, et le titre le dit', /class="hpc-p hpc-sans hpc-afaire"/.test(sc) && /style="--s:0\.632"/.test(sc) && sc.includes('pas de contour enregistr\u00e9') && !sc.includes('<svg'));
  T('un contour illisible (deux points) compte comme absent : rectangle en pointillé, aucun dessin', /hpc-sans/.test(A.btn['Illisible'] || '') && !(A.btn['Illisible'] || '').includes('<svg'));
  T('un point illisible ne dessine rien (pas de « NaN » dans un tracé) ; ni forme vide, ni forme plate', D.f === null && D.g === null && D.h === null);
  T('les noms sont échappés partout (data-nom, titre, aria-label)', A.html.includes('data-nom="Sans &lt;Contour&gt;"') && A.html.includes('title="Sans &lt;Contour&gt;, 0,1 ha, pas de contour') && A.html.includes('aria-label="Sans &lt;Contour&gt;"') && !A.html.includes('<Contour>'));
  T('un appui ouvre la fiche de la parcelle (openDP), sur chaque parcelle ; plus jamais openSelParc', (A.html.match(/onclick="openDP\(this\.dataset\.nom\)"/g) || []).length === 7 && !A.html.includes('openSelParc'));
  T('le même ordre : fait, en cours, puis à faire du plus grand au plus petit ; l’arrachée exclue', A.noms.join('|') === ORDRE.join('|'));
  T('aucun « undefined » ni « NaN », sept boutons, cinq dessins', !/undefined|NaN/.test(A.html) && A.noms.length === 7 && (A.html.match(/<svg /g) || []).length === 5 && (A.html.match(/<\/svg>/g) || []).length === 5);
  T('la mosaïque porte son id (la pastille « Nouveau » s’y pose) et dit forme et surface', A.html.includes('<div class="hpc-mos" id="home-prio-mos" aria-label="Les parcelles, \u00e0 leur forme et \u00e0 leur surface">'));
  const sansCont = B.noms.every(n => (B.btn[n] || '').includes('style="--s:' + Math.sqrt(R(n)).toFixed(3) + '"'));
  T('un domaine sans aucun contour ne change pas : rectangles pleins, à leur taille d’avant, sans pointillé', B.noms.length === 7 && sansCont && !B.html.includes('hpc-sans') && !B.html.includes('hpc-fo') && !B.html.includes('<svg') && B.html.includes('La saison, parcelle par parcelle'));
  T('sans le moteur des formes (utils.js absent), la carte se dessine quand même, en rectangles', C.noms.length === 7 && !C.html.includes('<svg') && !C.html.includes('hpc-sans'));
  let bloc = ''; try { bloc = blocDe(S.css, '/* ★ FORME-2 (§315)', '/* ★ FIN FORME-2 */'); } catch (e) { bloc = ''; }
  const dur = enDur(bloc);
  T('le bloc FORME-2 suit ACC-2, par jetons seulement (' + dur.length + ')', bloc.length > 600 && S.css.indexOf('/* ★ FORME-2 (§315)') > S.css.indexOf('/* ★ FIN ACC-2 */') && dur.length === 0);
  T('la forme prend la place du rectangle : plus de cadre, de fond ni de format 8/5, une prise d’au moins --e-4, et une règle plus forte que .hpc-p.hpc-fait',
    bloc.includes('#page-home .hpc-mos .hpc-p.hpc-fo{') && /\.hpc-p\.hpc-fo\{[^}]*width:auto;[^}]*min-width:var\(--e-4[^}]*min-height:var\(--e-4[^}]*aspect-ratio:auto;[^}]*border:0;[^}]*background:transparent;/.test(bloc));
  T('le dessin à la taille --fw × --fh, un trait d’un pixel quelle que soit l’échelle, les couleurs du rectangle, le pointillé sans contour',
    bloc.includes('width:calc(var(--h-row-2) * var(--fw)); height:calc(var(--h-row-2) * var(--fh));') && bloc.includes('vector-effect:non-scaling-stroke') && bloc.includes('#page-home .hpc-fo.hpc-fait path{ fill:var(--ok-doux); stroke:var(--ok); }') && bloc.includes('#page-home .hpc-fo.hpc-cours path{ fill:var(--presse); stroke:var(--encours); }') && bloc.includes('.hpc-p.hpc-sans{ border-style:dashed; }'));
  const wn = S.uti.slice(S.uti.indexOf('export const WHATS_NEW = ['), S.uti.indexOf("{ v: '8.82'"));
  T('les nouveautés l’annoncent (pastille sur la mosaïque, pour la Vigne) et disent la correction de l’appui', wn.includes("cible: '#home-prio-mos'") && wn.includes("pour: ['vigne']") && wn.includes('titre: \'L’Accueil dessine chaque parcelle à sa forme\'') && wn.includes('Toucher une parcelle de l’Accueil ouvre sa fiche'));
  T('l’aide et le guide disent la forme, le pointillé et la fiche', S.uti.includes('les parcelles dessinées à leur forme (leur contour, nord en haut) et à leur surface (fait, en cours, à faire) — un appui sur l’une ouvre sa fiche') && S.guide.includes('dessinées à leur forme (leur contour, nord en haut) et à leur surface') && S.guide.includes('reste un rectangle en pointillé. Un appui sur une parcelle ouvre sa fiche'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-forme2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-forme2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  // [nom, fichier, motif, remplacement, début du nom de l'assertion qui doit rougir]
  const DEF = [
    ['le plancher disparaît', 'app', 'Math.max(r>0?r:0,1/9)', '(r>0?r:0)', 'la miette'],
    ['la surface n’est plus celle du rectangle', 'app', 's=0.625*Math.max(', 's=1*Math.max(', 'chaque forme a la surface'],
    ['les proportions s’inversent', 'app', 'fw:Math.sqrt(s*a).toFixed(3), fh:Math.sqrt(s/a).toFixed(3)', 'fw:Math.sqrt(s/a).toFixed(3), fh:Math.sqrt(s*a).toFixed(3)', 'la lanière'],
    ['un point illisible est dessiné quand même', 'app', "  if(!/^[0-9MLZ .-]+$/.test(d)) return null;", '', 'un point illisible'],
    ['l’appui revient à openSelParc', 'app', 'onclick="openDP(this.dataset.nom)">', 'onclick="openSelParc(this.dataset.nom)">', 'un appui ouvre'],
    ['le pointillé gagne un domaine sans contour', 'app', "(f?' hpc-fo':(avecContours?' hpc-sans':''))", "(f?' hpc-fo':' hpc-sans')", 'un domaine sans aucun contour'],
    ['le titre n’est plus échappé', 'app', "title=\"'+_escAttr((f||!avecContours)?lib:lib+', pas de contour enregistr\\u00e9')+'\"", "title=\"'+((f||!avecContours)?lib:lib+', pas de contour enregistr\\u00e9')+'\"", 'les noms sont échappés'],
    ['la lecture des formes n’est plus gardée', 'app', "var lireForme=(typeof window._mvParcForme==='function')?window._mvParcForme:function(){ return null; };", 'var lireForme=window._mvParcForme;', 'sans le moteur'],
    ['le format 8/5 reste imposé aux formes', 'css', ' aspect-ratio:auto; border:0;', ' border:0;', 'la forme prend la place'],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .hpc-fo.hpc-fait path{ fill:var(--ok-doux); stroke:var(--ok); }', '#page-home .hpc-fo.hpc-fait path{ fill:var(--ok-doux); stroke:#237A47; }', 'le bloc FORME-2'],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-forme2.mjs'],", '', 'ce harnais est branché']
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), vise = r.filter(([n]) => n.startsWith(cible) || n.startsWith('plantage'));
    const ok = vise.length > 0 && vise.some(([, v]) => !v); console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
process.exit(ko ? 1 : 0);
