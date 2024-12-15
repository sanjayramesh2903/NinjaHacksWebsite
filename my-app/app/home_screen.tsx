import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';

// scale stages
const { width, height } = Dimensions.get('window');

export default function App() {
  const tasks = [
    { name: "Listen to your favorite song", photo: require('./assets/song.jpg') },
    { name: "Step outside for a moment", photo: require('./assets/sun.jpg') },
    { name: "Brush your teeth", photo: require('./assets/toothbrush.png') },
    { name: "Take a shower", photo: require('./assets/shower.jpg') },
    { name: "Eat a cooked egg", photo: require('./assets/egg.jpg') },
    { name: "Do your laundry", photo: require('./assets/laundry.png') },
    { name: "Run some errands", photo: require('./assets/cart.jpg') },
  ];

  const plantStages = [
    require('./assets/plant_stage_1.png'), // s1
    require('./assets/plant_stage_2.png'), // s2
    require('./assets/plant_stage_3.png'), // s3
    require('./assets/plant_stage_5.png'),
  ];

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  const currentPlantStage = Math.min(
    Math.floor(taskCount / Math.floor(tasks.length / 3)),
    plantStages.length - 1
  );

  const completeTask = () => {
    if (taskCount < tasks.length) {
      setTaskCount(taskCount + 1);
      const nextTaskIndex = (currentTaskIndex + 1) % tasks.length;
      setCurrentTaskIndex(nextTaskIndex);
    }
  };

  const resetPlant = () => {
    setTaskCount(0);
    setCurrentTaskIndex(0);
  };

  return (
    <ImageBackground
      source={plantStages[currentPlantStage]}
      style={styles.backgroundImage}
      resizeMode="stretch"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Plant Growth Tracker</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.taskTitle}>
            Task: {tasks[currentTaskIndex]?.name}
          </Text>
          <Image
            source={tasks[currentTaskIndex].photo}
            style={styles.taskImage}
          />

          <TouchableOpacity style={styles.customButton} onPress={completeTask}>
            <Text style={styles.customButtonText}>Complete Task</Text>
          </TouchableOpacity>

          <Text style={styles.taskCountText}>Tasks Completed: {taskCount}</Text>

          <TouchableOpacity style={styles.customButton} onPress={resetPlant}>
            <Text style={styles.customButtonText}>Reset Plant and Tasks</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
    position: 'absolute',
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(224, 224, 224, 0.8)',
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
    justifyContent: 'center',
    padding: 20,
    marginTop: -350,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  taskImage: {
    height: 100,
    width: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  taskCountText: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  customButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  customButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
