import { NextResponse } from 'next/server';
import { validateAiRequest } from '../../../../middleware/aiAuth';
import { ChatHistoryService } from '../../../../services/chatHistoryService';

export async function GET(req: Request) {
  try {
    const auth = await validateAiRequest(req, 0);
    if (!auth.authorized) return auth.response;

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const category = url.searchParams.get('category') || undefined;

    const prompts = ChatHistoryService.getPromptLibrary(search, category);

    return NextResponse.json({
      success: true,
      prompts
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
