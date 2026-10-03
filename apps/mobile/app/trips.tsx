import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, TextInput, Modal, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTripsStore, selectFilteredTrips } from "../src/store";
import { tripPreview } from "../src/lib/tripsStore";

export default function Trips() {
  const { width } = useWindowDimensions();
  const isWide = width >= 560;
  const store = useTripsStore();
  const filtered = selectFilteredTrips(store as any);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(()=>{ store.init(); },[]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={[styles.safe, isWide && { alignItems:"center" }]} edges={["top"]}>
        <View style={[styles.header, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
          <Pressable onPress={()=> setDrawerOpen(true)} style={styles.headerLeft}>
            <View style={styles.headerIcon}><Text style={styles.headerIconText}>≡</Text></View>
            <View>
              <Text style={styles.headerTitle}>{store.search ? "Search" : (store.filter==="all" ? "All" : store.filter)} <Text style={styles.headerChevron}>▸</Text></Text>
              <Text style={styles.headerCount}>{filtered.length} trips</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={()=> setSearchOpen(v=>!v)} style={styles.iconBtnDark}><Text style={styles.iconText}>⌕</Text></Pressable>
            <Pressable onPress={()=> setSortOpen(true)} style={styles.iconBtnDark}><Text style={styles.iconText}>≡↕</Text></Pressable>
          </View>
        </View>

        {searchOpen && (
          <View style={[styles.searchBar, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
            <TextInput style={styles.searchInput} placeholder="Search trips (e.g. Bangalore, Family)" placeholderTextColor="#777" value={store.search} onChangeText={store.setSearch} />
            <Pressable onPress={()=> { store.setSearch(""); setSearchOpen(false); }}><Text style={{color:"#F6D696", fontWeight:"700"}}>Clear</Text></Pressable>
          </View>
        )}

        <View style={[styles.listWrap, isWide && { maxWidth:520, width:"100%", alignSelf:"center" }]}>
          <FlatList
            data={filtered}
            keyExtractor={i=>i.id}
            contentContainerStyle={{ paddingBottom:100 }}
            ListEmptyComponent={<View style={styles.empty}><Text style={{color:"#fff", fontWeight:"700"}}>No trips found</Text><Text style={{color:"#888", fontSize:12, marginTop:4}}>Try another folder or search</Text></View>}
            renderItem={({item})=>(
              <Pressable onPress={()=> router.push({ pathname:"/detail", params:{ id:item.id } })} style={styles.item}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text numberOfLines={1} style={styles.itemPreview}>{tripPreview(item)}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.datePill}><Text style={styles.dateText}>{item.dateLabel}</Text></View>
                  <View style={styles.catPill}><Text style={styles.catText}>{item.category}</Text></View>
                </View>
              </Pressable>
            )}
          />
        </View>
      </SafeAreaView>

      <Pressable onPress={()=> router.push("/editor")} style={[styles.fab, isWide && { right: width/2 - 260 }]}><Text style={styles.fabText}>+</Text></Pressable>

      <View style={[styles.bottomNav, isWide && { maxWidth:520, width:"100%", alignSelf:"center", left: isWide ? (width - 520)/2 : 0 }]}>
        <Pressable style={styles.bottomItem}><Text style={[styles.bottomIcon, {color:"#ffc400"}]}>◧</Text><Text style={[styles.bottomLabel, {color:"#ffc400"}]}>Trips</Text></Pressable>
        <Pressable onPress={()=> router.push("/me")} style={styles.bottomItem}><Text style={styles.bottomIcon}>●</Text><Text style={styles.bottomLabel}>Me</Text></Pressable>
      </View>

      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={()=> setDrawerOpen(false)}>
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={()=> setDrawerOpen(false)} />
          <View style={styles.drawer}>
            <View style={styles.drawerHead}>
              <Text style={styles.drawerTitle}>Trips</Text>
              <Pressable onPress={()=> setDrawerOpen(false)} style={styles.iconBtnDark}><Text style={styles.iconText}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding:12 }}>
              <Pressable onPress={()=> { store.setFilter("all"); setDrawerOpen(false); }} style={[styles.folderRow, store.filter==="all" && styles.folderActive]}>
                <View style={[styles.folderIcon, {backgroundColor:"#2a2300"}]}><Text style={{color:"#ffc400", fontWeight:"800"}}>◧</Text></View>
                <Text style={styles.folderName}>All</Text>
                <Text style={styles.folderCount}>{store.trips.length}</Text>
                <Text style={{color:"#666"}}>›</Text>
              </Pressable>
              <Pressable onPress={()=> { store.setFilter("Uncategorized"); setDrawerOpen(false); }} style={[styles.folderRow, store.filter==="Uncategorized" && styles.folderActive]}>
                <View style={[styles.folderIcon, {backgroundColor:"#0f2a3a"}]}><Text style={{color:"#5ab0ff", fontWeight:"800"}}>?</Text></View>
                <Text style={styles.folderName}>Uncategorized</Text>
                <Text style={styles.folderCount}>{store.trips.filter(t=>t.category==="Uncategorized").length}</Text>
                <Text style={{color:"#666"}}>›</Text>
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.labelRow}>
                <Text style={styles.label}>My folders</Text>
                <Pressable onPress={()=> setShowAddCat(v=>!v)} style={styles.smallBtn}><Text style={{color:"#fff"}}>＋</Text></Pressable>
              </View>
              {store.categories.map(cat=>{
                const count = store.trips.filter(t=>t.category===cat).length;
                return (
                  <Pressable key={cat} onPress={()=> { store.setFilter(cat); setDrawerOpen(false); }} style={[styles.folderRow, store.filter===cat && styles.folderActive]}>
                    <View style={[styles.folderIcon, {backgroundColor:"#1f1f1f"}]}><Text style={{color:"#ffc400"}}>▭</Text></View>
                    <Text style={styles.folderName}>{cat}</Text>
                    <Text style={styles.folderCount}>{count}</Text>
                    <Text style={{color:"#666"}}>›</Text>
                  </Pressable>
                );
              })}
              {showAddCat && (
                <View style={{ gap:8, marginTop:10 }}>
                  <TextInput style={styles.input} placeholder="Folder name (e.g. Solo)" placeholderTextColor="#777" value={newCat} onChangeText={setNewCat} maxLength={20} />
                  <View style={{ flexDirection:"row", gap:8 }}>
                    <Pressable onPress={()=>{
                      const r = store.addCategory(newCat);
                      if(!r.ok) return;
                      setNewCat(""); setShowAddCat(false);
                    }} style={[styles.btnPrimary, {flex:1}]}><Text style={styles.btnPrimaryText}>Add</Text></Pressable>
                    <Pressable onPress={()=> setShowAddCat(false)} style={[styles.btnGhost, {flex:1}]}><Text style={{color:"#fff", fontWeight:"700", textAlign:"center"}}>Cancel</Text></Pressable>
                  </View>
                </View>
              )}
              <Text style={{ color:"#888", fontSize:11, marginTop:8 }}>Categories: Family, Frnds, Partner — add your own.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={sortOpen} transparent animationType="slide" onRequestClose={()=> setSortOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={()=> setSortOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Sort trips</Text>
          {[
            ["modified_desc","By modified (newest first)"],
            ["modified_asc","By modified (oldest first)"],
            ["created_desc","By created (newest first)"],
            ["created_asc","By created (oldest first)"],
          ].map(([val,label])=>(
            <Pressable key={val} onPress={()=> { store.setSort(val as any); setSortOpen(false); }} style={styles.sheetOption}>
              <Text style={{color:"#fff"}}>{label}</Text>
              <View style={[styles.radio, store.sort===val && {borderColor:"#4a8cff"}]}>{store.sort===val && <View style={styles.radioDot}/>}</View>
            </Pressable>
          ))}
          <Pressable onPress={()=> setSortOpen(false)} style={styles.sheetCancel}><Text style={{color:"#ffc400", fontWeight:"800", textAlign:"center", fontSize:16}}>Cancel</Text></Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ flex:1, backgroundColor:"#000" },
  safe:{ flex:1, backgroundColor:"#000" },
  header:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:14, paddingVertical:10, borderBottomWidth:1, borderBottomColor:"#1a1a1a", backgroundColor:"#000" },
  headerLeft:{ flexDirection:"row", alignItems:"center", gap:10 },
  headerIcon:{ width:44, height:44, borderRadius:12, backgroundColor:"#1a1a1a", alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:"#222" },
  headerIconText:{ color:"#f6d696", fontWeight:"800", fontSize:18 },
  headerTitle:{ color:"#fff", fontSize:18, fontWeight:"700" },
  headerChevron:{ fontSize:12, color:"#999" },
  headerCount:{ color:"#9a9a9a", fontSize:12 },
  headerActions:{ flexDirection:"row", gap:8 },
  iconBtnDark:{ width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center" },
  iconText:{ color:"#fff", fontSize:18 },
  searchBar:{ flexDirection:"row", gap:8, alignItems:"center", padding:10, borderBottomWidth:1, borderBottomColor:"#1a1a1a", backgroundColor:"#000" },
  searchInput:{ flex:1, padding:11, borderRadius:10, borderWidth:1, borderColor:"#222", backgroundColor:"#111", color:"#fff" },
  listWrap:{ flex:1, backgroundColor:"#000" },
  item:{ padding:16, borderBottomWidth:1, borderBottomColor:"#1a1a1a" },
  itemTitle:{ color:"#fff", fontSize:19, fontWeight:"700" },
  itemPreview:{ color:"#9a9a9a", fontSize:14, marginTop:4 },
  metaRow:{ flexDirection:"row", gap:8, marginTop:8, flexWrap:"wrap" },
  datePill:{ backgroundColor:"#1a1a1a", borderWidth:1, borderColor:"#222", paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  dateText:{ color:"#aaa", fontSize:11 },
  catPill:{ backgroundColor:"#1f1a0a", borderWidth:1, borderColor:"#332a0a", paddingHorizontal:8, paddingVertical:3, borderRadius:999 },
  catText:{ color:"#f6d696", fontSize:11 },
  empty:{ padding:40, alignItems:"center" },
  fab:{ position:"absolute", right:18, bottom:86, width:62, height:62, borderRadius:31, backgroundColor:"#ffc400", alignItems:"center", justifyContent:"center", elevation:6 },
  fabText:{ color:"#000", fontSize:34, fontWeight:"300", marginTop:-2 },
  bottomNav:{ position:"absolute", left:0, right:0, bottom:0, flexDirection:"row", backgroundColor:"#0a0a0a", borderTopWidth:1, borderTopColor:"#1a1a1a", paddingVertical:8 },
  bottomItem:{ flex:1, alignItems:"center", gap:4 },
  bottomIcon:{ fontSize:20, color:"#777" },
  bottomLabel:{ fontSize:11, color:"#777", fontWeight:"600" },
  drawerOverlay:{ flex:1, flexDirection:"row", backgroundColor:"rgba(0,0,0,0.55)" },
  drawerBackdrop:{ flex:1 },
  drawer:{ width:"78%", maxWidth:320, backgroundColor:"#0f0f0f", borderRightWidth:1, borderRightColor:"#1a1a1a", paddingTop:14 },
  drawerHead:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:16, paddingBottom:12, borderBottomWidth:1, borderBottomColor:"#1a1a1a" },
  drawerTitle:{ color:"#fff", fontSize:18, fontWeight:"700" },
  folderRow:{ flexDirection:"row", alignItems:"center", gap:10, padding:12, borderRadius:14, backgroundColor:"#1a1a1a", marginBottom:8, borderWidth:1, borderColor:"transparent" },
  folderActive:{ backgroundColor:"#2a2300", borderColor:"#3a2f00" },
  folderIcon:{ width:34, height:34, borderRadius:8, alignItems:"center", justifyContent:"center" },
  folderName:{ flex:1, color:"#fff", fontWeight:"600" },
  folderCount:{ color:"#999", fontSize:13 },
  divider:{ height:1, backgroundColor:"#1a1a1a", marginVertical:6 },
  labelRow:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:4, marginBottom:10 },
  label:{ color:"#aaa", fontWeight:"600" },
  smallBtn:{ width:30, height:30, borderRadius:8, alignItems:"center", justifyContent:"center", backgroundColor:"#1a1a1a" },
  input:{ borderWidth:1, borderColor:"#333", backgroundColor:"#1a1a1a", color:"#fff", borderRadius:12, padding:12 },
  btnPrimary:{ backgroundColor:"#ffc400", borderRadius:12, padding:12, alignItems:"center" },
  btnPrimaryText:{ color:"#1b1440", fontWeight:"800" },
  btnGhost:{ backgroundColor:"#222", borderRadius:12, padding:12, borderWidth:1, borderColor:"#333", alignItems:"center" },
  sheetOverlay:{ flex:1 },
  sheet:{ backgroundColor:"#1a1a1a", borderTopLeftRadius:28, borderTopRightRadius:28, paddingTop:18, borderWidth:1, borderColor:"#222" },
  sheetTitle:{ textAlign:"center", color:"#fff", fontSize:18, fontWeight:"700", marginBottom:14 },
  sheetOption:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:16, borderTopWidth:1, borderTopColor:"#222" },
  radio:{ width:22, height:22, borderRadius:11, borderWidth:2, borderColor:"#555", alignItems:"center", justifyContent:"center" },
  radioDot:{ width:12, height:12, borderRadius:6, backgroundColor:"#4a8cff" },
  sheetCancel:{ padding:16, borderTopWidth:1, borderTopColor:"#222", alignItems:"center" },
});
