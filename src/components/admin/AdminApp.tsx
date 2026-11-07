import { useEffect, useState } from 'react';
import { Compass, FileText, Inbox, LayoutDashboard, LogOut, MapPin, MessageSquare, Moon, Settings, Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminDestinations } from '@/components/admin/AdminDestinations';
import { AdminTours } from '@/components/admin/AdminTours';
import { AdminArticles } from '@/components/admin/AdminArticles';
import { AdminInquiries } from '@/components/admin/AdminInquiries';
import { AdminAttractions } from '@/components/admin/AdminAttractions';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminSettings } from '@/components/admin/AdminSettings';

type Section = 'overview' | 'destinations' | 'tours' | 'articles' | 'inquiries' | 'attractions' | 'reviews' | 'settings';

const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'destinations', label: 'Destinations', icon: <MapPin size={18} /> },
  { id: 'tours', label: 'Tours & Experiences', icon: <Compass size={18} /> },
  { id: 'articles', label: 'Blog Management', icon: <FileText size={18} /> },
  { id: 'inquiries', label: 'Booking Inquiries', icon: <Inbox size={18} /> },
  { id: 'attractions', label: 'Attractions', icon: <Star size={18} /> },
  { id: 'reviews', label: 'Reviews', icon: <MessageSquare size={18} /> },
  { id: 'settings', label: 'Business Settings', icon: <Settings size={18} /> },
];

export function AdminApp() {
  const [session, setSession] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { void checkSession(); }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSession(true);
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', data.session.user.id).maybeSingle();
      setIsAdmin(profile?.is_admin === true);
    } else {
      setSession(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(false);
    setIsAdmin(false);
    navigate('/');
  }

  if (session === null) {
    return <div className="grid min-h-screen place-items-center bg-[#f8fcfd]"><Compass className="animate-pulse text-[#1d6685]" size={32} /></div>;
  }

  if (!session || !isAdmin) {
    return <LoginPanel onSignedIn={() => void checkSession()} />;
  }

  const content = (() => {
    switch (section) {
      case 'overview': return <AdminOverview onNavigate={(s) => setSection(s as Section)} />;
      case 'destinations': return <AdminDestinations />;
      case 'tours': return <AdminTours />;
      case 'articles': return <AdminArticles />;
      case 'inquiries': return <AdminInquiries />;
      case 'attractions': return <AdminAttractions />;
      case 'reviews': return <AdminReviews />;
      case 'settings': return <AdminSettings />;
    }
  })();

  return (
    <div className="min-h-screen bg-[#f8fcfd] lg:flex">
      {/* Sidebar - desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-[#d6e7ed] bg-white lg:flex lg:flex-col">
        <SidebarContent section={section} setSection={setSection} onSignOut={handleSignOut} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#102d39]/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-[#d6e7ed] bg-white">
            <button onClick={() => setSidebarOpen(false)} className="absolute right-3 top-3 rounded-full p-2 text-slate-400"><X size={18} /></button>
            <SidebarContent section={section} setSection={(s) => { setSection(s); setSidebarOpen(false); }} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-[#d6e7ed] bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-sm font-extrabold text-[#243746]">
            <Compass size={20} className="text-[#1d6685]" /> WildEast Admin
          </button>
          <button onClick={() => void handleSignOut()} className="text-sm font-bold text-slate-400">Sign out</button>
        </div>

        <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          {content}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ section, setSection, onSignOut }: { section: Section; setSection: (s: Section) => void; onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[#d6e7ed] p-5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d6685] text-white"><Compass size={21} /></span>
        <div>
          <span className="serif block text-[19px] leading-none text-[#243746]">WildEast</span>
          <span className="block text-[8px] font-extrabold uppercase tracking-[.22em] text-[#1d6685]">Admin Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${section === item.id ? 'bg-[#1d6685] text-white' : 'text-slate-600 hover:bg-[#eaf6fa]'}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-[#d6e7ed] p-3">
        <button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-[#a54234] transition hover:bg-[#fff1ef]">
          <LogOut size={18} />
          Logout
        </button>
        <button onClick={() => navigate('/')} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-[#f8fcfd]">
          <Moon size={18} />
          View public site
        </button>
      </div>
    </div>
  );
}

function LoginPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setStatus('');
    const result = await supabase.auth.signInWithPassword({ email, password });
    setSigningIn(false);
    if (result.error) {
      setStatus('Could not sign in with those details.');
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', result.data.user.id).maybeSingle();
    if (profile?.is_admin !== true) {
      setStatus('This account does not have admin access.');
      await supabase.auth.signOut();
      return;
    }
    onSignedIn();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f8fcfd] px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-[#d6e7ed] bg-white p-8 shadow-lg shadow-[#1d6685]/5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#1d6685] text-white"><Compass size={24} /></span>
          <div>
            <span className="serif block text-2xl leading-none text-[#243746]">WildEast</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[.22em] text-[#1d6685]">Admin Dashboard</span>
          </div>
        </div>
        <h1 className="serif mt-7 text-3xl">Team sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">This is a private area. Only authorized administrators can access the dashboard.</p>
        <form onSubmit={signIn} className="mt-6 space-y-4">
          <label className="block text-sm font-extrabold">Email
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#d6e7ed] px-4 py-3 text-sm outline-none focus:border-[#1d6685]" />
          </label>
          <label className="block text-sm font-extrabold">Password
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-[#d6e7ed] px-4 py-3 text-sm outline-none focus:border-[#1d6685]" />
          </label>
          {status && <p className="text-sm font-bold text-[#a54234]">{status}</p>}
          <button disabled={signingIn} className="w-full rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60">
            {signingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <button onClick={() => navigate('/')} className="mt-5 block w-full text-center text-sm font-bold text-slate-400 hover:text-[#1d6685]">
          Back to public site
        </button>
      </div>
    </main>
  );
}
