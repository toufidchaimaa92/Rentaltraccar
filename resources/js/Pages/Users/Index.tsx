import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Plus } from 'lucide-react';
import { PhoneInput } from '@/components/PhoneInput';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ErrorFeedback from '@/components/ui/error-feedback';
import {
  AdminPagination,
  AdminResourceCard,
  AdminSearchInput,
  AdminTable,
  AdminTableColumn,
  AdminTableRow,
  AdminSortState,
  adminPaginationFromLinks,
  buildPaginationModel,
} from '@/components/admin/admin-table';
import AdminMobileCard from '@/components/admin/AdminMobileCard';
import { PageProps } from '@/types';
import { resourceIcons } from '@/constants/resource-icons';

interface UserRecord {
  id: number;
  name: string;
  email: string | null;
  phone?: string | null;
  role: string;
  status: string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PaginatedUsers {
  data: UserRecord[];
  links: { url: string | null; label: string; active: boolean }[];
}

interface Props extends PageProps {
  users: PaginatedUsers;
  filters: {
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  };
  meta: {
    roles: string[];
    statuses: string[];
  };
}

const statusTone: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
  suspended: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  employee: 'Employé',
};

export default function UsersIndex({ auth, users, filters, meta }: Props) {
  const UserIcon = resourceIcons.adminUsers;
  const DEFAULT_ROLE = 'employee';
  const isAdmin = auth?.user?.role === 'admin';
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [search, setSearch] = useState(filters.search ?? '');
  const [sort, setSort] = useState<AdminSortState>({
    by: filters.sort_by ?? 'name',
    dir: (filters.sort_dir as 'asc' | 'desc' | undefined) ?? 'asc',
  });

  const createForm = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: DEFAULT_ROLE,
    status: 'active',
    notes: '',
  });

  const editForm = useForm({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: DEFAULT_ROLE,
    status: 'active',
    notes: '',
  });

  const resetCreateForm = () => {
    createForm.reset();
    createForm.setData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: DEFAULT_ROLE,
      status: 'active',
      notes: '',
    });
  };

  const openEditDialog = (user: UserRecord) => {
    setEditingUser(user);
    editForm.setData({
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
      password: '',
      role: user.role,
      status: user.status,
      notes: user.notes ?? '',
    });
    setEditOpen(true);
  };

  const applyFilters = ({
    search: nextSearch = search,
    sort: nextSort = sort,
  }: {
    search?: string;
    sort?: AdminSortState;
  } = {}) => {
    router.get(
      route('admin.users.index'),
      {
        search: nextSearch || undefined,
        sort_by: nextSort.by,
        sort_dir: nextSort.dir,
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
      }
    );
  };

  const handleSort = (column: string) => {
    const nextSort = {
      by: column,
      dir: sort.by === column && sort.dir === 'asc' ? 'desc' : 'asc',
    } as const;

    setSort(nextSort);
    applyFilters({ sort: nextSort });
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(route('admin.users.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setCreateOpen(false);
        resetCreateForm();
      },
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    editForm.put(route('admin.users.update', editingUser.id), {
      preserveScroll: true,
      onSuccess: () => setEditOpen(false),
    });
  };

  const deleteUser = (user: UserRecord) => {
    if (!confirm(`Supprimer ${user.name} ? Cette action est irréversible.`)) return;

    router.delete(route('admin.users.destroy', user.id), {
      preserveScroll: true,
    });
  };

  const columns = useMemo<AdminTableColumn[]>(
    () => {
      const base: AdminTableColumn[] = [
        { id: 'name', label: 'Nom', sortable: true },
        { id: 'email', label: 'Email', sortable: true },
        { id: 'phone', label: 'Téléphone', sortable: true },
        { id: 'role', label: 'Rôle', sortable: true },
        { id: 'status', label: 'Statut', sortable: true },
        { id: 'notes', label: 'Notes', headerClassName: 'max-w-[240px]' },
      ];

      if (isAdmin) {
        base.push({
          id: 'actions',
          label: 'Actions',
          headerClassName: 'text-right w-28',
          cellClassName: 'text-right',
        });
      }

      return base;
    },
    [isAdmin]
  );

  const paginationMeta = useMemo(
    () => adminPaginationFromLinks(users.links),
    [users.links]
  );

  const pagination: AdminPagination = useMemo(
    () => ({
      ...paginationMeta,
      model: buildPaginationModel(paginationMeta.current ?? 1, paginationMeta.last ?? 1),
      onPaginate: (e, url) => {
        e.preventDefault();
        if (!url) return;
        router.visit(url, {
          preserveScroll: true,
          preserveState: true,
          replace: true,
        });
      },
    }),
    [paginationMeta]
  );

  const renderRow = (user: UserRecord): AdminTableRow => {
    const cells: AdminTableRow['cells'] = [
      <span className="font-medium">{user.name}</span>,
      <span>{user.email || '—'}</span>,
      <span>{user.phone || '—'}</span>,
      <span className="capitalize">{roleLabels[user.role] ?? user.role}</span>,
      <Badge variant="outline" className={statusTone[user.status] ?? ''}>
        {statusLabels[user.status] ?? user.status}
      </Badge>,
      <p className="line-clamp-2 text-sm text-muted-foreground max-w-[240px]">
        {user.notes || '—'}
      </p>,
    ];

    if (isAdmin) {
      cells.push(
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => openEditDialog(user)}
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Modifier</span>
          </Button>
        </div>
      );
    }

    return { key: user.id, cells };
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Gestion des utilisateurs" />

      <div className="space-y-4 md:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border bg-card p-4 shadow-sm">
            <UserIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Gérer les comptes</h1>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <Button className="w-full gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Créer un utilisateur
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <AdminSearchInput
              value={search}
              onChange={(value) => setSearch(value)}
              onSearch={() => applyFilters({ search })}
              onReset={() => {
                setSearch('');
                applyFilters({ search: '' });
              }}
              resetVisible={!!search}
            />
          </div>
        </div>

        {(users.data || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
        ) : (
          (users.data || []).map((user) => (
            <AdminMobileCard
              key={user.id}
              items={[
                { label: "Nom", value: user.name, emphasis: true },
                { label: "Email", value: user.email || "—" },
                { label: "Téléphone", value: user.phone || "—" },
                { label: "Rôle", value: roleLabels[user.role] ?? user.role },
                {
                  label: "Statut",
                  value: (
                    <Badge variant="outline" className={statusTone[user.status] ?? ""}>
                      {statusLabels[user.status] ?? user.status}
                    </Badge>
                  ),
                },
                { label: "Notes", value: user.notes || "—" },
              ]}
              footer={
                isAdmin ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                ) : null
              }
            />
          ))
        )}
        {pagination.next && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => pagination.onPaginate({ preventDefault() {} } as React.MouseEvent<HTMLAnchorElement>, pagination.next)}
          >
            Charger plus
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Gérer les comptes</h1>
          </div>

          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer un utilisateur
          </Button>
        </div>

        <AdminResourceCard
          className="mt-6"
          title="Annuaire des utilisateurs"
          icon={<UserIcon className="h-5 w-5" />}
          actions={
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
              <AdminSearchInput
                value={search}
                onChange={(value) => setSearch(value)}
                onSearch={() => applyFilters({ search })}
                onReset={() => {
                  setSearch('');
                  applyFilters({ search: '' });
                }}
                resetVisible={!!search}
              />
            </div>
          }
        >
          <AdminTable
            columns={columns}
            data={users.data}
            renderRow={renderRow}
            sort={sort}
            onSort={handleSort}
            emptyMessage="Aucun utilisateur trouvé."
            pagination={pagination}
          />
        </AdminResourceCard>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitCreate}>
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
              />
              <ErrorFeedback message={createForm.errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={createForm.data.email}
                onChange={(e) => createForm.setData('email', e.target.value)}
              />
              <ErrorFeedback message={createForm.errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <PhoneInput
                id="phone"
                value={createForm.data.phone}
                onChange={(value) => createForm.setData('phone', value || '')}
                placeholder="Téléphone"
              />
              <ErrorFeedback message={createForm.errors.phone} />
              <p className="text-xs text-muted-foreground">Email ou téléphone requis.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe temporaire</Label>
              <Input
                id="password"
                type="password"
                value={createForm.data.password}
                onChange={(e) => createForm.setData('password', e.target.value)}
              />
              <ErrorFeedback message={createForm.errors.password} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={createForm.data.role}
                  onValueChange={(value) => createForm.setData('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role] ?? role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorFeedback message={createForm.errors.role} />
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={createForm.data.status}
                  onValueChange={(value) => createForm.setData('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status] ?? status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorFeedback message={createForm.errors.status} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={createForm.data.notes}
                onChange={(e) => createForm.setData('notes', e.target.value)}
                placeholder="Notes optionnelles pour les administrateurs"
              />
              <ErrorFeedback message={createForm.errors.notes} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createForm.processing}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitEdit}>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={editForm.data.name}
                onChange={(e) => editForm.setData('name', e.target.value)}
              />
              <ErrorFeedback message={editForm.errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.data.email}
                onChange={(e) => editForm.setData('email', e.target.value)}
              />
              <ErrorFeedback message={editForm.errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Numéro de téléphone</Label>
              <PhoneInput
                id="edit-phone"
                value={editForm.data.phone}
                onChange={(value) => editForm.setData('phone', value || '')}
                placeholder="Téléphone"
              />
              <ErrorFeedback message={editForm.errors.phone} />
              <p className="text-xs text-muted-foreground">Email ou téléphone requis.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.data.password}
                onChange={(e) => editForm.setData('password', e.target.value)}
              />
              <ErrorFeedback message={editForm.errors.password} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editForm.data.role}
                  onValueChange={(value) => editForm.setData('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role] ?? role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorFeedback message={editForm.errors.role} />
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={editForm.data.status}
                  onValueChange={(value) => editForm.setData('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status] ?? status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorFeedback message={editForm.errors.status} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.data.notes}
                onChange={(e) => editForm.setData('notes', e.target.value)}
                placeholder="Notes optionnelles pour les administrateurs"
              />
              <ErrorFeedback message={editForm.errors.notes} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={editForm.processing}>
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
