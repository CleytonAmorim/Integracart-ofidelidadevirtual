import Link from "next/link";
import type { CompraRecente } from "@/lib/actions/dashboard";

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ComprasRecentes({ compras }: { compras: CompraRecente[] }) {
  return (
    <div className="glass p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Compras recentes</h2>

      {compras.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhuma compra registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {compras.map((compra) => (
            <Link
              key={compra.id}
              href={`/clientes/${compra.clienteId}`}
              className="flex items-center justify-between gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="text-sm truncate">{compra.clienteNome}</span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[var(--text-muted)]">{formatarDataHora(compra.criadoEm)}</span>
                <span className="text-sm font-semibold">{formatarMoeda(compra.valor)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
