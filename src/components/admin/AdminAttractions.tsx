import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Attraction, Destination } from '@/lib/types';
import { Field, TextAreaField, SelectField, Checkbox, StatusMessage, RecordList } from '@/components/AdminFields';

const emptyDraft: Record<string, string> = {
  name: '', destination_slug: '', description: '', image_url: '', published: 'true',
};

export function AdminAttractions() {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [attrRes, destRes] = await Promise.all([
      supabase.from('attractions').select('*').order('created_at', { ascending: false }),
      supabase.from('destinations').select('*').order('created_at'),
    ]);
    if (!attrRes.error && attrRes.data) setAttractions(attrRes.data as Attraction[]);
    if (!destRes.error && destRes.data) setDestinations(destRes.data as Destination[]);
  }

  function startNew() { setSelectedId(''); setDraft(emptyDraft); setMessage(''); }

  function choose(attr: Attraction) {
    setSelectedId(attr.id);
    setDraft({
      name: attr.name, destination_slug: attr.destination_slug ?? '', description: attr.description,
      image_url: attr.image_url, published: String(attr.published),
    });
    setMessage('');
  }

  const setField = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage('');
    const isNew = !selectedId;
    const payload = {
      name: draft.name.trim(), destination_slug: draft.destination_slug || null,
      description: draft.description, image_url: draft.image_url, published: draft.published === 'true',
    };
    const result = isNew ? await supabase.from('attractions').insert(payload) : await supabase.from('attractions').update(payload).eq('id', selectedId);
    setSaving(false);
    if (result.error) { setMessage('Could not save.'); return; }
    setMessage(isNew ? 'Attraction created.' : 'Saved.');
    await load();
    if (isNew) startNew();
  }

  async function remove() {
    if (!selectedId || !window.confirm('Delete this attraction?')) return;
    const { error } = await supabase.from('attractions').delete().eq('id', selectedId);
    if (error) { setMessage('Could not delete.'); return; }
    setMessage('Deleted.');
    startNew();
    await load();
  }

  const isEditing = !!selectedId || (selectedId === '' && Object.keys(draft).length > 0);
  const destName = (slug: string) => destinations.find(d => d.slug === slug)?.name ?? '—';

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Sights & landmarks</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Attractions</h1>
        </div>
        <button onClick={() => void startNew()} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white">New attraction</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[.35fr_.65fr]">
        <RecordList
          records={attractions}
          selectedId={selectedId}
          onSelect={(r) => choose(attractions.find(a => a.id === r.id)!)}
          getTitle={(r) => attractions.find(a => a.id === r.id)?.name ?? ''}
          getSubtitle={(r) => {
            const a = attractions.find(x => x.id === r.id);
            return a ? `${destName(a.destination_slug ?? '')} · ${a.published ? 'Published' : 'Draft'}` : '';
          }}
        />

        {isEditing ? (
          <div className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={draft.name ?? ''} onChange={v => setField('name', v)} required />
              <SelectField label="Destination" value={draft.destination_slug ?? ''} onChange={v => setField('destination_slug', v)} options={[['', 'None'], ...destinations.map(d => [d.slug, d.name])]} />
              <Field label="Image URL" value={draft.image_url ?? ''} onChange={v => setField('image_url', v)} />
              <TextAreaField label="Description" value={draft.description ?? ''} onChange={v => setField('description', v)} />
              <Checkbox label="Published" checked={draft.published === 'true'} onChange={v => setField('published', String(v))} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void save()} disabled={saving} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
                {saving ? 'Saving...' : selectedId ? 'Save changes' : 'Create attraction'}
              </button>
              {selectedId && <button onClick={() => void remove()} className="rounded-full border border-[#efc0b8] px-5 py-3 text-sm font-extrabold text-[#a54234]">Delete</button>}
              <StatusMessage message={message} />
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-3xl border border-[#d6e7ed] bg-[#eaf6fa] p-12 text-center">
            <p className="text-sm text-slate-600">Select an attraction to edit, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
