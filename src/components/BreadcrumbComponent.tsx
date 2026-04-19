import { useLocation } from "react-router-dom";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";

export const BreadcrumbComponent: React.FC = () => {
  const ignoredSegments = ["web", "telegram"];
  const location = useLocation();
  const pathSegmentsOriginal = location.pathname.split("/").filter((segment) => segment);
  const pathSegments = [...pathSegmentsOriginal];
  const breadcrumbItems = pathSegments
    .filter((segment) => !ignoredSegments.includes(segment))
    .map((segment, index) => {
      const href = `${import.meta.env.VITE_FE_BASE_URL_PATH}/#/${pathSegmentsOriginal.slice(0, index + 2).join("/")}`;
      return (
        <React.Fragment key={segment}>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem key={segment}>
            <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
          </BreadcrumbItem>
        </React.Fragment>
      );
    });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
