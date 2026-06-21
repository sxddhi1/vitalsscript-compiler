import { useState, useEffect, useRef } from 'react';
import { compileCode } from './compiler';

interface AstNodeProps {
  node: any;
  name?: string;
}

const getTypeColor = (type?: string) => {
  if (!type) return '#cbd5e1';
  if (['Declaration', 'Display', 'If', 'While', 'Assignment'].includes(type)) return '#38bdf8';
  if (['Binary', 'Grouping', 'Variable', 'Literal'].includes(type)) return '#a78bfa';
  return '#f97316';
};

const AstViewer = ({ node, name }: AstNodeProps) => {
  if (node === null || node === undefined) return <span style={{ color: '#64748b' }}>null</span>;
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return <span style={{ color: '#4ade80' }}>{JSON.stringify(node)}</span>;
  }
  if (Array.isArray(node)) {
    return (
      <div style={{ marginLeft: '12px', borderLeft: '1px solid rgba(56, 189, 248, 0.3)', paddingLeft: '8px' }}>
        <span style={{ color: '#cbd5e1' }}>[</span>
        {node.map((item, idx) => (
          <div key={idx}>
            <AstViewer node={item} />
            {idx < node.length - 1 && ','}
          </div>
        ))}
        <span style={{ color: '#cbd5e1' }}>]</span>
      </div>
    );
  }
  const keys = Object.keys(node);
  return (
    <div style={{ marginLeft: '12px', borderLeft: '1px solid rgba(167, 139, 250, 0.3)', paddingLeft: '8px', marginBottom: '2px' }}>
      <span style={{ color: '#94a3b8' }}>{'{'}</span>
      {keys.map((k, idx) => (
        <div key={k} style={{ paddingLeft: '8px' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{k}</span>: {' '}
          {k === 'type' ? (
            <span style={{ color: getTypeColor(node[k]), fontWeight: 'bold', textShadow: `0 0 5px ${getTypeColor(node[k])}40` }}>"{node[k]}"</span>
          ) : (
            <AstViewer node={node[k]} name={k} />
          )}
          {idx < keys.length - 1 && ','}
        </div>
      ))}
      <span style={{ color: '#94a3b8' }}>{'}'}</span>
    </div>
  );
};

const VitalsChart = ({ data }: { data: number[] }) => {
  if (data.length === 0) return <div style={{ color: '#475569', textAlign: 'center', marginTop: '40px', fontFamily: '"Fira Code", monospace' }}>[ NO VITAL SIGNALS DETECTED ]</div>;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 30;
  const points = data.map((val, idx) => {
    const x = padding + (idx * ((400 - padding * 2) / Math.max(data.length - 1, 1)));
    const y = 200 - padding - ((val - min) / range) * (200 - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4" />
      <polyline points={points} fill="none" stroke="#0ea5e9" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 6px rgba(14, 165, 233, 0.8))' }} />
      {data.map((val, idx) => {
        const x = padding + (idx * ((400 - padding * 2) / Math.max(data.length - 1, 1)));
        const y = 200 - padding - ((val - min) / range) * (200 - padding * 2);
        return (
          <g key={idx}>
            <circle cx={x} cy={y} r="5" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 5px #38bdf8)' }} />
            <text x={x} y={y - 12} fill="#bae6fd" fontSize="12" textAnchor="middle" fontWeight="bold" fontFamily='"Fira Code", monospace'>{val}</text>
          </g>
        );
      })}
    </svg>
  );
};

function App() {
  const [source, setSource] = useState(
    'patient weight = 75;\npatient height = 180;\ncalculate height_m = height / 100;\ncalculate bmi = weight / (height_m * height_m);\n\ndisplay "--- MEDICAL REPORT ---";\ndisplay "Calculated BMI:";\ndisplay bmi;'
  );
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState<{ line: number, message: string }[]>([]);
  const [ast, setAst] = useState<any>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = compileCode(source);
      setErrors(result.errors);
      setAst(result.ast);
      if (result.errors.length === 0 && result.targetCode) {
        const wrappedCode = `let outputLog = []; function printOutput(val) { outputLog.push(val); } ${result.targetCode} return outputLog.join('\\n');`;
        try {
          const exec = new Function(wrappedCode);
          const runResult = exec();
          setOutput(runResult);
          const numValues = runResult.split('\n').map((str: string) => parseFloat(str)).filter((val: number) => !isNaN(val));
          setChartData(numValues);
        } catch (err) {
          setOutput("[SYSTEM OVERRIDE: FAIL]\n" + err);
          setChartData([]);
        }
      } else {
        setOutput("[COMPILATION OFFLINE]");
        setChartData([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [source]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const lines = Array.from({ length: source.split('\n').length }, (_, i) => i + 1);

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(2, 6, 23, 0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(56, 189, 248, 0.3); border-radius: 4px; }
      `}</style>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', height: '100vh', gap: '15px', padding: '15px', backgroundColor: '#020617', boxSizing: 'border-box' }}>

        {/* Input */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '14px', letterSpacing: '2px' }}>VitalsScript Input Stream</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div ref={lineNumbersRef} style={{ width: '40px', padding: '15px 0', backgroundColor: 'rgba(2, 6, 23, 0.5)', textAlign: 'center', color: '#475569', fontFamily: 'monospace', overflow: 'hidden' }}>
              {lines.map(ln => <div key={ln} style={{ height: '21px' }}>{ln}</div>)}
            </div>
            <textarea value={source} onChange={(e) => setSource(e.target.value)} onScroll={handleScroll} spellCheck="false" style={{ flex: 1, backgroundColor: 'transparent', color: '#e2e8f0', padding: '15px', fontFamily: 'monospace', fontSize: '14px', lineHeight: '21px', border: 'none', outline: 'none', resize: 'none', overflowY: 'auto' }} />
          </div>
        </div>

        {/* Logs */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h2 style={{ color: '#a78bfa', margin: 0, fontSize: '14px', letterSpacing: '2px' }}>Diagnostic Logs</h2>
          </div>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
            {errors.length > 0 ? errors.map((err, i) => <div key={i} style={{ color: '#f43f5e' }}>► Line {err.line}: {err.message}</div>) : <div style={{ color: '#bae6fd' }}>{output}</div>}
          </div>
        </div>

        {/* Topology */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(167, 139, 250, 0.2)' }}>
            <h2 style={{ color: '#a78bfa', margin: 0, fontSize: '14px', letterSpacing: '2px' }}>Semantic Parser Topology</h2>
          </div>
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px' }}>
            {ast && errors.length === 0 ? <AstViewer node={ast} /> : <div style={{ color: '#475569', textAlign: 'center', marginTop: '20px' }}>[ NO TOPOLOGY ]</div>}
          </div>
        </div>

        {/* Chart */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '14px', letterSpacing: '2px' }}>Vitals Telemetry Chart</h2>
          </div>
          <div style={{ flex: 1, padding: '15px' }}>
            {errors.length > 0 ? <div style={{ color: '#475569', textAlign: 'center', marginTop: '40px' }}>[ STREAM INTERRUPTED ]</div> : <VitalsChart data={chartData} />}
          </div>
        </div>

      </div>
    </>
  );
}

export default App;