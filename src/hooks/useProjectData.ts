import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type ProjectType = Tables<"project_types">;
export type ProjectRecord = Tables<"project_records">;
export type Settings = Tables<"settings">;

export type RecordWithRelations = ProjectRecord & {
  clients: Client | null;
  project_types: ProjectType | null;
};

const keys = {
  clients: ["clients"] as const,
  types: ["project-types"] as const,
  records: ["project-records"] as const,
  settings: ["settings"] as const,
};

function humanError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Não foi possível concluir a operação.";
}

export function useClients() {
  return useQuery({
    queryKey: keys.clients,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectTypes(includeInactive = false) {
  return useQuery({
    queryKey: [...keys.types, includeInactive],
    queryFn: async () => {
      let query = supabase.from("project_types").select("*").order("display_order", { ascending: true }).order("name");
      if (!includeInactive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectRecords() {
  return useQuery({
    queryKey: keys.records,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_records")
        .select("*, clients(*), project_types(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecordWithRelations[];
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", true).single();
      if (error) throw error;
      return data;
    },
  });
}

export function usePlatformData(includeInactiveTypes = false) {
  const clients = useClients();
  const projectTypes = useProjectTypes(includeInactiveTypes);
  const records = useProjectRecords();
  const settings = useSettings();
  return {
    clients,
    projectTypes,
    records,
    settings,
    isLoading: clients.isLoading || projectTypes.isLoading || records.isLoading || settings.isLoading,
    error: clients.error || projectTypes.error || records.error || settings.error,
  };
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: keys.clients });
  queryClient.invalidateQueries({ queryKey: keys.types });
  queryClient.invalidateQueries({ queryKey: keys.records });
  queryClient.invalidateQueries({ queryKey: keys.settings });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"clients">) => {
      const { data: client, error } = await supabase.from("clients").insert(input).select("*").single();
      if (error) throw error;
      const { data: types, error: typeError } = await supabase.from("project_types").select("id").eq("is_active", true);
      if (typeError) throw typeError;
      if (types?.length) {
        const { error: recordError } = await supabase.from("project_records").insert(
          types.map((type) => ({ client_id: client.id, project_type_id: type.id })),
        );
        if (recordError) throw recordError;
      }
      return client;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Cliente cadastrado.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"clients"> }) => {
      const { error } = await supabase.from("clients").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Cliente atualizado.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Cliente excluído.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useCreateProjectType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"project_types">) => {
      const { data: type, error } = await supabase.from("project_types").insert(input).select("*").single();
      if (error) throw error;
      const { data: clients, error: clientError } = await supabase.from("clients").select("id");
      if (clientError) throw clientError;
      if (clients?.length && type.is_active) {
        const { error: recordError } = await supabase.from("project_records").insert(
          clients.map((client) => ({ client_id: client.id, project_type_id: type.id })),
        );
        if (recordError) throw recordError;
      }
      return type;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Tipo de projeto criado.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useUpdateProjectType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"project_types"> }) => {
      const { error } = await supabase.from("project_types").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Tipo de projeto atualizado.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useDeleteProjectType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Tipo de projeto excluído.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useUpdateProjectRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"project_records"> }) => {
      const { error } = await supabase.from("project_records").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Projeto atualizado.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TablesUpdate<"settings">) => {
      const { error } = await supabase.from("settings").update(values).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Configurações salvas.");
    },
    onError: (error) => toast.error(humanError(error)),
  });
}
