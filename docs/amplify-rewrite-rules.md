# Amplify Rewrite Rules for API Proxy

## Overview

The frontend (React SPA) on AWS Amplify needs to proxy `/api/*` requests to the backend ALB. This is configured manually in the Amplify Console.

## Configuration Steps

1. Go to **AWS Amplify Console** > Select the app **ai-co-scientist-app**
2. Navigate to **Hosting** > **Rewrites and redirects**
3. Click **Manage redirects** > **Add rewrite**
4. Add the following rule:

| Source address | Target address | Type |
|---|---|---|
| `/api/<*>` | `http://{ALB_DNS_NAME}/api/<*>` | 200 (Rewrite) |

Replace `{ALB_DNS_NAME}` with the actual ALB DNS name from the CDK output (e.g., `co-scientist-backend-alb-123456.eu-central-1.elb.amazonaws.com`).

## Example

```
Source:  /api/<*>
Target:  http://co-scientist-backend-alb-XXXXXXXX.eu-central-1.elb.amazonaws.com/api/<*>
Type:    200 (Rewrite)
```

## How It Works

- Frontend calls `/api/health` -> Amplify rewrites to `http://{ALB}/api/health`
- The rewrite is transparent to the browser (no redirect, no CORS issues)
- The ALB forwards to the EC2 backend on port 8000

## Important Notes

- The rewrite type must be **200 (Rewrite)**, NOT 301/302 (Redirect)
- The ALB must be accessible from Amplify (internet-facing ALB)
- After CDK deployment, get the ALB DNS from the stack output `CoScientistBackend.AlbDnsName`
- For HTTPS, add an ACM certificate to the ALB and update the target to `https://`

## SPA Routing

Also add a catch-all rewrite for React Router:

| Source address | Target address | Type |
|---|---|---|
| `</^[^.]+$\|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json\|webp)$)([^.]+$)/>` | `/index.html` | 200 (Rewrite) |

This ensures client-side routing works for all non-file paths.
