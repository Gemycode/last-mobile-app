import { create } from 'zustand';
import { Child, Bus, Route, Trip, Booking, BusStop } from '../types';

interface AppState {
  children: Child[];
  buses: Bus[];
  routes: Route[];
  trips: Trip[];
  bookings: Booking[];
  addChild: (child: Omit<Child, 'id'>) => void;
  bookSeat: (booking: Omit<Booking, 'id' | 'bookedAt'>) => void;
  updateBusLocation: (busId: string, location: { latitude: number; longitude: number }) => void;
}

// Mock data
const mockBusStops: BusStop[] = [
  { id: '1', name: 'Main Street School', coordinates: { latitude: 40.7128, longitude: -74.0060 }, estimatedTime: '8:00 AM' },
  { id: '2', name: 'Park Avenue', coordinates: { latitude: 40.7589, longitude: -73.9851 }, estimatedTime: '8:15 AM' },
  { id: '3', name: 'Downtown Plaza', coordinates: { latitude: 40.7505, longitude: -73.9934 }, estimatedTime: '8:30 AM' },
];

const mockRoutes: Route[] = [
  { id: '1', name: 'Route A - North', stops: mockBusStops, estimatedTime: 45 },
  { id: '2', name: 'Route B - South', stops: mockBusStops.slice(1), estimatedTime: 35 },
];

const mockBuses: Bus[] = [
  { id: '1', number: 'B001', capacity: 40, routeId: '1', status: 'active', currentLocation: { latitude: 40.7128, longitude: -74.0060 } },
  { id: '2', number: 'B002', capacity: 35, routeId: '2', status: 'active', currentLocation: { latitude: 40.7589, longitude: -73.9851 } },
];

export const useAppStore = create<AppState>((set, get) => ({
  children: [],
  buses: mockBuses,
  routes: mockRoutes,
  trips: [
    { id: '1', busId: '1', routeId: '1', driverId: '2', date: '2024-01-15', status: 'scheduled', startTime: '7:30 AM' },
    { id: '2', busId: '2', routeId: '2', driverId: '2', date: '2024-01-15', status: 'scheduled', startTime: '7:45 AM' },
  ],
  bookings: [],

  addChild: (childData) => {
    const newChild = {
      ...childData,
      id: Date.now().toString(),
    };
    set(state => ({ children: [...state.children, newChild] }));
  },

  bookSeat: (bookingData) => {
    const newBooking = {
      ...bookingData,
      id: Date.now().toString(),
      bookedAt: new Date().toISOString(),
    };
    set(state => ({ bookings: [...state.bookings, newBooking] }));
  },

  updateBusLocation: (busId, location) => {
    set(state => ({
      buses: state.buses.map(bus =>
        bus.id === busId ? { ...bus, currentLocation: location } : bus
      )
    }));
  },
}));