import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { gql, useMutation } from '@apollo/client';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUserStore } from '@/stores/user-store';
import { useThemeColor } from '@/hooks/use-theme-color';

const CREATE_USER = gql`
  mutation CreateUser($username: String!) {
    createUser(username: $username) {
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
  const setUser = useUserStore((s) => s.setUser);

  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createUser, { loading }] = useMutation(CREATE_USER);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setErrorMsg(null);

    try {
      const { data } = await createUser({ variables: { username: trimmed } });
      if (data?.createUser) {
        setUser(data.createUser.id, data.createUser.username);
        router.back();
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to create user';
      if (msg.includes('Unique constraint')) {
        setErrorMsg('That username is already taken.');
      } else {
        setErrorMsg(msg);
      }
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Choose a Username
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: mutedText }]}>
        This will be shown on the leaderboard.
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
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />

      {errorMsg && <ThemedText style={styles.error}>{errorMsg}</ThemedText>}

      <Pressable
        onPress={handleSubmit}
        disabled={loading || !username.trim()}
        style={[
          styles.submitButton,
          { backgroundColor: tint },
          (loading || !username.trim()) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.submitText}>Start Playing</ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.65,
  },
});
