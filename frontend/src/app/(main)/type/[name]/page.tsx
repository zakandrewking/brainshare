import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbInternalLink,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Container from "@/components/ui/container";
import { Stack } from "@/components/ui/stack";
import { H3 } from "@/components/ui/typography";
import { getUser } from "@/utils/supabase/server";

import { CustomTypeValues } from "./CustomTypeValues";

export const metadata: Metadata = {
  title: "Brainshare - Custom Type Details",
  description: "View details of a custom type",
};

export default async function CustomTypeDetail({
  params,
}: {
  params: { name: string };
}) {
  const { name } = await params;
  const { user, supabase } = await getUser();

  if (!user) {
    redirect("/log-in?redirect=/custom-types/" + name);
  }

  const { data: customType, error } = await supabase
    .from("custom_type")
    .select()
    .eq("name", name)
    .eq("user_id", user.id)
    .single();

  if (!customType) {
    console.error("Custom type not found", error);
    return notFound();
  }

  return (
    <Container gap={8}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbInternalLink
              href={customType.public ? "/public-types" : "/my-types"}
            >
              {customType.public ? "Public Types" : "My Types"}
            </BreadcrumbInternalLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customType.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Stack direction="col" alignItems="start" gap={6}>
        <H3>{customType.name}</H3>
        <p className="text-muted-foreground">{customType.description}</p>
        <p className="text-muted-foreground">Kind: {customType.kind}</p>

        {(customType.kind === "decimal" || customType.kind === "integer") && (
          <div className="space-y-2">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-sm font-medium">Min Value:</span>{" "}
                <span className="text-muted-foreground">
                  {String(customType.min_value) === "-Infinity"
                    ? "-∞"
                    : customType.min_value}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Max Value:</span>{" "}
                <span className="text-muted-foreground">
                  {String(customType.max_value) === "Infinity"
                    ? "∞"
                    : customType.max_value}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Scale:</span>{" "}
                <span className="text-muted-foreground">
                  {customType.log_scale ? "Logarithmic" : "Linear"}
                </span>
              </div>
            </div>
          </div>
        )}

        {customType.kind === "enum" && <CustomTypeValues id={customType.id} />}
      </Stack>
    </Container>
  );
}
