// HARNAIS — TRAC-1 (§282) : les sessions du Tracteur en liste + fiche (maquette v6), la feuille de travail inchangée.
//   node scripts/mv-harnais-trac1.mjs           → doit être vert
//   node scripts/mv-harnais-trac1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _trFicheHtml sur une fausse session : avancement, surface pondérée, parcelles, bouton selon le droit, noms échappés.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { tr: L('src/tracteur.js'), css: L('src/styles.css'), html: L('index.html'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ TRAC-1 (§282)'); if (i < 0) return ''; const j = css.indexOf('★ FIN TRAC-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function fiche(S, enCours, tractoriste, admin) {
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const s = { id: 's1', activite: 'Rognage <2>', date: '2026-10-08', conducteur: 'Paul', tracteurId: 't1', statut: enCours ? 'En cours' : 'Terminé', avancement: 40, parcellesFaites: ['A', { nom: 'B' }], parcellesSkip: ['D'], note: '' };
  const P = [{ nom: 'A', surface: '1' }, { nom: 'B', surface: '0.5' }, { nom: 'C', surface: '2' }, { nom: 'D', surface: '3' }, { nom: 'E', surface: '1', statut: 'Arrachee' }];
  const aux = ['function _chrMes(x){', 'function _chrNom(x){', 'function _chrSurf(nom){', 'function _sessBaremeMin(s,surface){', 'function _trMinutes(s){', 'function _trConsoLh(){', 'function _trHeuresFr(h){'].map((d) => fonction(S.tr, d)).join('\n');
  return new Function('PARCELLES', 'TRACTEURS_LIST', 'REPARATEUR', 'isTractoriste', 'isAdmin', '_escHtml', '_escAttr', '_mvBadge', '_sessDates', 'window', 'ACTIVITES',
    aux + '\n' + fonction(S.tr, 'function _trFicheHtml(s){') + '\nreturn _trFicheHtml(arguments[11]);')(P, [{ id: 't1', nom: 'John Deere' }], {}, () => tractoriste, () => admin, esc, esc, (t) => '[' + t + ']', () => '8 oct.', { _mvHaT: (x) => String(x).replace('.', ',') }, [], s);
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let a = '', b = '', c = ''; try { a = fiche(S, true, true, false); b = fiche(S, false, true, false); c = fiche(S, false, false, true); } catch (e) { a = 'plantage ' + e.message; }
  T('la fiche : activité (échappée), conducteur, tracteur, dates, état', a.includes('Rognage &lt;2&gt;') && !a.includes('Rognage <2>') && a.includes('Paul') && a.includes('John Deere') && a.includes('[En cours]'));
  T('surface faite pondérée (1,5 ha sur 3,5 ha, la parcelle désactivée et l’arrachée exclues), parcelles 2 sur 3', a.includes('1,5<small>\u00a0ha sur 3,5\u00a0ha') && a.includes('2<small>\u00a0sur 3</small>'));
  T('le bouton suit le droit : tractoriste sur une session en cours → « Enregistrer l’avancement » ; terminée sans être admin → rien ; admin → « Ouvrir la session »', a.includes('Enregistrer l\u2019avancement') && !b.includes('openSessionDetail') && c.includes('Ouvrir la session'));
  T('sur ordinateur, toucher une session la choisit ; au téléphone, elle ouvre toujours la feuille de travail', S.tr.includes("const clk=_trDesk()?`onclick=\"_trSel('${s.id}')\"") && S.tr.includes("function _trSel(id){\n  if(!_trDesk()){ openSessionDetail(id); return; }"));
  T('la fiche suit la liste affichée (et une liste vide montre l’invite)', S.tr.includes("if(_trDesk())_trFicheSync(dataEnc.concat(dataTer));   // TRAC-1 (§282)") && S.tr.includes("if(_trDesk())_trFicheSync([]);   // TRAC-1 (§282)"));
  T('la page a sa colonne de fiche, et _trSel est joignable', S.html.includes('<aside class="trf" id="trac-fiche"') && S.tr.includes('window._trSel=_trSel;'));
  T('le bloc TRAC-1 est posé après PLAN-3, par jetons seulement (' + dur.length + ')', B.length > 4000 && S.css.indexOf('★ TRAC-1 (§282)') > S.css.indexOf('★ FIN PLAN-3') && dur.length === 0);
  T('deux colonnes sur ordinateur, fiche collante ; l’invite au doigt cachée sur ordinateur', B.includes('#page-tracteur #trac-panel-sessions{ display:grid; grid-template-columns:minmax(0,1fr) var(--l-fiche,440px);') && B.includes('#page-tracteur .scard-enc-hint{ display:none!important; }'));
  T('la carte en cours lisible sur fond clair (date, conducteur, surface)', B.includes('#page-tracteur .sc-date{ color:var(--texte-doux)!important; }') && B.includes('#page-tracteur .sc-blbl span{ color:var(--texte-doux)!important; }'));
  T('l’aide et les nouveautés disent la fiche sur ordinateur', S.uti.includes("['Sur un ordinateur', \"toucher une session la choisit") && S.uti.includes("titre: 'Tracteur : les sessions en liste et fiche'"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-trac1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-trac1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['l’activité n’est plus échappée', 'tr', "<h2 class=\"trf-t\">'+_escHtml(s.activite)+'</h2>", "<h2 class=\"trf-t\">'+s.activite+'</h2>", 0],
    ['la parcelle désactivée compte dans la surface', 'tr', "var actives=PARCELLES.filter(function(p){return p.statut!=='Arrachee'&&skip.indexOf(p.nom)<0;});\n  var done=", "var actives=PARCELLES.filter(function(p){return p.statut!=='Arrachee';});\n  var done=", 1],
    ['le bouton s’affiche sans le droit', 'tr', "var isEnc=s.statut==='En cours', canOpen=(isTractoriste()&&isEnc)||isAdmin(),", "var isEnc=s.statut==='En cours', canOpen=true,", 2],
    ['au téléphone, toucher choisit au lieu d’ouvrir', 'tr', "  if(!_trDesk()){ openSessionDetail(id); return; }\n", '', 3],
    ['la fiche ne suit plus la liste', 'tr', "if(_trDesk())_trFicheSync(dataEnc.concat(dataTer));   // TRAC-1 (§282)", '', 4],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-tracteur .sc-date{ color:var(--texte-doux)!important; }', '#page-tracteur .sc-date{ color:#6E6C66!important; }', 6],
    ['l’invite au doigt reste sur ordinateur', 'css', '#page-tracteur .scard-enc-hint{ display:none!important; }', '', 7],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-trac1.mjs'],", '', 10]
  ];
  let mord = 0;
  DEF.forEach(([nom, f, de, vers, cible]) => {
    const S = Object.assign({}, S0); if (!S[f].includes(de)) { console.log('  !! MOTIF ABSENT : ' + nom); return; }
    S[f] = S[f].replace(de, vers); if (S[f] === S0[f]) { console.log('  !! MUTATION SANS EFFET : ' + nom); return; }
    const r = jouer(S), ok = r[cible] && !r[cible][1]; console.log((ok ? '  rougit  ' : '  NE MORD PAS  ') + nom); if (ok) mord++;
  });
  console.log('\n' + (mord === DEF.length ? 'CONTRE-ÉPREUVES VERTES' : 'CONTRE-ÉPREUVES ROUGES') + ' \u2014 ' + mord + '/' + DEF.length + ' défauts réinjectés');
  if (mord !== DEF.length) process.exit(1);
}
if (ko) process.exit(1);
