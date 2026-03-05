import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

const GlassCard = ({ children, className, hoverable = true, ...props }: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        'glass rounded-2xl p-5 transition-all duration-200',
        hoverable && 'glass-hover cursor-pointer',
        className
      )}
      whileHover={hoverable ? { y: -4 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
