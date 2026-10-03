import { View, Text, Pressable, StyleSheet, ScrollView, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTripsStore } from "../src/store";
import { tripPreview } from "../src/lib/tripsStore";

export default function Detail() {
  const { id } = useLocalSearchParams<{id:string}>();
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const store = useTripsStore();
  const trip = store.trips.find(t=> t.id === id);

  if (!trip) {
    return <View style={styles.root}><Text style={{color:"#fff", padding:20}}>Trip not found</Text></View>;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={[styles.headerWrap, isWide && { alignItems:"center"}]} edges={["top"]}>
        <View style={[styles.header, isWide && { maxWidth:520, width:"100%" }]}>
          <Pressable onPress={()=> router.back()} style={styles.iconBtn}><Text style={{color:"#fff", fontSize:18}}>←</Text></Pressable>
          <View style={{flex:1, marginLeft:12}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{trip.title}</Text>
            <Text style={styles.headerCount}>{trip.dateLabel} - {trip.category}</Text>
          </View>
          <Pressable onPress={()=>{
            store.removeTrip(trip.id);
            router.replace("/trips");
          }}><Text style={{color:"#ff6b6b", fontWeight:"700"}}>Delete</Text></Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={[styles.body, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
        <View style={styles.card}>
          <View style={styles.catPill}><Text style={styles.catText}>{trip.category}</Text></View>
          <Text style={styles.h1}>{trip.title}</Text>
          <Text style={styles.preview}>{tripPreview(trip)}</Text>
          <View style={{ marginTop:14, borderTopWidth:1, borderTopColor:"#222", paddingTop:14, gap:10 }}>
            {trip.blocks.map((b: any, i: number)=>(
              <View key={i} style={styles.block}>
                <View style={styles.blockPhoto}>
                  {b.image ? <Image source={{uri:b.image}} style={{width:"100%", height:"100%"}} /> : <Text style={{color:"#777", fontSize:11}}>No photo</Text>}
                </View>
                <View style={{flex:1}}>
                  <Text style={{color:"#ddd", fontSize:13}}>{b.context || "No context"}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, isWide && { maxWidth:520, width:"100%", alignSelf:"center", left: isWide ? (width - 520)/2 : 0 }]}>
        <Pressable onPress={()=> router.replace("/trips")} style={styles.bottomItem}><Text style={styles.bottomIcon}>◧</Text><Text style={styles.bottomLabel}>Trips</Text></Pressable>
        <Pressable onPress={()=> router.replace("/me")} style={styles.bottomItem}><Text style={styles.bottomIcon}>●</Text><Text style={styles.bottomLabel}>Me</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:"#000" },
  headerWrap:{ backgroundColor:"#000", borderBottomWidth:1, borderBottomColor:"#1a1a1a" },
  header:{ flexDirection:"row", alignItems:"center", paddingHorizontal:14, paddingVertical:10 },
  iconBtn:{ width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center" },
  headerTitle:{ color:"#fff", fontSize:16, fontWeight:"700" },
  headerCount:{ color:"#9a9a9a", fontSize:12 },
  body:{ padding:16, paddingBottom:90 },
  card:{ backgroundColor:"#111", borderWidth:1, borderColor:"#222", borderRadius:16, padding:16 },
  catPill:{ alignSelf:"flex-start", backgroundColor:"#1f1a0a", borderWidth:1, borderColor:"#332a0a", paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
  catText:{ color:"#ffc400", fontSize:11 },
  h1:{ color:"#fff", fontSize:22, fontWeight:"700", marginTop:8 },
  preview:{ color:"#9a9a9a", marginTop:6, fontSize:13 },
  block:{ flexDirection:"row", gap:10, backgroundColor:"#0f0f0f", borderWidth:1, borderColor:"#1a1a1a", borderRadius:10, padding:8, alignItems:"center" },
  blockPhoto:{ width:110, height:110, borderRadius:8, overflow:"hidden", backgroundColor:"#1a1a1a", alignItems:"center", justifyContent:"center" },
  bottomNav:{ position:"absolute", left:0, right:0, bottom:0, flexDirection:"row", backgroundColor:"#0a0a0a", borderTopWidth:1, borderTopColor:"#1a1a1a", paddingVertical:8 },
  bottomItem:{ flex:1, alignItems:"center", gap:4 },
  bottomIcon:{ color:"#777", fontSize:20 },
  bottomLabel:{ color:"#777", fontSize:11, fontWeight:"600" },
});
