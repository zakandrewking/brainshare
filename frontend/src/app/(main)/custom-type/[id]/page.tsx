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
import { H3, H4 } from "@/components/ui/typography";
import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Brainshare - Custom Type Details",
  description: "View details of a custom type",
};

type Json = Database["public"]["Tables"]["custom_type"]["Row"]["rules"];

export default async function CustomTypeDetail({
  params,
}: {
  params: { id: string };
}) {
  await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/log-in?redirect=/custom-types/" + params.id);
  }

  const { data: customType, error } = await supabase
    .from("custom_type")
    .select()
    .eq("id", parseInt(params.id))
    .eq("user_id", user.id)
    .single();

  if (error || !customType) {
    return notFound();
  }

  return (
    <Container gap={8}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbInternalLink href="/custom-types">
              Custom Types
            </BreadcrumbInternalLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customType.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Stack direction="col" alignItems="start">
        <H3>{customType.name}</H3>
        <p className="text-muted-foreground">{customType.description}</p>
      </Stack>

      <Stack direction="col" alignItems="start" className="gap-6">
        <div>
          <H4>Validation Rules</H4>
          <ul className="list-disc pl-6 mt-2">
            {(customType.rules as Json as string[])?.map((rule, index) => (
              <li key={index} className="text-muted-foreground">
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <H4>Valid Examples</H4>
          <ul className="list-disc pl-6 mt-2">
            {(customType.examples as Json as string[])?.map(
              (example, index) => (
                <li key={index} className="text-muted-foreground">
                  {example}
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <H4>Invalid Examples</H4>
          <ul className="list-disc pl-6 mt-2">
            {(customType.not_examples as Json as string[])?.map(
              (example, index) => (
                <li key={index} className="text-muted-foreground">
                  {example}
                </li>
              )
            )}
          </ul>
        </div>

        {customType.sample_values &&
          (customType.sample_values as Json as string[]).length > 0 && (
            <div>
              <H4>Sample Values</H4>
              <ul className="list-disc pl-6 mt-2">
                {(customType.sample_values as Json as string[]).map(
                  (value, index) => (
                    <li key={index} className="text-muted-foreground">
                      {value}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
      </Stack>
    </Container>
  );
}
