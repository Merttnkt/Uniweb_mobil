import React from 'react';
import { View, Text, ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
  className?: string;
};

type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

type CardContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View 
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <View className={`pb-3 border-b border-gray-100 mb-3 ${className}`}>
      {children}
    </View>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <View className={className}>
      {children}
    </View>
  );
}

export default Card;
