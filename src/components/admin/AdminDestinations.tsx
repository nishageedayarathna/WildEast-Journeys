import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Destination } from '@/lib/types';
import { Field, TextAreaField, Checkbox, StatusMessage, RecordList } from '@/components/AdminFields';

const emptyDraft = { slug: '', name: '', eyebrow: '', summary: '', description: '', hero_image: '', highlights: '', published: 'false' };

export function AdminDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState('new');
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data, error } = await supabase.from('destinations').select('*').order('created_at');
    if (!error && data) setDestinations(data as Destination[]);
  }

  function choose(destination: Destination | null) {
    setSelectedId(destination?.id ?? 'new');
    setDraft(destination
      ? { slug: destination.slug, name: destination.name, eyebrow: destination.eyebrow, summary: destination.summary, description: destination.description, hero_image: destination.hero_image, highlights: destination.highlights.join('\n'), published: String(destination.published) }
      : emptyDraft);
    setMessage('');
  }

  const setField = (key: keyof typeof emptyDraft, value: string) => setDraft(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage('');
    const payload = {
      slug: draft.slug.trim().toLowerCase(),
      name: draft.name.trim(),
      eyebrow: draft.eyebrow.trim(),
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      hero_image: draft.hero_image.trim(),
      highlights: draft.highlights.split('\n').map(item => item.trim()).filter(Boolean),
      published: draft.published === 'true',
    };
    const result = selectedId === 'new'
      ? await supabase.from('destinations').insert(payload)
      : await supabase.from('destinations').update(payload).eq('id', selectedId);
    setSaving(false);
    if (result.error) { setMessage('Could not save. Check the slug is unique.'); return; }
    setMessage(selectedId === 'new' ? 'Destination created.' : 'Saved.');
    choose(null);
    await load();
  }

  async function remove() {
    if (selectedId === 'new' || !window.confirm('Delete this destination? Linked tours or articles may prevent deletion.')) return;
    const { error } = await supabase.from('destinations').delete().eq('id', selectedId);
    if (error) { setMessage('Could not delete — linked content may exist.'); return; }
    setMessage('Deleted.');
    choose(null);
    await load();
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Manage places</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Destinations</h1>
        </div>
        <button onClick={() => choose(null)} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white">New destination</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[.4fr_.6fr]">
        <RecordList
          records={destinations}
          selectedId={selectedId}
          onSelect={(r) => choose(destinations.find(d => d.id === r.id) ?? null)}
          getTitle={(r) => destinations.find(d => d.id === r.id)?.name ?? ''}
          getSubtitle={(r) => destinations.find(d => d.id === r.id)?.published ? 'Published' : 'Draft'}
        />

        <div className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={draft.name} onChange={v => setField('name', v)} required />
            <Field label="URL slug" value={draft.slug} onChange={v => setField('slug', v)} required />
            <Field label="Eyebrow label" value={draft.eyebrow} onChange={v => setField('eyebrow', v)} required />
            <Field label="Hero image URL" value={draft.hero_image} onChange={v => setField('hero_image', v)} required />
            <Field label="Short summary" value={draft.summary} onChange={v => setField('summary', v)} required />
            <TextAreaField label="Description" value={draft.description} onChange={v => setField('description', v)} />
            <TextAreaField label="Highlights (one per line)" value={draft.highlights} onChange={v => setField('highlights', v)} />
            <Checkbox label="Published" checked={draft.published === 'true'} onChange={v => setField('published', String(v))} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => void save()} disabled={saving} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
              {saving ? 'Saving...' : selectedId === 'new' ? 'Create destination' : 'Save changes'}
            </button>
            {selectedId !== 'new' && <button onClick={() => void remove()} className="rounded-full border border-[#efc0b8] px-5 py-3 text-sm font-extrabold text-[#a54234]">Delete</button>}
            <StatusMessage message={message} />
          </div>
        </div>
      </div>
    </div>
  );
}
