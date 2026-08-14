import { notFound } from "next/navigation";
import Link from "next/link";
import { buscarClientePorId } from "@/lib/actions/clientes";
import { buscarComprasDoCliente } from "@/lib/actions/compras";
import { formataTelefone } from "@/lib/utils/telefone";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { RegistrarCompraModal } from "@/components/compras/registrar-compra-modal";
import { HistoricoCompras } from "@/components/compras/historico-compras";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Progresso até o prêmio e o banner de desconto de meio de ciclo entram no
// item 7 (junto com o botão de resgate) — aqui o perfil só mostra os pontos
// como número, sem essa lógica ainda (ver "Ordem de desenvolvimento" na
// arquitetura: item 6 é perfil/pontos/histórico, item 7 é resgate+desconto).
export default async function ClientePage(props: PageProps<"/clientes/[id]">) {
  const { id } = await props.params;

  const cliente = await buscarClientePorId(id);
  if (!cliente) notFound();

  const compras = await buscarComprasDoCliente(cliente.id);

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

        <span className="text-xs text-[var(--text-muted)]">Cliente desde {formatarData(cliente.criadoEm)}</span>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Histórico de compras</h2>
        <HistoricoCompras clienteId={cliente.id} compras={compras} />
      </div>
    </div>
  );
}
