import { createContext, useContext } from 'react';
import useFaceLandmarker from '../hooks/useFaceLandmarker.js';

const Ctx = createContext({ ready: false, detect: () => null });

export function FaceLandmarkerProvider({ children }) {
  const value = useFaceLandmarker();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFaceLandmarkerCtx() {
  return useContext(Ctx);
}
