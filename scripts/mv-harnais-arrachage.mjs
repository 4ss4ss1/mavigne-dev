// HARNAIS — ARRACH-1 : arracher une parcelle (admin seulement).
//   node scripts/mv-harnais-arrachage.mjs           → doit être vert
//   node scripts/mv-harnais-arrachage.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js (commentaires retirés), pas un double.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');

function extraire(src) {
  const i = src.indexOf('// ══════ ARRACHAGE');
  const j = src.indexOf('// ══════ Fork b');
  if (i < 0 || j < 0 || j < i) throw new Error('bloc ARRACHAGE introuvable');
  return src.slice(i, j).replace(/^\s*\/\/.*$/gm, '');
}
function surfaceFn(src) {
  const i = src.indexOf('function _recalcSurfTotale(){');
  const j = src.indexOf('\n}\n', i) + 3;
  return src.slice(i, j);
}

function monde(codeArr, { admin = true, surActive = true } = {}) {
  const els = {}; const toasts = []; const log = [];
  const el = id => (els[id] ||= { id, value: '', textContent: '', innerHTML: '', style: {}, isConnected: true,
    set onclick(f) { this._oc = f; }, get onclick() { return this._oc; }, max: '' });
  const ctx = {
    console, Date, Math, String, Array, parseFloat, setTimeout: () => 0,
    PARCELLES: [
      { nom: 'Les Grandes Vignes', surface: 0.42, statut: 'Active', taches: {} },
      { nom: 'Clos du Moulin', surface: 0.45, statut: 'Active', taches: {} }],
    JOURNAL: [{ parcelle: 'Clos du Moulin', statut: 'En cours' }],
    TACHES: [{ nom: 'Pioche' }, { nom: 'Relevage' }], TRAVAUX: {}, SURF_TOTALE: 0,
    _dpCurrentNom: 'Clos du Moulin',
    currentUser: { nom: 'Nico', roles: admin ? ['admin'] : ['ouvrier'] },
    isAdmin: () => admin,
    _mvOnActiveSaison: () => surActive,
    _escHtml: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    _escAttr: s => String(s).replace(/"/g, '&quot;'),
    document: { getElementById: id => (id.startsWith('arr-') || id.startsWith('dp-arrach') ? el(id) : null) },
    openOv: id => log.push('open:' + id), closeOv: (e, id) => log.push('close:' + id),
    showToast: (m, c) => toasts.push(m), saveData: k => log.push('save:' + k),
    renderParcelles: () => log.push('renderParcelles'), computePStats: () => log.push('computePStats'),
    renderHomeCard: () => log.push('renderHomeCard'),
    recalcTravaux: n => log.push('recalc:' + n),
    openDP: n => log.push('openDP:' + n),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(surfaceFn(APP) + '\n' + codeArr +
    '\nthis.__f={_dpFillArrach,openDPArrachage,saveArrachage,remettreParcelleEnExploitation,_recalcSurfTotale};', ctx);
  return { ctx, el, toasts, log, f: ctx.__f };
}

let ok = 0, ko = 0;
function t(nom, cond) { if (cond) { ok++; console.log('  ✓ ' + nom); } else { ko++; console.log('  ✗ ' + nom); } }

function suite(code, tag) {
  const out = [];
  const G = w => w.ctx.PARCELLES.find(x => x.nom === 'Clos du Moulin') || {};
  const T = (n, c) => out.push([tag + n, !!c]);

  // 1. admin : le bouton apparaît sur une parcelle active
  let w = monde(code);
  w.f._dpFillArrach(G(w));
  T('admin : le bouton Arracher est proposé', w.el('dp-arrach-row').innerHTML.includes('dp-arrach-btn') && w.el('dp-arrach-row').style.display === '');

  // 2. non-admin : aucun bouton, ni sur active ni sur arrachée
  w = monde(code, { admin: false });
  w.f._dpFillArrach(G(w));
  T('non-admin : aucun bouton', !w.el('dp-arrach-row').innerHTML.includes('dp-arrach-btn') && w.el('dp-arrach-row').style.display === 'none');
  Object.assign(G(w), { statut: 'Arrachee', dateArrachage: '2026-09-01', motifArrachage: 'Fin de cycle du vignoble' });
  w.f._dpFillArrach(G(w));
  T('non-admin : parcelle arrachée = info sans bouton de remise', w.el('dp-arrach-row').innerHTML.includes('01/09/2026') && !w.el('dp-arrach-row').innerHTML.includes('dp-arrach-undo'));

  // 3. saison consultée ≠ active : pas de bouton, même admin
  w = monde(code, { surActive: false });
  w.f._dpFillArrach(G(w));
  T('saison consultée non active : pas de bouton', !w.el('dp-arrach-row').innerHTML.includes('dp-arrach-btn'));

  // 4. saisie par un non-admin refusée, parcelle intacte
  w = monde(code, { admin: false });
  w.el('arr-hidden-nom').value = 'Clos du Moulin'; w.el('arr-date').value = '2026-09-01';
  w.f.saveArrachage();
  T('non-admin : saveArrachage refusé, statut inchangé', G(w).statut === 'Active' && !w.log.includes('save:parcelles'));

  // 5. admin : arrachage complet
  w = monde(code);
  w.f.openDPArrachage();
  T('ouverture : nom prérempli + avertissement travail en cours', w.el('arr-hidden-nom').value === 'Clos du Moulin' && /1 travail/.test(w.el('arr-warn').textContent) && w.log.includes('open:ovArrachage'));
  w.el('arr-date').value = '2026-09-01'; w.el('arr-motif').value = 'Maladie ou dépérissement'; w.el('arr-note').value = '  Esca  ';
  w.f.saveArrachage();
  const p = G(w);
  T('arrachage : statut Arrachee (sans accent) + date + motif + note nettoyée', p.statut === 'Arrachee' && p.dateArrachage === '2026-09-01' && p.motifArrachage === 'Maladie ou dépérissement' && p.noteArrachage === 'Esca');
  T('arrachage : statut d\'avant et auteur gardés', p.statutAvantArrachage === 'Active' && p.arracheePar === 'Nico');
  T('arrachage : persisté, recalculé, fiche rafraîchie, fenêtre fermée', ['save:parcelles', 'recalc:Pioche', 'recalc:Relevage', 'renderParcelles', 'computePStats', 'openDP:Clos du Moulin', 'close:ovArrachage'].every(x => w.log.includes(x)));
  T('arrachage : la parcelle reste dans PARCELLES (jamais supprimée)', w.ctx.PARCELLES.length === 2 && G(w).nom === 'Clos du Moulin');
  T('arrachage : la surface exploitée sort du total', w.f._recalcSurfTotale() === 0.42);

  // 6. date future / vide refusées
  w = monde(code);
  w.el('arr-hidden-nom').value = 'Clos du Moulin'; w.el('arr-date').value = '2999-01-01';
  w.f.saveArrachage();
  T('date future refusée', G(w).statut === 'Active');
  w.el('arr-date').value = ''; w.f.saveArrachage();
  T('date vide refusée', G(w).statut === 'Active');

  // 7. double arrachage : sans effet
  w = monde(code);
  Object.assign(G(w), { statut: 'Arrachee', dateArrachage: '2026-01-01' });
  w.el('arr-hidden-nom').value = 'Clos du Moulin'; w.el('arr-date').value = '2026-09-01';
  w.f.saveArrachage();
  T('parcelle déjà arrachée : la date d\'origine est conservée', G(w).dateArrachage === '2026-01-01');

  // 8. remise en exploitation (admin) : restaure le statut d'avant et purge les champs
  w = monde(code);
  G(w).statutAvantArrachage = 'Active';
  Object.assign(G(w), { statut: 'Arrachee', dateArrachage: '2026-09-01', motifArrachage: 'Autre', noteArrachage: 'x', arracheePar: 'Nico' });
  w.f.remettreParcelleEnExploitation('Clos du Moulin');
  const q = G(w);
  T('remise : statut rétabli, champs d\'arrachage purgés', q.statut === 'Active' && !('dateArrachage' in q) && !('motifArrachage' in q) && !('noteArrachage' in q) && !('arracheePar' in q) && !('statutAvantArrachage' in q));
  T('remise : la surface revient dans le total', w.f._recalcSurfTotale() === 0.87);

  // 9. remise par un non-admin refusée
  w = monde(code, { admin: false });
  Object.assign(G(w), { statut: 'Arrachee' });
  w.f.remettreParcelleEnExploitation('Clos du Moulin');
  T('non-admin : remise refusée', G(w).statut === 'Arrachee');

  // 10. XSS : motif/note affichés échappés
  w = monde(code);
  Object.assign(G(w), { statut: 'Arrachee', dateArrachage: '2026-09-01', motifArrachage: '<img onerror=x>', noteArrachage: '<script>1</script>' });
  w.f._dpFillArrach(G(w));
  T('motif et note échappés dans la fiche', !/<img|<script/.test(w.el('dp-arrach-row').innerHTML));
  return out;
}

const code = extraire(APP);
console.log('\n── ARRACH-1 — arrachage réservé à l\'admin\n');
if (!CONTRE) {
  for (const [n, c] of suite(code, '')) t(n, c);
  // câblage statique
  const nu = APP.replace(/^\s*\/\/.*$/gm, '');
  t('saveArrachage exposé sur window', /window\.saveArrachage\s*=\s*saveArrachage/.test(nu));
  t('openDP appelle _dpFillArrach', /openDP\(nom\)\{[\s\S]*?_dpFillArrach\(p\)/.test(nu));
  t('index.html porte ovArrachage, #dp-arrach-row et les champs arr-*', ['id="ovArrachage"', 'id="dp-arrach-row"', 'id="arr-date"', 'id="arr-motif"', 'id="arr-note"', 'id="arr-hidden-nom"', 'onclick="saveArrachage()"'].every(x => HTML.includes(x)));
  console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
  process.exit(ko ? 1 : 0);
} else {
  // contre-épreuves : chaque défaut doit faire rougir au moins une assertion
  const defauts = [
    ['saveArrachage sans garde admin', c => c.replace("if(!isAdmin()) return showToast('R\\u00e9serv\\u00e9 aux administrateurs','#B85A1A');\n  var nom=(document.getElementById('arr-hidden-nom')", "var nom=(document.getElementById('arr-hidden-nom')")],
    ['bouton proposé à tous', c => c.replace("var adm=isAdmin();", "var adm=true;")],
    ['statut avec accent', c => c.replace("p.statut='Arrachee';\n  p.dateArrachage", "p.statut='Arrach\\u00e9e';\n  p.dateArrachage")],
    ['date future acceptée', c => c.replace("if(date>_arrIsoJour()) return", "if(false) return")],
    ['parcelle supprimée au lieu d\'être marquée', c => c.replace("p.statut='Arrachee';\n  p.dateArrachage", "PARCELLES.splice(PARCELLES.indexOf(p),1); p.statut='Arrachee';\n  p.dateArrachage")],
    ['pas de sauvegarde', c => c.replace("  saveData('parcelles');\n  closeOv(null,'ovArrachage');", "  closeOv(null,'ovArrachage');")],
    ['remise sans purge', c => c.replace("delete p.statutAvantArrachage; delete p.dateArrachage;", "delete p.statutAvantArrachage;")],
    ['motif non échappé', c => c.replace("(p.motifArrachage?(' \\u00b7 '+_escHtml(p.motifArrachage)):'')", "(p.motifArrachage?(' \\u00b7 '+p.motifArrachage):'')")],
    ['remise autorisée aux non-admins', c => c.replace("function remettreParcelleEnExploitation(nom){\n  if(!isAdmin()) return showToast('R\\u00e9serv\\u00e9 aux administrateurs','#B85A1A');", "function remettreParcelleEnExploitation(nom){")],
  ];
  let manque = 0;
  for (const [nom, mut] of defauts) {
    const cassé = mut(code);
    if (cassé === code) { console.log('  ⚠ ancre de contre-épreuve introuvable : ' + nom); manque++; continue; }
    const rouges = suite(cassé, '').filter(x => !x[1]).length;
    console.log('  ' + (rouges ? 'DÉTECTÉ ' : 'NON DÉTECTÉ ') + ' ' + nom + ' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')');
    if (!rouges) manque++;
  }
  process.exit(manque ? 1 : 0);
}
