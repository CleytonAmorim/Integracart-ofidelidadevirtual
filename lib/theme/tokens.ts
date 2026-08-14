import { converter, formatHex, wcagContrast } from "culori";

const toOklch = converter("oklch");

type Oklch = { mode: "oklch"; l: number; c: number; h?: number };

function oklch(l: number, c: number, h: number | undefined): string {
  return formatHex({ mode: "oklch", l, c, h } as Oklch);
}

function hueDe(hex: string): number {
  const cor = toOklch(hex);
  return cor?.h ?? 0;
}

export type ThemeTokens = {
  bg: string;
  bgGlow1: string;
  bgGlow2: string;
  surface1: string;
  surface2: string;
  brandPrimary: string;
  brandPrimary2: string;
  brandAccent: string;
  brandAccent2: string;
  brandGold: string;
  brandGold2: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
};

/**
 * Deriva a paleta escura completa do tema a partir das 2 cores configuráveis
 * por estabelecimento (cor_primaria, cor_destaque). Segue o mesmo padrão do
 * protótipo aprovado: fundo bem escuro no matiz da cor primária, superfícies
 * levemente mais claras, textos com leve tinta de marca para não ficarem
 * cinza puro.
 *
 * O dourado (brand-gold) é FIXO — não é derivado das cores do estabelecimento.
 * É um acento reservado (anel de progresso, botão de resgatar prêmio) com
 * significado universal de "isso é especial", igual uma cor de status: se
 * fosse tematizado, um estabelecimento com cor de destaque amarela faria o
 * dourado sumir visualmente. Ver seção de paleta em claude/arquitetura-mvp.md.
 */
export function gerarTema(corPrimaria: string, corDestaque: string): ThemeTokens {
  const huePrimaria = hueDe(corPrimaria);
  const hueDestaque = hueDe(corDestaque);

  // A cor de destaque em alta luminosidade dá o tom das bordas (com alpha,
  // via rgba — mais legível em CSS do que hex de 8 dígitos).
  const corBorda = oklch(0.72, 0.19, hueDestaque);

  return {
    bg: oklch(0.14, 0.05, huePrimaria),
    bgGlow1: oklch(0.35, 0.14, huePrimaria),
    bgGlow2: oklch(0.75, 0.12, hueDestaque),
    surface1: oklch(0.21, 0.07, huePrimaria),
    surface2: oklch(0.26, 0.08, huePrimaria),
    brandPrimary: oklch(0.38, 0.16, huePrimaria),
    brandPrimary2: oklch(0.5, 0.18, huePrimaria),
    brandAccent: corBorda,
    brandAccent2: oklch(0.83, 0.13, hueDestaque),
    brandGold: "#FFD400",
    brandGold2: "#FFE873",
    border: hexParaRgba(corBorda, 0.16),
    borderStrong: hexParaRgba(corBorda, 0.32),
    textPrimary: "#FFFFFF",
    textSecondary: oklch(0.82, 0.06, huePrimaria),
    textMuted: oklch(0.62, 0.07, huePrimaria),
  };
}

function hexParaRgba(hex: string, alpha: number): string {
  const limpo = hex.replace("#", "");
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Converte os tokens em CSS custom properties, prontas pra injetar num <style>. */
export function tokensParaCss(tokens: ThemeTokens): string {
  return [
    `--bg: ${tokens.bg}`,
    `--bg-glow-1: ${hexParaRgba(tokens.bgGlow1, 0.3)}`,
    `--bg-glow-2: ${hexParaRgba(tokens.bgGlow2, 0.1)}`,
    `--surface-1: ${tokens.surface1}`,
    `--surface-2: ${tokens.surface2}`,
    `--brand-primary: ${tokens.brandPrimary}`,
    `--brand-primary-2: ${tokens.brandPrimary2}`,
    `--brand-accent: ${tokens.brandAccent}`,
    `--brand-accent-2: ${tokens.brandAccent2}`,
    `--brand-gold: ${tokens.brandGold}`,
    `--brand-gold-2: ${tokens.brandGold2}`,
    `--border: ${tokens.border}`,
    `--border-strong: ${tokens.borderStrong}`,
    `--text-primary: ${tokens.textPrimary}`,
    `--text-secondary: ${tokens.textSecondary}`,
    `--text-muted: ${tokens.textMuted}`,
  ].join("; ");
}

/**
 * Checagem de contraste WCAG (texto) contra o fundo do tema — mesma prática
 * usada na aprovação do protótipo. Retorna false se texto primário/secundário
 * não atingirem 4.5:1 contra --bg, para pegar combinações de marca ruins cedo
 * (ex.: um estabelecimento com cor de destaque muito clara).
 */
export function validarContrasteTema(tokens: ThemeTokens): { ok: boolean; detalhes: string[] } {
  const detalhes: string[] = [];
  const contrastePrimario = wcagContrast(tokens.textPrimary, tokens.bg);
  const contrasteSecundario = wcagContrast(tokens.textSecondary, tokens.bg);

  if (contrastePrimario < 4.5) {
    detalhes.push(`Texto primário vs fundo: ${contrastePrimario.toFixed(2)}:1 (mínimo 4.5:1)`);
  }
  if (contrasteSecundario < 4.5) {
    detalhes.push(`Texto secundário vs fundo: ${contrasteSecundario.toFixed(2)}:1 (mínimo 4.5:1)`);
  }

  return { ok: detalhes.length === 0, detalhes };
}
