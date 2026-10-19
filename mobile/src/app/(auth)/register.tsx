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
  fullName: z.string().trim().min(2, 'Họ tên quá ngắn'),
  email: z.email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu xác nhận không khớp',
});
type Values = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = handleSubmit(async (values) => {
    setApiError(null);
    try {
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: 'OWNER',
      });
    } catch (error) {
      setApiError(normalizeApiError(error).message);
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={authFormStyles.screen}>
      <ScrollView contentContainerStyle={authFormStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={authFormStyles.brand}>GUARDIAN</Text>
        <Text style={authFormStyles.title}>Tạo tài khoản</Text>
        <Text style={authFormStyles.subtitle}>Tài khoản mới được đăng ký với vai trò Owner. Admin không thể tự đăng ký.</Text>
        <View style={authFormStyles.card}>
          {!!apiError && <Text style={authFormStyles.apiError}>{apiError}</Text>}
          <FormField control={control} name="fullName" label="Họ và tên" autoCapitalize="words" error={formState.errors.fullName?.message} />
          <FormField control={control} name="email" label="Email" keyboardType="email-address" error={formState.errors.email?.message} />
          <FormField control={control} name="password" label="Mật khẩu" secureTextEntry error={formState.errors.password?.message} />
          <FormField control={control} name="confirmPassword" label="Xác nhận mật khẩu" secureTextEntry error={formState.errors.confirmPassword?.message} />
          <SubmitButton label="Đăng ký" loading={formState.isSubmitting} onPress={submit} />
        </View>
        <Link href="/(auth)/login" style={authFormStyles.link}>Đã có tài khoản? Đăng nhập</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
