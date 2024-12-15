import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';

import { Plant } from '../components/Plant.tsx';

type task = {
  name: string,
  photo: string
}

export default function App() {

  function completeTask () {
    if (plantHeight < 70) {
      const newHeight = Math.min(plantHeight + 10, 70); // Cap height at 70.
      setPlantHeight(newHeight);
      const nextTaskIndex = (currentTaskIndex + 1) % tasks.length; // Loop through tasks.
      setCurrentTaskIndex(nextTaskIndex);
    }
  };

  const tasks: Array<task> = [
    { name: "Listen to your favorite song", photo: '../assets/images/song.jpg' },
    { name: "Step outside for a moment", photo: '../assets/images/sun.jpg' },
    { name: "Brush your teeth", photo: '../assets/images/toothbrush.png' },
    { name: "Take a shower", photo: '../assets/images/shower.jpg' },
    { name: "Eat a cooked egg", photo: '../assets/images/egg.jpg' },
    { name: "Do your laundry", photo: '../assets/images/laundry.png' },
  ];

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [plantHeight, setPlantHeight] = useState(10); // Start with a visible height.

  const resetPlant = () => {
    setPlantHeight(10); // Reset to the starting visible height.
    setCurrentTaskIndex(0); // Reset to the first task.
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Growth Tracker</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.taskTitle}>
          Task: {tasks[currentTaskIndex]?.name}
        </Text>
        <Image
          source={require(tasks[currentTaskIndex].photo)}
          style={styles.taskImage}
        />

        {/* Custom Button for Complete Task with Rounded Corners */}
        <TouchableOpacity style={styles.customButton} onPress={completeTask}>
          <Text style={styles.customButtonText}>Complete Task</Text>
        </TouchableOpacity>

        <Text style={styles.plantHeightText}>Plant Height: {plantHeight}</Text>

        {/* Custom Button for Reset with Rounded Corners */}
        <TouchableOpacity style={styles.customButton} onPress={resetPlant}>
          <Text style={styles.customButtonText}>Reset Plant and Tasks</Text>
        </TouchableOpacity>
      </View>

      <Plant height={plantHeight}></Plant>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#e0e0e0',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 75,
    padding: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  taskImage: {
    height: 100,
    width: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  plantHeightText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  customButton: {
    backgroundColor: '#4CAF50',  // Green background color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,  // Rounded corners
    marginBottom: 15,
    alignItems: 'center',
  },
  customButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});