import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CVScreen() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    summary: '',
    education: '',
    experience: '',
    skills: '',
    certifications: '',
    hobbies: '',
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleGenerate = () => {
    // Placeholder for CV generation logic
    alert('Your CV will be generated soon!');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <LinearGradient colors={["#43cea2", "#3498DB"]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Generate Your CV</Text>
        <Text style={styles.headerSubtitle}>
          Fill in your details below and generate a professional CV in seconds!
        </Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <TextInput style={styles.input} placeholder="Full Name" value={form.fullName} onChangeText={v => handleChange('fullName', v)} />
        <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => handleChange('email', v)} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Phone Number" value={form.phone} onChangeText={v => handleChange('phone', v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={v => handleChange('address', v)} />
        <Text style={styles.sectionTitle}>Profile Summary</Text>
        <TextInput style={[styles.input, {height: 70}]} placeholder="Brief summary about yourself" value={form.summary} onChangeText={v => handleChange('summary', v)} multiline />
        <Text style={styles.sectionTitle}>Education</Text>
        <TextInput style={styles.input} placeholder="E.g. BSc Computer Science, University of Lagos, 2022" value={form.education} onChangeText={v => handleChange('education', v)} />
        <Text style={styles.sectionTitle}>Work Experience</Text>
        <TextInput style={[styles.input, {height: 70}]} placeholder="E.g. Intern at Tech Company, 2023" value={form.experience} onChangeText={v => handleChange('experience', v)} multiline />
        <Text style={styles.sectionTitle}>Skills</Text>
        <TextInput style={styles.input} placeholder="E.g. Programming, Public Speaking" value={form.skills} onChangeText={v => handleChange('skills', v)} />
        <Text style={styles.sectionTitle}>Certifications</Text>
        <TextInput style={styles.input} placeholder="E.g. Google IT Support, 2023" value={form.certifications} onChangeText={v => handleChange('certifications', v)} />
        <Text style={styles.sectionTitle}>Hobbies</Text>
        <TextInput style={styles.input} placeholder="E.g. Reading, Football" value={form.hobbies} onChangeText={v => handleChange('hobbies', v)} />
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} activeOpacity={0.92}>
          <LinearGradient colors={["#3498DB", "#43cea2"]} style={styles.buttonGradient}>
            <Ionicons name="document-text-outline" size={22} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.generateText}>Generate CV</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#e0f7fa',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3498DB',
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    color: '#222f3e',
  },
  generateButton: {
    marginTop: 30,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
  },
  generateText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});
