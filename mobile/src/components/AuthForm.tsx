import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  ...inputProps
}: TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            accessibilityLabel={label}
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            style={[styles.input, error && styles.inputError]}
            value={String(value ?? '')}
            {...inputProps}
          />
        )}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export function SubmitButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, loading && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

export const authFormStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceDark },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { color: colors.primaryBright, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  title: { marginTop: 10, color: '#F8FAFC', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 8, marginBottom: 26, color: '#94A3B8', fontSize: 15, lineHeight: 22 },
  card: { borderRadius: 20, backgroundColor: colors.surface, padding: 20 },
  apiError: { marginBottom: 14, borderRadius: 10, backgroundColor: '#FEF2F2', color: '#991B1B', padding: 12 },
  link: { marginTop: 20, color: '#99F6E4', textAlign: 'center', fontWeight: '700' },
});

const styles = StyleSheet.create({
  field: { marginBottom: 15 },
  label: { marginBottom: 6, color: colors.text, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, color: colors.text, backgroundColor: '#FFFFFF' },
  inputError: { borderColor: colors.danger },
  error: { marginTop: 4, color: colors.danger, fontSize: 12 },
  button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary },
  buttonPressed: { opacity: 0.86 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
