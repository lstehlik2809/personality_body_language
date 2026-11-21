# Personality in motion

An interactive field guide to what a meta-analysis found about nonverbal cues and the Big Five: which facial expressions, body language and voice cues are actually linked to personality, how strong the links are, and what they look like.

**Live page:** <https://lstehlik2809.github.io/personality_body_language/>

## Run it

The site is plain HTML, CSS and JavaScript with self-hosted fonts and no build step. Serve the `docs/` folder so the fonts load the same way they will on GitHub Pages:

```bash
python -m http.server 8765 --directory docs
```

Then open <http://localhost:8765>.

For GitHub Pages, commit the `docs/` folder and choose **Settings → Pages → Deploy from a branch → /docs**. All paths are relative, so a project site under a repository subpath works. Only the `docs/` folder is served.

## Link preview

`docs/index.html` carries Open Graph tags so that a shared link shows a title, a description and a 1200 × 630 card (`docs/assets/social-card.png`). The tags hold the full public address, <https://lstehlik2809.github.io/personality_body_language/>, because LinkedIn does not resolve relative image paths. If the site is published elsewhere, change the three addresses in the `<head>`.

The card is drawn by `social-card.html` (outside the published folder) from the site's own figure, fonts and data. To regenerate it after a change, run this from the project root, with the path to your Chrome or Edge:

```bash
"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=5000 --screenshot="$PWD/docs/assets/social-card.png" "file:///$PWD/social-card.html"
```

The description tag states the 65 studies and 21 links as plain text, since preview crawlers do not run scripts. Update it by hand if the data change. LinkedIn caches previews; after publishing, refresh the cache with its [Post Inspector](https://www.linkedin.com/post-inspector/).

## What the page shows

- **Trait tabs.** Selecting a trait plays its cues one after another on the figure. Each cue starts at the end linked to *lower* trait scores, then moves to the end linked to *higher* scores.
- **Figure and dial.** The vector figure shows what each cue category looks like: a waist-up view for gestures, tension, self-touch and crossed arms, a side view for leaning in, posture and stride (with footprints), a close-up for facial cues, and a speech bubble for voice cues. The dial lets readers compare less and more of the cue. The dial shows the direction of a link, not its size.
- **Forest plot.** Each row is a pooled correlation *r* with its 95% interval on one shared −0.5 to +0.5 scale, with a one-line key underneath. A toggle reveals two further groups: cues tested without a clear link (drawn on the same scale), and cues with too little evidence to judge, split into “one study only” and “not studied”.
- **Cue detail.** The figure, the plain-language finding and the “What r means” panel sit together, so everything about the selected cue reads top to bottom. On wide screens the forest plot stays in view beside it. On phones the plot follows below, and previous/next buttons on the figure step through a trait’s cues without scrolling back to the list.
- **“What r means”.** The size of the selected link, shown as two groups of 100 people. Among people above the median on the cue, the share above the median on the trait is 50% + arcsin(*r*)/π (bivariate normal, linear relation), with a range taken from the interval bounds. For the strongest link this is 58 vs 42 out of 100, which is why the page calls the cues clues rather than verdicts.
- **The science.** A dialog with methods, the inclusion rule, how to read the numbers, limitations from both papers, and sources.

Reduced-motion settings are respected: the figure holds still poses, the dial still works, and selecting a trait does not start the sequence. The page has no sound. The voice diagrams are schematic and carry no numbers of their own, so nothing in the illustration can be mistaken for a finding.

## Data and rule

`docs/data.js` holds the cue validity columns of Tables 3–7 in [Breil, Osterholz, Nestler & Back (2021)](https://doi.org/10.1093/oxfordhb/9780190912529.013.13) ([author manuscript](https://osf.io/mn2je/download)) for the 25 dynamic cue categories × the Big Five (125 pairs). All 125 values (r, both interval bounds, k and n) were checked against the manuscript tables, most recently on 21 November 2026 by parsing the text of the OSF manuscript and comparing it with `data.js` cell by cell, with no mismatches. Labels keep the direction of the source category; “Unconcerned (vs. serious)”, for example, is shown as “Unconcerned expression”. A pair counts as a link when at least two samples were pooled and the reported 95% interval lies wholly above or below zero at the tables’ two-decimal precision. That gives 21 links; 78 pairs were tested without a clear link and 26 rest on one study or none. The rule and every count on the page (the 21 in the introduction, the totals in the science dialog) are computed in the browser from the table values, so changing a number updates the page. The rule is not adjusted for multiple comparisons: with 99 pairs tested at the 95% level, about 5 would pass by chance alone, and the science dialog says so. Within a trait, links are ordered by absolute *r*, with ties in table order.

[Hall, Murphy, Schlegel & Back (2025)](https://doi.org/10.1111/jopy.70030) compared lay beliefs with these estimates. The page uses only Breil’s cue validities (what people actually do). Hall et al. appear only as context in the science dialog.

## Design

- Palette from [Color Hunt](https://colorhunt.co/palette/2d3c5994a378e5ba41d1855c): navy `#2D3C59`, sage `#94A378`, mustard `#E5BA41` and terracotta `#D1855C`. It is extended with cream paper `#F6F1E6`, ink `#1F2A40`, and darker sage and terracotta for text and marks that meet WCAG AA. Tokens live at the top of `docs/styles.css`.
- Type: [Young Serif](https://fonts.google.com/specimen/Young+Serif) for headings, [Public Sans](https://fonts.google.com/specimen/Public+Sans) for text and numbers (tabular figures). Both fonts are self-hosted under the SIL Open Font License (`docs/assets/fonts/`).
- Metaphor: a natural-history field guide (plate-framed stage, “field guide” masthead) at low intensity, so plain labels always lead.

## Files

| File | Role |
| --- | --- |
| `docs/index.html` | Page structure and the science dialog |
| `docs/styles.css` | Tokens, layout, figure styling |
| `docs/data.js` | Breil et al. table values, cue wording, link rule |
| `docs/figure.js` | Rigged SVG figure: poses per cue, cameras, voice visuals |
| `docs/app.js` | Interaction: tabs, sequence, dial, forest plot, 100-people panel |
| `docs/assets/social-card.png` | Link-preview image |
| `social-card.html` | Source of the link-preview image (not published) |
