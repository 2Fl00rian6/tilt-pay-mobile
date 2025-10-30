import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import * as Haptics from 'expo-haptics'
import { Svg, Path, Circle } from 'react-native-svg'
import { getUsers } from '../api/users'

const IconSearch = ({ size = 20, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
    <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
)

export default function SendTagScreen({ navigation }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(30)).current

  useEffect(() => {
    loadUsers()
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    // Filtrer les users en temps réel selon la recherche
    if (search.trim()) {
      const filtered = users.filter(user => 
        user.tagname?.toLowerCase().includes(search.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [search, users])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getUsers()
      console.log('✅ Users récupérés:', data)
      
      // La réponse est { users: [...] }
      const usersList = data.users || []
      
      setUsers(usersList)
      setFilteredUsers(usersList)
      
    } catch (err) {
      console.error('❌ Erreur chargement users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = async (tagname) => {
    if (!tagname) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.navigate('SendEnterAmount', { tag: tagname })
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  const renderUser = ({ item }) => {
    // Extraire initiales du fullName
    const getInitials = (name) => {
      if (!name) return '?'
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name[0].toUpperCase()
    }
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleSelectUser(item.tagname)}
        activeOpacity={0.7}
      >
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {getInitials(item.fullName)}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.fullName}
            </Text>
            <Text style={styles.userTag}>@{item.tagname}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Send money with tag" onBack={handleBack} />
      
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <IconSearch />
          <TextInput
            style={styles.search}
            placeholder="Search for a friend or merchant"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity onPress={loadUsers} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {search ? `Results (${filteredUsers.length})` : `Users (${users.length})`}
            </Text>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderUser}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {search ? '🔍 No user found' : '👥 No users available'}
                  </Text>
                </View>
              }
            />
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  
  searchContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  search: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  sectionTitle: { 
    marginTop: 32, 
    marginBottom: 16,
    fontSize: 14, 
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  listContent: {
    paddingBottom: 24,
  },
  
  userItem: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  userTag: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 15,
  },
})