import React from 'react';

export default function Sidebar({ summary, children }) {
  return (
    <div className="w-full md:w-80 bg-white border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-xl font-semibold">Smart Waste Routing</h1>
        <p className="text-sm text-gray-500">Dashboard</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded p-3">
          <div className="text-xs text-gray-600">Total Bins</div>
          <div className="text-2xl font-bold">{summary?.total_bins ?? '-'}</div>
        </div>
        <div className="bg-blue-50 rounded p-3">
          <div className="text-xs text-gray-600">Total Trucks</div>
          <div className="text-2xl font-bold">{summary?.total_trucks ?? '-'}</div>
        </div>
      </div>
      <div className="p-4 overflow-auto flex-1">
        {children}
      </div>
    </div>
  );
}
