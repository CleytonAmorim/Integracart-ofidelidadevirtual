import { STATUS_COR, STATUS_LABEL, classificarCliente } from "@/lib/utils/classificacao";

type StatusBadgeProps = {
  ultimaCompraEm: string | null;
  diasParaAtencao: number;
  diasParaInativo: number;
};

/**
 * Ícone + rótulo do status do cliente (ativo/atenção/inativo) — nunca só a
 * cor (ver design system, "Cores de status"), para não depender de quem tem
 * boa percepção de cor pra entender o estado. Cores fixas, não tematizadas
 * (STATUS_COR não vem do estabelecimento).
 */
export function StatusBadge({ ultimaCompraEm, diasParaAtencao, diasParaInativo }: StatusBadgeProps) {
  const status = classificarCliente(ultimaCompraEm, diasParaAtencao, diasParaInativo);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
      style={{
        color: STATUS_COR[status],
        background: `color-mix(in srgb, ${STATUS_COR[status]} 15%, transparent)`,
      }}
    >
      <span aria-hidden="true">●</span>
      {STATUS_LABEL[status]}
    </span>
  );
}
