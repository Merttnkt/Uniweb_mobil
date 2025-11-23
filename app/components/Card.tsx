import React from 'react';
import { View, StyleSheet } from 'react-native';

export const CardHeader: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.cardHeader}>{children}</View>
);

export const CardContent: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <View style={styles.cardContent}>{children}</View>
);

const Card: React.FC<{children: React.ReactNode, color?: string}> = ({ children }) => {
  return <View style={styles.card}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardContent: {
    padding: 16,
  },
});

export default Card;