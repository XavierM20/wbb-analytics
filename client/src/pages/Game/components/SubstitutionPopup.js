import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';

const SubstitutionPopup = ({
  isOpen,
  onClose,
  onSubstitute,
  playersOnCourt,
  allPlayers,
}) => {
  const ignoreClickAwayRef = useRef(false);

  const handleClose = () => {
    if (ignoreClickAwayRef.current) {
      ignoreClickAwayRef.current = false;
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      ignoreClickAwayRef.current = true;
      const timer = setTimeout(() => {
        ignoreClickAwayRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const playersNotOnCourt = allPlayers.filter(
    (p) => !playersOnCourt.some((onCourt) => onCourt.number === p.number)
  );

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      {/* The outer TouchableWithoutFeedback allows the background to be touchable */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalContainer}>
          {/* This inner TouchableWithoutFeedback prevents the touch event from closing the modal when interacting with the popup */}
          <TouchableWithoutFeedback>
            <View style={styles.popup}>
              {playersNotOnCourt.map((player) => (
                <TouchableOpacity
                  key={player.number}
                  style={styles.popupPlayerContainer}
                  onPress={() => onSubstitute(player)}
                >
                  <View style={styles.popupPlayerCircle}>
                    <Text style={styles.popupPlayerCircleText}>
                      {player.number}
                    </Text>
                  </View>
                  <Text style={styles.popupPlayerName}>{player.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // This container acts as the dark overlay background.
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The popup itself
  popup: {
    backgroundColor: 'green', // Adjust as needed (your original CSS said "green" here)
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  // Each player’s container within the popup
  popupPlayerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    margin: 8,
    minWidth: 100,
  },
  // The circle that shows the player number
  popupPlayerCircle: {
    width: 75,
    height: 75,
    borderRadius: 75 / 2,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  popupPlayerCircleText: {
    color: 'white',
    fontSize: 24,
  },
  // The text that shows the player's name
  popupPlayerName: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});

export default SubstitutionPopup;