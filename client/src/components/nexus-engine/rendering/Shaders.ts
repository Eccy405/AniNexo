// ─── Crystal Shell Shader (Fresnel glow, no texture) ──────────────────────────
export const HoneycombShader = {
  vertexShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      // Correct normal for InstancedMesh with uniform scale
      mat3 im3 = mat3(instanceMatrix);
      vNormal = normalize(normalMatrix * im3 * normal);

      vec4 mvPos    = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position   = projectionMatrix * mvPos;
      vViewPosition = -mvPos.xyz;
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform vec3  glowColor;
    uniform vec3  baseColor;
    uniform float glowPower;
    uniform float opacity;

    void main() {
      vec3  n       = normalize(vNormal);
      vec3  v       = normalize(vViewPosition);
      float ndotv   = abs(dot(n, v));           // abs so DoubleSide works
      float fresnel = pow(1.0 - ndotv, glowPower);
      vec3  col     = mix(baseColor, glowColor, fresnel * 0.9);
      float alpha   = mix(opacity, 0.9, fresnel);
      gl_FragColor  = vec4(col, alpha);
    }
  `,
};

// ─── Poster Face Shader ────────────────────────────────────────────────────────
export const PosterShader = {
  vertexShader: /* glsl */`
    attribute vec2 aUvOffset;
    attribute vec2 aUvScale;
    varying   vec2 vTex;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      // uv is remapped to [0,1] by HexPosterFaces before upload
      vTex = aUvOffset + uv * aUvScale;
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D uAtlas;
    varying vec2 vTex;

    void main() {
      vec4 col = texture2D(uAtlas, clamp(vTex, 0.001, 0.999));
      gl_FragColor = col;
    }
  `,
};
