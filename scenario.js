// ALL case content lives here. To make a new scenario, copy this file and change
// the data; app.js has no clinical content in it.
//
// Statement flags:
//   kind: 'required'   -> must be selected (completeness). `hint` names what is
//                         missing without giving the answer away.
//   lead: true         -> if selected, must come first in its section (organization).
//                         Only the opening line of the call has one: say who you are
//                         and who the patient is before anything else.
//   kind: 'distractor' -> should not be selected (prioritization), unless it has
//                         `belongsIn`, which means it is real content that was put
//                         in the wrong SBAR section (organization).
//   request / timeFrame -> used by the "Clear request" rule in Recommendation.
//
// `assessment` is the bedside scene: one entry per object the learner can examine.
//   id, label      -> the hotspot's id and its visible (and accessible) name
//   x, y           -> where the label sits, in percent of the scene (left, top)
//   tx, ty         -> optional: the object itself, in percent; a leader line is drawn to it
//   findings       -> short sentences that say what is observed, never what it means
//   panel          -> optional: 'monitor' or 'chart' also shows the monitor graphic or the chart tables
// List them left to right: this is also the keyboard Tab order. A 3D scene could reuse this data.
//
// EVERY clinical value below is a PLACEHOLDER and needs nursing SME review.

export const scenario = {
  title: 'The 2 a.m. Call',
  label:
    'Personal portfolio demo. Fictional patient. Clinical content requires review by a nursing subject matter expert.',
  banner: 'All clinical values are placeholders and need nursing SME review.',

  // The skill this case practices, written for this demo.
  competency: "Communicate a patient's changing condition to a provider clearly and concisely, using SBAR.",

  // Wording from the verified "safe wording" in the project's source notes.
  rationale:
    'Communication in BSN programs is still taught mostly as knowledge rather than as a practiced skill (Wittenberg et al., 2021). SBAR is a common structure for calls to providers, and SBAR-based simulation has improved communication clarity in some studies, though the evidence is mostly low quality (Yun et al., 2023). This demo gives learners repeated, low-stakes practice building that call.',

  situation:
    'It is 2:00 a.m. You are the night nurse. Mr. Morgan, a fictional 58-year-old in Room 12, is on day 1 after abdominal surgery. His numbers have been drifting for hours. Examine him at the bedside, then build your SBAR call to the on-call provider.',

  chart: {
    patient: 'Mr. Morgan, age 58, Room 12 (fictional)',
    vitalsCaption: 'Vital signs trend, evening to 2:00 a.m.',
    vitalsColumns: ['Heart rate (beats/min)', 'Blood pressure (mmHg)', 'Resp. rate (breaths/min)', 'Temp (°F)', 'SpO2', 'Pain (0-10)', 'Drain output (mL since last check)'],
    vitals: [
      { time: '6:00 p.m.', values: ['84', '128/78', '16', '98.6', '97%', '4', '30'] },
      { time: '10:00 p.m.', values: ['92', '118/72', '18', '99.1', '96%', '5', '40'] },
      { time: '12:00 a.m.', values: ['104', '104/62', '20', '99.4', '95%', '6', '70'] },
      { time: '2:00 a.m.', values: ['112', '92/54', '22', '99.5', '94%', '8', '120'] },
    ],
    notes: [
      '2:00 a.m.: Skin cool and clammy. Abdomen firm and distended. Urine output 20 mL in the last hour.',
      '12:00 a.m.: Patient restless, says pain is worse. Drain output increased.',
      '6:00 p.m.: Resting, abdomen soft. Day 1 after bowel resection (open abdominal surgery).',
    ],
    meds: [
      'Morphine by patient-controlled pump (PCA)',
      'Prophylactic anticoagulant, given at 8:00 p.m.',
      'IV fluids at maintenance rate',
    ],
    labs: ['Hemoglobin 10.9 g/dL at 6:00 p.m. (before surgery: 12.8 g/dL)'],
  },

  assessment: [
    { id: 'ivpump', label: 'IV pump', x: 8.5, y: 44, tx: 16, ty: 48.5,
      findings: ['The IV pump is running at the maintenance rate.', 'No alarms are showing.', 'The fluid bag is about half full.'] },
    { id: 'pca', label: 'PCA pump', x: 9, y: 90, tx: 16.3, ty: 76.8,
      findings: ['The PCA pump is on and working.', 'No alarms are showing.', 'The handset is within his reach.'] },
    { id: 'skin', label: "Patient's skin", x: 28.5, y: 53.6, tx: 32.8, ty: 62.8,
      findings: ['His skin feels cool to the touch.', 'His skin is damp.'] },
    { id: 'monitor', label: 'Monitor', x: 41.3, y: 8, tx: 41.3, ty: 13, panel: 'monitor',
      findings: [] /* filled from chart.vitals below */ },
    { id: 'ivsite', label: 'IV site', x: 41.9, y: 41.6, tx: 42, ty: 69.4,
      findings: ['The IV site in his left arm is clean and dry.', 'There is no redness or swelling around it.'] },
    { id: 'drain', label: 'Surgical drain', x: 51.3, y: 90.4, tx: 51.3, ty: 74.4,
      findings: ['The drain bulb holds 120 mL since the last check.', 'The fluid in the bulb is red.', 'The tubing is not kinked.', 'The check at 12:00 a.m. was 70 mL.'] },
    { id: 'dressing', label: 'Dressing', x: 55, y: 53.6, tx: 55.5, ty: 60.4,
      findings: ['The dressing over the incision is dry and intact.', 'The tape edges are sealed.', 'No drainage shows on the gauze.'] },
    { id: 'abdomen', label: 'Abdomen', x: 70, y: 41.6, tx: 61.3, ty: 61,
      findings: ['The abdomen looks rounded and feels firm when touched.', 'He tenses when you press near the incision.', 'He rates his pain 8 out of 10.'] },
    { id: 'urine', label: 'Urine bag', x: 73.8, y: 94, tx: 73.5, ty: 89.6,
      findings: ['The collection bag holds 20 mL from the last hour.', 'The urine is dark yellow.', 'The tubing is not kinked.'] },
    { id: 'chart', label: 'Chart', x: 92.3, y: 53.6, tx: 91.3, ty: 57.6, panel: 'chart',
      findings: ['The chart is open to the vital signs trend, nursing notes, current medications and labs.'] },
  ],

  sections: [
    {
      key: 'S',
      name: 'Situation',
      prompt: 'What is happening right now? Who is the patient and why are you calling?',
      statements: [
        { id: 's1', kind: 'required', hint: 'who is calling and which patient this is', lead: true, text: 'This is the night nurse calling about Mr. Morgan in Room 12, day 1 after abdominal surgery.' },
        { id: 's2', kind: 'required', hint: 'how his heart rate and blood pressure have changed', text: 'His heart rate has risen from 84 to 112 and his blood pressure has fallen from 128/78 to 92/54 since 6 p.m.' },
        { id: 's3', kind: 'required', hint: 'what is happening with his surgical drain', text: 'His surgical drain output has increased to 120 mL since the last check.' },
        { id: 's4', kind: 'distractor', why: 'is not relevant to why you are calling', text: 'His daughter brought flowers this afternoon and visiting hours are over.' },
        { id: 's5', kind: 'distractor', belongsIn: 'B', text: 'He has a history of high blood pressure treated with a daily medication.' },
      ],
    },
    {
      key: 'B',
      name: 'Background',
      prompt: 'What does the provider need to know about how he got here?',
      statements: [
        { id: 'b1', kind: 'required', hint: 'what surgery he had and when', text: 'He had a bowel resection yesterday morning through an open abdominal incision.' },
        { id: 'b2', kind: 'required', hint: 'how he looked earlier in the evening, for comparison', text: 'At 6 p.m. his blood pressure was 128/78 and his abdomen was soft.' },
        { id: 'b3', kind: 'required', hint: 'medicines that could matter here (pain relief and blood thinners)', text: 'He is on a morphine PCA and received a prophylactic anticoagulant at 8 p.m.' },
        { id: 'b4', kind: 'distractor', why: 'is not relevant to this change in condition', text: 'He lives with his wife and enjoys gardening.' },
        { id: 'b5', kind: 'distractor', belongsIn: 'A', text: 'His abdomen is now firm and distended.' },
      ],
    },
    {
      key: 'A',
      name: 'Assessment',
      prompt: 'What do you think is going on? What have you found?',
      statements: [
        { id: 'a1', kind: 'required', hint: 'what you found when you checked his abdomen and pain', text: 'His abdomen is firm and distended and he rates his pain 8 out of 10.' },
        { id: 'a2', kind: 'required', hint: 'other signs of poor circulation you assessed', text: 'His skin is cool and clammy, his respiratory rate is 22, and his urine output was 20 mL in the last hour.' },
        { id: 'a3', kind: 'required', hint: 'what you think is going on', text: 'I am concerned he may be bleeding or developing a serious complication.' },
        { id: 'a4', kind: 'distractor', why: 'is not relevant to this change in condition', text: 'The IV site in his left arm looks clean and dry.' },
        { id: 'a5', kind: 'distractor', belongsIn: 'R', text: 'He needs a stat blood count and a fluid bolus.' },
      ],
    },
    {
      key: 'R',
      name: 'Recommendation',
      prompt: 'What do you need from the provider, and how soon?',
      statements: [
        { id: 'r1', kind: 'required', hint: 'whether the provider needs to come and see him', request: true, text: 'Please come to the bedside to evaluate him.' },
        { id: 'r2', kind: 'required', hint: 'which tests and treatment you are asking for', request: true, text: 'Please order a stat blood count and an IV fluid bolus.' },
        { id: 'r3', kind: 'required', hint: 'how soon you need a response', timeFrame: true, text: 'I need you here, or a call back with orders, within 15 minutes.' },
        { id: 'r4', kind: 'distractor', why: 'is vague and gives no time frame', text: 'Let me know whenever you get a chance.' },
        { id: 'r5', kind: 'distractor', belongsIn: 'S', text: 'His heart rate is 112 and his blood pressure is 92/54.' },
        { id: 'r6', kind: 'distractor', why: 'is not relevant to this request', text: 'I will update the charge nurse at the end of my shift.' },
      ],
    },
  ],

  // Four mastery criteria. Mastery means all four are met; there is no score.
  criteria: [
    {
      id: 'organization',
      name: 'Organization',
      description: 'Every SBAR section has content, each statement is in its proper section, and the call opens by saying who you are and who the patient is.',
      metTip: 'Every section has content, every statement is in the right section, and the call opens the right way.',
      emptyTip: 'Select statements for the call first.',
      misplacedTip: '"{text}" belongs in {section}, not here.',
      orderTip: 'Open {section} with "{first}" so the provider knows who is calling and about whom.',
      emptySectionTip: '{section} is empty. Every part of SBAR needs at least one statement.',
    },
    {
      id: 'completeness',
      name: 'Completeness',
      description: 'All the required items are present.',
      metTip: 'All the required items are in your call.',
      missingTip: '{section} is missing {hint}. Look back at the chart.',
    },
    {
      id: 'prioritization',
      name: 'Prioritization',
      description: 'No distracting or irrelevant statements.',
      metTip: 'You left out the details the provider does not need right now.',
      emptyTip: 'Select statements for the call first.',
      distractorTip: '"{text}" {why}. Take it out.',
    },
    {
      id: 'request',
      name: 'Clear request',
      description: 'The Recommendation has a specific request and a time frame.',
      metTip: 'Your Recommendation says what you need and how soon.',
      noRequestTip: 'Add a specific request to Recommendation: what should the provider do?',
      noTimeTip: 'Add a time frame to Recommendation: how soon do you need the provider to act?',
    },
  ],

  // Provider replies branch on how many criteria were met.
  replies: {
    success:
      'Thanks for the clear report. I am on my way to see him. Start a fluid bolus and send a stat blood count now. Call me right away if his pressure drops further.',
    confused: "I'm not sure what you need from me. Can you start over and tell me what's going on?",
    // Used when 2 or 3 criteria are met: a question tied to the FIRST unmet criterion.
    clarify: {
      organization: 'I am having trouble following that. Can you walk me through it in order: what is happening now, then how he got here?',
      completeness: 'I think I am missing some of the picture. What else have you found, or what else should I know about him?',
      prioritization: 'You gave me a lot of detail I do not need right now. What is the most important thing I should know?',
      request: 'What exactly do you want me to do, and how soon?',
    },
  },
};

// The monitor shows the latest row of the vitals table, so the two can never disagree.
{
  const cols = scenario.chart.vitalsColumns;
  const first = scenario.chart.vitals[0];
  const last = scenario.chart.vitals[scenario.chart.vitals.length - 1];
  const v = (row, name) => row.values[cols.findIndex((c) => c.startsWith(name))];
  scenario.assessment.find((a) => a.id === 'monitor').findings = [
    `The monitor shows a heart rate of ${v(last, 'Heart rate')} beats per minute.`,
    `Blood pressure reads ${v(last, 'Blood pressure')} mmHg.`,
    `Respiratory rate is ${v(last, 'Resp. rate')} breaths per minute and SpO2 is ${v(last, 'SpO2')}.`,
    `At ${first.time} the heart rate was ${v(first, 'Heart rate')} and blood pressure was ${v(first, 'Blood pressure')}.`,
  ];
}
