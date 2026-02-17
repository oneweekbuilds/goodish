const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak } = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0 };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const cellMargins = { top: 100, bottom: 100, left: 140, right: 140 };

function makeChangeRow(beforeText, afterText) {
  return [
    new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA },
          shading: { fill: "FDE8E8", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: beforeText, font: "Arial", size: 21, color: "7F1D1D" })
          ]})]
        }),
        new TableCell({
          borders,
          width: { size: 4680, type: WidthType.DXA },
          shading: { fill: "DCFCE7", type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: afterText, font: "Arial", size: 21, color: "14532D" })
          ]})]
        }),
      ]
    })
  ];
}

function makeHeaderRow() {
  return new TableRow({
    children: [
      new TableCell({
        borders,
        width: { size: 4680, type: WidthType.DXA },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [
          new TextRun({ text: "BEFORE (old wording)", font: "Arial", size: 20, bold: true, color: "475569" })
        ]})]
      }),
      new TableCell({
        borders,
        width: { size: 4680, type: WidthType.DXA },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [
          new TextRun({ text: "AFTER (new wording)", font: "Arial", size: 20, bold: true, color: "475569" })
        ]})]
      }),
    ]
  });
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: "1E293B" })]
  });
}

function locationNote(text) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "Where this appears: ", font: "Arial", size: 19, bold: true, color: "64748B", italics: true }),
              new TextRun({ text, font: "Arial", size: 19, color: "64748B", italics: true })]
  });
}

function explanationNote(text) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Why it changed: ", font: "Arial", size: 19, bold: true, color: "64748B" }),
              new TextRun({ text, font: "Arial", size: 19, color: "64748B" })]
  });
}

const changes = [
  // HIGH PRIORITY
  {
    heading: "1. The Plus Page Promise",
    location: "The tagline on the Plus pricing page and the paywall popup",
    why: "Claims to explain \"why\" things happened in your feed. Your philosophy says you describe what appeared, never claim to know why.",
    before: "See how your feed changes over time, what shifted, and why it likely happened.",
    after: "See how your feed changes over time, what shifted, and what patterns emerge."
  },
  {
    heading: "2. Ads Section Title",
    location: "The headline for the Ads section of the dashboard",
    why: "\"Steering\" implies the feed is deliberately manipulating you. We can only say what appeared, not what the platform intended.",
    before: "Where your feed is steering you to spend",
    after: "Commercial content in your feed"
  },
  {
    heading: "3. Ads Section Description",
    location: "The subtitle text under the Ads headline",
    why: "\"How hard the feed is selling to you\" anthropomorphizes the algorithm and implies intent.",
    before: "Looks at labeled promotions to see how hard the feed is selling to you.",
    after: "Shows what share of your feed contains labeled ads and likely promotional content."
  },
  {
    heading: "4. Ads Detail Section Title",
    location: "The \"Context\" panel heading in the Ads breakdown on the dashboard",
    why: "Same issue \u2014 \"selling\" language implies deliberate action by the feed.",
    before: "What your feed is trying to sell you / Where the selling comes from / Which advertisers and platforms are doing the most selling during this window.",
    after: "Commercial content in your feed / Where commercial content comes from / Which advertisers and platforms account for the most commercial content during this window."
  },
  {
    heading: "5. Ads Concentration Description",
    location: "A supporting view in the Ads catalog describing repeat advertisers",
    why: "\"Steering what you\u2019re being sold\" implies intentional manipulation.",
    before: "Shows whether a handful of repeat advertisers are steering what you\u2019re being sold in this window.",
    after: "Shows whether a handful of repeat advertisers account for most of the commercial content in this window."
  },
  {
    heading: "6. Algorithm Engagement Claim",
    location: "The insight card at the top of the Suggested vs Followed tab when suggested content is high (60%+)",
    why: "Claims platforms \"optimize for engagement.\" We don\u2019t know what any platform\u2019s algorithm optimizes for \u2014 stating it as fact undermines credibility.",
    before: "Algorithmic recommendations optimize for engagement, which may not align with what you consciously want to see.",
    after: "Algorithmically suggested content is selected by the platform, not by you. The criteria used are not publicly documented."
  },
  {
    heading: "7. \"Curate Your Algorithm\" Advice",
    location: "The \"What you can do\" card at the bottom of the Suggested vs Followed tab",
    why: "Claims specific knowledge of how algorithms respond to likes/comments. The actual behavior isn\u2019t publicly documented.",
    before: "Curate your algorithm: Engage with (like, share, comment) content from accounts you follow to signal to the algorithm that you want to see more from them.",
    after: "Engage with what you value: Platforms often describe engagement (likes, shares, comments) as a factor in feed ranking, though the exact effect is not publicly documented."
  },

  // MEDIUM PRIORITY
  {
    heading: "8. Source Concentration Insight",
    location: "The insight card at the top of the Overview tab when source concentration is high (60%+)",
    why: "Claims to know what \"influences what you think about.\" That\u2019s a psychological claim \u2014 we can only describe the feed composition.",
    before: "High concentration means these few sources have outsized influence on what you think about and pay attention to.",
    after: "High concentration means most of your feed content comes from a small number of accounts."
  },
  {
    heading: "9. Unlabeled Promotion Insight",
    location: "The insight card on the Ads tab when unlabeled promotion is high (10%+)",
    why: "\"Blends persuasion with entertainment\" interprets the creator\u2019s strategy. We can only note that labels are absent.",
    before: "Unlabeled promotion blends persuasion with entertainment, making it harder to evaluate intent.",
    after: "Some promotional content appears without clear advertising labels."
  },
  {
    heading: "10. Regular Commercial Content Insight",
    location: "The insight card on the Ads tab for moderate commercial content (10\u201325%)",
    why: "\"Influences purchasing behavior\" is a causal claim about user psychology.",
    before: "Commercial content influences purchasing behavior even when you scroll past.",
    after: "A regular share of your scrolling time involves commercial content."
  },
  {
    heading: "11. High Political Content Insight",
    location: "The insight card on the Politics tab when political content is high (25%+)",
    why: "\"Shapes your mood and worldview\" is a psychological claim about the user\u2019s internal state.",
    before: "High political exposure continuously shapes your mood and worldview, even when you do not actively engage.",
    after: "A significant share of your scrolling time involves political content, whether or not you actively engage with it."
  },
  {
    heading: "12. Negative Tone Insight",
    location: "The insight card on the Tone tab when negative tone dominates (35%+)",
    why: "\"Outrage-driven\" is a loaded label, and \"can affect how you feel\" makes a psychological claim.",
    before: "Outrage-driven content is engaging but can affect how you feel after scrolling and what issues feel urgent.",
    after: "A large share of posts in your feed carry negative or conflict-focused framing."
  },

  // LOWER PRIORITY
  {
    heading: "13. \"Outrage\" Label \u2192 \"Conflict-Focused\" (12+ locations)",
    location: "Every tone chart and label across all six dashboard tabs \u2014 Overview, Sources, Ads, Politics, Tone, and Suggested vs Followed",
    why: "\"Outrage\" is an editorializing, sensational label. The classifier detects negative sentiment; calling it \"outrage\" adds editorial judgment that doesn\u2019t belong in a transparency tool.",
    before: "Negative or outrage tone",
    after: "Negative or conflict-focused tone"
  },
  {
    heading: "14. Promotional Themes Action",
    location: "A hidden action suggestion in the Ads catalog",
    why: "\"Stop reinforcing patterns\" claims to know how algorithms respond to engagement \u2014 speculative.",
    before: "Reduce engagement to stop reinforcing patterns.",
    after: "You can choose to engage less with promotional content you would rather not see."
  },
  {
    heading: "15. Political Tone Action",
    location: "A hidden action suggestion in the Politics catalog",
    why: "\"Outrage content\" is a loaded label.",
    before: "Mute accounts that post outrage content.",
    after: "Mute accounts whose tone you find unhelpful."
  },
];

const children = [];

// Title
children.push(new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text: "AlgorithmLens Copy Changes", font: "Arial", size: 40, bold: true, color: "0F172A" })]
}));
children.push(new Paragraph({
  spacing: { after: 100 },
  children: [new TextRun({ text: "Before & After Review", font: "Arial", size: 28, color: "475569" })]
}));
children.push(new Paragraph({
  spacing: { after: 300 },
  children: [new TextRun({ text: "February 13, 2026", font: "Arial", size: 20, color: "94A3B8" })]
}));

// Intro
children.push(new Paragraph({
  spacing: { after: 200 },
  children: [new TextRun({ text: "This document shows every user-facing text change made to fix epistemic restraint violations. The left column (red) shows the old wording. The right column (green) shows the new wording. Each change includes a note about where it appears and why it was changed.", font: "Arial", size: 22, color: "334155" })]
}));

children.push(new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text: "The core rule: ", font: "Arial", size: 22, bold: true, color: "334155" }),
            new TextRun({ text: "AlgorithmLens describes what appeared in your feed. It never claims to know why the platform showed it, what effect it has on you, or what the algorithm intends.", font: "Arial", size: 22, color: "334155" })]
}));

children.push(new Paragraph({
  spacing: { after: 400 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0", space: 1 } },
  children: []
}));

// Each change
for (const change of changes) {
  children.push(sectionHeading(change.heading));
  children.push(locationNote(change.location));
  children.push(explanationNote(change.why));

  const rows = [makeHeaderRow(), ...makeChangeRow(change.before, change.after)];
  children.push(new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows,
  }));

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children,
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/nifty-quirky-thompson/mnt/AlgorithmLens_Cowork/COPY_CHANGES_REVIEW.docx", buffer);
  console.log("Created COPY_CHANGES_REVIEW.docx");
});
