import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function DashboardLayout() {
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
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="doctor"
        options={{
          title: 'Doctor',
          tabBarIcon: ({ color, size }) => <Ionicons name="medkit" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}