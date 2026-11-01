# Art coverage (Act 3)

Generated from the cartoon manifests (`src/config/cartoon/`) and the frame clips (`<ID>_FRAME_CLIPS` in `scenes/preload/cartoon/characters/`). Regenerate with `UPDATE_ART_COVERAGE=1 npx vitest run tests/artCoverage.test.ts`; `npm test` fails while this file is out of date.

- **drawn**: plays the owner's drawing made for it.
- **stand-in**: plays another pose's drawing (the standing drawing, a run frame) until its sheet arrives.
- **waiting**: the character is drawn frame by frame but this animation has no drawing yet: it shows the standing drawing.
- **painted**: the character has no animation sheets yet; its rig is painted in code (complete, every animation moves).

The prompts for every sheet still needed are in the Animation Sheet Prompts page (PROGRESS.md).

| Character | Animations | Drawn | Stand-in | Waiting | Painted |
|---|---|---|---|---|---|
| BEN TENNYSON | 26 | 17 | 9 | 0 | 0 |
| GWEN TENNYSON | 23 | 2 | 7 | 14 | 0 |
| GRANDPA MAX | 26 | 2 | 4 | 20 | 0 |
| KEVIN LEVIN | 27 | 3 | 9 | 15 | 0 |
| HEATBLAST | 13 | 0 | 0 | 0 | 13 |
| FOUR ARMS | 21 | 0 | 0 | 0 | 21 |
| XLR8 | 18 | 0 | 0 | 0 | 18 |
| WILDMUTT | 20 | 0 | 0 | 0 | 20 |
| STINKFLY | 16 | 0 | 0 | 0 | 16 |
| UPGRADE | 19 | 0 | 0 | 0 | 19 |
| DIAMONDHEAD | 22 | 0 | 0 | 0 | 22 |
| GHOSTFREAK | 19 | 0 | 0 | 0 | 19 |
| GREY MATTER | 19 | 0 | 0 | 0 | 19 |
| RIPJAWS | 21 | 0 | 0 | 0 | 21 |
| PLUMBER SENTRY | 3 | 0 | 0 | 0 | 3 |
| FISHBOWL GRUNT | 9 | 0 | 0 | 0 | 9 |
| ZAPPER EEL | 4 | 0 | 0 | 0 | 4 |
| JELLY MINE | 1 | 0 | 0 | 0 | 1 |
| GNASHER SWARM | 4 | 0 | 0 | 0 | 4 |
| DEEPMAW | 16 | 0 | 0 | 0 | 16 |

## BEN TENNYSON (`ben`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | breathing, a weight shift, blinking | drawn | idle0, idle1, idle2, idle3 |
| run | a full run cycle with arm swing and hip bounce | drawn | run0, run1, run2, run4, run5, run6, run7 |
| walk | a calmer walk (story) | stand-in | run0, run1, run2, run4, run5, run6, run7 |
| jump | crouch, push off, tuck | drawn | land, jump |
| fall | arms up, legs pedalling | drawn | fall |
| land | a knees-bent landing between falling and standing | drawn | land |
| punch | a jab with the near arm and the far arm pulled back | drawn | punch |
| roll | a tucked dodge roll, all the way round | stand-in | jump |
| hurt | knocked back, face screwed up | drawn | hurt |
| defeat | knocked flat (the level spins him away) | stand-in | hurt |
| watch | the Omnitrix raised to his face (transforming, story beats) | stand-in | slam |
| slam | the transform slam: hand raised over the watch | drawn | slam |
| swim | breaststroke: glide, pull, frog kick | drawn | swim0, swim1, swim2, swim3, swim4, swim5 |
| tread | treading water | stand-in | idle0 |
| drown | out of air, thrashing | stand-in | hurt |
| talk | gesturing while he talks | drawn | talk |
| point | pointing | drawn | point |
| shrug | shrugging | drawn | shrug |
| surprise | jumping back, eyes wide | drawn | surprise |
| cheer | both fists up | drawn | cheer |
| think | hand on chin | drawn | think |
| angry | fists clenched | stand-in | stand |
| sad | shoulders down | stand-in | idle0 |
| lookHands | staring at his own hands (the transition) | drawn | hands |
| wave | waving | drawn | wave |
| listen | (story pose) | stand-in | idle0, idle1, idle2, idle3 |

## GWEN TENNYSON (`gwen`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | breathing, a weight shift, blinking | drawn | stand |
| run | a full run cycle | drawn | run0, run1, run2, run3, run4, run5, run6, run7 |
| walk | a calmer walk (story) | stand-in | run0, run1, run2, run3, run4, run5, run6, run7 |
| jump | crouch, push off, tuck | stand-in | run1, run3 |
| fall | arms up, legs pedalling | stand-in | run7 |
| land | a knees-bent landing | stand-in | run5 |
| cast | both hands thrust forward with a mana glow (her spells) | stand-in | stand |
| point | pointing | waiting |  |
| hurt | knocked back | stand-in | stand |
| defeat | knocked flat | stand-in | stand |
| swim | breaststroke: glide, pull, frog kick | waiting |  |
| tread | treading water | waiting |  |
| drown | out of air | waiting |  |
| talk | gesturing while she talks | waiting |  |
| shrug | shrugging | waiting |  |
| surprise | eyes wide | waiting |  |
| cheer | both fists up | waiting |  |
| think | hand on chin | waiting |  |
| angry | fists clenched | waiting |  |
| sad | shoulders down | waiting |  |
| lookHands | staring at her hands (the transition) | waiting |  |
| wave | waving | waiting |  |
| folded | arms folded, eyebrow up (unimpressed) | waiting |  |

## GRANDPA MAX (`max`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | breathing (a big chest), blinking | drawn | stand |
| walk | a heavy, steady walk | drawn | walk0, walk1, walk2, walk3, walk4, walk5, walk6, walk7 |
| run | a lumbering run | stand-in | walk0, walk1, walk2, walk3, walk4, walk5, walk6, walk7 |
| jump | crouch, push off | waiting |  |
| fall | arms out | waiting |  |
| land | a heavy landing | waiting |  |
| spray | holding something out in front and firing it (the fire extinguisher, the blaster) | waiting |  |
| blast | firing his Plumber blaster | waiting |  |
| point | pointing | waiting |  |
| cheer | fist up | waiting |  |
| hurt | knocked back | stand-in | stand |
| defeat | down | stand-in | stand |
| talk | gesturing while he talks | waiting |  |
| badge | holding up his Plumber badge | waiting |  |
| salute | a Plumber salute | waiting |  |
| console | working a console | stand-in | side |
| surprise | eyes wide | waiting |  |
| think | hand on chin | waiting |  |
| shrug | shrugging | waiting |  |
| angry | stern | waiting |  |
| sad | shoulders down | waiting |  |
| lookHands | staring at his hands (the transition) | waiting |  |
| wave | waving | waiting |  |
| swim | swimming | waiting |  |
| tread | treading water | waiting |  |
| drown | out of air | waiting |  |

## KEVIN LEVIN (`kevin`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a slouch, hands loose, blinking | drawn | stand |
| run | a loping run | drawn | run0, run1, run2, run3, run4, run5, run6, run7 |
| walk | a swagger (story) | stand-in | run0, run1, run2, run3, run4, run5, run6, run7 |
| jump | push off | stand-in | run1, run3 |
| fall | arms out | stand-in | run7 |
| land | landing | stand-in | run5 |
| absorb | palms out, drinking in power, eyes and hands glowing purple | drawn | absorb |
| windup | a bolt charging in his hand | stand-in | absorb |
| throw | hurling a bolt | stand-in | absorb |
| hurt | knocked back | stand-in | stand |
| laugh | head back, laughing | waiting |  |
| lunge | grabbing forward | stand-in | run3 |
| point | pointing | waiting |  |
| defeat | down | stand-in | stand |
| talk | talking with his hands | waiting |  |
| smirk | hands in pockets, smirking | waiting |  |
| surprise | caught out | waiting |  |
| angry | scowling | waiting |  |
| wave | waving (a stolen badge) | waiting |  |
| cheer | fists up | waiting |  |
| think | scheming | waiting |  |
| shrug | shrugging | waiting |  |
| sad | sulking | waiting |  |
| lookHands | staring at his hands | waiting |  |
| swim | swimming | waiting |  |
| tread | treading water | waiting |  |
| drown | out of air | waiting |  |

## HEATBLAST (`heatblast`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a flickering stance, head ablaze | painted |  |
| run | a run cycle, flames streaming back | painted |  |
| jump | push off | painted |  |
| fall | arms out, flames up | painted |  |
| land | landing | painted |  |
| shoot | a fireball from the near hand | painted |  |
| charge | both hands drawn in, charging a burst, flames roaring | painted |  |
| rocket | rocket jump: arms down, fire from the feet | painted |  |
| hurt | knocked back, flame gutters | painted |  |
| defeat | down, embers | painted |  |
| swim | swimming in a cloud of steam (he hates water) | painted |  |
| tread | treading water, hissing | painted |  |
| drown | sputtering | painted |  |

## FOUR ARMS (`fourarms`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a heavy stance, four fists ready, chest heaving | painted |  |
| run | a pounding run, all four arms pumping | painted |  |
| jump | a heavy push off | painted |  |
| fall | arms spread | painted |  |
| land | a ground-shaking landing | painted |  |
| punchA | a jab with the upper near arm | painted |  |
| punchB | a jab with the lower near arm | painted |  |
| haymakerUp | winding up the haymaker | painted |  |
| haymaker | the haymaker: everything behind one swing | painted |  |
| clap | the overhead clap | painted |  |
| slamUp | leaping up for the ground slam, all arms raised | painted |  |
| slam | the ground slam | painted |  |
| meteor | the meteor drop: plunging fists first | painted |  |
| carry | holding something overhead | painted |  |
| carryRun | running with it overhead | painted |  |
| throw | hurling it | painted |  |
| hurt | knocked back (barely) | painted |  |
| defeat | down | painted |  |
| swim | striding along the bottom, arms paddling (he sinks) | painted |  |
| tread | standing on the bottom, arms paddling | painted |  |
| drown | out of air | painted |  |

## XLR8 (`xlr8`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | bouncing on his ball feet, tail flicking, claws ready | painted |  |
| run | a blur of a run: leaning flat out, feet a spin, speed streaks | painted |  |
| jump | a springy push off | painted |  |
| fall | tail up for balance | painted |  |
| land | a skidding landing | painted |  |
| strikeA | a claw slash with the near hand | painted |  |
| strikeB | a claw slash with the far hand | painted |  |
| kick | a high kick | painted |  |
| dash | the dash: flat out, streaks everywhere | painted |  |
| hurt | knocked back, tail up | painted |  |
| defeat | down, dazed | painted |  |
| swim | kicking along like a torpedo | painted |  |
| tread | running in place on the water | painted |  |
| drown | thrashing | painted |  |
| talk | talking fast | painted |  |
| point | pointing | painted |  |
| cheer | arms up | painted |  |
| surprise | jolted | painted |  |

## WILDMUTT (`wildmutt`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | breathing hard, gills flaring, sniffing the air | painted |  |
| run | a rotary gallop: gather, stretch, land | painted |  |
| jump | springing up | painted |  |
| fall | paws out | painted |  |
| land | a crouching landing | painted |  |
| clawA | a rake with the near paw | painted |  |
| clawB | a rake with the far paw | painted |  |
| clawC | rearing up for a double rake | painted |  |
| pounce | the pounce: stretched flat out, claws first | painted |  |
| hurt | knocked back, jaw wide | painted |  |
| defeat | down on his side | painted |  |
| climb | crawling up a wall | painted |  |
| cling | clinging to a wall, sniffing | painted |  |
| swim | dog-paddling | painted |  |
| tread | paddling in place, head up | painted |  |
| drown | thrashing | painted |  |
| talk | growling | painted |  |
| sniff | nose to the floor, sniffing | painted |  |
| howl | head back, howling | painted |  |
| cheer | bouncing, tail going | painted |  |

## STINKFLY (`stinkfly`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | standing on six legs, eyestalks swaying, wings twitching | painted |  |
| run | scuttling on six legs, wings buzzing | painted |  |
| jump | a buzzing hop | painted |  |
| fall | wings half open | painted |  |
| land | touching down | painted |  |
| fly | flying: wings a blur, legs tucked | painted |  |
| glide | gliding on spread wings | painted |  |
| spit | spitting slime from the eyestalks | painted |  |
| vent | venting stink from the tail | painted |  |
| hurt | knocked back, stalks recoiling | painted |  |
| defeat | on his back, legs in the air | painted |  |
| swim | soaked wings, paddling with his legs | painted |  |
| tread | floating, legs paddling | painted |  |
| drown | thrashing | painted |  |
| talk | stalks bobbing | painted |  |
| cheer | a happy buzz | painted |  |

## UPGRADE (`upgrade`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a loose, liquid sway, circuits pulsing | painted |  |
| run | a rubbery run, limbs stretching | painted |  |
| jump | push off | painted |  |
| fall | arms up, stretching | painted |  |
| land | a splashy landing that wobbles | painted |  |
| laser | firing the eye beam ahead | painted |  |
| laserUp | the eye beam up | painted |  |
| laserDown | the eye beam down | painted |  |
| merge | melting into a puddle of liquid metal and sliding along | painted |  |
| hurt | knocked back, ripples through his body | painted |  |
| defeat | down, circuits flickering | painted |  |
| swim | sinking slowly, swimming in a liquid ripple | painted |  |
| tread | bobbing upright | painted |  |
| drown | thrashing (he does not need air) | painted |  |
| talk | eye pulsing as he talks | painted |  |
| point | pointing | painted |  |
| cheer | arms up | painted |  |
| surprise | eye wide | painted |  |
| think | scanning | painted |  |

## DIAMONDHEAD (`diamondhead`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a solid stance, crystals glinting | painted |  |
| run | a heavy, sure run | painted |  |
| jump | push off | painted |  |
| fall | arms out | painted |  |
| land | a hard landing | painted |  |
| shoot | firing crystal shards from the near hand | painted |  |
| shootUp | shards upward | painted |  |
| shield | a crystal shield wall held out | painted |  |
| shieldUp | the shield angled up | painted |  |
| shieldDown | the shield angled down | painted |  |
| grow | raising a hand as crystal grows | painted |  |
| spikes | fists to the ground: spikes burst up around him | painted |  |
| hurt | knocked back, chips flying | painted |  |
| defeat | down | painted |  |
| swim | sinking, striding along the bottom | painted |  |
| tread | standing on the bottom, arms paddling | painted |  |
| drown | thrashing (he does not need air) | painted |  |
| talk | talking | painted |  |
| point | pointing | painted |  |
| cheer | arms up | painted |  |
| surprise | jolted | painted |  |
| think | chin on fist | painted |  |

## GHOSTFREAK (`ghostfreak`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | floating, tail curling, claws twitching | painted |  |
| run | drifting fast, tail streaming back | painted |  |
| jump | rising | painted |  |
| fall | drifting down, arms up | painted |  |
| land | settling | painted |  |
| lash | tentacles whipping out of his chest | painted |  |
| lashLong | a long lash | painted |  |
| phase | arms wrapped round himself, phasing | painted |  |
| scream | the scream: arms flung wide, jaw gaping | painted |  |
| hurt | recoiling, eye shut | painted |  |
| defeat | fading, slumped | painted |  |
| swim | drifting as if the water were not there | painted |  |
| tread | hanging in the water | painted |  |
| drown | thrashing (he does not need air) | painted |  |
| talk | a whisper | painted |  |
| point | a long claw pointing | painted |  |
| cheer | arms up | painted |  |
| surprise | eye wide | painted |  |
| think | claw at his jaw | painted |  |

## GREY MATTER (`greymatter`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | a know-it-all stance, head tilting | painted |  |
| run | a scurry of tiny steps | painted |  |
| jump | a little hop | painted |  |
| fall | arms flailing | painted |  |
| land | a tiny landing | painted |  |
| biteA | a nip | painted |  |
| biteB | a lunging chomp | painted |  |
| scan | ANALYZE: a finger to his temple, eyes blazing | painted |  |
| hurt | knocked back | painted |  |
| cheer | arms up, delighted with himself | painted |  |
| defeat | down | painted |  |
| swim | a tiny breaststroke | painted |  |
| tread | treading water | painted |  |
| drown | out of air | painted |  |
| talk | lecturing | painted |  |
| point | pointing out the obvious | painted |  |
| shrug | a smug shrug | painted |  |
| think | pondering | painted |  |
| surprise | eyes huge | painted |  |

## RIPJAWS (`ripjaws`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | on dry land: balanced on his tail, gills flaring, jaw working | painted |  |
| run | hopping along on his tail, big springy bounds | painted |  |
| jump | a tail-spring push off | painted |  |
| fall | tail curling, arms out | painted |  |
| land | squashing down on his tail | painted |  |
| swim | swimming flat out: body level, tail beating, arms swept back | painted |  |
| tread | hanging in the water, tail waving, hands sculling | painted |  |
| dash | RIP DASH: a torpedo, jaws first, tail a blur | painted |  |
| biteA | a snapping chomp | painted |  |
| biteB | the lunging CHOMP, jaws as wide as they go | painted |  |
| swimBite | a bite on the move in the water | painted |  |
| whip | the tail whip: a full spin, tail out | painted |  |
| gasp | out of water: gasping, a hand at his gills | painted |  |
| hurt | knocked back, jaw open | painted |  |
| defeat | down, flopping | painted |  |
| drown | thrashing | painted |  |
| roar | the discovery: arms flung wide, jaws wide open, lure blazing | painted |  |
| talk | talking through a mouthful of fangs | painted |  |
| cheer | fists up, grinning fangs | painted |  |
| point | pointing | painted |  |
| surprise | eyes wide | painted |  |

## PLUMBER SENTRY (`warden`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | on its beat: bobbing, fins sculling, the lens looking about (green) | painted |  |
| lock | locked on: leaning in, fins out, the lens red and staring | painted |  |
| fire | the stun beam: a kick back off the shot | painted |  |

## FISHBOWL GRUNT (`grunt`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | standing guard, harpoon on its shoulder, bubbles in the bowl | painted |  |
| walk | a heavy lead-booted trudge | painted |  |
| windup | the tell: the harpoon drawn back over its shoulder | painted |  |
| throw | the throw: arm whipping through, empty-handed | painted |  |
| flop | bowl broken: a fish flopping on the deck in a diving suit | painted |  |
| idleBare | standing, bowl broken (in water) | painted |  |
| walkBare | walking, bowl broken (in water) | painted |  |
| windupBare | the tell, bowl broken | painted |  |
| throwBare | the throw, bowl broken | painted |  |

## ZAPPER EEL (`eel`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| swim | a slow ripple through the water | painted |  |
| charge | the tell: coiled tight, spots blazing, crackling | painted |  |
| zap | the shock: body rigid, arcs off every spot | painted |  |
| flop | drained out of its tank: flopping on the floor | painted |  |

## JELLY MINE (`jelly`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| pulse | drifting: the bell pulsing, tendrils trailing | painted |  |

## GNASHER SWARM (`gnasher`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| swim | circling as a loose school | painted |  |
| bunch | the tell: bunched into a tight ball, all turned one way | painted |  |
| dart | darting in a line, jaws first | painted |  |
| flop | drained: a heap of flapping fish | painted |  |

## DEEPMAW (`deepmaw`)

| Animation | What it is | Now | Drawings |
|---|---|---|---|
| idle | hanging in the water: fins sculling, tail swaying, the lure bobbing | painted |  |
| swim | cruising: tail sweeping, fins back | painted |  |
| lure | baiting: the lure drifts out in front, swaying, jaws a little open | painted |  |
| flare | the tell: the lure flares white and freezes, the body goes still | painted |  |
| lunge | the lunge: jaws as wide as they go, everything thrown forward | painted |  |
| spit | the lure flash: rearing back, the bulb blazing | painted |  |
| stunned | lure hit: dazed, jaw hanging open (hit him now), eye spinning | painted |  |
| flop | on dry deck: propped on his fins, flopping and gasping | painted |  |
| slam | a tail slam: rearing up on his fins and crashing the tail down | painted |  |
| roll | curled for the rolling chomp: fins tucked, jaws open | painted |  |
| leap | a belly flop: launched up, fins spread | painted |  |
| swallow | the maelstrom: jaws wide, sucking everything in | painted |  |
| hurt | flinching back | painted |  |
| defeat | beaten: belly up, eye shut, lure out | painted |  |
| talk | gloating, jaw flapping | painted |  |
| roar | a roar, jaws wide, lure blazing | painted |  |
