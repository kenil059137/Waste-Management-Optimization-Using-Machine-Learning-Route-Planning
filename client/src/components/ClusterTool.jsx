import React, { useState } from 'react';
import { clusterBins } from '../api';

export default function ClusterTool({ onClustered }) {
  const [num, setNum] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await clusterBins({ num_trucks: Number(num) });
      if (onClustered) onClustered();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Clustering Tool</h2>
      <form onSubmit={onSubmit} className="flex items-center gap-2 text-sm">
        <input type="number" min="1" value={num} onChange={(e)=>setNum(e.target.value)} className="border rounded p-2 w-24" />
        <button disabled={loading} className="bg-purple-600 text-white rounded px-3 py-2 disabled:opacity-60">{loading ? 'Clustering...' : 'Cluster'}</button>
      </form>
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
    </div>
  );
}
