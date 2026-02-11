const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  BorderStyle,
  WidthType,
  SectionType,
  LevelFormat,
  TableLayoutType,
  VerticalAlign,
} = require("docx");

// ─── Paths ───────────────────────────────────────────────────────────────────
const EXPORTS_DIR = "/root/Financial-Literacy-Toolkit/exports";
const PAPER_MD = "/root/Financial-Literacy-Toolkit/_project/source_of_truth/paper.md";
const OUTPUT_PATH = `${EXPORTS_DIR}/paper.docx`;

// ─── Reusable constants ──────────────────────────────────────────────────────
const PAGE_WIDTH = 9360;
const CELL_BORDER = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "CCCCCC",
};
const TABLE_BORDERS = {
  top: CELL_BORDER,
  bottom: CELL_BORDER,
  left: CELL_BORDER,
  right: CELL_BORDER,
  insideHorizontal: CELL_BORDER,
  insideVertical: CELL_BORDER,
};
const TABLE_MARGINS = {
  top: 60,
  bottom: 60,
  left: 120,
  right: 120,
};
const HEADER_SHADING = {
  type: ShadingType.CLEAR,
  fill: "D5E8F0",
  color: "auto",
};

// ─── Inline formatting parser ────────────────────────────────────────────────
// Parses markdown inline formatting into an array of TextRun objects.
// Supports: **bold**, *italic*, `code`, [text](url)
function parseInlineFormatting(text, baseOpts = {}) {
  const runs = [];
  // Regex to match inline markdown tokens
  // Order matters: **bold** before *italic*
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add any plain text before this match
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) {
        runs.push(
          new TextRun({
            text: plain,
            font: "Times New Roman",
            size: 24,
            ...baseOpts,
          })
        );
      }
    }

    if (match[1]) {
      // **bold**
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          font: "Times New Roman",
          size: 24,
          ...baseOpts,
        })
      );
    } else if (match[3]) {
      // *italic*
      runs.push(
        new TextRun({
          text: match[4],
          italics: true,
          font: "Times New Roman",
          size: 24,
          ...baseOpts,
        })
      );
    } else if (match[5]) {
      // `code`
      runs.push(
        new TextRun({
          text: match[6],
          font: "Courier New",
          size: 24,
          ...baseOpts,
        })
      );
    } else if (match[7]) {
      // [text](url)
      runs.push(
        new TextRun({
          text: match[8],
          font: "Times New Roman",
          size: 24,
          color: "0563C1",
          underline: { type: "single" },
          ...baseOpts,
        })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining plain text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      runs.push(
        new TextRun({
          text: remaining,
          font: "Times New Roman",
          size: 24,
          ...baseOpts,
        })
      );
    }
  }

  // If no matches were found, return the whole text as a single run
  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: text,
        font: "Times New Roman",
        size: 24,
        ...baseOpts,
      })
    );
  }

  return runs;
}

// ─── Parse inline formatting for table cells (smaller font) ──────────────────
function parseInlineFormattingTable(text) {
  const runs = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) {
        runs.push(
          new TextRun({
            text: plain,
            font: "Times New Roman",
            size: 22,
          })
        );
      }
    }

    if (match[1]) {
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          font: "Times New Roman",
          size: 22,
        })
      );
    } else if (match[3]) {
      runs.push(
        new TextRun({
          text: match[4],
          italics: true,
          font: "Times New Roman",
          size: 22,
        })
      );
    } else if (match[5]) {
      runs.push(
        new TextRun({
          text: match[6],
          font: "Courier New",
          size: 22,
        })
      );
    } else if (match[7]) {
      runs.push(
        new TextRun({
          text: match[8],
          font: "Times New Roman",
          size: 22,
          color: "0563C1",
          underline: { type: "single" },
        })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      runs.push(
        new TextRun({
          text: remaining,
          font: "Times New Roman",
          size: 22,
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: text,
        font: "Times New Roman",
        size: 22,
      })
    );
  }

  return runs;
}

// ─── Helper: table header cell ──────────────────────────────────────────────
function headerCell(text, width) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: true,
            font: "Times New Roman",
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: HEADER_SHADING,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// ─── Helper: table body cell ────────────────────────────────────────────────
function bodyCell(text, width, alignment) {
  return new TableCell({
    children: [
      new Paragraph({
        children: parseInlineFormattingTable(text),
        alignment: alignment || AlignmentType.CENTER,
      }),
    ],
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// ─── Helper: build a table from parsed markdown ─────────────────────────────
function buildTable(headerTexts, rows, colWidths) {
  const headerRow = new TableRow({
    children: headerTexts.map((t, i) => headerCell(t, colWidths[i])),
    tableHeader: true,
  });
  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((t, i) => bodyCell(t, colWidths[i])),
      })
  );
  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: PAGE_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: TABLE_BORDERS,
    layout: TableLayoutType.FIXED,
    margins: TABLE_MARGINS,
  });
}

// ─── Standard header ────────────────────────────────────────────────────────
function standardHeader() {
  return new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "Pre-Course Financial Literacy Assessment \u2014 Spring 2026",
            font: "Times New Roman",
            size: 18,
            color: "808080",
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  });
}

// ─── Standard footer ────────────────────────────────────────────────────────
function standardFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "Page ",
            font: "Times New Roman",
            size: 20,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: "Times New Roman",
            size: 20,
          }),
          new TextRun({
            text: " of ",
            font: "Times New Roman",
            size: 20,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: "Times New Roman",
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

// ─── Helper: page break paragraph ───────────────────────────────────────────
function pageBreakParagraph() {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

// =============================================================================
//  MARKDOWN PARSER
// =============================================================================

function parseMarkdown(mdContent) {
  const lines = mdContent.split("\n");
  const elements = [];

  // Track title page elements separately
  let titleText = "";
  let subtitleLines = [];
  let bodyStartIndex = 0;

  // Parse title page: line 1 is H1 title, then subtitle lines, then ---
  if (lines[0] && lines[0].startsWith("# ")) {
    titleText = lines[0].replace(/^# /, "");
  }

  // Find the first --- (horizontal rule) which ends the title page
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "---") {
      bodyStartIndex = i + 1;
      break;
    }
    // Collect subtitle lines (skip empty lines)
    if (trimmed) {
      // Strip bold markers from subtitle lines
      subtitleLines.push(trimmed.replace(/\*\*/g, ""));
    }
  }

  // Build title page section
  const titlePageChildren = [
    new Paragraph({ spacing: { before: 3000 } }),
    new Paragraph({
      children: [
        new TextRun({
          text: titleText,
          font: "Arial",
          size: 36,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
  ];

  for (const sub of subtitleLines) {
    titlePageChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: sub,
            font: "Times New Roman",
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );
  }

  // Parse body content starting after the first ---
  const bodyChildren = parseBodyContent(lines, bodyStartIndex);

  return { titlePageChildren, bodyChildren };
}

function parseBodyContent(lines, startIndex) {
  const elements = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (trimmed === "") {
      i++;
      continue;
    }

    // Horizontal rule (---) => page break
    if (/^-{3,}\s*$/.test(trimmed)) {
      elements.push(pageBreakParagraph());
      i++;
      continue;
    }

    // H4 heading (####)
    if (trimmed.startsWith("#### ")) {
      const headingText = trimmed.replace(/^####\s+/, "");
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(headingText),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    // H3 heading (###)
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "");
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(headingText),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        })
      );
      i++;
      continue;
    }

    // H2 heading (##)
    if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "");
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(headingText),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
        })
      );
      i++;
      continue;
    }

    // H1 heading (#) - rare in body, but handle it
    if (/^# [^#]/.test(trimmed)) {
      const headingText = trimmed.replace(/^#\s+/, "");
      elements.push(
        new Paragraph({
          children: parseInlineFormatting(headingText),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
        })
      );
      i++;
      continue;
    }

    // Table detection: line starts with | and next line has |---|
    if (trimmed.startsWith("|")) {
      const tableResult = parseTable(lines, i);
      if (tableResult.table) {
        elements.push(tableResult.table);
        elements.push(new Paragraph({ spacing: { after: 200 } })); // spacing after table
      }
      i = tableResult.nextIndex;
      continue;
    }

    // Ordered list item: starts with digit(s). followed by space
    if (/^\d+\.\s/.test(trimmed)) {
      const listResult = parseOrderedList(lines, i);
      elements.push(...listResult.items);
      i = listResult.nextIndex;
      continue;
    }

    // Unordered list item: starts with - followed by space
    if (/^-\s/.test(trimmed)) {
      const listResult = parseUnorderedList(lines, i);
      elements.push(...listResult.items);
      i = listResult.nextIndex;
      continue;
    }

    // Regular paragraph - collect consecutive non-empty, non-special lines
    const paraResult = parseParagraph(lines, i);
    if (paraResult.paragraph) {
      elements.push(paraResult.paragraph);
    }
    i = paraResult.nextIndex;
  }

  return elements;
}

// ─── Parse a markdown table ─────────────────────────────────────────────────
function parseTable(lines, startIndex) {
  const tableLines = [];
  let i = startIndex;

  // Collect all table lines (lines starting with |)
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    tableLines.push(lines[i].trim());
    i++;
  }

  if (tableLines.length < 2) {
    // Not a valid table, treat as paragraph
    return { table: null, nextIndex: startIndex + 1 };
  }

  // Parse cells from each line
  function parseCells(line) {
    return line
      .split("|")
      .slice(1, -1) // Remove empty first and last from leading/trailing |
      .map((c) => c.trim());
  }

  const headerCells = parseCells(tableLines[0]);

  // Find separator line (|---|---|...) and skip it
  let dataStartIndex = 1;
  if (tableLines.length > 1 && /^\|[\s-:|]+\|$/.test(tableLines[1])) {
    dataStartIndex = 2;
  }

  const dataRows = [];
  for (let j = dataStartIndex; j < tableLines.length; j++) {
    dataRows.push(parseCells(tableLines[j]));
  }

  // Calculate column widths - distribute PAGE_WIDTH evenly
  const numCols = headerCells.length;
  const colWidth = Math.floor(PAGE_WIDTH / numCols);
  const colWidths = Array(numCols).fill(colWidth);
  // Adjust last column to absorb rounding difference
  colWidths[numCols - 1] = PAGE_WIDTH - colWidth * (numCols - 1);

  const table = buildTable(headerCells, dataRows, colWidths);
  return { table, nextIndex: i };
}

// ─── Parse ordered list ─────────────────────────────────────────────────────
function parseOrderedList(lines, startIndex) {
  const items = [];
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Check if this is an ordered list item (top-level: "1. ...")
    const match = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (!match) break;

    // Collect continuation lines for this item
    let itemText = match[2];
    i++;

    // Collect continuation lines (indented lines that are not new list items)
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      // Stop if empty line, new list item, heading, table, or hr
      if (nextTrimmed === "") break;
      if (/^\d+\.\s/.test(nextTrimmed)) break;
      if (/^-\s/.test(nextTrimmed)) break;
      if (nextTrimmed.startsWith("#")) break;
      if (nextTrimmed.startsWith("|")) break;
      if (/^-{3,}\s*$/.test(nextTrimmed)) break;
      // Check for indented sub-items (  - item)
      if (/^\s+-\s/.test(lines[i])) break;

      itemText += " " + nextTrimmed;
      i++;
    }

    // Check for sub-items (indented - items under this numbered item)
    const subItems = [];
    while (i < lines.length) {
      const nextLine = lines[i];
      const nextTrimmed = nextLine.trim();

      // Check for indented sub-items (lines starting with spaces then - )
      if (/^\s+-\s/.test(nextLine)) {
        const subMatch = nextTrimmed.match(/^-\s+(.*)/);
        if (subMatch) {
          let subText = subMatch[1];
          i++;
          // Collect continuation of sub-item
          while (i < lines.length) {
            const contTrimmed = lines[i].trim();
            if (contTrimmed === "") break;
            if (/^\s+-\s/.test(lines[i])) break;
            if (/^\d+\.\s/.test(contTrimmed)) break;
            if (contTrimmed.startsWith("#")) break;
            if (contTrimmed.startsWith("|")) break;
            if (/^-{3,}\s*$/.test(contTrimmed)) break;
            subText += " " + contTrimmed;
            i++;
          }
          subItems.push(subText);
        }
      } else if (nextTrimmed === "") {
        // Skip empty lines between sub-items, but peek ahead
        const peekIndex = i + 1;
        if (peekIndex < lines.length && /^\s+-\s/.test(lines[peekIndex])) {
          i++;
          continue;
        }
        break;
      } else {
        break;
      }
    }

    // Create the numbered list paragraph
    items.push(
      new Paragraph({
        children: parseInlineFormatting(itemText),
        numbering: { reference: "numbered-list", level: 0 },
        spacing: { line: 360, after: 100 },
      })
    );

    // Create sub-item paragraphs as bullet list
    for (const subItem of subItems) {
      items.push(
        new Paragraph({
          children: parseInlineFormatting(subItem),
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { line: 360, after: 60 },
          indent: { left: 1080 },
        })
      );
    }
  }

  return { items, nextIndex: i };
}

// ─── Parse unordered list ───────────────────────────────────────────────────
function parseUnorderedList(lines, startIndex) {
  const items = [];
  let i = startIndex;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Check if this is an unordered list item
    const match = trimmed.match(/^-\s+(.*)/);
    if (!match) break;

    // Collect continuation lines for this item
    let itemText = match[1];
    i++;

    // Collect continuation lines
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      if (nextTrimmed === "") break;
      if (/^-\s/.test(nextTrimmed)) break;
      if (/^\d+\.\s/.test(nextTrimmed)) break;
      if (nextTrimmed.startsWith("#")) break;
      if (nextTrimmed.startsWith("|")) break;
      if (/^-{3,}\s*$/.test(nextTrimmed)) break;
      // Check for indented sub-items
      if (/^\s+-\s/.test(lines[i])) break;

      itemText += " " + nextTrimmed;
      i++;
    }

    items.push(
      new Paragraph({
        children: parseInlineFormatting(itemText),
        numbering: { reference: "bullet-list", level: 0 },
        spacing: { line: 360, after: 100 },
      })
    );

    // Skip empty line between list items if still in list
    if (i < lines.length && lines[i].trim() === "") {
      const peekIndex = i + 1;
      if (
        peekIndex < lines.length &&
        /^-\s/.test(lines[peekIndex].trim())
      ) {
        i++; // skip the blank line, continue the list
      }
    }
  }

  return { items, nextIndex: i };
}

// ─── Parse a paragraph (possibly multiline) ─────────────────────────────────
function parseParagraph(lines, startIndex) {
  let i = startIndex;
  let paraText = "";

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Stop at empty lines, headings, tables, lists, horizontal rules
    if (trimmed === "") break;
    if (trimmed.startsWith("#")) break;
    if (trimmed.startsWith("|")) break;
    if (/^-{3,}\s*$/.test(trimmed)) break;
    if (/^\d+\.\s/.test(trimmed) && i !== startIndex) break;
    if (/^-\s/.test(trimmed) && i !== startIndex) break;

    if (paraText) {
      paraText += " " + trimmed;
    } else {
      paraText = trimmed;
    }
    i++;
  }

  if (!paraText) {
    return { paragraph: null, nextIndex: i + 1 };
  }

  const paragraph = new Paragraph({
    children: parseInlineFormatting(paraText),
    spacing: { line: 360, after: 200 },
  });

  return { paragraph, nextIndex: i };
}

// =============================================================================
//  BUILD DOCUMENT
// =============================================================================

// Read and parse the markdown file
const mdContent = fs.readFileSync(PAPER_MD, "utf-8");
const { titlePageChildren, bodyChildren } = parseMarkdown(mdContent);

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: "Times New Roman",
          size: 24,
        },
        paragraph: {
          spacing: { line: 360 },
        },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: "Arial",
          size: 32,
          bold: true,
          color: "000000",
        },
        paragraph: {
          spacing: { before: 480, after: 240 },
          outlineLevel: 0,
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: "Arial",
          size: 28,
          bold: true,
          color: "000000",
        },
        paragraph: {
          spacing: { before: 360, after: 180 },
          outlineLevel: 1,
        },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          font: "Arial",
          size: 24,
          bold: true,
          color: "000000",
        },
        paragraph: {
          spacing: { before: 240, after: 120 },
          outlineLevel: 2,
        },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "\u2022",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 },
              },
            },
          },
        ],
      },
      {
        reference: "numbered-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: 720, hanging: 360 },
              },
            },
          },
        ],
      },
    ],
  },
  sections: [
    // =========================================================================
    // SECTION A: TITLE PAGE (no header/footer)
    // =========================================================================
    {
      properties: {
        page: {
          size: {
            width: 12240,
            height: 15840,
          },
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: titlePageChildren,
    },
    // =========================================================================
    // SECTION B: BODY CONTENT (with header/footer)
    // =========================================================================
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: {
            width: 12240,
            height: 15840,
          },
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      headers: {
        default: standardHeader(),
      },
      footers: {
        default: standardFooter(),
      },
      children: bodyChildren,
    },
  ],
});

// ─── Write DOCX ─────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`DOCX written to ${OUTPUT_PATH} (${(buffer.length / 1024).toFixed(1)} KB)`);
});
