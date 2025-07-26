import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
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

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'gradient' | 'outlined' | 'elevated';
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  delay?: number;
  gradientColors?: any;
  shadow?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

// دالة recursive لتغلف أي نص أو رقم في أي عمق
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

export default function Card({ 
  children, 
  style,
  onPress,
  disabled = false,
  variant = 'default',
  animation = 'fade',
  delay = 0,
  gradientColors = [Colors.white, '#f8fafc'] as any,
  shadow = true,
  borderColor,
  backgroundColor,
  padding = 16,
  margin = 8,
  borderRadius = 16
}: CardProps) {
  // Animations
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  const translateYValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Initial animations based on type
    if (animation === 'fade') {
      opacityValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else if (animation === 'slide') {
      translateYValue.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else if (animation === 'scale') {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    }

    // Pulse animation for elevated cards
    if (variant === 'elevated') {
      pulseValue.value = withRepeat(
        withTiming(1.02, { duration: 2000 }),
        -1,
        true
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacityValue.value,
    transform: [
      { translateY: translateYValue.value },
      { scale: scaleValue.value }
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && onPress) {
      scaleValue.value = withSpring(0.98, { damping: 15, stiffness: 100 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && onPress) {
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  };

  const getCardStyle = () => {
    const baseStyle = {
      padding,
      marginVertical: margin,
      borderRadius,
      backgroundColor: backgroundColor || Colors.white,
      borderColor: borderColor || 'transparent',
      borderWidth: variant === 'outlined' ? 1 : 0,
    };

    if (shadow && variant !== 'outlined') {
      return {
        ...baseStyle,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: variant === 'elevated' ? 8 : 4 },
        shadowOpacity: variant === 'elevated' ? 0.15 : 0.1,
        shadowRadius: variant === 'elevated' ? 12 : 8,
        elevation: variant === 'elevated' ? 8 : 4,
      };
    }

    return baseStyle;
  };

  const getAnimationProps = () => {
    switch (animation) {
      case 'fade':
        return { entering: FadeInDown.delay(delay) };
      case 'slide':
        return { entering: SlideInRight.delay(delay) };
      case 'scale':
        return { entering: FadeInUp.delay(delay) };
      default:
        return {};
    }
  };

  const renderCardContent = () => {
    const content = wrapTextNodes(children);

    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={gradientColors}
          style={[styles.gradientContainer, { borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {content}
        </LinearGradient>
      );
    }

    return content;
  };

  const CardContainer = onPress ? TouchableOpacity : View;
  const cardProps = onPress ? {
    onPress: disabled ? undefined : onPress,
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
    activeOpacity: disabled ? 1 : 0.9,
    disabled,
  } : {};

  return (
    <Animated.View 
      style={[
        variant === 'elevated' ? pulseStyle : animatedStyle,
      ]}
      {...getAnimationProps()}
    >
      <CardContainer
        style={[
          styles.card,
          getCardStyle(),
          style
        ]}
        {...cardProps}
      >
        {renderCardContent()}
      </CardContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
  },
  wrappedText: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 24,
  },
});