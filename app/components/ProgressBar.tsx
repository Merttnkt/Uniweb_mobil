  import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
};

const ProgressBar = ({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  color = 'primary',
}: ProgressBarProps) => {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  
  const getBarHeight = () => {
    switch (size) {
      case 'sm':
        return 6;
      case 'lg':
        return 12;
      default:
        return 8;
    }
  };
  
  const getBarColor = () => {
    switch (color) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'danger':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };
  
  const getBarBackgroundColor = () => {
    switch (color) {
      case 'success':
        return '#D1FAE5';
      case 'warning':
        return '#FEF3C7';
      case 'danger':
        return '#FEE2E2';
      default:
        return '#DBEAFE';
    }
  };

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showValue && (
            <Text style={styles.valueText}>
              {value} / {max} {max === 100 ? '%' : ''}
            </Text>
          )}
        </View>
      )}
      <View 
        style={[
          styles.progressBackground, 
          { 
            height: getBarHeight(),
            backgroundColor: getBarBackgroundColor(),
          }
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              height: getBarHeight(),
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  valueText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBackground: {
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 9999,
  },
});

export default ProgressBar;
