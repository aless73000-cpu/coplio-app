export function Field({
  label, value, type = 'text', disabled = false, onChange,
}: {
  label: string; value: string; type?: string; disabled?: boolean; onChange?: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-coplio-text mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[#374151]/20 focus:border-transparent
          placeholder:text-gray-400 disabled:bg-coplio-bg disabled:text-muted-foreground
          transition-shadow"
      />
    </div>
  )
}
