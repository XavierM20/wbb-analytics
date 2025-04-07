import React, { useState } from 'react';
import { View } from 'react-native';
import PlayerWrapper from './PlayerWrapper';
import styles from './PlayerListStyles';

function PlayerList({ players, onPlayerSelectForShot, onPlayerSelectForSub }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const handleSelect = (player) => {
    if (selectedPlayerId === player.id) {
      setSelectedPlayerId(null);
    } else {
      setSelectedPlayerId(player.id);
      onPlayerSelectForShot(player);
    }
  };

  return (
    <View style={styles.playerList}>
      {players.map(player => (
        <PlayerWrapper
          key={player.number}
          player={player}
          isSelected={player.id === selectedPlayerId}
          onSelect={() => handleSelect(player)}
          onLongPress={() => onPlayerSelectForSub(player)}
        />
      ))}
    </View>
  );
}

export default PlayerList;