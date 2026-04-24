# Family Dynasty Fund Simulator

> A 150-year financial simulator for multi-generational family wealth planning.

Live site: **[familydynasty.vercel.app](https://familydynasty.vercel.app)**

Model a $10M family trust across 3–6 generations with adjustable return rates, distribution rules, inflation, life expectancy, contribution requirements, children per family, and eligibility rules. See how the fund compounds, how per-family payouts evolve as generations join and pass, and where the configuration breaks.

## Features

- **Four return scenarios** compared side-by-side (Stress, Below Avg, Expected, Above Avg), all anchored to a single Base Return slider.
- **3–6 generation model** with automatic life-expectancy lifecycle, eligibility delays, and inflation-indexed contributions.
- **Shareable URL state** — every slider is encoded in the URL, so a configuration can be bookmarked or sent to a collaborator.
- **Click-to-open tooltips** on every variable explain what it controls.
- **Interactive charts** for fund value, per-family payouts, family lifecycle, and a milestones table.
- **Optional AI Deep Analysis** — bring your own Anthropic API key to get personalized Critical Analysis, Recommended Refinements, and Verdict sections written by Claude. Key is stored only on your device and sent directly to Anthropic.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js 16 (App Router, React 19, TypeScript)
- recharts for the charts
- Inline styles (the design is intentionally monolithic)

## Security posture

- No backend, no database, no accounts, no analytics, no tracking.
- Content Security Policy, HSTS, X-Frame-Options, and related headers configured in `next.config.mjs`.
- The optional AI feature uses a direct browser-to-Anthropic request. The user's API key never reaches any server operated by this project.

See the [Privacy Policy](https://familydynasty.vercel.app/privacy) and [Terms of Service](https://familydynasty.vercel.app/terms) for details.

## About

Created by **Jun Loayza** — [LinkedIn](https://www.linkedin.com/in/junloayza/) · [X](https://x.com/JunLoayza).

Jun works across multiple ventures including The Octalysis Group, Chou Force, and an Influencer Incubator. This simulator is a tool for exploring multi-generational wealth strategies, not financial advice.

## License

MIT — see [LICENSE](./LICENSE).
