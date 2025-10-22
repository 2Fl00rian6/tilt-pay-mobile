// src/p2p/useP2P.js
import { useEffect, useRef, useState, useCallback } from 'react';
import * as MultipeerImport from 'react-native-multipeer';

// serviceType: 1–15 chars, [a-z0-9]
const SERVICE = 'tiltp2p';

function resolveMC() {
  const MC = MultipeerImport?.default ?? MultipeerImport ?? {};
  // Mappe des alias possibles selon les versions
  const api = {
    initialize: MC.initialize || MC.init || MC.start || null,
    advertise: MC.advertise || MC.startAdvertising || MC.startAdvertisingPeer || null,
    browse: MC.browse || MC.startBrowsing || MC.startBrowsingForPeers || null,
    stopAdvertising: MC.stopAdvertising || MC.stopAdvertisingPeer || MC.unadvertise || null,
    stopBrowsing: MC.stopBrowsing || MC.stopBrowsingForPeers || MC.unbrowse || null,
    disconnect: MC.disconnect || MC.disconnectPeer || null,
    invitePeer: MC.invitePeer || MC.invite || null,
    sendString: MC.sendString || MC.send || null,
    on: MC.on || MC.addListener || null,
    removeAllListeners: MC.removeAllListeners?.bind?.(MC) || MC.removeAllListeners || null,
    raw: MC,
  };
  return api;
}

export function useP2P({ displayName }) {
  const [peers, setPeers] = useState([]);          // [{id, name, state}]
  const [connected, setConnected] = useState(false);
  const [ready, setReady] = useState(false);

  const onFoundRef = useRef();
  const onLostRef = useRef();
  const onConnectedRef = useRef();
  const onDisconnectedRef = useRef();
  const onReceiveRef = useRef();

  useEffect(() => {
    const MC = resolveMC();

    // Log de debug pour voir les méthodes dispo côté natif
    if (__DEV__) {
      console.log('[Multipeer] available keys:', Object.keys(MC.raw || {}));
      console.log('[Multipeer] resolved api:', {
        initialize: !!MC.initialize, advertise: !!MC.advertise, browse: !!MC.browse,
        stopAdvertising: !!MC.stopAdvertising, stopBrowsing: !!MC.stopBrowsing,
        disconnect: !!MC.disconnect, invitePeer: !!MC.invitePeer, sendString: !!MC.sendString,
        on: !!MC.on, removeAllListeners: !!MC.removeAllListeners,
      });
    }

    // Abonnements d’événements (si .on dispo)
    MC.on?.('peerFound', (peer) => {
      setPeers((p) => (p.find(x => x.id === peer.id) ? p : [...p, { ...peer, state: 'found' }]));
      onFoundRef.current?.(peer);
    });
    MC.on?.('peerLost', (peer) => {
      setPeers((p) => p.filter(x => x.id !== peer.id));
      onLostRef.current?.(peer);
    });
    MC.on?.('peerConnected', (peer) => {
      setConnected(true);
      setPeers((p) => p.map(x => x.id === peer.id ? { ...x, state: 'connected' } : x));
      onConnectedRef.current?.(peer);
    });
    MC.on?.('peerDisconnected', (peer) => {
      setConnected(false);
      setPeers((p) => p.map(x => x.id === peer.id ? { ...x, state: 'found' } : x));
      onDisconnectedRef.current?.(peer);
    });
    MC.on?.('messageReceived', (event) => {
      onReceiveRef.current?.(event);
    });

    // Init + advertise + browse
    (async () => {
      try {
        if (!MC.initialize) throw new Error('Multipeer.initialize not available (native rebuild needed?)');
        await MC.initialize(SERVICE, displayName || 'Tilt User');

        if (!MC.advertise || !MC.browse) {
          throw new Error('advertise/browse not available — check module version or rebuild native app.');
        }
        await MC.advertise(SERVICE);
        await MC.browse(SERVICE);

        setReady(true);
      } catch (e) {
        console.warn('[Multipeer] init error:', e);
      }
    })();

    return () => {
      // Ne pas appeler de fonctions inexistantes
      try { MC.stopAdvertising?.(); } catch (e) { if (__DEV__) console.log('stopAdvertising err', e); }
      try { MC.stopBrowsing?.(); } catch (e) { if (__DEV__) console.log('stopBrowsing err', e); }
      try { MC.disconnect?.(); } catch (e) { if (__DEV__) console.log('disconnect err', e); }
      try { MC.removeAllListeners?.(); } catch (e) { if (__DEV__) console.log('removeAllListeners err', e); }
    };
  }, [displayName]);

  const connect = useCallback(async (peerId) => {
    const MC = resolveMC();
    try {
      if (!MC.invitePeer) throw new Error('invitePeer not available');
      await MC.invitePeer(peerId);
    } catch (e) {
      console.warn('invitePeer error', e);
    }
  }, []);

  const sendJson = useCallback(async (obj) => {
    const MC = resolveMC();
    try {
      if (!MC.sendString) throw new Error('sendString not available');
      await MC.sendString(JSON.stringify(obj));
      return true;
    } catch (e) {
      console.warn('sendJson error', e);
      return false;
    }
  }, []);

  return {
    ready,
    peers,
    connected,
    connect,
    sendJson,
    onPeerFound: (cb) => (onFoundRef.current = cb),
    onPeerLost: (cb) => (onLostRef.current = cb),
    onPeerConnected: (cb) => (onConnectedRef.current = cb),
    onPeerDisconnected: (cb) => (onDisconnectedRef.current = cb),
    onMessage: (cb) => (onReceiveRef.current = cb),
  };
}