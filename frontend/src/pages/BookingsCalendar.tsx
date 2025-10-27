import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { Booking } from '@/types';
import { formatCurrency, getStatusColor } from '@/utils/format';
import { ArrowLeft, ChevronLeft, ChevronRight, List } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

const BookingsCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.bookings.list();
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingStart = parseISO(booking.start_date);
      const bookingEnd = parseISO(booking.end_date);
      return date >= startOfDay(bookingStart) && date <= startOfDay(bookingEnd);
    });
  };

  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const renderCalendarHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-t-lg overflow-hidden">
        {days.map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayBookings = getBookingsForDate(day);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelectedDay = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={`min-h-[100px] p-2 cursor-pointer transition ${
              isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
            } ${isSelectedDay ? 'ring-2 ring-primary-500' : ''} ${
              isTodayDate ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={`text-sm font-medium ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isTodayDate ? 'bg-primary-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''}`}
              >
                {format(day, 'd')}
              </span>
              {dayBookings.length > 0 && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {dayBookings.length}
                </span>
              )}
            </div>

            <div className="space-y-1">
              {dayBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/bookings/${booking.id}`);
                  }}
                  className={`text-xs p-1 rounded truncate ${getStatusColor(booking.status)} cursor-pointer hover:opacity-80`}
                  title={`${booking.booking_number} - ${booking.customer.full_name}`}
                >
                  {booking.customer.full_name}
                </div>
              ))}
              {dayBookings.length > 3 && (
                <div className="text-xs text-gray-500 pl-1">+{dayBookings.length - 3} more</div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-px bg-gray-200">
          {days}
        </div>
      );
      days = [];
    }

    return <div className="border-x border-b border-gray-200 rounded-b-lg overflow-hidden">{rows}</div>;
  };

  const renderSelectedDateBookings = () => {
    if (!selectedDate) return null;

    const dayBookings = getBookingsForDate(selectedDate);

    if (dayBookings.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No bookings on {format(selectedDate, 'MMMM d, yyyy')}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">
            Bookings on {format(selectedDate, 'MMMM d, yyyy')} ({dayBookings.length})
          </h3>
        </div>
        <div className="divide-y">
          {dayBookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => navigate(`/bookings/${booking.id}`)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{booking.booking_number}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Customer: {booking.customer.full_name}</div>
                    <div>Tour Rep: {booking.tour_rep.full_name}</div>
                    <div>
                      Duration: {format(parseISO(booking.start_date), 'MMM d')} - {format(parseISO(booking.end_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                {booking.total_amount && (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(booking.total_amount)}</div>
                    <div className="text-sm text-gray-500">Paid: {formatCurrency(booking.paid_amount)}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/bookings')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings Calendar</h1>
            <p className="text-gray-600 mt-1">View bookings in calendar format</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          <List className="h-5 w-5" />
          List View
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {renderCalendarHeader()}
        {renderCalendarDays()}
        {renderCalendarCells()}
      </div>

      {selectedDate && renderSelectedDateBookings()}
    </div>
  );
};

export default BookingsCalendar;
