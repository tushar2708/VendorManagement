import { RangeSlider } from '../atoms/RangeSlider.js';

interface CriteriaWeightProps {
  readonly name: string;
  readonly weight: number;
  readonly onChange: (weight: number) => void;
}

export function CriteriaWeight({ name, weight, onChange }: CriteriaWeightProps): React.ReactElement {
  return (
    <div className="py-3">
      <RangeSlider value={weight} min={0} max={100} step={5} onChange={onChange} label={name} showValue />
    </div>
  );
}
