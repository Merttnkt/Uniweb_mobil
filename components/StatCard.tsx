import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className = '',
}: StatCardProps) {
  const trendColor = 
    trend === 'up' ? 'text-green-500' : 
    trend === 'down' ? 'text-red-500' : 'text-gray-500';
  
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus';

  return (
    <View className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-sm font-medium text-gray-500">{title}</Text>
          <Text className="text-2xl font-bold text-gray-900 mt-1">{value}</Text>
          {description && (
            <Text className="text-xs text-gray-500 mt-1">{description}</Text>
          )}
        </View>
        
        {icon && (
          <View className="bg-blue-50 p-2 rounded-lg">
            {icon}
          </View>
        )}
      </View>
      
      {trend && (
        <View className="flex-row items-center mt-3">
          <Feather 
            name={trendIcon} 
            size={14} 
            className={`mr-1 ${trendColor}`} 
          />
          <Text className={`text-xs font-medium ${trendColor}`}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}
