import { buscarConfiguracaoFidelidade } from "@/lib/actions/fidelidade";
import { ConfiguracaoForm } from "@/components/configuracoes/configuracao-form";

export default async function ConfiguracoesPage() {
  const config = await buscarConfiguracaoFidelidade();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Regras do programa de fidelidade — pontos, prêmio, desconto de meio de ciclo e classificação de
          clientes.
        </p>
      </div>

      {config ? (
        <ConfiguracaoForm config={config} />
      ) : (
        // Defensivo: toda estabelecimento nasce com 1 linha em
        // configuracao_fidelidade (seed/trigger), então isso não deveria
        // acontecer na prática — mas sem essa linha não há o que editar.
        <p className="text-sm text-[var(--erro)]">
          Não foi possível carregar as configurações. Tente recarregar a página.
        </p>
      )}
    </div>
  );
}
