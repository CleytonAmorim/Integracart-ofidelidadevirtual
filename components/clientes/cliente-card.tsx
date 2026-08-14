import Link from "next/link";
import type { ClienteResumo } from "@/lib/actions/clientes";
import { formataTelefone } from "@/lib/utils/telefone";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ClienteCard({ cliente }: { cliente: ClienteResumo }) {
  return (
    <Link
      href={`/clientes/${cliente.id}`}
      className="glass p-4 flex items-center justify-between gap-4 hover:border-[var(--border-strong)] transition-colors"
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-semibold text-sm truncate">{cliente.nome}</span>
        <span className="text-xs text-[var(--text-muted)]">{formataTelefone(cliente.telefone)}</span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <span className="block text-sm font-bold text-[var(--brand-gold)]">{cliente.pontos} pts</span>
          <span className="block text-xs text-[var(--text-muted)]">
            {cliente.ultimaCompraEm
              ? `última compra ${formatarData(cliente.ultimaCompraEm)}`
              : `cadastrado ${formatarData(cliente.criadoEm)}`}
          </span>
        </div>
        <span className="text-[var(--text-muted)]">›</span>
      </div>
    </Link>
  );
}
