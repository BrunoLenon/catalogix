import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Extendendo o tipo User para incluir a propriedade role
interface CustomUser extends User {
  role?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    // Verifica a sessão ativa e define o usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cancela a inscrição ao desmontar o componente
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Email ou senha incorretos');
        }
        throw new Error('Erro ao fazer login. Por favor, tente novamente.');
      }

      // Busca o perfil do usuário após o login
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // Corrigido o typo: 'profiles' em vez de 'profiles'
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        // Atualiza o usuário com a informação de role
        setUser({
          ...data.user,
          role: profile.role,
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login. Por favor, tente novamente.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigate('/login');
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw new Error('Erro ao fazer logout. Por favor, tente novamente.');
    }
  };

  const isAdmin = () => {
    return user !== null && user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
