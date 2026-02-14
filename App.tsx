
import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows, QuadraticBezierLine, Sphere, Box, Line } from '@react-three/drei';
import * as THREE from 'three';
import { BuildingData, Connection, ManualRoad, BlueprintLayout, BlueprintCell, BlueprintCellType } from './types';
import { Building } from './components/Building';
import { Controls } from './components/Controls';
import { ConnectionLine } from './components/ConnectionLine';
import { ViewPopup } from './components/ViewPopup';
import { LayoutEditorPopup } from './components/LayoutEditorPopup';
import { animated } from '@react-spring/three';

// --- Palette Generator ---
const UNIQUE_PALETTE = Array.from({ length: 50 }).map((_, i) => {
    const h = (i * 137.5) % 360; 
    return `hsl(${h}, 70%, 60%)`;
});

// --- Tron Data Sky ---
const DataStream = ({ position, size }: { position: [number, number, number], size: [number, number, number] }) => {
  const ref = useRef<THREE.Mesh>(null);
  const speed = useMemo(() => 0.05 + Math.random() * 0.1, []);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.x += speed;
      if (ref.current.position.x > 600) ref.current.position.x = -600;
    }
  });
  return (
    <animated.mesh ref={ref} position={position}>
      <animated.boxGeometry args={size} />
      <animated.meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} transparent opacity={0.3} />
    </animated.mesh>
  );
};

const SkySystem = () => {
  const dataStreams = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      position: [(Math.random() - 0.5) * 1000, 100 + Math.random() * 80, (Math.random() - 0.5) * 1000] as [number, number, number],
      size: [10 + Math.random() * 60, 0.5, 0.5] as [number, number, number]
    }));
  }, []);
  return <animated.group>{dataStreams.map((s, i) => <DataStream key={i} {...s} />)}</animated.group>;
};

const CameraRig = ({ isBuildMode, isConnectionMode, isRoadMode, focusPosition, tourMode, zoomLevel = 1 }: any) => {
    const { controls } = useThree();
    const targetVec = new THREE.Vector3();
    const currentCameraPos = new THREE.Vector3();

    useFrame((state, delta) => {
        if (!controls) return;
        const orbit = controls as any;
        
        if (isConnectionMode || isRoadMode) {
            orbit.target.lerp(targetVec.set(0, 0, 0), delta * 4);
            const editorHeight = 150 * (1 / zoomLevel);
            state.camera.position.lerp(currentCameraPos.set(0.1, editorHeight, 0.1), delta * 4);
            orbit.update();
            return;
        }

        if (tourMode && focusPosition) {
            orbit.target.lerp(targetVec.set(focusPosition[0], focusPosition[1], focusPosition[2]), delta * 4);
            const offset = 65 * (1 / zoomLevel);
            const idealPos = new THREE.Vector3(
                focusPosition[0] + offset, 
                focusPosition[1] + offset * 0.7, 
                focusPosition[2] + offset
            );
            state.camera.position.lerp(idealPos, delta * 2);
        }
        orbit.update();
    });
    return null;
}

const INITIAL_BUILDINGS: BuildingData[] = [
  { id: '1', position: [0, 1, 0], size: [4, 2, 4], color: UNIQUE_PALETTE[0], name: 'Nexus Prime GPU', type: 'GPU', marketCap: 1250, description: 'Core processing hub.' }
];

const App: React.FC = () => {
  const [buildings, setBuildings] = useState<BuildingData[]>(INITIAL_BUILDINGS);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [roads, setRoads] = useState<ManualRoad[]>([]);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [activeRoadPathIds, setActiveRoadPathIds] = useState<string[]>([]);
  
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [isRoadMode, setIsRoadMode] = useState(false);
  
  const [tourMode, setTourMode] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [isViewPopupOpen, setIsViewPopupOpen] = useState(false);
  const [isLayoutEditorOpen, setIsLayoutEditorOpen] = useState(false);
  const [pendingBlueprint, setPendingBlueprint] = useState<BlueprintLayout | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const tourableBuildings = useMemo(() => 
    buildings.filter(b => b.type !== 'AREA' && b.type !== 'ROAD' && b.type !== 'DECOR'), 
  [buildings]);

  const currentTourBuilding = useMemo(() => 
    tourableBuildings[tourIndex] || null, 
  [tourableBuildings, tourIndex]);

  const handleSelectBuilding = (id: string) => {
    if (isConnectionMode) {
      if (!connectionSourceId) {
        setConnectionSourceId(id);
      } else if (connectionSourceId !== id) {
        const fromName = buildings.find(b => b.id === connectionSourceId)?.name || 'Node A';
        const toName = buildings.find(b => b.id === id)?.name || 'Node B';
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          fromId: connectionSourceId,
          toId: id,
          color: UNIQUE_PALETTE[Math.floor(Math.random() * 50)],
          efficiency: 100,
          customText: "New Link Established",
          description: `Direct high-bandwidth link established between ${fromName} and ${toName}.`,
          customNumber: 0
        };
        setConnections(prev => [...prev, newConnection]);
        setConnectionSourceId(null);
        setSelectedConnectionId(newConnection.id);
      }
    } else if (isRoadMode) {
      if (!activeRoadPathIds.includes(id)) {
        setActiveRoadPathIds(prev => [...prev, id]);
      }
    } else {
      setSelectedId(id);
      setSelectedConnectionId(null);
    }
  };

  const handleConfirmRoadPath = () => {
    if (activeRoadPathIds.length < 2) return;
    
    const firstBuildingId = activeRoadPathIds[0];
    const firstBuilding = buildings.find(b => b.id === firstBuildingId);
    const roadColor = firstBuilding?.color || "#111111";

    const newRoadAssets: BuildingData[] = [];
    
    for (let i = 0; i < activeRoadPathIds.length - 1; i++) {
        const startBuilding = buildings.find(b => b.id === activeRoadPathIds[i]);
        const endBuilding = buildings.find(b => b.id === activeRoadPathIds[i+1]);
        if (!startBuilding || !endBuilding) continue;

        const p1 = startBuilding.position;
        const p2 = endBuilding.position;
        
        newRoadAssets.push({
            id: `road-h-${Date.now()}-${i}`,
            position: [(p1[0] + p2[0])/2, 0.1, p1[2]],
            size: [Math.abs(p2[0] - p1[0]) + 4.1, 0.2, 4],
            color: roadColor,
            type: 'ROAD',
            name: 'Transit Pipeline H'
        });
        
        newRoadAssets.push({
            id: `road-v-${Date.now()}-${i}`,
            position: [p2[0], 0.1001, (p1[2] + p2[2])/2],
            size: [4, 0.2, Math.abs(p2[2] - p1[2]) + 4.1],
            color: roadColor,
            type: 'ROAD',
            name: 'Transit Pipeline V'
        });
    }

    setBuildings(prev => [...prev, ...newRoadAssets]);
    setActiveRoadPathIds([]);
    setIsRoadMode(false);
  };

  const handleResetRoadPath = () => setActiveRoadPathIds([]);

  const syncWorldToGrid = (): BlueprintCell[][] => {
    const GRID_SIZE = 16;
    const scale = 12;
    const offset = -(GRID_SIZE * scale) / 2;
    const grid: BlueprintCell[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ type: 'EMPTY' }));

    // Sort buildings by priority: Area < Road < Decor < Structural
    // This ensures structural buildings are processed LAST and overwrite ground assets in the grid sync.
    const priority = (type: any) => {
        if (type === 'AREA') return 0;
        if (type === 'ROAD') return 1;
        if (type === 'DECOR') return 2;
        return 3; // Structural buildings
    };

    const sortedBuildings = [...buildings].sort((a, b) => priority(a.type) - priority(b.type));

    sortedBuildings.forEach(b => {
      const halfW = b.size[0] / 2;
      const halfD = b.size[2] / 2;
      const minX = b.position[0] - halfW;
      const maxX = b.position[0] + halfW;
      const minZ = b.position[2] - halfD;
      const maxZ = b.position[2] + halfD;

      const startCol = Math.max(0, Math.floor((minX - offset) / scale));
      const endCol = Math.min(GRID_SIZE - 1, Math.floor((maxX - offset) / scale));
      const startRow = Math.max(0, Math.floor((minZ - offset) / scale));
      const endRow = Math.min(GRID_SIZE - 1, Math.floor((maxZ - offset) / scale));

      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          let cellType: BlueprintCellType = 'BUILDING';
          if (b.type === 'AREA') cellType = 'AREA';
          else if (b.type === 'ROAD') cellType = 'ROAD';
          else if (b.type === 'DECOR') cellType = 'DECOR';

          // Overwrite with current building info if it's a structural building OR if the cell is empty/lower priority
          grid[r][c] = { 
            type: cellType,
            name: b.name,
            description: b.description,
            marketCap: b.marketCap,
            color: b.color
          };
        }
      }
    });
    return grid;
  };

  const handleOpenBlueprintManual = () => {
    const currentGrid = syncWorldToGrid();
    setPendingBlueprint({
      id: `manual-${Date.now()}`,
      name: 'Current City Sector',
      grid: currentGrid,
      createdAt: Date.now(),
      sourceMetadata: []
    });
    setIsLayoutEditorOpen(true);
  };

  const handleOpenBlueprintWithData = (layout: BlueprintLayout) => {
    const currentGrid = syncWorldToGrid();
    const mergedGrid = layout.grid.map((row, r) => row.map((cell, c) => {
        return cell.type !== 'EMPTY' ? cell : currentGrid[r][c];
    }));
    setPendingBlueprint({ ...layout, grid: mergedGrid });
    setIsLayoutEditorOpen(true);
  };

  const applyBlueprint = (blueprint: BlueprintLayout) => {
    const scale = 12; 
    const gridSize = blueprint.grid.length;
    const offset = -(gridSize * scale) / 2;
    const newBuildings: BuildingData[] = [];
    const visited = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    let colorIndex = 0;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = blueprint.grid[r][c];
        if (cell.type !== 'EMPTY' && !visited[r][c]) {
          const type = cell.type;
          
          if (type === 'AREA' || type === 'ROAD' || type === 'DECOR') {
            const centerX = offset + c * scale + scale/2;
            const centerZ = offset + r * scale + scale/2;
            let h = 0.2;
            let y = 0.1;
            if (type === 'DECOR') { h = 2; y = 1; }
            if (type === 'ROAD') { y = 0.1005; } // Precise micro-offset to prevent z-fighting with areas
            
            newBuildings.push({
                id: `node-${type}-${Date.now()}-${r}-${c}`,
                name: type === 'ROAD' ? 'Transit Pipeline' : (type === 'AREA' ? 'Zoning Zone' : 'Urban Decor'),
                position: [centerX, y, centerZ],
                size: [scale, h, scale],
                color: cell.color || (type === 'ROAD' ? '#111111' : (type === 'AREA' ? '#1e293b' : '#a855f7')),
                type: type as any
            });
            visited[r][c] = true;
          } else {
            const group: { r: number; c: number }[] = [];
            const q = [{ r, c }];
            visited[r][c] = true;
            while (q.length > 0) {
              const curr = q.shift()!;
              group.push(curr);
              [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
                const nr = curr.r + dr, nc = curr.c + dc;
                if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && 
                    blueprint.grid[nr][nc].type === type && !visited[nr][nc]) {
                  visited[nr][nc] = true;
                  q.push({ r: nr, c: nc });
                }
              });
            }
            const minR = Math.min(...group.map(ce => ce.r)), maxR = Math.max(...group.map(ce => ce.r));
            const minC = Math.min(...group.map(ce => ce.c)), maxC = Math.max(...group.map(ce => ce.c));
            const centerX = offset + ((minC + maxC) / 2) * scale + scale/2;
            const centerZ = offset + ((minR + maxR) / 2) * scale + scale/2;
            const meta = blueprint.grid[minR][minC];
            let h = 8 + (group.length * 2);
            let color = meta.color || UNIQUE_PALETTE[colorIndex++ % 50];
            newBuildings.push({
              id: `hub-${Date.now()}-${r}-${c}`,
              name: meta.name || `Building Cluster ${r}-${c}`,
              description: meta.description || 'Infrastructure node.',
              marketCap: meta.marketCap || 500,
              position: [centerX, h / 2, centerZ],
              size: [(maxC - minC + 1) * scale * 0.98, h, (maxR - minR + 1) * scale * 0.98],
              color: color,
              type: 'TOWER'
            });
          }
        }
      }
    }
    setBuildings(newBuildings);
    setIsLayoutEditorOpen(false);
    setTourIndex(0);
  };

  const nextTour = () => setTourIndex((prev) => (prev + 1) % tourableBuildings.length);
  const prevTour = () => setTourIndex((prev) => (prev - 1 + tourableBuildings.length) % tourableBuildings.length);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.4));

  return (
    <div className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <Canvas shadows camera={{ position: [150, 150, 150], fov: 40 }}>
        <animated.color attach="background" args={['#020617']} />
        <animated.fog attach="fog" args={['#020617', 50, 800]} />
        <animated.ambientLight intensity={0.5} />
        <animated.directionalLight position={[100, 200, 100]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Suspense fallback={null}>
            <Environment preset="night" />
            <SkySystem />
            <CameraRig 
                isBuildMode={isBuildMode} 
                isConnectionMode={isConnectionMode} 
                isRoadMode={isRoadMode} 
                focusPosition={tourMode ? currentTourBuilding?.position : null} 
                tourMode={tourMode} 
                zoomLevel={zoomLevel}
            />
            <animated.group>
                {buildings.map((b) => (
                    <Building 
                        key={b.id} 
                        data={b} 
                        isSelected={selectedId === b.id || (tourMode && currentTourBuilding?.id === b.id) || connectionSourceId === b.id || activeRoadPathIds.includes(b.id)} 
                        onSelect={handleSelectBuilding} 
                    />
                ))}
            </animated.group>
            
            <animated.group>
                {selectedId && connections
                    .filter(conn => conn.fromId === selectedId || conn.toId === selectedId)
                    .map((conn) => {
                        const from = buildings.find(b => b.id === conn.fromId);
                        const to = buildings.find(b => b.id === conn.toId);
                        if (!from || !to) return null;
                        return (
                            <ConnectionLine 
                                key={conn.id}
                                connection={conn}
                                start={from.position}
                                end={to.position}
                                isSelected={selectedConnectionId === conn.id}
                                onSelect={setSelectedConnectionId}
                            />
                        );
                })}
            </animated.group>

            <animated.mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <animated.planeGeometry args={[5000, 5000]} />
                <animated.meshStandardMaterial color="#000000" roughness={0.05} metalness={0.9} />
            </animated.mesh>
            <Grid infiniteGrid fadeDistance={800} sectionColor="#06b6d4" cellColor="#083344" sectionSize={5} cellSize={1} position={[0, -0.05, 0]} />
            <ContactShadows resolution={1024} scale={1000} blur={2} opacity={0.4} far={50} color="#000000" />
        </Suspense>
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.02} enableDamping dampingFactor={0.05} />
      </Canvas>

      <div className="absolute top-6 left-6 z-20 flex gap-4">
        <button onClick={() => setIsViewPopupOpen(true)} className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-xl border border-white/10 shadow-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-3 group">
            <i className="fas fa-satellite text-cyan-400 group-hover:rotate-12 transition-transform"></i>
            View Intel
        </button>
        <button onClick={handleOpenBlueprintManual} className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-xl border border-cyan-500/30 shadow-2xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-900/20 transition-all flex items-center gap-3 group">
            <i className="fas fa-microchip text-cyan-400"></i>
            Blueprint Designer
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 w-full max-w-xl px-4">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl flex items-center gap-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full sm:w-auto">
            <button 
                onClick={() => setTourMode(!tourMode)}
                className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 whitespace-nowrap ${tourMode ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'hover:bg-white/5 text-slate-400'}`}
            >
                <i className={`fas ${tourMode ? 'fa-video' : 'fa-street-view'}`}></i>
                {tourMode ? 'Presentation Mode' : 'Free Roam'}
            </button>
            {tourMode && (
                <div className="flex items-center gap-2 border-l border-white/10 pl-4 pr-2 animate-in slide-in-from-left-4 duration-500">
                    <button onClick={prevTour} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-xl text-white transition-all active:scale-90"><i className="fas fa-chevron-left"></i></button>
                    <div className="flex flex-col items-center min-w-[140px]">
                        <span className="text-[8px] font-black text-cyan-500/50 uppercase tracking-[0.2em] mb-1">Telemetry Sync</span>
                        <div className="text-[11px] font-mono text-white font-black uppercase tracking-tight">Target {tourIndex + 1} / {tourableBuildings.length}</div>
                    </div>
                    <button onClick={nextTour} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-xl text-white transition-all active:scale-90"><i className="fas fa-chevron-right"></i></button>
                </div>
            )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="w-12 h-12 bg-slate-900/90 backdrop-blur-md text-white rounded-xl border border-white/10 shadow-2xl flex items-center justify-center hover:bg-slate-800 hover:border-cyan-500/50 transition-all active:scale-90 group">
          <i className="fas fa-plus text-cyan-400 group-hover:scale-110 transition-transform"></i>
        </button>
        <button onClick={handleZoomOut} className="w-12 h-12 bg-slate-900/90 backdrop-blur-md text-white rounded-xl border border-white/10 shadow-2xl flex items-center justify-center hover:bg-slate-800 hover:border-cyan-500/50 transition-all active:scale-90 group">
          <i className="fas fa-minus text-cyan-400 group-hover:scale-110 transition-transform"></i>
        </button>
      </div>

      <Controls 
        selectedBuilding={buildings.find(b => b.id === selectedId) || null} 
        onUpdateBuilding={(id, updates) => setBuildings(prev => prev.map(b => b.id === id ? {...b, ...updates} : b))} 
        onSetBuildings={setBuildings} 
        onSetCity={({ buildings, connections }) => {
            setBuildings(buildings);
            setConnections(connections || []);
            setTourIndex(0);
        }} 
        onOpenBlueprintWithData={handleOpenBlueprintWithData}
        getCurrentGrid={syncWorldToGrid}
        isBuildMode={isBuildMode} onToggleBuildMode={setIsBuildMode} 
        isMoveMode={isMoveMode} onToggleMoveMode={setIsMoveMode} 
        availableSlots={[]} onPreviewSlot={() => {}} 
        onCreateBuilding={() => {}} onMoveBuilding={() => {}} 
        isConnectionMode={isConnectionMode} onToggleConnectionMode={(v) => { setIsConnectionMode(v); setConnectionSourceId(null); setSelectedConnectionId(null); }} 
        selectedConnectionId={selectedConnectionId} 
        onUpdateConnection={(id, updates) => setConnections(prev => prev.map(c => c.id === id ? {...c, ...updates} : c))} 
        isRoadMode={isRoadMode} onToggleRoadMode={(v) => { setIsRoadMode(v); setActiveRoadPathIds([]); }} 
        roads={roads} selectedRoadId={null} onRemoveRoad={() => {}} 
        activeRoadPathIds={activeRoadPathIds}
        onConfirmRoadPath={handleConfirmRoadPath}
        onResetRoadPath={handleResetRoadPath}
        connectionSourceId={connectionSourceId} 
        connections={connections} 
        onRemoveConnection={(id) => setConnections(prev => prev.filter(c => c.id !== id))} 
        allBuildings={buildings} 
      />
      
      <ViewPopup 
        isOpen={isViewPopupOpen} onClose={() => setIsViewPopupOpen(false)} 
        selectedBuilding={buildings.find(b => b.id === selectedId) || null} 
        selectedConnection={connections.find(c => c.id === selectedConnectionId) || null} 
        selectedRoad={null} allBuildings={buildings} 
      />
      <LayoutEditorPopup 
        isOpen={isLayoutEditorOpen} onClose={() => setIsLayoutEditorOpen(false)} 
        onApply={applyBlueprint} initialLayout={pendingBlueprint}
      />
    </div>
  );
};

export default App;
