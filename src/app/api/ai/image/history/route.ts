import { NextResponse } from 'next/server';
import { validateAiRequest } from '../../../../../middleware/aiAuth';
import { DatabaseService } from '../../../../../services/database';

export async function GET(req: Request) {
  try {
    const auth = await validateAiRequest(req, 0);
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const workspace = url.searchParams.get('workspace') || undefined;

    const history = await DatabaseService.getImageHistory(auth.userId, workspace);

    return NextResponse.json({
      success: true,
      user: auth.userId,
      workspace: workspace || 'ws-default',
      count: history.length,
      history
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch image history'
      },
      { status: 500 }
    );
  }
}
