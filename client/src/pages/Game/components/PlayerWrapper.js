import React from 'react';
import useLongPress from '../../Drill/components/useLongPress';
import PlayerItem from './PlayerItem';

const PlayerWrapper = ({ player, onSelect, onLongPress, isSelected }) => {
  const longPressProps = useLongPress(
    () => onLongPress(player),
    () => onSelect(player),
    { delay: 500 }
  );

  return <PlayerItem player={player} isSelected={isSelected} {...longPressProps} />;
};

export default PlayerWrapper;