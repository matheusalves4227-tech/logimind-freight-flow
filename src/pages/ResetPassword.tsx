import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { AuthBranding } from "@/components/auth/AuthBranding";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Link inválido ou expirado");
        navigate("/auth");
      }
    });
  }, [navigate]);

  const validatePassword = () => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!validatePassword()) {
      toast.error("A senha não atende aos requisitos de segurança");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.functions.invoke('log-audit-action', {
          body: {
            action: 'password_change',
            reason: 'Password reset via email link',
            metadata: { reset_method: 'email_link' },
            userAgent: navigator.userAgent,
          }
        });
      }

      toast.success("Senha redefinida com sucesso!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message);
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
              Redefinir Senha
            </h1>
            <p className="text-muted-foreground text-sm lg:text-base">
              Crie uma nova senha segura para sua conta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <AuthInput
                id="password"
                label="Nova Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                icon="password"
              />
              {password.length > 0 && (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>

            <AuthInput
              id="confirmPassword"
              label="Confirmar Nova Senha"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              minLength={8}
              icon="password"
            />

            {/* Password match indicator */}
            {confirmPassword.length > 0 && (
              <p className={`text-xs ${password === confirmPassword ? "text-secondary" : "text-destructive"}`}>
                {password === confirmPassword ? "✓ As senhas coincidem" : "✗ As senhas não coincidem"}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-[hsl(217,82%,45%)] hover:from-primary/90 hover:to-[hsl(217,82%,40%)] shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
              disabled={loading || !validatePassword() || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Redefinir Senha"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar para login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
