/**
 * Tipos do banco escritos à mão a partir de supabase/migrations/0001_init.sql.
 *
 * TODO: assim que houver acesso ao Supabase CLI logado neste projeto, trocar
 * por `supabase gen types typescript --project-id qgpnozjaqoykzzmgafgt > types/database.ts`
 * para manter 100% sincronizado com o schema real.
 */

export type Database = {
  public: {
    Tables: {
      estabelecimentos: {
        Row: {
          id: string;
          nome: string;
          cor_primaria: string;
          cor_destaque: string;
          logo_url: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cor_primaria?: string;
          cor_destaque?: string;
          logo_url?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["estabelecimentos"]["Insert"]>;
      };
      usuarios_estabelecimento: {
        Row: {
          id: string;
          estabelecimento_id: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id: string;
          estabelecimento_id: string;
          nome: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios_estabelecimento"]["Insert"]>;
      };
      clientes: {
        Row: {
          id: string;
          estabelecimento_id: string;
          nome: string;
          telefone: string;
          pontos: number;
          total_gasto: number;
          ultima_compra_em: string | null;
          token_publico: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          estabelecimento_id: string;
          nome: string;
          telefone: string;
          pontos?: number;
          total_gasto?: number;
          ultima_compra_em?: string | null;
          token_publico?: string;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
      };
      compras: {
        Row: {
          id: string;
          cliente_id: string;
          estabelecimento_id: string;
          valor: number;
          pontos_gerados: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          estabelecimento_id: string;
          valor: number;
          pontos_gerados?: number;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compras"]["Insert"]>;
      };
      configuracao_fidelidade: {
        Row: {
          estabelecimento_id: string;
          pontos_por_compra: number;
          compras_para_premio: number;
          descricao_premio: string;
          compras_para_desconto: number;
          desconto_descricao: string;
          dias_para_atencao: number;
          dias_para_inativo: number;
        };
        Insert: {
          estabelecimento_id: string;
          pontos_por_compra?: number;
          compras_para_premio?: number;
          descricao_premio?: string;
          compras_para_desconto?: number;
          desconto_descricao?: string;
          dias_para_atencao?: number;
          dias_para_inativo?: number;
        };
        Update: Partial<Database["public"]["Tables"]["configuracao_fidelidade"]["Insert"]>;
      };
      resgates: {
        Row: {
          id: string;
          cliente_id: string;
          estabelecimento_id: string;
          pontos_utilizados: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          estabelecimento_id: string;
          pontos_utilizados: number;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resgates"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      buscar_cliente_publico: {
        Args: { p_token: string };
        Returns: {
          nome: string;
          pontos: number;
          criado_em: string;
          cor_primaria: string;
          cor_destaque: string;
          logo_url: string | null;
          compras_para_premio: number;
          descricao_premio: string;
          compras_para_desconto: number;
          desconto_descricao: string;
        }[];
      };
      estabelecimento_do_usuario_atual: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
};
