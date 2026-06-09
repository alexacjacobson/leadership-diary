import { useState, useEffect } from 'react'
import windowRaw  from '../../Assests/Components/window.svg?raw'
import lampRaw    from '../../Assests/Components/lamp.svg?raw'
import tulipsRaw  from '../../Assests/Components/tulips.svg?raw'
import coffeeRaw  from '../../Assests/Components/coffee.svg?raw'
import diaryRaw   from '../../Assests/Components/diary.svg?raw'
import pencilRaw  from '../../Assests/Components/pencil.svg?raw'

function linen(svgRaw) {
  return svgRaw.replace(/fill="#3B5BDB"/g, 'fill="#FAF8F2"')
}

// Composition frame derived from Cover.svg icon bounding boxes (1728×1117 canvas).
// Icons are 1:1 scale in the cover — cover_w/h matches natural SVG dimensions to ±3px.
// Frame spans the union of all icon bounding boxes:
//   x: 442.7 – 1275.4  →  width  ≈ 833px
//   y: 271.1 – 992.9   →  height ≈ 722px
const COMP_X = 442.7
const COMP_Y = 271.1
const COMP_W = 833
const COMP_H = 722

// Compute a uniform scale so the composition fits the viewport with 12% padding each axis.
// Capped at 1.0 so icons never render larger than their natural size.
function getScale() {
  return Math.min(
    (window.innerWidth  * 0.88) / COMP_W,
    (window.innerHeight * 0.88) / COMP_H,
    1.0
  )
}

// Each icon is positioned at (cover_x_min - COMP_X, cover_y_min - COMP_Y).
// Window is nudged -25px to move it up slightly within the composition.
const ICONS = [
  { key: 'window',  svg: linen(windowRaw),  left: 757.7  - COMP_X, top: (271.1 - COMP_Y) - 25, tilt: -3   },
  { key: 'lamp',    svg: linen(lampRaw),    left: 1063.6 - COMP_X, top:  395.1 - COMP_Y,        tilt:  2.5 },
  { key: 'tulips',  svg: linen(tulipsRaw),  left: 520.3  - COMP_X, top:  376.9 - COMP_Y,        tilt: -4.5 },
  { key: 'coffee',  svg: linen(coffeeRaw),  left: 442.7  - COMP_X, top:  629.6 - COMP_Y,        tilt:  6   },
  { key: 'diary',   svg: linen(diaryRaw),   left: 705.7  - COMP_X, top:  627.0 - COMP_Y,        tilt: -2   },
  { key: 'pencil',  svg: linen(pencilRaw),  left: 996.0  - COMP_X, top:  731.1 - COMP_Y,        tilt:  4   },
]

export default function CoverIntro({ onComplete }) {
  const [fadingOut, setFadingOut] = useState(false)
  const [scale,     setScale]    = useState(() => getScale())

  // Recompute scale on viewport resize
  useEffect(() => {
    const onResize = () => setScale(getScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // All icons appear simultaneously: 550ms animation + 500ms pause = 1050ms before fade-out.
    // Fade-out takes 800ms → unmount at 1850ms.
    const tFade = setTimeout(() => setFadingOut(true), 1050)
    const tDone = setTimeout(onComplete, 1850)
    return () => { clearTimeout(tFade); clearTimeout(tDone) }
  }, [onComplete])

  return (
    <div className={`cover-intro${fadingOut ? ' cover-intro--fade-out' : ''}`}>
      <div
        style={{
          position: 'absolute',
          width:  COMP_W,
          height: COMP_H,
          top:  '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {ICONS.map(icon => (
          <div
            key={icon.key}
            style={{
              position: 'absolute',
              left: icon.left,
              top:  icon.top,
              transform: `rotate(${icon.tilt}deg)`,
            }}
          >
            <div
              className="intro-icon-bounce"
              dangerouslySetInnerHTML={{ __html: icon.svg }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
