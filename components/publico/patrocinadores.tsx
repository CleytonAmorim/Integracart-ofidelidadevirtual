const BASE_URL = "https://qgpnozjaqoykzzmgafgt.supabase.co/storage/v1/object/public/logos";

// Hardcoded de propósito — só o pilto (Frio a Frio) usa isso por enquanto,
// não vale a complexidade de uma tela de gerenciar patrocinadores ainda. Se
// crescer, isso vira uma tabela + upload pela UI, como o logo_url do
// estabelecimento.
const PATROCINADORES = [
  { nome: "Horta e Sacolão do Tolê", arquivo: "patrocinio-horta-e-sacolao-do-tole.jpeg" },
  { nome: "Espaço Integra", arquivo: "patrocinio-espaco-integra.jpeg" },
  { nome: "Supermercado do Povo", arquivo: "patrocinio-supermercado-do-povo.jpeg" },
];

/**
 * Rodapé de patrocinadores locais na página pública do cliente (/c/[token])
 * — deliberadamente FORA do card principal (components/publico/
 * cliente-publico-card.tsx): a função dessa tela é mostrar pontos/QR rápido
 * no balcão, patrocínio não pode competir visualmente com isso.
 */
export function Patrocinadores() {
  return (
    <div className="flex flex-col items-center gap-3 max-w-sm w-full pt-2">
      {PATROCINADORES.map((patrocinador) => (
        // eslint-disable-next-line @next/next/no-img-element -- imagem vinda do Storage do Supabase, domínio não cadastrado em next.config
        <img
          key={patrocinador.arquivo}
          src={`${BASE_URL}/${patrocinador.arquivo}`}
          alt={patrocinador.nome}
          className="w-full rounded-lg opacity-90"
        />
      ))}
      <p className="text-xs text-[var(--text-muted)] text-center pt-1">
        Quer ter sua logo aqui? Entre em contato: (31) 99854-4657
      </p>
    </div>
  );
}
