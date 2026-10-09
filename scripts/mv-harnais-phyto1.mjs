// HARNAIS — PHYTO-1 (§285) : le registre phyto en liste + fiche (maquette v7), les mentions que l'appli tient déjà, rien de plus.
//   node scripts/mv-harnais-phyto1.mjs           → doit être vert
//   node scripts/mv-harnais-phyto1.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE _phFicheHtml sur un faux traitement : mentions, délais calculés depuis la date, noms échappés, champs absents tus.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { tr: L('src/tracteur.js'), ph: L('src/phyto.js'), css: L('src/styles.css'), html: L('index.html'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ PHYTO-1 (§285)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PHYTO-1', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function fiche(S, t) {
  const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return new Function('TRAITEMENTS', 'window', 'dreEffectif', '_escHtml', '_fmtDate', fonction(S.tr, 'function _phFicheHtml(i){') + '\nreturn _phFicheHtml(0);')([t], {}, (d) => ({ h: Number(d) || 0, motif: '' }), esc, (d) => 'le ' + String(d).slice(0, 10));
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  const recent = new Date(Date.now() - 2 * 36e5).toISOString();
  let a = '', b = ''; try { a = fiche(S, { date: recent, produit: 'Bouillie <RSR>', type: 'Cuivre', amm: '9200417', dose: '4 kg/ha', dar: 21, drae: 24, parcelles: ['Les Seuvrées'], conducteur: 'Paul', cible: 'Mildiou', znt: 5 });
    b = fiche(S, { date: '2026-01-10', produit: 'Soufre', type: 'Soufre', dose: '', dar: 0, drae: 0, parcelles: [] }); } catch (e) { a = 'plantage ' + e.message; }
  T('les mentions : produit (échappé), type, AMM, date, opérateur, dose', a.includes('Bouillie &lt;RSR&gt;') && !a.includes('Bouillie <RSR>') && a.includes('>Cuivre<') && a.includes('AMM 9200417') && a.includes('le 20') && a.includes('>Paul<') && a.includes('4 kg/ha'));
  T('les délais depuis la date : réentrée 24 h en cours (alerte rouge), avant récolte 21 j', a.includes('R\u00e9entr\u00e9e interdite jusqu\u2019au') && a.includes('24<small>\u00a0h</small>') && a.includes('en cours') && a.includes('21<small>\u00a0j</small>'));
  T('les parcelles, et pour le registre la ZNT et la cible', a.includes('Les Seuvrées') && a.includes('<span>ZNT</span><b>5\u00a0m</b>') && a.includes('<span>Cible</span><b>Mildiou</b>'));
  T('rien d’inventé : sans délai ni parcelle, des tirets et « non renseignées », pas d’alerte ni de section registre', !b.includes('interdite') && b.includes('Non renseign\u00e9es') && !b.includes('Pour le registre'));
  T('sur ordinateur, toucher choisit ; au téléphone, le détail habituel', S.tr.includes('onclick="_phSel(${idx})" data-pidx="${Number(idx)}"') && S.tr.includes("function _phSel(i){\n  if(!_phDesk()){ openTraitDetail(i); return; }"));
  T('la fiche suit la liste (et une liste vide)', S.tr.includes("  if(typeof _phFicheSync==='function')_phFicheSync(list);\n") && S.tr.includes("<p>Aucun traitement cette saison</p></div>';if(typeof _phFicheSync==='function')_phFicheSync([]);return;}"));
  T('la page a la colonne de fiche et le bouton de saisie ; l’onglet Registre pose la classe et montre le bouton à qui peut saisir', S.html.includes('<aside class="phf" id="ph-fiche"') && S.html.includes('id="ph-new-btn" onclick="_phytoFab()"') && S.ph.includes("_pg.classList.toggle('ph-reg-on',!(isCat||isFer));") && S.ph.includes("_nb.style.display=(isCat?false:(isFer?isAdmin():(isAdmin()||isTractoriste())))?'':'none';"));
  T('le bloc PHYTO-1 est posé après TRAC-3, par jetons seulement (' + dur.length + ')', B.length > 3000 && S.css.indexOf('★ PHYTO-1 (§285)') > S.css.indexOf('★ FIN TRAC-3') && dur.length === 0);
  T('liste + fiche sur le Registre seulement, la fiche partage les règles de celle du Tracteur', B.includes('#page-phyto.ph-reg-on .content{ display:grid;') && S.css.includes(':is(#trac-fiche,#ph-fiche,#cat-fiche,#chai-fiche) .trf-hd{'));
  T('le bouton suit le droit : jamais forcé visible au large (ni ici, ni au Tracteur)', !B.includes('.ph-new{ display:inline-flex!important; }') && !S.css.includes('#page-tracteur .trac-new{ display:inline-flex!important; }'));
  T('l’aide dit la fiche du registre sur ordinateur', S.uti.includes("['Sur un ordinateur', \"toucher un traitement le choisit"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-phyto1.mjs'],") && S.liste.includes("['node scripts/mv-harnais-phyto1.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le produit n’est plus échappé', 'tr', "<h2 class=\"trf-t\">'+_escHtml(t.produit||'\\u2014')+'</h2>", "<h2 class=\"trf-t\">'+(t.produit||'\\u2014')+'</h2>", 0],
    ['l’alerte de réentrée disparaît', 'tr', "if(finDre&&finDre>now)h+='<div class=\"trf-alerte\">", "if(false)h+='<div class=\"trf-alerte\">", 1],
    ['la ZNT n’est plus dans le registre', 'tr', "if(m.znt)reg.push(['ZNT',", "if(false)reg.push(['ZNT',", 2],
    ['une section registre vide s’affiche quand même', 'tr', "  if(reg.length)h+='<section class=\"trf-sec\"><div class=\"trf-sec-t\">Pour le registre</div>", "  h+='<section class=\"trf-sec\"><div class=\"trf-sec-t\">Pour le registre</div>", 3],
    ['au téléphone, toucher choisit au lieu d’ouvrir le détail', 'tr', "  if(!_phDesk()){ openTraitDetail(i); return; }\n", '', 4],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-phyto .ph-new:hover{ background:var(--accent-survol); }', '#page-phyto .ph-new:hover{ background:#6A2246; }', 7],
    ['le bouton est forcé visible au large', 'css', '@media (max-width:1023px){ #page-phyto .ph-new{ display:none!important; } }', '@media (max-width:1023px){ #page-phyto .ph-new{ display:none!important; } }\n#page-phyto .ph-new{ display:inline-flex!important; }', 9],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-phyto1.mjs'],", '', 11]
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
