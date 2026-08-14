import Link from "next/link";
import { STATUS_COR, STATUS_LABEL, type StatusCliente } from "@/lib/utils/classificacao";
import type { DashboardDados } from "@/lib/actions/dashboard";

const ORDEM: StatusCliente[] = ["ativo", "atencao", "inativo"];

/**
 * Contagem de clientes por status — mesma classificação usada em /clientes
 * e /clientes/[id] (lib/utils/classificacao.ts), aqui só somada. Barra
 * proporcional simples em vez de gráfico de verdade: com 1 estabelecimento
 * piloto e poucas dezenas de clientes, uma barra já comunica a proporção
 * sem precisar de uma lib de gráfico.
 *
 * Cada status é um link pra /clientes?status=... (item 11: o usuário
 * reportou que só a contagem aqui não bastava — precisava ver QUEM está em
 * cada status, não só quantos). Reaproveita a lista/cartão já existente de
 * /clientes em vez de duplicar uma lista de nomes aqui dentro do dashboard.
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
          <Link
            key={status}
            href={`/clientes?status=${status}`}
            className="flex items-center gap-2 text-sm rounded-lg -mx-1 -my-0.5 px-1 py-0.5 hover:bg-[var(--surface-2)] transition-colors"
          >
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: STATUS_COR[status] }}
            />
            <span className="text-[var(--text-secondary)]">{STATUS_LABEL[status]}</span>
            <span className="font-semibold">{dados.porStatus[status]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
