// `qrious` não publica tipos próprios nem tem um pacote @types/qrious no
// registry (checado em 14/08/2026) — declaração mínima só com o que o
// projeto usa (components/publico/qr-code.tsx).
declare module "qrious" {
  export default class QRious {
    constructor(options: {
      element?: HTMLCanvasElement;
      value?: string;
      size?: number;
      background?: string;
      backgroundAlpha?: number;
      foreground?: string;
      foregroundAlpha?: number;
      level?: "L" | "M" | "Q" | "H";
      padding?: number | null;
    });
    toDataURL(mime?: string): string;
  }
}
