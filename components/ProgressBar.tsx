import React from 'react';
import { View, Text } from 'react-native';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

const colorMap = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-400',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'primary',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colorClass = colorMap[color] || colorMap.primary;
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <View className={`w-full ${className}`}>
      {(label || showValue) && (
        <View className="flex-row justify-between mb-1">
          {label && <Text className="text-sm text-gray-600">{label}</Text>}
          {showValue && (
            <Text className="text-sm font-medium text-gray-600">
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
      <View className={`w-full ${sizeClass} bg-gray-200 rounded-full overflow-hidden`}>
        <View
          className={`h-full ${colorClass} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}
