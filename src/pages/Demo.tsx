import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const Demo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const demoSteps = [
    {
      title: "LOCAL METRICS Platform",
      subtitle: "Complete CRM & Analytics Solution",
      duration: 10000,
      content: (
        <div className="text-center space-y-6">
          <div className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            LOCAL METRICS
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your business operations with our comprehensive platform for providers, partners, and administrators.
          </p>
        </div>
      )
    },
    {
      title: "Multi-User Dashboard System",
      subtitle: "Tailored experiences for every user type",
      duration: 10000,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-scale">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Providers</CardTitle>
              <CardDescription>Manage events, representatives, and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Events</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Representatives</span>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Partners</CardTitle>
              <CardDescription>CRM tools and campaign management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Campaigns</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Conversion Rate</span>
                  <span className="font-semibold">24.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Administrators</CardTitle>
              <CardDescription>System oversight and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Users</span>
                  <span className="font-semibold">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>System Health</span>
                  <span className="font-semibold text-green-500">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Real-Time Analytics",
      subtitle: "Comprehensive insights and reporting",
      duration: 10000,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Revenue Growth</span>
                  <span className="font-semibold text-green-500">+32%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>User Engagement</span>
                  <span className="font-semibold text-blue-500">+18%</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Customer Satisfaction</span>
                  <span className="font-semibold text-purple-500">94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <p>John Smith created new campaign</p>
                    <p className="text-muted-foreground text-xs">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <p>Maria Johnson updated event details</p>
                    <p className="text-muted-foreground text-xs">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>RW</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm">
                    <p>Robert Wilson generated report</p>
                    <p className="text-muted-foreground text-xs">12 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Advanced CRM Features",
      subtitle: "Powerful tools for customer relationship management",
      duration: 10000,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center p-6 hover-scale">
            <MessageSquare className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-barlow font-bold mb-2">Messaging</h3>
            <p className="text-sm text-muted-foreground">Automated campaigns and personalized communications</p>
          </Card>
          
          <Card className="text-center p-6 hover-scale">
            <Users className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-barlow font-bold mb-2">Account Management</h3>
            <p className="text-sm text-muted-foreground">Comprehensive customer lifecycle management</p>
          </Card>
          
          <Card className="text-center p-6 hover-scale">
            <Zap className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-barlow font-bold mb-2">Integrations</h3>
            <p className="text-sm text-muted-foreground">Connect with Zapier, Salesforce, and more</p>
          </Card>
          
          <Card className="text-center p-6 hover-scale">
            <BarChart3 className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-barlow font-bold mb-2">Campaign Analytics</h3>
            <p className="text-sm text-muted-foreground">Track performance and optimize results</p>
          </Card>
        </div>
      )
    },
    {
      title: "QR Code & Voucher System",
      subtitle: "Seamless digital voucher management",
      duration: 10000,
      content: (
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Voucher Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">1</Badge>
                    <span>Generate QR Code</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">2</Badge>
                    <span>Customer Scans Code</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">3</Badge>
                    <span>Voucher Validated</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">4</Badge>
                    <span>Analytics Updated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex-1">
            <Card className="p-8 text-center">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4">
                <div className="text-6xl">📱</div>
              </div>
              <h3 className="text-xl font-barlow font-bold mb-2">Mobile-First Design</h3>
              <p className="text-muted-foreground">Optimized for scanning and mobile interactions</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Get Started?",
      subtitle: "Transform your business operations today",
      duration: 10000,
      content: (
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-barlow font-bold">Start Your Free Trial</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of businesses already using LOCAL METRICS to streamline their operations and boost performance.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Watch Full Demo
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const increment = 100 / (demoSteps[currentStep]?.duration / 100) || 1;
        const newProgress = prev + increment;
        
        if (newProgress >= 100) {
          setCurrentStep(prevStep => {
            const nextStep = (prevStep + 1) % demoSteps.length;
            return nextStep;
          });
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentStep, demoSteps]);

  const currentStepData = demoSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Demo Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {demoSteps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step Content */}
        <div className="animate-fade-in" key={currentStep}>
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-barlow font-bold mb-4">
              {currentStepData?.title}
            </h1>
            <p className="text-xl text-muted-foreground">
              {currentStepData?.subtitle}
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {currentStepData?.content}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-12 space-x-2">
          {demoSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index);
                setProgress(0);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-primary scale-125' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Demo;