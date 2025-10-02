"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

import { useI18n } from "@/hooks/use-i18n"

export interface PaginationProps {
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  const { t } = useI18n()

  const handleFirst = () => {
    if (currentPage > 1) {
      onPageChange(1)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleLast = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages)
    }
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between px-2 py-2", className)}>
      <div className="flex flex-1 items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>
              {t('common.entries_info', { startItem, endItem, totalCount })}
            </>
          ) : (
            "No entries"
          )}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center justify-center text-sm font-medium">
            {t('common.page_info', { currentPage, totalPages })}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleFirst}
              disabled={currentPage <= 1}
              title="Go to first page"
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handlePrevious}
              disabled={currentPage <= 1}
              title="Go to previous page"
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
              title="Go to next page"
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleLast}
              disabled={currentPage >= totalPages}
              title="Go to last page"
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
