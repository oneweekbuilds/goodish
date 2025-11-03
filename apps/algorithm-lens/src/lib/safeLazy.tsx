import React from "react"



function first<T>(fns: Array<() => Promise<T>>): Promise<T> {

  return new Promise((resolve, reject) => {

    let pending = fns.length

    let lastErr: any

    fns.forEach(fn => {

      fn().then(resolve).catch(err => {

        lastErr = err

        if (--pending === 0) reject(lastErr)

      })

    })

  })

}



export function safeLazy<T extends React.ComponentType<any>>(

  loaders: Array<() => Promise<{ default: T }>>,

  Fallback: React.ComponentType<any>

): React.LazyExoticComponent<T> | React.ComponentType<any> {

  const LazyComp = React.lazy(() => first(loaders))

  return (props: any) =>

    (

      <React.Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-steel/80">Loading…</div>}>

        <ErrorBoundary fallback={<Fallback {...props} />}>

          <LazyComp {...props} />

        </ErrorBoundary>

      </React.Suspense>

    ) as any

}



type EBProps = { fallback: React.ReactNode, children: React.ReactNode }

class ErrorBoundary extends React.Component<EBProps, { hasError: boolean }> {

  constructor(props: EBProps) { super(props); this.state = { hasError: false } }

  static getDerivedStateFromError() { return { hasError: true } }

  render() { return this.state.hasError ? this.props.fallback : this.props.children }

}

