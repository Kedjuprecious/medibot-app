import auth from "@react-native-firebase/auth";
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  const router = useRouter();

  const [email,setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading,setLoading] = useState(false);

  const signIn = async () => {
		setLoading(true);
		try {
			await auth().signInWithEmailAndPassword(email, password);
      router.push("/(tabs)");
		} catch (e: any) {
			const err = e as FirebaseError;
			alert('Sign in failed: ' + err.message);
		} finally {
			setLoading(false);
		}
	};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to TeleMed AI</Text>

      <TextInput style={styles.input} placeholderTextColor="#000" onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholderTextColor="#000" onChangeText={setPassword} placeholder="Password" secureTextEntry />
      {loading ? 
      (
        <ActivityIndicator size={'small'} style={{ margin: 28 }} />
      ):
      (<TouchableOpacity onPress={signIn} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Login</Text>
      </TouchableOpacity>)
      }

      <TouchableOpacity onPress={() => router.push('/signup')}>
        <Text style={styles.link}>Dont have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f9fafe',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#004AAD',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    color: "#000",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
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
  link: {
    textAlign: 'center',
    color: '#004AAD',
    fontWeight: '500',
  },
});