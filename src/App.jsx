import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import InputSPG from "./pages/InputSPG";
import Permit from "./pages/Permit";
import Summary from "./pages/Summary";
import SummaryAllSPG from "./pages/SummaryAllSPG";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/input"
          element={
            <ProtectedRoute>
              <InputSPG />
            </ProtectedRoute>
          }
        />

        <Route
          path="/permit"
          element={
            <ProtectedRoute>
              <Permit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <Summary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/summary-all"
          element={
            <ProtectedRoute>
              <SummaryAllSPG />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}