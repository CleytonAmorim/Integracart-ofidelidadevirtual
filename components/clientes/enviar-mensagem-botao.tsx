import { linkWhatsapp, preencherTemplateMensagem } from "@/lib/utils/whatsapp";

type EnviarMensagemBotaoProps = {
  clienteNome: string;
  telefone: string;
  template: string;
};

/**
 * Botão de reengajamento — só renderizado pelo caller quando o status do
 * cliente é "atenção" ou "inativo" (ver ClientePage). Abre o WhatsApp com a
 * mensagem configurada em /configuracoes já pronta (mesmo padrão de
 * lib/utils/whatsapp.ts: o envio em si continua manual, 1 toque do
 * atendente). Link puro <a>, sem estado — não precisa de "use client".
 */
export function EnviarMensagemBotao({ clienteNome, telefone, template }: EnviarMensagemBotaoProps) {
  const mensagem = preencherTemplateMensagem(template, clienteNome);

  return (
    <a
      href={linkWhatsapp(telefone, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2 justify-center"
      style={{ background: "#25D366" }}
    >
      💬 Enviar mensagem no WhatsApp
    </a>
  );
}
