import { ReactNode, Fragment } from "react";
// TODO drop lodash
import { get as _get } from "lodash";

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
  table: string,
  source: string,
  sourceDetails: string,
  changeType: string,
  new_values: any,
  username: string | null,
  specialCapitalize: { [key: string]: string }
): ReactNode {
  if (changeType === "create" && username !== null) {
    return (
      <>
        <Typography component="span" sx={{ fontWeight: "bold" }}>
          {username}
        </Typography>
        {" created " + table + " "}
        <Typography component="span" sx={{ fontWeight: "bold" }}>
          {_get(new_values, ["name"], "")}
        </Typography>
      </>
    );
  } else if (changeType === "create") {
    return (
      capitalizeFirstLetter(table) +
      " was imported from " +
      _get(specialCapitalize, [source], capitalizeFirstLetter(source)) +
      " (" +
      sourceDetails +
      ")"
    );
  } else if (changeType === "update") {
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

export default function History({
  data,
  table,
  specialCapitalize,
}: {
  data: any;
  table: string;
  specialCapitalize: { [key: string]: string };
}) {
  const history = _get(data, [`${table}_history`], []);

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
          const timeUtc = _get(x, ["time"]);
          const localDate = timeUtc ? new Date(timeUtc + "Z") : null;
          return (
            // TODO key=
            <TimelineItem>
              <TimelineSeparator>
                {_get(x, ["change_type"]) === "update" ? (
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
                  table,
                  _get(x, ["source"], ""),
                  _get(x, ["source_details"], ""),
                  _get(x, ["change_type"], ""),
                  _get(x, ["new_values"], {}),
                  _get(x, ["profile", "username"], null),
                  specialCapitalize
                )}
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </>
  );
}
