import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Doctor = {
  id: number;
  name: string;
  experience: number;
  location: string;
  license: string;
  photo: string;
};

const doctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Basile Njei',
    experience: 5,
    location: 'Douala, Cameroon',
    license: 'CM-DLA-00123',
    photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYFpUk06WfKt7Lsamieycm_v34XpwSG9fwBw&s',
  },
  {
    id: 2,
    name: 'Dr. Marie Solange',
    experience: 7,
    location: 'Douala, Cameroon',
    license: 'CM-DLA-00456',
    photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJiObxek_xgD6ukXkiW8Eq62b75H_kmeFCRDON0iOe3I_HQgd2ibSIpGl5xtEac2FYzPY&usqp=CAU',
  },
  {
    id: 3,
    name: 'Dr. Fred Kemah',
    experience: 12,
    location: 'Buea, Cameroon',
    license: 'CM-BUE-00789',
    photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYpxQhdd5qehp5cOKnUbpJzesc1SFouMjUxQ&s',
  },
];

export default function DoctorList() {
  const [requested, setRequested] = useState<number[]>([]);

  const handleRequest = (id: number) => {
    if (!requested.includes(id)) {
      setRequested([...requested, id]);
    }
  };

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const isRequested = requested.includes(item.id);
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.detail}>Experience: {item.experience} years</Text>
          <Text style={styles.detail}>Location: {item.location}</Text>
          <Text style={styles.detail}>
            <Icon name="verified" size={14} color="#0078d4" /> License: {item.license}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRequest(item.id)}
          style={[
            styles.requestBtn,
            isRequested ? styles.requestedBtn : styles.activeBtn,
          ]}
          disabled={isRequested}
        >
          <Text style={styles.requestText}>
            {isRequested ? 'Request Sent' : 'Request'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Available Cardiologists</Text>
      <FlatList
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f6fc',
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0078d4',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0078d4',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  detail: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  requestBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeBtn: {
    backgroundColor: '#28a745',
  },
  requestedBtn: {
    backgroundColor: '#aaa',
  },
  requestText: {
    color: 'white',
    fontWeight: '600',
  },
});
