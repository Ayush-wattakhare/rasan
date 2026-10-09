import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    icon: '🔍',
    title: 'Browse & Search',
    description: 'Explore meals from local vendors and find your favorites',
  },
  {
    icon: '🛒',
    title: 'Add to Cart',
    description: 'Select meals, customize your order, and add to cart',
  },
  {
    icon: '💳',
    title: 'Secure Checkout',
    description: 'Pay securely with multiple payment options',
  },
  {
    icon: '🚚',
    title: 'Track Delivery',
    description: 'Track your order in real-time until it reaches your door',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-background isolate">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl lg:text-4xl font-bold">How It Works</h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Get your favorite meals delivered in 4 simple steps
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-5 md:p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-primary/10 text-3xl md:text-4xl">
                      {step.icon}
                    </div>
                  </div>
                  <div className="mb-2 text-xs md:text-sm font-semibold text-primary">
                    Step {index + 1}
                  </div>
                  <h3 className="mb-2 text-base md:text-lg font-semibold">{step.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              {/* Connector arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary/30 text-2xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
