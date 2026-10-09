// HARNAIS — ACC-3 (§278) : la météo 5 jours et les derniers travaux de l'Accueil au dessin de la maquette v4.
//   node scripts/mv-harnais-acc3.mjs           → doit être vert
//   node scripts/mv-harnais-acc3.mjs --contre  → chaque défaut réinjecté doit rougir
// Joue la VRAIE renderHomeMeteo5 et les vrais _hvJour / _hvHeure (extraits par leurs accolades) sur de fausses données.
import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const S0 = { app: L('src/app.js'), css: L('src/styles.css'), uti: L('src/utils.js'), liste: L('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) return ''; let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function bloc(css) { const i = css.indexOf('★ ACC-3 (§278)'); if (i < 0) return ''; const j = css.indexOf('★ FIN ACC-3', i); return css.slice(i, j < 0 ? undefined : j); }
function sansVar(s) { let out = '', i = 0; for (;;) { const k = s.indexOf('var(--', i); if (k < 0) return out + s.slice(i); out += s.slice(i, k); let p = 0, j = k + 3; for (; j < s.length; j++) { if (s[j] === '(') p++; else if (s[j] === ')' && --p === 0) break; } i = j + 1; } }
const enDur = b => sansVar(b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')).match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(|(?<![\w.-])(?!0px)\d*\.?\d+(?:px|m?s\b|deg)/g) || [];
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
function meteo(S, compact) {
  const c = { innerHTML: '' }, base = new Date(2026, 9, 8);   // un jeudi
  const win = { METEO_DAILY: { time: [0, 1, 2, 3, 4].map((i) => iso(new Date(base.getTime() + i * 864e5))), tmax: [14, 16, 12, 15, 17], tmin: [7, 8, 2, 5, 6], pp: [20, 10, 80, 0, 40], code: [3, 61, 51, 0, 1] } };
  new Function('document', 'window', 'localStorage', '_mvIcon', 'wmoIcone', '_homeIsCompact', 'renderHomeMeteoCommunes',
    fonction(S.app, 'function renderHomeMeteo5(){') + '\nrenderHomeMeteo5();')({ getElementById: () => c }, win, { getItem: () => null }, (n) => '[' + n + ']', (k) => 'w' + k, () => compact, () => 0);
  return c.innerHTML;
}
function journal(S) {
  return new Function('fmtDate', fonction(S.app, 'function _hvIso(d){') + '\n' + fonction(S.app, 'function _hvJour(iso){') + '\n' + fonction(S.app, 'function _hvHeure(r){')
    + '\nreturn { auj:_hvJour(_hvIso(new Date())), hier:_hvJour(_hvIso(new Date(Date.now()-864e5))), vieux:_hvJour("2026-09-01"), h:_hvHeure({ id: new Date(2026,9,8,9,10).getTime().toString(16)+"-qv" }), rien:_hvHeure({ id: "abc" }) };')((d) => 'le ' + d);
}
function suite(S) {
  const out = []; const T = (n, c) => out.push([n, !!c]); const B = bloc(S.css), dur = enDur(B);
  let m = '', mc = '', j = {}; try { m = meteo(S, false); mc = meteo(S, true); j = journal(S); } catch (e) { m = 'plantage ' + e.message; }
  T('la météo : le jour en tête (maximum, ciel, minimum, risque de pluie)', m.includes('<div class="hm5-now">[w3]<div class="hm5-deg">14\u00b0</div>') && m.includes('<div class="hm5-cond">Couvert</div>') && m.includes('Minimum 7\u00b0, pluie 20\u00a0%'));
  T('cinq colonnes, chacune avec sa barre de pluie et son pourcentage', (m.match(/class="hm5-d(?=[ "])/g) || []).length === 5 && m.includes('<span class="hm5-pl" aria-hidden="true"><i style="--h:80%"></i></span>') && m.includes('<div class="hm5-n">Ven.</div>'));
  T('la note du premier jour pluvieux (au-delà de 50 %), avec son nom', m.includes('Pluie probable samedi\u00a0: 80\u00a0%.') && !m.includes('vendredi\u00a0:'));
  T('le gel reste signalé, la version compacte reste celle d’avant', m.includes('hm5-d gel') && mc.includes('class="hm5-mini"') && !mc.includes('hm5-now'));
  T('le fil : « Aujourd’hui », « Hier », sinon la date ; l’heure lue dans l’identifiant, rien sinon', j.auj === 'Aujourd\u2019hui' && j.hier === 'Hier' && j.vieux === 'le 2026-09-01' && j.h === '09:10' && j.rien === '');
  T('le fil : un intertitre par jour, les initiales, « a validé / a commencé », les noms échappés', S.app.includes("const jour=_hvJour(r.date), tete=(jour!==_jPrec)?`<div class=\"hv2-fil-jour\">${_escHtml(jour)}</div>`:'';") && S.app.includes("${isVal?'a validé':'a commencé'}") && S.app.includes('<b>${_escHtml(r.parcelle)}</b>'));
  T('le bloc ACC-3 est posé après ACC-2, par jetons seulement (' + dur.length + ')', B.length > 2500 && S.css.indexOf('★ ACC-3 (§278)') > S.css.indexOf('★ FIN ACC-2') && dur.length === 0);
  T('cinq colonnes à filet, et la ligne du fil sur quatre colonnes', B.includes('#page-home .hm5{ display:grid!important; grid-template-columns:repeat(5,minmax(0,1fr));') && B.includes('grid-template-columns:var(--h-row-2) var(--av) minmax(0,1fr) auto;'));
  T('l’aide dit le risque de pluie (pas des millimètres) et le fil', S.uti.includes("['La météo 5 jours', \"le jour en tête, puis cinq colonnes.") && S.uti.includes('une probabilité, pas des millimètres') && S.uti.includes("['Derniers travaux', \"le fil des quatre derniers travaux"));
  T('ce harnais est branché dans la liste des contrôles', S.liste.includes("['node scripts/mv-harnais-acc3.mjs'],") && S.liste.includes("['node scripts/mv-harnais-acc3.mjs --contre'],"));
  return out;
}
function jouer(S) { try { return suite(S); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
const res = jouer(S0); let ko = 0;
res.forEach(([n, ok]) => { if (!ok) ko++; console.log((ok ? '  ok  ' : '  KO  ') + n); });
console.log('\n' + (ko ? 'ROUGE ' + ko : 'VERT') + ' \u2014 ' + res.length + ' assertions, ' + ko + ' échec' + (ko > 1 ? 's' : ''));
if (CONTRE) {
  const DEF = [
    ['le ciel du jour disparaît', 'app', "+'<div><div class=\"hm5-cond\">'+ciel(md.code[0])+'</div>", "+'<div><div class=\"hm5-cond\"></div>", 0],
    ['la barre de pluie disparaît', 'app', "+'<span class=\"hm5-pl\" aria-hidden=\"true\"><i style=\"--h:'+(md.pp[i]||0)+'%\"></i></span>'", '', 1],
    ['la note prend le premier jour, même sec', 'app', "if((md.pp[k]||0)>=50){", 'if(true){', 2],
    ['l’heure se lit sur n’importe quel identifiant', 'app', "var m=/^([0-9a-f]{10,12})-/.exec(String((r&&r.id)||''));", "var m=/^(.*)$/.exec(String((r&&r.id)||''));", 4],
    ['« Hier » disparaît', 'app', "if(iso===_hvIso(h))return 'Hier';", '', 4],
    ['une couleur écrite en dur dans le bloc', 'css', '#page-home .hv2-fil:hover{ background:var(--survol); }', '#page-home .hv2-fil:hover{ background:#F2EFE7; }', 6],
    ['l’aide parle de millimètres', 'uti', 'une probabilité, pas des millimètres', 'en millimètres', 8],
    ['le harnais sort de la liste', 'liste', "['node scripts/mv-harnais-acc3.mjs'],", '', 9]
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
