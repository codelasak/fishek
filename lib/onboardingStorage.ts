// Onboarding state management
const ONBOARDING_KEY = 'fishek_onboarding_completed';
const FAMILY_ONBOARDING_KEY = 'fishek_family_onboarding_completed';

export const onboardingStorage = {
  // Main app onboarding
  isCompleted: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  },

  setCompleted: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ONBOARDING_KEY, 'true');
  },

  reset: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ONBOARDING_KEY);
  },

  // Family mode onboarding
  isFamilyCompleted: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(FAMILY_ONBOARDING_KEY) === 'true';
  },

  setFamilyCompleted: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FAMILY_ONBOARDING_KEY, 'true');
  },

  resetFamily: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(FAMILY_ONBOARDING_KEY);
  },

  // Reset all onboarding
  resetAll: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(FAMILY_ONBOARDING_KEY);
  },
};
