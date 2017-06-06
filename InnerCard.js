// @flow

import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

export type InnerCardProps = {
  color: string,
  i: number,
  key: number,
};

const RADIUS = 500;

export default ({ color, i }: InnerCardProps) => (
  <View style={styles.container}>
    <View style={[styles.topBorder, { backgroundColor: color }]} />
    <View style={styles.topLabel}>
      <Text style={styles.label}>COLOR</Text>
      <Text style={styles.labelBold}>{color}</Text>
    </View>
    <Text style={styles.text}>Card {i}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginHorizontal: '5%',
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#313D53',
  },
  topBorder: {
    position: 'absolute',
    width: RADIUS * 2,
    height: RADIUS * 2,
    top: -RADIUS * 2 + RADIUS / 4,
    borderRadius: RADIUS,
  },
  text: {
    fontSize: 30,
    color: 'white',
  },
  topLabel: {
    position: 'absolute',
    top: 0,
    // height: 80,
    padding: 10,
    flex: 1,
    // width: 50,
    right: 20,
    backgroundColor: '#3776D7',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 12,
  },
  labelBold: {
    color: 'white',
    fontWeight: 'bold',
  },
});
