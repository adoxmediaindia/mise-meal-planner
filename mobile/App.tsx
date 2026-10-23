import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { PlanProvider } from './src/context/PlanContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </PlanProvider>
    </AuthProvider>
  );
}
