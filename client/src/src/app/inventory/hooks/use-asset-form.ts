import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pcSchema } from '@/lib/schemas/inventory'
import { PcFormValues, FrontendAsset } from '@/lib/types/index'
import { emptyFormValues } from '../constants'

export function useAssetForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<FrontendAsset | null>(null);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<PcFormValues>({
    resolver: zodResolver(pcSchema),
    defaultValues: {} as PcFormValues
  });

  const openForm = useCallback((asset?: FrontendAsset) => {
    if (asset) {
      setSelectedAsset(asset);
      form.reset(asset as PcFormValues);
    } else {
      setSelectedAsset(null);
      form.reset(emptyFormValues);
    }
    setIsFormOpen(true);
  }, [form]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedAsset(null);
    form.reset(emptyFormValues);
  }, [form]);

  const handleSubmit = useCallback(async (data: PcFormValues, onSubmit: (data: PcFormValues) => void) => {
    setIsPending(true);
    try {
      await onSubmit(data);
      closeForm();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsPending(false);
    }
  }, [closeForm]);

  return {
    // State
    isFormOpen,
    setIsFormOpen,
    selectedAsset,
    setSelectedAsset,
    isPending,
    form,
    
    // Actions
    openForm,
    closeForm,
    handleSubmit,
    setIsPending
  };
}