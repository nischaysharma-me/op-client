import React, { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";
import {
  Brain,
  Zap,
  Layers,
  Sparkles,
  Database,
  Crosshair,
  Compass,
  RotateCw,
  Eye,
  Sliders,
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

// 1. Anatomical Real 3D Brain Mesh (with Gyri, Sulci, & Longitudinal Fissure)
const RealAnatomicalBrainMesh: React.FC<{
  accentColor: string;
  secondaryColor: string;
  renderStyle: "hologram" | "cortex" | "contour";
  pulseSpeed: number;
}> = ({ accentColor, secondaryColor, renderStyle, pulseSpeed }) => {
  const { scene } = useGLTF("/models/brain.glb", "/draco/gltf/");
  const groupRef = useRef<THREE.Group>(null!);

  const processedBrain = useMemo(() => {
    const cloned = scene.clone(true);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Center model at origin
    cloned.position.set(-center.x, -center.y, -center.z);

    // Normalize scale to fit nicely in 3D stage
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 5.2 / (maxDimension || 1);
    cloned.scale.set(scale, scale, scale);

    // Apply styled materials based on user's selected render aesthetic
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = (mesh.name || "").toLowerCase();
        const isArtery =
          name.includes("artery") || name.includes("vein") || name.includes("sinus");

        if (renderStyle === "contour") {
          // Inked medical line-art / high-contrast contours matching the uploaded pen-and-ink drawing
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#e2e8f0"),
            emissive: new THREE.Color(isArtery ? secondaryColor : "#0f172a"),
            emissiveIntensity: isArtery ? 0.6 : 0.2,
            roughness: 0.8,
            metalness: 0.1,
            wireframe: false,
          });
        } else if (renderStyle === "cortex") {
          // Shaded organic cerebral cortex
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(isArtery ? "#fbbf24" : accentColor),
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: isArtery ? 0.8 : 0.35,
            roughness: 0.45,
            metalness: 0.55,
            transparent: true,
            opacity: isArtery ? 0.9 : 0.82,
          });
        } else {
          // Glowing translucent cyber hologram
          mesh.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(accentColor),
            emissive: new THREE.Color(isArtery ? secondaryColor : accentColor),
            emissiveIntensity: isArtery ? 1.2 : 0.55,
            roughness: 0.25,
            metalness: 0.85,
            transparent: true,
            opacity: isArtery ? 0.85 : 0.72,
          });
        }
      }
    });

    return cloned;
  }, [scene, accentColor, secondaryColor, renderStyle]);

  useFrame(({ clock }) => {
    if (groupRef.current && renderStyle === "hologram") {
      const elapsed = clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(elapsed * 2.4 * pulseSpeed) * 0.015;
      groupRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.3, 0, 0]}>
      <primitive object={processedBrain} />
    </group>
  );
};

// Fallback Procedural Dual-Hemisphere Brain with Gyri & Longitudinal Fissure
const ProceduralAnatomicalFallback: React.FC<{
  accentColor: string;
  secondaryColor: string;
}> = ({ accentColor, secondaryColor }) => {
  const points = useMemo(() => {
    const coords: [number, number, number][] = [];
    const count = 460;
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 2.35 + (Math.random() - 0.5) * 0.4;

      // Dual hemisphere separation with deep central longitudinal fissure
      const hemisphere = i % 2 === 0 ? 1 : -1;
      const fissureGap = 0.38;
      const x = (r * Math.sin(phi) * Math.cos(theta) * 0.88 + hemisphere * fissureGap);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.72;
      const z = r * Math.cos(phi) * 1.15;

      coords.push([x, y, z]);
    }
    return coords;
  }, []);

  const positions = useMemo(() => {
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color={accentColor}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 2. White Matter Nerve Pathways Running Through Fissures
const NervePathwaysGroup: React.FC<{
  pathways: NervePathwayData[];
  pulseSpeed: number;
}> = ({ pathways }) => {
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
            <bufferAttribute attach="attributes-position" args={[line.positions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={line.color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            linewidth={2}
          />
        </line>
      ))}
    </group>
  );
};

// 3. Action Potential Traveling Synaptic Impulses
const ActionPotentials: React.FC<{
  pathways: NervePathwayData[];
  pulseSpeed: number;
}> = ({ pathways, pulseSpeed }) => {
  const impulseCount = 24;
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
      speed: (0.006 + Math.random() * 0.01) * pulseSpeed,
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        color="#ffffff"
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 4. Interactive Cortical Neurons on Gyri Surface
const NeuronSoma: React.FC<{
  node: NeuronNodeData;
  accentColor: string;
  isSelected: boolean;
  onSelect: (node: NeuronNodeData) => void;
}> = ({ node, accentColor, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  const color = node.type && TYPE_COLORS[node.type] ? TYPE_COLORS[node.type] : accentColor;
  const baseScale = 0.1 + (node.intensity || 0.5) * 0.06;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = clock.getElapsedTime();
    const pulseFactor = 1.0 + Math.sin(elapsed * 4.5 + node.x * 2.0) * 0.14;
    const scale = (hovered || isSelected ? baseScale * 1.7 : baseScale) * pulseFactor;
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
          emissiveIntensity={hovered || isSelected ? 2.2 : 0.9 + (node.intensity || 0.5) * 0.7}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Target Reticle Ring when Selected */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.32, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};

// 5. Latent Embedding Cloud
const LatentEmbeddingCloud: React.FC<{
  secondaryColor: string;
}> = ({ secondaryColor }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const particles = useMemo(() => {
    const coords: [number, number, number][] = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      const r = 2.4 + (Math.random() - 0.5) * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      coords.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.85,
        r * Math.cos(phi) * 1.15,
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
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          color={secondaryColor}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// R3F Brain Scene
const BrainScene: React.FC<{
  accentColor: string;
  secondaryColor: string;
  pulseSpeed: number;
  topology: NeuronNodeData[];
  nervePathways: NervePathwayData[];
  selectedNeuron: NeuronNodeData | null;
  onSelectNeuron: (node: NeuronNodeData) => void;
  renderStyle: "hologram" | "cortex" | "contour";
  showAnatomy: boolean;
  showNeurons: boolean;
  showNerves: boolean;
  showImpulses: boolean;
  showEmbeddings: boolean;
  autoRotate: boolean;
  viewAngle: "top" | "iso" | "profile" | "front";
}> = ({
  accentColor,
  secondaryColor,
  pulseSpeed,
  topology,
  nervePathways,
  selectedNeuron,
  onSelectNeuron,
  renderStyle,
  showAnatomy,
  showNeurons,
  showNerves,
  showImpulses,
  showEmbeddings,
  autoRotate,
  viewAngle,
}) => {
  const controlsRef = useRef<any>(null);

  // Position camera based on perspective view angle
  React.useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    if (viewAngle === "top") {
      // Top-Down Dorsal view matching reference drawing
      ctrl.object.position.set(0, 8.8, 0.05);
      ctrl.target.set(0, 0, 0);
    } else if (viewAngle === "iso") {
      ctrl.object.position.set(0, 4.2, 7.8);
      ctrl.target.set(0, 0, 0);
    } else if (viewAngle === "profile") {
      ctrl.object.position.set(8.5, 0.5, 0);
      ctrl.target.set(0, 0, 0);
    } else if (viewAngle === "front") {
      ctrl.object.position.set(0, 0, 8.8);
      ctrl.target.set(0, 0, 0);
    }
    ctrl.update();
  }, [viewAngle]);

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[6, 12, 6]} intensity={1.4} />
      <directionalLight position={[-6, -10, -6]} intensity={0.8} />
      <pointLight position={[0, 8, 0]} color="#ffffff" intensity={1.2} />
      <pointLight position={[-6, 0, 0]} color={accentColor} intensity={0.9} />
      <pointLight position={[6, 0, 0]} color={secondaryColor} intensity={0.9} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7 * pulseSpeed}
        maxDistance={14}
        minDistance={3.5}
      />

      <Float speed={0.8 * pulseSpeed} rotationIntensity={0.15} floatIntensity={0.25}>
        <group>
          {/* Anatomical 3D Brain Surface with real gyri and sulci */}
          {showAnatomy && (
            <Suspense
              fallback={
                <ProceduralAnatomicalFallback
                  accentColor={accentColor}
                  secondaryColor={secondaryColor}
                />
              }
            >
              <RealAnatomicalBrainMesh
                accentColor={accentColor}
                secondaryColor={secondaryColor}
                renderStyle={renderStyle}
                pulseSpeed={pulseSpeed}
              />
            </Suspense>
          )}

          {/* White Matter Nerve Pathways */}
          {showNerves && (
            <NervePathwaysGroup pathways={nervePathways} pulseSpeed={pulseSpeed} />
          )}

          {/* Action Potential Impulses */}
          {showImpulses && (
            <ActionPotentials pathways={nervePathways} pulseSpeed={pulseSpeed} />
          )}

          {/* Latent Embedding Cloud */}
          {showEmbeddings && <LatentEmbeddingCloud secondaryColor={secondaryColor} />}

          {/* Cortical Neurons (Somas) */}
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

// Root Component
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
  const [showAnatomy, setShowAnatomy] = useState(true);
  const [showNeurons, setShowNeurons] = useState(true);
  const [showNerves, setShowNerves] = useState(true);
  const [showImpulses, setShowImpulses] = useState(true);
  const [showEmbeddings, setShowEmbeddings] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const [renderStyle, setRenderStyle] = useState<"hologram" | "cortex" | "contour">("cortex");
  const [viewAngle, setViewAngle] = useState<"top" | "iso" | "profile" | "front">("iso");

  const [inspectedNeuron, setInspectedNeuron] = useState<NeuronNodeData | null>(null);

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
        <span>Anatomical Cortex 3D Model</span>
        <span className="badge badge--pill badge--tag" style={{ marginLeft: "0.4rem" }}>
          Gyri & Sulci Fissures
        </span>
      </div>

      {/* Top Right Anatomical Controls Toolbar */}
      <div className="neural-brain-canvas__toolbar">
        {/* View Perspective Presets */}
        <div style={{ display: "flex", gap: "0.3rem", background: "rgba(15, 23, 42, 0.8)", padding: "0.2rem", borderRadius: "9999px", border: "1px solid rgba(255, 255, 255, 0.12)" }}>
          <button
            type="button"
            className={`neural-brain-canvas__tool-btn ${viewAngle === "top" ? "neural-brain-canvas__tool-btn--active" : ""}`}
            onClick={() => setViewAngle("top")}
            title="Dorsal Top-Down View (Dual Hemispheres & Central Fissure)"
            style={{ padding: "0.3rem 0.7rem", fontSize: "1.05rem" }}
          >
            <span>Top (Dorsal)</span>
          </button>
          <button
            type="button"
            className={`neural-brain-canvas__tool-btn ${viewAngle === "iso" ? "neural-brain-canvas__tool-btn--active" : ""}`}
            onClick={() => setViewAngle("iso")}
            title="3D Isometric Perspective"
            style={{ padding: "0.3rem 0.7rem", fontSize: "1.05rem" }}
          >
            <span>Isometric</span>
          </button>
          <button
            type="button"
            className={`neural-brain-canvas__tool-btn ${viewAngle === "profile" ? "neural-brain-canvas__tool-btn--active" : ""}`}
            onClick={() => setViewAngle("profile")}
            title="Lateral Profile"
            style={{ padding: "0.3rem 0.7rem", fontSize: "1.05rem" }}
          >
            <span>Lateral</span>
          </button>
        </div>

        {/* Style Selector */}
        <select
          value={renderStyle}
          onChange={(e) => setRenderStyle(e.target.value as any)}
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            color: "#f8fafc",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "var(--radius-sm)",
            padding: "0.35rem 0.7rem",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
          title="Change Brain Render Aesthetic"
        >
          <option value="cortex">🧠 Anatomical Cortex</option>
          <option value="contour">✒️ Inked Contours</option>
          <option value="hologram">⚡ Cyber Hologram</option>
        </select>

        {/* Layer Toggles */}
        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showAnatomy ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowAnatomy(!showAnatomy)}
          title="Toggle Anatomical Gyri Surface"
        >
          <span>Anatomy</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNeurons ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowNeurons(!showNeurons)}
          title="Toggle Cortical Neurons"
        >
          <span>Somas</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNerves ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setShowNerves(!showNerves)}
          title="Toggle White Matter Nerve Pathways"
        >
          <span>Nerves</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${autoRotate ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle 360° Auto-Orbit"
        >
          <RotateCw size={11} />
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 4.2, 7.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <BrainScene
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          pulseSpeed={pulseSpeed}
          topology={topology}
          nervePathways={nervePathways}
          selectedNeuron={inspectedNeuron}
          onSelectNeuron={handleNeuronClick}
          renderStyle={renderStyle}
          showAnatomy={showAnatomy}
          showNeurons={showNeurons}
          showNerves={showNerves}
          showImpulses={showImpulses}
          showEmbeddings={showEmbeddings}
          autoRotate={autoRotate}
          viewAngle={viewAngle}
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
        <span>Use 'Top (Dorsal)' to view dual hemispheres • Drag to Orbit 360° • Click Somas to Probe</span>
      </div>
    </div>
  );
};

export default R3FNeuralBrain;
