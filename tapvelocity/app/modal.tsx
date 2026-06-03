import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, ActivityIndicator, Modal, View } from 'react-native';
import { useRouter } from 'expo-router';
import { gql, useMutation } from '@apollo/client';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUserStore } from '@/stores/user-store';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useServerStore } from '@/stores/server-store';
import { discoverLocalServer, probeServer } from '@/utils/serverDiscovery';

const REGISTER_USER = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      id
      username
    }
  }
`;

const LOGIN_USER = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      id
      username
    }
  }
`;

export default function UsernameModal() {
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const setUser = useUserStore((s) => s.setUser);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Server configuration states
  const serverUrl = useServerStore((s) => s.serverUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [discoveryStatus, setDiscoveryStatus] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [registerUser, { loading: registerLoading }] = useMutation(REGISTER_USER);
  const [loginUser, { loading: loginLoading }] = useMutation(LOGIN_USER);
  const loading = registerLoading || loginLoading;

  const handleSubmit = async () => {
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) return;
    setErrorMsg(null);

    if (mode === 'register') {
      if (trimmedPass.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (trimmedPass !== confirmPassword.trim()) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    try {
      if (mode === 'register') {
        const { data } = await registerUser({
          variables: { username: trimmedUser, password: trimmedPass },
        });
        if (data?.register) {
          setUser(data.register.id, data.register.username);
          router.back();
        }
      } else {
        const { data } = await loginUser({
          variables: { username: trimmedUser, password: trimmedPass },
        });
        if (data?.login) {
          setUser(data.login.id, data.login.username);
          router.back();
        }
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Authentication failed';
      if (msg.includes('already taken') || msg.includes('Unique constraint')) {
        setErrorMsg('That username is already taken.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const onSaveSettings = async () => {
    setDiscoveryStatus(null);
    setIsSaving(true);
    setDiscoveryStatus('Verifying connection...');
    try {
      const validUrl = await probeServer(inputUrl);
      if (validUrl) {
        useServerStore.getState().setServerUrl(validUrl);
        setInputUrl(validUrl);
        setDiscoveryStatus('✅ Connected!');
        setTimeout(() => setShowSettings(false), 800);
      } else {
        setDiscoveryStatus('❌ Server not found. Check port/IP.');
      }
    } catch {
      setDiscoveryStatus('❌ Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const onAutoDiscover = async () => {
    try {
      setIsDiscovering(true);
      setDiscoveryStatus('Scanning network (2,286 IPs)...');
      const discovered = await discoverLocalServer((status) => setDiscoveryStatus(status));
      if (discovered) {
        setInputUrl(discovered);
        setDiscoveryStatus('✅ Found server!');
      } else {
        setDiscoveryStatus('❌ Not found (check laptop server & Wi-Fi)');
      }
    } catch {
      setDiscoveryStatus('❌ Error during network scan');
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Server Configuration Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: border }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Server Configuration
            </ThemedText>
            <ThemedText style={[styles.modalLabel, { color: mutedText }]}>
              Backend GraphQL URL:
            </ThemedText>
            
            <TextInput
              style={[styles.modalInput, { borderColor: border, color: textColor }]}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.X:4000/graphql"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {discoveryStatus ? (
              <ThemedText style={[styles.discoveryText, { color: tint }]}>
                {discoveryStatus}
              </ThemedText>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.discoverBtn, { backgroundColor: `${tint}30`, borderColor: tint }]}
                onPress={onAutoDiscover}
                disabled={isDiscovering || isSaving}
              >
                <ThemedText style={[styles.discoverTextBtn, { color: tint }]}>
                  {isDiscovering ? 'Scanning...' : 'Auto-Discover Server'}
                </ThemedText>
              </Pressable>
              
              <View style={styles.rowActions}>
                <Pressable
                  style={[styles.modalButton, styles.cancelBtn, { borderColor: border }]}
                  onPress={() => setShowSettings(false)}
                  disabled={isSaving}
                >
                  <ThemedText style={[styles.cancelTextBtn, { color: textColor }]}>Cancel</ThemedText>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.modalButton,
                    styles.saveBtn,
                    { backgroundColor: tint, borderColor: tint },
                    (!inputUrl.trim() || isSaving) && styles.disabled
                  ]}
                  onPress={onSaveSettings}
                  disabled={isSaving || !inputUrl.trim()}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.saveTextBtn}>Save</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab Segment Controller */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => {
            setMode('login');
            setErrorMsg(null);
            setPassword('');
            setConfirmPassword('');
          }}
          style={[styles.tabButton, mode === 'login' && { borderBottomColor: tint }]}
        >
          <ThemedText style={[styles.tabText, mode === 'login' && { color: tint }]}>Log In</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            setMode('register');
            setErrorMsg(null);
            setPassword('');
            setConfirmPassword('');
          }}
          style={[styles.tabButton, mode === 'register' && { borderBottomColor: tint }]}
        >
          <ThemedText style={[styles.tabText, mode === 'register' && { color: tint }]}>Register</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="title" style={styles.title}>
        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: mutedText }]}>
        {mode === 'login'
          ? 'Log in to continue your tapping adventure.'
          : 'Choose a username and password to start playing.'}
      </ThemedText>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        style={[styles.input, { borderColor: tint, color: textColor }]}
        returnKeyType="next"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={32}
        style={[styles.input, { borderColor: tint, color: textColor }]}
        returnKeyType={mode === 'register' ? 'next' : 'done'}
        onSubmitEditing={() => {
          if (mode === 'login') handleSubmit();
        }}
      />

      {mode === 'register' && (
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={32}
          style={[styles.input, { borderColor: tint, color: textColor }]}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
      )}

      {errorMsg && <ThemedText style={styles.error}>{errorMsg}</ThemedText>}

      <Pressable
        onPress={handleSubmit}
        disabled={
          loading ||
          !username.trim() ||
          !password.trim() ||
          (mode === 'register' && !confirmPassword.trim())
        }
        style={[
          styles.submitButton,
          { backgroundColor: tint },
          (loading ||
            !username.trim() ||
            !password.trim() ||
            (mode === 'register' && !confirmPassword.trim())) &&
            styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.submitText}>
            {mode === 'login' ? 'Start Playing' : 'Register & Play'}
          </ThemedText>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setInputUrl(useServerStore.getState().serverUrl);
          setDiscoveryStatus(null);
          setShowSettings(true);
        }}
        style={styles.settingsButton}
      >
        <ThemedText style={[styles.settingsButtonText, { color: tint }]}>
          ⚙️ Configure Server
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'PressStart2P_400Regular',
    marginBottom: 16,
  },
  error: {
    color: '#e53935',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
  settingsButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'PressStart2P_400Regular',
    backgroundColor: 'transparent',
  },
  discoveryText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 4,
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  discoverBtn: {
    flex: 0,
    paddingVertical: 14,
  },
  discoverTextBtn: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelTextBtn: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#fff',
  },
  saveTextBtn: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
