// import { S3 } from "npm:@aws-sdk/client-s3";

// we need 2 buckets:
// 1. public, stores non-sensitive frontend that performs auth and downloads
//    from (2) and is available by a cname subdomain - so needs to be AWS
// 2. stores sensitive frontend that is not available by a cname subdomain - so
//    can be Supabase so we can use supabase+clerk auth
// This function is for the public bucket + DNS settings

Deno.serve(async (req) => {
  const { name } = await req.json();

  // const res = await new S3({}).listBuckets({});
  // res.Buckets?.forEach((bucket) => {
  //   console.log(bucket.Name);
  // });

  const data = {
    message: `Hello ${name}!`,
  };

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  );
});
