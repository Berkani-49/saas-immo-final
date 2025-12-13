# 📱 Guide - Création de l'Application Mobile React Native

## Vue d'ensemble

Ce guide vous accompagne pour créer l'application mobile de votre CRM immobilier avec React Native + Expo.

---

## 🎯 Technologies utilisées

- **React Native** : Framework pour applications mobiles iOS/Android
- **Expo** : Toolchain qui simplifie le développement React Native
- **Expo Notifications** : Gestion des push notifications
- **React Navigation** : Navigation entre écrans
- **Axios** : Communication avec votre API backend
- **AsyncStorage** : Stockage local (token JWT)
- **Expo Camera** : Prise de photos

---

## 📦 Installation

### Prérequis

1. **Node.js** installé (v16 ou supérieur)
2. **npm** ou **yarn**
3. **Expo Go** app sur votre téléphone (pour tester)
   - iOS : [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android : [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Création du projet

```bash
# Installer Expo CLI
npm install -g expo-cli

# Créer le projet
cd ~/Desktop/Saas-immo-complet
npx create-expo-app saas-immo-mobile

# Entrer dans le dossier
cd saas-immo-mobile

# Installer les dépendances
npm install axios
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install expo-notifications expo-device expo-constants
npm install expo-image-picker

# Lancer le projet
npx expo start
```

**Pour tester :**
1. Scannez le QR code avec votre téléphone
2. L'app se charge dans Expo Go

---

## 📁 Structure du projet

```
saas-immo-mobile/
├── App.js                    # Point d'entrée
├── app.json                  # Configuration Expo
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js       # Connexion
│   │   ├── HomeScreen.js        # Tableau de bord
│   │   ├── PropertiesScreen.js  # Liste des biens
│   │   ├── AddPropertyScreen.js # Ajouter un bien
│   │   ├── PropertyDetailScreen.js # Détail d'un bien
│   │   └── NotificationsScreen.js  # Notifications
│   ├── components/
│   │   ├── PropertyCard.js      # Carte bien immobilier
│   │   └── Header.js            # En-tête app
│   ├── services/
│   │   ├── api.js               # Axios configuration
│   │   └── notificationService.js # Push notifications
│   ├── contexts/
│   │   └── AuthContext.js       # Gestion authentification
│   └── utils/
│       └── storage.js           # AsyncStorage helpers
└── assets/                   # Images, icônes
```

---

## 🔧 Étape 1 : Configuration de base

### 1.1 Configuration Expo (`app.json`)

```json
{
  "expo": {
    "name": "ImmoPro CRM",
    "slug": "saas-immo-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#3182ce"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.immopro.crm"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#3182ce"
      },
      "package": "com.immopro.crm",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#3182ce"
        }
      ]
    ]
  }
}
```

### 1.2 Service API (`src/services/api.js`)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://saas-immo.onrender.com/api';

// Instance Axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, déconnecter l'utilisateur
      await AsyncStorage.removeItem('token');
      // Rediriger vers login
    }
    return Promise.reject(error);
  }
);

export default api;

// Fonctions API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
};

export const propertiesAPI = {
  getAll: () => api.get('/properties'),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),

  // Images
  getImages: (propertyId) => api.get(`/properties/${propertyId}/images`),
  addImage: (propertyId, imageData) => api.post(`/properties/${propertyId}/images`, imageData),
  deleteImage: (propertyId, imageId) => api.delete(`/properties/${propertyId}/images/${imageId}`),
  setPrimaryImage: (propertyId, imageId) => api.patch(`/properties/${propertyId}/images/${imageId}/set-primary`),
};

export const statsAPI = {
  getAgentStats: () => api.get('/stats/agent'),
};
```

### 1.3 Service de notifications (`src/services/notificationService.js`)

```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Enregistrer le token FCM
export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3182ce',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Permission de notification refusée');
      return;
    }

    // Obtenir le token Expo
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    })).data;

    console.log('📱 Expo Push Token:', token);

    // Envoyer le token au backend
    try {
      await api.post('/notifications/register-token', {
        fcmToken: token,
        platform: Platform.OS,
      });
      console.log('✅ Token enregistré sur le serveur');
    } catch (error) {
      console.error('❌ Erreur enregistrement token:', error);
    }
  } else {
    alert('Les notifications ne fonctionnent que sur un appareil réel');
  }

  return token;
}

// Écouter les notifications reçues
export function addNotificationListener(callback) {
  return Notifications.addNotificationReceivedListener(callback);
}

// Écouter les interactions avec les notifications
export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
```

### 1.4 Contexte d'authentification (`src/contexts/AuthContext.js`)

```javascript
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger le token au démarrage
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erreur chargement auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, agent } = response.data;

      // Sauvegarder
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(agent));

      setToken(newToken);
      setUser(agent);

      return { success: true };
    } catch (error) {
      console.error('Erreur login:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur de connexion',
      };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🖼️ Étape 2 : Écrans principaux

### 2.1 Écran de connexion (`src/screens/LoginScreen.js`)

```javascript
import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ImmoPro CRM</Text>
        <Text style={styles.subtitle}>Connexion</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3182ce',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3182ce',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 2.2 Écran d'accueil (`src/screens/HomeScreen.js`)

```javascript
import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { statsAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsAPI.getAgentStats();
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.name || 'Agent'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalProperties || 0}</Text>
          <Text style={styles.statLabel}>Biens actifs</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalViews || 0}</Text>
          <Text style={styles.statLabel}>Vues totales</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalContacts || 0}</Text>
          <Text style={styles.statLabel}>Contacts</Text>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Text style={styles.actionButtonText}>➕ Ajouter un bien</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Properties')}
        >
          <Text style={styles.actionButtonText}>🏠 Voir mes biens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.actionButtonText}>🔔 Notifications</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#3182ce',
  },
  greeting: {
    fontSize: 16,
    color: '#e6f2ff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#2c5282',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3182ce',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
});
```

### 2.3 Écran liste des biens (`src/screens/PropertiesScreen.js`)

```javascript
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { propertiesAPI } from '../services/api';

export default function PropertiesScreen({ navigation }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Erreur chargement biens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { propertyId: item.id })}
    >
      {item.images && item.images.length > 0 ? (
        <Image
          source={{ uri: item.images.find(img => img.isPrimary)?.url || item.images[0].url }}
          style={styles.propertyImage}
        />
      ) : (
        <View style={[styles.propertyImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>Pas de photo</Text>
        </View>
      )}

      <View style={styles.propertyInfo}>
        <Text style={styles.propertyAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <Text style={styles.propertyCity}>{item.city}</Text>
        <Text style={styles.propertyPrice}>
          {item.price?.toLocaleString('fr-FR')} €
        </Text>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyDetail}>{item.surface} m²</Text>
          <Text style={styles.propertyDetail}>•</Text>
          <Text style={styles.propertyDetail}>{item.rooms} chambres</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182ce" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun bien pour le moment</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#a0aec0',
    fontSize: 14,
  },
  propertyInfo: {
    padding: 16,
  },
  propertyAddress: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  propertyCity: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3182ce',
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyDetail: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0aec0',
  },
});
```

---

## 📲 Étape 3 : Configuration des push notifications

### 3.1 Route backend pour enregistrer le token

Ajoutez cette route dans `saas-immo/server.js` :

```javascript
// Enregistrer le token FCM d'un appareil mobile
app.post('/api/notifications/register-token', authenticateToken, async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;
    const agentId = req.user.id;

    // Sauvegarder ou mettre à jour le token
    await prisma.agent.update({
      where: { id: agentId },
      data: { fcmToken, devicePlatform: platform }
    });

    logActivity(agentId, 'FCM_TOKEN_REGISTERED', `Token enregistré (${platform})`);
    res.json({ success: true, message: 'Token enregistré' });
  } catch (error) {
    console.error('Erreur enregistrement token:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

### 3.2 Ajouter les champs dans le schéma Prisma

```prisma
model Agent {
  // ... champs existants
  fcmToken       String?
  devicePlatform String?
}
```

Puis appliquer la migration :
```bash
npx prisma migrate dev --name add_fcm_token
```

---

## 🚀 Étape 4 : Point d'entrée principal

### 4.1 Fichier `App.js`

```javascript
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, AuthContext } from './src/contexts/AuthContext';
import {
  registerForPushNotifications,
  addNotificationListener,
  addNotificationResponseListener
} from './src/services/notificationService';

// Écrans
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import AddPropertyScreen from './src/screens/AddPropertyScreen';
import PropertyDetailScreen from './src/screens/PropertyDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs pour l'utilisateur connecté
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: '#a0aec0',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Accueil', headerShown: false }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{ title: 'Mes biens' }}
      />
      <Tab.Screen
        name="AddProperty"
        component={AddPropertyScreen}
        options={{ title: 'Ajouter' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = React.useContext(AuthContext);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user) {
      // Enregistrer les notifications push
      registerForPushNotifications();

      // Écouter les notifications
      notificationListener.current = addNotificationListener((notification) => {
        console.log('📬 Notification reçue:', notification);
      });

      responseListener.current = addNotificationResponseListener((response) => {
        console.log('👆 Notification cliquée:', response);
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [user]);

  if (loading) {
    return null; // ou un écran de chargement
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PropertyDetail"
              component={PropertyDetailScreen}
              options={{ title: 'Détail du bien' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
```

---

## ✅ Checklist de développement

### Phase 1 : Setup (1-2h)
- [ ] Créer le projet Expo
- [ ] Installer toutes les dépendances
- [ ] Configurer `app.json`
- [ ] Créer la structure de dossiers
- [ ] Tester sur votre téléphone avec Expo Go

### Phase 2 : Authentification (2-3h)
- [ ] Créer AuthContext
- [ ] Créer service API
- [ ] Créer écran Login
- [ ] Tester login/logout
- [ ] Gérer le stockage du token

### Phase 3 : Écrans principaux (4-6h)
- [ ] Écran d'accueil avec stats
- [ ] Liste des biens
- [ ] Détail d'un bien
- [ ] Formulaire d'ajout de bien
- [ ] Navigation entre écrans

### Phase 4 : Photos (2-3h)
- [ ] Ajouter expo-image-picker
- [ ] Upload de photos vers Supabase
- [ ] Galerie de photos dans le détail
- [ ] Suppression de photos

### Phase 5 : Notifications (2-3h)
- [ ] Configurer expo-notifications
- [ ] Enregistrer le token FCM
- [ ] Tester réception de notifications
- [ ] Gérer les clics sur notifications

### Phase 6 : Polish (2-3h)
- [ ] Améliorer le design
- [ ] Ajouter des animations
- [ ] Gérer les erreurs réseau
- [ ] Optimiser les performances
- [ ] Tester sur iOS et Android

---

## 📱 Tester l'application

### Avec Expo Go (Développement)

1. Installez Expo Go sur votre téléphone
2. Lancez `npx expo start`
3. Scannez le QR code
4. L'app se charge automatiquement

**Limitations :**
- Pas de compilation native
- Certaines fonctionnalités limitées
- ✅ Parfait pour le développement

### Build standalone (Production)

Pour créer une vraie application installable :

```bash
# iOS (nécessite un compte Apple Developer - 99$/an)
npx eas build --platform ios

# Android (gratuit)
npx eas build --platform android
```

L'app sera compilée dans le cloud et vous recevrez un fichier :
- **iOS** : `.ipa` (pour App Store ou TestFlight)
- **Android** : `.apk` ou `.aab` (pour Google Play ou installation directe)

---

## 🎯 Prochaines étapes après la création

1. **Tester les notifications push** avec votre backend
2. **Ajouter des fonctionnalités** :
   - Géolocalisation des biens
   - Statistiques détaillées
   - Chat avec acheteurs
   - Signature électronique
3. **Soumettre aux stores** (App Store + Google Play)
4. **Activer le monitoring** (Sentry, Firebase Crashlytics)

---

## 💡 Ressources utiles

- **Documentation Expo** : https://docs.expo.dev/
- **React Navigation** : https://reactnavigation.org/
- **Expo Notifications** : https://docs.expo.dev/push-notifications/overview/
- **Tutorial vidéo** : [React Native Tutorial 2024](https://www.youtube.com/results?search_query=react+native+expo+tutorial+2024)

---

**Temps estimé total** : 15-20 heures pour une v1 fonctionnelle

Créé le 2025-01-12 pour ImmoPro CRM
