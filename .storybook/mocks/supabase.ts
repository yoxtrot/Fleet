export const isSupabaseConfigured = true

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: async () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
      }),
      single: async () => ({ data: null, error: null }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }),
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  }),
  storage: {
    from: () => ({
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://picsum.photos/seed/${encodeURIComponent(path)}/640/360` } }),
      createSignedUrl: async (path: string) => ({
        data: { signedUrl: `https://picsum.photos/seed/${encodeURIComponent(path)}/640/360` },
        error: null,
      }),
      upload: async () => ({ error: null }),
      remove: async () => ({ error: null }),
    }),
  },
}
