import { describe, expect, it } from 'vitest';

const SOURCES = import.meta.glob('../src/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('source rules', () => {
  it('reads the sources', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
  });

  it('frame names are compared as strings on both sides', () => {
    // Generated sheets name their frames with numbers, so `frame.name !== '8'`
    // is always true. That broke an arcade cabinet's fire-once check and made
    // the Act 1 ending's clunk play every frame. Compare `String(x.frame.name)`.
    const bad: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      text.split('\n').forEach((line, i) => {
        if (/\.frame\.name\s*[!=]==?/.test(line)) bad.push(`${file}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('keys that pick, skip or go back ignore a held key\'s repeats', () => {
    // Browsers repeat a held key's keydown and Phaser passes the repeats to `keydown-X` listeners. A jump or
    // hold-to-fire attack held as Ben went down picked Game Over's RETRY unseen; a held Esc backed out of
    // Settings and then the pause menu; a held J spun the Spell Engine's pipes and closed a card reveal unread.
    // A file that binds Enter, Space, J, X, Esc, P or Backspace (or any key) must check `.repeat`.
    const PICK = /keydown-(ENTER|SPACE|J|X|ESC|P|BACKSPACE)\b|keydown-\$\{|on\(\s*'keydown'\s*,/;
    const PICK_KEYS = /'(ENTER|SPACE|J|X|ESC|P|BACKSPACE)'/;
    // Unlocking audio on any key is fine to repeat.
    const ALLOWED = ['/systems/Settings.ts'];
    const bad: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      if (ALLOWED.some((a) => file.endsWith(a)) || text.includes('.repeat')) continue;
      text.split('\n').forEach((line, i) => {
        if (!PICK.test(line)) return;
        // A template binding (`keydown-${key}`) only counts when its key list has a pick key.
        if (line.includes('keydown-${') && !PICK_KEYS.test(line)) return;
        bad.push(`${file}:${i + 1}`);
      });
    }
    expect(bad).toEqual([]);
  });

  it('scene event listeners are removed when the scene shuts down', () => {
    // Phaser keeps a scene's `events` listeners when the scene stops and starts again, so a listener added in
    // create() piles up: one more per pause, per visit to Settings or the title (Settings ran its bar redraw
    // once per past visit, every frame). Every `.events.on(Phaser.Scenes.Events.X` needs an `.events.off(` of
    // the same event in that file (or use `once`, or the scene's own update()).
    const bad: string[] = [];
    for (const [file, text] of Object.entries(SOURCES)) {
      for (const m of text.matchAll(/\.events\.on\(Phaser\.Scenes\.Events\.(\w+)/g)) {
        if (!text.includes(`.events.off(Phaser.Scenes.Events.${m[1]}`)) bad.push(`${file}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
