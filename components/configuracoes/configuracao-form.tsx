"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { atualizarConfiguracaoFidelidade, type ConfiguracaoFidelidade } from "@/lib/actions/fidelidade";
import { useToast } from "@/components/ui/toast";

type CampoProps = {
  id: string;
  name: string;
  label: string;
  ajuda?: string;
  defaultValue: string | number;
  type?: "text" | "number";
};

function Campo({ id, name, label, ajuda, defaultValue, type = "text" }: CampoProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-[var(--text-secondary)]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        min={type === "number" ? 1 : undefined}
        step={type === "number" ? 1 : undefined}
        required
        defaultValue={defaultValue}
        className="rounded-xl px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-accent)] transition-colors"
      />
      {ajuda ? <span className="text-xs text-[var(--text-muted)]">{ajuda}</span> : null}
    </div>
  );
}

/**
 * Formulário de /configuracoes — mesma convenção de useTransition + submit
 * manual dos outros formulários do app (ver ClienteFormModal para o racional
 * de evitar useActionState + useEffect). Diferente dos modais, essa tela é
 * usada raramente (regras do programa mudam pouco), então fica como página
 * cheia em vez de modal.
 */
export function ConfiguracaoForm({ config }: { config: ConfiguracaoFidelidade }) {
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const router = useRouter();
  const { mostrarToast } = useToast();

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErro(undefined);

    startTransition(async () => {
      const resultado = await atualizarConfiguracaoFidelidade({}, formData);
      if (!resultado.sucesso) {
        setErro(resultado.erro ?? "Não foi possível salvar.");
        return;
      }
      mostrarToast("sucesso", "Configurações salvas.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={aoEnviar} className="glass p-5 flex flex-col gap-5 max-w-lg">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Pontos e prêmio</h2>
        <Campo
          id="pontosPorCompra"
          name="pontosPorCompra"
          label="Pontos por compra"
          ajuda="Quantos pontos o cliente ganha a cada compra registrada, independente do valor."
          defaultValue={config.pontosPorCompra}
          type="number"
        />
        <Campo
          id="comprasParaPremio"
          name="comprasParaPremio"
          label="Compras para o prêmio"
          ajuda="Quantos pontos o cliente precisa juntar para poder resgatar o prêmio."
          defaultValue={config.comprasParaPremio}
          type="number"
        />
        <Campo
          id="descricaoPremio"
          name="descricaoPremio"
          label="Descrição do prêmio"
          ajuda='Ex.: "1 sorvete grande grátis" — aparece no botão de resgate e na página pública do cliente.'
          defaultValue={config.descricaoPremio}
        />
      </div>

      <div className="flex flex-col gap-4 pt-2 border-t border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Desconto de meio de ciclo</h2>
        <Campo
          id="comprasParaDesconto"
          name="comprasParaDesconto"
          label="Compras para o desconto"
          ajuda="Precisa ser menor que as compras para o prêmio — é um aviso no meio do caminho."
          defaultValue={config.comprasParaDesconto}
          type="number"
        />
        <Campo
          id="descontoDescricao"
          name="descontoDescricao"
          label="Descrição do desconto"
          ajuda='Ex.: "10% de desconto na próxima compra" — só informativo, não é aplicado automaticamente (sem integração com PDV).'
          defaultValue={config.descontoDescricao}
        />
      </div>

      <div className="flex flex-col gap-4 pt-2 border-t border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Classificação de clientes</h2>
        <Campo
          id="diasParaAtencao"
          name="diasParaAtencao"
          label={'Dias sem comprar para virar "Atenção"'}
          defaultValue={config.diasParaAtencao}
          type="number"
        />
        <Campo
          id="diasParaInativo"
          name="diasParaInativo"
          label={'Dias sem comprar para virar "Inativo"'}
          ajuda={'Precisa ser maior que o limite de "Atenção".'}
          defaultValue={config.diasParaInativo}
          type="number"
        />
      </div>

      {erro ? (
        <p className="text-sm text-[var(--erro)]" role="alert">
          {erro}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pendente}
        className="rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 transition-opacity"
        style={{ background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))" }}
      >
        {pendente ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
