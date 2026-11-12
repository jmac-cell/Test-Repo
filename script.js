'use strict';

/* ============================================================================
   Roast My GitHub Issue
   100% rule-based scoring. No AI, no API keys, no mercy.
   Every point is traceable — see the breakdown rendered in the UI.

   The scoring core (parse/analyze/score/roast/scorecard) is pure and
   side-effect free so it can run anywhere, including headless test runs.
   ============================================================================ */

// ----------------------------------------------------------------------------
// Verdicts by score band
// ----------------------------------------------------------------------------
const VERDICTS = {
  excellent: {
    label: 'Suspiciously Excellent',
    flames: 1,
    lines: [
      'We read this twice looking for the trap. There isn’t one.',
      'Reproduction steps, expected behaviour AND acceptance criteria? Who raised you?',
      'This is a good issue. We’re not angry, just disappointed we have nothing to say.'
    ]
  },
  good: {
    label: 'Mildly Toasted',
    flames: 2,
    lines: [
      'Genuinely decent. We scrolled down expecting disaster and found competence.',
      'A thoughtful human wrote this, and it shows. Annoying.',
      'Minor notes only. You’re in the top 10% of issue authors — which says more about everyone else than about you.'
    ]
  },
  medium: {
    label: 'Medium Roast',
    flames: 3,
    lines: [
      'There’s a real task in here somewhere. Archaeologists call this a promising site.',
      'We can tell what you want. We cannot tell when you’d consider it done.',
      'This issue does half the work, then hands you a shovel and wishes you luck.'
    ]
  },
  harsh: {
    label: 'Well Done',
    flames: 4,
    lines: [
      'This isn’t a specification. It’s a hostage note.',
      'You’ve described the emotional outcome you want, not the software.',
      'Reading this felt like being handed a jigsaw box with one piece inside.'
    ]
  },
  cremated: {
    label: 'Cremated',
    flames: 5,
    lines: [
      'An actual developer wrote this. Allegedly.',
      'This issue contains three words and seventeen assumptions.',
      'This is less of a bug report and more of a vibe.'
    ]
  }
};

// ----------------------------------------------------------------------------
// Weakness flags → context-specific jokes.
// Jokes only fire when the corresponding weakness is actually detected.
// ----------------------------------------------------------------------------
const FLAG_JOKES = {
  emptyBody: {
    severity: 3,
    label: 'No description',
    jokes: [
      'No description — just a title, hanging there like a note on the fridge.',
      'The body of this issue is a bold artistic choice: it’s blank.',
      'You wrote a title and called it a day. The title is doing all the heavy lifting, and it is visibly sweating.'
    ]
  },
  tooShort: {
    severity: 3,
    label: 'Extremely short',
    jokes: [
      'We’ve seen grocery lists with more technical detail.',
      'Brevity is a virtue. This isn’t brevity, it’s an evacuation.'
    ]
  },
  doesntWork: {
    severity: 2,
    label: '“It doesn’t work”',
    jokes: [
      '“It doesn’t work” is not a bug report, it’s a mood.',
      'Somewhere between “it doesn’t work” and reality lies an entire missing bug report.',
      'You’ve described the symptom with the precision of a horoscope.'
    ]
  },
  vagueWords: {
    severity: 2,
    label: 'Vague language',
    jokes: [
      '“Somehow” is doing a lot of work in this issue. Too much. It’s unionising.',
      'You’ve used more pronouns than details. The nouns are on strike.',
      '“It” appears repeatedly. We’ve narrowed it down to: literally anything.'
    ]
  },
  noRepro: {
    severity: 2,
    label: 'No reproduction steps',
    jokes: [
      'No reproduction steps. Should we click around at random and hope it happens to us too?',
      'Without repro steps this bug is a cryptid. We believe you, but we can’t study it.'
    ]
  },
  noExpected: {
    severity: 2,
    label: 'No expected behaviour',
    jokes: [
      'No expected behaviour. For all we know, the bug is the feature.',
      'Expected behaviour: unspecified. Actual behaviour: chaos. Verification: vibes.'
    ]
  },
  noCriteria: {
    severity: 2,
    label: 'No acceptance criteria',
    jokes: [
      'Your acceptance criteria appear to be “I’ll know it when I see it”.',
      'No acceptance criteria — so every reviewer gets to invent their own. Fun!',
      'No definition of done, so technically this can never be done. Checkmate, project management.'
    ]
  },
  urgency: {
    severity: 3,
    label: 'Urgency without detail',
    jokes: [
      'The urgency is cranked to 11 and the information is at 0. Emergency services decline to attend.',
      'Marked urgent with zero technical detail. That’s not a fire alarm, it’s a scented candle.',
      '“ASAP” is not a priority system, it’s a cry for help we can’t route.'
    ]
  },
  allCaps: {
    severity: 1,
    label: 'Shouting title',
    jokes: [
      'THE TITLE IS IN ALL CAPS. We can hear it. Volume is not detail.',
      'Caps lock is not a substitute for a description, but thank you for the energy.'
    ]
  },
  noNumbers: {
    severity: 1,
    label: 'No versions or numbers',
    jokes: [
      'Not a single version number or error code. This bug exists in a dimension without measurements.',
      'No version info anywhere. Are we debugging software, or a dream?'
    ]
  },
  wallOfText: {
    severity: 1,
    label: 'Wall of text',
    jokes: [
      'This is a wall of text with the structural integrity of a memory foam mattress. Bullets exist. So do headings.',
      'A thousand words, zero structure. Tolstoy organised his epics better than this.'
    ]
  },
  screenshotOnly: {
    severity: 2,
    label: 'Screenshot as documentation',
    jokes: [
      '“See screenshot” is not documentation. Screenshots answer “what”, never “why”.',
      'You attached a screenshot and a prayer. One of those will load.'
    ]
  },
  obviously: {
    severity: 1,
    label: '“Obviously”',
    jokes: [
      'You wrote “obviously”. If it were obvious, we wouldn’t be here.',
      'Every “clearly” in this issue marks the exact spot where the explanation should be.'
    ]
  },
  quickFix: {
    severity: 2,
    label: '“Quick fix” energy',
    jokes: [
      '“It should be a quick fix” — the four most expensive words in software.',
      'You called it a small change. The on-call therapist has been notified.',
      '“Just” rewrite the auth flow. We love the confidence. We also fear it.'
    ]
  },
  scopeBomb: {
    severity: 2,
    label: 'Scope explosion',
    jokes: [
      '“Rewrite the whole thing” is a vision statement, not an issue. Issues fit in sprints. Visions don’t.',
      'You’ve filed a moon landing in a bug tracker. Have you considered a spec?'
    ]
  },
  someoneShould: {
    severity: 2,
    label: 'Assigned to “someone”',
    jokes: [
      '“Someone should fix this” — inspiring. You’re on a team of someones, and they’re all reading that sentence right now.',
      'You’ve assigned this to “whoever”. Whoever has declined.'
    ]
  },
  noPunctuation: {
    severity: 1,
    label: 'No punctuation',
    jokes: [
      'There is no punctuation anywhere in this issue. It reads like a hostage negotiation transcript, which tracks.',
      'Not a single comma or full stop in the whole issue. Punctuation has been discontinued, apparently.'
    ]
  }
};

// ----------------------------------------------------------------------------
// Completeness checklist (6 checks × 5 pts = 30)
// ----------------------------------------------------------------------------
const COMPLETION_CHECKS = [
  {
    id: 'repro', label: 'Reproduction steps', weight: 5,
    hint: 'Exact steps a stranger can follow to make it happen.',
    re: /steps? to (?:re)?repro|reproduc\w*|how to (?:repro|recreate|trigger)|to recreate|1[.)][^\n]*\n\s*2[.)]/i
  },
  {
    id: 'expected', label: 'Expected behaviour', weight: 5,
    hint: 'What “fixed” looks like, in observable terms.',
    re: /expect\w*|should (?:happen|be|do|show|return)|desired (?:behaviou?r|outcome)/i
  },
  {
    id: 'actual', label: 'Actual behaviour', weight: 5,
    hint: 'What actually happens instead.',
    re: /actual\w* (?:behaviou?r|result|output)|instead|what happens(?: now)?/i
  },
  {
    id: 'environment', label: 'Environment details', weight: 5,
    hint: 'OS, browser, runtime and versions where it happens.',
    re: /environment|\bOS\b ?[:–-]|browser|macOS|windows|linux|ubuntu|iOS|android|safari|chrome|firefox|edge|\bnode\b|python|docker|kubernetes/i
  },
  {
    id: 'criteria', label: 'Acceptance criteria', weight: 5,
    hint: 'How you’ll know it’s done — write it down.',
    re: /acceptance criteri\w*|definition of done|\bACs?\b|done when|requirements? ?:|success criteri\w*/i
  },
  {
    id: 'evidence', label: 'Logs, screenshots or links', weight: 5,
    hint: 'Receipts: error text, screenshots, recordings, demo links.',
    re: /screenshot|screen recording|attached|\blogs?\b|paste of|repro (?:repo|demo|video)|link to|related to|context ?:|references?/i
  }
];

const EXAMPLES = [
  'login broken\n\nit doesnt work, when i click the button nothing happens. urgently need fix asap production is down!!',
  'Search\n\nsearch needs to be better. users complain. someone should fix this, should be easy. see screenshot',
  'Website redesign\n\nwe should redesign the whole website obviously it will be better. make it like apple. no idea why it looks like this rn, it just feels off'
];

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ----------------------------------------------------------------------------
// GitHub URL parsing — no dependencies, works headless
// ----------------------------------------------------------------------------
function parseGitHubIssueUrl(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  const m = s.match(/^https?:\/\/(?:www\.)?github\.com\/([^/\s?#]+)\/([^/\s?#]+)\/(?:issues|pulls?)\/(\d+)(?:[/?#]|$)/i);
  if (!m) return null;
  const number = parseInt(m[3], 10);
  if (!number || number <= 0) return null;
  return { owner: m[1], repo: m[2], number: number, isPR: /\/(?:pulls?|issue)\//i.test(s.replace(/\/issues\//i, '/issues/')) && /\/pulls?\//i.test(s) };
}

// ----------------------------------------------------------------------------
// Text analysis — detects weaknesses and structure
// ----------------------------------------------------------------------------
function analyzeText(rawText) {
  const text = String(rawText || '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n');
  const firstIdx = lines.findIndex(function (l) { return l.trim().length > 0; });
  const title = firstIdx >= 0 ? lines[firstIdx].trim() : '';
  const body = firstIdx >= 0 ? lines.slice(firstIdx + 1).join('\n').trim() : '';
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const bodyWords = body.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();

  // structure
  const headings = (text.match(/^\s*#{1,6}\s+\S/gm) || []).length;
  const bullets = (text.match(/^\s*[-*+•]\s+\S/gm) || []).length;
  const numbered = (text.match(/^\s*\d+[.)]\s+\S/gm) || []).length;
  const sentences = (text.match(/[.!?…]+(?:\s|$)/g) || []).length;
  const hasStructure = (headings + bullets + numbered) >= 2;
  const hasMarkdown = /```|^#{1,6}\s|\[[^\]\n]{1,60}\]\([^)\n]{1,200}\)|^\s*[-*+]\s/m.test(text);

  const flags = {};
  function flag(id) { flags[id] = true; }

  // --- weakness detection ---
  if (bodyWords < 5) flag('emptyBody');
  if (wordCount > 0 && wordCount < 15) flag('tooShort');
  if (/it’?s? (?:not|no) working|doesn'?t work|do(?:es)? not work|is (?:broken|broke)|stopped working|not functioning|nothing happens/i.test(text)) flag('doesntWork');

  const vagueMatches = lower.match(/\b(somehow|something|stuff|things?|weird|whatever|etc|some reason)\b/g) || [];
  const itCount = (lower.match(/\bit\b/g) || []).length;
  const vagueCount = vagueMatches.length + (itCount >= 2 ? itCount : 0);
  if (vagueCount > 0) flag('vagueWords');

  const checkById = function (id) { return COMPLETION_CHECKS.find(function (c) { return c.id === id; }); };
  if (!checkById('repro').re.test(text)) flag('noRepro');
  if (!checkById('expected').re.test(text)) flag('noExpected');
  if (!checkById('criteria').re.test(text)) flag('noCriteria');

  if (/\b(asap|urgent(?:ly)?|critical|blocking|production is down|prod is down|yesterday|emergency|right now|immediately)\b/i.test(text)) flag('urgency');
  if (title && title === title.toUpperCase() && /[A-Z]{3,}/.test(title) && title.length >= 8) flag('allCaps');
  if (!/\d/.test(text)) flag('noNumbers');
  if (wordCount >= 120 && !hasStructure) flag('wallOfText');
  if (bodyWords < 25 && /see (?:the )?(?:attached )?screenshot|see attached|attached screenshot|screenshot attached/i.test(text)) flag('screenshotOnly');
  if (/\b(obviously|clearly|of course|everyone knows)\b/i.test(text)) flag('obviously');
  if (/\bshould be (?:easy|simple|quick)\b|\bquick fix\b|\beasy fix\b|\btiny (?:fix|change)\b|\bsmall (?:fix|change)\b|\bone ?-?liner\b|\bjust (?:fix|change|add|remove|use)\b|\bsimply (?:fix|add|use)\b/i.test(text)) flag('quickFix');
  if (/(?:redesign|rewrite|rebuild|re-?architect)\s+(?:the\s+)?(?:whole|entire|all of|everything)|start from scratch|from the ground up|redesign everything|rewrite everything/i.test(text)) flag('scopeBomb');
  if (/\b(someone|anyone|whoever|somebody)\b[^.?!\n]*(?:fix|look into|handle|address|deal with|take care of)/i.test(text)) flag('someoneShould');
  if (wordCount >= 25 && !/[.!?,;:\n]/.test(text)) flag('noPunctuation');

  return {
    text: text, title: title, body: body,
    wordCount: wordCount, bodyWords: bodyWords,
    hasStructure: hasStructure, hasMarkdown: hasMarkdown,
    headings: headings, bullets: bullets, numbered: numbered, sentences: sentences,
    flags: flags, vagueCount: vagueCount
  };
}

// ----------------------------------------------------------------------------
// Scoring — transparent, every point accounted for
//   Clarity /35 · Specificity /35 · Completeness /30
// ----------------------------------------------------------------------------
function scoreIssue(rawText) {
  const a = analyzeText(rawText);
  const notes = { clarity: [], specificity: [], completeness: [] };
  function note(arr, label, pts) { arr.push({ label: label, pts: pts }); }

  // ---------------- Clarity /35 ----------------
  let clarity = 0;
  const tLen = a.title.length;
  if (tLen >= 10 && tLen <= 110) { clarity += 12; note(notes.clarity, 'Title reads like a real summary', 12); }
  else if (tLen >= 5) { clarity += 6; note(notes.clarity, 'Title is a fragment', 6); }
  else note(notes.clarity, 'No usable title', 0);

  if (a.sentences >= 2 || a.wordCount >= 30) { clarity += 8; note(notes.clarity, 'Explains itself in full sentences', 8); }
  else note(notes.clarity, 'Essentially a one-liner', 0);

  if (a.hasStructure || a.hasMarkdown) { clarity += 7; note(notes.clarity, 'Structured with headings or bullets', 7); }
  else note(notes.clarity, 'No headings or bullets', 0);

  if (a.wordCount < 10) note(notes.clarity, 'Too little text to judge — no benefit of the doubt', 0);
  else if (a.vagueCount === 0 && !a.flags.doesntWork) { clarity += 8; note(notes.clarity, 'No vague waffle', 8); }
  else note(notes.clarity, 'Vague waffle detected', 0);

  const vagueDeduct = Math.min(12, a.vagueCount * 4);
  if (vagueDeduct > 0) { clarity -= vagueDeduct; note(notes.clarity, 'Penalty: vague terms ×' + a.vagueCount, -vagueDeduct); }
  if (a.flags.doesntWork) { clarity -= 4; note(notes.clarity, 'Penalty: “doesn’t work” non-description', -4); }
  if (a.flags.allCaps) { clarity -= 6; note(notes.clarity, 'Penalty: shouting in caps', -6); }
  clarity = clamp(clarity, 0, 35);

  // ---------------- Specificity /35 ----------------
  let spec = 0;
  const hasError = /error|exception|traceback|stack ?trace|refused|timeout|timed out|crash(?:es|ed)?|segfault|errno|exit code|cannot read|failed to|failure|\bfails?\b/i.test(a.text) || /^\s*at\s.+\(.+:\d+:\d+\)/m.test(a.text);
  if (hasError) { spec += 10; note(notes.specificity, 'Error message or stack trace', 10); }
  else note(notes.specificity, 'No error text quoted', 0);

  const hasVersion = /\d+\.\d+|\bv\d+\b|(?:version|node|npm|python|java|react|vue|angular|rails|django|go|rust|php|chrome|firefox|safari|edge|iOS|android|windows|macOS|linux|ubuntu|docker|kubernetes)\s+v?\s?\d+/i.test(a.text);
  const hasDigits = /\d/.test(a.text);
  if (hasVersion) { spec += 8; note(notes.specificity, 'Version numbers present', 8); }
  else if (hasDigits) { spec += 4; note(notes.specificity, 'Some numbers, no versions', 4); }
  else note(notes.specificity, 'No numbers at all', 0);

  const hasCode = /```|`[^`\n]+`|^\s{4}\S/m.test(a.text) || /\b[\w.-]+[/\\][\w.\\/-]+\.\w{1,5}\b/.test(a.text) || /\.(js|ts|tsx|jsx|py|rb|go|java|php|css|html|json|yml|yaml|sh)\b/.test(a.text);
  if (hasCode) { spec += 8; note(notes.specificity, 'Code, file paths or snippets', 8); }
  else note(notes.specificity, 'No code or file paths', 0);

  const hasEnv = /\b(OS|browser|device|iphone|ipad|mac|windows|linux|ubuntu|android|chrome|firefox|safari|edge|node|python|ruby|docker)\b/i.test(a.text);
  if (hasEnv) { spec += 5; note(notes.specificity, 'Environment mentioned', 5); }
  else note(notes.specificity, 'Environment: unknown', 0);

  const hasIdentifiers = /\b[A-Z][a-z]+[A-Z]\w*\b|\b[a-z]+_[a-z_]+\b|\b[A-Z]{2,}_[A-Z_]+\b|https?:\/\/\S+/.test(a.text);
  if (hasIdentifiers) { spec += 4; note(notes.specificity, 'Concrete identifiers (names, URLs)', 4); }
  else note(notes.specificity, 'Nothing concrete to grep', 0);
  spec = clamp(spec, 0, 35);

  // ---------------- Completeness /30 ----------------
  let comp = 0;
  const detected = {};
  COMPLETION_CHECKS.forEach(function (c) {
    const hit = c.re.test(a.text);
    detected[c.id] = hit;
    if (hit) { comp += c.weight; note(notes.completeness, c.label + ' — found', c.weight); }
    else note(notes.completeness, c.label + ' — missing', 0);
  });
  comp = clamp(comp, 0, 30);

  // ---------------- total & band ----------------
  const total = clamp(Math.round(clarity + spec + comp), 0, 100);
  let band;
  if (total >= 90) band = 'excellent';
  else if (total >= 75) band = 'good';
  else if (total >= 50) band = 'medium';
  else if (total >= 25) band = 'harsh';
  else band = 'cremated';

  const missing = COMPLETION_CHECKS.filter(function (c) { return !detected[c.id]; })
    .map(function (c) { return { label: c.label, hint: c.hint };
  });
  if (!hasError) missing.push({ label: 'The actual error message', hint: 'Copy the exact text — console output, toast, 500 page, whatever it said.' });
  if (!hasVersion) missing.push({ label: 'Version numbers', hint: 'What are you running? “Latest” is not a version.' });

  const present = COMPLETION_CHECKS.filter(function (c) { return detected[c.id]; })
    .map(function (c) { return c.label; });

  return {
    total: total, band: band,
    clarity: clarity, specificity: spec, completeness: comp,
    notes: notes, flags: a.flags, detected: detected,
    missing: missing, present: present,
    analysis: a
  };
}

// ----------------------------------------------------------------------------
// Roast composition — verdict by band + jokes for the worst detected weaknesses
// ----------------------------------------------------------------------------
function buildRoast(scored) {
  const verdict = pick(VERDICTS[scored.band].lines);
  const flagged = Object.keys(scored.flags)
    .filter(function (id) {
      if (id === 'urgency') return scored.specificity < 15; // urgency only roasts when there’s no detail backing it up
      return FLAG_JOKES[id];
    })
    .map(function (id) { return FLAG_JOKES[id]; })
    .sort(function (x, y) { return y.severity - x.severity; });
  const lines = [verdict].concat(flagged.slice(0, 3).map(function (f) { return pick(f.jokes); }));
  return {
    band: scored.band,
    label: VERDICTS[scored.band].label,
    flames: VERDICTS[scored.band].flames,
    lines: lines
  };
}

// ----------------------------------------------------------------------------
// Shareable scorecard for X — hard-capped at 280 chars
// ----------------------------------------------------------------------------
function buildScorecard(scored, roast, siteUrl) {
  const header = '🔥 Roast My Issue — ' + scored.total + '/100 (' + roast.label + ') ' + '🔥'.repeat(roast.flames);
  function compose(quote, items) {
    return header + '\n“' + quote + '”\nMissing: ' + items.map(function (i) { return i.label.toLowerCase(); }).join(' · ') + '\nRoast yours: ' + siteUrl;
  }
  let quote = (roast.lines[1] || roast.lines[0] || '').replace(/[“”]/g, '');
  let items = scored.missing.slice(0, 3);
  if (items.length === 0) items = [{ label: 'nothing — it’s genuinely solid' }];
  let card = compose(quote, items);
  while (card.length > 280 && quote.length > 40) {
    quote = quote.slice(0, quote.length - 11).trimEnd() + '…';
    card = compose(quote, items);
  }
  while (card.length > 280 && items.length > 1) {
    items = items.slice(0, -1);
    card = compose(quote, items);
  }
  if (card.length > 280) card = card.slice(0, 277) + '…';
  return card;
}

// ----------------------------------------------------------------------------
// GitHub API — unauthenticated, with real error handling
// ----------------------------------------------------------------------------
class FetchError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'FetchError';
    this.kind = kind;
  }
}

async function fetchGitHubIssue(parsed) {
  const api = 'https://api.github.com/repos/' + parsed.owner + '/' + parsed.repo + '/issues/' + parsed.number;
  let res;
  try {
    res = await fetch(api, { headers: { 'Accept': 'application/vnd.github+json' } });
  } catch (e) {
    throw new FetchError('network', 'Can’t reach GitHub from here. Check your connection — the roast will wait.');
  }
  if (res.status === 404) {
    throw new FetchError('not-found', 'Can’t find that issue. Either the URL is wrong, or the repo is private — in which case its issues die of old age, unroasted.');
  }
  if (res.status === 403 || res.status === 429) {
    const resetMs = Number(res.headers.get('x-ratelimit-reset')) * 1000;
    const when = Number.isFinite(resetMs) && resetMs > 0 ? new Date(resetMs).toLocaleTimeString() : 'in a bit';
    throw new FetchError('rate-limit', 'GitHub’s anonymous API allowance is spent (60 requests/hour per IP). It resets around ' + when + '. Paste the issue text instead — we don’t gatekeep roasting.');
  }
  if (!res.ok) {
    throw new FetchError('http', 'GitHub said ' + res.status + ' ' + res.statusText + '. Even GitHub is embarrassed.');
  }
  const data = await res.json();
  return {
    title: data.title || '',
    body: data.body || '',
    isPR: !!data.pull_request,
    htmlUrl: data.html_url || ''
  };
}

// ----------------------------------------------------------------------------
// Clipboard with fallback (insecure contexts, older browsers)
// ----------------------------------------------------------------------------
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
    return ok;
  }
}

// ============================================================================
// DOM layer — everything below touches the document
// ============================================================================

function $(id) { return document.getElementById(id); }

function animateScore(total) {
  const fill = $('gauge-fill');
  const numEl = $('score-number');
  const C = 527.8;
  fill.style.transition = 'none';
  fill.style.strokeDashoffset = String(C);
  void fill.getBoundingClientRect(); // force reflow so the transition replays
  fill.style.transition = '';
  requestAnimationFrame(function () {
    fill.style.strokeDashoffset = (C * (1 - total / 100)).toFixed(1);
  });
  const dur = 1300;
  const start = performance.now();
  function frame(now) {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    numEl.textContent = String(Math.round(eased * total));
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function renderResult(scored, roast) {
  const result = $('result');
  result.dataset.band = scored.band;
  $('verdict-label').textContent = roast.label;
  $('flame-meter').textContent = '🔥'.repeat(roast.flames) + '·'.repeat(5 - roast.flames);

  const roastBox = $('roast-text');
  roastBox.textContent = '';
  roast.lines.forEach(function (line) {
    const p = document.createElement('p');
    p.textContent = line;
    roastBox.appendChild(p);
  });

  const chips = $('flag-chips');
  chips.textContent = '';
  const flagIds = Object.keys(scored.flags).filter(function (id) { return FLAG_JOKES[id]; });
  if (flagIds.length === 0) {
    const good = document.createElement('span');
    good.className = 'chip good';
    good.textContent = 'nothing structural to mock — suspicious';
    chips.appendChild(good);
  } else {
    flagIds.forEach(function (id) {
      const chip = document.createElement('span');
      chip.className = 'chip bad';
      chip.textContent = FLAG_JOKES[id].label;
      chips.appendChild(chip);
    });
  }

  const missingList = $('missing-list');
  missingList.textContent = '';
  scored.missing.forEach(function (m) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = m.label;
    const span = document.createElement('span');
    span.textContent = m.hint;
    li.appendChild(strong);
    li.appendChild(span);
    missingList.appendChild(li);
  });

  const presentList = $('present-list');
  presentList.textContent = '';
  scored.present.forEach(function (label) {
    const li = document.createElement('li');
    li.textContent = label + ' — found';
    presentList.appendChild(li);
  });

  const pillars = [
    { score: scored.clarity, max: 35, scoreId: 'clarity-score', barId: 'clarity-bar', notesId: 'clarity-notes' },
    { score: scored.specificity, max: 35, scoreId: 'specificity-score', barId: 'specificity-bar', notesId: 'specificity-notes' },
    { score: scored.completeness, max: 30, scoreId: 'completeness-score', barId: 'completeness-bar', notesId: 'completeness-notes' }
  ];
  pillars.forEach(function (p) {
    $(p.scoreId).textContent = p.score + '/' + p.max;
    const bar = $(p.barId);
    bar.style.width = '0%';
    void bar.getBoundingClientRect();
    requestAnimationFrame(function () {
      bar.style.width = (p.score / p.max * 100).toFixed(1) + '%';
    });
    const ul = $(p.notesId);
    ul.textContent = '';
    scored.notes[p.notesId.replace('-notes', '')].forEach(function (n) {
      const li = document.createElement('li');
      li.className = n.pts > 0 ? 'pos' : (n.pts < 0 ? 'neg' : 'zero');
      const sign = n.pts > 0 ? '+' + n.pts : (n.pts < 0 ? String(n.pts) : '·');
      li.textContent = sign + '  ' + n.label;
      ul.appendChild(li);
    });
  });
}

function showInputError(msg) { $('input-error').textContent = msg; }
function clearInputError() { $('input-error').textContent = ''; }
function setStatus(msg) { $('fetch-status').textContent = msg; }

function handleRoast() {
  const raw = $('issue-text').value;
  if (!raw.trim()) {
    showInputError('Nothing to roast. An empty issue scores zero by definition — “ship nothing, ship often.” Give us at least a title.');
    return;
  }
  clearInputError();
  const scored = scoreIssue(raw);
  const roast = buildRoast(scored);
  const card = buildScorecard(scored, roast, SITE_URL);
  renderResult(scored, roast);

  const result = $('result');
  result.classList.remove('hidden');
  void result.offsetWidth;
  animateScore(scored.total);

  $('copy-btn').dataset.card = card;
  $('x-share').href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(card);

  if (scored.total < 25) {
    result.classList.add('quake');
    setTimeout(function () { result.classList.remove('quake'); }, 700);
  }
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleFetch() {
  const urlEl = $('issue-url');
  const fetchBtn = $('fetch-btn');
  setStatus('');
  const url = urlEl.value.trim();
  if (!url) {
    setStatus('Paste a GitHub issue URL first — we can’t read minds. Yet.');
    return;
  }
  const parsed = parseGitHubIssueUrl(url);
  if (!parsed) {
    setStatus('');
    showInputError('That doesn’t look like a GitHub issue URL. Expected something like github.com/owner/repo/issues/123.');
    return;
  }
  clearInputError();
  fetchBtn.disabled = true;
  const original = fetchBtn.textContent;
  fetchBtn.textContent = 'Fetching…';
  try {
    const issue = await fetchGitHubIssue(parsed);
    const text = (issue.title ? issue.title + '\n\n' : '') + (issue.body || '').trim();
    $('issue-text').value = text;
    let msg = 'Fetched ' + parsed.owner + '/' + parsed.repo + '#' + parsed.number;
    if (issue.isPR) msg += ' — that’s a pull request, but we’ll roast it anyway.';
    else if (!text.trim()) msg += ' — this issue exists but contains nothing. Bold.';
    else msg += ' — loaded. Now press the button.';
    setStatus(msg);
  } catch (e) {
    setStatus('');
    showInputError(e.message);
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = original;
  }
}

function handleExample() {
  if (typeof handleExample.idx === 'undefined') handleExample.idx = -1;
  handleExample.idx = (handleExample.idx + 1) % EXAMPLES.length;
  $('issue-text').value = EXAMPLES[handleExample.idx];
  clearInputError();
  setStatus('');
}

const SITE_URL = (typeof location !== 'undefined' && /^https?:$/.test(location.protocol))
  ? location.origin + location.pathname
  : 'https://github.com';

function init() {
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  $('roast-btn').addEventListener('click', handleRoast);
  $('fetch-btn').addEventListener('click', handleFetch);
  $('example-btn').addEventListener('click', handleExample);
  $('copy-btn').addEventListener('click', async function () {
    const btn = $('copy-btn');
    const ok = await copyText(btn.dataset.card || '');
    const original = btn.textContent;
    btn.textContent = ok ? 'Copied ✓' : 'Copy failed — select manually';
    setTimeout(function () { btn.textContent = original; }, 2200);
  });
  $('issue-text').addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleRoast();
  });
  $('issue-url').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleFetch();
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}
