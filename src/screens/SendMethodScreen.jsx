import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { Svg, Path } from 'react-native-svg';

const Row = ({ icon, title, onPress, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.9}
    style={[styles.row, disabled && { opacity: 0.45 }]}
  >
    <View style={styles.rowIcon}>{icon}</View>
    <Text style={styles.rowText}>{title}</Text>
  </TouchableOpacity>
);

const IconUsers = ({ size=22, color='#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21a7 7 0 0 0-14 0M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);
const IconNfc = ({ size=22, color='#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 7a7 7 0 0 1 14 0v10a7 7 0 0 1-14 0V7Z" stroke={color} strokeWidth="1.8"/>
    <Path d="M9 9a5 5 0 0 1 6 0m-5 3a3 3 0 0 1 4 0m-3 3a1 1 0 1 1 2 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);
const IconBank = ({ size=22, color='#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 9h16M6 9v7m4-7v7m4-7v7m4-7v7M3 20h18M12 4 3 8h18L12 4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default function SendMethodScreen({ navigation, route }) {
  const amount = route?.params?.amount ?? null;

  const gotoAmount = (mode) => {
    navigation.navigate('SendEnterAmount', { mode }); // 'tag' | 'tap'
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <Text style={styles.title}>Send money with</Text>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Row title="Tag" icon={<IconUsers />} onPress={() => gotoAmount('tag')} />
          <Row title="Tap to pay" icon={<IconNfc />} onPress={() => gotoAmount('tap')} />
          <Row title="Bank transfer" icon={<IconBank />} disabled onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#fff' },
  container: { flex:1, backgroundColor:'#fff' },
  handleWrap: { alignItems: 'center', marginTop: 4, marginBottom: 12 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 20, fontWeight:'700', color:'#111', paddingHorizontal: 20, marginTop: 6 },

  row: { height: 56, borderRadius: 14, flexDirection:'row', alignItems:'center', paddingHorizontal: 14, marginBottom: 10, backgroundColor:'#F8F9FB' },
  rowIcon: { width: 28, alignItems:'center', marginRight: 12 },
  rowText: { fontSize: 16, color:'#111827', fontWeight:'600' },
});