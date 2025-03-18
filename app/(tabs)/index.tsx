import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useNotesStore } from "../../store/notes";
import { useEffect, useState } from "react";
import { NotesScreen as CustomNotesScreen } from "../../components/NotesScreen";

export default function NotesScreen() {
  const { fetchNotes } = useNotesStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotes = async () => {
      await fetchNotes();
      setLoading(false);
    };
    loadNotes();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // We're using the CustomNotesScreen component that already includes the FAB
  return <CustomNotesScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});
