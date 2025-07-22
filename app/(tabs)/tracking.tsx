import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MapPin, Navigation, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

export default function TrackingScreen() {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const { buses, routes, updateBusLocation } = useAppStore();

  // Simulate live tracking updates
  useEffect(() => {
    if (isLiveTracking) {
      const interval = setInterval(() => {
        buses.forEach(bus => {
          if (bus.currentLocation) {
            // Simulate small location changes
            const newLocation = {
              latitude: bus.currentLocation.latitude + (Math.random() - 0.5) * 0.001,
              longitude: bus.currentLocation.longitude + (Math.random() - 0.5) * 0.001,
            };
            updateBusLocation(bus.id, newLocation);
          }
        });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isLiveTracking, buses, updateBusLocation]);

  const renderMapPlaceholder = () => (
    <View style={styles.mapPlaceholder}>
      <MapPin size={48} color={Colors.gray[400]} />
      <Text style={styles.mapPlaceholderText}>Interactive Map View</Text>
      <Text style={styles.mapPlaceholderSubtext}>
        Live bus tracking would be displayed here
      </Text>
      {selectedBus && (
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            Tracking Bus {selectedBus}
          </Text>
          <View style={[styles.trackingIndicator, isLiveTracking && styles.activeTracking]} />
        </View>
      )}
    </View>
  );

  const renderParentView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Your Child's Bus</Text>
        <TouchableOpacity 
          style={[styles.trackingButton, isLiveTracking && styles.activeButton]}
          onPress={() => setIsLiveTracking(!isLiveTracking)}
        >
          <Navigation size={16} color={Colors.white} />
          <Text style={styles.trackingButtonText}>
            {isLiveTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderMapPlaceholder()}

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Bus Status</Text>
          <View style={[styles.statusDot, isLiveTracking && styles.activeStatus]} />
        </View>
        
        <View style={styles.busStatus}>
          <Text style={styles.busNumber}>Bus B001</Text>
          <Text style={styles.busLocation}>Current Location: Park Avenue</Text>
          <Text style={styles.eta}>ETA to your stop: 5 minutes</Text>
        </View>

        <View style={styles.routeProgress}>
          <Text style={styles.progressTitle}>Route Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: '60%' }]} />
          </View>
          <Text style={styles.progressText}>3 of 5 stops completed</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Upcoming Stops</Text>
        {['Park Avenue', 'Downtown Plaza', 'Your Stop'].map((stop, index) => (
          <View key={index} style={styles.stopItem}>
            <View style={[styles.stopIndicator, index === 0 && styles.currentStop]} />
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, index === 2 && styles.yourStop]}>
                {stop}
              </Text>
              <Text style={styles.stopTime}>
                {index === 0 ? 'Current' : index === 1 ? '3 min' : '8 min'}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderDriverView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Location</Text>
        <TouchableOpacity 
          style={[styles.trackingButton, isLiveTracking && styles.activeButton]}
          onPress={() => setIsLiveTracking(!isLiveTracking)}
        >
          <Navigation size={16} color={Colors.white} />
          <Text style={styles.trackingButtonText}>
            {isLiveTracking ? 'Broadcasting' : 'Start Broadcast'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderMapPlaceholder()}

      <Card>
        <Text style={styles.cardTitle}>Trip Information</Text>
        <View style={styles.tripInfo}>
          <Text style={styles.tripDetail}>Route: A - North</Text>
          <Text style={styles.tripDetail}>Bus: B001</Text>
          <Text style={styles.tripDetail}>Students On Board: 15/40</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Next Stop</Text>
        <View style={styles.nextStop}>
          <Text style={styles.nextStopName}>Downtown Plaza</Text>
          <Text style={styles.nextStopEta}>ETA: 3 minutes</Text>
          <TouchableOpacity style={styles.arriveButton}>
            <Text style={styles.arriveButtonText}>Mark as Arrived</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {isLiveTracking && (
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertCircle size={20} color={Colors.warning} />
            <Text style={styles.alertTitle}>Location Sharing Active</Text>
          </View>
          <Text style={styles.alertText}>
            Your location is being broadcast to parents and administrators
          </Text>
        </Card>
      )}
    </ScrollView>
  );

  const renderAdminView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet Tracking</Text>
        <View style={styles.fleetStats}>
          <Text style={styles.statText}>{buses.filter(b => b.status === 'active').length} Active</Text>
        </View>
      </View>

      {renderMapPlaceholder()}

      <View style={styles.busGrid}>
        {buses.map(bus => {
          const route = routes.find(r => r.id === bus.routeId);
          return (
            <Card key={bus.id} style={[
              styles.busCard,
              selectedBus === bus.number && styles.selectedBusCard
            ]}>
              <TouchableOpacity onPress={() => setSelectedBus(bus.number)}>
                <View style={styles.busHeader}>
                  <Text style={styles.busCardNumber}>Bus {bus.number}</Text>
                  <View style={[styles.statusDot, bus.status === 'active' && styles.activeStatus]} />
                </View>
                <Text style={styles.busCardRoute}>{route?.name}</Text>
                <Text style={styles.busCardStatus}>
                  {bus.currentLocation ? 'On Route' : 'At Depot'}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (user?.role) {
      case 'parent':
        return renderParentView();
      case 'driver':
        return renderDriverView();
      case 'admin':
        return renderAdminView();
      case 'student':
        return renderParentView(); // Similar to parent view
      default:
        return <Text>Unknown role</Text>;
    }
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="Live Tracking" />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: Colors.success,
  },
  trackingButtonText: {
    color: Colors.white,
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  fleetStats: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statText: {
    fontSize: 14,
    color: Colors.gray[700],
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 250,
    backgroundColor: Colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 12,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 4,
  },
  mapInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  mapInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  trackingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray[400],
    marginTop: 8,
  },
  activeTracking: {
    backgroundColor: Colors.success,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray[400],
  },
  activeStatus: {
    backgroundColor: Colors.success,
  },
  busStatus: {
    marginBottom: 16,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  busLocation: {
    fontSize: 16,
    color: Colors.gray[700],
    marginBottom: 4,
  },
  eta: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  routeProgress: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  stopIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray[300],
    marginRight: 16,
  },
  currentStop: {
    backgroundColor: Colors.success,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    color: Colors.gray[800],
    fontWeight: '500',
  },
  yourStop: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  stopTime: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 2,
  },
  tripInfo: {
    gap: 8,
  },
  tripDetail: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  nextStop: {
    alignItems: 'center',
  },
  nextStopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  nextStopEta: {
    fontSize: 16,
    color: Colors.success,
    marginBottom: 16,
  },
  arriveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  arriveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  alertCard: {
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.warning,
    marginLeft: 8,
  },
  alertText: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  busGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  busCard: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  selectedBusCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busCardNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  busCardRoute: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  busCardStatus: {
    fontSize: 14,
    color: Colors.success,
  },
});