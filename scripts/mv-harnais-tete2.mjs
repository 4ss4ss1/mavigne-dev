// HARNAIS — TETE-2 (§329) : un seul modèle d'en-tête, lisible et calé, sur les dix vues (Pilotage compris).
//   node scripts/mv-harnais-tete2.mjs           → doit être vert
//   node scripts/mv-harnais-tete2.mjs --contre  → chaque défaut réinjecté doit rougir
// Lit le bloc CSS TETE-2 (balisé ★ TETE-2 … ★ FIN TETE-2, EN FIN de styles.css, comme dans la maquette validée) et
// EXÉCUTE, avec des bouchons minimes qui lisent leurs arguments, ce qui pose l'en-tête : _pilHdrHtml (le vrai _pilEsc),
// _pilRenderMeteo, _renderMeteoMini + _meteoMiniJour (Accueil) et _mvDateCourte. Ce qu'il ne voit pas : une mise en page.
// Le rendu a été regardé (Chromium, 10 vues, 360 / 390 / 1 280 px, clair et sombre) — §329.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { css: L('src/styles.css'), pil: L('src/pilotage.js'), app: L('src/app.js'), uti: L('src/utils.js'),
  idx: L('index.html'), liste: L('scripts/mv-harnais-liste.mjs') };

function bloc(css) { const i = css.indexOf('★ TETE-2 (§329)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TETE-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) {
  let out = '', i = 0;
  for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3;
    for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; }
}
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).replace(/env\([^)]*\)/g, '')
  .match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
// Le corps d'une fonction, par comptage d'accolades, chaînes et commentaires sautés. `sig` finit par « { ».
function corps(src, sig) {
  const i = src.indexOf(sig); if (i < 0) return '';
  let p = 0, j = i + sig.length - 1;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); if (j < 0) return ''; continue; }
    if (c === '/' && src[j + 1] === '*') { j = src.indexOf('*/', j + 2) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { const q = c; for (j++; j < src.length && src[j] !== q; j++) if (src[j] === '\\') j++; continue; }
    if (c === '{') p++; else if (c === '}' && --p === 0) return src.slice(i, j + 1);
  }
  return '';
}
const echapStub = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// _pilEsc tient sur une ligne et porte des expressions régulières à guillemets (/\"/g) : on la prend à la ligne, pas aux accolades.
function pilEsc(S) { const m = S.pil.match(/^function _pilEsc\(s\)\{[^\n]*\}$/m);
  if (!m) return echapStub; const c = { }; vm.createContext(c); vm.runInContext(m[0] + ';this.__f=_pilEsc;', c); return c.__f; }
const icone = (n, s) => '<svg class="mv-ic" data-ic="' + n + '" width="' + s + '"></svg>';
function pilHdr(S, d, admin) {
  const f = corps(S.pil, 'function _pilHdrHtml(d){'); if (!f) throw new Error('_pilHdrHtml introuvable');
  const c = { window: { isAdmin: () => admin }, _mvIcon: icone, _pilEsc: pilEsc(S), _pilHa: v => Number(v).toFixed(2).replace('.', ',') };
  vm.createContext(c); vm.runInContext(f + ';this.__f=_pilHdrHtml;', c); return c.__f(d);
}
function elem(id) { return { id, style: {}, innerHTML: '', textContent: '' }; }
function rangee() { const r = { cls: new Set() }; r.classList = { add: k => r.cls.add(k), remove: k => r.cls.delete(k), contains: k => r.cls.has(k) }; return r; }
function pilMeteo(S, meteo) {
  const f = corps(S.pil, 'function _pilRenderMeteo(d){'); if (!f) throw new Error('_pilRenderMeteo introuvable');
  const row = rangee(), el = elem('pil-meteo'); el.parentElement = row; el.style.display = 'none';
  const c = { document: { getElementById: id => id === 'pil-meteo' ? el : null }, window: { _mvDateCourte: d => (Object.prototype.toString.call(d) === '[object Date]' ? 'mer. 14 oct.' : '?') },
    _mvIcon: icone, _pilEsc: pilEsc(S) };
  vm.createContext(c); vm.runInContext(f + ';this.__f=_pilRenderMeteo;', c); c.__f({ meteo });
  return { el, row };
}
function accueilMeteo(S) {
  const f = corps(S.app, 'function _renderMeteoMini(emoji,temp,wind,isCache){') + '\n' + corps(S.app, 'function _meteoMiniJour(mini){');
  const row = rangee(), E = {}; ['hv2-meteo-mini', 'hv2-mini-ico', 'hv2-mini-temp', 'hv2-mini-desc', 'hv2-mini-jour'].forEach(k => E[k] = elem(k));
  E['hv2-meteo-mini'].parentElement = row;
  const c = { document: { getElementById: id => E[id] || null },
    window: { _mvSetIcon: (el, n) => { el.innerHTML = icone(n, 16); }, _mvDateCourte: d => (Object.prototype.toString.call(d) === '[object Date]' ? 'mer. 14 oct.' : '?') } };
  vm.createContext(c); vm.runInContext(f + ';this.__f=_renderMeteoMini;', c); c.__f('soleil', 14, 2, false);
  return { E, row };
}
function dateCourte(S, d) {
  const f = corps(S.uti, 'window._mvDateCourte = function (d) {'); if (!f) throw new Error('_mvDateCourte introuvable');
  const c = { window: {} }; vm.createContext(c); vm.runInContext(f, c); return c.window._mvDateCourte(d);
}
const balance = h => (h.match(/<div[\s>]/g) || []).length === (h.match(/<\/div>/g) || []).length
  && (h.match(/<span[\s>]/g) || []).length === (h.match(/<\/span>/g) || []).length;

function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  const fin = S.css.indexOf('★ FIN TETE-2');
  T('le bloc TETE-2 est posé en fin de feuille (seul le gabarit du Pilotage le suit), après TETE-1, sans aucune valeur en dur (' + dur.length + ')',
    B.length > 3000 && S.css.indexOf('★ TETE-2 (§329)') > S.css.indexOf('★ FIN TETE-1') && fin > 0
    && /^(\/\* ══ ★★ GABARIT-1 \(§455\)[\s\S]*\/\* ★ FIN GABARIT-1 \*\/\s*)?$/.test(S.css.slice(fin).replace(/^★ FIN TETE-2 \*\/\s*/, '')) && dur.length === 0);   // GABARIT-1 (§455) : seul le gabarit du Pilotage peut le suivre, et il ferme la feuille
  T('la ligne du jour reste sur une ligne, chaque morceau entier (plus de « Hiver / 2026 / - / 2027 »)',
    B.includes('body .mod-header .mod-meta-row{ flex-wrap:nowrap;') && B.includes('body .mod-header .mod-meta-row > *{ flex-shrink:0; }')
    && B.includes('body .mod-header .hv2-saison-pill > span,body .mod-header .hv2-meteo-mini,body .mod-header .mv-help-btn{ white-space:nowrap; }'));
  T('les trois pastilles (saison, météo, aide) ont la même hauteur',
    B.includes('body .mod-header .hv2-saison-pill{ height:var(--h-sm,28px)!important;') && B.includes('body .mod-header .hv2-meteo-mini{ height:var(--h-sm,28px);')
    && B.includes('body .mod-header .mv-help-btn{ height:var(--h-sm,28px);'));
  T('la météo et l’aide prennent les couleurs du thème (plus le crème du bandeau brun)',
    B.includes('background:var(--survol)!important; border:0!important; border-radius:var(--r-xs,4px)!important;')
    && B.includes('font-weight:var(--fw-semi,600)!important; color:var(--texte)!important; font-variant-numeric')
    && B.includes('border:var(--bw,1px) solid var(--ligne-forte)!important; border-radius:var(--r-full,999px)!important; color:var(--texte-med)!important; font-family:var(--font-ui);')
    && B.includes('.mv-help-btn .mvh-q{ width:var(--ic-sm,16px); height:var(--ic-sm,16px); background:var(--texte-med)!important; color:var(--sur-inverse)!important;'));
  T('la température passe en Outfit, chiffres droits (le 1 ne ressemble plus à un I)',
    B.includes('body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-ui)!important;') && B.includes('font-variant-numeric:lining-nums tabular-nums;'));
  T('la date longue s’efface quand la pastille météo porte la date courte',
    B.includes('body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-date,body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-sep{ display:none!important; }'));
  T('au téléphone, l’aide est un « ? » rond (le mot reste dans aria-label) et le vignoble du Pilotage se cache',
    /@media \(max-width:600px\)\{\s*body \.mod-header \.mv-help-btn\{ width:var\(--h-sm,28px\); padding:0!important; justify-content:center; font-size:0!important; gap:0; \}[\s\S]*?body \.mod-header \.pil-vgn\{ display:none; \}\s*\}/.test(B));
  T('la pastille de synchro est à la hauteur des boutons (cible tactile gardée)',
    B.includes('body .mod-header .mv-syncdot{ position:relative; height:var(--h-ctl,32px)!important;') && B.includes('body .mod-header .mv-syncdot::after{ content:\'\'; position:absolute;'));
  T('Pilotage : le fil d’Ariane ne passe plus sous « à compléter »', B.includes('body #page-pilotage .pil-portee .pil-crumb{ min-width:auto; }'));
  let h1 = '', h2 = '', h3 = '';
  try { h1 = pilHdr(S, { domaine: 'Domaine Test', saison: 'Hiver 2026 - 2027', nActives: 46, surfTot: 11.85, meteo: { temp: 14 } }, true);
        h2 = pilHdr(S, { domaine: 'Clos <b>X</b>', saison: 'Été', nActives: 3, surfTot: 1.2, meteo: null }, false); } catch (e) { if (DEBUG) console.log('  [debug] ' + e.message); h1 = h2 = ''; }
  T('en-tête du Pilotage EXÉCUTÉ : un .mod-header, la ligne du jour, les ids gardés, plus de bandeau à part, balises équilibrées',
    h1.startsWith('<div class="mod-header h-pilotage"><div class="mod-header-top">') && h1.includes('<div class="mod-header-title">Pilotage</div>')
    && h1.includes('<div class="mod-meta-row mvu-meta mvu-avec-meteo">') && h2.includes('<div class="mod-meta-row mvu-meta">')
    && h1.includes('id="pil-dom-nom">Domaine Test<span class="pil-vgn"> · 46 parcelles · 11,85 ha</span>') && h1.includes('<span id="pil-saison">Hiver 2026 - 2027</span>')
    && h1.includes('<div class="hv2-date" data-mv-date></div>') && h1.includes('id="pil-meteo" style=""') && h2.includes('id="pil-meteo" style="display:none"')
    && !/pil-mast|pil-metahost|pil-cell/.test(h1 + h2) && balance(h1) && balance(h2));
  T('… le domaine y est échappé, et la roue crantée n’y est que pour l’admin',
    h2.includes('Clos &lt;b&gt;X&lt;/b&gt;') && !h2.includes('<b>X</b>') && !h2.includes('pil-regl-gear')
    && h1.includes('<button class="mod-home-btn mv-regl-gear" id="pil-regl-gear"'));
  let m1 = null, m2 = null; try { m1 = pilMeteo(S, { emoji: 'soleil', temp: 14, wind: 2 }); m2 = pilMeteo(S, null); } catch (e) { if (DEBUG) console.log('  [debug] ' + e.message); m1 = m2 = null; }
  T('météo du Pilotage EXÉCUTÉE : la pastille partagée avec l’Accueil, la date courte, la classe posée puis retirée',
    !!m1 && m1.el.style.display === '' && m1.row.cls.has('mvu-avec-meteo') && m1.el.innerHTML.includes('<span class="hv2-meteo-mini-temp">14°</span>')
    && m1.el.innerHTML.includes('<span class="hv2-meteo-mini-desc">vent 2 km/h</span>') && m1.el.innerHTML.includes('<span class="hv2-meteo-mini-jour">mer. 14 oct.</span>')
    && balance(m1.el.innerHTML) && !!m2 && m2.el.style.display === 'none' && !m2.row.cls.has('mvu-avec-meteo'));
  const rp = corps(S.pil, 'function renderPilotage(){'); const iA = rp.indexOf('_mvInjectHelpBtn()'), iM = rp.indexOf('window._mvMetaSync()'), iS = rp.indexOf('window._syncEnsureDots()');
  T('renderPilotage recopie la date dans la ligne du jour et pose le voyant de synchro, après l’aide', iA > 0 && iM > iA && iS > iA);
  let a = null; try { a = accueilMeteo(S); } catch (e) { if (DEBUG) console.log('  [debug] ' + e.message); a = null; }
  const horsLigne = S.app.includes("document.getElementById('hv2-mini-desc').textContent='Hors ligne';_meteoMiniJour(mini);}");
  T('Accueil EXÉCUTÉ : 14°, « vent 2 km/h », la date courte et la classe ; le hors-ligne aussi ; index.html porte la ligne de date',
    !!a && a.E['hv2-mini-temp'].textContent === '14°' && a.E['hv2-mini-desc'].textContent === 'vent 2 km/h' && a.E['hv2-mini-jour'].textContent === 'mer. 14 oct.'
    && a.row.cls.has('mvu-avec-meteo') && a.E['hv2-meteo-mini'].style.display === 'flex' && horsLigne
    && S.idx.includes('<span class="hv2-meteo-mini-txt"><span class="hv2-meteo-mini-desc" id="hv2-mini-desc"></span><span class="hv2-meteo-mini-jour" id="hv2-mini-jour"></span></span></div>'));
  T('les sous-titres ne répètent plus la saison (Accueil, Parcelles, Journal)',
    S.app.includes("if(sub)sub.textContent='Tableau de bord';") && !S.app.includes('sub.textContent=_visuSaison()')
    && S.app.includes("document.getElementById('p-saison-sub').textContent='Parcelles';")
    && S.app.includes("document.getElementById('j-sub').textContent=`${tot} entrée${tot>1?'s':''}`;") && !/j-sub'\)\.textContent=[^;]*_visuSaison/.test(S.app));
  let d1 = '', d2 = '', d3 = ''; try { d1 = dateCourte(S, new Date(2026, 9, 14)); d2 = dateCourte(S, new Date(2027, 1, 1)); d3 = dateCourte(S, new Date(2026, 7, 15)); } catch (e) { d1 = ''; }
  T('la date courte EXÉCUTÉE : « mer. 14 oct. », « lun. 1 févr. », « sam. 15 août » (' + [d1, d2, d3].join(' / ') + ')',
    d1 === 'mer. 14 oct.' && d2 === 'lun. 1 févr.' && d3 === 'sam. 15 août');
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-tete2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-tete2.mjs --contre'],"));
  return out;
}
const DEBUG = process.argv.includes('--debug');
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
let contreKO = false;
if (CONTRE) {
  const DEF = [
    ['une couleur écrite en dur dans le bloc (le crème revient)', 'css', 'font-weight:var(--fw-semi,600)!important; color:var(--texte)!important; font-variant-numeric', 'font-weight:var(--fw-semi,600)!important; color:#F0E2C8!important; font-variant-numeric', 0],
    ['la ligne du jour repasse à la ligne', 'css', 'body .mod-header .mod-meta-row{ flex-wrap:nowrap;', 'body .mod-header .mod-meta-row{ flex-wrap:wrap;', 1],
    ['la saison reprend sa petite hauteur', 'css', 'body .mod-header .hv2-saison-pill{ height:var(--h-sm,28px)!important;', 'body .mod-header .hv2-saison-pill{ height:var(--h-badge,20px)!important;', 2],
    ['l’aide reprend une encre pâle', 'css', 'solid var(--ligne-forte)!important; border-radius:var(--r-full,999px)!important; color:var(--texte-med)!important;', 'solid var(--ligne-forte)!important; border-radius:var(--r-full,999px)!important; color:var(--or-pale)!important;', 3],
    ['la température repasse en Cormorant', 'css', 'body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-ui)!important;', 'body .mod-header .hv2-meteo-mini-temp{ font-family:var(--font-titre)!important;', 4],
    ['la date longue reste à côté de la météo', 'css', 'body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-date,body .mod-header .mod-meta-row.mvu-avec-meteo > .hv2-sep{ display:none!important; }', '', 5],
    ['le mot « Aide » revient au téléphone', 'css', 'justify-content:center; font-size:0!important; gap:0; }', 'justify-content:center; gap:0; }', 6],
    ['la synchro redevient plus haute que les boutons', 'css', 'body .mod-header .mv-syncdot{ position:relative; height:var(--h-ctl,32px)!important;', 'body .mod-header .mv-syncdot{ position:relative; height:var(--mvu-idh,44px)!important;', 7],
    ['le fil d’Ariane repasse sous le bouton', 'css', 'body #page-pilotage .pil-portee .pil-crumb{ min-width:auto; }', '', 8],
    ['le Pilotage revient à son bandeau à part', 'pil', "return '<div class=\"mod-header h-pilotage\">'", "return '<header class=\"pil-mast\">'", 9],
    ['le domaine n’est plus échappé', 'pil', "id=\"pil-dom-nom\">'+_pilEsc(d.domaine)+'", "id=\"pil-dom-nom\">'+d.domaine+'", 10],
    ['la météo du Pilotage ne pose plus sa classe', 'pil', "  if(row) row.classList.add('mvu-avec-meteo');\n", '', 11],
    ['renderPilotage oublie la date de la ligne du jour', 'pil', "  if(typeof window._mvMetaSync==='function') window._mvMetaSync();\n", '', 12],
    ['l’Accueil oublie la date courte', 'app', "  _meteoMiniJour(mini);\n}", '\n}', 13],
    ['la saison revient dans le sous-titre de l’Accueil', 'app', "if(sub)sub.textContent='Tableau de bord';", 'if(sub)sub.textContent=_visuSaison();', 14],
    ['la date courte décale les mois', 'uti', "['janv.', 'févr.', 'mars',", "['févr.', 'mars', 'janv.',", 15],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-tete2.mjs'],", '', 16]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  contreKO = mord !== DEF.length;
}
process.exit(ko || contreKO ? 1 : 0);
