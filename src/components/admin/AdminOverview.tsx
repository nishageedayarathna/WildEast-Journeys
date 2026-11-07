import { useEffect, useState } from 'react';
import { ArrowUpRight, Calendar, Compass, FileText, Inbox, MapPin, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Destination, Tour, Article, Inquiry, Attraction, Review } from '@/lib/types';
import { navigate } from '@/lib/router';

export function AdminOverview({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [counts, setCounts] = useState({ destinations: 0, tours: 0, articles: 0, inquiries: 0, attractions: 0, reviews: 0 });
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [dest, tour, art, inq, attr, rev] = await Promise.all([
      supabase.from('destinations').select('id', { count: 'exact', head: true }),
      supabase.from('tours').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('published', true),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }),
      supabase.from('attractions').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ]);
    if (dest.error || tour.error || art.error || inq.error || attr.error || rev.error) {
      setLoadError(true);
      setLoading(false);
      return;
    }
    setCounts({
      destinations: dest.count ?? 0,
      tours: tour.count ?? 0,
      articles: art.count ?? 0,
      inquiries: inq.count ?? 0,
      attractions: attr.count ?? 0,
      reviews: rev.count ?? 0,
    });
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setRecentInquiries(data as Inquiry[]);
    setLoading(false);
  }

  const cards = [
    { label: 'Destinations', value: counts.destinations, icon: <MapPin size={20} />, section: 'destinations' },
    { label: 'Tours & Experiences', value: counts.tours, icon: <Compass size={20} />, section: 'tours' },
    { label: 'Published Articles', value: counts.articles, icon: <FileText size={20} />, section: 'articles' },
    { label: 'Booking Inquiries', value: counts.inquiries, icon: <Inbox size={20} />, section: 'inquiries' },
  ];

  const statusColors: Record<string, string> = {
    new: 'bg-[#eaf6fa] text-[#1d6685]',
    contacted: 'bg-[#fff4e0] text-[#a06a00]',
    confirmed: 'bg-[#dff3e9] text-[#23734c]',
    closed: 'bg-[#f0f0f0] text-slate-500',
  };

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow">Dashboard</p>
        <h1 className="serif mt-2 text-4xl md:text-5xl">Overview</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.section)}
            className="group rounded-3xl border border-[#d6e7ed] bg-white p-6 text-left transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eaf6fa] text-[#1d6685]">{card.icon}</span>
              <ArrowUpRight className="text-slate-300 transition group-hover:text-[#1d6685]" size={18} />
            </div>
            <p className="serif mt-5 text-4xl">{loading ? '—' : card.value}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-[#d6e7ed] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2 className="serif mt-2 text-3xl">Latest inquiries</h2>
          </div>
          <button onClick={() => onNavigate('inquiries')} className="text-sm font-extrabold text-[#1d6685]">
            View all <ArrowUpRight className="ml-1 inline" size={14} />
          </button>
        </div>
        {loadError ? (
          <p className="mt-6 text-sm text-[#a54234]">Could not load dashboard data. Check your connection and try again.</p>
        ) : recentInquiries.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">No inquiries yet.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {recentInquiries.map(inq => (
              <button
                key={inq.id}
                onClick={() => onNavigate('inquiries')}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#edf4f6] p-4 text-left transition hover:bg-[#f8fcfd]"
              >
                <div>
                  <p className="font-extrabold text-sm">{inq.name}</p>
                  <p className="text-xs text-slate-500">{inq.destination}{inq.tour ? ` · ${inq.tour}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{new Date(inq.created_at).toLocaleDateString()}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[inq.status] ?? statusColors.new}`}>{inq.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
