import { normalizaTelefone } from "./telefone";

/**
 * Monta o link wa.me com a mensagem já preenchida. O envio em si continua
 * dependendo de um toque do atendente (abre o WhatsApp com tudo pronto,
 * "enviar" é manual) — a API oficial do WhatsApp fica de fora do MVP, ver
 * arquitetura. Se um dia isso mudar, é um acréscimo aqui, não uma reescrita.
 */
export function linkWhatsapp(telefoneDigitos: string, mensagem: string): string {
  const numero = normalizaTelefone(telefoneDigitos);
  // wa.me espera o número com código do país; assume Brasil (55) quando não informado.
  const numeroComPais = numero.length <= 11 ? `55${numero}` : numero;
  return `https://wa.me/${numeroComPais}?text=${encodeURIComponent(mensagem)}`;
}

export function mensagemBoasVindas(nomeCliente: string, nomeEstabelecimento: string, linkPublico: string): string {
  const primeiroNome = nomeCliente.trim().split(" ")[0];
  return `Oi, ${primeiroNome}! Seu cartão fidelidade da ${nomeEstabelecimento} está pronto 🎉\n\nAcompanhe seus pontos e mostre seu QR no balcão na próxima compra:\n${linkPublico}`;
}
