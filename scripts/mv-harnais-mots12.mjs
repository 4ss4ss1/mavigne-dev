/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-12 (§605) : CAVE › LE MILLÉSIME, PARCELLES ET CUVÉES ALLÉGÉS — UNE PHRASE, UNE LIGNE PAR PARCELLE
   Lancer :          node scripts/mv-harnais-mots12.mjs
   Contre-épreuves : node scripts/mv-harnais-mots12.mjs --contre

   POURQUOI IL EXISTE
   Mesuré (démo, 24/11) : Parcelles, l'écran le plus chargé de la Cave — 506 mots au téléphone, 9 phrases de 15 mots et plus,
   4,9 écrans ; le détail de chaque parcelle ouvert d'office (la même phrase de 20 mots six fois) ; deux paragraphes de
   méthode à demeure ; 18 mots d'explication avant le premier chiffre, sur les quatre onglets ; la case « Surface récoltée »
   illisible. Cuvées, au téléphone : une fiche sous la liste alors qu'aucune n'est ouverte ; le nom écrit deux fois dans la
   fiche ; « 50.0 hL ». Maquette validée (« Go », 24/11) avec ses quatre recommandations : docs/maquettes/maquette-millesime-parcelles-v1.html.

   CE QU'IL GARDE
   ① la phrase de l'onglet, JOUÉE (Parcelles, Cuvées ; rien sur Ensemble et Courbes), à la place des 18 mots ; elle lit les
      calculs de l'onglet, sans en refaire ; elle suit l'onglet (renderCaveMillesime la repose) ;
   ② la tête : le « i » (cave.millesime) porte l'explication ; plus de case mise en avant ; les quatre chiffres sur une ligne au
      téléphone ;
   ③ Parcelles : les paragraphes de méthode partent (leurs « i » les disent), un filtre vide ne se montre pas, une parcelle tient
      en une ligne et s'ouvre au toucher (JOUÉ : ouvrir, refermer, l'état retenu), « Poser le maximum » dans le détail ;
   ④ le détail : une phrase courte par état (mesuré, pas encore mesuré, en partie) ; plus « restants » ;
   ⑤ Cuvées : la liste seule au téléphone, le nom une fois dans la fiche unique, « 50 hL » ;
   ⑥ l'aide, le « i », le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { cave: lire('src/cave.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'),
  guide: lire('guide/08-cave.html'), liste: lire('scripts/mv-harnais-liste.mjs'), lm: lire('docs/maquettes/LISEZMOI.md'), maq: lire('docs/maquettes/maquette-millesime-parcelles-v1.html') };
function corps(src, nom) {
  const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom);
  const j = src.indexOf('{', i); let p = 0, k = j;
  for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; }
  return src.slice(i, k + 1);
}
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
// les rendements de la démo : 8 parcelles, 3 sans maximum, 6 estimées
const RD = () => [['Les Charmes', 0, 'estime'], ['La Combotte', 55, 'estime'], ['Clos du Moulin', 40, 'estime'], ['Les Perrières', 55, 'estime'],
  ['Aux Murgers', 0, 'estime'], ['En Bertrange', 0, 'estime'], ['Champ de la Croix', 55, 'mesure'], ['Vieilles Vignes', 40, 'mesure']]
  .map(([n, max, st]) => ({ parcelle: { nom: n }, max: max || null, statut: st, depasse: false }));
const CV = () => ({ groupes: [{ cle: 'elev', lignes: [{ nom: 'Vieilles Vignes' }] }, { cle: 'cuve', lignes: [{ nom: 'Charmes-Combotte' }, { nom: 'Perrières-Clos' }] },
  { cle: 'vendu', lab: 'Vendu en raisin', lignes: [{ nom: 'En Bertrange', simple: true }] }] });
function phrase(S, o) {
  const ctx = { window: { _dataReady: true }, _mlTab: o.tab, _mlMilActif: () => 2026, _pcavLog: () => {}, caveSection: o.section || 'millesime',
    _mlRendements: () => o.rd || [], _mlResteARentrer: () => o.reste || [], _pcrbCvLignes: () => o.cv || null };
  vm.createContext(ctx); vm.runInContext(corps(S.cave, '_mlPhrase') + '\n' + corps(S.cave, '_caveMillNoteHtml'), ctx);
  return { p: ctx._mlPhrase(), note: ctx._caveMillNoteHtml() };
}
// un DOM de poche pour jouer l'ouverture d'une parcelle
function ligneDom() {
  const cls = new Set(['mlp-r']), attrs = {};
  const d = { hidden: true };
  const r = { classList: { contains: (c) => cls.has(c), toggle: (c, o) => { if (o) cls.add(c); else cls.delete(c); } }, querySelector: (q) => (q === '.mlp-d' ? d : null) };
  const b = { closest: (q) => (q === '.mlp-r' ? r : null), setAttribute: (k, v) => { attrs[k] = v; } };
  return { r, b, d, attrs, cls };
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };
  const C = sansCom(S.cave);

  // ① la phrase
  essai('① Parcelles : « 8 parcelles récoltées, 3 sans maximum, 6 estimées » (le compte en gras, les sans-maximum en orange)', () => {
    const { p, note } = phrase(S, { tab: 'parc', rd: RD() });
    return [texte(p) === '8 parcelles récoltées, 3 sans maximum, 6 estimées' && /<b class="or">3 sans maximum<\/b>/.test(p) && note === '<div class="mlh-tous ml-ph">' + p + '</div>', texte(p)];
  });
  essai('① … au-dessus du maximum (rouge) et encore sur pied (orange) d’abord ; « aucune au-dessus du maximum » quand tout est posé', () => {
    const rd = RD(); rd[1].depasse = true;
    const a = texte(phrase(S, { tab: 'parc', rd, reste: [{ nom: 'X' }, { nom: 'Y' }] }).p);
    const tous = RD().map((r) => Object.assign(r, { max: 55, statut: 'mesure' }));
    const b = texte(phrase(S, { tab: 'parc', rd: tous }).p);
    const ko = /<b class="ko">1 au-dessus du maximum<\/b>/.test(phrase(S, { tab: 'parc', rd }).p);
    return [ko && a === '8 parcelles récoltées, 1 au-dessus du maximum, 2 encore sur pied, 3 sans maximum, 6 estimées' && b === '8 parcelles récoltées, aucune au-dessus du maximum', a + ' | ' + b];
  });
  essai('① Cuvées : « 3 cuvées, 2 encore en cuve, 1 en élevage » ; « 1 volume à mesurer » en orange ; rien sur Ensemble ni Courbes', () => {
    const a = texte(phrase(S, { tab: 'cuv', cv: CV() }).p);
    const cv = CV(); cv.groupes[0].lignes[0].saisir = true;
    const b = phrase(S, { tab: 'cuv', cv }).p;
    const v = phrase(S, { tab: 'vie', rd: RD() }), c = phrase(S, { tab: 'crb', rd: RD() }), ch = phrase(S, { tab: 'parc', rd: RD(), section: 'elevage' });
    return [a === '3 cuvées, 2 encore en cuve, 1 en élevage' && /<b class="or">1 volume à mesurer<\/b>/.test(b) && v.note === '' && c.note === '' && ch.note === '', a];
  });
  T('① elle lit les calculs de l’onglet (_mlRendements, _mlResteARentrer, _pcrbCvLignes), sans en refaire', (() => { const c = corps(S.cave, '_mlPhrase'); return /_mlRendements\(mil\)/.test(c) && /_mlResteARentrer\(mil\)/.test(c) && /_pcrbCvLignes\(mil\)/.test(c) && !/_vendRdtParc|_mlKgHl|surface/.test(c); })());
  T('① elle suit l’onglet : renderCaveMillesime la repose après la tête ; les 18 mots d’explication ont quitté le code', C.includes("  if(hd) hd.innerHTML=ch?_mlHead(mil,ch,d):'';\n  _mlPhrasePose();")
    && /function _mlPhrasePose\(\)\{\n  var hn=document\.getElementById\('cave-milnote'\); if\(!hn\) return;\n  var h=_caveMillNoteHtml\(\); hn\.innerHTML=h; hn\.style\.display=h\?'':'none';\n\}/.test(C) && !/montre celui de la campagne en cours/.test(C));

  // ② la tête
  T('② le « i » de la tête (cave.millesime) porte l’explication', S.cave.includes("<div class=\"mlh-k\">Le mill\\u00e9sime'+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.millesime'):'')+'</div>")
    && /'cave\.millesime': \{ t: 'Le millésime regardé', p: \[/.test(S.uti) && S.uti.includes('Le Millésime montre celui de la <b>campagne en cours</b>. Choisir une année, en haut à droite, la choisit pour toute la Cave'));
  T('② plus de case mise en avant (la « Surface récoltée » illisible) ; les quatre chiffres sur une ligne au téléphone', S.cave.includes("+_pcavK('Surface r\\u00e9colt\\u00e9e',_pcavF1(ch.ha),'ha',(ch.parcelles||0)+' parcelles')\n")
    && S.cave.includes("return '<div class=\"pcav-card ml-tu\"><div class=\"pcav-kg\">'") && S.cave.includes("@media (max-width:599px){#page-cave .ml-tu .pcav-kg{grid-template-columns:repeat(4,minmax(0,1fr));"));

  // ③ Parcelles
  const PA = sansCom(corps(S.cave, '_mlRenderParc')), AO = sansCom(corps(S.cave, '_mlAocHtml'));
  T('③ les paragraphes de méthode partent (« Ce qui se déclare… », « Le trait vertical… ») ; « Maximum non renseigné » → « sans maximum »', !/mlx-hint/.test(PA) && !/mlx-hint/.test(AO)
    && !/Le trait vertical est le maximum/.test(C) && !/Ce qui se d\\u00e9clare\\u00a0: la surface/.test(C) && !/Maximum non renseign/.test(C) && /'sans maximum'/.test(AO));
  T('③ un filtre vide ne se montre pas (« Toutes » et le filtre choisi, toujours)', PA.includes("    if(!on&&f[0]!=='tout'&&!f[2]) return;"));
  T('③ une parcelle tient en une ligne : le bouton s’ouvre, le détail est à part, caché tant qu’elle est fermée', PA.includes("h+='<div class=\"mlp-r'+(ouv?' open':'')+'\"><button type=\"button\" class=\"mlp-l'+(r.depasse?' over':'')+'\" aria-expanded=\"'+(ouv?'true':'false')+'\" onclick=\"_mlParcDet(this,\\''+_escAttr(nom)+'\\')\">'")
    && PA.includes("+'<div class=\"mlp-d\"'+(ouv?'':' hidden')+'>'+_mlRdtDetail(r)+dm+act+'</div></div>';") && !/\+_mlRdtDetail\(r\)\+'<\/span>'/.test(PA));
  T('③ « Poser le maximum » est un bouton du détail, pour l’administrateur seulement ; la ligne dit « sans maximum »', PA.includes("var act=adm?('<div class=\"mlp-da\"><button type=\"button\" class=\"pcav-act\" onclick=\"_mlSetRdtMax(")
    && PA.includes("(r.max?'Changer le maximum':('Poser le maximum '+_escHtml(String(mil))))") && PA.includes(": '<span class=\"mlp-bt\">sans maximum</span>')") && !/Toucher pour poser le maximum/.test(C));
  essai('③ joué : toucher ouvre (aria, caché), retoucher referme, l’ouverture est retenue par nom', () => {
    const ctx = { _mlParcOuv: {} }; vm.createContext(ctx); vm.runInContext(corps(S.cave, '_mlParcDet'), ctx);
    const L = ligneDom();
    ctx._mlParcDet(L.b, 'Les Charmes'); const o1 = L.cls.has('open') && L.d.hidden === false && L.attrs['aria-expanded'] === 'true' && ctx._mlParcOuv['Les Charmes'] === 1;
    ctx._mlParcDet(L.b, 'Les Charmes'); const o2 = !L.cls.has('open') && L.d.hidden === true && L.attrs['aria-expanded'] === 'false' && !('Les Charmes' in ctx._mlParcOuv);
    return [o1 && o2 && /var _mlParcOuv=\{\};/.test(C) && /var nom=r\.parcelle\.nom, ouv=!!_mlParcOuv\[nom\];/.test(PA) && /window\._mlParcDet\s+= _mlParcDet;/.test(C), JSON.stringify({ o1, o2 })];
  });

  // ④ le détail
  const DT = sansCom(corps(S.cave, '_mlRdtDetail'));
  T('④ le détail : « Mesuré : … », « Pas encore mesuré : … », « N % des kilos mesurés ; le reste… », « Se fige au décuvage » ; plus « restants »',
    DT.includes("'<span class=\"mlx-note ok\"><b>Mesur\\u00e9</b>\\u00a0: '") && DT.includes("('<b>Pas encore mesur\\u00e9</b>\\u00a0: '+fo+' estim\\u00e9s pour '") && DT.includes("('<b>'+d.vol.pctOk+'\\u00a0% des kilos mesur\\u00e9s</b>\\u00a0; le reste, '")
    && DT.includes("'Se fige au retour du client.':'Se fige au d\\u00e9cuvage.'") && !/restants|Le rendement est une mesure|ont un volume connu/.test(DT));
  T('④ … les écarts de surface restent écrits en entier (rares, à corriger)', DT.includes('Les surfaces d\\u00e9clar\\u00e9es d\\u00e9passent la parcelle de ') && DT.includes(' ha ne sont r\\u00e9clam\\u00e9s par personne.'));

  // ⑤ Cuvées
  T('⑤ au téléphone, la liste seule tant qu’aucune cuvée n’est ouverte ; côte à côte sur ordinateur', S.cave.includes("+'.mlc>.mlc-fiche{display:none}.mlc.fiche>.mlc-fiche{display:block}'")
    && S.cave.includes("+'.mlc .mlc-liste,.mlc.fiche .mlc-liste,.mlc .mlc-fiche,.mlc.fiche .mlc-fiche,.mlc>.mlc-fiche{display:block}'"));
  essai('⑤ la fiche unique n’écrit plus le nom (l’en-tête du Chai le dit) ; le « i » passe sur la chaîne', () => {
    const F = sansCom(corps(S.cave, '_mlCuvFicheHtml'));
    return F.includes("  var h=dedans?'':('<button type=\"button\" class=\"mlc-ret\"") && F.includes("+'<span class=\"mlc-pill '+g.cle+'\">'+i.etat+'</span>'+iB+'</div>');")
      && F.includes("h+='<div class=\"mlc-sec'+(dedans?' mlc-sec1':'')+'\">De la r\\u00e9colte \\u00e0 la bouteille'+(dedans?iB:'')+'</div>'");
  });
  T('⑤ « 50 hL », pas « 50.0 hL » (l’en-tête d’une cuvée)', S.cave.includes("+' \\u00B7 '+_mvF1(_caveVolHl(cuv))+'\\u00a0hL'+") && !/_caveVolHl\(cuv\)\.toFixed\(1\)\+' hL'/.test(C));

  // ⑥
  T('⑥ l’aide : la phrase, une ligne par parcelle, « Poser le maximum » dans Parcelles', S.uti.includes('Juste sous les onglets, une phrase dit ce qui compte dans la vue ouverte') && S.uti.includes('dessous, une ligne par parcelle')
    && S.uti.includes('dans Le Millésime, vue Parcelles, touchez la parcelle, puis « Poser le maximum »') && !S.uti.includes('en touchant une parcelle dans « La ligne de vie »'));
  T('⑥ le « i » du rendement : « Poser le maximum » après avoir touché la parcelle', S.uti.includes('touchez une parcelle, puis «\\u00a0Poser le maximum\\u00a0»'));
  T('⑥ le guide : la phrase, la ligne par parcelle et son détail, le geste du maximum', S.guide.includes('Juste sous les onglets, <b>une phrase</b> dit ce qui compte') && S.guide.includes('<b>une ligne par\n    parcelle</b>')
    && S.guide.includes('dans la vue <b>Parcelles</b>, touchez la parcelle,\n      puis « Poser le maximum »') && !S.guide.includes('dans « La ligne de vie », touchez une parcelle'));
  const iW = S.wn.indexOf("{ v: '11.28'"), jW = S.wn.indexOf("{ v: '11.27'");
  T('⑥ l’annonce 11.28, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Poser le maximum'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑥ les versions : APP 11.28 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.28 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.19 (24/11/2026) — MOTS-12 (§605)'));
  T('⑥ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('Cave › Le Millésime — Parcelles et Cuvées') && S.lm.includes('maquette-millesime-parcelles-v1.html'));
  T('⑥ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots12.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots12.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-12 (§605) — Cave › Le Millésime, Parcelles et Cuvées allégés\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 500) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['la phrase oublie les parcelles sans maximum', sur('cave', "    if(nSans) p.push('<b class=\"or\">'+nSans+' sans maximum</b>');", '')],
    ['la phrase dit « aucune au-dessus » alors que des maximums manquent', sur('cave', "    if(!nD&&!nSans&&rd.length) p.push('aucune au-dessus du maximum');", "    if(!nD&&rd.length) p.push('aucune au-dessus du maximum');")],
    ['le dépassement n’est plus en rouge', sur('cave', "    if(nD) p.push('<b class=\"ko\">'+nD+' au-dessus du maximum</b>');", "    if(nD) p.push(nD+' au-dessus du maximum');")],
    ['la phrase recalcule le rendement', sur('cave', "    rd.forEach(function(r){ if(r.depasse) nD++; if(!r.max) nSans++; if(r.statut!=='mesure') nE++; });", "    rd.forEach(function(r){ if(_mlKgHl()&&r.depasse) nD++; if(!r.max) nSans++; if(r.statut!=='mesure') nE++; });")],
    ['Cuvées oublie le volume à mesurer', sur('cave', "    if(nMes) p.push('<b class=\"or\">'+nMes+' volume'+pl(nMes)+' \\u00e0 mesurer</b>');", '')],
    ['la phrase se montre aussi au Chai', sur('cave', "  if(typeof caveSection==='undefined' || caveSection!=='millesime') return '';", "  if(typeof caveSection==='undefined') return '';")],
    ['la phrase ne suit plus l’onglet', sur('cave', "  _mlPhrasePose();   // MOTS-12 : la phrase suit l'onglet\n", '')],
    ['le « i » de la tête part', sur('cave', "+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('cave.millesime'):'')+'</div>", "+'</div>")],
    ['la case illisible revient', sur('cave', "+_pcavK('Surface r\\u00e9colt\\u00e9e',_pcavF1(ch.ha),'ha',(ch.parcelles||0)+' parcelles')\n", "+_pcavK('Surface r\\u00e9colt\\u00e9e',_pcavF1(ch.ha),'ha',(ch.parcelles||0)+' parcelles',1)\n")],
    ['les quatre chiffres reviennent en cases au téléphone', sur('cave', "return '<div class=\"pcav-card ml-tu\"><div class=\"pcav-kg\">'", "return '<div class=\"pcav-card\"><div class=\"pcav-kg\">'")],
    ['le paragraphe du trait revient', sur('cave', "  L.sort(function(a,b){ return (b.hlHa||0)-(a.hlHa||0); });", "  h+='<div class=\"mlx-hint mlp-hint\">Le trait vertical est le maximum de l\\u2019appellation.</div>';\n  L.sort(function(a,b){ return (b.hlHa||0)-(a.hlHa||0); });")],
    ['les filtres vides reviennent', sur('cave', "    if(!on&&f[0]!=='tout'&&!f[2]) return;", '')],
    ['le détail est ouvert d’office', sur('cave', "+'<div class=\"mlp-d\"'+(ouv?'':' hidden')+'>'", "+'<div class=\"mlp-d\">'")],
    ['toucher ne referme plus', sur('cave', "  var o=!r.classList.contains('open');", "  var o=true;")],
    ['l’ouverture n’est plus retenue', sur('cave', "  if(o) _mlParcOuv[nom]=1; else delete _mlParcOuv[nom];", '')],
    ['« Poser le maximum » s’offre à tout le monde', sur('cave', "    var act=adm?('<div class=\"mlp-da\">", "    var act=true?('<div class=\"mlp-da\">")],
    ['« restants » revient dans le détail', sur('cave', "+'\\u00a0kg, estim\\u00e9 \\u00e0 '+fo+'. ')", "+'\\u00a0kg restants, estim\\u00e9s \\u00e0 '+fo+'. ')")],
    ['la fiche se montre sous la liste au téléphone', sur('cave', "+'.mlc>.mlc-fiche{display:none}.mlc.fiche>.mlc-fiche{display:block}'", "+''")],
    ['le nom s’écrit deux fois dans la fiche unique', sur('cave', "  var h=dedans?'':('<button type=\"button\" class=\"mlc-ret\"", "  var h=(dedans?'<h3>x</h3>':'')+('<button type=\"button\" class=\"mlc-ret\"")],
    ['« 50.0 hL » revient', sur('cave', "+' \\u00B7 '+_mvF1(_caveVolHl(cuv))+'\\u00a0hL'+", "+' \\u00B7 '+_caveVolHl(cuv).toFixed(1)+' hL'+")],
    ['l’aide garde l’ancien geste', sur('uti', 'dans Le Millésime, vue Parcelles, touchez la parcelle, puis « Poser le maximum »', 'en touchant une parcelle dans « La ligne de vie »')],
    ['le guide garde l’ancien geste', sur('guide', 'dans la vue <b>Parcelles</b>, touchez la parcelle,\n      puis « Poser le maximum »', 'dans « La ligne de vie », touchez une parcelle')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("{ v: '11.28'"); const j = S.wn.indexOf("pour: ['admin']", i); if (i < 0 || j < 0) throw new Error('motif absent : annonce'); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + "pour: ['admin']".length) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.19 (24/11/2026) — MOTS-12 (§605)', '// v12.19 (24/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-millesime-parcelles-v1.html', 'maquette-millesime-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots12.mjs']", "['node scripts/mv-harnais-mots12Z.mjs']")],
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
