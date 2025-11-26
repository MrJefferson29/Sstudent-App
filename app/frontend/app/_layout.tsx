import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from './Contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="( tabs )" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="profile-completion" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="video-details-two" options={{ headerTitle: "Video Details" }} />
          <Stack.Screen name="school-select" options={{ headerTitle: "School/ Concour Select" }} />
          <Stack.Screen name="department-select" options={{ headerTitle: "Department Select" }} />
          <Stack.Screen name="subject-select" options={{ headerTitle: "Subject Select" }} />
          <Stack.Screen name="level-select" options={{ headerTitle: "Level Select" }} />
          <Stack.Screen name="skill-courses" options={{ headerTitle: "Skill Courses" }} />
          <Stack.Screen name="itemDetail/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="library/[id]" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
