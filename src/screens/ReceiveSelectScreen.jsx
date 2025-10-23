import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path } from 'react-native-svg';
import HeaderBar from '../components/HeaderBar'; // ⬅️ flèche de retour

export const IconUsers = ({ size = 22, color = '#48484A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M23 21V19C22.9993 18.1136 22.7044 17.2527 22.1614 16.5522C21.6184 15.8517 20.8581 15.3515 20 15.1299"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.12988C16.8604 3.35018 17.623 3.85058 18.1676 4.55219C18.7122 5.2538 19.0078 6.11671 19.0078 7.00488C19.0078 7.89305 18.7122 8.75596 18.1676 9.45757C17.623 10.1592 16.8604 10.6596 16 10.8799"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconNfc = ({ size = 22, color = '#48484A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8.32031C6.6392 9.44145 6.97535 10.7098 6.97535 12.0003C6.97535 13.2909 6.6392 14.5592 6 15.6803"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9.46094 6.20996C10.46 7.97615 10.985 9.97079 10.985 12C10.985 14.0291 10.46 16.0238 9.46094 17.79"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12.9102 4.09961C14.2877 6.50424 15.0133 9.227 15.0151 11.9983C15.0168 14.7696 14.2947 17.4932 12.9202 19.8996"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.3711 2C18.1109 5.04561 19.0261 8.49246 19.0261 12C19.0261 15.5075 18.1109 18.9544 16.3711 22"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function ReceiveSelectScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ⬅️ Flèche de retour */}
      <HeaderBar title="" onBack={() => navigation.goBack()} />

      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <Text style={styles.title}>Receive money with</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ReceiveWithTag')}
          activeOpacity={0.8}
        >
          <IconUsers size={22} color="#111" />
          <Text style={styles.rowText}>Tag</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('ReceiveTapToPay')}
          activeOpacity={0.8}
        >
          <IconNfc size={22} color="#111" />
          <Text style={styles.rowText}>Tap to pay</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 16 },
  handleWrap: { alignItems: 'center', marginBottom: 24 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827', marginBottom: 24, paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  rowText: { fontSize: 16, color: '#111827' },
});