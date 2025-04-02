import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const TempoButton = ({ tempoType, isTiming, onPress, disabled }) => {
  // Choose the style based on state: start, stop, or disabled.
  const buttonStyles = [
    styles.button,
    disabled ? styles.disabled : isTiming ? styles.stop : styles.start,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>
        {isTiming ? `Stop ${tempoType} Tempo` : `Start ${tempoType} Tempo`}
      </Text>
    </TouchableOpacity>
  );
};

export default TempoButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    marginTop: 20,
    marginHorizontal: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.33,  
    height: width * 0.06, 
  },
  start: {
    backgroundColor: 'rgba(23, 43, 79, .5)', // "start" color from CSS
  },
  stop: {
    backgroundColor: 'rgba(23, 43, 79, 1)', // "stop" color from CSS
  },
  disabled: {
    backgroundColor: 'rgba(23, 43, 79, .2)', // Disabled state styling
  },
  text: {
    fontSize: 16, // Adjust as needed for readability
    color: 'white',
  },
});