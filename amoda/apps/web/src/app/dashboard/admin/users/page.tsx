"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listUsers, suspendUser, unsuspendUser, updateUserRole } from "@/lib/api/admin";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isSuspended: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

interface UsersPage {
  data: AdminUser[];
  meta: { total: number };
}

const ROLES = [
  "CUSTOMER",
  "AGENT",
  "OWNER",
  "TENANT",
  "DEVELOPER",
  "PROPERTY_MANAGER",
  "MODERATOR",
  "SUPPORT_STAFF",
  "ACCOUNTANT",
  "MARKETING_MANAGER",
  "BRANCH_MANAGER",
  "REGIONAL_MANAGER",
  "ADMIN",
];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<UsersPage>({
    queryKey: ["admin-users"],
    queryFn: () => listUsers({ limit: 50 }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      suspended ? unsuspendUser(id) : suspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      <div className="space-y-3">
        {data?.data.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-semibold">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>

              <div className="flex items-center gap-2">
                {u.isSuspended && <Badge variant="muted">Suspended</Badge>}
                {!u.isEmailVerified && <Badge variant="muted">Unverified</Badge>}

                <select
                  className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
                  value={u.role}
                  onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => suspendMutation.mutate({ id: u.id, suspended: u.isSuspended })}
                >
                  {u.isSuspended ? "Unsuspend" : "Suspend"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
