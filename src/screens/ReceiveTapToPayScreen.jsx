import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import HeaderBar from '../components/HeaderBar';

export default function ReceiveTapToPayScreen({ navigation }) {
  const canGoBack = navigation.canGoBack?.() === true;
  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <HeaderBar title="Tap to pay" onBack={canGoBack ? () => navigation.goBack() : undefined} />
      <View style={styles.container}>
        <Text style={styles.title}>NFC flow placeholder</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},
  container:{flex:1,padding:20},
  title:{fontSize:20,fontWeight:'700',color:'#111'},
});
