import { create } from 'zustand';
import type { DeviceStatus } from './types';

interface DeviceState {
  status: DeviceStatus;
  deviceId: string | null;
  deviceName: string | null;
  errorMessage: string | null;
  setConnecting: (deviceId: string, deviceName: string) => void;
  setStreaming: () => void;
  setIdle: () => void;
  setError: (message: string) => void;
}

export const useDeviceStore = create<DeviceState>()((set) => ({
  status: 'idle',
  deviceId: null,
  deviceName: null,
  errorMessage: null,

  setConnecting: (deviceId, deviceName) =>
    set({ status: 'connecting', deviceId, deviceName, errorMessage: null }),

  setStreaming: () => set({ status: 'streaming', errorMessage: null }),

  setIdle: () =>
    set({ status: 'idle', deviceId: null, deviceName: null, errorMessage: null }),

  setError: (message) => set({ status: 'error', errorMessage: message }),
}));
