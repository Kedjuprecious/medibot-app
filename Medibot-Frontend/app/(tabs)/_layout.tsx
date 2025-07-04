import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAuth } from '../context/AuthContext';


export default function DashboardLayout() {
  const { user, loading } = useAuth();
  // Wait for user to be fetched
  if (loading) return null;

  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';
  const isAdmin = user?.role === 'admin';
  return (
    // The Tabs component creates a tab navigator for the app
    // Each Tabs.Screen defines a tab with its name and options
    // The tabBarIcon option specifies the icon to display in the tab bar
    // The name prop corresponds to the file name in the app/(tabs) directory
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          href: isPatient ? '/' : null, // Only show this tab for patients
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
          href: isPatient ? '/chat' : null,
        }}
      />
      <Tabs.Screen
        name="doctor"
        options={{
          title: 'Doctor',
          tabBarIcon: ({ color, size }) => <Ionicons name="medkit" size={size} color={color} />,
          href: isPatient ? '/doctor' : null,
        }}
      />
      <Tabs.Screen
        name="manageDoctors"
        options={{
          title: 'Manage Doctors',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          href: isAdmin ? '/manageDoctors' : null,
        }}
      />
            <Tabs.Screen
        name="patientRequest"
        options={{
          title: 'Patient Requests',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          href: isDoctor ? '/patientRequest' : null,
        }}
      />

      <Tabs.Screen
        name="chatDoctor"
        options={{
          title: 'Chat Doctor',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          href: isDoctor ? '/chatDoctor' : null,
        }}
      />

    </Tabs>
  );
}