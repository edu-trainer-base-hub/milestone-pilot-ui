import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Loader2, MenuIcon, MoreHorizontal, Pencil, Plus, Trash2, User, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { notifier } from "@/services/NotificationService.ts";
import ProfileService, { type UserProfilesDto } from "@/services/ProfileService.ts";
import { shorten } from "@/services/utils/StringUtils.ts";

export const SecondaryProfilesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch profiles
  const {
    data: profiles = { items: [] },
    isLoading,
    isError,
  } = useQuery<UserProfilesDto>({
    queryKey: ["secondaryProfiles"],
    queryFn: ProfileService.listSecondaries,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => ProfileService.deleteSecondary(uuid),
    onSuccess: () => {
      notifier.success(t("pages.secondaryProfiles.notifications.deleteSuccess", "Profile deleted successfully"));
      queryClient.invalidateQueries({ queryKey: ["secondaryProfiles"] });
    },
    onError: () => {
      notifier.error(t("pages.secondaryProfiles.notifications.deleteError", "Failed to delete profile"));
    },
  });

  const handleDelete = async (uuid: string) => {
    if (confirm(t("pages.secondaryProfiles.confirmDelete", "Are you sure you want to delete this profile?"))) {
      await deleteMutation.mutateAsync(uuid);
    }
  };

  return (
    <div className="bg-background p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("pages.secondaryProfiles.title", "Secondary Profiles")}</h1>

      {/* Search & Create */}
      <div className="flex items-center space-x-2">
        <Input
          id="keyword"
          className="flex-1"
          placeholder={t("common.list.input.keywordSearch.placeholder", "Search...")}
          disabled
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" onClick={() => navigate("create")} className="p-2">
              <Plus className="w-5 h-5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("pages.secondaryProfiles.createButton.tooltip", "Create Profile")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      )}

      {!isLoading && isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("pages.secondaryProfiles.loadError", "Failed to load profiles.")}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-8/12 sm:min-w-1/2 text-center">
                  {t("pages.secondaryProfiles.columns.name", "Name")}
                </TableHead>
                <TableHead className="hidden sm:table-cell max-w-30 text-center">
                  {t("pages.secondaryProfiles.columns.username", "Username")}
                </TableHead>
                <TableHead className="hidden sm:table-cell max-w-30 text-center">
                  {t("pages.secondaryProfiles.columns.locale", "Locale")}
                </TableHead>
                <TableHead className="w-10">
                  <div className="grid place-items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Users className="w-4 h-4 cursor-pointer" aria-hidden="true" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("pages.secondaryProfiles.columns.ownership", "Ownership")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
                <TableHead className="w-10">
                  <div className="grid place-items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <MenuIcon className="w-4 h-4 cursor-pointer" aria-hidden="true" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("common.list.actions", "Actions")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    {t("pages.secondaryProfiles.empty", "No secondary profiles found.")}
                  </TableCell>
                </TableRow>
              ) : (
                profiles.items.map((profile) => (
                  <TableRow key={profile.uuid}>
                    <TableCell className="min-w-8/12 sm:min-w-1/2 truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {shorten(
                              profile.firstName && profile.lastName
                                ? `${profile.firstName} ${profile.lastName}`
                                : profile.username,
                              10
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="whitespace-normal break-words">
                            {profile.firstName && profile.lastName
                              ? `${profile.firstName} ${profile.lastName}`
                              : profile.username}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell max-w-40 truncate">{profile.username}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-40 truncate">
                      <div className="grid place-items-center">
                        <Badge variant="secondary" className="cursor-pointer">
                          {profile.locale}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="w-10 truncate">
                      <div className="grid place-items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("pages.secondaryProfiles.row.ownership.secondary", "Secondary")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="w-10 text-right">
                      <div className="grid place-items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-2">
                              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`${profile.uuid}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t("common.edit", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(profile.uuid)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("common.delete", "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SecondaryProfilesPage;
