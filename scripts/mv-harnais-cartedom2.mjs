#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════════════
//  CARTEDOM-2 (§491) — « LA CARTE DE VOTRE SAISON » EN MOSAÏQUE, COMME LA CARTE DU JOUR
//  Exécute le VRAI moteur des formes (utils.js, bloc FORME-1), les VRAIES _homeForme et _homeRangs (app.js) et la VRAIE
//  _mvCarteDomaineSection (jalons.js, avec le bloc exécutable) sur un domaine fabriqué : une lanière de 100 × 20 m, un carré,
//  une équerre, une parcelle sans contour (au nom piégé), une arrachée. Lit sur le texte la carte du jour de l'Accueil (les
//  rangs par-dessus la forme, une seule copie de leur dessin), la feuille, l'aide, le guide, les nouveautés et la liste.
//    node scripts/mv-harnais-cartedom2.mjs [--contre]
// ══════════════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RAC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const L = f => fs.readFileSync(path.join(RAC, f), 'utf8');
const CONTRE = process.argv.includes('--contre');
const S0 = { uti: L('src/utils.js'), wn: L('src/whats-new.js'), app: L('src/app.js'), jal: L('src/jalons.js'), css: L('src/styles.css'),
  guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
const blocDe = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + a); return s.slice(i, j); };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
// Des contours [lat, lng] à la latitude de Gevrey, en mètres vers l'est (x) et vers le nord (y), fermés comme dans un KML.
const LAT0 = 47.2265, LNG0 = 4.9655, KX = 111320 * Math.cos(LAT0 * Math.PI / 180);
const pt = (x, y) => [LAT0 + y / 110540, LNG0 + x / KX];
const rect = (w, h, x = 0, y = 0) => [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h), pt(x, y)];
const equerre = () => [pt(0, 0), pt(60, 0), pt(60, 15), pt(15, 15), pt(15, 60), pt(0, 60), pt(0, 0)];
const KML = [{ name: 'La Lanière', pts: rect(100, 20, 0, 4000) }, { name: 'le carré', pts: rect(50, 50, 800, 0) },
  { name: 'L’Équerre', pts: equerre() }, { name: 'La Vieille', pts: rect(40, 40, 300, 2000) }];
const PARCS = [{ nom: 'La Lanière', surface: '0,2', statut: 'Active' }, { nom: 'Le Carré', surface: '0,25', statut: 'Active' },
  { nom: 'L’Équerre', surface: '0,1575', statut: 'Active' }, { nom: 'Sans <Contour>', surface: '0,1', statut: 'Active' },
  { nom: 'La Vieille', surface: '0,16', statut: 'Arrachee' }];
const v = (parcelle, tache, date) => ({ parcelle, tache, date, statut: 'Validé', qui: 'Paul' });
// Passages de Paul depuis le 10/09 : la Lanière 4 (le plus), le Carré 2, l'Équerre 1, « Sans <Contour> » aucun.
const JOUR = [v('La Lanière', 'Vendange', '2026-09-12'), v('La Lanière', 'Prétaille', '2026-10-20'), v('La Lanière', 'Labour', '2026-10-10'),
  v('La Lanière', 'Plantation', '2026-10-05'), v('Le Carré', 'Vendange', '2026-09-14'), v('Le Carré', 'Prétaille', '2026-10-21'),
  v('L’Équerre', 'Vendange', '2026-09-15'), v('La Vieille', 'Arrachage', '2026-09-20'), v('Le Carré', 'Taille', '2026-03-02')];
const ORDRE = ['La Lanière', 'Le Carré', 'L’Équerre', 'Sans <Contour>'], NIV = [3, 2, 1, 0];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function section(S, o) {
  o = o || {};
  const ctx = { Math, Object, String, Array, Number, isFinite, JSON, Date, parseFloat, parseInt, KML_POLYGONS_DYNAMIC: o.kml || KML,
    PARCELLES: o.parcs || PARCS, JOURNAL: JOUR, SAISONS: [{ nom: '2026-2027', debut: '2026-09-10', active: true }],
    currentUser: o.sansUser ? null : { nom: 'Paul' }, _escHtml: esc, _escAttr: esc };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(blocDe(S.uti, "/* ★ FORME-1 (§301) — LA FORME D'UNE PARCELLE", '/* ★ FIN FORME-1 */'), ctx);
  if (!o.sansApp) vm.runInContext(fonction(S.app, 'function _homeForme(f,r){') + '\n' + fonction(S.app, 'function _homeRangs(fo,fw){')
    + '\nwindow._homeForme = _homeForme; window._homeRangs = _homeRangs;', ctx);
  vm.runInContext(blocDe(S.jal, '// ── JALONS-1 : début du bloc exécutable', '// ── JALONS-1 : fin du bloc exécutable') + '\n'
    + fonction(S.jal, 'function _mvJalEnc(x) {') + '\n' + fonction(S.jal, 'function _mvCarteDomaineSection() {') + '\nwindow._sec = _mvCarteDomaineSection;', ctx);
  return ctx._sec();
}
const tuiles = h => [...String(h).matchAll(/<button type="button" class="mtr-cd-p([^"]*)" style="([^"]*)" data-nom="([^"]*)" title="([^"]*)" aria-label="([^"]*)" onclick="([^"]*)">([\s\S]*?)<\/button>/g)]
  .map(m => ({ cls: m[1], style: m[2], nom: m[3], title: m[4], aria: m[5], onclick: m[6], corps: m[7] }));
const num = (st, k) => { const m = new RegExp('--' + k + ':([\\d.]+)').exec(st || ''); return m ? +m[1] : NaN; };

function controles(S) {
  const r = [];
  const T = (nom, f) => { let ok = false, d = ''; try { const x = f(); ok = x === true || (x && x.ok === true); if (x && x.d) d = x.d; } catch (e) { d = 'plantage : ' + String(e && e.message).slice(0, 120); } r.push([nom, ok, d]); };
  let H = ''; try { H = section(S); } catch (e) { H = ''; r.push(['la carte se dessine', false, 'plantage : ' + String(e && e.message).slice(0, 120)]); }
  const tu = tuiles(H);
  T('une tuile par parcelle en vigne (l’arrachée n’y est pas) ; « 3 parcelles sur 4 »', () => ({ ok: tu.length === 4 && !/La Vieille/.test(H) && /<b>3<\/b> parcelles sur 4 depuis le 10\/09\/2026/.test(H), d: tu.length + ' tuiles' }));
  T('la plus parcourue d’abord : Lanière (4), Carré (2), Équerre (1), sans contour (0)', () => ({ ok: tu.map(t => t.nom).join('|') === ORDRE.map(esc).join('|'), d: tu.map(t => t.nom).join('|') }));
  T('les teintes : cd-n3, cd-n2, cd-n1, cd-n0 dans cet ordre', () => tu.length === 4 && tu.every((t, i) => new RegExp('(^| )cd-n' + NIV[i] + '( |$)').test(t.cls.trim())));
  T('chaque parcelle à sa forme : la lanière de 100 × 20 m garde ses proportions (largeur cinq fois la hauteur)', () => {
    const t = tu[0]; if (!t || !/mtr-cd-fo/.test(t.cls)) return false; const q = num(t.style, 'fw') / num(t.style, 'fh');
    const vb = /<svg viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(t.corps) || [];   // en mètres, arrondis au décimètre par _homeForme
    return { ok: Math.abs(q - 5) < 0.1 && Math.abs(+vb[1] - 100) < 0.3 && Math.abs(+vb[2] - 20) < 0.3, d: 'rapport ' + q.toFixed(3) + ', viewBox ' + vb.slice(1).join(' × ') };
  });
  T('la taille suit la surface déclarée : le Carré (0,25 ha, la plus grande) a la plus grande aire', () => {
    const a = t => num(t.style, 'fw') * num(t.style, 'fh'); return tu.length === 4 && a(tu[1]) > a(tu[0]) && a(tu[1]) > a(tu[2]) && Math.abs(a(tu[1]) - 0.625) < 0.01;
  });
  T('les rangs PAR-DESSUS la forme, coupés au contour (équerre : 15 m de haut à droite de x = 15)', () => {
    const okOrdre = tu.filter(t => /mtr-cd-fo/.test(t.cls)).every(t => { const p = t.corps.indexOf('<path d="'), g = t.corps.indexOf('<g class="mtr-cd-rg">'); return p >= 0 && g > p; });
    const eq = tu[2] ? tu[2].corps : '', L2 = [...eq.matchAll(/x1="([\d.]+)" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/g)].map(l => [+l[1], +l[2], +l[3]]);
    return { ok: okOrdre && L2.length > 5 && L2.every(l => l[1] >= 0 && l[2] <= 60.01) && L2.filter(l => l[0] > 15.5).every(l => l[2] - l[1] <= 15.01) && L2.some(l => l[0] < 15 && l[2] - l[1] > 59), d: L2.length + ' rangs' };
  });
  T('sans contour : le rectangle de sa surface, en pointillé, et le titre le dit ; le nom échappé', () => {
    const t = tu[3]; return !!t && /mtr-cd-sans/.test(t.cls) && !/mtr-cd-fo/.test(t.cls) && !/<svg/.test(t.corps) && Math.abs(num(t.style, 's') - Math.sqrt(0.4)) < 0.002
      && t.nom === 'Sans &lt;Contour&gt;' && /pas de contour enregistré/.test(t.title) && !/<Contour>/.test(H);
  });
  T('chaque tuile ouvre SA fiche (openDP), et dit ses passages', () => tu.length === 4 && tu.every(t => t.onclick === 'openDP(this.dataset.nom)')
    && tu[0].aria === 'La Lanière — 4 passages' && tu[2].aria === 'L’Équerre — 1 passage' && /aucun passage/.test(tu[3].aria));
  T('ni undefined, ni NaN ; les boutons et les blocs sont fermés, aucun <div> dans un bouton', () => {
    const o = (H.match(/<div[ >]/g) || []).length, f = (H.match(/<\/div>/g) || []).length, bo = (H.match(/<button[ >]/g) || []).length, bf = (H.match(/<\/button>/g) || []).length;
    return { ok: !/undefined|NaN/.test(H) && o === f && bo === bf && !tu.some(t => /<div/.test(t.corps)), d: o + '/' + f + ' div, ' + bo + '/' + bf + ' boutons' };
  });
  T('la légende : aucun, 1, 2 à 3, 4 et plus', () => /<i class="cd-n0"><\/i>aucun<\/span><span><i class="cd-n1"><\/i>1<\/span><span><i class="cd-n2"><\/i>2 à 3<\/span><span><i class="cd-n3"><\/i>4 et plus/.test(H));
  T('un domaine sans aucun contour : des rectangles pleins, pas de pointillé', () => { const h2 = section(S, { kml: [] }), t2 = tuiles(h2); return t2.length === 4 && !/mtr-cd-sans|mtr-cd-fo|<svg/.test(h2); });
  T('sans les fonctions de l’Accueil : la carte se dessine quand même, en rectangles', () => { const t3 = tuiles(section(S, { sansApp: true })); return t3.length === 4 && t3.every(t => !/mtr-cd-fo/.test(t.cls)); });
  T('sans personne connectée, ou sans parcelle en vigne : pas de carte', () => section(S, { sansUser: true }) === '' && section(S, { parcs: [{ nom: 'X', surface: '1', statut: 'Arrachee' }] }) === '');
  // L'Accueil : la même forme, les mêmes rangs, dans le même ordre ; une seule copie de leur dessin.
  T('la carte du jour : les rangs par-dessus la forme (dessous, sa couleur les cachait depuis ACCV-1)', () => /<path d="'\+f\.d\+'"\/>'\+rangs\(fo,f\.fw\)\+'<\/svg>'/.test(S.app) && !/'\+rangs\(fo,f\.fw\)\+'<path d="/.test(S.app));
  T('une seule copie du dessin des rangs : _homeRangs (app.js), lue par l’Accueil et par jalons.js', () => {
    const boucle = 'for(var m=0;m+1<ys.length;m+=2)';
    return S.app.split(boucle).length === 2 && !/ys\.sort/.test(S.jal) && /function _homeRangs\(fo,fw\)\{/.test(S.app) && /window\._homeRangs=_homeRangs;/.test(S.app) && /window\._homeForme=_homeForme;/.test(S.app)
      && /typeof _homeRangs==='function'\)\?_homeRangs\(fo,fw\)/.test(S.app) && /window\._homeRangs === 'function'/.test(S.jal);
  });
  // La feuille, l'aide, le guide, les nouveautés, la liste.
  T('la feuille : par jetons seulement, quatre teintes de forme, les rangs, la légende', () => {
    const b = blocDe(S.css, '/* CARTEDOM-1 (§350)', '/* SAISONIMG-1 (§351)');
    return !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(b.replace(/\/\*[\s\S]*?\*\//g, '')) && [0, 1, 2, 3].every(k => b.includes('.mtr-cd-fo.cd-n' + k + ' path{fill:')) && /\.mtr-cd-rg line\{/.test(b)
      && [1, 2, 3].every(k => b.includes('.mtr-cd-leg i.cd-n' + k + '{')) && /calc\(var\(--h-row-2\) \* 1\.4 \* var\(--fw\)\)/.test(b) && !/\.mtr-cd-svg/.test(b);
  });
  T('l’aide, le guide et les nouveautés disent la mosaïque et la fiche', () => {
    const aide = (/\['La carte de votre saison', "([^"]*)"\]/.exec(S.uti) || [])[1] || '';
    return /mosaïque/.test(aide) && /ouvre sa fiche/.test(aide) && /La carte de votre saison »<\/b> montre vos parcelles en mosaïque/.test(S.guide)
      && /v: '10\.42'[\s\S]{0,200}La carte de votre saison se lit enfin/.test(S.wn) && /Les rangs se voient dans la carte du jour/.test(S.wn);
  });
  T('la liste des contrôles joue ce harnais et sa contre-épreuve', () => S.liste.includes("['node scripts/mv-harnais-cartedom2.mjs', 'premieres-fois']") && S.liste.includes("['node scripts/mv-harnais-cartedom2.mjs --contre', 'premieres-fois']"));
  return r;
}

let ok = 0, ko = 0;
const t = (x, c, d) => { if (c) { ok++; if (!CONTRE) console.log('  \x1b[32m✓\x1b[0m ' + x); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + x + (d ? '\n      → ' + d : '')); } };
if (!CONTRE) {
  console.log('\n── CARTEDOM-2 — « La carte de votre saison » en mosaïque\n');
  for (const [x, c, d] of controles(S0)) t(x, c, d);
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
console.log('\n── CARTEDOM-2 — contre-épreuve\n');
const mut = (k, a, b) => { const S = { ...S0 }; S[k] = S0[k].replace(a, b); return S[k] === S0[k] ? null : S; };
const essais = [
  ['les rangs repassés sous la forme, dans « Ma trace »', mut('jal', `<path d="' + f.d + '"/>' + (rg ? '<g class="mtr-cd-rg">' + rg + '</g>' : '') + '</svg>'`, `' + (rg ? '<g class="mtr-cd-rg">' + rg + '</g>' : '') + '<path d="' + f.d + '"/></svg>'`), 'les rangs PAR-DESSUS'],
  ['les rangs repassés sous la forme, sur l’Accueil', mut('app', `<path d="'+f.d+'"/>'+rangs(fo,f.fw)+'</svg>'`, `'+rangs(fo,f.fw)+'<path d="'+f.d+'"/></svg>'`), 'la carte du jour'],
  ['le tri par passages retiré', mut('jal', 'return (b.n - a.n) || (b.surface - a.surface) || ', 'return '), 'la plus parcourue'],
  ['la tuile qui n’ouvre plus la fiche', mut('jal', `onclick="openDP(this.dataset.nom)"`, `onclick="openSelParc(this.dataset.nom)"`), 'chaque tuile ouvre'],
  ['le nom posé sans échappement', mut('jal', `' data-nom="' + escA(z.nom) + '"`, `' data-nom="' + z.nom + '"`), 'sans contour'],
  ['une parcelle arrachée dessinée', mut('jal', "return p && p.nom && p.statut !== 'Arrachee'; })", 'return p && p.nom; })'), 'une tuile par parcelle'],
  ['une couleur écrite en dur dans la feuille', mut('css', '.mtr-cd-fo.cd-n3 path{fill:var(--or);', '.mtr-cd-fo.cd-n3 path{fill:#C2A14D;'), 'la feuille'],
  ['une seconde copie du dessin des rangs', mut('jal', 'function _mvCarteDomaineSection() {', 'function _zz(ys){ ys.sort(); }\nfunction _mvCarteDomaineSection() {'), 'une seule copie'],
];
let rates = 0;
for (const [x, S, cible] of essais) {
  if (!S) { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — défaut non posé (motif introuvable)'); continue; }
  let vu; try { vu = controles(S).some(([y, c]) => y.startsWith(cible) && !c); } catch (e) { vu = false; console.log('      (plantage : ' + String(e && e.message).slice(0, 80) + ')'); }
  if (vu) console.log('  \x1b[32m✓\x1b[0m ' + x); else { rates++; console.log('  \x1b[31m✗\x1b[0m ' + x + ' — non vu'); }
}
console.log(`\n  ${essais.length - rates} contre-épreuve(s) tenue(s) sur ${essais.length}\n`); process.exit(rates ? 1 : 0);
