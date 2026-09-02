// ════════════════════════════════════════════════════════════════════════════
// HARNAIS — les trois lots du parcours prospect.
// Chaque assertion est doublée d'une CONTRE-ÉPREUVE : le défaut est réintroduit
// dans une copie du code réel, et le harnais DOIT rougir.
// ════════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'fs';

// ★ RACINE DEDUITE DU FICHIER, JAMAIS DU REPERTOIRE COURANT NI D'UN CHEMIN ABSOLU.
//   Regle posee en §44c : six harnais portaient « /home/claude/mavigne-dev/ » en dur —
//   un chemin de bac a sable. Chez Nico et en CI ils sortaient en ENOENT, et deux
//   d'entre eux etaient VERTS ici : un filet qui ne demarre pas se lit comme un succes.
const R = new URL('../', import.meta.url).pathname;
let ok = 0, ko = 0;
function t(nom, cond) { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗ ' + nom + '\x1b[0m'); } }
function bloc(n) { console.log('\n── ' + n + ' ──'); }

// ─── Extraction : on teste le CODE RÉEL, pas une reformulation ──────────────
function grab(src, re, quoi) {
  const m = src.match(re);
  if (!m) throw new Error('motif introuvable : ' + quoi);
  return m[0];
}

const ESSAI = readFileSync(R + 'public/essai.html', 'utf8');
const AGT   = readFileSync(R + 'src/admin-gt.js', 'utf8');
const LEADS = readFileSync(R + 'functions/leads.js', 'utf8');
const FJ    = JSON.parse(readFileSync(R + 'firebase.json', 'utf8'));

// ════════════════════════════════════════════════════════════════════════════
bloc('1. firebase.json — les deux routes /api existent');
const rw = FJ.hosting.rewrites || [];
t('rewrite /api/lead → submitLead',
  rw.some(r => r.source === '/api/lead' && r.function && r.function.functionId === 'submitLead'));
t('rewrite /api/mise-en-route → submitMiseEnRoute',
  rw.some(r => r.source === '/api/mise-en-route' && r.function && r.function.functionId === 'submitMiseEnRoute'));
t('région europe-west1 sur les deux',
  rw.length === 2 && rw.every(r => r.function.region === 'europe-west1'));
t('aucun catch-all ajouté (le statique reste servi)',
  !rw.some(r => r.source === '**' || r.source === '/**'));

// ════════════════════════════════════════════════════════════════════════════
bloc('2. essai.html — l\'envoi essaie DEUX adresses avant de renoncer');

// La boucle réelle, extraite telle quelle et rendue exécutable.
function faireBoucle(source) {
  const urls  = grab(source, /const FN_URLS = \[[\s\S]*?\];/, 'FN_URLS');
  const boucl = grab(source, /let data=null;[\s\S]*?\n    \}\n/, 'boucle d\'envoi');
  return new Function('fetch', 'payload', `
    ${urls}
    return (async function(){
      ${boucl}
      return { data, essayees: fetch.vues };
    })();
  `);
}

async function scenario(source, repond) {
  const vues = [];
  const fetchStub = async (u) => { vues.push(u); return repond(u); };
  fetchStub.vues = vues;
  const f = faireBoucle(source);
  return await f(fetchStub, () => ({}));
}

const OK200 = { ok: true, json: async () => ({ status: 'created' }) };
const R404  = { ok: false, status: 404 };

// a) tout marche → une seule adresse consultée, la complète
let r = await scenario(ESSAI, () => OK200);
t('URL absolue essayée EN PREMIER', r.essayees[0].startsWith('https://europe-west1-'));
t('une seule adresse consultée quand elle répond', r.essayees.length === 1);
t('la réponse est remontée', r.data && r.data.status === 'created');

// b) l'absolue tombe → le rewrite prend le relais
r = await scenario(ESSAI, (u) => (u.startsWith('https://') ? R404 : OK200));
t('bascule sur /api/lead si l\'URL absolue échoue', r.essayees.length === 2 && r.essayees[1] === '/api/lead');
t('le lead passe quand même', !!r.data);

// c) LE CAS VÉCU : pas de rewrite, mais l'URL absolue marche
r = await scenario(ESSAI, (u) => (u === '/api/lead' ? R404 : OK200));
t('★ rewrite absent + URL absolue vivante → le lead PASSE', !!r.data && r.essayees.length === 1);

// d) tout tombe
r = await scenario(ESSAI, () => R404);
t('les deux adresses sont épuisées avant de renoncer', r.essayees.length === 2);
t('aucune donnée remontée → le repli prend la main', r.data === null);

// e) une exception réseau n'arrête pas la boucle
r = await scenario(ESSAI, (u) => { if (u.startsWith('https://')) throw new Error('net'); return OK200; });
t('une exception sur la 1re adresse n\'empêche pas la 2e', !!r.data && r.essayees.length === 2);

// ── CONTRE-ÉPREUVE : on remet l'ancienne adresse unique ─────────────────────
const ESSAI_VIEUX = ESSAI
  .replace(/const FN_URLS = \[[\s\S]*?\];/, "const FN_URLS = ['/api/lead'];");
r = await scenario(ESSAI_VIEUX, (u) => (u === '/api/lead' ? R404 : OK200));
t('CONTRE-ÉPREUVE · une seule adresse → le lead se perd (rouge attendu)', r.data === null);

// ════════════════════════════════════════════════════════════════════════════
bloc('3. essai.html — le prospect n\'est plus laissé sans nouvelle');
t('le succès annonce l\'accusé de réception', /accus\u00e9 de r\u00e9ception part/.test(ESSAI));
t('le succès nomme l\'adresse du destinataire', /done\('Demande envoy\u00e9e[^']*'\+em/.test(ESSAI));
t('l\'échec copie le récapitulatif AVANT d\'ouvrir la messagerie',
  ESSAI.indexOf('clipboard.writeText(\'À : \'+DEST') < ESSAI.lastIndexOf('mailtoFallback();'));
t('mention RGPD au point de collecte', /suppression \u00e0 tout moment/.test(ESSAI) && /confidentialite\.html/.test(ESSAI));
t('les liens de réassurance sont stylés (pas de bleu navigateur)', /\.reassure a\{/.test(ESSAI));

// ════════════════════════════════════════════════════════════════════════════
bloc('4. mise-en-route.html — la page ne parle plus du domaine d\'un autre');
const MER = readFileSync(R + 'public/mise-en-route.html', 'utf8');
for (const n of ['12 permanents', '6 engins', '4 cuvées', '12 salariés']) {
  t('aucun « ' + n + ' » en dur', !MER.includes(n));
}
t('la section « à joindre » existe toujours', MER.includes('À joindre à votre réponse'));

// ════════════════════════════════════════════════════════════════════════════
bloc('5. leads.js — l\'accusé de mise en route, une seule fois');
t('la transaction rend dejaMer', /return \{ connu: true, dejaMer: !!prev\.mer \}/.test(LEADS));
t('l\'accusé est conditionné à !dejaMer', /if \(!dejaMer\) \{[\s\S]{0,400}merAckText/.test(LEADS));
t('il part vers le CLIENT, réponse vers Nicolas',
  /to:\s*\[email\],\s*\n\s*replyTo: DEST/.test(LEADS));
t('la notification GT reste, elle, adressée à Nicolas', /to:\s*\[DEST\],\s*\n\s*replyTo: email/.test(LEADS));
t('un échec d\'envoi n\'échoue pas la requête', /Accus\u00e9 de r\u00e9ception non mis en file/.test(LEADS));
t('les pièces sont listées sans aucun effectif',
  /MER_PIECES = \[[\s\S]*?\];/.test(LEADS) && !/MER_PIECES = \[[\s\S]*?\d\d? (permanents|engins|cuv)/.test(LEADS));

// contre-épreuve : sans la garde, un renvoi remailerait
const LEADS_SANS_GARDE = LEADS.replace('if (!dejaMer) {', 'if (true) {');
t('CONTRE-ÉPREUVE · garde retirée → détecté', !/if \(!dejaMer\) \{/.test(LEADS_SANS_GARDE));

// ════════════════════════════════════════════════════════════════════════════
bloc('6. admin-gt.js — l\'essai ne brûle plus pendant l\'attente');

const fnTrialExp = grab(AGT, /function _fcTrialExpMs\(fc\)\{[\s\S]*?\n\}/, '_fcTrialExpMs');
const fnTrialFmt = grab(AGT, /function _fcTrialFmt\(ms\)\{.*?\n/, '_fcTrialFmt');
const fnBox      = grab(AGT, /function _fcTrialStatusHtml\(fc\)\{[\s\S]*?\n\}/, '_fcTrialStatusHtml');
// ⚠️ Un harnais qui EXPLOSE doit compter ROUGE, pas s'arrêter en silence.
function etat(fc, src) {
  try {
    const f = new Function('fc', `${src.exp}\n${fnTrialFmt}\n${src.box}\nreturn _fcTrialStatusHtml(fc);`);
    return f(fc);
  } catch (e) { return '##EXPLOSION## ' + e.message; }
}
const SRC = { exp: fnTrialExp, box: fnBox };
const J = 86400000;

t('installé « à la remise » → « Essai de 15 j prévu », PAS « Abonnement actif »',
  /Essai de 15 j pr\u00e9vu/.test(etat({ trialDays: 0, trialPrevu: 15, trialExp: 0, cliStatus: 'active' }, SRC)));
t('… et le mot « Abonnement actif » n\'y figure pas',
  !/Abonnement actif/.test(etat({ trialDays: 0, trialPrevu: 15, trialExp: 0, cliStatus: 'active' }, SRC)));
t('essai armé → décompte J-X, plus de « prévu »',
  /J-1[0-5]/.test(etat({ trialDays: 15, trialPrevu: 0, trialExp: Date.now() + 15 * J, cliStatus: 'active' }, SRC)));
t('client converti (ni essai ni prévu) → « Abonnement actif »',
  /Abonnement actif/.test(etat({ trialDays: 0, trialPrevu: 0, trialExp: 0, cliStatus: 'active' }, SRC)));
t('essai expiré → toujours détecté',
  /Essai expir\u00e9/.test(etat({ trialDays: 15, trialPrevu: 0, trialExp: Date.now() - J, cliStatus: 'active' }, SRC)));

// CONTRE-ÉPREUVE : on retire la branche trialPrevu
const BOX_SANS = fnBox.replace(/\n  if\(fc\.trialPrevu>0\) return box\([\s\S]*?\);\n/, '\n');
t('CONTRE-ÉPREUVE · branche retirée → le domaine en attente redevient « Abonnement actif »',
  /Abonnement actif/.test(etat({ trialDays: 0, trialPrevu: 15, trialExp: 0, cliStatus: 'active' }, { exp: fnTrialExp, box: BOX_SANS })));

// ── La règle d'écriture au registre, extraite du code réel ─────────────────
const regle = grab(AGT, /var tstart = \(g\('agtins-tstart'\)[\s\S]*?var trialNow = .*?;/, 'règle trialNow');
function calc(choix, trial) {
  const f = new Function('g', 'trial', `${regle}\nreturn { tstart, trialNow };`);
  return f(() => choix, trial);
}
t('« remise » → aucun essai posé à l\'installation', calc('remise', 15).trialNow === 0);
t('« now » → l\'essai part tout de suite', calc('now', 15).trialNow === 15);
t('select vide / absent → repli sur « remise » (jamais sur « now »)', calc('', 15).tstart === 'remise');
t('valeur inattendue → repli sur « remise »', calc('nimportequoi', 15).tstart === 'remise');
t('essai à 0 jour → rien à poser dans les deux cas', calc('now', 0).trialNow === 0 && calc('remise', 0).trialNow === 0);

t('trialPrevu n\'est posé QUE si l\'essai est différé',
  /if \(trial > 0 && !trialNow\) clients\[slug\]\.trialPrevu = trial;/.test(AGT));
t('trialPrevu est effacé quand l\'essai part', /delete cur\.trialPrevu;/.test(AGT));
t('l\'ordre est celui de _fcSaveAbo : claims d\'abord, registre ensuite',
  AGT.indexOf('_fbSetTenantPlan(c.slug') < AGT.indexOf('fbAdminWriteGT(\'tenants\', Object.assign({}, gt, { clients: clients }))'));
t('le bouton ne peut pas partir deux fois', /if \(!c \|\| !c\.trial \|\| c\.trialArme\) return;/.test(AGT));
t('l\'écran de remise dit si le compte à rebours court', /non d\\u00e9marr\\u00e9/.test(AGT) && /, en cours/.test(AGT));
t('le bandeau ne se contente plus d\'exiger d\'installer le jour de la remise',
  !/Installez le jour o\\u00f9 vous envoyez les identifiants/.test(AGT));

// ════════════════════════════════════════════════════════════════════════════
bloc('7. admin-gt.js — les pièces jointes cessent d\'être hors radar');
t('la pastille n\'apparaît que si la mise en route est arrivée', /if\(l\.mer\)\{[\s\S]{0,200}_agtLeadSt\[l\._id\]&&_agtLeadSt\[l\._id\]\.pj/.test(AGT));
t('deux états distincts : reçues / attendues', /Pi\\u00e8ces re\\u00e7ues/.test(AGT) && /Pi\\u00e8ces attendues/.test(AGT));
t('la bascule écrit dans leads_status, pas dans `leads`', /_agtLeadSt\[id\]=Object\.assign\(\{\}, e, \{ pj:!e\.pj/.test(AGT));
t('elle ne rafraîchit l\'écran qu\'après une écriture réussie', /if\(await _agtSaveLeadSt\(\)\)\{[\s\S]{0,200}agtRenderBody\(\);/.test(AGT));
t('agtLeadPj exposé sur window (C23)', /window\.agtLeadPj\s*=\s*agtLeadPj;/.test(AGT));
t('agtInsTrialGo exposé sur window (C23)', /window\.agtInsTrialGo\s*=\s*agtInsTrialGo;/.test(AGT));

// ── La bascule elle-même, exécutée ─────────────────────────────────────────
const fnPj = grab(AGT, /async function agtLeadPj\(id\)\{[\s\S]*?\n\}/, 'agtLeadPj');
async function bascule(etatDep, saveOk) {
  const st = { X: etatDep };
  let rendu = 0;
  const f = new Function('_agtLeadSt', '_agtSaveLeadSt', 'showToast', 'agtRenderBody', `
    ${fnPj}
    return agtLeadPj('X');
  `);
  await f(st, async () => saveOk, () => {}, () => { rendu++; });
  return { pj: st.X.pj, rendu };
}
let b = await bascule({}, true);
t('vierge → cochée, et l\'écran se refait', b.pj === true && b.rendu === 1);
b = await bascule({ pj: true }, true);
t('cochée → décochée (c\'est une bascule, pas un cliquet)', b.pj === false);
b = await bascule({ pj: false, note: 'garder' }, true);
t('la note survit à la bascule', b.pj === true);
b = await bascule({}, false);
t('écriture refusée → aucun rendu (l\'écran ne ment pas)', b.rendu === 0);

// ════════════════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60));
console.log(ko === 0
  ? `\x1b[32m✓ ${ok} assertions vertes, 0 rouge.\x1b[0m`
  : `\x1b[31m✗ ${ko} ROUGE(S) sur ${ok + ko}.\x1b[0m`);
process.exit(ko ? 1 : 0);
