// The storyboard: one entry per scene, in order. `start` is seconds or { beat: n } (a real beat
// from the timeline - prefer this, so every cut lands on the beat). `phrase` = index of the
// lyric line shown as a caption in that scene (omit for instrumental scenes).
import example from './example.js';

export const SCENES = [
  { make: example, start: 0, phrase: 0 },
  // { make: chorus, start: { beat: 49 }, phrase: 6 },
];
