import { ArrowRightIcon } from "lucide-react";
import { Link } from "@inertiajs/react";
import Container from "../global/container";
import Icons from "../global/icons";
import { Button } from "../ui/button";
import { OrbitingCircles } from "../ui/orbiting-circles";
import { BorderBeam } from "../ui/border-beam"; // ✅ Import here

const Hero = () => {
    return (
        <div className="relative flex flex-col items-center justify-center w-full py-20">
            {/* Mobile gradient background */}
            <div className="absolute flex lg:hidden size-40 rounded-full bg-blue-500 blur-[10rem] top-0 left-1/2 -translate-x-1/2 -z-10"></div>

            {/* Orbital circles */}
            <div className="flex flex-col items-center justify-center gap-y-8 relative">
                <Container className="hidden lg:flex absolute inset-0 top-0 mb-auto flex-col items-center justify-center w-full min-h-screen -z-10">
                    <OrbitingCircles speed={0.5} radius={300}>
                        <Icons.circle1 className="size-4 text-foreground/70" />
                        <Icons.circle2 className="size-1 text-foreground/80" />
                    </OrbitingCircles>
                    <OrbitingCircles speed={0.25} radius={400}>
                        <Icons.circle2 className="size-1 text-foreground/50" />
                        <Icons.circle1 className="size-4 text-foreground/60" />
                        <Icons.circle2 className="size-1 text-foreground/90" />
                    </OrbitingCircles>
                    <OrbitingCircles speed={0.1} radius={500}>
                        <Icons.circle2 className="size-1 text-foreground/50" />
                        <Icons.circle2 className="size-1 text-foreground/90" />
                        <Icons.circle1 className="size-4 text-foreground/60" />
                        <Icons.circle2 className="size-1 text-foreground/90" />
                    </OrbitingCircles>
                </Container>

                {/* Main content */}
                <div className="flex flex-col items-center justify-center text-center gap-y-4 bg-background/0">
                    {/* CTA button with glow effect */}
                    <Container className="relative hidden lg:block overflow-hidden">
                        <button className="group relative grid overflow-hidden rounded-full px-2 py-1 shadow-[0_1000px_0_0_hsl(0_0%_15%)_inset] transition-colors duration-200 mx-auto">
                            <span>
                                <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
                            </span>
                            <span className="backdrop absolute inset-[1px] rounded-full bg-background transition-colors duration-200 group-hover:bg-neutral-800" />
                            <span className="z-10 py-0.5 text-sm text-neutral-100 flex items-center">
                                <span className="px-2 py-[0.5px] h-[18px] tracking-wide flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-[9px] font-medium mr-2 text-white">
                                    NOUVEAU
                                </span>
                                <span className="bg-gradient-to-r from-sky-400 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient-x font-medium">
                                    Gérez vos locations plus efficacement
                                </span>
                            </span>
                        </button>
                    </Container>

                    {/* Heading */}
                    <Container delay={0.15}>
                        <h1 className="text-4xl md:text-4xl lg:text-7xl font-bold text-center !leading-tight max-w-4xl mx-auto">
                            Gérez vos réservations avec précision
                        </h1>
                    </Container>

                    {/* Subtext */}
                    <Container delay={0.2}>
                        <p className="max-w-xl mx-auto mt-2 text-base lg:text-lg text-center text-muted-foreground">
                            Simplifiez la gestion de vos véhicules, contrats et paiements au même endroit avec Taliani Auto.
                        </p>
                    </Container>

                    {/* CTA Button */}
                    <Container delay={0.25} className="z-20">
                        <div className="flex items-center justify-center mt-6 gap-x-4">
                            <a href="/login" className="flex items-center gap-2 group">
                                <Button size="lg">
                                    Se connecter
                                    <ArrowRightIcon className="size-4 group-hover:translate-x-1 transition-all duration-300" />
                                </Button>
                            </a>
                        </div>
                    </Container>

                    {/* Image and glow effects */}
                    <Container delay={0.3} className="relative">
                        <div className="relative rounded-xl lg:rounded-[32px] border border-border p-2 backdrop-blur-lg mt-10 max-w-6xl mx-auto">
                            {/* ✅ BorderBeam */}
                            <BorderBeam size={550} duration={10} delay={5} className="z-40" />

                            {/* Background glows */}
                            <div className="absolute top-1/8 left-1/2 -z-10 bg-gradient-to-r from-sky-500 to-blue-600 w-1/2 lg:w-3/4 -translate-x-1/2 h-1/4 -translate-y-1/2 inset-0 blur-[4rem] lg:blur-[10rem] animate-image-glow"></div>
                            <div className="hidden lg:block absolute -top-1/8 left-1/2 -z-20 bg-blue-600 w-1/4 -translate-x-1/2 h-1/4 -translate-y-1/2 inset-0 blur-[10rem] animate-image-glow"></div>

                            {/* Hero Image */}
                            <div className="rounded-lg lg:rounded-[22px] border border-border bg-background">
                                <img
                                    src="/images/dashboard.jpg"
                                    alt="dashboard"
                                    width={1920}
                                    height={1080}
                                    className="rounded-lg lg:rounded-[20px]"
                                />
                            </div>
                        </div>

                        {/* Bottom gradient overlay */}
                        <div className="bg-gradient-to-t from-background to-transparent absolute bottom-0 inset-x-0 w-full h-1/2"></div>
                    </Container>
                </div>
            </div>
        </div>
    );
};

export default Hero;
