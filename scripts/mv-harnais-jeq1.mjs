// HARNAIS — JEQ-1 (§421) : les listes « qui a travaillé » ne proposent que les personnes sous contrat ce jour-là ; la correction
//   d'équipe du Journal se lit (les cochés en vert) ; le compteur de la barre au jeu commun (CHARTE-4), à sa place, son libellé accordé.
//   node scripts/mv-harnais-jeq1.mjs           → doit être vert
//   node scripts/mv-harnais-jeq1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue les VRAIES fonctions (extraites par leurs accolades) : _mvEnContratLe, _mvSansDateContrat, _mvCompteSansDate (utils.js) ;
// _mvEquipeProposee, _mvEqMembres, _eqtClean, _buildMembresCheckboxes, _mvMembresDate, _jFaitPar, _jEqCibles, openJEquipe, _jEqBasc
// (app.js) ; coquille.js entier dans un vm (_railHtml, _railAlertesMaj). Les périodes de contrat viennent d'un faux _mvContrats qui
// LIT la fiche (son champ __per) : il ne répond pas la même chose à tout le monde (§6b, « un stub qui ignore ses arguments ment »).
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8').replace(/\r\n/g, '\n');
const S0 = { app: L('src/app.js'), uti: L('src/utils.js'), coq: L('src/coquille.js'), css: L('src/styles.css'), g1: L('guide/01-demarrer.html'), g4: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function jouer(code, ctx) { const px = new Proxy(ctx, { has: () => true, get: (t, k) => (k in t ? t[k] : (k === Symbol.unscopables ? undefined : (k in globalThis ? globalThis[k] : () => ''))) }); return new Function('__c', 'with(__c){' + code + '}')(px); }
const AUJ = '2026-10-21';
const MEMBRES = () => [
  { nom: 'Victor', statut: 'Actif', __per: [] },                                            // CDI sans date, actif
  { nom: 'Shana', statut: 'Actif', __per: [{ debut: '2026-10-01', fin: '2027-03-31' }] },   // contrat d'hiver en cours
  { nom: 'Dessi', statut: 'Actif', __per: [{ debut: '2026-08-01', fin: '2026-09-30' }] },   // CDD fini, fiche jamais passée Inactive
  { nom: 'Matheo', statut: 'Inactif', __per: [{ debut: '2026-08-01', fin: '2026-09-30' }] },// CDD fini, fiche Inactive
  { nom: 'Kenza', statut: 'Inactif', __per: [] },                                           // Inactive sans date ni heure
  { nom: 'Futur', statut: 'Actif', __per: [{ debut: '2026-11-02', fin: '' }] },             // pas encore arrivé
  { nom: 'Chloe', statut: 'Actif', bureau: true, __per: [] },                               // le bureau
  { nom: 'Nico', statut: 'Actif', __per: [] }];
function monde(S, extra) {
  const ctx = Object.assign({ MEMBRES: MEMBRES(), PLANNING_ENTRIES: {}, JOURNAL: [], currentUser: { nom: 'Nico' }, _mvToday: () => AUJ, _escHtml: esc, _escAttr: esc,
    isAdmin: () => true, _mvMoiAdmin: () => false, _mvQuiHors: () => false, tNom: n => n, fmtDate: d => d, _mvContrats: m => (m && m.__per) || [] }, extra || {});
  ctx.window = ctx;
  const uti = ['window._mvSansDateContrat = function', 'window._mvCompteSansDate = function', 'window._mvEnContratLe = function'].map(f => fonction(S.uti, f)).join(';\n');
  const app = ['function _mvEquipeProposee(', 'function _mvEqMembres(', 'function _eqtClean(', 'function _buildMembresCheckboxes(', 'function _getSelectedMembres(',
    'function _mvMembresDate(', 'function _jFaitPar(', 'function _jEqCibles(', 'function openJEquipe(', 'function _jEqBasc('].map(f => fonction(S.app, f)).join('\n');
  jouer(uti + ';\n' + app + '\nObject.assign(window,{_mvEquipeProposee,_mvEqMembres,_eqtClean,_buildMembresCheckboxes,_mvMembresDate,openJEquipe,_jEqBasc});', ctx);
  return ctx;
}
function el(id, extra) { return Object.assign({ id, innerHTML: '', textContent: '', value: '', style: {}, attrs: {}, ecoutes: 0, checked: false, classList: { add() {}, remove() {} },
  setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; }, addEventListener() { this.ecoutes++; } }, extra || {}); }
function puce() { const c = new Set(); return { attrs: {}, classList: { contains: k => c.has(k), toggle: (k, f) => { const on = f === undefined ? !c.has(k) : !!f; on ? c.add(k) : c.delete(k); return on; }, has: () => [...c].sort().join(' ') },
  setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; } }; }
const noms = ms => ms.map(m => m.nom).join(',');
function coquille(S, opts) {
  const ctx = { Math, String, Array, Object, JSON, Number, Date, setTimeout: () => 0, clearTimeout: () => 0, requestAnimationFrame: () => 0,
    matchMedia: () => ({ matches: true, addEventListener() {} }), document: { addEventListener() {}, querySelectorAll: () => [], getElementById: () => null }, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window = ctx; Object.assign(ctx, opts || {}); vm.createContext(ctx); vm.runInContext(S.coq, ctx); return ctx;
}
function suite(S) {
  const out = []; const T = (id, n, c) => out.push([id, n, !!c]);
  // A. la règle commune
  let a1 = false, a2 = false, a3 = false;
  try { const W = monde(S); a1 = noms(W._mvEquipeProposee('2026-10-19')) === 'Victor,Shana,Chloe,Nico'; a2 = noms(W._mvEquipeProposee('2026-09-15')) === 'Victor,Dessi,Matheo,Chloe,Nico';
    a3 = noms(W._mvEquipeProposee()) === 'Victor,Shana,Chloe,Nico' && noms(W._mvEqMembres()) === 'Victor,Shana,Nico'; } catch (e) { /* une plante = rouge */ }
  T('A1', 'un CDD fini, une fiche Inactive, un contrat pas commencé ne sont pas proposés le 19/10', a1);
  T('A2', 'un jour passé : qui était sous contrat ce jour-là, même passé Inactif depuis', a2);
  T('A3', 'aujourd’hui par défaut ; les équipes du jour gardent le bureau à part', a3);
  // B. la correction du Journal
  let b1 = false, b2 = false;
  try { const els = {}; const g = id => (els[id] = els[id] || el(id)); const W = monde(S, { document: { getElementById: g } });
    W.JOURNAL.push({ id: 'j1', date: '2026-10-19', tache: 'Arrachage', parcelle: 'Bras', qui: 'Nico', statut: 'Validé', membresEquipe: ['Victor', 'Dessi'], quiHors: true });
    W.openJEquipe('j1'); const h = g('jeq-pick').innerHTML, ordre = [...h.matchAll(/data-jeq-n="([^"]+)"/g)].map(m => m[1]).join(',');
    const bout = n => (h.split('data-jeq-n="' + n + '"')[0].split('<button').pop()) || '';
    b1 = ordre === 'Victor,Shana,Chloe,Nico,Dessi' && !/Matheo|Kenza|Futur/.test(h);
    b2 = /class="pchk mbr-chk sel vert" aria-pressed="true" $/.test(bout('Victor')) && /sel vert" aria-pressed="true" $/.test(bout('Dessi')) && /class="pchk mbr-chk" aria-pressed="false" $/.test(bout('Shana')) && h.includes('Nico <small>(a valid'); } catch (e) { /* rouge */ }
  T('B1', 'la correction propose les présents du 19/10, puis les déjà notés hors contrat (Dessi) ; ni Matheo, ni Kenza, ni Futur', b1);
  T('B2', 'les cochés portent leur teinte (« sel vert ») et aria-pressed ; l’auteur décoché reste visible', b2);
  let c1 = false;
  try { const W = monde(S), p = puce(); W._jEqBasc(p); const un = p.classList.has() === 'sel vert' && p.attrs['aria-pressed'] === 'true'; W._jEqBasc(p); c1 = un && p.classList.has() === '' && p.attrs['aria-pressed'] === 'false'; } catch (e) { /* rouge */ }
  T('C1', 'la bascule coche et teinte ensemble, et le dit (aria-pressed)', c1);
  // D. la feuille de validation : sa date décide
  let d1 = false, d2 = false;
  try { const els = {}; const g = id => (els[id] = els[id] || el(id)); const W = monde(S, { document: { getElementById: g } });
    g('vp-date').value = '2026-09-15'; W._buildMembresCheckboxes('vp-membres-pick', 'Bras', false); const h1 = g('vp-membres-pick').innerHTML;
    g('vp-date').value = ''; W._buildMembresCheckboxes('vp-membres-pick', 'Bras', false); const h2 = g('vp-membres-pick').innerHTML;
    W._buildMembresCheckboxes('vp-membres-pick', 'Bras', false, ['Dessi']); const h3 = g('vp-membres-pick').innerHTML;
    d1 = /data-nom="Dessi"/.test(h1) && /data-nom="Matheo"/.test(h1) && !/data-nom="Shana"/.test(h1) && /data-nom="Shana"/.test(h2) && !/data-nom="Dessi"/.test(h2) && !/data-nom="Nico"/.test(h2);
    d2 = /class="pchk mbr-chk sel vert" data-nom="Dessi"/.test(h3) && /class="pchk mbr-chk" data-nom="Shana"/.test(h3) && g('vp-date').ecoutes === 1 && g('vp-membres-pick').attrs['data-exclu'] === 'Bras'; } catch (e) { /* rouge */ }
  T('D1', 'la feuille propose selon SA date (le 15/09 : Dessi et Matheo ; aujourd’hui : Shana) ; le validateur n’y est pas', d1);
  T('D2', 'changer la date garde les cochés, même hors contrat ; la date n’est écoutée qu’une fois', d2);
  let e1 = false; try { e1 = monde(S)._eqtClean(['Victor', 'Dessi', 'Kenza', 'Shana']).join() === 'Victor,Shana'; } catch (e) { /* rouge */ }
  T('E1', 'l’équipe retenue de la barre perd un contrat fini (sinon cochée sans être visible)', e1);
  T('E2', 'la fenêtre « Changer » de la barre propose par la même règle', fonction(S.app, 'function _pvBuildTeamPick(').includes('_mvEquipeProposee().filter(function(m){return m.nom!==me;})'));
  // F. la feuille de style
  const regles = [...S.css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }));
  const badge = regles.filter(r => /\.mv-rail-badge(?![\w-])/.test(r.sel)), point = regles.filter(r => /\.mv-rail-point(?![\w-])/.test(r.sel));
  T('F1', 'une pastille cochée se voit même sans sa teinte (.pchk.sel peint)', regles.some(r => r.sel === '.pchk.sel' && /background:var\(--vert-pale\)/.test(r.decl)));
  T('F2', 'le compteur de la barre ne se peint plus lui-même et n’est plus posé au pixel', badge.length >= 2 && badge.every(r => !/(^|;)\s*(background|color|border|box-shadow|top|left|position)\s*:/.test(r.decl)));
  T('F3', 'barre dépliée : au bout de la ligne ; barre repliée : caché (le point le remplace)', badge.some(r => /body\.mv-rail-ouvert/.test(r.sel) && /margin-left:auto/.test(r.decl)) && badge.some(r => /body:not\(\.mv-rail-ouvert\)/.test(r.sel) && /display:none/.test(r.decl)));
  T('F4', 'le point de la barre repliée : jetons de la charte, aucune couleur écrite', point.some(r => /background:var\(--accent-texte\)/.test(r.decl)) && point.every(r => !/#[0-9a-fA-F]{3,8}\b/.test(r.decl)) && point.some(r => /body\.mv-rail-ouvert/.test(r.sel) && /display:none/.test(r.decl)));
  T('F5', 'un seul point par icône : le point « en direct » s’efface devant l’alerte, barre repliée', regles.some(r => /body:not\(\.mv-rail-ouvert\) \.mv-rail \.mv-rail-alerte \.mv-rail-vif/.test(r.sel) && /display:none/.test(r.decl)));
  // G. la barre, jouée
  let g1 = false, g2 = false;
  try { const C = coquille(S); const h = C._railHtml([{ p: 'pilotage', l: 'Pilotage', ic: 'x', n: 2 }, { p: 'planning', l: 'Planning', ic: 'x', n: 1 }, { p: 'tracteur', l: 'Tracteur', ic: 'x', n: 2 }, { p: 'cave', l: 'Cave', ic: 'x', n: 12 }], { nom: 'Nico', ini: 'N', role: 'Administration' }, { nom: 'Dom', sous: '' });
    g1 = (h.match(/class="mv-rail-badge mvpas-compteur"/g) || []).length === 4 && (h.match(/class="mv-rail-point" aria-hidden="true"/g) || []).length === 4
      && h.includes('aria-label="2 points à anticiper"') && h.includes('aria-label="1 contrat qui finit dans le mois"') && h.includes('aria-label="2 engins en réparation"') && h.includes('aria-label="12 à faire en cave"') && h.includes('>9+</span>') && !/savoirs|moiss|réparations/.test(h);
    const vieux = () => ({ ote: false, remove() { this.ote = true; } }); const o1 = vieux(), o2 = vieux(), o3 = vieux();
    const bouton = (p, l, anciens) => { const b = puce(); Object.assign(b.attrs, { 'data-page': p, 'aria-label': l, 'data-tip': l }); b.html = ''; b.querySelector = s => (s === '.mv-rail-lbl' ? { textContent: l } : null); b.querySelectorAll = () => anciens; b.insertAdjacentHTML = (w, x) => { b.html += x; }; return b; };
    const bp = bouton('pilotage', 'Pilotage', [o1, o2]), bc = bouton('cave', 'Cave', [o3]); C.document.querySelectorAll = s => (s === '#mv-rail .mv-rail-b' ? [bp, bc] : []); C._railAlertes = () => ({ pilotage: 2 }); C._railAlertesMaj();
    g2 = bp.attrs['data-tip'] === 'Pilotage · 2 points à anticiper' && bp.attrs['aria-label'] === 'Pilotage · 2 points à anticiper' && bp.classList.contains('mv-rail-alerte') && bp.html.includes('mvpas-compteur') && o1.ote && o2.ote
      && bc.attrs['data-tip'] === 'Cave' && !bc.classList.contains('mv-rail-alerte') && bc.html === '' && o3.ote; } catch (e) { /* rouge */ }
  T('G1', 'le compteur prend la pièce neutre du jeu, suivi de son point ; libellés accordés ; 9+ au-delà', g1);
  T('G2', 'barre repliée : l’infobulle et le nom du bouton disent le nombre ; rien à signaler, rien de collé', g2);
  // H. ce que l'appli raconte
  T('H1', 'la nouveauté 9.81, l’aide et le guide le disent', /export const WHATS_NEW = \[\n  \{ v: '9\.81', d: '2026-10-21', items: \[/.test(S.uti) && S.uti.includes('La liste propose les personnes sous contrat le jour de l’entrée, plus celles déjà notées')
    && S.uti.includes('Un petit compteur au bout d’une entrée signale ce qui attend') && S.g4.includes("La liste propose les personnes sous contrat le jour de l'entrée") && S.g1.includes("Un petit compteur au bout d'une entrée signale ce qui attend") && !S.g1.includes('Une pastille rouge sur une entrée'));
  T('H2', 'ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-jeq1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-jeq1.mjs --contre'],"));
  return out;
}
function lancer(S) { try { return suite(S); } catch (e) { return [['X', 'plantage : ' + (e && e.message), false]]; } }
const res = lancer(S0); let ko = 0;
res.forEach(([id, n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + id + ' · ' + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la règle ne lit plus que le statut', 'app', "return (typeof window._mvEnContratLe==='function')?window._mvEnContratLe(m,d):m.statut!=='Inactif';", "return m.statut!=='Inactif';", 'A1'],
    ['le statut d’aujourd’hui réécrit le passé', 'app', "if(m.statut==='Inactif'&&d>=auj) return false;", "if(m.statut==='Inactif') return false;", 'A2'],
    ['la correction relit les champs absents', 'app', "_mvEquipeProposee(e.date).forEach(function(m){ if(noms.indexOf(m.nom)<0) noms.push(m.nom); });", "(MEMBRES||[]).forEach(function(m){ if(m&&m.nom&&m.actif!==false&&!m.inactif&&noms.indexOf(m.nom)<0) noms.push(m.nom); });", 'B1'],
    ['la correction perd ceux déjà notés', 'app', "W.concat([e.qui]).forEach(function(n){", "[e.qui].forEach(function(n){", 'B1'],
    ['les cochés sans leur teinte', 'app', "class=\"pchk mbr-chk'+(on?' sel vert':'')+'\"", "class=\"pchk mbr-chk'+(on?' sel':'')+'\"", 'B2'],
    ['la bascule ne teinte plus', 'app', "el.classList.toggle('vert',on); el.setAttribute('aria-pressed'", "el.setAttribute('aria-pressed'", 'C1'],
    ['la feuille ignore sa date', 'app', "ds=(dEl&&dEl.value)||_mvToday();", "ds=_mvToday();", 'D1'],
    ['la feuille perd les cochés au changement de date', 'app', "(prop.indexOf(m)>=0||G.indexOf(m.nom)>=0)", "(prop.indexOf(m)>=0)", 'D2'],
    ['l’équipe retenue garde un contrat fini', 'app', "var P=_mvEquipeProposee(); return (Array.isArray(team)?team:[]).filter(function(n){ return P.some(function(m){ return m.nom===n; }); });", "return (Array.isArray(team)?team:[]).filter(function(n){return (MEMBRES||[]).some(function(m){return m.nom===n&&m.statut!=='Inactif';});});", 'E1'],
    ['« sel » seul ne peint plus', 'css', ".pchk.sel{border-color:var(--vert);background:var(--vert-pale);color:var(--vert);}\n", '', 'F1'],
    ['le compteur reposé au pixel', 'css', "body.mv-rail-ouvert .mv-rail .mv-rail-badge{flex:none;margin-left:auto}", "body.mv-rail-ouvert .mv-rail .mv-rail-badge{position:absolute;top:12px}", 'F2'],
    ['le rouge revenu dans le compteur', 'css', "body:not(.mv-rail-ouvert) .mv-rail .mv-rail-badge{display:none}", "body:not(.mv-rail-ouvert) .mv-rail .mv-rail-badge{display:none}\nbody .mv-rail .mv-rail-badge{ background:var(--danger); color:var(--sur-accent); }", 'F2'],
    ['deux points sur l’icône', 'css', "body:not(.mv-rail-ouvert) .mv-rail .mv-rail-alerte .mv-rail-vif{display:none}\n", '', 'F5'],
    ['le « s » recollé au bout de la phrase', 'coq', "return n + ' ' + L[n > 1 ? 1 : 0];", "return n + ' ' + L[0] + (n > 1 ? 's' : '');", 'G1'],
    ['l’infobulle sans le nombre', 'coq', "const dit = n > 0 ? nom + ' · ' + libelle(p, n) : nom;", "const dit = nom;", 'G2'],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-jeq1.mjs'],", '', 'H2']];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (S[f].split(de).length !== 2) { console.log('  !! MOTIF ' + (S[f].includes(de) ? 'NON UNIQUE' : 'ABSENT') + ' : ' + nom); return; }   // un motif répété muterait le mauvais endroit (vécu au premier passage)
    S[f] = S[f].replace(de, vers); const r = lancer(S), t = r.find(x => x[0] === cible), ok = !!t && !t[2];
    console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  process.exit(mord === DEF.length && !ko ? 0 : 1);
}
process.exit(ko ? 1 : 0);
