// HARNAIS — ETATS-1 (§415) : des états francs sur les plans (fait, en cours, à faire, en retard, arrachée), et quatre finitions.
//   node scripts/mv-harnais-etats1.mjs           → doit être vert
//   node scripts/mv-harnais-etats1.mjs --contre  → chaque défaut réinjecté doit rougir
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { css: L('src/styles.css'), vue: L('src/cockpit-vue.js'), ck: L('src/cockpit.js'), pil: L('src/pilotage.js'), uti: (L('src/utils.js') + '\n' + L('src/whats-new.js')) };
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  T('fait : un vrai vert (46 % de --ok), plus la teinte douce', S.css.includes('--et-faite:color-mix(in srgb,var(--ok) 46%,var(--bg-card))') && S.css.includes('.mv-fo.et-faite{fill:color-mix(in srgb,var(--ok) 46%,var(--bg-card))'));
  T('en cours : l’ambre (--attention), plus le gris neutre de --encours qui se confondait', S.css.includes('--et-cours:color-mix(in srgb,var(--attention) 48%,var(--bg-card))') && S.css.includes('--et-cours-b:var(--attention)') && S.css.includes('.mv-fo.et-cours{fill:color-mix(in srgb,var(--attention) 48%,var(--bg-card));stroke:var(--attention)'));
  T('en retard : un vrai rouge (44 % de --danger)', S.css.includes('--et-retard:color-mix(in srgb,var(--danger) 44%,var(--bg-card))') && S.css.includes('.mv-fo.et-retard{fill:color-mix(in srgb,var(--danger) 44%,var(--bg-card))'));
  T('à faire : blanc, cerné franchement', S.css.includes('--et-afaire:var(--bg-card)') && S.css.includes('--et-afaire-b:var(--texte-doux)'));
  T('arrachée : un fond gris sous des hachures appuyées, sur le plan comme sur les formes', S.vue.includes('<rect class="ck-hach-f" width="7" height="7"/><line class="ck-hach-l"') && S.css.includes('.ck-hach-f{fill:color-mix(in srgb,var(--texte-doux) 18%,var(--bg-card))}') && S.css.includes('.mv-fo.et-arr{fill:color-mix(in srgb,var(--texte-doux) 24%,var(--bg-card))'));
  T('le choix de la tâche dit qu’il défile : un fondu au bord, posé au rangement et au défilement',
    S.vue.includes("s.classList.toggle('deborde', deb);") && S.vue.includes('function ranger() {\n  indiceSeg();') && S.css.includes('.ck-seg.deborde{-webkit-mask-image:'));
  T('les lignes des chantiers tiennent dans leur carte', S.css.includes('.ck-ch{box-sizing:border-box}'));
  T('le choix de ce qu’on regarde dit dans l’aide (la barre « Vous regardez », PIL-RANGE-2a ; au téléphone, étiquette et dates hors de la barre collante)', S.uti.includes("['Choisir ce que vous regardez', ") && S.pil.includes("+'.pil-ptlab,.pil-ptbornes{display:none}'"));
  T('un arrachage en étapes dit qui y travaille : la dernière entrée de la tâche, faute d’entrée « En cours »',
    S.ck.includes("if(!e || e.tache !== tache || etat[e.parcelle] !== 'cours' || (deb[e.parcelle] && deb[e.parcelle].statut === 'En cours')) return;"));
  T('version (au moins 9.75) et nouveauté (9.75)', (() => { const v = (S.uti.match(/export const APP_VERSION = '(\d+)\.(\d+)';/) || []).slice(1).map(Number); return v.length === 2 && (v[0] > 9 || (v[0] === 9 && v[1] >= 75)); })() &&   // ACCV-1 (§416) : « au moins » — l’égalité stricte rougissait au lot suivant (cliquet à l’envers, §6c)
    /\{ v: '9\.75', d: '2026-10-21', items: \[\n    \{ niv: 1, pour: \['tous'\], emoji: 'feuille'/.test(S.uti));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(SRC0); let ko = 0; res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' — ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [['en cours revenu au gris', 'css', '--et-cours-b:var(--attention)', '--et-cours-b:var(--encours)'],
    ['fait revenu à la teinte douce', 'css', '--et-faite:color-mix(in srgb,var(--ok) 46%,var(--bg-card))', '--et-faite:var(--ok-doux)'],
    ['plus de fondu au sélecteur', 'vue', "s.classList.toggle('deborde', deb);", ''],
    ['les lignes des chantiers qui débordent', 'css', '.ck-ch{box-sizing:border-box}', ''],
    ['le choix de ce qu’on regarde absent de l’aide', 'uti', "['Choisir ce que vous regardez', ", "['Choisir', "],
    ['l’arrachage en étapes sans équipe', 'ck', "(deb[e.parcelle] && deb[e.parcelle].statut === 'En cours')) return;", "true) return;"]];
  let m = 0; DEF.forEach(([nom, f, a, b]) => { const S = Object.assign({}, SRC0); if (S[f].split(a).length !== 2) { console.log('  ??  ' + nom); m++; return; } S[f] = S[f].replace(a, b); const rouge = jouer(S).some(x => !x[1]); if (!rouge) m++; console.log((rouge ? '  ok  rougit : ' : '  KO  reste vert : ') + nom); });
  console.log('\n' + (m ? 'CONTRE-ÉPREUVES ROUGES ' + m : 'CONTRE-ÉPREUVES VERTES') + ' — ' + DEF.length + ' défauts réinjectés'); process.exit(ko || m ? 1 : 0);
}
process.exit(ko ? 1 : 0);
