type StatCardProps = {
  label: string;
  value: number;
  description: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}
