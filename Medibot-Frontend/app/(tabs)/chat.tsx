import { useRouter } from 'expo-router';
import React, { useRef, useState,useEffect } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import api from '@/services/api';


// --- Simplified Types for Design ---
type Message = {
  sender: 'user' | 'assistant'; // Using 'assistant' to match common AI terminology
  text: string;
};

type Conversation = {
  id: string; // Simplified to string for demonstration, would be UUID in real app
  title: string;
  messages: Message[];
};

export default function ChatAppDesign() {
//   const { user } = useAuth(); // Not actively used for UI design
  const router = useRouter();
  const { user} = useAuth();

  // --- Static Data for UI Design ---
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [activeConvId, setActiveConvId] = useState<string>('conv-1'); // Default to the first conversation
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false); // Can be used to show a static loading indicator
  const [typing, setTyping] = useState(false); // Can be used to show a static typing indicator
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false); // Still useful for modal design

  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const activeConversation = conversations.find(c => c.id === activeConvId);

  useEffect(()=>{
    const fetchUserConversations = async () =>{
      try {
        const res = await api.get('/conversations',{
          params: {
            userId: user?.id, // Assuming user has an id field
          },
        })
        setConversations(res.data.frontendConversations);
      } catch (error) {
        console.error('Error fetching user conversations:', error);
        
      }
    }
    fetchUserConversations()
  },[user])

  // --- Placeholder functions for UI interactions ---
  const handleSend = () => {
    if (input.trim()) {
      console.log('Simulating sending message:', input);
      setInput(''); // Clear input
      setLoading(true); // Simulate loading
      setTimeout(() => {
        setLoading(false);
        setTyping(true); // Simulate typing for AI response
        setTimeout(() => {
          setTyping(false);
          // Optionally show modal after a simulated AI response
          // setShowDoctorModal(true);
        }, 1500);
      }, 1000);
    }
  };

  const handleNewConversation = () => {
    console.log('Simulating new conversation');
    const newId = `new-conv-${Date.now()}`; // Unique ID for demonstration
    const newConv: Conversation = { id: newId, title: 'New Chat', messages: [] };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newId);
    setSidebarOpen(false);
    setInput('');
    setLoading(false);
    setTyping(false);
  };

  const handleDeleteConversation = (id: string) => {
    console.log('Simulating deleting conversation:', id);
    const remaining = conversations.filter(c => c.id !== id);
    setConversations(remaining);
    if (id === activeConvId && remaining.length > 0) {
      setActiveConvId(remaining[0].id);
    } else if (remaining.length === 0) {
      // If no conversations left, simulate starting a brand new one
      handleNewConversation();
    }
  };

  // Simulate scrolling to bottom (no actual effect without real data changes)
  const scrollToBottom = () => {
    // This will only work with real content and actual message updates
    // setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Determine initial empty state (for "Start a conversation..." message)
  const isInitialEmpty = !activeConversation || activeConversation.messages.length === 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#202123' }}> {/* Dark background for entire app */}
        {/* Top Bar - mimicking ChatGPT's less prominent header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>CardioBot</Text>
          <TouchableOpacity onPress={handleNewConversation} style={styles.newChatButton}>
             <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Sidebar */}
        {sidebarOpen && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Chats</Text>
              <TouchableOpacity onPress={() => setSidebarOpen(false)}>
                <MaterialIcons name="close" size={24} color="#ccc" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sidebarList}>
              <TouchableOpacity style={styles.newConvBtnSidebar} onPress={handleNewConversation}>
                <MaterialIcons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.newConvTextSidebar}>New Chat</Text>
              </TouchableOpacity>
              {conversations.map(conv => (
                <View key={conv.id} style={[styles.sidebarItem, conv.id === activeConvId && styles.activeSidebarItem]}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => {
                      setActiveConvId(conv.id);
                      setSidebarOpen(false);
                      setLoading(false); // Reset loading state on conversation switch
                      setTyping(false); // Reset typing state on conversation switch
                    }}
                  >
                    <MaterialIcons name="chat-bubble-outline" size={18} color="#ccc" style={{ marginRight: 10 }} />
                    <Text numberOfLines={1} style={styles.sidebarItemText}>{conv.title}</Text>
                  </TouchableOpacity>
                  {conversations.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteConversation(conv.id)}
                      style={styles.deleteButton}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#ccc" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            {/* Optional: User/Settings at bottom of sidebar */}
            <View style={styles.sidebarFooter}>
                <TouchableOpacity style={styles.sidebarFooterItem}>
                    <MaterialIcons name="settings" size={20} color="#ccc" style={{ marginRight: 10 }} />
                    <Text style={styles.sidebarItemText}>Settings</Text>
                </TouchableOpacity>
                 <TouchableOpacity style={styles.sidebarFooterItem}>
                    <MaterialIcons name="logout" size={20} color="#ccc" style={{ marginRight: 10 }} />
                    <Text style={styles.sidebarItemText}>Log Out</Text>
                </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main Chat Area */}
        <View style={styles.chatContainer}>
          {isInitialEmpty ? (
            <View style={styles.initialPromptContainer}>
                <Text style={styles.welcomeTitle}>CardioBot</Text>
                <Text style={styles.welcomeSubtitle}>How can I help you today?</Text>
                {/* Example prompts */}
                <View style={styles.examplePromptsContainer}>
                    <TouchableOpacity style={styles.examplePromptCard}>
                        <Text style={styles.examplePromptText}>Explain heart disease</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.examplePromptCard}>
                        <Text style={styles.examplePromptText}>Symptoms of a heart attack</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.examplePromptCard}>
                        <Text style={styles.examplePromptText}>Healthy diet for heart</Text>
                    </TouchableOpacity>
                </View>
            </View>
          ) : (
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messagesScrollView}>
              {activeConversation?.messages.map((m, i) => (
                <View key={i} style={m.sender === 'user' ? styles.userMsgContainer : styles.aiMsgContainer}>
                  {m.sender === 'assistant' && (
                    <MaterialIcons name="psychology" size={20} color="#888" style={styles.avatarIcon} />
                  )}
                  <View style={m.sender === 'user' ? styles.userMsgBubble : styles.aiMsgBubble}>
                    <Markdown style={m.sender === 'user' ? userMarkdownStyles : aiMarkdownStyles}>
                      {m.text}
                    </Markdown>
                  </View>
                </View>
              ))}
              {loading && ( // Show loading when waiting for initial AI response
                <View style={styles.aiMsgContainer}>
                  <MaterialIcons name="psychology" size={20} color="#888" style={styles.avatarIcon} />
                  <View style={styles.aiMsgBubble}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: '#ccc', marginLeft: 8 }}>CardioBot is thinking...</Text>
                  </View>
                </View>
              )}
              {typing && ( // Show typing after initial response if summary/follow-up
                <View style={styles.aiMsgContainer}>
                  <MaterialIcons name="psychology" size={20} color="#888" style={styles.avatarIcon} />
                  <View style={styles.aiMsgBubble}>
                    <Text style={{ fontStyle: 'italic', color: '#ccc' }}>CardioBot is typing...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          )}

          {/* Input Area */}
          <View style={styles.inputArea}>
            <TextInput
              ref={inputRef}
              multiline
              value={input}
              onChangeText={setInput}
              placeholder="Message CardioBot..."
              placeholderTextColor="#999"
              style={styles.input}
              editable={!loading && !typing} // Disable input when loading or typing
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={loading || !input.trim()}>
              <MaterialIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
           <Text style={styles.disclaimerText}>CardioBot can make mistakes. Consider checking important information.</Text>
        </View>

        {/* Doctor Modal */}
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
                    router.replace('/(tabs)/doctor'); // Adjust this route if needed
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

const userMarkdownStyles = StyleSheet.create({
    body: {
        color: '#fff',
        fontSize: 16,
    },
});

const aiMarkdownStyles = StyleSheet.create({
    body: {
        color: '#e0e0e0',
        fontSize: 16,
    },
});

const styles = StyleSheet.create({
  // --- General Layout & Background ---
  container: {
    flex: 1,
    backgroundColor: '#202123', // Dark background
  },

  // --- Top Bar ---
  topBar: {
    height: 50,
    backgroundColor: '#202123', // Darker to contrast slightly or match main background
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#303030', // Subtle separator
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 5,
  },
  topTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newChatButton: {
    padding: 5,
  },

  // --- Sidebar ---
  sidebar: {
    position: 'absolute',
    top: 0, // Start from top of screen to cover topBar
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#282c34', // Even darker for sidebar background
    borderRightWidth: 1,
    borderRightColor: '#444',
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Account for status bar on Android
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sidebarList: {
    flex: 1,
    paddingVertical: 10,
  },
  newConvBtnSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3f4a',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  newConvTextSidebar: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  activeSidebarItem: {
    backgroundColor: '#4e4e5b', // Highlight active conversation
  },
  sidebarItemText: {
    flex: 1,
    color: '#ccc',
    fontSize: 15,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  sidebarFooter: {
      borderTopWidth: 1,
      borderTopColor: '#444',
      paddingVertical: 10,
      paddingHorizontal: 15,
  },
  sidebarFooterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
  },

  // --- Chat Container ---
  chatContainer: {
    flex: 1,
    backgroundColor: '#343541', // Main chat background
    justifyContent: 'flex-end',
    paddingBottom: 10, // Padding to lift input area from bottom
  },
  messagesScrollView: {
    paddingHorizontal: 10,
    paddingBottom: 20, // Give some space at the bottom of messages
    paddingTop: 10,
  },

  // --- Message Bubbles ---
  userMsgContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  userMsgBubble: {
    backgroundColor: '#3D61A6', // Distinct user message color (blueish)
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    maxWidth: '80%',
  },
  aiMsgContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarIcon: {
      marginRight: 10,
      marginTop: 2, // Align with text
  },
  aiMsgBubble: {
    backgroundColor: '#444654', // Darker AI message background
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    maxWidth: '80%',
    flexDirection: 'row', // For typing indicator
    alignItems: 'center',
  },

  // --- Initial Prompt Screen ---
  initialPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  examplePromptsContainer: {
      width: '100%',
      alignItems: 'center',
  },
  examplePromptCard: {
      backgroundColor: '#444654',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginBottom: 15,
      width: '85%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#555',
  },
  examplePromptText: {
      color: '#e0e0e0',
      fontSize: 16,
  },


  // --- Input Area ---
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#343541', // Match chat background
    alignItems: 'center', // Center items vertically
  },
  input: {
    flex: 1,
    backgroundColor: '#40414f', // Darker input field background
    color: '#fff', // White text
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxHeight: 100, // Limit input height for multiline
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#19c37d', // ChatGPT's send button green
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48, // Match input height roughly
    width: 48,
  },
  disclaimerText: {
      color: '#888',
      fontSize: 12,
      textAlign: 'center',
      marginTop: 5,
      paddingHorizontal: 10,
  },

  // --- Modal (Doctor) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#343541', // Dark modal background
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});