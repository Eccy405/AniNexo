import React from "react";
import { Container, Heading, Text } from "@/components/ui";
import Link from "next/link";
import styles from "./Footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container center py={8}>
        <Heading as="h3" size="lg" color="main" mb={4}>
          ANINEXO
        </Heading>
        <Text size="sm" color="muted">
          La plataforma definitiva para el fan de anime moderno.
        </Text>
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <Link href="/about">
            <Text size="sm" color="muted">Nosotros</Text>
          </Link>
          <Link href="/premium">
            <Text size="sm" color="muted">Premium</Text>
          </Link>
          <Link href="/api-docs">
            <Text size="sm" color="muted">API</Text>
          </Link>
        </div>
        <Text size="xs" color="muted" style={{ marginTop: '1.5rem' }}>
          © 2026 AniNexo Global - Desarrollado por Nexo Core
        </Text>
      </Container>
    </footer>
  );
};
