import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { BusinessSettings } from '@/lib/types';

type SettingsContextValue = {
  settings: BusinessSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const defaultSettings: BusinessSettings = {
  id: '',
  business_name: 'WildEast Journeys',
  email: 'hello@wildeastjourneys.com',
  phone: '',
  whatsapp_number: '94770000000',
  address: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  booking_instructions: '',
  updated_at: '',
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: false,
  refresh: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings | null>(defaultSettings);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data, error } = await supabase.rpc('get_business_settings').maybeSingle();
    if (!error && data) {
      setSettings(data as BusinessSettings);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
