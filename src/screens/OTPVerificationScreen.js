import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const { email } = useRoute().params;
  const navigation = useNavigation();
  
  // Use useRef for animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();

    // Countdown timer for resend OTP
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setResendDisabled(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('https://ann-flaw-detection-system-for-train.onrender.com/api/auth/verify-otp', {
        email,
        otp
      });
      navigation.navigate('NewPassword', { tempToken: data.tempToken });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendDisabled(true);
    setCountdown(30);
    setError('');
    setOtp('');
    
    try {
      await axios.post('https://ann-flaw-detection-system-for-train.onrender.com/api/auth/resend-otp', { email });
      
      // Start countdown again
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setResendDisabled(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
      setResendDisabled(false);
    }
  };

return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <Animated.View style={[styles.animatedContainer, { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }]}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
          
          <View style={styles.card}>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>We've sent a 6-digit code to</Text>
            <Text style={styles.emailText}>{email}</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={20} color="#dc3545" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.otpContainer}>
              <TextInput
                style={styles.input}
                placeholder="• • • • • •"
                placeholderTextColor="#adb5bd"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                selectionColor="#495057"
              />
            </View>

            <TouchableOpacity 
              style={styles.resendContainer}
              onPress={handleResendOTP}
              disabled={resendDisabled}
            >
              <Text style={[styles.resendText, resendDisabled && styles.resendDisabled]}>
                Didn't receive code? {resendDisabled ? `Resend in ${countdown}s` : 'Resend now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#343a40', '#212529']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Verify OTP <Icon name="arrow-forward" size={16} color="#fff" />
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',

  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  animatedContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: '100%',
    height: 120,
    marginBottom: -30,
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  otpContainer: {
    marginBottom: 16,
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#212529',
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gradientButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#C62828',
    fontSize: 14,
  },
  resendDisabled: {
    color: '#adb5bd',
  },
});

export default OTPVerificationScreen;