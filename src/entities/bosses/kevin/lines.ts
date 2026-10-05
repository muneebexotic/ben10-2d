/** Kevin's lines in the substation hall. */
export const KEVIN_BOSS_LINES = {
  intro: [
    { who: 'kevin', text: 'YOU FOLLOWED ME DOWN HERE? GOOD. I WAS GETTING BORED.', ms: 2400 },
    { who: 'kevin', text: 'THIS WHOLE PLACE IS MINE NOW, TENNYSON. EVERY LAST VOLT.', ms: 2500 },
    { who: 'ben', text: "KEVIN, IT DOESN'T HAVE TO GO LIKE THIS.", ms: 1900 },
    { who: 'kevin', text: 'SURE IT DOES. AND EVERY ALIEN YOU THROW AT ME... I KEEP.', ms: 2600 },
  ],
  phase2: 'MORE! I NEED MORE!',
  phase3: "I'LL TAKE ALL OF THEM!",
  defeat: [{ who: 'kevin', text: "THIS ISN'T OVER, TENNYSON! NEXT TIME I'M TAKING ALL OF IT!", ms: 2600 }],
} as const;
