import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const [resendLoading, setResendLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    
    setResendLoading(true);
    try {
      await axios.post('https://ann-flaw-detection-system-for-train.onrender.com/api/auth/resend-verification', {
        email: registeredEmail
      });
      Alert.alert('Success', 'Verification email has been resent. Please check your inbox.');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to resend verification email';
      Alert.alert('Error', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.endsWith('@tip.edu.ph')) {
      setError('Only TIP email addresses are allowed');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must include at least one lowercase letter');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must include at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must include at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must include at least one special character');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('https://ann-flaw-detection-system-for-train.onrender.com/api/auth/register', {
        name,
        email,
        password
      });
      
      setRegisteredEmail(email); // Store the registered email
      
      // Show success alert with resend option
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account. Didn\'t receive the email?',
        [
          {
            text: 'Resend',
            onPress: handleResendVerification
          },
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to start inspecting trains</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@tip.edu.ph"
              placeholderTextColor="#8E8E93"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
              style={styles.inputWithIconField}
              placeholder="*******"
              placeholderTextColor="#8E8E93"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity 
                style={styles.iconTouchable}
                onPress={togglePasswordVisibility}
              >
                <Icon 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={22} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              Must be 6+ characters with uppercase, lowercase, number & special character
            </Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputWithIconField}
                placeholder="******"
                placeholderTextColor="#8E8E93"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.iconTouchable}
                onPress={toggleConfirmPasswordVisibility}
              >
                <Icon 
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'} 
                  size={22} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.disabledButton]} 
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.6}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: -20,

  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },
  passwordHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    paddingLeft: 5
  },
  registerButton: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#c62828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#8E8E93',
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWithIcon: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1A1A1A',
  },

  inputWithIconField: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 35, // prevent text from colliding with icon
    color: '#000',
    
  },

  iconTouchable: {
    position: 'absolute',
    right: 10,
    padding: 13,

  },
});

export default RegisterScreen;