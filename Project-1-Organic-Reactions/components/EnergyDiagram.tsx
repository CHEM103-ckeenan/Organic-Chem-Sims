import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceLine
} from 'recharts';

interface EnergyDiagramProps {
  progress: number; // 0 to 100
}

const EnergyDiagram: React.FC<EnergyDiagramProps> = ({ progress }) => {
  // Generate curve data based on specific thermodynamics:
  // Reactants (0%): 0 kJ/mol
  // TS (50%): 110 kJ/mol
  // Products (100%): -20 kJ/mol
  
  const data = Array.from({ length: 101 }, (_, i) => {
    const p = i / 100; // 0.0 to 1.0
    
    // 1. Thermodynamic Curve (Sigmoid): 0 to -20
    // Center transition at 0.5 with steepness 10
    const deltaG = -20 * (1 / (1 + Math.exp(-10 * (p - 0.5))));
    
    // 2. Activation Barrier (Gaussian): Peak +110 relative to baseline
    // At p=0.5, deltaG is -10. To reach 110 total, barrier needs to add 120.
    // 120 - 10 = 110.
    const barrier = 120 * Math.exp(-Math.pow((p - 0.5) * 5, 2));
    
    const energy = barrier + deltaG;
    
    return {
      progress: i,
      energy: energy,
    };
  });

  const currentEnergy = data[Math.min(100, Math.max(0, Math.round(progress)))].energy;

  // Custom Tick for X Axis - Larger and Bolder
  const CustomXAxisTick = ({ x, y, payload }: any) => {
    if (payload.value === 0) return <text x={x} y={y+24} textAnchor="start" fill="#475569" fontSize={14} fontWeight="600">Reactants</text>;
    // Removed Transition State label from axis to place it at peak
    if (payload.value === 100) return <text x={x} y={y+24} textAnchor="end" fill="#475569" fontSize={14} fontWeight="600">Products</text>;
    return null;
  };

  return (
    <div className="w-full h-full min-h-[340px] bg-white rounded-xl p-[15px] border border-slate-200 shadow-sm relative overflow-visible flex flex-col">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2 flex-shrink-0">
          <h3 className="text-slate-900 text-lg font-bold truncate">Rxn Coordinate Diagram</h3>
          <div className="font-mono text-base whitespace-nowrap ml-4 flex-shrink-0">
             <span className="text-slate-500 mr-2 font-medium">Energy:</span>
             <span className={`${currentEnergy > 100 ? 'text-red-600' : 'text-indigo-600'} font-bold text-lg`}>
               {currentEnergy.toFixed(1)} kJ/mol
             </span>
          </div>
      </div>
      
      <div className="flex-1 min-h-0 w-full">
        {/* Increased right margin to 120 to accommodate the Delta G label */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 30, right: 120, bottom: 30, left: 20 }}>
            <defs>
              <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
              
              {/* Arrow Heads for Energy Vectors */}
              {/* RefX=10 ensures the tip of the arrow touches the coordinate exactly */}
              {/* markerWidth/Height=4 reduces size by ~33-40% from default 6 */}
              <marker id="arrowRed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="arrowGreen" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} strokeOpacity={1} strokeWidth={1} />
            
            <XAxis 
              dataKey="progress" 
              type="number" 
              domain={[0, 100]} 
              ticks={[0, 50, 100]}
              tick={<CustomXAxisTick />}
              interval={0}
              axisLine={{ stroke: '#94a3b8', strokeWidth: 2 }}
              tickLine={{ stroke: '#94a3b8', strokeWidth: 2, height: 8 }}
            />
            
            <YAxis 
              domain={[-30, 140]} 
              ticks={[-30, 0, 50, 100, 140]}
              label={{ 
                value: 'Gibbs Free Energy (kJ/mol)', 
                angle: -90, 
                position: 'insideLeft', 
                offset: -10, 
                fill: '#475569', 
                fontSize: 14, 
                fontWeight: 600 
              }}
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              itemStyle={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}
              formatter={(value: number) => [value.toFixed(1) + ' kJ/mol', 'Free Energy']}
              labelFormatter={() => ''}
            />
            
            <Area 
              type="monotone" 
              dataKey="energy" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorEnergy)" 
              strokeWidth={5} 
              animationDuration={0}
              isAnimationActive={false}
            />

            {/* Reference Lines & Baselines */}
            {/* y=110: Peak energy level, light gray dashed */}
            <ReferenceLine y={110} stroke="#CCCCCC" strokeDasharray="5 5" strokeWidth={1} />
            
            {/* y=0: Reactants baseline, slightly bolder gray dashed */}
            <ReferenceLine y={0} stroke="#999999" strokeDasharray="5 5" label={{ position: 'insideLeft', value: '0', fill: '#64748b', fontSize: 12, fontWeight: 600, dy: -5 }} strokeWidth={2} />
            
            {/* y=-20: Products level, light gray dashed */}
            <ReferenceLine y={-20} stroke="#CCCCCC" strokeDasharray="5 5" strokeWidth={1} />
            
            <ReferenceLine x={50} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={1} />

            {/* Activation Energy (Ea) Arrow - Left Side */}
            {/* Thinner stroke (2.5px), Start at 0, End at 110 EXACTLY */}
            <ReferenceLine 
                segment={[{ x: 15, y: 0 }, { x: 15, y: 110 }]} 
                stroke="#ef4444" 
                strokeWidth={2.5} 
                markerEnd="url(#arrowRed)"
                markerStart="url(#arrowRed)"
                label={{ 
                    position: 'right', 
                    value: 'Ea = 110 kJ/mol', 
                    fill: '#ef4444', 
                    fontSize: 14, 
                    fontWeight: 700 
                }}
            />

            {/* Gibbs Free Energy (Delta G) Arrow - Right Side */}
            {/* Thinner stroke (2.5px), Start at 0, End at -20 EXACTLY */}
            <ReferenceLine 
                segment={[{ x: 85, y: 0 }, { x: 85, y: -20 }]} 
                stroke="#10b981" 
                strokeWidth={2.5}
                markerEnd="url(#arrowGreen)"
                markerStart="url(#arrowGreen)"
                label={{ 
                    position: 'right', 
                    value: 'ΔG = -20 kJ/mol', 
                    fill: '#10b981', 
                    fontSize: 14, 
                    fontWeight: 700 
                }}
            />

            {/* Transition State Symbol & Label at Peak */}
            <ReferenceDot 
              x={50} 
              y={110} 
              r={0} 
              label={(props: any) => {
                const x = props.viewBox?.x ?? props.cx ?? props.x;
                const y = props.viewBox?.y ?? props.cy ?? props.y;
                if (!x || !y) return null;
                return (
                  <g>
                    <text x={x} y={y - 60} textAnchor="middle" fill="#475569" fontSize={14} fontWeight="700">Transition State</text>
                    <text x={x} y={y - 5} textAnchor="middle" fill="#ef4444" fontSize={36} fontWeight="900">‡</text>
                  </g>
                );
              }}
            />

            {/* Current State Dot */}
            <ReferenceDot 
              x={progress} 
              y={currentEnergy} 
              r={9} 
              fill="#3b82f6" 
              stroke="#fff" 
              strokeWidth={3} 
              isFront={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnergyDiagram;