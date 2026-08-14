import type { CompraItem } from "@/lib/actions/compras";
import { HistoricoCompraLinha } from "@/components/compras/historico-compra-linha";

/**
 * Lista o histórico de compras de um cliente — Server Component simples que
 * só passa adiante; o estado de edição/exclusão por linha vive em
 * HistoricoCompraLinha (Client Component), não aqui.
 */
export function HistoricoCompras({ clienteId, compras }: { clienteId: string; compras: CompraItem[] }) {
  if (compras.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Nenhuma compra registrada ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {compras.map((compra) => (
        <HistoricoCompraLinha key={compra.id} clienteId={clienteId} compra={compra} />
      ))}
    </div>
  );
}
