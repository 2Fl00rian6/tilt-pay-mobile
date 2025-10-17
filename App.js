import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import StackNav from './src/navigation';
import { TailwindProvider } from 'tailwind-rn';
import utilities from './tailwind.json';
import { ErrorProvider } from './src/context/ErrorContext';
import { StatusBar } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    let t = setTimeout(() => SplashScreen.hideAsync(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <TailwindProvider utilities={utilities}>
      <ErrorProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <StackNav />
        </NavigationContainer>
      </ErrorProvider>
    </TailwindProvider>
  );
}