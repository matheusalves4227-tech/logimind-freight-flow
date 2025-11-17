import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const redirectUrl = searchParams.get("redirect") || "/";
  const reason = searchParams.get("reason");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(redirectUrl);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate(redirectUrl);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectUrl]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          }
        }
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso! Você já pode fazer login.");
      setIsSignUp(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      setLoginAttempts(0); // Reset attempts on success
    } catch (error: any) {
      setLoginAttempts(prev => prev + 1);
      toast.error(error.message);
      
      if (loginAttempts + 1 >= 2) {
        toast.info("Tendo problemas? Você pode redefinir sua senha.", {
          duration: 5000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) throw error;

      toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
      setIsResetPassword(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-3 bg-gradient-primary rounded-lg">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isResetPassword ? "Redefinir Senha" : isSignUp ? "Criar Conta" : "Entrar"} no{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              LogiMarket
            </span>
          </h1>
          <p className="text-muted-foreground">
            {isResetPassword
              ? "Digite seu email para receber instruções de redefinição"
              : isSignUp
              ? "Comece a cotar fretes com precificação inteligente"
              : "Acesse sua conta para continuar"}
          </p>
        </div>

        {reason === "quote" && !isResetPassword && (
          <Alert className="mb-6 border-accent bg-accent/5">
            <AlertCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-sm">
              <strong>Cotação Protegida:</strong> Para solicitar cotações de frete, você precisa estar autenticado. 
              {isSignUp ? " Crie sua conta gratuitamente para continuar." : " Faça login para continuar."}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={isResetPassword ? handleResetPassword : isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && !isResetPassword && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isResetPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : isResetPassword ? (
              "Enviar Email"
            ) : isSignUp ? (
              "Criar Conta"
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {!isResetPassword && !isSignUp && (
            <>
              {loginAttempts >= 2 && (
                <div className="bg-accent/10 border border-accent rounded-lg p-3 mb-3">
                  <p className="text-sm text-accent-foreground font-medium mb-2">
                    Não consegue acessar sua conta?
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Após {loginAttempts} tentativas sem sucesso, recomendamos redefinir sua senha.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsResetPassword(true);
                  setIsSignUp(false);
                  setLoginAttempts(0);
                }}
                className={`text-sm hover:underline block w-full ${
                  loginAttempts >= 2 
                    ? "text-accent font-semibold" 
                    : "text-primary"
                }`}
              >
                Esqueceu sua senha?
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setIsResetPassword(false);
              setLoginAttempts(0);
            }}
            className="text-sm text-primary hover:underline block w-full"
          >
            {isResetPassword
              ? "Voltar para login"
              : isSignUp
              ? "Já tem uma conta? Faça login"
              : "Não tem uma conta? Cadastre-se"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
