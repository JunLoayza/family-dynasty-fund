export type ClaudeModel = "claude-opus-4-7" | "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";

export const MODELS: { id: ClaudeModel; label: string; blurb: string; inPer1M: number; outPer1M: number }[] = [
  {
    id: "claude-opus-4-7",
    label: "Opus 4.7",
    blurb: "Deepest analysis. Higher cost per call.",
    inPer1M: 15,
    outPer1M: 75,
  },
  {
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    blurb: "Balanced quality and cost. Recommended.",
    inPer1M: 3,
    outPer1M: 15,
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Haiku 4.5",
    blurb: "Fastest and cheapest. Shorter, lighter analysis.",
    inPer1M: 1,
    outPer1M: 5,
  },
];

export type AnalysisResult = {
  criticalAnalysis: string;
  recommendedRefinements: string[];
  verdict: string;
};

export type CallResult = {
  analysis: AnalysisResult;
  usage: { input_tokens: number; output_tokens: number };
  costUsd: number;
};

export type AnalysisInputs = {
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
  fundAtYear150: number;
  perFamilyAtYear50: number;
  perFamilyAtYear150: number;
  totalFamilies: number;
  simYears: number;
};

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const usdM = (n: number) => `$${n.toFixed(2)}M`;
const usd = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${Math.round(n)}`;

function buildPrompt(x: AnalysisInputs): string {
  const netGrowth = x.baseReturn - x.distributionRate;
  return `You are a multi-generational wealth planning analyst. Analyze this family dynasty fund configuration and return STRICT JSON only — no prose, no markdown, no code fences.

CONFIGURATION:
- Initial fund: $10,000,000
- Base annual return: ${pct(x.baseReturn)}
- Distribution rate: ${pct(x.distributionRate)} of total fund per year
- Net growth before contributions: ${pct(netGrowth)}
- Inflation: ${pct(x.inflationRate)}/yr (applied to contribution limits and income)
- Generations modeled: ${x.numGenerations} (G1 = founder + spouse, G2 = 3 daughters, G3+ = descendants)
- Children per family (G2–G${x.numGenerations}): ${x.childrenPerFamily}
- Total family units across all generations: ${x.totalFamilies}
- Simulation horizon: ${x.simYears} years
- Founder current age: ${x.founderAge}, avg life expectancy: ${x.avgLifeExpectancy}
- Avg family income: ${usd(x.avgIncome)}/yr
- Contribution floor / cap (today's $): ${usd(x.minContrib)} / ${usd(x.maxContrib)}
- Eligibility: ${x.minContribYears} consecutive contribution years AND ${x.minChildren} children required

SIMULATION RESULTS (Expected scenario):
- Fund at year ${x.simYears}: ${usdM(x.fundAtYear150)}
- Per-family payout at year 50: ${usd(x.perFamilyAtYear50)}
- Per-family payout at year ${x.simYears}: ${usd(x.perFamilyAtYear150)}

OUTPUT SCHEMA (return this JSON object ONLY):
{
  "criticalAnalysis": "3-5 sentences identifying the most important tension or risk in THIS specific configuration — not generic trust advice. Reference specific numbers.",
  "recommendedRefinements": [
    "First refinement — concrete, specific to this config, actionable.",
    "Second refinement — ranked by impact on THIS scenario.",
    "Third refinement — most impactful change ranked last or first, your call."
  ],
  "verdict": "2-4 sentences on whether this configuration is sustainable, what would break it first, and what the single most important change would be."
}

Constraints:
- Return ONLY valid JSON parseable by JSON.parse.
- No markdown, no backticks, no commentary, no leading text.
- recommendedRefinements must be an array of 3 to 5 strings.
- Use plain English, not financial jargon. Refer to specific numbers from the configuration.
- Do not recommend OAuth, API changes, or anything unrelated to trust/fund structure.`;
}

function parseAnalysis(raw: string): AnalysisResult {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  const parsed = JSON.parse(text);
  if (
    typeof parsed.criticalAnalysis !== "string" ||
    !Array.isArray(parsed.recommendedRefinements) ||
    typeof parsed.verdict !== "string"
  ) {
    throw new Error("Analysis response missing required fields.");
  }
  const refinements = parsed.recommendedRefinements.filter((r: unknown): r is string => typeof r === "string");
  if (refinements.length < 2) {
    throw new Error("Analysis returned too few refinements.");
  }
  return {
    criticalAnalysis: parsed.criticalAnalysis,
    recommendedRefinements: refinements,
    verdict: parsed.verdict,
  };
}

export async function runAnalysis(
  apiKey: string,
  model: ClaudeModel,
  inputs: AnalysisInputs,
): Promise<CallResult> {
  const prompt = buildPrompt(inputs);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    let friendly = `Request failed (${res.status}).`;
    if (res.status === 401) friendly = "The API key was rejected. Check the key and try again.";
    else if (res.status === 429) friendly = "Rate limit or credit issue. Wait a moment or check your Anthropic billing.";
    else if (res.status >= 500) friendly = "Anthropic's API is temporarily unavailable. Try again shortly.";
    throw new Error(`${friendly}${errText ? ` (${errText.slice(0, 200)})` : ""}`);
  }

  const body = await res.json();
  const text: string = body?.content?.[0]?.text ?? "";
  const analysis = parseAnalysis(text);

  const modelInfo = MODELS.find((m) => m.id === model);
  const inTok = body?.usage?.input_tokens ?? 0;
  const outTok = body?.usage?.output_tokens ?? 0;
  const costUsd = modelInfo
    ? (inTok * modelInfo.inPer1M) / 1_000_000 + (outTok * modelInfo.outPer1M) / 1_000_000
    : 0;

  return {
    analysis,
    usage: { input_tokens: inTok, output_tokens: outTok },
    costUsd,
  };
}
