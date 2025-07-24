import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface AuthLayoutProps {
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

// دالة recursive لتغليف أي نص أو رقم في أي عمق
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

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.content}>
        {wrapTextNodes(children)}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light,
    textAlign: 'center',
  },
  content: {
    flex: 0.6,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
});