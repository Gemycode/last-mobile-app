import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
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
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// رسالة وهمية كبداية
const DUMMY_MESSAGES = [
  { id: 1, sender: 'Driver', message: 'The bus will be late due to traffic.', createdAt: new Date() },
  { id: 2, sender: 'Parent', message: 'Thank you for the update!', createdAt: new Date() },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<any[]>(DUMMY_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const scrollViewRef = useRef<ScrollView>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [busId, setBusId] = useState<string | null>(null);
  const [busIdError, setBusIdError] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const fadeValue = useSharedValue(0);
  useEffect(() => {
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateY: (1 - fadeValue.value) * 30 }],
  }));

  // 1. أضف حالة لتخزين الرحلات المتاحة والرحلة المختارة
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [tripId, setTripId] = useState<string>('');

  // عند تحميل الصفحة، اجلب الرحلة النشطة فقط (أو أول رحلة متاحة) للمستخدم
  useEffect(() => {
    if (!user) return;
    if (user.role === 'parent') {
      fetchChildren().then((children: any[]) => {
        Promise.all(children.map((child: any) => fetchStudentBookings(child._id)))
          .then((results: any[]) => {
            // ابحث عن أول رحلة حالية (status === 'started' أو 'active') أو خذ أول رحلة متاحة
            const allTrips = results.flat().map((b: any) => b.tripId).filter(Boolean);
            let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
            if (!activeTrip && allTrips.length > 0) activeTrip = allTrips[0];
            if (activeTrip) setSelectedTrip(activeTrip);
          });
      });
    } else if (user.role === 'student') {
      fetchStudentBookings(user.id).then((bookings: any[]) => {
        const allTrips = bookings.map((b: any) => b.tripId).filter(Boolean);
        let activeTrip = allTrips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && allTrips.length > 0) activeTrip = allTrips[0];
        if (activeTrip) setSelectedTrip(activeTrip);
      });
    } else if (user.role === 'driver') {
      fetchDriverTodayTrips(user.id).then((trips: any[]) => {
        let activeTrip = trips.find((t: any) => t.status === 'started' || t.status === 'active');
        if (!activeTrip && trips.length > 0) activeTrip = trips[0];
        if (activeTrip) setSelectedTrip(activeTrip);
      });
    }
  }, [user]);

  // 3. عند تغيير الرحلة المختارة، حدّث busId و tripId
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
    // إعداد socket.io
    const s = io('http://10.171.240.82:5000'); // استخدم IP السيرفر الصحيح
    setSocket(s);
    console.log('الانضمام لغرفة الباص:', busId);
    s.emit('join-bus', busId);
    s.on('bus-message', (msg) => {
      console.log('استقبال رسالة عبر سوكيت:', msg);
      setMessages(prev => [...prev, msg]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => { s.disconnect(); };
  }, [busId, tripId]);

  const handlePickImage = async (type: 'camera' | 'gallery') => {
    let result;
    if (type === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
    }
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || !busId || !tripId) return;
    let imageUrl = undefined;
    if (image) {
      // رفع الصورة للباك اند (يفترض وجود endpoint /api/uploads أو مشابه)
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
    }
    const newMsg = {
      id: Date.now(), // مفتاح فريد مؤقت
      busId,
      tripId,
      senderId: user?.id || '',
      senderRole: user?.role || '',
      message: input,
      imageUrl,
      createdAt: new Date()
    };
    try {
      await sendChatMessage(busId, tripId, newMsg);
      setInput('');
      setImage(null);
      setMessages(prev => [...prev, newMsg]); // تظهر الرسالة فوراً للمرسل
      if (socket) socket.emit('bus-message', newMsg);
    } catch {}
  };

  // MessageBubble component
  const MessageBubble = ({ msg, index }: { msg: any, index: number }) => {
    const isParent = user?.role === msg.senderRole && user?.id === msg.senderId;
    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isParent ? styles.parentMessage : styles.driverMessage,
          animatedStyle,
          { transform: [{ translateY: (1 - fadeValue.value) * (index * 10 + 20) }] }
        ]}
      >
        <View style={[
          styles.messageBubble,
          isParent ? styles.parentBubble : styles.driverBubble
        ]}>
          <Text style={[
            styles.messageText,
            isParent ? styles.parentText : styles.driverText
          ]}>
            {typeof msg.message === 'string' ? msg.message : ''}
          </Text>
          {msg.imageUrl && (
            <Image source={{ uri: msg.imageUrl }} style={{ width: 120, height: 120, borderRadius: 8, marginTop: 6 }} />
          )}
          <Text style={[
            styles.messageTime,
            isParent ? styles.parentTime : styles.driverTime
          ]}>
            {msg.createdAt ? (typeof msg.createdAt === 'string' || typeof msg.createdAt === 'number' ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') : ''}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      <CustomHeader title="Chat" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {/* لا تعرض أي Picker أو اختيار للرحلة، فقط محادثة الرحلة النشطة */}
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>Today</Text>
          </View>
          {messages.map((msg, index) => (
            <MessageBubble key={msg.id || index} msg={msg} index={index} />
          ))}
        </ScrollView>
        {/* Input Area */}
        <Animated.View style={[styles.inputContainer, animatedStyle]}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton} onPress={() => handlePickImage('gallery')}>
              <MaterialIcons name="attach-file" size={20} color="#64748b" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, input.trim() && styles.sendButtonActive]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <MaterialIcons name="send" size={20} color={input.trim() ? "#fff" : "#94a3b8"} />
            </TouchableOpacity>
          </View>
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
headerGradient: {
  paddingTop: 50,
  paddingBottom: 16,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 24,
},
headerInfo: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1,
},
driverAvatar: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 16,
  borderWidth: 2,
  borderColor: 'rgba(255,255,255,0.3)',
},
avatarText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
headerText: {
  flex: 1,
},
headerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
},
headerSubtitle: {
  fontSize: 14,
  color: '#e2e8f0',
  marginTop: 2,
},
onlineStatus: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},
onlineDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: '#10B981',
  marginRight: 6,
},
onlineText: {
  fontSize: 12,
  color: '#e2e8f0',
},
headerActions: {
  flexDirection: 'row',
},
actionButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8,
},
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
dateText: {
  fontSize: 12,
  color: '#94a3b8',
  backgroundColor: '#e2e8f0',
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 12,
},
messageContainer: {
  marginBottom: 12,
  paddingHorizontal: 24,
},
parentMessage: {
  alignItems: 'flex-end',
},
driverMessage: {
  alignItems: 'flex-start',
},
messageBubble: {
  maxWidth: '80%',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 18,
},
parentBubble: {
  backgroundColor: Colors.primary,
  borderBottomRightRadius: 6,
},
driverBubble: {
  backgroundColor: '#fff',
  borderBottomLeftRadius: 6,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
},
messageText: {
  fontSize: 16,
  lineHeight: 22,
  marginBottom: 4,
},
parentText: {
  color: '#fff',
},
driverText: {
  color: '#1e293b',
},
messageTime: {
  fontSize: 11,
  alignSelf: 'flex-end',
},
parentTime: {
  color: 'rgba(255,255,255,0.7)',
},
driverTime: {
  color: '#94a3b8',
},
inputContainer: {
  backgroundColor: '#fff',
  paddingHorizontal: 24,
  paddingVertical: 16,
  borderTopWidth: 1,
  borderTopColor: '#e2e8f0',
},
inputRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
},
attachButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#f1f5f9',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
textInput: {
  flex: 1,
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
sendButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#f1f5f9',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 12,
},
sendButtonActive: {
  backgroundColor: Colors.primary,
},
});