import { useState, useEffect } from 'react';

export default function useDashboardLoader() {
  const [loadingState, setLoadingState] = useState({
    isAuthenticating: true,
    isLoadingData: true,
    isInitializing: true
  });

  useEffect(() => {
    // Simulate authentication check
    const authCheck = async () => {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      setLoadingState(prev => ({ ...prev, isAuthenticating: false }));
    };

    // Simulate data loading
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate data loading
      setLoadingState(prev => ({ ...prev, isLoadingData: false }));
    };

    authCheck();
    loadData();
  }, []);

  useEffect(() => {
    if (!loadingState.isAuthenticating && !loadingState.isLoadingData) {
      const timer = setTimeout(() => {
        setLoadingState(prev => ({ ...prev, isInitializing: false }));
      }, 300); // Minimum show time for smooth transition
      return () => clearTimeout(timer);
    }
  }, [loadingState.isAuthenticating, loadingState.isLoadingData]);

  return loadingState.isInitializing;
}