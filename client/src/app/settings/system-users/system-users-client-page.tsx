
"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle, UserPlus, Edit } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { getUsersFromGraphQL, saveUserClient, deleteUserClient } from "../../inventory/graphql-actions"
import type { DatabaseUser } from "@/lib/schemas/settings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { enUS, ja } from 'date-fns/locale'

type SystemUsersClientPageProps = {
  initialUsers: DatabaseUser[];
  initialError: string | null;
}

export default function SystemUsersClientPage({ initialUsers, initialError }: SystemUsersClientPageProps) {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<DatabaseUser[]>(initialUsers || []);
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition()
  const { t } = useI18n();
  const { toast } = useToast()
  const router = useRouter();

  // Fetch data when authenticated
  useEffect(() => {
    async function fetchData() {
      if (!authLoading && user) {
        setIsLoading(true);
        try {
          const usersResult = await getUsersFromGraphQL();

          if (usersResult.error) {
            setError('Failed to fetch users');
          } else {
            setUsers(usersResult.users);
          }
        } catch (error) {
          setError('Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [authLoading, user]);

  const handleDelete = (user: DatabaseUser) => {
    startTransition(async () => {
      const result = await deleteUserClient(user.id)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        
        // Refresh the users data from GraphQL
        try {
          const usersResult = await getUsersFromGraphQL();
          if (usersResult.error) {
            toast({
              title: t('actions.error'),
              description: 'Failed to refresh user data',
              variant: "destructive"
            });
          } else {
            setUsers(usersResult.users);
          }
        } catch (error) {
          console.error('Error refreshing users:', error);
          toast({
            title: t('actions.error'),
            description: 'Failed to refresh user data',
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
    })
  }

  const renderContent = () => {
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('actions.error')}</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('labels.userId')}</TableHead>
            <TableHead>{t('pages.settings.system_users.table_header_email')}</TableHead>
            <TableHead>{t('pages.settings.system_users.table_header_created')}</TableHead>
            <TableHead className="text-right w-[100px]">{t('pages.settings.system_users.table_header_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`loading-${index}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                    <div>
                      <div className="h-4 bg-muted animate-pulse rounded w-24 mb-1"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="h-8 bg-muted animate-pulse rounded w-16 ml-auto"></div>
                </TableCell>
              </TableRow>
            ))
          ) : users.length > 0 ? (
            users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {user.email}
                  {user.email_verified_at && (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {t('common.verified')}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.created_at ? format(user.created_at, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="icon" disabled={isPending}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{t('actions.edit')}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{t('actions.delete')}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('actions.delete_confirm_message', { item: user.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user)} disabled={isPending}>
                          {isPending ? t('actions.deleting') : t('actions.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      {authLoading ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Redirecting to login...</p>
          </div>
        </div>
      ) : (
        <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('nav.manage_system_users')}</CardTitle>
            <CardDescription>{t('pages.settings.system_users.description')}</CardDescription>
          </div>
          <Button disabled={isPending}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('actions.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border-l-4 border-blue-400 bg-blue-50 p-4 mb-4 rounded-r-lg">
          <p className="text-sm text-blue-800">
            {t('pages.settings.system_users.note')}
          </p>
        </div>
        {renderContent()}
      </CardContent>
    </Card>
      )}
    </>
  )
}
