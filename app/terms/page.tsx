import LegalPage from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service — Family Dynasty Fund",
  description: "The terms that govern your use of Family Dynasty Fund.",
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

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" subtitle="Using the Simulator" updated="April 2026">
      <p style={P}>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Family Dynasty Fund
        Simulator and the content and features made available through it (collectively, the &quot;Site&quot;).
        By using the Site, you agree to these Terms. If you do not agree, do not use the Site.
      </p>

      <h2 style={H2}>1. The Site is an educational tool, not advice</h2>
      <p style={P}>
        The Site is a financial simulator designed to help you explore how a multi-generational family trust
        might behave under different assumptions. It is not financial, investment, tax, legal, accounting, or
        estate-planning advice. Outputs from the Site are projections based on inputs you provide and on
        simplified assumptions built into the model, not predictions.
      </p>
      <p style={P}>
        Do not rely on the Site to make, avoid, or delay any financial decision. Before establishing, funding,
        or modifying a trust, investment account, or estate plan, consult qualified licensed professionals in
        your jurisdiction.
      </p>

      <h2 style={H2}>2. No warranty</h2>
      <p style={P}>
        The Site is provided &quot;as is&quot; and &quot;as available,&quot; without warranty of any kind,
        express or implied, including but not limited to warranties of merchantability, fitness for a particular
        purpose, non-infringement, accuracy, or availability. The operators make no representation that the
        simulation logic, defaults, or analysis text is accurate, complete, or suitable for any purpose.
      </p>

      <h2 style={H2}>3. Limitation of liability</h2>
      <p style={P}>
        To the maximum extent permitted by law, the operators of the Site shall not be liable for any indirect,
        incidental, special, consequential, exemplary, or punitive damages, or any loss of profits, revenues,
        data, goodwill, or other intangible losses, arising out of or relating to your use of, or inability to
        use, the Site, even if advised of the possibility of such damages.
      </p>
      <p style={P}>
        Where liability cannot be excluded as a matter of law, it is limited to the greatest extent permitted.
        Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities;
        in those jurisdictions, the exclusions above apply only to the extent permitted.
      </p>

      <h2 style={H2}>4. Optional AI Deep Analysis feature</h2>
      <p style={P}>
        The Site offers an optional &quot;AI Deep Analysis&quot; feature that allows you to connect the Site
        to Anthropic&apos;s API using an API key that you provide. You are solely responsible for obtaining,
        protecting, and paying for your Anthropic account and API usage.
      </p>
      <ul style={UL}>
        <li style={P}>
          Your key is stored only on your own device, and all AI requests are sent directly from your browser
          to Anthropic. The operators of the Site never see, store, proxy, or process your key or your prompts.
        </li>
        <li style={P}>
          Your use of Anthropic&apos;s service is governed by Anthropic&apos;s own terms, usage policies, and
          pricing. The operators of the Site are not affiliated with Anthropic.
        </li>
        <li style={P}>
          The operators of the Site are not responsible for the accuracy, content, availability, or cost of any
          response returned by Anthropic&apos;s API.
        </li>
        <li style={P}>
          You agree not to use the AI feature to generate content that violates Anthropic&apos;s usage policies
          or any applicable law.
        </li>
      </ul>

      <h2 style={H2}>5. Acceptable use</h2>
      <p style={P}>You agree not to, and not to authorize any third party to:</p>
      <ul style={UL}>
        <li style={P}>Use the Site in a way that interferes with its operation or with other users;</li>
        <li style={P}>Attempt to probe, scan, or test the vulnerability of the Site or bypass security measures;</li>
        <li style={P}>Scrape, copy, or redistribute the Site or its content except as permitted by its open-source license;</li>
        <li style={P}>Use the Site to generate content that is unlawful, defamatory, or infringing;</li>
        <li style={P}>Represent the output of the Site as professional advice you are qualified to give.</li>
      </ul>

      <h2 style={H2}>6. Intellectual property</h2>
      <p style={P}>
        The Site&apos;s source code is published under the MIT License in the accompanying public repository.
        The name &quot;Family Dynasty Fund,&quot; the branding, and the written analysis copy are made available
        under the same terms unless otherwise noted. Contributions to the open-source project are governed by
        the license terms of that repository.
      </p>

      <h2 style={H2}>7. Third-party services</h2>
      <p style={P}>
        The Site links to third-party services (including but not limited to LinkedIn, X, the Anthropic console,
        and the Anthropic API). The operators of the Site do not control and are not responsible for the
        availability, content, or practices of those third-party services. Your use of them is subject to their
        own terms.
      </p>

      <h2 style={H2}>8. Privacy</h2>
      <p style={P}>
        Your use of the Site is also governed by the{" "}
        <a href="/privacy" style={{ color: "#c9a96e" }}>
          Privacy Policy
        </a>
        , which is incorporated into these Terms by reference.
      </p>

      <h2 style={H2}>9. Termination</h2>
      <p style={P}>
        The operators may modify, suspend, or discontinue the Site, in whole or in part, at any time and without
        notice. These Terms survive any discontinuation of the Site with respect to prior usage.
      </p>

      <h2 style={H2}>10. Governing law and disputes</h2>
      <p style={P}>
        These Terms are governed by the laws of the State of California, United States, without regard to
        conflict-of-law principles. Any dispute arising out of or relating to these Terms or the Site shall be
        resolved exclusively in the state or federal courts located in California, and you consent to the
        personal jurisdiction of those courts.
      </p>

      <h2 style={H2}>11. Changes to these Terms</h2>
      <p style={P}>
        These Terms may be updated from time to time. If material changes are made, the &quot;Last updated&quot;
        date at the top of this page will be revised. Continued use of the Site after a change constitutes
        acceptance of the revised Terms.
      </p>

      <h2 style={H2}>12. Severability and entire agreement</h2>
      <p style={P}>
        If any provision of these Terms is held unenforceable, the remaining provisions remain in effect. These
        Terms, together with the Privacy Policy, constitute the entire agreement between you and the operators
        with respect to your use of the Site.
      </p>
    </LegalPage>
  );
}
