const LoadingSpinner = () => {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      viewBox="0 0 50 50"
    >
      <circle
        className="opacity-25"
        cx="25"
        cy="25"
        r="20"
        stroke="#FFFFFF" // Tailwind Gray-600
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="#1f2937" // Tailwind Gray-800
        d="M25 5a20 20 0 0 0 0 40v-4a16 16 0 1 1 0-32V5z"
      />
    </svg>
  );
};

export default LoadingSpinner;
