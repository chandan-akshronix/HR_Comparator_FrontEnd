import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BrainCircuit, 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Github,
  Twitter,
  Linkedin as LinkedinIcon,
  FileText
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function HomePage({ onGetStarted, onLogin }: HomePageProps) {
  const features = [
    {
      icon: BrainCircuit,
      title: 'AI-Powered Matching',
      description: 'Advanced AgenticAI algorithms analyze resumes and match them with job descriptions with 95% accuracy',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Multi-Platform Fetching',
      description: 'Automatically fetch resumes from LinkedIn, Indeed, and Naukri.com in one click',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Smart Filtering',
      description: 'Sort candidates by skills, location, stability, experience, and AI match scores',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: TrendingUp,
      title: 'Stability Analysis',
      description: 'Predict candidate job stability and reduce turnover with machine learning insights',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Resumes Analyzed' },
    { value: '95%', label: 'Match Accuracy' },
    { value: '3x', label: 'Faster Hiring' },
    { value: '500+', label: 'Happy HR Teams' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Head of HR, TechCorp',
      content: 'This tool reduced our hiring time by 60%. The AI matching is incredibly accurate!',
      rating: 5,
    },
    {
      name: 'Rajesh Kumar',
      role: 'Talent Acquisition Manager',
      content: 'Game-changer for our recruitment process. The stability analysis helped us hire better.',
      rating: 5,
    },
    {
      name: 'Emily Chen',
      role: 'HR Director, StartupXYZ',
      content: 'Love the multi-platform resume fetching. Saves hours of manual work every week.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg">AgenticAI</h1>
                <p className="text-xs text-muted-foreground">Resume Comparator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onLogin}>
                Sign In
              </Button>
              <Button onClick={onGetStarted} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AgenticAI
            </Badge>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Find Perfect Candidates
              <br />
              10x Faster
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              AI-powered resume matching that automatically fetches, compares, and ranks candidates from LinkedIn, Indeed, and Naukri.com
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg h-14 px-8"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg h-14 px-8 border-2"
              >
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Features
            </Badge>
            <h3 className="text-4xl mb-4">
              Everything You Need to Hire Smart
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive AI-powered tools to streamline your recruitment process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl mb-3">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Process
            </Badge>
            <h3 className="text-4xl mb-4">
              How It Works
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to find your perfect candidate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Job Description',
                description: 'Simply upload your job description or paste the requirements',
                icon: '📄',
              },
              {
                step: '02',
                title: 'Fetch & Compare',
                description: 'AI automatically fetches resumes from multiple platforms and compares them',
                icon: '🤖',
              },
              {
                step: '03',
                title: 'Get Best Matches',
                description: 'Review ranked candidates sorted by skills, location, and stability',
                icon: '⭐',
              },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="text-6xl mb-6">{item.icon}</div>
                <div className="text-sm text-muted-foreground mb-2">Step {item.step}</div>
                <h4 className="text-xl mb-3">{item.title}</h4>
                <p className="text-muted-foreground">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 -right-4 text-4xl text-purple-300">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Testimonials
            </Badge>
            <h3 className="text-4xl mb-4">
              Loved by HR Teams Worldwide
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl sm:text-5xl mb-6">
            Ready to Transform Your Hiring?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of HR teams using AI to find better candidates faster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={onGetStarted}
              className="bg-white text-purple-600 hover:bg-slate-100 text-lg h-14 px-8"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-white border-2 border-white hover:bg-white/10 text-lg h-14 px-8"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-blue-100 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-medium">AgenticAI</div>
                  <div className="text-xs text-slate-400">Resume Comparator</div>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                AI-powered recruitment platform for modern HR teams
              </p>
            </div>
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2025 Akshronix. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}