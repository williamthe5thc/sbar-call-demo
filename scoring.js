// Scoring: deterministic rules, no randomness. Shared by the standard version (app.js) and the
// immersive version (scene1.js and scene2.js), so the same selections always give the same result.
import { scenario } from './scenario.js';

// Look-up table: id -> statement, remembering which section it is shown in.
export const byId = {};
for (const sec of scenario.sections) {
  for (const s of sec.statements) byId[s.id] = { ...s, shownIn: sec.key };
}
export const secName = (key) => scenario.sections.find((s) => s.key === key).name;
export const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
export const emptySelection = () => ({ S: [], B: [], A: [], R: [] });

// sel: ordered statement ids per section, { S: [], B: [], A: [], R: [] }.
export function score(sel) {
  const chosen = (key) => sel[key].map((id) => byId[id]);
  const total = Object.values(sel).reduce((n, ids) => n + ids.length, 0);
  const C = Object.fromEntries(scenario.criteria.map((c) => [c.id, c]));
  const results = [];

  // Organization: every section has something, nothing is in the wrong section,
  // and the opening line (the statement marked `lead`) comes first.
  const orgTips = [];
  for (const sec of scenario.sections) {
    const items = chosen(sec.key);
    if (!items.length) orgTips.push(fill(C.organization.emptySectionTip, { section: sec.name }));
    for (const s of items) {
      if (s.belongsIn) orgTips.push(fill(C.organization.misplacedTip, { text: s.text, section: secName(s.belongsIn) }));
    }
    const lead = items.find((s) => s.lead);
    if (lead && items[0] !== lead) orgTips.push(fill(C.organization.orderTip, { section: sec.name, first: lead.text }));
  }
  results.push(total === 0
    ? { id: 'organization', met: false, tips: [C.organization.emptyTip] }
    : { id: 'organization', met: orgTips.length === 0, tips: orgTips });

  // Completeness: every required statement is selected.
  const missing = [];
  for (const sec of scenario.sections) {
    for (const s of sec.statements) {
      if (s.kind === 'required' && !sel[sec.key].includes(s.id)) {
        missing.push(fill(C.completeness.missingTip, { section: sec.name, hint: s.hint }));
      }
    }
  }
  results.push({ id: 'completeness', met: missing.length === 0, tips: missing });

  // Prioritization: no irrelevant distractors. (Misplaced real content is an Organization issue.)
  const noise = Object.keys(sel).flatMap(chosen).filter((s) => s.kind === 'distractor' && !s.belongsIn);
  results.push(total === 0
    ? { id: 'prioritization', met: false, tips: [C.prioritization.emptyTip] }
    : { id: 'prioritization', met: noise.length === 0, tips: noise.map((s) => fill(C.prioritization.distractorTip, { text: s.text, why: s.why })) });

  // Clear request: Recommendation has a specific request AND a time frame.
  const rec = chosen('R');
  const reqTips = [];
  if (!rec.some((s) => s.request)) reqTips.push(C.request.noRequestTip);
  if (!rec.some((s) => s.timeFrame)) reqTips.push(C.request.noTimeTip);
  results.push({ id: 'request', met: reqTips.length === 0, tips: reqTips });

  const metCount = results.filter((r) => r.met).length;
  // Provider reply branches on how many criteria were met.
  let reply;
  if (metCount === 4) reply = scenario.replies.success;
  else if (metCount >= 2) reply = scenario.replies.clarify[results.find((r) => !r.met).id]; // first unmet
  else reply = scenario.replies.confused;
  return { results, metCount, reply };
}
