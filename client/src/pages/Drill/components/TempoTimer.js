import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const windowWidth = Dimensions.get('window').width;

function TempoTimer({ isTiming, resetTimer, setResetTimer, currentTime, setCurrentTime }) {
  useEffect(() => {
    if (resetTimer) {
      setCurrentTime(0);
      setResetTimer(false);
    }
  }, [resetTimer, setResetTimer, setCurrentTime]);

  useEffect(() => {
    let interval = null;
    if (isTiming) {
      interval = setInterval(() => {
        setCurrentTime(prevTime => prevTime + 0.01);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTiming, setCurrentTime]);

  const formatTime = (timeValue) => {
    return timeValue.toFixed(2);
  };

  return (
    <View style={styles.timer}>
      <Text style={styles.timerText}>
        {formatTime(currentTime)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timer: {
    padding: windowWidth * 0.01, // Approximation for 5%
    marginTop: 20, // Approximation
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    height: windowWidth * 0.06, // 5vw equivalent
    width: windowWidth * 0.1,   // 10vw equivalent
  },
  timerText: {
    fontSize: windowWidth * 0.013, // Approximation for 1.3vw
    color: '#333',
    textAlign: 'center',
  },
});

export default TempoTimer;
