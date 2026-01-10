import React from 'react';
import CaffeineCalculator from './components/CaffeineCalculator';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <CaffeineCalculator />
    </ErrorBoundary>
  );
}

export default App;
