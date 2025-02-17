type ProgressCircleProps = {
  estHours: number;
  headshot: string;
  initials: string;
};

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  estHours,
  initials,
  headshot,
}) => {
  const progress = Math.min(estHours / 40, 1); // Progress as a fraction (0 to 1)
  const color =
    estHours >= 45
      ? "red"
      : estHours >= 40
      ? "#FF3030"
      : estHours >= 30
      ? "orange"
      : "#1BDF1B";
  const diameter = 80; // Diameter of the circle
  const radius = diameter / 2; // Radius of the circle
  const strokeWidth = 8; // Width of the stroke
  const circumference = 2 * Math.PI * (radius - strokeWidth / 2); // Circumference of the circle
  const filledLength = progress * circumference; // Length of the circle filled based on progress

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: `${diameter}px`, height: `${diameter}px` }}
    >
      <svg
        className="absolute inset-0"
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
      >
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke="lightgray"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filledLength} ${circumference - filledLength}`}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </svg>
      {/* <ProfileIcon className="w-20 h-20" /> */}
      <div className="flex items-center justify-center w-16 h-16 bg-black rounded-full">
        <img
          className="max-w-full max-h-full rounded-full"
          src={headshot}
          alt={initials}
        />
      </div>
    </div>
  );
};

export default ProgressCircle;
