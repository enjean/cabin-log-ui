import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VisitsPage from './pages/VisitsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dynamic route with :cabinId parameter */}
        <Route path="/cabins/:cabinId" element={<VisitsPage />} />
        
        {/* Default redirect to Cabin 1 since it's the only one right now */}
        <Route path="/" element={<Navigate to="/cabins/1" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
