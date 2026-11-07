import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Article, Destination } from '@/lib/types';
import { Field, TextAreaField, SelectField, Checkbox, StatusMessage, RecordList } from '@/components/AdminFields';

const emptyDraft: Record<string, string> = {
  slug: '', title: '', category: '', destination_slug: '', summary: '', body: '',
  hero_image: '', read_time: '', published_at: '', published: 'false',
};

export function AdminArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [artRes, destRes] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('destinations').select('*').order('created_at'),
    ]);
    if (!artRes.error && artRes.data) setArticles(artRes.data as Article[]);
    if (!destRes.error && destRes.data) setDestinations(destRes.data as Destination[]);
  }

  function startNew() { setSelectedId(''); setDraft(emptyDraft); setMessage(''); }

  function choose(article: Article) {
    setSelectedId(article.id);
    setDraft({
      slug: article.slug, title: article.title, category: article.category,
      destination_slug: article.destination_slug ?? '', summary: article.summary, body: article.body,
      hero_image: article.hero_image, read_time: article.read_time, published_at: article.published_at ?? '',
      published: String(article.published),
    });
    setMessage('');
  }

  const setField = (key: string, value: string) => setDraft(current => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setMessage('');
    const isNew = !selectedId;
    const payload = {
      slug: draft.slug.trim().toLowerCase(), title: draft.title.trim(), category: draft.category.trim(),
      destination_slug: draft.destination_slug || null, summary: draft.summary, body: draft.body,
      hero_image: draft.hero_image, read_time: draft.read_time || '5 min read',
      published_at: draft.published_at || null, published: draft.published === 'true',
    };
    const result = isNew ? await supabase.from('articles').insert(payload) : await supabase.from('articles').update(payload).eq('id', selectedId);
    setSaving(false);
    if (result.error) { setMessage('Could not save. Check slug is unique.'); return; }
    setMessage(isNew ? 'Article created.' : 'Saved.');
    await load();
    if (isNew) startNew();
  }

  async function remove() {
    if (!selectedId || !window.confirm('Delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', selectedId);
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
          <p className="eyebrow">Travel journal</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Blog Management</h1>
        </div>
        <button onClick={() => void startNew()} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white">New article</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[.35fr_.65fr]">
        <RecordList
          records={articles}
          selectedId={selectedId}
          onSelect={(r) => choose(articles.find(a => a.id === r.id)!)}
          getTitle={(r) => articles.find(a => a.id === r.id)?.title ?? ''}
          getSubtitle={(r) => articles.find(a => a.id === r.id)?.published ? 'Published' : 'Unpublished'}
        />

        {isEditing ? (
          <div className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" value={draft.title ?? ''} onChange={v => setField('title', v)} required />
              <Field label="URL slug" value={draft.slug ?? ''} onChange={v => setField('slug', v)} required />
              <Field label="Hero image URL" value={draft.hero_image ?? ''} onChange={v => setField('hero_image', v)} required />
              <Field label="Summary" value={draft.summary ?? ''} onChange={v => setField('summary', v)} required />
              <Field label="Category" value={draft.category ?? ''} onChange={v => setField('category', v)} required />
              <SelectField label="Destination link" value={draft.destination_slug ?? ''} onChange={v => setField('destination_slug', v)} options={[['', 'None'], ...destinations.map(d => [d.slug, d.name])]} />
              <Field label="Read time" value={draft.read_time ?? ''} onChange={v => setField('read_time', v)} />
              <Field label="Publication date" type="date" value={draft.published_at ?? ''} onChange={v => setField('published_at', v)} />
              <TextAreaField label="Article body" value={draft.body ?? ''} onChange={v => setField('body', v)} rows={10} />
              <Checkbox label="Published" checked={draft.published === 'true'} onChange={v => setField('published', String(v))} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => void save()} disabled={saving} className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
                {saving ? 'Saving...' : selectedId ? 'Save changes' : 'Create article'}
              </button>
              {selectedId && <button onClick={() => void remove()} className="rounded-full border border-[#efc0b8] px-5 py-3 text-sm font-extrabold text-[#a54234]">Delete</button>}
              <StatusMessage message={message} />
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-3xl border border-[#d6e7ed] bg-[#eaf6fa] p-12 text-center">
            <p className="text-sm text-slate-600">Select an article to edit, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
