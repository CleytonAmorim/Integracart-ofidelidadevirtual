"use client";

import { useEffect, useRef } from "react";
import QRious from "qrious";

/**
 * Desenha um QR code num <canvas> via `qrious` (client-side — QRious lê o
 * elemento canvas real do DOM, não dá pra gerar isso num Server Component).
 * Sem tipos próprios publicados pelo pacote — ver types/qrious.d.ts.
 */
export function QrCode({ valor, tamanho = 260 }: { valor: string; tamanho?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    new QRious({
      element: canvasRef.current,
      value: valor,
      size: tamanho,
      background: "#FFFFFF",
      foreground: "#000000",
      // "H" (máxima correção de erro) em vez de "M" — o valor codificado é a
      // URL pública completa (~85 caracteres, bem mais denso que só o token),
      // e este QR é fotografado de tela pra tela por outro celular (reflexo,
      // foco, distância) em vez de impresso/escaneado de perto — precisa de
      // mais tolerância a ruído do que o padrão.
      level: "H",
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
