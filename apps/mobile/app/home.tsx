import { useState } from "react";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { generateStory } from "../src/lib/storyApi";

export default function Home() {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  }

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await generateStory({ name, prompt });
      setStory(res.story);
      setSource(res.source);
    } catch (e: any) {
      setStory("Failed: " + e.message);
      setSource("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Create your story</Text>
      <Text>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Tejas" />
      <Text>Idea / voice-note transcript</Text>
      <TextInput
        style={[styles.input, styles.multi]}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="A brave kid who finds a talking river..."
        multiline
      />
      <View style={styles.row}>
        <Button title="Take photo" onPress={pickPhoto} />
        <Button title={loading ? "..." : "Generate story"} onPress={onGenerate} disabled={loading} />
      </View>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : null}
      {story ? (
        <View style={styles.card}>
          <Text style={styles.small}>source: {source}</Text>
          <Text>{story}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 10 },
  h1: { fontSize: 22, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  multi: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  photo: { width: "100%", height: 220, borderRadius: 12, marginTop: 12 },
  card: { marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: "#f5f5f5" },
  small: { fontSize: 11, color: "#666", marginBottom: 6 },
});
