import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, StatusBar, Animated } from 'react-native';

const ErrorContext = createContext({ showError: () => {}, clearError: () => {} });

const PALETTES = {
  error:   { bg: '#FEE2E2', border: '#FCA5A5', text: '#7F1D1D', icon: '⚠️' },
  success: { bg: '#DCFCE7', border: '#86EFAC', text: '#065F46', icon: '✅' },
  info:    { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', icon: 'ℹ️'  },
};

export function ErrorProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const anim = useRef(new Animated.Value(0)).current;

  const clearError = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [anim]);

  const showError = useCallback((msg, opts = {}) => {
    const { duration = 3000, type = 'error', position = 'top' } = opts;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setToast({ msg, type, duration, position });
  }, []);

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
    timerRef.current = setTimeout(() => clearError(), toast.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast, anim, clearError]);

  const current = PALETTES[toast?.type || 'error'];
  const pos = toast?.position || 'top';

  // positionnement
  const topPad = 16 + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 44);
  const overlayStyle =
    pos === 'top'    ? { justifyContent: 'flex-start', paddingTop: topPad }
  : pos === 'center' ? { justifyContent: 'center' }
                     : { justifyContent: 'flex-end', paddingBottom: 16 };

  // animation d’apparition (dep. position)
  const translate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: pos === 'top' ? [-24, 0] : pos === 'bottom' ? [24, 0] : [0, 0],
  });

  return (
    <ErrorContext.Provider value={{ showError, clearError }}>
      {children}

      <Modal visible={!!toast} transparent animationType="none" statusBarTranslucent>
        <View style={[styles.overlay, overlayStyle]} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: current.bg,
                borderColor: current.border,
                opacity: anim,
                transform: [{ translateY: translate }],
              },
            ]}
          >
            <Text style={[styles.icon, { color: current.text }]}>{current.icon}</Text>
            <Text style={[styles.msg, { color: current.text }]} numberOfLines={3}>
              {toast?.msg}
            </Text>
            <TouchableOpacity onPress={clearError} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.close, { color: current.text }]}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ErrorContext.Provider>
  );
}

export function useError() { return useContext(ErrorContext); }

const styles = StyleSheet.create({
  overlay: { flex: 1, paddingHorizontal: 16 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // ombres
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  icon: { fontSize: 16, fontWeight: '700' },
  msg: { flex: 1, fontWeight: '600' },
  close: { fontSize: 18, fontWeight: '700', opacity: 0.8 },
});