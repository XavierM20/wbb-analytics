import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const CustomAlert = ({ visible, title, message, onConfirm, onCancel, onGoHome }) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>Save Game</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>Not Yet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.goHomeButton]} onPress={onGoHome}>
                <Text style={styles.buttonText}>Don't Save and Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  alertBox: {
    width: 700,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: '#ccc',
    alignItems: 'center'
  },
  confirmButton: {
    backgroundColor: '#2196F3'
  },
  buttonText: {
    fontSize: 16,
    color: 'black'
  },
  confirmButtonText: {
    color: 'white'
  },
  goHomeButton: {
    backgroundColor: '#ff0000'
  }
});

export default CustomAlert;
