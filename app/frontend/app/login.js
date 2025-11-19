import React, { useContext, useState, useEffect } from 'react';
import { Alert, TextInput, TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
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
            if (!response.data.user.profileCompleted) {
              router.replace('/profile-completion');
            } else {
              router.replace('/( tabs )/index');
            }
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
        <View style={styles.wrapper}>
            <Text style={styles.title}>University of Bamenda Student App</Text>
            <Text style={styles.subtitle}>Login to your Account!</Text>
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign in</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>- Or sign up with -</Text>
            <View style={styles.iconContainer}>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/google.png')} // Replace with your image path
                        style={styles.image}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/facebook.png')} // Replace with your image path
                        style={styles.image}
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconWrapper}>
                    <Image
                        source={require('../assets/images/twitter.png')} // Replace with your image path
                        style={styles.image}
                    />
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Don't have an account?{' '}
                    <Text style={styles.signUp} onPress={() => router.push('/register')}>
                        Sign up!
                    </Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
        color: 'blue',
        paddingVertical: 50,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#f0f0f0',
        marginBottom: 20,
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
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    orText: {
        textAlign: 'center',
        marginVertical: 20,
        color: '#575757',
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
        width: 30,
        height: 30, // Adjusted size
        resizeMode: 'contain',
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
    signUp: {
        fontSize: 14,
        color: '#007BFF',
        fontWeight: 'bold',
    },
});
