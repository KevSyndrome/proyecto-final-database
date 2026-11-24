// Builds the executive deck: presentation/Superstore_Executive_Deck.pptx
// Story arc: Setup -> Conflict/Insight -> Resolution
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const ROOT = path.resolve(__dirname, "..");
const IMG = (f) => path.join(ROOT, "outputs/static", f);

const THEME = {
  name: "Leaking Profit",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1F2933", lt1: "FFFFFF", dk2: "33475B", lt2: "F2F4F6",
    accent1: "C0392B", accent2: "2166AC", accent3: "7A8B99",
    accent4: "EDA100", accent5: "1BAF7A", accent6: "6250D6",
    hlink: "2166AC", folHlink: "6250D6",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "Global Superstore — Growing sales, leaking profit";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333;

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "DARK_TITLE",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.1, w: 11.7, h: 1.6,
        fontSize: 48, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.9, w: 11.7, h: 1.2,
        fontSize: 20, color: C.background2, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.6, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9,
        fontSize: 30, bold: true, color: C.text1, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "Global Superstore 2011-2014 · Final Project · Data Visualization & Storytelling",
        options: { x: 0.6, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: C.accent3, margin: 0 } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent3, align: "right" },
});

// ---------------------------------------------------------------- helpers
const sizeOf = (f) => {
  const b = fs.readFileSync(f); // PNG IHDR
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
function img(slide, file, x, y, maxW, maxH, alt) {
  const { w, h } = sizeOf(file);
  const r = w / h;
  let iw = maxW, ih = maxW / r;
  if (ih > maxH) { ih = maxH; iw = maxH * r; }
  slide.addImage({ path: file, x: x + (maxW - iw) / 2, y: y + (maxH - ih) / 2, w: iw, h: ih,
                   altText: alt, objectName: alt });
}
function tag(slide, text, color) {   // small act label: SETUP / CONFLICT / RESOLUTION
  slide.addText(text, { x: 0.6, y: 0.12, w: 4, h: 0.28, fontSize: 11, bold: true, color,
                        charSpacing: 3, margin: 0, isTextBox: true, objectName: "act-tag" });
}
function stat(slide, x, y, w, big, label, color) {
  slide.addText(big, { x, y, w, h: 0.9, fontSize: 44, bold: true, color, fontFace: THEME.headFontFace,
                       margin: 0, valign: "bottom", isTextBox: true, objectName: "stat-" + big });
  slide.addText(label, { x, y: y + 0.95, w, h: 0.6, fontSize: 14, color: C.text2, margin: 0,
                         valign: "top", isTextBox: true, objectName: "stat-label" });
}
function card(slide, x, y, w, h, head, body, accent, n, stacked) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 },
                 line: { type: "none" }, objectName: "card" });
  if (n) {
    slide.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fill: { color: accent },
                   line: { type: "none" }, objectName: "badge" });
    slide.addText(String(n), { x: x + 0.25, y: y + 0.25, w: 0.5, h: 0.5, fontSize: 16, bold: true,
                   color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  }
  if (stacked) {
    slide.addText(head, { x: x + 0.25, y: y + 0.9, w: w - 0.45, h: 0.75, fontSize: 15, bold: true,
                   color: C.text1, valign: "top", margin: 0, isTextBox: true });
    slide.addText(body, { x: x + 0.25, y: y + 1.65, w: w - 0.45, h: h - 1.8, fontSize: 13,
                   color: C.text2, valign: "top", margin: 0, isTextBox: true });
    return;
  }
  const tx = n ? x + 0.9 : x + 0.25;
  slide.addText(head, { x: tx, y: y + 0.2, w: w - (tx - x) - 0.2, h: 0.6, fontSize: 17, bold: true,
                 color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  slide.addText(body, { x: x + 0.25, y: y + 0.9, w: w - 0.45, h: h - 1.05, fontSize: 14,
                 color: C.text2, valign: "top", margin: 0, isTextBox: true });
}
const notes = (s, t) => s.addNotes(t);

// ================================================================ 1. Title
pres.addSection({ title: "Opening" });
let s = pres.addSlide({ masterName: "DARK_TITLE", sectionTitle: "Opening" });
s.addText("Growing sales, leaking profit", { placeholder: "title" });
s.addText("How uncontrolled discounting erased $815K of profit at Global Superstore (2011-2014)\n"
        + "Enterprise multi-modal data visualization & storytelling · November 24, 2026", { placeholder: "body" });
s.addText("SETUP  →  CONFLICT  →  RESOLUTION", { x: 0.8, y: 6.3, w: 8, h: 0.4, fontSize: 14, bold: true,
          color: C.accent1, charSpacing: 4, margin: 0, isTextBox: true });
notes(s, "JUAN PABLO (Narrative lead). ~30 s. Open with the headline: sales nearly doubled but profit did not follow. Today we show why, and what to do.");

// ================================================================ 2. Team & arc
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Opening" });
s.addText("Four people, five roles, one data story", { placeholder: "title" });
const roles = [
  ["Data Architect & Wrangler", "Kevin Axel Noh Ramirez", "Acquisition, cleaning, imputation, star schema"],
  ["BI Dashboard Lead", "Kenny Rafael Peralta Morales", "Dash dashboard: cross-filter, drill-down, Railway"],
  ["Python Viz Specialist", "Daniel Alberto Mendoza Dominguez", "Matplotlib, Seaborn & Plotly: distributions, CI"],
  ["Narrative & Storytelling Lead", "Juan Pablo Enriquez Ruiz", "Business framing, story arc, recommendations"],
  ["QA & Integration Lead", "Kevin Axel Noh Ramirez", "GitHub, colour-blind palettes, 0-baseline checks"],
];
const roleColors = [C.accent2, C.accent5, C.accent6, C.accent1, C.accent4];
roles.forEach(([r, who, d], i) => {
  const x = 0.6 + i * 2.46;
  card(s, x, 1.5, 2.3, 3.3, r, [{ text: who, options: { bold: true, color: C.text1, breakLine: true } },
                                { text: d }], roleColors[i], i + 1, true);
});
const arc = [["SETUP", "Context: +90% sales growth across 147 countries", C.accent2],
             ["CONFLICT / INSIGHT", "Margin flat; 1 in 4 order lines lose money — discounts are the cause", C.accent1],
             ["RESOLUTION", "Discount guardrails worth +$815K profit (+56%)", C.accent5]];
arc.forEach(([h, b, col], i) => {
  const x = 0.6 + i * 4.1;
  s.addText(h, { x, y: 5.1, w: 3.9, h: 0.4, fontSize: 14, bold: true, color: col, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(b, { x, y: 5.55, w: 3.9, h: 1.0, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  if (i < 2) s.addText("→", { x: x + 3.75, y: 5.05, w: 0.4, h: 0.5, fontSize: 22, color: C.accent3, margin: 0, isTextBox: true });
});
notes(s, "JUAN PABLO. ~40 s. Introduce the team: Kevin (data + QA), Kenny (BI dashboard), Daniel (Python viz), Juan Pablo (narrative). Explain the three-act arc. Speaking order: Juan Pablo slides 1-2 and 11; Kevin 3-4 and 12; Daniel 5-7; Kenny 8-10 (~2.5 min each).");

// ================================================================ 3. Setup — context
pres.addSection({ title: "Setup" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Setup" });
tag(s, "SETUP", C.accent2);
s.addText("A fast-growing global retailer", { placeholder: "title" });
stat(s, 0.6, 1.5, 2.9, "$12.6M", "sales 2011-2014", C.accent2);
stat(s, 3.6, 1.5, 2.9, "+90%", "sales growth 2011 → 2014", C.accent2);
stat(s, 6.6, 1.5, 2.9, "147", "countries in 7 markets", C.accent2);
stat(s, 9.6, 1.5, 3.1, "51,290", "order lines analysed", C.accent2);
s.addTable([
  [{ text: "Data type", options: { bold: true, color: C.background1, fill: { color: C.text1 } } },
   { text: "Fields used", options: { bold: true, color: C.background1, fill: { color: C.text1 } } },
   { text: "Wrangling step", options: { bold: true, color: C.background1, fill: { color: C.text1 } } }],
  ["Continuous", "Sales, Profit, Discount, Shipping Cost, Quantity", "IQR outlier flag (kept), log scale for skew"],
  ["Categorical", "Segment, Category, Sub-Category, Ship Mode, Priority", "Ordered categorical dtypes, discount bands"],
  ["Temporal", "Order Date, Ship Date", "dd-mm-yyyy parsing, Year > Quarter > Month hierarchy"],
  ["Geospatial", "Country, State, City, Region, Market", "ISO-3 codes for maps; postal code imputed as \"Not applicable\""],
], { x: 0.6, y: 3.6, w: 12.1, colW: [1.8, 4.6, 5.7], fontSize: 13, color: C.text1, fontFace: THEME.bodyFontFace,
     border: { type: "solid", pt: 0.5, color: "D5DAE0" }, rowH: 0.5, valign: "middle", margin: [0, 0.1, 0, 0.1] });
notes(s, "KEVIN (Data Architect). ~60 s. Dataset: Global Superstore, 51,290 rows, mixes all four field types required. Cleaning: Latin-1 encoding, date parsing, 80% missing postal codes are structurally missing (only the US uses them) so we impute an explicit category instead of fake numbers. Export: star schema with 1 fact + 4 dimension tables.");

// ================================================================ 4. Setup — sales vs margin
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Setup" });
tag(s, "SETUP", C.accent2);
s.addText("Sales nearly doubled — margin did not move", { placeholder: "title" });
img(s, IMG("02_amounts_yearly.png"), 0.6, 1.4, 12.1, 4.0, "Yearly sales bars and profit margin line");
s.addText([
  { text: "Growth is volume-driven: ", options: { bold: true } },
  { text: "every extra dollar of sales still returns only ~11-12 cents of profit. Two separate charts on purpose — never a dual axis — and bars start at 0." },
], { x: 0.6, y: 5.7, w: 12.1, h: 0.9, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true });
notes(s, "KEVIN. ~45 s. Setup ends with the organisational challenge: growth without margin improvement. Why? That is the conflict.");

// ================================================================ 5. Conflict — losses
pres.addSection({ title: "Conflict" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "CONFLICT / INSIGHT", C.accent1);
s.addText("1 in 4 order lines loses money — all were discounted", { placeholder: "title" });
stat(s, 0.6, 1.5, 3.6, "24%", "of order lines are sold at a loss (12,544 lines)", C.accent1);
stat(s, 0.6, 3.2, 3.6, "$921K", "profit destroyed on loss-making lines", C.accent1);
stat(s, 0.6, 4.9, 3.6, "100%", "of loss-making lines carried a discount", C.accent1);
img(s, IMG("07_uncertainty_error_bars.png"), 4.6, 1.4, 8.1, 5.3, "Mean profit by discount band with 95% CI error bars");
notes(s, "DANIEL (Python Viz Specialist). ~60 s. Error bars are bootstrap 95% confidence intervals. Above 20% discount, the mean profit per line is negative and the CI never crosses zero: this is a robust pattern, not noise.");

// ================================================================ 6. Conflict — distributions
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "CONFLICT / INSIGHT", C.accent1);
s.addText("Each step up in discount pushes margins past break-even", { placeholder: "title" });
img(s, IMG("04_dist_kde_margin_by_discount.png"), 0.6, 1.4, 8.4, 5.3, "KDE of profit margin by discount band");
card(s, 9.3, 1.5, 3.4, 1.55, "0% discount", "25.3% margin on $7.0M of sales", C.accent2);
card(s, 9.3, 3.25, 3.4, 1.55, ">20% discount", "22% of lines, −$815K profit combined", C.accent1);
card(s, 9.3, 5.0, 3.4, 1.55, "Spearman ρ = −0.67", "discount vs margin: the strongest driver in the data", C.accent3);
notes(s, "DANIEL. ~60 s. KDE plots show the full distribution shift. Sequential viridis palette because discount bands are ordered magnitudes. Spearman rank correlation is used because sales and profit are heavily skewed.");

// ================================================================ 7. Conflict — relationships
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "CONFLICT / INSIGHT", C.accent1);
s.addText("The pattern holds in every market", { placeholder: "title" });
img(s, IMG("09_bubble_discount_margin.png"), 0.6, 1.35, 7.4, 5.4, "Bubble chart average discount vs profit margin by market");
img(s, path.join(__dirname, "spearman_heatmap.png"), 8.2, 1.35, 4.5, 4.4, "Spearman correlation heatmap");
s.addText("Discount vs profit margin: ρ = −0.67. Shipping cost just scales with sales (ρ = 0.91).", { x: 8.2, y: 5.85, w: 4.5, h: 0.9,
          fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
notes(s, "DANIEL. ~45 s. Left: correlation matrix, diverging palette centred on 0. Right: interactive Plotly bubble chart (HTML version in the repo) — each bubble is a market x sub-category; size = sales. OLS trendline slopes down in every market.");

// ================================================================ 8. Conflict — product
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "CONFLICT / INSIGHT", C.accent1);
s.addText("Tables: $757K in sales, −$64K in profit", { placeholder: "title" });
img(s, IMG("01_amounts_subcategory.png"), 0.6, 1.4, 12.1, 5.4, "Sales and profit by sub-category, Tables highlighted in red");
notes(s, "KENNY (BI Dashboard Lead). ~40 s. Pre-attentive colour: everything in neutral or blue, only the loss in red. Tables is the only sub-category with negative profit; it is the 8th largest by sales.");

// ================================================================ 9. Conflict — geography
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "CONFLICT / INSIGHT", C.accent1);
s.addText("Losses concentrate in high-discount countries", { placeholder: "title" });
img(s, IMG("10_choropleth_profit.png"), 0.6, 1.4, 6.6, 5.3, "Choropleth of profit by country");
img(s, IMG("11_loss_countries.png"), 7.4, 1.4, 5.3, 5.3, "Ten most loss-making countries with average discount");
notes(s, "KENNY. ~45 s. Geographic coordinate system with a diverging red-blue scale centred at zero. Turkey (−$98K) and Nigeria (−$81K) lead the losses; all 10 worst countries run average discounts of 35-51% vs 14% company-wide.");

// ================================================================ 10. Dashboard
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conflict" });
tag(s, "BI DASHBOARD", C.accent5);
s.addText("Executives can explore it themselves", { placeholder: "title" });
img(s, IMG("../../presentation/dashboard_screenshot.png"), 0.6, 1.4, 7.6, 5.3, "Screenshot of the interactive Dash dashboard");
s.addText([
  { text: "Cross-filtering: ", options: { bold: true, breakLine: false } },
  { text: "click a country or bar, every visual refilters", options: { breakLine: true } },
  { text: "Drill-down: ", options: { bold: true } },
  { text: "Market → Country, Category → Sub-Category", options: { breakLine: true } },
  { text: "Slice-and-dice: ", options: { bold: true } },
  { text: "monthly date-range slider + 3 slicers", options: { breakLine: true } },
  { text: "Graphical rules: ", options: { bold: true } },
  { text: "0-baseline bars, diverging profit, CVD-safe colours", options: { breakLine: true } },
  { text: "Why open source (Option C): ", options: { bold: true } },
  { text: "Plotly Dash is free, runs on Linux/Mac/Windows, version-controlled as code in GitHub, reproducible in a container", options: { breakLine: true } },
  { text: "Live: ", options: { bold: true } },
  { text: "open the dashboard on Railway", options: { color: C.accent2, underline: { style: "sng" },
    hyperlink: { url: "https://proyecto-final-database-production.up.railway.app" } } },
], { x: 8.5, y: 1.5, w: 4.2, h: 5.2, fontSize: 14, color: C.text1, margin: 0, valign: "top",
     paraSpaceAfter: 8, isTextBox: true });
notes(s, "KENNY. ~75 s. LIVE DEMO: open https://proyecto-final-database-production.up.railway.app, click EMEA in the market bar to drill into countries, click Turkey, then click the >50% discount band. Explain why we picked an open-source BI tool (Option C).");

// ================================================================ 11. Resolution
pres.addSection({ title: "Resolution" });
s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Resolution" });
tag(s, "RESOLUTION", C.accent5);
s.addText("Four moves to turn growth into profit", { placeholder: "title" });
const recs = [
  ["Cap discounts at 20%", "Anything above requires manager approval. Lines >20% lost $815K."],
  ["Re-price or bundle Tables", "Only loss-making sub-category; review supplier cost and freight."],
  ["Audit 10 loss countries", "Turkey, Nigeria, Netherlands… run 35-51% average discounts."],
  ["Manage margin, not just sales", "Make margin % the regional KPI in the executive dashboard."],
];
recs.forEach(([h, b], i) => {
  const x = 0.6 + (i % 2) * 4.25, y = 1.5 + Math.floor(i / 2) * 2.6;
  card(s, x, y, 4.05, 2.4, h, b, C.accent5, i + 1);
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.2, y: 1.5, w: 3.5, h: 5.0, rectRadius: 0.08,
           fill: { color: C.text1 }, line: { type: "none" }, objectName: "impact-card" });
s.addText("Estimated impact", { x: 9.45, y: 1.75, w: 3.0, h: 0.4, fontSize: 15, bold: true, color: C.background2, margin: 0, isTextBox: true });
s.addText("+$815K", { x: 9.45, y: 2.3, w: 3.0, h: 1.0, fontSize: 48, bold: true, color: C.accent5,
          fontFace: THEME.headFontFace, margin: 0, isTextBox: true });
s.addText("+56% profit if lines currently discounted above 20% simply broke even", { x: 9.45, y: 3.4, w: 3.0, h: 1.3,
          fontSize: 14, color: C.background1, margin: 0, valign: "top", isTextBox: true });
s.addText("Conservative: assumes no volume loss is recovered elsewhere and no further margin gain.", { x: 9.45, y: 5.0, w: 3.0, h: 1.2,
          fontSize: 12, italic: true, color: C.background2, margin: 0, valign: "top", isTextBox: true });
notes(s, "JUAN PABLO (Narrative lead). ~75 s. Deliver the recommendations. The what-if is a simple scenario: if the 22% of lines discounted above 20% had broken even instead of losing money, total profit would be $815K higher (+56%).");

// ================================================================ 12. Close
s = pres.addSlide({ masterName: "DARK_TITLE", sectionTitle: "Resolution" });
s.addText("Discount less, earn more", { placeholder: "title" });
s.addText("Design & QA checklist applied: 0-baseline bars · log scale for skewed sales · Viridis sequential, RdBu diverging, "
        + "validated colour-blind-safe qualitative palette · no dual axes · decluttered grids & direct labels\n\n"
        + "Repo: github.com/KevSyndrome/proyecto-final-database\nDashboard: proyecto-final-database-production.up.railway.app\nQuestions?", { placeholder: "body" });
notes(s, "KEVIN (QA & Integration lead). ~40 s. Wrap up: one sentence takeaway, mention accessibility checks and where the deliverables live, then open for questions.");

(async () => {
  const out = path.join(__dirname, "Superstore_Executive_Deck.pptx");
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
