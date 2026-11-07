import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tour, Destination } from '@/lib/types';
import { Field, TextAreaField, SelectField, Checkbox, StatusMessage, RecordList } from '@/components/AdminFields';

const emptyDraft: Record<string, string> = {
  slug: '', title: '', destination_slug: '', category: '', summary: '', description: '',
  hero_image: '', gallery: '', duration: '', group_size: '', meeting_point: '', pickup: '', dropoff: '',
  adult_price: '', child_price: '', price: '', itinerary: '', included: '', excluded: '',
  important_info: '', restrictions: '', what_to_bring: '', cancellation_policy: '', published: 'false',
};

export function AdminTours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [tourRes, destRes] = await Promise.all([
      supabase.from('tours').select('*').order('created_at', { ascending: false }),
      supabase.from('destinations').select('*').order('created_at'),
    ]);
    if (!tourRes.error && tourRes.data) setTours(tourRes.data as Tour[]);
    if (!destRes.error && destRes.data) setDestinations(destRes.data as Destination[]);
  }

  function startNew() { setSelectedId(''); setDraft(emptyDraft); setMessage(''); }

  function choose(tour: Tour) {
    setSelectedId(tour.id);
    setDraft({
      slug: tour.slug, title: tour.title, destination_slug: tour.destination_slug, category: tour.category,
      summary: tour.summary, description: tour.description, hero_image: tour.hero_image, duration: tour.duration,
      group_size: tour.group_size ?? '', meeting_point: tour.meeting_point ?? '', pickup: tour.pickup ?? '',
      dropoff: tour.dropoff ?? '', gallery: (tour.gallery ?? []).join('\n'), adult_price: tour.adult_price?.toString() ?? '', child_price: tour.child_price?.toString() ?? '',
      price: tour.price?.toString() ?? '', itinerary: tour.itinerary.join('\n'), included: tour.included.join('\n'),
      excluded: tour.excluded.join('\n'), important_info: tour.important_info.join('\n'), restrictions: tour.restrictions.join('\n'),
      what_to_bring: tour.what_to_bring.join('\n'), cancellation_policy: tour.cancellation_policy ?? '', published: String(tour.published),
    });
    setMessage('');
  }

  const setField = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage('');
    const isNew = !selectedId;
    const payload = {
      slug: draft.slug.trim().toLowerCase(), title: draft.title.trim(), destination_slug: draft.destination_slug,
      category: draft.category.trim(), summary: draft.summary, description: draft.description, hero_image: draft.hero_image,
      duration: draft.duration, group_size: draft.group_size || null, meeting_point: draft.meeting_point || null,
      pickup: draft.pickup || null, dropoff: draft.dropoff || null,
      adult_price: draft.adult_price ? Number(draft.adult_price) : null, child_price: draft.child_price ? Number(draft.child_price) : null,
      price: draft.price ? Number(draft.price) : null,
      gallery: draft.gallery ? draft.gallery.split('\n').map(item => item.trim()).filter(Boolean) : [],
      itinerary: draft.itinerary.split('\n').map(item => item.trim()).filter(Boolean),
      included: draft.included.split('\n').map(item => item.trim()).filter(Boolean),
      excluded: draft.excluded.split('\n').map(item => item.trim()).filter(Boolean),
      important_info: draft.important_info.split('\n').map(item => item.trim()).filter(Boolean),
      restrictions: draft.restrictions.split('\n').map(item => item.trim()).filter(Boolean),
      what_to_bring: draft.what_to_bring.split('\n').map(item => item.trim()).filter(Boolean),
      cancellation_policy: draft.cancellation_policy || null, published: draft.published === 'true',
    };
    const result = isNew ? await supabase.from('tours').insert(payload) : await supabase.from('tours').update(payload).eq('id', selectedId);
    setSaving(false);
    if (result.error) { setMessage('Could not save. Check slug is unique and required fields are filled.'); return; }
    setMessage(isNew ? 'Tour created.' : 'Saved.');
    await load();
    if (isNew) startNew();
  }

  async function remove() {
    if (!selectedId || !window.confirm('Delete this tour?')) return;
    const { error } = await supabase.from('tours').delete().eq('id', selectedId);
    if (error) { setMessage('Could not delete.'); return; }
    setMessage('Deleted.');
    startNew();
    await load();
  }

  const isEditing = !!selectedId || (selectedId === '' && Object.keys(draft).length > 0);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Manage journeys</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Tours & Experiences</h1>
        </div>
        <button onClick={() => void startNew()} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white">New tour</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[.35fr_.65fr]">
        <RecordList
          records={tours}
          selectedId={selectedId}
          onSelect={(r) => choose(tours.find(t => t.id === r.id)!)}
          getTitle={(r) => tours.find(t => t.id === r.id)?.title ?? ''}
          getSubtitle={(r) => tours.find(t => t.id === r.id)?.published ? 'Published' : 'Unpublished'}
        />

        {isEditing ? (
          <div className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" value={draft.title ?? ''} onChange={v => setField('title', v)} required />
              <Field label="URL slug" value={draft.slug ?? ''} onChange={v => setField('slug', v)} required />
              <Field label="Hero image URL" value={draft.hero_image ?? ''} onChange={v => setField('hero_image', v)} required />
              <Field label="Summary" value={draft.summary ?? ''} onChange={v => setField('summary', v)} required />
              <Field label="Category" value={draft.category ?? ''} onChange={v => setField('category', v)} required />
              <SelectField label="Destination" value={draft.destination_slug ?? ''} onChange={v => setField('destination_slug', v)} options={[['', 'Choose destination'], ...destinations.map(d => [d.slug, d.name])]} />
              <Field label="Duration" value={draft.duration ?? ''} onChange={v => setField('duration', v)} required />
              <Field label="Group size" value={draft.group_size ?? ''} onChange={v => setField('group_size', v)} />
              <Field label="Adult price" type="number" value={draft.adult_price ?? ''} onChange={v => setField('adult_price', v)} />
              <Field label="Child price" type="number" value={draft.child_price ?? ''} onChange={v => setField('child_price', v)} />
              <Field label="Price fallback (on request)" type="number" value={draft.price ?? ''} onChange={v => setField('price', v)} />
              <Field label="Meeting point" value={draft.meeting_point ?? ''} onChange={v => setField('meeting_point', v)} />
              <Field label="Pickup" value={draft.pickup ?? ''} onChange={v => setField('pickup', v)} />
              <Field label="Drop-off" value={draft.dropoff ?? ''} onChange={v => setField('dropoff', v)} />
              <TextAreaField label="Gallery image URLs (one per line)" value={draft.gallery ?? ''} onChange={v => setField('gallery', v)} />
              <TextAreaField label="Description" value={draft.description ?? ''} onChange={v => setField('description', v)} />
              <TextAreaField label="Itinerary (one per line)" value={draft.itinerary ?? ''} onChange={v => setField('itinerary', v)} />
              <TextAreaField label="Included (one per line)" value={draft.included ?? ''} onChange={v => setField('included', v)} />
              <TextAreaField label="Excluded (one per line)" value={draft.excluded ?? ''} onChange={v => setField('excluded', v)} />
              <TextAreaField label="Important information" value={draft.important_info ?? ''} onChange={v => setField('important_info', v)} />
              <TextAreaField label="Restrictions" value={draft.restrictions ?? ''} onChange={v => setField('restrictions', v)} />
              <TextAreaField label="What to bring" value={draft.what_to_bring ?? ''} onChange={v => setField('what_to_bring', v)} />
              <TextAreaField label="Cancellation policy" value={draft.cancellation_policy ?? ''} onChange={v => setField('cancellation_policy', v)} />
              <Checkbox label="Published" checked={draft.published === 'true'} onChange={v => setField('published', String(v))} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void save()} disabled={saving} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
                {saving ? 'Saving...' : selectedId ? 'Save changes' : 'Create tour'}
              </button>
              {selectedId && <button onClick={() => void remove()} className="rounded-full border border-[#efc0b8] px-5 py-3 text-sm font-extrabold text-[#a54234]">Delete</button>}
              <StatusMessage message={message} />
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-3xl border border-[#d6e7ed] bg-[#eaf6fa] p-12 text-center">
            <p className="text-sm text-slate-600">Select a tour to edit, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
