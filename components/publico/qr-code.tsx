"use client";

import { useEffect, useRef } from "react";
import QRious from "qrious";

/**
 * Desenha um QR code num <canvas> via `qrious` (client-side — QRious lê o
 * elemento canvas real do DOM, não dá pra gerar isso num Server Component).
 * Sem tipos próprios publicados pelo pacote — ver types/qrious.d.ts.
 */
export function QrCode({ valor, tamanho = 180 }: { valor: string; tamanho?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    new QRious({
      element: canvasRef.current,
      value: valor,
      size: tamanho,
      background: "#FFFFFF",
      foreground: "#000000",
      level: "M",
    });
  }, [valor, tamanho]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="QR code do cartão fidelidade — mostre esta tela no balcão"
      className="rounded-xl"
    />
  );
}
