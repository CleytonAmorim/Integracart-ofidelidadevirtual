/**
 * Banner de aviso de desconto de meio de ciclo — puramente apresentacional
 * (a condição de quando mostrar é calculada pelo caller, ver arquitetura
 * "Desconto na 5ª compra"). Sem estado, não precisa ser Client Component.
 */
export function DescontoBanner({ descricao }: { descricao: string }) {
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
      style={{
        borderColor: "var(--brand-accent)",
        background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)",
        color: "var(--brand-accent)",
      }}
    >
      <span aria-hidden="true">🎉</span>
      <span>Desconto disponível na próxima compra: {descricao}</span>
    </div>
  );
}
