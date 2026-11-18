import { useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import type { RootStackScreenProps } from '../../navigation/types';
import { isValidEmail } from '../../utils/validation';
import {
  AuthButton,
  AuthFormError,
  AuthLayout,
  AuthSwitchLink,
} from './components/AuthLayout';
import { AuthTextField } from './components/AuthTextField';

export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  const handleLogin = async () => {
    setFormError('');
    let nextEmailError = '';
    if (!email.trim()) {
      nextEmailError = 'Vui lòng nhập email';
    } else if (!isValidEmail(email)) {
      nextEmailError = 'Email không hợp lệ';
    }
    const nextPasswordError = password ? '' : 'Vui lòng nhập mật khẩu';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      return;
    }
    setSubmitting(true);
    const error = await login(email, password);
    // Thành công: RootNavigator đổi sang MainTabs và gỡ màn này, không setState nữa.
    if (error !== null) {
      setFormError(error);
      setSubmitting(false);
    }
  };

  const onChangeEmail = (text: string) => {
    setEmail(text);
    setEmailError('');
    setFormError('');
  };

  const onChangePassword = (text: string) => {
    setPassword(text);
    setPasswordError('');
    setFormError('');
  };

  return (
    <AuthLayout title="Đăng nhập">
      <AuthTextField
        label="Email"
        icon="mail"
        value={email}
        onChangeText={onChangeEmail}
        error={emailError}
        placeholder="Nhập email"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <AuthTextField
        ref={passwordRef}
        label="Mật khẩu"
        icon="lock"
        value={password}
        onChangeText={onChangePassword}
        error={passwordError}
        placeholder="Nhập mật khẩu"
        secure
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />
      <AuthFormError message={formError} />
      <AuthButton
        label="Đăng nhập"
        loading={submitting}
        onPress={handleLogin}
      />
      <AuthSwitchLink
        prompt="Chưa có tài khoản?"
        action="Đăng ký"
        onPress={() => navigation.navigate('Register')}
      />
    </AuthLayout>
  );
}
