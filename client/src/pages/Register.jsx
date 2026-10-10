import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardBody } from "../components/ui/Card";
import { Mail, Lock, User, Building2, UserCheck } from "lucide-react";
import { BrandLogo } from "../components/ui/BrandLogo";

export const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    clubName: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      toast.success("Account created! Welcome to Campus Life.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas relative overflow-hidden py-12 text-ink">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-ink-muted mt-2">
            Join your college community to attend and organise events
          </p>
        </div>

        <Card className="border-surface-border shadow-card bg-surface">
          <CardBody className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wide text-ink-muted uppercase block mb-2">
                  Select Your Campus Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "student", label: "Student" },
                    { key: "club_admin", label: "Club Admin" },
                    { key: "volunteer", label: "Volunteer" },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.key}
                      onClick={() => handleRoleSelect(r.key)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        formData.role === r.key
                          ? "bg-brand text-brand-fg border-brand shadow-glow"
                          : "bg-surface-subtle text-ink-muted border-surface-border hover:border-brand/40 hover:text-ink"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Full Name"
                name="name"
                type="text"
                placeholder="Rahul Nokwal"
                icon={User}
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Campus Email Address"
                name="email"
                type="email"
                placeholder="student@campus.edu"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                required
              />

              {formData.role === "club_admin" && (
                <Input
                  label="Club / Society Name"
                  name="clubName"
                  type="text"
                  placeholder="Coding & Robotics Club"
                  icon={Building2}
                  value={formData.clubName}
                  onChange={handleChange}
                  required
                />
              )}

              <Input
                label="Password (min. 6 characters)"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
                icon={UserCheck}
              >
                Complete Registration
              </Button>
            </form>

            <p className="text-center text-xs text-ink-muted mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-brand font-semibold hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
