import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Review, Tour } from '@/lib/types';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [revRes, tourRes] = await Promise.all([
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('tours').select('id,title').order('created_at'),
    ]);
    if (!revRes.error && revRes.data) setReviews(revRes.data as Review[]);
    if (!tourRes.error && tourRes.data) setTours(tourRes.data as Tour[]);
    setLoading(false);
  }

  const [actionError, setActionError] = useState('');

  async function toggleApproval(id: string, approved: boolean) {
    setActionError('');
    const { error } = await supabase.from('reviews').update({ approved }).eq('id', id);
    if (error) { setActionError('Could not update review status.'); return; }
    setReviews(reviews.map(r => r.id === id ? { ...r, approved } : r));
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this review?')) return;
    setActionError('');
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) { setActionError('Could not delete review.'); return; }
    setReviews(reviews.filter(r => r.id !== id));
  }

  const tourTitle = (id: string) => tours.find(t => t.id === id)?.title ?? 'Unknown tour';
  const filtered = filter === 'all' ? reviews : filter === 'pending' ? reviews.filter(r => !r.approved) : reviews.filter(r => r.approved);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Guest feedback</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Reviews</h1>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold capitalize ${filter === f ? 'bg-[#1d6685] text-white' : 'bg-white text-[#1d6685] border border-[#d6e7ed]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {actionError && <p className="mb-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#a54234]">{actionError}</p>}

      {filtered.length === 0 ? (
        <div className="grid place-items-center rounded-3xl border border-[#d6e7ed] bg-[#eaf6fa] p-12 text-center">
          <p className="text-sm text-slate-600">{loading ? 'Loading...' : 'No reviews in this category.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => (
            <div key={review.id} className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 text-[#1d6685]">
                      {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                    </div>
                    <span className="text-xs font-extrabold text-slate-400">{review.rating}/5</span>
                  </div>
                  <p className="mt-2 font-extrabold">{review.reviewer_name}</p>
                  <p className="text-xs text-slate-500">on {tourTitle(review.tour_id)} · {new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${review.approved ? 'bg-[#dff3e9] text-[#23734c]' : 'bg-[#fff4e0] text-[#a06a00]'}`}>
                  {review.approved ? 'Approved' : 'Pending'}
                </span>
              </div>
              <p className="mt-4 leading-7 text-slate-600">"{review.comment}"</p>
              <div className="mt-5 flex gap-3">
                {!review.approved && (
                  <button onClick={() => void toggleApproval(review.id, true)} className="rounded-full bg-[#23734c] px-4 py-2 text-sm font-extrabold text-white">
                    Approve
                  </button>
                )}
                {review.approved && (
                  <button onClick={() => void toggleApproval(review.id, false)} className="rounded-full border border-[#d6e7ed] px-4 py-2 text-sm font-extrabold text-[#1d6685]">
                    Unpublish
                  </button>
                )}
                <button onClick={() => void remove(review.id)} className="rounded-full border border-[#efc0b8] px-4 py-2 text-sm font-extrabold text-[#a54234]">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
