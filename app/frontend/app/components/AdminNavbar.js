import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AdminNavbar = ({
  title = 'Admin Panel',
  subtitle = 'Management Console',
  onMenuPress,
  onSearch,
  notificationsCount = 0,
  userName = 'Admin',
  userRole = 'Superuser',
  avatarUri,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearchToggle = () => setShowSearch((v) => !v);
  const handleProfileToggle = () => setShowProfileMenu((v) => !v);
  const handleQueryChange = (text) => {
    setQuery(text);
    if (onSearch) onSearch(text);
  };

  return (
    <LinearGradient colors={[theme.primary, '#2563eb']} style={styles.navbar}>
      {/* Left: menu */}
      <View style={styles.left}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Center: brand */}
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Right: actions */}
      <View style={styles.right}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleSearchToggle}>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.notificationWrapper}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          {notificationsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationsCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={handleProfileToggle}>
          <Image
            source={{
              uri:
                avatarUri ||
                'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* Search input overlay */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search courses, users, or content"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={handleSearchToggle}>
            <Ionicons name="close" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      )}

      {/* Profile dropdown */}
      {showProfileMenu && (
        <View style={styles.profileMenu}>
          <View style={styles.profileHeader}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileRole}>{userRole}</Text>
          </View>
          <View style={styles.profileItems}>
            <TouchableOpacity style={styles.profileItem}>
              <Ionicons name="person-circle-outline" size={18} color="#1f2937" />
              <Text style={styles.profileItemText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileItem}>
              <Ionicons name="grid-outline" size={18} color="#1f2937" />
              <Text style={styles.profileItemText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileItem}>
              <Ionicons name="settings-outline" size={18} color="#1f2937" />
              <Text style={styles.profileItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileItem}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={[styles.profileItemText, { color: '#ef4444' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const theme = {
  primary: '#3b82f6',
};

const styles = StyleSheet.create({
  navbar: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  right: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, marginHorizontal: 2 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#e0f2fe', fontSize: 12, fontWeight: '500' },
  notificationWrapper: { marginHorizontal: 2 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  avatarBtn: { padding: 4, marginLeft: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' },
  searchBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 68,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  profileMenu: {
    position: 'absolute',
    right: 8,
    top: 68,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    padding: 10,
  },
  profileHeader: { marginBottom: 8 },
  profileName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  profileRole: { fontSize: 12, color: '#6b7280' },
  profileItems: {},
  profileItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  profileItemText: { fontSize: 13, color: '#1f2937' },
});

export default AdminNavbar;