"use strict";

(() => {
  const $ = selector => document.querySelector(selector);
  const explorer = $("#explorer");
  const tabs = $(".traits");
  const panel = $("#trait-panel");
  const stage = $(".stage");
  const channelLabel = $("#channel-label");
  const channelIcon = $("#channel use");
  const meaningTitle = $("#meaning-title");
  const meaningLead = $("#meaning-lead");
  const dial = $("#dial");
  const dialBox = $(".dial");
  const dialLabel = $("#dial-label");
  const endLess = $("#end-less");
  const endMore = $("#end-more");
  const replay = $("#replay");
  const stepper = $("#stepper");
  const stepCount = $("#step-count");
  const keyTrait = $("#key-trait");
  const sparseTitle = $("#sparse-title");
  const unclearTitle = $("#unclear-title");
  const tour = $("#tour");
  const tourLabel = $("#tour-label");
  const progress = $("#progress");
  const noteKicker = $("#note-kicker");
  const cueTitle = $("#cue-title");
  const finding = $("#finding");
  const odds = $("#odds");
  const stats = $("#stats");
  const traitTitle = $("#trait-title");
  const linkCount = $("#link-count");
  const gist = $("#trait-gist");
  const list = $("#cue-list");
  const reveal = $("#reveal");
  const unclearBlock = $("#unclear-block");
  const unclearList = $("#unclear-list");
  const sparse = $("#sparse");
  const status = $("#status");
  const science = $("#science");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  // A demo shows the other end of the cue, sweeps across, then holds the end linked to higher scores.
  const DEMO = { low: 1.2, sweep: .9, total: 4.8 };
  const DIAL_MOTION = 3.5;
  const number = new Intl.NumberFormat("en-GB");
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const smooth = x => { const u = clamp(x, 0, 1); return u * u * (3 - 2 * u); };
  const signed = v => `${v < 0 ? "−" : v > 0 ? "+" : ""}${Math.abs(v).toFixed(2)}`;
  const position = v => `${(clamp(v, -.5, .5) + .5) * 100}%`;
  const short = phrase => phrase.replace(/ than average$/, "");
  const capital = text => text[0].toUpperCase() + text.slice(1);
  const shareAbove = r => 50 + 100 * Math.asin(Math.abs(r)) / Math.PI;

  let traitIndex = 0;
  let cueIndex = 0;
  let mode = "idle";
  let modeStart = 0;
  let clock = 1.2;
  let energy = 0;
  let amount = .94;
  let lastFrame = null;
  let frameId = null;
  let instant = true;
  let dragging = false;
  let compact = false;

  const trait = () => traitData[traitIndex];
  const row = () => trait().links[cueIndex];
  const info = () => cueInfo[row().id];
  const traitName = () => (trait().display ?? trait().name).toLowerCase();
  const linkedEnd = () => (row().r > 0 ? .94 : .06);
  const otherEnd = () => (row().r > 0 ? .06 : .94);

  // ---------- Animation loop ----------

  function demoAmount(elapsed) {
    if (reduced.matches) return linkedEnd();
    return otherEnd() + (linkedEnd() - otherEnd()) * smooth((elapsed - DEMO.low) / DEMO.sweep);
  }

  function frame(now) {
    frameId = null;
    const dt = lastFrame === null ? 1 / 60 : Math.min(.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const elapsed = (now - modeStart) / 1000;
    let target = 0;

    if (mode === "demo" || mode === "tour") {
      amount = demoAmount(elapsed);
      target = 1;
      progress.style.transform = `scaleX(${Math.min(1, elapsed / DEMO.total)})`;
      if (elapsed >= DEMO.total) {
        if (mode === "tour" && cueIndex + 1 < trait().links.length) {
          selectCue(cueIndex + 1, "tour", false);
        } else {
          const finishedTour = mode === "tour";
          stop();
          if (finishedTour) status.textContent = `Finished all ${trait().links.length} cues for ${trait().name}.`;
        }
      }
    } else if (mode === "dial") {
      target = elapsed < DIAL_MOTION ? 1 : 0;
      if (elapsed >= DIAL_MOTION && !dragging) mode = "idle";
    }

    if (reduced.matches) {
      energy = 0;
    } else {
      energy += (target - energy) * (1 - Math.exp(-dt * 4));
      clock += dt * energy;
    }
    if (!dragging) syncDial();
    const settling = motionFigure.render({
      cue: row().id, amount, time: clock, energy, dt,
      instant: instant || reduced.matches, compact,
    });
    instant = false;
    // Keep drawing until a change of view has finished, even if playback was stopped meanwhile.
    if (mode !== "idle" || energy > .005 || settling) frameId = requestAnimationFrame(frame);
    else lastFrame = null;
  }

  function wake() {
    if (frameId === null) frameId = requestAnimationFrame(frame);
  }

  function syncDial() {
    dial.value = String(Math.round(amount * 100));
    dial.setAttribute("aria-valuetext", amount >= .5 ? info().more : info().less);
  }

  // ---------- Playback ----------

  function stop() {
    mode = "idle";
    progress.style.transform = "scaleX(0)";
    resetDialLabel();
    updateButtons();
    wake();
  }

  function resetDialLabel() {
    dialLabel.textContent = `Drag to compare: ${info().label.toLowerCase()}`;
  }

  function updateButtons() {
    const many = trait().links.length > 1;
    tour.hidden = !many;
    tour.toggleAttribute("data-active", mode === "tour");
    tourLabel.textContent = mode === "tour" ? "Stop" : `Play all ${trait().links.length}`;
    stepper.hidden = !many;
    stepCount.textContent = `${cueIndex + 1} / ${trait().links.length}`;
    replay.hidden = reduced.matches;
  }

  function play(kind) {
    mode = reduced.matches && kind === "demo" ? "idle" : kind;
    modeStart = performance.now();
    amount = mode === "idle" ? linkedEnd() : otherEnd();
    resetDialLabel();
    updateButtons();
    wake();
  }

  // ---------- Content ----------

  function rowMarkup(entry) {
    const cue = cueInfo[entry.id];
    const lo = entry.lo < -.5 ? " clip-lo" : "";
    const hi = entry.hi > .5 ? " clip-hi" : "";
    return `
      <span class="cue-icon" aria-hidden="true"><svg><use href="#i-${cue.channel.toLowerCase()}"/></svg></span>
      <span class="cue-name">${cue.label}</span>
      <span class="row-plot" aria-hidden="true" style="--lo:${position(entry.lo)};--hi:${position(entry.hi)};--point:${position(entry.r)}">
        <span class="row-ci${lo}${hi}"></span><span class="row-dot"></span>
      </span>
      <span class="cue-r">${signed(entry.r)}</span>
      <span class="visually-hidden">${cue.channel}. 95% interval ${signed(entry.lo)} to ${signed(entry.hi)}, ${entry.k} samples.</span>`;
  }

  function dotGrid() {
    const dots = Array.from({ length: 100 }, (_, i) =>
      `<circle cx="${5 + (i % 10) * 10}" cy="${5 + Math.floor(i / 10) * 10}" r="3.6" style="--i:${i}"/>`).join("");
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${dots}</svg>`;
  }

  odds.innerHTML = `
    <div class="odds-groups">
      <figure class="odds-group is-linked">
        <figcaption><strong data-odds="label-a"></strong><span>100 people</span></figcaption>
        ${dotGrid()}
        <p class="odds-result"><b data-odds="a"></b> <span data-odds="a-text"></span></p>
      </figure>
      <figure class="odds-group">
        <figcaption><strong data-odds="label-b"></strong><span>100 people</span></figcaption>
        ${dotGrid()}
        <p class="odds-result"><b data-odds="b"></b> <span data-odds="b-text"></span></p>
      </figure>
    </div>
    <p class="odds-caption" data-odds="caption"></p>`;
  const oddsPart = key => odds.querySelector(`[data-odds="${key}"]`);
  const [gridA, gridB] = odds.querySelectorAll("svg");

  function renderNote() {
    const entry = row();
    const cue = info();
    const name = traitName();
    const linked = entry.r > 0 ? cue.groupMore : cue.groupLess;
    const other = entry.r > 0 ? cue.groupLess : cue.groupMore;
    noteKicker.textContent = `${trait().name} · ${cue.channel}`;
    cueTitle.textContent = cue.label;
    finding.textContent = `People who ${short(linked)} tend to score a little higher in ${name}.`;

    const a = Math.round(shareAbove(entry.r));
    const low = Math.round(shareAbove(Math.min(Math.abs(entry.lo), Math.abs(entry.hi))));
    const high = Math.round(shareAbove(Math.max(Math.abs(entry.lo), Math.abs(entry.hi))));
    oddsPart("label-a").textContent = capital(short(linked));
    oddsPart("label-b").textContent = capital(short(other));
    oddsPart("a").textContent = a;
    oddsPart("b").textContent = 100 - a;
    oddsPart("a-text").textContent = `above average in ${name}`;
    oddsPart("b-text").textContent = "above average";
    oddsPart("caption").innerHTML = `<span class="key" aria-hidden="true"></span>Above-average ${name}. A coin flip would give 50 and 50. Allowing for the 95% interval: ${low}–${high} out of 100. On its own, a cue says little about any one person.`;
    meaningTitle.textContent = `What r = ${signed(entry.r)} means`;
    meaningLead.textContent = `Picture 100 people who ${linked} and 100 who ${other}.`;
    gridA.querySelectorAll("circle").forEach((dot, i) => dot.classList.toggle("is-high", i < a));
    gridB.querySelectorAll("circle").forEach((dot, i) => dot.classList.toggle("is-high", i < 100 - a));

    stats.textContent = `r ${signed(entry.r)} · 95% interval ${signed(entry.lo)} to ${signed(entry.hi)} · ${entry.k} samples, ${number.format(entry.n)} people · Breil et al., Table ${trait().table}, “${cue.source}”`;

    const linkedLabel = `<small>linked to higher ${name}</small>`;
    endLess.innerHTML = `${cue.less}${entry.r < 0 ? linkedLabel : ""}`;
    endMore.innerHTML = `${cue.more}${entry.r > 0 ? linkedLabel : ""}`;
    endLess.classList.toggle("is-linked", entry.r < 0);
    endMore.classList.toggle("is-linked", entry.r > 0);
    dialBox.classList.toggle("is-reversed", entry.r < 0);
    resetDialLabel();
    dial.setAttribute("aria-label", `${cue.label}, from less to more`);

    const view = cue.channel === "Face" ? "Face · close-up" : cue.channel === "Voice" ? "Voice" : ["lean", "open-posture", "stride"].includes(entry.id) ? "Body · side view" : "Body";
    channelLabel.textContent = view;
    channelIcon.setAttribute("href", `#i-${cue.channel.toLowerCase()}`);
  }

  function announce() {
    const entry = row();
    status.textContent = `${info().label}. ${finding.textContent} Correlation ${signed(entry.r)}, 95% interval ${signed(entry.lo)} to ${signed(entry.hi)}, ${entry.k} samples.`;
  }

  function selectCue(index, kind = "demo", speak = true) {
    cueIndex = index;
    for (const [i, button] of Array.from(list.querySelectorAll("button")).entries()) {
      button.setAttribute("aria-pressed", String(i === index));
    }
    renderNote();
    play(kind);
    if (speak) announce();
    else status.textContent = info().label;
  }

  function selectTrait(index, kind) {
    traitIndex = index;
    const t = trait();
    for (const [i, tab] of Array.from(tabs.children).entries()) {
      tab.setAttribute("aria-selected", String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    }
    panel.setAttribute("aria-labelledby", tabs.children[index].id);
    traitTitle.textContent = t.display ?? t.name;
    linkCount.textContent = `${t.links.length} ${t.links.length === 1 ? "link" : "links"} with evidence`;
    gist.textContent = t.gist;
    keyTrait.textContent = traitName();

    list.replaceChildren(...t.links.map((entry, i) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cue-row";
      button.innerHTML = rowMarkup(entry);
      button.addEventListener("click", event => {
        selectCue(i, "demo");
        if (event.detail > 0 && matchMedia("(max-width: 52rem)").matches && stage.getBoundingClientRect().bottom < innerHeight * .4) {
          stage.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
        }
      });
      item.append(button);
      return item;
    }));

    unclearList.replaceChildren(...t.unclear.map(entry => {
      const item = document.createElement("li");
      const div = document.createElement("div");
      div.className = "cue-row";
      div.innerHTML = rowMarkup(entry);
      item.append(div);
      return item;
    }));
    const names = rows => rows.map(entry => cueInfo[entry.id].label.toLowerCase()).join(", ");
    sparse.textContent = [
      t.single.length ? `One study only, so no pooled estimate: ${names(t.single)}.` : "",
      t.unstudied.length ? `Not studied for this trait: ${names(t.unstudied)}.` : "",
    ].filter(Boolean).join(" ");
    unclearTitle.hidden = !t.unclear.length;
    unclearList.hidden = !t.unclear.length;
    sparseTitle.hidden = !t.sparse.length;
    sparse.hidden = !t.sparse.length;
    reveal.hidden = !t.unclear.length && !t.sparse.length;
    setReveal(false);

    const autoTour = kind === "tour" && t.links.length > 1 && !reduced.matches;
    selectCue(0, autoTour ? "tour" : "demo", kind !== "silent");
  }

  function setReveal(open) {
    const t = trait();
    reveal.setAttribute("aria-expanded", String(open));
    unclearBlock.hidden = !open;
    const plural = count => `${count} ${count === 1 ? "cue" : "cues"}`;
    const groups = [
      t.unclear.length ? `${plural(t.unclear.length)} with no clear link` : "",
      t.sparse.length ? `${t.unclear.length ? t.sparse.length : plural(t.sparse.length)} with too little evidence` : "",
    ].filter(Boolean).join(" and ");
    reveal.textContent = open ? "Hide the other cues" : `Show ${groups}`;
  }

  // ---------- Wiring ----------

  for (const [index, t] of traitData.entries()) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "trait-tab";
    tab.id = `tab-${t.name.toLowerCase()}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    const count = t.links.length;
    tab.innerHTML = `<span class="tab-name">${t.name}</span>
      <span class="tab-count"><span class="tab-dots" aria-hidden="true">${"<i></i>".repeat(count)}</span>${count} ${count === 1 ? "link" : "links"}</span>`;
    tab.addEventListener("click", () => selectTrait(index, "tour"));
    tabs.append(tab);
  }

  tabs.addEventListener("keydown", event => {
    const total = traitData.length;
    const next = { ArrowLeft: (traitIndex + total - 1) % total, ArrowRight: (traitIndex + 1) % total, Home: 0, End: total - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    tabs.children[next].focus();
    selectTrait(next, "tour");
  });

  reveal.addEventListener("click", () => setReveal(reveal.getAttribute("aria-expanded") !== "true"));
  replay.addEventListener("click", () => play("demo"));

  for (const [id, step] of [["#prev", -1], ["#next", 1]]) {
    $(id).addEventListener("click", () => {
      const total = trait().links.length;
      selectCue((cueIndex + step + total) % total, "demo");
    });
  }

  tour.addEventListener("click", () => {
    if (mode === "tour") stop();
    else selectCue(0, "tour");
  });

  dial.addEventListener("input", () => {
    mode = "dial";
    modeStart = performance.now();
    amount = Number(dial.value) / 100;
    dial.setAttribute("aria-valuetext", amount >= .5 ? info().more : info().less);
    progress.style.transform = "scaleX(0)";
    resetDialLabel();
    updateButtons();
    wake();
  });
  dial.addEventListener("pointerdown", () => { dragging = true; });
  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    modeStart = performance.now();
  });

  for (const button of document.querySelectorAll("[data-open-science]")) {
    button.addEventListener("click", () => {
      if (mode !== "idle") stop();
      science.showModal();
    });
  }

  reduced.addEventListener("change", () => {
    stop();
    amount = linkedEnd();
    instant = true;
    updateButtons();
    wake();
  });

  // Counts in the lede and the science panel come from the data, so they follow the tables.
  const sum = pick => traitData.reduce((total, t) => total + pick(t), 0);
  const sizes = traitData.flatMap(t => t.links.map(entry => Math.abs(entry.r)));
  const plain = value => value.toFixed(2).replace(/^0/, "");
  const totals = {
    links: sum(t => t.links.length),
    unclear: sum(t => t.unclear.length),
    sparse: sum(t => t.sparse.length),
    thin: sum(t => t.links.filter(entry => entry.k <= 3).length),
    rmin: plain(Math.min(...sizes)),
    rmax: plain(Math.max(...sizes)),
  };
  // Pairs with a pooled interval, and how many would clear a 95% interval by chance alone.
  totals.tested = totals.links + totals.unclear;
  totals.chance = Math.round(totals.tested * .05);
  for (const node of document.querySelectorAll("[data-count]")) node.textContent = totals[node.dataset.count];

  const svg = $("#figure");
  motionFigure.mount(svg);
  new ResizeObserver(() => {
    compact = svg.clientWidth < 440;
    instant = true;
    wake();
  }).observe(svg);
  explorer.hidden = false;
  selectTrait(0, "silent");
  play(reduced.matches ? "idle" : "demo");
})();
