import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  BarChart3, 
  Shield, 
  ArrowRight, 
  Star,
  CheckCircle,
  Zap,
  Globe,
  Heart,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Discussions",
      description: "Engage in live conversations with instant updates and notifications.",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Users,
      title: "Expert Community",
      description: "Connect with professionals and experts across various domains.",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "Get insights from sentiment analysis and engagement metrics.",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your consultations are protected with enterprise-grade security.",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    }
  ];

  const stats = [
    { label: "Active Users", value: "10K+" },
    { label: "Consultations", value: "50K+" },
    { label: "Expert Hours", value: "100K+" },
    { label: "Success Rate", value: "98%" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-100/50 to-teal-100/50 dark:from-green-900/20 dark:to-teal-900/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">E-Consult</span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')} 
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => navigate('/auth')} 
            className="px-4 h-9 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
            <Sparkles className="w-4 h-4 mr-2" />
            Trusted by 10,000+ professionals
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900 dark:text-slate-100 leading-tight">
            Connect. Consult.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Collaborate.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join the world's most trusted platform for professional consultations. 
            Get expert advice, share knowledge, and make informed decisions together.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="px-6 h-11 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="px-6 h-11 text-base font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
            Why Choose <span className="text-indigo-600 dark:text-indigo-400">E-Consult</span>?
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Experience the future of professional consultations with our cutting-edge platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-12 h-12 mx-auto rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-16">
        <Card className="bg-slate-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">
                Ready to Transform Your Professional Network?
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
                Join thousands of professionals who trust E-Consult for their most important decisions
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="px-6 h-11 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white transition-colors group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-6 h-11 text-base font-semibold text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-6 text-center text-slate-500 dark:text-slate-400">
        <p className="text-xs">&copy; 2025 E-Consult. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;