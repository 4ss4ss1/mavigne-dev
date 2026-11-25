/* ───────────────────────────────────────────────────────
   HARNAIS — MOTS-16 (§611) : LA RÉSERVE ALLÉGÉE — LE PARC EN TÊTE, UNE PHRASE POUR LES INTRANTS
   Lancer :          node scripts/mv-harnais-mots16.mjs
   Contre-épreuves : node scripts/mv-harnais-mots16.mjs --contre

   POURQUOI IL EXISTE
   Mesuré (démo, 25/11) : Fûts redisait ses chiffres — 55 deux fois (la pyramide « 55 barriques », le parc), 12 libres trois
   fois (le parc, la tuile « Fûts libres », la puce « Tous »), 2 fournisseurs deux fois, 2 millésimes deux fois — et son
   premier grand chiffre arrivait après 75 mots (le pire écran de l'appli). Intrants écrivait à l'utilisateur « une fois les
   doses structurées (lot suivant) » : un mot de développeur, et faux depuis IFT-1 (§571), l'assistant chiffrant la dose de
   chaque traitement. Trois notes de méthode à demeure (l'âge des fûts, le consommé ×2, le contrôle bio).
   Maquette validée (« go », 25/11) avec ses quatre recommandations : docs/maquettes/maquette-reserve-v1.html.

   CE QU'IL GARDE
   ① Fûts, JOUÉ (la vraie _rsvFutsHtml) : le parc, puis les boutons, puis la pyramide et la part des anges, puis les puces et
      la liste ; plus de tuiles ;
   ② la pyramide et la part des anges, JOUÉES : plus de « 55 barriques » ni de note sous la pyramide, un « i » à chacune ;
   ③ Intrants, JOUÉ : la phrase (négatifs en rouge, cohérents en vert, consommés à activer), la ligne courte d'un consommé à
      activer, plus de « lot suivant », l'alerte d'un stock négatif sans « le bilan ne peut pas fermer » ;
   ④ le Bilan matière, JOUÉ : le « i » au titre, plus de note à l'écran ; le PDF garde la mention ;
   ⑤ les trois « i » neufs, l'aide, le guide, l'annonce, les versions, la maquette, la liste.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const S0 = { rsv: lire('src/reserve.js'), cave: lire('src/cave.js'), uti: lire('src/utils.js'), wn: lire('src/whats-new.js'), sw: lire('public/sw.js'),
  idx: lire('index.html'), guide: lire('guide/09-reserve.html'), liste: lire('scripts/mv-harnais-liste.mjs'), lm: lire('docs/maquettes/LISEZMOI.md'),
  maq: lire('docs/maquettes/maquette-reserve-v1.html') };
function fonction(src, nom) {
  const formes = ['function ' + nom + '(', 'window.' + nom + ' = function(', 'window.' + nom + '=function('];
  let i = -1; for (const f of formes) { i = src.indexOf(f); if (i >= 0) break; }
  if (i < 0) throw new Error('introuvable : ' + nom);
  let k = src.indexOf('{', i), p = 0, q = null;
  for (; k < src.length; k++) {
    const c = src[k];
    if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; continue; }
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
    if (c === '/' && src[k + 1] === '*') { k = src.indexOf('*/', k) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') p++; else if (c === '}') { p--; if (p === 0) return src.slice(i, k + 1).replace(/^window\.(\w+)\s*=\s*function\(/, 'function $1('); }
  }
  throw new Error('fin introuvable : ' + nom);
}
function decl(src, nom) { const m = new RegExp('var ' + nom.replace('$', '\\$') + '\\s*=[\\s\\S]*?;[^\\n]*\\n').exec(src); if (!m) throw new Error('déclaration introuvable : ' + nom); return m[0]; }
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const texte = (h) => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Le monde de la Réserve : les vraies fonctions, les données données, les autres modules en bouchons.
const RSV = ['_fmt', '_frDate', '_invOuv', '_achatsQ', '_consoCuvier', '_consoCuvierEstime', '_conso', '_treatSurface', '_stock', '_nbUnites', '_rsvU', '_rsvPrixU',
  '_rsvPrixUSansPrix', '_eur2', '_consoSrcLbl', '_rsvNegEstime', '_rsvIntrantsPhrase', '_rsvIntrantsHtml', '_rsvAuditHtml',
  '_futTotal', '_futYears', '_futYearCount', '_futsFiltered', '_futsBySupplier', '_futIsOpen', '_futAllOpen', '_rsvFutsHtml'];
function monde(S, INTRANTS, o) {
  o = o || {};
  const ctx = { INTRANTS, isAdmin: () => true, _today: () => '2026-10-27', _mvToday: () => '2026-10-27', _escHtml: esc, _escAttr: esc, _mvIcon: () => '', _mvIconInline: () => '',
    _rsvInjectCss() {}, _rsvParcHtml: () => '<div class="mvr-parc">PARC</div>', _rsvFutYear: '__all__', _rsvFutOpen: {}, _rsvCapTag: () => '', _rsvFutQteHtml: () => '', _rsvFutEcoHtml: () => '', console: { log() {} } };
  ctx.window = { TRAITEMENTS: o.T || [], PARCELLES: [], CAVE_ELEVAGE: o.CE || { operations: [] }, CAVE_VENDANGE: null, DOMAINE_NOM: 'Domaine test',
    _rsvParcHtml: () => '<div class="mvr-parc">PARC</div>', _caveParcHtml: () => '<div class="pcav-card">PYRAMIDE</div>',
    _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '"></button>' };
  vm.createContext(ctx);
  vm.runInContext(['_RSV_UNITE_PIECE', '_CATLBL', '_CATCLS'].map((d) => decl(S.rsv, d)).join('') + RSV.map((f) => fonction(S.rsv, f)).join('\n')
    + '\nthis.F={' + RSV.map((f) => f + ':' + f).join(',') + '};', ctx);
  return ctx.F;
}
const PROD = () => ({
  produits: [
    { id: 'p1', nom: 'Bouillie bordelaise RSR', cat: 'phyto', unite: 'kg', conso_src: 'registre' },
    { id: 'p2', nom: 'Soufre mouillable', cat: 'phyto', unite: 'kg', conso_src: 'registre' },
    { id: 'p3', nom: 'Métabisulfite de potassium', cat: 'oeno', unite: 'kg', contenance: 1, contLbl: 'sac', conso_src: 'manual', conso_manuel: 0 }],
  achats: [{ prodId: 'p1', q: 116 }, { prodId: 'p2', q: 150 }, { prodId: 'p3', q: 13.5 }], inventaires: [], futs: [] });

function suite(S) {
  const out = []; const T = (n, c, d) => out.push([n, !!c, d || '']);
  const essai = (n, f) => { try { const r = f(); T(n, Array.isArray(r) ? r[0] : r, Array.isArray(r) ? r[1] : ''); } catch (e) { T(n + ' (' + e.message + ')', false); } };

  // ①
  essai('① Fûts : le parc, les boutons, la pyramide, puis les puces et la liste ; plus de tuiles', () => {
    const I = PROD(); I.futs = [{ id: 'f1', four: 'Tonnellerie A', ref: 'Chauffe moyenne', annee: '2026', qte: 6 }, { id: 'f2', four: 'Tonnellerie B', ref: 'Chauffe longue', annee: '2025', qte: 6 }];
    const h = monde(S, I)._rsvFutsHtml(), i = [h.indexOf('PARC'), h.indexOf('+ Ajouter des fûts'), h.indexOf('PYRAMIDE'), h.indexOf('mvr-fchip'), h.indexOf('Tonnellerie A')];
    return [i.every((x, k) => x >= 0 && (k === 0 || x > i[k - 1])) && !h.includes('mvr-kpis') && !h.includes('Fournisseurs</div>'), JSON.stringify(i)];
  });
  essai('① Fûts vide : le parc, les boutons, la pyramide, puis « Aucun fût enregistré »', () => {
    const h = monde(S, PROD())._rsvFutsHtml(), i = [h.indexOf('PARC'), h.indexOf('+ Ajouter des fûts'), h.indexOf('PYRAMIDE'), h.indexOf('Aucun fût enregistré')];
    return [i.every((x, k) => x >= 0 && (k === 0 || x > i[k - 1])), JSON.stringify(i)];
  });
  T('① _rsvRenderBody ne pose plus la pyramide avant le parc', S.rsv.includes("  if(_rsvTab==='futs') b.innerHTML=_rsvFutsHtml()+(window._rsvMouvHtml?_rsvMouvHtml():'');"));

  // ②
  essai('② la pyramide : ni « 55 barriques » ni note dessous, un « i » (rsv.pyramide) ; la part des anges vide : une ligne, « Saisir », son « i »', () => {
    const ctx = { _escHtml: esc, _mvIcon: () => '', Math, window: { _mvInfoBtn: (k) => '<button class="mv-i" data-mvi="' + k + '"></button>' } };
    vm.createContext(ctx); vm.runInContext(['_pcavCard', '_pcavPyramide', '_pcavAngesCard'].map((n) => fonction(S.cave, n)).join('\n'), ctx);
    const p = ctx._pcavPyramide({ parc: { parc: 55, vie: 5, lignes: [{ annee: 2025, vins: 1, total: 23, enVin: 17, libres: 6 }] } }), a = ctx._pcavAngesCard({ anges: null });
    return [!/barriques/.test(p) && !p.includes('pcav-mini') && p.includes('data-mvi="rsv.pyramide"') && !/année civile/.test(p)
      && texte(a).includes('Aucun ouillage sur douze mois.') && !/au premier/.test(a) && a.includes('onclick="openOvCaveOp()">Saisir') && a.includes('data-mvi="cave.anges"'), p.slice(0, 300) + ' | ' + a.slice(0, 300)];
  });

  // ③
  essai('③ Intrants : « 1 stock cohérent · 2 consommés à activer » et son « i » ; la ligne courte ; plus de « lot suivant »', () => {
    const h = monde(S, PROD())._rsvIntrantsHtml(), t = texte(h);
    return [h.includes('<p class="mvr-ph"><b class="ok">1 stock cohérent</b> · 2 consommés à activer<button class="mv-i" data-mvi="rsv.conso">')
      && t.includes('Consommé à activer · entrées 116 kg') && t.includes('Consommé à activer · entrées 150 kg') && !/lot suivant|structurées/.test(h), t.slice(0, 300)];
  });
  essai('③ un stock négatif : la phrase en rouge d’abord ; l’alerte garde le chiffre et la cause, sans « le bilan ne peut pas fermer »', () => {
    const I = PROD(); I.produits[2].conso_manuel = 20; const h = monde(S, I)._rsvIntrantsHtml(), t = texte(h);
    return [h.includes('<p class="mvr-ph"><b class="ko">1 stock négatif</b> · 2 consommés à activer') && t.includes('Métabisulfite de potassium : stock négatif (-6,5 kg). Une facture d\'achat manque, ou le consommé est surestimé.')
      && !/ne peut pas fermer/.test(t), t.slice(0, 400)];
  });
  essai('③ sans intrant : pas de phrase', () => { const I = PROD(); I.produits = []; I.achats = []; return !monde(S, I)._rsvIntrantsHtml().includes('mvr-ph'); });

  // ④
  essai('④ le Bilan matière : le « i » au titre, plus de note à l’écran ; le PDF garde le règlement', () => {
    const h = monde(S, PROD())._rsvAuditHtml();
    return [h.includes('Bilan matière — Intrants<button class="mv-i" data-mvi="rsv.bilan"></button></div>') && !h.includes('mvr-exp-legal') && !/2021\/771/.test(h)
      && S.rsv.includes('(r\\u00e8glement d\\u00e9l\\u00e9gu\\u00e9 UE 2021/771, art. 1)'), h.slice(0, 300)];
  });

  // ⑤
  T('⑤ les trois « i » neufs disent la méthode qui a quitté l’écran ; la part des anges le reste',
    S.uti.includes("'rsv.pyramide': { t: 'La pyramide des âges'") && S.uti.includes('L’âge se compte en <b>année civile moins année d’achat</b>')
    && S.uti.includes("'rsv.conso': { t: 'Le consommé des intrants'") && S.uti.includes('<b>« Consommé à activer »</b> : aucun traitement de ce produit n’a encore sa dose chiffrée')
    && S.uti.includes('Le bilan matière ne ferme pas tant que l’écart n’est pas corrigé.') && S.uti.includes("'rsv.bilan': { t: 'Le bilan matière'") && S.uti.includes('(règlement délégué <b>UE 2021/771, art. 1</b>)'));
  T('⑤ la phrase des Intrants a sa feuille ; l’aide dit le parc et la phrase', S.rsv.includes("+'.mvr-ph{margin:var(--e-2,8px) 0 var(--e-3,12px);")
    && S.uti.includes("['L’onglet Fûts s’ouvre sur le parc entier'") && S.uti.includes("['L’onglet Intrants', \"s’ouvre sur une phrase qui compte les fiches"));
  T('⑤ le guide : le parc en un grand chiffre, la pyramide sous les boutons, la phrase des Intrants', S.guide.includes('en un grand chiffre — « 55 fûts au domaine · 43 en vin · 12 libres »')
    && S.guide.includes('Sous les boutons, deux lectures venues de la Cave') && S.guide.includes('L\'onglet <b>Intrants</b> s\'ouvre sur une phrase qui compte les fiches'));
  const iW = S.wn.indexOf("{ v: '11.32'"), jW = S.wn.indexOf("{ v: '11.31'");
  T('⑤ l’annonce 11.32, pour l’administrateur seulement', iW > 0 && iW < jW && S.wn.slice(iW, jW).includes("pour: ['admin']") && S.wn.slice(iW, jW).includes('Réserve'));
  const appV = (S.uti.match(/APP_VERSION = '([\d.]+)'/) || [])[1] || '0';
  T('⑤ les versions : APP 11.32 au moins (et l’affichage), le SW dit le lot', Number(appV) >= 11.32 && S.idx.includes('Ma Vigne v' + appV) && S.idx.includes('/boot.js?v=' + appV + '"')
    && S.sw.includes('// v12.23 (25/11/2026) — MOTS-16 (§611)'));
  T('⑤ la maquette est rangée et citée', S.maq.length > 100000 && S.maq.includes('La Réserve') && S.lm.includes('maquette-reserve-v1.html'));
  T('⑤ la liste joue ce fichier et ses contre-épreuves', S.liste.includes("['node scripts/mv-harnais-mots16.mjs']") && S.liste.includes("['node scripts/mv-harnais-mots16.mjs --contre']"));
  return out;
}

if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  console.log('\nMOTS-16 (§611) — La Réserve allégée\n');
  for (const [n, ok, d] of r) { if (!ok) ko++; console.log('  ' + (ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m') + ' ' + n + (!ok && d ? '\n      ' + String(d).slice(0, 600) : '')); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m — ' + ko + ' échec(s) sur ' + r.length : '\x1b[32mVERT\x1b[0m — ' + r.length + '/' + r.length));
  process.exit(ko ? 1 : 0);
} else {
  if (suite(S0).some((x) => !x[1])) { console.log('\x1b[31mROUGE\x1b[0m — la suite de base est rouge : les contre-épreuves ne prouveraient rien (règle du §588)'); process.exit(1); }
  const sur = (cle, de, vers) => (S) => { if (S[cle].indexOf(de) < 0) throw new Error('motif absent : ' + de.slice(0, 60)); return { ...S, [cle]: S[cle].replace(de, vers) }; };
  const mutants = [
    ['les tuiles reviennent', sur('rsv', "  h+=(window._rsvParcHtml?_rsvParcHtml():'');\n", "  h+=(window._rsvParcHtml?_rsvParcHtml():'');\n  h+='<div class=\"mvr-kpis\"><div class=\"mvr-kpi\"><div class=\"mvr-kv\">'+tot+'</div><div class=\"mvr-kl\">Fournisseurs</div></div></div>';\n")],
    ['la pyramide repasse avant le parc', sur('rsv', "  if(_rsvTab==='futs') b.innerHTML=_rsvFutsHtml()+", "  if(_rsvTab==='futs') b.innerHTML=(typeof window._caveParcHtml==='function'?window._caveParcHtml():'')+_rsvFutsHtml()+")],
    ['la pyramide n’est plus posée dans Fûts', sur('rsv', "  h+=(typeof window._caveParcHtml==='function'?window._caveParcHtml():'');", '')],
    ['« 55 barriques » revient', sur('cave', "return _pcavCard(_mvIcon('graphique',16),'#B85A1A','Pyramide des âges','',", "return _pcavCard(_mvIcon('graphique',16),'#B85A1A','Pyramide des âges','<b>'+p.parc+'</b> barriques',")],
    ['la pyramide perd son « i »', sur('cave', "'<div class=\"pcav-pyr\">'+rows+leg+'</div>','','rsv.pyramide');", "'<div class=\"pcav-pyr\">'+rows+leg+'</div>','');")],
    ['la part des anges vide perd son « i »', sur('cave', "onclick=\"openOvCaveOp()\">Saisir</button></div>','','cave.anges');", "onclick=\"openOvCaveOp()\">Saisir</button></div>','');")],
    ['la phrase des Intrants part', sur('rsv', "  if(INTRANTS.produits.length) h+='<p class=\"mvr-ph\">'", "  if(0) h+='<p class=\"mvr-ph\">'")],
    ['la phrase oublie les stocks négatifs', sur('rsv', "  if(neg) P.push(", '  if(0) P.push(')],
    ['un négatif compté cohérent', sur('rsv', 'else if(s.known&&s.q<0) neg++; else ok++;', 'else ok++;')],
    ['« lot suivant » revient', sur('rsv', "' <b>Consommé à activer</b> \\u00b7 entrées '+_fmt(s.ouv+s.achats)+' '+_escHtml(_rsvU(p.unite,s.ouv+s.achats))+'</div>';", "' <b>Consommé à activer.</b> Entrées : '+_fmt(s.ouv+s.achats)+'. Le consommé se calculera une fois les doses structurées (lot suivant).</div>';")],
    ['l’alerte redit « le bilan ne peut pas fermer »', sur('rsv', " Une facture d\\'achat manque, ou le consommé est surestimé.'", " Une facture d\\'achat manque, ou le consommé est surestimé. Le bilan ne peut pas fermer.'")],
    ['la note du contrôle bio revient à l’écran', sur('rsv', "  return h;\n}\n\n/* ── TRI-2", "  h+='<div class=\"mvr-exp-legal\"><b>Contrôle bio.</b> règlement délégué UE 2021/771</div>';\n  return h;\n}\n\n/* ── TRI-2")],
    ['le bilan perd son « i »', sur('rsv', "Bilan matière — Intrants'+(typeof window._mvInfoBtn==='function'?window._mvInfoBtn('rsv.bilan'):'')+'</div>'", "Bilan matière — Intrants</div>'")],
    ['le « i » du consommé ne dit plus pourquoi', sur('uti', '<b>« Consommé à activer »</b> : aucun traitement de ce produit n’a encore sa dose chiffrée', '<b>« Consommé à activer »</b> : bientôt')],
    ['le « i » du bilan perd le règlement', sur('uti', '(règlement délégué <b>UE 2021/771, art. 1</b>)', '(un règlement)')],
    ['le guide dit encore « En tête »', sur('guide', 'Sous les boutons, deux lectures venues de la Cave', 'En tête, deux lectures venues de la Cave')],
    ['l’annonce est montrée à tout le monde', sur('wn', "pour: ['admin'], emoji: 'carton', titre: 'La Réserve", "pour: ['tous'], emoji: 'carton', titre: 'La Réserve")],
    ['le service worker ne dit pas le lot', sur('sw', '// v12.23 (25/11/2026) — MOTS-16 (§611)', '// v12.23 (25/11/2026) — divers')],
    ['la maquette n’est pas citée', sur('lm', 'maquette-reserve-v1.html', 'maquette-reserve-vX.html')],
    ['la liste ne joue plus ce fichier', sur('liste', "['node scripts/mv-harnais-mots16.mjs']", "['node scripts/mv-harnais-mots16Z.mjs']")],
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
