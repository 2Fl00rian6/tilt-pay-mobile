import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';

function BackIcon({ size = 22, color = '#111' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export default function HeaderBar({ title = '', onBack, right = null }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.btn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <BackIcon />
          </TouchableOpacity>
        ) : <View style={styles.btn} />}
      </View>
      <View style={styles.center}><Text style={styles.title}>{title}</Text></View>
      <View style={styles.side}>{right ?? <View style={styles.btn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { width: 48, alignItems: 'center', justifyContent: 'center' },
  btn: { width: 32, height: 32, borderRadius: 16, alignItems:'center', justifyContent:'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
});
