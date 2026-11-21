"use strict";

// Vector illustration of each cue. World coordinates: 640 × 480, ground at y = 460.
// Each cue maps an amount (0 = less of the cue, 1 = more) and a clock to a pose.
const motionFigure = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
  const smooth = x => { const u = clamp(x); return u * u * (3 - 2 * u); };
  const mix2 = (p, q, t) => [mix(p[0], q[0], t), mix(p[1], q[1], t)];
  const rad = deg => deg * Math.PI / 180;
  const rot = ([x, y], deg) => {
    const c = Math.cos(rad(deg));
    const s = Math.sin(rad(deg));
    return [x * c - y * s, x * s + y * c];
  };
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const n = x => Math.round(x * 10) / 10;
  const pt = p => `${n(p[0])} ${n(p[1])}`;

  function el(name, attrs = {}, parent) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent?.append(node);
    return node;
  }

  // ---------- Signals ----------

  function syllables(t) {
    const pulse = .5 + .5 * Math.sin(t * 2 * Math.PI * 3.4 + 1.6 * Math.sin(t * 2.1));
    const phrase = .55 + .45 * Math.sin(t * 1.55 + .4);
    return pulse * phrase;
  }

  function blink(t) {
    const cycle = (t + .9) % 3.8;
    return cycle < .17 ? 1 - .94 * Math.sin(Math.PI * cycle / .17) : 1;
  }

  // Deterministic pseudo-random numbers for bar textures.
  const noise = i => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // ---------- Poses ----------

  const REST_L = [271, 288];
  const REST_R = [369, 288];

  function frontBase(t, m) {
    const breath = Math.sin(t * 1.7) * m;
    return {
      sh: breath * 1.2, widen: 0, tilt: 0, hx: 0, hy: breath * .5,
      face: { smile: .1, open: 0, brow: 0, frown: 0, worry: 0, eye: m > .4 ? blink(t) : 1 },
      handL: REST_L.slice(), handR: REST_R.slice(),
      // Optional elbow placement (weight 0 = solve from the hand position).
      elbowL: [262, 232], elbowR: [378, 232], bendL: 0, bendR: 0,
    };
  }

  function talk(p, t, m, strength = 1) {
    const level = syllables(t) * m;
    p.face.open = Math.max(p.face.open, level * .5 * strength);
    p.tilt += Math.sin(t * 1.3) * 1.4 * m;
    p.hy += Math.sin(t * 2.6) * .6 * m;
    return level;
  }

  function sideBase(t, m) {
    const breath = Math.sin(t * 1.7) * m;
    return {
      hip: [300, 290], lean: 0, slouch: 0, pitch: 0, chest: breath,
      legN: { a: 2, b: 0, foot: 0 }, legF: { a: -2, b: 0, foot: 0 },
      handN: [8, 118], handF: [1, 118],
      face: { smile: .12, eye: m > .4 ? blink(t) : 1 },
      partner: 0,
    };
  }

  function gait(q, A) {
    if (q < .5) {
      const s = q / .5;
      return { a: A * (1 - 2 * s), b: 3, foot: 7 * (1 - smooth(s / .2)) - 14 * smooth((s - .72) / .28) };
    }
    const s = (q - .5) / .5;
    return {
      a: -A + 2 * A * smooth(s),
      b: (16 + A * 1.1) * Math.sin(Math.PI * Math.min(1, s * 1.3)),
      foot: -14 * (1 - smooth(s / .35)) + 7 * smooth((s - .7) / .3),
    };
  }

  const mixLeg = (p, q, t) => ({ a: mix(p.a, q.a, t), b: mix(p.b, q.b, t), foot: mix(p.foot, q.foot, t) });

  const expressions = [
    { smile: .05, open: 0, brow: 0, frown: 0, tilt: 0 },
    { smile: .15, open: .42, brow: 1, frown: 0, tilt: -3 },
    { smile: 1, open: .12, brow: .35, frown: 0, tilt: 4 },
    { smile: -.18, open: 0, brow: -.2, frown: .65, tilt: -5 },
    { smile: .85, open: .5, brow: .55, frown: 0, tilt: 3 },
  ];

  const LEG = 162;
  const STRIDE_PERIOD = 1.1;

  const cues = {
    gestures(a, t, m) {
      const p = frontBase(t, m);
      talk(p, t, m);
      p.face.smile = .2;
      // Forearms come forward (foreshortened) and the hands beat and open with the speech.
      const spread = (.5 + .5 * Math.sin(t * 1.4)) * m;
      const beat = Math.abs(Math.sin(t * 4.1)) ** 2 * m;
      const lift = Math.sin(t * .9) * m;
      const left = [300 - spread * 30, 212 + beat * 12 - lift * 8];
      const right = [340 + spread * 26 + Math.sin(t * 2.1) * 5 * m, 218 + beat * 10 + Math.sin(t * 1.2 + 1) * 8 * m];
      const g = smooth(a);
      p.handL = mix2(REST_L, left, g);
      p.handR = mix2(REST_R, right, g);
      p.elbowL = [272 - spread * 8, 238 - lift * 3];
      p.elbowR = [368 + spread * 7, 240];
      p.bendL = g;
      p.bendR = g;
      p.tilt += a * 2 * Math.sin(t * 1.7) * m;
      return { view: "upper", front: p };
    },

    tension(a, t, m) {
      const p = frontBase(t * mix(1, 1.9, a), m);
      const fidget = a * m;
      const tight = smooth(a);
      p.sh += mix(-3, 16, a);
      p.widen = mix(1.5, -4, a);
      p.handL = mix2([267, 292], [309 + Math.sin(t * 9) * 2.6 * fidget, 252 + Math.sin(t * 11) * 1.6 * fidget], tight);
      p.handR = mix2([373, 292], [331 - Math.sin(t * 9 + 1) * 2.6 * fidget, 253 + Math.cos(t * 10) * 1.6 * fidget], tight);
      p.elbowL = [291, 232];
      p.elbowR = [349, 232];
      p.bendL = tight;
      p.bendR = tight;
      p.face.worry = .95 * a;
      p.face.brow = .2 * a;
      p.face.smile = mix(.22, -.25, a);
      p.face.eye *= mix(1, 1.12, a);
      p.hy += mix(0, 2.5, a);
      return { view: "upper", front: p };
    },

    "self-touch"(a, t, m) {
      const p = frontBase(t, m);
      const loop = t % 5.2;
      const pulse = (start, end) => smooth((loop - start) / .45) * (1 - smooth((loop - end) / .45));
      const allow = threshold => smooth((a - threshold) / .18);
      const hold = smooth((a - .4) / .25);
      const neck = mix(hold, pulse(.2, 1.8) * allow(.1), m);
      const chin = pulse(2.4, 3.4) * allow(.42) * m;
      const arm = pulse(3.7, 4.7) * allow(.68) * m;
      let right = mix2(REST_R, [338, 147 + Math.sin(t * 5) * 1.5 * m], neck);
      right = mix2(right, [328, 131], chin);
      p.handR = right;
      p.elbowR = mix2([366, 207], [334, 194], chin / Math.max(.001, neck + chin));
      p.bendR = Math.max(neck, chin);
      p.handL = mix2(REST_L, [350, 206 + Math.sin(t * 6) * 3 * m], arm);
      const touching = Math.max(neck, chin);
      p.face.eye *= 1 - .14 * touching;
      p.hy += 1.5 * touching;
      p.tilt += -3 * neck;
      return { view: "upper", front: p };
    },

    "closed-arms"(a, t, m) {
      const p = frontBase(t, m);
      const crossed = smooth(a);
      p.handL = mix2(REST_L, [349, 220], crossed);
      p.handR = mix2(REST_R, [291, 214], crossed);
      p.face.smile = mix(.2, 0, a);
      p.sh += 1.5 * crossed;
      return { view: "upper", front: p };
    },

    cheerful(a, t, m) {
      const p = frontBase(t, m);
      p.face.smile = a;
      p.face.brow = .2 * a;
      p.face.eye *= 1 - .34 * smooth((a - .4) / .6);
      p.tilt = 3 * a + Math.sin(t * .8) * 1.5 * m;
      return { view: "face", front: p };
    },

    expressiveness(a, t, m) {
      const p = frontBase(t, m);
      const position = (t / 1.3) % expressions.length;
      const index = Math.floor(position);
      const blend = smooth((position - index) / .45);
      const now = expressions[index];
      const next = expressions[(index + 1) % expressions.length];
      const still = expressions[2];
      const value = key => mix(still[key], mix(now[key], next[key], blend), m);
      const neutral = expressions[0];
      const scaled = key => mix(neutral[key], value(key), a);
      p.face.smile = scaled("smile");
      p.face.open = scaled("open");
      p.face.brow = scaled("brow");
      p.face.frown = scaled("frown");
      p.face.eye *= 1 - .3 * smooth((p.face.smile - .5) / .5);
      p.tilt = scaled("tilt");
      return { view: "face", front: p };
    },

    dominant(a, t, m) {
      const p = frontBase(t, m);
      p.face.brow = mix(.35, -.55, a);
      p.face.frown = mix(0, .62, a);
      p.face.smile = mix(.32, -.22, a);
      p.face.eye *= mix(1, .8, a);
      p.tilt = mix(7, 0, a);
      p.hy += mix(1, -2.5, a);
      return { view: "face", front: p };
    },

    lean(a, t, m) {
      const p = sideBase(t, m);
      const close = smooth(a);
      p.hip[0] = mix(232, 322, close);
      p.lean = mix(-2, 13, close);
      p.pitch = mix(-3, 4, close) + Math.sin(t * 2.1) * 2.5 * m * close;
      p.handN = [mix(8, 16, close), 117];
      p.partner = 1;
      return { view: "side", side: p };
    },

    "open-posture"(a, t, m) {
      const p = sideBase(t, m);
      p.slouch = mix(23, -3, a);
      p.lean = mix(4, -1.5, a);
      p.pitch = mix(13, -5, a);
      p.chest += mix(-3, 3, a);
      p.handN = [mix(18, 5, a), 116];
      p.handF = [mix(12, -1, a), 116];
      p.face.smile = mix(0, .25, a);
      return { view: "side", side: p };
    },

    stride(a, t, m) {
      const p = sideBase(t, m);
      const A = mix(8, 23, a);
      const qN = (t / STRIDE_PERIOD) % 1;
      const qF = (qN + .5) % 1;
      const walkN = gait(qN, A);
      const walkF = gait(qF, A);
      const standA = A * .9;
      p.legN = mixLeg({ a: standA, b: 0, foot: 4 }, walkN, m);
      p.legF = mixLeg({ a: -standA, b: 0, foot: -6 }, walkF, m);
      const stance = qN < .5 ? walkN.a : walkF.a;
      p.hip[1] = 290 + LEG * mix(1 - Math.cos(rad(standA)), 1 - Math.cos(rad(stance)), m);
      p.lean = 3;
      const swing = mix(standA, walkN.a, m) * .85;
      p.handN = rot([0, 117], swing);
      p.handF = rot([0, 117], -swing);
      p.walk = { A, speed: 4 * LEG * Math.sin(rad(A)) / STRIDE_PERIOD * m, step: 2 * LEG * Math.sin(rad(A)) };
      return { view: "side", side: p };
    },

    speech(a, t, m) {
      const p = frontBase(t, m);
      const share = mix(.2, .85, a);
      const slot = 12 * ((t / 6) % 1);
      const speaking = slotWeight(Math.floor(slot), share);
      talk(p, t, m * smooth(speaking * 2 - .5));
      return { view: "voice", front: p, voice: { kind: "slots", share, head: m > .05 ? slot : -1 } };
    },

    "confident-voice"(a, t, m) {
      const p = frontBase(t, m);
      talk(p, t, m, mix(.55, 1.3, a));
      p.hy += mix(2.5, -1.5, a);
      p.widen = mix(-2, 2, a);
      p.sh += mix(1.5, -1, a);
      return { view: "voice", front: p, voice: { kind: "wave", amp: mix(.28, 1, a), rough: 0, t } };
    },

    "pleasant-voice"(a, t, m) {
      const p = frontBase(t, m);
      talk(p, t, m);
      p.face.smile = mix(0, .32, a);
      return { view: "voice", front: p, voice: { kind: "wave", amp: .72, rough: 1 - a, t } };
    },

    "voice-variation"(a, t, m) {
      const p = frontBase(t, m);
      talk(p, t, m);
      const contour = Math.sin(t * 2.2) * .6 + Math.sin(t * .9 + 1) * .4;
      p.face.brow = a * .75 * Math.max(0, contour) * m + .1 * a;
      p.tilt += a * 3 * contour * m;
      return { view: "voice", front: p, voice: { kind: "contour", spread: a, level: .5, t } };
    },

    pitch(a, t, m) {
      const p = frontBase(t, m);
      talk(p, t, m);
      p.hy += mix(1.5, -1, a);
      return { view: "voice", front: p, voice: { kind: "contour", spread: .22, level: a, t, staff: true } };
    },

    fluent(a, t, m) {
      const p = frontBase(t, m);
      const cycle = 5.5;
      const head = m > .05 ? (t % cycle) / cycle : -1;
      const token = blockAt(a, head);
      const speaking = token && token.type !== "pause" ? 1 : 0;
      talk(p, t, m * speaking, token?.type === "filler" ? .55 : 1);
      if (token?.type === "filler") p.face.brow = .3;
      return { view: "voice", front: p, voice: { kind: "blocks", fluency: a, head } };
    },
  };

  // Talking-time slots: a fixed order decides which seconds become speech.
  const slotRank = [3, 9, 0, 6, 11, 2, 7, 4, 10, 1, 8, 5];
  function slotWeight(index, share) {
    return clamp(share * 12 - slotRank[index]);
  }

  // Fluency script: words, plus hesitations that appear as fluency drops.
  const script = [
    [{ type: "word", w: 24 }, { type: "filler", w: 20, label: "uh", at: .78 }, { type: "word", w: 34 },
      { type: "pause", w: 16, at: .55 }, { type: "repeat", w: 24, label: "I–", at: .4 }, { type: "word", w: 18 }],
    [{ type: "word", w: 30 }, { type: "filler", w: 22, label: "um", at: .25 }, { type: "word", w: 26 },
      { type: "pause", w: 14, at: .12 }, { type: "word", w: 34 }],
  ];

  function layoutBlocks(fluency) {
    const rows = [];
    let total = 0;
    for (const row of script) {
      let x = 0;
      const items = [];
      for (const token of row) {
        const shown = token.type === "word" ? 1 : smooth(((1 - fluency) - (1 - token.at)) / .18 + 1);
        const visible = token.type === "word" ? 1 : smooth((token.at - fluency) / .16);
        const width = token.w * (token.type === "word" ? 1 : visible);
        items.push({ ...token, x, width, visible, shown, start: total + x });
        x += width + 5 * (token.type === "word" ? 1 : visible);
      }
      rows.push({ items, width: x });
      total += x;
    }
    return { rows, total };
  }

  function blockAt(fluency, head) {
    if (head < 0) return null;
    const { rows, total } = layoutBlocks(fluency);
    const at = head * total;
    for (const row of rows) {
      for (const item of row.items) {
        if (at >= item.start && at < item.start + item.width + 5) return item.visible > .5 || item.type === "word" ? item : null;
      }
    }
    return null;
  }

  // ---------- Geometry ----------

  function ik(shoulder, target, upper, lower, side, down = .35) {
    let dx = target[0] - shoulder[0];
    let dy = target[1] - shoulder[1];
    let d = Math.hypot(dx, dy) || .001;
    const max = upper + lower - .5;
    const min = Math.abs(upper - lower) + .5;
    const scale = d > max ? max / d : d < min ? min / d : 1;
    dx *= scale;
    dy *= scale;
    d *= scale;
    const along = (upper * upper - lower * lower + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, upper * upper - along * along));
    const ux = dx / d;
    const uy = dy / d;
    const base = [shoulder[0] + ux * along, shoulder[1] + uy * along];
    const options = [[base[0] - uy * h, base[1] + ux * h], [base[0] + uy * h, base[1] - ux * h]];
    const score = e => side * (e[0] - shoulder[0]) + down * (e[1] - shoulder[1]);
    const elbow = score(options[0]) >= score(options[1]) ? options[0] : options[1];
    return { elbow, hand: [shoulder[0] + dx, shoulder[1] + dy] };
  }

  function torsoPath(sh, widen) {
    const lx = 273 - widen;
    const rx = 367 + widen;
    const top = 146 - sh * .3;
    const sy = 167 - sh;
    return `M 305 ${n(top)} C 291 ${n(top + 2)}, ${n(lx + 3)} ${n(sy - 13)}, ${n(lx)} ${n(sy)}`
      + ` C ${n(lx - 3)} ${n(sy + 18)}, 283 210, 287 290 Q 320 298 353 290`
      + ` C 357 210, ${n(rx + 3)} ${n(sy + 18)}, ${n(rx)} ${n(sy)}`
      + ` C ${n(rx - 3)} ${n(sy - 13)}, 349 ${n(top + 2)}, 335 ${n(top)} Q 320 ${n(top + 8)} 305 ${n(top)} Z`;
  }

  // ---------- Build ----------

  function arm(parent, extra = "") {
    const g = el("g", { class: `arm ${extra}` }, parent);
    return {
      g,
      edge: el("path", { class: "f-sleeve-edge" }, g),
      fill: el("path", { class: "f-sleeve" }, g),
      hand: el("circle", { class: "f-skin", r: 10.5 }, g),
    };
  }

  function setArm(limb, shoulder, target, side, down, hint, weight = 0) {
    const solved = ik(shoulder, target, 60, 63, side, down);
    const hand = weight > 0 ? target : solved.hand;
    const elbow = weight > 0 ? mix2(solved.elbow, hint, weight) : solved.elbow;
    const reach = Math.hypot(hand[0] - elbow[0], hand[1] - elbow[1]) || 1;
    const wrist = mix2(hand, elbow, Math.min(.45, 9 / reach));
    const d = `M ${pt(shoulder)} L ${pt(elbow)} L ${pt(wrist)}`;
    limb.edge.setAttribute("d", d);
    limb.fill.setAttribute("d", d);
    limb.hand.setAttribute("cx", n(hand[0]));
    limb.hand.setAttribute("cy", n(hand[1]));
  }

  function buildFront(parent) {
    const g = el("g", { class: "rig rig-front" }, parent);
    el("path", { class: "f-trousers-fill", d: "M 287 272 L 353 272 L 357 312 Q 320 320 283 312 Z" }, g);
    el("path", { class: "f-leg", d: "M 305 300 L 302 372 L 300 444" }, g);
    el("path", { class: "f-leg", d: "M 335 300 L 338 372 L 340 444" }, g);
    el("path", { class: "f-shoe", d: "M 282 446 Q 284 438 298 438 Q 310 438 311 450 L 311 455 L 283 455 Q 280 452 282 446 Z" }, g);
    el("path", { class: "f-shoe", d: "M 358 446 Q 356 438 342 438 Q 330 438 329 450 L 329 455 L 357 455 Q 360 452 358 446 Z" }, g);
    el("path", { class: "f-skin-shade", d: "M 309 112 L 331 112 L 332 156 L 308 156 Z" }, g);
    const torso = el("path", { class: "f-sweater" }, g);
    const head = el("g", { class: "head" }, g);
    el("circle", { class: "f-hair", cx: 2, cy: -84, r: 13 }, head);
    el("ellipse", { class: "f-skin-shade", cx: -29, cy: -36, rx: 5.5, ry: 8.5 }, head);
    el("ellipse", { class: "f-skin-shade", cx: 29, cy: -36, rx: 5.5, ry: 8.5 }, head);
    el("ellipse", { class: "f-skin", cx: 0, cy: -38, rx: 29.5, ry: 35 }, head);
    el("path", {
      class: "f-hair",
      d: "M -31 -34 C -35 -62, -20 -80, 0 -80 C 21 -80, 35 -63, 31 -34 C 29 -47, 24 -56, 15 -60"
        + " C 5 -64, -9 -62, -18 -56 C -25 -51, -29 -44, -31 -34 Z",
    }, head);
    const cheekL = el("circle", { class: "f-blush", cx: -17, cy: -22, r: 6 }, head);
    const cheekR = el("circle", { class: "f-blush", cx: 17, cy: -22, r: 6 }, head);
    const browL = el("path", { class: "f-line f-brow" }, head);
    const browR = el("path", { class: "f-line f-brow" }, head);
    const eyeL = el("ellipse", { class: "f-ink", cx: -11, cy: -35, rx: 3.1 }, head);
    const eyeR = el("ellipse", { class: "f-ink", cx: 11, cy: -35, rx: 3.1 }, head);
    el("path", { class: "f-line f-nose", d: "M -1 -32 Q -4.5 -24 1.5 -23" }, head);
    const clip = el("clipPath", { id: "mouth-clip" }, head);
    const clipShape = el("path", {}, clip);
    const mouth = el("path", { class: "f-mouth" }, head);
    const teeth = el("rect", { class: "f-teeth", x: -16, width: 32, height: 5, "clip-path": "url(#mouth-clip)" }, head);
    const lips = el("path", { class: "f-line f-lips" }, head);
    const armL = arm(g);
    const armR = arm(g);
    return { g, torso, head, cheekL, cheekR, browL, browR, eyeL, eyeR, clipShape, mouth, teeth, lips, armL, armR, order: "" };
  }

  function buildSide(parent, extra = "") {
    const g = el("g", { class: `rig rig-side ${extra}` }, parent);
    const armF = arm(g, "far");
    const legF = { thigh: el("path", { class: "f-leg far" }, g), shoe: el("path", { class: "f-shoe far" }, g) };
    const legN = { thigh: el("path", { class: "f-leg" }, g), shoe: el("path", { class: "f-shoe" }, g) };
    const pelvis = el("ellipse", { class: "f-trousers-fill", rx: 27, ry: 22 }, g);
    const torso = el("path", { class: "f-torso" }, g);
    const neck = el("path", { class: "f-neck" }, g);
    const head = el("g", { class: "head" }, g);
    el("circle", { class: "f-hair", cx: -27, cy: -55, r: 12 }, head);
    el("path", {
      class: "f-skin",
      d: "M -12 4 C -30 -4, -34 -42, -14 -60 C 4 -72, 28 -62, 30 -42 L 31 -36 C 33 -32, 38 -28, 38 -24"
        + " C 37 -21, 34 -20, 32 -19 C 33 -16, 33 -13, 31 -11 C 32 -7, 28 -1, 19 1 C 12 3, 6 5, 4 8 L -12 8 Z",
    }, head);
    el("ellipse", { class: "f-skin-shade", cx: -3, cy: -30, rx: 5, ry: 8 }, head);
    el("path", {
      class: "f-hair",
      d: "M 25 -56 C 18 -70, -10 -74, -24 -58 C -36 -44, -33 -20, -22 -8 C -24 -22, -20 -34, -10 -40"
        + " C -2 -46, 10 -50, 22 -48 Z",
    }, head);
    const brow = el("path", { class: "f-line f-brow", d: "M 15 -45 Q 21 -48 27 -46" }, head);
    const eye = el("ellipse", { class: "f-ink", cx: 21, cy: -37, rx: 2.6, ry: 3.2 }, head);
    const mouth = el("path", { class: "f-line f-lips" }, head);
    const armN = arm(g);
    return { g, armF, armN, legF, legN, pelvis, torso, neck, head, brow, eye, mouth };
  }

  function buildVoice(parent) {
    const g = el("g", { class: "voice-panel", transform: "translate(402 58)" }, parent);
    el("path", {
      class: "v-bubble",
      d: "M 16 0 H 174 Q 190 0 190 16 V 140 Q 190 156 174 156 H 16 Q 0 156 0 140 V 80 L -32 66 L 0 58 V 16 Q 0 0 16 0 Z",
    }, g);
    const staff = el("g", { class: "v-staff" }, g);
    for (let i = 0; i < 5; i++) el("line", { x1: 16, x2: 174, y1: 30 + i * 21, y2: 30 + i * 21 }, staff);
    el("text", { class: "v-axis", x: 174, y: 24, "text-anchor": "end" }, staff).textContent = "higher";
    el("text", { class: "v-axis", x: 174, y: 132, "text-anchor": "end" }, staff).textContent = "lower";
    const bars = el("g", { class: "v-bars" }, g);
    const barList = Array.from({ length: 30 }, (_, i) => el("line", { x1: 20 + i * 5.2, x2: 20 + i * 5.2 }, bars));
    const line = el("path", { class: "v-line" }, g);
    const slots = el("g", { class: "v-slots" }, g);
    const slotList = Array.from({ length: 12 }, (_, i) => el("rect", { x: 17 + i * 13.2, y: 52, width: 10.5, height: 40, rx: 3 }, slots));
    const blocks = el("g", { class: "v-blocks" }, g);
    const blockList = script.map((row, r) => row.map(token => {
      const node = el("g", { class: `v-token ${token.type}` }, blocks);
      const rect = el("rect", { y: 42 + r * 36, height: 22, rx: 5 }, node);
      const text = token.label ? el("text", { y: 57 + r * 36, "text-anchor": "middle" }, node) : null;
      if (text) text.textContent = token.label;
      return { node, rect, text, token };
    }));
    const head = el("line", { class: "v-head", y1: 26, y2: 120 }, g);
    const caption = el("text", { class: "v-caption", x: 95, y: 145, "text-anchor": "middle" }, g);
    return { g, staff, bars, barList, line, slots, slotList, blocks, blockList, head, caption };
  }

  // ---------- Render ----------

  function renderFront(r, p) {
    r.torso.setAttribute("d", torsoPath(p.sh, p.widen));
    const shoulderL = [284 - p.widen, 175 - p.sh];
    const shoulderR = [356 + p.widen, 175 - p.sh];
    setArm(r.armL, shoulderL, p.handL, -1, .35, p.elbowL, p.bendL);
    setArm(r.armR, shoulderR, p.handR, 1, .35, p.elbowR, p.bendR);
    r.head.setAttribute("transform", `translate(${n(320 + p.hx)} ${n(132 + p.hy)}) rotate(${n(p.tilt)})`);
    const f = p.face;
    const by = -46 - 4.5 * f.brow;
    for (const [node, side] of [[r.browL, -1], [r.browR, 1]]) {
      const outer = [18 * side, by + 1 - 1.4 * f.frown + .6 * f.worry];
      const middle = [12 * side, by - 2.4 + .8 * f.frown - 1.2 * f.worry];
      const inner = [5 * side, by + .6 + 3.8 * f.frown - 2.6 * f.worry];
      node.setAttribute("d", `M ${pt(outer)} Q ${pt(middle)} ${pt(inner)}`);
    }
    const eye = clamp(f.eye, .08, 1.2) * 3.7;
    r.eyeL.setAttribute("ry", n(eye));
    r.eyeR.setAttribute("ry", n(eye));
    const s = f.smile;
    const width = 9.5 + 3.5 * Math.max(s, 0) - 1.2 * Math.max(-s, 0);
    const corner = -15 - 3.4 * s;
    const upper = -15 + 2.6 * s - 1.6 * f.open;
    const lower = upper + .01 + 14 * f.open + 7 * smooth((s - .5) / .5);
    const shape = `M ${n(-width)} ${n(corner)} Q 0 ${n(upper)} ${n(width)} ${n(corner)} Q 0 ${n(lower)} ${n(-width)} ${n(corner)} Z`;
    r.mouth.setAttribute("d", shape);
    r.clipShape.setAttribute("d", shape);
    r.lips.setAttribute("d", `M ${n(-width)} ${n(corner)} Q 0 ${n(upper)} ${n(width)} ${n(corner)}`);
    r.teeth.setAttribute("y", n(Math.min(corner, upper) - 1));
    const blush = .34 * clamp(s);
    r.cheekL.setAttribute("opacity", n(blush * 100) / 100);
    r.cheekR.setAttribute("opacity", n(blush * 100) / 100);
    const order = p.handL[0] > 330 && p.handR[0] < 310 ? "crossed" : "plain";
    if (order !== r.order) {
      r.order = order;
      r.g.append(order === "crossed" ? r.armL.g : r.armR.g, order === "crossed" ? r.armR.g : r.armL.g);
    }
  }

  function legPoints(hip, leg) {
    const joint = add(hip, [0, 4]);
    const knee = add(joint, [82 * Math.sin(rad(leg.a)), 82 * Math.cos(rad(leg.a))]);
    const shin = leg.a - leg.b;
    const ankle = add(knee, [80 * Math.sin(rad(shin)), 80 * Math.cos(rad(shin))]);
    return { joint, knee, ankle };
  }

  function setLeg(parts, hip, leg) {
    const { joint, knee, ankle } = legPoints(hip, leg);
    parts.thigh.setAttribute("d", `M ${pt(joint)} L ${pt(knee)} L ${pt(ankle)}`);
    parts.shoe.setAttribute("d", "M -8 -6 Q -2 -10 10 -8 Q 26 -6 28 2 L 28 5 L -10 5 Q -12 0 -8 -6 Z");
    parts.shoe.setAttribute("transform", `translate(${pt(ankle)}) rotate(${n(-leg.foot)})`);
    return ankle;
  }

  function renderSide(r, p) {
    const hip = p.hip;
    setLeg(r.legF, add(hip, [-3, 0]), p.legF);
    const ankle = setLeg(r.legN, hip, p.legN);
    r.pelvis.setAttribute("cx", n(hip[0]));
    r.pelvis.setAttribute("cy", n(hip[1] + 6));
    const chest = add(hip, rot([0, -74], p.lean + .3 * p.slouch));
    const neckBase = add(chest, rot([0, -58], p.lean + p.slouch));
    const control = add(hip, rot([p.chest * .6, -60], p.lean));
    r.torso.setAttribute("d", `M ${pt(add(hip, [0, -6]))} Q ${pt(control)} ${pt(chest)} T ${pt(neckBase)}`);
    r.torso.style.strokeWidth = n(55 + p.chest * .8);
    const neckAngle = p.lean + p.slouch * 1.45;
    const neckTop = add(neckBase, rot([0, -17], neckAngle));
    r.neck.setAttribute("d", `M ${pt(add(neckBase, rot([0, 6], neckAngle)))} L ${pt(neckTop)}`);
    const headAngle = p.lean * .5 + p.slouch * .55 + p.pitch;
    r.head.setAttribute("transform", `translate(${pt(neckTop)}) rotate(${n(headAngle)})`);
    r.eye.setAttribute("ry", n(clamp(p.face.eye, .08, 1) * 3.2));
    const s = p.face.smile;
    r.mouth.setAttribute("d", `M 27 ${n(-12 + s)} Q 30 ${n(-11 + 1.5 * s)} 31.5 ${n(-12.5 - 1.5 * s)}`);
    const shoulder = add(neckBase, rot([1, 15], p.lean + p.slouch));
    setArm(r.armF, add(shoulder, [-4, 0]), add(shoulder, p.handF), -1, .5);
    setArm(r.armN, shoulder, add(shoulder, p.handN), -1, .5);
    return ankle;
  }

  function renderVoice(v, spec, info, amount) {
    const show = (node, on) => node.setAttribute("display", on ? "inline" : "none");
    show(v.staff, spec.kind === "contour");
    v.staff.classList.toggle("is-labelled", Boolean(spec.staff));
    show(v.bars, spec.kind === "wave");
    show(v.line, spec.kind === "contour");
    show(v.slots, spec.kind === "slots");
    show(v.blocks, spec.kind === "blocks");
    let headX = -1;
    if (spec.kind === "wave") {
      v.barList.forEach((bar, i) => {
        const env = syllables(spec.t - i * .045 + 3) * .85 + .15;
        const smoothBar = env;
        const roughBar = clamp(env * (.15 + 1.5 * noise(i + Math.floor(spec.t * 9) * 31)) * (i % 2 ? .55 : 1.1));
        const h = 6 + 40 * spec.amp * mix(smoothBar, roughBar, spec.rough);
        bar.setAttribute("y1", n(74 - h));
        bar.setAttribute("y2", n(74 + h));
      });
      v.bars.style.setProperty("--rough", spec.rough.toFixed(2));
    } else if (spec.kind === "contour") {
      const points = [];
      for (let i = 0; i <= 40; i++) {
        const x = 18 + i * 3.9;
        const u = spec.t * 1.1 + i * .16;
        const melody = Math.sin(u) * .55 + Math.sin(u * .43 + 2) * .35 + Math.sin(u * 2.3) * .1;
        const center = mix(112, 40, spec.level);
        const swing = mix(2.5, 34, spec.spread);
        points.push([x, center - melody * swing]);
      }
      v.line.setAttribute("d", `M ${points.map(pt).join(" L ")}`);
    } else if (spec.kind === "slots") {
      v.slotList.forEach((rect, i) => {
        const w = slotWeight(i, spec.share);
        rect.style.setProperty("--talk", w.toFixed(2));
        rect.classList.toggle("is-talk", w > .5);
      });
      if (spec.head >= 0) headX = 17 + spec.head * 13.2;
    } else if (spec.kind === "blocks") {
      const { rows, total } = layoutBlocks(spec.fluency);
      const at = spec.head >= 0 ? spec.head * total : Infinity;
      rows.forEach((row, r) => row.items.forEach((item, i) => {
        const node = v.blockList[r][i];
        node.rect.setAttribute("x", n(18 + item.x));
        node.rect.setAttribute("width", n(Math.max(0, item.width)));
        node.node.style.opacity = item.type === "word" ? 1 : n(item.visible * 100) / 100;
        node.node.classList.toggle("is-said", at >= item.start);
        if (node.text) node.text.setAttribute("x", n(18 + item.x + item.width / 2));
        if (at >= item.start && at < item.start + item.width + 5) headX = 18 + item.x + Math.min(item.width, at - item.start);
      }));
    }
    show(v.head, headX >= 0);
    if (headX >= 0) {
      v.head.setAttribute("x1", n(headX));
      v.head.setAttribute("x2", n(headX));
    }
    // Captions name the end of the dial only. The diagrams are schematic, so they carry no numbers.
    v.caption.textContent = amount >= .5 ? info.more : info.less;
  }

  // ---------- Smoothing ----------

  function blend(current, target, k) {
    if (current == null || typeof target !== typeof current) return structuredClone(target);
    if (typeof target === "number") return current + (target - current) * k;
    if (Array.isArray(target)) return target.map((value, i) => blend(current[i], value, k));
    if (target && typeof target === "object") {
      const out = {};
      for (const key of Object.keys(target)) out[key] = blend(current[key], target[key], k);
      return out;
    }
    return target;
  }

  // ---------- Public API ----------

  const views = {
    front: [0, 0, 640, 480],
    side: [0, 0, 640, 480],
    face: [236, 28, 168, 126],
    upper: [132, 18, 376, 282],
    voice: [196, 20, 416, 312],
    // Narrow stages crop closer so the speech bubble stays legible.
    "voice-compact": [222, 26, 384, 288],
  };

  let svg;
  let parts;
  const state = { camera: null, front: null, side: null, partner: null, fades: {}, prints: [], ground: 0, stepIndex: -1, cue: null, settling: false };

  function mount(node) {
    svg = node;
    svg.setAttribute("viewBox", "0 0 640 480");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    const root = el("g", {}, svg);
    const backdrop = el("g", {}, root);
    el("circle", { class: "f-plate", cx: 320, cy: 268, r: 192 }, backdrop);
    const ground = el("line", { class: "f-ground", x1: -400, x2: 1040, y1: 461, y2: 461 }, backdrop);
    const ticks = el("line", { class: "f-ticks", x1: -400, x2: 1040, y1: 468, y2: 468 }, backdrop);
    const prints = el("g", { class: "f-prints" }, root);
    const printList = Array.from({ length: 10 }, () => el("ellipse", { rx: 13, ry: 3.8 }, prints));
    const shadow = el("ellipse", { class: "f-shadow", cx: 320, cy: 461, rx: 64, ry: 6 }, root);
    const partnerWrap = el("g", { class: "partner", transform: "translate(1056 0) scale(-1 1)" }, root);
    const partner = buildSide(partnerWrap, "is-partner");
    const side = buildSide(root);
    const front = buildFront(root);
    const voice = buildVoice(root);
    parts = { ground, ticks, prints, printList, shadow, partnerWrap, partner, side, front, voice };
  }

  function fade(key, target, k) {
    const value = state.fades[key] === undefined || k === 1 ? target : mix(state.fades[key], target, k);
    state.fades[key] = value;
    if (Math.abs(value - target) > .01) state.settling = true;
    return value;
  }

  function render({ cue, amount, time, energy, dt = .016, instant = false, compact = false }) {
    if (!svg) return;
    const make = cues[cue];
    if (!make) return;
    if (cue !== state.cue) {
      state.cue = cue;
      state.prints = [];
      state.stepIndex = -1;
    }
    const spec = make(amount, time, energy);
    const k = instant ? 1 : 1 - Math.exp(-dt * 16);
    const kCam = instant ? 1 : 1 - Math.exp(-dt * 5.5);
    const kFade = instant ? 1 : 1 - Math.exp(-dt * 9);

    const view = spec.view;
    // Narrow stages scale the drawing down, so diagram text is set larger there (see styles.css).
    svg.classList.toggle("is-compact", compact);
    const shot = views[compact && views[`${view}-compact`] ? `${view}-compact` : view];
    state.camera = state.camera && !instant ? state.camera.map((v, i) => mix(v, shot[i], kCam)) : shot.slice();
    svg.setAttribute("viewBox", state.camera.map(n).join(" "));
    // True while the camera or a cross-fade is still on its way, so the caller keeps drawing.
    state.settling = state.camera.some((v, i) => Math.abs(v - shot[i]) > .4);

    const frontOn = fade("front", view === "side" ? 0 : 1, kFade);
    const sideOn = fade("side", view === "side" ? 1 : 0, kFade);
    const voiceOn = fade("voice", view === "voice" ? 1 : 0, kFade);
    parts.front.g.style.opacity = frontOn.toFixed(3);
    parts.side.g.style.opacity = sideOn.toFixed(3);
    parts.voice.g.style.opacity = voiceOn.toFixed(3);
    parts.front.g.style.display = frontOn < .01 ? "none" : "";
    parts.side.g.style.display = sideOn < .01 ? "none" : "";
    parts.voice.g.style.display = voiceOn < .01 ? "none" : "";

    if (spec.front) {
      state.front = blend(state.front, spec.front, k);
      renderFront(parts.front, state.front);
    }
    if (spec.voice) renderVoice(parts.voice, spec.voice, cueInfo[cue], amount);

    let shadowX = 320;
    let shadowW = 64;
    if (spec.side) {
      state.side = blend(state.side, spec.side, k);
      if (spec.side.walk === undefined) delete state.side.walk;
      const ankle = renderSide(parts.side, state.side);
      shadowX = state.side.hip[0] + 6;
      shadowW = 56 + Math.abs(ankle[0] - state.side.hip[0]) * .7;
      const partnerPose = sideBase(time + 1.3, energy);
      partnerPose.hip = [1056 - 534, 290];
      partnerPose.pitch = Math.sin(time * 1.6) * 1.5 * energy;
      state.partner = blend(state.partner, partnerPose, k);
      renderSide(parts.partner, state.partner);
    }
    const partnerOn = fade("partner", view === "side" && spec.side?.partner ? 1 : 0, kFade);
    parts.partnerWrap.style.opacity = (partnerOn * .62).toFixed(3);
    parts.partnerWrap.style.display = partnerOn < .01 ? "none" : "";
    parts.shadow.setAttribute("cx", n(shadowX));
    parts.shadow.setAttribute("rx", n(shadowW));
    parts.shadow.style.opacity = fade("shadow", view === "side" ? 1 : 0, kFade).toFixed(3);

    // Walking: scroll the ground and leave footprints one step apart.
    const walk = spec.side?.walk;
    const walkOn = fade("walk", walk && view === "side" ? 1 : 0, kFade);
    parts.ticks.style.opacity = (walkOn * .9).toFixed(3);
    parts.prints.style.opacity = walkOn.toFixed(3);
    if (walk) {
      state.ground += walk.speed * dt;
      const hipX = spec.side.hip[0];
      const ahead = LEG * Math.sin(rad(walk.A)) + 8;
      const index = Math.floor(time / (STRIDE_PERIOD / 2));
      if (energy > .05 && index !== state.stepIndex) {
        state.stepIndex = index;
        state.prints.push({ at: state.ground + ahead, far: index % 2 === 1 });
        if (state.prints.length > 10) state.prints.shift();
      }
      let list = state.prints;
      if (!list.length) {
        list = [0, 1, 2, 3].map(i => ({ at: state.ground + ahead - i * walk.step, far: i % 2 === 1 }));
      }
      parts.ticks.style.strokeDashoffset = n(state.ground % 32);
      parts.printList.forEach((node, i) => {
        const print = list[i];
        node.setAttribute("display", print ? "inline" : "none");
        if (!print) return;
        const x = hipX + print.at - state.ground;
        node.setAttribute("cx", n(x));
        node.setAttribute("cy", print.far ? 457 : 464);
        node.setAttribute("class", print.far ? "far" : "");
      });
    }
    return state.settling;
  }

  return { mount, render, cues: Object.keys(cues) };
})();
