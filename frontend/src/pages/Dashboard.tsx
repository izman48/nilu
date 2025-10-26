import React, { useEffect, useState } from 'react';
import { api } from '@/api';
import { DashboardStats } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusBadge } from '@/utils/format';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Car,
  User,
  AlertCircle,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.dashboard.getStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        {error || 'Failed to load dashboard'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your tourism operations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.bookings.total}</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.total)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.paid)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.outstanding)}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cars</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.resources.cars.available}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resources.cars.total}</p>
            </div>
            <Car className="h-12 w-12 text-gray-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Drivers</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.resources.drivers.available}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resources.drivers.total}</p>
            </div>
            <User className="h-12 w-12 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Tour Reps</h3>
          <div className="space-y-3">
            {stats.top_performers.tour_reps.slice(0, 5).map((rep) => (
              <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{rep.name}</p>
                  <p className="text-sm text-gray-600">{rep.booking_count} bookings</p>
                </div>
                <p className="font-semibold text-primary-600">
                  {formatCurrency(rep.total_revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {stats.recent_bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{booking.booking_number}</p>
                  <p className="text-sm text-gray-600">{booking.customer_name}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                    {getStatusBadge(booking.status)}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(booking.start_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
