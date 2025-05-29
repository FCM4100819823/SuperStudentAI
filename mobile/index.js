import { registerRootComponent } from 'expo';
import App from './App';
import './polyfills';
import './config/firebase'; // Ensure Firebase is initialized before app starts

registerRootComponent(App);
