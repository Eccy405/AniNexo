import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { Section, Heading, Grid, Card, Text } from "@/components/ui";
import Image from "next/image";
import styles from "./AnimeShowcase.module.css";

const animeData = [
  { id: 1, title: "Frieren: Beyond Journey\'s End", poster: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80", genre: "Fantasy", rating: "9.5" },
  { id: 2, title: "Demon Slayer: Kimetsu no Yaiba", poster: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80", genre: "Action", rating: "9.0" },
  { id: 3, title: "Attack on Titan", poster: "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=400&q=80", genre: "Action", rating: "9.2" },
  { id: 4, title: "Jujutsu Kaisen", poster: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80", genre: "Supernatural", rating: "8.9" },
  { id: 5, title: "Chainsaw Man", poster: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&q=80", genre: "Action", rating: "8.7" },
  { id: 6, title: "Cyberpunk: Edgerunners", poster: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80", genre: "Sci-Fi", rating: "8.8" },
];

export default function AnimeShowcase() {
  return (
    <motion.section
      className={styles.animeSection}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <Section>
        <Heading as="h2" size="2xl" color="main" mb={6}>
          Anime Destacado
        </Heading>
        <Grid columns={3} gap={6}>
          {animeData.map((anime) => (
            <motion.div
              key={anime.id}
              className={styles.animeCard}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <div className={styles.posterContainer}>
                <Image 
                  src={anime.poster} 
                  alt={anime.title} 
                  width={400} 
                  height={500} 
                  className={styles.posterImage}
                />
                <div className={styles.cardBadge}>★ {anime.rating}</div>
                <div className={styles.infoOverlay}>
                  <span className={styles.genreBadge}>{anime.genre}</span>
                  <h3 className={styles.animeTitle}>{anime.title}</h3>
                  <button className={styles.btnWatch}>Ver Ahora</button>
                </div>
              </div>
            </motion.div>
          ))}
        </Grid>
      </Section>
    </motion.section>
  );
}
