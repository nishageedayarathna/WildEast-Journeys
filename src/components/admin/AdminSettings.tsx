import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings';
import { Field, TextAreaField, StatusMessage } from '@/components/AdminFields';

export function AdminSettings() {
  const { refresh } = useSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data, error } = await supabase.from('business_settings').select('*').limit(1).maybeSingle();
    if (!error && data) {
      setSettingsId(data.id);
      setDraft({
        business_name: data.business_name, email: data.email, phone: data.phone,
        whatsapp_number: data.whatsapp_number, address: data.address,
        social_facebook: data.social_facebook, social_instagram: data.social_instagram,
        social_twitter: data.social_twitter, booking_instructions: data.booking_instructions,
      });
    }
  }

  const setField = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage('');
    const payload = {
      business_name: draft.business_name ?? '', email: draft.email ?? '', phone: draft.phone ?? '',
      whatsapp_number: draft.whatsapp_number ?? '', address: draft.address ?? '',
      social_facebook: draft.social_facebook ?? '', social_instagram: draft.social_instagram ?? '',
      social_twitter: draft.social_twitter ?? '', booking_instructions: draft.booking_instructions ?? '',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('business_settings').update(payload).eq('id', settingsId);
    setSaving(false);
    if (error) { setMessage('Could not save settings.'); return; }
    setMessage('Settings saved.');
    await refresh();
  }

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Configuration</p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">Business Settings</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">These values appear across the public website in the contact page, footer, and inquiry forms.</p>
      </div>

      <div className="max-w-2xl rounded-3xl border border-[#d6e7ed] bg-white p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" value={draft.business_name ?? ''} onChange={v => setField('business_name', v)} />
          <Field label="Email address" type="email" value={draft.email ?? ''} onChange={v => setField('email', v)} />
          <Field label="Phone number" value={draft.phone ?? ''} onChange={v => setField('phone', v)} />
          <Field label="WhatsApp number (digits only)" value={draft.whatsapp_number ?? ''} onChange={v => setField('whatsapp_number', v)} />
          <Field label="Address" value={draft.address ?? ''} onChange={v => setField('address', v)} />
          <Field label="Facebook URL" value={draft.social_facebook ?? ''} onChange={v => setField('social_facebook', v)} />
          <Field label="Instagram URL" value={draft.social_instagram ?? ''} onChange={v => setField('social_instagram', v)} />
          <Field label="Twitter / X URL" value={draft.social_twitter ?? ''} onChange={v => setField('social_twitter', v)} />
          <TextAreaField label="Booking contact instructions" value={draft.booking_instructions ?? ''} onChange={v => setField('booking_instructions', v)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => void save()} disabled={saving} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {saving ? 'Saving...' : 'Save settings'}
          </button>
          <StatusMessage message={message} />
        </div>
      </div>
    </div>
  );
}
