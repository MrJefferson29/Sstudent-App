import React, { useContext, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AuthContext } from '../Contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { userToken, user, isLoading } = useContext(AuthContext);
  const router = useRouter();

  // Redirect to login if not authenticated, or to profile completion if profile not completed
  useEffect(() => {
    if (!isLoading) {
      if (!userToken) {
        router.replace('/login' as any);
      } else if (user && user.profileCompleted === false) {
        // Only redirect if profileCompleted is explicitly false (not undefined/null)
        // Add a longer delay to prevent race conditions when navigating from profile-completion
        // This gives time for the user state to update after profile completion
        const timer = setTimeout(() => {
          // Double-check the user state before redirecting
          // Also check if we're coming from profile-completion by checking the route
          if (user && user.profileCompleted === false) {
            console.log('Tabs layout: User profile not completed, redirecting to profile-completion');
            router.replace('/profile-completion' as any);
          } else {
            console.log('Tabs layout: User profile is completed or state updated');
          }
        }, 500);
        return () => clearTimeout(timer);
      } else if (user && user.profileCompleted === true) {
        console.log('Tabs layout: User profile is completed, allowing access');
      }
    }
  }, [userToken, user?.profileCompleted, isLoading]);

  // Show loading indicator while checking authentication
  if (isLoading || !userToken) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#575757" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#575757',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="study-groups"
          options={{
            headerShown: false,
            title: 'Study Group',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            headerShown: false,
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'library' : 'library-outline'} color={color} size={25} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={25} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
