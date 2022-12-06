import { get as _get } from "lodash";
import { PostgrestError } from "@supabase/supabase-js";
import { useEffect, useState, Fragment } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Input from "@mui/material/Input";
import Typography from "@mui/material/Typography";

import supabase, { useAuth, useDisplayConfig } from "../supabaseClient";
import { capitalizeFirstLetter } from "../util/stringUtils";

/**
 * Edit a resource. If `id` is not provided, create a new object.
 */
export default function ResourceEdit({
  table,
  id,
}: {
  table: string;
  id?: number;
}) {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<PostgrestError | null>();
  const displayConfig = useDisplayConfig();

  // should be logged in
  useEffect(() => {
    if (!session) {
      navigate(`/log-in?redirect=${location.pathname}`);
    }
  }, [session, navigate, location]);

  // display config
  const detailProperties: string[] = _get(
    displayConfig,
    ["detailProperties", table],
    {}
  );
  const propertyTypes = _get(displayConfig, ["propertyTypes"], {});

  // on submit
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit: SubmitHandler<any> = async (newData) => {
    if (id) {
      // const { error } = await supabase
      //   .from(table)
      //   .update()
      //   .filter("id", "eq", id);
    } else {
      const { data, error } = await supabase
        .from(table)
        .insert(newData)
        .select();
      const id = _get(data, [0, "id"]);
      setSubmitError(error);
      if (error) console.error(error);
      if (!id) console.error("Data missing");
      else {
        // TODO mutate swr for /${table}/{id}
        navigate(`/${table}/${id}`);
      }
    }
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
