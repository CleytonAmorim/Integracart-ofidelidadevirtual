import { STATUS_COR, STATUS_LABEL, type StatusCliente } from "@/lib/utils/classificacao";
import type { DashboardDados } from "@/lib/actions/dashboard";

const ORDEM: StatusCliente[] = ["ativo", "atencao", "inativo"];

/**
 * Contagem de clientes por status — mesma classificação usada em /clientes
 * e /clientes/[id] (lib/utils/classificacao.ts), aqui só somada. Barra
 * proporcional simples em vez de gráfico de verdade: com 1 estabelecimento
 * piloto e poucas dezenas de clientes, uma barra já comunica a proporção
 * sem precisar de uma lib de gráfico.
 */
export function ClientesPorStatus({ dados }: { dados: DashboardDados }) {
  const total = dados.totalClientes || 1;

  return (
    <div className="glass p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Clientes por status</h2>

      <div className="flex h-2 rounded-full overflow-hidden bg-[var(--surface-2)]">
        {ORDEM.map((status) => {
          const quantidade = dados.porStatus[status];
          const percentual = (quantidade / total) * 100;
          return quantidade > 0 ? (
            <div key={status} style={{ width: `${percentual}%`, background: STATUS_COR[status] }} />
          ) : null;
        })}
      </div>

      <div className="flex flex-wrap gap-4">
        {ORDEM.map((status) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COR[status] }}
            />
            <span className="text-[var(--text-secondary)]">{STATUS_LABEL[status]}</span>
            <span className="font-semibold">{dados.porStatus[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
