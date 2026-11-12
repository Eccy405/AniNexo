'use client';

import React from 'react';
import styles from './Scene3D.module.css';

export default function Scene3D() {
  return (
    <div className={styles.sceneRoot} aria-hidden="true">
      <div className={styles.cyberGrid} />
      <div className={styles.starsLayerSlow} />
      <div className={styles.starsLayerMedium} />
      <div className={styles.starsLayerBright} />
    </div>
  );
}
