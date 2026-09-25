import { Component, type ReactNode } from 'react'

/** Renders `fallback` if anything below throws (e.g. an asset fails to load), and logs why. */
export class SafeBoundary extends Component<{ fallback: ReactNode; label: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    console.warn(`[${this.props.label}] failed, using fallback.`, error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
