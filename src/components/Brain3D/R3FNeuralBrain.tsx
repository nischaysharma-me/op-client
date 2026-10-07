import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Sphere, Float } from "@react-three/drei";
import * as THREE from "three";
import {
  Brain,
  Zap,
  Layers,
  Sparkles,
  Database,
  Crosshair,
  Compass,
  Activity,
  RotateCw,
  Eye,
  CheckCircle2,
} from "lucide-react";

export interface NeuronNodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  cluster: string;
  intensity: number;
  label: string;
  lobe?: string;
  type?: string;
  memoryId?: string;
  vectorPreview?: number[];
}

export interface NervePathwayData {
  id: string;
  name: string;
  description: string;
  color: string;
  points: Array<{ x: number; y: number; z: number }>;
}

interface R3FNeuralBrainProps {
  agentCode: string;
  accentColor?: string;
  secondaryColor?: string;
  pulseSpeed?: number;
  topology?: NeuronNodeData[];
  nervePathways?: NervePathwayData[];
  selectedNeuronId?: string | null;
  onSelectNeuron?: (node: NeuronNodeData | null) => void;
  onFocusMemory?: (memoryId: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  SOLUTION_KNOWLEDGE: "#38bdf8", // Sky Blue
  EPISODIC: "#34d399",           // Emerald Green
  SEMANTIC: "#c084fc",           // Purple / Violet
  REFLEXIVE: "#fbbf24",          // Amber / Gold
};

// 1. Brain Holographic Cage / Point Cloud Silhouette
const BrainSilhouette: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const count = 380;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const radius = 2.4 + (Math.random() - 0.5) * 0.45;
      const hemisphere = i % 2 === 0 ? 1 : -1;
      const x = radius * Math.sin(phi) * Math.cos(theta) * 0.9 + hemisphere * 0.38;
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.74;
      const z = radius * Math.cos(phi) * 1.15;
      pts.push([x, y, z]);
    }
    return pts;
  }, []);

  const pointPositions = useMemo(() => {
    const flat = new Float32Array(points.length * 3);
    points.forEach((p, idx) => {
      flat[idx * 3] = p[0];
      flat[idx * 3 + 1] = p[1];
      flat[idx * 3 + 2] = p[2];
    });
    return flat;
  }, [points]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[pointPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={accentColor}
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 2. White Matter Nerve Tracts (3D Spline Curves)
const NervePathwaysGroup: React.FC<{
  pathways: NervePathwayData[];
  pulseSpeed: number;
}> = ({ pathways, pulseSpeed }) => {
  const splineLines = useMemo(() => {
    return pathways.map((pw) => {
      const curvePoints = pw.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const sampled = curve.getPoints(50);
      const flatPositions = new Float32Array(sampled.length * 3);
      sampled.forEach((pt, i) => {
        flatPositions[i * 3] = pt.x;
        flatPositions[i * 3 + 1] = pt.y;
        flatPositions[i * 3 + 2] = pt.z;
      });
      return {
        id: pw.id,
        color: pw.color,
        positions: flatPositions,
      };
    });
  }, [pathways]);

  return (
    <group>
      {splineLines.map((line) => (
        <line key={line.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[line.positions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={line.color}
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
            linewidth={2}
          />
        </line>
      ))}
    </group>
  );
};

// 3. Traveling Action Potential Impulses
const ActionPotentials: React.FC<{
  pathways: NervePathwayData[];
  pulseSpeed: number;
}> = ({ pathways, pulseSpeed }) => {
  const impulseCount = 20;
  const pointsRef = useRef<THREE.Points>(null!);

  const curves = useMemo(() => {
    return pathways.map((pw) => {
      const curvePoints = pw.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      return new THREE.CatmullRomCurve3(curvePoints);
    });
  }, [pathways]);

  const impulses = useMemo(() => {
    return Array.from({ length: impulseCount }).map((_, i) => ({
      curveIdx: i % Math.max(1, curves.length),
      t: Math.random(),
      speed: (0.005 + Math.random() * 0.009) * pulseSpeed,
    }));
  }, [curves, pulseSpeed]);

  const positions = useMemo(() => new Float32Array(impulseCount * 3), [impulseCount]);

  useFrame(() => {
    if (!pointsRef.current || curves.length === 0) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    impulses.forEach((imp, i) => {
      imp.t += imp.speed;
      if (imp.t >= 1) {
        imp.t = 0;
        imp.curveIdx = Math.floor(Math.random() * curves.length);
      }
      const curve = curves[imp.curveIdx];
      if (curve) {
        const pt = curve.getPoint(imp.t);
        attr.setXYZ(i, pt.x, pt.y, pt.z);
      }
    });

    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.24}
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 4. Inter-Neuron Synaptic Connections (Dendritic Mesh)
const SynapticMesh: React.FC<{
  nodes: NeuronNodeData[];
  secondaryColor: string;
  pulseSpeed: number;
}> = ({ nodes, secondaryColor, pulseSpeed }) => {
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null!);

  const linePositions = useMemo(() => {
    const coords: number[] = [];
    const maxDist = 0.85;

    for (let i = 0; i < nodes.length; i++) {
      const p1 = new THREE.Vector3(nodes[i].x, nodes[i].y, nodes[i].z);
      for (let j = i + 1; j < nodes.length; j++) {
        const p2 = new THREE.Vector3(nodes[j].x, nodes[j].y, nodes[j].z);
        if (p1.distanceTo(p2) < maxDist) {
          coords.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }
      }
    }
    return new Float32Array(coords);
  }, [nodes]);

  useFrame(({ clock }) => {
    if (lineMatRef.current) {
      const elapsed = clock.getElapsedTime();
      lineMatRef.current.opacity = 0.14 + Math.sin(elapsed * 2.8 * pulseSpeed) * 0.08;
    }
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[linePositions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={lineMatRef}
        color={secondaryColor}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

// 5. Individual Cortical Neuron (Soma) with Hover & Click Interaction
const NeuronSoma: React.FC<{
  node: NeuronNodeData;
  accentColor: string;
  isSelected: boolean;
  onSelect: (node: NeuronNodeData) => void;
}> = ({ node, accentColor, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = node.type && TYPE_COLORS[node.type] ? TYPE_COLORS[node.type] : accentColor;
  const baseScale = 0.09 + (node.intensity || 0.5) * 0.06;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = clock.getElapsedTime();
    const pulseFactor = 1.0 + Math.sin(elapsed * 4.0 + node.x * 2.0) * 0.12;
    const scale = (hovered || isSelected ? baseScale * 1.6 : baseScale) * pulseFactor;
    meshRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.8 : 0.8 + (node.intensity || 0.5) * 0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Target Reticle Ring when Selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.28, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};

// 6. Latent Embedding Vector Cloud
const LatentEmbeddingCloud: React.FC<{
  accentColor: string;
  secondaryColor: string;
}> = ({ accentColor, secondaryColor }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const particles = useMemo(() => {
    const coords: [number, number, number][] = [];
    const count = 160;
    for (let i = 0; i < count; i++) {
      const r = 2.1 + (Math.random() - 0.5) * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      coords.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.85,
        r * Math.cos(phi) * 1.1,
      ]);
    }
    const flat = new Float32Array(count * 3);
    coords.forEach((c, idx) => {
      flat[idx * 3] = c[0];
      flat[idx * 3 + 1] = c[1];
      flat[idx * 3 + 2] = c[2];
    });
    return flat;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color={secondaryColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// Scene Root
const BrainScene: React.FC<{
  agentCode: string;
  accentColor: string;
  secondaryColor: string;
  pulseSpeed: number;
  topology: NeuronNodeData[];
  nervePathways: NervePathwayData[];
  selectedNeuron: NeuronNodeData | null;
  onSelectNeuron: (node: NeuronNodeData) => void;
  showNeurons: boolean;
  showNerves: boolean;
  showSynapses: boolean;
  showImpulses: boolean;
  showEmbeddings: boolean;
  showCage: boolean;
  autoRotate: boolean;
}> = ({
  accentColor,
  secondaryColor,
  pulseSpeed,
  topology,
  nervePathways,
  selectedNeuron,
  onSelectNeuron,
  showNeurons,
  showNerves,
  showSynapses,
  showImpulses,
  showEmbeddings,
  showCage,
  autoRotate,
}) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-6, -6, -6]} color={accentColor} intensity={0.9} />
      <pointLight position={[6, 6, 6]} color={secondaryColor} intensity={0.9} />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.8 * pulseSpeed}
        maxDistance={14}
        minDistance={4}
      />

      <Float speed={0.9 * pulseSpeed} rotationIntensity={0.2} floatIntensity={0.3}>
        <group>
          {showCage && <BrainSilhouette accentColor={accentColor} />}

          {showSynapses && (
            <SynapticMesh
              nodes={topology}
              secondaryColor={secondaryColor}
              pulseSpeed={pulseSpeed}
            />
          )}

          {showNerves && (
            <NervePathwaysGroup
              pathways={nervePathways}
              pulseSpeed={pulseSpeed}
            />
          )}

          {showImpulses && (
            <ActionPotentials
              pathways={nervePathways}
              pulseSpeed={pulseSpeed}
            />
          )}

          {showEmbeddings && (
            <LatentEmbeddingCloud
              accentColor={accentColor}
              secondaryColor={secondaryColor}
            />
          )}

          {showNeurons &&
            topology.map((node) => (
              <NeuronSoma
                key={node.id}
                node={node}
                accentColor={accentColor}
                isSelected={selectedNeuron?.id === node.id}
                onSelect={onSelectNeuron}
              />
            ))}
        </group>
      </Float>
    </>
  );
};

// Main Component
const R3FNeuralBrain: React.FC<R3FNeuralBrainProps> = ({
  agentCode,
  accentColor = "#38bdf8",
  secondaryColor = "#c084fc",
  pulseSpeed = 1.0,
  topology = [],
  nervePathways = [],
  selectedNeuronId,
  onSelectNeuron,
  onFocusMemory,
}) => {
  const [showNeurons, setShowNeurons] = useState(true);
  const [showNerves, setShowNerves] = useState(true);
  const [showSynapses, setShowSynapses] = useState(true);
  const [showImpulses, setShowImpulses] = useState(true);
  const [showEmbeddings, setShowEmbeddings] = useState(true);
  const [showCage, setShowCage] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  const [inspectedNeuron, setInspectedNeuron] = useState<NeuronNodeData | null>(null);

  // Sync selectedNeuronId if provided externally
  React.useEffect(() => {
    if (selectedNeuronId && topology.length > 0) {
      const match = topology.find(
        (n) => n.id === selectedNeuronId || n.memoryId === selectedNeuronId
      );
      if (match) {
        setInspectedNeuron(match);
      }
    }
  }, [selectedNeuronId, topology]);

  const handleNeuronClick = (node: NeuronNodeData) => {
    setInspectedNeuron(node);
    if (onSelectNeuron) {
      onSelectNeuron(node);
    }
  };

  return (
    <div className="neural-brain-canvas">
      {/* Top Left Live R3F Telemetry Badge */}
      <div className="neural-brain-canvas__badge">
        <span className="neural-brain-canvas__dot" style={{ backgroundColor: accentColor }} />
        <span>R3F High-Fidelity Neural Engine</span>
        <span className="badge badge--pill badge--tag" style={{ marginLeft: "0.4rem" }}>
          WebGL2 • 60 FPS
        </span>
      </div>

      {/* Top Right Anatomical Layer Filter Controls */}
      <div className="neural-brain-canvas__toolbar">
        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNeurons ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowNeurons(!showNeurons)}
          title="Toggle Cortical Neurons (Somas)"
        >
          <span className="neural-brain-canvas__tool-dot" style={{ backgroundColor: accentColor }} />
          <span>Neurons</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNerves ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowNerves(!showNerves)}
          title="Toggle White Matter Nerve Pathways"
        >
          <span className="neural-brain-canvas__tool-dot" style={{ backgroundColor: "#34d399" }} />
          <span>Nerves ({nervePathways.length})</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showImpulses ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowImpulses(!showImpulses)}
          title="Toggle Synaptic Action Potential Impulses"
        >
          <Zap size={11} style={{ color: "#fbbf24" }} />
          <span>Impulses</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showEmbeddings ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowEmbeddings(!showEmbeddings)}
          title="Toggle Latent Embedding Cloud"
        >
          <Sparkles size={11} style={{ color: "#c084fc" }} />
          <span>Embeddings</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${autoRotate ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle 360° Auto-Orbit"
        >
          <RotateCw size={11} />
          <span>Orbit</span>
        </button>
      </div>

      {/* 3D Canvas with React Three Fiber */}
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <BrainScene
          agentCode={agentCode}
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          pulseSpeed={pulseSpeed}
          topology={topology}
          nervePathways={nervePathways}
          selectedNeuron={inspectedNeuron}
          onSelectNeuron={handleNeuronClick}
          showNeurons={showNeurons}
          showNerves={showNerves}
          showSynapses={showSynapses}
          showImpulses={showImpulses}
          showEmbeddings={showEmbeddings}
          showCage={showCage}
          autoRotate={autoRotate}
        />
      </Canvas>

      {/* Interactive Neural Probe HUD */}
      {inspectedNeuron && (
        <div className="neural-brain-canvas__probe-panel">
          <div className="neural-brain-canvas__probe-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Crosshair size={14} style={{ color: accentColor }} />
              <strong style={{ color: "#f8fafc", fontSize: "1.2rem" }}>
                {inspectedNeuron.lobe || "Cortical Node"}
              </strong>
            </div>
            <button
              type="button"
              className="neural-brain-canvas__probe-close"
              onClick={() => setInspectedNeuron(null)}
            >
              ✕
            </button>
          </div>

          <p className="neural-brain-canvas__probe-label">{inspectedNeuron.label}</p>

          <div className="neural-brain-canvas__probe-bar-row">
            <span style={{ fontSize: "1.05rem", color: "#94a3b8" }}>Synaptic Action Potential</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8" }}>
              {Math.round(inspectedNeuron.intensity * 100)}%
            </span>
          </div>
          <div className="neural-brain-canvas__probe-bar-track">
            <div
              className="neural-brain-canvas__probe-bar-fill"
              style={{
                width: `${Math.round(inspectedNeuron.intensity * 100)}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>

          {inspectedNeuron.vectorPreview && (
            <div className="neural-brain-canvas__probe-vector">
              <span className="neural-brain-canvas__probe-dim-label">
                1024-d Embedding Latent Preview:
              </span>
              <div className="neural-brain-canvas__probe-dim-pills">
                {inspectedNeuron.vectorPreview.slice(0, 6).map((val, idx) => (
                  <span
                    key={idx}
                    className="neural-brain-canvas__probe-dim-pill"
                    style={{
                      color: val >= 0 ? "#38bdf8" : "#fb7185",
                      borderColor: val >= 0 ? "rgba(56,189,248,0.25)" : "rgba(251,113,133,0.25)",
                    }}
                  >
                    {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {inspectedNeuron.memoryId && onFocusMemory && (
            <button
              type="button"
              className="btn btn--primary btn--sm neural-brain-canvas__probe-focus-btn"
              onClick={() => onFocusMemory(inspectedNeuron.memoryId!)}
            >
              <Database size={12} />
              <span>Inspect Memory Record</span>
            </button>
          )}
        </div>
      )}

      {/* Navigation Hint */}
      <div className="neural-brain-canvas__hint">
        <Compass size={12} style={{ marginRight: "0.4rem", display: "inline" }} />
        <span>Click Somas to Probe Embeddings • Drag to Rotate 360° • Scroll to Zoom</span>
      </div>
    </div>
  );
};

export default R3FNeuralBrain;
