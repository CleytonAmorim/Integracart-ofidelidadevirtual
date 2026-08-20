import { buscarDadosDashboard } from "@/lib/actions/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ClientesPorStatus } from "@/components/dashboard/clientes-por-status";
import { ComprasRecentes } from "@/components/dashboard/compras-recentes";
import { AniversariantesMes } from "@/components/dashboard/aniversariantes-mes";

export default async function DashboardPage() {
  const dados = await buscarDadosDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)]">Visão geral do programa de fidelidade.</p>
      </div>

      {dados ? (
        <>
          <StatsCards dados={dados} />
          <div className="grid gap-4 lg:grid-cols-2 items-start">
            <ClientesPorStatus dados={dados} />
            <ComprasRecentes compras={dados.comprasRecentes} />
            <AniversariantesMes aniversariantes={dados.aniversariantesMes} />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--erro)]">Não foi possível carregar os dados do dashboard.</p>
      )}
    </div>
  );
}
