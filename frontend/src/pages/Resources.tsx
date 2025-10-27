import React, { useEffect, useState } from 'react';
import { api } from '@/api';
import { Car, Driver, TourRep } from '@/types';
import { Plus, Edit, Trash2, X, Car as CarIcon, UserCircle, Users, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCarImageUrl } from '@/utils/imageUrl';

type TabType = 'cars' | 'drivers' | 'tour_reps';

const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('cars');
  const [cars, setCars] = useState<Car[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tourReps, setTourReps] = useState<TourRep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const [carsRes, driversRes, tourRepsRes] = await Promise.all([
        api.cars.list(),
        api.drivers.list(),
        api.tourReps.list(),
      ]);
      setCars(carsRes.data);
      setDrivers(driversRes.data);
      setTourReps(tourRepsRes.data);
    } catch (error) {
      console.error('Failed to load resources:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
        <p className="text-gray-600 mt-1">Manage cars, drivers, and tour representatives</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex gap-8 px-6">
            <button
              onClick={() => setActiveTab('cars')}
              className={`py-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'cars'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CarIcon className="h-4 w-4" />
                Cars ({cars.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`py-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'drivers'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                Drivers ({drivers.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tour_reps')}
              className={`py-4 border-b-2 font-medium text-sm transition ${
                activeTab === 'tour_reps'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tour Reps ({tourReps.length})
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'cars' && <CarsTab cars={cars} onRefresh={loadResources} />}
          {activeTab === 'drivers' && <DriversTab drivers={drivers} onRefresh={loadResources} />}
          {activeTab === 'tour_reps' && <TourRepsTab tourReps={tourReps} onRefresh={loadResources} />}
        </div>
      </div>
    </div>
  );
};

// Cars Tab Component
const CarsTab: React.FC<{ cars: Car[]; onRefresh: () => void }> = ({ cars, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    registration_number: '',
    make: '',
    model: '',
    year: '',
    color: '',
    seating_capacity: '',
    daily_rate: '',
    is_available: true,
    notes: '',
  });

  const handleOpenModal = (car?: Car) => {
    if (car) {
      setEditingCar(car);
      setFormData({
        registration_number: car.registration_number,
        make: car.make,
        model: car.model,
        year: car.year?.toString() || '',
        color: car.color || '',
        seating_capacity: car.seating_capacity?.toString() || '',
        daily_rate: car.daily_rate?.toString() || '',
        is_available: car.is_available,
        notes: car.notes || '',
      });
      setImagePreview(car.image_path || null);
    } else {
      setEditingCar(null);
      setFormData({
        registration_number: '',
        make: '',
        model: '',
        year: '',
        color: '',
        seating_capacity: '',
        daily_rate: '',
        is_available: true,
        notes: '',
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setShowModal(true);
    setError('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : undefined,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : undefined,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : undefined,
      };

      let carId: number;
      if (editingCar) {
        await api.cars.update(editingCar.id, payload);
        carId = editingCar.id;
        toast.success('Car updated successfully');
      } else {
        const response = await api.cars.create(payload);
        carId = response.data.id;
        toast.success('Car created successfully');
      }

      // Upload image if selected
      if (selectedImage) {
        setUploading(true);
        try {
          await api.cars.uploadImage(carId, selectedImage);
          toast.success('Image uploaded successfully');
        } catch (imgError: any) {
          console.error('Failed to upload image:', imgError);
          toast.error('Car saved but image upload failed');
        } finally {
          setUploading(false);
        }
      }

      await onRefresh();
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to save car:', error);
      setError(error.response?.data?.detail || 'Failed to save car');
      toast.error(error.response?.data?.detail || 'Failed to save car');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      await api.cars.delete(id);
      await onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete car');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Vehicle Fleet</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="h-5 w-5" />
          Add Car
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <div key={car.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
            {getCarImageUrl(car) ? (
              <div className="h-48 bg-gray-100 relative">
                <img
                  src={getCarImageUrl(car)!}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {car.make} {car.model}
                  </h3>
                  <p className="text-sm text-gray-500">{car.registration_number}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  car.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {car.is_available ? 'Available' : 'In Use'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {car.year && <div className="text-gray-600">Year: {car.year}</div>}
                {car.color && <div className="text-gray-600">Color: {car.color}</div>}
                {car.seating_capacity && <div className="text-gray-600">Seats: {car.seating_capacity}</div>}
                {car.daily_rate && <div className="text-gray-600">Rate: LKR {car.daily_rate}/day</div>}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleOpenModal(car)}
                  className="flex-1 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded transition text-sm"
                >
                  <Edit className="h-4 w-4 inline mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(car.id)}
                  className="flex-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded transition text-sm"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number *</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seating Capacity</label>
                  <input
                    type="number"
                    value={formData.seating_capacity}
                    onChange={(e) => setFormData({ ...formData, seating_capacity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Available</label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Car Image</label>
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview.startsWith('data:') || imagePreview.startsWith('http') ? imagePreview : getCarImageUrl({ image_path: imagePreview })!}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedImage(null);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {selectedImage ? 'Change image' : 'Upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? 'Uploading...' : editingCar ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Drivers Tab Component
const DriversTab: React.FC<{ drivers: Driver[]; onRefresh: () => void }> = ({ drivers, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    license_number: '',
    languages: '',
    daily_rate: '',
    is_available: true,
    notes: '',
  });

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        full_name: driver.full_name,
        phone: driver.phone,
        email: driver.email || '',
        license_number: driver.license_number,
        languages: driver.languages || '',
        daily_rate: driver.daily_rate?.toString() || '',
        is_available: driver.is_available,
        notes: driver.notes || '',
      });
    } else {
      setEditingDriver(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        license_number: '',
        languages: '',
        daily_rate: '',
        is_available: true,
        notes: '',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload = {
        ...formData,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : undefined,
      };

      if (editingDriver) {
        await api.drivers.update(editingDriver.id, payload);
      } else {
        await api.drivers.create(payload);
      }
      await onRefresh();
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to save driver:', error);
      setError(error.response?.data?.detail || 'Failed to save driver');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      await api.drivers.delete(id);
      await onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete driver');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Driver Pool</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="h-5 w-5" />
          Add Driver
        </button>
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => (
          <div key={driver.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{driver.full_name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    driver.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.is_available ? 'Available' : 'Busy'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Phone:</span> {driver.phone}
                  </div>
                  {driver.email && (
                    <div>
                      <span className="text-gray-500">Email:</span> {driver.email}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">License:</span> {driver.license_number}
                  </div>
                  {driver.languages && (
                    <div>
                      <span className="text-gray-500">Languages:</span> {driver.languages}
                    </div>
                  )}
                  {driver.daily_rate && (
                    <div>
                      <span className="text-gray-500">Rate:</span> LKR {driver.daily_rate}/day
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleOpenModal(driver)}
                  className="text-primary-600 hover:bg-primary-50 p-2 rounded transition"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <input
                    type="text"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="English, Sinhala, Tamil"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Available</label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {editingDriver ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Tour Reps Tab Component
const TourRepsTab: React.FC<{ tourReps: TourRep[]; onRefresh: () => void }> = ({ tourReps, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRep, setEditingRep] = useState<TourRep | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    region: '',
    is_active: true,
    notes: '',
  });

  const handleOpenModal = (rep?: TourRep) => {
    if (rep) {
      setEditingRep(rep);
      setFormData({
        full_name: rep.full_name,
        phone: rep.phone,
        email: rep.email || '',
        region: rep.region || '',
        is_active: rep.is_active,
        notes: rep.notes || '',
      });
    } else {
      setEditingRep(null);
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        region: '',
        is_active: true,
        notes: '',
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingRep) {
        await api.tourReps.update(editingRep.id, formData);
      } else {
        await api.tourReps.create(formData);
      }
      await onRefresh();
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to save tour rep:', error);
      setError(error.response?.data?.detail || 'Failed to save tour representative');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tour representative?')) return;

    try {
      await api.tourReps.delete(id);
      await onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to delete tour representative');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Tour Representatives</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          <Plus className="h-5 w-5" />
          Add Tour Rep
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tourReps.map((rep) => (
          <div key={rep.id} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{rep.full_name}</h3>
                {rep.region && <p className="text-sm text-gray-500">{rep.region}</p>}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                rep.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {rep.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-1 text-sm">
              <div className="text-gray-600">Phone: {rep.phone}</div>
              {rep.email && <div className="text-gray-600">Email: {rep.email}</div>}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => handleOpenModal(rep)}
                className="flex-1 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded transition text-sm"
              >
                <Edit className="h-4 w-4 inline mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(rep.id)}
                className="flex-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded transition text-sm"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">{editingRep ? 'Edit Tour Rep' : 'Add New Tour Rep'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="e.g., Colombo, Kandy, Galle"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  {editingRep ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Resources;
