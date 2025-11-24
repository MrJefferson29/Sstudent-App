import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { liveSessionsAPI } from './utils/api';
import { AuthContext } from './Contexts/AuthContext';

const statusColors = {
  live: '#16A34A',
  scheduled: '#2563EB',
  ended: '#9CA3AF',
};

const formatDate = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString();
};

const LiveSessionsScreen = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const response = await liveSessionsAPI.getAll({ active: 'true' });
      if (response.success) {
        setSessions(response.data || []);
      } else {
        setError(response.message || 'Failed to load live sessions');
      }
    } catch (err) {
      console.error('Fetch live sessions error:', err);
      setError(err.response?.data?.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const handleJoin = (session) => {
    router.push({
      pathname: '/live',
      params: {
        sessionId: session._id,
      },
    });
  };

  const renderSession = ({ item }) => {
    const isJoinable = item.status === 'live';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.title}>{item.courseTitle}</Text>
            <Text style={styles.subTitle}>{item.courseCode}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#9CA3AF' }]}>
            <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.detailText}>Lecturer: {item.lecturer}</Text>
        <Text style={styles.detailText}>Scheduled: {formatDate(item.scheduledAt)}</Text>
        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.joinButton, !isJoinable && styles.joinButtonDisabled]}
          onPress={() => handleJoin(item)}
          disabled={!isJoinable}
        >
          <Ionicons name="play-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.joinButtonText}>{isJoinable ? 'Join Live' : 'Not Live Yet'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading live sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSessions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="videocam-off-outline" size={60} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No live sessions yet</Text>
        <Text style={styles.emptySubtitle}>
          Live sessions for your department will appear here once scheduled.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Department Live Sessions</Text>
        <Text style={styles.screenSubtitle}>
          {user?.department?.name || 'Assigned department'}
        </Text>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderSession}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  detailText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#1F2937',
    marginVertical: 8,
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#CBD5F5',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2563EB',
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default LiveSessionsScreen;


