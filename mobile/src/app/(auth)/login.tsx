import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { normalizeApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { authFormStyles, FormField, SubmitButton } from '@/components/AuthForm';

const schema = z.object({
  email: z.email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
type Values = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={authFormStyles.screen}>
      <ScrollView contentContainerStyle={authFormStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={authFormStyles.brand}>GUARDIAN</Text>
        <Text style={authFormStyles.title}>Chào mừng trở lại</Text>
        <Text style={authFormStyles.subtitle}>Đăng nhập để giám sát và điều khiển thiết bị được cấp quyền.</Text>
        <View style={authFormStyles.card}>
          {!!apiError && <Text style={authFormStyles.apiError}>{apiError}</Text>}
          <FormField control={control} name="email" label="Email" keyboardType="email-address" error={formState.errors.email?.message} />
          <FormField control={control} name="password" label="Mật khẩu" secureTextEntry error={formState.errors.password?.message} />
          <SubmitButton label="Đăng nhập" loading={formState.isSubmitting} onPress={submit} />
        </View>
        <Link href="/(auth)/register" style={authFormStyles.link}>Chưa có tài khoản? Đăng ký</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
