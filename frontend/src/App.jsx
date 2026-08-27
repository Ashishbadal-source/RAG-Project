import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Experiments from './pages/Experiments';
import RunExperiment from './pages/RunExperiment';
import RunningExperiment from './pages/RunningExperiment';
import ExperimentResult from './pages/ExperimentResult';
import Leaderboard from './pages/Leaderboard';
import RetrieverAnalysis from './pages/RetrieverAnalysis';
import LLMAnalysis from './pages/LLMAnalysis';
import QueryExplorer from './pages/QueryExplorer';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="experiments" element={<Experiments />} />
          <Route path="run" element={<RunExperiment />} />
          <Route path="experiments/:id/live" element={<RunningExperiment />} />
          <Route path="experiments/:id/results" element={<ExperimentResult />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="retrievers" element={<RetrieverAnalysis />} />
          <Route path="llms" element={<LLMAnalysis />} />
          <Route path="queries" element={<QueryExplorer />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
