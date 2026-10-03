import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTripsStore } from "../src/store";
import { clearIdentity } from "../src/lib/tripsStore";

export default function Me() {
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const store = useTripsStore();
  return (
    <View style={styles.root}>
      <SafeAreaView style={[styles.headerWrap, isWide && { alignItems:"center"}]} edges={["top"]}>
        <View style={[styles.header, isWide && { maxWidth:520, width:"100%" }]}>
          <View>
            <Text style={styles.headerTitle}>Me</Text>
            <Text style={styles.headerCount}>{store.identity || "Not signed in"}</Text>
          </View>
          <Pressable onPress={async ()=>{ await clearIdentity(); store.setIdentity(null); router.replace("/auth"); }}><Text style={{color:"#F6D696", fontWeight:"700"}}>Log out</Text></Pressable>
        </View>
      </SafeAreaView>

      <View style={[styles.body, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
          <Text style={styles.email}>{store.identity || "—"}</Text>
          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statNum}>{store.trips.length}</Text><Text style={styles.statLabel}>trips</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>{store.categories.length}</Text><Text style={styles.statLabel}>folders</Text></View>
          </View>
        </View>
        <View style={[styles.card, {marginTop:14}]}>
          <Text style={{color:"#c6bcd0", fontSize:12, fontWeight:"600"}}>About NASTORY</Text>
          <Text style={{color:"#9a9a9a", fontSize:12, marginTop:6}}>Your moments. Your story. Trips are like notes - Bangalore 2026, Manali 2024, first date etc. Organize by Family / Frnds / Partner.</Text>
        </View>
      </View>

      <View style={[styles.bottomNav, isWide && { maxWidth:520, width:"100%", alignSelf:"center", left: isWide ? (width - 520)/2 : 0 }]}>
        <Pressable onPress={()=> router.replace("/trips")} style={styles.bottomItem}><Text style={styles.bottomIcon}>◧</Text><Text style={styles.bottomLabel}>Trips</Text></Pressable>
        <Pressable style={styles.bottomItem}><Text style={[styles.bottomIcon, {color:"#ffc400"}]}>●</Text><Text style={[styles.bottomLabel, {color:"#ffc400"}]}>Me</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:"#000" },
  headerWrap:{ backgroundColor:"#000", borderBottomWidth:1, borderBottomColor:"#1a1a1a" },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:14, paddingVertical:10 },
  headerTitle:{ color:"#fff", fontSize:18, fontWeight:"700" },
  headerCount:{ color:"#9a9a9a", fontSize:12 },
  body:{ flex:1, padding:16 },
  card:{ backgroundColor:"#111", borderWidth:1, borderColor:"#222", borderRadius:16, padding:16, alignItems:"center" },
  avatar:{ width:64, height:64, borderRadius:32, backgroundColor:"#222", borderWidth:2, borderColor:"#ffc400", alignItems:"center", justifyContent:"center" },
  avatarText:{ color:"#ffc400", fontWeight:"800", fontSize:28, fontFamily:"Georgia" as any },
  email:{ color:"#fff", marginTop:10, fontSize:13 },
  stats:{ flexDirection:"row", gap:12, marginTop:14, width:"100%" },
  stat:{ flex:1, backgroundColor:"#1a1a1a", borderWidth:1, borderColor:"#222", borderRadius:12, padding:12, alignItems:"center", gap:4 },
  statNum:{ color:"#fff", fontSize:18, fontWeight:"700" },
  statLabel:{ color:"#999", fontSize:11 },
  bottomNav:{ position:"absolute", left:0, right:0, bottom:0, flexDirection:"row", backgroundColor:"#0a0a0a", borderTopWidth:1, borderTopColor:"#1a1a1a", paddingVertical:8 },
  bottomItem:{ flex:1, alignItems:"center", gap:4 },
  bottomIcon:{ color:"#777", fontSize:20 },
  bottomLabel:{ color:"#777", fontSize:11, fontWeight:"600" },
});
