// ALL case content lives here. To make a new scenario, copy this file and change
// the data; app.js has no clinical content in it.
//
// Statement flags:
//   kind: 'required'   -> must be selected (completeness); `order` is its expected
//                         position inside its own section (organization).
//   kind: 'distractor' -> should not be selected (prioritization), unless it has
//                         `belongsIn`, which means it is real content that was put
//                         in the wrong SBAR section (organization).
//   request / timeFrame -> used by the "Clear request" rule in Recommendation.
//
// EVERY clinical value below is a PLACEHOLDER and needs nursing SME review.

export const scenario = {
  title: 'The 2 a.m. Call',
  label:
    'Personal portfolio demo. Not affiliated with WGU. Fictional patient. Clinical content requires review by a nursing subject matter expert.',
  banner: 'All clinical values are placeholders and need nursing SME review.',

  competency: {
    quote:
      'The graduate effectively communicates and collaborates with interprofessional teams, persons, families, and communities.',
    area: 'Professional Communication/Collaboration',
    url: 'https://www.wgu.edu/online-nursing-health-degrees/rn-to-bsn-nursing-bachelors-program.html',
    note: 'Based on a publicly listed WGU program competency (RN-to-BSN).',
  },

  // Wording from the verified "safe wording" in the project's source notes.
  rationale:
    'Communication in BSN programs is still taught mostly as knowledge rather than as a practiced skill (Wittenberg et al., 2021). SBAR is a common structure for calls to providers, and SBAR-based simulation has improved communication clarity in some studies, though the evidence is mostly low quality (Yun et al., 2023). This demo gives learners repeated, low-stakes practice building that call.',

  situation:
    'It is 2:00 a.m. You are the night nurse. Mr. Morgan, a fictional 58-year-old in Room 12, is on day 1 after abdominal surgery. His numbers have been drifting for hours. Review the chart, then build your SBAR call to the on-call provider.',

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

  sections: [
    {
      key: 'S',
      name: 'Situation',
      prompt: 'What is happening right now? Who is the patient and why are you calling?',
      statements: [
        { id: 's1', kind: 'required', order: 1, text: 'This is the night nurse calling about Mr. Morgan in Room 12, day 1 after abdominal surgery.' },
        { id: 's2', kind: 'required', order: 2, text: 'His heart rate has risen from 84 to 112 and his blood pressure has fallen from 128/78 to 92/54 since 6 p.m.' },
        { id: 's3', kind: 'required', order: 3, text: 'His surgical drain output has increased to 120 mL since the last check.' },
        { id: 's4', kind: 'distractor', why: 'is not relevant to why you are calling', text: 'His daughter brought flowers this afternoon and visiting hours are over.' },
        { id: 's5', kind: 'distractor', belongsIn: 'B', text: 'He has a history of high blood pressure treated with a daily medication.' },
      ],
    },
    {
      key: 'B',
      name: 'Background',
      prompt: 'What does the provider need to know about how he got here?',
      statements: [
        { id: 'b1', kind: 'required', order: 1, text: 'He had a bowel resection yesterday morning through an open abdominal incision.' },
        { id: 'b2', kind: 'required', order: 2, text: 'At 6 p.m. his blood pressure was 128/78 and his abdomen was soft.' },
        { id: 'b3', kind: 'required', order: 3, text: 'He is on a morphine PCA and received a prophylactic anticoagulant at 8 p.m.' },
        { id: 'b4', kind: 'distractor', why: 'is not relevant to this change in condition', text: 'He lives with his wife and enjoys gardening.' },
        { id: 'b5', kind: 'distractor', belongsIn: 'A', text: 'His abdomen is now firm and distended.' },
      ],
    },
    {
      key: 'A',
      name: 'Assessment',
      prompt: 'What do you think is going on? What have you found?',
      statements: [
        { id: 'a1', kind: 'required', order: 1, text: 'His abdomen is firm and distended and he rates his pain 8 out of 10.' },
        { id: 'a2', kind: 'required', order: 2, text: 'His skin is cool and clammy, his respiratory rate is 22, and his urine output was 20 mL in the last hour.' },
        { id: 'a3', kind: 'required', order: 3, text: 'I am concerned he may be bleeding or developing a serious complication.' },
        { id: 'a4', kind: 'distractor', why: 'is not relevant to this change in condition', text: 'The IV site in his left arm looks clean and dry.' },
        { id: 'a5', kind: 'distractor', belongsIn: 'R', text: 'He needs a stat blood count and a fluid bolus.' },
      ],
    },
    {
      key: 'R',
      name: 'Recommendation',
      prompt: 'What do you need from the provider, and how soon?',
      statements: [
        { id: 'r1', kind: 'required', order: 1, request: true, text: 'Please come to the bedside to evaluate him.' },
        { id: 'r2', kind: 'required', order: 2, request: true, text: 'Please order a stat blood count and an IV fluid bolus.' },
        { id: 'r3', kind: 'required', order: 3, timeFrame: true, text: 'I need you here, or a call back with orders, within 15 minutes.' },
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
      description: 'Each statement is in its proper SBAR section, and the key items run in a sensible order.',
      metTip: 'Every statement is in the right section and the key items are in a sensible order.',
      emptyTip: 'Select statements for the call first.',
      misplacedTip: '"{text}" belongs in {section}, not here.',
      orderTip: 'In {section}, put "{first}" before "{second}".',
    },
    {
      id: 'completeness',
      name: 'Completeness',
      description: 'All the required items are present.',
      metTip: 'All the required items are in your call.',
      missingTip: 'Still missing in {section}: "{text}"',
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
