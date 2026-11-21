// Harbour Spotter's entry program (Node 22, standard library only). The game is the
// static files under game/ — index.html and its ES modules, no library and no network
// request — and this program hands it in: it copies game/ and screenshots/ beside this
// file into the output directory and writes dossier.json, the summary the judge reads,
// built from the vendored make.fun library. Run it from the repo root, or anywhere,
// with MAKEFUN_OUTPUT_DIR set outside the grader (default /output):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Fail fast when the copy is incomplete: the grader refuses an entry with no
// playable index.html or fewer than 3 screenshots, so check before building the
// dossier instead of handing in a half-written output directory.
const copiedShots = existsSync(join(out, 'screenshots'))
  ? readdirSync(join(out, 'screenshots')).filter((name) => !name.startsWith('.'))
  : [];
if (!existsSync(join(out, 'game', 'index.html'))) {
  console.error('main.ts: game/index.html is missing from the output');
  process.exit(1);
}
if (copiedShots.length < 3) {
  console.error(`main.ts: only ${copiedShots.length} screenshot(s) in the output, need at least 3`);
  process.exit(1);
}
console.log(`main.ts: copied game/ and ${copiedShots.length} screenshot(s) to ${out}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all, or a
// path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap,
// its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
