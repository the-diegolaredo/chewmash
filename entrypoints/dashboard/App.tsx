import { useEffect, useState } from 'react';
import { stateRepository } from '../../src/storage/extension';
import type { ChewMashState } from '../../src/storage/state';

export function App() {
  const [state, setState] = useState<ChewMashState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    stateRepository.load()
      .then(next => {
        if (active) setState(next);
      })
      .catch(reason => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Could not read local extension storage.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <header>ChewMash</header>
      <h1>React migration</h1>
      {error ? (
        <p>Storage error: {error}</p>
      ) : !state ? (
        <p>Loading private extension storage…</p>
      ) : (
        <>
          <p>Private extension storage is ready.</p>
          <dl>
            <div>
              <dt>Starting budget</dt>
              <dd>${state.plan.startingBudget.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Transactions</dt>
              <dd>{state.transactions.length}</dd>
            </div>
            <div>
              <dt>Balance snapshots</dt>
              <dd>{state.balanceSnapshots.length}</dd>
            </div>
          </dl>
        </>
      )}
    </main>
  );
}
