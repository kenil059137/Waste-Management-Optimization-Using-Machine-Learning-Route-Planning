import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';


import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function colorForFill(fill) {
  if (fill == null) return '#888';
  if (fill < 50) return '#16a34a'; // green
  if (fill <= 80) return '#f59e0b'; // orange
  return '#dc2626'; // red
}

const truckColors = [
  '#2563eb', '#7c3aed', '#059669', '#ea580c', '#9333ea', '#0ea5e9', '#14b8a6', '#f43f5e'
];

export default function MapView({ bins, routes }) {
  const position = [21.1702, 72.8311]; // fallback center

  return (
    <MapContainer center={position} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routes && routes.map((r, idx) => {
        const color = truckColors[idx % truckColors.length];
        let coords = r.route_coords || [];
        // Support both [[lat,lon], ...] and [{lat, lon}, ...]
        coords = coords.map(c => Array.isArray(c) ? c : [c.lat, c.lon]);
        return (
          <Polyline key={`route-${idx}`} positions={coords} pathOptions={{ color, weight: 4, opacity: 0.8 }} />
        );
      })}

      {bins && bins.map((b) => {
        const fill = b['Fill_Level(%)'];
        const lat = b.Latitude;
        const lon = b.Longitude;
        if (lat == null || lon == null) return null;
        return (
          <CircleMarker key={b.Bin_ID}
            center={[lat, lon]}
            radius={8}
            pathOptions={{ color: colorForFill(fill), fillColor: colorForFill(fill), fillOpacity: 0.8 }}
          >
            <Popup>
              <div className="text-sm">
                <div><b>Bin:</b> {b.Bin_ID}</div>
                <div><b>Fill:</b> {fill}%</div>
                <div><b>Area:</b> {b.Area_Type}</div>
                {b.Truck_Assignment != null && (<div><b>Truck:</b> {b.Truck_Assignment}</div>)}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
