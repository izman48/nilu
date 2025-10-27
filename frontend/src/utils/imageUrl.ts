/**
 * Utility function to generate correct image URLs
 * Handles both Firebase Storage URLs and local storage paths
 */

export function getImageUrl(path: string | undefined | null): string | null {
  if (!path) return null;

  // If it's already a full URL (Firebase), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // For local storage, construct the URL
  // Extract just the filename from the path
  const filename = path.split('/').pop();

  // Determine the folder from the path
  let folder = 'general';
  if (path.includes('/cars/')) {
    folder = 'cars';
  } else if (path.includes('/bookings/')) {
    const match = path.match(/bookings\/(\d+)/);
    folder = match ? `bookings/${match[1]}` : 'bookings';
  }

  // Construct local URL
  return `http://localhost:8000/uploads/${folder}/${filename}`;
}

export function getCarImageUrl(car: { image_path?: string | null }): string | null {
  return getImageUrl(car.image_path);
}

export function getBookingPhotoUrl(photo: { file_path?: string | null }): string | null {
  return getImageUrl(photo.file_path);
}
