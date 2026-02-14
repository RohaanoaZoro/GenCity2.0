
export interface BuildingStats {
  occupancy: number;
  energy: number;
  stability: number;
}

export interface BuildingMetadata {
  name: string;
  description: string;
  marketCap: number;
}

export interface BuildingData {
  id: string;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: string;
  name?: string;
  description?: string;
  marketCap?: number; 
  stats?: BuildingStats;
  type?: 'GENERIC' | 'GPU' | 'STATION' | 'WAREHOUSE' | 'TANK' | 'HOSPITAL' | 'TOWER' | 'TRACK' | 'COLLIDER' | 'TECH_PARK' | 'DECOR' | 'AREA' | 'ROAD';
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  color: string;
  companyName?: string;
  transferRate?: number; 
  efficiency?: number;   
  totalVolume?: number;  
  customText?: string;   
  customNumber?: number; 
  description?: string;  
}

export interface ManualRoad {
  id: string;
  fromId: string;
  toId: string;
  curvature?: number; 
  width?: number;     
  packetCount?: number; 
  pathPoints?: [number, number, number][]; 
  color?: string; 
}

export type BlueprintCellType = 'EMPTY' | 'BUILDING' | 'AREA' | 'DECOR' | 'ROAD';

export interface BlueprintCell {
  type: BlueprintCellType;
  color?: string;
  name?: string;
  marketCap?: number;
  description?: string;
}

export interface BlueprintLayout {
  id: string;
  name: string;
  grid: BlueprintCell[][]; 
  createdAt: number;
  sourceMetadata?: BuildingMetadata[];
}

export interface CityConfig {
  buildings: BuildingData[];
  connections: Connection[];
  roads: ManualRoad[];
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  PRESENTATION = 'PRESENTATION',
  CONNECTION = 'CONNECTION',
  ROAD = 'ROAD'
}
