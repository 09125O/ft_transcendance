type PrivacySwitchProps = {
  checked: boolean;
  labelId: string;
  onChange: (checked: boolean) => void;
};

export default function PrivacySwitch({
  checked,
  labelId,
  onChange,
}: PrivacySwitchProps) {
  return (
    <div className="quiz-privacy-switch-row">
      <button
        aria-checked={checked}
        aria-describedby={labelId}
        className="quiz-privacy-switch"
        data-checked={checked ? "true" : "false"}
        role="switch"
        type="button"
        onClick={() => onChange(!checked)}
      >
        <span className="quiz-privacy-switch-track">
          <span className="quiz-privacy-switch-thumb" />
        </span>
      </button>
      <span className="quiz-privacy-switch-state">{checked ? "Oui" : "Non"}</span>
    </div>
  );
}
