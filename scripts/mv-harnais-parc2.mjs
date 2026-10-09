// HARNAIS — PARC-2 (§275) : les cartes de travail du téléphone au dessin de la maquette v3, avec les MÊMES gestes.
//   node scripts/mv-harnais-parc2.mjs           → doit être vert
//   node scripts/mv-harnais-parc2.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js'), guide: L('guide/04-vigne.html'), liste: L('scripts/mv-harnais-liste.mjs') };
function bloc(css) { const i = css.indexOf('★ PARC-2 (§275)'); if (i < 0) return ''; const j = css.indexOf('★ FIN PARC-2', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  T('une carte de travail dit l’état de la tâche choisie, avec les mêmes gestes (_pvActions)',
    S.app.includes('const _pvInnerT=_pCarteTache(p,hasDrae?draeInfo:null,_proxPill);') && S.app.includes('<div class="pc-left" onclick="openDP(\'${_escAttr(p.nom)}\')">${_pvInnerT}</div>${_pvAct}'));
  T('_pCarteTache : rang, nom, état, délai de réentrée, proximité', S.app.includes('function _pCarteTache(p,drae,prox){') && S.app.includes("var b=(drae?_mvBadge('DRAE '+drae.heures+' h','rouge'):'')+(prox||'');"));
  T('le bloc PARC-2 est posé après PARC-1, sous 1 024 px, par jetons seulement (' + dur.length + ')',
    B.length > 3000 && S.css.indexOf('★ PARC-2 (§275)') > S.css.indexOf('★ FIN PARC-1') && B.includes('@media (max-width:1023px){') && dur.length === 0);
  T('les gestes passent en bas de la carte : deux grands boutons (1 / 2), un seul pleine largeur s’il est seul',
    B.includes('#pList .pcard-qv .pc-row{ flex-direction:column; }') && B.includes('#pList .pcard-qv .pc-actions{ display:grid; grid-template-columns:1fr 2fr;') && B.includes('#pList .pcard-qv .pc-actions > :only-child{ grid-column:1 / -1; }'));
  T('des boutons pour le pouce (la hauteur d’une ligne, 56 px au doigt) et un libellé lisible',
    B.includes('min-height:var(--h-row-2); height:var(--h-row-2);') && B.includes('#pList .pcard-qv .pc-lb{ font-size:var(--pt-base,14px); font-weight:var(--fw-semi,600); letter-spacing:0; text-transform:none; }'));
  T('Valider à l’accent, Début en secondaire, Fait en vert',
    B.includes('#pList .pcard-qv .pc-validate{ background:var(--accent); color:var(--sur-accent);') && B.includes('#pList .pcard-qv .pc-start{ background:var(--bg-card);') && B.includes('#pList .pcard-qv .pc-validate.done{ background:var(--ok-doux); color:var(--ok);'));
  T('les filtres de tâche défilent en segmenté au téléphone', B.includes('#page-parcelles .tfilters{ display:flex; flex-wrap:nowrap; overflow-x:auto;'));
  T('l’aide et le guide disent les gestes en bas de la carte et l’état de la tâche',
    /\['Les deux gestes', "«\s?Début\s?» signale qu’on attaque, «\s?Valider\s?» que c’est fini, sans ouvrir la parcelle\s?: en bas de chaque carte au téléphone/.test(S.uti)
    && S.guide.includes('<li>Le <b>bas de chaque carte</b> porte les deux gestes'));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-parc2.mjs'],") && S.liste.includes("['node scripts/mv-harnais-parc2.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['la carte reprend le pourcentage en mode tâche', 'app', '>${_pvInnerT}</div>${_pvAct}', '>${_pvInner}</div>${_pvAct}', 0],
    ['la carte perd le délai de réentrée', 'app', "var b=(drae?_mvBadge('DRAE '+drae.heures+' h','rouge'):'')+(prox||'');", "var b=(prox||'');", 1],
    ['une couleur écrite en dur dans le bloc', 'css', '#pList .pcard-qv .pc-validate{ background:var(--accent);', '#pList .pcard-qv .pc-validate{ background:#7A2850;', 2],
    ['les gestes repartent en colonne à droite', 'css', '#pList .pcard-qv .pc-row{ flex-direction:column; }', '#pList .pcard-qv .pc-row{ flex-direction:row; }', 3],
    ['des boutons trop petits pour le pouce', 'css', 'min-height:var(--h-row-2); height:var(--h-row-2);', 'min-height:var(--h-sm); height:var(--h-sm);', 4],
    ['Valider perd l’accent', 'css', '#pList .pcard-qv .pc-validate{ background:var(--accent); color:var(--sur-accent);', '#pList .pcard-qv .pc-validate{ background:var(--bg-card); color:var(--sur-accent);', 5],
    ['les filtres ne défilent plus', 'css', '#page-parcelles .tfilters{ display:flex; flex-wrap:nowrap; overflow-x:auto;', '#page-parcelles .tfilters{ display:flex; flex-wrap:wrap; overflow-x:auto;', 6],
    ['le guide garde « la colonne de droite »', 'guide', '<li>Le <b>bas de chaque carte</b> porte les deux gestes', '<li>La <b>colonne de droite</b> de chaque carte porte les deux gestes', 7],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-parc2.mjs'],", '', 8]
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
