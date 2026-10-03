import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, useWindowDimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTripsStore } from "../src/store";

type Block = { image: string | null; context: string };

export default function Editor() {
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const store = useTripsStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Family");
  const [blocks, setBlocks] = useState<Block[]>([{ image:null, context:"" }]);
  const [error, setError] = useState("");
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);

  const chars = title.length + blocks.reduce((s,b)=> s + (b.context||"").length, 0);
  const dateStr = new Date().toLocaleDateString("en-US") + ", " + new Date().toLocaleTimeString("en-US",{hour:"2-digit", minute:"2-digit"});

  function updateBlock(idx: number, patch: Partial<Block>) {
    setBlocks(prev => prev.map((b,i)=> i===idx ? {...b, ...patch} : b));
  }

  async function pickImage(idx: number, source: "gallery"|"camera") {
    const perm = source==="camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed"); return; }
    const res = source==="camera"
      ? await ImagePicker.launchCameraAsync({ quality:0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality:0.7 });
    if (!res.canceled) updateBlock(idx, { image: res.assets[0].uri });
  }

  function addBlock() {
    setBlocks(prev=> [...prev, { image:null, context:"" }]);
  }

  function save() {
    if (!title.trim()) { setError("Enter title (e.g. South India Trip)"); return; }
    if (title.trim().length < 2) { setError("Title too short"); return; }
    if (!blocks.some(b=> b.context.trim() || b.image)) { setError("Add at least one photo or context"); return; }
    setError("");
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US",{month:"long", day:"numeric"});
    const firstCtx = blocks.find(b=> b.context.trim())?.context || "";
    const preview = firstCtx ? firstCtx.slice(0,80) : (blocks[0].image ? "Photo trip" : "No note yet");
    store.addTrip({
      id: String(Date.now()),
      title: title.trim(),
      preview,
      category,
      dateLabel,
      created: now.toISOString(),
      modified: now.toISOString(),
      blocks: blocks.map(b=> ({ image:b.image, context:b.context })),
    });
    router.replace("/trips");
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={[styles.headerWrap, isWide && { alignItems:"center"}]} edges={["top"]}>
        <View style={[styles.header, isWide && { maxWidth:520, width:"100%" }]}>
          <Pressable onPress={()=> router.back()} style={styles.iconBtn}><Text style={{color:"#fff", fontSize:20}}>‹</Text></Pressable>
          <View style={{flexDirection:"row", gap:6}}>
            <Pressable onPress={()=> Alert.alert("Coming soon","Undo")} style={styles.iconBtn}><Text style={{color:"#9a9a9a"}}>↩</Text></Pressable>
            <Pressable onPress={()=> Alert.alert("Coming soon","Redo")} style={styles.iconBtn}><Text style={{color:"#9a9a9a"}}>↪</Text></Pressable>
            <Pressable onPress={save} style={styles.iconBtn}><Text style={{color:"#ffc400", fontWeight:"800"}}>✓</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={[styles.body, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#555" style={styles.titleInput} maxLength={60} />
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{dateStr} | {chars} characters | </Text>
          <View style={styles.catWrap}>
            <Text style={styles.catLabel}>{category} ▾</Text>
          </View>
          <Pressable onPress={()=>{
            // simple cycle for prototype: Family -> Frnds -> Partner -> Uncategorized
            const opts = ["Family","Frnds","Partner","Uncategorized", ...store.categories.filter(c=>!["Family","Frnds","Partner","Uncategorized"].includes(c))];
            const idx = opts.indexOf(category);
            setCategory(opts[(idx+1)%opts.length]);
          }} style={styles.catBtn}><Text style={{color:"#aaa", fontSize:11}}>Change</Text></Pressable>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}

        {blocks.map((b, idx)=>(
          <View key={idx} style={styles.block}>
            <Pressable onPress={()=>{
              setPhotoIdx(idx);
              Alert.alert("Add photo","Choose source", [
                { text:"Gallery", onPress:()=> pickImage(idx,"gallery") },
                { text:"Camera", onPress:()=> pickImage(idx,"camera") },
                { text:"Cancel", style:"cancel" },
              ]);
            }} style={[styles.blockPhoto, b.image && styles.blockPhotoHas]}>
              {b.image ? <Image source={{uri:b.image}} style={styles.photoImg} /> : <View style={styles.placeholder}><Text style={styles.placeholderText}>Add photo</Text><Text style={styles.placeholderSub}>Gallery / Camera</Text></View>}
              <View style={styles.photoOverlay}><Text style={styles.photoOverlayText}>{b.image ? "Change" : "Choose"}</Text></View>
            </Pressable>
            <View style={styles.blockContext}>
              <TextInput
                value={b.context}
                onChangeText={(t)=> updateBlock(idx,{context:t})}
                placeholder="What happened here? Write context..."
                placeholderTextColor="#666"
                multiline
                style={styles.contextInput}
              />
            </View>
            <Pressable onPress={()=>{
              if (blocks.length===1) { Alert.alert("At least one block"); return; }
              setBlocks(prev=> prev.filter((_,i)=> i!==idx));
            }} style={styles.deleteBtn}><Text style={{color:"#fff", fontSize:12}}>✕</Text></Pressable>
          </View>
        ))}

        <Pressable onPress={addBlock} style={styles.addBlockBtn}><Text style={{color:"#aaa", fontWeight:"600"}}>+ Add photo + context</Text></Pressable>
        <Text style={styles.hint}>Tip: photo and context sit side-by-side. Tap photo for Gallery / Camera.</Text>
      </ScrollView>

      <View style={[styles.toolbar, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
        {[
          ["AI","AI"], ["▦","Sections"], ["Aa","Text"], ["≡","List"], ["☑","Todo"]
        ].map(([icon])=>(
          <Pressable key={icon} onPress={()=> Alert.alert("Coming soon")} style={styles.toolbarBtn}><Text style={{color:"#9a9a9a"}}>{icon}</Text></Pressable>
        ))}
        <Pressable onPress={addBlock} style={styles.toolbarBtn}><Text style={{color:"#9a9a9a"}}>🖼</Text></Pressable>
        <Pressable onPress={addBlock} style={[styles.toolbarBtn, {backgroundColor:"#1a1a1a"}]}><Text style={{color:"#ffc400"}}>＋</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:"#000" },
  headerWrap:{ backgroundColor:"#000", borderBottomWidth:1, borderBottomColor:"#1a1a1a" },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:14, paddingVertical:10 },
  iconBtn:{ width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center" },
  body:{ padding:14, paddingBottom:24 },
  titleInput:{ color:"#fff", fontSize:28, fontWeight:"700", paddingVertical:8 },
  metaRow:{ flexDirection:"row", alignItems:"center", flexWrap:"wrap", gap:6, paddingBottom:12, borderBottomWidth:1, borderBottomColor:"#1a1a1a", marginBottom:14 },
  metaText:{ color:"#888", fontSize:12 },
  catWrap:{ flexDirection:"row", alignItems:"center" },
  catLabel:{ color:"#aaa", fontSize:12 },
  catBtn:{ paddingHorizontal:8, paddingVertical:2, borderWidth:1, borderColor:"#222", borderRadius:8, backgroundColor:"#111", marginLeft:4 },
  error:{ color:"#ffb4c0", fontSize:12, marginBottom:8 },
  block:{ flexDirection:"row", gap:10, backgroundColor:"#111", borderWidth:1, borderColor:"#222", borderRadius:14, padding:10, position:"relative" },
  blockPhoto:{ width:122, height:122, borderRadius:10, overflow:"hidden", backgroundColor:"#1a1a1a", borderWidth:1, borderStyle:"dashed", borderColor:"#333", alignItems:"center", justifyContent:"center" },
  blockPhotoHas:{ borderStyle:"solid", backgroundColor:"#000" },
  photoImg:{ width:"100%", height:"100%" },
  placeholder:{ alignItems:"center", gap:4 },
  placeholderText:{ color:"#999", fontSize:12 },
  placeholderSub:{ color:"#777", fontSize:10 },
  photoOverlay:{ position:"absolute", inset:0, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center", opacity:0 } as any,
  photoOverlayText:{ color:"#fff", fontSize:11, backgroundColor:"rgba(0,0,0,0.6)", paddingHorizontal:8, paddingVertical:4, borderRadius:999 },
  blockContext:{ flex:1, minWidth:0 },
  contextInput:{ flex:1, minHeight:122, backgroundColor:"#0f0f0f", borderWidth:1, borderColor:"#222", borderRadius:10, color:"#e8e8e8", padding:10, textAlignVertical:"top" },
  deleteBtn:{ position:"absolute", top:6, right:6, width:26, height:26, borderRadius:13, backgroundColor:"rgba(0,0,0,0.6)", borderWidth:1, borderColor:"#333", alignItems:"center", justifyContent:"center" },
  addBlockBtn:{ marginTop:10, padding:14, borderRadius:14, borderWidth:1, borderStyle:"dashed", borderColor:"#333", backgroundColor:"#0f0f0f", alignItems:"center" },
  hint:{ color:"#777", fontSize:11, marginTop:10, textAlign:"center" },
  toolbar:{ flexDirection:"row", alignItems:"center", justifyContent:"space-around", paddingVertical:8, borderTopWidth:1, borderTopColor:"#222", backgroundColor:"#0f0f0f" },
  toolbarBtn:{ flex:1, height:38, alignItems:"center", justifyContent:"center", borderRadius:8 },
});
