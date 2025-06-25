import auth from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import { FirebaseError } from "firebase/app";
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import api from "../services/api"

export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const res = await api.post("/user", {
        email: email,
        username: name,
        role: "patient"
      });
      if (res.data.success) {
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
      <TextInput
        style={styles.input}
        placeholderTextColor="#000"
        onChangeText={setName}
        placeholder="Username"
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholderTextColor="#000"
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#000"
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
          <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="#555" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          placeholderTextColor="#000"
          secureTextEntry={!showConfirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)}>
          <Icon name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color="#555" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size={'small'} style={{ margin: 28 }} />
      ) : (
        <TouchableOpacity onPress={() => router.push('/login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      )}
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#000',
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
