import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPlatformUsers } from "../api";
import { canReadPlatformUsers, canUpdatePlatformUser, getCreatablePlatformRoles } from "../access-policy";
import { formatRoleLabel, getPlatformUserId } from "../types";

export const PlatformUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();
  const authorities = principal?.authorities ?? [];
  const canRead = canReadPlatformUsers(authorities);
  const canCreate = getCreatablePlatformRoles(authorities).length > 0;
  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["platformUsers"],
    queryFn: getPlatformUsers,
    enabled: canRead,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("platformUsers.title")}</h1>
        <Button onClick={() => navigate("/platform/users/new")} disabled={!canCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("platformUsers.create")}
        </Button>
      </div>

      {!canRead ? (
        <div className="py-10 text-center text-destructive">{t("platformUsers.loadError")}</div>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : isError ? (
        <div className="py-10 text-center text-destructive">{t("platformUsers.loadError")}</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("platformUsers.columns.firstName")}</TableHead>
                <TableHead>{t("platformUsers.columns.lastName")}</TableHead>
                <TableHead>{t("platformUsers.columns.email")}</TableHead>
                <TableHead>{t("platformUsers.columns.role")}</TableHead>
                <TableHead className="text-right">{t("common.list.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    {t("platformUsers.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={getPlatformUserId(user)}>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatRoleLabel(user.platformRole)}</TableCell>
                    <TableCell className="text-right">
                      {canUpdatePlatformUser(authorities, user.platformRole) ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.edit")}
                          onClick={() => navigate(`/platform/users/${getPlatformUserId(user)}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
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

export default PlatformUsersPage;
