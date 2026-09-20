import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.redirect(
        "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
    );
}