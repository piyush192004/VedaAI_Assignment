import AppShell from "@/components/AppShell";
export default function Page() {
  return (
    <AppShell title="Library">
      <div className="flex items-center justify-center min-h-full py-24 text-center">
        <div>
          <p className="text-4xl mb-4">🚧</p>
          <h2 className="text-base font-bold text-gray-700 mb-1 capitalize">
            library coming soon
          </h2>
          <p className="text-sm text-gray-400">
            This section is under construction.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
