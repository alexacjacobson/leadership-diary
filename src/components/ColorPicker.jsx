const PALETTE = [
  { hex: '#FFFFFF', label: 'White' },
  { hex: '#D45FA8', label: 'Deep Pink' },
  { hex: '#FF6E48', label: 'Marigold' },
  { hex: '#3B5BDB', label: 'Cobalt' },
  { hex: '#067A42', label: 'Forest' },
  { hex: '#1A1A1A', label: 'Ink' },
]

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker" role="group" aria-label="Card background color">
      {PALETTE.map(color => (
        <button
          key={color.hex}
          type="button"
          className={`color-swatch${value === color.hex ? ' color-swatch--active' : ''}`}
          style={{ backgroundColor: color.hex }}
          aria-label={color.label}
          aria-pressed={value === color.hex}
          onClick={() => onChange(color.hex)}
        />
      ))}
    </div>
  )
}
