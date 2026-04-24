import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy — Family Dynasty",
  description: "How Family Dynasty handles (and does not handle) your data.",
};

const H2: React.CSSProperties = {
  fontSize: 16,
  color: "#f5efe0",
  margin: "26px 0 10px",
  fontWeight: 500,
  letterSpacing: 0.3,
};

const P: React.CSSProperties = { margin: "0 0 14px" };
const UL: React.CSSProperties = { margin: "0 0 14px", paddingLeft: 22 };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" subtitle="Your Data, Plainly" updated="April 2026">
      <p style={P}>
        Family Dynasty (&quot;the Site&quot;) is a client-side financial simulator. This policy describes what
        the Site does and does not collect. Read the{" "}
        <a href="/terms" style={{ color: "#c9a96e" }}>
          Terms of Service
        </a>{" "}
        for usage rules.
      </p>

      <h2 style={H2}>1. Summary in one paragraph</h2>
      <p style={P}>
        The Site runs entirely in your browser. We do not operate user accounts, databases, advertising trackers,
        or analytics. We do not sell, share, or disclose information about you, because we do not hold information
        about you. The only personal data that can enter the Site is an Anthropic API key you voluntarily paste
        into the optional &quot;AI Deep Analysis&quot; feature, and that key is stored only on your own device and
        sent only to Anthropic — it never reaches our servers.
      </p>

      <h2 style={H2}>2. Information we do not collect</h2>
      <ul style={UL}>
        <li style={P}>No account or registration is required or available.</li>
        <li style={P}>We do not use cookies for tracking, advertising, or analytics.</li>
        <li style={P}>We do not run analytics platforms (Google Analytics, Plausible, etc.).</li>
        <li style={P}>We do not embed third-party tracking pixels, fingerprinting scripts, or ad networks.</li>
        <li style={P}>We do not collect your email, name, location, or device identifiers.</li>
        <li style={P}>We do not transmit your simulator configuration (slider values) to any server.</li>
      </ul>

      <h2 style={H2}>3. Information that may be stored on your device</h2>
      <p style={P}>
        <strong style={{ color: "#e8dcc8" }}>Your simulator state.</strong> The values you set on the sliders can
        be encoded into the URL of this page (as query parameters) so that a configuration can be bookmarked or
        shared. This URL is stored by your browser&apos;s history — not by us.
      </p>
      <p style={P}>
        <strong style={{ color: "#e8dcc8" }}>Your Anthropic API key (only if you provide one).</strong> The AI
        Deep Analysis feature is entirely optional. If you choose to use it, you may paste an Anthropic API key
        into the in-app modal. That key is stored only in your browser&apos;s <code>localStorage</code> (persists
        across sessions) or <code>sessionStorage</code> (cleared when the tab closes), depending on the option
        you select. You can remove the key at any time from within the modal. The key is never transmitted to
        our servers.
      </p>

      <h2 style={H2}>4. How the AI Deep Analysis feature works</h2>
      <p style={P}>
        When you click &quot;Generate AI Analysis,&quot; your browser sends a single HTTPS request directly from
        your device to <code>api.anthropic.com</code> using the API key you provided. That request contains your
        current simulator configuration and a prompt instructing Claude to produce an analysis. The response
        is rendered in your browser.
      </p>
      <p style={P}>
        Because the request is browser-to-Anthropic, the Site never receives your key, your prompt, or the
        response. Anthropic&apos;s handling of that data is governed by Anthropic&apos;s own policies; please
        consult Anthropic&apos;s Privacy Policy and Usage Policies for details.
      </p>

      <h2 style={H2}>5. Security considerations for your API key</h2>
      <p style={P}>
        Storing an API key in browser storage is a reasonable default for a client-only tool, but it is not a
        vault. Be aware of the following:
      </p>
      <ul style={UL}>
        <li style={P}>
          Any browser extension you install has the ability to read from your browser&apos;s storage. Only install
          extensions you trust.
        </li>
        <li style={P}>
          Anyone with physical access to your logged-in device could also read the stored key. Prefer the
          &quot;This session only&quot; option when using a shared computer.
        </li>
        <li style={P}>
          Always verify the site address in your browser before pasting an API key. The canonical URL of this
          Site is the domain at which the page is currently loaded.
        </li>
        <li style={P}>
          You can revoke an API key at any time from your Anthropic console. If you suspect your key has been
          exposed, revoke it immediately.
        </li>
      </ul>

      <h2 style={H2}>6. Logs kept by the hosting provider</h2>
      <p style={P}>
        The Site is hosted on a third-party infrastructure provider (Vercel) which may keep standard web server
        logs including IP address, user-agent string, and request paths, for security and operational purposes.
        Those logs are governed by the hosting provider&apos;s own privacy policy. The operators of the Site do
        not access, correlate, or use those logs for any analytics or marketing purpose.
      </p>

      <h2 style={H2}>7. Children</h2>
      <p style={P}>
        The Site is not directed at children under the age of 13 and knowingly collects no information from
        anyone. Multi-generational financial planning is adult subject matter.
      </p>

      <h2 style={H2}>8. Your rights</h2>
      <p style={P}>
        Because the Site does not hold information about you, there is no user data for you to request, correct,
        port, or delete. You can delete any data your browser has stored locally by clearing your browser&apos;s
        site data for the domain, or by using the &quot;Remove my key&quot; button in the AI Deep Analysis modal.
      </p>

      <h2 style={H2}>9. Changes to this policy</h2>
      <p style={P}>
        If this policy changes materially, the &quot;Last updated&quot; date at the top will be revised and the
        new policy will govern from that date forward. Continued use of the Site after a change constitutes
        acceptance of the revised policy.
      </p>

      <h2 style={H2}>10. Disclaimer</h2>
      <p style={P}>
        The Site is provided for educational and exploratory purposes only. Nothing on the Site constitutes
        legal, tax, investment, or financial advice. Consult qualified professionals before making decisions
        about estate planning, trust formation, or investment strategy.
      </p>
    </LegalPage>
  );
}
