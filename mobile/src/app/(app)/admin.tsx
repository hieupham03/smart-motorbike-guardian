import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminApi } from '@/api/admin.api';
import { normalizeApiError } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { colors } from '@/theme/colors';
import type { AuditLog, Device, User } from '@/types/api';

export default function AdminScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    try {
      const [u, d, l] = await Promise.all([adminApi.users(), adminApi.devices(), adminApi.auditLog()]);
      setUsers(u.data); setDevices(d.data); setLogs(l.data); setError(null);
    } catch (cause) { setError(normalizeApiError(cause).message); }
  };
  useEffect(() => {
    if (user?.role === 'ADMIN') void Promise.resolve().then(load);
  }, [user?.role]);
  if (user?.role !== 'ADMIN') return <View style={styles.center}><Text style={styles.muted}>Chỉ tài khoản ADMIN được truy cập.</Text></View>;
  const toggle = async (item: User) => {
    try { await adminApi.updateUserStatus(item.userId, item.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'); await load(); }
    catch (cause) { setError(normalizeApiError(cause).message); }
  };
  return <ScrollView contentContainerStyle={styles.content}>
    {!!error && <Text style={styles.error}>{error}</Text>}
    <View style={styles.summary}><Metric label="Tài khoản" value={users.length} /><Metric label="Thiết bị" value={devices.length} /><Metric label="Audit" value={logs.length} /></View>
    <View style={styles.card}><Text style={styles.heading}>Tài khoản</Text>{users.map((item) => <View key={item.userId} style={styles.row}><View style={styles.grow}><Text style={styles.strong}>{item.fullName}</Text><Text style={styles.muted}>{item.email} · {item.role} · {item.status}</Text></View>{item.userId !== user.userId && <Pressable onPress={() => void toggle(item)}><Text style={item.status === 'ACTIVE' ? styles.danger : styles.action}>{item.status === 'ACTIVE' ? 'Khóa' : 'Mở'}</Text></Pressable>}</View>)}</View>
    <View style={styles.card}><Text style={styles.heading}>Audit log gần nhất</Text>{logs.slice(0, 50).map((item) => <View key={item.logId} style={styles.log}><Text style={styles.strong}>{item.action} · {item.result}</Text><Text style={styles.muted}>{item.userEmail ?? 'system'} · {new Date(item.createdAt).toLocaleString('vi-VN')}</Text>{!!item.details && <Text style={styles.detail}>{item.details}</Text>}</View>)}</View>
  </ScrollView>;
}

function Metric({ label, value }: { label: string; value: number }) { return <View style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.muted}>{label}</Text></View>; }

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, error: { borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 }, summary: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, alignItems: 'center', borderRadius: 14, backgroundColor: colors.surface, padding: 12 }, value: { color: colors.primary, fontSize: 22, fontWeight: '900' }, card: { borderRadius: 16, backgroundColor: colors.surface, padding: 16, gap: 11 }, heading: { color: colors.text, fontSize: 18, fontWeight: '900' }, row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: 10 }, grow: { flex: 1 }, strong: { color: colors.text, fontWeight: '800' }, muted: { color: colors.textMuted, fontSize: 12 }, action: { color: colors.primary, fontWeight: '800' }, danger: { color: colors.danger, fontWeight: '800' }, log: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, gap: 3 }, detail: { color: colors.text, fontSize: 13 },
});
