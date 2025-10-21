import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginSplashScreen from '../screens/LoginSplashScreen';
import EnterPhoneScreen from '../screens/EnterPhoneScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ChooseTagScreen from '../screens/ChooseTagScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';
import EnterPinScreen from '../screens/EnterPinScreen';
import HomeScreen from '../screens/HomeScreen';
import ReceiveSelectScreen from '../screens/ReceiveSelectScreen';
import ReceiveWithTagScreen from '../screens/ReceiveWithTagScreen';
import ReceiveTapToPayScreen from '../screens/ReceiveTapToPayScreen';

const Stack = createNativeStackNavigator();

export default function StackNav() {
  return (
    <Stack.Navigator
      initialRouteName="LoginSplash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="LoginSplash" component={LoginSplashScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="EnterPhone" component={EnterPhoneScreen} options={{ animation: 'slide_from_left', gestureEnabled: false }} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ChooseTag" component={ChooseTagScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SetPin" component={SetPinScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="LoginPin" component={LoginPinScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="EnterPin" component={EnterPinScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="ReceiveSelect" component={ReceiveSelectScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ReceiveWithTag" component={ReceiveWithTagScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ReceiveTapToPay" component={ReceiveTapToPayScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}