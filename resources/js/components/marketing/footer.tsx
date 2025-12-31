import { Head, Link } from "@inertiajs/react";
import Container from "../global/container";
import SvgIcon from "../global/iconssvg";

const Footer = () => {
    return (
        <footer className="flex flex-col relative items-center justify-center border-t border-foreground/5 pt-16 pb-8 px-6 lg:px-8 w-full max-w-6xl mx-auto lg:pt-32">
            <div className="grid gap-8 xl:grid-cols-3 xl:gap-8 w-full">
                <Container>
                    <div className="flex flex-col items-start justify-start md:max-w-[200px]">
                        <div className="flex items-center gap-2">
                            <SvgIcon className="h-8 w-8 text-foreground" />
                            <span className="text-base md:text-lg font-medium text-foreground">
                                PasterLink.com
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-4 text-sm text-start">
                            Write and share your paste easily with anyone, and track how many people viewed it!
                        </p>
                    </div>
                </Container>

                {/* Resources and Company side by side */}
                <div className="grid grid-cols-2 gap-8 mt-16 xl:col-span-2 xl:mt-0">
                    <Container className="h-auto">
                        <h3 className="text-base font-medium text-foreground">
                            Resources
                        </h3>
                        <ul className="mt-4 text-sm text-muted-foreground space-y-4">
                            <li>
                                <Link href="/blog" className="link hover:text-foreground transition-all duration-300">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/features" className="link hover:text-foreground transition-all duration-300">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/support" className="link hover:text-foreground transition-all duration-300">
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </Container>

                    <Container className="h-auto">
                        <h3 className="text-base font-medium text-foreground">
                            Company
                        </h3>
                        <ul className="mt-4 text-sm text-muted-foreground space-y-4">
                            <li>
                                <Link href="/about-us" className="link hover:text-foreground transition-all duration-300">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy-policy" className="link hover:text-foreground transition-all duration-300">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-and-conditions" className="link hover:text-foreground transition-all duration-300">
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </Container>
                </div>
            </div>

            <Container className="w-full relative mt-12 lg:mt-20">
                <div className="mt-8 md:flex md:items-center justify-center footer w-full">
                    <p className="text-sm text-muted-foreground mt-8 md:mt-0">
                        &copy; {new Date().getFullYear()} PasterLink.com All rights reserved.
                    </p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
