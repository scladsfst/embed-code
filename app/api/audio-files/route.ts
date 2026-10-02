import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export async function GET() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN_NEW,
  });

  try {
    const response = await octokit.repos.getContent({
      owner: 'scladsfst',
      repo: '1on1-audio',
      path: 'embeded',
    });

    if (Array.isArray(response.data)) {
      const files = response.data.map((file: any) => ({
        name: file.name,
        download_url: file.download_url,
      }));

      return NextResponse.json({ files });
    } else {
      throw new Error('Unexpected response data format');
    }
  } catch (error) {
    console.error('Error fetching audio files:', error);
    return NextResponse.json(
      { message: 'No audio available' },
      { status: 500 }
    );
  }
}
