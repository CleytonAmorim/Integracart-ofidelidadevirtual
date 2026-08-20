import Link from "next/link";
import type { Aniversariante } from "@/lib/actions/dashboard";

const NOME_MES_ATUAL = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).format(
  new Date(),
);

export function AniversariantesMes({ aniversariantes }: { aniversariantes: Aniversariante[] }) {
  return (
    <div className="glass p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
        🎂 Aniversariantes de {NOME_MES_ATUAL}
      </h2>

      {aniversariantes.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nenhum cliente com data de nascimento cadastrada este mês.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {aniversariantes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className="flex items-center justify-between gap-3 py-2 rounded-lg px-2 -mx-2 hover:bg-[var(--surface-2)] transition-colors"
            >
              <span className="text-sm truncate">{cliente.nome}</span>
              <span className="text-xs text-[var(--text-muted)] shrink-0">dia {cliente.dia}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
