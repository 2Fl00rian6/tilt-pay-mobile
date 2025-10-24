// src/p2p/useP2P.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Essayons plusieurs libs courantes
const getNative = () => {
  // 1) react-native-multipeer
  if (NativeModules.MultipeerConnectivity) return { name: 'react-native-multipeer', mod: NativeModules.MultipeerConnectivity };
  if (NativeModules.Multipeer) return { name: 'react-native-multipeer', mod: NativeModules.Multipeer };
  // 2) (aucune) -> null
  return null;
};

// Règles Apple: 1-15 chars, [a-z0-9-]
const SERVICE_TYPE = 'tiltpayp2p';

export function useP2P({ displayName = 'Tilt User' } = {}) {
  const nativeInfo = getNative();
  const native = nativeInfo?.mod ?? null;

  const [ready, setReady] = useState(!!native && Platform.OS === 'ios');
  const [started, setStarted] = useState(false);
  const [peers, setPeers] = useState([]); // [{id, name, state}]
  const [connected, setConnected] = useState(false);

  // Event bus
  const emitter = useMemo(() => (native ? new NativeEventEmitter(native) : null), [native]);
  const msgHandlersRef = useRef(new Set());

  // ----- Safe wrappers -----
  const safeCall = useCallback(async (fnName, ...args) => {
    if (!native || typeof native[fnName] !== 'function') {
      console.warn('[Multipeer] method not available:', fnName);
      return null;
    }
    try {
      const r = native[fnName](...args);
      return r?.then ? await r : r;
    } catch (e) {
      console.warn('[Multipeer] call error:', fnName, e?.message || e);
      return null;
    }
  }, [native]);

  const start = useCallback(async () => {
    if (!ready || started) return;
    if (!native) {
      console.warn('[Multipeer] native module missing. Did you prebuild & pod install?');
      return;
    }
    // Beaucoup de libs n’exigent pas initialize(); si elle existe, on tente.
    await safeCall('initialize', { serviceType: SERVICE_TYPE, displayName }).catch(() => {});
    await safeCall('advertise', SERVICE_TYPE, displayName);
    await safeCall('browse', SERVICE_TYPE);
    setStarted(true);
  }, [ready, started, native, safeCall, displayName]);

  const stop = useCallback(async () => {
    if (!native) return;
    await safeCall('stopAdvertising');
    await safeCall('stopBrowsing');
    setStarted(false);
  }, [native, safeCall]);

  const connect = useCallback(async (peerId) => {
    if (!peerId) return;
    await safeCall('invitePeer', peerId);
  }, [safeCall]);

  const sendString = useCallback(async (peerId, text) => {
    // Certaines libs envoient à tous si peerId omis
    const ok = await safeCall('sendString', text, peerId);
    return !!ok;
  }, [safeCall]);

  const sendJson = useCallback(async (payload, peerId) => {
    try {
      return await sendString(peerId, JSON.stringify(payload));
    } catch {
      return false;
    }
  }, [sendString]);

  const onMessage = useCallback((listener) => {
    msgHandlersRef.current.add(listener);
    return () => msgHandlersRef.current.delete(listener);
  }, []);

  // ----- Events wiring -----
  useEffect(() => {
    if (!emitter) return;
    const subs = [];

    // Pairing / peers list
    if (native?.addListener || emitter.addListener) {
      subs.push(
        emitter.addListener('peerFound', (p) => {
          setPeers((prev) => {
            const idx = prev.findIndex(x => x.id === p?.id);
            const next = [...prev];
            const row = { id: String(p?.id ?? p?.peerID ?? Math.random()), name: p?.name || p?.displayName || 'Nearby device', state: p?.state || 'found' };
            if (idx >= 0) next[idx] = row; else next.push(row);
            return next;
          });
        }),
      );
      subs.push(
        emitter.addListener('peerLost', (p) => {
          setPeers((prev) => prev.filter(x => x.id !== (p?.id ?? p?.peerID)));
        }),
      );
      subs.push(
        emitter.addListener('peerConnected', (p) => {
          setConnected(true);
          setPeers((prev) => {
            const id = String(p?.id ?? p?.peerID ?? '');
            return prev.map((x) => x.id === id ? { ...x, state: 'connected' } : x);
          });
        }),
      );
      subs.push(
        emitter.addListener('peerDisconnected', (p) => {
          setConnected(false);
          setPeers((prev) => {
            const id = String(p?.id ?? p?.peerID ?? '');
            return prev.map((x) => x.id === id ? { ...x, state: 'disconnected' } : x);
          });
        }),
      );
      subs.push(
        emitter.addListener('receiveString', (evt) => {
          const message = evt?.message ?? evt?.string ?? '';
          const peerId = evt?.peerID ?? evt?.peerId ?? 'unknown';
          msgHandlersRef.current.forEach((fn) => {
            try { fn({ peerId, message }); } catch {}
          });
        }),
      );
    }

    return () => subs.forEach(s => { try { s.remove(); } catch {} });
  }, [emitter, native]);

  // Auto start (iOS uniquement)
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    start();
    return () => { stop(); };
  }, [start, stop]);

  return {
    ready,           // true si le module natif est dispo (iOS)
    started,         // advertising/browsing lancés
    peers,           // [{id, name, state}]
    connected,       // bool
    connect,
    sendString,
    sendJson,
    onMessage,
    _nativeName: nativeInfo?.name ?? null,
  };
}