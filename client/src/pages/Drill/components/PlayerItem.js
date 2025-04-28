import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './PlayerListStyles';

function PlayerItem({ player, isSelected, ...props }) {
  return (
    <TouchableOpacity {...props} style={styles.playerContainer}>
      <View style={[ styles.playerCircle, isSelected && styles.playerCircleInverted, ]}>
        <Text style={{ fontSize: 24, color: isSelected ? '#8766b4' : '#ffd700' }}>
          {player.number}
        </Text>
      </View>
      <Text style={[styles.playerName, isSelected && styles.playerNameInverted]}>
        {player.name}
      </Text>
    </TouchableOpacity>
  );
}

export default PlayerItem;