import React, { useContext, useState, useEffect } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { AuthContext } from './Contexts/AuthContext';
import { router } from 'expo-router';
// API Configuration - Update this URL to match your backend
const API_URL = __DEV__ 
  ? 'https://uba-r875.onrender.com'  // Development - Change to your IP for physical device
  : 'https://uba-r875.onrender.com';  // Production

export default function Login() {
    const { setUserToken, userToken, isLoading } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && userToken) {
            router.replace('/( tabs )/index');
        }
    }, [userToken, isLoading]);

    const handleLogin = async () => {
        try {
            if (!email || !password) {
                Alert.alert('Error', 'Please fill in all fields');
                return;
            }

            console.log('Attempting login with:', email);
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password,
            });
    
            console.log('Login response:', response.data);
    
            // Update the AuthContext (which saves to AsyncStorage)
            await setUserToken(response.data.token, response.data.user);
            
            // Redirect to profile completion if profile is not completed
            // Use a small delay to ensure state is fully updated before navigation
            const needsProfileCompletion = !response.data.user.profileCompleted;
            const targetRoute = needsProfileCompletion 
              ? '/profile-completion' 
              : '/( tabs )/index';
            
            // Navigate after state update
            setTimeout(() => {
              try {
                router.replace(targetRoute);
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback: try the full path
                try {
                  router.replace(needsProfileCompletion ? '/profile-completion' : '/');
                } catch (e) {
                  router.push(targetRoute);
                }
              }
            }, 200);
        } catch (error) {
            console.log('Login error:', error);
            let errorMessage = 'Something went wrong. Please try again.';
            
            if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
                errorMessage = 'Cannot connect to server. Please check:\n1. Backend server is running\n2. Correct IP address and port\n3. Both devices are on the same network';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert('Error', errorMessage);
        }
    };
    
    return (
        <LinearGradient colors={['#f5f7fa', '#e4e8f0']} style={styles.gradient}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.card}>
                <Text style={styles.title}>User Login</Text>
                <Text style={styles.subtitle}>Sign in to access the portal</Text>

                <View style={styles.form}>
                  <TextInput
                      style={styles.input}
                      placeholder="Email"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      placeholderTextColor="#94a3b8"
                  />
                  <TextInput
                      style={styles.input}
                      placeholder="Password"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      placeholderTextColor="#94a3b8"
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <Text style={styles.orText}>- Or continue with -</Text>
                <View style={styles.iconContainer}>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/google.png')}
                            style={styles.image}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/facebook.png')}
                            style={styles.image}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconWrapper}>
                        <Image
                            source={require('../assets/images/twitter.png')}
                            style={styles.image}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Don't have an account?{' '}
                        <Text style={styles.signUp} onPress={() => router.push('/register')}>
                            Register
                        </Text>
                    </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    flex: {
      flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1a237e',
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 24,
        color: '#64748B',
        textAlign: 'center',
    },
    form: {
      marginBottom: 16,
    },
    input: {
        backgroundColor: '#f8fafc',
        marginBottom: 20,
        padding: 10,
        borderRadius: 12,
        height: 52,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 15,
        color: '#0f172a',
    },
    button: {
        backgroundColor: '#1a237e',
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    orText: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#94a3b8',
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    iconWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5, // For Android shadow
    },
    image: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 15,
        color: '#94a3b8',
        marginTop: 30,
    },
    signUp: {
        fontSize: 15,
        color: '#1a237e',
        fontWeight: '700',
    },
});
