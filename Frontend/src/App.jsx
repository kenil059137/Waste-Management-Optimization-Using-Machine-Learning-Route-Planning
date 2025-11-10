import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { fetchClusters, fetchRoutes, fetchSummary, fetchModelInfo } from './api';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import PredictForm from './components/PredictForm';
import BinTable from './components/BinTable';
import ModelInfoCard from './components/ModelInfoCard';
import UpdateBinForm from './components/UpdateBinForm';
import ClusterTool from './components/ClusterTool';
import RouteOptimizeForm from './components/RouteOptimizeForm';

// rest of your App component code unchanged


export default function App() {
  const [bins, setBins] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [binsData, routesData, summaryData, modelData] = await Promise.all([
        fetchClusters(),
        fetchRoutes(),
        fetchSummary(),
        fetchModelInfo(),
      ]);
      setBins(binsData);
      setRoutes(routesData);
      setSummary(summaryData);
      setModelInfo(modelData);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (mounted) await load();
    };
    run();
    const id = setInterval(run, 60 * 1000); // refresh every minute
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [load]);

  const content = useMemo(() => {
    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`map-${bins?.length}-${routes?.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <MapView bins={bins} routes={routes} />
        </motion.div>
      </AnimatePresence>
    );
  }, [loading, error, bins, routes]);

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-1 flex">
        <Sidebar summary={summary}>
          <ModelInfoCard info={modelInfo} />
          <UpdateBinForm onUpdated={load} />
          <ClusterTool onClustered={load} />
          <RouteOptimizeForm onOptimized={load} />
          <PredictForm />
          <BinTable bins={bins} />
        </Sidebar>
        <div className="flex-1">{content}</div>
      </div>
      <footer className="p-2 text-center text-xs text-gray-500 border-t bg-white">
        Smart Waste Routing • React + Tailwind + Leaflet
      </footer>
    </div>
  );
}
