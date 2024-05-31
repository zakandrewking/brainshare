"use client";

import { ST } from "next/dist/shared/lib/utils";

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
      <Stack direction="col" alignItems="start" gap={8}>
        <H3>App: {app?.name}</H3>
        <Stack direction="col" alignItems="start" gap={0}>
          <Stack direction="row" gap={0} alignItems="start" wrap>
            <H3 className="mr-4">Prefix: {app?.prefix ?? "<none>"}</H3>
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
              neverDeployed={app?.prefix === null}
            />
          </Stack>
          <ExternalLink
            href={launchUrl}
            className="text-xl mt-4"
            disabled={!app?.prefix}
          >
            Launch app
          </ExternalLink>
        </Stack>
        {/* <Button onClick={() => DefaultService.deleteAppAppDelete({ id })}> */}
        <Stack direction="col" alignItems="start">
          <H3>Database Files</H3>
          <List className="mb-4">
            {app?.app_db_file.map((app_db_file, index) => {
              const file = app_db_file.file;
              if (!file) return <></>;
              return (
                <ListItem key={file?.id}>
                  {file?.name}
                  {index === 0 && " (Latest)"}
                  {file.id == app.deployed_db_file_id && " [Deployed]"}
                </ListItem>
              );
            })}
          </List>
          <AppFileUploader appId={id} />
        </Stack>
      </Stack>
    </Container>
  );
}
