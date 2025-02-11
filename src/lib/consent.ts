import { supabase } from './supabase';

export type ConsentType = 'analytics' | 'marketing' | 'essential' | 'third_party';

export interface Consent {
  type: ConsentType;
  consented: boolean;
  lastUpdated: Date;
}

export async function getUserConsents(): Promise<Consent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_consents')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching user consents:', error);
    return [];
  }

  return data.map(consent => ({
    type: consent.consent_type as ConsentType,
    consented: consent.consented,
    lastUpdated: new Date(consent.updated_at)
  }));
}

export async function updateConsent(type: ConsentType, consented: boolean): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_consents')
      .upsert({
        user_id: user.id,
        consent_type: type,
        consented,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(data => data.ip),
        user_agent: navigator.userAgent
      }, {
        onConflict: 'user_id,consent_type'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating consent:', error);
    return false;
  }
}

export async function hasConsent(type: ConsentType): Promise<boolean> {
  const consents = await getUserConsents();
  const consent = consents.find(c => c.type === type);
  return consent?.consented ?? false;
}

// Initialize essential consents for new users
export async function initializeConsents(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Essential consents are always true and required
    await updateConsent('essential', true);
    
    // Initialize other consents as false by default
    await updateConsent('analytics', false);
    await updateConsent('marketing', false);
    await updateConsent('third_party', false);
  } catch (error) {
    console.error('Error initializing consents:', error);
  }
}