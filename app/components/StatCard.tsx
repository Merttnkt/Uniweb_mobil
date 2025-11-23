import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
};

const StatCard = ({ title, value, description, icon, trend, trendValue }: StatCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={styles.value}>{value}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      
      {trend && trendValue && (
        <View style={[
          styles.trendContainer, 
          trend === 'up' ? styles.trendUp : 
          trend === 'down' ? styles.trendDown : 
          styles.trendNeutral
        ]}>
          <Feather 
            name={
              trend === 'up' ? 'trending-up' : 
              trend === 'down' ? 'trending-down' : 
              'minus'
            } 
            size={14} 
            color={
              trend === 'up' ? '#10B981' : 
              trend === 'down' ? '#EF4444' : 
              '#6B7280'
            } 
            style={styles.trendIcon}
          />
          <Text style={[
            styles.trendValue,
            trend === 'up' ? styles.trendUpText : 
            trend === 'down' ? styles.trendDownText : 
            styles.trendNeutralText
          ]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    height: 144, // Increased height from 120 to 144
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trendUp: {
    backgroundColor: '#D1FAE5',
  },
  trendDown: {
    backgroundColor: '#FEE2E2',
  },
  trendNeutral: {
    backgroundColor: '#F3F4F6',
  },
  trendIcon: {
    marginRight: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  trendUpText: {
    color: '#10B981',
  },
  trendDownText: {
    color: '#EF4444',
  },
  trendNeutralText: {
    color: '#6B7280',
  },
});

export default StatCard;
