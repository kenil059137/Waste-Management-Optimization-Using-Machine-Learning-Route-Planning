import React, { useState } from 'react';
import { updateBin } from '../api';

export default function UpdateBinForm({ onUpdated }) {
  const [form, setForm] = useState({ Bin_ID: '', Fill_Level: '', Time_Since_Last_Collection: '', Weather: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null); setOk(null); setLoading(true);
    try {
      const payload = {
        Bin_ID: Number(form.Bin_ID),
        ...(form.Fill_Level !== '' ? { Fill_Level: Number(form.Fill_Level) } : {}),
        ...(form.Time_Since_Last_Collection !== '' ? { Time_Since_Last_Collection: Number(form.Time_Since_Last_Collection) } : {}),
        ...(form.Weather !== '' ? { Weather: form.Weather } : {}),
      };
      await updateBin(payload);
      setOk('Updated');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Update Bin</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 text-sm">
        <input type="number" name="Bin_ID" placeholder="Bin ID" value={form.Bin_ID} onChange={onChange} className="border rounded p-2 col-span-2" required />
        <input type="number" step="0.1" name="Fill_Level" placeholder="Fill % (optional)" value={form.Fill_Level} onChange={onChange} className="border rounded p-2" />
        <input type="number" step="0.1" name="Time_Since_Last_Collection" placeholder="Hours (optional)" value={form.Time_Since_Last_Collection} onChange={onChange} className="border rounded p-2" />
        <select name="Weather" value={form.Weather} onChange={onChange} className="border rounded p-2 col-span-2">
          <option value="">Weather (optional)</option>
          <option>Clear</option>
          <option>Rain</option>
          <option>Cloudy</option>
          <option>Windy</option>
        </select>
        <button disabled={loading} className="bg-emerald-600 text-white rounded px-3 py-2 col-span-2 disabled:opacity-60">{loading ? 'Saving...' : 'Save'}</button>
      </form>
      {ok && <div className="mt-2 text-green-600 text-sm">{ok}</div>}
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
    </div>
  );
}
