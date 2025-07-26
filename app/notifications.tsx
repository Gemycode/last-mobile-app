import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, RefreshControl, Alert, Dimensions, TextInput } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import Card from '../components/Card';
import { Colors } from '../constants/Colors';
import { fetchNotifications } from '../services/busService';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle, Bell, MessageCircle, Bus, User, Clock, Filter, Search, Trash2, MoreVertical, Phone, Video } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { io, Socket } from 'socket.io-client';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInRight,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Mock notifications data structure
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'message',
    senderType: 'driver',
    senderName: 'أحمد السائق',
    title: 'رسالة جديدة من السائق',
    message: 'الباص سيتأخر 10 دقائق بسبب الزحام المروري',
    time: '2 دقيقة',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    priority: 'high',
    busId: 'bus123',
    tripId: 'trip456'
  },
  {
    id: '2',
    type: 'location',
    senderType: 'driver',
    senderName: 'محمد السائق',
    title: 'الباص وصل إلى المدرسة',
    message: 'تم الوصول إلى المدرسة بنجاح، جميع الطلاب بخير',
    time: '15 دقيقة',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: true,
    priority: 'medium',
    busId: 'bus124',
    tripId: 'trip457'
  },
  {
    id: '3',
    type: 'message',
    senderType: 'student',
    senderName: 'فاطمة أحمد',
    title: 'رسالة من الطالبة',
    message: 'أنا بخير، وصلت إلى المدرسة بأمان',
    time: '1 ساعة',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: false,
    priority: 'low',
    busId: 'bus123',
    tripId: 'trip456'
  },
  {
    id: '4',
    type: 'emergency',
    senderType: 'driver',
    senderName: 'علي السائق',
    title: 'تنبيه مهم',
    message: 'مشكلة في الباص، سيتم إرسال باص بديل خلال 20 دقيقة',
    time: '3 ساعات',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
    priority: 'high',
    busId: 'bus125',
    tripId: 'trip458'
  }
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'messages' | 'location' | 'emergency'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  // Enhanced animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [
      { translateY: interpolate(fadeValue.value, [0, 1], [30, 0], Extrapolate.CLAMP) },
      { scale: scaleValue.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      // In real app, fetch from API
      // const data = await fetchNotifications();
      // setNotifications(data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(MOCK_NOTIFICATIONS);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('خطأ', 'فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    const s = io('http://10.171.240.82:5000');
    setSocket(s);

    s.on('new-notification', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    s.on('message-notification', (messageData) => {
      const newNotification = {
        id: Date.now().toString(),
        type: 'message',
        senderType: messageData.senderRole,
        senderName: messageData.senderName || 'مستخدم',
        title: `رسالة جديدة من ${messageData.senderRole === 'driver' ? 'السائق' : 'الطالب'}`,
        message: messageData.message,
        time: 'الآن',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        busId: messageData.busId,
        tripId: messageData.tripId
      };
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Filter and search notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'messages' && notification.type === 'message') ||
      (filter === 'location' && notification.type === 'location') ||
      (filter === 'emergency' && notification.type === 'emergency');
    
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.senderName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    Alert.alert(
      'حذف الإشعار',
      'هل أنت متأكد من حذف هذا الإشعار؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
          }
        }
      ]
    );
  };

  // Get notification icon and color
  const getNotificationIcon = (type: string, priority: string) => {
    const iconColor = priority === 'high' ? '#EF4444' : 
                     priority === 'medium' ? Colors.primary : '#10B981';
    
    switch (type) {
      case 'message':
        return <MessageCircle size={20} color={iconColor} />;
      case 'location':
        return <Bus size={20} color={iconColor} />;
      case 'emergency':
        return <Bell size={20} color="#EF4444" />;
      default:
        return <Bell size={20} color={iconColor} />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return Colors.primary;
      case 'low':
        return '#10B981';
      default:
        return Colors.primary;
    }
  };

  const renderNotification = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInUp.delay(index * 100)}
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
    >
      <LinearGradient
        colors={item.read ? ['#ffffff', '#f8fafc'] : ['#ffffff', '#f0f9ff']}
        style={styles.notificationGradient}
      >
        <View style={styles.notificationContent}>
          <View style={[
            styles.notificationIcon, 
            { backgroundColor: getPriorityColor(item.priority) + '20' }
          ]}> 
            {getNotificationIcon(item.type, item.priority)}
          </View>
          
          <View style={styles.notificationText}>
            <View style={styles.notificationHeader}>
              <View style={styles.titleContainer}>
                <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                  {item.title}
                </Text>
                {item.priority === 'high' && (
                  <View style={[styles.priorityBadge, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.priorityText}>مهم</Text>
                  </View>
                )}
              </View>
              <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
            
            <View style={styles.senderInfo}>
              <User size={12} color="#64748b" />
              <Text style={styles.senderName}>{item.senderName}</Text>
              <View style={[
                styles.senderType, 
                { backgroundColor: item.senderType === 'driver' ? Colors.primary + '20' : '#10B98120' }
              ]}>
                <Text style={[
                  styles.senderTypeText,
                  { color: item.senderType === 'driver' ? Colors.primary : '#10B981' }
                ]}>
                  {item.senderType === 'driver' ? 'سائق' : 'طالب'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
        </View>

        <View style={styles.notificationActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => markAsRead(item.id)}
          >
            <CheckCircle size={16} color={item.read ? "#94a3b8" : Colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => deleteNotification(item.id)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, '#3A6D8C']} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>الإشعارات</Text>
            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, pulseStyle]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </Animated.View>
            )}
          </View>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <CheckCircle size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search and Filter */}
      <Animated.View style={[styles.searchSection, animatedStyle]}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.searchGradient}
        >
          <View style={styles.searchContainer}>
            <Search size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="البحث في الإشعارات..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
          >
            {[
              { key: 'all', label: 'الكل', icon: Bell },
              { key: 'unread', label: 'غير مقروءة', icon: MessageCircle },
              { key: 'messages', label: 'الرسائل', icon: MessageCircle },
              { key: 'location', label: 'الموقع', icon: Bus },
              { key: 'emergency', label: 'الطوارئ', icon: Bell }
            ].map((filterOption) => {
              const IconComponent = filterOption.icon;
              const isActive = filter === filterOption.key;
              
              return (
                <TouchableOpacity
                  key={filterOption.key}
                  style={[styles.filterChip, isActive && styles.activeFilterChip]}
                  onPress={() => setFilter(filterOption.key as any)}
                >
                  <LinearGradient
                    colors={isActive ? [Colors.primary, '#3A6D8C'] : ['#f1f5f9', '#e2e8f0']}
                    style={styles.filterChipGradient}
                  >
                    <IconComponent size={16} color={isActive ? "#fff" : "#64748b"} />
                    <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
                      {filterOption.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Notifications List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
          </View>
        ) : filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#f1f5f9', '#e2e8f0']}
              style={styles.emptyIcon}
            >
              <Bell size={48} color="#94a3b8" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery || filter !== 'all' 
                ? 'لا توجد إشعارات تطابق البحث المحدد'
                : 'أنت محدث! ستظهر الإشعارات الجديدة هنا.'
              }
            </Text>
            {(searchQuery || filter !== 'all') && (
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              >
                <Text style={styles.clearFiltersText}>مسح الفلاتر</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search and Filter Section
  searchSection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeFilterChip: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  filterChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeFilterChipText: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  listContainer: {
    padding: 24,
  },
  notificationCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notificationGradient: {
    padding: 20,
    position: 'relative',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  senderType: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  senderTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});