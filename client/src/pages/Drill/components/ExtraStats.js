import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width: vw } = Dimensions.get('window');

const ExtraStats = ({ onPress, setStatName, className }) => {
  // We’re using the `setStatName` prop as the text label.
  // (You can also combine or override styles using the className prop if needed.)
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{setStatName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    // Using viewport width to simulate percentage-based values
    marginTop: vw * 0.01,        // approx 1% top margin
    marginBottom: vw * 0.01,     // approx 1% bottom margin
    padding: vw * 0.01,          // approx 1% padding
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
    backgroundColor: 'rgba(200,157,70, .8)',  // background-color from your CSS
    width: vw * 0.2,             // calc(20vw)
    height: vw * 0.04,           // calc(4vw) — adjust as needed; note that this may be a small height on some devices
    margin: vw * 0.01,           // approx 1% margin on all sides
  },
  text: {
    fontSize: vw * 0.013,        // calc(1.3vw)
    color: 'white',              // text color
  },
});

export default ExtraStats;