import React from 'react';
import { registerRootComponent } from 'expo';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(() => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
));
