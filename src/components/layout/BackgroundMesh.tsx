import { motion } from 'framer-motion';

const BackgroundMesh = () => {
  return (
    <motion.div
      className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.4 }}
      transition={{ duration: 1.5 }}
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, hsla(199, 89%, 48%, 0.15), transparent 50%),
          radial-gradient(ellipse at 80% 20%, hsla(262, 60%, 58%, 0.1), transparent 50%),
          radial-gradient(ellipse at 50% 80%, hsla(160, 84%, 39%, 0.08), transparent 50%)
        `,
        animation: 'meshShift 20s ease-in-out infinite',
        backgroundSize: '200% 200%',
      }}
    />
  );
};

export default BackgroundMesh;
