import { NextResponse } from "next/server";

export async function GET() {
  const rules = {
    rules: [
      {
        pathPattern: "/api/pay/**",
        apiPath: "/api/pay/**",
      },
      {
        pathPattern: "/pay/**",
        apiPath: "/api/pay/**",
      },
      {
        pathPattern: "/to/**",
        apiPath: "/api/pay/**",
      },
    ],
  };

  return NextResponse.json(rules, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}