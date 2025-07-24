import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { Colors } from '../constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// دالة recursive لتغلف أي نص أو رقم في أي عمق
function wrapTextNodes(node: React.ReactNode): React.ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return <Text>{node}</Text>;
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

export default function Card({ children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {wrapTextNodes(children)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});