import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isLogin
              ? "¿No tenés cuenta? Registrate"
              : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
