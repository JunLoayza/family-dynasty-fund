"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import InfoTooltip from "./InfoTooltip";
import AIAnalysisModal from "./AIAnalysisModal";
import { MODELS, runAnalysis, type AnalysisInputs, type AnalysisResult, type ClaudeModel } from "@/lib/claude";
import { loadKey } from "@/lib/keyStorage";

// ── Constants ─────────────────────────────────────────────────────────────────
const MARRIAGE_AGE = 28;
const SPOUSE_GAP = 3;
const G2_STARTS = [5, 8, 11];
const GEN_LAG = 25;
const CHILD_GAP = 3;
const MAX_GENERATIONS = 6;

const SCENARIO_OFFSETS = [
  { key: "stress", label: "Stress", offset: -0.04, color: "#f87171" },
  { key: "base", label: "Below Avg", offset: -0.02, color: "#fb923c" },
  { key: "moderate", label: "Expected", offset: 0, color: "#34d399" },
  { key: "optimal", label: "Above Avg", offset: +0.02, color: "#a78bfa" },
] as const;

type ScenarioKey = (typeof SCENARIO_OFFSETS)[number]["key"];

const TOOLTIPS = {
  fundStart:
    "The initial dollar amount you seed the fund with on day one. Larger starting values give the fund more immediate compounding power, but the year-over-year story is mostly driven by the return rate and distribution rate.",
  baseReturn:
    "The average annual nominal return you expect from the fund's investments. The S&P 500's historical nominal average is ~10–11%/year; a conservative diversified portfolio net of fees is typically 7–9%.",
  distributionRate:
    "The percentage of the total fund value paid out to eligible families each year. Lower rates preserve more capital for future generations.",
  childrenPerFamily:
    "The average number of children each family has in generations 2 through 6. More children means faster dilution of the distribution pool.",
  numGenerations:
    "How many generations the simulator projects into the future. G1 is you, G2 is your daughters, and each subsequent generation is their descendants.",
  avgLifeExpectancy:
    "The average age of the last surviving spouse in each couple. Once both spouses pass, that family unit no longer receives distributions.",
  founderAge:
    "Your age today. Used to calculate when you and your wife will stop receiving distributions.",
  avgIncome:
    "The typical household income across all families. Used to compute the 5% contribution requirement before min/max caps are applied.",
  minContrib:
    "The floor amount each family must contribute in today's dollars. Grows with inflation each year.",
  maxContrib:
    "The cap on annual contributions in today's dollars. Grows with inflation each year.",
  inflationRate:
    "The annual inflation rate applied to contribution limits and family income. Does not reduce the nominal fund value shown in charts.",
  minContribYears:
    "How many years in a row a family must contribute before becoming eligible to receive distributions.",
  minChildren:
    "The minimum number of children a family must have before they can start receiving distributions.",
};

// ── Dynamic schedule builder ──────────────────────────────────────────────────
type SchedEntry = { year: number; label: string; gen: number; exempt?: boolean };

function buildSchedule(childrenPerFamily: number, numGenerations: number): SchedEntry[] {
  const s: SchedEntry[] = [{ year: 0, label: "You & Wife", gen: 1, exempt: true }];
  G2_STARTS.forEach((yr, i) => s.push({ year: yr, label: `Daughter ${i + 1} Family`, gen: 2 }));
  let prev = [...G2_STARTS];
  for (let gen = 3; gen <= numGenerations; gen++) {
    const next: number[] = [];
    prev.forEach((pYr, pi) => {
      for (let c = 0; c < childrenPerFamily; c++) {
        const yr = pYr + GEN_LAG + c * CHILD_GAP;
        s.push({ year: yr, label: `G${gen}-P${pi + 1}-C${c + 1}`, gen });
        next.push(yr);
      }
    });
    prev = next;
  }
  return s;
}

function genCounts(cpf: number, numGen: number) {
  const counts: Record<string, number> = { g1: 1, g2: 3 };
  let total = counts.g1 + counts.g2;
  let prev = counts.g2;
  for (let g = 3; g <= numGen; g++) {
    const c = prev * cpf;
    counts[`g${g}`] = c;
    total += c;
    prev = c;
  }
  counts.total = total;
  return counts;
}

function deathYear(entry: SchedEntry, le: number, founderAge: number) {
  return entry.gen === 1
    ? Math.max(1, le - founderAge + SPOUSE_GAP)
    : entry.year + (le - MARRIAGE_AGE) + SPOUSE_GAP;
}

// ── Simulation ────────────────────────────────────────────────────────────────
type SimRow = {
  yr: number;
  fundM: number;
  pool: number;
  perFamily: number;
  families: number;
  contributingFamilies: number;
  totalIn: number;
  effContrib: number;
  nomMin: number;
  nomMax: number;
};

type SimParams = {
  returnRate: number;
  minContrib: number;
  maxContrib: number;
  avgIncome: number;
  distributionRate: number;
  minContribYears: number;
  minChildren: number;
  childrenPerFamily: number;
  numGenerations: number;
  avgLifeExpectancy: number;
  founderAge: number;
  inflationRate: number;
  fundStart: number;
  years: number;
};

function simulate(p: SimParams): SimRow[] {
  let fund = p.fundStart;
  const rows: SimRow[] = [];
  const sched = buildSchedule(p.childrenPerFamily, p.numGenerations);
  const childDelay = (p.minChildren - 1) * 2;
  const payoutDelay = Math.max(p.minContribYears, childDelay);
  const schedD = sched.map((e) => ({
    ...e,
    dieYear: deathYear(e, p.avgLifeExpectancy, p.founderAge),
  }));

  for (let yr = 0; yr <= p.years; yr++) {
    const inf = Math.pow(1 + p.inflationRate, yr);
    const nomMin = p.minContrib * inf;
    const nomMax = p.maxContrib * inf;
    const nomInc = p.avgIncome * inf;
    const alive = schedD.filter((e) => e.year <= yr && yr <= e.dieYear);
    const eligible = alive.filter((e) => e.exempt || e.year + payoutDelay <= yr).length;
    const contributing = alive.length;
    const pool = fund * p.distributionRate;
    const perFamily = eligible > 0 ? pool / eligible : 0;
    const effContrib = Math.min(Math.max(nomInc * 0.05, nomMin), nomMax);
    const totalIn = contributing * effContrib;

    rows.push({
      yr,
      fundM: fund / 1e6,
      pool,
      perFamily,
      families: eligible,
      contributingFamilies: contributing,
      totalIn,
      effContrib,
      nomMin,
      nomMax,
    });

    fund = fund * (1 + p.returnRate) + (totalIn - pool);
    if (fund < 0) fund = 0;
  }
  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const usd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;
const usdM = (n: number) => `$${n.toFixed(1)}M`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

type TipPayload = { dataKey: string | number; name: string; value: number; color: string };
const CustomTip = ({
  active,
  payload,
  label,
  yFmt,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string | number;
  yFmt?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #2d3340",
        borderRadius: 6,
        padding: "10px 14px",
      }}
    >
      <div style={{ color: "#c9a96e", fontSize: 11, marginBottom: 6 }}>Year {label}</div>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
              display: "inline-block",
            }}
          />
          <span style={{ color: "#9aa0b0" }}>{p.name}:</span>
          <span style={{ color: "#e8dcc8", fontWeight: 600 }}>{yFmt ? yFmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Slider ────────────────────────────────────────────────────────────────────
type SliderProps = {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
  accent?: string;
  highlight?: boolean;
  tooltip?: string;
};

function Slider({
  label,
  sublabel,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
  accent,
  highlight,
  tooltip,
}: SliderProps) {
  const col = accent || "#c9a96e";
  return (
    <div
      style={{
        marginBottom: highlight ? 18 : 14,
        ...(highlight
          ? {
              background: "#0a0f1c",
              border: `1px solid ${col}40`,
              borderRadius: 8,
              padding: "12px 14px",
            }
          : {}),
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: highlight ? 12 : 11,
              color: highlight ? "#c9d4e8" : "#7a8090",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span>{label}</span>
            {tooltip && <InfoTooltip content={tooltip} />}
          </div>
          {sublabel && <div style={{ fontSize: 9, color: "#3a4050", marginTop: 1 }}>{sublabel}</div>}
        </div>
        <span
          style={{
            fontSize: highlight ? 16 : 12,
            color: col,
            fontFamily: "monospace",
            fontWeight: highlight ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          {fmt(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: col, cursor: "pointer" }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        color: "#3a4050",
        letterSpacing: 2,
        textTransform: "uppercase",
        margin: "16px 0 10px",
        borderBottom: "1px solid #141820",
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function Insight({
  icon,
  color,
  title,
  body,
}: {
  icon: string;
  color: string;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: 10,
        padding: "12px 14px",
        background: "#090d15",
        borderRadius: 7,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color,
          marginBottom: 5,
          display: "flex",
          gap: 6,
          alignItems: "center",
        }}
      >
        <span>{icon}</span>
        <strong>{title}</strong>
      </div>
      <div style={{ fontSize: 12, color: "#6e7480", lineHeight: 1.65 }}>{body}</div>
    </div>
  );
}

function SnapRow({ yr, data }: { yr: number; data: SimRow[] }) {
  const row = data[yr];
  if (!row) return null;
  const waiting = row.contributingFamilies - row.families;
  return (
    <tr style={{ borderBottom: "1px solid #1a1f2e" }}>
      <td style={{ padding: "7px 8px", color: "#c9a96e", fontSize: 11 }}>{yr}</td>
      <td style={{ padding: "7px 8px", color: "#e8dcc8", fontSize: 11 }}>{usdM(row.fundM)}</td>
      <td style={{ padding: "7px 8px", color: "#34d399", fontSize: 11 }}>{row.families}</td>
      <td style={{ padding: "7px 8px", color: "#60a5fa", fontSize: 11 }}>{waiting > 0 ? `+${waiting}` : "—"}</td>
      <td style={{ padding: "7px 8px", color: "#34d399", fontSize: 11 }}>{usd(row.perFamily)}</td>
      <td style={{ padding: "7px 8px", color: "#fb923c", fontSize: 11 }}>{usd(row.effContrib)}</td>
      <td style={{ padding: "7px 8px", color: "#6a7080", fontSize: 10 }}>{usd(row.nomMin)}</td>
    </tr>
  );
}

// ── URL state ─────────────────────────────────────────────────────────────────
type FundState = {
  fundStart: number;
  baseReturn: number;
  distributionRate: number;
  childrenPerFamily: number;
  numGenerations: number;
  avgLifeExpectancy: number;
  founderAge: number;
  avgIncome: number;
  minContrib: number;
  maxContrib: number;
  inflationRate: number;
  minContribYears: number;
  minChildren: number;
};

const DEFAULTS: FundState = {
  fundStart: 10_000_000,
  baseReturn: 0.07,
  distributionRate: 0.04,
  childrenPerFamily: 3,
  numGenerations: 4,
  avgLifeExpectancy: 85,
  founderAge: 40,
  avgIncome: 150_000,
  minContrib: 10_000,
  maxContrib: 50_000,
  inflationRate: 0.03,
  minContribYears: 2,
  minChildren: 2,
};

const URL_KEY_MAP: Record<keyof FundState, string> = {
  fundStart: "fs",
  baseReturn: "br",
  distributionRate: "dr",
  childrenPerFamily: "cpf",
  numGenerations: "ng",
  avgLifeExpectancy: "le",
  founderAge: "fa",
  avgIncome: "inc",
  minContrib: "min",
  maxContrib: "max",
  inflationRate: "inf",
  minContribYears: "mcy",
  minChildren: "mc",
};

const RANGES: Record<keyof FundState, [number, number]> = {
  fundStart: [5_000_000, 50_000_000],
  baseReturn: [0.03, 0.14],
  distributionRate: [0.02, 0.07],
  childrenPerFamily: [1, 5],
  numGenerations: [3, MAX_GENERATIONS],
  avgLifeExpectancy: [70, 100],
  founderAge: [35, 80],
  avgIncome: [50_000, 500_000],
  minContrib: [1_000, 30_000],
  maxContrib: [10_000, 150_000],
  inflationRate: [0.01, 0.06],
  minContribYears: [1, 10],
  minChildren: [1, 5],
};

function clampState(s: FundState): FundState {
  const out = { ...s };
  (Object.keys(RANGES) as (keyof FundState)[]).forEach((k) => {
    const [lo, hi] = RANGES[k];
    if (!Number.isFinite(out[k])) out[k] = DEFAULTS[k];
    if (out[k] < lo) out[k] = lo;
    if (out[k] > hi) out[k] = hi;
  });
  return out;
}

function readStateFromUrl(): FundState {
  if (typeof window === "undefined") return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  const out = { ...DEFAULTS };
  (Object.keys(URL_KEY_MAP) as (keyof FundState)[]).forEach((k) => {
    const v = p.get(URL_KEY_MAP[k]);
    if (v !== null) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
  });
  return clampState(out);
}

function writeStateToUrl(s: FundState) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();
  (Object.keys(URL_KEY_MAP) as (keyof FundState)[]).forEach((k) => {
    if (s[k] !== DEFAULTS[k]) p.set(URL_KEY_MAP[k], String(s[k]));
  });
  const qs = p.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FamilyFund() {
  const [state, setStateRaw] = useState<FundState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [activeScen, setActiveScen] = useState<ScenarioKey>("moderate");
  const [tab, setTab] = useState<"fund" | "payout" | "families" | "snapshot">("fund");

  // AI state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<ClaudeModel>("claude-sonnet-4-6");
  const [aiView, setAiView] = useState<"template" | "ai">("template");
  const [aiResult, setAiResult] = useState<AnalysisResult | null>(null);
  const [aiCost, setAiCost] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Hydrate from URL on mount (avoids SSR mismatch)
  useEffect(() => {
    setStateRaw(readStateFromUrl());
    const saved = loadKey();
    if (saved.key) {
      setApiKey(saved.key);
      if (saved.model) setAiModel(saved.model as ClaudeModel);
    }
    setHydrated(true);
  }, []);

  const setState = (patch: Partial<FundState>) => {
    setStateRaw((prev) => {
      const next = clampState({ ...prev, ...patch });
      writeStateToUrl(next);
      return next;
    });
  };

  const {
    fundStart,
    baseReturn,
    distributionRate,
    childrenPerFamily,
    numGenerations,
    avgLifeExpectancy,
    founderAge,
    avgIncome,
    minContrib,
    maxContrib,
    inflationRate,
    minContribYears,
    minChildren,
  } = state;

  // Simulation horizon = last year at global peak eligible-family count.
  // Running past this point is misleading: as older generations die off, per-family
  // payouts rise purely from the denominator shrinking (survivor bias), not because
  // the fund actually got healthier. The peak-eligibility year is the "stress test" —
  // the year when the pool splits the most ways across all living generations.
  const simYears = useMemo(() => {
    const sched = buildSchedule(childrenPerFamily, numGenerations);
    const schedD = sched.map((e) => ({
      ...e,
      dieYear: deathYear(e, avgLifeExpectancy, founderAge),
    }));
    const childDelay = (minChildren - 1) * 2;
    const payoutDelay = Math.max(minContribYears, childDelay);
    const horizon = Math.max(...schedD.map((e) => e.dieYear), 1);

    let peak = 0;
    let peakYr = 0;
    for (let yr = 0; yr <= horizon; yr++) {
      let eligible = 0;
      for (const e of schedD) {
        if (e.year <= yr && yr <= e.dieYear && (e.exempt || e.year + payoutDelay <= yr)) {
          eligible++;
        }
      }
      if (eligible >= peak) {
        peak = eligible;
        peakYr = yr;
      }
    }
    return Math.max(peakYr, 10);
  }, [childrenPerFamily, numGenerations, avgLifeExpectancy, founderAge, minChildren, minContribYears]);

  const scenarios = useMemo(
    () =>
      SCENARIO_OFFSETS.map((s) => ({
        ...s,
        returnRate: Math.max(0.01, baseReturn + s.offset),
      })),
    [baseReturn],
  );

  const payoutDelay = Math.max(minContribYears, (minChildren - 1) * 2);
  const counts = useMemo(
    () => genCounts(childrenPerFamily, numGenerations),
    [childrenPerFamily, numGenerations],
  );
  const g1DeathYr = Math.max(1, avgLifeExpectancy - founderAge + SPOUSE_GAP);
  const inf30 = Math.pow(1 + inflationRate, 30);

  const sims = useMemo(() => {
    const out: Record<ScenarioKey, SimRow[]> = {} as Record<ScenarioKey, SimRow[]>;
    scenarios.forEach((s) => {
      out[s.key] = simulate({
        returnRate: s.returnRate,
        minContrib,
        maxContrib,
        avgIncome,
        distributionRate,
        minContribYears,
        minChildren,
        childrenPerFamily,
        numGenerations,
        avgLifeExpectancy,
        founderAge,
        inflationRate,
        fundStart,
        years: simYears,
      });
    });
    return out;
  }, [
    scenarios,
    minContrib,
    maxContrib,
    avgIncome,
    distributionRate,
    minContribYears,
    minChildren,
    childrenPerFamily,
    numGenerations,
    avgLifeExpectancy,
    founderAge,
    inflationRate,
    fundStart,
    simYears,
  ]);

  const chartData = useMemo(
    () =>
      Array.from({ length: simYears + 1 }, (_, i) => ({
        yr: i,
        stress_fund: sims.stress[i]?.fundM ?? 0,
        base_fund: sims.base[i]?.fundM ?? 0,
        moderate_fund: sims.moderate[i]?.fundM ?? 0,
        optimal_fund: sims.optimal[i]?.fundM ?? 0,
        stress_pay: sims.stress[i]?.perFamily ?? 0,
        base_pay: sims.base[i]?.perFamily ?? 0,
        moderate_pay: sims.moderate[i]?.perFamily ?? 0,
        optimal_pay: sims.optimal[i]?.perFamily ?? 0,
        eligible: sims.moderate[i]?.families ?? 0,
        contributing: sims.moderate[i]?.contributingFamilies ?? 0,
      })),
    [sims, simYears],
  );

  const activeData = sims[activeScen];
  const sc = scenarios.find((s) => s.key === activeScen)!;

  const sched = useMemo(
    () => buildSchedule(childrenPerFamily, numGenerations),
    [childrenPerFamily, numGenerations],
  );
  const genFirstYr = (g: number) => {
    const arr = sched.filter((e) => e.gen === g).map((e) => e.year);
    return arr.length ? Math.min(...arr) : 0;
  };

  const genLines = useMemo(() => {
    const lines: { yr: number; label: string; color: string }[] = [
      { yr: G2_STARTS[0], label: "G2", color: "#818cf8" },
    ];
    const colors = ["#34d399", "#fb923c", "#f472b6", "#22d3ee"];
    for (let g = 3; g <= numGenerations; g++) {
      lines.push({ yr: genFirstYr(g), label: `G${g}`, color: colors[g - 3] ?? "#c9a96e" });
    }
    lines.push({ yr: g1DeathYr, label: "G1 ✝", color: "#6a7080" });
    return lines;
  }, [numGenerations, sched, g1DeathYr]);

  const netReturn =
    (scenarios.find((s) => s.key === "moderate")?.returnRate ?? baseReturn) - distributionRate;

  const genTreeColors: Record<number, string> = {
    1: "#c9a96e",
    2: "#818cf8",
    3: "#34d399",
    4: "#fb923c",
    5: "#f472b6",
    6: "#22d3ee",
  };

  // ── AI analysis handlers ────────────────────────────────────────────────────
  const runAiAnalysis = async () => {
    if (!apiKey) {
      setAiModalOpen(true);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const endRow = sims.moderate[simYears];
      const row50 = sims.moderate[50];
      const inputs: AnalysisInputs = {
        fundStart,
        baseReturn,
        distributionRate,
        childrenPerFamily,
        numGenerations,
        avgLifeExpectancy,
        founderAge,
        avgIncome,
        minContrib,
        maxContrib,
        inflationRate,
        minContribYears,
        minChildren,
        fundAtYear150: endRow?.fundM ?? 0,
        perFamilyAtYear50: row50?.perFamily ?? 0,
        perFamilyAtYear150: endRow?.perFamily ?? 0,
        totalFamilies: counts.total,
        simYears,
      };
      const res = await runAnalysis(apiKey, aiModel, inputs);
      setAiResult(res.analysis);
      setAiCost(res.costUsd);
      setAiView("ai");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error.";
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleKeySaved = (key: string, model: ClaudeModel) => {
    setApiKey(key);
    setAiModel(model);
    setAiError(null);
  };

  // Deterministic templates — match starter file behavior
  const template = useMemo(() => {
    const critical = (
      <>
        The S&amp;P 500&apos;s nominal historical average is ~10–11%/yr since 1926. At {pct(baseReturn)},
        your &quot;Expected&quot; scenario assumes a diversified equity-heavy portfolio. After professional
        management fees (~1%), your real net return is roughly {pct(baseReturn - inflationRate - 0.01)}.
      </>
    );
    const refinements = [
      `Set distribution to 3%, not 4%. At ${pct(baseReturn)} return and 3% distribution, net growth is ${pct(
        baseReturn - 0.03,
      )}/yr — the fund compounds strongly for all future generations.`,
      `Budget for management fees explicitly. At 1%/yr in fees, your effective return is ${pct(
        baseReturn - 0.01,
      )} — dynasty trusts with professional managers typically cost 0.5–1.5%/yr.`,
      "Set up a Dynasty Trust (Nevada or South Dakota). Perpetual trust protects against estate taxes, divorce claims, creditor attachment, and generational disputes.",
      "Add a surviving spouse protection clause. A surviving spouse continues the full family unit payout until their death.",
      "Cap simultaneous receiving generations. Consider limiting distributions to the 3 most recent living generations to prevent extreme dilution.",
    ];
    const verdict = (
      <>
        At {pct(baseReturn)} base return and {pct(distributionRate)} distribution, net fund growth is{" "}
        {netReturn >= 0 ? "+" : ""}
        {pct(netReturn)}/yr. Over {simYears} years the fund reaches {usdM(sims.moderate?.[simYears]?.fundM ?? 0)},
        with the {counts.total} eventual families never all receiving simultaneously thanks to the life
        expectancy lifecycle. Your biggest remaining work is legal structure and governance, not math.
      </>
    );
    return { critical, refinements, verdict };
  }, [baseReturn, inflationRate, distributionRate, netReturn, simYears, sims, counts]);

  if (!hydrated) {
    return (
      <div
        style={{
          background: "#070b12",
          color: "#6a7080",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
          fontSize: 13,
        }}
      >
        Loading simulator…
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#070b12",
        color: "#e8dcc8",
        minHeight: "100vh",
        fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: "linear-gradient(135deg,#0a0e1a,#0e1420,#12101a)",
          borderBottom: "1px solid #1a1f2e",
          padding: "28px 20px 22px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: 5,
            color: "#c9a96e",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          DYNASTY WEALTH PLANNING · EST. 2026
        </div>
        <div style={{ fontSize: 11, color: "#6a7080", marginBottom: 10 }}>
          Created by{" "}
          <a
            href="https://www.linkedin.com/in/junloayza/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6a7080", textDecoration: "underline" }}
          >
            Jun Loayza
          </a>
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: "#f5efe0",
            margin: "0 0 6px",
            letterSpacing: 0.5,
          }}
        >
          Family Dynasty Fund
        </h1>
        <p style={{ color: "#6a7080", fontSize: 12, margin: 0 }}>
          {usdM(fundStart / 1e6)} Base · {numGenerations} Generations · {simYears}-Year Simulation
        </p>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            { v: pct(baseReturn), label: "Base Return", color: "#34d399" },
            { v: pct(distributionRate), label: "Distribution", color: "#c9a96e" },
            {
              v: `${netReturn >= 0 ? "+" : ""}${pct(netReturn)}`,
              label: "Net Growth",
              color: netReturn >= 0 ? "#34d399" : "#f87171",
            },
            { v: String(counts.total), label: "Max Families", color: "#c9a96e" },
            { v: `${avgLifeExpectancy}`, label: "Life Expect.", color: "#e879f9" },
            { v: String(childrenPerFamily), label: "Kids/Family", color: "#f472b6" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, color: s.color || "#c9a96e" }}>{s.v}</div>
              <div
                style={{
                  fontSize: 9,
                  color: "#4a5060",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px", maxWidth: 780, margin: "0 auto" }}>
        {/* ── INTRODUCTION ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1a1f2e",
            borderRadius: 8,
            padding: "18px 18px 14px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Introduction
          </div>
          <p style={{ fontSize: 14, color: "#c8c4b8", lineHeight: 1.8, margin: "0 0 12px" }}>
            Welcome. I built this to plan my family&apos;s future. My goal is generational wealth — for my
            kids, their kids, and every generation that follows — built on the idea that a rising tide lifts
            all boats when a family works together.
          </p>
          <p style={{ fontSize: 14, color: "#c8c4b8", lineHeight: 1.8, margin: "0 0 12px" }}>
            The concept is simple. My family pools their money into a single fund. Each year, a fixed
            percentage of the fund is paid out to eligible families as distributions. As long as we contribute
            more and let the fund grow faster than we pull out, it compounds across every future generation.
          </p>
          <p style={{ fontSize: 14, color: "#c8c4b8", lineHeight: 1.8, margin: 0 }}>
            Play with the variables below, stress-test the assumptions, and see what&apos;s sustainable. If
            you have suggestions, I&apos;d love to hear them —{" "}
            <a
              href="https://www.linkedin.com/in/junloayza/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#c9a96e" }}
            >
              reach out
            </a>
            .
          </p>
        </div>

        {/* ── SCENARIO CARDS ── */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 9,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Return Scenarios
          </div>
          <div style={{ fontSize: 11, color: "#4a5060", marginBottom: 10 }}>
            All four scenarios shift with your Base Return — &quot;Expected&quot; always equals your base.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {scenarios.map((s) => {
              const dEnd = sims[s.key]?.[simYears];
              const d50 = sims[s.key]?.[50];
              const active = activeScen === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveScen(s.key)}
                  style={{
                    background: active ? `${s.color}12` : "#0d1117",
                    border: `1px solid ${active ? s.color : "#1a1f2e"}`,
                    borderRadius: 8,
                    padding: "14px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.18s",
                    boxShadow: active ? `0 0 0 1px ${s.color}30` : "none",
                    fontFamily: "inherit",
                    color: "#e8dcc8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: s.color,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: active ? s.color : "#6a7080",
                          fontFamily: "monospace",
                          marginTop: 2,
                        }}
                      >
                        {pct(s.returnRate)}
                        {s.offset !== 0 && (
                          <span style={{ fontSize: 9, color: "#4a5060", marginLeft: 4 }}>
                            (base {s.offset > 0 ? "+" : ""}
                            {pct(s.offset)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: active ? s.color : "#2a2f3e",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 22, color: "#f0ebe0", fontWeight: 400, marginBottom: 2 }}>
                    {dEnd ? usdM(dEnd.fundM) : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "#4a5060", marginBottom: 8 }}>
                    Fund at Year {simYears}
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, color: active ? s.color : "#7a8090" }}>
                        {dEnd ? usd(dEnd.perFamily) : "—"}/yr
                      </div>
                      <div style={{ fontSize: 9, color: "#4a5060" }}>per family yr {simYears}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "#7a8090" }}>
                        {d50 ? usd(d50.perFamily) : "—"}/yr
                      </div>
                      <div style={{ fontSize: 9, color: "#4a5060" }}>per family yr 50</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PARAMETERS ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1a1f2e",
            borderRadius: 8,
            padding: "16px 16px 4px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Fund Parameters
          </div>

          <Slider
            label="Fund Starting Value"
            highlight
            accent="#c9a96e"
            tooltip={TOOLTIPS.fundStart}
            sublabel="Initial capital the fund is seeded with. Adjust to match what you actually plan to contribute at founding."
            value={fundStart}
            min={RANGES.fundStart[0]}
            max={RANGES.fundStart[1]}
            step={500_000}
            onChange={(v) => setState({ fundStart: v })}
            fmt={(v) => `$${(v / 1e6).toFixed(1)}M`}
          />

          <Slider
            label="Expected Market Return (Base)"
            highlight
            accent="#34d399"
            tooltip={TOOLTIPS.baseReturn}
            sublabel="S&P 500 historical nominal avg ≈ 10–11%. After fees & diversification, 7–9% is realistic."
            value={baseReturn}
            min={RANGES.baseReturn[0]}
            max={RANGES.baseReturn[1]}
            step={0.005}
            onChange={(v) => setState({ baseReturn: v })}
            fmt={pct}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {[
              { label: "S&P 500 nominal (hist.)", val: "~10–11%/yr", note: "before fees", color: "#34d399" },
              { label: "After inflation (real)", val: "~7–8%/yr", note: "inflation-adjusted", color: "#facc15" },
              {
                label: "After mgmt fees (~1%)",
                val: `~${pct(baseReturn - 0.01)}`,
                note: "your base − 1%",
                color: "#fb923c",
              },
              {
                label: "Net (after distribution)",
                val: `${netReturn >= 0 ? "+" : ""}${pct(netReturn)}`,
                note: "fund growth rate",
                color: netReturn >= 0 ? "#34d399" : "#f87171",
              },
            ].map((r) => (
              <div key={r.label} style={{ background: "#090d15", borderRadius: 5, padding: "9px 10px" }}>
                <div style={{ fontSize: 10, color: "#3a4050" }}>{r.label}</div>
                <div style={{ fontSize: 14, color: r.color, marginTop: 2 }}>{r.val}</div>
                <div style={{ fontSize: 9, color: "#3a4050", marginTop: 1 }}>{r.note}</div>
              </div>
            ))}
          </div>

          <Slider
            label="Distribution Rate"
            highlight
            accent="#c9a96e"
            tooltip={TOOLTIPS.distributionRate}
            sublabel="% of total fund paid out annually. Lower = more fund growth. Try 3% vs 4%."
            value={distributionRate}
            min={RANGES.distributionRate[0]}
            max={RANGES.distributionRate[1]}
            step={0.005}
            onChange={(v) => setState({ distributionRate: v })}
            fmt={pct}
          />

          <Slider
            label="Children Per Family"
            highlight
            accent="#f472b6"
            tooltip={TOOLTIPS.childrenPerFamily}
            sublabel="How many children each family has (G2+). G2 is fixed at 3 daughters."
            value={childrenPerFamily}
            min={RANGES.childrenPerFamily[0]}
            max={RANGES.childrenPerFamily[1]}
            step={1}
            onChange={(v) => setState({ childrenPerFamily: v })}
            fmt={(v) => `${v} child${v !== 1 ? "ren" : ""}`}
          />

          <Slider
            label="Number of Generations"
            highlight
            accent="#fbbf24"
            tooltip={TOOLTIPS.numGenerations}
            sublabel="How far into the future to project (G1 = you, G2 = daughters, G3+ = descendants)"
            value={numGenerations}
            min={RANGES.numGenerations[0]}
            max={RANGES.numGenerations[1]}
            step={1}
            onChange={(v) => setState({ numGenerations: v })}
            fmt={(v) => `${v} generations`}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${numGenerations},1fr)`,
              gap: 6,
              marginBottom: 6,
            }}
          >
            {Array.from({ length: numGenerations }, (_, i) => {
              const g = i + 1;
              const n = counts[`g${g}`] ?? 0;
              const color = genTreeColors[g] ?? "#c9a96e";
              return (
                <div
                  key={g}
                  style={{
                    background: "#090d15",
                    borderRadius: 6,
                    padding: "8px 6px",
                    textAlign: "center",
                    border: `1px solid ${color}25`,
                  }}
                >
                  <div style={{ fontSize: 9, color }}>G{g}</div>
                  <div style={{ fontSize: 20, color: "#f0ebe0", margin: "4px 0 2px" }}>{n}</div>
                  <div style={{ fontSize: 9, color: "#3a4050" }}>fam.</div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#5a6070",
              marginBottom: 16,
              padding: "6px",
              background: "#090d15",
              borderRadius: 6,
            }}
          >
            <strong style={{ color: "#c9a96e" }}>{counts.total}</strong> total family units across{" "}
            {numGenerations} generations
          </div>

          <SectionLabel>Life &amp; Demographics</SectionLabel>
          <Slider
            label="Life Expectancy (last surviving spouse)"
            tooltip={TOOLTIPS.avgLifeExpectancy}
            sublabel="Average age of the longer-lived spouse in each couple"
            value={avgLifeExpectancy}
            min={RANGES.avgLifeExpectancy[0]}
            max={RANGES.avgLifeExpectancy[1]}
            step={1}
            onChange={(v) => setState({ avgLifeExpectancy: v })}
            fmt={(v) => `age ${v}`}
            accent="#e879f9"
          />
          <Slider
            label="Your Current Age (G1 Founder)"
            tooltip={TOOLTIPS.founderAge}
            sublabel={`Last G1 survivor passes ~Year ${g1DeathYr} of the fund`}
            value={founderAge}
            min={RANGES.founderAge[0]}
            max={RANGES.founderAge[1]}
            step={1}
            onChange={(v) => setState({ founderAge: v })}
            fmt={(v) => `age ${v}`}
            accent="#e879f9"
          />

          <SectionLabel>Financial</SectionLabel>
          <Slider
            label="Average Family Income"
            tooltip={TOOLTIPS.avgIncome}
            value={avgIncome}
            min={RANGES.avgIncome[0]}
            max={RANGES.avgIncome[1]}
            step={10_000}
            onChange={(v) => setState({ avgIncome: v })}
            fmt={(v) => `$${(v / 1000).toFixed(0)}K`}
          />
          <Slider
            label="Min Annual Contribution (today's $)"
            tooltip={TOOLTIPS.minContrib}
            sublabel={`Grows with inflation · In 30 yrs ≈ $${((minContrib * inf30) / 1000).toFixed(0)}K nominal`}
            value={minContrib}
            min={RANGES.minContrib[0]}
            max={RANGES.minContrib[1]}
            step={500}
            onChange={(v) => setState({ minContrib: v })}
            fmt={(v) => `$${v.toLocaleString()}`}
            accent="#60a5fa"
          />
          <Slider
            label="Max Annual Contribution (today's $)"
            tooltip={TOOLTIPS.maxContrib}
            sublabel={`Grows with inflation · In 30 yrs ≈ $${((maxContrib * inf30) / 1000).toFixed(0)}K nominal`}
            value={maxContrib}
            min={RANGES.maxContrib[0]}
            max={RANGES.maxContrib[1]}
            step={5_000}
            onChange={(v) => setState({ maxContrib: v })}
            fmt={(v) => `$${v.toLocaleString()}`}
            accent="#60a5fa"
          />
          <Slider
            label="Inflation Rate"
            tooltip={TOOLTIPS.inflationRate}
            sublabel="Applied annually to contribution limits and family income"
            value={inflationRate}
            min={RANGES.inflationRate[0]}
            max={RANGES.inflationRate[1]}
            step={0.005}
            onChange={(v) => setState({ inflationRate: v })}
            fmt={pct}
            accent="#facc15"
          />

          <SectionLabel>Eligibility Rules</SectionLabel>
          <Slider
            label="Min Consecutive Years Contributing"
            tooltip={TOOLTIPS.minContribYears}
            value={minContribYears}
            min={RANGES.minContribYears[0]}
            max={RANGES.minContribYears[1]}
            step={1}
            onChange={(v) => setState({ minContribYears: v })}
            fmt={(v) => `${v} yr${v !== 1 ? "s" : ""}`}
            accent="#60a5fa"
          />
          <Slider
            label="Min Children Required for Payouts"
            tooltip={TOOLTIPS.minChildren}
            value={minChildren}
            min={RANGES.minChildren[0]}
            max={RANGES.minChildren[1]}
            step={1}
            onChange={(v) => setState({ minChildren: v })}
            fmt={(v) => `${v} child${v !== 1 ? "ren" : ""}`}
            accent="#f472b6"
          />

          <div
            style={{
              padding: "12px 14px",
              background: "#070b12",
              borderRadius: 6,
              marginBottom: 12,
              border: "1px solid #141820",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#c9a96e",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Active Rule Summary
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Payout delay", val: `${payoutDelay} yrs after joining`, color: "#c9a96e" },
                { label: "G1 last payout year", val: `~Year ${g1DeathYr}`, color: "#e879f9" },
                { label: "Min children", val: `${minChildren}`, color: "#f472b6" },
                {
                  label: "Contrib window",
                  val: `${minContribYears} yr${minContribYears !== 1 ? "s" : ""}`,
                  color: "#60a5fa",
                },
              ].map((r) => (
                <div key={r.label} style={{ background: "#0d1117", borderRadius: 4, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#3a4050" }}>{r.label}</div>
                  <div style={{ fontSize: 13, color: r.color, marginTop: 2 }}>{r.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHART TABS ── */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #1a1f2e",
              marginBottom: 16,
              overflowX: "auto",
            }}
          >
            {(
              [
                { key: "fund", label: "Fund Value" },
                { key: "payout", label: "Per-Family Payout" },
                { key: "families", label: "Family Lifecycle" },
                { key: "snapshot", label: "Milestones" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 12px",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  color: tab === t.key ? "#c9a96e" : "#4a5060",
                  borderBottom: tab === t.key ? "2px solid #c9a96e" : "2px solid transparent",
                  fontFamily: "inherit",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "fund" && (
            <div>
              <p style={{ fontSize: 11, color: "#4a5060", margin: "0 0 12px" }}>
                Fund value ($M) at base return {pct(baseReturn)} ± offsets. All four lines shift when you adjust
                the base return slider.
              </p>
              <ResponsiveContainer width="100%" height={265}>
                <LineChart data={chartData} margin={{ left: 4, right: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#141820" strokeDasharray="3 6" />
                  <XAxis
                    dataKey="yr"
                    stroke="#2a2f3e"
                    tick={{ fill: "#4a5060", fontSize: 10 }}
                    label={{
                      value: "Year",
                      position: "insideBottomRight",
                      fill: "#4a5060",
                      fontSize: 10,
                      dy: 10,
                    }}
                  />
                  <YAxis
                    stroke="#2a2f3e"
                    tick={{ fill: "#4a5060", fontSize: 10 }}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}M`}
                    width={62}
                  />
                  <Tooltip content={<CustomTip yFmt={(v) => `$${v.toFixed(2)}M`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {genLines.map((g) => (
                    <ReferenceLine
                      key={g.label}
                      x={g.yr}
                      stroke={g.color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                      label={{ value: g.label, fill: g.color, fontSize: 9, position: "top" }}
                    />
                  ))}
                  {scenarios.map((s) => (
                    <Line
                      key={s.key}
                      dataKey={`${s.key}_fund`}
                      name={`${s.label} (${pct(s.returnRate)})`}
                      stroke={s.color}
                      dot={false}
                      strokeWidth={activeScen === s.key ? 2.5 : 1.2}
                      opacity={activeScen === s.key ? 1 : 0.35}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === "payout" && (
            <div>
              <p style={{ fontSize: 11, color: "#4a5060", margin: "0 0 12px" }}>
                Annual payout per eligible family (nominal $). After older generations pass, the pool splits
                fewer ways — payouts can rise even as the fund grows.
              </p>
              <ResponsiveContainer width="100%" height={265}>
                <LineChart data={chartData} margin={{ left: 4, right: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#141820" strokeDasharray="3 6" />
                  <XAxis dataKey="yr" stroke="#2a2f3e" tick={{ fill: "#4a5060", fontSize: 10 }} />
                  <YAxis
                    stroke="#2a2f3e"
                    tick={{ fill: "#4a5060", fontSize: 10 }}
                    tickFormatter={(v: number) => usd(v)}
                    width={68}
                  />
                  <Tooltip content={<CustomTip yFmt={(v) => usd(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {genLines.map((g) => (
                    <ReferenceLine
                      key={g.label}
                      x={g.yr}
                      stroke={g.color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.4}
                      label={{ value: g.label, fill: g.color, fontSize: 9, position: "top" }}
                    />
                  ))}
                  {scenarios.map((s) => (
                    <Line
                      key={s.key}
                      dataKey={`${s.key}_pay`}
                      name={`${s.label} (${pct(s.returnRate)})`}
                      stroke={s.color}
                      dot={false}
                      strokeWidth={activeScen === s.key ? 2.5 : 1.2}
                      opacity={activeScen === s.key ? 1 : 0.35}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === "families" && (
            <div>
              <p style={{ fontSize: 11, color: "#4a5060", margin: "0 0 12px" }}>
                Eligible families over time — rises as generations join, falls as older generations pass away.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 4, right: 4, bottom: 4 }}>
                  <CartesianGrid stroke="#141820" strokeDasharray="3 6" />
                  <XAxis dataKey="yr" stroke="#2a2f3e" tick={{ fill: "#4a5060", fontSize: 10 }} />
                  <YAxis stroke="#2a2f3e" tick={{ fill: "#4a5060", fontSize: 10 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: "#0d1117", border: "1px solid #2a2f3e", borderRadius: 6 }}
                    labelStyle={{ color: "#c9a96e", fontSize: 11 }}
                    itemStyle={{ fontSize: 12 }}
                  />
                  {genLines.map((g) => (
                    <ReferenceLine
                      key={g.label}
                      x={g.yr}
                      stroke={g.color}
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                    />
                  ))}
                  <Line
                    dataKey="contributing"
                    name="Contributing (alive)"
                    stroke="#c9a96e"
                    dot={false}
                    strokeWidth={1.5}
                    strokeDasharray="5 3"
                  />
                  <Line dataKey="eligible" name="Eligible (receiving)" stroke="#34d399" dot={false} strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {tab === "snapshot" && (
            <div>
              <p style={{ fontSize: 11, color: "#4a5060", margin: "0 0 12px" }}>
                <span style={{ color: sc?.color }}>
                  {sc?.label} ({pct(sc.returnRate)})
                </span>{" "}
                · Contribution limits inflate at {pct(inflationRate)}/yr.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1f2e" }}>
                      {["Year", "Fund", "Eligible", "Pending", "Payout/Fam", "Contrib/Fam", "Min Limit"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "8px 8px",
                            textAlign: "left",
                            color: "#4a5060",
                            fontWeight: 400,
                            fontSize: 10,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 5, 10, 20, 30, 40, 50, 65, 80, 100, 125, 150, 175, 200]
                      .filter((y) => y <= simYears)
                      .map((yr) => (
                        <SnapRow key={yr} yr={yr} data={activeData} />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── AI CONTROLS ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1a1f2e",
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 9,
                color: "#c9a96e",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Analysis Mode
            </div>
            <div style={{ fontSize: 12, color: "#9aa0b0" }}>
              {apiKey
                ? aiView === "ai" && aiResult
                  ? `Using AI analysis · ${MODELS.find((m) => m.id === aiModel)?.label ?? aiModel}`
                  : "Key saved — click Generate to create personalized insights."
                : "Default templates. Add your Anthropic API key to unlock AI insights (optional)."}
            </div>
            {aiCost !== null && aiView === "ai" && (
              <div style={{ fontSize: 10, color: "#4a5060", marginTop: 4 }}>
                Last run cost: <span style={{ color: "#c9a96e" }}>${aiCost.toFixed(4)}</span>
              </div>
            )}
            {aiError && (
              <div style={{ fontSize: 11, color: "#f87171", marginTop: 6, maxWidth: 460 }}>{aiError}</div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {aiResult && (
              <button
                type="button"
                onClick={() => setAiView(aiView === "ai" ? "template" : "ai")}
                style={{
                  background: "transparent",
                  border: "1px solid #2a2f3e",
                  color: "#9aa0b0",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Show {aiView === "ai" ? "Templates" : "AI"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              style={{
                background: "transparent",
                border: "1px solid #2a2f3e",
                color: "#9aa0b0",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {apiKey ? "Manage Key" : "Add API Key"}
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={runAiAnalysis}
                disabled={aiLoading}
                style={{
                  background: aiLoading ? "#2a2f3e" : "#c9a96e",
                  border: "1px solid #c9a96e",
                  color: aiLoading ? "#6a7080" : "#0a0e1a",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: aiLoading ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {aiLoading ? "Generating…" : aiResult ? "Regenerate" : "Generate AI Analysis"}
              </button>
            )}
          </div>
        </div>

        {/* ── ANALYSIS ── */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #1a1f2e",
            borderRadius: 8,
            padding: "16px 16px 8px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Critical Analysis
          </div>

          {aiView === "ai" && aiResult ? (
            <Insight icon="🤖" color="#c9a96e" title="AI Analysis" body={aiResult.criticalAnalysis} />
          ) : (
            <>
              <Insight
                icon="📊"
                color="#34d399"
                title={`Why ${pct(baseReturn)} Base Return?`}
                body={template.critical}
              />
              <Insight
                icon="💀"
                color="#e879f9"
                title="Life Expectancy Shapes the Payout Curve"
                body={
                  <>
                    G1 (you &amp; wife) last receives around Year {g1DeathYr}. After that, the pool divides among
                    fewer families and per-family payouts rise. This natural generational turnover is why a{" "}
                    {pct(distributionRate)} distribution rate is more sustainable than it looks — earlier
                    generations naturally exit, relieving pressure on the fund.
                  </>
                }
              />
              <Insight
                icon="📈"
                color="#facc15"
                title="Inflation-Adjusted Contributions Preserve Accountability"
                body={
                  <>
                    Your ${(minContrib / 1000).toFixed(0)}K floor grows to ~${((minContrib * inf30) / 1000).toFixed(0)}K
                    nominal in 30 years at {pct(inflationRate)} inflation — keeping the real burden constant.
                    Without this adjustment, future generations could meet a fixed $10K minimum trivially easily.
                  </>
                }
              />
              <Insight
                icon="⚡"
                color="#f87171"
                title="Net Growth Rate Is What Really Matters"
                body={
                  <>
                    Your net growth rate = {pct(baseReturn)} return − {pct(distributionRate)} distribution ={" "}
                    {netReturn >= 0 ? "+" : ""}
                    {pct(netReturn)}/yr (before contributions).{" "}
                    {netReturn < 0
                      ? "⚠ NEGATIVE — the fund is shrinking in nominal terms. Reduce distribution rate or increase return expectations."
                      : netReturn < 0.02
                        ? "Marginal. Any underperformance risks long-term fund erosion."
                        : netReturn > 0.04
                          ? "Very healthy. The fund compounds aggressively across generations."
                          : "Healthy. The fund compounds meaningfully and grows over generations."}
                    {childrenPerFamily >= 4 && (
                      <>
                        {" "}
                        With <strong>{childrenPerFamily} children per family</strong>, be aware of exponential
                        dilution — by G{numGenerations}, you will have {counts[`g${numGenerations}`]} family units
                        sharing each year&apos;s distribution pool.
                      </>
                    )}
                  </>
                }
              />
            </>
          )}
        </div>

        {/* ── REFINEMENTS ── */}
        <div
          style={{
            background: "#090d15",
            border: "1px solid #c9a96e30",
            borderRadius: 8,
            padding: "16px 16px 12px",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#c9a96e",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Recommended Refinements
          </div>
          {(aiView === "ai" && aiResult ? aiResult.recommendedRefinements : template.refinements).map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#c9a96e20",
                  border: "1px solid #c9a96e50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c9a96e",
                  fontSize: 11,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: "#5a6070", lineHeight: 1.65 }}>{r}</div>
            </div>
          ))}
        </div>

        {/* ── VERDICT ── */}
        <div
          style={{
            background: "#090d15",
            border: "1px solid #34d39940",
            borderRadius: 8,
            padding: "16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: "#34d399",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Verdict
          </div>
          <div style={{ fontSize: 14, color: "#c8dcc8", lineHeight: 1.85 }}>
            {aiView === "ai" && aiResult ? aiResult.verdict : template.verdict}
          </div>
        </div>

        <div style={{ textAlign: "center", fontSize: 10, color: "#2a2f3e", padding: "8px 0 24px" }}>
          Nominal projections only · Contributions grow with inflation · Not legal or financial advice
        </div>
      </div>

      <AIAnalysisModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSaved={handleKeySaved}
        currentModel={aiModel}
      />
    </div>
  );
}
