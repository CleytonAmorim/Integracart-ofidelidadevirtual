import type { DashboardDados } from "@/lib/actions/dashboard";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * 4 números-chave do estabelecimento — puramente apresentacional, os dados
 * já vêm agregados de buscarDadosDashboard().
 */
export function StatsCards({ dados }: { dados: DashboardDados }) {
  const cartoes = [
    { label: "Clientes cadastrados", valor: dados.totalClientes.toString() },
    { label: "Pontos em aberto", valor: dados.pontosEmAberto.toString() },
    { label: "Total gasto acumulado", valor: formatarMoeda(dados.totalGastoAcumulado) },
    { label: "Compras hoje", valor: dados.comprasHoje.toString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cartoes.map((cartao) => (
        <div key={cartao.label} className="glass p-4 flex flex-col gap-1">
          <span className="text-lg font-bold text-[var(--brand-gold)]">{cartao.valor}</span>
          <span className="text-xs text-[var(--text-muted)]">{cartao.label}</span>
        </div>
      ))}
    </div>
  );
}
