/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-3 (§584) : POSTES & TRAVAUX ET PARCELLES EN LISTES, COMME LA MAQUETTE
   Lancer :          node scripts/mv-harnais-mots3.mjs
   Contre-épreuves : node scripts/mv-harnais-mots3.mjs --contre

   POURQUOI IL EXISTE
   MOTS-2 (§583) avait allégé le haut de ces deux écrans et gardé leurs tableaux. Mis face à face avec la maquette validée
   (`docs/maquettes/maquette-moins-de-texte-v3.html`), Nico a tranché, 16/11 : « comme la maquette ». Les deux tableaux de
   Postes & travaux et le tableau de Parcelles deviennent des LISTES ; l'anneau et le graphique en barres partent ; le tableau
   complet des parcelles reste, replié, avec ses exports.

   CE QU'IL GARDE
   ① La ligne de liste (_pecLigne) et la pastille d'écart (_pecEcPst), EXÉCUTÉES : un nom, un montant, une jauge bornée,
      un repère, une pastille ; le détail dans la ligne ouverte.
   ② Postes & travaux : deux listes (par poste, par travail), la tuile « Temps réel contre barème » (EXÉCUTÉE : un travail
      mesuré, plusieurs, aucun), plus de tableau, plus d'anneau, plus de graphique en barres.
   ③ Parcelles : la liste dans l'ordre du tri, quatre chiffres avec leur repère, deux tuiles repliées (le graphique des écarts,
      le tableau complet et ses treize colonnes), les deux exports.
   ④ La bande des heures sans validation mène au Journal ; les trois tuiles sont repliées par défaut et ont leur icône.
   ⑤ Les fiches, le guide, l'aide, l'annonce, les versions et la référence des mots suivent.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'), idx: lire('index.html'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs'), ref: lire('scripts/mv-mots-baseline.json') };
const fnDe = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n}\n', i) + 3); };
const ligne = (s, sig) => { const i = s.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return s.slice(i, s.indexOf('\n', i) + 1); };
const sansCom = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/ .*$/gm, '');
const plat = (s) => String(s).replace(/[  ]/g, ' ');

const BOUCHONS = `
function _pilEsc(x){ return String(x); }
function _ecoEur(v){ return String(Math.round(v)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')+' €'; }
function _ecoH1(v){ return (Math.round(v*10)/10).toString().replace('.',','); }
function _pilHa(v){ return String(v).replace('.',','); }
function _pilTnom(n){ return n; }
function _mvInfoBtn(c){ return '[i:'+c+']'; }
function _pilStat(n,u,w){ return '[stat|'+n+'|'+(u||'')+']'; }
function _pilTile(id,dot,titre,stat,sub,grad,body,cle){ return JSON.stringify({ id:id, titre:titre, stat:stat, sub:sub, body:body, cle:cle||null }); }
var __V=null; function _ecoTempsVigne(){ if(__V==='boum') throw new Error('x'); return __V; }
`;
function monde(S) {
  const c = {}; c.window = { logError() {} }; vm.createContext(c);
  vm.runInContext(BOUCHONS + ['function _pecLigne(nom, val, pct, col, rep, pst, det){', 'function _pecEcPst(ec){', 'function _pecTuileTemps(){'].map((n) => fnDe(S.pil, n)).join('\n')
    + '\n' + ligne(S.pil, 'function _pecEcEur(ec){')
    + '\nthis.L=_pecLigne; this.P=_pecEcPst; this.T=function(v){ __V=v; return JSON.parse(_pecTuileTemps()); };', c);
  return c;
}
const tache = (nom, surf, h, bar) => ({ nom, surf, h, bar, hhaR: surf > 0 ? h / surf : 0, hhaB: surf > 0 ? bar / surf : 0, ecart: bar > 0 ? (h - bar) / bar * 100 : null });

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const M = monde(S);
  const P = sansCom(S.pil);

  /* ── ① LA LIGNE ET LA PASTILLE, EXÉCUTÉES ── */
  const l1 = M.L('NOM', 'VAL', 12.34, '#abc', 'sur 100 €', '[PST]', 'DÉTAIL');
  T('① une ligne : un nom et un montant, puis une jauge, son repère et sa pastille ; le détail dans la ligne ouverte', /^<details class="pec-rg"><summary><span class="l1"><span class="nm">NOM<\/span><span class="vl">VAL<\/span><\/span><span class="l2"><span class="pec-bar"><i style="width:12\.3%;background:#abc"><\/i><\/span><span class="rp">sur 100 €<\/span>\[PST\]<\/span><\/summary><div class="dt">DÉTAIL<\/div><\/details>$/.test(l1), l1);
  T('① la jauge est bornée : jamais sous 0, jamais au-delà de 100, 0 quand la valeur manque', /width:100\.0%/.test(M.L('a', 'b', 250, 'x', '', '', 'd')) && /width:0\.0%/.test(M.L('a', 'b', -5, 'x', '', '', 'd')) && /width:0\.0%/.test(M.L('a', 'b', NaN, 'x', '', '', 'd')));
  T('① sans repère ni pastille, la ligne n’en invente pas', !/class="rp"/.test(M.L('a', 'b', 1, 'x', '', '', 'd')) && /<\/i><\/span><\/span><\/summary>/.test(M.L('a', 'b', 1, 'x', '', '', 'd')));
  const pp = plat(M.P(513)), pm = plat(M.P(-792));
  T('① l’écart en pastille : fond orange et « +513 € » quand c’est plus cher que le barème (texte sombre : le contraste)', /background:var\(--orange-pale\);color:var\(--texte\)">\+513 €<\/span>$/.test(pp), pp);
  T('① … grise et « −792 € » quand c’est moins cher', /background:var\(--gris-clair\);color:var\(--texte-med\)">−792 €<\/span>$/.test(pm), pm);
  T('① … rien quand l’écart ne se lit pas, ou sous un euro', M.P(null) === '' && M.P(undefined) === '' && M.P(0.3) === '' && M.P(-0.4) === '');

  /* ── ② POSTES & TRAVAUX ── */
  const pos = sansCom(fnDe(S.pil, 'function _pecViewPostes(E){'));
  T('② plus de tableau, plus d’anneau, plus de graphique en barres', !/<table/.test(pos) && !/_pecDonutSvg|_pecTaskSvg|pec-g-task|pec-grid2/.test(P));
  T('② par poste : l’engagé, sa jauge sur le budget du poste, « sur … », « projeté »', /return _pecLigne\(_pilEsc\(p\.lab\), _pilEsc\(_ecoEur\(p\.fait\)\), \(p\.budget>0\?p\.fait\/p\.budget\*100:0\), p\.col, 'sur '\+_pilEsc\(_ecoEur\(p\.budget\)\), \(p\.proj\?PROJ:''\), det\);/.test(pos));
  T('② … la ligne ouverte : la base de calcul, le coût à l’hectare, la part du budget', /var det=\[_pilEsc\(p\.det\), \(E\.tot\.surf>0\?\(_pilEsc\(_ecoEur\(p\.budget\/E\.tot\.surf\)\)\+'\/ha'\):''\), _pilEsc\(_pecPct\(pc\)\)\+' du budget'\]/.test(pos));
  T('② … le surcoût de retard garde sa ligne, « hors total », quand il y en a un', /if\(E\.tot\.retE>0\) lp\+=_pecLigne\('Surcoût de retard', '\+'\+_pilEsc\(_ecoEur\(E\.tot\.retE\)\), 0, _PEC_COL\.ret, '',/.test(pos) && />hors total<\/span>'/.test(pos));
  T('② par travail : le réalisé payé, la jauge du fait, « fait N % · budget … », l’écart en pastille', /return _pecLigne\(_pilEsc\(_pilTnom\(t\.nom\)\), _pilEsc\(_ecoEur\(t\.reE\)\), t\.pct, 'var\(--vert-med\)',\n\s+'fait '\+Math\.round\(t\.pct\)\+' % · budget '\+_pilEsc\(_ecoEur\(t\.bE\)\), _pecEcPst\(t\.ecE\), det\);/.test(pos) && !/_ecoEur\(t\.fE\)/.test(pos));
  T('② … la ligne ouverte : les heures du barème, les heures passées, le reste, l’hectare, la part', /_ecoH1\(t\.bH\)\+' h au barème'/.test(pos) && /\(\(E\.reOk&&t\.reH>0\)\?\(_ecoH1\(t\.reH\)\+' h passées'\):''\)/.test(pos) && /'reste '\+_ecoEur\(t\.rE\), _ecoEur\(t\.euHa\)\+'\/ha', _pecPct\(t\.part\)\+' du budget'/.test(pos));
  T('② deux cartes côte à côte sur ordinateur, la tuile du temps sous la seconde, les deux portes en bas', /H\+='<div class="pec-g2">'\+cP\+'<div>'\+cT\+'<div class="pil-panels pec-p1">'\+_pecTuileTemps\(\)\+'<\/div><\/div><\/div>'/.test(pos) && /data-pec="sub" data-v="exe"/.test(pos) && /data-pec="sub" data-v="par"/.test(pos) && /_mvIcon\('raisin',16\)/.test(pos));
  T('② les titres : « Par poste », « Par travail · main-d’œuvre », chacun sa fiche', /<div class="pec-ct">Par poste<\/div>/.test(pos) && /_mvInfoBtn\('pil\.eco\.postes'\)/.test(pos) && /<div class="pec-ct">Par travail<\/div>/.test(pos) && /<div class="pec-cs pec-ci">main-d’œuvre'/.test(pos) && /_mvInfoBtn\('pil\.eco\.travaux'\)/.test(pos));
  const t1 = M.T({ ok: true, taches: [tache('Palissage', 4.2, 72, 210)], gens: [{ nom: 'Jean', hAtt: 8 }], hAtt: 74, hAff: 72, nEv: 4, hTrac: 0, hCave: 0 });
  T('② la tuile du temps, un seul travail mesuré : son h/ha réel et son barème sur le titre, son nom dessous', t1.id === 'ecotemps' && t1.titre === 'Temps réel contre barème' && plat(t1.stat) === '[stat|17,1| h/ha · barème 50]' && t1.sub === 'Palissage' && t1.cle === 'pil.eco.temps', JSON.stringify([t1.stat, t1.sub]));
  T('② … son tableau et la ligne des validations sont dedans', /<table class="pec-tbl" style="min-width:480px">/.test(t1.body) && /<b>72 h<\/b> sur 4 validations/.test(plat(t1.body)) && /<b>74 h en attente<\/b> \(Jean 8 h\)/.test(plat(t1.body)));
  const t2 = M.T({ ok: true, taches: [tache('Taille', 2, 120, 100), tache('Tirage', 2, 60, 100), tache('Liage', 1, 0, 30)], gens: [], hAtt: 0, hAff: 180, nEv: 9, hTrac: 0, hCave: 0 });
  T('② … plusieurs travaux mesurés : l’écart de toutes les heures validées au barème des mêmes surfaces', plat(t2.stat) === '[stat|−10 %| contre barème]' && t2.sub === '2 travaux mesurés', JSON.stringify([t2.stat, t2.sub]));
  const t3 = M.T({ ok: true, taches: [], gens: [], hAtt: 12 }), t4 = M.T(null), t5 = M.T('boum');
  T('② … rien de validé, pas de période, ou une lecture qui échoue : un tiret, et la raison dedans', t3.stat === '[stat|—|]' && /Aucune validation sur la période/.test(plat(t3.body)) && /<b>12 h<\/b> en attente/.test(t3.body) && t4.stat === '[stat|—|]' && /rien à verser/.test(plat(t4.body)) && /rien à verser/.test(plat(t5.body)));

  /* ── ③ PARCELLES ── */
  const par = sansCom(fnDe(S.pil, 'function _pecViewParcelles(E){'));
  T('③ la liste suit le tri mémorisé (celui du tableau) : une ligne par parcelle, sa surface à côté du nom', /var rows=_pecSortRows\(E\);/.test(par) && /var lst=rows\.map\(function\(r\)\{/.test(par) && /return _pecLigne\(_pilEsc\(r\.nom\)\+'<small>'\+_pilHa\(r\.surf\)\+' ha<\/small>', _pilEsc\(_ecoEur\(r\.engRe\)\), \(r\.budget>0\?r\.engRe\/r\.budget\*100:0\), _PEC_COL\.mo,\n\s+'sur '\+_pilEsc\(_ecoEur\(r\.budget\)\), _pecEcPst\(r\.ecE\), det\);/.test(par));
  T('③ … la ligne ouverte : le fait, les postes qui ont coûté, le reste, l’hectare, d’où vient le taux', /\(r\.arr\?'':\('fait '\+Math\.round\(r\.pct\)\+' %'\)\)/.test(par) && /\(r\.gnrF>0\?\('GNR '\+_ecoEur\(r\.gnrF\)\):''\)/.test(par) && /'reste '\+_ecoEur\(r\.reste\), _ecoEur\(r\.coutHa\)\+'\/ha'/.test(par) && /var src=r\.arr\?'arrachée':\(r\.src==='reel'\?'équipe réelle':'taux moyen'\);/.test(par));
  T('③ … une parcelle arrachée, des plants, un retard : dits dans la ligne ouverte', /\(r\.trous>0\?\(_pilNum\(r\.trous\)\+' plants'\):''\)/.test(par) && /\(r\.retE>0\?\('\+'\+_ecoEur\(r\.retE\)\+' de retard, hors total'\):''\)/.test(par));
  T('③ le titre dit « réalisé », pas « engagé » (un mot, un total : §583c)', /<div class="pec-ct">Parcelle par parcelle<\/div>/.test(par) && /<div class="pec-cs pec-ci">réalisé'/.test(par) && !/engagé/.test(par));
  const kp = par.slice(par.indexOf('var kp='), par.indexOf('window._mvGraphSuivre'));
  T('③ quatre chiffres, deux par deux, chacun son repère', /<div class="pec-kpis pec-k2">/.test(kp) && (kp.match(/<div class="pec-k">/g) || []).length === 4 && (kp.match(/<div class="s">/g) || []).length === 4);
  T('③ … Budget · Reste (de main-d’œuvre : pas le « Reste » de la Synthèse) · Écart · À l’hectare', /<div class="l">Budget<\/div><div class="v">'\+_pilEsc\(_ecoEur\(E\.budget\)\)/.test(kp) && /<div class="l">Reste<\/div><div class="v">'\+_pilEsc\(_ecoEur\(E\.tot\.moR\)\)\+'<\/div><div class="s">de main-d’œuvre<\/div>/.test(kp) && /<div class="l">Écart<\/div><div class="v">'\+_pilEsc\(_pecEcEur\(E\.ecRe\)\)/.test(kp) && /<div class="l">À l’hectare<\/div><div class="v">'\+_pilEsc\(_ecoEur\(E\.coutHaB\)\)/.test(kp));
  T('③ le graphique des écarts : une tuile repliée, le coût moyen sur le titre', /var tE=_pilTile\('ecoecart','#8A5A38','Écart au coût moyen à l’hectare', _pilStat\(_pilEsc\(_ecoEur\(E\.coutHaB\)\),' par ha'\), 'à surface égale', null,\n\s+'<div id="pec-g-ecart"><\/div>', 'pil\.eco\.parcelles'\);/.test(par) && /window\._mvGraphSuivre\('#pec-g-ecart', function\(w\)\{ return _pecEcartSvg\(E,w\); \}\);/.test(par));
  T('③ le tableau complet reste, replié : treize colonnes, à trier, sur toute la largeur', /var tT=_pilTile\('ecotab','#8A5A38','Le tableau complet', _pilStat\(String\(rows\.length\),' parcelle'\+\(rows\.length>1\?'s':''\)\), 'treize colonnes, à trier', null,/.test(par) && /<table class="pec-tbl" style="min-width:1040px"><thead><tr>'\+head\+'<\/tr><\/thead><tbody>'\+body\+'<\/tbody><tfoot>'\+foot\+'<\/tfoot><\/table>/.test(par) && /data-pec="ps" data-k="/.test(par) && /\+'<div class="pil-panels pec-p1">'\+tT\+'<\/div>'/.test(par) && (S.pil.match(/^  \['\w+', *'[^']+', *[01]\],?$/gm) || []).length === 13);
  T('③ les deux exports sont hors de la tuile : ils marchent sans l’ouvrir', /\+tT\+'<\/div>'\n\s+\+'<div class="pec-acts"><button class="pec-btn" data-pec="csv">/.test(par) && /data-pec="copy">/.test(par));
  T('③ la liste à gauche, les chiffres et le graphique à droite, sur ordinateur', /H\+='<div class="pec-g2 pec-g21">'\+cL\+'<div>'\+kp\+'<div class="pil-panels pec-p1">'\+tE\+'<\/div><\/div><\/div>'/.test(par));

  /* ── ④ LA PORTE DU JOURNAL, LES TUILES, LE STYLE ── */
  const att = sansCom(fnDe(S.pil, 'function _pecBandeAttente(E){'));
  T('④ la bande des heures sans validation mène au Journal, et le montant ne se coupe pas', /'<button class="pil-diag-go ghost" data-diag="journal">Journal ›<\/button>'\);/.test(att) && /<span style="white-space:nowrap">· '\+_pilEsc\(_ecoEur\(E\.reAttE\)\)\+'<\/span>'/.test(att));
  T('④ … la porte connaît le Journal', /^  journal:   \['journal',null,null\],/m.test(S.pil));
  // MOTS-9 (§592) : la ligne des défauts commence désormais par les tuiles de L'équipe & le matériel (tension, conso, trx).
  const def = ligne(S.pil, '  collapsed:{'), ico = ligne(S.pil, "  ift:'pulverisateur',dre:'goutte',");
  T('④ les trois tuiles arrivent repliées (un état déjà mémorisé prend le défaut pour une clé neuve)', /ecotemps:1,ecoecart:1,ecotab:1,/.test(def) && /o\[k\]=\(cur&&cur\[k\]!==undefined\)\?\(cur\[k\]\?1:0\):d\[k\];/.test(S.pil));
  T('④ … et ont leur icône', /ecotemps:'balance',ecoecart:'graphique',ecotab:'liste'\};/.test(ico));
  T('④ le style : deux colonnes dès 881 px, la liste à 1,5 pour 1 ; une tuile seule prend la largeur ; quatre chiffres deux par deux', /'@media\(min-width:881px\)\{\.pec-g2\{grid-template-columns:1fr 1fr\}\.pec-g2\.pec-g21\{grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\)\}\}'/.test(S.pil) && /'\.pil-panels\.pec-p1\{grid-template-columns:1fr\}'/.test(S.pil) && /'\.pec-kpis\.pec-k2\{grid-template-columns:1fr 1fr\}'/.test(S.pil));
  T('④ … la ligne : tailles de la charte (pas de pixel en dur), le montant ne se coupe pas, la flèche du navigateur masquée', /'\.pec-rg \.nm\{font-size:var\(--pt-base,14px\);/.test(S.pil) && /'\.pec-rg \.vl\{font-size:var\(--pt-base,14px\);font-weight:600;color:var\(--texte\);white-space:nowrap;/.test(S.pil) && /'\.pec-rg>summary::-webkit-details-marker\{display:none\}'/.test(S.pil) && /'\.pec-rg>summary\{list-style:none;cursor:pointer;/.test(S.pil));

  /* ── ⑤ CE QUI SUIT ── */
  const fiche = (k) => { const i = S.uti.indexOf("  '" + k + "': {"); return i < 0 ? '' : S.uti.slice(i, S.uti.indexOf('\n  ] }', i) + 6); };
  T('⑤ les trois fiches disent ce qu’une ligne montre et ce qu’elle ouvre', /<b>Touchez la ligne<\/b> pour sa base de calcul/.test(fiche('pil.eco.postes')) && /<b>Touchez la ligne<\/b> pour les heures du barème/.test(fiche('pil.eco.travaux')) && /Les treize colonnes sont dans <b>Le tableau complet<\/b>/.test(fiche('pil.eco.parcelles')));
  T('⑤ … la fiche des parcelles dit que son « Reste » n’est pas celui de la Synthèse', /pas le « Reste » de la Synthèse, qui est le budget moins l’engagé/.test(fiche('pil.eco.parcelles')) && /t: 'Parcelle par parcelle'/.test(fiche('pil.eco.parcelles')));
  T('⑤ … plus aucune fiche ne parle du graphique parti, ni d’un montant « sous le tableau »', !/Sur le graphique, le trait vertical/.test(S.uti) && !/leur montant est écrit sous le tableau/.test(S.uti) && /l’écart est une pastille au bout de la ligne/.test(fiche('pil.eco.travaux')));
  T('⑤ le guide : des listes, une ligne se touche, trois tuiles repliées, les exports', /<b>Postes &amp; travaux<\/b> et <b>Parcelles<\/b> sont des <b>listes<\/b>/.test(S.guide) && /<b>Touchez une ligne<\/b>/.test(S.guide) && /<b>Le tableau complet<\/b> —/.test(S.guide) && /porte un bouton <b>Journal<\/b>/.test(S.guide) && !/qui attendent une validation sont dites sous le tableau/.test(S.guide));
  T('⑤ l’aide de l’onglet le dit en une phrase', /<b>Postes & travaux<\/b> et <b>Parcelles<\/b> sont des listes : une ligne par poste, par travail, par parcelle ; touchez-la pour son détail\./.test(S.uti));
  const bi = S.wn.indexOf("  { v: '11.12',"), bloc = bi < 0 ? '' : S.wn.slice(bi, S.wn.indexOf('\n  ] },', bi));
  T('⑤ l’annonce de la 11.12, pour l’admin', /^  \{ v: '11\.12', d: '2026-11-16'/m.test(S.wn) && /deux écrans passent en listes/.test(bloc) && /Postes & travaux et Parcelles montraient des tableaux/.test(bloc) && /Touchez une ligne pour voir le reste/.test(bloc) && /Aucun calcul ne change/.test(bloc) && /pour: \['admin'\]/.test(bloc));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1];
  T('⑤ les versions : l’appli à 11.12 au moins, cinq affichages ; le SW dit MOTS-3', !!app && Number(app) >= 11.12 && S.idx.split('v' + app).length - 1 === 4 && S.idx.includes('boot.js?v=' + app) && /^\/\/ v12\.03 \(16\/11\/2026\) — MOTS-3 \(§584\)/m.test(S.sw), 'APP ' + app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const tel = (ref && ref.mesures && ref.mesures['téléphone']) || {};
  const a = tel['Pilotage › Économie › Postes & travaux'], b = tel['Pilotage › Économie › Parcelles'];
  T('⑤ la référence des mots est regravée : au téléphone, Postes & travaux à 80 mots au plus, Parcelles à 100, aucune phrase de 15 mots', !!a && !!b && a.mots <= 80 && b.mots <= 100 && a.p15 === 0 && b.p15 === 0, JSON.stringify([a, b]));
  T('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-mots3.mjs'") > 0 && S.liste.indexOf("mv-harnais-mots3.mjs --contre'") > 0);
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, c, d] of r) { if (c) console.log('  \x1b[32m✓\x1b[0m ' + n); else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + n + (d ? '\n      → ' + d : '')); } }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + r.length + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 50)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const refMut = (f) => (S) => { const r = JSON.parse(S.ref); f(r.mesures['téléphone']); return { ...S, ref: JSON.stringify(r) }; };
  const mutants = [
    ['la jauge déborde au-delà de 100 %', sur('pil', 'var p=Math.max(0,Math.min(100,Number(pct)||0));\n  return \'<details class="pec-rg">', 'var p=Math.max(0,Number(pct)||0);\n  return \'<details class="pec-rg">')],
    ['la ligne perd son détail', sur('pil', "    +'<div class=\"dt\">'+det+'</div></details>';", "    +'</details>';")],
    ['la ligne écrit un repère vide', sur('pil', "    +(rep?('<span class=\"rp\">'+rep+'</span>'):'')+(pst||'')+'</span></summary>'", "    +('<span class=\"rp\">'+rep+'</span>')+(pst||'')+'</span></summary>'")],
    ['la pastille d’écart s’affiche pour quelques centimes', sur('pil', 'if(ec===null || ec===undefined || Math.abs(ec)<0.5) return \'\';', "if(ec===null || ec===undefined) return '';")],
    ['la pastille est orange même quand c’est moins cher', sur('pil', "(ec>0?'background:var(--orange-pale);color:var(--texte)':'background:var(--gris-clair);color:var(--texte-med)')", "('background:var(--orange-pale);color:var(--texte)')")],
    ['la pastille reprend un texte orange sur fond orange pâle (contraste sous 4,5)', sur('pil', "'background:var(--orange-pale);color:var(--texte)':", "'background:var(--orange-pale);color:var(--orange)':")],
    ['un tableau revient dans Postes & travaux', sur('pil', "  H+='<div class=\"pec-g2\">'+cP+'<div>'+cT+", "  H+='<table></table><div class=\"pec-g2\">'+cP+'<div>'+cT+")],
    ['l’anneau des postes revient', (S) => ({ ...S, pil: S.pil + '\nfunction _pecDonutSvg(){ return ""; }\n' })],
    ['la jauge d’un poste se lit sur le budget total', sur('pil', '(p.budget>0?p.fait/p.budget*100:0), p.col,', '(E.budget>0?p.fait/E.budget*100:0), p.col,')],
    ['un poste perd « projeté »', sur('pil', "'sur '+_pilEsc(_ecoEur(p.budget)), (p.proj?PROJ:''), det);", "'sur '+_pilEsc(_ecoEur(p.budget)), '', det);")],
    ['le surcoût de retard perd sa ligne', sur('pil', "  if(E.tot.retE>0) lp+=_pecLigne('Surcoût de retard',", "  if(false) lp+=_pecLigne('Surcoût de retard',")],
    ['un travail affiche le barème du fait au lieu du réalisé payé', sur('pil', '_pilEsc(_ecoEur(t.reE)), t.pct,', '_pilEsc(_ecoEur(t.fE)), t.pct,')],
    ['un travail perd sa pastille d’écart', sur('pil', "_pilEsc(_ecoEur(t.bE)), _pecEcPst(t.ecE), det);", "_pilEsc(_ecoEur(t.bE)), '', det);")],
    ['la tuile du temps n’est plus posée', sur('pil', "+cT+'<div class=\"pil-panels pec-p1\">'+_pecTuileTemps()+'</div></div></div>'", "+cT+'</div></div>'")],
    ['la tuile du temps écrit un h/ha global pour plusieurs travaux', sur('pil', 'if(mes.length===1){ stat=', 'if(mes.length>=1){ stat=')],
    ['la tuile du temps compte un travail sans heures comme mesuré', sur('pil', 'var mes=V.taches.filter(function(t){ return t.h>0 && t.surf>0; });', 'var mes=V.taches.filter(function(t){ return t.surf>0; });')],
    ['la tuile du temps perd sa fiche', sur('pil', "stat, sub, null, body, 'pil.eco.temps');", 'stat, sub, null, body);')],
    ['la liste des parcelles oublie le tri', sur('pil', '  var lst=rows.map(function(r){', '  var lst=(E.rows||[]).map(function(r){')],
    ['une parcelle affiche son budget au lieu du réalisé', sur('pil', "_pilEsc(_ecoEur(r.engRe)), (r.budget>0?r.engRe/r.budget*100:0), _PEC_COL.mo,", "_pilEsc(_ecoEur(r.budget)), (r.budget>0?r.engRe/r.budget*100:0), _PEC_COL.mo,")],
    ['Parcelles reparle d’« engagé »', sur('pil', "    +'<div class=\"pec-cs pec-ci\">réalisé'", "    +'<div class=\"pec-cs pec-ci\">engagé'")],
    ['le « Reste » de Parcelles perd son repère', sur('pil', "+'</div><div class=\"s\">de main-d’œuvre</div></div>'", "+'</div></div>'")],
    ['le « Reste » de Parcelles prend un autre total sans le dire', sur('pil', '<div class="l">Reste</div><div class="v">\'+_pilEsc(_ecoEur(E.tot.moR))', '<div class="l">Reste</div><div class="v">\'+_pilEsc(_ecoEur(E.resteE))')],
    ['le tableau complet disparaît', sur('pil', "    +'<div class=\"pil-panels pec-p1\">'+tT+'</div>'\n", '')],
    ['le tableau complet perd son tri', sur('pil', '" data-pec="ps" data-k="\'+c[0]+\'">', '" data-k="\'+c[0]+\'">')],
    ['le graphique des écarts n’est plus suivi', sur('pil', "  window._mvGraphSuivre('#pec-g-ecart', function(w){ return _pecEcartSvg(E,w); });\n  var tE=", '  var tE=')],
    ['les exports entrent dans la tuile', sur('pil', "+tT+'</div>'\n    +'<div class=\"pec-acts\"><button class=\"pec-btn\" data-pec=\"csv\">", "+tT+'<div class=\"pec-acts\"><button class=\"pec-btn\" data-pec=\"csv\">")],
    ['la bande ne mène plus au Journal', sur('pil', ", '<button class=\"pil-diag-go ghost\" data-diag=\"journal\">Journal ›</button>');", ');')],
    ['la porte ne connaît pas le Journal', sur('pil', "  journal:   ['journal',null,null],", "  journalx:  ['journal',null,null],")],
    ['une tuile arrive ouverte', sur('pil', 'ecotemps:1,ecoecart:1,ecotab:1,', 'ecotemps:1,ecoecart:1,')],
    ['une tuile perd son icône', sur('pil', ",ecotab:'liste'};", '};')],
    ['les deux colonnes disparaissent sur ordinateur', sur('pil', '.pec-g2{grid-template-columns:1fr 1fr}', '.pec-g2{grid-template-columns:1fr}')],
    ['une taille en pixels en dur dans la ligne', sur('pil', "'.pec-rg .nm{font-size:var(--pt-base,14px);", "'.pec-rg .nm{font-size:15px;")],
    ['une fiche reparle du graphique parti', sur('uti', ' Sur la liste, l’écart est une pastille au bout de la ligne', ' Sur le graphique, le trait vertical marque le barème du fait. Sur la liste, l’écart est une pastille au bout de la ligne')],
    ['la fiche des parcelles tait la différence des deux « Reste »', sur('uti', ' — pas le « Reste » de la Synthèse, qui est le budget moins l’engagé', '')],
    ['le guide n’en dit rien', sur('guide', '<b>Postes &amp; travaux</b> et <b>Parcelles</b> sont des <b>listes</b>', '<b>Postes &amp; travaux</b> et <b>Parcelles</b> gardent leurs tableaux')],
    ['l’aide n’en dit rien', sur('uti', ' <b>Postes & travaux</b> et <b>Parcelles</b> sont des listes : une ligne par poste', ' Une ligne par poste')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("  { v: '11.12',"); const j = S.wn.indexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.03 (16/11/2026) — MOTS-3 (§584)', '// v12.03 (16/11/2026) — divers')],
    ['la référence des mots n’a pas été regravée', refMut((t) => { t['Pilotage › Économie › Postes & travaux'].mots = 120; })],
    ['une phrase de 15 mots revient sur Parcelles', refMut((t) => { t['Pilotage › Économie › Parcelles'].p15 = 1; })],
    ['la liste ne joue plus ce fichier', (S) => ({ ...S, liste: S.liste.split("mv-harnais-mots3.mjs'").join("mv-harnais-motsW.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    if (Object.keys(S0).every((k) => S[k] === S0[k])) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    let rouges = 0; try { rouges = suite(S).filter((x) => !x[1]).length; } catch (e) { rouges = 1; }
    if (rouges > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + rouges + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
