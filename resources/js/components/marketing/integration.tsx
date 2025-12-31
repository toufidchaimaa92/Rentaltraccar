import { cn } from "@/lib";
import Container from "../global/container";
import Icons from "../global/icons";
import SvgIcon from "../global/iconssvg";

import { OrbitingCircles } from "../ui/orbiting-circles";
import MagicBadge from "../ui/magic-badge";

const SOCIAL_PLATFORMS = [
  { icon: Icons.youtube, position: "left-3", size: "small", iconSize: "small", className: "hidden lg:flex" },
  { icon: Icons.tiktok, position: "left-2", size: "medium", iconSize: "medium" },
  { icon: Icons.telegram, position: "left-1", size: "large", iconSize: "large" },
  { icon: Icons.insta, position: "right-2", size: "medium", iconSize: "medium" },
  { icon: Icons.x, position: "right-1", size: "large", iconSize: "large" },
  { icon: Icons.facebook, position: "right-3", size: "small", iconSize: "small", className: "hidden lg:flex" }
];

const AnimatedBeam = () => (
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 opacity-70 animate-pulse blur-[8px]" />
);

const Integration = () => {
  const getPositionClasses = (position: string) => {
    switch (position) {
      case "left-3": return "-translate-x-[285px]";
      case "left-2": return "-translate-x-[210px]";
      case "left-1": return "-translate-x-[125px]";
      case "right-1": return "translate-x-[125px]";
      case "right-2": return "translate-x-[210px]";
      case "right-3": return "translate-x-[285px]";
      default: return "";
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "large": return "size-20";
      case "medium": return "size-16";
      case "small": return "size-12";
      default: return "size-20";
    }
  };

  const getIconSizeClasses = (size: string) => {
    switch (size) {
      case "large": return "size-10";
      case "medium": return "size-7";
      case "small": return "size-5";
      default: return "size-10";
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-8 lg:py-12">
      <Container className="relative">
        {/* Suppression du conteneur avec image */}
      </Container>

      {/* MagicBadge */}
      <div className="relative hidden lg:flex items-center justify-center overflow-visible pt-2">
        <MagicBadge title="Integration" />
      </div>

      {/* Title and orbiting icons */}
      <div className="relative hidden lg:flex items-center justify-center overflow-visible pt-16">
        <h2 className="text-2xl md:text-4xl lg:text-6xl font-heading font-semibold !leading-snug">
          Social Media Integration
        </h2>
      </div>

      <Container delay={0.3}>
        <div className="relative hidden lg:flex items-center justify-center overflow-visible pt-20">
          <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-3/5 h-14 lg:h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full -rotate-12 blur-[6.5rem] -z-10" />
          <div className="absolute inset-0 -z-20">
            <OrbitingCircles />
          </div>

          {/* SvgIcon visible partout avec tailles responsive */}
          <div className="absolute z-20 flex items-center justify-center group">
            <SvgIcon className="w-16 h-16 sm:w-24 sm:h-24 group-hover:scale-110 transition-transform duration-500" />
          </div>

          {SOCIAL_PLATFORMS.map((platform, index) => (
            <div
              key={index}
              className={cn(
                "relative absolute z-20 size-16 p-3 rounded-full flex items-center justify-center shadow-xl shadow-black/10 backdrop-blur-lg transition-all duration-300 hover:scale-110",
                getPositionClasses(platform.position),
                getSizeClasses(platform.size),
                platform.className
              )}
            >
              <AnimatedBeam />
              <platform.icon
                className={cn(
                  "relative size-auto text-foreground",
                  getIconSizeClasses(platform.iconSize)
                )}
              />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Integration;
