
import React, { useState, useRef, useEffect } from 'react';
import { BuildingData, Connection, ManualRoad, BlueprintLayout, BlueprintCell, BuildingMetadata } from '../types';

interface AvailableSlot {
  x: number;
  z: number;
  name: string;
}

interface ControlsProps {
  selectedBuilding: BuildingData | null;
  onUpdateBuilding: (id: string, updates: Partial<BuildingData>) => void;
  onSetBuildings: (buildings: BuildingData[]) => void;
  onSetCity: (data: { buildings: BuildingData[], connections: Connection[], roads: ManualRoad[] }) => void;
  onOpenBlueprintWithData: (layout: BlueprintLayout) => void;
  getCurrentGrid: () => BlueprintCell[][];
  isBuildMode: boolean;
  onToggleBuildMode: (isActive: boolean) => void;
  isMoveMode: boolean;
  onToggleMoveMode: (isActive: boolean) => void;
  availableSlots: AvailableSlot[];
  onPreviewSlot: (slot: AvailableSlot | null) => void;
  onCreateBuilding: (slot: AvailableSlot) => void;
  onMoveBuilding: (slot: AvailableSlot) => void;
  isConnectionMode: boolean;
  onToggleConnectionMode: (isActive: boolean) => void;
  selectedConnectionId: string | null;
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
  isRoadMode: boolean;
  onToggleRoadMode: (isActive: boolean) => void;
  roads: ManualRoad[];
  selectedRoadId: string | null;
  onRemoveRoad: (id: string) => void;
  activeRoadPathIds?: string[];
  onConfirmRoadPath?: () => void;
  onResetRoadPath?: () => void;
  connectionSourceId: string | null;
  connections: Connection[];
  onRemoveConnection: (id: string) => void;
  allBuildings: BuildingData[];
}

export const Controls: React.FC<ControlsProps> = ({ 
    selectedBuilding, 
    onUpdateBuilding, 
    onSetBuildings,
    onSetCity,
    onOpenBlueprintWithData,
    getCurrentGrid,
    isBuildMode,
    onToggleBuildMode,
    isMoveMode,
    onToggleMoveMode,
    availableSlots,
    onPreviewSlot,
    onCreateBuilding,
    onMoveBuilding,
    isConnectionMode,
    onToggleConnectionMode,
    selectedConnectionId,
    onUpdateConnection,
    isRoadMode,
    onToggleRoadMode,
    roads,
    selectedRoadId,
    onRemoveRoad,
    activeRoadPathIds = [],
    onConfirmRoadPath,
    onResetRoadPath,
    connections,
    onRemoveConnection,
    allBuildings
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCsvPrompt, setShowCsvPrompt] = useState(false);
  const [pendingImportType, setPendingImportType] = useState<'BUILDING' | 'LINK' | null>(null);
  const [hasImportedBuildings, setHasImportedBuildings] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDarkPanel = isBuildMode || isMoveMode || isRoadMode || isConnectionMode || !!selectedBuilding;

  useEffect(() => {
    if (breadcrumb) {
      const timer = setTimeout(() => setBreadcrumb(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [breadcrumb]);

  const handleSizeChange = (axis: 0 | 1 | 2, value: number) => {
    if (!selectedBuilding) return;
    const newSize = [...selectedBuilding.size] as [number, number, number];
    newSize[axis] = value;
    let newPosition = selectedBuilding.position;
    if (axis === 1) {
        newPosition = [selectedBuilding.position[0], value / 2, selectedBuilding.position[2]];
    }
    onUpdateBuilding(selectedBuilding.id, { size: newSize, position: newPosition });
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
  };

  const handleImportClick = () => setShowCsvPrompt(true);

  const selectImportType = (type: 'BUILDING' | 'LINK') => {
    setPendingImportType(type);
    setShowCsvPrompt(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingImportType) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = event.target?.result as string;
        try {
          if (pendingImportType === 'BUILDING') {
            processBuildingsCsvToBlueprint(data);
            setHasImportedBuildings(true);
            setBreadcrumb("Architectural Sequence Analyzed");
          } else {
            processLinkingCsv(data);
            setBreadcrumb("Network Synchronization Successful");
          }
        } catch (err) {
          console.error(err);
          setBreadcrumb("Import Error");
        }
        setPendingImportType(null);
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const processBuildingsCsvToBlueprint = (csvData: string) => {
    const lines = csvData.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error("CSV has no data rows");
    const headers = parseCSVLine(lines[0]);
    const rows = headers.length > 0 ? lines.slice(1).map(parseCSVLine) : [];
    const idx = {
        name: headers.findIndex(h => h.toLowerCase().includes('company') || h.toLowerCase().includes('name')),
        desc: headers.findIndex(h => h.toLowerCase().includes('desciption') || h.toLowerCase().includes('description')),
        cap: headers.findIndex(h => h.toLowerCase().includes('market') || h.toLowerCase().includes('cap')),
    };

    const sourceMetadata: BuildingMetadata[] = rows.map(r => ({
      name: r[idx.name] || 'Unnamed Building',
      description: r[idx.desc] || 'Infrastructure node.',
      marketCap: parseFloat(r[idx.cap]?.replace(/[^0-9.]/g, '')) || 0
    }));

    const grid = getCurrentGrid();

    onOpenBlueprintWithData({
        id: `import-${Date.now()}`,
        name: 'CSV Infrastructure Import',
        grid,
        createdAt: Date.now(),
        sourceMetadata
    });
  };

  const processLinkingCsv = (csvData: string) => {
    const lines = csvData.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error("CSV has no data rows");
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);
    const idx = {
        headline: headers.findIndex(h => h.toLowerCase().includes('headline')),
        desc: headers.findIndex(h => h.toLowerCase().includes('description')),
        from: headers.findIndex(h => h.toLowerCase().includes('company a')),
        to: headers.findIndex(h => h.toLowerCase().includes('company b')),
        val: headers.findIndex(h => h.toLowerCase().includes('value'))
    };
    const findBuildingIdByName = (name: string) => {
      if (!name) return null;
      const normalized = name.toLowerCase().trim();
      return allBuildings.find(b => b.name?.toLowerCase().includes(normalized) || normalized.includes(b.name?.toLowerCase() || ''))?.id || null;
    };
    const newConnections: Connection[] = rows.map((r, i): Connection | null => {
        const fromId = findBuildingIdByName(r[idx.from]);
        const toId = findBuildingIdByName(r[idx.to]);
        if (!fromId || !toId) return null;
        return {
            id: `csv-link-${i}-${Date.now()}`,
            fromId, toId,
            color: '#3b82f6',
            customText: r[idx.headline] || 'Strategic Partnership',
            description: r[idx.desc] || 'Network connection established.',
            customNumber: parseFloat(r[idx.val]?.replace(/[^0-9.]/g, '')) || 0,
            efficiency: 100
        };
    }).filter((c): c is Connection => c !== null);
    onSetCity({ buildings: allBuildings, connections: newConnections, roads: roads });
  };

  const getBuildingName = (id: string) => allBuildings.find(b => b.id === id)?.name || id;

  const currentConnection = selectedConnectionId ? connections.find(c => c.id === selectedConnectionId) : null;

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
      {breadcrumb && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="bg-emerald-600/90 backdrop-blur-xl border border-emerald-400/30 text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><i className="fas fa-check text-sm"></i></div>
            <span className="font-black text-xs uppercase tracking-widest">{breadcrumb}</span>
          </div>
        </div>
      )}

      {showCsvPrompt && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300 p-4">
           <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] shadow-[0_0_120px_rgba(0,0,0,0.8)] max-w-md w-full text-center space-y-8 transform animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20"><i className="fas fa-file-csv text-5xl text-blue-400"></i></div>
              <div><h2 className="text-2xl font-black text-white uppercase tracking-tight">Dataset Recognition</h2></div>
              <div className="flex flex-col gap-4">
                <button onClick={() => selectImportType('BUILDING')} className="group relative w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl overflow-hidden"><i className="fas fa-building text-lg mr-2"></i> Building Dataset</button>
                <button disabled={!hasImportedBuildings} onClick={() => selectImportType('LINK')} className={`group relative w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all overflow-hidden ${hasImportedBuildings ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}><i className="fas fa-project-diagram text-lg mr-2"></i> Network Links</button>
                <button onClick={() => setShowCsvPrompt(false)} className="w-full py-2 text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-[0.3em] mt-2 transition-colors">Cancel</button>
              </div>
           </div>
        </div>
      )}

      <div className={`absolute top-4 right-4 backdrop-blur-md rounded-xl shadow-2xl z-10 border transition-all duration-300 ease-in-out ${isCollapsed ? 'w-48 p-3' : 'w-80 p-6 max-h-[90vh] overflow-y-auto'} ${isDarkPanel ? 'bg-slate-900/95 border-white/20 text-white' : 'bg-white/95 border-gray-200 text-gray-800'}`}>
        <div className="flex justify-between items-center mb-4">
            <h1 className={`text-xl font-bold flex items-center gap-2 ${isDarkPanel ? 'text-white' : 'text-gray-800'}`}><i className={`fas fa-city ${isDarkPanel ? 'text-blue-400' : 'text-blue-600'}`}></i> {isCollapsed ? 'GenCity' : 'GenCity Builder'}</h1>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDarkPanel ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}><i className={`fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i></button>
        </div>

        {!isCollapsed && (
        <>
          {(isBuildMode || isMoveMode) ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold">{isBuildMode ? 'Expansion Mode' : `Moving ${selectedBuilding?.name}`}</h3><button onClick={() => { onToggleBuildMode(false); onToggleMoveMode(false); }} className="text-gray-400 hover:text-red-500"><i className="fas fa-times"></i></button></div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {availableSlots.length > 0 ? availableSlots.map((slot, i) => (
                          <div key={i} className={`group p-3 border rounded-lg transition-all cursor-pointer flex justify-between items-center ${isDarkPanel ? 'bg-white/5 border-white/10 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'}`} onMouseEnter={() => onPreviewSlot(slot)} onClick={() => isBuildMode ? onCreateBuilding(slot) : onMoveBuilding(slot)}><div className="text-sm font-bold">{slot.name}</div><i className="fas fa-location-arrow text-xs text-blue-500 opacity-0 group-hover:opacity-100"></i></div>
                      )) : <div className="text-xs text-gray-400 text-center py-4">No slots available.</div>}
                  </div>
              </div>
          ) : isRoadMode ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-400">Orthogonal Path Planning</h3>
                    <button onClick={() => onToggleRoadMode(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times"></i></button>
                  </div>
                  
                  <div className="bg-black/40 rounded-lg border border-blue-500/30 p-4 mb-4 space-y-4">
                    <p className="text-[10px] text-blue-300 uppercase tracking-widest font-black">Segment Recording</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono pr-2">
                      {activeRoadPathIds.length === 0 ? (
                        <span className="text-slate-500 italic">Select buildings or road blocks to trace an orthogonal zig-zag route.</span>
                      ) : (
                        activeRoadPathIds.map((id, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-white">
                            <span className="text-blue-500">{idx + 1}.</span>
                            <span className="truncate">{getBuildingName(id)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <button 
                          onClick={onConfirmRoadPath}
                          disabled={activeRoadPathIds.length < 2}
                          className={`py-2 rounded font-black text-[10px] uppercase shadow-lg transition-all ${activeRoadPathIds.length < 2 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                        >
                          Establish Route
                        </button>
                        <button 
                          onClick={onResetRoadPath}
                          className="py-2 bg-slate-800 text-slate-400 hover:text-white rounded font-black text-[10px] uppercase border border-white/5"
                        >
                          Reset
                        </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 italic mb-4 leading-relaxed">
                    Instructions: Click multiple nodes. The path will automatically "zig-zag" at right angles between non-aligned points.
                  </p>
                  
                  <button onClick={() => onToggleRoadMode(false)} className={`w-full py-2 rounded-lg font-bold text-sm shadow-md transition-all ${isDarkPanel ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>Exit Planning</button>
              </div>
          ) : isConnectionMode ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-purple-400">Link Mode</h3><button onClick={() => onToggleConnectionMode(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times"></i></button></div>
                  {selectedConnectionId && currentConnection ? (
                    <div className="mb-6 p-4 bg-black/40 rounded-lg border border-purple-500/30 space-y-4 shadow-inner">
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">Link Telemetry Editor</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-purple-300 font-bold uppercase block mb-1">Header / Headline</label>
                          <input type="text" value={currentConnection.customText || ''} onChange={(e) => onUpdateConnection(selectedConnectionId, { customText: e.target.value })} className="w-full p-2 text-xs bg-slate-800 border border-purple-500/20 rounded text-white focus:outline-none" placeholder="e.g. Strategic Data Tunnel" />
                        </div>
                        <div>
                          <label className="text-[10px] text-purple-300 font-bold uppercase block mb-1">Metric Value (B/T)</label>
                          <input type="number" value={currentConnection.customNumber || 0} onChange={(e) => onUpdateConnection(selectedConnectionId, { customNumber: parseFloat(e.target.value) || 0 })} className="w-full p-2 text-xs bg-slate-800 border border-purple-500/20 rounded text-emerald-400 focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-purple-300 font-bold uppercase block mb-1">Description</label>
                          <textarea value={currentConnection.description || ''} onChange={(e) => onUpdateConnection(selectedConnectionId, { description: e.target.value })} className="w-full p-2 text-xs bg-slate-800 border border-purple-500/20 rounded text-slate-300 h-20 resize-none focus:outline-none" placeholder="Describe the relationship between nodes..." />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                          <button onClick={() => onToggleConnectionMode(false)} className="py-2 bg-purple-600 text-white rounded text-[10px] font-black uppercase hover:bg-purple-700 transition-colors shadow-sm">SAVE INTEL</button>
                          <button onClick={() => onRemoveConnection(selectedConnectionId)} className="py-2 bg-red-950/40 text-red-400 border border-red-500/30 rounded text-[10px] font-black uppercase">DISCARD</button>
                      </div>
                    </div>
                  ) : <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 text-[11px] text-gray-400">Select two hubs to connect.</div>}
                  <button onClick={() => onToggleConnectionMode(false)} className={`w-full py-2 rounded-lg font-bold text-sm shadow-md transition-all ${isDarkPanel ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>Exit Link Mode</button>
              </div>
          ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="grid grid-cols-1 gap-2 mb-6">
                      <button onClick={handleImportClick} className="py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-lg flex flex-col items-center gap-1 transition-all active:scale-95"><i className="fas fa-file-csv"></i><span className="text-[9px] uppercase tracking-tighter">Import CSV</span></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-6">
                      <button onClick={() => onToggleRoadMode(true)} className="py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold shadow-lg flex flex-col items-center gap-1"><i className="fas fa-road"></i><span className="text-[9px] uppercase tracking-tighter">Road Planning</span></button>
                      <button onClick={() => onToggleConnectionMode(true)} className="py-2 bg-purple-500 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg flex flex-col items-center gap-1"><i className="fas fa-project-diagram"></i><span className="text-[9px] uppercase tracking-tighter">Link Editor</span></button>
                  </div>
                  <hr className={`my-6 ${isDarkPanel ? 'border-white/10' : 'border-gray-200'}`} />
                  <div>
                      <div className="flex justify-between items-center mb-4"><h3 className={`text-sm font-semibold uppercase tracking-widest ${isDarkPanel ? 'text-gray-500' : 'text-gray-400'}`}>Selected Unit</h3></div>
                      {selectedBuilding ? (
                      <div className="space-y-4">
                          <div className={`text-xs font-mono p-2 rounded truncate border ${isDarkPanel ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'}`}>{selectedBuilding.name}</div>
                          <div className="space-y-3">
                              {[1].map(axis => (
                                  <div key={axis} className="flex flex-col gap-1">
                                      <span className={`text-[9px] uppercase font-bold ${isDarkPanel ? 'text-gray-500' : 'text-gray-400'}`}>Height</span>
                                      <input type="range" min="1" max={80} step="0.5" value={selectedBuilding.size[axis]} onChange={(e) => handleSizeChange(axis as any, parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                  </div>
                              ))}
                          </div>
                      </div>
                      ) : <div className={`text-center py-6 rounded border border-dashed text-xs ${isDarkPanel ? 'bg-black/20 border-white/10 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-400'}`}>Click a hub to configure</div>}
                  </div>
              </div>
          )}
        </>
        )}
      </div>
    </>
  );
};
