"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { buscarClientePorToken } from "@/lib/actions/clientes";
import { useToast } from "@/components/ui/toast";

const REGEX_TOKEN_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Decodifica o QR a partir de 1 foto (não de um vídeo ao vivo) — a decisão
 * é deliberada: um scanner de vídeo contínuo (getUserMedia + loop de canvas)
 * é mais "instantâneo", mas depende de permissão de câmera tratada à mão e
 * se comporta de forma inconsistente entre navegadores móveis (principal-
 * mente iOS Safari). Um <input type="file" capture="environment"> abre o
 * app de câmera nativo do aparelho — mais confiável num MVP testado por
 * quem não é técnico, ao custo de 1 toque a mais (tirar a foto).
 *
 * O texto decodificado pode ser a URL completa da página pública OU só o
 * token cru (ver app/(publico)/c/[token]/page.tsx — sem NEXT_PUBLIC_SITE_URL
 * configurada, o QR carrega só o token) — por isso extrai o UUID via regex
 * em vez de assumir um formato fixo, cobrindo os dois casos com a mesma lógica.
 */
async function extrairTokenDaFoto(arquivo: File): Promise<string | null> {
  const bitmap = await createImageBitmap(arquivo);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const contexto = canvas.getContext("2d");
  if (!contexto) return null;

  contexto.drawImage(bitmap, 0, 0);
  const imageData = contexto.getImageData(0, 0, canvas.width, canvas.height);
  const resultado = jsQR(imageData.data, imageData.width, imageData.height);
  if (!resultado) return null;

  const match = resultado.data.match(REGEX_TOKEN_UUID);
  return match ? match[0] : null;
}

/**
 * Botão "Escanear QR do cliente" em /clientes — identifica o cliente pelo
 * token_publico do QR e vai direto para o perfil dele (`/clientes/[id]`),
 * onde "Registrar compra" já é a ação mais visível — cobre a intenção da
 * arquitetura ("vai direto para a tela de registrar compra dele") sem
 * precisar de um mecanismo separado de auto-abrir modal via query param.
 */
export function ScanQrModal() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [pendente, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { mostrarToast } = useToast();

  function aoSelecionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    // Limpa o valor já aqui — sem isso, escolher a MESMA foto de novo depois
    // de um erro não dispara onChange na segunda vez (o browser só notifica
    // quando o valor muda).
    event.target.value = "";
    if (!arquivo) return;

    setErro(undefined);
    startTransition(async () => {
      const token = await extrairTokenDaFoto(arquivo);
      if (!token) {
        setErro("Não encontramos um QR válido nessa foto. Tire de novo, com o QR bem enquadrado.");
        return;
      }

      const cliente = await buscarClientePorToken(token);
      if (!cliente) {
        setErro("QR não reconhecido — não encontramos esse cliente.");
        return;
      }

      mostrarToast("sucesso", `${cliente.nome} identificado.`);
      setAberto(false);
      router.push(`/clientes/${cliente.id}`);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--brand-accent)] border border-[var(--border)] transition-colors hover:bg-[var(--surface-2)] flex items-center gap-2 justify-center"
      >
        📷 Escanear QR do cliente
      </button>

      {aberto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAberto(false)}
        >
          <div
            className="glass w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Escanear QR do cliente</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)]">
              Tire uma foto do QR mostrado na tela do cliente.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={aoSelecionarFoto}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={pendente}
              className="rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: "linear-gradient(135deg, var(--brand-primary-2), var(--brand-accent))" }}
            >
              {pendente ? "Lendo QR..." : "Abrir câmera"}
            </button>

            {erro ? (
              <p className="text-sm text-[var(--erro)]" role="alert">
                {erro}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
