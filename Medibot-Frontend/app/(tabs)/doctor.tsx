import React, { useState } from 'react';
import {
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TabTwoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{`</>`}</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Explore</Text>
      </View>

      <Text style={styles.paragraph}>This app includes example code to help you get started.</Text>

      {/* Collapsible Sections */}
      <Collapsible title="File-based routing">
        <Text>
          This app has two screens: <Text style={styles.bold}>app/(tabs)/index.tsx</Text> and{' '}
          <Text style={styles.bold}>app/(tabs)/explore.tsx</Text>
        </Text>
        <Text>
          The layout file in <Text style={styles.bold}>app/(tabs)/_layout.tsx</Text> sets up the tab navigator.
        </Text>
        <ExternalLink url="https://docs.expo.dev/router/introduction" label="Learn more" />
      </Collapsible>

      <Collapsible title="Android, iOS, and web support">
        <Text>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <Text style={styles.bold}>w</Text> in the terminal running this project.
        </Text>
      </Collapsible>

      <Collapsible title="Images">
        <Text>
          For static images, you can use the <Text style={styles.bold}>@2x</Text> and{' '}
          <Text style={styles.bold}>@3x</Text> suffixes to provide files for different screen densities.
        </Text>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ alignSelf: 'center', width: 100, height: 100 }}
          resizeMode="contain"
        />
        <ExternalLink url="https://reactnative.dev/docs/images" label="Learn more" />
      </Collapsible>

      <Collapsible title="Custom fonts">
        <Text>
          Open <Text style={styles.bold}>app/_layout.tsx</Text> to see how to load{' '}
          <Text style={{ fontFamily: 'SpaceMono' }}>custom fonts such as this one.</Text>
        </Text>
        <ExternalLink
          url="https://docs.expo.dev/versions/latest/sdk/font"
          label="Learn more"
        />
      </Collapsible>

      <Collapsible title="Light and dark mode components">
        <Text>
          This template has light and dark mode support. The{' '}
          <Text style={styles.bold}>useColorScheme()</Text> hook lets you inspect the users current
          color scheme, and adjust UI colors accordingly.
        </Text>
        <ExternalLink
          url="https://docs.expo.dev/develop/user-interface/color-themes/"
          label="Learn more"
        />
      </Collapsible>

      <Collapsible title="Animations">
        <Text>
          This template includes an animated component. The{' '}
          <Text style={styles.bold}>components/HelloWave.tsx</Text> uses{' '}
          <Text style={styles.bold}>react-native-reanimated</Text> to create a waving hand animation.
        </Text>
        {Platform.OS === 'ios' && (
          <Text>
            The <Text style={styles.bold}>components/ParallaxScrollView.tsx</Text> provides a parallax effect.
          </Text>
        )}
      </Collapsible>
    </ScrollView>
  );
}

function Collapsible({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.collapsible}>
      <TouchableOpacity onPress={() => setOpen(!open)}>
        <Text style={styles.collapsibleTitle}>
          {open ? '▼' : '▶'} {title}
        </Text>
      </TouchableOpacity>
      {open && <View style={{ marginTop: 8 }}>{children}</View>}
    </View>
  );
}

function ExternalLink({ url, label }: { url: string; label: string }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)}>
      <Text style={styles.link}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D0D0D0',
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 60,
    color: '#808080',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 16,
  },
  bold: {
    fontWeight: '600',
  },
  collapsible: {
    marginBottom: 16,
  },
  collapsibleTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 4,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});