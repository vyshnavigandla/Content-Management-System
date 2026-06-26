// components/Spinner.jsx

const SIZE_MAP = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
  xl: 'w-16 h-16 border-4',
};

export default function Spinner({ 
  size = 'md', 
  text = '', 
  centered = true,
  className = '' 
}) {
  const spinner = (
    <div className={`${centered ? 'flex flex-col items-center justify-center' : 'inline-flex flex-col items-center'} py-4 ${className}`}>
      <div className={`${SIZE_MAP[size] || SIZE_MAP.md} border-gray-200 border-t-blue-600 rounded-full animate-spin`} />
      {text && (
        <p className="mt-3 text-sm text-gray-500 font-medium">{text}</p>
      )}
    </div>
  );

  return spinner;
}