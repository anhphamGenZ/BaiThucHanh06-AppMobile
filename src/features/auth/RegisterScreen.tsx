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

type Field = 'name' | 'email' | 'password' | 'confirm';
type FieldErrors = Record<Field, string>;

const NO_ERRORS: FieldErrors = {
  name: '',
  email: '',
  password: '',
  confirm: '',
};

export function RegisterScreen({
  navigation,
}: RootStackScreenProps<'Register'>) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const validate = (): FieldErrors => {
    const next = { ...NO_ERRORS };
    if (!name.trim()) {
      next.name = 'Vui lòng nhập họ tên';
    } else if (name.trim().length > 50) {
      next.name = 'Họ tên tối đa 50 ký tự';
    }
    if (!email.trim()) {
      next.email = 'Vui lòng nhập email';
    } else if (!isValidEmail(email)) {
      next.email = 'Email không hợp lệ';
    }
    if (!password) {
      next.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      next.password = 'Mật khẩu tối thiểu 6 ký tự';
    }
    if (!confirm) {
      next.confirm = 'Vui lòng nhập lại mật khẩu';
    } else if (confirm !== password) {
      next.confirm = 'Mật khẩu nhập lại không khớp';
    }
    return next;
  };

  const handleRegister = async () => {
    setFormError('');
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      return;
    }
    setSubmitting(true);
    const error = await register(name, email, password);
    // Thành công: Firebase tự đăng nhập, RootNavigator chuyển vào MainTabs.
    if (error !== null) {
      setFormError(error);
      setSubmitting(false);
    }
  };

  const change =
    (field: Field, set: (text: string) => void) => (text: string) => {
      set(text);
      setErrors(prev => ({ ...prev, [field]: '' }));
      setFormError('');
    };

  return (
    <AuthLayout title="Tạo tài khoản">
      <AuthTextField
        label="Họ tên"
        icon="user"
        value={name}
        onChangeText={change('name', setName)}
        error={errors.name}
        placeholder="Nhập họ tên"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <AuthTextField
        ref={emailRef}
        label="Email"
        icon="mail"
        value={email}
        onChangeText={change('email', setEmail)}
        error={errors.email}
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
        onChangeText={change('password', setPassword)}
        error={errors.password}
        placeholder="Tối thiểu 6 ký tự"
        secure
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <AuthTextField
        ref={confirmRef}
        label="Nhập lại mật khẩu"
        icon="lock"
        value={confirm}
        onChangeText={change('confirm', setConfirm)}
        error={errors.confirm}
        placeholder="Nhập lại mật khẩu"
        secure
        returnKeyType="done"
        onSubmitEditing={handleRegister}
      />
      <AuthFormError message={formError} />
      <AuthButton
        label="Đăng ký"
        loading={submitting}
        onPress={handleRegister}
      />
      <AuthSwitchLink
        prompt="Đã có tài khoản?"
        action="Đăng nhập"
        onPress={() => navigation.goBack()}
      />
    </AuthLayout>
  );
}
