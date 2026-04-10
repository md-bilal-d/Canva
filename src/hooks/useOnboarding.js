// ============================================================
// useOnboarding — Step-by-step onboarding tutorial state
// ============================================================

import { useState, useCallback, useEffect } from 'react';

const ONBOARDING_KEY = 'onboarding-complete';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome! 🎨',
    description: 'This is your infinite canvas. Pan with Space + Drag, zoom with scroll.',
    target: '.canvas-container',
    placement: 'center',
  },
  {
    id: 'toolbar',
    title: 'Drawing Tools ✏️',
    description: 'Use the toolbar to draw shapes, lines, and sticky notes.',
    target: '.toolbar',
    placement: 'right',
  },
  {
    id: 'share',
    title: 'Share & Collaborate 🔗',
    description: 'Share this URL with your team to collaborate in real-time!',
    target: '.connection-status',
    placement: 'bottom',
  },
  {
    id: 'autosave',
    title: 'Auto-Save ✅',
    description: 'Your drawings are synced and saved automatically in real-time.',
    target: null,
    placement: 'center',
  },
  {
    id: 'ready',
    title: "You're ready! 🎉",
    description: "Let's draw something amazing together.",
    target: null,
    placement: 'center',
  },
];

export default function useOnboarding() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if onboarding was completed before
  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finish
      setActive(false);
      setCurrentStep(0);
      localStorage.setItem(ONBOARDING_KEY, 'true');
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setActive(false);
    setCurrentStep(0);
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const restartTutorial = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCurrentStep(0);
    setActive(true);
  }, []);

  return {
    active,
    currentStep,
    stepData: STEPS[currentStep] || STEPS[0],
    totalSteps: STEPS.length,
    nextStep,
    prevStep,
    skipTutorial,
    restartTutorial,
  };
}
