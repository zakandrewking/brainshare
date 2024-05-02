"use client";

import { TaskStatusButton } from "@/components/task-status";
import Container from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";
import useApp from "@/swr/useApp";

export default function AppView({ id }: { id: string }) {
  const { app } = useApp(id);
  const launchUrl = `https://${app?.deploy_subdomain ?? ""}.brainshare.io`;
  return (
    <Container>
      <Stack direction="col" alignItems="start">
        <H3>App: {app?.name}</H3>
        <TaskStatusButton
          taskLinkRefTable="app"
          taskLinkRefColumn="deploy_app_task_link_id"
          taskLinkRefId={id}
          taskType="deploy_app"
          handleCreateTask={async () => {}}
        />
        <ExternalLink href={launchUrl} className="text-xl">
          Launch app
        </ExternalLink>
      </Stack>
    </Container>
  );
}
