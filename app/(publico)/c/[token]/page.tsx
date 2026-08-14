import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gerarTema, tokensParaCss } from "@/lib/theme/tokens";
import { ClientePublicoCard } from "@/components/publico/cliente-publico-card";

// Sem "use cache"/revalidate customizado aqui de propósito: pontos mudam a
// cada compra, e essa é a tela que o próprio cliente confere no celular —
// precisa estar sempre atual, não vale a pena cachear.
export default async function ClientePublicoPage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;

  const supabase = await createClient();
  // Sem sessão nenhuma aqui (rota pública, fora do proxy.ts) — a requisição
  // chega como role `anon`, que só tem EXECUTE nesta RPC (ver migração 0001,
  // "Página pública do cliente" na arquitetura). Nunca um select direto nas
  // tabelas: exporia todos os clientes de todos os estabelecimentos ao papel
  // anon, não só o do token da URL.
  const { data, error } = await supabase.rpc("buscar_cliente_publico", { p_token: token }).maybeSingle();

  if (error || !data) notFound();

  const tema = gerarTema(data.cor_primaria, data.cor_destaque);
  const temaStyle = Object.fromEntries(
    tokensParaCss(tema)
      .split(";")
      .map((par) => {
        const [chave, valor] = par.split(":").map((s) => s.trim());
        return [chave, valor];
      }),
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  // Sem NEXT_PUBLIC_SITE_URL configurada (ainda não implantado — deploy
  // adiado por decisão do usuário), o QR carrega só o token em vez da URL
  // completa: continua funcionando para o scanner do atendente em /clientes
  // (que extrai o token de qualquer jeito, com ou sem URL ao redor — ver
  // ScanQrModal), só não vira um link clicável por um app de QR genérico.
  const urlPublica = siteUrl ? `${siteUrl}/c/${token}` : token;

  const primeiroNome = data.nome.trim().split(" ")[0];

  return (
    <div
      style={temaStyle as React.CSSProperties}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <ClientePublicoCard
        primeiroNome={primeiroNome}
        pontos={data.pontos}
        comprasParaPremio={data.compras_para_premio}
        descricaoPremio={data.descricao_premio}
        comprasParaDesconto={data.compras_para_desconto}
        descontoDescricao={data.desconto_descricao}
        urlPublica={urlPublica}
      />
    </div>
  );
}
