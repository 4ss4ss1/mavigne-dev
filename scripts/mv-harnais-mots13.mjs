/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-13 (§607) : CAVE › LE MILLÉSIME, ENSEMBLE ET COURBES ALLÉGÉS — UNE PHRASE, LA MÉTHODE DANS LE « i »
   Lancer :          node scripts/mv-harnais-mots13.mjs
   Contre-épreuves : node scripts/mv-harnais-mots13.mjs --contre

   POURQUOI IL EXISTE
   Mesuré (démo, 24/11) : Courbes, la page la plus longue de la Cave sur ordinateur — 747 mots, 9 phrases de 15 mots et
   plus ; sous chaque graphe une note jaune de méthode (60 à 150 mots) que le « i » de la carte disait presque tout entière.
   Ensemble et Courbes sans phrase sous les onglets depuis MOTS-12. Et neuf défauts d'affichage : le parcours qui déborde au
   téléphone (« hL », « vendu »), son dernier étage presque invisible, « En fût » coupé, les milliers collés ; la légende des
   maturités collée en un bloc (sa feuille de style n'était posée que par le Cuvier) ; le graphe des maturités dessiné 28 px
   plus large que sa boîte ; « jours depuis l'encuvage » sur J8 et J12 ; une date dans le serif des titres ; quatre boutons
   sur deux lignes. Maquette validée (« go », 24/11) avec ses trois recommandations : docs/maquettes/maquette-millesime-courbes-v1.html.

   CE QU'IL GARDE
   ① les deux phrases, JOUÉES : Ensemble compte la liste « À surveiller » (_mlVeille, calculée UNE fois pour la carte et la
      phrase), Courbes l'état de la tête (_mlEtat) ; aucun calcul de plus ;
   ② le parcours, JOUÉ : une colonne pour les chiffres (la plus grande barre s'arrête avant), le « vendu » dans le cadre,
      l'étage projeté et l'étage étroit écrits en foncé, les milliers séparés ; le pied court, la méthode dans « cave.flux » ;
   ③ les Courbes : les notes de méthode quittent l'écran (le « i » cave.courbes les porte, complété), restent les comptes ;
      sous-titres, aide des puces et légende courts ;
   ④ les défauts : la feuille des maturités posée par Le Millésime, l'axe des jours, la police du tableau, les graphes sans
      débord, le choix de la courbe sur une ligne ;
   ⑤ l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { cave: lire('src/cave.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'),
  guide: lire('guide/08-cave.html'), liste: lire('scripts/mv-harnais-liste.mjs'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-millesime-courbes-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
function phrase(S, tab, V, E) {
  const ctx = { window: { _dataReady: true }, _mlTab: tab, _mlMilActif: () => 2026, _pcavLog: () => {}, _pcrbCvLignes: () => ({ groupes: [] }),
    _mlVeille: () => V, _mlEtat: () => E, _mlRendements: () => [], _mlResteARentrer: () => [] };
  vm.createContext(ctx); vm.runInContext(corps(S.cave, '_mlPhrase'), ctx);
  return ctx._mlPhrase();
}
function flux(S, ch, W) {
  const ctx = { Math, _mvF1: (x) => String(Math.round(x * 10) / 10).replace('.', ','), _mlEleveLab: () => 'En f\u00fbt', _mlEleveSub: () => '22 f\u00fbts',
    _mvBtl: (hl) => Math.round((hl || 0) * 100 / 0.75) };
  vm.createContext(ctx); vm.runInContext(corps(S.cave, '_pcrbCvEnt') + '\n' + corps(S.cave, '_mlFluxSvg'), ctx);
  return ctx._mlFluxSvg(ch, W);
}
const CH = () => ({ kg: 35950, kgHl: 135, kgVendu: 4500, kgCuve: 31450, parcelles: 8, hlCuve: 182, hlFut: 50, futs: 22, btl: 0 });

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const C = sansCom(S.cave);

  // ① les phrases
  essai('① Ensemble : « 2 cuves en fermentation, tout est rentré » ; « Rien à signaler » quand rien', () => {
    const a = texte(phrase(S, 'vie', { it: [], reste: [], enc: ['A', 'B'], nMes: 0, nD: 0, rentre: true }));
    const b = texte(phrase(S, 'vie', { it: [], reste: [], enc: [], nMes: 0, nD: 0, rentre: false }));
    return [a === '2 cuves en fermentation, tout est rentré' && b === 'Rien à signaler', a + ' | ' + b];
  });
  essai('① … au-dessus du maximum en rouge, volume à mesurer et parcelles sur pied en orange, d’abord ; plus « tout est rentré » alors', () => {
    const h = phrase(S, 'vie', { it: [], reste: [{}, {}], enc: ['A'], nMes: 1, nD: 1, rentre: false });
    const h2 = texte(phrase(S, 'vie', { it: [], reste: [], enc: ['A'], nMes: 1, nD: 0, rentre: true }));   // tout rentré, mais un volume à mesurer
    return [texte(h) === '1 parcelle au-dessus du maximum, 1 volume à mesurer, 2 parcelles encore sur pied, 1 cuve en fermentation'
      && /<b class="ko">1 parcelle au-dessus/.test(h) && /<b class="or">1 volume/.test(h) && /<b class="or">2 parcelles encore sur pied/.test(h)
      && h2 === '1 volume à mesurer, 1 cuve en fermentation', texte(h) + ' | ' + h2];
  });
  essai('① Courbes : « 2 cuves en fermentation, 1 décuvée » ; tout décuvé : « 3 cuvées en élevage » (sans « décuvées »)', () => {
    const a = texte(phrase(S, 'crb', null, { nCuve: 2, dec: 1, nElev: 1, nBtl: 0 }));
    const b = texte(phrase(S, 'crb', null, { nCuve: 0, dec: 3, nElev: 3, nBtl: 0 }));
    const c = texte(phrase(S, 'crb', null, { nCuve: 0, dec: 0, nElev: 0, nBtl: 2 }));
    return [a === '2 cuves en fermentation, 1 décuvée' && b === '3 cuvées en élevage' && c === '2 cuvées en bouteille', a + ' | ' + b + ' | ' + c];
  });
  T('① une seule liste : la carte « À surveiller » et la phrase lisent _mlVeille ; la phrase des Courbes lit _mlEtat (les comptes de la tête)',
    /function _mlBlocVeille\(mil,d\)\{\n  var V=_mlVeille\(mil,d\), it=V\.it, reste=V\.reste;/.test(C) && /var V=null; try\{ V=_mlVeille\(mil,dd\); \}/.test(C)
    && /var E=null; try\{ E=_mlEtat\(mil,dd\); \}/.test(C) && /nElev:n\.elev, nBtl:n\.btl, dec:dec \};/.test(C)
    && /return \{ it:it, reste:reste, enc:enc, nMes:nMes, nD:nD, rentre:!reste\.length&&_mlDatesRec\(mil\)\.length>0 \};/.test(C));

  // ② le parcours
  essai('② joué (360 px) : la plus grande barre s’arrête avant la colonne des chiffres, le « vendu » reste dans le cadre', () => {
    const W = 360, svg = flux(S, CH(), W);
    const rects = [...svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)].map((m) => +m[1] + +m[2]);
    const vendu = [...svg.matchAll(/<text x="([\d.]+)"[^>]*text-anchor="middle">vendu<\/text>/g)].map((m) => +m[1]);
    return [rects.length === 4 && Math.max(...rects) <= W - 72 + 0.5 && vendu.length === 1 && vendu[0] + 20 <= W, JSON.stringify({ rects, vendu })];
  });
  essai('② joué : l’étage projeté et l’étage étroit s’écrivent en foncé, à côté ; les milliers se séparent', () => {
    const svg = flux(S, CH(), 360);
    return [/fill="#4A4A3A" font-weight="600">En bouteille<\/text>/.test(svg) && /fill="#4A4A3A" font-weight="600">En f\u00fbt<\/text>/.test(svg)
      && /fill="#F5EFE2" font-weight="600">Rentr\u00e9 de la vigne<\/text>/.test(svg) && /35\s950\u00a0kg/.test(svg) && /projection 6\s667 cols/.test(svg), svg.slice(0, 200)];
  });
  T('② le pied : l’état seulement (« La perte totale se lira… ») ; la méthode dans le « i » neuf (cave.flux)', S.cave.includes("    foot+='La perte totale se lira quand tout sera d\\u00e9cuv\\u00e9.';")
    && !/fermentent encore/.test(sansCom(corps(S.cave, '_mlBlocFlux'))) && !/Les deux premiers \\u00e9tages sont des kilos/.test(C) && S.cave.includes("+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.flux'):'')+'</div>'")
    && /'cave\.flux': \{ t: 'De la vigne à la bouteille', p: \[/.test(S.uti) && S.uti.includes('Les deux premiers étages sont des <b>kilos convertis</b>'));

  // ③ les Courbes
  T('③ les notes de méthode quittent l’écran : densités (l’écart seul), températures (le manque seul), maturités, malo (les comptes)',
    S.cave.includes("    _pcrbEcarte(),'cave.courbes');") && S.cave.includes("    '','cave.courbes');") && !/function _crbNoteInterp/.test(C) && !/_crbNoteInterp\(\)/.test(C)
    && !/Quinze traits nomm/.test(C) && !/Ce bloc reste sur un/.test(C) && !/Aucune temp\\u00e9rature n\\u2019est enregistr\\u00e9e en \\u00e9levage/.test(C) && !/La bande verte est la <b>fen/.test(C));
  T('③ le « i » des courbes porte ce qui manquait : appuyer sur un graphe, le seuil de vin sec, 18 à 30 °C, l’axe de dates, l’entonnage', (() => {
    const i = S.uti.indexOf("'cave.courbes'"), b = S.uti.slice(i, S.uti.indexOf('] },', i));
    return b.includes('<b>Appuyez sur un graphe</b>') && b.includes('un moût à 12° est sec vers 994') && b.includes('de 18 à 30\\u00a0°C') && b.includes('Les maturités restent sur un <b>axe de dates</b>') && b.includes('Une cuvée sans <b>date d\\u2019entonnage</b>');
  })());
  T('③ sous-titres, aide des puces et légende courts', S.cave.includes("'Les m\\u00eames cuves, depuis l\\u2019encuvage.','J0 = encuvage',") && S.cave.includes("'Le couloir du cuvage, et la cuve que vous suivez.',")
    && S.cave.includes("if(l === 1) return 'Touchez-en une seconde pour comparer.';") && S.cave.includes("+ '<b style=\"color:var(--texte-med)\">Zone dor\\u00e9e</b>\\u00a0: du minimum au maximum. '")
    && !/Un palier de densit\\u00e9 s\\u2019explique souvent ici/.test(C) && !/Vous pouvez en ajouter une seconde/.test(C));

  // ④ les défauts
  T('④ la légende des maturités : sa feuille posée par Le Millésime', /function renderCaveMillesime\(\)\{\n  _mlInjectCss\(\); _pcavInjectCss\(\);\n  _caveV2InjectCss\(\);/.test(C));
  T('④ l’axe des jours : l’unité sous les graduations', /padL:42, padR:16, padT:24, padB:46 \}\);/.test(C) && C.includes("+ '<text x=\"' + x.toFixed(1) + '\" y=\"' + (pT + ih + 18) + '\" text-anchor=\"middle\" font-size=\"'")
    && C.includes("g += '<text x=\"' + (pL + iw) + '\" y=\"' + (c.h - 6) + '\" text-anchor=\"end\" font-size=\"'"));
  T('④ le tableau dans la police des chiffres ; les quatre graphes sans débord ; le choix de la courbe sur une ligne au téléphone',
    S.cave.includes("+'.pcrb-sec{font-family:var(--font-ui,Outfit,sans-serif);") && S.cave.includes("_pcrbSlot('pcrb-g-mat','crb-g')") && S.cave.includes("_pcrbSlot('pcrb-g-elev','crb-g')")
    && S.cave.includes("@media (max-width:599px){.mlx-chips.pcrb-sel{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}"));

  // ⑤
  T('⑤ l’aide : les phrases d’Ensemble et des Courbes, la méthode dans le « i »', S.uti.includes('« 2 cuves en fermentation, tout est rentré »') && S.uti.includes('la méthode de chaque graphe est dans son « i »'));
  T('⑤ le guide : les deux phrases, le « i » du parcours et des courbes', S.guide.includes('« 2 cuves en fermentation, tout est rentré »') && S.guide.includes('« 2 cuves en fermentation, 1 décuvée »')
    && S.guide.includes('la méthode de chaque graphe — le couloir, le seuil de vin sec, la fenêtre de travail — est dans son « i »'));
  const iW = S.wn.indexOf("{ v: '11.29'"), jW = S.wn.indexOf("{ v: '11.28'");
  T('⑤ l’annonce 11.29, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Courbes'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑤ les versions : APP 11.29 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.29 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.20 (24/11/2026) — MOTS-13 (§607)'));
  T('⑤ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Cave › Le Millésime — Ensemble et Courbes') && S.lm.includes('maquette-millesime-courbes-v1.html'));
  T('⑤ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots13.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots13.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-13 (§607) — Cave › Le Millésime, Ensemble et Courbes allégés\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['Ensemble oublie le dépassement', sur('cave', "    if(V.nD) p.push('<b class=\"ko\">'+V.nD+' parcelle'+pl(V.nD)+' au-dessus du maximum</b>');", '')],
    ['Ensemble dit « tout est rentré » malgré un volume à mesurer', sur('cave', "    if(V.rentre&&!V.nD&&!V.nMes) p.push('tout est rentr\\u00e9');", "    if(V.rentre) p.push('tout est rentr\\u00e9');")],
    ['Ensemble ne dit plus « Rien à signaler »', sur('cave', "    return p.length?p.join(', '):'Rien \\u00e0 signaler';", "    return p.join(', ');")],
    ['les sur-pied ne sont plus en orange', sur('cave', "    if(V.reste.length) p.push('<b class=\"or\">'+V.reste.length+' parcelle'", "    if(V.reste.length) p.push('<b>'+V.reste.length+' parcelle'")],
    ['la carte recalcule sa liste', sur('cave', "  var V=_mlVeille(mil,d), it=V.it, reste=V.reste;", "  var V=_mlVeille(mil,d), it=[], reste=V.reste;")],
    ['Courbes redit « décuvées » sans cuve en fermentation', sur('cave', "    if(E.nCuve&&E.dec) p.push(", "    if(E.dec) p.push(")],
    ['la tête ne donne plus ses comptes à la phrase', sur('cave', '           nElev:n.elev, nBtl:n.btl, dec:dec };', '           };')],
    ['la plus grande barre revient au bord', sur('cave', '  function larg(v){ return Math.max(6,(v/max)*(W-PAD-COL)); }', '  function larg(v){ return Math.max(6,(v/max)*(W-2*PAD)); }')],
    ['l’étage projeté redevient crème', sur('cave', "var dans=!e.proj&&w>=130,", "var dans=true,")],
    ['les milliers se collent', sur('cave', "     sub:_pcrbCvEnt(ch.kg)+'\\u00a0kg \\u00b7 '", "     sub:Math.round(ch.kg)+'\\u00a0kg \\u00b7 '")],
    ['le pied redit les volumes', sur('cave', "    foot+='La perte totale se lira quand tout sera d\\u00e9cuv\\u00e9.';", "    foot+='Mill\\u00e9sime en cours : <b>'+ch.hlCuve+' hL</b> fermentent encore. La perte totale se lira quand tout sera d\\u00e9cuv\\u00e9.';")],
    ['le « i » du parcours part', sur('cave', "+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.flux'):'')+'</div>'", "+'</div>'")],
    ['la note des densités revient', sur('cave', "    _pcrbEcarte(),'cave.courbes');", "    'Quinze traits nomm\\u00e9s tenaient sur le papier.'+_pcrbEcarte(),'cave.courbes');")],
    ['le « i » perd le seuil de vin sec', sur('uti', 'un moût à 12° est sec vers 994', 'un moût est sec vers 993')],
    ['le long sous-titre des températures revient', sur('cave', "'Les m\\u00eames cuves, depuis l\\u2019encuvage.','J0 = encuvage',", "'Un palier de densit\\u00e9 s\\u2019explique souvent ici\\u00a0: douze degr\\u00e9s.','J0 = encuvage',")],
    ['la feuille des maturités n’est plus posée', sur('cave', '  _caveV2InjectCss();   // MOTS-13', '  // MOTS-13')],
    ['l’unité retombe sur les graduations', sur('cave', '{ padL:42, padR:16, padT:24, padB:46 });', '{ padL:42, padR:16, padT:24, padB:32 });')],
    ['le serif revient dans le tableau', sur('cave', "+'.pcrb-sec{font-family:var(--font-ui,Outfit,sans-serif);", "+'.pcrb-sec{font-family:var(--font-titre);")],
    ['le graphe des maturités déborde à nouveau', sur('cave', "_pcrbSlot('pcrb-g-mat','crb-g')", "_pcrbSlot('pcrb-g-mat')")],
    ['les quatre boutons repassent sur deux lignes', sur('cave', '{.mlx-chips.pcrb-sel{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}', '{.mlx-chips.pcrb-sel{flex-wrap:wrap}')],
    ['l’aide ne dit pas la phrase d’Ensemble', sur('uti', '« 2 cuves en fermentation, tout est rentré »', '« 2 cuves »')],
    ['le guide ne dit pas où est la méthode', sur('guide', 'la méthode de chaque graphe — le couloir, le seuil de vin sec, la fenêtre de travail — est dans son « i »', 'la méthode est sous chaque graphe')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.29'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.20 (24/11/2026) — MOTS-13 (§607)', '// v12.20 (24/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-millesime-courbes-v1.html', 'maquette-millesime-cX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots13.mjs']", "['node scripts/mv-harnais-mots13Z.mjs']")],
  ];
  let bons = 0, mal = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { mal++; console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    let r; try { r = suite(S); } catch (e) { r = [['plantage', false]]; }
    const k = r.filter((x) => !x[1]).length;
    if (k > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + k + ')'); } else { mal++; console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom); }
  }
  console.log('\n' + (mal ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves rougissent');
  process.exit(mal ? 1 : 0);
}
