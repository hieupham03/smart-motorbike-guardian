import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function IndexScreen() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen label="Đang khôi phục phiên..." />;
  return <Redirect href={status === 'authenticated' ? '/(app)' : '/(auth)/login'} />;
}
