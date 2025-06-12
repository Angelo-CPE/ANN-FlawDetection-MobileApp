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
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { token } = route.params;

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
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

    setLoading(true);
    try {
      const response = await axios.put(`https://ann-flaw-detection-system-for-train.onrender.com/api/auth/resetpassword/${token}`, {
        password
      });
      
      setMessage(response.data.message || 'Password reset successfully');
      setError('');
      
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>Create a new secure password to protect your account</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={20} color="#D32F2F" style={styles.messageIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {message ? (
            <View style={styles.successContainer}>
              <Icon name="check-circle-outline" size={20} color="#2E7D32" style={styles.messageIcon} />
              <Text style={styles.successText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter new password"
                placeholderTextColor="#8E8E93"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={togglePasswordVisibility}
              >
                <Icon 
                  name={showPassword ? 'visibility-off' : 'visibility'} 
                  size={22} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#8E8E93"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeButton}
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

          <View style={styles.passwordRules}>
            <Text style={styles.passwordRuleText}>• Must be at least 6 characters</Text>
            <Text style={styles.passwordRuleText}>• Include uppercase and lowercase letters</Text>
            <Text style={styles.passwordRuleText}>• Include at least one number</Text>
          </View>

          <TouchableOpacity 
            style={[styles.resetButton, loading && styles.disabledButton]} 
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 10,
    marginRight: 8,
  },
  passwordRules: {
    marginTop: -10,
    marginBottom: 20,
  },
  passwordRuleText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  resetButton: {
    height: 52,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    flex: 1,
  },
});

export default ResetPasswordScreen;