"use strict";

// Breil, Osterholz, Nestler & Back (2021), Tables 3–7, cue validity columns.
// Only the 25 dynamic cue categories (facial expression, body language, paralanguage).
// Each entry: [pooled r, 95% CI lower, 95% CI upper, k samples, n participants].
// A single study has no interval (lower and upper are null). Missing keys = not studied (n/a).

const cueInfo = {
  // Face
  cheerful: {
    label: "Cheerful expression", source: "Cheerful facial expression", channel: "Face",
    more: "Looks more cheerful", less: "Looks more neutral",
    groupMore: "look more cheerful than average", groupLess: "look less cheerful than average",
  },
  dominant: {
    label: "Dominant expression", source: "Dominant facial expression", channel: "Face",
    more: "Firmer, more dominant look", less: "Softer look",
    groupMore: "look more dominant than average", groupLess: "look less dominant than average",
  },
  expressiveness: {
    label: "Facial expressiveness", source: "General expressiveness", channel: "Face",
    more: "More expressive", less: "Less expressive",
    groupMore: "are more expressive than average", groupLess: "are less expressive than average",
  },
  // The table codes this cue as unconcerned (high) vs. serious (low), so the label keeps that direction.
  serious: { label: "Unconcerned expression", source: "Unconcerned (vs. serious)", channel: "Face" },
  "eye-contact": { label: "Eye contact", source: "Eye contact", channel: "Face" },
  eyebrows: { label: "Eyebrow movements", source: "Eyebrow movements", channel: "Face" },

  // Body
  "body-movement": { label: "Body movement", source: "Body movement", channel: "Body" },
  lean: {
    label: "Leaning in", source: "Forward lean / proximity", channel: "Body",
    more: "Closer, leaning in", less: "Farther away, upright",
    groupMore: "lean in or stand closer than average", groupLess: "keep more distance than average",
  },
  gestures: {
    label: "Hand gestures", source: "Gestures", channel: "Body",
    more: "More gestures", less: "Fewer gestures",
    groupMore: "gesture more than average", groupLess: "gesture less than average",
  },
  "head-movement": { label: "Head movements", source: "Head movements", channel: "Body" },
  "open-posture": {
    label: "Upright posture", source: "Self-assured / open vs. slouching", channel: "Body",
    more: "Upright and open", less: "Slouched",
    groupMore: "stand more upright and open than average", groupLess: "slouch more than average",
  },
  "closed-arms": {
    label: "Crossed arms", source: "Closed arms", channel: "Body",
    more: "Arms crossed", less: "Arms open",
    groupMore: "cross their arms more than average", groupLess: "cross their arms less than average",
  },
  "self-touch": {
    label: "Self-touch", source: "Self-touch", channel: "Body",
    more: "Often touches face or neck", less: "Rarely touches face or neck",
    groupMore: "touch their face or neck more than average", groupLess: "touch their face or neck less than average",
  },
  tension: {
    label: "Visible tension", source: "Tension / nervousness (vs. relaxed)", channel: "Body",
    more: "Tense", less: "Relaxed",
    groupMore: "look more tense than average", groupLess: "look more relaxed than average",
  },
  stride: {
    label: "Stride length", source: "Stride length", channel: "Body",
    more: "Longer steps", less: "Shorter steps",
    groupMore: "take longer steps than average", groupLess: "take shorter steps than average",
  },

  // Voice
  ease: { label: "Easy to understand", source: "Ease of understanding", channel: "Voice" },
  "voice-variation": {
    label: "Vocal variation", source: "Expressive / varying voice", channel: "Voice",
    more: "Lively, varied", less: "Flat, monotone",
    groupMore: "vary their voice more than average", groupLess: "speak more monotonously than average",
  },
  fluent: {
    label: "Fluent speech", source: "Fluent speaking (vs. nervous)", channel: "Voice",
    more: "Fluent", less: "Halting",
    groupMore: "speak more fluently than average", groupLess: "speak less fluently than average",
  },
  "pleasant-voice": {
    label: "Pleasant voice", source: "Pleasantness of voice", channel: "Voice",
    more: "Rated more pleasant", less: "Rated less pleasant",
    groupMore: "have voices rated more pleasant than average", groupLess: "have voices rated less pleasant than average",
  },
  "confident-voice": {
    label: "Confident voice", source: "Powerful / confident voice (vs. soft)", channel: "Voice",
    more: "Powerful, projected", less: "Soft",
    groupMore: "sound more powerful than average", groupLess: "sound softer than average",
  },
  loudness: { label: "Loudness", source: "Loudness", channel: "Voice" },
  pitch: {
    label: "Voice pitch", source: "Pitch", channel: "Voice",
    more: "Higher pitch", less: "Lower pitch",
    groupMore: "speak at a higher pitch than average", groupLess: "speak at a lower pitch than average",
  },
  "speech-rate": { label: "Speech rate", source: "Speech rate", channel: "Voice" },
  speech: {
    label: "Talking time", source: "Speech vs. non-speech", channel: "Voice",
    more: "Talks more", less: "Talks less",
    groupMore: "talk more than average", groupLess: "talk less than average",
  },
  interruptions: { label: "Interruptions", source: "Interruptions", channel: "Voice" },
};

// Source order of the tables, used to break ties.
const cueOrder = [
  "cheerful", "dominant", "expressiveness", "serious", "eye-contact", "eyebrows",
  "body-movement", "lean", "gestures", "head-movement", "open-posture", "closed-arms",
  "self-touch", "tension", "stride",
  "ease", "voice-variation", "fluent", "pleasant-voice", "confident-voice", "loudness",
  "pitch", "speech-rate", "speech", "interruptions",
];

const traitData = [
  {
    name: "Extraversion", short: "E", table: 4,
    gist: "Sociable, energetic, assertive.",
    validity: {
      cheerful: [.15, .09, .21, 17, 1789], dominant: [.10, -.08, .27, 6, 669],
      expressiveness: [.14, .03, .25, 3, 311], serious: [-.05, -.35, .26, 3, 382],
      "eye-contact": [.03, -.02, .09, 12, 1222], eyebrows: [-.04, -.17, .10, 4, 394],
      "body-movement": [.09, -.02, .20, 8, 733], lean: [.14, .04, .24, 7, 893],
      gestures: [.18, .11, .24, 12, 1226], "head-movement": [.00, -.14, .13, 8, 808],
      "open-posture": [.15, -.01, .31, 5, 520], "closed-arms": [-.06, -.18, .05, 6, 623],
      "self-touch": [.04, -.03, .12, 7, 697], tension: [-.16, -.24, -.08, 7, 713],
      stride: [.03, -.07, .13, 3, 382],
      ease: [.09, -.04, .22, 4, 449], "voice-variation": [.21, .08, .33, 7, 849],
      fluent: [.10, -.03, .22, 5, 564], "pleasant-voice": [.17, .08, .26, 4, 455],
      "confident-voice": [.22, .13, .30, 6, 894], loudness: [.21, -.03, .43, 3, 387],
      pitch: [-.04, -.15, .08, 5, 821], "speech-rate": [.16, -.25, .52, 3, 493],
      speech: [.23, .15, .32, 9, 932], interruptions: [.13, -.01, .27, 2, 197],
    },
  },
  {
    name: "Agreeableness", short: "A", table: 6,
    gist: "Warm, cooperative, considerate.",
    validity: {
      cheerful: [.10, .02, .19, 13, 1225], dominant: [-.17, -.27, -.06, 4, 385],
      expressiveness: [.09, null, null, 1, 62], serious: [-.05, -.19, .09, 2, 200],
      "eye-contact": [.00, -.08, .08, 7, 577], eyebrows: [.09, -.08, .26, 3, 136],
      "body-movement": [-.08, -.23, .07, 4, 272],
      gestures: [-.05, -.27, .17, 4, 334], "head-movement": [.06, -.16, .28, 5, 323],
      "open-posture": [.07, -.20, .33, 4, 310], "closed-arms": [.07, -.05, .19, 3, 273],
      "self-touch": [-.02, -.22, .19, 2, 162], tension: [-.02, -.26, .23, 4, 325],
      stride: [-.22, -.41, -.01, 2, 200],
      ease: [.28, null, null, 1, 100],
      fluent: [.15, -.07, .35, 3, 262], "pleasant-voice": [.09, -.05, .23, 2, 200],
      "confident-voice": [-.02, -.22, .18, 2, 200],
      pitch: [.18, .04, .31, 2, 200], "speech-rate": [.11, null, null, 1, 54],
      speech: [-.11, null, null, 1, 112], interruptions: [-.22, null, null, 1, 138],
    },
  },
  {
    name: "Conscientiousness", short: "C", table: 7,
    gist: "Organised, dependable, self-disciplined.",
    validity: {
      cheerful: [.09, -.04, .22, 5, 529], dominant: [-.05, -.14, .05, 4, 414],
      serious: [.04, -.10, .18, 2, 200],
      "eye-contact": [.06, -.05, .17, 3, 363], eyebrows: [-.17, -.70, .47, 2, 116],
      "body-movement": [.03, -.27, .32, 3, 212],
      gestures: [.03, -.14, .20, 3, 300], "head-movement": [-.01, -.30, .29, 2, 200],
      "open-posture": [.16, .04, .29, 3, 237], "closed-arms": [-.15, -.28, -.01, 2, 213],
      "self-touch": [-.21, -.34, -.07, 2, 200], tension: [.01, -.19, .20, 4, 325],
      stride: [-.16, null, null, 1, 100],
      ease: [.03, -.11, .17, 2, 200],
      fluent: [.06, -.10, .21, 3, 338], "pleasant-voice": [-.04, -.18, .10, 2, 200],
      "confident-voice": [.10, -.04, .24, 2, 200],
      pitch: [.04, null, null, 1, 100], "speech-rate": [.02, null, null, 1, 138],
      speech: [.22, null, null, 1, 112],
    },
  },
  {
    name: "Neuroticism", short: "N", table: 3,
    gist: "Prone to worry, tension and low mood.",
    validity: {
      cheerful: [-.11, -.18, -.03, 9, 862], dominant: [-.06, -.16, .04, 4, 414],
      expressiveness: [-.15, null, null, 1, 62], serious: [-.03, -.16, .11, 3, 299],
      "eye-contact": [-.07, -.19, .07, 7, 524], eyebrows: [.31, -.55, .85, 2, 116],
      "body-movement": [-.06, -.20, .08, 5, 498], lean: [-.06, -.24, .12, 3, 365],
      gestures: [-.03, -.12, .07, 5, 420], "head-movement": [-.10, -.27, .08, 3, 189],
      "open-posture": [-.01, -.16, .14, 4, 336], "closed-arms": [.06, -.06, .17, 3, 313],
      "self-touch": [-.01, -.14, .13, 3, 208], tension: [.13, .02, .23, 4, 325],
      stride: [.05, -.09, .19, 2, 200],
      ease: [.05, -.09, .19, 2, 200], "voice-variation": [-.24, -.43, -.02, 2, 123],
      fluent: [-.10, -.20, -.01, 7, 698], "pleasant-voice": [-.12, -.23, .00, 3, 299],
      "confident-voice": [-.07, -.19, .04, 3, 299], loudness: [-.14, -.29, .02, 2, 248],
      pitch: [-.01, -.25, .23, 3, 299], "speech-rate": [.20, null, null, 1, 54],
      speech: [-.13, -.32, .07, 5, 446],
    },
  },
  {
    name: "Openness", short: "O", table: 5, display: "Openness to experience",
    gist: "Curious, imaginative, open to new ideas.",
    validity: {
      cheerful: [.02, -.06, .09, 6, 711], dominant: [.04, -.04, .12, 5, 596],
      expressiveness: [-.01, null, null, 1, 182], serious: [.01, -.09, .11, 3, 382],
      "eye-contact": [-.07, -.20, .06, 5, 645], eyebrows: [-.08, -.26, .10, 2, 116],
      "body-movement": [-.03, -.13, .07, 4, 394], lean: [.02, null, null, 1, 182],
      gestures: [.03, -.07, .13, 3, 394], "head-movement": [-.01, -.12, .09, 3, 382],
      "open-posture": [.10, -.03, .23, 3, 237], "closed-arms": [-.03, -.13, .06, 4, 495],
      "self-touch": [.02, -.16, .21, 2, 282], tension: [-.04, -.13, .05, 5, 507],
      stride: [.00, -.13, .13, 3, 382],
      ease: [.02, -.09, .14, 3, 382],
      fluent: [-.02, -.13, .08, 4, 520], "pleasant-voice": [.10, .00, .20, 3, 382],
      "confident-voice": [-.07, -.24, .10, 3, 382], loudness: [-.18, null, null, 1, 182],
      pitch: [-.06, -.18, .07, 3, 382],
      speech: [-.17, -.32, -.02, 3, 432], interruptions: [-.04, null, null, 1, 182],
    },
  },
];

// A link "has evidence" when at least two samples were pooled and the reported
// 95% interval lies wholly above or below zero, at the tables' two-decimal precision.
for (const trait of traitData) {
  const rows = cueOrder.map((id, order) => {
    const entry = trait.validity[id];
    if (!entry) return { id, order, status: "none" };
    const [r, lo, hi, k, n] = entry;
    const status = lo === null ? "single" : lo > 0 || hi < 0 ? "link" : "unclear";
    return { id, order, r, lo, hi, k, n, status };
  });
  const byStrength = (a, b) => Math.abs(b.r) - Math.abs(a.r) || a.order - b.order;
  trait.links = rows.filter(row => row.status === "link").sort(byStrength);
  trait.unclear = rows.filter(row => row.status === "unclear").sort(byStrength);
  trait.single = rows.filter(row => row.status === "single");
  trait.unstudied = rows.filter(row => row.status === "none");
  trait.sparse = [...trait.single, ...trait.unstudied];
}
