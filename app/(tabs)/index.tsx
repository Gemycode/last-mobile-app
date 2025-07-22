import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Bell, Clock, Users } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const { children, buses, trips } = useAppStore();

  const renderParentDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Track your children's bus safely</Text>
      </View>

      <View style={styles.quickStats}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{children.length}</Text>
          <Text style={styles.statLabel}>Children</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>2</Text>
          <Text style={styles.statLabel}>Active Routes</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </Card>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Schedule</Text>
          <Clock size={20} color={Colors.secondary} />
        </View>
        <View style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>7:30 AM</Text>
          <Text style={styles.scheduleText}>Bus B001 - Pickup at Main Street</Text>
        </View>
        <View style={styles.scheduleItem}>
          <Text style={styles.scheduleTime}>3:45 PM</Text>
          <Text style={styles.scheduleText}>Bus B001 - Drop off at Main Street</Text>
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Live Tracking</Text>
          <MapPin size={20} color={Colors.success} />
        </View>
        <Text style={styles.trackingText}>Bus B001 is currently at Park Avenue</Text>
        <Text style={styles.trackingSubtext}>ETA: 5 minutes</Text>
        <TouchableOpacity style={styles.trackButton}>
          <Text style={styles.trackButtonText}>View on Map</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderDriverDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Good morning, {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Your assigned trips for today</Text>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Current Trip</Text>
          <View style={[styles.statusBadge, styles.activeStatus]}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        <Text style={styles.tripInfo}>Route A - North</Text>
        <Text style={styles.tripDetails}>Bus B001 • 7:30 AM - 8:15 AM</Text>
        <View style={styles.tripActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Start Trip</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Student Count</Text>
          <Users size={20} color={Colors.secondary} />
        </View>
        <Text style={styles.studentCount}>25/40 students on board</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progress, { width: '62.5%' }]} />
        </View>
      </Card>
    </ScrollView>
  );

  const renderAdminDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Admin Dashboard</Text>
        <Text style={styles.welcomeSubtext}>Monitor all fleet operations</Text>
      </View>

      <View style={styles.quickStats}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{buses.length}</Text>
          <Text style={styles.statLabel}>Active Buses</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Today's Trips</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>150</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </Card>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Fleet Status</Text>
          <View style={[styles.statusBadge, styles.successStatus]}>
            <Text style={styles.statusText}>All Good</Text>
          </View>
        </View>
        {buses.map(bus => (
          <View key={bus.id} style={styles.busItem}>
            <Text style={styles.busNumber}>Bus {bus.number}</Text>
            <Text style={styles.busStatus}>{bus.status}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderStudentDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Your bus information</Text>
      </View>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Bus</Text>
          <View style={[styles.statusBadge, styles.activeStatus]}>
            <Text style={styles.statusText}>On Route</Text>
          </View>
        </View>
        <Text style={styles.busInfo}>Bus B001 - Route A North</Text>
        <Text style={styles.busDetails}>Driver: Mike Chen</Text>
        <TouchableOpacity style={styles.trackButton}>
          <Text style={styles.trackButtonText}>Track My Bus</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );

  const renderDashboard = () => {
    switch (user?.role) {
      case 'parent':
        return renderParentDashboard();
      case 'driver':
        return renderDriverDashboard();
      case 'admin':
        return renderAdminDashboard();
      case 'student':
        return renderStudentDashboard();
      default:
        return <Text>Unknown role</Text>;
    }
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="Home" />
      {renderDashboard()}
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray[600],
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
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    width: 80,
  },
  scheduleText: {
    fontSize: 16,
    color: Colors.gray[700],
    flex: 1,
  },
  trackingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  trackingSubtext: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 16,
  },
  trackButton: {
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trackButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: Colors.success,
  },
  successStatus: {
    backgroundColor: Colors.success,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  tripInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  tripDetails: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 16,
  },
  tripActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  busItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  busStatus: {
    fontSize: 14,
    color: Colors.success,
    textTransform: 'capitalize',
  },
  busInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  busDetails: {
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 16,
  },
});