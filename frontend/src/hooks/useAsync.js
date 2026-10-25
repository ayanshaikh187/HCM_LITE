import { useCallback, useEffect, useState } from "react";

export default function useAsync(fn) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => setState({ data: null, loading: false, error: e.message || "Something went wrong" }));
  }, [fn]);
  useEffect(run, [run]);
  return { ...state, reload: run };
}
