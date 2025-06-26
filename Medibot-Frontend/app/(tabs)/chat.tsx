import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions, // For sidebar width
  TouchableWithoutFeedback, // For dismissing sidebar by tapping outside
  Alert, // For better error feedback
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import api from '@/services/api';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

// --- Types ---
type Message = {
  sender: 'user' | 'assistant';
  text: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt?: string; // Crucial for sorting
};

// Get screen width for sidebar
const { width: screenWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75; // 75% of screen width for sidebar

export default function ChatAppDesign() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Use AuthContext to get user data

  // --- Core State for Chat Management ---
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null); // Use null for initial state
  const [input, setInput] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false); // For AI 'thinking' effect
  const [isLoadingConversations, setIsLoadingConversations] = useState(true); // New state for initial fetch
  const [showSidebar, setShowSidebar] = useState(false); // State to control sidebar visibility

  // --- Refs for UI Interaction ---
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Derive the active conversation
  const activeConversation = conversations.find(c => c.id === activeConvId);

  // --- Helper to scroll to the bottom of the chat ---
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 50); // Small delay to allow UI to render new messages
  };

  // --- Handle New Conversation ---
  const handleNewConversation = () => {
    const newTempConvId = `temp-${Date.now()}`;
    const newTempConv: Conversation = {
      id: newTempConvId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
    };

    setConversations(prev => {
      // Filter out any existing temporary new chat if starting a fresh one
      const existingRealConversations = prev.filter(c => !c.id.startsWith('temp-'));
      return [newTempConv, ...existingRealConversations]; // Add new temp chat to the top
    });
    setActiveConvId(newTempConvId); // Set the new temp chat as active
    setShowSidebar(false); // Close sidebar after starting new chat
    setInput(''); // Clear input for the new chat
  };

  // --- Handle Selecting an Existing Conversation from Sidebar ---
  const handleSelectConversation = (conversationId: string) => {
    setActiveConvId(conversationId);
    setShowSidebar(false); // Close sidebar
    setInput(''); // Clear input when switching conversations
  };


  // --- Effect: Fetch User Conversations on Component Mount / User Change ---
  useEffect(() => {
    const fetchConversations = async () => {
      if (authLoading || !user?.id) {
        // If still loading auth or user is not logged in, handle accordingly
        setIsLoadingConversations(false);
        handleNewConversation(); // Ensure there's an active chat, even if empty (temp)
        return;
      }

      setIsLoadingConversations(true); // Start loading state
      try {
        // Assuming your backend returns an array directly:
        const res = await api.get<Conversation[]>('/conversations', {
          params: { userId: user.id },
        });

        // Safely access fetched conversations. Use a default empty array if undefined/null.
        let fetchedConversations: Conversation[] = res.data || [];

        // Ensure messages array exists and sort by createdAt (most recent first)
        fetchedConversations = fetchedConversations
            .map(conv => ({
                ...conv,
                messages: conv.messages || [],
                createdAt: conv.createdAt || new Date().toISOString(), // Fallback for createdAt
            }))
            .sort((a, b) => {
              const dateA = new Date(a.createdAt || '').getTime();
              const dateB = new Date(b.createdAt || '').getTime();
              return dateB - dateA; // Descending order (most recent first)
            });

        if (fetchedConversations.length === 0) {
          // If no conversations from backend, create a new one client-side
          handleNewConversation(); // This already sets activeConvId
        } else {
          setConversations(fetchedConversations);
          // Set the most recent conversation as active if it's not already set
          // or if the current active is a temporary one from before the fetch.
          if (!activeConvId || activeConvId.startsWith('temp-') || !fetchedConversations.some(c => c.id === activeConvId)) {
             setActiveConvId(activeConvId);
          }else {
              // Otherwise, show welcome screen (no active conversation)
            setActiveConvId('');
          }
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        Alert.alert('Error', 'Failed to load past conversations. Starting a new chat.');
        handleNewConversation(); // Fallback to a new chat on error
      } finally {
        setIsLoadingConversations(false); // End loading state
      }
    };

    fetchConversations();
  }, [user?.id, authLoading]); // Dependency array: re-run when user.id or authLoading changes

  // --- Effect: Scroll to bottom whenever messages change ---
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);


  // --- Handle Send Message ---
  const handleSend = async () => {
    if (!input.trim() || isProcessingMessage || !user?.id) {
      if (!user?.id) Alert.alert("Login Required", "Please log in to send messages.");
      return;
    }

    const userMessageText = input.trim();
    const newUserMessage: Message = { sender: 'user', text: userMessageText };

    // Determine the current conversation ID: if activeConvId is null or an empty string, generate a temp one.
    const currentOptimisticConvId = activeConvId && activeConvId !== ''
                                    ? activeConvId
                                    : `temp-${Date.now()}`;

    // Optimistic UI Update: Add user message immediately
    setConversations(prevConvs => {
      let updatedConvs = [...prevConvs];
      const existingConvIndex = updatedConvs.findIndex(c => c.id === currentOptimisticConvId);

      if (existingConvIndex !== -1) {
        // Found existing (or current temp) conversation, append message
        updatedConvs[existingConvIndex] = {
          ...updatedConvs[existingConvIndex],
          messages: [...updatedConvs[existingConvIndex].messages, newUserMessage]
        };
      } else {
        // This should primarily happen if `activeConvId` was null/empty and a new temp ID was generated.
        const newTempConv: Conversation = {
          id: currentOptimisticConvId,
          title: userMessageText.slice(0, 30) + (userMessageText.length > 30 ? '...' : ''), // Initial title
          messages: [newUserMessage],
          createdAt: new Date().toISOString(),
        };
        // Add to the beginning, and filter out any previous empty temporary new chat
        // We filter out any *other* existing temporary chats that are still empty,
        // so we don't accumulate multiple "New Chat" entries from failed attempts.
        updatedConvs = [
            newTempConv,
            ...prevConvs.filter(c => !(c.id.startsWith('temp-') && c.messages.length === 0))
        ];
      }

      // Re-sort to bring the currently active/updated conversation to the top
      return updatedConvs.sort((a, b) => {
          const dateA = new Date(a.createdAt || '').getTime();
          const dateB = new Date(b.createdAt || '').getTime();
          return dateB - dateA;
      });
    });

    // Ensure the UI's active conversation is set to the current (temp or real) one
    setActiveConvId(currentOptimisticConvId);
    setInput(''); // Clear input
    setIsProcessingMessage(true); // Show AI thinking indicator and disable input
    scrollToBottom(); // Scroll down to show the user's message and loader

    try {
      // Determine the conId to send to backend: if it's a temp ID, send an empty string
      const conIdToSend = activeConvId && !activeConvId.startsWith('temp-') ? activeConvId : '';

      const res = await api.post('/chat', {
        userId: user.id, // User is guaranteed to exist by the early check
        content: userMessageText,
        sender: 'user',
        conId: conIdToSend,
      });

      const { aiResponse, conversationId } = res.data;

      const newAiMessage: Message = { sender: 'assistant', text: aiResponse };

      // Update state with AI's response and ensure correct conversation ID is set
      setConversations(prevConvs => {
        return prevConvs.map(conv => {
            // Find the conversation, either by its temporary ID or the real ID returned from backend
            if (conv.id === currentOptimisticConvId) {
                return {
                    ...conv,
                    id: conversationId, // Always use the real ID from backend
                    // Update title if it was a temporary "New Chat" title, or empty/default
                    title: (conv.title === 'New Chat' || conv.title === '') && userMessageText.length > 0
                        ? (userMessageText.slice(0, 30) + (userMessageText.length > 30 ? '...' : ''))
                        : conv.title,
                    messages: [...conv.messages, newAiMessage], // Append AI message
                };
            }
            return conv;
        }).sort((a, b) => { // Re-sort to ensure the updated/new conversation is at the top
            const dateA = new Date(a.createdAt || '').getTime();
            const dateB = new Date(b.createdAt || '').getTime();
            return dateB - dateA;
        });
      });

      // Crucially, set the activeConvId to the real one returned by the backend
      setActiveConvId(conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
      // Revert optimistic update: remove the user's message if sending failed
      setConversations(prevConvs => {
        let revertedConvs = prevConvs.map(conv => {
            if (conv.id === currentOptimisticConvId && conv.messages.length > 0) {
                return { ...conv, messages: conv.messages.slice(0, -1) }; // Remove last (user) message
            }
            return conv;
        });
        // Filter out any temporary conversations that were just created and failed on first message
        revertedConvs = revertedConvs.filter(conv => !(conv.id === currentOptimisticConvId && conv.id.startsWith('temp-') && conv.messages.length === 0));

        return revertedConvs;
      });
      // If the failed conversation was the only one, ensure a new empty one is created
      if (conversations.length === 0 || (conversations.length === 1 && conversations[0].id === currentOptimisticConvId && conversations[0].messages.length <= 1)) {
          handleNewConversation();
      }

    } finally {
      setIsProcessingMessage(false);
      scrollToBottom();
    }
  };


  // --- Determine if welcome screen should be shown ---
  const showWelcomeScreen =
    (!isLoadingConversations && conversations.length === 0) || // No conversations loaded and not loading
    (activeConversation && (activeConversation.id === '' || activeConversation.id.startsWith('temp-')) && activeConversation.messages.length === 0);

  // Show initial loading indicator (e.g., while fetching user data or conversations)
  if (authLoading || isLoadingConversations) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#19c37d" />
        <Text style={{ color: '#ccc', marginTop: 10 }}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Sidebar Overlay */}
      {showSidebar && (
        <TouchableWithoutFeedback onPress={() => setShowSidebar(false)}>
          <View style={styles.sidebarOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Sidebar */}
      <View style={[styles.sidebar, { left: showSidebar ? 0 : -SIDEBAR_WIDTH }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Chats</Text>
          <TouchableOpacity onPress={() => setShowSidebar(false)} style={styles.sidebarCloseButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleNewConversation} style={styles.newChatButtonSidebar}>
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
        <ScrollView style={styles.conversationList}>
          {conversations.map(conv => (
            <TouchableOpacity
              key={conv.id}
              style={[
                styles.conversationListItem,
                activeConvId === conv.id && styles.activeConversationListItem,
              ]}
              onPress={() => handleSelectConversation(conv.id)}
            >
              <Text
                style={[
                  styles.conversationListItemText,
                  activeConvId === conv.id && styles.activeConversationListItemText,
                ]}
                numberOfLines={1} // Ensures title stays on one line
                ellipsizeMode="tail" // Adds "..." if text overflows
              >
                {conv.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Chat Content */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>CardioBot</Text>
        {/* Placeholder for potential future right-side button, like a "New Chat" on the top bar */}
        <TouchableOpacity onPress={handleNewConversation} style={styles.newChatTopBarButton}>
             <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
      </View>

      <View style={styles.chatContainer}>
        {showWelcomeScreen ? (
          <View style={styles.initialPromptContainer}>
            <Text style={styles.welcomeTitle}>CardioBot</Text>
            <Text style={styles.welcomeSubtitle}>How can I help you today?</Text>
            <View style={styles.examplePromptsContainer}>
              <TouchableOpacity style={styles.examplePromptCard} onPress={() => { setInput('Explain heart disease'); handleSend(); }}>
                <Text style={styles.examplePromptText}>Explain heart disease</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.examplePromptCard} onPress={() => { setInput('Symptoms of a heart attack'); handleSend(); }}>
                <Text style={styles.examplePromptText}>Symptoms of a heart attack</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.examplePromptCard} onPress={() => { setInput('Healthy diet for heart'); handleSend(); }}>
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
            {isProcessingMessage && (
              <View style={styles.aiMsgContainer}>
                <MaterialIcons name="psychology" size={20} color="#888" style={styles.avatarIcon} />
                <View style={styles.aiMsgBubble}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={{ color: '#ccc', marginLeft: 8 }}>CardioBot is thinking...</Text>
                </View>
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
            placeholder="Message CardioBot..."
            placeholderTextColor="#999"
            style={styles.input}
            editable={!isProcessingMessage}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendBtn}
            disabled={isProcessingMessage || !input.trim()}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimerText}>CardioBot can make mistakes. Consider checking important information.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles ---
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
  container: {
    flex: 1,
    backgroundColor: '#202123',
  },
  topBar: {
    height: 50,
    backgroundColor: '#202123',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#303030',
    justifyContent: 'space-between', // Changed to space-between
  },
  menuButton: {
    padding: 5,
  },
  topTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newChatTopBarButton: { // New style for the plus button on the top bar
    padding: 5,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#343541',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  messagesScrollView: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 10,
  },
  userMsgContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  userMsgBubble: {
    backgroundColor: '#3D61A6',
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
    marginTop: 2,
  },
  aiMsgBubble: {
    backgroundColor: '#444654',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#343541',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#40414f',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: '#19c37d',
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: 48,
  },
  disclaimerText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- Sidebar Styles ---
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10, // Ensure it's above main content but below sidebar
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#202123', // Dark background like ChatGPT sidebar
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Adjust for status bar on different platforms
    zIndex: 20, // Ensure sidebar is above overlay
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10, // For Android shadow
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#303030',
  },
  sidebarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarCloseButton: {
    padding: 5,
  },
  newChatButtonSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#40414f', // Slightly lighter than sidebar background
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  conversationListItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 8,
    backgroundColor: '#30313f', // Default item background
  },
  activeConversationListItem: {
    backgroundColor: '#3D61A6', // Highlight for active item
  },
  conversationListItemText: {
    color: '#e0e0e0',
    fontSize: 15,
  },
  activeConversationListItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});