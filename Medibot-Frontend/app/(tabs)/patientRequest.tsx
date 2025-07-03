import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
          <Image source={{ uri: 'data:image/jpeg;base64,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' }} style={styles.photo} />
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
