// The build `npm run bench` compares against: current main (origin/main when there is one),
// built once per commit into .bench-base/<sha>/dist from a detached git worktree that
// borrows this checkout's node_modules. Reused on later runs while main stays put.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

/** The commit to compare against: `ref` if given, else origin/main (fetched first, quietly), else main. */
export function resolveBase(root, ref) {
  if (!ref) spawnSync('git', ['fetch', '--quiet', 'origin', 'main'], { cwd: root, stdio: 'ignore', timeout: 30_000 });
  const candidates = ref ? [String(ref)] : ['origin/main', 'main'];
  for (const c of candidates) {
    const sha = git(root, ['rev-parse', '--verify', '--quiet', `${c}^{commit}`]);
    if (sha) return { ref: c, sha: sha.slice(0, 12) };
  }
  throw new Error(`bench: can't find the base commit (${candidates.join(', ')}). Pass --base=<ref> or --base-dist=<dir>.`);
}

/** Builds `sha` in bench mode (cached) and returns the directory to serve. */
export function buildBase(root, sha, opts = {}) {
  const dir = path.join(root, '.bench-base', sha);
  const dist = path.join(dir, 'dist');
  if (fs.existsSync(path.join(dist, 'index.html')) && !opts.rebuild) return dist;
  const tree = path.join(dir, 'tree');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  spawnSync('git', ['worktree', 'prune'], { cwd: root, stdio: 'ignore' });
  const add = spawnSync('git', ['worktree', 'add', '--detach', '--force', tree, sha], { cwd: root, stdio: 'inherit' });
  if (add.status !== 0) throw new Error(`bench: git worktree add ${sha} failed`);
  try {
    // Same dependencies as this checkout (versions are pinned, and the base is a recent main).
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(tree, 'node_modules'), 'dir');
    const flags = ['vite', 'build', '--mode', 'bench', '--outDir', dist, '--emptyOutDir', '--logLevel', 'warn'];
    if (opts.unminified) flags.push('--minify', 'false');
    const r = spawnSync('npx', flags, { cwd: tree, stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`bench: building the base (${sha}) failed`);
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', tree], { cwd: root, stdio: 'ignore' });
    spawnSync('git', ['worktree', 'prune'], { cwd: root, stdio: 'ignore' });
  }
  return dist;
}
