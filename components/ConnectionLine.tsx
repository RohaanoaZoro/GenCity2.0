
import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QuadraticBezierLine, Html } from '@react-three/drei';
import { animated } from '@react-spring/three';

interface ConnectionLineProps {
  connection: import('../types').Connection;
  start: [number, number, number];
  end: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ 
  connection, 
  start, 
  end, 
  isSelected, 
  onSelect 
}) => {
  const lineRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  
  const midPoint: [number, number, number] = useMemo(() => [
    (start[0] + end[0]) / 2,
    Math.max(start[1], end[1]) + 4,
    (start[2] + end[2]) / 2
  ], [start, end]);

  useFrame(() => {
    if (lineRef.current) {
      const speed = isSelected ? 0.04 : 0.015;
      lineRef.current.material.dashOffset -= speed;
    }
  });

  const direction = useMemo(() => {
    return new THREE.Vector3().subVectors(
      new THREE.Vector3(...end),
      new THREE.Vector3(...midPoint)
    ).normalize();
  }, [end, midPoint]);
  
  const arrowRotation = useMemo(() => {
    return new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    );
  }, [direction]);

  const color = isSelected ? '#ffffff' : (hovered ? '#ffffff' : connection.color);

  // Fix: Use animated prefix for Three.js intrinsic elements to satisfy TS JSX check
  return (
    <animated.group>
      <QuadraticBezierLine ref={lineRef} start={start} end={end} mid={midPoint} color={color} lineWidth={isSelected ? 6 : 3} dashed dashScale={2} dashSize={0.5} gapSize={0.2} transparent opacity={0.8} />
      <QuadraticBezierLine start={start} end={end} mid={midPoint} color={connection.color} lineWidth={isSelected ? 16 : 6} transparent opacity={isSelected ? 0.5 : 0.15} />
      <QuadraticBezierLine start={start} end={end} mid={midPoint} lineWidth={30} transparent opacity={0} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }} onClick={(e) => { e.stopPropagation(); onSelect(connection.id); }} />
      <animated.mesh position={[end[0], end[1], end[2]]} rotation={arrowRotation}><animated.coneGeometry args={[0.5, 1.2, 8]} /><animated.meshBasicMaterial color={color} transparent opacity={0.9} /></animated.mesh>

      {isSelected && (
        <Html position={midPoint} distanceFactor={12} center>
          <div className="w-80 animate-in zoom-in-95 fade-in duration-500 pointer-events-none flex flex-col items-center">
            {/* LINK MAIN DIALOG */}
            <div className="bg-slate-900/95 backdrop-blur-3xl border-l-[6px] p-6 rounded-r-2xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] w-full mb-4" style={{ borderColor: connection.color }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400/70 mb-1">Network Agreement</h4>
                  <h2 className="text-white font-black text-2xl tracking-tighter leading-none">{connection.customText || "Active Hub Link"}</h2>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                  <i className="fas fa-link text-xs text-white/50"></i>
                </div>
              </div>

              {connection.description && (
                <p className="text-sm text-slate-300 italic leading-relaxed opacity-90 border-t border-white/10 pt-4 mt-2">{connection.description}</p>
              )}
            </div>

            {/* SECONDARY DIALOG: LINK VALUE */}
            {connection.customNumber !== undefined && connection.customNumber > 0 && (
              <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center relative overflow-hidden w-56 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40" />
                <span className="text-[9px] uppercase font-black text-slate-500 tracking-[0.4em] block mb-1">Contract Valuation</span>
                <div className="text-3xl font-mono font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                  ${connection.customNumber >= 1000 ? `${(connection.customNumber/1000).toFixed(1)}T` : `${connection.customNumber}B`}
                </div>
              </div>
            )}
            
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent mt-4"></div>
          </div>
        </Html>
      )}
    </animated.group>
  );
};
