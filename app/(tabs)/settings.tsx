import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="moon-outline" size={22} color="#007AFF" />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch value={false} onValueChange={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Data</Text>
        <Pressable style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="cloud-upload-outline" size={22} color="#007AFF" />
            <Text style={styles.settingLabel}>Backup Notes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </Pressable>
        <Pressable style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="cloud-download-outline" size={22} color="#007AFF" />
            <Text style={styles.settingLabel}>Restore Notes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>About</Text>
        <Pressable style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
            <Text style={styles.settingLabel}>Version</Text>
          </View>
          <Text style={styles.versionText}>1.0.0</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  versionText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});