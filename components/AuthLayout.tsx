import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle,
  FadeInDown,
  FadeInUp,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AuthLayoutProps {
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  showBackground?: boolean;
  backgroundImage?: any;
  headerHeight?: number;
  contentPadding?: number;
}

// دالة recursive لتغليف أي نص أو رقم في أي عمق
function wrapTextNodes(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return <Text style={styles.wrappedText}>{node}</Text>;
  }
  if (Array.isArray(node)) {
    return node.map((child, idx) => <React.Fragment key={idx}>{wrapTextNodes(child)}</React.Fragment>);
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    if (element.props && element.props.children) {
      return React.cloneElement(element, {
        ...element.props,
        children: wrapTextNodes(element.props.children),
      });
    }
    return element;
  }
  return null;
}

export default function AuthLayout({ 
  title, 
  subtitle, 
  children, 
  showBackground = true,
  backgroundImage,
  headerHeight = 0.4,
  contentPadding = 20
}: AuthLayoutProps) {
  // Animations
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const slideValue = useSharedValue(50);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Initial animations
    fadeValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    slideValue.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    // Pulse animation for background elements
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [
      { translateY: slideValue.value },
      { scale: scaleValue.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fadeValue.value, [0, 1], [0.3, 0.7], Extrapolate.CLAMP),
  }));

  const renderBackground = () => {
    if (backgroundImage) {
      return (
        <Animated.View style={[styles.backgroundImage, backgroundStyle]}>
          <ImageBackground 
            source={backgroundImage} 
            style={styles.imageBackground}
            resizeMode="cover"
          />
        </Animated.View>
      );
    }
    
    if (showBackground) {
      return (
        <Animated.View style={[styles.backgroundGradient, backgroundStyle]}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary, '#667eea']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          {/* Animated background elements */}
          <Animated.View style={[styles.backgroundCircle1, pulseStyle]} />
          <Animated.View style={[styles.backgroundCircle2, pulseStyle]} />
          <Animated.View style={[styles.backgroundCircle3, pulseStyle]} />
        </Animated.View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Background */}
      {renderBackground()}
      
      {/* Header Section */}
      <Animated.View 
        style={[
          styles.header, 
          { flex: headerHeight },
          animatedStyle
        ]}
        entering={FadeInDown.delay(200)}
      >
        <View style={styles.headerContent}>
          <Animated.View 
            style={styles.titleContainer}
            entering={FadeInUp.delay(400)}
          >
            <Text style={styles.title}>{title}</Text>
          </Animated.View>
          
          <Animated.View 
            style={styles.subtitleContainer}
            entering={FadeInUp.delay(600)}
          >
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>
        </View>
      </Animated.View>
      
      {/* Content Section */}
      <Animated.View 
        style={[
          styles.content, 
          { 
            flex: 1 - headerHeight,
            paddingHorizontal: contentPadding 
          },
          animatedStyle
        ]}
        entering={FadeInUp.delay(800)}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.contentGradient}
        >
          <View style={styles.contentInner}>
            {wrapTextNodes(children)}
          </View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  
  // Background Styles
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageBackground: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  backgroundCircle1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backgroundCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: width * 0.05,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundCircle3: {
    position: 'absolute',
    bottom: height * 0.2,
    right: width * 0.2,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  
  // Header Styles
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 44,
  },
  subtitleContainer: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Content Styles
  content: {
    zIndex: 20,
  },
  contentGradient: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  contentInner: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  
  // Wrapped Text Style
  wrappedText: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 24,
  },
});