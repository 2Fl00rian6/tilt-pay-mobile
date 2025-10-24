// src/p2p/useP2P.js
import React from 'react';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

const MP = NativeModules?.MultipeerConnectivity || null;
const emitter = MP ? new NativeEventEmitter(MP) : null;

const has = (fnName) => typeof MP?.[fnName] === 'function';

// Quick helper to log once without crashing if module is absent
const safeCall = async (fnName, ...args) => {
  try {
    if (has(fnName)) {
      const res = await MP[fnName](...args);
      return res;
    }
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.warn(`[Multipeer] ${fnName} error:`, msg);
  }
  return undefined;
};

// Small in-memory listeners list for message callbacks
function createSubStore() {
  const subs = new Set();
  return {
    add(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    emit(payload) {
      for (const cb of subs) {
        try { cb(payload); } catch (e) { console.warn('[P2P] onMessage cb error', e?.message ?? e); }
      }
    },
  };
}

export function useP2P({ displayName = 'Tilt Device' } = {}) {
  const [ready, setReady] = React.useState(false);
  const [peers, setPeers] = React.useState([]); // [{id,name,state}]
  const [connectedIds, setConnectedIds] = React.useState(new Set());

  const subsRef = React.useRef(createSubStore());

  // --- Init / teardown
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Optional initialize
        if (has('initialize')) {
          await safeCall('initialize', { displayName });
        }

        // Start advertise/browse if available
        if (has('advertise')) await safeCall('advertise');
        if (has('browse')) await safeCall('browse');

        // Bind native events if emitter exists
        if (emitter) {
          const foundSub = emitter.addListener('peerFound', (p) => {
            if (cancelled) return;
            setPeers((prev) => {
              const next = prev.filter((x) => x.id !== p?.id);
              next.push({ id: p?.id, name: p?.name ?? 'Nearby device', state: 'found' });
              return next;
            });
          });

          const lostSub = emitter.addListener('peerLost', (p) => {
            if (cancelled) return;
            setPeers((prev) => prev.filter((x) => x.id !== p?.id));
            setConnectedIds((prev) => {
              const n = new Set(prev);
              if (p?.id) n.delete(p.id);
              return n;
            });
          });

          const stateSub = emitter.addListener('peerChangedState', (e) => {
            if (cancelled) return;
            const { id, state } = e || {};
            setPeers((prev) => prev.map((x) => (x.id === id ? { ...x, state } : x)));
            setConnectedIds((prev) => {
              const n = new Set(prev);
              if (state === 'connected') n.add(id);
              else n.delete(id);
              return n;
            });
          });

          const msgSub = emitter.addListener('messageReceived', (e) => {
            const payload = { fromPeerId: e?.fromPeerId, message: e?.message };
            subsRef.current.emit(payload);
          });

          // Teardown
          return () => {
            try { foundSub?.remove?.(); } catch {}
            try { lostSub?.remove?.(); } catch {}
            try { stateSub?.remove?.(); } catch {}
            try { msgSub?.remove?.(); } catch {}
          };
        }
      } catch (err) {
        const msg = err?.message ?? String(err);
        console.warn('[Multipeer] init error:', msg);
      } finally {
        if (!cancelled) setReady(true); // even if native missing → stay “ready” in stub mode
      }
    })();

    return () => {
      cancelled = true;
      // Stop scan/ads if available
      safeCall('stopAdvertising');
      safeCall('stopBrowsing');
    };
  }, [displayName]);

  // --- Public API

  // Connect to a peer id
  const connect = React.useCallback(async (peerId) => {
    if (!peerId) return false;
    if (has('invitePeer')) {
      await safeCall('invitePeer', String(peerId));
      return true;
    }
    // Fallback: mark as "connected" locally (for demo mode)
    setPeers((prev) => prev.map((p) => (p.id === peerId ? { ...p, state: 'connected' } : p)));
    setConnectedIds((prev) => new Set(prev).add(peerId));
    return true;
  }, []);

  // Send JSON message to connected peers
  const sendJson = React.useCallback(
    async (obj) => {
      const str = (() => {
        try { return JSON.stringify(obj); } catch { return String(obj); }
      })();
      if (has('sendString')) {
        await safeCall('sendString', str);
        return true;
      }
      console.log('[P2P:fallback] sendJson ->', str);
      return true; // consider “sent” in fallback
    },
    []
  );

  // Subscribe to incoming messages
  const onMessage = React.useCallback((cb) => {
    if (typeof cb !== 'function') return () => {};
    return subsRef.current.add(cb);
  }, []);

  // Connected when at least one peer is connected
  const connected = connectedIds.size > 0;

  return {
    ready,
    peers,
    connected,
    connect,
    sendJson,
    onMessage,
  };
}

export default useP2P;