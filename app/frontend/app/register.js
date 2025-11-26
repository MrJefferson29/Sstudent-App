import React, { useContext, useState, useEffect } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { AuthContext } from './Contexts/AuthContext';
import { router } from 'expo-router';

// API Configuration - Update this URL to match your backend
const API_URL = __DEV__ 
    ? 'https://uba-r875.onrender.com'  // Development - Change to your IP for physical device
  : 'https://uba-r875.onrender.com';  // Production

export default function Register() {
    const { setUserToken, userToken, isLoading } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Optional fields kept for API call, even if not displayed initially
    const [school, setSchool] = useState(''); 
    const [department, setDepartment] = useState('');
    const [level, setLevel] = useState('');

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && userToken && name === '' && email === '') {
            router.replace('/( tabs )/index');
        }
    }, [userToken, isLoading]);

    const handleRegister = async () => {
        try {
            // Validation
            if (!name || !email || !password) {
                Alert.alert('Error', 'Please fill in all required fields');
                return;
            }

            if (password.length < 6) {
                Alert.alert('Error', 'Password must be at least 6 characters');
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
            }

            console.log('Attempting registration with:', { name, email });
            const response = await axios.post(`${API_URL}/auth/register`, {
                name,
                email,
                password,
                school: school || undefined,
                department: department || undefined,
                level: level || undefined,
            });

            console.log('Registration response:', response.data);

            // Update the AuthContext (which saves to AsyncStorage automatically)
            await setUserToken(response.data.token, response.data.user);
            console.log('Token and user data saved to AsyncStorage');

            // Redirect to profile completion if profile is not completed
            const needsProfileCompletion = !response.data.user.profileCompleted;
            const targetRoute = needsProfileCompletion 
              ? '/profile-completion' 
              : '/( tabs )/index';
            
            console.log('Navigating to:', targetRoute, 'profileCompleted:', response.data.user.profileCompleted);
            
            // Navigate after state update
            setTimeout(() => {
              try {
                router.replace(targetRoute);
              } catch (error) {
                console.error('Navigation fallback error:', error);
                router.push(targetRoute);
              }
            }, 200);
        } catch (error) {
            console.log('Registration error:', error);
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
                <Text style={styles.title}>Create Student Account</Text>
                <Text style={styles.subtitle}>Sign up to access the UBA portal</Text>

                <View style={styles.form}>
                  <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor="#94a3b8"
                  />
                  <TextInput
                      style={styles.input}
                      placeholder="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
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
                  <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholderTextColor="#94a3b8"
                  />
                </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                  <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>

              <Text style={styles.orText}>- Or continue with -</Text>
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image source={require('../assets/images/google.png')} style={styles.image}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image source={require('../assets/images/facebook.png')} style={styles.image}/>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image source={require('../assets/images/twitter.png')} style={styles.image}/>
                </TouchableOpacity>
              </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Already have an account?{' '}
                        <Text style={styles.signIn} onPress={() => router.push('/login')}>
                            Sign in!
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
      marginTop: 24,
      color: '#94a3b8',
    },
    socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    iconWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
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
    signIn: { // Renamed from signUp for semantic accuracy in Register.js
        fontSize: 15,
        color: '#1a237e',
        fontWeight: '700',
    },
});