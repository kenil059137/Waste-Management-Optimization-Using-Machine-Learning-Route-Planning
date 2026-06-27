import React from 'react';

export default function BinTable({ bins }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Bin Fill Levels</h2>
      <div className="overflow-auto max-h-80 border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left p-2">Bin ID</th>
              <th className="text-left p-2">Area</th>
              <th className="text-left p-2">Truck</th>
              <th className="text-left p-2">Fill %</th>
            </tr>
          </thead>
          <tbody>
            {(bins || []).map((b) => (
              <tr key={b.Bin_ID} className="border-t">
                <td className="p-2">{b.Bin_ID}</td>
                <td className="p-2">{b.Area_Type}</td>
                <td className="p-2">{b.Truck_Assignment ?? '-'}</td>
                <td className="p-2">{b['Fill_Level(%)']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
