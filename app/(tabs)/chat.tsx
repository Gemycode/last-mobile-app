import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, RefreshControl, Dimensions, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChatMessages, sendChatMessage, fetchChildren, fetchActiveBuses, fetchStudentBookings, fetchDriverTodayTrips, fetchDriverInfo, fetchAllDrivers, fetchBusInfo } from '../../services/busService';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Send, Paperclip, Camera, Mic, MoreVertical, Phone, Video, User, Clock, Check, CheckCheck } from 'lucide-react-native';
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
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Dummy messages for initial state
const DUMMY_MESSAGES = [
  { id: 1, sender: 'Driver', message: 'The bus will be late due to traffic.', createdAt: new Date() },
  { id: 2, sender: 'Parent', message: 'Thank you for the update!', createdAt: new Date() },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>(DUMMY_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const user = useAuthStore(state => state.user);
  const scrollViewRef = useRef<ScrollView>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [busId, setBusId] = useState<string | null>(null);
  const [busIdError, setBusIdError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Enhanced animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const slideValue = useSharedValue(0);
  const typingValue = useSharedValue(0);

  useEffect(() => {
    'worklet';
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    typingValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: fadeValue.value,
      transform: [
        { translateY: interpolate(fadeValue.value, [0, 1], [30, 0], Extrapolate.CLAMP) },
        { scale: scaleValue.value }
      ],
    };
  });

  const typingStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: typingValue.value,
      transform: [{ scale: 0.8 + typingValue.value * 0.2 }],
    };
  });

  const slideStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: slideValue.value }],
    };
  });

  // Add state to store available trips and selected trip
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [tripId, setTripId] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState<any | null>(null);
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [showTripSelector, setShowTripSelector] = useState(false);

  // Load data function
  const loadData = async () => {
    try {
      if (!user) return;
      
      console.log('Loading data for user:', user.role, user.id);
      
             if (user.role === 'parent') {
         const childrenData = await fetchChildren();
         console.log('Children data:', childrenData);
         setChildren(childrenData);
         
         if (childrenData && childrenData.length > 0) {
           const results = await Promise.all(childrenData.map((child: any) => fetchStudentBookings(child._id)));
           const allTrips = results.flat().filter(Boolean);
           console.log('All trips for parent:', allTrips);
           setAvailableTrips(allTrips);
           
           // تحسين اختيار الرحلة - إضافة تفاصيل أكثر
           console.log('Available trips details:', allTrips.map(t => ({
             id: t._id,
             busId: t.busId?._id || t.busId,
             status: t.status,
             date: t.date,
             studentName: t.studentId?.name || 'Unknown'
           })));
           
           // البحث عن رحلة نشطة أولاً
           let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
           
           // إذا لم توجد رحلة نشطة، ابحث عن رحلة pending
           if (!activeTrip) {
             activeTrip = allTrips.find((t: any) => t.status === 'pending');
           }
           
           // إذا لم توجد رحلة pending، خذ أول رحلة
           if (!activeTrip && allTrips.length > 0) {
             activeTrip = allTrips[0];
           }
           
           if (activeTrip) {
             console.log('Selected trip for parent:', {
               id: activeTrip._id,
               busId: activeTrip.busId?._id || activeTrip.busId,
               status: activeTrip.status,
               date: activeTrip.date
             });
             setSelectedTrip(activeTrip);
           } else {
             console.log('No active trip found for parent');
           }
         } else {
           console.log('No children found for parent');
         }
      } else if (user.role === 'student') {
        const bookings = await fetchStudentBookings(user.id);
        console.log('Bookings for student:', bookings);
        const allTrips = bookings.filter(Boolean);
        
        let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && allTrips.length > 0) activeTrip = allTrips[0];
        
        if (activeTrip) {
          console.log('Selected trip for student:', activeTrip);
          setSelectedTrip(activeTrip);
        } else {
          console.log('No active trip found for student');
        }
      } else if (user.role === 'driver') {
        const trips = await fetchDriverTodayTrips(user.id);
        console.log('Trips for driver:', trips);
        
        let activeTrip = trips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && trips.length > 0) activeTrip = trips[0];
        
        if (activeTrip) {
          console.log('Selected trip for driver:', activeTrip);
          setSelectedTrip(activeTrip);
        } else {
          console.log('No active trip found for driver');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Load driver info function
  const loadDriverInfo = async (driverId: string) => {
    try {
      console.log('Loading driver info for driverId:', driverId);
      
      // First try to get driver info from the drivers list (this endpoint is accessible to all users)
      const allDrivers = await fetchAllDrivers();
      console.log('All drivers fetched:', allDrivers);
      
      if (Array.isArray(allDrivers) && allDrivers.length > 0) {
        const driver = allDrivers.find((d: any) => d._id === driverId);
        console.log('Found driver in list:', driver);
        
        if (driver) {
          console.log('Driver info found from drivers list:', driver);
          setDriverInfo({
            name: `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name || 'Bus Driver',
            firstName: driver.firstName || 'Bus',
            lastName: driver.lastName || 'Driver'
          });
          return; // Exit early if we found the driver
        }
      }
      
      // If we didn't find the driver in the list, try to get driver info from bus data
      if (busId) {
        console.log('Trying to get driver info from bus data...');
        try {
          const busInfo = await fetchBusInfo(busId);
          if (busInfo && busInfo.driverId && busInfo.driverId._id === driverId) {
            console.log('Driver info found in bus data:', busInfo.driverId);
            setDriverInfo({
              name: `${busInfo.driverId.firstName || ''} ${busInfo.driverId.lastName || ''}`.trim() || busInfo.driverId.name || 'Bus Driver',
              firstName: busInfo.driverId.firstName || 'Bus',
              lastName: busInfo.driverId.lastName || 'Driver'
            });
            return; // Exit early if we found the driver
          }
        } catch (busError: any) {
          console.error('Error fetching bus info:', busError);
        }
      }
      
      // If we didn't find the driver in the list or bus data, try the individual endpoint
      console.log('Driver not found in list or bus data, trying individual endpoint...');
      try {
        const driverData = await fetchDriverInfo(driverId);
        console.log('Driver info loaded from individual endpoint:', driverData);
        setDriverInfo(driverData);
      } catch (individualError: any) {
        console.error('Error loading individual driver info:', individualError);
        if (individualError?.response?.status === 403) {
          console.log('Permission denied to access driver info - this is expected for non-admin users');
        }
        // Set default driver info
        setDriverInfo({
          name: 'Bus Driver',
          firstName: 'Bus',
          lastName: 'Driver'
        });
      }
    } catch (error: any) {
      console.error('Error loading driver info:', error);
      // Set default driver info for any error
      setDriverInfo({
        name: 'Bus Driver',
        firstName: 'Bus',
        lastName: 'Driver'
      });
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // When page loads, fetch only the active trip (or first available trip) for the user
  useEffect(() => {
    loadData();
  }, [user]);

  // When selected trip changes, update busId and tripId
  useEffect(() => {
    if (!selectedTrip) return;
    
    console.log('Processing selectedTrip:', selectedTrip);
    
    // Handle different bus ID formats
    let newBusId = '';
    if (selectedTrip.busId) {
      // If busId is an object, extract the _id
      if (typeof selectedTrip.busId === 'object' && selectedTrip.busId._id) {
        newBusId = selectedTrip.busId._id;
      } else if (typeof selectedTrip.busId === 'string') {
        newBusId = selectedTrip.busId;
      }
    } else if (selectedTrip.bus?._id) {
      newBusId = selectedTrip.bus._id;
    } else if (selectedTrip.bus?.id) {
      newBusId = selectedTrip.bus.id;
    }
    
    const newTripId = selectedTrip._id || selectedTrip.id || '';
    
    console.log('Setting busId and tripId:', { newBusId, newTripId, selectedTrip });
    
    if (!newBusId || !newTripId) {
      console.error('Missing busId or tripId from selectedTrip:', selectedTrip);
      return;
    }
    
    // تحقق من أن هذه الرحلة تحتوي على رسائل
    console.log('Trip details for chat:', {
      tripId: newTripId,
      busId: newBusId,
      status: selectedTrip.status,
      date: selectedTrip.date,
      hasDriver: !!selectedTrip.driverId,
      studentName: selectedTrip.studentId?.name || 'Unknown'
    });
    
    setBusId(newBusId);
    setTripId(newTripId);

    // Load driver info if we have driverId
    if (selectedTrip.driverId) {
      console.log('Driver ID from trip:', selectedTrip.driverId);
      
      // Check if driver info is already available in the trip data
      if (selectedTrip.driverId && typeof selectedTrip.driverId === 'object' && selectedTrip.driverId.name) {
        console.log('Driver info found in trip data:', selectedTrip.driverId);
        setDriverInfo(selectedTrip.driverId);
      } else if (typeof selectedTrip.driverId === 'string') {
        // Try to fetch driver info from API
        loadDriverInfo(selectedTrip.driverId);
      } else {
        console.log('Invalid driverId format:', selectedTrip.driverId);
        setDriverInfo({
          name: 'Bus Driver',
          firstName: 'Bus',
          lastName: 'Driver'
        });
      }
    } else if (selectedTrip.busId && typeof selectedTrip.busId === 'object' && selectedTrip.busId.driverId) {
      // Check if driver info is available in bus data within the trip
      console.log('Driver info found in bus data within trip:', selectedTrip.busId.driverId);
      if (typeof selectedTrip.busId.driverId === 'object' && selectedTrip.busId.driverId.name) {
        setDriverInfo(selectedTrip.busId.driverId);
      } else if (typeof selectedTrip.busId.driverId === 'string') {
        loadDriverInfo(selectedTrip.busId.driverId);
      } else {
        setDriverInfo({
          name: 'Bus Driver',
          firstName: 'Bus',
          lastName: 'Driver'
        });
      }
    } else {
      // No driver info available, set default
      console.log('No driverId found in trip data');
      setDriverInfo({
        name: 'Bus Driver',
        firstName: 'Bus',
        lastName: 'Driver'
      });
    }
  }, [selectedTrip]);

  useEffect(() => {
    if (!busId || !tripId) {
      console.log('Skipping message load - missing busId or tripId:', { busId, tripId });
      return;
    }
    
    console.log('Loading messages for:', { busId, tripId });
    setLoading(true);
    fetchChatMessages(busId, tripId)
      .then((messages) => {
        console.log('Loaded messages:', messages);
        console.log('Messages count:', messages?.length || 0);
        
        // تحليل الرسائل
        if (messages && messages.length > 0) {
          const messageAnalysis = {
            total: messages.length,
            fromDriver: messages.filter((m: any) => m.senderRole === 'driver').length,
            fromParent: messages.filter((m: any) => m.senderRole === 'parent').length,
            fromStudent: messages.filter((m: any) => m.senderRole === 'student').length,
            latestMessage: messages[messages.length - 1]?.message || 'No message',
            latestSender: messages[messages.length - 1]?.senderRole || 'Unknown'
          };
          console.log('Message analysis:', messageAnalysis);
        } else {
          console.log('No messages found in this trip');
        }
        
        setMessages(messages || []);
      })
      .catch((error) => {
        console.error('Error loading messages:', error);
        setMessages([]);
      })
      .finally(() => setLoading(false));
    
    // Setup socket.io
    const s = io('http://10.171.240.82:5000'); // Use correct server IP
    setSocket(s);
    console.log('Joining chat room:', { busId, tripId });
    s.emit('join-chat', { busId, tripId });
    s.on('chat-message', (msg) => {
      console.log('Receiving message via socket:', msg);
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(existingMsg => 
          existingMsg.id === msg.id || 
          (existingMsg.senderId === msg.senderId && 
           existingMsg.message === msg.message && 
           Math.abs(new Date(existingMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000)
        );
        if (exists) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    s.on('typing-start', (userId) => {
      setTypingUsers(prev => [...new Set([...prev, userId])]);
    });
    s.on('typing-stop', (userId) => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });
    return () => { s.disconnect(); };
  }, [busId, tripId]);

  const handlePickImage = async (type: 'camera' | 'gallery') => {
    try {
      let result;
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setImage(result.assets[0].uri);
        setShowAttachMenu(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || !busId || !tripId) {
      console.log('Cannot send message:', { input: input.trim(), image, busId, tripId });
      
      if (!busId || !tripId) {
        Alert.alert(
          'No Active Trip', 
          'You need an active trip to send messages. Please wait for a trip to be assigned or contact support.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    // Ensure busId is a string, not an object
    const actualBusId = typeof busId === 'object' && busId !== null ? (busId as any)._id : busId;
    if (!actualBusId) {
      Alert.alert('Error', 'Invalid bus information. Please refresh the page.');
      return;
    }
    
    let imageUrl = undefined;
    if (image) {
      try {
        // Upload image to backend (assumes endpoint /api/uploads or similar)
        const formData = new FormData();
        formData.append('image', {
          uri: image,
          name: 'chat.jpg',
          type: 'image/jpeg',
        } as any);
        const res = await fetch('http://10.171.240.82:5000/api/uploads', {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = await res.json();
        imageUrl = data.url || data.path || data.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        return;
      }
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }

    const messageData = {
      senderId: user.id,
      senderRole: user.role || '',
      senderName: user.name || 'Unknown',
      message: input,
      imageUrl,
    };
    
    const newMsg = {
      id: Date.now(), // Temporary unique key
      busId: actualBusId,
      tripId,
      ...messageData,
      createdAt: new Date(),
      status: 'sent'
    };
    
    try {
      console.log('Sending message with data:', { actualBusId, tripId, messageData });
      await sendChatMessage(actualBusId, tripId, messageData);
      setInput('');
      setImage(null);
      setMessages(prev => [...prev, newMsg]); // Show message immediately to sender
      if (socket) {
        socket.emit('chat-message', newMsg);
        socket.emit('typing-stop', user?.id);
      }
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      console.error('Message data:', messageData);
      console.error('BusId and TripId:', { busId, tripId });
      
      let errorMessage = 'Failed to send message. Please try again.';
      if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Chat room not found. Please refresh the page.';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid message format. Please check your input.';
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleTyping = (text: string) => {
    setInput(text);
    if (socket) {
      if (text.trim()) {
        socket.emit('typing-start', user?.id);
      } else {
        socket.emit('typing-stop', user?.id);
      }
    }
  };

  // MessageBubble component
  const MessageBubble = ({ msg, index }: { msg: any, index: number }) => {
    const isOwnMessage = user?.role === msg.senderRole && user?.id === msg.senderId;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50)}
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
                 <LinearGradient
           colors={isOwnMessage ? ['#3B82F6', '#1D4ED8'] : ['#ffffff', '#f8fafc']}
           style={[
             styles.messageBubble,
             isOwnMessage ? styles.ownBubble : styles.otherBubble
           ]}
         >
          {!isOwnMessage && (
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{msg.senderName || msg.sender}</Text>
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownText : styles.otherText
          ]}>
            {typeof msg.message === 'string' ? msg.message : ''}
          </Text>
          
          {msg.imageUrl && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: msg.imageUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </View>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownTime : styles.otherTime
            ]}>
              {msg.createdAt ? (typeof msg.createdAt === 'string' || typeof msg.createdAt === 'number' ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') : ''}
            </Text>
                         {isOwnMessage && (
               <View style={styles.messageStatus}>
                 {msg.status === 'sent' && <Check size={10} color="rgba(255,255,255,0.9)" />}
                 {msg.status === 'delivered' && <CheckCheck size={10} color="rgba(255,255,255,0.9)" />}
                 {msg.status === 'read' && <CheckCheck size={10} color="#10B981" />}
               </View>
             )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Typing indicator
  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    return (
      <Animated.View style={[styles.typingIndicator, typingStyle]}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.typingBubble}
        >
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, { animationDelay: '0ms' }]} />
            <Animated.View style={[styles.typingDot, { animationDelay: '150ms' }]} />
            <Animated.View style={[styles.typingDot, { animationDelay: '300ms' }]} />
          </View>
          <Text style={styles.typingText}>typing...</Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Trip Selector Component
  const TripSelector = () => {
    if (!showTripSelector || availableTrips.length === 0) return null;
    
    return (
      <Animated.View entering={FadeInDown} style={styles.tripSelector}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.tripSelectorGradient}
        >
          <View style={styles.tripSelectorHeader}>
            <Text style={styles.tripSelectorTitle}>اختر الرحلة</Text>
            <TouchableOpacity onPress={() => setShowTripSelector(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.tripList}>
            {availableTrips.map((trip, index) => {
              const tripBusId = trip.busId?._id || trip.busId;
              const isSelected = selectedTrip?._id === trip._id;
              
              return (
                <TouchableOpacity
                  key={trip._id}
                  style={[styles.tripItem, isSelected && styles.selectedTripItem]}
                  onPress={() => {
                    setSelectedTrip(trip);
                    setShowTripSelector(false);
                  }}
                >
                  <View style={styles.tripItemContent}>
                    <Text style={styles.tripItemTitle}>
                      رحلة {index + 1} - {trip.studentId?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.tripItemDetails}>
                      الباص: {tripBusId} | الحالة: {trip.status}
                    </Text>
                    <Text style={styles.tripItemDate}>
                      {new Date(trip.date).toLocaleDateString()}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <>
      <CustomHeader title="Chat" subtitle="Communicate with the driver" showNotifications={false} />
             <KeyboardAvoidingView
         style={{ flex: 1 }}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
         keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 50}
       >
        <StatusBar style="light" />
        
        {/* Chat Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.chatHeader}>
          <LinearGradient
            colors={[Colors.primary, '#3A6D8C']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerInfo}>
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.avatarContainer}
                >
                  <User size={24} color={Colors.primary} />
                </LinearGradient>
                                 <View style={styles.headerText}>
                   <Text style={styles.headerTitle}>
                     {driverInfo ? `${driverInfo.firstName || ''} ${driverInfo.lastName || ''}`.trim() || driverInfo.name || 'Bus Driver' : 'Bus Driver'}
                   </Text>
                   <View style={styles.onlineStatus}>
                     <View style={styles.onlineDot} />
                     <Text style={styles.onlineText}>Online Now</Text>
                   </View>
                 </View>
              </View>
                             <View style={styles.headerActions}>
                 {availableTrips.length > 1 && (
                   <TouchableOpacity 
                     style={styles.actionButton}
                     onPress={() => setShowTripSelector(true)}
                   >
                     <Text style={styles.tripButtonText}>Trip</Text>
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity style={styles.actionButton}>
                   <Phone size={20} color="#fff" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.actionButton}>
                   <Video size={20} color="#fff" />
                 </TouchableOpacity>
                 <TouchableOpacity style={styles.actionButton}>
                   <MoreVertical size={20} color="#fff" />
                 </TouchableOpacity>
               </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Messages */}
                 <ScrollView 
           ref={scrollViewRef}
           style={styles.messagesContainer}
           showsVerticalScrollIndicator={false}
           contentContainerStyle={styles.messagesContent}
           keyboardShouldPersistTaps="handled"
           keyboardDismissMode="interactive"
           automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
           refreshControl={
             <RefreshControl 
               refreshing={refreshing}
               onRefresh={onRefresh}
               tintColor={Colors.primary}
               colors={[Colors.primary]}
             />
           }
         >
          <Animated.View entering={FadeInUp.delay(200)} style={styles.dateHeader}>
            <LinearGradient
              colors={['#f1f5f9', '#e2e8f0']}
              style={styles.dateContainer}
            >
              <Clock size={14} color="#64748b" />
              <Text style={styles.dateText}>Today</Text>
            </LinearGradient>
          </Animated.View>
          
          {!busId || !tripId ? (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyState}>
              <User size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyStateTitle}>No Active Trip</Text>
              <Text style={styles.emptyStateSubtitle}>
                {user?.role === 'parent' 
                  ? 'Select a child to view their trip chat'
                  : user?.role === 'student'
                  ? 'You need an active trip to start chatting'
                  : 'You need an active trip to start chatting'
                }
              </Text>
            </Animated.View>
          ) : messages.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(300)} style={styles.emptyState}>
              <User size={64} color={Colors.gray[300]} />
              <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start the conversation by sending a message
              </Text>
            </Animated.View>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble key={msg.id || index} msg={msg} index={index} />
            ))
          )}
          
          <TypingIndicator />
        </ScrollView>

        {/* Attachment Menu */}
        {showAttachMenu && (
          <Animated.View entering={SlideInRight} style={styles.attachMenu}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.attachMenuGradient}
            >
              <TouchableOpacity 
                style={styles.attachMenuItem}
                onPress={() => handlePickImage('camera')}
              >
                <LinearGradient
                  colors={[Colors.primary, '#3A6D8C']}
                  style={styles.attachMenuIcon}
                >
                  <Camera size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.attachMenuText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.attachMenuItem}
                onPress={() => handlePickImage('gallery')}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.attachMenuIcon}
                >
                  <Paperclip size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.attachMenuText}>Gallery</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Input Area */}
        <Animated.View style={[styles.inputContainer, animatedStyle]}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.inputGradient}
          >
            <View style={styles.inputRow}>
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={() => setShowAttachMenu(!showAttachMenu)}
              >
                <LinearGradient
                  colors={['#f1f5f9', '#e2e8f0']}
                  style={styles.attachButtonGradient}
                >
                  <Paperclip size={20} color="#64748b" />
                </LinearGradient>
              </TouchableOpacity>
              
                               <View style={styles.textInputContainer}>
                   <TextInput
                     style={styles.textInput}
                     value={input}
                     onChangeText={handleTyping}
                     placeholder="Type a message..."
                     placeholderTextColor="#94a3b8"
                     multiline
                     maxLength={500}
                     textAlignVertical="top"
                     blurOnSubmit={false}
                   />
                {image && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: image }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setImage(null)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSend}
                disabled={!input.trim() && !image}
              >
                <LinearGradient
                  colors={input.trim() || image ? [Colors.primary, '#3A6D8C'] : ['#f1f5f9', '#e2e8f0']}
                  style={styles.sendButtonGradient}
                >
                  <Send size={20} color={input.trim() || image ? "#fff" : "#94a3b8"} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
                 </Animated.View>
       </KeyboardAvoidingView>
       
       {/* Trip Selector Modal */}
       <TripSelector />
     </>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Chat Header
  chatHeader: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  onlineText: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages Container
  messagesContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 5 : 10,
  },
  messagesContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  // Message Bubbles
  messageContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  ownBubble: {
    borderBottomRightRadius: 6,
  },
  otherBubble: {
    borderBottomLeftRadius: 6,
  },
  messageHeader: {
    marginBottom: 6,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: '400',
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#1e293b',
  },
  imageContainer: {
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
    marginRight: 4,
  },
  ownTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherTime: {
    color: '#94a3b8',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Typing Indicator
  typingIndicator: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  typingBubble: {
    maxWidth: '60%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
    marginRight: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Attachment Menu
  attachMenu: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    zIndex: 1000,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  attachMenuGradient: {
    padding: 16,
    borderRadius: 16,
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  attachMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },

  // Input Container
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 15 : 20,
    zIndex: 1000,
  },
  inputGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  attachButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    maxHeight: 100,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  imagePreview: {
    position: 'absolute',
    top: -70,
    right: 0,
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },

  // Trip Selector Styles
  tripSelector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  tripSelectorGradient: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  tripSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tripSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: 'bold',
  },
  tripList: {
    maxHeight: 400,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedTripItem: {
    backgroundColor: '#dbeafe',
    borderColor: Colors.primary,
  },
  tripItemContent: {
    flex: 1,
  },
  tripItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  tripItemDetails: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  tripItemDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});