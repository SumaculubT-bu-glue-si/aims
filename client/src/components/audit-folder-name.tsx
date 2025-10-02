'use client';

import { usePathname } from 'next/navigation';
import { useI18n } from '@/hooks/use-i18n';

interface AuditFolderNameProps {
  className?: string;
}

export function AuditFolderName({ className }: AuditFolderNameProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  // Extract the audit sub-folder from the pathname
  const getAuditSubFolder = (path: string): string | null => {
    const auditMatch = path.match(/\/audits\/([^\/]+)/);
    if (auditMatch && auditMatch[1] !== '[id]') {
      return auditMatch[1];
    }
    return null;
  };

  const subFolder = getAuditSubFolder(pathname);

  if (!subFolder) {
    return null;
  }

  // Get the translated name for the sub-folder
  const translatedName = t(`pages.audits.sub_folders.${subFolder}`);

  return (
    <span className={className}>
      {translatedName}
    </span>
  );
}
