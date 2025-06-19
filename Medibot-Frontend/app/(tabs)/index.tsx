import auth from "@react-native-firebase/auth";
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
export default function DashboardHome() {
  const {user,loading} = useAuth();
  const router = useRouter()
  const signout = async () => {
    await auth().signOut();
    router.push("/login")
  }
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#004AAD" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.email}</Text>
        <Image source={{ uri: 'https://i.pravatar.cc/100' }} style={styles.avatar} />
      </View>
      <Text style={styles.info}>Let’s begin your health journey today 💙</Text>
      <TouchableOpacity onPress={signout} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Logout</Text>
      </TouchableOpacity>
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
  primaryButton: {
    backgroundColor: '#004AAD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#004AAD',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  info: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
  },
});