import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import GpuLibrary from "@/pages/GpuLibrary";
import DriverDetail from "@/pages/DriverDetail";
import VersionCompare from "@/pages/VersionCompare";
import DownloadHistory from "@/pages/DownloadHistory";
import CompatibilityGuide from "@/pages/CompatibilityGuide";
import Feedback from "@/pages/Feedback";
import AdminReview from "@/pages/AdminReview";
import { useAppStore } from "@/store/appStore";

function AppInit() {
  const fetchFavorites = useAppStore((s) => s.fetchFavorites);
  const fetchDownloads = useAppStore((s) => s.fetchDownloads);
  useEffect(() => {
    fetchFavorites();
    fetchDownloads();
  }, [fetchFavorites, fetchDownloads]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AppInit />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gpus" element={<GpuLibrary />} />
          <Route path="/driver/:id" element={<DriverDetail />} />
          <Route path="/compare" element={<VersionCompare />} />
          <Route path="/downloads" element={<DownloadHistory />} />
          <Route path="/compatibility" element={<CompatibilityGuide />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/admin" element={<AdminReview />} />
        </Route>
        <Route path="*" element={<div className="text-center py-20 text-slate-400">页面不存在</div>} />
      </Routes>
    </Router>
  );
}
