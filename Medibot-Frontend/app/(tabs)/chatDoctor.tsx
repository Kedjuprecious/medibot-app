import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type Message = {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const { patientName, summary } = useLocalSearchParams() as {
    patientName: string;
    summary: string;
  };

  // Initialize messages with patient summary as first message
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'patient', text: summary || 'No summary available' },
  ]);
  const [input, setInput] = useState('');

  /**
   * Send message handler: adds a doctor message to the chat
   */
  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    console.log(`Sent message: ${newMsg.text}`);
  };

  /**
   * Render each message bubble styled based on sender
   */
  const renderMessage = ({ item }: { item: Message }) => {
    const isPatient = item.sender === 'patient';
    return (
      <View
        style={[
          styles.messageContainer,
          isPatient ? styles.patientMessage : styles.doctorMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  /**
   * Handlers for call buttons, show alert for now
   */
  const onPressVideoCall = () => {
    Alert.alert('Video Call', `Starting video call with ${patientName}...`);
    console.log('Video call pressed');
  };
  const onPressAudioCall = () => {
    Alert.alert('Audio Call', `Starting audio call with ${patientName}...`);
    console.log('Audio call pressed');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={80}
    >
      {/* Header: patient name + call buttons */}
      <View style={styles.header}>
        <Text style={styles.patientName}>{patientName || 'Unknown Patient'}</Text>
        <View style={styles.callButtons}>
          <TouchableOpacity onPress={onPressVideoCall} style={styles.callBtn}>
            <Ionicons name="videocam" size={28} color="#0078d4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPressAudioCall} style={styles.callBtn}>
            <Ionicons name="call" size={28} color="#0078d4" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        inverted
        style={{ flex: 1 }}
      />

      {/* Input box for doctor's message */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          placeholder="Type your message"
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <MaterialIcons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f6fc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#0078d4',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  patientName: { fontSize: 20, fontWeight: 'bold', color: '#0078d4' },
  callButtons: { flexDirection: 'row' },
  callBtn: {
    marginLeft: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  patientMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  doctorMessage: {
    backgroundColor: '#0078d4',
    alignSelf: 'flex-end',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0078d4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#000',
  },
  sendBtn: {
    backgroundColor: '#0078d4',
    borderRadius: 24,
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
