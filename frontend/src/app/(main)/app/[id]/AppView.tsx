"use client";

import * as services from "@/client/services.gen";
import { TaskStatusButton } from "@/components/task-status";
import Container from "@/components/ui/container";
import { ExternalLink } from "@/components/ui/link";
import { List, ListItem } from "@/components/ui/list";
import { Stack } from "@/components/ui/stack";
import { H3, H4 } from "@/components/ui/typography";
import useApp from "@/swr/useApp";

import AppFileUploader from "./uploader";

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
            await services.postTaskDeployAppTaskDeployAppPost({
              requestBody: {
                id,
                clean_up_only: cleanUpOnly,
              },
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
        <H3>Database</H3>
        <List className="mb-4">
          {app?.app_file.map((app_file) => {
            const file = app_file.file;
            return <ListItem key={file?.id}>{file?.name}</ListItem>;
          })}
        </List>
        <AppFileUploader appId={id} />
      </Stack>
    </Container>
  );
}
