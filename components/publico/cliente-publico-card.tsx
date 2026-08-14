import { QrCode } from "@/components/publico/qr-code";
import { DescontoBanner } from "@/components/fidelidade/desconto-banner";

type ClientePublicoCardProps = {
  primeiroNome: string;
  pontos: number;
  comprasParaPremio: number;
  descricaoPremio: string;
  comprasParaDesconto: number;
  descontoDescricao: string;
  urlPublica: string;
};

/**
 * Anel de progresso em CSS puro (conic-gradient) — sem lib de gráfico,
 * só a % de pontos/meta. `--brand-gold` já é a cor reservada do design
 * system pra esse tipo de destaque (ver arquitetura, paleta).
 */
function AnelProgresso({ pontos, meta }: { pontos: number; meta: number }) {
  const percentual = meta > 0 ? Math.min(100, Math.round((pontos / meta) * 100)) : 0;

  return (
    <div
      className="relative w-36 h-36 rounded-full flex items-center justify-center shrink-0"
      style={{
        background: `conic-gradient(var(--brand-gold) ${percentual}%, var(--surface-2) ${percentual}%)`,
      }}
    >
      <div
        className="absolute inset-2 rounded-full flex flex-col items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <span className="text-3xl font-bold text-[var(--brand-gold)]">{pontos}</span>
        <span className="text-xs text-[var(--text-muted)]">de {meta} pontos</span>
      </div>
    </div>
  );
}

export function ClientePublicoCard({
  primeiroNome,
  pontos,
  comprasParaPremio,
  descricaoPremio,
  comprasParaDesconto,
  descontoDescricao,
  urlPublica,
}: ClientePublicoCardProps) {
  const premioDisponivel = pontos >= comprasParaPremio;
  const descontoDisponivel = !premioDisponivel && pontos > 0 && pontos % comprasParaDesconto === 0;
  const faltamParaPremio = Math.max(0, comprasParaPremio - pontos);

  return (
    <div className="glass p-6 flex flex-col items-center gap-5 max-w-sm w-full text-center">
      <div>
        <h1 className="text-xl font-bold">Olá, {primeiroNome}!</h1>
        <p className="text-sm text-[var(--text-muted)]">Seu cartão fidelidade</p>
      </div>

      <AnelProgresso pontos={pontos} meta={comprasParaPremio} />

      {premioDisponivel ? (
        <div
          className="rounded-xl px-4 py-3 text-sm font-semibold w-full"
          style={{
            background: "color-mix(in srgb, var(--brand-gold) 15%, transparent)",
            border: "1px solid var(--brand-gold)",
            color: "var(--brand-gold)",
          }}
        >
          🎁 Prêmio disponível — {descricaoPremio}
          <br />
          <span className="font-normal text-xs">Mostre esta tela no balcão para resgatar.</span>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          Faltam {faltamParaPremio} compra{faltamParaPremio === 1 ? "" : "s"} para {descricaoPremio.toLowerCase()}
        </p>
      )}

      {descontoDisponivel ? <DescontoBanner descricao={descontoDescricao} /> : null}

      <div className="flex flex-col items-center gap-2 pt-2">
        <QrCode valor={urlPublica} tamanho={180} />
        <span className="text-xs text-[var(--text-muted)]">Mostre este QR no balcão na próxima compra</span>
      </div>
    </div>
  );
}
