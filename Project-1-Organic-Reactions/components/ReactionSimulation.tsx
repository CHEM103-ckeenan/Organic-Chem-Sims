import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Info, Settings2, Eye, EyeOff, Timer, SkipForward } from 'lucide-react';
import EnergyDiagram from './EnergyDiagram';
import { Atom } from '../types';

const ReactionSimulation: React.FC = () => {
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [showArrows, setShowArrows] = useState(true);
  const [showDistances, setShowDistances] = useState(false);
  
  // Pause Feature State
  const [autoPauseAtTS, setAutoPauseAtTS] = useState(true);
  const [isPausedAtTS, setIsPausedAtTS] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState(0);
  const hasPausedRef = useRef(false);
  const countdownIntervalRef = useRef<number | null>(null);
  
  const requestRef = useRef<number | null>(null);

  // Animation Loop
  const animate = () => {
    setProgress((prev) => {
      // Check for Transition State Pause (at 50%)
      if (autoPauseAtTS && !hasPausedRef.current && prev < 50 && (prev + 0.125) >= 50) {
        return 50; // Snap to TS and wait for effect to handle pause
      }

      // Reduced speed from 0.25 to 0.125 (50% slower)
      const next = prev + 0.125;
      if (next >= 100) {
        setIsPlaying(false);
        return 100;
      }
      return next;
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  // Handle TS Pause Effect
  useEffect(() => {
    if (progress === 50 && autoPauseAtTS && !hasPausedRef.current && isPlaying) {
      setIsPlaying(false);
      setIsPausedAtTS(true);
      hasPausedRef.current = true;
      setResumeCountdown(3);

      countdownIntervalRef.current = window.setInterval(() => {
        setResumeCountdown((prev) => {
          if (prev <= 1) {
            handleResume();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [progress, autoPauseAtTS, isPlaying]);

  const handleResume = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsPausedAtTS(false);
    setResumeCountdown(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setProgress(0);
    setIsPlaying(false);
    hasPausedRef.current = false;
    setIsPausedAtTS(false);
    setResumeCountdown(0);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const handleSeek = (val: number) => {
    setProgress(val);
    setIsPlaying(false);
    setIsPausedAtTS(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (val < 49) hasPausedRef.current = false;
  };

  const togglePlay = () => {
      if (isPausedAtTS) {
          handleResume();
      } else {
          setIsPlaying(!isPlaying);
      }
  };

  // Normalized time (0.0 to 1.0)
  const t = progress / 100; 

  // --- COORDINATE GEOMETRY (Unit: Pixels approx. scaled to Angstroms) ---
  // Scale: 40px = 1 Angstrom
  
  // 1. Carbon (Central)
  const carbon: Atom = {
    id: 'C',
    element: 'C',
    x: 0,
    y: 0,
    z: 0,
    color: '#334155', // Slate-700
    radius: 34 // Scaled up from 25
  };

  // 2. Nucleophile (Nu) - Approaching from LEFT
  // Start (t=0): 5A away = -200px
  // TS (t=0.5): 2.4A away = -96px (Widened for clarity)
  // End (t=1): ~1.5A bonded = -60px
  const getNuX = (time: number) => {
      if (time <= 0.5) {
          // -200 -> -96 over 0.5s
          // Slope = (-96 - (-200)) / 0.5 = 104 / 0.5 = 208
          return -200 + (208 * time); 
      } else {
          // -96 -> -60 over 0.5s
          // Slope = (-60 - (-96)) / 0.5 = 36 / 0.5 = 72
          return -96 + (72 * (time - 0.5));
      }
  };
  const nuAtom: Atom = {
    id: 'Nu',
    element: 'Nu',
    x: getNuX(t),
    y: 0,
    z: 0,
    color: '#d946ef', // Magenta-500
    radius: 30 // Scaled up from 22
  };

  // 3. Bromine (Br) - Leaving to RIGHT
  // Start (t=0): ~1.9A bonded = 75px
  // TS (t=0.5): 2.7A breaking = 108px (Widened for clarity)
  // End (t=1): 5A away = 200px
  const getBrX = (time: number) => {
      if (time <= 0.5) {
          // 75 -> 108 over 0.5s
          // Slope = (108 - 75) / 0.5 = 33 / 0.5 = 66
          return 75 + (66 * time);
      } else {
          // 108 -> 200 over 0.5s
          // Slope = (200 - 108) / 0.5 = 92 / 0.5 = 184
          return 108 + (184 * (time - 0.5));
      }
  };
  const brAtom: Atom = {
    id: 'Br',
    element: 'Br',
    x: getBrX(t),
    y: 0,
    z: 0,
    color: '#991b1b', // Red-800
    radius: 32 // Scaled up from 24
  };

  // 4. Hydrogens (The Umbrella Flip / Walden Inversion)
  // Reactants (t=0): Pointing LEFT (away from Br). x ~ -20
  // TS (t=0.5): PLANAR. x = 0
  // Products (t=1): Pointing RIGHT (away from Nu). x ~ +20
  
  const getHX = (time: number) => {
      // Linear inversion: -20 -> 20
      return -20 + (40 * time);
  };
  
  const hRadius = 65; // Scaled up from 45 to accommodate larger C
  const hAngles = [90, 210, 330];
  
  const hydrogens: Atom[] = hAngles.map((angle, i) => {
    const rad = (angle * Math.PI) / 180;
    // Slight rotation around X-axis for 3D feel during reaction
    const rotation = t * 1.5; 
    const effectiveAngle = rad + rotation;
    
    return {
      id: `H${i}`,
      element: 'H',
      x: getHX(t),
      y: hRadius * Math.cos(effectiveAngle),
      z: hRadius * Math.sin(effectiveAngle),
      color: '#f8fafc', // Slate-50
      radius: 24 // Scaled up from 18
    };
  });

  const allAtoms = [carbon, nuAtom, brAtom, ...hydrogens];
  // Sort for depth (painter's algo)
  allAtoms.sort((a, b) => b.z - a.z);

  // Projection Logic
  const project = (atom: Atom) => {
    const focalLength = 600; // Increased from 300 to reduce perspective distortion (flatten the view)
    const scale = focalLength / (focalLength - atom.z);
    // Shifted Y to 160 to center vertically better
    return {
      cx: 300 + atom.x * scale, // SVG Center X
      cy: 160 + atom.y * scale, // SVG Center Y (shifted to 160)
      r: atom.radius * scale,
      opacity: Math.max(0.3, Math.min(1, 0.4 + scale * 0.6))
    };
  };

  // --- RENDERING HELPERS ---

  // Curved Arrow (Quadratic Bezier)
  const renderElectronArrow = () => {
    if (!showArrows || t > 0.45) return null; // Hide as reaction proceeds
    
    const pNu = project(nuAtom);
    const pC = project(carbon);
    
    const cpx = (pNu.cx + pC.cx) / 2;
    const cpy = pNu.cy - 70; // Adjusted for larger atoms

    return (
      <g opacity={1 - (t / 0.45)}>
        <path
          d={`M ${pNu.cx} ${pNu.cy - 25} Q ${cpx} ${cpy} ${pC.cx - 15} ${pC.cy}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeDasharray="6,3"
          markerEnd="url(#arrowhead)"
        />
        <circle cx={pNu.cx} cy={pNu.cy - 25} r={4} fill="#3b82f6" />
        <text x={cpx} y={cpy - 12} fill="#3b82f6" fontSize="14" fontWeight="bold">Attack</text>
      </g>
    );
  };

  const renderLeavingArrow = () => {
    if (!showArrows || t < 0.3 || t > 0.7) return null;
    
    const pC = project(carbon);
    const pBr = project(brAtom);
    
    const startX = (pC.cx + pBr.cx) / 2;
    const startY = (pC.cy + pBr.cy) / 2;
    const endX = pBr.cx + pBr.r * 0.6;
    const endY = pBr.cy - pBr.r * 0.9;

    const cpX = startX + (endX - startX) / 2;
    const cpY = startY - 70; 

    let opacity = 1;
    if (t < 0.35) opacity = (t - 0.3) / 0.05;
    if (t > 0.65) opacity = (0.7 - t) / 0.05;

    return (
      <g opacity={opacity}>
        <path
          d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`}
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
          strokeDasharray="6,3"
          markerEnd="url(#arrowhead-red)"
        />
        <text x={cpX} y={cpY - 8} fill="#ef4444" fontSize="14" fontWeight="bold" textAnchor="middle">Leaving</text>
      </g>
    );
  };

  const renderOrbitals = () => {
      // Show orbitals if Distances/Details toggle is ON
      if (!showDistances) return null;

      const pC = project(carbon);
      // Simplified p-orbital lobe representation at TS
      const opacity = Math.max(0, 1 - Math.abs(t - 0.5) * 4); 
      if (opacity <= 0) return null;

      // Scaled up styling
      const rx = 35 * 0.8;
      const ry = 22 * 0.8;

      return (
          <g opacity={opacity} style={{ mixBlendMode: 'multiply' }}>
              {/* Left Lobe (Bonding with Nu) - Pale Blue */}
              <ellipse 
                cx={pC.cx - 45} 
                cy={pC.cy} 
                rx={rx} 
                ry={ry} 
                fill="rgba(147, 197, 253, 0.5)" 
                stroke="#60a5fa" 
                strokeWidth="1.5" 
              />
              {/* Right Lobe (Anti-bonding/Leaving Br) - Pale Red */}
              <ellipse 
                cx={pC.cx + 45} 
                cy={pC.cy} 
                rx={rx} 
                ry={ry} 
                fill="rgba(252, 165, 165, 0.5)" 
                stroke="#f87171" 
                strokeWidth="1.5" 
              />
          </g>
      );
  };

  const renderTSAnnotation = () => {
      // Only show near TS (t=0.5)
      if (Math.abs(t - 0.5) > 0.1) return null;

      const pNu = project(nuAtom);
      const pBr = project(brAtom);
      const pC = project(carbon);

      // Bounding Box Logic - Adjusted for larger atoms
      const paddingX = 25;
      const paddingY = 110; 
      
      const minX = pNu.cx - paddingX;
      const maxX = pBr.cx + paddingX;
      const minY = pC.cy - paddingY; 
      const maxY = pC.cy + paddingY;
      
      const opacity = 1 - Math.abs(t - 0.5) * 10;
      if (opacity <= 0) return null;

      return (
          <g opacity={opacity} pointerEvents="none">
             {/* Left Bracket */}
             <path d={`M ${minX + 20} ${minY} L ${minX} ${minY} L ${minX} ${maxY} L ${minX + 20} ${maxY}`} 
                   fill="none" stroke="#64748b" strokeWidth="3" />
             {/* Right Bracket */}
             <path d={`M ${maxX - 20} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${maxX - 20} ${maxY}`} 
                   fill="none" stroke="#64748b" strokeWidth="3" />
             
             {/* Double Dagger Symbol - Top Right Outside Bracket */}
             <text x={maxX + 8} y={minY + 15} fontSize="32" fontWeight="bold" fill="#ef4444">‡</text>

             {/* Text Labels - Below Bracket */}
             <text x={(minX + maxX)/2} y={maxY + 30} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#475569">Pentavalent Carbon</text>
             <text x={(minX + maxX)/2} y={maxY + 50} textAnchor="middle" fontSize="14" fill="#64748b">[Nu ••• C ••• Br]⁻</text>
          </g>
      );
  };

  const renderBonds = () => {
    const pC = project(carbon);
    const bonds: React.ReactElement[] = [];

    // 1. C-H Bonds (Always solid)
    hydrogens.forEach(h => {
        const pH = project(h);
        bonds.push(
            <line
                key={`bond-C-${h.id}`}
                x1={pC.cx} y1={pC.cy}
                x2={pH.cx} y2={pH.cy}
                stroke="#94a3b8"
                strokeWidth={6} // Scaled up
                strokeLinecap="round"
            />
        );
    });

    const isPartialPhase = t >= 0.2 && t <= 0.8;
    const tsProximity = 1 - Math.min(1, Math.abs(t - 0.5) * 4); // 1.0 at TS

    // 2. C-Nu Bond
    const pNu = project(nuAtom);
    if (t > 0.1) {
        let width = 8; // Scaled up
        let dash = "0";
        let op = 1;

        if (isPartialPhase) {
            width = 6;
            dash = "10,6";
            op = 0.8;
        } else if (t < 0.2) {
             width = 2;
             dash = "4,6";
             op = 0.3;
        }

        bonds.push(
            <line
                key="bond-C-Nu"
                x1={pC.cx} y1={pC.cy}
                x2={pNu.cx} y2={pNu.cy}
                stroke="#d946ef"
                strokeWidth={width}
                strokeDasharray={dash}
                strokeOpacity={op}
                strokeLinecap="round"
            />
        );
        
        if (showDistances && t > 0.15) {
             // Show distances if enabled
             const midX = (pC.cx + pNu.cx) / 2;
             const midY = (pC.cy + pNu.cy) / 2;
             const distA = Math.abs(nuAtom.x - carbon.x) / 40;
             bonds.push(
                 <text key="lbl-nu-dist" x={midX} y={midY + 24} fontSize="12" fill="#a21caf" textAnchor="middle">{distA.toFixed(1)} Å</text>
             );
        } else if (tsProximity > 0.8) {
             // Bond Order Label - HIDE if Distances/Orbitals shown
             const midX = (pC.cx + pNu.cx) / 2;
             const midY = (pC.cy + pNu.cy) / 2;
             // Offset slightly below bond line to clear atoms (50px to clear radius=34)
             const labelY = midY + 50;

             bonds.push(
                 <g key="lbl-bo-nu">
                    <rect x={midX - 30} y={labelY - 14} width="60" height="18" rx="9" fill="white" fillOpacity="0.9" stroke="white" strokeWidth="2" />
                    <text x={midX} y={labelY} fontSize="11" fill="#a21caf" textAnchor="middle" fontWeight="bold" style={{userSelect: 'none'}}>BO ≈ 0.5</text>
                 </g>
             );
        }
    }

    // 3. C-Br Bond
    const pBr = project(brAtom);
    // Bond disappears at products stage
    if (t < 0.85) {
        let width = 8; // Scaled up
        let dash = "0";
        let op = 1;

        if (isPartialPhase) {
            width = 6;
            dash = "10,6";
            op = 0.8;
        } else if (t > 0.8) {
             width = 2;
             dash = "4,6";
             op = 0.3;
        }

        bonds.push(
            <line
                key="bond-C-Br"
                x1={pC.cx} y1={pC.cy}
                x2={pBr.cx} y2={pBr.cy}
                stroke="#991b1b"
                strokeWidth={width}
                strokeDasharray={dash}
                strokeOpacity={op}
                strokeLinecap="round"
            />
        );

        if (showDistances && t < 0.85) {
             // Show Distances if enabled
             const midX = (pC.cx + pBr.cx) / 2;
             const midY = (pC.cy + pBr.cy) / 2;
             const distA = Math.abs(brAtom.x - carbon.x) / 40;
             bonds.push(
                 <text key="lbl-br-dist" x={midX} y={midY + 24} fontSize="12" fill="#7f1d1d" textAnchor="middle">{distA.toFixed(1)} Å</text>
             );
        } else if (tsProximity > 0.8) {
             // Bond Order Label - HIDE if Distances/Orbitals shown
             const midX = (pC.cx + pBr.cx) / 2;
             const midY = (pC.cy + pBr.cy) / 2;
             // Offset slightly below bond line to clear atoms
             const labelY = midY + 50;

             bonds.push(
                 <g key="lbl-bo-br">
                    <rect x={midX - 30} y={labelY - 14} width="60" height="18" rx="9" fill="white" fillOpacity="0.9" stroke="white" strokeWidth="2" />
                    <text x={midX} y={labelY} fontSize="11" fill="#7f1d1d" textAnchor="middle" fontWeight="bold" style={{userSelect: 'none'}}>BO ≈ 0.5</text>
                 </g>
             );
        }
    }

    return bonds;
  };

  return (
    <div className="w-full max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-10 gap-3 lg:h-[540px]">
        
        {/* COLUMN 1: Reaction Simulation (40% = 4/10 columns) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden">
            {/* Header / Title Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 z-10 flex justify-between items-start pointer-events-none">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 drop-shadow-sm">SN2 Mechanism</h2>
                    <p className="text-sm text-slate-500 font-medium">Concerted single-step mechanism</p>
                </div>
                <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-indigo-600 border border-slate-200 shadow-sm pointer-events-auto">
                    t = {t.toFixed(2)}
                </div>
            </div>

            {/* Transition State Pill - Kept at top but distinct */}
            {(progress > 45 && progress < 55) && (
                <div className="absolute top-16 left-0 right-0 flex justify-center z-10 pointer-events-none">
                     <span className="bg-amber-100/90 backdrop-blur border border-amber-200 text-amber-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm animate-pulse flex items-center gap-2">
                        Transition State ‡
                     </span>
                </div>
            )}

            {/* 3D SVG Viewport */}
            <div className="relative w-full flex-1 min-h-[300px] bg-gradient-to-br from-slate-50 via-white to-slate-100">
                {/* ViewBox adjusted to zoom in: 550x350 centered */}
                <svg className="w-full h-full" viewBox="25 25 550 350" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
                        </marker>
                        <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                            <polygon points="0 0, 6 2, 0 4" fill="#ef4444" />
                        </marker>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        
                        {/* Gradients */}
                        <radialGradient id="gradC"><stop offset="0%" stopColor="#64748b" /><stop offset="100%" stopColor="#1e293b" /></radialGradient>
                        <radialGradient id="gradNu"><stop offset="0%" stopColor="#f0abfc" /><stop offset="100%" stopColor="#c026d3" /></radialGradient>
                        <radialGradient id="gradBr"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#7f1d1d" /></radialGradient>
                        <radialGradient id="gradH"><stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#cbd5e1" /></radialGradient>
                    </defs>

                    {renderOrbitals()}
                    {renderTSAnnotation()}
                    {renderBonds()}

                    {/* Atoms */}
                    {allAtoms.map((atom) => {
                        const p = project(atom);
                        let fillUrl = "";
                        if (atom.element === 'C') fillUrl = "url(#gradC)";
                        else if (atom.element === 'Nu') fillUrl = "url(#gradNu)";
                        else if (atom.element === 'Br') fillUrl = "url(#gradBr)";
                        else fillUrl = "url(#gradH)";

                        return (
                            <g key={atom.id} transform={`translate(${p.cx}, ${p.cy})`} opacity={p.opacity}>
                                <circle r={p.r} fill={fillUrl} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
                                <circle cx={-p.r * 0.3} cy={-p.r * 0.3} r={p.r * 0.4} fill="white" fillOpacity={0.3} filter="url(#glow)" />
                                
                                <text 
                                    y={p.r * 0.3} textAnchor="middle" 
                                    fill={atom.element === 'H' ? "#475569" : "white"} 
                                    fontSize={p.r} fontWeight="bold" pointerEvents="none"
                                    style={{ textShadow: atom.element === 'H' ? 'none' : '0px 1px 2px rgba(0,0,0,0.5)' }}
                                >
                                    {atom.element === 'Nu' ? 'Nu' : atom.element === 'Br' ? 'Br' : atom.element}
                                </text>
                                
                                {/* Charge Indicators */}
                                {atom.element === 'Nu' && (
                                    <text x={p.r} y={-p.r/2} fontSize={p.r*0.8} fill="#c026d3" fontWeight="bold" opacity={1}>
                                        {t < 0.2 ? '-' : t > 0.8 ? '' : 'δ⁻'}
                                    </text>
                                )}
                                {atom.element === 'Br' && (
                                    <text x={p.r} y={-p.r/2} fontSize={p.r*0.8} fill="#991b1b" fontWeight="bold" opacity={1}>
                                        {t < 0.2 ? '' : t > 0.8 ? '-' : 'δ⁻'}
                                    </text>
                                )}
                                {atom.element === 'C' && (
                                    <text x={p.r} y={-p.r/2} fontSize={p.r*0.8} fill="#3b82f6" fontWeight="bold" opacity={t >= 0.2 && t <= 0.8 ? 0.8 : 0}>δ⁺</text>
                                )}
                            </g>
                        );
                    })}

                    {renderElectronArrow()}
                    {renderLeavingArrow()}

                </svg>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg border border-slate-100 text-xs shadow-sm">
                    <div className="font-semibold mb-1 text-slate-700">Legend</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div> C</div>
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></div> H</div>
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500"></div> Nu</div>
                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-700"></div> Br</div>
                    </div>
                </div>

                {/* PAUSE OVERLAY - MOVED HERE (BOTTOM) */}
                {isPausedAtTS && (
                     <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-xl animate-in fade-in zoom-in duration-300 text-center pointer-events-auto">
                             <p className="text-sm font-semibold text-amber-400 mb-1">Highest Energy Point</p>
                             <div className="flex items-center gap-3">
                                 <Timer className="w-4 h-4 text-slate-300" />
                                 <span className="font-mono text-lg font-bold">{resumeCountdown}s</span>
                                 <button 
                                    onClick={handleResume}
                                    className="ml-2 bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors"
                                    title="Resume Now"
                                 >
                                     <SkipForward className="w-4 h-4 text-white" />
                                 </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="bg-slate-50 p-3 border-t border-slate-100 flex flex-col gap-4 mt-auto">
                 {/* Scrubber */}
                 <div className="flex items-center gap-4">
                    <button
                        onClick={togglePlay}
                        className={`p-2.5 rounded-full text-white shadow-sm transition-transform active:scale-95 flex-shrink-0 ${
                        isPlaying && !isPausedAtTS ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying && !isPausedAtTS ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <div className="flex-1">
                        <input
                            type="range" min="0" max="100" step="0.1"
                            value={progress}
                            onChange={(e) => handleSeek(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            <span>Reactants</span>
                            <span>Transition State</span>
                            <span>Products</span>
                        </div>
                    </div>
                    <button
                        onClick={handleReset}
                        className="p-2.5 rounded-full bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="Reset"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                 </div>

                 {/* Toggles */}
                 <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                    <button 
                        onClick={() => setShowArrows(!showArrows)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${showArrows ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                        {showArrows ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>}
                        Arrows
                    </button>
                    <button 
                        onClick={() => setShowDistances(!showDistances)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${showDistances ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                        <Settings2 className="w-3 h-3"/>
                        Distances & Orbitals
                    </button>
                    <button 
                        onClick={() => setAutoPauseAtTS(!autoPauseAtTS)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${autoPauseAtTS ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                        title="Automatically pause at transition state"
                    >
                        <Timer className="w-3 h-3"/>
                        Auto-Pause
                    </button>
                 </div>
            </div>
        </div>

        {/* COLUMN 2: Energy Diagram (40% = 4/10 columns) */}
        <div className="lg:col-span-4 h-full">
            <EnergyDiagram progress={progress} />
        </div>

        {/* COLUMN 3: Key Concepts (20% = 2/10 columns) */}
        <div className="lg:col-span-2 h-full bg-[#f8f9fa] rounded-lg p-[15px] shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-wide border-b border-slate-200 pb-2">
                <Info className="w-4 h-4 text-indigo-600" />
                KEY CONCEPTS
            </h3>
            <div className="flex flex-col gap-3">
                <div className="flex gap-3 text-slate-600">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">1</span>
                    <div>
                        <strong className="block text-slate-900 text-[15px] font-bold mb-0.5">Walden Inversion</strong>
                        <span className="text-[13px] leading-tight block">Nu⁻ attacks from behind (opposite Br), forcing H atoms to flip. Backside attack inverts stereochemistry.</span>
                    </div>
                </div>
                <div className="flex gap-3 text-slate-600">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">2</span>
                    <div>
                        <strong className="block text-slate-900 text-[15px] font-bold mb-0.5">Steric Hindrance</strong>
                        <span className="text-[13px] leading-tight block">Bulky groups block Nu⁻ from reaching carbon's backside. This is why SN2 works best on methyl and 1° carbons, not 3°.</span>
                    </div>
                </div>
                <div className="flex gap-3 text-slate-600">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">3</span>
                    <div>
                        <strong className="block text-slate-900 text-[15px] font-bold mb-0.5">Concerted Mechanism</strong>
                        <span className="text-[13px] leading-tight block">Bonds break/form simultaneously—no stable intermediate. Single transition state, not two steps.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReactionSimulation;