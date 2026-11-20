import React from 'react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="page">
        <h1>Let’s try that again.</h1>
        <p>The page could not load.</p>
        <button className="button" onClick={() => window.location.assign('/')}>
          Back home
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
