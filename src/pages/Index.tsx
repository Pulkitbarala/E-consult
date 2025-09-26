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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 relative overflow-hidden">
      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-300 to-indigo-400 dark:from-blue-800 dark:to-indigo-900 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-300 to-teal-400 dark:from-green-800 dark:to-teal-900 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-pink-300 to-purple-400 dark:from-pink-800 dark:to-purple-900 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Updated Fonts and Colors */}
      <header className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-indigo-500 dark:from-indigo-700 dark:to-indigo-800 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-wide text-indigo-600 dark:text-indigo-300">E-Consult</span>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate('/auth')} className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Sign In
          </Button>
          <Button onClick={() => navigate('/auth')} className="px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white hover:scale-105 transition-transform">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 animate-fade-in bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <Sparkles className="w-5 h-5 mr-2" />
            Trusted by 10,000+ professionals
          </Badge>

          <h1 className="text-6xl md:text-8xl font-extrabold mb-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-800 bg-clip-text text-transparent animate-fade-in-up">
            Connect. Consult. Collaborate.
          </h1>

          <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Join the world's most trusted platform for professional consultations. 
            Get expert advice, share knowledge, and make informed decisions together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up delay-300">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="px-10 py-5 text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-700 dark:to-blue-800 text-white hover:scale-110 transition-transform">
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="px-10 py-5 text-xl font-bold text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110 transition-transform">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose <span className="text-primary">E-Consult</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of professional consultations with our cutting-edge platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-8 text-center space-y-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Professional Network?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of professionals who trust E-Consult for their most important decisions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/auth')}
                  className="px-8 py-4 text-lg group hover:scale-105 transition-transform"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-4 text-lg hover:scale-105 transition-transform"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
        <p className="text-sm">&copy; 2025 E-Consult. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;