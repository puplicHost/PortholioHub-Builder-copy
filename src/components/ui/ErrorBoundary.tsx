'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { tStatic } from '@/components/I18nProvider'


interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-danger)]/10">
            <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            {tStatic('Something went wrong')}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-6">
            {tStatic('An unexpected error occurred. Please try again.')}
          </p>
          <Button variant="secondary" onClick={this.handleRetry}>
            {tStatic('Try again')}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
