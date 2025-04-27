import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TaskList from './components/TaskList';

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <TaskList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App; 