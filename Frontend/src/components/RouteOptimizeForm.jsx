import React, { useState } from 'react';
import { optimizeRoutes } from '../api';

export default function RouteOptimizeForm({ onOptimized }) {
  const [form, setForm] = useState({ depot_lat: 21.1702, depot_lon: 72.8311, num_trucks_per_area: 2, save_maps: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name.includes('num') ? Number(value) : Number.isNaN(Number(value)) ? value : Number(value)) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await optimizeRoutes({
        depot_lat: Number(form.depot_lat),
        depot_lon: Number(form.depot_lon),
        num_trucks_per_area: Number(form.num_trucks_per_area),
        save_maps: !!form.save_maps,
      });
      if (onOptimized) onOptimized();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Route Optimization</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3 text-sm">
        <input type="number" step="0.0001" name="depot_lat" placeholder="Depot Lat" value={form.depot_lat} onChange={onChange} className="border rounded p-2" />
        <input type="number" step="0.0001" name="depot_lon" placeholder="Depot Lon" value={form.depot_lon} onChange={onChange} className="border rounded p-2" />
        <input type="number" min="1" name="num_trucks_per_area" placeholder="Trucks/Area" value={form.num_trucks_per_area} onChange={onChange} className="border rounded p-2 col-span-2" />
        <label className="flex items-center gap-2 text-xs col-span-2">
          <input type="checkbox" name="save_maps" checked={form.save_maps} onChange={onChange} />
          Save Folium maps on backend
        </label>
        <button disabled={loading} className="bg-indigo-600 text-white rounded px-3 py-2 col-span-2 disabled:opacity-60">{loading ? 'Optimizing...' : 'Optimize'}</button>
      </form>
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
    </div>
  );
}
