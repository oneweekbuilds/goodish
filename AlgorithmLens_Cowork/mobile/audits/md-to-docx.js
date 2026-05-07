// Pragmatic markdown -> docx converter for the build #43 audit.
// Goal: readable in Word/Pages. Perfect rendering is not the goal.
//
// Handles: # ## ### #### headings, paragraphs with **bold** / `code` /
// [text](url), - and 1. lists (single-level), markdown tables, code fences,
// horizontal rules.

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
  Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType,
  PageBreak, TabStopType, TabStopPosition,
} = require('docx');

// ──────── Inline parser ─────────────────────────────────────────────
// Tokenize a single line into TextRun-friendly segments. Supports:
//   **bold**, `code`, [text](url)
function parseInline(text) {
  const runs = [];
  let i = 0;
  let buf = '';
  const flush = (style = {}) => {
    if (buf) {
      runs.push({ text: buf, ...style });
      buf = '';
    }
  };
  while (i < text.length) {
    // bold
    if (text[i] === '*' && text[i + 1] === '*') {
      flush();
      const end = text.indexOf('**', i + 2);
      if (end === -1) { buf += text[i]; i += 1; continue; }
      runs.push({ text: text.slice(i + 2, end), bold: true });
      i = end + 2;
      continue;
    }
    // code
    if (text[i] === '`') {
      flush();
      const end = text.indexOf('`', i + 1);
      if (end === -1) { buf += text[i]; i += 1; continue; }
      runs.push({ text: text.slice(i + 1, end), code: true });
      i = end + 1;
      continue;
    }
    // link [text](url)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1);
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          flush();
          runs.push({
            text: text.slice(i + 1, closeBracket),
            link: text.slice(closeBracket + 2, closeParen),
          });
          i = closeParen + 1;
          continue;
        }
      }
    }
    buf += text[i];
    i += 1;
  }
  flush();
  return runs;
}

function runsToTextRuns(runs, baseStyle = {}) {
  const out = [];
  for (const r of runs) {
    if (r.link) {
      out.push(new ExternalHyperlink({
        children: [new TextRun({ text: r.text, style: 'Hyperlink', ...baseStyle })],
        link: r.link,
      }));
    } else if (r.code) {
      out.push(new TextRun({
        text: r.text,
        font: 'Consolas',
        size: 20,
        ...baseStyle,
      }));
    } else {
      out.push(new TextRun({
        text: r.text,
        bold: r.bold || baseStyle.bold || false,
        italics: r.italics || baseStyle.italics || false,
        ...baseStyle,
      }));
    }
  }
  return out;
}

// ──────── Block parser ──────────────────────────────────────────────

const HEADING_LEVELS = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
};

function parseTableRow(line) {
  // Strip leading/trailing pipes, split on |
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function isTableSep(line) {
  return /^\s*\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/.test(line);
}

function buildTable(headerCells, rows) {
  const colCount = Math.max(headerCells.length, ...rows.map((r) => r.length));
  // Pad rows to colCount
  const padded = rows.map((r) => {
    const out = r.slice();
    while (out.length < colCount) out.push('');
    return out;
  });
  const totalWidth = 9360; // US Letter content width
  const colWidth = Math.floor(totalWidth / colCount);
  const columnWidths = new Array(colCount).fill(colWidth);
  // Adjust last column to absorb rounding
  columnWidths[colCount - 1] = totalWidth - colWidth * (colCount - 1);

  const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const borders = { top: border, bottom: border, left: border, right: border };

  const makeCell = (text, isHeader) => new TableCell({
    borders,
    width: { size: colWidth, type: WidthType.DXA },
    shading: isHeader ? { fill: 'E8EEF5', type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      children: runsToTextRuns(parseInline(text), { size: 18, bold: isHeader || undefined }),
    })],
  });

  const tableRows = [
    new TableRow({ children: headerCells.map((c) => makeCell(c, true)) }),
    ...padded.map((row) => new TableRow({ children: row.map((c) => makeCell(c, false)) })),
  ];

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: tableRows,
  });
}

function convertMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  let i = 0;
  let inCodeFence = false;
  let codeBuf = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (/^```/.test(line)) {
      if (inCodeFence) {
        // Close
        blocks.push(new Paragraph({
          children: codeBuf.map((cl, idx) => new TextRun({
            text: cl + (idx < codeBuf.length - 1 ? '\n' : ''),
            font: 'Consolas',
            size: 18,
            break: idx === 0 ? 0 : 1,
          })),
          shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
          spacing: { before: 80, after: 80 },
        }));
        codeBuf = [];
        inCodeFence = false;
      } else {
        inCodeFence = true;
      }
      i += 1;
      continue;
    }
    if (inCodeFence) {
      codeBuf.push(line);
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      blocks.push(new Paragraph({
        children: [new TextRun('')],
        border: {
          bottom: { color: '999999', space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
        spacing: { before: 120, after: 120 },
      }));
      i += 1;
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2];
      blocks.push(new Paragraph({
        heading: HEADING_LEVELS[level],
        children: runsToTextRuns(parseInline(text)),
        spacing: { before: level === 1 ? 360 : level === 2 ? 240 : 180, after: 120 },
      }));
      i += 1;
      continue;
    }

    // Markdown table
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = parseTableRow(line);
      i += 2; // skip header + separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]));
        i += 1;
      }
      blocks.push(buildTable(header, rows));
      blocks.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }));
      continue;
    }

    // Bulleted list (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      // Collect consecutive list items
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)[-*]\s+(.*)$/);
        const indent = Math.floor(m[1].length / 2);
        const text = m[2];
        blocks.push(new Paragraph({
          numbering: { reference: 'bullets', level: Math.min(indent, 2) },
          children: runsToTextRuns(parseInline(text)),
          spacing: { before: 40, after: 40 },
        }));
        i += 1;
      }
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^(\s*)\d+\.\s+(.*)$/);
        const indent = Math.floor(m[1].length / 2);
        const text = m[2];
        blocks.push(new Paragraph({
          numbering: { reference: 'numbers', level: Math.min(indent, 2) },
          children: runsToTextRuns(parseInline(text)),
          spacing: { before: 40, after: 40 },
        }));
        i += 1;
      }
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Paragraph (consume contiguous non-empty, non-special lines)
    let para = line;
    i += 1;
    while (
      i < lines.length
      && lines[i].trim() !== ''
      && !/^#{1,4}\s+/.test(lines[i])
      && !/^\s*[-*]\s+/.test(lines[i])
      && !/^\s*\d+\.\s+/.test(lines[i])
      && !/^---+\s*$/.test(lines[i])
      && !/^```/.test(lines[i])
      && !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))
    ) {
      para += ' ' + lines[i].trim();
      i += 1;
    }
    blocks.push(new Paragraph({
      children: runsToTextRuns(parseInline(para)),
      spacing: { before: 80, after: 80 },
    }));
  }

  return blocks;
}

// ──────── Main ─────────────────────────────────────────────────────

const inputPath = process.argv[2] || path.join(__dirname, '19_comprehensive_audit_build43.md');
const outputPath = process.argv[3] || path.join(__dirname, '19_comprehensive_audit_build43.docx');

console.log('Reading:', inputPath);
const md = fs.readFileSync(inputPath, 'utf8');
const blocks = convertMarkdown(md);
console.log('Blocks generated:', blocks.length);

const doc = new Document({
  creator: 'Claude',
  title: 'AlgorithmLens — Build #43 Audit',
  styles: {
    default: { document: { run: { font: 'Calibri', size: 22 } } }, // 11pt
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 36, bold: true, font: 'Calibri', color: '1E293B' },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 28, bold: true, font: 'Calibri', color: '1E293B' },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 24, bold: true, font: 'Calibri', color: '334155' },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 },
      },
      {
        id: 'Heading4',
        name: 'Heading 4',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 22, bold: true, font: 'Calibri', color: '475569' },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 3 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '◦',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
          {
            level: 2,
            format: LevelFormat.BULLET,
            text: '▪',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 2160, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'numbers',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.LOWER_LETTER,
            text: '%2.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: blocks,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log('Wrote:', outputPath);
});
