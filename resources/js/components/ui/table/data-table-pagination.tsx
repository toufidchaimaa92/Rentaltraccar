import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
}

const DataTablePagination: React.FC<PaginationProps> = ({
  pageIndex,
  pageCount,
  canPreviousPage,
  canNextPage,
  nextPage,
  previousPage,
}) => {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <span className="text-sm">
        Page {pageIndex + 1} of {pageCount}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={previousPage}
        disabled={!canPreviousPage}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={nextPage}
        disabled={!canNextPage}
        aria-label="Next page"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DataTablePagination;
