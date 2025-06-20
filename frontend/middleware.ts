    import { NextResponse } from 'next/server';
    import type { NextRequest } from 'next/server';

    export function middleware(req: NextRequest) {
    const ignoredPaths = [
        '/.well-known/appspecific/com.chrome.devtools.json',
        '/_next/static/runtime.ts',
        '/_next/internal/helpers.ts',
    ];

    if (ignoredPaths.includes(req.nextUrl.pathname)) {
        // ส่งกลับเป็น 204 No Content หรือเปลี่ยนเป็น static redirect ได้
        return new NextResponse(null, { status: 204 });
    }

    return NextResponse.next();
    }
