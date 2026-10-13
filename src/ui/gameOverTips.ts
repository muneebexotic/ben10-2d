/**
 * Game Over tips. Each names only what the chapter has (Chapter 3 has no
 * drones, Chapter 4 no Strikers), so a tip never talks about an enemy the
 * player hasn't met there. Kept free of Phaser for tests.
 */
export interface GameOverTip {
  text: string;
  /** Chapters it applies to; every chapter when missing. */
  chapters?: readonly number[];
  /** An alien the tip names: only once it's on the dial (no spoiling a chapter's new alien). */
  needs?: string;
}

export const GAME_OVER_TIPS: readonly GameOverTip[] = [
  { text: 'STRIKERS GET STUCK AFTER A DIVE. PUNCH THEM WHILE THEY ARE DOWN!', chapters: [1, 2] },
  { text: 'PUNCH {J} A LASER RIGHT BEFORE IT HITS TO KNOCK IT BACK.', chapters: [1, 2] },
  { text: 'FIRE BURST {K} WIPES OUT EVERY LASER AROUND YOU.', chapters: [1, 2], needs: 'heatblast' },
  { text: 'HOLD {UP} WHILE SHOOTING TO AIM FIREBALLS AT HIGH DRONES.', chapters: [1, 2], needs: 'heatblast' },
  { text: 'THE BOSS IS STUNNED AFTER A SLAM. THAT IS YOUR WINDOW!', chapters: [1] },
  { text: 'THE DODGE ROLL {K} MAKES HUMAN BEN INVINCIBLE FOR A MOMENT.' },
  { text: 'TRANSFORM {T} RIGHT AS AN ENEMY ATTACKS: PERFECT TRANSFORM, BIGGER BLAST, MORE ALIEN TIME.' },
  { text: 'TRANSFORMING SENDS OUT A SHOCKWAVE. PANIC BUTTON!' },
  { text: 'HEATBLAST GLIDES IF YOU HOLD {JUMP} AFTER A ROCKET JUMP.', needs: 'heatblast' },
  { text: 'THE SHIELD BAR PROTECTS BEN WHILE HE IS AN ALIEN.' },
  { text: 'MR. SMOOTHY HEALS. NEVER SKIP A SMOOTHIE.' },
  { text: 'MUTANT ROACHES SHRUG OFF CLAWS. FIRE COOKS THEM.', chapters: [3], needs: 'heatblast' },
  { text: 'LURKERS ARE INVISIBLE, BUT A GLOB OF SLIME SHOWS THEM.', chapters: [3], needs: 'stinkfly' },
  { text: 'WILDMUTT SENSES INVISIBLE LURKERS.', chapters: [3], needs: 'wildmutt' },
  { text: "A BRUTE'S TUSKS BLOCK THE FRONT. LET IT CHARGE INTO A WALL.", chapters: [3] },
  { text: 'A MUTANT BAT SCREECHES BEFORE IT SWOOPS. ONE GLOB OF SLIME GROUNDS IT.', chapters: [3], needs: 'stinkfly' },
  { text: 'TOKEN TOONS RAISE THEIR CYMBALS BEFORE THE SMASH. HIT THEM WHILE THEY BEND.', chapters: [4] },
  { text: 'TRACK-BOTS THROW SPARKS BEFORE THEY CHARGE. JUMP THEM, HIT THEIR BACKS.', chapters: [4] },
  { text: 'UPGRADE TAKES OVER ROBOTS: {K} INTO ONE AND IT BLOWS UP.', chapters: [4], needs: 'upgrade' },
  { text: 'A TRACKER DRONE PAINTS YOU BEFORE THE MISSILES. BREAK ITS LINE OF SIGHT, OR SHOOT IT DOWN.', chapters: [5] },
  { text: 'MISSILE MARKERS SHOW WHERE THEY LAND. GET UNDER A PORCH ROOF!', chapters: [5] },
  { text: 'CRAB-BOT SHELLS SHRUG OFF HITS. FLIP THEM WITH A SMASH, THEN HIT THE SOFT SIDE.', chapters: [5] },
  { text: 'A CRACK RACING ALONG THE FLOOR MEANS SOMETHING IS ABOUT TO ERUPT UNDER IT. MOVE!', chapters: [5] },
  { text: "CRYSTAL SENTRIES GLINT BEFORE A SHARD VOLLEY. DIAMONDHEAD'S SHIELD {K} SENDS IT BACK.", chapters: [5], needs: 'diamondhead' },
  { text: 'HOLD {K} AS DIAMONDHEAD TO REFLECT SHOTS. LASERS, MISSILES, EVEN A CLAW CANNON.', chapters: [5], needs: 'diamondhead' },
  { text: 'GHOSTFREAK PHASES {K} THROUGH SHOTS AND WALLS. STAND STILL WHILE PHASED TO VANISH.', chapters: [5], needs: 'ghostfreak' },
  { text: 'DYNAMITE GOES OFF WITH FIRE, AN EXPLOSION OR A HARD HIT. CRACKED ROCK DOES NOT LIKE IT.', chapters: [5] },
  { text: "KRAAB'S FRONT IS SHELLED. HIT HIM FROM BEHIND, OR LURE HIM UNDER THE CRACKED PILLAR.", chapters: [5] },
  { text: 'TETRAX GLINTS BEFORE EVERY STRIKE. SMASHES CRACK HIM; FIRE HEATS HIM UP FOR A COMBO.', chapters: [5] },
];

export function tipsFor(chapter: number, aliens: readonly string[]): readonly GameOverTip[] {
  return GAME_OVER_TIPS.filter((t) => (!t.chapters || t.chapters.includes(chapter)) && (!t.needs || aliens.includes(t.needs)));
}
