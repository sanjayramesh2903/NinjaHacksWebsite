import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  AsyncStorage,
} from 'react-native';

export default function App() {
  const [plantHeight, setPlantHeight] = useState(0);
  const [badgeEarned, setBadgeEarned] = useState(false);

  // reset plant height
  const resetPlant = () => {
    setPlantHeight(0);
    setBadgeEarned(false);
  };

  // async storage carry
  const loadData = async () => {
    try {
      const lastResetDate = await AsyncStorage.getItem('lastResetDate');
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      if (lastResetDate !== currentDate) {
        resetPlant();
        await AsyncStorage.setItem('lastResetDate', currentDate);
      }

      const savedHeight = await AsyncStorage.getItem('plantHeight');
      const savedBadge = await AsyncStorage.getItem('badgeEarned');

      if (savedHeight) setPlantHeight(Number(savedHeight));
      if (savedBadge) setBadgeEarned(JSON.parse(savedBadge));
    } catch (error) {
      console.error('Error loading data', error);
    }
  };

  // Function to grow the plant
  const growPlant = async () => {
    if (plantHeight < 100) {
      const newHeight = plantHeight + 20;
      setPlantHeight(newHeight);

      // Save new height
      await AsyncStorage.setItem('plantHeight', String(newHeight));
    } else {
      setBadgeEarned(true);
      await AsyncStorage.setItem('badgeEarned', JSON.stringify(true));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plant Growth Tracker</Text>
      </View>

      <View style={styles.content}>
        <Image
          source={require('./assets/plant-removebg-preview.png')}
          style={{
            height: plantHeight,
            width: 100,
            marginBottom: 20,
            resizeMode: 'contain',
          }}
        />
        <Text>Plant Height: {plantHeight}</Text>
        <Button title="scan productivity" onPress={growPlant} />
        {badgeEarned && <Text style={styles.badge}>🎉 Badge Earned!</Text>}
        <Button title="reset height" onPress={resetPlant} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#fff',
    padding: 10,
    zIndex: 1,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 70,
  },
  badge: {
    color: 'gold',
    fontSize: 18,
    marginTop: 10,
  },
});
