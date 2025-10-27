import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { Template, Customer, TourRep, Car, Driver } from '@/types';
import { ArrowLeft, Save, Plus, Upload, X } from 'lucide-react';
import AddCustomerModal from '@/components/AddCustomerModal';
import AddCarModal from '@/components/AddCarModal';
import AddDriverModal from '@/components/AddDriverModal';
import AddTourRepModal from '@/components/AddTourRepModal';
import { toast } from 'react-hot-toast';

interface FormData {
  template_id: number | null;
  customer_id: number | null;
  tour_rep_id: number | null;
  car_id: number | null;
  driver_id: number | null;
  start_date: string;
  end_date: string;
  total_amount: number | null;
  notes: string;
  status: 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  field_values: Record<string, string>;
}

interface FileUpload {
  file: File;
  preview: string;
}

const BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tourReps, setTourReps] = useState<TourRep[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [error, setError] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTourRepModal, setShowTourRepModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [fileUploads, setFileUploads] = useState<Record<string, FileUpload>>({});

  const [formData, setFormData] = useState<FormData>({
    template_id: null,
    customer_id: null,
    tour_rep_id: null,
    car_id: null,
    driver_id: null,
    start_date: '',
    end_date: '',
    total_amount: null,
    notes: '',
    status: 'pending',
    field_values: {},
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesRes, customersRes, tourRepsRes, carsRes, driversRes] = await Promise.all([
        api.templates.list(),
        api.customers.list(),
        api.tourReps.list(),
        api.cars.list(),
        api.drivers.list(),
      ]);

      setTemplates(templatesRes.data);
      setCustomers(customersRes.data);
      setTourReps(tourRepsRes.data);
      setCars(carsRes.data);
      setDrivers(driversRes.data);

      if (isEdit && id) {
        const bookingRes = await api.bookings.get(parseInt(id));
        const booking = bookingRes.data;

        setFormData({
          template_id: booking.template_id,
          customer_id: booking.customer_id,
          tour_rep_id: booking.tour_rep_id,
          car_id: booking.car_id || null,
          driver_id: booking.driver_id || null,
          start_date: booking.start_date.split('T')[0],
          end_date: booking.end_date.split('T')[0],
          total_amount: booking.total_amount || null,
          notes: booking.notes || '',
          status: booking.status,
          field_values: booking.field_values.reduce((acc, fv) => {
            acc[fv.field_name] = fv.field_value;
            return acc;
          }, {} as Record<string, string>),
        });

        const template = templatesRes.data.find((t: Template) => t.id === booking.template_id);
        setSelectedTemplate(template || null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData((prev) => ({ ...prev, template_id: templateId, field_values: {} }));
  };

  const handleFieldValueChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      field_values: { ...prev.field_values, [fieldName]: value },
    }));
  };

  const handleFileSelect = (fieldName: string, file: File | null) => {
    if (!file) {
      // Remove file
      const newUploads = { ...fileUploads };
      delete newUploads[fieldName];
      setFileUploads(newUploads);
      handleFieldValueChange(fieldName, '');
      return;
    }

    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUploads(prev => ({
        ...prev,
        [fieldName]: {
          file,
          preview: reader.result as string
        }
      }));
      // Store filename temporarily
      handleFieldValueChange(fieldName, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleCustomerAdded = (customer: Customer) => {
    setCustomers([...customers, customer]);
    setFormData({ ...formData, customer_id: customer.id });
  };

  const handleTourRepAdded = (tourRep: TourRep) => {
    setTourReps([...tourReps, tourRep]);
    setFormData({ ...formData, tour_rep_id: tourRep.id });
  };

  const handleCarAdded = (car: Car) => {
    setCars([...cars, car]);
    setFormData({ ...formData, car_id: car.id });
  };

  const handleDriverAdded = (driver: Driver) => {
    setDrivers([...drivers, driver]);
    setFormData({ ...formData, driver_id: driver.id });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.template_id || !formData.customer_id || !formData.tour_rep_id) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Convert field_values object to array format expected by backend
      const fieldValuesArray = Object.entries(formData.field_values).map(([field_name, field_value]) => ({
        field_name,
        field_value,
      }));

      // Convert date strings to ISO datetime format
      const startDateTime = formData.start_date ? `${formData.start_date}T00:00:00` : '';
      const endDateTime = formData.end_date ? `${formData.end_date}T23:59:59` : '';

      const payload = {
        template_id: formData.template_id,
        customer_id: formData.customer_id,
        tour_rep_id: formData.tour_rep_id,
        car_id: formData.car_id,
        driver_id: formData.driver_id,
        start_date: startDateTime,
        end_date: endDateTime,
        total_amount: formData.total_amount,
        notes: formData.notes,
        field_values: fieldValuesArray,
      };

      let bookingId: number;
      if (isEdit && id) {
        // Include status for updates
        await api.bookings.update(parseInt(id), { ...payload, status: formData.status });
        bookingId = parseInt(id);
        toast.success('Booking updated successfully');
      } else {
        // Don't send status for create (backend sets it to PENDING)
        const response = await api.bookings.create(payload);
        bookingId = response.data.id;
        toast.success('Booking created successfully');
      }

      // Upload files for file-type fields
      if (Object.keys(fileUploads).length > 0) {
        const uploadPromises = Object.entries(fileUploads).map(async ([fieldName, upload]) => {
          try {
            // Find the field to get its label
            const field = selectedTemplate?.fields.find(f => f.field_name === fieldName);
            const description = field ? `${field.field_label}` : fieldName;

            await api.bookings.uploadPhoto(bookingId, upload.file, 'document', description);
          } catch (err) {
            console.error(`Failed to upload file for ${fieldName}:`, err);
            toast.error(`Failed to upload ${fieldName}`);
          }
        });

        await Promise.all(uploadPromises);
        toast.success('Files uploaded successfully');
      }

      navigate('/bookings');
    } catch (error: any) {
      console.error('Failed to save booking:', error);
      setError(error.response?.data?.detail || 'Failed to save booking');
      toast.error(error.response?.data?.detail || 'Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData.field_values[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            placeholder={field.placeholder}
            required={field.is_required}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        );

      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.value)}
            required={field.is_required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="">Select...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => handleFieldValueChange(field.field_name, e.target.checked.toString())}
            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
        );

      case 'file':
        const fileUpload = fileUploads[field.field_name];
        return (
          <div className="space-y-2">
            {fileUpload ? (
              <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-gray-50">
                {fileUpload.file.type.startsWith('image/') ? (
                  <img
                    src={fileUpload.preview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileUpload.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(fileUpload.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileSelect(field.field_name, null)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {field.placeholder || 'Choose file or drag and drop'}
                </span>
                <input
                  type="file"
                  onChange={(e) => handleFileSelect(field.field_name, e.target.files?.[0] || null)}
                  className="hidden"
                  required={field.is_required && !fileUpload}
                />
              </label>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && !selectedTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/bookings')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Booking' : 'Create New Booking'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update booking details' : 'Fill in the details to create a new booking'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template *
              </label>
              <select
                value={formData.template_id || ''}
                onChange={(e) => handleTemplateChange(parseInt(e.target.value))}
                required
                disabled={isEdit}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.customer_id || ''}
                  onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.full_name} {customer.email && `(${customer.email})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  title="Add new customer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour Representative *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.tour_rep_id || ''}
                  onChange={(e) => setFormData({ ...formData, tour_rep_id: parseInt(e.target.value) })}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a tour rep</option>
                  {tourReps.filter(tr => tr.is_active).map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.full_name} {rep.region && `(${rep.region})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowTourRepModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  title="Add new tour representative"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Car (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.car_id || ''}
                  onChange={(e) => setFormData({ ...formData, car_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">No car assigned</option>
                  {cars.filter(c => c.is_available).map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} ({car.registration_number})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCarModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  title="Add new car"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.driver_id || ''}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  <option value="">No driver assigned</option>
                  {drivers.filter(d => d.is_available).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.phone})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowDriverModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1"
                  title="Add new driver"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.total_amount || ''}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes or special instructions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {selectedTemplate && selectedTemplate.fields.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTemplate.name} Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedTemplate.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.field_label}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderField(field)}
                    {field.help_text && (
                      <p className="text-sm text-gray-500 mt-1">{field.help_text}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Saving...' : isEdit ? 'Update Booking' : 'Create Booking'}
          </button>
        </div>
      </form>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCustomerAdded={handleCustomerAdded}
      />
      <AddTourRepModal
        isOpen={showTourRepModal}
        onClose={() => setShowTourRepModal(false)}
        onTourRepAdded={handleTourRepAdded}
      />
      <AddCarModal
        isOpen={showCarModal}
        onClose={() => setShowCarModal(false)}
        onCarAdded={handleCarAdded}
      />
      <AddDriverModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        onDriverAdded={handleDriverAdded}
      />
    </div>
  );
};

export default BookingForm;
