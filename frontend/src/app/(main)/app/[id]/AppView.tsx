"use client";

import { DefaultService } from "@/client";
import { TaskStatusButton } from "@/components/task-status";
import Container from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/link";
import { Stack } from "@/components/ui/stack";
import { H3, H4 } from "@/components/ui/typography";
import useApp from "@/swr/useApp";

export default function AppView({ id }: { id: string }) {
  const { app } = useApp(id);
  const launchUrl = `https://${app?.prefix ?? ""}.brainshare.io`;
  return (
    <Container>
      <Stack direction="col" alignItems="start">
        <H3>App: {app?.name}</H3>
        <TaskStatusButton
          taskLinkRefTable="app"
          taskLinkRefColumn="deploy_app_task_link_id"
          taskLinkRefId={id}
          taskType="deploy_app"
          handleCreateTask={async (cleanUpOnly) => {
            await DefaultService.postTaskDeployAppTaskDeployAppPost({
              id,
              clean_up_only: cleanUpOnly,
            });
          }}
        />
        <H4>Prefix: {app?.prefix}</H4>
        <ExternalLink
          href={launchUrl}
          className="text-xl"
          disabled={!app?.prefix}
        >
          Launch app
        </ExternalLink>
        {/* <Button onClick={() => DefaultService.deleteAppAppDelete({ id })}> */}
      </Stack>
    </Container>
  );
}
