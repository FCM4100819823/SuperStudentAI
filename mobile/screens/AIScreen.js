import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const backendUrl = 'http://172.20.10.4:5000';

const AIScreen = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // { text, sender: 'user' | 'ai' }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${backendUrl}/ai/nlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'AI request failed');
      }
      setMessages(prev => [...prev, { text: data.result[0]?.generated_text || JSON.stringify(data.result), sender: 'ai' }]);
      setInput('');
    } catch (err) {
      setError(err.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <MaterialIcons name="smart-toy" size={28} color="#fff" />
        <Text style={styles.headerTitle}>SuperStudent AI Assistant</Text>
      </View>
      <ScrollView style={styles.chatContainer} contentContainerStyle={{ padding: 16 }}>
        {messages.map((msg, idx) => (
          <View key={idx} style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
        {loading && (
          <View style={styles.aiBubble}><ActivityIndicator color="#4169E1" size="small" /></View>
        )}
      </ScrollView>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || !input.trim()}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4169E1', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  chatContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  messageBubble: { maxWidth: '80%', borderRadius: 18, padding: 12, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#4169E1' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#e1eaff' },
  messageText: { color: '#222', fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, fontSize: 16, marginRight: 10, height: 44 },
  sendButton: { backgroundColor: '#4169E1', borderRadius: 22, padding: 10 },
  errorText: { color: '#FF6347', textAlign: 'center', marginBottom: 8 },
});

export default AIScreen;
