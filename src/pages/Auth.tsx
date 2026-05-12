import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    wantsNewsletter: false,
  });
  const navigate = useNavigate();

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("¡Te enviamos un email para restablecer tu contraseña!");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Error al enviar el email");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.fullName,
              phone: form.phone,
              wants_newsletter: form.wantsNewsletter,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("¡Registro exitoso! Revisá tu email para confirmar tu cuenta.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Error al iniciar sesión con Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-3xl font-black italic text-foreground text-center mb-2">
          {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
        </h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          {isLogin
            ? "Ingresá con tu cuenta para continuar"
            : "Completá tus datos para registrarte"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre completo"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número de teléfono"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Contraseña"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="pl-10"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="flex items-center gap-3 py-2">
              <Checkbox
                id="newsletter"
                checked={form.wantsNewsletter}
                onCheckedChange={(checked) =>
                  setForm({ ...form, wantsNewsletter: checked === true })
                }
              />
              <label htmlFor="newsletter" className="text-sm text-muted-foreground cursor-pointer">
                Quiero recibir novedades y ofertas por email
              </label>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter text-lg py-6"
          >
            {loading
              ? "Cargando..."
              : isLogin
              ? "INGRESAR"
              : "REGISTRARME"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-4 py-6 font-semibold"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </Button>


        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isLogin
              ? "¿No tenés cuenta? Registrate"
              : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </div>

        {showForgot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-zinc-700/50 flex items-center justify-center p-4"
            onClick={() => setShowForgot(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-black italic text-foreground text-center mb-2">
                RECUPERAR CONTRASEÑA
              </h2>
              <p className="text-muted-foreground text-center text-sm mb-6">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-tighter text-lg py-6"
                >
                  {forgotLoading ? "Enviando..." : "ENVIAR ENLACE"}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Auth;
