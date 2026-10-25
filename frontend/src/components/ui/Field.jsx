export default function Field({ id, label, error, hint, options, ...props }) {
  const cls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm aria-[invalid=true]:border-rose-500";
  const a = { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-e` : undefined, className: cls };
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {options ? (
        <select {...a} {...props}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : <input {...a} {...props} />}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-e`} className="mt-1 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
