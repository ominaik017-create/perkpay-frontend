import { Component } from 'react';

// Catches any rendering/lifecycle error anywhere below it in the tree and
// shows a recoverable screen instead of an uncaught error leaving the
// page blank white with no feedback at all.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('PerkPay crashed:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
          textAlign: 'center', background: '#fff', fontFamily: 'Inter, sans-serif',
        }}>
          <p style={{ fontSize: 40 }}>⚠</p>
          <h2 style={{ marginTop: 12 }}>Something went wrong</h2>
          <p style={{ color: '#6B6B80', marginTop: 8, maxWidth: 320 }}>
            The app hit an unexpected error. Tap below to go back to the home screen.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 20, padding: '12px 24px', borderRadius: 8,
              background: '#5B3FE0', color: '#fff', fontWeight: 600, border: 'none',
            }}
          >
            Reload PerkPay
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
