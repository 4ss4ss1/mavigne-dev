// ★ CI-1 (§514) — LES TUTOS EN PARTIES : npm run test:tutos -- --part k/N
//   Jusqu'au 02/11, la CI jouait tous les tutos d'un seul tenant (11 min 15 s pour 8 tutos ; un tuto de plus ≈ une minute de
//   plus), dans un job limité à 20 min qui faisait aussi les contrôles, le gabarit et l'expérience d'usage. GitHub le coupait
//   à la limite : « annulé », gris, jamais rouge — et la coupure tombait ailleurs à chaque envoi. La CI répartit désormais les
//   tutos sur N machines (.github/workflows/ci.yml, job « tutos ») : la partie k joue les tutos de rang k, k + N, k + 2N… de la
//   vraie liste, UN PAR UN — jamais plusieurs tutos à la fois sur une machine : les tutos attendent des animations, et la
//   charge seule fait rougir (CHARGE-1, §391). La dernière partie joue en plus les vérifications d'ensemble (le côte à côte,
//   le vieux boot.js). Sans l'option : 1/1, tout, comme avant.
//   Ici, rien que le calcul, sans navigateur : scripts/mv-harnais-ci1.mjs le joue pour de vrai.

/** --part k/N lu dans les arguments. Sans l'option : { k: 1, n: 1 } (tout). Mal formée : { erreur } — le lanceur s'arrête. */
export function partie(argv) {
  const i = argv.indexOf('--part');
  if (i < 0) return { k: 1, n: 1 };
  const v = String(argv[i + 1] || '');
  const m = /^([1-9]\d*)\/([1-9]\d*)$/.exec(v);
  if (!m || Number(m[1]) > Number(m[2])) return { erreur: '--part attend k/N avec 1 \u2264 k \u2264 N (par exemple --part 1/2) \u2014 re\u00e7u \u00ab ' + v + ' \u00bb' };
  return { k: Number(m[1]), n: Number(m[2]) };
}

/** Les tutos de la partie p, dans l'ordre de la liste : rangs k, k + N, k + 2N… (1 = le premier). Un tuto ajouté se range seul. */
export const maPartie = (liste, p) => liste.filter((_, i) => i % p.n === p.k - 1);

/** Les vérifications d'ensemble (côte à côte, vieux boot.js) se jouent une fois : sur la dernière partie. */
export const derniere = (p) => p.k === p.n;
