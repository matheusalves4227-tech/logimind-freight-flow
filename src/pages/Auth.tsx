import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { AuthBranding } from "@/components/auth/AuthBranding";

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(redirectUrl);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => {
          navigate(redirectUrl);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectUrl]);


  const validatePassword = () => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!validatePassword()) {
        toast.error("🔐 Senha fraca", {
          description: "A senha precisa ter 8+ caracteres, maiúscula, minúscula e número.",
          duration: 6000,
          style: { background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' },
        });
        setLoading(false);
        return;
      }

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

      toast.success("🎉 Conta criada com sucesso!", {
        description: "Você já pode fazer login com suas credenciais.",
        duration: 5000,
        style: { background: 'hsl(142, 76%, 36%)', color: 'white', border: 'none' },
      });
      setIsSignUp(false);
    } catch (error: any) {
      toast.error("❌ Erro ao criar conta", {
        description: error.message === "User already registered" 
          ? "Este email já está cadastrado. Tente fazer login." 
          : error.message,
        duration: 6000,
        style: { background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' },
      });
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

      toast.success("✅ Login realizado!", {
        description: "Redirecionando para o painel...",
        duration: 3000,
        style: { background: 'hsl(142, 76%, 36%)', color: 'white', border: 'none' },
      });
      setLoginAttempts(0);
    } catch (error: any) {
      setLoginAttempts(prev => prev + 1);
      const errorMsg = error.message === "Invalid login credentials" 
        ? "Email ou senha incorretos. Verifique e tente novamente."
        : error.message;
      toast.error("🔒 Falha no login", {
        description: errorMsg,
        duration: 6000,
        style: { background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' },
      });
      
      if (loginAttempts + 1 >= 2) {
        setTimeout(() => {
          toast("🔑 Esqueceu sua senha?", {
            description: `Após ${loginAttempts + 1} tentativas, recomendamos redefinir sua senha.`,
            duration: 8000,
            action: {
              label: "Redefinir",
              onClick: () => {
                setIsResetPassword(true);
                setIsSignUp(false);
              },
            },
            style: { background: 'hsl(38, 92%, 50%)', color: 'white', border: 'none' },
          });
        }, 1000);
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

      toast.success("📧 Email enviado!", {
        description: "Verifique sua caixa de entrada e spam para redefinir sua senha.",
        duration: 8000,
        style: { background: 'hsl(142, 76%, 36%)', color: 'white', border: 'none' },
      });
      setIsResetPassword(false);
    } catch (error: any) {
      toast.error("❌ Erro ao enviar email", {
        description: error.message,
        duration: 6000,
        style: { background: 'hsl(0, 84%, 60%)', color: 'white', border: 'none' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (hidden on mobile) */}
      <AuthBranding />

      {/* Right side - Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[hsl(210,20%,98%)]">
        <Card className="w-full max-w-md p-8 lg:p-10 shadow-xl border-0 bg-card rounded-[16px]">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Mobile logo */}
            <div className="lg:hidden inline-flex items-center gap-2 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold">LogiMarket</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold mb-2 text-foreground">
              {isResetPassword ? "Redefinir Senha" : isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              {isResetPassword
                ? "Digite seu email para receber instruções"
                : isSignUp
                ? "Comece a cotar com precificação inteligente"
                : "Acesse sua conta para continuar"}
            </p>
          </div>

          {/* Quote protection alert */}
          {reason === "quote" && !isResetPassword && (
            <Alert className="mb-6 border-accent/50 bg-accent/5">
              <AlertCircle className="h-4 w-4 text-accent" />
              <AlertDescription className="text-sm">
                <strong>Cotação Protegida:</strong> Para solicitar cotações de frete, você precisa estar autenticado. 
                {isSignUp ? " Crie sua conta gratuitamente." : " Faça login para continuar."}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form 
            onSubmit={isResetPassword ? handleResetPassword : isSignUp ? handleSignUp : handleSignIn} 
            className="space-y-5"
          >
            {isSignUp && !isResetPassword && (
              <AuthInput
                id="name"
                label="Nome completo"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={setName}
                required
                icon="user"
              />
            )}

            <AuthInput
              id="email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={setEmail}
              required
              icon="email"
            />

            {!isResetPassword && (
              <div>
                <AuthInput
                  id="password"
                  label="Senha"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={8}
                  icon="password"
                />
                {isSignUp && password.length > 0 && (
                  <PasswordStrengthIndicator password={password} />
                )}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-[hsl(217,82%,45%)] hover:from-primary/90 hover:to-[hsl(217,82%,40%)] shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
              disabled={loading || (isSignUp && !validatePassword() && password.length > 0)}
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

          {/* Footer links */}
          <div className="mt-6 text-center space-y-3">
            {!isResetPassword && !isSignUp && (
              <>
                {loginAttempts >= 2 && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-3">
                    <p className="text-sm text-foreground font-medium mb-1">
                      Não consegue acessar sua conta?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Após {loginAttempts} tentativas, recomendamos redefinir sua senha.
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
                  className={`text-sm hover:underline block w-full transition-colors ${
                    loginAttempts >= 2 
                      ? "text-accent font-semibold" 
                      : "text-primary hover:text-primary/80"
                  }`}
                >
                  Esqueceu sua senha?
                </button>
              </>
            )}
            
            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsResetPassword(false);
                  setLoginAttempts(0);
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isResetPassword
                  ? "← Voltar para login"
                  : isSignUp
                  ? "Já tem uma conta? Faça login"
                  : "Não tem uma conta? Cadastre-se"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
