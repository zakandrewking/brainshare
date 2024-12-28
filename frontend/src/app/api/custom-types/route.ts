import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const { name, description, rules, examples, not_examples, sample_values } =
      json;

    // Insert the custom type
    const { data, error } = await supabase
      .from("custom_type")
      .insert({
        name,
        description,
        rules,
        examples,
        not_examples,
        sample_values,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating custom type:", error);
      if (error.code === "23505") {
        // Unique violation
        return new NextResponse("A custom type with this name already exists", {
          status: 409,
        });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in custom-types POST:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
