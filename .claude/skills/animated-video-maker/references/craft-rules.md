# Craft rules

Read this before storyboarding and again before delivery. Each rule says *why*, because the
same root problem shows up in new forms on every project.

## Contents
1. Sync and rhythm
2. Lyrics and on-screen text
3. Brand
4. Composition, decoration, backgrounds
5. Characters, hands, expressions
6. Actions, objects, transitions
7. Environments and realism
8. Accuracy of content
9. Endings
10. Pre-delivery checklist

---

## 1. Sync and rhythm
- **Cuts on beats.** Every scene change sits on a detected beat, preferably a downbeat or strong beat between sung phrases. Choose the cut from the timeline (`music.bt(i)`), not a rounded second.
- **Impacts on beats.** Landings, slams, stamps, price drops, colour switches and products dropping in all land exactly on a beat (or an 8th note when things are dense). Start the motion before the beat so the *contact* happens on it: `start = beat - fallDuration`.
- **Something on every beat.** Never leave a beat with nothing reacting. Cheap and effective options:
  - a frame shake or zoom punch on kicks;
  - decorations that hop in a wave across the floor;
  - lamps swinging;
  - speaker cones pumping;
  - neon bars cycling;
  - confetti bursts from alternating corners.
- **Hierarchy.** Small beat: subtle. Backbeat: noticeable. Downbeat: strong. The drop and the last line: the biggest transformation. Don't fire the biggest effect everywhere, or nothing stands out.
- **Busy moments may relax.** When lots is moving, secondary motion can run freely; the main event still lands on the beat.
- **Lyric impacts are centred on the onset.** An entrance that *finishes* on the onset looks late. Start it ~40–60 ms early so its visual peak is on the syllable.

## 2. Lyrics and on-screen text
- **Use the real words.** Use the actual sung or spoken words, in the original language, never translated or invented. Flag uncertain ones to the user.
- **Timing.** A word appears when sung (never early) and stays readable ≥ 0.5 s. Verify with the audit.
- **Placement.** Words are either *part of the world* (platforms, signs, a board lighting up word by word) or a clean karaoke caption (bottom or top, outlined, the current word highlighted). Never block the action, never clip at the edge, never overlap other text.
- **When the camera moves**, keep the newest word in frame (follow both the character and the newest word).
- **Fast passing text** (tunnels, flying past) must hold long enough. Slow it, or make it ride along.
- **Strobing words** pulse in size or brightness; they never turn invisible.
- **Consistent sizing.** Words in the same sentence are the same size and font.

## 3. Brand
- **Spelling and case.** Exact, every time ("T-POT", never "TPOT" or "Teapot"). The user may type it loosely; the video never does.
- **Use the real logo, traced to vectors.** Run `trace_logo.py` (sharp at any size, exact colours), then split it with `logo_parts.py` so the letters can move individually.
- **Logo letterforms only when standalone.** On signs, screens, shirts and packaging, the brand word uses the logo's letterforms. Inside a sentence (captions, "T-POT'S DEALS") it is set in the same font as the other words; mixing a logo glyph into a line of text looks wrong because the sizes never match.
- **Brand colours lead the palette** (e.g. red, white and green for T-POT), especially at the end.

## 4. Composition, decoration, backgrounds
- **No empty space.** Every region of every frame has purposeful detail: walls with posters and shelves, floors with texture, skies with stars, moon and clouds, cities with lit windows. Check the dark or "before" states too; a dark room still shows dim furniture.
- **Spread decorations evenly.** Place items on an even grid across the *full* width (the starter's world helpers do this). Mirror density left and right. Never pile decoration in the centre while the edges stay bare, or the other way round.
- **Medium-sized, on-theme items only.** Lots of tiny scattered bits looks messy. Pick items that belong to the subject: for an appliance store, use products, price tags, posters, shelves, lamps and speakers.
- **Variety.** Never repeat the same object to fill space (a wall of identical TVs is monotonous). Each item should be a different product, colour or pose.
- **Backgrounds that fit the subject.** Store scenes use shop colours (white, light blue-grey, wood, brand red and green). Night scenes can be deep blue. Avoid arbitrary colours (purple floors in an appliance shop).
- **Respect framing.** Nothing important clipped at the edges. Keep the camera-to-subject corridor clear of props. In landscape, use the width (side elements, rows, wide sets), not a narrow centre column.

## 5. Characters, hands, expressions
- **Appealing, detailed characters.** Use cute animals or figures with:
  - fur or skin shading (gradients) and highlights;
  - big glossy eyes with two highlights;
  - muzzle, nose, inner ears, blush;
  - paws with pads and a tail;
  - clothes (a brand shirt).

  Bare geometric "bean" shapes read as cheap. Vary species and colours in crowds.
- **Hands.** A palm, four fingers with nails and knuckle creases, and a thumb. The fingers curl around what they hold, and the thumb folds across. The arm (sleeve and forearm) comes in from the frame edge, so the hand clearly belongs to someone. Use the starter's `drawHand` / `drawArm`.
- **Expressions that read instantly.** Surprise: wide eyes, raised brows, an "o" mouth. Shock: huge eyes, tiny pupils, a dropped jaw, sweat, shock lines. Joy: ^ ^ eyes and an open smile. Escalate expressions across consecutive words.
- **Mirrored characters** must not mirror text on their clothes.
- **Idle life.** Blink, bob and look around between actions.

## 6. Actions, objects, transitions
- **Every action reads at a glance.** Anticipation, then the action, then follow-through. Add motion lines, squash on landing, dust puffs, and a sound-word ("CLICK!", "POOF!", "SCREECH!") where it helps.
- **No objects from nowhere.** If something needs to appear, derive it from what's on screen: duplicate the logo on the sign and fly the copy, or pull the product out of a box. Use pop-ins only for genuinely new elements, and even then give them a source (a puff, a portal, a drop from above).
- **Destinations exist before you arrive.** The store is at the end of the road from frame one, growing as you approach. The fridge you're walking to is already in the room.
- **Smooth transitions.** Treat a sequence as one continuous camera move:
  - ease in and out (no linear jerks);
  - match framing across cuts (zoom into a screen whose picture *is* the next scene, drawn at uniform scale so nothing jumps);
  - cross-fade at the same rotation or speed;
  - ramp rotation and speed smoothly (cubic), with blur proportional to speed.
- **"Pop" vs "flow".** Use hard cuts and pops on beats for energy, and continuous moves for journeys. Don't mix them in the same moment.
- **Geometry must be right.** A disco ball is a sphere: tiles shrink toward the poles and are clipped to the circle. Shadows sit under objects; perspective converges consistently.

## 7. Environments and realism
- **Streets** need continuous buildings on both sides (with lit windows and a few signs), street lamps, trees, billboards, cars (that you overtake), and a sky with stars, a moon, clouds and a distant skyline. Landmarks don't stand alone: give them neighbours.
- **Shops** need shelves with varied stock, price tags, ceiling lights, floor texture and posters.
- **Speed and travel:** speed lines, zoom blur growing with speed, a dashboard or foreground element, and a jolt and screech when stopping.
- **Party or crowd:** crowds in rows with a wave that rolls back row by row, bunting, balloons, confetti, stage lights.

## 8. Accuracy of content
- **Numbers.** Do the arithmetic the user asked for and show it exactly. "Divide by 3" means each final price is the original / 3; choose originals that divide cleanly (2,997 → 999). Use consistent currency formatting (RM1,333).
- **Number of steps.** Follow it literally: "one time change, original to final" means a single drop, with no intermediate step.
- **Transformations must be obvious.** For a price cut: show the old price, a clear slash, the old price removed, the new price stamped in, and a "SAVE 50%" burst.
- **Storyboard fidelity.** If the user specified what happens on a line, do exactly that, on that line. Improvise only in the gaps, and mention what you added.

## 9. Endings
- End on the final image the user asked for (usually the logo), and simply stop there.
- No extra white card, fade-out or credits unless asked.
- The final hit lands on the last downbeat. Freeze shortly after so the frame is clean.

## 10. Pre-delivery checklist
- [ ] Every cut on a beat. Every beat has visible motion. The drop and the last line are the biggest moments.
- [ ] Audit passes: every word ≥ 0.5 s readable, appears within 0.1 s of its onset, never early.
- [ ] Contact sheet of every scene: no empty regions, decoration evenly spread, nothing clipped, no text covered.
- [ ] Brand spelled exactly. Logo letterforms used only for the standalone brand word.
- [ ] Characters detailed. Hands realistic. Mirrored text not mirrored.
- [ ] Nothing pops from nowhere. Destinations present beforehand. Transitions eased and continuous.
- [ ] Numbers checked (and the arithmetic shown in the report).
- [ ] Ends exactly as requested.
- [ ] Spot-check frames from the rendered MP4 itself (not just the stills).
- [ ] Report: per-request changes, how each was verified, and what couldn't be checked (sound).
