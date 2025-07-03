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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

type Message = {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
};

export default function ChatDoctor() {
  const { patientName } = useLocalSearchParams() as { patientName: string };

  // Hardcoded full summary string
  const hardcodedSummary = `Patient reports persistent chest pain and shortness of breath lasting 3 days. No history of trauma or previous heart disease. Blood pressure elevated at 150/95 mmHg. Recommended further ECG and cardiology consult. Immediate medication includes aspirin and beta-blockers as needed.`;

  // Initialize messages with hardcoded summary as first message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'summary-1',
      sender: 'patient',
      text: `📝 Summary:\n\n${hardcodedSummary}`,
    },
  ]);

  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isPatient = item.sender === 'patient';

    return (
      <View
        style={[
          styles.messageContainer,
          {
            backgroundColor: '#0078d4',
            alignSelf: isPatient ? 'flex-start' : 'flex-end',
          },
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  const onPressVideoCall = () => {
    alert(`Starting video call with ${patientName || 'patient'}...`);
  };

  const onPressAudioCall = () => {
    alert(`Starting audio call with ${patientName || 'patient'}...`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
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
        data={[...messages].reverse()}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        style={{ flex: 1 }}
      />

      {/* Input area */}
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
  messageText: {
    color: 'white',
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
