import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { FirebaseError } from "firebase/app";
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

import api from "../services/api"

export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    if(password !== confirmPassword){
      Alert.alert("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
			const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const res = await api.post("/user",{
        email: email,
        username: name,
        role: "patient"
      })
      if(res.data.success){
        await userCredential.user.sendEmailVerification();
      }
      alert('Account created successfully, please verify your email');
		} catch (e: any) {
			const err = e as FirebaseError;
			alert('Registration failed: ' + err.message);
		} finally {
			setLoading(false);
		}
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput style={styles.input} placeholderTextColor="#000"  onChangeText={setName} placeholder="username" autoCapitalize="words" />
      <TextInput style={styles.input} placeholderTextColor="#000" onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholderTextColor="#000" onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <TextInput style={styles.input} placeholderTextColor="#000" onChangeText={setConfirmPassword} placeholder="Confirm Password" secureTextEntry />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size={'small'} style={{ margin: 28 }} />
      ):(
      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>)
    }
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
    color: "#000",
    padding: 14,
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