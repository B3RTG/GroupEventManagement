import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
} from '../store/api/groupsApi';

const inputCls =
  'w-full bg-surface-container-low border-none rounded-lg p-4 ' +
  'focus:ring-2 focus:ring-secondary/20 transition-all font-semibold text-on-surface ' +
  'placeholder:text-on-surface-variant/50';

export function GroupFormPage() {
  const { groupId } = useParams<{ groupId?: string }>();
  const navigate    = useNavigate();
  const isEditing   = !!groupId;

  const { data: group, isLoading: loadingGroup } = useGetGroupQuery(groupId!, { skip: !isEditing });
  const [createGroup, { isLoading: creating, error: createError }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: updating, error: updateError }] = useUpdateGroupMutation();

  const [name, setName]         = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill in edit mode
  useEffect(() => {
    if (group) setName(group.name);
  }, [group]);

  // Redirect if not owner/co_admin in edit mode
  useEffect(() => {
    if (group && group.role === 'member') {
      navigate(`/groups/${groupId}`, { replace: true });
    }
  }, [group, groupId, navigate]);

  const isBusy     = creating || updating;
  const apiError   = (createError || updateError) as { data?: { message?: string } } | undefined;
  const apiMessage = apiError?.data?.message;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError('Group name is required.'); return; }
    if (name.trim().length > 255) { setFormError('Name must be 255 characters or fewer.'); return; }

    try {
      if (isEditing) {
        await updateGroup({ id: groupId!, name: name.trim() }).unwrap();
        navigate(`/groups/${groupId}`);
      } else {
        const created = await createGroup({ name: name.trim() }).unwrap();
        navigate(`/groups/${created.id}`);
      }
    } catch { /* errors surface via apiMessage */ }
  }

  // Loading skeleton (edit mode only)
  if (isEditing && loadingGroup) {
    return (
      <div className="max-w-2xl mx-auto px-8 pt-12 pb-20 animate-pulse space-y-6">
        <div className="h-4 w-40 bg-surface-container rounded" />
        <div className="h-12 w-1/2 bg-surface-container rounded" />
        <div className="h-48 bg-surface-container-lowest rounded-xl" />
      </div>
    );
  }

  return (
    <main className="pt-8 pb-20 px-4 md:px-8 max-w-2xl mx-auto">

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-secondary font-semibold text-xs tracking-widest uppercase">
            <span className="material-symbols-outlined text-sm">group</span>
            <span>{isEditing ? 'Edit Group' : 'New Group'}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary leading-tight font-headline">
            {isEditing ? 'Edit Group Settings' : 'Create a Group'}
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {isEditing
              ? 'Update your group name. Other settings are managed from the group page.'
              : 'Set a name for your group. You\'ll be the owner and can invite members with a code.'
            }
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to={isEditing ? `/groups/${groupId}` : '/groups'}
            className="px-6 py-3 rounded-xl bg-surface-container-highest text-primary font-bold transition-all hover:bg-surface-container-high active:scale-95"
          >
            Cancel
          </Link>
          <button
            form="group-form"
            type="submit"
            disabled={isBusy}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isBusy
              ? <span className="material-symbols-outlined text-base animate-spin">refresh</span>
              : <span className="material-symbols-outlined text-base">{isEditing ? 'save' : 'add'}</span>
            }
            {isBusy ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </header>

      {/* Error banner */}
      {(formError || apiMessage) && (
        <div className="mb-6 text-sm text-on-error-container font-semibold bg-error-container px-5 py-3 rounded-xl">
          {formError ?? apiMessage}
        </div>
      )}

      <form id="group-form" onSubmit={handleSubmit}>
        <section className="p-8 rounded-xl bg-surface-container-lowest shadow-soft space-y-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-3 font-headline">
            <span className="material-symbols-outlined text-secondary">info</span>
            Group Details
          </h2>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-2 ml-1">
              Group Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setFormError(null); }}
              placeholder="e.g. Padel Wednesdays"
              maxLength={255}
              className={inputCls}
              autoFocus
            />
            <p className="text-xs text-on-surface-variant mt-2 ml-1">
              {name.length}/255 characters
            </p>
          </div>

          {/* Info card — only in create mode */}
          {!isEditing && (
            <div className="bg-secondary-container/20 p-4 rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary flex-shrink-0 mt-0.5">info</span>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                After creating the group, you'll receive an invite code to share with members.
                You can also configure events and manage members from the group page.
              </p>
            </div>
          )}
        </section>

        {/* Danger zone — edit mode, owner only */}
        {isEditing && group?.role === 'owner' && (
          <section className="mt-8 p-6 rounded-xl border border-error/20 bg-error-container/5">
            <h3 className="text-base font-bold text-error mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              Danger Zone
            </h3>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-on-surface-variant">
                Deleting a group is permanent and cannot be undone.
              </p>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="flex-shrink-0 px-4 py-2 rounded-lg border border-error/30 text-error text-sm font-bold disabled:opacity-40 cursor-not-allowed"
              >
                Delete Group
              </button>
            </div>
          </section>
        )}
      </form>
    </main>
  );
}
