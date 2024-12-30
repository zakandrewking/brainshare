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
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Brainshare - Custom Type Details",
  description: "View details of a custom type",
};

export default async function CustomTypeDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id: idString } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/log-in?redirect=/custom-types/" + idString);
  }

  const { data: customType, error } = await supabase
    .from("custom_type")
    .select()
    .eq("id", parseInt(idString))
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
    </Container>
  );
}
