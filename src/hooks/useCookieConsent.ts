
import React, { useState, useEffect } from 'react';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'farmapro_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'farmapro_cookie_preferences';

export const useCookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Siempre activadas
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    console.log('useCookieConsent - useEffect running');
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    
    console.log('useCookieConsent - hasConsent from localStorage:', hasConsent);
    console.log('useCookieConsent - savedPreferences:', savedPreferences);
    
    if (!hasConsent) {
      console.log('useCookieConsent - No consent found, showing banner');
      setShowBanner(true);
    } else {
      console.log('useCookieConsent - Consent found, not showing banner');
    }
    
    if (savedPreferences) {
      console.log('useCookieConsent - Loading saved preferences');
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const acceptAll = () => {
    console.log('useCookieConsent - acceptAll called');
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(allAccepted));
    setShowBanner(false);
    setForceShow(false);
    console.log('useCookieConsent - acceptAll completed');
  };

  const acceptNecessary = () => {
    console.log('useCookieConsent - acceptNecessary called');
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setPreferences(necessaryOnly);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(necessaryOnly));
    setShowBanner(false);
    setForceShow(false);
    console.log('useCookieConsent - acceptNecessary completed');
  };

  const savePreferences = (newPreferences: CookiePreferences) => {
    console.log('useCookieConsent - savePreferences called with:', newPreferences);
    const finalPreferences = { ...newPreferences, necessary: true };
    setPreferences(finalPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(finalPreferences));
    setShowBanner(false);
    setForceShow(false);
    console.log('useCookieConsent - savePreferences completed');
  };

  const openSettings = () => {
    console.log('useCookieConsent - openSettings called - forcing banner to show');
    setForceShow(true);
    setShowBanner(true);
  };

  const closeBanner = () => {
    console.log('useCookieConsent - closeBanner called');
    setShowBanner(false);
    setForceShow(false);
  };

  const hasConsent = () => {
    const result = localStorage.getItem(COOKIE_CONSENT_KEY) === 'true';
    console.log('useCookieConsent - hasConsent check result:', result);
    return result;
  };

  // El banner debe mostrarse si no hay consentimiento O si se ha forzado a mostrar
  const shouldShowBanner = showBanner || forceShow;

  console.log('useCookieConsent - Current state:', {
    showBanner,
    forceShow,
    shouldShowBanner,
    preferences,
    hasConsent: hasConsent()
  });

  return {
    showBanner: shouldShowBanner,
    preferences,
    acceptAll,
    acceptNecessary,
    savePreferences,
    openSettings,
    hasConsent,
    setShowBanner: closeBanner,
  };
};
