import { Variants } from "framer-motion";

export const heroVariant: Variants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }
  }
};

export const fadeInUp: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 }
  }
};

export const revealVariant: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] } }
};

export const logoEnter: Variants = {
  hidden: { y: -50, opacity: 0, scale: 0.8 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 0.61, 0.36, 1] } }
};

export const logoFloat = {
  float: { y: [0, -10, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
};
