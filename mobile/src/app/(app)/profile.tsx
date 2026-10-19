import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { authApi } from '@/api/auth.api';
import { normalizeApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { FormField, SubmitButton } from '@/components/AuthForm';
import { colors } from '@/theme/colors';

const schema = z.object({
  oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Mật khẩu xác nhận không khớp',
});
type Values = z.infer<typeof schema>;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const { control, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });
  const submit = handleSubmit(async ({ oldPassword, newPassword }) => {
    setFeedback(null);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      reset();
      setFeedback({ ok: true, text: 'Đổi mật khẩu thành công.' });
    } catch (error) {
      setFeedback({ ok: false, text: normalizeApiError(error).message });
    }
  });
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.heading}>Thông tin tài khoản</Text>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.detail}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role} · {user?.status}</Text>
      </View>
      <Pressable style={styles.logout} onPress={() => void logout()}><Text style={styles.logoutText}>Đăng xuất khỏi thiết bị này</Text></Pressable>
      <View style={styles.card}>
        <Text style={styles.heading}>Đổi mật khẩu</Text>
        {!!feedback && <Text style={feedback.ok ? styles.success : styles.error}>{feedback.text}</Text>}
        <FormField control={control} name="oldPassword" label="Mật khẩu hiện tại" secureTextEntry error={formState.errors.oldPassword?.message} />
        <FormField control={control} name="newPassword" label="Mật khẩu mới" secureTextEntry error={formState.errors.newPassword?.message} />
        <FormField control={control} name="confirmPassword" label="Xác nhận mật khẩu mới" secureTextEntry error={formState.errors.confirmPassword?.message} />
        <SubmitButton label="Cập nhật mật khẩu" loading={formState.isSubmitting} onPress={submit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, gap: 16 },
  card: { borderRadius: 16, backgroundColor: colors.surface, padding: 18 },
  heading: { marginBottom: 14, color: colors.text, fontSize: 18, fontWeight: '800' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  detail: { marginTop: 4, color: colors.textMuted },
  role: { marginTop: 12, color: colors.primary, fontWeight: '800' },
  success: { marginBottom: 12, borderRadius: 8, backgroundColor: '#F0FDF4', color: '#166534', padding: 10 },
  error: { marginBottom: 12, borderRadius: 8, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 10 },
  logout: { alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colors.danger, padding: 13 },
  logoutText: { color: colors.danger, fontWeight: '800' },
});
