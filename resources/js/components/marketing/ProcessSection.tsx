import { TagIcon, ScissorsIcon, BarChart3Icon } from "lucide-react";
import Container from "../global/container";
import { MagicCard } from "../ui/magic-card";
import  MagicBadge  from "../ui/magic-badge";

const steps = [
  {
    title: "Organize Your Links",
    description: "Efficiently categorize and tag your links for quick access and easy management.",
    icon: <TagIcon className="w-6 h-6 text-blue-500" />,
    gradientFrom: "#60a5fa",
    gradientTo: "#3b82f6",
  },
  {
    title: "Shorten and Customize",
    description: "Create concise, branded links that are easy to share and track.",
    icon: <ScissorsIcon className="w-6 h-6 text-purple-500" />,
    gradientFrom: "#a78bfa",
    gradientTo: "#8b5cf6",
  },
  {
    title: "Analyze and Optimize",
    description: "Gain insights into link performance and optimize for better engagement.",
    icon: <BarChart3Icon className="w-6 h-6 text-green-500" />,
    gradientFrom: "#6ee7b7",
    gradientTo: "#10b981",
  },
];

const ProcessSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-center w-full py-20">
      <Container>
        {/* Badge */}
        <div className="flex flex-col items-center justify-center w-full py-8 max-w-xl mx-auto">
          <MagicBadge title="The Process" />
        </div>

        {/* Heading */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-heading font-medium !leading-snug">
            Effortless Link Management
          </h2>
          <p className="text-base md:text-lg text-accent-foreground/80 mt-4">
            A simple, powerful process to manage and track your links effectively.
          </p>
        </div>
      </Container>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative w-full">
        {steps.map((step, i) => (
          <Container key={i} delay={0.2}>
            <div className="rounded-2xl bg-background/40 relative border border-border/50 h-full">
              <MagicCard
                gradientFrom={step.gradientFrom}
                gradientTo={step.gradientTo}
                gradientColor="rgba(59,130,246,0.1)"
                className="p-6 lg:p-8 w-full h-full overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-lg">{step.icon}</div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </MagicCard>
            </div>
          </Container>
        ))}
      </div>
    </div>
  );
};

export default ProcessSection;
