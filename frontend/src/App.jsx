import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';
import { RequireAuth, RequireAdmin } from './routes/ProtectedRoute';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ShopPage from './pages/ShopPage';
import PurchasesPage from './pages/PurchasesPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <div className="min-h-screen bg-white">
                    <Header />
                    <Routes>
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/purchases" element={<PurchasesPage />} />
                      <Route
                        path="/admin"
                        element={
                          <RequireAdmin>
                            <AdminPage />
                          </RequireAdmin>
                        }
                      />
                      <Route path="*" element={<Navigate to="/shop" replace />} />
                    </Routes>
                  </div>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;
