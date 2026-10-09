// HARNAIS — COQ-1 + PAL-1 (§268) : la barre latérale et la recherche Ctrl K, sur ordinateur.
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { coq: L('src/coquille.js'), app: L('src/app.js'), css: L('src/styles.css') };
function monde(S) { const ctx = { Math, String, Array, Object, JSON, Number, matchMedia: () => ({ matches: true, addEventListener() {} }), document: { addEventListener() {} }, localStorage: { getItem: () => null } };
  ctx.window = ctx; ctx._mvIcon = n => '<svg data-ic="' + n + '"></svg>'; vm.createContext(ctx); vm.runInContext(S.coq, ctx); return ctx; }
const ITEMS = [{ p: 'pilotage', ic: 'graphique', l: 'Pilotage' }, { p: 'home', ic: 'feuille', l: 'Vigne' }, { p: 'tracteur', ic: 'tracteur', l: 'Tracteur' }, { p: 'planning', ic: 'calendrier', l: 'Planning' }, { p: 'reglages', ic: 'curseurs', l: 'Réglages' }];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const W = monde(S);
  const rub = W._railRubriques(ITEMS);
  T('les entrées du dock, rangées en rubriques, dans l’ordre du dock', rub.map(r => r.nom).join() === 'Terrain,Organisation,Gestion' && rub[2].items.map(x => x.p).join() === 'pilotage,reglages');
  const h = W._railHtml(ITEMS, { nom: '<b>Nico', ini: 'N', role: 'Administration' }, { nom: 'Marchand-Grillot', sous: '11,76 ha' });
  T('la barre : recherche, entrées avec leur icône, domaine, personne (noms échappés)', h.includes('id="mv-rail-cherche"') && h.includes('data-page="planning"') && h.includes('data-ic="calendrier"') && !h.includes('<b>Nico') && h.includes('&lt;b&gt;Nico'));
  const E = W._palEntrees(ITEMS, [{ nom: 'Les Crais 1', surface: .41, appellation: 'Gevrey' }, { nom: 'Clos des Crais', surface: .2 }]);
  T('la recherche connaît les écrans, les onglets du Pilotage et les parcelles', E.some(x => x.g === 'Aller à' && x.t === 'Planning')   /* COQ-2 (§271) : groupes de la maquette v2 */ && E.some(x => x.go.tab === 'eco') && E.some(x => x.go.parc === 'Les Crais 1'));
  const r = W._palTrier(E, 'crai');
  T('le titre qui commence par la recherche passe avant celui qui la contient (accents ignorés)', r[0].t === 'Les Crais 1' || r[0].t === 'Clos des Crais') ;
  T('… et « écon » trouve l’onglet Économie', W._palTrier(E, 'écon').some(x => x.go.tab === 'eco'));
  T('sans saisie : les écrans et onglets, pas toutes les parcelles', W._palTrier(W._palEntrees(ITEMS.filter(x => x.p !== 'pilotage'), [{ nom: 'P1' }, { nom: 'P2' }]), '').every(x => x.g !== 'Parcelles'));
  T('app.js : la barre se construit avec le dock et suit l’écran actif ; le module est importé',
    S.app.includes('if(window._railBuild) window._railBuild();   // COQ-1') && S.app.includes('if(window._railSync) window._railSync(page);') && S.app.includes('window._dockDef=_dockDef;') && S.app.includes("import './coquille.js';"));
  T('ordinateur seulement : à partir de 1 024 px la barre remplace le dock ; Ctrl K sur ordinateur, une fois connecté',
    /@media\(min-width:1024px\)\{\s*body\.mv-avec-rail \.mv-rail\{display:flex\}\s*body\.mv-avec-rail #mv-dock/.test(S.css) && S.coq.includes("if (!MQ_PC.matches || !window.currentUser) return;"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [['les noms non échappés', 'coq', "esc(moi.nom) + '</b><small>'", "moi.nom + '</b><small>'"],
    ['toutes les parcelles sans saisie', 'coq', "entrees.filter(x => x.g === 'Actions').slice(0, 1).concat(entrees.filter(x => x.g === 'Aller à' && !x.s))", 'entrees'],
    ['Ctrl K sur téléphone', 'coq', "if (!MQ_PC.matches || !window.currentUser) return;", "if (!window.currentUser) return;"],
    ['la barre qui ne suit plus l’écran actif', 'app', "if(window._railSync) window._railSync(page);", ""]];
  let m = 0; DEF.forEach(([nom, f, a, b]) => { const S = Object.assign({}, SRC0); if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom); m++; return; } S[f] = S[f].replace(a, b); const rouge = jouer(S).some(x => !x[1]); if (!rouge) m++; console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom); });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
