import { useForm } from "react-hook-form";
import { PcFormValues } from "@/lib/types/index";

export function useDetailedSearch() {
    const detailedSearchForm = useForm<PcFormValues>({
        defaultValues: {},
      });

  return {
    detailedSearchForm,
  }
}