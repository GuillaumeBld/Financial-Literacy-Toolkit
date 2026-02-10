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
  TableOfContents,
  PageBreak,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  BorderStyle,
  WidthType,
  SectionType,
  LevelFormat,
  TabStopType,
  convertInchesToTwip,
  TableLayoutType,
  VerticalAlign,
} = require("docx");

// ─── Paths ───────────────────────────────────────────────────────────────────
const EXPORTS_DIR = "/root/Financial-Literacy-Toolkit/exports";
const FIGURES_DIR = `${EXPORTS_DIR}/figures`;
const OUTPUT_PATH = `${EXPORTS_DIR}/paper.docx`;

// ─── Load figure images ──────────────────────────────────────────────────────
const fig1 = fs.readFileSync(`${FIGURES_DIR}/fig1_score_distribution.png`);
const fig2 = fs.readFileSync(`${FIGURES_DIR}/fig2_domain_performance.png`);
const fig3 = fs.readFileSync(`${FIGURES_DIR}/fig3_enrollment_timeline.png`);
const fig4 = fs.readFileSync(`${FIGURES_DIR}/fig4_submission_time.png`);
const fig5 = fs.readFileSync(`${FIGURES_DIR}/fig5_confidence_calibration.png`);
const fig6 = fs.readFileSync(`${FIGURES_DIR}/fig6_item_difficulty.png`);
const fig7 = fs.readFileSync(`${FIGURES_DIR}/fig7_demographics.png`);
const fig8 = fs.readFileSync(`${FIGURES_DIR}/fig8_financial_background.png`);

// ─── Reusable constants ──────────────────────────────────────────────────────
const PAGE_WIDTH = 9360; // letter width minus 1" margins (DXA)
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

// ─── Helper: body paragraph ─────────────────────────────────────────────────
function bodyParagraph(text, opts = {}) {
  const runs = [];
  if (opts.bold) {
    runs.push(
      new TextRun({
        text: text,
        bold: true,
        font: "Times New Roman",
        size: 24,
      })
    );
  } else {
    runs.push(
      new TextRun({
        text: text,
        font: "Times New Roman",
        size: 24,
      })
    );
  }
  return new Paragraph({
    children: runs,
    spacing: { line: 360, after: 200 },
    alignment: opts.alignment || AlignmentType.LEFT,
  });
}

// ─── Helper: bold-lead paragraph (bold prefix + normal rest) ────────────────
function boldLeadParagraph(boldText, normalText) {
  return new Paragraph({
    children: [
      new TextRun({
        text: boldText,
        bold: true,
        font: "Times New Roman",
        size: 24,
      }),
      new TextRun({
        text: normalText,
        font: "Times New Roman",
        size: 24,
      }),
    ],
    spacing: { line: 360, after: 200 },
  });
}

// ─── Helper: caption paragraph ──────────────────────────────────────────────
function captionParagraph(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        italics: true,
        font: "Times New Roman",
        size: 20,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { line: 360, after: 120 },
  });
}

// ─── Helper: image paragraph ────────────────────────────────────────────────
function imageParagraph(buffer, width, height, title, description, name) {
  return new Paragraph({
    children: [
      new ImageRun({
        data: buffer,
        type: "png",
        transformation: { width, height },
        altText: { title, description, name },
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
  });
}

// ─── Helper: page break paragraph ───────────────────────────────────────────
function pageBreakParagraph() {
  return new Paragraph({
    children: [new PageBreak()],
  });
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
        children: [
          new TextRun({
            text: text,
            font: "Times New Roman",
            size: 22,
          }),
        ],
        alignment: alignment || AlignmentType.CENTER,
      }),
    ],
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// ─── Helper: build a simple table ───────────────────────────────────────────
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

// ─── Standard header (used for all sections after title page) ───────────────
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

// =============================================================================
//  BUILD DOCUMENT
// =============================================================================

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
            width: 12240, // 8.5 inches (US Letter)
            height: 15840, // 11 inches (US Letter)
          },
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Pre-Course Financial Literacy Assessment:",
              font: "Arial",
              size: 36,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Baseline Measurement for QUINN 102 (Financial Literacy),",
              font: "Arial",
              size: 36,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Spring 2026",
              font: "Arial",
              size: 36,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Loyola University Chicago",
              font: "Times New Roman",
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Independent Study \u2014 Spring 2026",
              font: "Times New Roman",
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "February 2026",
              font: "Times New Roman",
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ],
    },
    // =========================================================================
    // SECTION B: TABLE OF CONTENTS + ALL BODY CONTENT
    // =========================================================================
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: {
            width: 12240, // 8.5 inches (US Letter)
            height: 15840, // 11 inches (US Letter)
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
      children: [
        // ── Table of Contents ──────────────────────────────────────────────
        new Paragraph({
          children: [
            new TextRun({
              text: "Table of Contents",
              font: "Arial",
              size: 32,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        pageBreakParagraph(),

        // =====================================================================
        // 1. INTRODUCTION
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "1. Introduction",
            }),
          ],
        }),
        bodyParagraph(
          "Financial literacy is commonly defined as the ability to understand and use financial concepts and quantitative information to make informed decisions about saving, borrowing, investing, and managing risk. In the human capital framework, these competencies influence participation in credit and asset markets, portfolio choice, and resilience to shocks. For university students, financial literacy is immediately consequential because many begin managing debt, credit, and consumption decisions under limited experience and imperfect information. Small misunderstandings in compounding, interest-rate mechanics, inflation, diversification, and insurance can translate into persistent debt burdens, fragile liquidity positions, and suboptimal portfolio choices."
        ),
        bodyParagraph(
          "Recent policy debate on consumer credit highlights why financial literacy matters for borrowing outcomes. Creditworthiness is partly a function of financial literacy education, and improving consumers\u2019 understanding of borrowing mechanics can reduce delinquency and compounding penalty dynamics that raise effective borrowing costs. From this perspective, expanding access to bona fide financial literacy education is not only consumer protection but also a market-relevant intervention, because stronger credit profiles can reduce risk-based pricing pressure and contribute to lower rates over time for both borrowers and lenders."
        ),
        bodyParagraph(
          "Despite broad recognition of its importance, financial literacy is unevenly distributed across student populations. Students arrive with heterogeneous prior exposure to personal finance concepts, differences in numeracy, and unequal access to credible guidance through households, schools, employers, and digital sources. Learning is further shaped by behavioral and contextual constraints, including time scarcity, employment intensity, financial stress, risk preferences, and prior exposure to financial products. Consequently, evaluation of financial literacy instruction should address both average learning gains and the determinants of variation in learning across students."
        ),
        bodyParagraph(
          "This independent study evaluates learning outcomes in Quinn 102 (Financial Literacy) during the Spring 2026 offering through a structured questionnaire administered respectively in the second week and the last week of the course. The purpose of administering the questionnaire for Quinn 102 in 2026 is twofold. First, it is designed to measure the overall level of learning achieved, and its distribution across different categories of financial literacy, demographics, and socio-economic characteristics of the sample. Second, it is designed to determine which factors affect the level and magnitude of learning in order to inform the development of more effective courses in the future. In specifying the determinants of learning, the study emphasizes behavioral and contextual variables that affect students\u2019 learning in domains such as borrowing, investment, and risk management."
        ),
        bodyParagraph(
          "Collectively, this independent study contributes an empirically grounded evaluation of QUINN 102\u2019s association with student financial literacy gains, a structured approach to diagnosing domain-level strengths and weaknesses, and an operational infrastructure for repeatable, privacy-aware measurement. The results are intended to support continuous course improvement and to provide evidence on which student characteristics and constraints are most predictive of learning gains in borrowing, investment, and risk management."
        ),
        bodyParagraph(
          "This paper presents the pre-course baseline assessment results. The pre-course assessment was administered during the second week of the Spring 2026 semester (February 2-9, 2026). Post-course results and pre-post comparisons will be reported following the end-of-semester assessment administration."
        ),

        // =====================================================================
        // 2. LITERATURE REVIEW
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "2. Literature Review",
            }),
          ],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "2.1 Financial Literacy: Definitions and Measurement",
            }),
          ],
        }),
        bodyParagraph("Financial literacy has been the subject of growing scholarly attention since the early 2000s. Lusardi and Mitchell (2014) provide the foundational theoretical framework, defining financial literacy as knowledge of interest compounding, inflation, and risk diversification, and demonstrating that it functions as a form of human capital investment with measurable effects on saving, investing, and wealth accumulation. Their \u201cBig Three\u201d questions have become the most widely adopted instrument for assessing basic financial literacy and form the conceptual basis for most subsequent measurement efforts, including the assessment categories used in the present study."),
        bodyParagraph("Despite broad recognition of its importance, the field has lacked a standardized instrument analogous to established health literacy measures. Huston (2010) reviewed the heterogeneous measurement landscape and proposed that financial literacy instruments should contain 12\u201320 items spanning four content areas: money basics (time value of money, purchasing power), borrowing, investing, and asset protection. Our assessment\u2019s coverage of borrowing/credit, investment/risk, and behavioral risk management closely mirrors Huston\u2019s recommended framework. More recently, the OECD (2022) OECD/INFE toolkit has provided a standardized questionnaire measuring three dimensions of financial literacy\u2014knowledge, behavior, and attitudes\u2014deployed across dozens of countries to enable cross-national comparisons."),
        bodyParagraph("Hastings, Madrian, and Skimmyhorn (2013) assessed how financial literacy is measured in existing research and found that the \u201cBig Five\u201d questions\u2014covering interest rates, inflation, diversification, compound interest, and bond pricing\u2014are broadly accepted as reliable indicators of financial competence, though they noted significant methodological challenges in establishing causal links between literacy and outcomes. Lusardi (2019) further documented that globally, only about one-third of adults demonstrate familiarity with basic financial concepts, with illiteracy especially concentrated among women, minorities, the young, and those with lower educational attainment."),
        bodyParagraph("Among college students specifically, Chen and Volpe (1998) established early baseline evidence, finding that 924 college students answered only about 53% of financial literacy questions correctly, with non-business majors, women, and students with limited work experience scoring significantly lower. These early benchmarks provide a comparative frame for interpreting the knowledge scores of the approximately 430 QUINN 102 students in the present study."),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "2.2 Financial Education Interventions: Evidence of Effectiveness",
            }),
          ],
        }),
        bodyParagraph("The effectiveness of financial education has been a contested question in the literature. Kaiser, Lusardi, Menkhoff, and Urban (2022) conducted the most comprehensive meta-analysis to date, examining 76 randomized experiments across 33 countries. They found that financial education interventions boost financial literacy scores by approximately 0.15\u20130.20 standard deviations and improve downstream financial behaviors by 0.06\u20130.10 standard deviations, with effect sizes increasing with classroom instruction time. This finding suggests that a full-semester course like QUINN 102 should produce larger effects than light-touch interventions."),
        bodyParagraph("An earlier meta-analysis by Fernandes, Lynch, and Netemeyer (2014) offered a more cautious assessment, finding that financial education interventions explained only 0.1% of variance in financial behaviors and that effects decayed rapidly over time. The tension between these two meta-analyses\u2014with Kaiser et al. (2022) finding meaningful effects using only randomized experiments and Fernandes et al. (2014) finding negligible effects using a broader study base\u2014highlights the importance of study design and measurement rigor."),
        bodyParagraph("Willis (2011) presented the strongest skeptical position, arguing that financial education lacks a demonstrated causal chain to welfare-enhancing behavior due to the velocity of change in financial markets, persistent cognitive biases, and resource asymmetries between educators and financial firms. She cautioned that for some consumers, financial education increases confidence without improving ability, potentially leading to worse decisions. This concern directly motivates the present study\u2019s inclusion of the overconfidence index alongside knowledge measurement."),
        bodyParagraph("Mandell and Klein (2009) found that high school students who had completed a personal finance course 1\u20134 years earlier were no more financially literate than non-completers, but that college attendance itself positively and significantly affected financial behavior. This \u201cdormancy hypothesis\u201d suggests that university-level interventions like QUINN 102 may be especially effective given their timing during students\u2019 transition to independent financial decision-making. Wagner and Walstad (2019) provided more encouraging evidence, finding that students retained significant financial literacy gains three years after completing a semester-length course, though behavioral effects were less robust over time."),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "2.3 Domain-Specific Knowledge Gaps",
            }),
          ],
        }),
        bodyParagraph("Research has documented uneven financial literacy across knowledge domains. Lusardi and Tufano (2015) established the concept of \u201cdebt literacy\u201d as distinct from general financial literacy, finding that only about one-third of Americans comprehend interest compounding or credit card mechanics, and estimating that as much as one-third of charges and fees paid by less-knowledgeable individuals can be attributed to ignorance. Stango and Zinman (2009) identified the cognitive mechanism underlying many borrowing mistakes\u2014exponential growth bias, the pervasive tendency to linearize exponential functions\u2014which leads consumers to underestimate interest rates on loans and underestimate future values of investments."),
        bodyParagraph("In the investment domain, van Rooij, Lusardi, and Alessie (2011) found that while most respondents demonstrated basic financial knowledge (interest compounding, inflation, time value of money), very few understood differences between bonds and stocks, bond price\u2013interest rate relationships, or risk diversification basics. Individuals with low advanced financial literacy were significantly less likely to participate in the stock market."),
        bodyParagraph("Among college students specifically, Akers and Chingos (2014) found striking levels of student loan illiteracy: 28% of first-year students with federal loans reported having no federal debt, and nearly half seriously underestimated their total student debt. These findings underscore why the present assessment includes borrowing/credit as a major knowledge domain and why financial education at the university level is especially urgent."),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "2.4 Confidence Calibration and Overconfidence",
            }),
          ],
        }),
        bodyParagraph("The relationship between perceived and actual financial literacy has emerged as a critical dimension of financial competence. Allgood and Walstad (2016) demonstrated, using a national survey of 28,146 U.S. adults, that both actual (objective) and perceived (subjective) financial literacy independently influence financial behaviors across five domains. The combined measure of both perceived and actual literacy provides greater explanatory power than either alone, supporting the QUINN 102 assessment\u2019s design that generates an overconfidence index from both measures."),
        bodyParagraph("Robb and Woodyard (2011) similarly found that subjective financial knowledge had a larger relative impact on financial behavior than objective knowledge, underscoring the importance of measuring confidence calibration. Porto and Xiao (2016) found that over 11% of respondents in a nationally representative sample displayed financial literacy overconfidence\u2014scoring above average on perceived knowledge but failing basic literacy questions\u2014and that these overconfident consumers were less likely to seek professional financial advice in domains where they most needed it."),
        bodyParagraph("In a study closely comparable to the present research, Ipatova and Merheb (2023) examined overconfidence among 169 undergraduates and confirmed the Dunning-Kruger effect in financial literacy contexts: students with lower financial proficiency systematically overestimated their knowledge and competence, with overconfidence more pronounced among students under age 21. The finding that education reduces overconfidence suggests that a pre-post design may detect not only knowledge gains but also improved confidence calibration. Kramer (2016) provided additional evidence that confidence operates independently of knowledge in shaping financial behavior, finding that higher confidence in financial literacy reduces advice-seeking while no relationship exists between objective literacy and advice-seeking."),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "2.5 Gaps in the Literature",
            }),
          ],
        }),
        bodyParagraph("The literature review reveals several gaps that the present study addresses. First, most financial literacy measurement studies focus on general adult populations or high school students; relatively few evaluate structured financial literacy courses at the university level with pre-post designs (Goyal & Kumar, 2021). Second, while meta-analyses have established that financial education can produce knowledge gains, the evidence on domain-specific gains\u2014whether courses improve borrowing literacy, investment knowledge, and risk management differentially\u2014remains limited. Third, the use of adaptive diagnostic instruments like the SDM-10, which probes areas of weakness identified in the anchor assessment, is novel in the financial literacy evaluation literature and provides finer-grained diagnostic information than traditional fixed instruments. Fourth, the simultaneous measurement of knowledge, confidence, and behavioral covariates enables analysis of confidence calibration changes alongside knowledge gains, directly addressing Willis\u2019s (2011) concern about \u201cconfident incompetence.\u201d The present study contributes to filling these gaps by combining a structured pre-post design, domain-level measurement, adaptive diagnostics, and confidence calibration analysis within a single evaluation framework."),

        // =====================================================================
        // 3. RESEARCH QUESTIONS
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "3. Research Questions",
            }),
          ],
        }),
        bodyParagraph("The study is organized around two research questions:"),
        new Paragraph({
          children: [
            new TextRun({
              text: "RQ1 (Learning gains): What is the magnitude of student learning in Quinn 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre- to post-course changes in knowledge?",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "RQ2 (Heterogeneity): Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { line: 360, after: 200 },
        }),

        // =====================================================================
        // 4. METHODOLOGY
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "4. Methodology",
            }),
          ],
        }),

        // 4.1 Study Design
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "4.1 Study Design",
            }),
          ],
        }),
        bodyParagraph(
          "This study employs a single-group, pre-to-post design in which the same cohort of QUINN 102 students completes a structured financial literacy assessment at the beginning and end of the Spring 2026 semester. The pre-course assessment was administered during Week 2 (February 2\u20139, 2026) and the post-course assessment will be administered during the final week of instruction. Both administrations use the same fixed 40-item core instrument, enabling direct comparison of item-level and domain-level performance."
        ),
        bodyParagraph(
          "The design captures within-student change over the semester, which serves as the primary measure of learning. Because the study lacks a randomized control group, observed gains cannot be attributed exclusively to the course; however, the structured timing, identical instrumentation, and domain-specific scoring allow meaningful inference about the magnitude and distribution of knowledge change associated with course enrollment."
        ),
        bodyParagraph(
          "A supplemental adaptive module (SDM-10) accompanies each administration. The SDM-10 targets each student\u2019s weakest domain as identified by the fixed core, providing finer-grained diagnostic information without extending total assessment time beyond approximately 15 minutes."
        ),
        bodyParagraph(
          "Research consent was voluntary and administered through a structured two-part consent process described in Section 4.4.3; students could decline research participation without penalty and without any impact on course standing or grades. The study protocol has been prepared for institutional review (see Section 4.4.1)."
        ),

        // 4.2 Assessment Structure
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "4.2 Assessment Structure",
            }),
          ],
        }),
        bodyParagraph(
          "The assessment comprises three components administered sequentially: a demographic and socioeconomic baseline questionnaire, a fixed core knowledge assessment of 40 items, and a supplemental diagnostic module of 10 items. The total assessment is designed for completion within 12\u201318 minutes."
        ),

        // 4.2.1
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.2.1 Demographic and Socioeconomic Baseline Questionnaire",
            }),
          ],
        }),
        bodyParagraph(
          "The baseline questionnaire collects demographic variables (gender, age group, race/ethnicity, first-generation college status), financial context variables (employment status, financial stress frequency, self-rated financial knowledge), and behavioral variables (primary financial information source, prior financial education exposure, current financial product usage). These variables serve as covariates in the heterogeneity analysis (RQ2) and as stratification variables for subgroup comparisons."
        ),

        // 4.2.2
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.2.2 Fixed Core Assessment (40 Items)",
            }),
          ],
        }),
        bodyParagraph(
          "The fixed core comprises 40 multiple-choice and true/false items organized into three domains: Borrowing, Interest Rates, and Financial Numeracy (14 items); Risk and Return Knowledge (14 items); and Behavioral and Risk Management Knowledge (12 items). Items were adapted from established instruments including Lusardi and Mitchell\u2019s Big Three and Big Five, the OECD/INFE financial literacy toolkit, the Jump$tart College Financial Literacy Survey, and original items developed for this study. Each item includes a confidence self-assessment on a 3-point scale (not confident, somewhat confident, very confident) to support calibration analysis."
        ),

        // 4.2.3
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.2.3 Supplemental Diagnostic Module (SDM-10)",
            }),
          ],
        }),
        bodyParagraph(
          "The Supplemental Diagnostic Module (SDM-10) is an adaptive follow-up administered immediately after the 40-item anchor assessment. For each student, the module selects 10 items from a pre-written bank of 156 variants (6 variants per anchor knowledge item) using an information deficit model that prioritizes subcategories where the anchor response left the most residual uncertainty about the student\u2019s understanding. The SDM-10 drew only from knowledge items (Q1\u2013Q14, Q29\u2013Q40); preference items (Q15\u2013Q28) did not trigger adaptive follow-up. The SDM-10 was designed as a diagnostic complement to the anchor assessment and does not contribute to the student\u2019s grade (Model C: diagnostic only), eliminating grade pressure that could discourage honest explanations."
        ),

        boldLeadParagraph(
          "Information Deficit Model and Need Score. ",
          "The selection algorithm computes a Need score (0\u20135) for each of the 26 knowledge subcategories based on three signals from the anchor response: correctness, confidence (1\u20133 scale), and item format (True/False vs. multiple choice). Higher Need scores indicate greater residual uncertainty. The format-aware adjustment addresses differential guessing probability: a correct True/False response with moderate confidence is assigned a higher Need (Need = 2) than the equivalent multiple-choice response (Need = 1), reflecting the 50% versus approximately 25% chance-level baseline. Incorrect responses with high confidence receive the maximum Need score (Need = 5), signaling a likely misconception requiring open-ended diagnostic follow-up."
        ),

        // Need Score table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 4.2.3a. Need Score Mapping (Correctness \u00D7 Confidence \u00D7 Format)",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Confidence", "Correct (MCQ)", "Correct (T/F)", "Incorrect (MCQ)", "Incorrect (T/F)"],
          [
            ["1 (Low)", "2", "3", "3", "3"],
            ["2 (Mid)", "1", "2", "4", "4"],
            ["3 (High)", "0", "0", "5", "5"],
          ],
          [1872, 1872, 1872, 1872, 1872]
        ),

        boldLeadParagraph(
          "Item Bank and Variant Types. ",
          "The item bank contains 156 pre-written variants organized into six types: Lower_TF (foundational true/false), Lower_MCQ (foundational multiple choice), Same_MCQ (parallel difficulty), Higher_MCQ (applied/transfer), Open_Confirm (explain correct reasoning), and Open_Diagnose (explain incorrect reasoning). Each variant is mapped to the same subcategory as its anchor item. The variant type assigned to each subcategory is determined by the anchor response pattern: incorrect answers with high confidence trigger Open_Diagnose items to surface misconceptions, while correct answers with low confidence trigger Open_Confirm items to verify understanding."
        ),

        // Variant Assignment table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 4.2.3b. Variant Assignment Rules",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Anchor Pattern", "Variant Type", "Diagnostic Goal"],
          [
            ["Incorrect + High conf.", "Open_Diagnose", "Surface misconception"],
            ["Incorrect + Mid conf.", "Lower_MCQ", "Test foundational understanding"],
            ["Incorrect + Low conf.", "Lower_TF", "Confirm basic recognition"],
            ["Correct + Low conf.", "Open_Confirm", "Verify understanding vs. guessing"],
            ["Correct + Mid conf.", "Same_MCQ", "Confirm at same difficulty"],
            ["Correct + High conf.", "Higher_MCQ", "Probe deeper application"],
          ],
          [3120, 3120, 3120]
        ),

        boldLeadParagraph(
          "Selection Algorithm. ",
          "The 10-item selection follows a three-phase procedure. Phase 1 enforces domain minimums (at least 2 items per scoring domain). Phase 2 fills remaining slots in descending Need order. Phase 3 provides fallback if fewer than 10 subcategories have Need > 0, using mastery-probing items from the strongest subcategories. A five-level tiebreaker hierarchy resolves equal Need scores: (1) domain deficit, (2) format priority (True/False over MCQ), (3) subcategory spread (max 2 per subcategory), (4) domain order, and (5) seeded random selection. Open-ended items are capped at 3 per student; when the cap is reached, Open_Diagnose falls back to Lower_MCQ and Open_Confirm falls back to Same_MCQ."
        ),

        boldLeadParagraph(
          "Three-Way Classification. ",
          "Every open-ended response is classified into one of three categories: misconception (student holds a specific wrong mental model), knowledge gap (student lacks knowledge\u2014blank, \u201cI don\u2019t know,\u201d or unfamiliar with terms), or selection error (student demonstrates correct understanding but selected the wrong anchor answer due to misreading, misclick, or True/False reversal). This classification drives differentiated follow-up: misconceptions require targeted correction, knowledge gaps require instruction from foundational principles, and selection errors flag item ambiguity for revision."
        ),

        boldLeadParagraph(
          "Misconception Taxonomy. ",
          "A two-layer taxonomy structures misconception classification. Layer 1 contains 37 generalizable financial literacy misconception families organized into seven categories: Inflation and Purchasing Power (5 families), Interest, Compounding, and Time Value of Money (7 families), Risk, Return, and Diversification (10 families), Insurance and Risk Management (5 families), Borrowing, Credit, and Personal Finance (6 families), Financial Crises and Systemic Risk (3 families), and Numeracy (1 family). Layer 1 codes are designed to transfer across assessment contexts and student populations. Layer 2 contains item-specific tags derived from observed student response patterns, providing granularity within each Layer 1 family. The complete taxonomy is presented in Appendix C."
        ),

        boldLeadParagraph(
          "AI-Assisted Scoring Pipeline. ",
          "Open-ended responses are scored using a large language model (GPT-4.1, OpenAI) accessed via the OpenRouter API. The model was selected through a multi-model concordance protocol in which 11 LLMs scored the same 20 responses and were evaluated on five quality criteria: schema compliance, error rate, classification nuance, throughput, and cost (Appendix D). Each response is processed with an item-specific prompt containing the anchor question context, the student\u2019s selected answer and confidence level, applicable misconception families with calibration examples, and a decision tree for three-way classification. The model returns a structured JSON classification including diagnosis type, Layer 1 code, Layer 2 tag, credit score (0/50/100 measuring diagnostic value), classification confidence, an evidence quote, and a reasoning summary. Low-confidence classifications (approximately 5\u201310% of responses) are flagged for human review and adjudication by the course instructor. Prior work on LLM-based grading in business education found limited reliability when applying generic prompts to domain-specific content (Flod\u00e9n, 2025). To address this, our pipeline uses item-specific prompts with calibration examples, a structured misconception taxonomy, and explicit decision trees, following the collaborative human-AI scoring model in which the LLM serves as a second rater whose low-confidence outputs are flagged for instructor adjudication (Olivos, Kamelski, & Ascui-Gac, 2025). This approach follows established practices for LLM-based assessment scoring (Mizumoto & Eguchi, 2024; Yavuz, 2025). All item selection decisions are deterministic and rule-based; the language model is used only for open-ended response classification."
        ),

        // 4.3 Platform and Data Collection
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "4.3 Platform and Data Collection",
            }),
          ],
        }),
        bodyParagraph(
          "To ensure standardized delivery and data integrity at scale, the questionnaire was administered through a dedicated web platform developed for this study: the Financial Literacy Toolkit. Students accessed the platform by entering their course code and university student ID number. The platform immediately transformed each student ID into a one-way cryptographic hash (SHA-256 with a per-course pepper) and discarded the raw identifier; all subsequent data storage and analysis use only the hashed key. The platform did not collect or store passwords, email addresses, or other personally identifiable information. After authentication, students reviewed an information and consent screen (see Section 4.4.3) and completed a brief onboarding process."
        ),
        bodyParagraph(
          "The question bank was developed by adapting and synthesizing items from established financial literacy and numeracy instruments and large-scale surveys, including the Berlin Numeracy Test (BNT), Lipkus Numeracy Scale, Schwartz Numeracy Scale, the \u2018Big Three\u2019 (Lusardi and Mitchell), the FINRA National Financial Capability Study (NFCS) item sets including the NFCS extension \u2018Big Five,\u2019 the OECD/INFE Toolkit (2022), the P-Fin Index (including Retirement Fluency; TIAA and GFLEC), and related decision science and medical decision-making research instruments. An initial pool of approximately 80 candidate items was curated and refined to a 40-item anchor assessment. Each anchor question concept has pre-written variants by format (True/False, multiple choice, short open-ended) and level of understanding (foundational, comparable, applied), enabling targeted diagnostic follow-ups while maintaining a standardized 40-item anchor assessment. The complete platform source code, assessment instruments, and data processing scripts are publicly available in the project repository (Boulaid, 2026)."
        ),

        // 4.4 Human Subjects Protections, Privacy, and FERPA Compliance
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "4.4 Human Subjects Protections, Privacy, and FERPA Compliance",
            }),
          ],
        }),

        // 4.4.1 Ethical Review and Regulatory Classification
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.1 Ethical Review and Regulatory Classification",
            }),
          ],
        }),
        bodyParagraph(
          "This study constitutes research with human subjects under federal regulations (45 CFR 46.102): it is a systematic investigation designed to contribute to generalizable knowledge about financial literacy education, conducted with living individuals from whom identifiable private information (educational assessment data linked via coded identifiers with a retained linking key) is collected through interaction (online survey administration). Because the study involves student educational records, the Family Educational Rights and Privacy Act (FERPA) applies. The study protocol has been prepared for submission to the Institutional Review Board at Loyola University Chicago (Office of Research Services, ORS@luc.edu). The study is expected to qualify for exempt review (Category 2: educational tests, surveys, and interview procedures with coded identifiers) or expedited review, given that the research presents no more than minimal risk to participants."
        ),

        // 4.4.2 Dual-Role Disclosure and Mitigation
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.2 Dual-Role Disclosure and Mitigation",
            }),
          ],
        }),
        bodyParagraph(
          "Members of the research team hold instructional roles in Quinn 102, creating a potential conflict of interest. Specifically, the instructor-researcher dual role may produce undue influence if students perceive that declining research participation could affect their course standing. Three safeguards address this concern. First, the assessment is a required course assignment for all enrolled students regardless of research participation; the research consent decision pertains only to whether a student\u2019s data may be used for analysis beyond course purposes. Second, the platform presents research consent as a clearly separated, voluntary choice (see Section 4.4.3) with explicit language stating that declining has no impact on grades, course standing, or the student\u2019s relationship with the instructor. Third, the research dataset is de-identified; instructional personnel access only the course-administration dataset (for confirming assignment completion) and cannot determine which students consented or declined research participation during the grading period."
        ),

        // 4.4.3 Informed Consent
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.3 Informed Consent",
            }),
          ],
        }),
        bodyParagraph(
          "The platform\u2019s onboarding flow presented a two-part consent screen before any data collection:"
        ),
        boldLeadParagraph(
          "Course requirement acknowledgment (mandatory). ",
          "Students reviewed the statement: \u201CThis assessment is a required course assignment in [course code]. Completion affects course credit, but your answers are not graded for correctness.\u201D Students checked a required acknowledgment box: \u201CI understand this assessment is required for the course.\u201D"
        ),
        boldLeadParagraph(
          "Research consent (voluntary). ",
          "Below the course acknowledgment, students read: \u201CYou may choose whether your responses are used for research evaluating course learning outcomes. Declining has no impact on grades.\u201D Students selected one of two options: \u201CYes, I consent\u201D or \u201CNo, I do not consent.\u201D The default selection was \u201CYes, I consent.\u201D"
        ),
        bodyParagraph(
          "Each student\u2019s research consent decision, along with a timestamp and consent version identifier (version 1.0), was recorded in the database. Of the 421 students who submitted completed assessments, 353 (83.8%) consented to research use of their data and 68 (16.2%) declined. Students may withdraw research consent at any time by contacting the principal investigator; withdrawn data will be excluded from all subsequent analyses."
        ),
        bodyParagraph(
          "A privacy notice was also displayed during onboarding: \u201CYour Student ID is converted to a coded identifier before storage. Identifiable information, if collected for course administration, is stored separately from the research dataset and access is restricted. Research analysis uses de-identified data and is governed by your consent choice.\u201D"
        ),

        // 4.4.4 De-identification and Data Security
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.4 De-identification and Data Security",
            }),
          ],
        }),
        bodyParagraph(
          "Student identifiers were transformed into coded keys using a one-way cryptographic hash function (SHA-256) with a per-course pepper prior to storage. The hash is irreversible: given only the hashed key, it is computationally infeasible to recover the original student identifier. No raw student ID numbers, names, email addresses, or other personally identifiable information are stored in any database table used for research. The platform does not store IP addresses; IP data is used only transiently in memory for rate-limiting purposes and is never persisted to disk or database."
        ),
        bodyParagraph(
          "The research dataset contains only the hashed identifier, assessment responses (answer selections, confidence ratings, open-ended text), baseline onboarding survey responses, scoring metadata, and timestamps. Course-administration linkage (for confirming assignment completion and reporting grades) is maintained separately with restricted access by authorized instructional personnel only."
        ),
        bodyParagraph(
          "All sensitive demographic and financial fields in the baseline survey (household income, parental education, first-generation college status, financial aid status, debt level, financial stress) include a \u201CPrefer not to answer\u201D option, allowing students to participate without disclosing information they consider private. The demographic variables collected for heterogeneity analysis were selected to minimize re-identification risk. The survey collects age as a categorical range (e.g., \u201C20 or under,\u201D \u201Cabove 20\u201D) rather than exact date of birth, and does not collect geographic identifiers such as zip code or home address. Research has demonstrated that 87% of the U.S. population can be uniquely identified from the combination of five-digit zip code, gender, and date of birth (Sweeney, 2000); by design, this study collects none of these three identifiers in combination."
        ),

        // 4.4.5 Data Retention and Destruction
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.5 Data Retention and Destruction",
            }),
          ],
        }),
        bodyParagraph(
          "Research data will be retained for a minimum of three years following study completion, consistent with the Common Rule retention requirements, or longer if required by Loyola University Chicago institutional policy. During the retention period, de-identified data will be stored on password-protected, encrypted servers with access restricted to authorized members of the research team. The course-administration linking key (which enables grade reporting) will be destroyed after final course grades have been posted for the Spring 2026 semester. After the retention period expires, all electronic research files will be permanently deleted. The principal investigator is responsible for data destruction and will maintain documentation of the destruction process."
        ),

        // 4.4.6 Ethical Framework
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.4.6 Ethical Framework",
            }),
          ],
        }),
        bodyParagraph(
          "The study design addresses the three principles of the Belmont Report (National Commission, 1979):"
        ),
        boldLeadParagraph(
          "Respect for Persons. ",
          "Research participation is voluntary and clearly separated from the required course assignment. Students provide informed consent through a structured, accessible consent screen that states the study purpose, procedures, risks, and the right to decline or withdraw without penalty. The consent process is designed to be comprehensible without specialized knowledge."
        ),
        boldLeadParagraph(
          "Beneficence. ",
          "The study presents minimal risk: the assessment covers standard financial literacy content encountered in normal educational practice, and the primary risk \u2014 breach of confidentiality \u2014 is mitigated through one-way cryptographic hashing, de-identified datasets, separate key storage, restricted access controls, and the absence of direct identifiers in the research file. Sensitive survey items include \u201CPrefer not to answer\u201D options to reduce discomfort. There is no direct benefit to individual participants; the anticipated benefit is improved financial literacy instruction for future cohorts based on empirical evidence of learning outcomes and knowledge gaps."
        ),
        boldLeadParagraph(
          "Justice. ",
          "Participants are selected on the basis of research relevance \u2014 enrollment in Quinn 102 (Financial Literacy) \u2014 rather than convenience or vulnerability. All enrolled students receive equal opportunity to complete the assessment (as a course requirement) and to consent or decline research participation. No students are excluded from the study on the basis of demographic characteristics."
        ),

        // 4.5 Analytical Framework
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "4.5 Analytical Framework",
            }),
          ],
        }),
        bodyParagraph(
          "The analytical framework addresses both research questions through complementary methods. Pre-course results are reported descriptively; pre-to-post comparisons and regression analyses will be conducted after the post-course administration."
        ),

        // 4.5.1
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.5.1 RQ1: Learning Gains",
            }),
          ],
        }),
        bodyParagraph(
          "Learning gains are measured as within-student score changes from pre to post, computed at the overall, domain, and subdomain levels. Paired t-tests and Wilcoxon signed-rank tests will assess statistical significance. Effect sizes (Cohen\u2019s d) will quantify practical significance. Item-level analysis will identify which specific knowledge areas improved most and least."
        ),

        // 4.5.2
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.5.2 RQ2: Heterogeneity",
            }),
          ],
        }),
        bodyParagraph(
          "Heterogeneity in learning gains is modeled using OLS regression with gain scores as the dependent variable and baseline demographic, financial context, and behavioral variables as predictors. Separate models are estimated for each domain to test whether predictors of learning differ across borrowing, investment, and risk management. Interaction terms test whether financial stress, employment status, and prior education moderate learning gains."
        ),

        // 4.5.3
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "4.5.3 Psychometric Validation",
            }),
          ],
        }),
        bodyParagraph(
          "Instrument reliability is assessed using Cronbach\u2019s alpha for internal consistency at the overall and domain levels. Item discrimination is evaluated using point-biserial correlations. Confirmatory factor analysis tests the hypothesized three-domain structure. These psychometric results inform interpretation of learning gains and guide potential item revisions for future administrations."
        ),

        // =====================================================================
        // 5. PRE-COURSE ASSESSMENT RESULTS
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "5. Pre-Course Assessment Results",
            }),
          ],
        }),

        // ── 5.1 Participation and Completion ────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.1 Participation and Completion",
            }),
          ],
        }),
        bodyParagraph(
          "The pre-course assessment was administered over an eight-day window from February 2 through February 9, 2026. A total of 433 students enrolled in the assessment platform, of whom 421 completed all sections, yielding a completion rate of 97.2%. Table 4.1 presents the daily enrollment and completion counts."
        ),

        // Table 4.1 Daily Enrollment
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 4.1. Daily Enrollment and Completion Counts",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Date", "Enrolled", "Completed"],
          [
            ["Feb 2", "98", "93"],
            ["Feb 3", "51", "47"],
            ["Feb 4", "47", "46"],
            ["Feb 5", "37", "36"],
            ["Feb 6", "43", "43"],
            ["Feb 7", "38", "38"],
            ["Feb 8", "56", "56"],
            ["Feb 9", "63", "62"],
            ["Total", "433", "421"],
          ],
          [3120, 3120, 3120]
        ),

        // Figure 3
        imageParagraph(
          fig3,
          580,
          380,
          "Figure 1",
          "Daily Enrollment and Completion (Feb 2-9, 2026)",
          "fig3"
        ),
        captionParagraph(
          "Figure 1. Daily Enrollment and Completion (Feb 2-9, 2026)"
        ),
        bodyParagraph(
          "Figure 1 displays the daily enrollment and assessment completion counts alongside cumulative totals over the 8-day assessment window. The dual-axis chart shows that enrollment peaked on the first day (February 2, n = 98), consistent with students responding to the initial course announcement. A secondary surge occurred on the final two days (February 8-9, n = 119 combined), reflecting deadline-driven engagement. The cumulative lines demonstrate that the enrollment-to-completion gap remained narrow throughout, ultimately reaching 433 enrolled and 421 completed (97.2%). This high completion rate indicates strong platform reliability and student engagement with the required assessment."
        ),

        // Figure 4 — Submission Time of Day
        imageParagraph(
          fig4,
          580,
          380,
          "Figure 2",
          "Assessment Submission Time of Day (N = 421)",
          "fig4"
        ),
        captionParagraph(
          "Figure 2. Assessment Submission Time of Day (N = 421)"
        ),
        bodyParagraph(
          "Figure 2 presents the distribution of assessment submission times across the 24-hour clock (CST). The area chart reveals a pronounced evening peak between 8:00 PM and 10:00 PM, when approximately 35% of all submissions occurred. Morning hours (6:00 AM\u201312:00 PM) accounted for fewer than 10% of completions, with the lowest activity between 2:00 AM and 7:00 AM. A secondary afternoon uptick is visible between 2:00 PM and 5:00 PM. This temporal pattern is consistent with typical college student schedules, where academic tasks are concentrated in evening hours after classes and extracurricular activities. The strong evening concentration also suggests that students treated the assessment as a focused task rather than a casual activity, which supports the validity of the measured completion times."
        ),

        // ── 5.2 Sample Demographics ────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.2 Sample Demographics",
            }),
          ],
        }),
        bodyParagraph(
          "The sample of 421 completers is predominantly female (58.4%), traditional college age (87.4% aged 20 or under), and racially diverse. White/Caucasian students comprise roughly half the sample (49.4%), with meaningful representation from Hispanic/Latino (22.3%), Asian (13.3%), and Black/African American (6.9%) students. Nearly three-quarters of respondents report part-time employment (72.2%), and approximately one-third are first-generation college students (28.5%). This demographic composition provides sufficient variation to support the planned heterogeneity analysis in RQ2."
        ),

        // Figure 7
        imageParagraph(
          fig7,
          600,
          350,
          "Figure 3",
          "Sample Demographics (N = 421)",
          "fig7"
        ),
        captionParagraph("Figure 3. Sample Demographics (N = 421)"),
        bodyParagraph(
          "Figure 3 presents the demographic composition of the sample across five dimensions. Panel (a) shows the gender split (58.4% female, 40.2% male). Panel (b) confirms a predominantly traditional-age sample (87.4% aged 20 or under). Panel (c) reveals meaningful racial and ethnic diversity, with White/Caucasian students comprising roughly half (49.4%) and substantial representation from Hispanic/Latino (22.3%), Asian (13.3%), and Black/African American (6.9%) students. Panel (d) shows that nearly three-quarters of students work part-time (72.2%), while panel (e) indicates that nearly one-third are first-generation college students (28.5%). This demographic profile provides meaningful variation for the planned heterogeneity analysis (RQ2) examining whether learning gains differ across student subgroups."
        ),

        // ── 5.3 Financial Background ────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.3 Financial Background",
            }),
          ],
        }),
        bodyParagraph(
          "Students report varying levels of financial stress and self-assessed financial knowledge. The majority experience financial stress sometimes (44.7%) or rarely (22.3%), though nearly a quarter (23.8%) report stress often or always. Self-rated financial knowledge clusters around moderate (60.1%) and low (25.2%), with only 14.5% rating themselves as high or very high. These distributions suggest a sample with meaningful financial concerns and generally modest self-assessed competence, consistent with the target population for an introductory financial literacy course."
        ),

        // Figure 8
        imageParagraph(
          fig8,
          600,
          350,
          "Figure 4",
          "Financial Background and Self-Assessment (N = 421)",
          "fig8"
        ),
        captionParagraph(
          "Figure 4. Financial Background and Self-Assessment (N = 421)"
        ),
        bodyParagraph(
          "Figure 4 illustrates two key dimensions of students\u2019 financial context. Panel (a) shows the distribution of self-reported financial stress: the majority of students experience stress sometimes (44.7%) or rarely (22.3%), but nearly a quarter (23.8%) report experiencing financial stress often or always, identifying a subgroup for whom financial literacy instruction carries immediate practical relevance. Panel (b) displays self-rated financial knowledge, where the vast majority rate themselves as moderate (60.1%) or low (25.2%). Only 14.5% rate their knowledge as high or very high. The predominance of moderate self-ratings, combined with the 66.6% average actual score, suggests reasonably calibrated self-assessment across the sample, consistent with the confidence calibration findings in Section 5.7."
        ),

        // ── 5.4 Overall Score Distribution ──────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.4 Overall Score Distribution",
            }),
          ],
        }),
        bodyParagraph(
          "The overall pre-course score distribution across the 26 scored knowledge items is summarized in the table below. The mean score of 66.55% indicates moderate baseline financial literacy, with substantial individual variation (SD = 17.38%)."
        ),

        // Summary stats table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 5.1. Overall Pre-Course Score Summary Statistics",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Statistic", "Value"],
          [
            ["N", "421"],
            ["Mean", "66.55%"],
            ["Standard Deviation", "17.38%"],
            ["Minimum", "7.69%"],
            ["Maximum", "100.00%"],
          ],
          [4680, 4680]
        ),

        // Figure 1
        imageParagraph(
          fig1,
          580,
          380,
          "Figure 5",
          "Pre-Course Overall Score Distribution (N = 421)",
          "fig1"
        ),
        captionParagraph(
          "Figure 5. Pre-Course Overall Score Distribution (N = 421)"
        ),
        bodyParagraph(
          "Figure 5 displays the distribution of overall pre-course scores computed from the 26 knowledge items. The distribution is roughly bell-shaped with a slight left skew. The modal decile is 60-69% (n = 120, highlighted in gold), and the majority of students (67.2%) scored between 50% and 89%. The dashed green line marks the sample mean of 66.6%. Eleven students achieved perfect scores (100%), while 18 students (4.3%) scored below 30%, identifying a small group with substantial baseline knowledge gaps that the course may especially benefit. The overall shape suggests that most students enter QUINN 102 with moderate foundational financial literacy, with meaningful room for improvement in applied domains."
        ),

        // ── 5.5 Domain-Level Performance ────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.5 Domain-Level Performance",
            }),
          ],
        }),
        bodyParagraph(
          "Performance varied meaningfully across the three assessment domains, with a 9.5 percentage-point gap between the strongest and weakest domains. The domain-level results are presented in the table below."
        ),

        // Domain table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 5.2. Domain-Level Performance Summary",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Domain", "Mean Score"],
          [
            ["Behavioral & Risk Management Knowledge", "73.46%"],
            ["Borrowing, Interest Rates & Financial Numeracy", "69.33%"],
            ["Risk & Return Knowledge", "63.97%"],
          ],
          [6240, 3120]
        ),

        // Figure 2
        imageParagraph(
          fig2,
          580,
          380,
          "Figure 6",
          "Domain-Level Performance Comparison",
          "fig2"
        ),
        captionParagraph("Figure 6. Domain-Level Performance Comparison"),
        bodyParagraph(
          "Figure 6 compares average performance across the three assessment domains. Behavioral and Risk Management Knowledge (73.5%) was the strongest domain, driven by high performance on diversification concepts. Borrowing, Interest Rates, and Financial Numeracy (69.3%) fell near the overall average. Risk and Return Knowledge (64.0%) was the weakest domain, reflecting conceptual difficulty with bond pricing, inflation protection, and crisis-related items. Error bars represent standard deviations, indicating substantial within-domain variation. The dashed maroon line marks the overall mean (66.6%). The 9.5 percentage-point gap between the strongest and weakest domains highlights where instructional emphasis may yield the greatest gains."
        ),

        // ── 5.6 Subdomain Analysis ─────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.6 Subdomain Analysis",
            }),
          ],
        }),
        bodyParagraph(
          "Item-level analysis reveals a clear hierarchy from foundational concepts (simple interest at 92.9%, compound interest at 88.4%) to applied reasoning tasks (inflation hedge at 24.0%, compound growth at 38.7%). This pattern indicates that students possess solid grasp of basic financial principles but struggle with multi-step reasoning and real-world application scenarios."
        ),

        // Figure 6
        imageParagraph(
          fig6,
          580,
          380,
          "Figure 7",
          "Item Difficulty Ranking by Subdomain (N = 421)",
          "fig6"
        ),
        captionParagraph(
          "Figure 7. Item Difficulty Ranking by Subdomain (N = 421)"
        ),
        bodyParagraph(
          "Figure 7 ranks all 21 assessed subdomains from easiest (top) to hardest (bottom). Color coding distinguishes three performance tiers: green indicates strong performance (>=70% correct), gold indicates moderate performance (50-69%), and coral indicates weak performance (<50%). A clear gap separates foundational concepts at the top -- simple interest (92.9%), compound interest (88.4%), impulse control (86.9%) -- from applied reasoning at the bottom -- inflation hedge (24.0%), compound growth (38.7%), return ranking (40.6%). This pattern suggests that students enter the course with solid grasp of basic financial principles but lack the ability to apply these concepts to real-world scenarios involving inflation protection, bond pricing, and multi-step financial reasoning. The dashed maroon line marks the overall mean (66.6%), with 10 subdomains above and 11 below this threshold."
        ),

        // ── 5.7 Confidence Calibration ──────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.7 Confidence Calibration",
            }),
          ],
        }),
        bodyParagraph(
          "Confidence calibration analysis categorizes students based on the overconfidence index (OC), defined as the difference between average self-reported confidence and actual accuracy. The largest group is well-calibrated (41.1%, n = 173), followed by underconfident (32.8%, n = 138), moderately overconfident (19.0%, n = 79), and highly overconfident (7.1%, n = 29). The slightly negative mean OC index (-0.017) indicates that the sample was, on average, marginally underconfident, a profile that is constructive for learning engagement."
        ),

        // Figure 5
        imageParagraph(
          fig5,
          580,
          380,
          "Figure 8",
          "Confidence Calibration Categories (N = 421)",
          "fig5"
        ),
        captionParagraph(
          "Figure 8. Confidence Calibration Categories (N = 421)"
        ),
        bodyParagraph(
          "Figure 8 presents the distribution of students across four confidence calibration categories based on the overconfidence index (OC), defined as the difference between average confidence and actual accuracy. The horizontal bar chart (left) shows both percentages and counts, while the pie chart (right) illustrates the proportional distribution. The largest group is well-calibrated (41.1%, n = 173), meaning their confidence closely matched their performance (OC within +/-10%). Nearly a third were underconfident (32.8%, n = 138), systematically underestimating their abilities. Moderately overconfident students (19.0%, n = 79) and highly overconfident students (7.1%, n = 29) together account for 26.1% of the sample. The slightly negative mean OC index (-0.017) indicates that the sample was, on average, marginally underconfident. This profile is constructive for learning, as overconfidence can reduce engagement with material perceived as already mastered."
        ),

        // ── 5.8 SDM-10 Diagnostic Summary ──────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.8 SDM-10 Diagnostic Summary",
            }),
          ],
        }),
        bodyParagraph(
          "All 421 students who completed the anchor assessment also completed the SDM-10 module (100% completion rate). The platform collected 3,985 total SDM responses (10 per student). The average SDM-10 score (58.92%) was approximately 7.6 percentage points lower than the average anchor score (66.55%), confirming that the adaptive selection algorithm appropriately targeted subcategories where students demonstrated weaker performance."
        ),

        // SDM Summary table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 5.3. SDM-10 Summary Statistics",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Metric", "Value"],
          [
            ["Students completing SDM-10", "421 (100%)"],
            ["Total SDM responses", "3,985"],
            ["Average SDM score", "58.92%"],
            ["Average anchor score", "66.55%"],
            ["Students receiving open-ended items", "367 (87.2%)"],
            ["Total open-ended responses", "931"],
            ["Diagnose responses (filtered)", "556"],
            ["Confirm responses (filtered)", "336"],
          ],
          [4680, 4680]
        ),

        // 5.8.1 Open-Ended Response Overview
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "5.8.1 Open-Ended Response Overview",
            }),
          ],
        }),
        bodyParagraph(
          "Of the 421 completers, 367 students (87.2%) received at least one open-ended item, generating 931 open-ended responses. After filtering 40 responses affected by a stale anchor score synchronization issue (see Section 7), the analysis included 556 diagnose responses (explaining reasoning behind incorrect high-confidence answers) and 336 confirm responses (explaining reasoning behind correct low-confidence answers). The maximum number of open-ended items per student was 3, by design."
        ),
        boldLeadParagraph(
          "Response Quality. ",
          "Among diagnose responses, 89.2% were substantive (providing reasoning beyond \u201cI don\u2019t know\u201d or blank responses), indicating strong student engagement with the open-ended format despite its diagnostic-only (ungraded) status. Confirm responses showed even higher quality at 93.8% substantive. This engagement rate is notable given that students were not informed that the SDM-10 was a separate module and received no grade incentive to provide detailed explanations."
        ),

        // 5.8.2 Misconception Analysis by Domain
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "5.8.2 Misconception Analysis by Domain",
            }),
          ],
        }),
        bodyParagraph(
          "The three-way classification of open-ended responses revealed distinct misconception patterns across assessment domains."
        ),
        boldLeadParagraph(
          "Inflation and Purchasing Power. ",
          "The most prevalent misconception was INF-01 (lower inflation equals falling prices), observed in 55% of diagnose responses for Q6. Students systematically confused a decrease in the rate of price increase with an actual decrease in prices. Representative responses included \u201cIf inflation decreases, prices will decrease\u201d and \u201cprices need to decrease to combat inflation.\u201d On Q7 (which group is most hurt by inflation), 33% of incorrect responses reflected empathy-driven rather than economic reasoning (INF-05), with students selecting \u201cyoung couples\u201d because they identified personally with that demographic rather than analyzing fixed-income vulnerability."
        ),
        boldLeadParagraph(
          "Risk, Return, and Diversification. ",
          "The highest-noise item was Q36 (diversification principle), where 62% of students who answered incorrectly demonstrated correct understanding of diversification in their open-ended explanation\u2014classifying as selection errors (RISK-04) rather than misconceptions. These students could explain why spreading money across assets reduces risk but selected \u201cFalse\u201d on the True/False item, likely due to negation confusion. This finding suggests the T/F format introduces substantial measurement noise and the item may benefit from MCQ revision. On Q35, students used real-world counterexamples from non-financial domains to argue against the general risk-return principle (RISK-10)."
        ),
        boldLeadParagraph(
          "Insurance and Risk Management. ",
          "On Q12 (primary purpose of health insurance), 67% of diagnose responses reflected the misconception that routine care is the primary function (INS-01), with many students applying frequency-over-severity reasoning (INS-02). This was the single most dominant misconception for any item. Q13 (deductible definition) showed a 30% \u201cI don\u2019t know\u201d rate, indicating a knowledge gap rather than misconception for this technical insurance term."
        ),
        boldLeadParagraph(
          "Borrowing and Credit. ",
          "Credit report knowledge (Q10) showed a 29% selection error rate, the third-highest among all items, indicating many students possessed correct understanding but were confused by the \u201cwhich is FALSE\u201d framing. On Q2 (mortgage term and total interest), 42% of incorrect responses were selection errors, with students correctly explaining the relationship but selecting the wrong True/False answer."
        ),

        // 5.8.3 Confirm Response Findings
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "5.8.3 Confirm Response Findings",
            }),
          ],
        }),
        bodyParagraph(
          "Analysis of confirm responses (correct anchor answer with low confidence) revealed that 12\u201314% of students who answered Q13, Q12, Q8, and Q10 correctly were likely lucky guesses, as their explanations showed no understanding of the underlying concept. This finding validates the SDM-10\u2019s approach of probing low-confidence correct answers and demonstrates that anchor scores alone may overestimate true comprehension by approximately 12\u201314% on items with high guessing rates."
        ),

        // 5.8.4 Cross-Item Patterns
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: "5.8.4 Cross-Item Patterns",
            }),
          ],
        }),
        bodyParagraph(
          "Five dominant misconception clusters emerged across the assessment: (1) inflation mechanics confusion, centered on the distinction between lower inflation rates and lower prices; (2) risk-return reasoning from exceptions, where students cited specific counterexamples to invalidate general financial principles; (3) insurance purpose confusion, equating frequency of use with primary function; (4) empathy-driven financial reasoning, selecting answers based on personal identification rather than economic logic; and (5) format-induced errors, particularly on True/False items where correct knowledge led to incorrect answers due to negation confusion."
        ),

        // High-noise items table
        new Paragraph({
          children: [
            new TextRun({
              text: "Table 5.4. High-Noise Items (Selection Error Rate)",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Item", "Topic", "SE Rate", "Implication"],
          [
            ["Q36", "Diversification principle", "62%", "T/F confounds; consider MCQ"],
            ["Q2", "Mortgage term / interest", "42%", "T/F reversal; monitor post-test"],
            ["Q10", "Credit reports (FALSE)", "29%", "Negation framing causes errors"],
          ],
          [1560, 2808, 1560, 3432]
        ),

        // ── 5.9 Assessment Duration ─────────────────────────────────────────
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "5.9 Assessment Duration",
            }),
          ],
        }),
        bodyParagraph(
          "The median total assessment duration was 14.2 minutes (IQR: 10.8\u201318.6 minutes), within the target range of 12\u201318 minutes. The demographic section took a median of 2.1 minutes, the fixed core 8.9 minutes, and the SDM-10 3.2 minutes. Fewer than 3% of students required more than 25 minutes, and no students triggered the 45-minute maximum time limit. These duration metrics confirm that the assessment was appropriately calibrated for length and did not impose excessive burden on participants."
        ),

        // =====================================================================
        // 6. DISCUSSION
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "6. Discussion",
            }),
          ],
        }),

        boldLeadParagraph(
          "Strong baseline in foundational concepts. ",
          "Students demonstrate solid understanding of basic financial concepts such as simple interest (92.9%), compound interest (88.4%), and impulse control (86.9%). These results suggest that introductory-level concepts are well-covered by prior education or everyday experience, and that QUINN 102 can build on this foundation rather than reteaching fundamentals."
        ),
        boldLeadParagraph(
          "Significant gaps in applied financial reasoning. ",
          "The weakest subdomains\u2014inflation hedge (24.0%), compound growth (38.7%), and return ranking (40.6%)\u2014involve multi-step reasoning and real-world application. The 9.5 percentage-point gap between the strongest and weakest domains indicates that students struggle most with translating conceptual knowledge into practical decision-making, particularly in areas related to investment risk and inflation protection. These findings suggest that instructional emphasis on applied reasoning and scenario-based exercises may yield the greatest learning gains."
        ),
        boldLeadParagraph(
          "Generally well-calibrated confidence. ",
          "The predominance of well-calibrated (41.1%) and underconfident (32.8%) students is a constructive finding for learning. Underconfident students are likely to engage seriously with course material rather than dismissing it as already known. The 26.1% of students showing some degree of overconfidence represent a group that may benefit from targeted feedback highlighting specific knowledge gaps."
        ),
        boldLeadParagraph(
          "Financial stress as a relevant covariate. ",
          "Nearly a quarter of students (23.8%) report experiencing financial stress often or always. This subgroup may face competing cognitive demands that affect learning, and financial stress may also influence motivation and engagement with course content. The heterogeneity analysis (RQ2) will test whether financial stress predicts differential learning gains, informing potential accommodations or supplemental support structures."
        ),
        boldLeadParagraph(
          "Meaningful heterogeneity for RQ2 analysis. ",
          "The sample exhibits meaningful variation across demographics (gender, race/ethnicity, first-generation status), financial context (employment, stress, self-rated knowledge), and baseline performance (SD = 17.38%). This variation provides sufficient statistical power for the planned regression analyses of heterogeneous learning gains and supports subgroup comparisons across multiple dimensions."
        ),
        boldLeadParagraph(
          "SDM-10 diagnostic findings reveal actionable misconception patterns. ",
          "The three-way classification of 931 open-ended responses identified five dominant misconception clusters: inflation mechanics confusion (55% of Q6 diagnoses), insurance purpose confusion (67% of Q12 diagnoses), empathy-driven financial reasoning (33% of Q7 diagnoses), risk-return reasoning from exceptions, and format-induced selection errors. The finding that 62% of incorrect answers on Q36 reflected correct understanding (selection errors rather than misconceptions) demonstrates the value of open-ended diagnostic follow-up in distinguishing genuine knowledge gaps from measurement artifacts. The 12\u201314% lucky-guess rate identified through confirm responses further validates the information deficit model\u2019s approach of probing low-confidence correct answers."
        ),
        boldLeadParagraph(
          "High completion rate reflects platform reliability. ",
          "The 97.2% completion rate (421 of 433 enrolled) indicates strong platform performance and student compliance. The narrow gap between enrollment and completion across all eight days suggests that technical issues were minimal and that the assessment design was accessible and appropriately timed."
        ),

        // =====================================================================
        // 7. LIMITATIONS AND PENDING ITEMS
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "7. Limitations and Pending Items",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "The study employs a single-group pre-post design without a randomized control group, limiting causal attribution of observed learning gains exclusively to QUINN 102 instruction.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Self-reported demographic and financial context variables may be subject to social desirability bias or measurement error, potentially attenuating estimated relationships in the heterogeneity analysis.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "The assessment captures knowledge at two discrete time points; it does not measure the trajectory of learning during the semester or long-term retention after course completion.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Test-retest effects may inflate post-course scores if students recall specific items from the pre-course administration, though the 14-week interval between administrations mitigates this concern.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Psychometric validation (Cronbach\u2019s alpha, factor analysis) is pending and will be reported with the post-course results to enable comparison of instrument properties across administrations.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "The sample is drawn from a single institution and course, limiting generalizability to other student populations and instructional contexts without further replication.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "A software defect in the platform\u2019s handleAnswer() function caused the SDM scored anchors map to become stale when students revised an anchor answer, resulting in 40 mismatched SDM variant assignments across 36 students (9.8%). The mismatched responses were filtered from the open-ended analysis using an anchor_score and confidence cross-check, and the bug was subsequently fixed (commit 039f955). The filtering reduced the open-ended sample from 971 to 931 responses.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "The SDM-10 open-ended sample is not random: items were administered only to students whose anchor responses triggered high-Need subcategories. Per-item coverage ranges from 20% (Q32) to 90% (Q7). Extrapolation to the full class is appropriate only when item-level coverage exceeds 50%.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Members of the research team hold instructional roles in Quinn 102, creating a potential conflict of interest. The 16.2% decline rate (68 of 421 submitted students declined research consent) provides evidence that students exercised genuine choice. The dual role was mitigated through separated consent, de-identified research dataset, and voluntary research consent with explicit no-penalty language (see Section 4.4.2).",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Analyses using the research-consented subset (n = 353, 83.8% of completers) may not be fully representative of the complete student population if consent propensity correlates with assessment performance, demographics, or engagement. Pre-post comparisons will report whether the consented and declined subsamples differ on observable baseline characteristics.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 200 },
        }),

        // =====================================================================
        // 8. NEXT STEPS (POST-COURSE ASSESSMENT)
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "8. Next Steps (Post-Course Assessment)",
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Administer the post-course assessment during the final week of Spring 2026 instruction using the identical fixed core instrument and SDM-10 adaptive module.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Link pre-course and post-course responses at the student level using anonymous identifiers to compute within-student gain scores at the overall, domain, and subdomain levels.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Conduct paired statistical tests (t-tests, Wilcoxon signed-rank) and compute effect sizes (Cohen\u2019s d) to assess the magnitude and significance of learning gains (RQ1).",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Estimate OLS regression models with gain scores as the dependent variable and baseline covariates as predictors to identify sources of heterogeneous learning gains (RQ2).",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Complete psychometric validation (Cronbach\u2019s alpha, point-biserial correlations, confirmatory factor analysis) across both administrations to assess instrument reliability and structural validity.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Prepare the final report integrating pre-post comparisons, heterogeneity analysis, psychometric results, and actionable recommendations for future QUINN 102 course design.",
              font: "Times New Roman",
              size: 24,
            }),
          ],
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { line: 360, after: 200 },
        }),

        // =====================================================================
        // REFERENCES
        // =====================================================================
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "References",
            }),
          ],
        }),
        bodyParagraph("Akers, B., & Chingos, M. M. (2014). Are college students borrowing blindly? Brookings Institution."),
        bodyParagraph("Allgood, S., & Walstad, W. B. (2016). The effects of perceived and actual financial literacy on financial behaviors. Economic Inquiry, 54(1), 675\u2013697."),
        bodyParagraph("Boulaid, G. (2026). Financial Literacy Toolkit: Assessment platform for QUINN 102 [Source code]. GitHub. https://github.com/GuillaumeBld/Financial-Literacy-Toolkit"),
        bodyParagraph("Chen, H., & Volpe, R. P. (1998). An analysis of personal financial literacy among college students. Financial Services Review, 7(2), 107\u2013128."),
        bodyParagraph("Fernandes, D., Lynch, J. G., Jr., & Netemeyer, R. G. (2014). Financial literacy, financial education, and downstream financial behaviors. Management Science, 60(8), 1861\u20131883."),
        bodyParagraph("Flod\u00e9n, J. (2025). Grading exams using large language models: A comparison between human and AI grading of exams in higher education using ChatGPT. British Educational Research Journal, 51(1), 201\u2013224."),
        bodyParagraph("Goyal, K., & Kumar, S. (2021). Financial literacy: A systematic review and bibliometric analysis. International Journal of Consumer Studies, 45(1), 80\u2013105."),
        bodyParagraph("Hastings, J. S., Madrian, B. C., & Skimmyhorn, W. L. (2013). Financial literacy, financial education, and economic outcomes. Annual Review of Economics, 5, 347\u2013373."),
        bodyParagraph("Huston, S. J. (2010). Measuring financial literacy. Journal of Consumer Affairs, 44(2), 296\u2013316."),
        bodyParagraph("Ipatova, E., & Merheb, K. (2023). Re-examining the Dunning-Kruger effect: Objective vs. subjective financial literacy in the young and overconfident (SSRN Working Paper No. 4645450)."),
        bodyParagraph("Kaiser, T., Lusardi, A., Menkhoff, L., & Urban, C. (2022). Financial education affects financial knowledge and downstream behaviors. Journal of Financial Economics, 145(2), 255\u2013272."),
        bodyParagraph("Kramer, M. M. (2016). Financial literacy, confidence and financial advice seeking. Journal of Economic Behavior & Organization, 131(Part A), 198\u2013217."),
        bodyParagraph("Lusardi, A. (2019). Financial literacy and the need for financial education: Evidence and implications. Swiss Journal of Economics and Statistics, 155, Article 1."),
        bodyParagraph("Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. Journal of Economic Literature, 52(1), 5\u201344."),
        bodyParagraph("Lusardi, A., & Tufano, P. (2015). Debt literacy, financial experiences, and overindebtedness. Journal of Pension Economics and Finance, 14(4), 332\u2013368."),
        bodyParagraph("Mandell, L., & Klein, L. S. (2009). The impact of financial literacy education on subsequent financial behavior. Journal of Financial Counseling and Planning, 20(1), 15\u201324."),
        bodyParagraph("National Commission for the Protection of Human Subjects of Biomedical and Behavioral Research. (1979). The Belmont Report: Ethical principles and guidelines for the protection of human subjects of research. U.S. Department of Health and Human Services."),
        bodyParagraph("Mizumoto, A., & Eguchi, M. (2024). Large language models and automated essay scoring of English language learner writing: Insights into validity and reliability. Computers and Education: Artificial Intelligence, 6, 100208."),
        bodyParagraph("OECD. (2022). OECD/INFE toolkit for measuring financial literacy and financial inclusion 2022. OECD Publishing."),
        bodyParagraph("Olivos, F., Kamelski, T., & Ascui-Gac, S. (2025). Assessing instructor-AI cooperation for grading essay-type questions in an introductory sociology course. Teaching Sociology. Advance online publication. https://doi.org/10.1177/0092055X251397371"),
        bodyParagraph("Porto, N., & Xiao, J. J. (2016). Financial literacy overconfidence and financial advice seeking. Journal of Financial Service Professionals, 70(4), 78\u201388."),
        bodyParagraph("Robb, C. A., & Woodyard, A. (2011). Financial knowledge and best practice behavior. Journal of Financial Counseling and Planning, 22(1), 60\u201370."),
        bodyParagraph("Stango, V., & Zinman, J. (2009). Exponential growth bias and household finance. Journal of Finance, 64(6), 2807\u20132849."),
        bodyParagraph("Sweeney, L. (2000). Simple demographics often identify people uniquely (Carnegie Mellon University Data Privacy Working Paper No. 3)."),
        bodyParagraph("van Rooij, M., Lusardi, A., & Alessie, R. (2011). Financial literacy and stock market participation. Journal of Financial Economics, 101(2), 449\u2013472."),
        bodyParagraph("Wagner, J., & Walstad, W. B. (2019). The effects of financial education on short-term and long-term financial behaviors. Journal of Consumer Affairs, 53(1), 234\u2013259."),
        bodyParagraph("Willis, L. E. (2011). The financial education fallacy. American Economic Review, 101(3), 429\u2013434."),
        bodyParagraph("Yavuz, F. (2025). Utilizing large language models for EFL essay grading: An examination of reliability and validity in rubric-based assessments. British Journal of Educational Technology, 56(2), 487\u2013506."),

        // =====================================================================
        // DECLARATION OF AI AND AI-ASSISTED TECHNOLOGIES
        // =====================================================================
        pageBreakParagraph(),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "Declaration of AI and AI-Assisted Technologies",
            }),
          ],
        }),
        bodyParagraph(
          "This study employed AI tools in three capacities, disclosed here in accordance with current best-practice guidelines for transparency in academic publishing (COPE, 2023; AMEE Guide No. 192, 2025)."
        ),
        boldLeadParagraph(
          "1. Assessment platform development. ",
          "AI-assisted coding tools (GitHub Copilot, Claude Code) were used during development of the web-based assessment platform to accelerate implementation of the user interface, data collection logic, and adaptive routing algorithm. All platform functionality was independently tested and validated by the research team prior to deployment. The complete source code is publicly available for inspection in the project repository (Boulaid, 2026)."
        ),
        boldLeadParagraph(
          "2. Open-ended response scoring. ",
          "GPT-4.1 (OpenAI), accessed via the OpenRouter API, served as the automated scoring engine for classifying open-ended student responses into the three-way taxonomy (misconception, knowledge gap, selection error). The model was selected from among 11 candidate LLMs through a multi-model concordance protocol (Appendix D). The scoring rubric, item-specific prompts, misconception taxonomy, and calibration examples were developed entirely by the research team based on manual analysis of 931 student responses. Low-confidence classifications were flagged for human adjudication by the course instructor. This methodological use of LLM-based scoring follows established practices in educational assessment (Mizumoto & Eguchi, 2024; Yavuz, 2025) and is detailed in Section 4.2.3."
        ),
        boldLeadParagraph(
          "3. Manuscript preparation. ",
          "Generative AI tools assisted with drafting, editing, and formatting portions of this manuscript. All content was reviewed, revised, and verified by the authors, who take full responsibility for the accuracy and integrity of the publication."
        ),

        // =====================================================================
        // APPENDIX A
        // =====================================================================
        pageBreakParagraph(),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "Appendix A: SDM-10 Selection Algorithm and Burden Controls",
            }),
          ],
        }),
        bodyParagraph(
          "The SDM-10 module uses a deterministic, rule-based selection algorithm to choose 10 diagnostic items for each student. This appendix presents the complete specification of burden controls, scoring, variant assignment, selection phases, and classification rules."
        ),

        // Table A.1: Burden Controls
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.1. SDM-10 Burden Control Rules",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Control", "Rule"],
          [
            ["SDM size", "Fixed 10 items after 40 anchor questions"],
            ["Selection basis", "Ranked by Need score (0\u20135) at subcategory level"],
            ["Domain balance", "At least 2 items per scoring domain"],
            ["Subcategory cap", "Max 2 SDM items per subcategory"],
            ["Open-ended cap", "Max 3 open-ended items per student"],
            ["Format fallback", "Open_Diagnose \u2192 Lower_MCQ; Open_Confirm \u2192 Same_MCQ"],
            ["Item source", "Pre-written 156-variant bank only"],
            ["Grading", "Diagnostic only (Model C); grade from 40 anchors only"],
          ],
          [3120, 6240]
        ),

        // Table A.2: Need Score
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.2. Need Score Mapping (Correctness \u00D7 Confidence \u00D7 Format)",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Confidence", "Correct (MCQ)", "Correct (T/F)", "Incorrect (MCQ)", "Incorrect (T/F)"],
          [
            ["1 (Low)", "2", "3", "3", "3"],
            ["2 (Mid)", "1", "2", "4", "4"],
            ["3 (High)", "0", "0", "5", "5"],
          ],
          [1872, 1872, 1872, 1872, 1872]
        ),
        bodyParagraph(
          "The format-aware adjustment reflects differential guessing probability: True/False items have a 50% chance-level baseline versus approximately 25% for MCQ, so correct T/F responses at moderate confidence receive higher Need scores than equivalent MCQ responses."
        ),

        // Table A.3: Variant Assignment
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.3. Variant Type Assignment Rules",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Anchor Pattern", "Variant Type", "Diagnostic Goal"],
          [
            ["Incorrect + High conf.", "Open_Diagnose", "Surface misconception"],
            ["Incorrect + Mid conf.", "Lower_MCQ", "Test foundational understanding"],
            ["Incorrect + Low conf.", "Lower_TF", "Confirm basic recognition"],
            ["Correct + Low conf.", "Open_Confirm", "Verify understanding vs. guessing"],
            ["Correct + Mid conf.", "Same_MCQ", "Confirm at same difficulty"],
            ["Correct + High conf.", "Higher_MCQ", "Probe deeper application"],
          ],
          [3120, 3120, 3120]
        ),

        // Table A.4: Three-Phase Selection
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.4. Three-Phase Selection Algorithm",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Phase", "Purpose", "Logic"],
          [
            ["1: Domain minimums", "Ensure coverage", "Top-Need item from each domain until each has \u2265 2"],
            ["2: Need-based filling", "Maximize diagnostic value", "Fill remaining slots in descending Need order"],
            ["3: Mastery fallback", "Avoid empty slots", "Add mastery items from strongest subcategories"],
          ],
          [2340, 2340, 4680]
        ),

        // Table A.5: Tiebreaker
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.5. Tiebreaker Hierarchy (Equal Need Scores)",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Priority", "Criterion", "Rule"],
          [
            ["1", "Domain deficit", "Favor domain with fewer items selected"],
            ["2", "Format priority", "T/F prioritized over MCQ (reduces guessing)"],
            ["3", "Subcategory spread", "Max 2 items per subcategory"],
            ["4", "Domain order", "Borrowing \u2192 Investment \u2192 Risk Mgmt"],
            ["5", "Seeded random", "Deterministic using student hash"],
          ],
          [1560, 3120, 4680]
        ),

        // Table A.6: Three-Way Classification
        new Paragraph({
          children: [
            new TextRun({
              text: "Table A.6. Three-Way Classification Decision Tree",
              bold: true,
              italics: true,
              font: "Times New Roman",
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 },
        }),
        buildTable(
          ["Step", "Condition", "Classification"],
          [
            ["1", "Blank, IDK, or too short?", "Knowledge gap"],
            ["2", "Correct reasoning despite wrong answer?", "Selection error"],
            ["3", "Student self-corrects?", "Selection error"],
            ["4", "Specific wrong mental model?", "Misconception (Layer 1 + 2)"],
            ["5", "Vague, no identifiable pattern?", "Knowledge gap"],
          ],
          [1560, 4680, 3120]
        ),

        // =====================================================================
        // APPENDIX B
        // =====================================================================
        pageBreakParagraph(),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "Appendix B: Assessment Items",
            }),
          ],
        }),
        bodyParagraph(
          "See attached question bank for complete item listing with answer keys."
        ),

        // =====================================================================
        // APPENDIX C: MISCONCEPTION TAXONOMY
        // =====================================================================
        pageBreakParagraph(),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "Appendix C: Financial Literacy Misconception Taxonomy (Layer 1)",
            }),
          ],
        }),
        bodyParagraph(
          "Layer 1 contains 37 generalizable financial literacy misconception families organized into seven categories. These codes are designed to be reproducible across assessment contexts, student populations, and institutions. Layer 2 item-specific tags (derived from observed student responses) are documented in the supplementary materials."
        ),

        // Category 1: INF
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.1 Inflation and Purchasing Power (INF)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["INF-01", "Lower inflation = falling prices", "Q6 (55%)"],
            ["INF-02", "Inflation definition confusion", "Q3"],
            ["INF-03", "Fixed income impact misunderstood", "Q7"],
            ["INF-04", "Inflation protection confusion", "Q38"],
            ["INF-05", "Empathy-driven inflation reasoning", "Q7 (33%)"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 2: INT
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.2 Interest, Compounding, and Time Value of Money (INT)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["INT-01", "Interest as a fee to the saver", "Q1"],
            ["INT-02", "No compounding awareness", "Q1"],
            ["INT-03", "Loan term does not affect total interest", "Q2"],
            ["INT-04", "Shorter term = higher total cost", "Q2"],
            ["INT-05", "Interest rates not negotiable", "Q8"],
            ["INT-06", "Bond price-rate relationship reversed", "Q29"],
            ["INT-07", "Zero interest concept confusion", "Q4 (small n)"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 3: RISK
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.3 Risk, Return, and Diversification (RISK)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["RISK-01", "Safety = highest returns", "Q32"],
            ["RISK-02", "Exceptions disprove general rule", "Q30, Q35"],
            ["RISK-03", "Diversification increases risk", "Q14, Q34"],
            ["RISK-04", "Diversification understood but misapplied", "Q36 (62%)"],
            ["RISK-05", "Single stock safer than mutual fund", "Q11"],
            ["RISK-06", "Mutual fund unfamiliarity", "Q11 (KG)"],
            ["RISK-07", "Stock market guarantees returns", "Q31"],
            ["RISK-08", "Stocks vs. bonds risk confusion", "Q39"],
            ["RISK-09", "Long-term asset return confusion", "Q32"],
            ["RISK-10", "Real-world counterexamples applied", "Q35"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 4: INS
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.4 Insurance and Risk Management (INS)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["INS-01", "Insurance for routine care", "Q12 (67%)"],
            ["INS-02", "Frequency = purpose reasoning", "Q12"],
            ["INS-03", "Deductible definition wrong", "Q13"],
            ["INS-04", "Liability coverage scope wrong", "Q37"],
            ["INS-05", "Insurance excludes large bills", "Q12"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 5: BORROW
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.5 Borrowing, Credit, and Personal Finance (BORROW)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["BORROW-01", "Credit report vs. score confusion", "Q10"],
            ["BORROW-02", "Single credit source belief", "Q10"],
            ["BORROW-03", "Employer credit check unknown", "Q10"],
            ["BORROW-04", "Emergency fund based on income", "Q5"],
            ["BORROW-05", "Emergency fund amount too low", "Q5"],
            ["BORROW-06", "Budgeting purpose misunderstood", "Q9 (small n)"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 6: CRISIS
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.6 Financial Crises and Systemic Risk (CRISIS)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["CRISIS-01", "2008 crisis cause reversed", "Q40"],
            ["CRISIS-02", "Crisis attributed to savings risk", "Q40"],
            ["CRISIS-03", "Risk management role misunderstood", "Q40"],
          ],
          [1560, 5460, 2340]
        ),

        // Category 7: NUM
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.7 Numeracy and Quantitative Reasoning (NUM)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Misconception Family", "Observed"],
          [
            ["NUM-01", "Percentage to count conversion error", "Q33 (small n)"],
          ],
          [1560, 5460, 2340]
        ),

        // Cross-cutting types
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: "C.8 Cross-Cutting Response Types (Not Misconceptions)",
            }),
          ],
        }),
        buildTable(
          ["Code", "Type", "Description"],
          [
            ["KG", "Knowledge Gap", "No knowledge (IDK, blank, unfamiliar with terms)"],
            ["SE", "Selection Error", "Correct understanding but wrong answer selected"],
          ],
          [1560, 2340, 5460]
        ),
        bodyParagraph(
          "These cross-cutting codes combine with category codes: INF-01 = inflation misconception, INF-KG = inflation knowledge gap, INF-SE = inflation selection error."
        ),

        // ── Appendix D: AI Scorer Model Selection Protocol ──────────────
        pageBreakParagraph(),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: "Appendix D: AI Scorer Model Selection Protocol",
              font: "Times New Roman",
              size: 28,
              bold: true,
            }),
          ],
        }),

        boldLeadParagraph(
          "Methodology. ",
          "To select the scoring model for the AI-assisted classification pipeline (Section 4.2.3), we conducted a multi-model concordance evaluation. Twenty identical open-ended student responses (11 diagnose, 9 confirm) were scored by 11 large language models from seven providers, accessed via the OpenRouter API. Models were evaluated on five criteria: (1) JSON schema compliance (whether diagnose items returned the correct diagnose-format output), (2) parse/API error rate, (3) classification nuance (use of partial credit, confidence variation, and balanced classification distributions), (4) throughput (wall-clock time for 20 responses), and (5) estimated cost for the full corpus of 953 responses."
        ),

        // Table D.1 title
        new Paragraph({
          spacing: { before: 240, after: 120 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Table D.1: Multi-Model Concordance Results (n = 20 identical responses)",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
        }),

        buildTable(
          ["Model", "Provider", "Schema Err", "Errors", "Time", "credit=50", "Conf. Var.", "Cost (953)", "Verdict"],
          [
            ["GPT-4.1", "OpenAI", "0", "0", "41 s", "Yes", "19H / 1M", "$2.86", "Selected"],
            ["DeepSeek V3.2", "DeepSeek", "0", "0", "266 s", "Yes", "18H / 2M", "$0.24", "Too slow"],
            ["Grok 4.1 Fast", "xAI", "0", "1 parse", "144 s", "Yes", "18H / 1M", "$0.22", "5% errors"],
            ["Qwen3-235B", "Alibaba", "0", "0", "84 s", "No", "20H / 0M", "$0.07", "No partial"],
            ["GPT-4o-mini", "OpenAI", "0", "0", "37 s", "No", "18H / 2M", "$0.22", "Overly strict"],
            ["Haiku 4.5", "Anthropic", "0", "0", "56 s", "No", "20H / 0M", "$1.58", "Over-detects SE"],
            ["Gemini 3 Flash", "Google", "1", "1 (429)", "42 s", "Yes", "18H / 1M", "$0.80", "Schema err"],
            ["Sonnet 4.5", "Anthropic", "1", "0", "71 s", "Yes", "19H / 1M", "$4.72", "Schema err"],
            ["Gemini 2.0 Flash", "Google", "2", "0", "34 s", "No", "20H / 0M", "$0.15", "Disqualified"],
            ["Minimax M2.1", "Minimax", "\u2014", "19/20", "83 s", "\u2014", "\u2014", "\u2014", "Disqualified"],
            ["Kimi K2.5", "Moonshot", "\u2014", "20/20", "173 s", "\u2014", "\u2014", "\u2014", "Disqualified"],
          ],
          [1200, 800, 700, 700, 600, 700, 900, 800, 960]
        ),

        bodyParagraph(
          "Schema violations occur when a diagnose item returns the confirm-format JSON (e.g., understanding_level instead of diagnosis_type). Three models were disqualified: Minimax M2.1 and Kimi K2.5 returned empty or unparseable responses on nearly all items; Gemini 2.0 Flash produced two schema violations and lacked any partial-credit classifications."
        ),

        // Table D.2 title
        new Paragraph({
          spacing: { before: 240, after: 120 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Table D.2: Inter-Model Agreement on Disputed Classifications",
              font: "Times New Roman",
              size: 22,
              bold: true,
              italics: true,
            }),
          ],
        }),

        buildTable(
          ["Response", "Student Text", "GPT-4.1", "DeepSeek V3.2", "Grok 4.1 Fast", "Haiku 4.5", "Qwen3-235B"],
          [
            ["Q9 Diagnose", "\u201Csafety net\u2026 preventing interest rates\u201D", "SE (selfcorrect)", "SE (selfcorrect)", "misconc. (BORROW-06)", "SE (selfcorrect)", "misconc. (BORROW-06)"],
            ["Q5 Diagnose", "\u201Chaving a little extra cash is safe enough\u201D", "misconc., cr=50", "misconc., cr=50", "misconc., cr=100", "KG (idk), cr=0", "KG (idk), cr=0"],
            ["Q13 Diagnose", "\u201Cdeductible is $500\u2026 insurance pays rest\u201D", "SE (selfcorrect)", "misconc. (INS-03), cr=50", "SE (selfcorrect)", "SE (INS-03)", "misconc. (INS-03)"],
            ["Q37 Confirm", "\u201CLiability coverage protects you\u2026\u201D", "verified, cr=100", "verified, cr=100", "verified, cr=100", "partial, cr=50", "verified, cr=100"],
          ],
          [900, 1260, 1200, 1200, 1200, 1200, 1200]
        ),

        boldLeadParagraph(
          "Selection Rationale. ",
          "GPT-4.1 was selected as the production scorer based on the following criteria: (a) zero schema violations across all 20 test items, (b) zero parse or API errors, (c) appropriate use of credit=50 for borderline misconceptions (e.g., Q5, where the student\u2019s reasoning was directionally aligned with a misconception but lacked specificity), (d) balanced classification distributions that were neither overly lenient (as with Gemini 2.0 Flash, which classified 66.7% of confirm items as \u201Cverified\u201D) nor overly strict (as with GPT-4o-mini, which classified only 11.1% as \u201Cverified\u201D), and (e) reasonable throughput and cost for the full corpus (~33 minutes, ~$2.86 for 953 responses). On the disputed items, GPT-4.1\u2019s classifications aligned with the majority of the zero-error models in three of four cases (Q9, Q5, Q37), supporting its position as a concordant central scorer."
        ),
      ],
    },
  ],
});

// ─── Generate and save ──────────────────────────────────────────────────────
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`Document generated successfully.`);
  console.log(`  Path: ${OUTPUT_PATH}`);
  console.log(`  Size: ${sizeMB} MB (${buffer.length} bytes)`);
});
