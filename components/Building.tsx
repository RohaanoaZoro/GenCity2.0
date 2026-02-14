
import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges, Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingData } from '../types';
import { animated, useSpring } from '@react-spring/three';

interface BuildingProps {
  data: BuildingData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  opacity?: number;
  isPreviewGhost?: boolean;
}

const BuildingLot = ({ size, opacity = 1, isSelected, type }: { size: [number, number, number], opacity?: number, isSelected: boolean, type?: string }) => {
    if (type === 'AREA' || type === 'ROAD') return null;
    const lotWidth = size[0] + 6;
    const lotDepth = size[2] + 6;
    const yPos = -size[1]/2 + 0.02; 
    
    return (
        <animated.group position={[0, yPos, 0]}>
            <animated.mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <animated.planeGeometry args={[lotWidth, lotDepth]} />
                <animated.meshStandardMaterial 
                  color={isSelected ? "#2d3748" : "#1e293b"} 
                  roughness={0.9} 
                  transparent={opacity < 1} 
                  opacity={opacity} 
                />
            </animated.mesh>
            <animated.mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
                <animated.ringGeometry args={[size[0]/2 + 0.1, size[0]/2 + 0.5, 4]} />
                <animated.meshStandardMaterial color={isSelected ? "#cbd5e1" : "#64748b"} transparent={opacity < 1} opacity={opacity} />
            </animated.mesh>
        </animated.group>
    )
}

const GpuVisual = ({ size, color, opacity = 1 }: { size: [number, number, number], color: string, opacity?: number }) => {
    const [w, h, d] = size;
    const layerH = h / 3.2;
    const spacing = h * 0.05;
    return (
        <animated.group>
            {[0, 1, 2].map((i) => (
              <animated.group key={i} position={[0, -h/2 + layerH/2 + i * (layerH + spacing), 0]}>
                  <RoundedBox args={[w, layerH, d]} radius={0.1} smoothness={4} castShadow receiveShadow>
                    <animated.meshStandardMaterial color={i === 2 ? "#ffffff" : "#e5e7eb"} roughness={0.5} metalness={0.1} transparent={opacity < 1} opacity={opacity} />
                  </RoundedBox>
              </animated.group>
            ))}
        </animated.group>
    )
}

const TowerVisual = ({ size, color, opacity = 1 }: { size: [number, number, number], color: string, opacity?: number }) => {
    const [w, h, d] = size;
    return (
        <animated.group>
            <animated.mesh castShadow receiveShadow>
              <animated.boxGeometry args={[w, h, d]} />
              <animated.meshPhysicalMaterial color={color} metalness={0.8} roughness={0.1} transmission={0.2} transparent opacity={opacity} />
            </animated.mesh>
        </animated.group>
    );
};

const InfrastructureVisual = ({ size, color, opacity = 1, type }: { size: [number, number, number], color: string, opacity?: number, type: 'ROAD' | 'AREA' }) => {
    return (
        <animated.group>
            <animated.mesh receiveShadow position={[0, 0.02, 0]}>
                <animated.boxGeometry args={[size[0], 0.15, size[2]]} />
                <animated.meshStandardMaterial color={color} roughness={1} metalness={0} transparent={opacity < 1} opacity={opacity} />
            </animated.mesh>
            {type === 'ROAD' && (
                <animated.mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <animated.planeGeometry args={[size[0] * 0.8, size[2] * 0.05]} />
                    <animated.meshBasicMaterial color="white" transparent opacity={0.3} />
                </animated.mesh>
            )}
        </animated.group>
    );
};

export const Building: React.FC<BuildingProps> = ({ data, isSelected, onSelect, opacity = 1, isPreviewGhost = false }) => {
  const [hovered, setHovered] = useState(false);
  const visualRef = useRef<THREE.Group>(null);
  const isInfrastructure = data.type === 'AREA' || data.type === 'ROAD';
  
  const { scaleX, scaleY, scaleZ, color, posX, posY, posZ } = useSpring({
    scaleX: isInfrastructure ? 1 : (isSelected ? 1.1 : (hovered ? 1.02 : 1)),
    scaleY: isInfrastructure ? 1 : (isSelected ? 1.1 : (hovered ? 1.02 : 1)),
    scaleZ: isInfrastructure ? 1 : (isSelected ? 1.1 : (hovered ? 1.02 : 1)),
    color: isSelected ? '#3b82f6' : data.color, 
    posX: data.position[0],
    posY: data.position[1],
    posZ: data.position[2],
    config: { mass: 1, tension: 170, friction: 26 },
  });

  useFrame((state, delta) => {
    if (visualRef.current) {
        if (isSelected && !isPreviewGhost && !isInfrastructure) {
            visualRef.current.rotation.y += delta * 1.5;
        } else {
            visualRef.current.rotation.y = THREE.MathUtils.lerp(visualRef.current.rotation.y, 0, 0.1);
        }
    }
  });

  const renderVisual = () => {
      switch (data.type) {
          case 'GPU': return <GpuVisual size={data.size} color={data.color} opacity={opacity} />;
          case 'TOWER': return <TowerVisual size={data.size} color={data.color} opacity={opacity} />;
          case 'AREA': 
          case 'ROAD': return <InfrastructureVisual size={data.size} color={data.color} opacity={opacity} type={data.type} />;
          default: return (
            <animated.mesh castShadow receiveShadow>
                <animated.boxGeometry args={data.size} />
                <animated.meshStandardMaterial color={color as any} roughness={0.3} metalness={0.1} transparent={opacity < 1} opacity={opacity} />
            </animated.mesh>
          );
      }
  };

  return (
    <animated.group
      position-x={posX}
      position-y={posY}
      position-z={posZ}
      scale-x={scaleX}
      scale-y={scaleY}
      scale-z={scaleZ}
      onClick={(e) => { if (isPreviewGhost) return; e.stopPropagation(); onSelect(data.id); }}
      onPointerOver={(e) => { if (isPreviewGhost) return; e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { if (isPreviewGhost) return; setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      <BuildingLot size={data.size} opacity={opacity} isSelected={isSelected} type={data.type} />
      
      <animated.group ref={visualRef}>
          {renderVisual()}
          {!isInfrastructure && <Edges visible={isSelected || hovered} scale={1.0} threshold={15} color={isSelected ? "white" : "black"} />}
      </animated.group>

      {isSelected && !isPreviewGhost && !isInfrastructure && (
        <>
            <Html position={[-data.size[0]/2 - 2, data.size[1]/2 + 2, 0]} distanceFactor={12} center style={{ pointerEvents: 'none' }}>
                <div className="w-80 transform -translate-x-full animate-in slide-in-from-right-8 duration-500 ease-out">
                    <div className="bg-slate-900/95 backdrop-blur-3xl border-l-[6px] p-6 rounded-r-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-blue-500" style={{ borderLeftColor: data.color }}>
                        <h2 className="text-white font-black text-2xl uppercase tracking-tighter mb-2 leading-none">{data.name}</h2>
                        <div className="h-[2px] w-12 bg-white/20 mb-4" />
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                          {data.description || "Initializing node telemetry. Connection established."}
                        </p>
                    </div>
                </div>
            </Html>

            <Html position={[data.size[0]/2 + 2, data.size[1]/2 + 1, 0]} distanceFactor={12} center style={{ pointerEvents: 'none' }}>
                 <div className="w-48 transform translate-x-2 animate-in slide-in-from-left-8 duration-500 ease-out">
                    <div className="bg-slate-900/95 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60" />
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] block mb-2">Market Cap</span>
                        <div className="text-3xl font-mono font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
                          ${data.marketCap ? (data.marketCap >= 1000 ? `${(data.marketCap/1000).toFixed(2)}T` : `${data.marketCap}B`) : '0B'}
                        </div>
                    </div>
                </div>
            </Html>
        </>
      )}
    </animated.group>
  );
};
