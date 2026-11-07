export function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm font-extrabold">
      {label}
      <input
        required={required}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-[#d6e7ed] px-4 py-3 text-sm outline-none focus:border-[#1d6685]"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="block text-sm font-extrabold sm:col-span-2">
      {label}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="mt-2 w-full resize-y rounded-2xl border border-[#d6e7ed] px-4 py-3 text-sm outline-none focus:border-[#1d6685]"
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="block text-sm font-extrabold">
      {label}
      <div className="relative mt-2 flex items-center rounded-2xl bg-[#f2f8fa] px-4">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent py-3 pr-5 text-sm font-bold outline-none"
        >
          {options.map(([v, lbl]) => (
            <option key={v} value={v}>{lbl}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 text-[#1d6685]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </label>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm font-extrabold sm:col-span-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[#d6e7ed]"
      />
      {label}
    </label>
  );
}

export function SaveButton({ saving, createLabel, saveLabel }: { saving: boolean; createLabel: string; saveLabel: string }) {
  return (
    <button
      disabled={saving}
      className="rounded-full bg-[#1d6685] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
    >
      {saving ? 'Saving...' : saveLabel}
    </button>
  );
}

export function DeleteButton({ onDelete, label = 'Delete' }: { onDelete: () => void; label?: string }) {
  return (
    <button
      onClick={onDelete}
      className="rounded-full border border-[#efc0b8] px-5 py-3 text-sm font-extrabold text-[#a54234]"
    >
      {label}
    </button>
  );
}

export function StatusMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p className="self-center text-sm font-bold text-[#1d6685]">{message}</p>;
}

export function RecordList({ records, selectedId, onSelect, getTitle, getSubtitle }: {
  records: Array<{ id: string }>;
  selectedId: string;
  onSelect: (record: { id: string }) => void;
  getTitle: (record: { id: string }) => string;
  getSubtitle?: (record: { id: string }) => string;
}) {
  if (records.length === 0) return <p className="text-sm text-slate-500">No records yet.</p>;
  return (
    <div className="space-y-3">
      {records.map(record => (
        <button
          key={record.id}
          onClick={() => onSelect(record)}
          className={`w-full rounded-2xl border p-4 text-left ${selectedId === record.id ? 'border-[#1d6685] bg-[#eaf6fa]' : 'border-[#d6e7ed]'}`}
        >
          <p className="font-extrabold">{getTitle(record)}</p>
          {getSubtitle && <p className="mt-1 text-xs text-slate-500">{getSubtitle(record)}</p>}
        </button>
      ))}
    </div>
  );
}
