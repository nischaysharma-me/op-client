import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface NeuronNodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  cluster: string;
  intensity: number;
  label?: string;
}

interface NeuralBrainCanvasProps {
  agentCode: string;
  accentColor?: string; // Hex color for neurons
  secondaryColor?: string; // Hex color for synapses
  pulseSpeed?: number;
  topology?: NeuronNodeData[];
  onNodeHover?: (node: NeuronNodeData | null) => void;
  interactive?: boolean;
}

const NeuralBrainCanvas: React.FC<NeuralBrainCanvasProps> = ({
  agentCode,
  accentColor = "#38bdf8",
  secondaryColor = "#818cf8",
  pulseSpeed = 1.0,
  topology,
  onNodeHover,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Generate Anatomical Brain Vertices (Neurons)
    const neuronCount = 420;
    const neuronPositions: THREE.Vector3[] = [];
    const neuronColors: number[] = [];

    const baseColor = new THREE.Color(accentColor);
    const pulseColor = new THREE.Color(secondaryColor);

    // Generate dual-hemisphere brain geometry
    for (let i = 0; i < neuronCount; i++) {
      let x = 0, y = 0, z = 0;

      if (topology && i < topology.length) {
        x = topology[i].x;
        y = topology[i].y;
        z = topology[i].z;
      } else {
        // Anatomical dual-hemisphere brain shape
        const u = Math.random();
        const v = Math.random();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const radius = 2.2 + (Math.random() - 0.5) * 0.35;

        const hemisphere = i % 2 === 0 ? 1 : -1;
        x = (radius * Math.sin(phi) * Math.cos(theta) * 0.88 + hemisphere * 0.38);
        y = radius * Math.sin(phi) * Math.sin(theta) * 0.72;
        z = radius * Math.cos(phi) * 1.15;

        // Flatten bottom cerebellum / stem indentation
        if (z < -1.2 && Math.abs(x) < 0.6) {
          y += 0.4;
        }
      }

      const pos = new THREE.Vector3(x, y, z);
      neuronPositions.push(pos);

      // Color variation between base accent and secondary pulse
      const lerpFactor = Math.random() * 0.6;
      const c = baseColor.clone().lerp(pulseColor, lerpFactor);
      neuronColors.push(c.r, c.g, c.b);
    }

    // 3. Points Cloud (Neuron Nodes)
    const pointsGeometry = new THREE.BufferGeometry().setFromPoints(neuronPositions);
    pointsGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(neuronColors, 3)
    );

    // Create glowing circle particle texture programmatically
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.6, baseColor.getStyle());
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvas);

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(pointsMesh);

    // 4. Synaptic Axons (Connecting Lines)
    const linePositions: number[] = [];
    const maxConnectionDistance = 0.78;

    for (let i = 0; i < neuronPositions.length; i++) {
      for (let j = i + 1; j < neuronPositions.length; j++) {
        const dist = neuronPositions[i].distanceTo(neuronPositions[j]);
        if (dist < maxConnectionDistance) {
          linePositions.push(
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

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePositions, 3)
    );

    const linesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(accentColor),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });

    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(linesMesh);

    // 5. Action Potentials / Traveling Neural Impulses
    const impulseCount = 28;
    const impulses: Array<{
      currentT: number;
      speed: number;
      startNode: number;
      endNode: number;
    }> = [];

    for (let k = 0; k < impulseCount; k++) {
      impulses.push({
        currentT: Math.random(),
        speed: (0.006 + Math.random() * 0.012) * pulseSpeed,
        startNode: Math.floor(Math.random() * neuronPositions.length),
        endNode: Math.floor(Math.random() * neuronPositions.length),
      });
    }

    const impulseGeometry = new THREE.BufferGeometry();
    const impulsePositions = new Float32Array(impulseCount * 3);
    impulseGeometry.setAttribute("position", new THREE.BufferAttribute(impulsePositions, 3));

    const impulseMaterial = new THREE.PointsMaterial({
      size: 0.28,
      map: particleTexture,
      color: new THREE.Color("#ffffff"),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const impulseMesh = new THREE.Points(impulseGeometry, impulseMaterial);
    scene.add(impulseMesh);

    // 6. Interactive Mouse Orbit & Parallax
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const brainRotation = { x: 0.2, y: 0 };
    const targetRotation = { x: 0.2, y: 0 };
    let mouseParallax = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseParallax.x = ((e.clientX - rect.left) / width - 0.5) * 0.8;
      mouseParallax.y = ((e.clientY - rect.top) / height - 0.5) * 0.8;

      if (!isDragging || !interactive) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotation.y += deltaX * 0.008;
      targetRotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.005, 5, 14);
    };

    // Touch events for mobile/tablet orbit
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && interactive) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1 && interactive) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        targetRotation.y += deltaX * 0.008;
        targetRotation.x += deltaY * 0.008;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto rotation when not dragging
      if (!isDragging) {
        targetRotation.y += 0.003 * pulseSpeed;
      }

      // Smooth damping
      brainRotation.x += (targetRotation.x - brainRotation.x) * 0.08;
      brainRotation.y += (targetRotation.y - brainRotation.y) * 0.08;

      const groupRotationX = brainRotation.x + mouseParallax.y * 0.2;
      const groupRotationY = brainRotation.y + mouseParallax.x * 0.2;

      pointsMesh.rotation.x = groupRotationX;
      pointsMesh.rotation.y = groupRotationY;
      linesMesh.rotation.x = groupRotationX;
      linesMesh.rotation.y = groupRotationY;
      impulseMesh.rotation.x = groupRotationX;
      impulseMesh.rotation.y = groupRotationY;

      // Pulse synapse opacity rhythmically
      linesMaterial.opacity = 0.16 + Math.sin(elapsedTime * 2.2 * pulseSpeed) * 0.08;

      // Update neural impulses
      const impulsePosAttr = impulseGeometry.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < impulseCount; k++) {
        const imp = impulses[k];
        imp.currentT += imp.speed;
        if (imp.currentT >= 1.0) {
          imp.currentT = 0;
          imp.startNode = imp.endNode;
          imp.endNode = Math.floor(Math.random() * neuronPositions.length);
        }

        const start = neuronPositions[imp.startNode];
        const end = neuronPositions[imp.endNode];
        const currentPos = new THREE.Vector3().lerpVectors(start, end, imp.currentT);

        impulsePosAttr.setXYZ(k, currentPos.x, currentPos.y, currentPos.z);
      }
      impulsePosAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
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
      linesGeometry.dispose();
      linesMaterial.dispose();
      impulseGeometry.dispose();
      impulseMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [agentCode, accentColor, secondaryColor, pulseSpeed, topology, interactive]);

  return (
    <div className="neural-brain-canvas" ref={mountRef}>
      <div className="neural-brain-canvas__badge">
        <span className="neural-brain-canvas__dot" style={{ backgroundColor: accentColor }} />
        <span>3D Synaptic WebGL Core</span>
      </div>

      <div className="neural-brain-canvas__hint">
        <span>Click & Drag to Orbit 360° • Scroll to Zoom</span>
      </div>
    </div>
  );
};

export default NeuralBrainCanvas;
