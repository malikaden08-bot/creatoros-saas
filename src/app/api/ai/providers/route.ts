import { NextResponse } from 'next/server';
import { AI_CONFIG } from '../../../../config/ai.config';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    defaultProvider: AI_CONFIG.chatFailoverChain[0],
    fallbackProvider: AI_CONFIG.chatFailoverChain[1],
    chatFailoverChain: AI_CONFIG.chatFailoverChain,
    imageFailoverChain: AI_CONFIG.imageFailoverChain,
    textProviders: [
      { id: 'groq',     name: 'Groq LLaMA 3.3 70B',           status: 'configured', bestFor: ['Ultra-Fast Chat', 'Reasoning', 'Coding'] },
      { id: 'openai',   name: 'OpenAI GPT-4o',                 status: 'configured', bestFor: ['General Reasoning', 'Coding', 'Multi-turn Chat'] },
      { id: 'gemini',   name: 'Google Gemini 1.5 Pro',         status: 'configured', bestFor: ['Large Context', 'Video Analysis', 'Multimodal'] },
      { id: 'claude',   name: 'Anthropic Claude 3.5 Sonnet',   status: 'configured', bestFor: ['Creative Writing', 'Complex Reasoning', 'Code'] },
      { id: 'deepseek', name: 'DeepSeek R1 (Reasoning)',       status: 'configured', bestFor: ['Deep Reasoning', 'Math', 'Research'] }
    ],
    imageProviders: [
      { id: 'openai',    name: 'OpenAI DALL-E 3',          status: 'configured', bestFor: ['Photo-realistic', 'Product shots'] },
      { id: 'fal',       name: 'Fal.ai Flux Realism',      status: 'configured', bestFor: ['Hyper-realistic', 'Portraits'] },
      { id: 'replicate', name: 'Replicate Flux Schnell',   status: 'configured', bestFor: ['Fast generation', 'Iterations'] }
    ],
    voiceProviders: [
      { id: 'elevenlabs', name: 'ElevenLabs Multilingual v2', status: 'configured', bestFor: ['Natural TTS', 'Voice cloning'] }
    ],
    transcriptionProviders: [
      { id: 'deepgram', name: 'Deepgram Nova-2',  status: 'configured', bestFor: ['Real-time STT', 'Subtitles'] },
      { id: 'openai',   name: 'OpenAI Whisper-1', status: 'configured', bestFor: ['Fallback STT'] }
    ],
    storageProviders: [
      { id: 'cloudinary', name: 'Cloudinary CDN', status: 'configured', bestFor: ['Image/Audio CDN', 'Transformations'] }
    ]
  });
}
