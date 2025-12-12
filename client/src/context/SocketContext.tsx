import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { io } from 'socket.io-client'
import type { TypedSocket, SocketContextValue } from '../types'

const SocketContext = createContext<SocketContextValue | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance: TypedSocket = io(import.meta.env.VITE_API_URL, {
      autoConnect: false
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const connect = () => {
    if (socket && !socket.connected) {
      socket.connect()
    }
  }

  const disconnect = () => {
    if (socket && socket.connected) {
      socket.disconnect()
    }
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
