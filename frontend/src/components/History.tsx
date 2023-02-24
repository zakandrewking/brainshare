import { get as _get } from "lodash";

import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import Typography from "@mui/material/Typography";

import Timeline from "@mui/lab/Timeline";
// import TimelineConnector from "@mui/lab/TimelineConnector";
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
  specialCapitalize: { [key: string]: string }
): string {
  if (changeType === "create") {
    return (
      capitalizeFirstLetter(table) +
      " was imported from " +
      _get(specialCapitalize, [source], capitalizeFirstLetter(source)) +
      " (" +
      sourceDetails +
      ")"
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
        {_get(data, [`${table}_history`], []).map((x: any) => {
          const timeUtc = _get(x, ["time"]);
          const localDate = timeUtc ? new Date(timeUtc + "Z") : null;
          return (
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success" sx={{ boxShadow: 0 }}>
                  <FileUploadRoundedIcon />
                </TimelineDot>
                {/* <TimelineConnector /> */}
              </TimelineSeparator>
              <TimelineContent>
                <Typography sx={{ opacity: 0.8 }}>
                  {localDate?.toLocaleString()}
                </Typography>
                <Typography>
                  {getChangeText(
                    table,
                    _get(x, ["source"], ""),
                    _get(x, ["source_details"], ""),
                    _get(x, ["change_type"], ""),
                    specialCapitalize
                  )}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </>
  );
}
