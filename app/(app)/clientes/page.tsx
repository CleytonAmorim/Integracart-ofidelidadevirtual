import Link from "next/link";
import { buscarClientes } from "@/lib/actions/clientes";
import { buscarConfiguracaoFidelidade } from "@/lib/actions/fidelidade";
import { ClienteSearch } from "@/components/clientes/cliente-search";
import { ClienteCard } from "@/components/clientes/cliente-card";
import { ClienteFormModal } from "@/components/clientes/cliente-form-modal";
import { ScanQrModal } from "@/components/clientes/scan-qr-modal";
import { normalizaTelefone } from "@/lib/utils/telefone";
import { STATUS_LABEL, type StatusCliente } from "@/lib/utils/classificacao";

const STATUS_VALIDOS: StatusCliente[] = ["ativo", "atencao", "inativo"];

function statusDaQuery(valor: string | string[] | undefined): StatusCliente | undefined {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return STATUS_VALIDOS.find((status) => status === bruto);
}

export default async function ClientesPage(props: PageProps<"/clientes">) {
  const params = await props.searchParams;
  const qBruto = params.q;
  const q = (Array.isArray(qBruto) ? qBruto[0] : qBruto) ?? "";
  // Filtro por status — chegando dos links de "Clientes por status" no
  // dashboard (item 11: antes só dava pra ver a contagem, não quem é quem).
  const status = statusDaQuery(params.status);

  const [clientes, config] = await Promise.all([buscarClientes(q, status), buscarConfiguracaoFidelidade()]);
  const buscando = q.trim().length > 0;
  const digitosQuery = normalizaTelefone(q);
  // Um termo com 8+ dígitos foi digitado como telefone (não como nome) —
  // é o caso em que o botão "+ cadastrar outra pessoa com esse telefone"
  // (ver arquitetura, caso do Pedro/Maria com o mesmo número) faz sentido.
  const buscaEhTelefone = digitosQuery.length >= 8;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Clientes</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Busque por nome ou telefone para identificar o cliente, ou cadastre um novo.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ClienteSearch valorInicial={q} />
        </div>
        <ScanQrModal />
      </div>

      {status ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-secondary)]">
            Filtrando por status: <strong className="text-[var(--text-primary)]">{STATUS_LABEL[status]}</strong> (
            {clientes.length})
          </span>
          <Link href="/clientes" className="text-[var(--brand-accent)] hover:opacity-80 transition-opacity">
            ✕ limpar
          </Link>
        </div>
      ) : null}

      {buscando && clientes.length > 1 ? (
        <p className="text-sm text-[var(--brand-accent)]">
          {clientes.length} clientes encontrados — confirme o nome antes de registrar a compra.
        </p>
      ) : null}

      {!buscando && !status ? (
        <p className="text-xs text-[var(--text-muted)] -mb-2">Clientes cadastrados recentemente</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {clientes.map((cliente) => (
          <ClienteCard
            key={cliente.id}
            cliente={cliente}
            diasParaAtencao={config?.diasParaAtencao}
            diasParaInativo={config?.diasParaInativo}
          />
        ))}

        {buscando && clientes.length === 0 ? (
          <div className="glass p-6 text-center flex flex-col gap-3 items-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Nenhum cliente encontrado para “{q}”.
            </p>
            <ClienteFormModal
              textoBotao="Cadastrar novo cliente"
              nomeInicial={buscaEhTelefone ? "" : q}
              telefoneInicial={buscaEhTelefone ? digitosQuery : ""}
            />
          </div>
        ) : null}

        {!buscando && status && clientes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum cliente com status &quot;{STATUS_LABEL[status]}&quot;.</p>
        ) : null}

        {!buscando && !status && clientes.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nenhum cliente cadastrado ainda.</p>
        ) : null}
      </div>

      <div>
        <ClienteFormModal
          textoBotao={
            buscaEhTelefone
              ? "+ Cadastrar outra pessoa com esse telefone"
              : "+ Cadastrar novo cliente"
          }
          telefoneInicial={buscaEhTelefone ? digitosQuery : ""}
          variante="secundario"
        />
      </div>
    </div>
  );
}
