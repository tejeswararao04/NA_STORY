import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getValidation } from "../src/lib/tripsStore";
import { useTripsStore } from "../src/store";
import { setIdentity } from "../src/lib/tripsStore";

export default function Auth() {
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [channel, setChannel] = useState<"email"|"phone">("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const storeSetIdentity = useTripsStore(s => s.setIdentity);

  function onSend() {
    const v = value.trim();
    const { getEmailError, getPhoneError } = getValidation();
    const msg = channel === "email" ? getEmailError(v) : getPhoneError(v);
    if (msg) { setError(msg); return; }
    setError("");
    // go to OTP with params
    router.push({ pathname: "/otp", params: { identity: v, channel, mode } });
    // also store pending for direct access
    setIdentity(v);
  }

  return (
    <SafeAreaView style={[styles.safe, isWide && { alignItems:"center"}]}>
      <ScrollView contentContainerStyle={[styles.scroll, isWide && { maxWidth:520, width:"100%" }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>N</Text></View>
          <Text style={styles.brandName}>NASTORY</Text>
          <View style={styles.pill}><Text style={styles.pillText}>Prototype</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>{mode==="signin" ? "Welcome back" : "Create account"}</Text>
          <Text style={styles.muted}>{mode==="signin" ? "Sign in with a one-time code." : "Sign up - we'll verify you with a one-time code."}</Text>

          <View style={styles.seg}>
            <Pressable onPress={()=>setMode("signin")} style={[styles.segBtn, mode==="signin" && styles.segActive]}><Text style={[styles.segText, mode==="signin" && styles.segActiveText]}>Sign in</Text></Pressable>
            <Pressable onPress={()=>setMode("signup")} style={[styles.segBtn, mode==="signup" && styles.segActive]}><Text style={[styles.segText, mode==="signup" && styles.segActiveText]}>Sign up</Text></Pressable>
          </View>

          <View style={styles.subseg}>
            <Pressable onPress={()=>{ setChannel("email"); setValue(""); setError(""); }} style={[styles.subsegBtn, channel==="email" && styles.subsegActive]}><Text style={[styles.subsegText, channel==="email" && styles.subsegActiveText]}>Email</Text></Pressable>
            <Pressable onPress={()=>{ setChannel("phone"); setValue(""); setError(""); }} style={[styles.subsegBtn, channel==="phone" && styles.subsegActive]}><Text style={[styles.subsegText, channel==="phone" && styles.subsegActiveText]}>Phone</Text></Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{channel==="email" ? "Email address" : "Phone number"}</Text>
            <TextInput
              style={styles.input}
              placeholder={channel==="email" ? "name@gmail.com" : "98765 43210"}
              placeholderTextColor="#8f859e"
              value={value}
              onChangeText={(t)=>{
                if(channel==="phone") t = t.replace(/[a-zA-Z]/g,"");
                setValue(t); setError("");
              }}
              keyboardType={channel==="email" ? "email-address" : "number-pad"}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>{channel==="email" ? "Use a valid email like name@gmail.com - we'll send a 6-digit OTP." : "Enter exactly 10 digits (e.g. 9876543210) - we'll send a 6-digit OTP."}</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>

          <Pressable onPress={onSend} style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>Send OTP</Text></Pressable>
          <Text style={styles.legal}>By continuing you agree to our Terms - Testing flow, no real OTP sent.</Text>

          <View style={styles.demoBox}>
            <Text style={styles.demoText}><Text style={{fontWeight:"800"}}>Rules:</Text> Email must be like name@gmail.com - Phone must be exactly 10 digits (e.g. 9876543210). Mock OTP is 123456.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:"#14102B", padding:14 },
  scroll:{ paddingBottom:28 },
  brandRow:{ flexDirection:"row", alignItems:"center", gap:10, paddingTop:8, paddingBottom:12 },
  brandMark:{ width:34, height:34, borderRadius:17, borderWidth:2, borderColor:"#E8B44A", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,255,255,0.06)" },
  brandMarkText:{ color:"#F6D696", fontWeight:"800", fontFamily:"Georgia" as any },
  brandName:{ color:"#fff", fontWeight:"800", letterSpacing:3, fontSize:13, fontFamily:"Georgia" as any },
  pill:{ marginLeft:"auto", borderWidth:1, borderColor:"#3a2d6b", borderRadius:999, paddingHorizontal:10, paddingVertical:5, backgroundColor:"rgba(255,255,255,0.06)" },
  pillText:{ color:"#c6bcd0", fontSize:11 },
  card:{ backgroundColor:"#1b1440", borderWidth:1, borderColor:"#3a2d6b", borderRadius:18, padding:18 },
  h2:{ color:"#fff", fontSize:22, fontWeight:"700", fontFamily:"Georgia" as any },
  muted:{ color:"#c6bcd0", marginTop:6, fontSize:13 },
  seg:{ flexDirection:"row", gap:8, backgroundColor:"rgba(255,255,255,0.06)", padding:6, borderRadius:14, marginTop:14 },
  segBtn:{ flex:1, padding:10, borderRadius:10, alignItems:"center" },
  segActive:{ backgroundColor:"#fff" },
  segText:{ color:"#c6bcd0", fontWeight:"700" },
  segActiveText:{ color:"#1b1440" },
  subseg:{ flexDirection:"row", gap:8, marginTop:12 },
  subsegBtn:{ flex:1, padding:10, borderRadius:999, borderWidth:1, borderColor:"#3a2d6b", backgroundColor:"rgba(255,255,255,0.06)", alignItems:"center" },
  subsegActive:{ backgroundColor:"#E8B44A", borderColor:"#E8B44A" },
  subsegText:{ color:"#fff", fontWeight:"600" },
  subsegActiveText:{ color:"#1b1440" },
  field:{ marginTop:14, gap:8 },
  label:{ color:"#c6bcd0", fontSize:12, fontWeight:"600" },
  input:{ borderWidth:1, borderColor:"#3a2d6b", backgroundColor:"rgba(255,255,255,0.06)", color:"#fff", borderRadius:12, padding:14, fontSize:15 },
  hint:{ color:"#c6bcd0", fontSize:11, opacity:0.9 },
  error:{ color:"#ffb4c0", fontSize:12, minHeight:16 },
  btnPrimary:{ backgroundColor:"#E8B44A", borderRadius:12, padding:14, alignItems:"center", marginTop:4 },
  btnPrimaryText:{ color:"#1b1440", fontWeight:"800", fontSize:15 },
  legal:{ color:"#c6bcd0", fontSize:11, marginTop:8 },
  demoBox:{ marginTop:14, padding:12, borderRadius:12, borderWidth:1, borderColor:"rgba(232,180,74,0.45)", backgroundColor:"rgba(232,180,74,0.08)" },
  demoText:{ color:"#f5f0ea", fontSize:12 },
});
