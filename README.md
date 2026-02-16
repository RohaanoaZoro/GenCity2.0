# GenCity 3D Builder

An interactive 3D city builder and visualization tool powered by React Three Fiber and Google Gemini AI. Create, edit, and explore stylized cityscapes in real-time with AI-assisted layout generation, network visualization, and blueprint planning.

![React](https://img.shields.io/badge/React-19.2-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.182-black)
![Vite](https://img.shields.io/badge/Vite-6.2-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

---

## Features

### 3D City Editor
- Place, move, and edit buildings in an interactive 3D environment
- 13 building types: GPU, Tower, Area, Road, Decor, Generic, Station, Warehouse, Tank, Hospital, Track, Collider, Tech Park
- Adjustable building height (1–80 units) with real-time preview
- Orbital camera with zoom controls (0.4x – 3x)
- Dynamic lighting, contact shadows, and an infinite grid system
- Animated Tron-style data stream particles in the sky

### AI-Powered City Generation
- Produces 5–12 buildings with names, descriptions, colors, positions, and stats using a CSV upload feature or through a blueprint designer feature.
- Optional — the editor works fully without an API key

### Network Connections
- Draw animated Bezier curve connections between buildings
- Attach metadata: headlines, descriptions, valuation metrics, and efficiency percentages
- Select and inspect connections with a detail view

### Road Planning
- Orthogonal path planner with automatic right-angle routing
- Multi-point road creation between buildings
- Visual segment recording display

### Blueprint Designer
- 16x16 grid-based layout editor
- Drawing tools: Structure, Zone, Transit, Decor
- Auto-map and deploy layouts directly into the 3D scene

### Data Import (CSV)
- Import buildings from CSV (company name, description, market cap)
- Import network links from CSV (Company A, Company B, value, headline, description)
- Auto-matching of building names for link creation

### Presentation Mode
- Guided tour that auto-focuses on each building sequentially
- Previous/Next navigation with telemetry counter
- Toggle between Free Roam and Presentation Mode

### Intel Terminal
- Detailed popup for any selected building or connection
- Displays market cap, dimensional specs, stats (occupancy, energy, stability), and connection details

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.3 |
| 3D Rendering | Three.js | 0.182.0 |
| React 3D Renderer | @react-three/fiber | 9.5.0 |
| 3D Helpers | @react-three/drei | 10.7.7 |
| Animations | @react-spring/three | 10.0.3 |
| AI Generation | @google/genai (Gemini) | 1.37.0 |
| Build Tool | Vite | 6.2.0 |
| Language | TypeScript | 5.8.2 |
| Styling | Tailwind CSS | CDN |
| Icons | Font Awesome | 6.0.0 |

---

## Project Structure

```
├── App.tsx                     # Main app – 3D canvas, camera, scene setup
├── index.tsx                   # React DOM entry point
├── index.html                  # HTML template with CDN imports
├── types.ts                    # TypeScript interfaces and types
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── deploy.sh                   # Ubuntu/Nginx deployment script
├── .env.local                  # Environment variables (API key)
│
├── components/
│   ├── Building.tsx            # 3D building mesh with animations
│   ├── Controls.tsx            # Editor control panel and tools UI
│   ├── ConnectionLine.tsx      # Bezier curve connection visualization
│   ├── ViewPopup.tsx           # Intel terminal detail modal
│   ├── LayoutEditorPopup.tsx   # Blueprint designer grid editor
│   └── Traffic.tsx             # Traffic/movement system
│
└── services/
    └── geminiService.ts        # Gemini AI city generation service
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20.x)
- **npm** 9+
- **Gemini API Key** (optional – only needed for AI generation)

### Installation

```bash
git clone https://github.com/RohaanoaZoro/GenCity2.0.git
cd GenCity2.0
npm install
```

### Configuration

Create a `.env.local` file in the project root (optional):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

### Run (Development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build (Production)

```bash
npm run build
npm run preview
```

The production bundle is output to the `dist/` directory.

---

## Deploy to Ubuntu (AWS EC2 / Any VM)

A deployment script is included that builds the app and serves it via Nginx on port 80.

```bash
# On your Ubuntu VM:
chmod +x deploy.sh

# With API key
export GEMINI_API_KEY="your_key_here"
./deploy.sh

# Or let the script prompt you
./deploy.sh
```

The script handles: system updates, Node.js installation, Nginx setup, production build, and static file serving with gzip and caching.

---

## Usage Guide

### Controls

| Action | Input |
|--------|-------|
| Rotate camera | Right-click drag |
| Pan camera | Middle-click drag |
| Zoom | Scroll wheel or +/- buttons |
| Select building | Left-click |
| Adjust height | Use the height slider in the control panel |

### Modes

- **Default** — Select and configure buildings, import CSV data
- **Road Planning** — Click buildings to create orthogonal routes between them
- **Link Editor** — Create and edit connections between buildings with metadata
- **Blueprint Designer** — Open the 16x16 grid editor to design layouts
- **Presentation Mode** — Auto-tour through all buildings with guided navigation

### CSV Import Format

**Buildings:**
```csv
company name,description,market cap
Nexus Tower,Main data hub,2.5T
Solar Grid,Energy distribution center,1.8B
```

**Network Links:**
```csv
Company A,Company B,value,headline,description
Nexus Tower,Solar Grid,500M,Energy Link,Primary power distribution route
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build in `dist/` |
| `npm run preview` | Preview the production build locally |

---

## License

See [LICENSE](LICENSE) for details.
