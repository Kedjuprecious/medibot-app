import auth from "@react-native-firebase/auth";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await auth().signOut();
      router.replace('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const heartTips = [
    "Regular walking (30 mins/day) reduces your risk of heart disease.",
    "Limit your salt intake to control blood pressure.",
    "Avoid smoking to significantly lower heart risks.",
    "Get 7–8 hours of sleep daily for heart repair.",
    "Monitor your cholesterol and blood pressure regularly.",
  ];

  const wellnessTips = [
    "Drink at least 8 glasses of water daily.",
    "Add more green vegetables to your meals.",
    "Avoid processed sugar and junk food.",
    "Take breaks—chronic stress harms health.",
    "Get routine health checkups yearly.",
  ];

  const [heartTipIndex, setHeartTipIndex] = useState(0);
  const [wellnessTipIndex, setWellnessTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeartTipIndex(prev => (prev + 1) % heartTips.length);
      setWellnessTipIndex(prev => (prev + 1) % wellnessTips.length);
    }, 10000); // Change every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#004AAD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.email}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Icon name="menu" size={28} color="#004AAD" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/100' }}
          style={styles.avatar}
        />
      </View>

      <Text style={styles.info}>Let’s begin your health journey today 💙</Text>

      {/* Rotating Tips */}
      <Text style={styles.sectionTitle}>💙 HeartHealth Tip</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>{heartTips[heartTipIndex]}</Text>
      </View>

      <Text style={styles.sectionTitle}>🍎 Wellness Tip</Text>
      <View style={styles.tipBox}>
        <Text style={styles.tipText}>{wellnessTips[wellnessTipIndex]}</Text>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <Text style={styles.fabText}>Get Started</Text>
      </TouchableOpacity>

      {/* Side Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Menu</Text>

            <TouchableOpacity style={styles.menuItem}>
              <Text>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text>About</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text>Rate App</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text>Exit</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={{ color: 'red' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004AAD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  info: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004AAD',
    marginTop: 24,
    marginBottom: 8,
  },
  tipBox: {
    backgroundColor: '#eaf4ff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#004AAD',
  },
  tipText: {
    color: '#333',
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    backgroundColor: '#004AAD',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'center',
    position: 'absolute',
    bottom: 30,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menu: {
    backgroundColor: '#fff',
    width: 200,
    padding: 20,
    marginTop: 60,
    marginRight: 10,
    borderRadius: 10,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
});
