import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';

// Define the Request type for patient requests
type Request = {
  id: number;
  patientName: string;
  summary: string;
  photoUri?: string;
};

// Initial mock requests data
const initialRequests: Request[] = [
  {
    id: 1,
    patientName: 'John Doe',
    summary: 'I have been experiencing chest pain and shortness of breath.',
    photoUri: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 2,
    patientName: 'Jane Smith',
    summary: 'Palpitations and dizziness for two days.',
    photoUri: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
];

// Main functional component
export default function DoctorRequests() {
  const router = useRouter();

  // State with explicit generic for TS — type annotation ensures type safety
  const [requests, setRequests] = useState<Request[]>(initialRequests);

  // Track which requests have been accepted to disable buttons after accepting
  const [acceptedRequests, setAcceptedRequests] = useState<number[]>([]);

  /**
   * Accept a patient's request:
   * - Add request ID to acceptedRequests state
   * - Show confirmation alert
   * - Navigate to chat tab, passing patientName and summary as params
   */
  const acceptRequest = (id: number, patientName: string, summary: string) => {
    if (acceptedRequests.includes(id)) {
      Alert.alert('Request already accepted');
      return;
    }

    // Mark request as accepted
    setAcceptedRequests((prev) => [...prev, id]);

    Alert.alert('Request accepted', `You accepted ${patientName}'s request.`);

    console.log(`Routing to chat tab for patient: ${patientName}`);

    // Navigate to Chat screen inside tabs with params (example using expo-router)
    router.replace({
      pathname: '/(tabs)/chatDoctor',
      params: { patientName, summary },
    });
  };

  /**
   * Renders a single patient request card
   */
  const renderItem = ({ item }: { item: Request }) => {
    const accepted = acceptedRequests.includes(item.id);

    return (
      <View style={styles.card}>
        {/* Patient profile image */}
        {item.photoUri && (
          <Image source={{ uri: item.photoUri }} style={styles.photo} />
        )}

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.patientName}>{item.patientName}</Text>
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary}
          </Text>
        </View>

        {/* Accept button; disabled if already accepted */}
        <TouchableOpacity
          style={[styles.acceptBtn, accepted && styles.acceptedBtn]}
          onPress={() => acceptRequest(item.id, item.patientName, item.summary)}
          disabled={accepted}
        >
          <Text style={styles.acceptBtnText}>
            {accepted ? 'Accepted' : 'Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Requests</Text>

      {requests.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>
          No requests at the moment.
        </Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f1f6fc' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#0078d4' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#0078d4',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  patientName: { fontSize: 18, fontWeight: '600', marginBottom: 6, color: '#222' },
  summary: { fontSize: 14, color: '#555' },
  acceptBtn: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  acceptedBtn: {
    backgroundColor: '#aaa',
  },
  acceptBtnText: {
    color: 'white',
    fontWeight: '600',
  },
});
