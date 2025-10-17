import { useState, useCallback, useRef } from 'react'
import { PcFormValues } from '@/lib/types/index'

export function useDialogState() {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false);
    const [errorDialogState, setErrorDialogState] = useState({ isOpen: false, title: '', description: '' });

    const handleDeleteDialogOpen = () => {
        setIsDeleteDialogOpen(true);
    }

    const handleDetailedSearchOpen = () => {
        setIsDetailedSearchOpen(true);
    }

    const handleErrorDialogOpen = () => {
        setErrorDialogState({ isOpen: true, title: '', description: '' });
    }

    const handleErrorDialogClose = () => {  
        setErrorDialogState({ isOpen: false, title: '', description: '' });
    }

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDetailedSearchOpen,
    setIsDetailedSearchOpen,
    errorDialogState,
    setErrorDialogState,
    handleDeleteDialogOpen,
    handleDetailedSearchOpen,
    handleErrorDialogOpen,
    handleErrorDialogClose
  }
}
