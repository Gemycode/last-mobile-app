import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, RefreshControl, Dimensions, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { fetchChatMessages, sendChatMessage, fetchChildren, fetchActiveBuses, fetchStudentBookings, fetchDriverTodayTrips } from '../../services/busService';
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
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    typingValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
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

  const typingStyle = useAnimatedStyle(() => ({
    opacity: typingValue.value,
    transform: [{ scale: 0.8 + typingValue.value * 0.2 }],
  }));

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideValue.value }],
  }));

  // Add state to store available trips and selected trip
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [tripId, setTripId] = useState<string>('');

  // Load data function
  const loadData = async () => {
    try {
      if (!user) return;
      
      if (user.role === 'parent') {
        const childrenData = await fetchChildren();
        setChildren(childrenData);
        
        const results = await Promise.all(childrenData.map((child: any) => fetchStudentBookings(child._id)));
        const allTrips = results.flat().map((b: any) => b.tripId).filter(Boolean);
        let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && allTrips.length > 0) activeTrip = allTrips[0];
        if (activeTrip) setSelectedTrip(activeTrip);
      } else if (user.role === 'student') {
        const bookings = await fetchStudentBookings(user.id);
        const allTrips = bookings.map((b: any) => b.tripId).filter(Boolean);
        let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && allTrips.length > 0) activeTrip = allTrips[0];
        if (activeTrip) setSelectedTrip(activeTrip);
      } else if (user.role === 'driver') {
        const trips = await fetchDriverTodayTrips(user.id);
        let activeTrip = trips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && trips.length > 0) activeTrip = trips[0];
        if (activeTrip) setSelectedTrip(activeTrip);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    setBusId(selectedTrip.busId || selectedTrip.bus?._id || selectedTrip.bus?._id || '');
    setTripId(selectedTrip._id || selectedTrip.id || '');
  }, [selectedTrip]);

  useEffect(() => {
    if (!busId) return;
    setLoading(true);
    fetchChatMessages(busId, tripId)
      .then(setMessages)
      .finally(() => setLoading(false));
    // Setup socket.io
    const s = io('http://10.171.240.82:5000'); // Use correct server IP
    setSocket(s);
    console.log('Joining bus room:', busId);
    s.emit('join-bus', busId);
    s.on('bus-message', (msg) => {
      console.log('Receiving message via socket:', msg);
      setMessages(prev => [...prev, msg]);
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
    if ((!input.trim() && !image) || !busId || !tripId) return;
    
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
    
    const newMsg = {
      id: Date.now(), // Temporary unique key
      busId,
      tripId,
      senderId: user?.id || '',
      senderRole: user?.role || '',
      senderName: user?.name || 'Unknown',
      message: input,
      imageUrl,
      createdAt: new Date(),
      status: 'sent'
    };
    
    try {
      await sendChatMessage(busId, tripId, newMsg);
      setInput('');
      setImage(null);
      setMessages(prev => [...prev, newMsg]); // Show message immediately to sender
      if (socket) {
        socket.emit('bus-message', newMsg);
        socket.emit('typing-stop', user?.id);
      }
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
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
          colors={isOwnMessage ? [Colors.primary, '#3A6D8C'] : ['#ffffff', '#f8fafc']}
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
                {msg.status === 'sent' && <Check size={12} color="rgba(255,255,255,0.7)" />}
                {msg.status === 'delivered' && <CheckCheck size={12} color="rgba(255,255,255,0.7)" />}
                {msg.status === 'read' && <CheckCheck size={12} color="#10B981" />}
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

  return (
    <>
      <CustomHeader title="Chat" subtitle="Communicate with the driver" showNotifications={false} />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                  <Text style={styles.headerTitle}>Bus Driver</Text>
                  <View style={styles.onlineStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online Now</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
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
          
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id || index} msg={msg} index={index} />
          ))}
          
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
    paddingTop: 16,
    paddingBottom: 20,
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
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 18,
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
  },
  messagesContent: {
    paddingVertical: 16,
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
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ownBubble: {
    borderBottomRightRadius: 8,
  },
  otherBubble: {
    borderBottomLeftRadius: 8,
  },
  messageHeader: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 11,
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: '#94a3b8',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
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
  },
  inputGradient: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  attachButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreview: {
    position: 'absolute',
    top: -60,
    right: 0,
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});