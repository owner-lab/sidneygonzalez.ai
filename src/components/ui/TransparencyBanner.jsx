import GlassPanel from './GlassPanel'

export default function TransparencyBanner({
  message = 'Model coefficients are illustrative. In production, these would be calibrated from your organization\u2019s historical data. Methodology references cited in documentation.',
}) {
  return (
    <GlassPanel className="border-accent-orange/20 bg-accent-orange/5">
      <p className="text-sm leading-relaxed text-text-secondary">
        <span className="mr-2 font-semibold text-accent-orange">
          Transparency
        </span>
        {message}
      </p>
    </GlassPanel>
  )
}
