import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { Booking, Payment } from '@/types';
import { formatDate, formatCurrency, getStatusColor, getStatusBadge } from '@/utils/format';
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Car,
  UserCircle,
  MapPin,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Upload,
  CreditCard,
} from 'lucide-react';

const BookingDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadBooking();
      loadPayments();
    }
  }, [id]);

  const loadBooking = async () => {
    try {
      const response = await api.bookings.get(parseInt(id!));
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to load booking:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await api.payments.list({ booking_id: parseInt(id!) });
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Booking not found'}</p>
        <button
          onClick={() => navigate('/bookings')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const outstanding = (booking.total_amount || 0) - booking.paid_amount;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bookings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{booking.booking_number}</h1>
            <p className="text-gray-600 mt-1">Booking Details</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/bookings/${id}/edit`)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Edit className="h-5 w-5" />
          Edit Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Financial Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Status</h2>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(booking.status)}`}>
                  {getStatusBadge(booking.status)}
                </span>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Financial Summary</h2>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{formatCurrency(booking.total_amount || 0)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Paid: <span className="font-semibold text-green-600">{formatCurrency(booking.paid_amount)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Outstanding: <span className={`font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(outstanding)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="font-medium text-gray-900">{formatDate(booking.start_date)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">End Date</div>
                  <div className="font-medium text-gray-900">{formatDate(booking.end_date)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Template</div>
                  <div className="font-medium text-gray-900">{booking.template.name}</div>
                </div>
              </div>
            </div>

            {booking.notes && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-sm text-gray-500 mb-2">Notes</div>
                <p className="text-gray-900">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {booking.field_values.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.field_values.map((fv) => (
                  <div key={fv.id} className="border-b pb-3">
                    <div className="text-sm text-gray-500">{fv.field_name}</div>
                    <div className="font-medium text-gray-900 mt-1">{fv.field_value || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {booking.photos.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Photos ({booking.photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {booking.photos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={`/api/uploads/${photo.file_path}`}
                        alt={photo.description || 'Booking photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {photo.description && (
                      <p className="text-sm text-gray-600 mt-2">{photo.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History ({payments.length})
            </h2>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                      <div className="text-sm text-gray-600">
                        {payment.payment_method.replace('_', ' ').toUpperCase()} - {formatDate(payment.payment_date)}
                      </div>
                      {payment.receipt_number && (
                        <div className="text-xs text-gray-500">Receipt: {payment.receipt_number}</div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.payment_status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.payment_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium text-gray-900">{booking.customer.full_name}</div>
              </div>
              {booking.customer.email && (
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="text-gray-900">{booking.customer.email}</div>
                </div>
              )}
              {booking.customer.phone && (
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="text-gray-900">{booking.customer.phone}</div>
                </div>
              )}
              {booking.customer.country && (
                <div>
                  <div className="text-sm text-gray-500">Country</div>
                  <div className="text-gray-900">{booking.customer.country}</div>
                </div>
              )}
            </div>
          </div>

          {/* Tour Rep Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Tour Representative
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium text-gray-900">{booking.tour_rep.full_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="text-gray-900">{booking.tour_rep.phone}</div>
              </div>
              {booking.tour_rep.region && (
                <div>
                  <div className="text-sm text-gray-500">Region</div>
                  <div className="text-gray-900">{booking.tour_rep.region}</div>
                </div>
              )}
            </div>
          </div>

          {/* Car Info */}
          {booking.car && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Vehicle</div>
                  <div className="font-medium text-gray-900">
                    {booking.car.make} {booking.car.model}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Registration</div>
                  <div className="text-gray-900">{booking.car.registration_number}</div>
                </div>
                {booking.car.seating_capacity && (
                  <div>
                    <div className="text-sm text-gray-500">Capacity</div>
                    <div className="text-gray-900">{booking.car.seating_capacity} seats</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Driver Info */}
          {booking.driver && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Driver
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium text-gray-900">{booking.driver.full_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="text-gray-900">{booking.driver.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">License</div>
                  <div className="text-gray-900">{booking.driver.license_number}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
