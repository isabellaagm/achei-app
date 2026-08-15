import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // As fotos vêm de URLs assinadas do R2 (domínio muda conforme a conta),
    // então usamos <img> normal em vez do otimizador de imagem do Next nos
    // componentes que listam fotos — aqui só liberamos qualquer https por
    // segurança extra caso algum <Image> passe a ser usado no futuro.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  // '@vladmandic/human' é importado dinamicamente e só no navegador (veja
  // src/lib/human-client.ts). Isso aqui é uma trava extra pra garantir que
  // o Next nunca tente empacotar a variante "node" da lib (que precisa do
  // binário nativo @tensorflow/tfjs-node) do lado do servidor.
  serverExternalPackages: ['@vladmandic/human'],
};

export default nextConfig;
