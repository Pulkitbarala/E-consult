// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { 
//   MessageSquare, 
//   Users, 
//   BarChart3, 
//   Shield, 
//   ArrowRight, 
//   Star,
//   CheckCircle,
//   Zap,
//   Globe,
//   Heart,
//   Sparkles
// } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
// import { ThemeToggle } from '@/components/ThemeToggle';

// const Index = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   useEffect(() => {
//     if (user) {
//       navigate('/feed');
//     }
//   }, [user, navigate]);

//   const features = [
//     {
//       icon: MessageSquare,
//       title: "Real-time Discussions",
//       description: "Engage in live conversations with instant updates and notifications.",
//       color: "text-blue-500",
//       bgColor: "bg-blue-50 dark:bg-blue-950/20"
//     },
//     {
//       icon: Users,
//       title: "Expert Community",
//       description: "Connect with professionals and experts across various domains.",
//       color: "text-green-500",
//       bgColor: "bg-green-50 dark:bg-green-950/20"
//     },
//     {
//       icon: BarChart3,
//       title: "Smart Analytics",
//       description: "Get insights from sentiment analysis and engagement metrics.",
//       color: "text-purple-500",
//       bgColor: "bg-purple-50 dark:bg-purple-950/20"
//     },
//     {
//       icon: Shield,
//       title: "Secure & Private",
//       description: "Your consultations are protected with enterprise-grade security.",
//       color: "text-orange-500",
//       bgColor: "bg-orange-50 dark:bg-orange-950/20"
//     }
//   ];

//   const stats = [
//     { label: "Active Users", value: "10K+" },
//     { label: "Consultations", value: "50K+" },
//     { label: "Expert Hours", value: "100K+" },
//     { label: "Success Rate", value: "98%" }
//   ];

//   return (
//     <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
//       {/* Subtle Animated Background Elements */}
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-100/50 to-teal-100/50 dark:from-green-900/20 dark:to-teal-900/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl animate-pulse delay-500"></div>
//       </div>

//       {/* Header */}
//       <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
//         <div className="flex items-center space-x-3">
//           <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
//             <MessageSquare className="w-5 h-5 text-white" />
//           </div>
//           <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">E-Consult</span>
//         </div>
//         <div className="flex items-center space-x-4">
//           <ThemeToggle />
//           <Button 
//             variant="ghost" 
//             onClick={() => navigate('/auth')} 
//             className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
//           >
//             Sign In
//           </Button>
//           <Button 
//             onClick={() => navigate('/auth')} 
//             className="px-4 h-9 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors"
//           >
//             Get Started
//           </Button>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="relative z-10 container mx-auto px-6 py-16 text-center">
//         <div className="max-w-4xl mx-auto">
//           <Badge variant="secondary" className="mb-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
//             <Sparkles className="w-4 h-4 mr-2" />
//             Trusted by 10,000+ professionals
//           </Badge>

//           <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-slate-100 leading-tight">
//             Connect. Consult.{" "}
//             <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
//               Collaborate.
//             </span>
//           </h1>

//           <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
//             Join the world's most trusted platform for professional consultations. 
//             Get expert advice, share knowledge, and make informed decisions together.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
//             <Button 
//               size="lg" 
//               onClick={() => navigate('/auth')} 
//               className="px-6 h-11 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors"
//             >
//               Get Started Free
//             </Button>
//             <Button 
//               size="lg" 
//               variant="outline" 
//               onClick={() => navigate('/auth')} 
//               className="px-6 h-11 text-base font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//             >
//               Learn More
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="relative z-10 container mx-auto px-6 py-16">
//         <div className="text-center mb-12">
//           <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
//             Why Choose <span className="text-indigo-600 dark:text-indigo-400">E-Consult</span>?
//           </h2>
//           <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
//             Experience the future of professional consultations with our cutting-edge platform
//           </p>
//         </div>
        
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {features.map((feature, index) => (
//             <Card 
//               key={index} 
//               className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
//             >
//               <CardContent className="p-6 text-center space-y-4">
//                 <div className={`w-12 h-12 mx-auto rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
//                   <feature.icon className={`w-6 h-6 ${feature.color}`} />
//                 </div>
//                 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
//                   {feature.title}
//                 </h3>
//                 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
//                   {feature.description}
//                 </p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="relative z-10 container mx-auto px-6 py-16">
//         <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
//           <CardContent className="p-8 text-center">
//             <div className="max-w-3xl mx-auto">
//               <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
//                 Ready to Transform Your Professional Network?
//               </h2>
//               <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
//                 Join thousands of professionals who trust E-Consult for their most important decisions
//               </p>
//               <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                 <Button 
//                   size="lg" 
//                   onClick={() => navigate('/auth')}
//                   className="px-6 h-11 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors group"
//                 >
//                   Get Started Free
//                   <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//                 <Button 
//                   size="lg" 
//                   variant="outline"
//                   className="px-6 h-11 text-base font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
//                 >
//                   Learn More
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </section>

//       {/* Footer */}
//       <footer className="relative z-10 container mx-auto px-6 py-6 text-center text-slate-500 dark:text-slate-400">
//         <p className="text-xs">&copy; 2025 E-Consult. All rights reserved.</p>
//       </footer>
//     </div>
//   );
// };

// export default Index;

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
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/feed", { replace: true });
  }, [user, navigate]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f7f8ff] dark:bg-slate-900 text-[#0f172a] dark:text-slate-100 overflow-hidden animate-page-smooth">
      {/* Page purple background overlay for desktop */}
      <div className="purple-page-bg" />
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-3 font-semibold text-lg">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          E-Consult
        </div>

        <nav className="hidden md:flex gap-6 text-[15px] font-medium text-slate-600 dark:text-slate-300">
          <button type="button" onClick={() => scrollToSection("features")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Features
          </button>
          <button type="button" onClick={() => scrollToSection("experts")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Experts
          </button>
          <button type="button" onClick={() => scrollToSection("pricing")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            Pricing
          </button>
          <button type="button" onClick={() => scrollToSection("about")} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            About
          </button>
        </nav>

        <div className="flex flex-wrap gap-3 items-center">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate("/auth", { replace: true })}>
            Sign In
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
            onClick={() => navigate("/auth", { replace: true })}
          >
            Get Started
          </Button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-14 lg:pt-16 pb-16 md:pb-20 lg:pb-24 grid lg:grid-cols-2 gap-12 xl:gap-16 items-center">
        <div>
          <Badge className="mb-6 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 animate-fade-in-up">
            E-consult + feedback for every industry
          </Badge>

          <h1 className="text-[clamp(36px,4.5vw,60px)] leading-tight md:leading-[1.05] font-extrabold mb-5 -tracking-[0.015em] animate-fade-in-up-delay-200">
            Consult with experts.
            <br />
            Collect feedback across any domain.
          </h1>

          <p className="text-[15px] md:text-base text-slate-600 dark:text-slate-300 max-w-lg mb-8 leading-relaxed animate-fade-in-up-delay-300">
            E-Consult is a unified space to ask, answer, and validate ideas with
            real-world feedback—built for healthcare, education, finance, product,
            policy, and every other industry.
          </p>

          <div className="flex flex-wrap gap-3 animate-fade-in-up-delay-400">
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 px-8 shadow-lg"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => scrollToSection("features")}
            >
              Learn More
            </Button>
          </div>
        </div>

        <UpperDashboard />
      </section>


      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 xl:py-24 grid md:grid-cols-4 gap-6">
        <Feature icon={<MessageSquare />} title="Consultations + Feedback" desc="Ask questions, run polls, and collect responses in one place." />
        <Feature icon={<Users />} title="Cross-Industry Expertise" desc="Reach verified professionals from any domain or market." />
        <Feature icon={<BarChart3 />} title="Decision-Ready Insights" desc="Turn feedback into clear signals with sentiment and trends." />
        <Feature icon={<Shield />} title="Secure by Design" desc="Private by default with enterprise-grade security controls." />
      </section>

      <section id="experts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 xl:py-24">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Experts who move decisions forward</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl">
              Tap into a network of verified specialists across healthcare, education, finance, product, and policy. Invite
              the right voices or open your consultation to a broader audience.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Expert name="Dr. Priya Singh" role="Healthcare Policy" />
              <Expert name="Miguel Reyes" role="Product Strategy" />
              <Expert name="Amina Yusuf" role="Education Research" />
              <Expert name="Chen Li" role="Risk & Compliance" />
            </div>
          </div>
          <Card className="glass-card-pro rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-3">Expert access, simplified</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
                Match by domain, invite to private consultations, or crowdsource insights in minutes.
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  Verified profiles with domain credentials
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  Targeted invitations and private rooms
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                  Moderation and visibility controls
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 xl:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Pricing</h2>
          <p className="text-slate-600 dark:text-slate-300">Free for individuals, chargeable for institutes.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card-pro rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl">
            <CardContent className="p-8">
              <Badge className="mb-4 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                Individuals
              </Badge>
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Unlimited consultations, community feedback, and insights.</p>
              <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span>Public consultations</span>
                <span>Commenting and likes</span>
                <span>Basic analytics</span>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card-pro rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl">
            <CardContent className="p-8">
              <Badge className="mb-4 bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200">
                Institutes
              </Badge>
              <h3 className="text-2xl font-bold mb-2">Chargeable</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Custom plans for universities, hospitals, NGOs, and enterprises.</p>
              <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span>Private consultations</span>
                <span>Admin controls and reporting</span>
                <span>Priority support</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 xl:py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">About E-Consult</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
          E-Consult brings experts and communities into one place to validate ideas with credible, cross-industry feedback.
          Built for speed, privacy, and real-world decisions, it helps teams and individuals move from questions to clarity.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 xl:py-24 text-center">
        <h2 className="text-3xl font-bold mb-16 animate-fade-in-up">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <Step title="Define the need" desc="Create a consultation or feedback request in minutes." />
          <Step title="Reach the right people" desc="Invite experts or open it to your audience." />
          <Step title="Act with confidence" desc="Analyze responses and move forward with clarity." />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 xl:pb-24">
        <Card className="glass-card-pro rounded-[28px] bg-gradient-to-br from-indigo-100/80 to-white/80 dark:from-indigo-500/10 dark:to-slate-900/60 border border-white/60 dark:border-white/10 shadow-xl backdrop-blur-xl animate-fade-in-up">
          <CardContent className="p-12 md:p-14 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to validate ideas across industries?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Launch consultations and feedback loops that work for any domain.
            </p>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 px-10 shadow-lg"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Get Started <ArrowUpRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
        © 2025 E-Consult. Built for every industry.
      </footer>
    </div>
  );
};

const UpperDashboard = () => (
  <div className="upper-hero relative flex justify-center items-center w-full">
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
  <Card className="glass-card-pro rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl hover:shadow-xl transition-all hover:-translate-y-1">
    <CardContent className="p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">{desc}</p>
    </CardContent>
  </Card>
);

const Step = ({ title, desc }: { title: string; desc: string }) => (
  <div className="glass-card-pro bg-white/70 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-sm hover:shadow-md transition">
    <h4 className="font-semibold mb-2">{title}</h4>
    <p className="text-sm text-slate-600 dark:text-slate-300">{desc}</p>
  </div>
);

export default Index;
