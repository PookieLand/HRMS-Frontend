import { useState } from "react";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/contexts/AlertContext";
import {
  type User,
  type UserRole,
  type UserStatus,
  formatRole,
  formatStatus,
  getStatusColor,
  canManageUser,
  suspendUser,
  activateUser,
  deleteUser,
  updateUserRole,
} from "@/lib/api/users";

interface UserManagementTableProps {
  users: User[];
  totalUsers: number;
  currentUserRole: UserRole;
  accessToken: string;
  isLoading?: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onFilterChange: (filters: { role?: UserRole; status?: UserStatus }) => void;
}

type DialogType = "suspend" | "activate" | "delete" | "changeRole" | null;

export function UserManagementTable({
  users,
  totalUsers,
  currentUserRole,
  accessToken,
  isLoading = false,
  page,
  pageSize,
  onPageChange,
  onRefresh,
  onFilterChange,
}: UserManagementTableProps) {
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const totalPages = Math.ceil(totalUsers / pageSize);

  const handleFilterChange = () => {
    onFilterChange({
      role: roleFilter !== "all" ? (roleFilter as UserRole) : undefined,
      status: statusFilter !== "all" ? (statusFilter as UserStatus) : undefined,
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const openDialog = (type: DialogType, user: User) => {
    setSelectedUser(user);
    setDialogType(type);
    if (type === "changeRole") {
      setNewRole(user.role);
    }
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setDialogType(null);
    setSuspendReason("");
    setNewRole("");
  };

  const handleSuspend = async () => {
    if (!selectedUser || !suspendReason.trim()) return;

    setIsActionLoading(true);
    try {
      await suspendUser(accessToken, selectedUser.id, { reason: suspendReason });
      showAlert({
        title: "User Suspended",
        message: `${selectedUser.first_name} ${selectedUser.last_name} has been suspended.`,
        variant: "success",
      });
      closeDialog();
      onRefresh();
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to suspend user",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;

    setIsActionLoading(true);
    try {
      await activateUser(accessToken, selectedUser.id);
      showAlert({
        title: "User Activated",
        message: `${selectedUser.first_name} ${selectedUser.last_name} has been activated.`,
        variant: "success",
      });
      closeDialog();
      onRefresh();
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to activate user",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsActionLoading(true);
    try {
      await deleteUser(accessToken, selectedUser.id, { soft_delete: true });
      showAlert({
        title: "User Deleted",
        message: `${selectedUser.first_name} ${selectedUser.last_name} has been deleted.`,
        variant: "success",
      });
      closeDialog();
      onRefresh();
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    setIsActionLoading(true);
    try {
      await updateUserRole(accessToken, selectedUser.id, {
        new_role: newRole as UserRole,
        reason: "Role change via admin panel",
      });
      showAlert({
        title: "Role Updated",
        message: `${selectedUser.first_name} ${selectedUser.last_name}'s role has been changed to ${formatRole(newRole as UserRole)}.`,
        variant: "success",
      });
      closeDialog();
      onRefresh();
    } catch (error) {
      showAlert({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const getAvailableRolesForChange = (): UserRole[] => {
    if (currentUserRole === "HR_Admin") {
      return ["HR_Manager", "manager", "employee"];
    }
    if (currentUserRole === "HR_Manager") {
      return ["manager", "employee"];
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="HR_Admin">HR Admin</SelectItem>
              <SelectItem value="HR_Manager">HR Manager</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setTimeout(handleFilterChange, 0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <p className="text-muted-foreground">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatRole(user.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(user.status)}
                    >
                      {formatStatus(user.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {canManageUser(currentUserRole, user.role) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {user.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => openDialog("suspend", user)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          )}

                          {user.status === "suspended" && (
                            <DropdownMenuItem
                              onClick={() => openDialog("activate", user)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => openDialog("changeRole", user)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => openDialog("delete", user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalUsers)} of {totalUsers} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Suspend Dialog */}
      <AlertDialog
        open={dialogType === "suspend"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              ? They will not be able to access the system until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="suspend-reason">Reason for suspension</Label>
            <Input
              id="suspend-reason"
              placeholder="Enter reason..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={!suspendReason.trim() || isActionLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog
        open={dialogType === "activate"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              ? They will be able to access the system again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={isActionLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={dialogType === "delete"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isActionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <AlertDialog
        open={dialogType === "changeRole"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change the role for{" "}
              <strong>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </strong>
              . This will affect their permissions in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="new-role">New Role</Label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as UserRole)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRolesForChange().map((role) => (
                  <SelectItem key={role} value={role}>
                    {formatRole(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeRole}
              disabled={!newRole || newRole === selectedUser?.role || isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
