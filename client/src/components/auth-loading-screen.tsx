import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Sparkles } from "lucide-react";

export function AuthLoadingScreen() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-dollar opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated money stack */}
        <div className="relative">
          {/* Sparkle effects */}
          <div className="absolute -top-4 -right-4 animate-pulse">
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="absolute -bottom-4 -left-4 animate-pulse delay-300">
            <Sparkles className="h-5 w-5 text-yellow-400" />
          </div>

          {/* Money stack animation */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
            
            <div className="relative bg-gradient-to-br from-primary to-primary/60 rounded-3xl p-8 shadow-2xl">
              {/* Stack of bills */}
              <div className="relative">
                <div className="absolute -rotate-12 animate-bill-1">
                  <DollarSign className="h-16 w-16 text-primary-foreground opacity-40" />
                </div>
                <div className="absolute rotate-12 animate-bill-2">
                  <DollarSign className="h-16 w-16 text-primary-foreground opacity-60" />
                </div>
                <div className="relative animate-bill-3">
                  <DollarSign className="h-20 w-20 text-primary-foreground" />
                </div>
              </div>
            </div>

            {/* Floating trend icon */}
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 animate-bounce-slow">
              <div className="bg-green-500 rounded-full p-2 shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground animate-fade-in">
            Rich Habits OS
          </h2>
          <p className="text-muted-foreground animate-fade-in-delayed">
            Loading your wholesale empire{dots}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary via-green-500 to-primary animate-progress" />
        </div>
      </div>

      <style>{`
        @keyframes float-dollar {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          50% {
            transform: translateY(-100vh) rotate(180deg);
            opacity: 0.1;
          }
          90% {
            opacity: 0.2;
          }
        }

        @keyframes bill-1 {
          0%, 100% {
            transform: translateY(0) rotate(-12deg);
          }
          50% {
            transform: translateY(-8px) rotate(-8deg);
          }
        }

        @keyframes bill-2 {
          0%, 100% {
            transform: translateY(0) rotate(12deg);
          }
          50% {
            transform: translateY(-6px) rotate(8deg);
          }
        }

        @keyframes bill-3 {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.05);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(-50%) translateX(0);
          }
          50% {
            transform: translateY(-50%) translateX(-8px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          30% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-float-dollar {
          animation: float-dollar linear infinite;
        }

        .animate-bill-1 {
          animation: bill-1 2s ease-in-out infinite;
        }

        .animate-bill-2 {
          animation: bill-2 2s ease-in-out infinite 0.2s;
        }

        .animate-bill-3 {
          animation: bill-3 2s ease-in-out infinite 0.4s;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.8s ease-out;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}
