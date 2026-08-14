import Link from "next/link";
import type { ClienteResumo } from "@/lib/actions/clientes";
import { formataTelefone } from "@/lib/utils/telefone";
import { RegistrarCompraModal } from "@/components/compras/registrar-compra-modal";

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function ClienteCard({ cliente }: { cliente: ClienteResumo }) {
  const hrefPerfil = `/clientes/${cliente.id}`;

  return (
    // Duas áreas separadas de <Link>, em vez de um <Link> envolvendo o card
    // inteiro: o botão de registrar compra abre um modal (com <form>) que
    // ficaria aninhado dentro de um <a>, o que é HTML inválido (interativo
    // dentro de interativo) e pode se comportar de forma inconsistente entre
    // navegadores. Nome/telefone e pontos/data continuam clicáveis para o
    // perfil (item 6); só o botão de compra fica fora dos links.
    <div className="glass p-4 flex items-center justify-between gap-4 hover:border-[var(--border-strong)] transition-colors">
      <Link href={hrefPerfil} className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="font-semibold text-sm truncate">{cliente.nome}</span>
        <span className="text-xs text-[var(--text-muted)]">{formataTelefone(cliente.telefone)}</span>
      </Link>

      <div className="flex items-center gap-3 shrink-0">
        <Link href={hrefPerfil} className="text-right">
          <span className="block text-sm font-bold text-[var(--brand-gold)]">{cliente.pontos} pts</span>
          <span className="block text-xs text-[var(--text-muted)]">
            {cliente.ultimaCompraEm
              ? `última compra ${formatarData(cliente.ultimaCompraEm)}`
              : `cadastrado ${formatarData(cliente.criadoEm)}`}
          </span>
        </Link>
        <RegistrarCompraModal clienteId={cliente.id} clienteNome={cliente.nome} variante="icone" />
        <Link href={hrefPerfil} className="text-[var(--text-muted)]">
          ›
        </Link>
      </div>
    </div>
  );
}
