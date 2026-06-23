import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { Section, Heading, Flex, Card, Text } from "@/components/ui";
import styles from "./PlatformBenefits.module.css";

const benefits = [
  { icon: "🧠", title: "IA Nexo", desc: "Recomendaciones que realmente entienden tus gustos más complejos." },
  { icon: "👥", title: "Comunidad", desc: "Conecta con miles de fans en un entorno diseñado para la discusión sana." },
  { icon: "⚡", title: "Velocidad", desc: "Navegación instantánea gracias a nuestra infraestructura Enterprise." },
];

export default function PlatformBenefits() {
  return (
    <motion.section
      className={styles.benefitsSection}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <Section>
        <Heading as="h2" size="2xl" color="main" mb={6}>
          Por qué elegir AniNexo
        </Heading>
        <Flex className="flex-responsive" gap={6} wrap>
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              className={styles.benefitCard}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <Text size="lg" color="primary" mb={2}>
                  {b.icon}
                </Text>
                <Heading as="h3" size="base" color="main" mb={2}>
                  {b.title}
                </Heading>
                <Text size="sm" color="muted">
                  {b.desc}
                </Text>
              </Card>
            </motion.div>
          ))}
        </Flex>
      </Section>
    </motion.section>
  );
}
