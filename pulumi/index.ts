import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket("my-bucket-5", {
  website: {
    indexDocument: "index.html", // Assuming 'index.html' is your default document
    errorDocument: "error.html", // Optional: Specify an error document
  },
});

// Setting the Public Access Block configuration to allow public access
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  "publicAccessBlock",
  {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  },
);

const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: bucket.id,
  policy: pulumi.all([bucket.arn]).apply(([bucketArn]) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: `${bucketArn}/*`,
      }],
    })
  ),
}, { dependsOn: publicAccessBlock });

const indexFile = new aws.s3.BucketObject("indexFile", {
  bucket: bucket.id,
  key: "index.html",
  source: new pulumi.asset.FileAsset("test_files/index.html"),
  contentType: "text/html",
});

const errorFile = new aws.s3.BucketObject("errorFile", {
  bucket: bucket.id,
  key: "error.html",
  source: new pulumi.asset.FileAsset("test_files/error.html"),
  contentType: "text/html",
});

// // Create a Route53 Hosted Zone
// const main = new aws.route53.Zone("brainshare-io", {
//   name: "brainshare.io",
// });

const usEast1Provider = new aws.Provider("default", {
  region: "us-east-1",
});

const certificate = new aws.acm.Certificate("certificate", {
  domainName: "*.brainshare.io",
  validationMethod: "DNS",
}, { provider: usEast1Provider });

const distribution = new aws.cloudfront.Distribution("bucket-distribution", {
  enabled: true,
  defaultRootObject: "index.html",
  origins: [{
    domainName: bucket.websiteEndpoint,
    originId: bucket.arn,
    customOriginConfig: {
      httpPort: 80,
      httpsPort: 443,
      originProtocolPolicy: "http-only",
      originSslProtocols: ["TLSv1", "TLSv1.1"],
    },
  }],
  defaultCacheBehavior: {
    targetOriginId: bucket.arn,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
  },
  restrictions: {
    geoRestriction: {
      restrictionType: "whitelist",
      locations: ["US"],
    },
  },
  viewerCertificate: {
    acmCertificateArn: certificate.arn,
    sslSupportMethod: "sni-only",
  },
  aliases: ["bucket.brainshare.io"],
});

// const record = new aws.route53.Record("bucket-record", {
//   zoneId: main.zoneId,
//   name: "bucket.brainshare.io",
//   type: "A",
//   aliases: [{
//     name: distribution.domainName,
//     zoneId: distribution.hostedZoneId,
//     evaluateTargetHealth: true,
//   }],
// });
