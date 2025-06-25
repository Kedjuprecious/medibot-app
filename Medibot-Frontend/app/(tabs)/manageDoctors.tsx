import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Doctor = {
  id: number;
  name: string;
  experience: number;
  location: string;
  license: string;
  photo: string; // will store URI from gallery
};

const initialDoctors: Doctor[] = [
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
];

export default function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [license, setLicense] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Pick image from gallery
  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need permission to access your gallery!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleDelete = (id: number) => {
    setDoctors((prev) => prev.filter((doc) => doc.id !== id));
    setSelectedDoctorId(null);
    setConfirmVisible(false);
  };

  const confirmDelete = (id: number) => {
    setSelectedDoctorId(id);
    setConfirmVisible(true);
  };

  const handleAddDoctor = () => {
    if (!name || !experience || !location || !license || !photo) {
      Alert.alert('All fields are required, including picture!');
      return;
    }

    const newDoctor: Doctor = {
      id: Date.now(),
      name,
      experience: parseInt(experience),
      location,
      license,
      photo,
    };

    setDoctors((prev) => [...prev, newDoctor]);

    // Reset form and close modal
    setName('');
    setExperience('');
    setLocation('');
    setLicense('');
    setPhoto(null);
    setFormVisible(false);
  };

  const renderDoctor = ({ item }: { item: Doctor }) => {
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
        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
          <Icon name="delete" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Manage Cardiologists</Text>
      <FlatList
        data={doctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Doctor Button */}
      <TouchableOpacity style={styles.bigPlusButton} onPress={() => setFormVisible(true)}>
        <Ionicons name="add" size={36} color="#fff" />
      </TouchableOpacity>

      {/* Confirm Delete Modal */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Doctor</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this doctor?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.deleteBtn]} onPress={() => selectedDoctorId && handleDelete(selectedDoctorId)}>
                <Text style={styles.modalBtnText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Doctor Form Modal */}
      <Modal
        transparent
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.formBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add New Doctor</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#000"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Years of Experience"
                placeholderTextColor="#000"
                value={experience}
                keyboardType="numeric"
                onChangeText={setExperience}
              />
              <TextInput
                style={styles.input}
                placeholder="Location"
                placeholderTextColor="#000"
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                style={styles.input}
                placeholder="License Number"
                placeholderTextColor="#000"
                value={license}
                onChangeText={setLicense}
              />

              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Text style={styles.imagePickerText}>
                  {photo ? 'Change Picture' : 'Pick Picture from Gallery'}
                </Text>
              </TouchableOpacity>

              {photo && (
                <Image source={{ uri: photo }} style={styles.imagePreview} />
              )}

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setFormVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.addBtn]} onPress={handleAddDoctor}>
                  <Text style={styles.modalBtnText}>Add Doctor</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  bigPlusButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0078d4',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  imagePickerBtn: {
    backgroundColor: '#0078d4',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  imagePickerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelBtn: {
    backgroundColor: '#aaa',
  },
  deleteBtn: {
    backgroundColor: '#d32f2f',
  },
  addBtn: {
    backgroundColor: '#28a745',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
