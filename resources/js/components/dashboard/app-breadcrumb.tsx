"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronsRight } from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import type { MouseEvent } from "react";
import { Fragment } from "react/jsx-runtime";

export function AppBreadcrumb() {
  const { url } = usePage();

  // 🧹 Clean URL (remove query params and trailing slash)
  const pathWithoutQuery = url.split("?")[0];
  const currentPath = pathWithoutQuery.endsWith("/")
    ? pathWithoutQuery.slice(0, -1)
    : pathWithoutQuery;
  const segments = currentPath.split("/").filter(Boolean);

  // 🪄 Dynamic breadcrumb generation with fallback
  const breadcrumbSegments = [
    { title: "Dashboard", url: "/dashboard" },
    ...segments.map((segment, index) => {
      const fullPath = `/${segments.slice(0, index + 1).join("/")}`;
      return {
        title:
          segment.charAt(0).toUpperCase() +
          segment.slice(1).replace(/-/g, " "),
        // Use the real path; only fallback to dashboard if the path is somehow empty
        url: fullPath && fullPath !== "/" ? fullPath : "/dashboard",
      };
    }),
  ];

  // 🏁 Get last segment (for mobile view)
  const currentSegment =
    breadcrumbSegments[breadcrumbSegments.length - 1]?.title || "Dashboard";

  const handleBreadcrumbClick = (href: string) => async (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();

    if (!href || href === "#") {
      router.visit("/dashboard");
      return;
    }

    try {
      const response = await fetch(href, {
        method: "HEAD",
        credentials: "include",
      });

      if (response.ok) {
        router.visit(href);
      } else {
        router.visit("/dashboard");
      }
    } catch (error) {
      console.error("Breadcrumb navigation failed", error);
      router.visit("/dashboard");
    }
  };

  return (
    <Breadcrumb
      className="bg-secondary/60 backdrop-blur-sm py-1.5 px-3 rounded-lg border border-border/40"
      aria-label="Breadcrumb navigation"
    >
      <BreadcrumbList>
        {/* 🏠 Always visible */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <Home className="inline h-4 w-4 text-muted-foreground" />
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* › Current Page on mobile */}
        {breadcrumbSegments.length > 1 && (
          <>
            <BreadcrumbSeparator>
              <ChevronsRight className="h-4 w-4 text-muted-foreground" />
            </BreadcrumbSeparator>

            {/* Mobile: only show current page */}
            <BreadcrumbItem className="md:hidden">
              <BreadcrumbPage className="font-medium text-primary">
                {currentSegment}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Full breadcrumb chain on desktop */}
        {breadcrumbSegments.slice(1).map((segment, index) => (
          <Fragment key={index}>
            {index < breadcrumbSegments.slice(1).length - 1 ? (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    href={segment.url}
                    onClick={handleBreadcrumbClick(segment.url)}
                  >
                    {segment.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block">
                  <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                </BreadcrumbSeparator>
              </>
            ) : (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbPage className="font-semibold text-primary">
                  {segment.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AppBreadcrumb;