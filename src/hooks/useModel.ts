import { useState, useEffect } from 'react';
import { defaultModel, models } from '@/lib/config';

export function useModel() {
  const getInitialModel = (): string => {
    if (typeof window === 'undefined') {
      console.log('Server-side rendering, returning default model:', defaultModel);
      return defaultModel;
    }
    
    try {
      const savedModel = localStorage.getItem("selectedModel");
      console.log('Initial load - Retrieved model from localStorage:', savedModel ?? '(null)');
      return savedModel ?? defaultModel;
    } catch (error) {
      console.error("Error loading model from localStorage:", error);
      return defaultModel;
    }
  };

  const [selectedModelId, setSelectedModelId] = useState(getInitialModel());

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedModel' && e.newValue) {
        console.log('Storage event detected, updating model from:', selectedModelId, 'to:', e.newValue);
        setSelectedModelId(e.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedModelId]);
  
  // Function to update the model in both localStorage and state
  const updateModel = (modelId: string) => {
    console.log('Setting model to:', modelId);
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedModel", modelId);
    }
    setSelectedModelId(modelId);
  };

  const getModelDetails = () => {
    return {
      id: selectedModelId,
      name: selectedModelId
    };
  };
  
  const getAvailableModels = () => {
    return models;
  };
  
  return {
    selectedModelId,
    selectedModelDetails: getModelDetails(),
    availableModels: getAvailableModels(),
    setSelectedModel: updateModel
  };
} 