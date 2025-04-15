import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useAuthStore } from '../../store/auth';
import { router, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Please check your email and password');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topHalf}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back,{'\n'}Scholar!</Text>
              <Text style={styles.subtitle}>Enter your email and password to log in</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.rememberForgotContainer}>
                <TouchableOpacity 
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={styles.checkbox}>
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="#4169E1" />
                    )}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/auth/signup" asChild>
                  <TouchableOpacity>
                    <Text style={styles.signupText}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4169E1', // Royal Blue color
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topHalf: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    flex: 0.45,
  },
  header: {
    paddingTop: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 30,
    flex: 0.55,
    paddingTop: 30,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#4169E1',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    color: '#666',
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#4169E1',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#4169E1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#B0C4DE',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signupText: {
    color: '#4169E1',
    fontWeight: '600',
    fontSize: 14,
  },
}); 