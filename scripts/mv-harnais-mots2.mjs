/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-2 (§583) : LES CINQ AUTRES VUES D'ÉCONOMIE SE LISENT COMME LA SYNTHÈSE
   Lancer :          node scripts/mv-harnais-mots2.mjs
   Contre-épreuves : node scripts/mv-harnais-mots2.mjs --contre

   POURQUOI IL EXISTE
   Après MOTS-1 (§582), la Synthèse tenait en une phrase ; Postes & travaux, Parcelles, Revient, Achats et Le détail de
   l'exercice gardaient l'avis gris « Cet écran chiffre la campagne…, pas l'exercice comptable affiché en haut » (24 mots),
   la ligne « … · ha · taux moyen », un sous-titre sous chaque titre de carte et des notes de méthode à demeure.
   Demande de Nico (16/11) : « les 5 d'un coup », sur le modèle de la Synthèse ; les tableaux ne bougent pas.

   CE QU'IL GARDE
   ① L'en-tête commun (_pecEnteteVue) : la ligne de ce que l'écran chiffre, UNE phrase, la pastille « i » à droite.
      La bande orange (_pecBandeAvis) ne s'affiche que s'il y a un geste à faire. Les deux sont EXÉCUTÉS.
   ② Plus rien au-dessus des sous-vues : ni avis de périmètre, ni ligne de contexte.
   ③ Chaque vue ouvre sur son en-tête : la campagne (Postes, Parcelles), le millésime (Revient), l'exercice ou l'année
      vigne (Le détail, EXÉCUTÉ), rien pour Achats (ils couvrent l'historique).
   ④ Ce qui a quitté l'écran est dans une fiche ; aucune clé de « i » posée sans fiche ; pas de style orphelin.
   ⑤ Le guide, l'aide, l'annonce, les versions et la référence des mots suivent.
   ⚠️ Il ne compte pas les mots à l'écran : c'est `npm run test:mots` (les références des cinq écrans baissent dans ce lot).
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
const plat = (s) => String(s).replace(/[\u202f\u00a0]/g, ' ');
const ECRANS = ['Postes & travaux', 'Parcelles', 'Revient', 'Achats', 'Le détail de l’exercice'].map((x) => 'Pilotage › Économie › ' + x);

const BOUCHONS = `
function _pilEsc(x){ return String(x); }
function _ecoEur(v){ return String(Math.round(v)).replace(/\\B(?=(\\d{3})+(?!\\d))/g,' ')+' €'; }
function _ecoH1(v){ return (Math.round(v*10)/10).toString().replace('.',','); }
function _mvIcon(n){ return '[ico:'+n+']'; }
function _mvInfoBtn(c){ return '[i:'+c+']'; }
var _PIL_SCOPE={ cadre:'exo' };
`;
function monde(S) {
  const c = {}; vm.createContext(c);
  const noms = ['function _pecEnteteVue(per, phrase, cle){', 'function _pecBandeAvis(txt, bouton){', 'function _pecBandeAttente(E){', 'function _pexBarreEx(E){'];
  const uneLigne = ['function _pecDfrIso(iso){', 'function _pecIsoToMs(iso){', 'function _pecDfrMs(ms){', 'function _pecJourCourt(ms){', 'function _pecMoisCourt(m){'];
  vm.runInContext(BOUCHONS + noms.map((n) => fnDe(S.pil, n)).join('\n') + '\n' + uneLigne.map((n) => ligne(S.pil, n)).join('')
    + '\nthis.H=_pecEnteteVue; this.A=_pecBandeAvis; this.T=_pecBandeAttente; this.X=_pexBarreEx; this.D=_pecDfrIso; this.cadre=function(v){ _PIL_SCOPE.cadre=v; };', c);
  return c;
}

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const M = monde(S);
  const P = sansCom(S.pil);

  /* ── ① L'EN-TÊTE COMMUN ET LA BANDE, EXÉCUTÉS ── */
  const h0 = M.H('<div class="pec-per">CAMPAGNE</div>', '<b>1 940 €</b> engagés.');
  T('① l’en-tête : la ligne de ce que l’écran chiffre, puis UNE phrase, dans une carte', /^<div class="pec-card"><div class="pec-verdict pec-ph"><div><div class="pec-per">CAMPAGNE<\/div><div class="t"><b>1 940 €<\/b> engagés\.<\/div><\/div><\/div><\/div>$/.test(h0), h0);
  const h1 = M.H('', 'PHRASE.', 'pil.eco.achats');
  T('① la pastille « i » se pose à droite de la carte, hors de la phrase (au téléphone elle tombait seule sur une ligne)', /<div class="t">PHRASE\.<\/div><\/div><span class="pec-phi">\[i:pil\.eco\.achats\]<\/span><\/div><\/div>$/.test(h1) && !/<div class="t">[^<]*\[i:/.test(h1), h1);
  T('① sans clé, pas de pastille', !/pec-phi|\[i:/.test(h0));
  const a0 = M.A('TEXTE', '<button>GESTE</button>');
  T('① la bande : orange, annoncée (role=status), son icône, son texte, son bouton à droite', /^<div class="pec-al or" role="status"><span class="ic">\[ico:alerte\]<\/span><span class="tx">TEXTE<\/span><button>GESTE<\/button><\/div>$/.test(a0), a0);
  const t1 = plat(M.T({ reOk: true, reAttE: 959, reAttH: 74 }));
  T('① des heures payées sans validation : « 74 h payées sans validation · 959 € »', /<b>74 h payées sans validation<\/b> <span style="white-space:nowrap">· 959 €<\/span>/.test(t1), t1);
  T('① … rien à signaler : pas de bande (moins d’un euro, ou planning pas ouvert)', M.T({ reOk: true, reAttE: 0.4, reAttH: 0.1 }) === '' && M.T({ reOk: false, reAttE: 959, reAttH: 74 }) === '' && M.T(null) === '');
  T('① les dates courtes du millésime : « 24 oct. 2025 », un tiret si la date manque', M.D('2025-10-24') === '24 oct. 2025' && M.D('') === '—' && M.D(null) === '—');

  /* ── ② PLUS RIEN AU-DESSUS DES SOUS-VUES ── */
  const eco = sansCom(fnDe(S.pil, 'function _pilTabEco(d){'));
  T('② plus d’avis de périmètre : la sous-barre, puis la vue', /return '<div class="pec-wrap">'\+_pecSubNav\(E\)\+body\+'<\/div>';/.test(eco) && !/_pilAvertEco/.test(P) && !/pas l\\u2019exercice comptable affich|pas l’exercice comptable affich/.test(P));
  T('② plus de ligne « … · ha · taux moyen » sous la sous-barre', /return '<div class="pec-subnav"><div class="pec-sub">'\+b\+'<\/div><\/div>';/.test(sansCom(fnDe(S.pil, 'function _pecSubNav(E){'))));
  T('② l’avis de Conformité, lui, n’a pas bougé (ce lot ne touche que l’Économie)', /_pilCadreAvert\(_pilAvertCfm\(\)\)/.test(P) && /function _pilCadreAvert\(txt\)/.test(P));

  /* ── ③ CHAQUE VUE OUVRE SUR SON EN-TÊTE ── */
  const pos = sansCom(fnDe(S.pil, 'function _pecViewPostes(E){'));
  T('③ Postes & travaux : la campagne, « X € engagés sur Y € », la bande des heures en attente', /var H=_pecEnteteVue\(_pecPerLigne\(''\), '<b>'\+_pilEsc\(_ecoEur\(E\.engage\)\)\+'<\/b> engagés sur <b>'\+_pilEsc\(_ecoEur\(E\.budget\)\)\+'<\/b>\.'\)\+_pecBandeAttente\(E\)/.test(pos));
  T('③ … la porte vers le détail de l’exercice est là (ses tableaux sont devenus des listes : MOTS-3, §584)', /data-pec="sub" data-v="exe"/.test(pos) && /_pecDetailLib\(\)/.test(pos));
  T('③ … plus de note de cadre sous ses cartes, sauf la ligne du temps quand elle a quelque chose à dire', (pos.match(/pec-vcadre/g) || []).length === 1 && /\(tNote\?\('<div class="pec-cb"><div class="pec-vcadre"><span>'\+tNote\+'<\/span><\/div><\/div>'\):''\)/.test(pos) && !/ne peuvent pas y \\u00eatre|ne porte aucune date/.test(pos));
  const par = sansCom(fnDe(S.pil, 'function _pecViewParcelles(E){'));
  T('③ Parcelles : la campagne, « X € réalisés sur N parcelles » — le total de la colonne Réalisé, pas un second « engagé »', /var H=_pecEnteteVue\(_pecPerLigne\(''\), '<b>'\+_pilEsc\(_ecoEur\(E\.engRe\)\)\+'<\/b> réalisés sur <b>'\+E\.rows\.length\+' parcelle'\+\(E\.rows\.length>1\?'s':''\)\+'<\/b>\.'\)\+_pecBandeAttente\(E\)/.test(par) && !/engagés sur/.test(par));
  T('③ … son tableau garde ses treize colonnes et ses deux exports', /<table class="pec-tbl" style="min-width:1040px">/.test(par) && /colspan="13"/.test(par) && /data-pec="csv">[^\n]*Tableau \(CSV\)<\/button>/.test(par) && /data-pec="copy">[^\n]*Copier<\/button>/.test(par));
  const rev = sansCom(fnDe(S.pil, 'function _pecViewRevient(){'));
  T('③ Revient : tout récolté, la ligne ne le redit pas (la pastille « constaté » le dit) ; sinon « N % récolté »', /\+\(R\.etat==='cons'\?'':\(' · '\+pctR\+' % récolté'\)\)/.test(rev));
  T('③ Revient : le millésime et ses dates courtes, « X € la bouteille, à la vigne », sa fiche', /H\+=_pecEnteteVue\('<div class="pec-per"><span><b>Millésime '\+R\.mil\+'<\/b> · '\+cadre\+'<\/span><\/div>', phrase, 'pil\.eco\.revient'\)/.test(rev) && /var cadre=_pilEsc\(_pecDfrIso\(cy\.d0\)\)\+' → '\+_pilEsc\(_pecDfrIso\(cy\.d1\)\)/.test(rev) && /<\/b> la bouteille, à la vigne'/.test(rev));
  const kp = rev.slice(rev.indexOf('<div class="pec-kpis">'), rev.indexOf('var notes=[];'));
  T('③ … sans rendement, la phrase le dit au lieu d’afficher un tiret', /'Pas encore de coût à la bouteille : il manque un rendement\.'/.test(rev));
  T('③ … trois chiffres (rendement, bouteilles, coût du cycle) : le prix de la bouteille n’est écrit qu’une fois', /<div class="l">Coût du cycle/.test(kp) && /<div class="l">Rendement/.test(kp) && /<div class="l">Bouteilles/.test(kp) && (kp.match(/<div class="pec-k">/g) || []).length === 3 && !/eurCol/.test(kp));
  T('③ … ce qui borne le chiffre s’ouvre d’un toucher (le rendu des remarques de la Synthèse)', /if\(notes\.length\) H\+='<div class="pec-cb">'\+_pecFiabRemq\(notes,'pil\.eco\.revremq'\)\+'<\/div>';/.test(rev) && !/Pas compt\\u00e9 ici|Pas compté ici/.test(rev));
  const ach = sansCom(fnDe(S.pil, 'function _pachView(){'));
  T('③ Achats : « X € d’achats chiffrés », ou « Au moins X € d’achats » quand un prix manque (en toutes lettres : « ≥ » n’est pas dans la police)', /h\+=_pecEnteteVue\('', \(sans\.length\?'Au moins ':''\)\+'<b>'\+_pilEsc\(_ecoEur\(tot\)\)\+'<\/b> d’achats'\+\(sans\.length\?'':' chiffrés'\)\+'\.', 'pil\.eco\.achats'\)/.test(ach) && !/≥|\\u2265/.test(ach));
  T('③ … des achats sans prix : la bande, et le bouton qui les filtre', /\(sans\.length\?_pecBandeAvis\('<b>'\+sans\.length\+' achat'\+\(sans\.length>1\?'s':''\)\+' sans prix<\/b> · le total est un plancher', '<button class="pil-diag-go ghost" data-pec="pachf" data-v="sans">Chiffrer ›<\/button>'\):''\)/.test(ach));
  T('③ … la carte « Ce que cet écran ne fait pas » et les paragraphes de conception ont quitté l’écran', !/ne fait pas/.test(ach) && !/seul endroit o/.test(ach));
  const F26 = { court: '2026–2027', lbl: '1ᵉʳ août 2026 → 31 juillet 2027', d0: '2026-08-01', d1: '2027-07-31' };
  M.cadre('exo'); const x1 = plat(M.X({ ex: F26, enCours: true, enCoursC: true, total: 58293, totalClot: 158803 }));
  T('③ Le détail, en cours : « Exercice 2026–2027 · 1 août → 31 juil. », puis « 58 293 € sortis : 37 % de l’exercice. » (la part dit qu’il est en cours)', /<b>Exercice 2026–2027<\/b> · 1 août → 31 juil\.<\/span>/.test(x1) && !/en cours/.test(x1) && /<div class="t"><b>58 293 €<\/b> sortis : <b>37 %<\/b> de l’exercice\.<\/div>/.test(x1), x1);
  const x2 = plat(M.X({ ex: F26, enCours: false, enCoursC: false, total: 150000, totalClot: 150000 }));
  T('③ … clos : « 150 000 € sortis. », sans part ni « en cours »', /<div class="t"><b>150 000 €<\/b> sortis\.<\/div>/.test(x2) && !/en cours|%/.test(x2), x2);
  M.cadre('vig'); const x3 = plat(M.X({ ex: F26, enCours: true, enCoursC: true, total: 10, totalClot: 40 }));
  T('③ … quand la barre regarde l’année vigne : « Année vigne », « 25 % de l’année »', /<b>Année vigne 2026–2027<\/b>/.test(x3) && /<b>25 %<\/b> de l’année\./.test(x3), x3);
  T('③ … sans dates lisibles, la ligne garde le libellé de l’exercice ; plus de mode d’emploi à demeure', /<\/b> · LIBELLÉ/.test(M.X({ ex: { court: 'X', lbl: 'LIBELLÉ' }, total: 1, totalClot: 1 })) && !/Vous regardez|se choisit/.test(x1));
  const ent = sansCom(fnDe(S.pil, 'function _pexEntete(E){'));
  T('③ … ses quatre chiffres disent Sorti · Prévu · À la clôture · Contre l’an dernier', /<div class="l">Sorti<\/div>/.test(ent) && /<div class="l">Prévu<\/div>/.test(ent) && /<div class="l">À la clôture<\/div>/.test(ent) && /<div class="l">Contre '/.test(ent) && !/Engag\\u00e9 \\u00e0 ce jour|Pr\\u00e9vu jusqu/.test(ent));
  T('③ … son tableau des postes dit « Sorti », comme le chiffre du dessus (un seul mot pour les euros de l’exercice)', /<th class="r">'\+\(PV\?'Sorti':'Montant'\)\+'<\/th>'/.test(ent));
  T('③ … « Ce total n’est pas un compte de résultat » reste à l’écran, en une ligne, avec sa fiche', /Ce total n\\u2019est pas un compte de r\\u00e9sultat/.test(ent) && /_mvInfoBtn\('pil\.exo\.garde'\)/.test(ent) && !/<div class="d">/.test(ent));
  T('③ … les trois pavés « Ce qui n’entre pas dans ce total » ont quitté l’écran', !/_pexHorsPerim/.test(P) && !/Ce qui n\\u2019entre pas dans ce total/.test(P) && !/Trois postes, et rien d/.test(P));

  /* ── ④ CE QUI A QUITTÉ L'ÉCRAN EST DANS UNE FICHE ── */
  const fiche = (k) => { const i = S.uti.indexOf("  '" + k + "': {"); return i < 0 ? '' : S.uti.slice(i, S.uti.indexOf('\n  ] }', i) + 6); };
  T('④ fiche pil.eco.achats : le seul endroit où l’on met les prix, et ce que l’écran ne fait pas', /t: 'Achats : le seul endroit où l’on met les prix'/.test(fiche('pil.eco.achats')) && (fiche('pil.eco.achats').match(/^    '/gm) || []).length >= 4);
  T('④ fiche pil.eco.revremq : déclarée, avec son texte d’attente (elle est remplie au rendu)', /t: 'Ce qui borne ce chiffre'/.test(fiche('pil.eco.revremq')) && /Aucune remarque/.test(fiche('pil.eco.revremq')));
  T('④ fiche pil.exo.garde : ce que le total chiffre, la location de fûts, où se règle le fût acheté', /charges d’exploitation/.test(fiche('pil.exo.garde')) && /location de fûts<\/b> entre, au prorata des jours de contrat/.test(fiche('pil.exo.garde')) && /roue crantée du Pilotage/.test(fiche('pil.exo.garde')));
  T('④ fiches pil.exo.postes et pil.exo.salaires : la colonne « prévu » et le taux chargé', /pas de colonne prévu/.test(fiche('pil.exo.postes')) && /taux horaire chargé/.test(fiche('pil.exo.salaires')));
  const vues = ['function _pecViewPostes(E){', 'function _pecViewParcelles(E){', 'function _pecViewRevient(){', 'function _pachView(){', 'function _pexEntete(E){'].map((n) => sansCom(fnDe(S.pil, n))).join('\n');
  const cles = [...new Set([...vues.matchAll(/_mvInfoBtn\('([^']+)'\)|_pecFiabRemq\([^,]+,'([^']+)'\)|_pecEnteteVue\([^\n]*, '(pil\.[a-z.]+)'\)/g)].map((m) => m[1] || m[2] || m[3]))];
  const orph = cles.filter((k) => !fiche(k));
  T('④ aucune pastille « i » de ces cinq vues sans fiche (' + cles.length + ' clés)', cles.length >= 10 && orph.length === 0, orph.join(', '));
  T('④ le style : la bande orange, la pastille à droite, le sous-titre réduit à sa pastille ; plus de .pex-bar orpheline', /'\.pec-al\.or\{border-color:/.test(S.pil) && /\.pec-phi\{flex:none\}/.test(S.pil) && /'\.pec-cs\.pec-ci\{flex:none;min-width:0\}'/.test(S.pil) && !/pex-bar/.test(P));
  T('④ un sous-titre réduit à sa pastille porte la classe pec-ci ; un sous-titre qui garde du texte, non', (P.match(/'<div class="pec-cs pec-ci">'/g) || []).length >= 7 && !/'<div class="pec-cs pec-ci">'\+\(admin/.test(P));

  /* ── ⑤ CE QUI SUIT ── */
  T('⑤ le guide : les cinq vues, leur petite ligne, leur phrase, la bande orange (les tableaux de trois d’entre elles inchangés)', /Les cinq autres vues d'Économie, sur le même modèle/.test(S.guide) && /« 982 € réalisés sur 8 parcelles »/.test(S.guide) && /<b>bande orange<\/b>/.test(S.guide) && /Les tableaux de Revient,\s+d'Achats et du Détail de l'exercice ne changent pas/.test(S.guide) && !/≥/.test(S.guide));
  T('⑤ l’aide de l’onglet le dit en une phrase', /Les cinq autres vues s’ouvrent de la même façon/.test(S.uti));
  const bi = S.wn.indexOf("  { v: '11.11',"), bloc = bi < 0 ? '' : S.wn.slice(bi, S.wn.indexOf('\n  ] },', bi));
  T('⑤ l’annonce de la 11.11, pour l’admin', /^  \{ v: '11\.11', d: '2026-11-16'/m.test(S.wn) && /les cinq autres vues, comme la Synthèse/.test(bloc) && /Les tableaux ne changent pas, aucun calcul ne change/.test(bloc) && /pour: \['admin'\]/.test(bloc));
  const app = (S.uti.match(/export const APP_VERSION = '([\d.]+)'/) || [])[1];
  T('⑤ les versions : l’appli à 11.11 au moins, cinq affichages ; le SW dit MOTS-2', !!app && Number(app) >= 11.11 && S.idx.split('v' + app).length - 1 === 4 && S.idx.includes('boot.js?v=' + app) && /^\/\/ v12\.02 \(16\/11\/2026\) — MOTS-2 \(§583\)/m.test(S.sw), 'APP ' + app);
  let ref = null; try { ref = JSON.parse(S.ref); } catch (e) { ref = null; }
  const tel = (ref && ref.mesures && ref.mesures['téléphone']) || {};
  const mauvais = ECRANS.filter((k) => !(tel[k] && tel[k].mots <= 130 && tel[k].p15 === 0 && tel[k].avant !== null && tel[k].avant <= 15) && !/exercice$/.test(k));
  T('⑤ la référence des mots est regravée : au téléphone, quatre écrans à 130 mots au plus, aucune phrase de 15 mots, 15 mots au plus avant le premier grand chiffre', mauvais.length === 0, mauvais.map((k) => k + ' ' + JSON.stringify(tel[k])).join(' · '));
  const ex = tel[ECRANS[4]];
  T('⑤ … et Le détail de l’exercice n’a plus de phrase de 15 mots avant son premier chiffre', !!ex && ex.avant !== null && ex.avant <= 15, JSON.stringify(ex));
  T('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-mots2.mjs'") > 0 && S.liste.indexOf("mv-harnais-mots2.mjs --contre'") > 0);
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
    ['la pastille « i » retourne au bout de la phrase', sur('pil', "    +'<div class=\"t\">'+phrase+'</div></div>'\n    +((cle && typeof _mvInfoBtn==='function')?('<span class=\"pec-phi\">'+_mvInfoBtn(cle)+'</span>'):'')", "    +'<div class=\"t\">'+phrase+((cle && typeof _mvInfoBtn==='function')?(' '+_mvInfoBtn(cle)):'')+'</div></div>'")],
    ['l’en-tête perd sa ligne de cadre', sur('pil', "<div class=\"pec-verdict pec-ph\"><div>'+(per||'')\n", "<div class=\"pec-verdict pec-ph\"><div>'\n")],
    ['la bande n’est plus annoncée', sur('pil', '<div class="pec-al or" role="status">', '<div class="pec-al or">')],
    ['la bande des heures en attente s’affiche pour quelques centimes', sur('pil', 'if(!(E && E.reOk && E.reAttE>=1)) return \'\';', "if(!(E && E.reOk && E.reAttE>0)) return '';")],
    ['la bande des heures en attente s’affiche planning fermé', sur('pil', 'if(!(E && E.reOk && E.reAttE>=1)) return \'\';', "if(!(E && E.reAttE>=1)) return '';")],
    ['l’avis de périmètre revient au-dessus des sous-vues', sur('pil', "return '<div class=\"pec-wrap\">'+_pecSubNav(E)+body+'</div>';", "return '<div class=\"pec-wrap\">'+_pecSubNav(E)+_pilCadreAvert(_pilAvertEco())+body+'</div>';")],
    ['la ligne de contexte revient sous la sous-barre', sur('pil', "  return '<div class=\"pec-subnav\"><div class=\"pec-sub\">'+b+'</div></div>';", "  var ctx='7,02 ha'; return '<div class=\"pec-subnav\"><div class=\"pec-sub\">'+b+'</div><div class=\"pec-ctx\">'+ctx+'</div></div>';")],
    ['Postes & travaux perd la bande des heures en attente', sur('pil', "</b> engagés sur <b>'+_pilEsc(_ecoEur(E.budget))+'</b>.')+_pecBandeAttente(E)", "</b> engagés sur <b>'+_pilEsc(_ecoEur(E.budget))+'</b>.')")],
    ['Parcelles reparle d’« engagé » avec un autre total que Postes', sur('pil', "'<b>'+_pilEsc(_ecoEur(E.engRe))+'</b> réalisés sur <b>'", "'<b>'+_pilEsc(_ecoEur(E.engRe))+'</b> engagés sur <b>'")],
    ['Revient perd sa fiche', sur('pil', "+cadre+'</span></div>', phrase, 'pil.eco.revient')", "+cadre+'</span></div>', phrase)")],
    ['Revient réécrit le prix de la bouteille dans ses chiffres', sur('pil', "    +'<div class=\"pec-k\"><div class=\"l\">Coût du cycle'", "    +'<div class=\"pec-k\"><div class=\"l\">La bouteille</div><div class=\"v\">'+_pecRevE2(T.eurCol)+'</div></div>'\n    +'<div class=\"pec-k\"><div class=\"l\">Coût du cycle'")],
    ['Revient remet ses remarques en clair', sur('pil', "+_pecFiabRemq(notes,'pil.eco.revremq')+'</div>';", "+notes.join('<br>')+'</div>';")],
    ['Achats reprend le signe absent de la police', sur('pil', "(sans.length?'Au moins ':'')+'<b>'+_pilEsc(_ecoEur(tot))", "(sans.length?'≥ ':'')+'<b>'+_pilEsc(_ecoEur(tot))")],
    ['Achats dit « au moins » même quand tout est chiffré', sur('pil', "(sans.length?'Au moins ':'')+'<b>'", "'Au moins '+'<b>'")],
    ['la bande des achats perd son bouton', sur('pil', "' sans prix</b> · le total est un plancher', '<button class=\"pil-diag-go ghost\" data-pec=\"pachf\" data-v=\"sans\">Chiffrer ›</button>')", "' sans prix</b> · le total est un plancher')")],
    ['Revient redit « tout est récolté » à côté de la pastille', sur('pil', "+(R.etat==='cons'?'':(' · '+pctR+' % récolté'))", "+' · '+(R.etat==='cons'?'tout est récolté':(pctR+' % récolté'))")],
    ['le détail redit « en cours » à côté de la part', sur('pil', "'</b> · '+_pilEsc(dates)+'</span></div>',", "'</b> · '+_pilEsc(dates)+(E.enCours?' · en cours':'')+'</span></div>',")],
    ['le détail reprend ses dates longues', sur('pil', "(_pecJourCourt(d0)+' → '+_pecJourCourt(d1))", "String(E.ex.lbl||'')")],
    ['le détail dit une part même sur un exercice clos', sur('pil', "'</b> sortis'+(E.enCoursC?(' : <b>'", "'</b> sortis'+(true?(' : <b>'")],
    ['le détail ignore l’année vigne', sur('pil', "+'</b> sortis'+(E.enCoursC?(' : <b>'+pc+' %</b> de '+(vig?'l’année':'l’exercice'))", "+'</b> sortis'+(E.enCoursC?(' : <b>'+pc+' %</b> de '+('l’exercice'))")],
    ['le mode d’emploi revient sous l’exercice', sur('pil', "'</b> · '+_pilEsc(dates)+'</span></div>',", "'</b> · '+_pilEsc(dates)+' · se choisit dans la barre « Vous regardez »</span></div>',")],
    ['l’en-tête de l’exercice reprend « Engagé à ce jour »', sur('pil', '<div class="pec-k"><div class="l">Sorti</div>', '<div class="pec-k"><div class="l">Engag\\u00e9 \\u00e0 ce jour</div>')],
    ['le tableau des postes de l’exercice redit « Engagé » sous un chiffre « Sorti »', sur('pil', "(PV?'Sorti':'Montant')", "(PV?'Engag\\u00e9':'Montant')")],
    ['la garde comptable reprend son paragraphe', sur('pil', "+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.garde')):'')+'</div>'\n    +'</div></div></div>';", "+(typeof _mvInfoBtn==='function'?(' '+_mvInfoBtn('pil.exo.garde')):'')+'</div>'\n    +'<div class=\"d\">Il chiffre vos charges.</div></div></div></div>';")],
    ['la carte « Ce qui n’entre pas dans ce total » revient', (S) => ({ ...S, pil: S.pil + '\nfunction _pexHorsPerim(){ return ""; }\n' })],
    ['la fiche des achats disparaît', sur('uti', "  'pil.eco.achats': {", "  'pil.eco.achatz': {")],
    ['la fiche des remarques du revient perd son texte d’attente', sur('uti', "'pil.eco.revremq': { t: 'Ce qui borne ce chiffre', p: [\n    'Aucune remarque", "'pil.eco.revremq': { t: 'Ce qui borne ce chiffre', p: [\n    'Rien")],
    ['la fiche de la garde perd la location de fûts', sur('uti', 'La <b>location de fûts</b> entre, au prorata des jours de contrat', 'La location entre')],
    ['la bande orange perd son style', sur('pil', "'.pec-al.or{border-color:", "'.pec-al.orx{border-color:")],
    ['un style orphelin revient', (S) => ({ ...S, pil: S.pil.replace("  +'.pec-cs.pec-ci{flex:none;min-width:0}'", "  +'.pex-bar{display:flex}'\n  +'.pec-cs.pec-ci{flex:none;min-width:0}'") })],
    ['le guide n’en dit rien', sur('guide', "Les cinq autres vues d'Économie, sur le même modèle", 'Les autres vues')],
    ['l’aide n’en dit rien', sur('uti', ' Les cinq autres vues s’ouvrent de la même façon', ' Les autres vues')],
    ['l’annonce est montrée à tout le monde', (S) => { const i = S.wn.indexOf("  { v: '11.11',"); const j = S.wn.indexOf("pour: ['admin']", i); return { ...S, wn: S.wn.slice(0, j) + "pour: ['tous']" + S.wn.slice(j + 15) }; }],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.02 (16/11/2026) — MOTS-2 (§583)', '// v12.02 (16/11/2026) — divers')],
    ['la référence des mots n’a pas été regravée', refMut((t) => { t[ECRANS[3]].mots = 271; })],
    ['une phrase de 15 mots revient sur Postes & travaux', refMut((t) => { t[ECRANS[0]].p15 = 1; })],
    ['Le détail de l’exercice repousse son premier chiffre', refMut((t) => { t[ECRANS[4]].avant = 40; })],
    ['la liste ne joue plus ce fichier', (S) => ({ ...S, liste: S.liste.split("mv-harnais-mots2.mjs'").join("mv-harnais-motsV.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible : ' + nom + ' (' + e.message + ')'); continue; }
    if (S.pil === S0.pil && S.uti === S0.uti && S.wn === S0.wn && S.sw === S0.sw && S.guide === S0.guide && S.liste === S0.liste && S.ref === S0.ref) { console.log('  \x1b[31m✗\x1b[0m mutant sans effet : ' + nom); continue; }
    let rouges = 0; try { rouges = suite(S).filter((x) => !x[1]).length; } catch (e) { rouges = 1; }
    if (rouges > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + rouges + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
