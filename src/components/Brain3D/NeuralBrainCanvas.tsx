import React, { useEffect, useRef, useState } from "react";
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
  CheckCircle2,
  ExternalLink,
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

interface NeuralBrainCanvasProps {
  agentCode: string;
  accentColor?: string;
  secondaryColor?: string;
  pulseSpeed?: number;
  topology?: NeuronNodeData[];
  nervePathways?: NervePathwayData[];
  selectedNeuronId?: string | null;
  onSelectNeuron?: (node: NeuronNodeData | null) => void;
  onFocusMemory?: (memoryId: string) => void;
  interactive?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  SOLUTION_KNOWLEDGE: "#38bdf8", // Sky Blue
  EPISODIC: "#34d399",           // Emerald Green
  SEMANTIC: "#c084fc",           // Purple / Violet
  REFLEXIVE: "#fbbf24",          // Amber / Gold
};

const NeuralBrainCanvas: React.FC<NeuralBrainCanvasProps> = ({
  agentCode,
  accentColor = "#38bdf8",
  secondaryColor = "#c084fc",
  pulseSpeed = 1.0,
  topology,
  nervePathways,
  selectedNeuronId,
  onSelectNeuron,
  onFocusMemory,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Layer toggles
  const [showNeurons, setShowNeurons] = useState(true);
  const [showNerves, setShowNerves] = useState(true);
  const [showSynapses, setShowSynapses] = useState(true);
  const [showImpulses, setShowImpulses] = useState(true);
  const [showEmbeddings, setShowEmbeddings] = useState(true);

  // Active inspected neuron state
  const [inspectedNeuron, setInspectedNeuron] = useState<NeuronNodeData | null>(null);
  const [synapseFrequency, setSynapseFrequency] = useState(38.4);

  // Ref to hold internal Three.js hooks for camera target / external selection
  const brainStateRef = useRef<{
    selectedNeuronIndex: number | null;
    targetRotation: { x: number; y: number };
    currentRotation: { x: number; y: number };
  }>({
    selectedNeuronIndex: null,
    targetRotation: { x: 0.2, y: 0 },
    currentRotation: { x: 0.2, y: 0 },
  });

  // Keep inspectedNeuron synced when external selectedNeuronId changes
  useEffect(() => {
    if (!topology || topology.length === 0) return;
    if (selectedNeuronId) {
      const idx = topology.findIndex(
        (n) => n.id === selectedNeuronId || n.memoryId === selectedNeuronId
      );
      if (idx !== -1) {
        setInspectedNeuron(topology[idx]);
        brainStateRef.current.selectedNeuronIndex = idx;
      }
    }
  }, [selectedNeuronId, topology]);

  // Minor frequency jitter for live biological feel
  useEffect(() => {
    const interval = setInterval(() => {
      setSynapseFrequency(parseFloat((36 + Math.random() * 8.5).toFixed(1)));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 480;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.075);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold all brain structures for coherent synchronized rotation
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // 2. Texture Generator for glowing spherical neuron somas
    const createParticleTexture = (glowColorHex: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
      gradient.addColorStop(0.45, glowColorHex);
      gradient.addColorStop(0.75, "rgba(10, 20, 40, 0.2)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(canvas);
    };

    const neuronTexture = createParticleTexture(accentColor);
    const impulseTexture = createParticleTexture("#ffffff");

    // 3. Cortical Neurons (Somas)
    const neuronNodes = topology && topology.length > 0 ? topology : [];
    const neuronPositions: THREE.Vector3[] = [];
    const neuronColors: number[] = [];
    const neuronSizes: number[] = [];

    // Fallback if topology is empty
    const nodeCount = Math.max(neuronNodes.length, 90);
    for (let i = 0; i < nodeCount; i++) {
      let x = 0, y = 0, z = 0;
      let colorHex = accentColor;
      let intensity = 0.6;

      if (i < neuronNodes.length) {
        const node = neuronNodes[i];
        x = node.x;
        y = node.y;
        z = node.z;
        intensity = node.intensity || 0.6;
        if (node.type && TYPE_COLORS[node.type]) {
          colorHex = TYPE_COLORS[node.type];
        }
      } else {
        // Anatomical dual-hemisphere brain point distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const radius = 2.25 + (Math.random() - 0.5) * 0.4;
        const hemisphere = i % 2 === 0 ? 1 : -1;
        x = radius * Math.sin(phi) * Math.cos(theta) * 0.88 + hemisphere * 0.38;
        y = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
        z = radius * Math.cos(phi) * 1.15;
      }

      const pos = new THREE.Vector3(x, y, z);
      neuronPositions.push(pos);

      const c = new THREE.Color(colorHex);
      neuronColors.push(c.r, c.g, c.b);
      neuronSizes.push(0.18 + intensity * 0.14);
    }

    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(neuronPositions);
    pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(neuronColors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.22,
      map: neuronTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    brainGroup.add(pointsMesh);

    // 4. White Matter Nerve Tracts / Pathways (Axon Bundles)
    const nerveLinesGroup = new THREE.Group();
    brainGroup.add(nerveLinesGroup);

    const pathways =
      nervePathways && nervePathways.length > 0
        ? nervePathways
        : [
            {
              id: "corpus_callosum",
              color: "#38bdf8",
              points: [
                { x: -1.75, y: 0.35, z: 0.15 },
                { x: -0.9, y: 0.75, z: 0.2 },
                { x: 0, y: 0.95, z: 0.25 },
                { x: 0.9, y: 0.75, z: 0.2 },
                { x: 1.75, y: 0.35, z: 0.15 },
              ],
            },
            {
              id: "frontal_temporal_left",
              color: "#34d399",
              points: [
                { x: -0.75, y: 0.55, z: 1.55 },
                { x: -1.45, y: -0.15, z: 0.75 },
                { x: -1.75, y: -0.55, z: -0.35 },
                { x: -1.2, y: -0.75, z: -0.95 },
              ],
            },
            {
              id: "frontal_temporal_right",
              color: "#34d399",
              points: [
                { x: 0.75, y: 0.55, z: 1.55 },
                { x: 1.45, y: -0.15, z: 0.75 },
                { x: 1.75, y: -0.55, z: -0.35 },
                { x: 1.2, y: -0.75, z: -0.95 },
              ],
            },
            {
              id: "longitudinal_left",
              color: "#c084fc",
              points: [
                { x: -1.15, y: 0.45, z: 1.75 },
                { x: -1.55, y: 0.95, z: 0.4 },
                { x: -1.45, y: 0.75, z: -0.9 },
                { x: -0.85, y: 0.1, z: -1.85 },
              ],
            },
            {
              id: "corticospinal",
              color: "#fbbf24",
              points: [
                { x: 0, y: 0.85, z: 0.05 },
                { x: 0, y: 0.15, z: -0.35 },
                { x: 0, y: -0.75, z: -1.15 },
                { x: 0, y: -1.55, z: -1.75 },
              ],
            },
          ];

    const nerveCurves: THREE.CatmullRomCurve3[] = [];

    pathways.forEach((pathway) => {
      const curvePoints = pathway.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      nerveCurves.push(curve);

      // Render smooth tubular or multi-segment spline line
      const pointsOnCurve = curve.getPoints(50);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pointsOnCurve);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(pathway.color || secondaryColor),
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
      });
      const curveLine = new THREE.Line(lineGeom, lineMat);
      nerveLinesGroup.add(curveLine);

      // Add soft secondary glow halo for the nerve tract
      const glowMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(pathway.color || secondaryColor),
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
      });
      const glowLine = new THREE.Line(lineGeom, glowMat);
      glowLine.scale.set(1.02, 1.02, 1.02);
      nerveLinesGroup.add(glowLine);
    });

    // 5. Inter-Neuron Synaptic Axon Connections (Network lines)
    const synapsePositions: number[] = [];
    const maxConnectionDistance = 0.82;

    for (let i = 0; i < neuronPositions.length; i++) {
      for (let j = i + 1; j < neuronPositions.length; j++) {
        const dist = neuronPositions[i].distanceTo(neuronPositions[j]);
        if (dist < maxConnectionDistance) {
          synapsePositions.push(
            neuronPositions[i].x,
            neuronPositions[i].y,
            neuronPositions[i].z,
            neuronPositions[j].x,
            neuronPositions[j].y,
            neuronPositions[j].z
          );
        }
      }
    }

    const synapseGeometry = new THREE.BufferGeometry();
    synapseGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(synapsePositions, 3)
    );

    const synapseMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(secondaryColor),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });

    const synapseMesh = new THREE.LineSegments(synapseGeometry, synapseMaterial);
    brainGroup.add(synapseMesh);

    // 6. Action Potential Impulses (Traveling along Nerves and Synapses)
    const nerveImpulseCount = 24;
    const nerveImpulses: Array<{
      curveIndex: number;
      t: number;
      speed: number;
      colorHex: string;
    }> = [];

    for (let k = 0; k < nerveImpulseCount; k++) {
      const curveIdx = k % nerveCurves.length;
      nerveImpulses.push({
        curveIndex: curveIdx,
        t: Math.random(),
        speed: (0.005 + Math.random() * 0.009) * pulseSpeed,
        colorHex: pathways[curveIdx]?.color || "#ffffff",
      });
    }

    const impulseGeometry = new THREE.BufferGeometry();
    const impulsePositions = new Float32Array(nerveImpulseCount * 3);
    impulseGeometry.setAttribute("position", new THREE.BufferAttribute(impulsePositions, 3));

    const impulseMaterial = new THREE.PointsMaterial({
      size: 0.28,
      map: impulseTexture,
      color: new THREE.Color("#ffffff"),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const impulseMesh = new THREE.Points(impulseGeometry, impulseMaterial);
    brainGroup.add(impulseMesh);

    // 7. Latent Semantic Embedding Vector Cloud (Subtle high-dimensional field)
    const embeddingFieldCount = 140;
    const embeddingPositions: THREE.Vector3[] = [];
    const embeddingColors: number[] = [];

    for (let e = 0; e < embeddingFieldCount; e++) {
      const parentNeuron = neuronPositions[e % neuronPositions.length];
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.38,
        (Math.random() - 0.5) * 0.38,
        (Math.random() - 0.5) * 0.38
      );
      const ePos = parentNeuron.clone().add(offset);
      embeddingPositions.push(ePos);

      const color = new THREE.Color(e % 2 === 0 ? accentColor : secondaryColor);
      embeddingColors.push(color.r, color.g, color.b);
    }

    const embeddingGeometry = new THREE.BufferGeometry().setFromPoints(embeddingPositions);
    embeddingGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(embeddingColors, 3)
    );

    const embeddingMaterial = new THREE.PointsMaterial({
      size: 0.08,
      map: neuronTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const embeddingMesh = new THREE.Points(embeddingGeometry, embeddingMaterial);
    brainGroup.add(embeddingMesh);

    // 8. Selected Neuron Targeting Reticle / Beacon
    const selectionRingGeom = new THREE.RingGeometry(0.18, 0.24, 32);
    const selectionRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const selectionRingMesh = new THREE.Mesh(selectionRingGeom, selectionRingMat);
    selectionRingMesh.visible = false;
    brainGroup.add(selectionRingMesh);

    // 9. Interactive Raycasting for Neuron Probing
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.28 };
    const mouse = new THREE.Vector2(-999, -999);

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let mouseParallax = { x: 0, y: 0 };

    const updateMouseCoords = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / height) * 2 + 1;
      mouseParallax.x = ((clientX - rect.left) / width - 0.5) * 0.6;
      mouseParallax.y = ((clientY - rect.top) / height - 0.5) * 0.6;
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      updateMouseCoords(clientX, clientY);

      if (!isDragging || !interactive) return;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      brainStateRef.current.targetRotation.y += deltaX * 0.007;
      brainStateRef.current.targetRotation.x += deltaY * 0.007;

      previousMousePosition = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleClick = () => {
      if (!interactive) return;
      // Raycast against neuron points
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(pointsMesh);

      if (intersects.length > 0) {
        const hitIdx = intersects[0].index;
        if (typeof hitIdx === "number" && hitIdx < neuronNodes.length) {
          const node = neuronNodes[hitIdx];
          setInspectedNeuron(node);
          brainStateRef.current.selectedNeuronIndex = hitIdx;
          if (onSelectNeuron) {
            onSelectNeuron(node);
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 5.0, 13.5);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && interactive) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && interactive) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("click", handleClick);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Continuous orbital spin when not user-dragging
      if (!isDragging) {
        brainStateRef.current.targetRotation.y += 0.0022 * pulseSpeed;
      }

      // Smooth damping interpolation
      brainStateRef.current.currentRotation.x +=
        (brainStateRef.current.targetRotation.x - brainStateRef.current.currentRotation.x) * 0.08;
      brainStateRef.current.currentRotation.y +=
        (brainStateRef.current.targetRotation.y - brainStateRef.current.currentRotation.y) * 0.08;

      brainGroup.rotation.x =
        brainStateRef.current.currentRotation.x + mouseParallax.y * 0.25;
      brainGroup.rotation.y =
        brainStateRef.current.currentRotation.y + mouseParallax.x * 0.25;

      // Layer visibilities
      pointsMesh.visible = showNeurons;
      nerveLinesGroup.visible = showNerves;
      synapseMesh.visible = showSynapses;
      impulseMesh.visible = showImpulses;
      embeddingMesh.visible = showEmbeddings;

      // Synapse pulsation
      synapseMaterial.opacity = 0.12 + Math.sin(elapsed * 2.5 * pulseSpeed) * 0.06;

      // Animate action potential impulses along white matter nerve pathways
      if (showImpulses) {
        const impulsePosAttr = impulseGeometry.attributes.position as THREE.BufferAttribute;
        for (let k = 0; k < nerveImpulseCount; k++) {
          const imp = nerveImpulses[k];
          imp.t += imp.speed;
          if (imp.t >= 1.0) {
            imp.t = 0;
            imp.curveIndex = Math.floor(Math.random() * nerveCurves.length);
          }
          const curve = nerveCurves[imp.curveIndex];
          if (curve) {
            const pt = curve.getPoint(imp.t);
            impulsePosAttr.setXYZ(k, pt.x, pt.y, pt.z);
          }
        }
        impulsePosAttr.needsUpdate = true;
      }

      // Highlight inspected neuron with targeting ring
      if (inspectedNeuron) {
        const nPos = new THREE.Vector3(
          inspectedNeuron.x,
          inspectedNeuron.y,
          inspectedNeuron.z
        );
        selectionRingMesh.position.copy(nPos);
        selectionRingMesh.quaternion.copy(camera.quaternion);
        const pulse = 1.0 + Math.sin(elapsed * 6.0) * 0.15;
        selectionRingMesh.scale.set(pulse, pulse, pulse);
        selectionRingMesh.visible = true;
      } else {
        selectionRingMesh.visible = false;
      }

      // Shimmer embedding particles gently
      if (showEmbeddings) {
        embeddingMesh.rotation.y = elapsed * 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // 12. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("click", handleClick);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      pointsGeometry.dispose();
      pointsMaterial.dispose();
      synapseGeometry.dispose();
      synapseMaterial.dispose();
      impulseGeometry.dispose();
      impulseMaterial.dispose();
      embeddingGeometry.dispose();
      embeddingMaterial.dispose();
      selectionRingGeom.dispose();
      selectionRingMat.dispose();
      neuronTexture.dispose();
      impulseTexture.dispose();
      renderer.dispose();
    };
  }, [
    agentCode,
    accentColor,
    secondaryColor,
    pulseSpeed,
    topology,
    nervePathways,
    interactive,
    showNeurons,
    showNerves,
    showSynapses,
    showImpulses,
    showEmbeddings,
    inspectedNeuron,
  ]);

  return (
    <div className="neural-brain-canvas" ref={mountRef}>
      {/* Top Left Live Status & Telemetry Badge */}
      <div className="neural-brain-canvas__badge">
        <span className="neural-brain-canvas__dot" style={{ backgroundColor: accentColor }} />
        <span>3D Cognitive Neural Architecture</span>
        <span className="badge badge--pill badge--tag" style={{ marginLeft: "0.4rem", fontSize: "1.05rem" }}>
          {synapseFrequency} Hz Firing
        </span>
      </div>

      {/* Top Right Anatomical Layer Filter Controls */}
      <div className="neural-brain-canvas__toolbar">
        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNeurons ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowNeurons(!showNeurons);
          }}
          title="Toggle Cortical Neurons (Somas)"
        >
          <span
            className="neural-brain-canvas__tool-dot"
            style={{ backgroundColor: accentColor }}
          />
          <span>Neurons</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showNerves ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowNerves(!showNerves);
          }}
          title="Toggle White Matter Nerve Pathways / Axon Bundles"
        >
          <span
            className="neural-brain-canvas__tool-dot"
            style={{ backgroundColor: "#34d399" }}
          />
          <span>Nerves ({nervePathways?.length || 5})</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showImpulses ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowImpulses(!showImpulses);
          }}
          title="Toggle Synaptic Action Potential Impulses"
        >
          <Zap size={11} style={{ color: "#fbbf24" }} />
          <span>Impulses</span>
        </button>

        <button
          type="button"
          className={`neural-brain-canvas__tool-btn ${showEmbeddings ? "neural-brain-canvas__tool-btn--active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowEmbeddings(!showEmbeddings);
          }}
          title="Toggle Latent Embedding Vector Cloud"
        >
          <Sparkles size={11} style={{ color: "#c084fc" }} />
          <span>Embeddings</span>
        </button>
      </div>

      {/* Interactive Neural Probe HUD (Appears when neuron is clicked or hovered) */}
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

          {/* Action Potential Firing Bar */}
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

          {/* 1024-d Sample Latent Embedding Vector Dimensions */}
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

          {/* Memory Bank Link */}
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

      {/* Bottom Center Navigation Guide */}
      <div className="neural-brain-canvas__hint">
        <Compass size={12} style={{ marginRight: "0.4rem", display: "inline" }} />
        <span>Click Any Neuron to Probe Embeddings • Drag to Orbit 360° • Scroll to Zoom</span>
      </div>
    </div>
  );
};

export default NeuralBrainCanvas;
