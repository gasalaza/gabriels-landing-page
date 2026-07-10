import './styles/global.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './Home';
import { AdminPage } from './admin/AdminPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
