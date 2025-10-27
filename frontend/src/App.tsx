import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import BookingForm from './pages/BookingForm';
import BookingDetail from './pages/BookingDetail';
import BookingsCalendar from './pages/BookingsCalendar';
import Customers from './pages/Customers';
import Resources from './pages/Resources';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Layout>
                <Bookings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingsCalendar />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/:id/edit"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Layout>
                <Resources />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Templates</h2>
                  <p className="text-gray-600">Template management will be implemented here</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Payments</h2>
                  <p className="text-gray-600">Payment tracking will be implemented here</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">User Management</h2>
                  <p className="text-gray-600">User management will be implemented here</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
