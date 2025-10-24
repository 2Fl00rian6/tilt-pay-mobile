import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { Svg, Path } from 'react-native-svg';

const IconNfc = ({ size = 22, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8.3c.64 1.12.98 2.39.98 3.7s-.34 2.58-.98 3.68" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Path d="M9.46 6.21c1 1.77 1.52 3.77 1.52 5.79s-.52 4.01-1.52 5.78" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Path d="M12.91 4.1c1.38 2.41 2.11 5.13 2.11 7.9s-.72 5.52-2.1 7.9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Path d="M16.37 2c1.74 3.05 2.66 6.5 2.66 10s-.92 6.95-2.66 10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

export default function SendMethodScreen({ navigation, route }) {
  const amount = route?.params?.amount; // optionnel si tu viens déjà avec un montant

  const goTapToPay = () => {
    if (typeof amount === 'number') {
      navigation.navigate('SendTapToPay', { amount, currency: 'EUR' });
    } else {
      navigation.navigate('SendEnterAmount'); // on demande d'abord le montant
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <HeaderBar title="Send" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.title}>Choose a method</Text>

        <TouchableOpacity style={styles.row} onPress={goTapToPay} activeOpacity={0.85}>
          <IconNfc />
          <Text style={styles.rowText}>Tap to pay</Text>
        </TouchableOpacity>

        {/* Ajoute d’autres méthodes ici si besoin */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:'#fff' },
  container:{ flex:1, paddingTop:16 },
  title:{ fontSize:20, lineHeight:28, fontWeight:'600', color:'#111827', marginBottom:16, paddingHorizontal:20 },
  row:{ flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:20, paddingVertical:14 },
  rowText:{ fontSize:16, color:'#111827', fontWeight:'600' },
});