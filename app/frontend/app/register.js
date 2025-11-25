import React, { useContext, useState, useEffect } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import axios from 'axios';
import { AuthContext } from './Contexts/AuthContext';
import { router } from 'expo-router';
// API Configuration - Update this URL to match your backend
const API_URL = __DEV__ 
    ? 'https://uba-r875.onrender.com'  // Development - Change to your IP for physical device
  : 'https://uba-r875.onrender.com';  // Production

export default function Register() {
    const { setUserToken, userToken, isLoading } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [school, setSchool] = useState('');
    const [department, setDepartment] = useState('');
    const [level, setLevel] = useState('');

    // Redirect if already authenticated (skip during active registration)
    // This useEffect is mainly for when user returns to register screen while already logged in
    useEffect(() => {
        if (!isLoading && userToken && name === '' && email === '') {
            // Only auto-redirect if form is empty (user came here while already logged in)
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
            // Use a small delay to ensure state is fully updated before navigation
            const needsProfileCompletion = !response.data.user.profileCompleted;
            const targetRoute = needsProfileCompletion 
              ? '/profile-completion' 
              : '/( tabs )/index';
            
            console.log('Navigating to:', targetRoute, 'profileCompleted:', response.data.user.profileCompleted);
            
            // Navigate after state update
            setTimeout(() => {
              try {
                console.log('Attempting navigation to:', targetRoute);
                router.replace(targetRoute);
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback: try the full path
                try {
                  router.replace(needsProfileCompletion ? '/profile-completion' : '/( tabs )/index');
                } catch (e) {
                  router.push(targetRoute);
                }
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
        <ScrollView style={styles.wrapper} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>University of Bamenda Student App</Text>
            <Text style={styles.subtitle}>Create your Account!</Text>
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name *"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email *"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password *"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password *"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Sign up</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Already have an account?{' '}
                    <Text style={styles.signIn} onPress={() => router.push('/login')}>
                        Sign in!
                    </Text>
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
        color: 'blue',
        padding: 50,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#f0f0f0',
        marginBottom: 15,
        padding: 10,
        borderRadius: 4,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    button: {
        backgroundColor: '#575757',
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        marginTop: 30,
    },
    signIn: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: 'bold',
    },
});

