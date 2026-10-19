import { useCallback, useEffect, useState } from 'react'

// Load data from the API: { data, error, loading, reload }.
// `data` stays undefined while loading the first time.
export default function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const reload = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, error: null, loading: true }))
    Promise.resolve()
      .then(load)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState({ data: undefined, error, loading: false }))
    return () => { live = false }
  }, [...deps, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, reload }
}
