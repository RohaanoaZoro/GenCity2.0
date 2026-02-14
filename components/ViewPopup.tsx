
import React from 'react';
import { BuildingData, Connection, ManualRoad } from '../types';

interface ViewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBuilding: BuildingData | null;
  selectedConnection: Connection | null;
  selectedRoad: ManualRoad | null;
  allBuildings: BuildingData[];
}

export const ViewPopup: React.FC<ViewPopupProps> = ({
  isOpen,
  onClose,
  selectedBuilding,
  selectedConnection,
  selectedRoad,
  allBuildings,
}) => {
  if (!isOpen) return null;

  const getBuildingName = (id: string) => {
    return allBuildings.find((b) => b.id === id)?.name || id;
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-[40px] animate-in fade-in duration-300">
      <div className="bg-slate-950 border border-white/20 rounded-[2.5rem] shadow-[0_50px_150px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden transform animate-in zoom-in-95 duration-500 ease-out flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-white/10 bg-white/5 flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <i className="fas fa-satellite-dish text-cyan-400 animate-pulse"></i>
              Intel Terminal
            </h2>
            <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-[0.4em] mt-1">Encrypted Session: Secure Link Established</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-all w-14 h-14 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {selectedConnection ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-4xl font-black text-white tracking-tight leading-tight">{selectedConnection.customText || 'Network Link Architecture'}</h3>
                <p className="text-blue-400 font-mono text-xs mt-3 uppercase tracking-[0.2em] opacity-80">Reference ID: {selectedConnection.id}</p>
              </div>

              <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
                <div className="text-center flex-1">
                  <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Inbound</div>
                  <div className="text-white font-black text-xl tracking-tight">{getBuildingName(selectedConnection.fromId)}</div>
                </div>
                <div className="px-8 relative">
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                    <i className="fas fa-arrow-right text-blue-500 text-3xl relative z-10"></i>
                </div>
                <div className="text-center flex-1">
                  <div className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Outbound</div>
                  <div className="text-white font-black text-xl tracking-tight">{getBuildingName(selectedConnection.toId)}</div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[2rem] border border-white/5">
                <p className="text-slate-400 text-xl leading-relaxed font-medium italic">
                  "{selectedConnection.description || 'Protocols confirm active data transmission and persistent handshake between identified nodes.'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 group hover:border-blue-500/50 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Link Valuation</span>
                  <div className="text-4xl font-mono font-black text-emerald-400">${selectedConnection.customNumber || 0}B</div>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 group hover:border-purple-500/50 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Connection Sync</span>
                  <div className="text-4xl font-mono font-black text-purple-400">{selectedConnection.efficiency || 100}%</div>
                </div>
              </div>
            </div>
          ) : selectedBuilding ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center gap-8 bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                <div 
                  className="w-24 h-24 rounded-[2rem] border-4 border-white/10 shadow-2xl flex-shrink-0 animate-pulse" 
                  style={{ backgroundColor: selectedBuilding.color, boxShadow: `0 0 40px ${selectedBuilding.color}33` }}
                />
                <div>
                  <h3 className="text-5xl font-black text-white tracking-tighter leading-none mb-3">{selectedBuilding.name}</h3>
                  <div className="flex gap-2">
                    <span className="inline-block px-4 py-1.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      {selectedBuilding.type || 'Infrastructure'} Node
                    </span>
                    <span className="inline-block px-4 py-1.5 bg-slate-800 text-slate-400 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-900/50 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-30 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-slate-300 text-2xl leading-relaxed font-light">
                  {selectedBuilding.description || 'A critical structural component within the city grid architecture, managing localized data flows and network stability.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-10 rounded-[2.5rem] border border-emerald-500/20 flex justify-between items-center shadow-2xl">
                  <div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] block mb-3">Asset Valuation</span>
                    <div className="text-6xl font-mono font-black text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                       ${selectedBuilding.marketCap ? (selectedBuilding.marketCap >= 1000 ? `${(selectedBuilding.marketCap/1000).toFixed(2)}T` : `${selectedBuilding.marketCap}B`) : '0B'}
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-chart-line text-4xl text-emerald-500/40"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-widest">Architectural Profile</span>
                  <div className="flex gap-6 font-mono text-sm text-slate-300">
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> W: {selectedBuilding.size[0].toFixed(1)}m</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> H: {selectedBuilding.size[1].toFixed(1)}m</span>
                    <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> D: {selectedBuilding.size[2].toFixed(1)}m</span>
                  </div>
                </div>
                <i className="fas fa-cube text-slate-700 text-2xl"></i>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center space-y-8 animate-pulse">
              <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 relative">
                <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping"></div>
                <i className="fas fa-satellite-dish text-5xl text-slate-600"></i>
              </div>
              <div>
                <h3 className="text-white font-black text-2xl uppercase tracking-[0.3em]">Scanning Network...</h3>
                <p className="text-slate-500 text-sm mt-3 font-mono">Select a physical asset or virtual link to begin decryption.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/10 bg-black/40 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-14 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl transition-all active:scale-95 shadow-[0_10px_40px_rgba(6,182,212,0.3)] uppercase tracking-[0.2em] text-sm"
          >
            Terminal Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
