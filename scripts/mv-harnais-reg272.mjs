/* ───────────────────────────────────────────────────────
   HARNAIS — REG27-2 (§575) : HORAIRES ET STADE EXIGÉS AU REGISTRE, MARQUÉS PAR PRODUIT
   Lancer :          node scripts/mv-harnais-reg272.mjs
   Contre-épreuves : node scripts/mv-harnais-reg272.mjs --contre

   POURQUOI IL EXISTE
   L'arrêté du 24 décembre 2025 veut les horaires « lorsque la réglementation ou l'AMM le prévoit » et le stade quand l'emploi
   du produit y est limité. E-Phy ne le dit pas. Jusqu'à ce lot, la marque n'existait que sur la liste de départ écrite dans
   app.js, cherchée par nom exact : un produit choisi dans E-Phy ne la portait jamais, et seule la règle « insecticide »
   vivait. L'administrateur coche maintenant la fiche du produit (Phyto › Catalogue) ; la marque vit dans la configuration du
   domaine, par numéro d'AMM (CONFIG.phyto_oblig).
   Ce harnais JOUE le bloc REG27-2 de src/registre.js (la marque, les deux règles, le bloc de la fiche, le geste) avec les
   vrais _escHtml / _escAttr d'utils.js, puis _pMeta extraite de phyto.js (l'assistant), et lit les fils : la fiche du
   catalogue, l'aide, le guide, l'annonce, l'exemption du geste.
   Jamais déployé (scripts/) → aucun bump.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { rg: lire('src/registre.js'), phy: lire('src/phyto.js'), tra: lire('src/tracteur.js'), ut: lire('src/utils.js'), wn: lire('src/whats-new.js'),
  g07: lire('guide/07-phyto.html'), cov: lire('scripts/tutos-couverture.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}') { p--; if (!p) break; } } return src.slice(i, k + 1); }
function tranche(src, a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('tranche introuvable : ' + a); return src.slice(i, j); }
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det != null ? '\n      → ' + det : '')); } };
const balance = (h, b) => (h.match(new RegExp('<' + b + '\\b', 'g')) || []).length === (h.match(new RegExp('</' + b + '>', 'g')) || []).length;

const EPHY = () => [{ amm: '2120063', nom: 'PROFILER <WG>', type: 'Fongicide' }, { amm: '9200556', nom: 'KARATE ZEON', type: 'Insecticide' }, { amm: 'X12', nom: 'SANS AMM', type: 'Fongicide' }];
const CATA = [{ nom: 'Vieux H', heureOblig: true }, { nom: 'Vieux S', stadeOblig: true }];

function monde(S, o = {}) {
  const vu = { sauve: [], toasts: [], blocs: [] };
  const ctx = { String, Object, Array, JSON, console, vu,
    CONFIG: o.config === undefined ? {} : o.config, EPHY: EPHY(), CATALOGUE: CATA,
    isAdmin: () => o.admin !== false,
    showToast: (m) => { vu.toasts.push(m); },
    _mvIcon: (n) => '<svg data-ic="' + n + '"></svg>',
    saveData: (cle, msg) => { vu.sauve.push([cle, msg, JSON.stringify(ctx.CONFIG.phyto_oblig)]); },
    // le résolveur du traitement : son AMM propre, sinon celui du produit E-Phy de même nom (ce que fait _phResolve, phyto.js)
    _phResolve: (tr) => { const e = (ctx.EPHY || []).find((x) => x.nom === (tr && tr.produit)); return { type: (tr && tr.type) || (e && e.type) || '', amm: (tr && tr.amm) || (e && e.amm) || '' }; },
    document: { querySelectorAll: (s) => { const m = /^\[data-reg-oblig="(\d+)"\]$/.exec(s); return m ? vu.blocs.filter((b) => b.amm === m[1]) : []; } } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fonction(S.ut, 'function _escHtml(s) {') + '\n' + fonction(S.ut, 'function _escAttr(s) {') + '\n'
    + fonction(S.rg, 'function _regCat(t) {') + '\n'
    + tranche(S.rg, '// ── ★ REG27-2 (§575) : LES PRODUITS QUE LE DOMAINE A MARQUÉS ──', "// Les rentrées anticipées d'UNE parcelle")
    + '\nwindow._regHeureRequise = _regHeureRequise; window._regStadeRequis = _regStadeRequis;', ctx);
  return { ctx, vu };
}

function jouer(S) {
  // ── ① la marque ──
  { const M = monde(S, { config: { phyto_oblig: { '2120063': { h: 1, nom: 'PROFILER' }, '2000009': { s: 1 } } } }), f = M.ctx._regOblig;
    t('① la marque se lit par numéro d’AMM : horaires, stade, rien — espaces tolérés',
      JSON.stringify([f('2120063'), f(' 2120063 '), f('2000009'), f('9999999'), f(''), f(null)]) === JSON.stringify([{ h: true, s: false }, { h: true, s: false }, { h: false, s: true }, { h: false, s: false }, { h: false, s: false }, { h: false, s: false }]));
    const V = monde(S, { config: null }); let leve = null; try { V.ctx._regOblig('2120063'); } catch (e) { leve = e.message; }
    t('① un domaine sans configuration, ou sans marque, ne lève rien', !leve && JSON.stringify(monde(S).ctx._regOblig('2120063')) === '{"h":false,"s":false}', leve);
    // ── ② les deux règles de la vérification ──
    const H = M.ctx._regHeureRequise, St = M.ctx._regStadeRequis;
    t('② horaires : dus pour un insecticide, pour un produit marqué — pas pour un fongicide sans marque',
      H({ produit: 'KARATE ZEON', type: 'Insecticide', amm: '9200556' }) === true && H({ produit: 'PROFILER <WG>', type: 'Fongicide', amm: '2120063' }) === true && H({ produit: 'Autre', type: 'Fongicide', amm: '2000001' }) === false);
    t('② stade : dû pour un produit marqué « stade », pas pour celui qui n’est marqué qu’« horaires »',
      St({ produit: 'Stadé', type: 'Fongicide', amm: '2000009' }) === true && St({ produit: 'PROFILER <WG>', type: 'Fongicide', amm: '2120063' }) === false && H({ produit: 'Stadé', type: 'Fongicide', amm: '2000009' }) === false);
    t('② un ancien traitement sans numéro d’AMM est rattaché par son produit E-Phy', H({ produit: 'PROFILER <WG>', type: 'Fongicide' }) === true && H({ produit: 'Inconnu', type: 'Fongicide' }) === false);
    t('② la liste de départ reste lue (par nom) : ses deux marques valent toujours',
      H({ produit: 'Vieux H', type: 'Fongicide' }) === true && St({ produit: 'Vieux S', type: 'Fongicide' }) === true && St({ produit: 'Vieux H', type: 'Fongicide' }) === false);
  }
  // ── ③ le bloc de la fiche du produit ──
  { const A = monde(S), P = A.ctx.EPHY, h0 = A.ctx._regObligHtml(P[0]);
    const cases = (h) => [...h.matchAll(/<input type="checkbox"( checked)? onchange="window\._regObligBasculer\('([^']*)','([^']*)'\)"/g)].map((m) => (m[1] ? '+' : '-') + m[2] + m[3]);
    t('③ administrateur, fongicide sans marque : deux cases libres, chacune avec son produit et sa clé', cases(h0).join() === '-2120063h,-2120063s' && h0.startsWith('<div class="mvencadre" data-reg-oblig="2120063"'), cases(h0).join());
    t('③ le bloc dit à quoi il sert et ce que cocher entraîne', h0.includes('Au registre, à chaque traitement') && h0.includes('À cocher quand l’étiquette du produit impose des horaires.') && h0.includes('À cocher quand l’emploi du produit est limité à un stade.')
      && h0.includes('pour les traitements déjà saisis aussi'));
    const B = monde(S, { config: { phyto_oblig: { '2120063': { h: 1 } } } }), h1 = B.ctx._regObligHtml(B.ctx.EPHY[0]);
    t('③ une marque posée coche sa case, pas l’autre', cases(h1).join() === '+2120063h,-2120063s', cases(h1).join());
    const hi = A.ctx._regObligHtml(P[1]);
    t('③ insecticide : les horaires sont dits « toujours exigés », sans case ; le stade garde la sienne', cases(hi).join() === '-9200556s' && hi.includes('Toujours exigés pour un insecticide.') && /data-reg-oblig-ligne="h"[^>]*>[\s\S]*?data-ic="check"/.test(hi), cases(hi).join());
    t('③ un produit sans numéro d’AMM à 7 chiffres n’a pas de bloc', A.ctx._regObligHtml(P[2]) === '' && A.ctx._regObligHtml(null) === '');
    const N = monde(S, { admin: false }), N2 = monde(S, { admin: false, config: { phyto_oblig: { '2120063': { h: 1 } } } }), hn = N2.ctx._regObligHtml(N2.ctx.EPHY[0]);
    t('③ un salarié ne voit rien quand rien n’est exigé ; sinon il lit, sans case ni consigne d’administrateur',
      N.ctx._regObligHtml(N.ctx.EPHY[0]) === '' && cases(hn).length === 0 && !/<input/.test(hn) && hn.includes('Exigés par le domaine pour ce produit.') && !hn.includes('Stade de la vigne') && !hn.includes('À cocher'), hn.slice(0, 300));
    t('③ pour un salarié, l’insecticide dit ses horaires exigés', /Toujours exigés pour un insecticide/.test(N.ctx._regObligHtml(N.ctx.EPHY[1])) && !/<input/.test(N.ctx._regObligHtml(N.ctx.EPHY[1])));
    t('③ le bloc est équilibré, sans <div> dans un <label>, sans valeur perdue', [h0, h1, hi, hn].every((h) => balance(h, 'div') && balance(h, 'span') && balance(h, 'label') && !/<label\b[^>]*>(?:(?!<\/label>)[\s\S])*<div\b/.test(h) && !/undefined|NaN/.test(h)));
  }
  // ── ④ le geste ──
  { const M = monde(S, { config: { siret: '1', phyto_oblig: { '2000009': { s: 1 } } } }), c = M.ctx, avant = c.CONFIG.phyto_oblig;
    M.vu.blocs.push({ amm: '2120063', outerHTML: 'ancien' }, { amm: '2120063', outerHTML: 'ancien' }, { amm: '9200556', outerHTML: 'autre' });
    c._regObligBasculer('2120063', 'h');
    t('④ cocher « horaires » : la marque entre dans la configuration avec le nom du produit, les autres marques restent',
      JSON.stringify(c.CONFIG.phyto_oblig) === '{"2000009":{"s":1},"2120063":{"h":1,"nom":"PROFILER <WG>"}}' && c.CONFIG.siret === '1' && c.CONFIG.phyto_oblig !== avant, JSON.stringify(c.CONFIG.phyto_oblig));
    t('④ la configuration est enregistrée APRÈS l’écriture, avec un message qui nomme le produit',
      M.vu.sauve.length === 1 && M.vu.sauve[0][0] === 'config' && M.vu.sauve[0][1] === 'Horaires exigés — PROFILER <WG>' && /"2120063":\{"h":1/.test(M.vu.sauve[0][2]), JSON.stringify(M.vu.sauve));
    t('④ chaque fiche ouverte de CE produit est repeinte, case cochée — pas celle d’un autre',
      M.vu.blocs[0].outerHTML.includes('<input type="checkbox" checked') && M.vu.blocs[1].outerHTML === M.vu.blocs[0].outerHTML && M.vu.blocs[2].outerHTML === 'autre');
    c._regObligBasculer('2120063', 's'); c._regObligBasculer('2120063', 'h');
    t('④ les deux clés vivent côte à côte ; en décocher une garde l’autre', JSON.stringify(c.CONFIG.phyto_oblig['2120063']) === '{"nom":"PROFILER <WG>","s":1}' && M.vu.sauve[2][1] === 'Horaires non exigés — PROFILER <WG>', JSON.stringify(c.CONFIG.phyto_oblig['2120063']));
    c._regObligBasculer('2120063', 's');
    t('④ tout décoché, le produit sort de la configuration', JSON.stringify(c.CONFIG.phyto_oblig) === '{"2000009":{"s":1}}' && M.vu.sauve.length === 4, JSON.stringify(c.CONFIG.phyto_oblig));
    c._regObligBasculer('X12', 'h'); c._regObligBasculer('2120063', 'x'); c._regObligBasculer('', 'h');
    t('④ un numéro qui n’a pas 7 chiffres, une clé inconnue : rien n’est écrit', M.vu.sauve.length === 4 && JSON.stringify(c.CONFIG.phyto_oblig) === '{"2000009":{"s":1}}');
    const N = monde(S, { admin: false }); N.ctx._regObligBasculer('2120063', 'h');
    t('④ un salarié ne peut rien marquer', !N.vu.sauve.length && N.vu.toasts.length === 1 && !N.ctx.CONFIG.phyto_oblig, JSON.stringify(N.ctx.CONFIG));
    const V = monde(S, { config: null }); V.ctx._regObligBasculer('9200556', 's');
    t('④ un domaine sans configuration en reçoit une', JSON.stringify(V.ctx.CONFIG) === '{"phyto_oblig":{"9200556":{"s":1,"nom":"KARATE ZEON"}}}', JSON.stringify(V.ctx.CONFIG));
  }
  // ── ⑤ l'assistant de traitement (_pMeta, phyto.js) ──
  { const c = { window: null, CATALOGUE: [{ nom: 'Ancien', amm: '2120063', drae: 24 }, { nom: 'Vieux H', heureOblig: true }], CONFIG: { phyto_oblig: { '2120063': { h: 1, s: 1 } } } };
    c.window = c; vm.createContext(c);
    vm.runInContext('window._regOblig = ' + fonction(S.rg, 'window._regOblig = function (amm) {').replace('window._regOblig = ', '') + ';\n' + fonction(S.phy, 'function _pMeta(p){'), c);
    const a = c._pMeta({ nom: 'PROFILER', source: 'ephy', amm: '2120063', type: 'Fongicide' }), b = c._pMeta({ nom: 'AUTRE', source: 'ephy', amm: '2000001' }), d = c._pMeta({ nom: 'AUTRE', source: 'ephy', amm: '2000001', heureOblig: true }), e = c._pMeta({ nom: 'Vieux H' });
    t('⑤ un produit E-Phy marqué fait demander horaires et stade ; un produit sans marque, non', a.heureOblig === true && a.stadeOblig === true && b.heureOblig === false && b.stadeOblig === false);
    t('⑤ la marque portée par le produit à la saisie, et celle de la liste de départ, valent toujours', d.heureOblig === true && e.heureOblig === true && e.stadeOblig === false);
    const s = { window: null, CATALOGUE: [] }; s.window = s; vm.createContext(s); let leve = null;
    try { vm.runInContext(fonction(S.phy, 'function _pMeta(p){') + '\nvar r = _pMeta({ nom: "X", source: "ephy", amm: "2120063" });', s); } catch (x) { leve = x.message; }
    t('⑤ sans registre.js chargé, l’assistant ne lève pas', !leve && s.r.heureOblig === false, leve);
  }
  // ── ⑥ les fils ──
  t('⑥ la fiche du catalogue porte le bloc, entre les mentions et les usages',
    /\+ \(ments\?[^\n]*\n\s*\+ \(typeof window\._regObligHtml==='function'\?window\._regObligHtml\(p\):''\)[^\n]*\n\s*\+ '<div class="oed-sec">Usages homologués/.test(S.tra));
  t('⑥ le geste est exempté de tuto, et le dit', /"_regObligBasculer": "REG27-2 \(§575\)/.test(S.cov));
  t('⑥ la fiche « i », l’aide, le guide, l’annonce 11.05',
    S.ut.includes('un insecticide, ou un produit que vous avez marqué') && S.ut.includes("'<b>Marquer un produit</b> : Phyto › Catalogue") && S.ut.includes("['Horaires ou stade exigés pour un produit'")
    && S.g07.includes('<b>« Au registre, à chaque traitement »</b>') && S.g07.includes("horaires d'un insecticide ou d'un produit que vous avez marqué")
    && /v: '11\.05'[\s\S]{0,300}Horaires ou stade exigés\\u00a0: à cocher sur la fiche du produit/.test(S.wn));
  t('⑥ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-reg272.mjs'") > 0 && S.liste.indexOf("mv-harnais-reg272.mjs --contre'") > 0);
}

if (!CONTRE) {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-2 · scénarios\x1b[0m');
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  console.log('\n\x1b[1mMA VIGNE — Harnais REG27-2 · contre-épreuves\x1b[0m');
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (S[cle].split(a).length !== 2) throw new Error('ancre absente ou multiple : ' + a.slice(0, 50)); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la marque « horaires » n’est plus lue par la vérification', m('rg', " || !!(c && c.heureOblig) || window._regOblig(_regAmm(t)).h; }", " || !!(c && c.heureOblig); }")],
    ['la marque « stade » n’est plus lue par la vérification', m('rg', "return !!(c && c.stadeOblig) || window._regOblig(_regAmm(t)).s; }", "return !!(c && c.stadeOblig); }")],
    ['« stade » lit la marque « horaires »', m('rg', "return !!(c && c.stadeOblig) || window._regOblig(_regAmm(t)).s; }", "return !!(c && c.stadeOblig) || window._regOblig(_regAmm(t)).h; }")],
    ['l’AMM d’un ancien traitement n’est plus résolu', m('rg', "return String((m && m.amm) || (t && t.amm) || '').trim(); }", "return String((t && t.amm) || '').trim(); }")],
    ['la liste de départ n’est plus lue', m('rg', "String(m.type || '') === 'Insecticide' || !!(c && c.heureOblig) || ", "String(m.type || '') === 'Insecticide' || ")],
    ['la marque se lit sans retirer les espaces', m('rg', "o = M[String(amm == null ? '' : amm).trim()];\n  return { h:", "o = M[String(amm == null ? '' : amm)];\n  return { h:")],
    ['un salarié peut marquer', m('rg', "  if (!isAdmin()) { showToast('Réservé aux administrateurs', '#C0392B'); return; }\n  if (!/^\\d{7}$/.test(amm)", "  if (!/^\\d{7}$/.test(amm)")],
    ['un salarié voit les cases', m('rg', "  if (!adm || fige) return '<div data-reg-oblig-ligne", "  if (fige) return '<div data-reg-oblig-ligne")],
    ['un numéro sans 7 chiffres est marqué', m('rg', "  if (!/^\\d{7}$/.test(amm) || (cle !== 'h' && cle !== 's')) return;", "  if (cle !== 'h' && cle !== 's') return;")],
    ['une clé inconnue est écrite', m('rg', "  if (!/^\\d{7}$/.test(amm) || (cle !== 'h' && cle !== 's')) return;", "  if (!/^\\d{7}$/.test(amm)) return;")],
    ['la marque n’est pas enregistrée', m('rg', "  if (window.saveData) window.saveData('config', ", "  if (false) window.saveData('config', ")],
    ['les autres marques sont écrasées', m('rg', "M = Object.assign({}, C.phyto_oblig || {}), o = ", "M = {}, o = ")],
    ['décocher ne retire rien', m('rg', "  if (o[cle]) delete o[cle]; else o[cle] = 1;", "  o[cle] = 1;")],
    ['le produit tout décoché reste dans la configuration', m('rg', "M[amm] = o; } else delete M[amm];", "M[amm] = o; } else M[amm] = o;")],
    ['la fiche ouverte n’est pas repeinte', m('rg', "B[k].outerHTML = window._regObligHtml(p);", "void 0;")],
    ['la case cochée ne se voit pas', m('rg', "'<input type=\"checkbox\"' + (on ? ' checked' : '') + ", "'<input type=\"checkbox\"' + ")],
    ['l’insecticide reçoit une case pour ses horaires', m('rg', "_regObligLigne(p.amm, 'h', true, true, adm,", "_regObligLigne(p.amm, 'h', true, false, adm,")],
    ['un produit sans AMM reçoit un bloc', m('rg', "  if (!p || !/^\\d{7}$/.test(String(p.amm || ''))) return '';", "  if (!p) return '';")],
    ['l’assistant ne lit plus la marque (produit E-Phy)', m('phy', "stadeOblig:!!p.stadeOblig||o.s,heureOblig:!!p.heureOblig||o.h,", "stadeOblig:!!p.stadeOblig,heureOblig:!!p.heureOblig,")],
    ['l’assistant lève sans registre.js', m('phy', "var o=(typeof window._regOblig==='function')?window._regOblig(p&&p.amm):{h:false,s:false};", "var o=window._regOblig(p&&p.amm);")],
    ['la fiche du catalogue perd le bloc', m('tra', "    + (typeof window._regObligHtml==='function'?window._regObligHtml(p):'')", "    + ('')")],
    ['le geste n’est plus exempté', m('cov', '"_regObligBasculer": "REG27-2 (§575)', '"_regObligAutre": "REG27-2 (§575)')],
    ['l’aide ne dit plus où marquer', m('ut', "['Horaires ou stade exigés pour un produit'", "['Horaires ou stade'")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-reg272.mjs'").join("mv-harnais-reg27Z.mjs'") })]];
  let rougit = 0;
  for (const [nom, f] of mutants) {
    let S; try { S = f(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m défaut non injecté : ' + nom + ' (' + e.message + ')'); continue; }
    const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S); } catch (e) { ko++; } console.log = log;
    if (ko) { rougit++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + '\x1b[2m  (' + ko + ')\x1b[0m'); } else console.log('  \x1b[31m✗\x1b[0m MUET : ' + nom);
  }
  console.log('\n  ' + rougit + '/' + mutants.length + ' contre-épreuves rougissent\n');
  process.exit(rougit === mutants.length ? 0 : 1);
}
