import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTripsStore } from "../src/store";
import { setIdentity } from "../src/lib/tripsStore";
// @ts-ignore - TextInput refs type mismatch with React 19
type AnyInput = any;

export default function Otp() {
  const { identity = "", channel = "email" } = useLocalSearchParams<{ identity: string; channel: string; mode: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const [boxes, setBoxes] = useState<string[]>(["","","","","",""]);
  const [error, setError] = useState("");
  const [resendLeft, setResendLeft] = useState(30);
  const inputs = useRef<(AnyInput|null)[]>([]);
  const store = useTripsStore();

  // simple resend countdown
  useState(() => {
    const t = setInterval(()=> setResendLeft(v=> v>0 ? v-1 : 0), 1000);
    return ()=> clearInterval(t);
  });

  function setBox(idx: number, val: string) {
    const clean = val.replace(/\D/g,"").slice(-1);
    const next = [...boxes];
    next[idx] = clean;
    setBoxes(next);
    setError("");
    if (clean && idx < 5) inputs.current[idx+1]?.focus();
  }

  function onVerify() {
    const code = boxes.join("").replace(/\D/g,"");
    if (code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setError("");
    // persist identity and init trips store
    setIdentity(String(identity));
    store.setIdentity(String(identity));
    store.init().finally(()=> router.replace("/trips"));
  }

  const codePreview = String(identity);

  return (
    <SafeAreaView style={[styles.safe, isWide && { alignItems:"center"}]}>
      <View style={[styles.container, isWide && { maxWidth:520, width:"100%" }]}>
        <View style={styles.header}>
          <Pressable onPress={()=> router.back()} style={styles.backBtn}><Text style={{color:"#fff", fontSize:18}}>←</Text></Pressable>
          <Text style={styles.headerTitle}>Verify</Text>
          <View style={{width:36}} />
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Enter OTP</Text>
          <Text style={styles.muted}>We sent a code to {codePreview} - mock OTP is 123456</Text>

          <View style={styles.otpRow}>
            {boxes.map((v,i)=>(
              <TextInput
                key={i}
                ref={(r)=> { inputs.current[i]=r }}
                style={styles.otpInput}
                value={v}
                onChangeText={(t)=> setBox(i,t)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                returnKeyType="next"
                onKeyPress={({nativeEvent})=>{
                  if (nativeEvent.key==="Backspace" && !v && i>0) inputs.current[i-1]?.focus();
                }}
              />
            ))}
          </View>
          <Text style={styles.hint}>Tip: paste a 6-digit code and it fills all boxes together.</Text>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable onPress={onVerify} style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>Verify & continue</Text></Pressable>
          <View style={styles.row}>
            <Text style={styles.mutedSmall}>Resend in {resendLeft}s</Text>
            <Pressable disabled={resendLeft>0} onPress={()=> setResendLeft(30)}><Text style={[styles.link, resendLeft>0 && {opacity:0.45}]}>Resend OTP</Text></Pressable>
            <Pressable onPress={()=> router.back()}><Text style={styles.link}>Edit email / phone</Text></Pressable>
          </View>

          <View style={styles.demoBox}><Text style={styles.demoText}>Hint: try 123456 - also accepts any 6 digits for testing.</Text></View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{ flex:1, backgroundColor:"#14102B", padding:14 },
  container:{ flex:1 },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:6 },
  backBtn:{ width:36, height:36, borderRadius:10, borderWidth:1, borderColor:"#3a2d6b", alignItems:"center", justifyContent:"center", backgroundColor:"rgba(255,255,255,0.06)" },
  headerTitle:{ color:"#fff", fontWeight:"700" },
  card:{ backgroundColor:"#1b1440", borderWidth:1, borderColor:"#3a2d6b", borderRadius:18, padding:18, marginTop:12 },
  h2:{ color:"#fff", fontSize:18, fontWeight:"700" },
  muted:{ color:"#c6bcd0", marginTop:6, fontSize:13 },
  otpRow:{ flexDirection:"row", gap:8, justifyContent:"center", marginTop:14 },
  otpInput:{ width:44, height:52, borderWidth:1, borderColor:"#3a2d6b", backgroundColor:"rgba(255,255,255,0.06)", color:"#fff", borderRadius:12, fontSize:20, fontWeight:"800" },
  hint:{ color:"#c6bcd0", fontSize:11, opacity:0.85, textAlign:"center", marginTop:10 },
  error:{ color:"#ffb4c0", fontSize:12, marginTop:6 },
  btnPrimary:{ backgroundColor:"#E8B44A", borderRadius:12, padding:14, alignItems:"center", marginTop:14 },
  btnPrimaryText:{ color:"#1b1440", fontWeight:"800" },
  row:{ flexDirection:"row", justifyContent:"space-between", marginTop:12, gap:10, flexWrap:"wrap" },
  mutedSmall:{ color:"#c6bcd0", fontSize:12 },
  link:{ color:"#F6D696", fontWeight:"700" },
  demoBox:{ marginTop:14, padding:12, borderRadius:12, borderWidth:1, borderStyle:"dashed", borderColor:"rgba(232,180,74,0.45)", backgroundColor:"rgba(232,180,74,0.08)" },
  demoText:{ color:"#f5f0ea", fontSize:12 },
});
