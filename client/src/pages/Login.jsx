import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardBody } from "../components/ui/Card";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { BrandLogo } from "../components/ui/BrandLogo";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in both email and password");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success("Welcome back to Campus Life!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Login failed. Please check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas relative overflow-hidden text-ink">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            CAMPUS<span className="text-brand">LIFE</span>
          </h1>
          <p className="text-sm text-ink-muted mt-2">
            Sign in to access your event passes, check-ins, and club dashboards
          </p>
        </div>

        <Card className="border-surface-border shadow-card bg-surface">
          <CardBody className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="student@campus.edu"
                icon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
                icon={ArrowRight}
              >
                Sign In
              </Button>
            </form>

            <p className="text-center text-xs text-ink-muted mt-6">
              Don't have an account yet?{" "}
              <Link
                to="/register"
                className="text-brand font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
