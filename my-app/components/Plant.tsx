import React from 'react'
import { View, Image, StyleSheet } from 'react-native'

type prop = {
    height: number
}

export const Plant = ({ height }: prop) => {
    return (
        <View style={styles.plantContainer}>
            <Image
            source={require('../assets/images/plant.jpg')}
            style={{
                height: height,
                width: 100,
                resizeMode: 'contain',
                backgroundColor: '#f0f0f0',
            }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    plantContainer: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
})