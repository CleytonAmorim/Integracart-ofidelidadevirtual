"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { buscarClientePorToken } from "@/lib/actions/clientes";
import { useToast } from "@/components/ui/toast";

const REGEX_TOKEN_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Botão "Escanear QR do cliente" em /clientes — identifica o cliente pelo
 * token_publico do QR e vai direto para o perfil dele (`/clientes/[id]`),
 * onde "Registrar compra" já é a ação mais visível — cobre a intenção da
 * arquitetura ("vai direto para a tela de registrar compra dele") sem
 * precisar de um mecanismo separado de auto-abrir modal via query param.
 *
 * Leitura contínua via getUserMedia + loop de canvas (aponta e detecta
 * sozinho) — versão anterior usava <input capture> (1 foto por vez), trocada
 * a pedido do usuário: precisar tirar e confirmar uma foto a cada cliente
 * atrapalhava o fluxo de atendimento.
 *
 * O texto decodificado pode ser a URL completa da página pública OU só o
 * token cru (ver app/(publico)/c/[token]/page.tsx — sem NEXT_PUBLIC_SITE_URL
 * configurada, o QR carrega só o token) — por isso extrai o UUID via regex
 * em vez de assumir um formato fixo, cobrindo os dois casos com a mesma lógica.
 */
export function ScanQrModal() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | undefined>(undefined);
  const [identificando, setIdentificando] = useState(false);
  const [, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const router = useRouter();
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (!aberto) return;

    let cancelado = false;
    let travado = false; // trava o loop assim que um QR é decodificado, até resolver ou falhar

    const canvas = document.createElement("canvas");

    function loop() {
      if (cancelado || travado) return;
      const video = videoRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const contexto = canvas.getContext("2d");
        if (contexto) {
          contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = contexto.getImageData(0, 0, canvas.width, canvas.height);
          const resultado = jsQR(imageData.data, imageData.width, imageData.height);
          const match = resultado?.data.match(REGEX_TOKEN_UUID);
          if (match) {
            travado = true;
            processarToken(match[0]);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(loop);
    }

    function processarToken(token: string) {
      setIdentificando(true);
      startTransition(async () => {
        try {
          const cliente = await buscarClientePorToken(token);
          if (cancelado) return;
          if (!cliente) {
            setErro("QR não reconhecido — não encontramos esse cliente.");
            setIdentificando(false);
            travado = false;
            frameRef.current = requestAnimationFrame(loop);
            return;
          }
          mostrarToast("sucesso", `${cliente.nome} identificado.`);
          setAberto(false);
          router.push(`/clientes/${cliente.id}`);
        } catch {
          if (cancelado) return;
          setErro("Não foi possível identificar o cliente. Tente de novo.");
          setIdentificando(false);
          travado = false;
          frameRef.current = requestAnimationFrame(loop);
        }
      });
    }

    async function iniciarCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelado) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        frameRef.current = requestAnimationFrame(loop);
      } catch {
        if (!cancelado) {
          setErro("Não foi possível acessar a câmera — confira a permissão do navegador para este site.");
        }
      }
    }

    iniciarCamera();

    return () => {
      cancelado = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [aberto, router, mostrarToast]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErro(undefined);
          setIdentificando(false);
          setAberto(true);
        }}
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
              Aponte a câmera para o QR mostrado na tela do cliente.
            </p>

            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full aspect-square rounded-xl bg-black object-cover"
            />

            {identificando ? (
              <p className="text-sm text-[var(--text-secondary)]">Identificando cliente...</p>
            ) : null}

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
