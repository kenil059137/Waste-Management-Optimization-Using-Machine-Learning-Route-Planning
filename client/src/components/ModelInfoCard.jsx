import React from 'react';

export default function ModelInfoCard({ info }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Model Info</h2>
      <div className="text-sm border rounded p-3 bg-gray-50">
        <div><b>Classification Model:</b> {info?.classification_model || '-'}</div>
        <div><b>Clustering Model:</b> {info?.clustering_model || '-'}</div>
        <div><b>Rows:</b> {info?.data_rows ?? '-'}</div>
      </div>
    </div>
  );
}
