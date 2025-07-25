import { StyleSheet } from 'react-native';
import { Colors } from './Colors'; // Adjust path as needed

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  body: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  caption: {
    fontSize: 13,
    color: Colors.gray[500],
  },
});