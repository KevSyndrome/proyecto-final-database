# Global Superstore — Growing sales, leaking profit
Final project · Enterprise Multi-Modal Data Visualization & Storytelling (Nov 24, 2026)

**Story:** sales grew +90% (2011→2014) but margin stayed flat at ~11-12%. A quarter of all order lines lose money,
and all of them carry a discount. Lines discounted above 20% lost **$815K**. Capping discounts at 20% would raise
profit by about **+56%**.

**Live dashboard:** https://proyecto-final-database-production.up.railway.app

## Deliverables
| # | Deliverable | Location |
|---|---|---|
| 1 | Interactive BI dashboard (open-source, **Option C: Plotly Dash**) | `dashboard/app.py` |
| 2 | Fully commented notebook | `final_visualizations.ipynb` |
| 3 | Executive deck (PPTX + PDF, Setup → Conflict → Resolution, speaker notes per member) | `presentation/` |
| – | Static charts (PNG 200 dpi + SVG) / interactive charts (HTML) | `outputs/static/`, `outputs/html/` |
| – | Clean data + star schema (fact + 4 dims) | `data/processed/` |

## Dataset
Global Superstore (51,290 rows × 24 fields): continuous (Sales, Profit, Discount, Shipping Cost, Quantity),
categorical (Segment, Category, Sub-Category, Ship Mode, Priority), temporal (Order/Ship Date), and geospatial
(Country, State, City, Region, Market; plus ISO-3 codes we added in `data/country_iso3.csv`).

## Run it (Podman or Docker)
```bash
podman build -t dataviz-final .
podman run -d --name dataviz_final -p 127.0.0.1:8889:8889 -p 127.0.0.1:8050:8050 -v "$PWD":/app:Z dataviz-final
podman logs dataviz_final            # Jupyter URL + token -> http://127.0.0.1:8889
podman exec -d dataviz_final python dashboard/app.py   # dashboard -> http://127.0.0.1:8050
```
To regenerate the notebook from source: `python build_notebook.py`, then
`jupyter nbconvert --to notebook --execute --inplace final_visualizations.ipynb`.

## Dashboard features
* **Cross-filtering:** click a country on the map, a bar, or a discount band → every visual refilters.
* **Drill-down:** Market → Country, Category → Sub-Category. "Reset selection" goes back up.
* **Slice-and-dice:** monthly date-range slider + Market / Category / Segment slicers.
* **Graphical rules:** all bars start at 0, diverging RdBu for profit/loss, Viridis for ordered magnitudes,
  a fixed colour-blind-safe qualitative palette per market, no dual axes.

**Why Option C (open source):** Power BI Desktop is Windows-only and Tableau Public needs a desktop install.
Dash is free and cross-platform. The dashboard is plain Python, so it is versioned in GitHub and reproducible in a container.
The star-schema CSVs in `data/processed/` load directly into Tableau or Power BI if you also want a `.twbx`/`.pbix`.

## Team roles
| Member | Role(s) | Presents slides |
|---|---|---|
| Kevin Axel Noh Ramirez | Data Architect & Wrangler · QA & Integration Lead | 3-4, 12 |
| Kenny Rafael Peralta Morales | BI Dashboard Lead | 8-10 (live demo) |
| Daniel Alberto Mendoza Dominguez | Python Visualization Specialist | 5-7 |
| Juan Pablo Enriquez Ruiz | Narrative & Storytelling Lead | 1-2, 11 |
