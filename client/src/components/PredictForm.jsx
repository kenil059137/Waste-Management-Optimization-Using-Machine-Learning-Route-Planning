import React, { useState } from 'react';
import { predictBin } from '../api';

export default function PredictForm() {
  const [form, setForm] = useState({
    Area_Type: 'Residential',
    Time_Since_Last_Collection: 12,
    Weather: 'Clear'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'Time_Since_Last_Collection' ? Number(value) : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await predictBin(form);
      setResult(res?.is_full);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Predict Bin Full Status</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
        <label className="text-sm">
          <span className="block text-gray-700 mb-1">Area Type</span>
          <select name="Area_Type" value={form.Area_Type} onChange={onChange} className="border rounded p-2 w-full">
            <option>Residential</option>
            <option>Commercial</option>
            <option>Industrial</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-700 mb-1">Time Since Last Collection (hrs)</span>
          <input type="number" step="0.1" name="Time_Since_Last_Collection" value={form.Time_Since_Last_Collection} onChange={onChange} className="border rounded p-2 w-full" />
        </label>
        <label className="text-sm">
          <span className="block text-gray-700 mb-1">Weather</span>
          <select name="Weather" value={form.Weather} onChange={onChange} className="border rounded p-2 w-full">
            <option>Clear</option>
            <option>Rain</option>
            <option>Cloudy</option>
            <option>Windy</option>
          </select>
        </label>
        <button disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60">
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>
      {result != null && (
        <div className="mt-3 text-sm">
          Prediction: <span className={`font-semibold ${result ? 'text-red-600' : 'text-green-600'}`}>{result ? 'Full' : 'Not Full'}</span>
        </div>
      )}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
