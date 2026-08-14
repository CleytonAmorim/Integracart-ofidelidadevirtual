/**
 * Tipos do banco escritos à mão a partir de supabase/migrations/0001_init.sql.
 * O formato (Row/Insert/Update/Relationships por tabela) segue a forma que o
 * @supabase/supabase-js espera dos genéricos (GenericTable/GenericSchema) —
 * sem "Relationships" o client não consegue resolver os tipos e cai em `never`.
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "usuarios_estabelecimento_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "clientes_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "compras_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compras_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "configuracao_fidelidade_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: true;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "resgates_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resgates_estabelecimento_id_fkey";
            columns: ["estabelecimento_id"];
            isOneToOne: false;
            referencedRelation: "estabelecimentos";
            referencedColumns: ["id"];
          },
        ];
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
    CompositeTypes: Record<string, never>;
  };
};
