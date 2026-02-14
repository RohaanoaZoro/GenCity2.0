
import React, { useState, useEffect, useMemo } from 'react';
import { BlueprintLayout, BlueprintCellType, BlueprintCell, BuildingMetadata } from '../types';

interface LayoutEditorPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (layout: BlueprintLayout) => void;
  initialLayout?: BlueprintLayout | null;
}

const GRID_SIZE = 16;

interface Group {
  id: number;
  cells: { r: number; c: number }[];
  bounds: { minR: number; maxR: number; minC: number; maxC: number };
}

export const LayoutEditorPopup: React.FC<LayoutEditorPopupProps> = ({ isOpen, onClose, onApply, initialLayout }) => {
  const [activeTool, setActiveTool] = useState<BlueprintCellType>('BUILDING');
  const [layoutName, setLayoutName] = useState('Sector Alpha Override');
  const [grid, setGrid] = useState<BlueprintCell[][]>(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ type: 'EMPTY' }))
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);

  const dataset = useMemo(() => initialLayout?.sourceMetadata || [], [initialLayout]);

  useEffect(() => {
    if (initialLayout) {
      setGrid(initialLayout.grid);
      setLayoutName(initialLayout.name);
    } else if (isOpen) {
      setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ type: 'EMPTY' })));
      setLayoutName('New Sector Alpha');
    }
    setValidationError(null);
  }, [initialLayout, isOpen]);

  const buildingGroups = useMemo(() => {
    const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    const groups: Group[] = [];
    let groupId = 0;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c].type === 'BUILDING' && !visited[r][c]) {
          const groupCells: { r: number; c: number }[] = [];
          const queue = [{ r, c }];
          visited[r][c] = true;

          while (queue.length > 0) {
            const current = queue.shift()!;
            groupCells.push(current);

            [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
              const nr = current.r + dr, nc = current.c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && grid[nr][nc].type === 'BUILDING' && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.push({ r: nr, c: nc });
              }
            });
          }

          const minR = Math.min(...groupCells.map(ce => ce.r));
          const maxR = Math.max(...groupCells.map(ce => ce.r));
          const minC = Math.min(...groupCells.map(ce => ce.c));
          const maxC = Math.max(...groupCells.map(ce => ce.c));
          
          groups.push({ id: groupId++, cells: groupCells, bounds: { minR, maxR, minC, maxC } });
        }
      }
    }
    return groups;
  }, [grid]);

  const handleAutoLayout = () => {
    if (dataset.length === 0) {
      setValidationError("No data found in ingestion pool to auto-map.");
      return;
    }

    const newGrid: BlueprintCell[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ type: 'EMPTY' }));
    const count = dataset.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const hPadding = 1;
    const vPadding = 1;
    const cellWidth = Math.floor((GRID_SIZE - hPadding) / cols);
    const cellHeight = Math.floor((GRID_SIZE - vPadding) / rows);
    const bSize = Math.max(1, Math.min(cellWidth - 1, cellHeight - 1));

    let placed = 0;
    for (let r = 0; r < rows && placed < count; r++) {
      for (let c = 0; c < cols && placed < count; c++) {
        const startR = r * cellHeight + vPadding;
        const startC = c * cellWidth + hPadding;
        for (let i = 0; i < bSize; i++) {
          for (let j = 0; j < bSize; j++) {
            const tr = startR + i;
            const tc = startC + j;
            if (tr < GRID_SIZE && tc < GRID_SIZE) {
              newGrid[tr][tc] = { type: 'BUILDING' };
            }
          }
        }
        placed++;
      }
    }
    setGrid(newGrid);
    setValidationError(null);
  };

  const handleApply = () => {
    if (dataset.length > 0 && buildingGroups.length !== dataset.length) {
      setValidationError(`Architectural Mismatch: Your dataset requires exactly ${dataset.length} clusters. You have drafted ${buildingGroups.length}. Please sync the blueprint.`);
      return;
    }

    const finalGrid = grid.map(row => row.map(cell => ({ ...cell })));
    buildingGroups.forEach((group, idx) => {
      if (dataset[idx]) {
        const { minR, minC } = group.bounds;
        finalGrid[minR][minC] = {
          ...finalGrid[minR][minC],
          name: dataset[idx].name,
          description: dataset[idx].description,
          marketCap: dataset[idx].marketCap
        };
      }
    });

    onApply({ id: initialLayout?.id || 'temp', name: layoutName, grid: finalGrid, createdAt: Date.now() });
  };

  const getCellColor = (type: BlueprintCellType) => {
    switch (type) {
      case 'BUILDING': return 'bg-cyan-500/80';
      case 'AREA': return 'bg-slate-900 border border-zinc-800 shadow-inner z-10'; 
      case 'ROAD': return 'bg-slate-700 border border-zinc-600 shadow-lg ring-1 ring-white/10 z-20';
      case 'DECOR': return 'bg-purple-500';
      default: return 'bg-slate-900/50 hover:bg-slate-800/80'; 
    }
  };

  const getToolLabel = (tool: BlueprintCellType) => {
    switch (tool) {
        case 'BUILDING': return 'Structure (Towers)';
        case 'AREA': return 'Zone (Ground Area)';
        case 'ROAD': return 'Transit (Transport Route)';
        case 'DECOR': return 'Decor (Props)';
        default: return tool;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-[2.5rem] shadow-[0_0_100px_rgba(6,182,212,0.15)] w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col transform animate-in zoom-in-95 duration-300">
        
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <i className="fas fa-map-marked-alt text-cyan-400"></i>
              Sync Architect
            </h2>
            <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">Ensuring parity between physical city and digital data</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full"><i className="fas fa-times text-2xl"></i></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-white/10 p-6 space-y-6 overflow-y-auto bg-black/20">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">Drawing Tools</span>
              <div className="grid grid-cols-1 gap-2">
                {(['BUILDING', 'AREA', 'ROAD', 'DECOR'] as BlueprintCellType[]).map(tool => (
                  <button key={tool} onClick={() => setActiveTool(tool)} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${activeTool === tool ? 'bg-cyan-500/10 border-cyan-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                    <div className={`w-3 h-3 rounded-sm ${tool === 'BUILDING' ? 'bg-cyan-400' : tool === 'AREA' ? 'bg-slate-900' : tool === 'ROAD' ? 'bg-slate-700' : 'bg-purple-400'}`}></div>
                    <span className="font-black text-[10px] uppercase tracking-widest">{getToolLabel(tool)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ingestion Pool ({dataset.length})</span>
                {dataset.length > 0 && (
                  <button onClick={handleAutoLayout} className="text-[9px] bg-cyan-600/20 text-cyan-400 border border-cyan-400/30 px-2 py-1 rounded-md hover:bg-cyan-600 hover:text-white transition-all font-black uppercase tracking-tighter">Auto-Map</button>
                )}
              </div>
              <div className="space-y-2">
                {dataset.map((meta, i) => (
                  <div key={i} onMouseEnter={() => setHoveredGroupId(i)} onMouseLeave={() => setHoveredGroupId(null)} className={`p-3 rounded-lg border text-left text-[10px] transition-all cursor-default ${buildingGroups[i] ? (hoveredGroupId === i ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300') : 'bg-slate-800 border-white/5 text-slate-500 italic'}`}>
                    <div className="font-black uppercase truncate flex justify-between items-center">
                      <span>{meta.name}</span>
                      {buildingGroups[i] && <span className="bg-cyan-400/20 px-1 rounded text-[8px]">GROUP {i}</span>}
                    </div>
                  </div>
                ))}
                {dataset.length === 0 && <p className="text-[10px] text-slate-600 italic">No dataset pending.</p>}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 p-10 flex flex-col items-center justify-center relative overflow-hidden">
            {validationError && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-lg z-50">
                <div className="bg-red-500/90 backdrop-blur-md border border-red-400 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
                  <i className="fas fa-exclamation-triangle text-xl"></i>
                  <span className="font-black text-[11px] uppercase tracking-widest">{validationError}</span>
                </div>
              </div>
            )}

            <div className="grid gap-[1px] bg-slate-800 p-[1px] rounded-lg border border-white/5 relative z-10" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
              {grid.map((row, r) => row.map((cell, c) => {
                const group = cell.type === 'BUILDING' ? buildingGroups.find(g => g.cells.some(gc => gc.r === r && gc.c === c)) : null;
                const isGroupHovered = group !== null && (group.id === hoveredGroupId);
                return (
                  <button key={`${r}-${c}`} onClick={() => {
                    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
                    newGrid[r][c] = newGrid[r][c].type === activeTool ? { type: 'EMPTY' } : { type: activeTool };
                    setGrid(newGrid);
                    setValidationError(null);
                  }} 
                  onMouseEnter={() => group && setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  className={`w-8 h-8 transition-all flex items-center justify-center relative ${getCellColor(cell.type)} ${isGroupHovered ? 'brightness-125 scale-105 z-20 shadow-lg' : ''}`}>
                    {cell.type === 'BUILDING' && group && (isGroupHovered || hoveredGroupId === group.id) && (
                      <span className="text-[7px] font-black text-white pointer-events-none drop-shadow-md">{group.id}</span>
                    )}
                    {cell.type === 'ROAD' && (
                        <>
                            <div className="absolute w-[2px] h-[60%] bg-white/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none"></div>
                            <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none"></div>
                        </>
                    )}
                  </button>
                );
              }))}
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={() => setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill({ type: 'EMPTY' })))} className="px-6 py-2 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-lg hover:text-white transition-all">Clear Blueprint</button>
              <button onClick={handleApply} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-xl">Deploy City Update</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
