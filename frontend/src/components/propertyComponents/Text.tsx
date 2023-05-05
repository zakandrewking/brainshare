import { get as _get } from "lodash";
import TextField from "@mui/material/TextField";
import { UseFormRegister, FieldValues } from "react-hook-form";
import Typography from "@mui/material/Typography";

export default function Text({
  displayName,
  data,
  propertyKey,
  register,
  errors,
}: {
  displayName?: string;
  data: { [key: string]: any };
  propertyKey: string;
  register?: UseFormRegister<FieldValues>;
  errors?: any;
}) {
  const text = _get(data, [propertyKey], "").toString();
  if (register) {
    return (
      <>
        <TextField
          variant="outlined"
          defaultValue={text}
          fullWidth
          autoComplete="off"
          {...(displayName && { label: displayName })}
          {...register(propertyKey, { required: true })}
        />{" "}
        {_get(errors, [propertyKey, "type"]) === "required" && (
          <Typography color="warning.main">This field is required</Typography>
        )}
      </>
    );
  }
  return (
    <>
      {displayName && (
        <Typography gutterBottom variant="h6">
          {displayName}
        </Typography>
      )}
      <Typography sx={{ wordBreak: "break-all" }}>{text}</Typography>
    </>
  );
}
