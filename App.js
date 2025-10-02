import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import StackNav from './src/navigation';
import { StatusBar } from 'react-native';
import { TailwindProvider } from 'tailwind-rn';
import utilities from './tailwind.json';
import { ErrorProvider } from './src/context/ErrorContext';

export default function App() {
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