import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Onboarding() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to TeleMed AI</Text>
      <Text style={styles.description}>
        Get expert cardiology recommendations and connect with real doctors.
      </Text>

      {/* Button to navigate to the main app */}     
      <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
        <Text style={styles.signupButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#f5f7fa',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#004AAD',
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40,
      color: '#333',
    },
    loginButton: {
      backgroundColor: '#004AAD',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      marginBottom: 12,
      width: '80%',
      alignItems: 'center',
    },
    signupButton: {
      backgroundColor: '#fff',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 8,
      borderColor: '#004AAD',
      borderWidth: 1.5,
      width: '80%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    signupButtonText: {
      color: '#004AAD',
      fontSize: 16,
      fontWeight: '600',
    },
  });