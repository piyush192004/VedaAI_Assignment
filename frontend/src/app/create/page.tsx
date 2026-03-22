import AppShell from '@/components/AppShell';
import CreateAssignmentForm from '@/components/CreateAssignmentForm';

export default function CreatePage() {
  return (
    <AppShell title="Create Assignment" showBack backHref="/assignments">
      <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 max-w-3xl">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h1 className="text-base md:text-lg font-bold text-gray-900">Create Assignment</h1>
        </div>
        <p className="text-xs md:text-sm text-gray-500 pl-4">Set up a new assignment for your students</p>
        <div className="h-1 bg-gray-200 rounded-full mt-3">
          <div className="h-1 bg-gray-900 rounded-full w-1/2" />
        </div>
      </div>
      <CreateAssignmentForm />
    </AppShell>
  );
}
