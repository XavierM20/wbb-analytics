// styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // Equivalent to .PlayerList
  playerList: {
    flexDirection: 'row', // Layout children in a row (wrap works with row)
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  // Equivalent to .PlayerContainer
  playerContainer: {
    width: '30%',
    //marginHorizontal: 1, // smaller horizontal gap
    marginVertical: 10,  // larger vertical gap to increase space between rows
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Equivalent to .PlayerCircle
  playerCircle: {
    width: 80,           // Adjust for desired width
    height: 50,          // Adjust for desired height
    borderRadius: 25,    // Half of height if you want an ellipse; for a perfect circle, match width & height
    backgroundColor: 'rgba(200, 157, 70, .8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text styling inside the circle (since React Native doesn’t apply font-size/color directly on View)
  playerCircleText: {
    color: '#ffd700',    // Gold text
    fontSize: 24,        // Adjust for size
    fontWeight: 'bold',  // Make it stand out
  },

  // Equivalent to .PlayerName
  playerName: {
    fontSize: 18, // Approximation for 1.2em
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    width: '100%',
  },

  // Additional styles for the "inverted" state
  playerCircleInverted: {
    backgroundColor: '#ffd700',
  },
  playerNameInverted: {
    color: '#8766b4',
  },
});
