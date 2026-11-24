"""Global Superstore — Executive Profitability Dashboard (Plotly Dash, open-source BI).

Interactive features required by the brief:
  * Cross-filtering  : click a country on the map, a market/category bar, or a discount band
                       and every other visual re-filters to that selection.
  * Slice-and-dice   : date-range slider (month granularity) + Market / Category / Segment dropdowns.
  * Drill-down       : Market -> Country and Category -> Sub-Category (click a bar to drill,
                       "Reset" button to go back up). Time hierarchy Year > Month on the trend.
Graphical rules: every bar chart has a strict 0-baseline; diverging RdBu palette for
profit/loss; sequential Viridis for ordered magnitudes; fixed colour-blind-safe
qualitative colours per market.

Run:  python dashboard/app.py   ->  http://127.0.0.1:8050
Prod: gunicorn dashboard.app:server --bind 0.0.0.0:$PORT  (see dashboard/Dockerfile, railway.json)
"""
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, Input, Output, State, ctx, dcc, html, no_update

ROOT = Path(__file__).resolve().parents[1]
df = pd.read_csv(ROOT / "data/processed/superstore_clean.csv",
                 parse_dates=["order_date", "ship_date", "year_month"])

BAND_ORDER = ["0%", "1-10%", "11-20%", "21-30%", "31-50%", ">50%"]
MARKET_ORDER = ["APAC", "EU", "US", "LATAM", "EMEA", "Africa", "Canada"]
MARKET_COLORS = dict(zip(MARKET_ORDER,
                         ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"]))
NEG, POS, INK, MUTED = "#c0392b", "#2166ac", "#1f2328", "#6b7280"
MONTHS = sorted(df["year_month"].unique())
MONTH_LABELS = {i: pd.Timestamp(m).strftime("%b %Y") for i, m in enumerate(MONTHS) if pd.Timestamp(m).month == 1}
MONTH_LABELS[len(MONTHS) - 1] = pd.Timestamp(MONTHS[-1]).strftime("%b %Y")

LAYOUT = dict(template="simple_white", margin=dict(l=10, r=10, t=40, b=10),
              font=dict(family="Inter, Segoe UI, sans-serif", size=12, color=INK),
              title_font=dict(size=14), hoverlabel=dict(bgcolor="white"))


def money(v):
    return f"${v/1e6:,.2f}M" if abs(v) >= 1e6 else f"${v/1e3:,.0f}K"


def kpi(label, value_id, note_id):
    return html.Div(className="kpi", children=[
        html.Div(label, className="kpi-label"),
        html.Div(id=value_id, className="kpi-value"),
        html.Div(id=note_id, className="kpi-note")])


def dropdown(id_, label, options):
    return html.Div(className="filter", children=[
        html.Label(label), dcc.Dropdown(id=id_, options=options, multi=True, placeholder="All")])


app = Dash(__name__, title="Superstore Executive Dashboard")
server = app.server  # WSGI entry point for gunicorn (Railway / any PaaS)
app.index_string = app.index_string.replace("</head>", """
<style>
 body{margin:0;background:#f5f6f7;font-family:Inter,'Segoe UI',sans-serif;color:#1f2328}
 .wrap{max-width:1400px;margin:0 auto;padding:16px}
 h1{font-size:22px;margin:4px 0 2px} .sub{color:#6b7280;margin:0 0 14px;font-size:13px}
 .filters{display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr auto;gap:12px;align-items:end;
          background:#fff;padding:12px 14px;border-radius:10px;box-shadow:0 1px 2px #0001}
 .filter label{font-size:12px;color:#6b7280;display:block;margin-bottom:4px}
 .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:12px 0}
 .kpi{background:#fff;border-radius:10px;padding:12px 14px;box-shadow:0 1px 2px #0001}
 .kpi-label{font-size:12px;color:#6b7280}.kpi-value{font-size:26px;font-weight:700;margin-top:2px}
 .kpi-note{font-size:12px;color:#6b7280}
 .grid{display:grid;gap:12px;margin-bottom:12px}.g2{grid-template-columns:1.4fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}
 .card{min-width:0;overflow:hidden;background:#fff;border-radius:10px;padding:6px;box-shadow:0 1px 2px #0001}
 .crumb{font-size:13px;margin:6px 2px;color:#1f2328} .crumb b{color:#c0392b}
 button{background:#1f2328;color:#fff;border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
 @media (max-width:900px){.filters,.kpis,.g2,.g3{grid-template-columns:1fr}}
</style></head>""")

app.layout = html.Div(className="wrap", children=[
    html.H1("Global Superstore — Growing sales, leaking profit"),
    html.P("Executive profitability dashboard · 51,290 order lines · 147 countries · 2011-2014. "
           "Click any map country or bar to cross-filter / drill down.", className="sub"),

    html.Div(className="filters", children=[
        html.Div(className="filter", children=[
            html.Label("Order date range"),
            dcc.RangeSlider(id="date", min=0, max=len(MONTHS) - 1, step=1, value=[0, len(MONTHS) - 1],
                            marks=MONTH_LABELS, allowCross=False)]),
        dropdown("f-market", "Market", MARKET_ORDER),
        dropdown("f-category", "Category", sorted(df["category"].unique())),
        dropdown("f-segment", "Segment", sorted(df["segment"].unique())),
        html.Button("Reset selection", id="reset"),
    ]),
    html.Div(id="crumb", className="crumb"),

    html.Div(className="kpis", children=[
        kpi("Sales", "k-sales", "n-sales"), kpi("Profit", "k-profit", "n-profit"),
        kpi("Profit margin", "k-margin", "n-margin"), kpi("Order lines losing money", "k-loss", "n-loss"),
        kpi("Average discount", "k-disc", "n-disc")]),

    html.Div(className="grid g2", children=[
        html.Div(className="card", children=dcc.Graph(id="map", config={"displayModeBar": False})),
        html.Div(className="card", children=dcc.Graph(id="geo-bar", config={"displayModeBar": False}))]),
    html.Div(className="grid g3", children=[
        html.Div(className="card", children=dcc.Graph(id="cat-bar", config={"displayModeBar": False})),
        html.Div(className="card", children=dcc.Graph(id="disc-bar", config={"displayModeBar": False})),
        html.Div(className="card", children=dcc.Graph(id="trend", config={"displayModeBar": False}))]),

    # Cross-filter / drill state
    dcc.Store(id="sel", data={"market": None, "country": None, "category": None,
                              "sub_category": None, "band": None}),
])


# ---------------------------------------------------------------- state updates
@app.callback(Output("sel", "data"),
              Input("map", "clickData"), Input("geo-bar", "clickData"),
              Input("cat-bar", "clickData"), Input("disc-bar", "clickData"),
              Input("reset", "n_clicks"), State("sel", "data"), prevent_initial_call=True)
def update_selection(map_click, geo_click, cat_click, disc_click, _reset, sel):
    trig = ctx.triggered_id
    sel = dict(sel)
    if trig == "reset":
        return {k: None for k in sel}
    if trig == "map" and map_click:
        country = map_click["points"][0]["hovertext"]
        sel["country"] = None if sel["country"] == country else country
        sel["market"] = df.loc[df["country"] == country, "market"].iloc[0] if sel["country"] else sel["market"]
    elif trig == "geo-bar" and geo_click:
        label = geo_click["points"][0]["y"]
        if sel["market"] is None:            # level 1 -> drill into market
            sel["market"] = label
        else:                                # level 2 -> toggle a country inside the market
            sel["country"] = None if sel["country"] == label else label
    elif trig == "cat-bar" and cat_click:
        label = cat_click["points"][0]["y"]
        if sel["category"] is None:
            sel["category"] = label
        else:
            sel["sub_category"] = None if sel["sub_category"] == label else label
    elif trig == "disc-bar" and disc_click:
        band = disc_click["points"][0]["x"]
        sel["band"] = None if sel["band"] == band else band
    return sel


def filtered(date_idx, markets, cats, segs, sel, ignore=()):
    """Apply slicers + cross-filter selection. `ignore` lets a visual skip its own filter."""
    lo, hi = MONTHS[date_idx[0]], MONTHS[date_idx[1]]
    d = df[(df["year_month"] >= lo) & (df["year_month"] <= hi)]
    if markets: d = d[d["market"].isin(markets)]
    if cats: d = d[d["category"].isin(cats)]
    if segs: d = d[d["segment"].isin(segs)]
    for key, col in [("market", "market"), ("country", "country"), ("category", "category"),
                     ("sub_category", "sub_category"), ("band", "discount_band")]:
        if sel.get(key) and key not in ignore:
            d = d[d[col] == sel[key]]
    return d


def profit_bar(agg, label_col, title):
    """Horizontal profit bar, diverging colours, strict 0-baseline."""
    agg = agg.sort_values("profit")
    colors = [NEG if p < 0 else POS for p in agg["profit"]]
    fig = go.Figure(go.Bar(
        x=agg["profit"], y=agg[label_col], orientation="h", marker_color=colors,
        customdata=agg[["sales", "margin"]],
        hovertemplate="<b>%{y}</b><br>Profit %{x:$,.0f}<br>Sales %{customdata[0]:$,.0f}"
                      "<br>Margin %{customdata[1]:.1%}<extra></extra>"))
    fig.add_vline(x=0, line_color=INK, line_width=1)
    fig.update_layout(**LAYOUT, title=title, height=380, xaxis_tickformat="$,.2s",
                      xaxis_rangemode="tozero", yaxis_title=None, xaxis_title=None)
    return fig


def agg_by(d, col):
    a = d.groupby(col, observed=True).agg(sales=("sales", "sum"), profit=("profit", "sum")).reset_index()
    a["margin"] = a["profit"] / a["sales"]
    return a


# ---------------------------------------------------------------- render
@app.callback(
    Output("k-sales", "children"), Output("n-sales", "children"),
    Output("k-profit", "children"), Output("n-profit", "children"),
    Output("k-margin", "children"), Output("n-margin", "children"),
    Output("k-loss", "children"), Output("n-loss", "children"),
    Output("k-disc", "children"), Output("n-disc", "children"),
    Output("map", "figure"), Output("geo-bar", "figure"), Output("cat-bar", "figure"),
    Output("disc-bar", "figure"), Output("trend", "figure"), Output("crumb", "children"),
    Input("date", "value"), Input("f-market", "value"), Input("f-category", "value"),
    Input("f-segment", "value"), Input("sel", "data"))
def render(date_idx, markets, cats, segs, sel):
    d = filtered(date_idx, markets, cats, segs, sel)
    sales, profit = d["sales"].sum(), d["profit"].sum()
    margin = profit / sales if sales else 0
    loss_share = d["is_loss"].mean() if len(d) else 0
    lost = -d.loc[d["is_loss"], "profit"].sum()

    # Map: ignores its own country filter so the whole region stays visible
    dm = filtered(date_idx, markets, cats, segs, sel, ignore=("country",))
    g = dm.groupby(["country", "iso3"]).agg(sales=("sales", "sum"), profit=("profit", "sum")).reset_index()
    lim = max(g["profit"].abs().quantile(.95), 1) if len(g) else 1
    fmap = px.choropleth(g, locations="iso3", color="profit", hover_name="country",
                         color_continuous_scale="RdBu", range_color=(-lim, lim),
                         color_continuous_midpoint=0, projection="natural earth",
                         hover_data={"iso3": False, "sales": ":$,.0f", "profit": ":$,.0f"})
    fmap.update_layout(**LAYOUT, height=380, title="Profit by country (red = loss) — click to filter",
                       coloraxis_colorbar=dict(title="Profit", tickformat="$,.2s", len=.8))
    fmap.update_geos(showframe=False, showcoastlines=False)

    # Market -> Country drill
    if sel["market"]:
        dg = filtered(date_idx, markets, cats, segs, sel, ignore=("country",))
        a = agg_by(dg, "country")
        a = pd.concat([a.nsmallest(8, "profit"), a.nlargest(7, "profit")]).drop_duplicates("country")
        fgeo = profit_bar(a, "country", f"Profit by country in {sel['market']} (worst 8 + best 7)")
    else:
        fgeo = profit_bar(agg_by(d, "market"), "market", "Profit by market — click to drill into countries")

    # Category -> Sub-category drill
    if sel["category"]:
        dc = filtered(date_idx, markets, cats, segs, sel, ignore=("sub_category",))
        fcat = profit_bar(agg_by(dc, "sub_category"), "sub_category", f"Profit by sub-category · {sel['category']}")
    else:
        fcat = profit_bar(agg_by(d, "category"), "category", "Profit by category — click to drill down")

    # Discount bands (ignore own filter so all bands stay visible; selected one highlighted)
    dd = filtered(date_idx, markets, cats, segs, sel, ignore=("band",))
    b = agg_by(dd, "discount_band").set_index("discount_band").reindex(BAND_ORDER).fillna(0).reset_index()
    colors = [NEG if p < 0 else POS for p in b["profit"]]
    opac = [1 if (sel["band"] in (None, x)) else .3 for x in b["discount_band"]]
    fdisc = go.Figure(go.Bar(x=b["discount_band"], y=b["profit"], marker_color=colors, marker_opacity=opac,
                             customdata=b[["sales", "margin"]],
                             hovertemplate="<b>Discount %{x}</b><br>Profit %{y:$,.0f}<br>Sales %{customdata[0]:$,.0f}"
                                           "<br>Margin %{customdata[1]:.1%}<extra></extra>"))
    fdisc.add_hline(y=0, line_color=INK, line_width=1)
    fdisc.update_layout(**LAYOUT, height=380, title="Profit by discount band — >20% destroys profit",
                        yaxis_tickformat="$,.2s", yaxis_rangemode="tozero")

    # Trend: monthly sales (bars, 0-baseline) — margin shown in hover to avoid a dual axis
    t = d.groupby("year_month").agg(sales=("sales", "sum"), profit=("profit", "sum")).reset_index()
    t["margin"] = t["profit"] / t["sales"]
    ftrend = go.Figure(go.Bar(x=t["year_month"], y=t["sales"], marker_color="#7a8b99",
                              customdata=t[["profit", "margin"]],
                              hovertemplate="<b>%{x|%b %Y}</b><br>Sales %{y:$,.0f}<br>Profit %{customdata[0]:$,.0f}"
                                            "<br>Margin %{customdata[1]:.1%}<extra></extra>"))
    ftrend.update_layout(**LAYOUT, height=380, title="Monthly sales (hover for margin)",
                         yaxis_tickformat="$,.2s", yaxis_rangemode="tozero")

    active = [f"{k.replace('_', '-')}: {v}" for k, v in sel.items() if v]
    crumb = (["Active selection → "] + [html.B(" · ".join(active))]) if active else \
        "No cross-filter selection (click a chart element to drill down)."

    return (money(sales), f"{len(d):,} order lines",
            money(profit), f"{money(lost)} lost on loss-making lines",
            f"{margin:.1%}", "profit ÷ sales",
            f"{loss_share:.0%}", f"{int(d['is_loss'].sum()):,} lines below $0",
            f"{d['discount'].mean():.1%}" if len(d) else "—", "policy target ≤ 20%",
            fmap, fgeo, fcat, fdisc, ftrend, crumb)


if __name__ == "__main__":
    import os
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8050)), debug=False)
