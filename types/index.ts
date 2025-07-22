export interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'driver' | 'admin' | 'student';
  avatar?: string;
}

export interface Child {
  id: string;
  name: string;
  grade: string;
  school: string;
  parentId: string;
  busId?: string;
  routeId?: string;
}

export interface Bus {
  id: string;
  number: string;
  capacity: number;
  driverId?: string;
  routeId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
}

export interface Route {
  id: string;
  name: string;
  stops: BusStop[];
  estimatedTime: number;
}

export interface BusStop {
  id: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedTime: string;
}

export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  startTime: string;
  endTime?: string;
}

export interface Booking {
  id: string;
  childId: string;
  tripId: string;
  seatNumber: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
}