import React, { useEffect, useState } from 'react';
import { api } from '@/api';
import { DashboardStats, Driver, TourRep, Car } from '@/types';
import { formatCurrency, formatDate, getStatusColor, getStatusBadge } from '@/utils/format';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Car as CarIcon,
  User,
  AlertCircle,
  Filter,
  X,
  Activity,
} from 'lucide-react';

interface AuditLogItem {
  id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_name: string;
  description: string;
  created_at: string;
  ip_address: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    driver_id: undefined as number | undefined,
    tour_rep_id: undefined as number | undefined,
    car_id: undefined as number | undefined,
  });

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Resources for filters
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tourReps, setTourReps] = useState<TourRep[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    loadDashboard();
    loadAuditLogs();
  }, [filters]);

  const loadResources = async () => {
    try {
      const [driversRes, tourRepsRes, carsRes] = await Promise.all([
        api.drivers.list(),
        api.tourReps.list(),
        api.cars.list(),
      ]);
      setDrivers(driversRes.data);
      setTourReps(tourRepsRes.data);
      setCars(carsRes.data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const loadDashboard = async () => {
    try {
      const params: any = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.driver_id) params.driver_id = filters.driver_id;
      if (filters.tour_rep_id) params.tour_rep_id = filters.tour_rep_id;
      if (filters.car_id) params.car_id = filters.car_id;

      const response = await api.dashboard.getStats(params);
      setStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params: any = { limit: 20 };
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.dashboard.getAuditLogs(params);
      setAuditLogs(response.data.items);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      driver_id: undefined,
      tour_rep_id: undefined,
      car_id: undefined,
    });
  };

  const hasActiveFilters =
    filters.start_date ||
    filters.end_date ||
    filters.driver_id ||
    filters.tour_rep_id ||
    filters.car_id;

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'text-green-600 bg-green-50',
      update: 'text-blue-600 bg-blue-50',
      delete: 'text-red-600 bg-red-50',
      login: 'text-purple-600 bg-purple-50',
      logout: 'text-gray-600 bg-gray-50',
    };
    return colors[action.toLowerCase()] || 'text-gray-600 bg-gray-50';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your tourism operations
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
            hasActiveFilters
              ? 'border-primary-600 bg-primary-50 text-primary-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Filter Dashboard Data</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver
              </label>
              <select
                value={filters.driver_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, driver_id: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour Rep
              </label>
              <select
                value={filters.tour_rep_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, tour_rep_id: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Tour Reps</option>
                {tourReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car
              </label>
              <select
                value={filters.car_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, car_id: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">All Cars</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.make} {car.model} ({car.registration_number})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

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

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        {auditLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(
                    log.action
                  )}`}
                >
                  {log.action.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{log.user_name}</span>
                    {' '}
                    {log.action === 'create' && 'created'}
                    {log.action === 'update' && 'updated'}
                    {log.action === 'delete' && 'deleted'}
                    {log.action === 'login' && 'logged in'}
                    {log.action === 'logout' && 'logged out'}
                    {' '}
                    {log.resource_type && (
                      <>
                        <span className="text-gray-600">
                          {log.resource_type.replace('_', ' ')}
                        </span>
                        {log.resource_name && (
                          <span className="font-medium"> {log.resource_name}</span>
                        )}
                      </>
                    )}
                  </p>
                  {log.description && (
                    <p className="text-xs text-gray-500 mt-1">{log.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatDate(log.created_at)}</span>
                    {log.ip_address && <span>IP: {log.ip_address}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
