import { useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function AlpineBackground() {
  const starsRef = useRef<HTMLDivElement>(null)
  const snowRef = useRef<HTMLDivElement>(null)
  const dragonsRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const isNight = theme === 'tokyo'

  useEffect(() => {
    // Stars (night only)
    if (starsRef.current) {
      starsRef.current.innerHTML = ''
      if (isNight) {
        for (let i = 0; i < 150; i++) {
          const s = document.createElement('div')
          const size = Math.random() * 2.5 + 0.5
          s.style.cssText = `
            position:absolute; border-radius:50%; background:white;
            width:${size}px; height:${size}px;
            left:${Math.random() * 100}%; top:${Math.random() * 65}%;
            animation:bgTwinkle ${Math.random() * 4 + 2}s ${Math.random() * 6}s infinite alternate;
            --min:${Math.random() * 0.2 + 0.1}; --max:${Math.random() * 0.5 + 0.5};
          `
          starsRef.current.appendChild(s)
        }
      }
    }

    // Snow
    if (snowRef.current) {
      snowRef.current.innerHTML = ''
      for (let i = 0; i < 55; i++) {
        const f = document.createElement('div')
        const size = Math.random() * 4 + 1
        const dur = Math.random() * 18 + 12
        const drift = (Math.random() - 0.5) * 120
        const color = isNight ? 'rgba(210,230,255,0.85)' : 'rgba(255,255,255,0.95)'
        f.style.cssText = `
          position:absolute; border-radius:50%; background:${color};
          width:${size}px; height:${size}px;
          left:${Math.random() * 100}%; top:-${size + 5}px;
          animation:bgSnowfall ${dur}s ${Math.random() * 20}s linear infinite;
          --drift:${drift}px;
          opacity:${Math.random() * 0.6 + 0.3};
          box-shadow:0 0 ${size * 1.5}px ${color};
        `
        snowRef.current.appendChild(f)
      }
    }

    // Dragons
    if (dragonsRef.current) {
      dragonsRef.current.innerHTML = ''
      const specs = [
        { yPct: 8,  dur: 32, delay: 0,  scale: 0.35, op: isNight ? 0.22 : 0.13 },
        { yPct: 19, dur: 46, delay: 14, scale: 0.55, op: isNight ? 0.18 : 0.10 },
        { yPct: 5,  dur: 26, delay: 7,  scale: 0.27, op: isNight ? 0.16 : 0.09 },
      ]
      specs.forEach(({ yPct, dur, delay, scale, op }) => {
        const w = document.createElement('div')
        const col = isNight ? '#c0392b' : '#7a1515'
        const eyeCol = isNight ? '#f0c040' : '#8b2000'
        const glow = isNight
          ? 'drop-shadow(0 0 8px rgba(192,57,43,0.6))'
          : 'drop-shadow(0 0 4px rgba(100,20,20,0.3))'
        w.style.cssText = `
          position:absolute; top:${yPct}%; left:-300px;
          animation:bgDragonFly ${dur}s ${delay}s linear infinite;
          --s:${scale}; filter:${glow};
        `
        w.innerHTML = `<svg width="260" height="120" viewBox="0 0 260 120" xmlns="http://www.w3.org/2000/svg">
          <g fill="${col}" opacity="${op}">
            <ellipse cx="130" cy="68" rx="68" ry="20"/>
            <ellipse cx="82" cy="52" rx="22" ry="14" transform="rotate(-22 82 52)"/>
            <ellipse cx="50" cy="36" rx="18" ry="12" transform="rotate(-15 50 36)"/>
            <ellipse cx="28" cy="32" rx="12" ry="8" transform="rotate(-8 28 32)"/>
            <circle cx="44" cy="29" r="3.5" fill="${eyeCol}"/>
            <circle cx="44" cy="29" r="1.8" fill="#000"/>
            <polygon points="48,18 43,6 38,19"/>
            <polygon points="54,22 48,12 44,23" opacity="0.6"/>
            ${isNight ? `<ellipse cx="16" cy="32" rx="12" ry="5" fill="rgba(255,120,0,0.7)"/>
            <ellipse cx="6" cy="32" rx="7" ry="3" fill="rgba(255,210,0,0.55)"/>` : ''}
            <path d="M198,70 Q220,54 235,65 Q242,74 230,78 Q218,62 198,74 Z"/>
            <polygon points="235,65 248,56 242,72"/>
            <path d="M110,54 Q80,10 52,16 Q70,34 88,46 Z"/>
            <path d="M110,54 Q84,14 56,18 M110,54 Q76,18 50,20" stroke="${col}" strokeWidth="1" fill="none" opacity="0.45"/>
            <path d="M150,54 Q178,20 208,16 Q192,36 168,48 Z"/>
            <path d="M150,54 Q176,22 204,18 M150,54 Q178,26 206,20" stroke="${col}" strokeWidth="1" fill="none" opacity="0.45"/>
            <path d="M116,82 L107,105 L112,107 L119,84 Z"/>
            <path d="M144,82 L153,105 L148,107 L141,84 Z"/>
          </g>
        </svg>`
        dragonsRef.current!.appendChild(w)
      })
    }
  }, [isNight])

  return (
    <>
      <style>{`
        @keyframes bgTwinkle {
          0%   { opacity: var(--min, 0.1); transform: scale(1); }
          100% { opacity: var(--max, 0.8); transform: scale(1.5); }
        }
        @keyframes bgSnowfall {
          0%   { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0.9; }
          50%  { transform: translateY(50vh) translateX(var(--drift, 0px)) rotate(180deg); }
          100% { transform: translateY(105vh) translateX(0) rotate(360deg); opacity: 0; }
        }
        @keyframes bgDragonFly {
          0%   { left: -290px; transform: scale(var(--s)) translateY(0px); }
          20%  { transform: scale(var(--s)) translateY(-28px); }
          45%  { transform: scale(var(--s)) translateY(14px); }
          70%  { transform: scale(var(--s)) translateY(-18px); }
          100% { left: 108vw; transform: scale(var(--s)) translateY(0px); }
        }
        @keyframes bgAurora {
          0%   { opacity: 0.35; transform: translateX(-25px) scaleX(0.96); }
          100% { opacity: 0.85; transform: translateX(25px) scaleX(1.04); }
        }
        @keyframes bgSunGlow {
          0%   { opacity: 0.5; transform: scale(0.96); }
          100% { opacity: 1;   transform: scale(1.04); }
        }
      `}</style>

      {/* Sky */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        transition: 'background 1.2s ease',
        background: isNight
          ? 'linear-gradient(180deg,#020408 0%,#050810 25%,#060c14 55%,#040810 100%)'
          : 'linear-gradient(180deg,#3a6da8 0%,#5a8fc8 12%,#7db4e0 28%,#aed4f0 50%,#d0ecfc 72%,#e8f6fc 88%,#f2fafe 100%)',
      }}/>

      {/* Hex grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        opacity: isNight ? 0.018 : 0.012,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0L56 14L56 42L28 56L0 42L0 14Z' fill='none' stroke='%23${isNight ? 'b8d4e8' : '2a4a7a'}' stroke-width='0.5'/%3E%3C/svg%3E")`,
      }}/>

      {/* Night aurora */}
      {isNight && (
        <div className="fixed top-0 left-0 right-0 z-0 pointer-events-none" style={{
          height: '320px',
          background: `
            radial-gradient(ellipse 90% 80% at 25% -10%,rgba(192,57,43,0.1) 0%,transparent 55%),
            radial-gradient(ellipse 70% 60% at 75% -5%,rgba(90,150,220,0.07) 0%,transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 0%,rgba(110,70,180,0.06) 0%,transparent 40%)
          `,
          animation: 'bgAurora 14s ease-in-out infinite alternate',
        }}/>
      )}

      {/* Day sun */}
      {!isNight && (
        <div className="fixed z-0 pointer-events-none" style={{
          top: '-80px', right: '8%',
          width: '480px', height: '480px',
          background: 'radial-gradient(circle,rgba(255,225,120,0.3) 0%,rgba(255,190,70,0.12) 35%,transparent 70%)',
          animation: 'bgSunGlow 7s ease-in-out infinite alternate',
        }}/>
      )}

      {/* Stars */}
      <div ref={starsRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden"/>

      {/* Dragons */}
      <div ref={dragonsRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden"/>

      {/* Mountain SVG */}
      <svg className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none w-full"
        viewBox="0 0 1440 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {isNight ? <>
          <path d="M0,300 L0,205 L100,138 L185,175 L295,95 L395,148 L490,72 L575,122 L672,52 L762,108 L866,62 L960,115 L1065,58 L1162,112 L1268,66 L1370,115 L1440,84 L1440,300Z" fill="#0d1520"/>
          {[[295,95],[490,72],[672,52],[866,62],[1065,58]].map(([px,py],i) => (
            <path key={i} d={`M${px},${py} L${px+18},${py+18} L${px+28},${py+8} L${px+38},${py+22} L${px+55},${py+32}`}
              fill="none" stroke="rgba(180,220,255,0.18)" strokeWidth="2"/>
          ))}
          <path d="M0,300 L0,248 L72,192 L155,232 L252,168 L336,208 L432,142 L516,182 L618,118 L705,165 L802,128 L886,172 L984,108 L1068,158 L1168,114 L1268,162 L1362,118 L1440,148 L1440,300Z" fill="#0a1018"/>
          {[[252,168],[432,142],[618,118],[802,128],[984,108]].map(([px,py],i) => (
            <path key={i} d={`M${px},${py} Q${px+16},${py+10} ${px+25},${py+4} Q${px+34},${py+16} ${px+50},${py+30}`}
              fill="rgba(200,225,255,0.14)"/>
          ))}
          <path d="M0,300 L0,268 L55,252 L118,265 L205,244 L275,260 L362,236 L440,254 L530,230 L610,248 L700,226 L778,246 L868,222 L948,244 L1040,220 L1120,242 L1215,218 L1305,240 L1395,218 L1440,232 L1440,300Z" fill="#070c12"/>
          <g fill="#040810">
            {[18,44,76,112,150,190,232,278,324,372,422,474,526,580,636,692,750,810,870,932,994,1056,1118,1180,1242,1304,1366].map((x,i)=>(
              <g key={i}>
                <polygon points={`${x},${268-(i%3)*3} ${x+7},${250-(i%3)*3} ${x+14},${268-(i%3)*3}`}/>
                <polygon points={`${x+2},${260-(i%3)*3} ${x+7},${246-(i%3)*3} ${x+12},${260-(i%3)*3}`}/>
              </g>
            ))}
          </g>
          <rect x="0" y="288" width="1440" height="12" fill="#050810"/>
        </> : <>
          <path d="M0,300 L0,215 L100,155 L185,192 L295,128 L395,165 L490,98 L575,140 L672,78 L762,128 L866,82 L960,132 L1065,76 L1162,128 L1268,80 L1370,128 L1440,96 L1440,300Z" fill="#b8d8f0"/>
          {[[295,128],[490,98],[672,78],[866,82],[1065,76]].map(([px,py],i) => (
            <path key={i} d={`M${px},${py} Q${px+18},${py+8} ${px+28},${py+2} Q${px+38},${py+14} ${px+55},${py+28}`}
              fill="white" opacity="0.92"/>
          ))}
          <path d="M0,300 L0,255 L72,202 L155,240 L252,178 L336,218 L432,150 L516,190 L618,126 L705,174 L802,136 L886,180 L984,116 L1068,166 L1168,120 L1268,170 L1362,124 L1440,155 L1440,300Z" fill="#daeef8"/>
          {[[252,178],[432,150],[618,126],[802,136],[984,116]].map(([px,py],i) => (
            <path key={i} d={`M${px},${py} Q${px+16},${py+10} ${px+26},${py+4} Q${px+36},${py+16} ${px+52},${py+32}`}
              fill="white" opacity="0.95"/>
          ))}
          <path d="M0,300 L0,272 L60,256 L125,270 L208,248 L280,264 L368,242 L448,258 L538,234 L618,252 L708,230 L786,250 L876,226 L956,248 L1048,224 L1128,246 L1222,222 L1312,244 L1402,222 L1440,238 L1440,300Z" fill="white"/>
          <path d="M0,300 L0,282 L60,268 L125,280 L208,260 L280,274 L368,254 L448,268 L538,246 L618,262 L708,242 L786,260 L876,238 L956,258 L1048,236 L1128,256 L1222,234 L1312,254 L1402,234 L1440,248 L1440,300Z" fill="rgba(255,255,255,0.65)"/>
          <g fill="#1a3a28">
            {[16,40,70,106,142,180,220,266,310,356,406,456,506,558,614,668,726,786,846,906,966,1026,1086,1146,1206,1266,1326,1386].map((x,i)=>(
              <g key={i} opacity="0.82">
                <polygon points={`${x},${270-(i%3)*3} ${x+7},${252-(i%3)*3} ${x+14},${270-(i%3)*3}`}/>
                <polygon points={`${x+2},${262-(i%3)*3} ${x+7},${248-(i%3)*3} ${x+12},${262-(i%3)*3}`}/>
              </g>
            ))}
          </g>
          <rect x="0" y="292" width="1440" height="8" fill="white"/>
        </>}
      </svg>

      {/* Snow particles */}
      <div ref={snowRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden"/>

      {/* Ground mist */}
      <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none" style={{
        height: '100px',
        background: isNight
          ? 'linear-gradient(to top,rgba(5,8,16,0.92) 0%,transparent 100%)'
          : 'linear-gradient(to top,rgba(245,252,255,0.88) 0%,transparent 100%)',
      }}/>
    </>
  )
}