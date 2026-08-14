import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarClientePorId } from "@/lib/actions/clientes";
import { buscarComprasDoCliente } from "@/lib/actions/compras";
import { buscarConfiguracaoFidelidade } from "@/lib/actions/fidelidade";
import { formataTelefone } from "@/lib/utils/telefone";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { RegistrarCompraModal } from "@/components/compras/registrar-compra-modal";
import { HistoricoCompras } from "@/components/compras/historico-compras";
import { ResgatarPremioModal } from "@/components/fidelidade/resgatar-premio-modal";
import { DescontoBanner } from "@/components/fidelidade/desconto-banner";
import { StatusBadge } from "@/components/clientes/status-badge";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ClientePage(props: PageProps<"/clientes/[id]">) {
  const { id } = await props.params;

  const cliente = await buscarClientePorId(id);
  if (!cliente) notFound();

  const [compras, config] = await Promise.all([
    buscarComprasDoCliente(cliente.id),
    buscarConfiguracaoFidelidade(),
  ]);

  // Mesma condição descrita na arquitetura ("Desconto na 5ª compra"): só um
  // dos dois avisos (desconto de meio de ciclo ou prêmio pronto) aparece por
  // vez, porque pontos < comprasParaPremio já exclui o caso de prêmio.
  const premioDisponivel = config ? cliente.pontos >= config.comprasParaPremio : false;
  const descontoDisponivel =
    config !== null &&
    !premioDisponivel &&
    cliente.pontos > 0 &&
    cliente.pontos % config.comprasParaDesconto === 0;
  const faltamParaPremio = config ? Math.max(0, config.comprasParaPremio - cliente.pontos) : null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Link
        href="/clientes"
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors w-fit"
      >
        ‹ Voltar para clientes
      </Link>

      <div className="glass p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{cliente.nome}</h1>
              <ClienteFormModal
                modo="editar"
                clienteId={cliente.id}
                textoBotao="✎"
                nomeInicial={cliente.nome}
                telefoneInicial={cliente.telefone}
                variante="icone"
              />
              {config ? (
                <StatusBadge
                  ultimaCompraEm={cliente.ultimaCompraEm}
                  diasParaAtencao={config.diasParaAtencao}
                  diasParaInativo={config.diasParaInativo}
                />
              ) : null}
            </div>
            <span className="text-sm text-[var(--text-muted)]">{formataTelefone(cliente.telefone)}</span>
          </div>

          <RegistrarCompraModal clienteId={cliente.id} clienteNome={cliente.nome} />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <span className="block text-lg font-bold text-[var(--brand-gold)]">{cliente.pontos}</span>
            <span className="block text-xs text-[var(--text-muted)]">pontos</span>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <span className="block text-lg font-bold">{formatarMoeda(cliente.totalGasto)}</span>
            <span className="block text-xs text-[var(--text-muted)]">total gasto</span>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <span className="block text-sm font-semibold pt-1">
              {cliente.ultimaCompraEm ? formatarData(cliente.ultimaCompraEm) : "—"}
            </span>
            <span className="block text-xs text-[var(--text-muted)]">última compra</span>
          </div>
        </div>

        {premioDisponivel && config ? (
          <ResgatarPremioModal
            clienteId={cliente.id}
            clienteNome={cliente.nome}
            descricaoPremio={config.descricaoPremio}
          />
        ) : descontoDisponivel && config ? (
          <DescontoBanner descricao={config.descontoDescricao} />
        ) : faltamParaPremio !== null ? (
          <span className="text-xs text-[var(--text-muted)]">
            Faltam {faltamParaPremio} compra{faltamParaPremio === 1 ? "" : "s"} para o prêmio
          </span>
        ) : null}

        <span className="text-xs text-[var(--text-muted)]">Cliente desde {formatarData(cliente.criadoEm)}</span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Histórico de compras</h2>
        <HistoricoCompras clienteId={cliente.id} compras={compras} />
      </div>
    </div>
  );
}
