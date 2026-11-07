import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Inquiry } from '@/lib/types';

const statusOptions = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['confirmed', 'Confirmed'],
  ['closed', 'Closed'],
];

const statusColors: Record<string, string> = {
  new: 'bg-[#eaf6fa] text-[#1d6685]',
  contacted: 'bg-[#fff4e0] text-[#a06a00]',
  confirmed: 'bg-[#dff3e9] text-[#23734c]',
  closed: 'bg-[#f0f0f0] text-slate-500',
};

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (data) setInquiries(data as Inquiry[]);
    setLoading(false);
  }

  const [actionError, setActionError] = useState('');

  async function updateStatus(id: string, status: string) {
    setActionError('');
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id);
    if (error) { setActionError('Could not update inquiry status.'); return; }
    setInquiries(inquiries.map(item => item.id === id ? { ...item, status } : item));
  }

  const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
  const selected = inquiries.find(i => i.id === selectedId);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Customer requests</p>
          <h1 className="serif mt-2 text-4xl md:text-5xl">Booking Inquiries</h1>
        </div>
        <button onClick={() => void load()} className="rounded-full bg-[#eaf6fa] px-5 py-3 text-sm font-extrabold text-[#1d6685]">Refresh</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {['all', ...statusOptions.map(s => s[0])].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-extrabold capitalize ${filter === f ? 'bg-[#1d6685] text-white' : 'bg-white text-[#1d6685] border border-[#d6e7ed]'}`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {actionError && <p className="mb-4 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#a54234]">{actionError}</p>}

      <div className="grid gap-8 lg:grid-cols-[.55fr_.45fr]">
        <div className="overflow-x-auto rounded-3xl border border-[#d6e7ed] bg-white">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#d6e7ed] text-xs uppercase tracking-[.12em] text-slate-400">
                <th className="p-4">Guest</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer border-b border-[#edf4f6] transition hover:bg-[#f8fcfd] ${selectedId === item.id ? 'bg-[#eaf6fa]' : ''}`}
                >
                  <td className="p-4">
                    <p className="font-extrabold">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </td>
                  <td className="p-4">{item.destination}</td>
                  <td className="p-4 text-slate-500">{item.travel_date ?? '—'}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColors[item.status] ?? statusColors.new}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center text-sm text-slate-500">{loading ? 'Loading...' : 'No inquiries found.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <div className="rounded-3xl border border-[#d6e7ed] bg-white p-6">
            <h2 className="serif text-2xl">{selected.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{selected.email}</p>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                <span className="text-slate-400">Destination</span>
                <span className="font-bold">{selected.destination}</span>
              </div>
              {selected.tour && (
                <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                  <span className="text-slate-400">Tour</span>
                  <span className="font-bold">{selected.tour}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                <span className="text-slate-400">Travel date</span>
                <span className="font-bold">{selected.travel_date ?? 'Not specified'}</span>
              </div>
              <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                <span className="text-slate-400">Travellers</span>
                <span className="font-bold">{selected.travellers} ({selected.adults} adults, {selected.children} children)</span>
              </div>
              {selected.tour_option && (
                <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                  <span className="text-slate-400">Option</span>
                  <span className="font-bold">{selected.tour_option}</span>
                </div>
              )}
              <div className="border-b border-[#edf4f6] pb-3">
                <p className="text-slate-400">Message</p>
                <p className="mt-2 leading-6 text-slate-700">{selected.message}</p>
              </div>
              <div className="flex justify-between border-b border-[#edf4f6] pb-3">
                <span className="text-slate-400">Received</span>
                <span className="font-bold">{new Date(selected.created_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-extrabold">Update status</label>
              <select
                value={selected.status}
                onChange={e => void updateStatus(selected.id, e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#d6e7ed] bg-white px-4 py-3 text-sm outline-none"
              >
                {statusOptions.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>

            <p className="mt-4 rounded-xl bg-[#eaf6fa] px-4 py-3 text-xs leading-5 text-slate-600">
              An inquiry is a request for availability, not a confirmed booking. Confirm the status only after personally verifying details with the customer.
            </p>
          </div>
        ) : (
          <div className="grid place-items-center rounded-3xl border border-[#d6e7ed] bg-[#eaf6fa] p-12 text-center">
            <p className="text-sm text-slate-600">Select an inquiry to view full details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
