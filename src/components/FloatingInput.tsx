interface FloatingInputProps {
  id: string;
  label: string;
  icon: string; // emoji or string
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
}

export const FloatingInput = ({
  id,
  label,
  icon,
  value,
  onChange,
  multiline,
  placeholder,
  required,
}: FloatingInputProps) => {
  const hasValue = value.length > 0;
  const Tag = multiline ? "textarea" : "input";

  return (
    <div className="floating-field">
      <span className="field-icon">{icon}</span>
      <Tag
        id={id}
        className="floating-input"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        placeholder={hasValue ? "" : placeholder}
        rows={multiline ? 3 : undefined}
        required={required}
        autoComplete="off"
      />
      <label
        htmlFor={id}
        className={`floating-label ${hasValue ? "floating-label--up" : ""}`}
      >
        {label}
      </label>
    </div>
  );
};
