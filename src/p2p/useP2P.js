import { useState, useEffect, useRef, useCallback } from 'react'
import { Platform, NativeModules, NativeEventEmitter } from 'react-native'

const NativeP2P = Platform.OS === 'ios' ? NativeModules.MultipeerManager : NativeModules.NearbyManager
const emitter = new NativeEventEmitter(NativeP2P)
const SERVICE_TYPE = 'tiltpayp2p'

export function useP2P({ displayName = 'Tilt User' } = {}) {
  const [peers, setPeers] = useState([])
  const [connected, setConnected] = useState(false)
  const [ready, setReady] = useState(false)
  const msgHandlers = useRef(new Set())

  const start = useCallback(async () => {
    try {
      await NativeP2P.start({ displayName, serviceType: SERVICE_TYPE })
      setReady(true)
    } catch (e) {
      console.warn('P2P start failed', e)
    }
  }, [displayName])

  const connect = useCallback(async (id) => {
    try {
      await NativeP2P.invite(id)
    } catch (e) {
      console.warn('invite failed', e)
    }
  }, [])

  const sendJson = useCallback(async (data) => {
    try {
      await NativeP2P.send(JSON.stringify(data))
      return true
    } catch (e) {
      console.warn('send failed', e)
      return false
    }
  }, [])

  const onMessage = useCallback((cb) => {
    msgHandlers.current.add(cb)
    return () => msgHandlers.current.delete(cb)
  }, [])

  useEffect(() => {
    start()
    const subs = [
      emitter.addListener('peerFound', (p) => {
        setPeers((prev) => {
          const exists = prev.find((x) => x.id === p.id)
          return exists ? prev : [...prev, p]
        })
      }),
      emitter.addListener('peerLost', (p) => {
        setPeers((prev) => prev.filter((x) => x.id !== p.id))
      }),
      emitter.addListener('peerState', (p) => {
        setConnected(p.state === 'connected')
      }),
      emitter.addListener('receiveString', (e) => {
        msgHandlers.current.forEach((fn) => fn(e))
      }),
    ]
    return () => subs.forEach((s) => s.remove())
  }, [start])

  return { ready, peers, connected, connect, sendJson, onMessage }
}