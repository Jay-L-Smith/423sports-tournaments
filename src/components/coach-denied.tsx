import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CoachAccessPrompt } from "@/components/coach-access-prompt";
import { Button } from "@/components/ui/button";
import { resubmitCoachAccess, type Profile } from "@/lib/pbi/api";
import { PBI_STAFF_CONTACT, resubmitTriesCopy } from "@/lib/pbi/coach-request";

export function CoachDeniedCard({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: (input: { teamName: string; reason: string }) =>
      resubmitCoachAccess({ data: input }),
    onSuccess: (next) => {
      queryClient.setQueryData(["profile", profile.userId], next);
      void queryClient.invalidateQueries({ queryKey: ["notifications", profile.userId] });
      void queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      setAsking(false);
    },
  });

  if (profile.coachAccessLocked) {
    return (
      <div className="rounded-md bg-warn-bg px-4 py-3 text-fg">
        <p className="font-display text-xl font-bold uppercase">Coach access denied</p>
        <p className="mt-1 text-sm font-medium">
          You still have Parent tools. {PBI_STAFF_CONTACT}
        </p>
      </div>
    );
  }

  if (!profile.canResubmitCoach) {
    return (
      <div className="rounded-md bg-warn-bg px-4 py-3 text-sm font-medium text-fg">
        Coach access was denied. You still have Parent tools.
      </div>
    );
  }

  if (asking) {
    return (
      <div className="rounded-lg border border-line bg-surface p-4">
        <CoachAccessPrompt
          teamName={teamName}
          reason={reason}
          busy={mut.isPending}
          title="Request again"
          subtitle="If this was denied by mistake, tell us the team and why. An Admin will review it again."
          submitLabel="Submit request"
          onTeamName={setTeamName}
          onReason={setReason}
          onContinue={(access) => mut.mutate(access)}
          onBack={() => {
            if (mut.isPending) return;
            setAsking(false);
          }}
        />
        {mut.error ? (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm" role="alert">
            {mut.error instanceof Error ? mut.error.message : "Could not send that request."}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md bg-warn-bg px-4 py-3 text-fg">
      <div>
        <p className="font-display text-xl font-bold uppercase">Coach access denied</p>
        <p className="mt-1 text-sm font-medium">
          If this was a mistake, {resubmitTriesCopy(profile.resubmitsLeft).replace(/^Y/, "y")} You
          still have Parent tools.
        </p>
      </div>
      <Button type="button" variant="pine" className="w-full" onClick={() => setAsking(true)}>
        Request Coach access again
      </Button>
    </div>
  );
}
