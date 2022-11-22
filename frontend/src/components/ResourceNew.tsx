import { Button, Container, Input, Typography } from "@mui/material";
import { get as _get } from "lodash";
import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState, Fragment } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import supabase, { useAuth, useDisplayConfig } from "../supabaseClient";
import { capitalizeFirstLetter } from "../util/stringUtils";

export default function ResourceNew({ table }: { table: string }) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<PostgrestError | null>();
  const displayConfig = useDisplayConfig();

  useEffect(() => {
    if (!session) {
      navigate(`/log-in?redirect=${location.pathname}`);
    }
  }, [session, navigate, location]);

  const detailProperties: string[] = _get(
    displayConfig,
    ["detailProperties", table],
    {}
  );
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit: SubmitHandler<any> = async (newData) => {
    const { data, error } = await supabase.from(table).insert(newData).select();
    setSubmitError(error);
    if (error) console.error(error);
    const id = _get(data, [0, "id"]);
    if (!id) console.error("Data missing");
    else navigate(`/${table}/${id}`);
  };

  return (
    <Container component="form" onSubmit={handleSubmit(onSubmit)}>
      {detailProperties.map((prop) => {
        const type = _get(propertyTypes, [prop, "type"]);
        // const valueLink = _get(propertyTypes, [prop, "value_link"]);
        return type === "svg" || type === "key_value" ? null : (
          <Fragment key={prop}>
            <Typography gutterBottom variant="h6">
              {capitalizeFirstLetter(prop)}
            </Typography>
            <Input fullWidth {...register(prop, { required: true })} />
            {_get(errors, [prop, "type"]) === "required" && (
              <Typography>This field is required</Typography>
            )}
          </Fragment>
        );
      })}
      <Button type="submit">Submit</Button>
      {submitError && <Typography>Something went wrong. Try again.</Typography>}
    </Container>
  );
}
