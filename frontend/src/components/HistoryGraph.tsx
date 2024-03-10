import { ReactNode, Fragment } from "react";

import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Typography from "@mui/material/Typography";

import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";

import { capitalizeFirstLetter } from "../util/stringUtils";

function getChangeText(
  node_type_id: string,
  source: string,
  source_details: string,
  change_type: string,
  new_values: any,
  username: string | null
): ReactNode {
  if (change_type === "create" && username !== null) {
    return (
      <>
        <Typography component="span" sx={{ fontWeight: "bold" }}>
          {username}
        </Typography>
        {" created " + node_type_id + " "}
        <Typography component="span" sx={{ fontWeight: "bold" }}>
          {new_values?.name ?? ""}
        </Typography>
      </>
    );
  } else if (change_type === "create") {
    return (
      capitalizeFirstLetter(node_type_id) +
      " was imported from " +
      capitalizeFirstLetter(source) +
      " (" +
      source_details +
      ")"
    );
  } else if (change_type === "update") {
    return (
      <>
        <Typography component="span" sx={{ fontWeight: "bold" }}>
          {username}
        </Typography>
        {" changed "}
        {(Object.keys(new_values) as any)
          .map((k: any) => (
            <Fragment key={k}>
              <Typography component="span" sx={{ fontWeight: "bold" }}>
                {k}
              </Typography>
              {" to "}{" "}
              <Typography component="span" sx={{ fontWeight: "bold" }}>
                {new_values[k]}
              </Typography>
            </Fragment>
          ))
          .reduce(
            (prev: any, curr: any) =>
              prev.length === 0 ? [curr] : [prev, ", ", curr],
            []
          )}
      </>
    );
  }
  return "";
}

/**
 * Will replace the History component
 */
export default function HistoryGraph({ node }: { node: any }) {
  const history = node?.node_history || [];

  return (
    <>
      <Typography gutterBottom variant="h6">
        History
      </Typography>
      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {history.map((x: any, i: number) => {
          const timeUtc = x?.time;
          const localDate = timeUtc ? new Date(timeUtc + "Z") : null;
          return (
            <TimelineItem key={i}>
              <TimelineSeparator>
                {x?.change_type === "update" ? (
                  <TimelineDot color="info" sx={{ boxShadow: 0 }}>
                    <EditRoundedIcon />
                  </TimelineDot>
                ) : (
                  <TimelineDot color="success" sx={{ boxShadow: 0 }}>
                    <FileUploadRoundedIcon />
                  </TimelineDot>
                )}
                {i < history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography sx={{ opacity: 0.8 }}>
                  {localDate?.toLocaleString()}
                </Typography>
                {getChangeText(
                  node?.node_type_id ?? "",
                  x?.source ?? "",
                  x?.source_details ?? "",
                  x?.change_type ?? "",
                  x?.new_values ?? {},
                  x?.username ?? null
                )}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </>
  );
}
