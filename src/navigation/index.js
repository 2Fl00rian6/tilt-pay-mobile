import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AuthGate from '../screens/AuthGate';
import ChooseTagScreen from '../screens/ChooseTagScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';
import EnterPinScreen from '../screens/EnterPinScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

export default function StackNav() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthGate" component={AuthGate} />
      <Stack.Screen name="ChooseTag" component={ChooseTagScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="LoginPin" component={LoginPinScreen} />
      <Stack.Screen name="EnterPin" component={EnterPinScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}