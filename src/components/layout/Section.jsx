export default function Section({ id, className = '', children, ...props }) {
  return (
    <section
      id={id}
      className={`px-[var(--section-padding-x)] py-[var(--section-padding-y)] ${className}`}
      {...props}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  )
}
