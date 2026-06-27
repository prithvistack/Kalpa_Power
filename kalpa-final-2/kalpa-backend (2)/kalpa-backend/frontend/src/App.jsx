import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProductPage from "./pages/ProductPage";
import ScannerPage from "./pages/ScannerPage";
import SearchPage from "./pages/SearchPage";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/" element={<Layout><ProtectedRoute><SearchPage /></ProtectedRoute></Layout>} />
          <Route path="/scanner" element={<Layout><ProtectedRoute><ScannerPage /></ProtectedRoute></Layout>} />
          <Route path="/analytics" element={<Layout><ProtectedRoute><AnalyticsPage /></ProtectedRoute></Layout>} />
          <Route path="/product/:id" element={<Layout><ProtectedRoute><ProductPage /></ProtectedRoute></Layout>} />
          <Route path="/admin" element={<Layout><ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute></Layout>} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
