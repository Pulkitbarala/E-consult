import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed");
  }, [user, navigate]);

  return (
    <div className="relative min-h-screen bg-[#f7f8ff] text-[#0f172a] overflow-hidden">
      {/* Page purple background overlay for desktop */}
      <div className="purple-page-bg" />
      <header className="max-w-7xl mx-auto px-8 py-4 md:py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 font-semibold text-lg">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          E-Consult
        </div>

        <nav className="hidden md:flex gap-6 text-[15px] font-medium text-slate-600">
          <span>Features</span>
          <span>Experts</span>
          <span>Pricing</span>
          <span>About</span>
        </nav>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </Button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-8 pt-12 md:pt-14 lg:pt-16 pb-16 md:pb-20 lg:pb-24 grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
        <div>
          <Badge className="mb-6 bg-indigo-100 text-indigo-600">
            Trusted by 10,000+ professionals
          </Badge>

          <h1 className="text-[clamp(36px,4.5vw,60px)] leading-tight md:leading-[1.05] font-extrabold mb-5 -tracking-[0.015em]">
            Connect with experts.
            <br />
            Make smarter decisions.
          </h1>

          <p className="text-[15px] md:text-base text-slate-600 max-w-lg mb-8 leading-relaxed">
            A secure platform for real-time professional consultations, insights,
            and collaboration.
          </p>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 px-8 shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="px-8">
              Learn More
            </Button>
          </div>
        </div>

        <UpperDashboard />
      </section>


      <section className="max-w-7xl mx-auto px-8 py-20 xl:py-24 grid md:grid-cols-4 gap-6">
        <Feature icon={<MessageSquare />} title="Real-time Discussions" desc="Engage in live conversations with instant updates." />
        <Feature icon={<Users />} title="Expert Community" desc="Connect with professionals across various domains." />
        <Feature icon={<BarChart3 />} title="Smart Analytics" desc="Get insights from sentiment analysis and engagement metrics." />
        <Feature icon={<Shield />} title="Secure & Private" desc="Enterprise-grade security for consultations." />
      </section>

      <section className="max-w-6xl mx-auto px-8 py-20 xl:py-24 text-center">
        <h2 className="text-3xl font-bold mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <Step title="Create Profile" desc="Set up your professional profile in minutes." />
          <Step title="Find Experts" desc="Browse verified experts by domain." />
          <Step title="Consult Securely" desc="Start encrypted consultations instantly." />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-8 pb-20 xl:pb-24">
        <Card className="rounded-[28px] bg-gradient-to-br from-indigo-100 to-white border shadow-xl">
          <CardContent className="p-12 md:p-14 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to transform your professional network?
            </h2>
            <p className="text-slate-600 mb-8">
              Join thousands of professionals who trust E-Consult.
            </p>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 px-10 shadow-lg"
              onClick={() => navigate("/auth")}
            >
              Get Started <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center text-sm text-slate-400 py-6">
        © 2025 E-Consult. All rights reserved.
      </footer>
    </div>
  );
};

const UpperDashboard = () => (
  <div className="upper-hero relative flex justify-center items-center">
    <div className="upper-aura" />

    <div className="upper-glass-card">
      <div className="upper-border-glow" />
      <img
        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80"
        alt="Dashboard Preview"
        className="upper-card-image"
      />
    </div>
  </div>
);

// Removed old chart mock; replaced by UpperDashboard card from upperpart.html

const Expert = ({ name, role }: { name: string; role: string }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 transition">
    <div>
      <div className="font-medium text-sm">{name}</div>
      <div className="text-xs text-slate-500">{role}</div>
    </div>
    <span className="text-xs text-indigo-600 font-semibold">Available</span>
  </div>
);

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <Card className="rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
    <CardContent className="p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </CardContent>
  </Card>
);

const Step = ({ title, desc }: { title: string; desc: string }) => (
  <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-sm text-slate-600">{desc}</p>
  </div>
);

export default Index;
