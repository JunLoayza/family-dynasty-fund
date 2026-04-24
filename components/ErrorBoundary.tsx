"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { err: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  reset = () => this.setState({ err: null });

  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            padding: "32px 24px",
            margin: "40px auto",
            maxWidth: 520,
            background: "#0d1117",
            border: "1px solid #3a1f1f",
            borderRadius: 8,
            color: "#e8dcc8",
            fontFamily: "'Palatino Linotype','Book Antiqua',Palatino,serif",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#f87171", textTransform: "uppercase", marginBottom: 10 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: "#9aa0b0", marginBottom: 14, lineHeight: 1.7 }}>
            The simulator hit an unexpected state. Your settings are preserved in the URL — try reloading, or reset the page to continue.
          </div>
          <button
            type="button"
            onClick={this.reset}
            style={{
              background: "transparent",
              border: "1px solid #c9a96e",
              color: "#c9a96e",
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
