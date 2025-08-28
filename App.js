import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

const API_URL = "https://68b09bc33b8db1ae9c047dcd.mockapi.io/messages";

export default function App() {
  const [username, setUsername] = useState(""); // nome do usuário
  const [loggedIn, setLoggedIn] = useState(false); // controla se entrou no chat

  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ====== Funções do Chat ======
  const fetchAll = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`GET falhou: ${res.status}`);
      const data = await res.json();
      const sorted = [...data].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sorted);
    } catch (err) {
      Alert.alert("Erro ao buscar", String(err?.message || err));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) fetchAll();
  }, [fetchAll, loggedIn]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const handleSend = async () => {
    if (!text.trim()) {
      Alert.alert("Validação", "Digite uma mensagem.");
      return;
    }

    const payload = {
      author: username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`POST falhou: ${res.status} ${errText}`);
      }

      setText("");
      await fetchAll();
    } catch (err) {
      Alert.alert("Erro ao enviar", String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.msg,
        item.author === username ? styles.myMsg : styles.otherMsg,
      ]}
    >
      <Text style={styles.msgAuthor}>{item.author}</Text>
      <Text style={styles.msgText}>{item.text}</Text>
      <Text style={styles.msgTime}>
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  // ====== Tela de Login ======
  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Bem-vindo ao Chat</Text>
          <TextInput
            style={styles.inputLogin}
            placeholder="Digite seu nome"
            value={username}
            onChangeText={setUsername}
          />
          <TouchableOpacity
            style={[styles.button, !username && { opacity: 0.6 }]}
            disabled={!username}
            onPress={() => setLoggedIn(true)}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ====== Tela do Chat ======
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Chat API</Text>
          <Text style={styles.subtitle}>Usuário: {username}</Text>

          {loadingList ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(it) => String(it.id)}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <Text style={styles.empty}>Nenhuma mensagem ainda.</Text>
              }
              contentContainerStyle={{ paddingVertical: 12 }}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua mensagem..."
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity
              disabled={submitting}
              style={[styles.button, submitting && { opacity: 0.6 }]}
              onPress={handleSend}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ====== Estilos ======
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  container: { flex: 1, padding: 16 },
  loginContainer: { flex: 1, justifyContent: "center", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "white", marginBottom: 12 },
  subtitle: { color: "#cbd5e1", fontSize: 12, marginBottom: 12 },
  empty: { color: "#cbd5e1", textAlign: "center", marginTop: 12 },

  inputLogin: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 6,
    gap: 6,
  },
  input: { flex: 1, padding: 10, fontSize: 16 },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonText: { color: "white", fontWeight: "700" },

  msg: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: "80%",
  },
  myMsg: { alignSelf: "flex-end", backgroundColor: "#4f46e5" },
  otherMsg: { alignSelf: "flex-start", backgroundColor: "#334155" },
  msgAuthor: { fontSize: 12, color: "#cbd5e1", marginBottom: 2 },
  msgText: { color: "white", fontSize: 16 },
  msgTime: { fontSize: 10, color: "#94a3b8", marginTop: 2, textAlign: "right" },
});
