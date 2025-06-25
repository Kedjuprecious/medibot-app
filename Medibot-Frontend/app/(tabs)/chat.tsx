import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext'; // 👈 import your auth context
import { MaterialIcons} from '@expo/vector-icons';


const BACKEND_URL = 'http://<your-server-ip>:<port>'; // Replace with actual backend
const systemInstruction = `You are a cardiologist AI expert...`; // your system prompt
const temperature = 0.7;

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

type Conversation = {
  id: number;
  title: string;
  messages: Message[];
};

export default function ChatApp() {
  const { user } = useAuth(); // 👈 get user object
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number>(1);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const maxQuestions = 6;
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const activeConversation = conversations.find(c => c.id === activeConvId);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const saved = await AsyncStorage.getItem(`conversations_${user.id}`);
      if (saved) {
        setConversations(JSON.parse(saved));
      } else {
        setConversations([{ id: 1, title: 'New Conversation', messages: [] }]);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.setItem(`conversations_${user.id}`, JSON.stringify(conversations));
  }, [conversations, user]);

  const updateMessages = (convId: number, messages: Message[]) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === convId
          ? {
              ...c,
              messages,
              title:
                c.title === 'New Conversation'
                  ? messages.find(m => m.sender === 'user')?.text.slice(0, 30) || 'New Conversation'
                  : c.title
            }
          : c
      )
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    const updatedMessages: Message[] = [...activeConversation.messages, { sender: 'user', text: input }];
    updateMessages(activeConvId, updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, message: input }),
      });

      const data = await res.json();
      const reply = data?.response || 'No response.';
      let recommendationText = reply;
      let summaryText = '';
      const summaryIndex = reply.toLowerCase().indexOf('summary:');
      if (summaryIndex !== -1) {
        recommendationText = reply.slice(0, summaryIndex).trim();
        summaryText = reply.slice(summaryIndex).trim();
      }

      const newMessages: Message[] = [...updatedMessages, { sender: 'ai', text: recommendationText }];
      updateMessages(activeConvId, newMessages);
      scrollToBottom();

      if (summaryText) {
        setTyping(true);
        setTimeout(() => {
          setConversations(prev =>
            prev.map(c =>
              c.id === activeConvId ? { ...c, messages: [...c.messages, { sender: 'ai', text: summaryText }] } : c
            )
          );
          setTyping(false);
          scrollToBottom();
          setShowDoctorModal(true);
        }, 1500);
      }

      if (questionCount < maxQuestions) setQuestionCount(prev => prev + 1);
    } catch (err) {
      console.error('Error sending message:', err);
      updateMessages(activeConvId, [...updatedMessages, { sender: 'ai', text: 'Error occurred while processing your message.' }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const isInitialEmpty = questionCount === 0 && (!activeConversation || activeConversation.messages.length === 0);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)}>
            <Text style={styles.hamburger}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>CardioBot</Text>
        </View>

        {sidebarOpen && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Conversations</Text>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sidebarList}>
              {conversations.map(conv => (
                <View key={conv.id} style={[styles.sidebarItem, conv.id === activeConvId && { backgroundColor: '#ddd' }]}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => {
                      setActiveConvId(conv.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <Text numberOfLines={1} style={styles.sidebarItemText}>{conv.title}</Text>
                  </TouchableOpacity>
                  {conversations.length > 1 && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Delete Conversation', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              const remaining = conversations.filter(c => c.id !== conv.id);
                              setConversations(remaining);
                              if (conv.id === activeConvId && remaining.length > 0) {
                                setActiveConvId(remaining[0].id);
                              }
                            }
                          }
                        ]);
                      }}
                    >
                      <MaterialIcons name="delete" size={20} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.newConvBtn}
              onPress={() => {
                const newId = Math.max(...conversations.map(c => c.id)) + 1;
                const newConv: Conversation = { id: newId, title: 'New Conversation', messages: [] };
                setConversations([newConv, ...conversations]);
                setActiveConvId(newId);
                setSidebarOpen(false);
                setQuestionCount(0);
              }}
            >
              <Text style={styles.newConvText}>+ New Conversation</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.chatContainer, isInitialEmpty && { justifyContent: 'center', alignItems: 'center' }]}>
          {isInitialEmpty ? (
            <Text style={styles.welcomeText}>Start a conversation with CardioBot!</Text>
          ) : (
            <ScrollView ref={scrollViewRef} contentContainerStyle={{ padding: 10 }}>
              {activeConversation?.messages.map((m, i) => (
                <View key={i} style={m.sender === 'user' ? styles.userMsg : styles.aiMsg}>
                  <Markdown>{m.text}</Markdown>
                </View>
              ))}
              {typing && (
                <View style={styles.aiMsg}>
                  <Text style={{ fontStyle: 'italic', color: '#888' }}>CardioBot is typing...</Text>
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.inputArea}>
            <TextInput
              ref={inputRef}
              multiline
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#000"
              style={styles.input}
              editable={!loading && !typing}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} disabled={loading || !input.trim()}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white' }}>Send</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showDoctorModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDoctorModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Do you want to see a doctor?</Text>
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#0078d4' }]}
                  onPress={() => {
                    setShowDoctorModal(false);
                    router.replace('/(tabs)/doctor');
                  }}
                >
                  <Text style={styles.modalButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#999' }]}
                  onPress={() => setShowDoctorModal(false)}
                >
                  <Text style={styles.modalButtonText}>No, I'm okay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 50,
    backgroundColor: '#0078d4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  hamburger: { color: 'white', fontSize: 24, marginRight: 10 },
  topTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  chatContainer: { flex: 1, backgroundColor: '#f9f9f9', justifyContent: 'flex-end' },
  welcomeText: { fontSize: 20, color: '#888', textAlign: 'center', marginBottom: 20 },
  userMsg: {
    alignSelf: 'flex-end', backgroundColor: '#0078d4', padding: 10, borderRadius: 8, marginBottom: 5, maxWidth: '80%',
  },
  aiMsg: {
    alignSelf: 'flex-start', backgroundColor: '#e5e5ea', padding: 10, borderRadius: 8, marginBottom: 5, maxWidth: '80%',
  },
  inputArea: {
    flexDirection: 'row', padding: 8, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: '#fff',
  },
  input: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 5, maxHeight: 100 },
  sendBtn: { marginLeft: 8, backgroundColor: '#0078d4', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 5 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white', padding: 24, borderRadius: 16, width: '100%', maxWidth: 340, alignItems: 'center',
  },
  modalTitle: { fontSize: 20, marginBottom: 24, fontWeight: '700', textAlign: 'center', color: '#222' },
  modalButtonsRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8,
  },
  modalButton: { flex: 1, marginHorizontal: 6, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  sidebar: {
    position: 'absolute', top: 50, left: 0, bottom: 0, width: 280, backgroundColor: '#fff', borderRightWidth: 1,
    borderRightColor: '#ccc', zIndex: 10, padding: 10,
  },
  sidebarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  sidebarTitle: { fontSize: 18, fontWeight: 'bold' },
  sidebarList: { marginTop: 10 },
  sidebarItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 6,
    marginBottom: 5, backgroundColor: '#f0f0f0',
  },
  sidebarItemText: { flex: 1, marginRight: 10 },
  newConvBtn: {
    marginTop: 10, backgroundColor: '#0078d4', padding: 12, borderRadius: 8, alignItems: 'center',
  },
  newConvText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
