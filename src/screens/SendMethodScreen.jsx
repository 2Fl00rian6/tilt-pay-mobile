// src/screens/SendMethodScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import HeaderBar from '../components/HeaderBar';
import { Svg, Path } from 'react-native-svg';

const Row = ({ icon, title, delay, onPress }) => (
  <Animated.View entering={FadeInDown.springify().damping(16).delay(delay)} style={styles.row}>
    <TouchableOpacity style={styles.rowBtn} onPress={onPress} activeOpacity={0.85}>
      {icon}
      <Text style={styles.rowText}>{title}</Text>
    </TouchableOpacity>
  </Animated.View>
);

const IconUsers = ({ size=22, color='#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21V19c0-1.06-.42-2.08-1.17-2.83C15.08 15.42 14.06 15 13 15H5c-1.06 0-2.08.42-2.83 1.17C1.42 16.92 1 17.94 1 19v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconNfc = ({ size=22, color='#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8.3c.64 1.12.98 2.39.98 3.7 0 1.29-.34 2.56-.98 3.68M9.46 6.21C10.46 7.98 10.99 9.97 10.99 12s-.53 4.02-1.53 5.79M12.91 4.1c1.38 2.4 2.11 5.12 2.11 7.9s-.73 5.5-2.0 7.9M16.37 2c1.74 3.05 2.66 6.49 2.66 10s-.92 6.95-2.66 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function SendMethodScreen({ route, navigation }) {
  const amount = route?.params?.amount ?? 0;
  const currency = route?.params?.currency ?? 'USD';

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <Text style={styles.title}>Send money with</Text>

        <Row
          delay={80}
          icon={<IconUsers />}
          title="Tag"
          onPress={() => {/* à brancher plus tard */}}
        />
        <Row
          delay={140}
          icon={<IconNfc />}
          title="Tap to pay"
          onPress={() => navigation.navigate('SendTapToPay', { amount, currency })}
        />
        <Animated.View entering={FadeInDown.delay(220)}>
          <Text style={styles.note}>Bank transfer (soon)</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#fff' },
  container: { flex:1, paddingTop: 16 },
  handleWrap: { alignItems:'center', marginBottom: 24 },
  handle: { width:36, height:4, backgroundColor:'#D1D5DB', borderRadius: 2 },
  title: { fontSize:20, lineHeight:28, fontWeight:'600', color:'#111827', marginBottom: 12, paddingHorizontal: 20 },

  row: { paddingHorizontal: 20, marginBottom: 8 },
  rowBtn: { height:56, borderRadius:16, backgroundColor:'#F6F7F8', paddingHorizontal:14, flexDirection:'row', alignItems:'center', gap:12 },
  rowText: { fontSize:16, color:'#111827', fontWeight:'600' },
  note: { marginTop: 24, paddingHorizontal: 20, color: '#C2C6CC', textDecorationLine:'line-through' },
});