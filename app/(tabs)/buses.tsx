import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Bus, MapPin, Users, Clock, Calendar } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

export default function BusesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const user = useAuthStore(state => state.user);
  const { buses, routes } = useAppStore();

  const renderParentView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Buses</Text>
        <View style={styles.dateSelector}>
          <Calendar size={16} color={Colors.secondary} />
          <Text style={styles.dateText}>Today</Text>
        </View>
      </View>

      {buses.map(bus => {
        const route = routes.find(r => r.id === bus.routeId);
        return (
          <Card key={bus.id} style={styles.busCard}>
            <View style={styles.busHeader}>
              <View style={styles.busIcon}>
                <Bus size={24} color={Colors.white} />
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busNumber}>Bus {bus.number}</Text>
                <Text style={styles.busRoute}>{route?.name}</Text>
              </View>
              <View style={[styles.statusBadge, styles.activeStatus]}>
                <Text style={styles.statusText}>{bus.status}</Text>
              </View>
            </View>

            <View style={styles.busDetails}>
              <View style={styles.detailRow}>
                <Users size={16} color={Colors.gray[500]} />
                <Text style={styles.detailText}>Capacity: {bus.capacity} seats</Text>
              </View>
              <View style={styles.detailRow}>
                <MapPin size={16} color={Colors.gray[500]} />
                <Text style={styles.detailText}>
                  Current: {bus.currentLocation ? 'On Route' : 'At Depot'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color={Colors.gray[500]} />
                <Text style={styles.detailText}>Next Pickup: 7:30 AM</Text>
              </View>
            </View>

            <View style={styles.routeStops}>
              <Text style={styles.stopsTitle}>Route Stops:</Text>
              {route?.stops.slice(0, 3).map((stop, index) => (
                <Text key={stop.id} style={styles.stopText}>
                  {index + 1}. {stop.name} - {stop.estimatedTime}
                </Text>
              ))}
            </View>

            <View style={styles.busActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>View Route</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.primaryAction]}>
                <Text style={styles.primaryActionText}>Book Seat</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );

  const renderAdminView = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fleet Management</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Bus</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.length}</Text>
          <Text style={styles.statLabel}>Total Buses</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.filter(b => b.status === 'active').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.filter(b => b.status === 'maintenance').length}</Text>
          <Text style={styles.statLabel}>Maintenance</Text>
        </Card>
      </View>

      {buses.map(bus => {
        const route = routes.find(r => r.id === bus.routeId);
        return (
          <Card key={bus.id} style={styles.adminBusCard}>
            <View style={styles.busHeader}>
              <View style={styles.busIcon}>
                <Bus size={24} color={Colors.white} />
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busNumber}>Bus {bus.number}</Text>
                <Text style={styles.busRoute}>{route?.name}</Text>
              </View>
              <View style={[styles.statusBadge, 
                bus.status === 'active' ? styles.activeStatus : 
                bus.status === 'maintenance' ? styles.warningStatus : styles.inactiveStatus
              ]}>
                <Text style={styles.statusText}>{bus.status}</Text>
              </View>
            </View>

            <View style={styles.adminDetails}>
              <Text style={styles.detailText}>Driver: {bus.driverId ? 'Assigned' : 'Unassigned'}</Text>
              <Text style={styles.detailText}>Route: {route?.name || 'Not assigned'}</Text>
              <Text style={styles.detailText}>Last Maintenance: 2 weeks ago</Text>
            </View>

            <View style={styles.adminActions}>
              <TouchableOpacity style={styles.adminActionButton}>
                <Text style={styles.actionButtonText}>Assign Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminActionButton}>
                <Text style={styles.actionButtonText}>Edit Route</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.adminActionButton}>
                <Text style={styles.actionButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <CustomHeader title={user?.role === 'admin' ? 'Fleet Management' : 'Available Buses'} />
      {user?.role === 'admin' ? renderAdminView() : renderParentView()}
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.gray[700],
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray[600],
  },
  busCard: {
    marginBottom: 16,
  },
  adminBusCard: {
    marginBottom: 16,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  busIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  busInfo: {
    flex: 1,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  busRoute: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: Colors.success,
  },
  warningStatus: {
    backgroundColor: Colors.warning,
  },
  inactiveStatus: {
    backgroundColor: Colors.gray[400],
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  busDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.gray[700],
    marginLeft: 8,
  },
  routeStops: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  stopText: {
    fontSize: 13,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  busActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryAction: {
    backgroundColor: Colors.primary,
  },
  primaryActionText: {
    color: Colors.white,
    fontWeight: '600',
  },
  adminDetails: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adminActionButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
});